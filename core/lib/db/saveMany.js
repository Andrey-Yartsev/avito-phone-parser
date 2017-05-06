module.exports = function(model, docs, callback) {
  var total = docs.length, result = [];
  var saveAll = function(model, docs, callback) {
    var doc = docs.pop();
    model.create(doc, function(err, saved) {
      if (err) throw err; // handle error
      result.push(saved[0]);
      if (--total) {
        saveAll(model, docs, callback);
      } else {
        callback();
      }
    });
  };
  saveAll(model, docs, callback);
};


