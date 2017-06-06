const request = require("request");
const cheerio = require('cheerio');
//const hashCode = require('./lib/hashCode');
const saveMany = require('./lib/db/saveMany');

//let pageN = 0;
let allLinks = [];
const base = 'https://www.avito.ru/';
const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

const parse = (link, pageN, onComplete) => {
  const sep = link.match(/\?/) ? '&' : '?';
  const uri = base + link + sep + 'p=' + pageN;
  console.log('Requesting ' + uri);
  request({
    uri,
  }, function (error, response, body) {
    console.log('Response');
    if (response.statusCode !== 200) {
      console.log('Parsing complete at ' + (pageN - 1) + ' page');
      onComplete();
      return;
    }
    const $ = cheerio.load(body);
    const links = $('body').find('.catalog-list .item-description-title-link');
    for (let i = 0; i < links.length; i++) {
      allLinks.push(links[i].attribs.href);
    }
    console.log('Parsed ' + pageN + ' page. Links count: ' + allLinks.length);
    parse(link, pageN + 1, onComplete);
  });
};

if (!process.argv[2]) {
  console.log('Syntax: node parseLinks.js avito/items/link');
}

const hash = process.argv[2];
require('./lib/db')(function (models) {
  models.source.findOne({hash}).exec((err, source) => {
    if (!source) {
      throw new Error(`Source ${hash} not found`);
    }
    models.source.updateOne({hash}, {$set: {updating: true}}).exec((err, r) => {
      wsConnection.emit('changed', 'source');
      parse(source.link, 0, () => {
        let items = [];
        for (let link of allLinks) {
          items.push({
            sourceHash: hash,
            url: link
          });
        }
        models.item.remove({
          sourceHash: hash
        }).exec(() => {
          saveMany(models.item, items, () => {
            models.source.updateOne({hash}, {$set: {updating: false}}).exec((err, r) => {
              console.log('Links saved for ' + hash + ' source');
              wsConnection.emit('changed', 'source');
              process.exit(0);
            });
          });
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