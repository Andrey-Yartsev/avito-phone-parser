if (!process.argv[2]) throw new Error('Syntax: node removeDub.js {sourceHash}');

const findDup = function (items, phone) {
  let r = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].phone === phone) {
      r.push(items[i]._id);
    }
  }
  return r;
};

require('./lib/db')(function (models) {
  models.item.find({
    sourceHash: process.argv[2],
    phone: {$ne: undefined}
  }).exec(function (err, items) {
    let removeIds = [];
    for (let item of items) {
      if (removeIds.indexOf(item._id) > 0) {
        console.log(item._id + ' already in removeIds');
        continue;
      }
      let dupIds = findDup(items, item.phone);
      if (dupIds.length > 1) {
        Array.prototype.push.apply(removeIds, dupIds.slice(1, dupIds.length));
        console.log('add ' + dupIds.slice(1, dupIds.length).join(', '));
      }
    }
    models.item.remove({_id: {$in: removeIds}}, function(err, r) {
      console.log('Removed ' + removeIds.length);
      process.exit(0);
    });
  });
});