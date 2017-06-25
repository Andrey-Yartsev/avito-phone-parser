const request = require("request");
const cheerio = require('cheerio');
const saveMany = require('./lib/db/saveMany');
const log = require('./lib/log');

const base = 'https://www.avito.ru/';
const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

const settings = JSON.parse(require('fs').readFileSync('data/settings.json'));

const parsePage = (link, pageN, onLinksExists, onError, onEnd) => {
  let links = [];
  const sep = link.match(/\?/) ? '&' : '?';
  const uri = base + link + sep + 'p=' + pageN;
  log.info('Requesting ' + uri);
  request({
    uri,
  }, function (error, response, body) {
    log.info('Response code ' + response.statusCode);
    if (response.statusCode !== 200) {
      log.info('Parsing complete at ' + (pageN - 1) + ' page');
      onEnd();
      return;
    }
    if (body.match(/IP временно ограничен/)) {
      onError('Avito ban detected');
      return;
    }
    const $ = cheerio.load(body);
    const linkElements = $('body').find('.catalog-list .item-description-title-link');
    for (let i = 0; i < linkElements.length; i++) {
      if (settings.linksParseLimit) {
        let linksParseLimit = parseInt(settings.linksParseLimit);
        if (i === linksParseLimit) {
          log.info('Parsing complete on limit ' + linksParseLimit);
          onLinksExists(links, pageN, () => {
            onEnd();
          });
          return;
        }
      }
      links.push(linkElements[i].attribs.href);
    }
    log.info('Parsed ' + pageN + ' page. Links count: ' + links.length);
    onLinksExists(links, pageN, () => {
      setTimeout(() => {
        parsePage(link, pageN + 1, onLinksExists, onError, onEnd);
      }, Math.round(Math.random() * 10000) + 2000);
    });
  });
};

if (!process.argv[2]) {
  log.warn('Syntax: node parseLinks.js {sourceHash}');
}

const buildItems = (links) => {
  let items = [];
  for (let link of links) {
    items.push({
      sourceHash: hash,
      url: link
    });
  }
  return items;
};

const hash = process.argv[2];

require('./lib/db')(function (models) {
  models.source.findOne({hash}).exec((err, source) => {
    if (!source) {
      throw new Error(`Source ${hash} not found`);
    }
    const parseProcess = require('./lib/parseLinks/process')(hash);
    parseProcess.init();

    models.item.find({sourceHash: hash}).remove().exec((err, r) => {
      let linksPage = source.lastLinksPage === 0 ? 1 : source.lastLinksPage + 1;
      const onLinksExists = (links, pageN, callback) => {
        models.source.updateOne({hash}, {$set: {lastLinksPage: pageN}}).exec(() => {
          saveMany(models.item, buildItems(links), () => {
            log.info(`Links saved for ${hash} source (page: ${pageN})`);
            wsConnection.emit('changed', 'source');
            callback();
          });
        });
      };
      const onError = (error) => {
        log.warn(error);
        process.exit(1);
      };
      const onEnd = () => {
        models.source.updateOne({hash}, {$set: {
          updating: false,
          lastLinksPage: 0
        }}).exec(() => {
          parseProcess.stop();
          wsConnection.emit('changed', 'source');
          log.info(`Successfully ended on page ${linksPage}`);
          process.exit(0);
        });
      };
      models.source.updateOne({hash}, {$set: {updating: true}}).exec(() => {
        wsConnection.emit('changed', 'source');
        models.item.remove({
          sourceHash: hash
        }).exec(() => {
          parsePage(source.link, linksPage, onLinksExists, onError, onEnd);
        });
      });
    });
  });
});
