if (!process.env.ID) throw new Error('process.env.ID is required');
if (!process.env.URI) throw new Error('process.env.URI is required');

const webdriverio = require('./build');
const fs = require('fs');

const client = webdriverio.remote({
  desiredCapabilities: {browserName: 'firefox'},
  logLevel: 'none'
}).init();

const writeImage = (base64Data) => {
  const id = process.env.ID;
  const folder = '/usr/src/collector/core';
  base64Data = base64Data.replace(/^data:image\/png;base64,/, '');
  let data = JSON.stringify({image: base64Data});
  fs.writeFileSync(folder + '/data/item/' + id, data);
  console.log('Phone parsed successfully');
};

const parseItem = () => {
  const tooltipClassName = 'seller-info-avatar-tooltip';
  return new Promise(function (resolve, reject) {
    client
      .url('https://www.avito.ru/' + process.env.URI)
      .execute(function(tooltipClassName) {
        var elements = document.getElementsByClassName(tooltipClassName);
        if (elements.length) {
          elements[0].style.display = 'none';
        }
      }, tooltipClassName);
       client.isExisting('.item-phone-number button').then((existing) => {
         if (existing) {
          client.click('.item-phone-number button')
            .pause(1000)
            .getAttribute('.item-phone-number img', 'src').then(writeImage)
            .end()
            .catch((e) => console.log(e))
         } else {
           console.log("Phone not found");
         }
      })
  })
};

parseItem().then(function (title) {
  console.log(title)
});
