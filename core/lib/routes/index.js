module.exports = [{
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    request.models.one.find().exec(function(err, r) {
      if (err) console.error(err);
      let table = '<table border="1"><tr><th>Phone</th><th>Last Call Time</th><th>Result</th></tr>';
      for (let v of r) {
        table += '<tr><td>'+v.phone+'</td><td>'+v.lastCallDt+'</td><td>'+v.accepted+'</td></tr>'
      }
      table += '</table>';
      reply(table);
    });
  }
}];

