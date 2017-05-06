var exec = require('child_process').exec;

// Promise exit

require('./lib/db')(function(models) {
  models.link.find({
    parsing: false,
    parseDt: null
  }, function(err, links) {
    for (var i = 0; i < links.length; i++) {
      (function() {
        var link = links[i];
        // total: parsing: parsed: parsedPerMinute:
        console.log('Running ' + links[i].url);
        models.link.update({ _id: link._id }, { $set: {
          parsing: true
        }}, function() {
          exec('casperjs parseOne.js ' + link.url, function(error, stdout, stderr) {
            models.link.update({ _id: link._id }, { $set: {
              parsing: false,
              parseDt: new Date()
            }}, function() {
              console.log('Link ' + link.url + ' parsed');
            });
          });
          // run parseOne
        });
      })(i);
    }
  }).limit(5) // max process
});


//

// model.url.create({ url: 'small' }, function (err, url) {
//   if (err) return handleError(err);
//   console.log(url);
// });
