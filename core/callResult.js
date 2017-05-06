var id = process.argv[2];
var accepted = parseInt(process.argv[3]) ? true : false;

require('./lib/db')(function(models) {
  models.one.update({id: id}, {
    $set: {
      lastCallDt: new Date,
      result: new Date(),
      accepted: accepted
    }
  }, function() {
    console.log('Updated status for ID=' + id + ' to ' + accepted);
    process.exit(0);
  });
});