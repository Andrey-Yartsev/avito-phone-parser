const request = require("request");
const cheerio = require('cheerio');
//const hashCode = require('./lib/hashCode');
const saveMany = require('./lib/db/saveMany');

const base = 'https://www.avito.ru/';
const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

const parsePage = (link, pageN, onLinksExists, onError, onEnd) => {
  let links = [];
  const sep = link.match(/\?/) ? '&' : '?';
  const uri = base + link + sep + 'p=' + pageN;
  console.log('Requesting ' + uri);
  request({
    uri,
  }, function (error, response, body) {
    console.log('Response code ' + response.statusCode);
    if (response.statusCode !== 200) {
      console.log('Parsing complete at ' + (pageN - 1) + ' page');
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
      links.push(linkElements[i].attribs.href);
    }
    console.log('Parsed ' + pageN + ' page. Links count: ' + links.length);
    onLinksExists(links, pageN, () => {
      setTimeout(() => {
        parsePage(link, pageN + 1, onLinksExists, onError, onEnd);
      }, Math.round(Math.random() * 10000) + 2000);
    });
  });
};


if (!process.argv[2]) {
  console.log('Syntax: node parseLinks.js avito/items/link');
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
    models.item.find({sourceHash: hash}).remove().exec((err, r) => {
      let linksPage = source.lastLinksPage === 0 ? 1 : source.lastLinksPage + 1;
      const onLinksExists = (links, pageN, callback) => {
        models.source.updateOne({hash}, {$set: {lastLinksPage: pageN}}).exec(() => {
          saveMany(models.item, buildItems(links), () => {
            console.log(`Links saved for ${hash} source (page: ${pageN})`);
            wsConnection.emit('changed', 'source');
            callback();
          });
        });
      };
      const onError = (error) => {
        console.error(error);
        process.exit(1);
      };
      const onEnd = () => {
        models.source.updateOne({hash}, {$set: {
          updating: false,
          lastLinksPage: 0
        }}).exec(() => {
          wsConnection.emit('changed', 'source');
          console.log(`Successfully ended on page ${linksPage}`);
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
//
//
// // const parseNext = () => {
// //     pageN++;
// // };