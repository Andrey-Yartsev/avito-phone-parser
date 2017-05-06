const exec = require('child_process').exec;

const menu = `
<p>
<a href="/">Все</a> |
<a href="/items-parsing">Парсятся</a> |
<a href="/items-with-phone">С телефоном</a> |
<a href="/create-item">Добавить телефон</a> |
</p>
`;

const table = function(r, call) {
  let html = `
<script>
setTimeout("location.reload(true);", 5000);
</script>
      `;
  html += `
<table border="1">
<tr>
  <th>ID</th>
  <th>Ссылка</th>
  <th>Телефон</th>
  <th>Последний звонок</th>
  <th>Результат звонка</th>
  <th></th>
</tr>
`;
  for (let v of r) {
    let callLink = '<td></td>';
    if (call) callLink = `<td><a href="/call/${v.id}">Позвонить</a></td>`;
    html += `<tr>
<td>${v.id}</td>
<td><a href="https://avito.ru/${v.url}" target="_blank">Ссылка</a></td>
<td>${v.phone}</td>
<td>${v.lastCallDt}</td>
<td>${v.accepted}</td>
${callLink}
</tr>`;
  }
  html += '</table>';
  return html;
};

const createForm = function() {
  return `
<h2>Добавить телефон</h2>
<form method="POST" action="/create-item">
<p>
  <input name="phone" />
</p>
<p>
  <input type="submit" value="Создать" />
</p>
</form>
`;
};

var renderItems = function(request, reply, filter, extra, call) {
  if (!extra) extra = '';
  request.models.one.find(filter).exec(function(err, r) {
    reply(menu + extra + table(r, call));
  });
};

module.exports = [{
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    renderItems(request, reply, {});
  }
}, {
  method: 'GET',
  path: '/items-with-phone',
  handler: function(request, reply) {
    renderItems(request, reply, {
      phone: {$ne: null}
    });
  }
}, {
  method: 'GET',
  path: '/items-parsing',
  handler: function(request, reply) {
    renderItems(request, reply, {
      parsing: true
    }, '<p><a href="/reset-parsing">Сбросить</a></p>');
  }
}, {
  method: 'GET',
  path: '/reset-parsing',
  handler: function(request, reply) {
    request.models.one.updateMany({
      parsing: true
    }, {
      $set: {parsing: false}
    }).exec(function() {
      reply.redirect('/items-parsing');
    });
  }
}, {
  method: 'GET',
  path: '/create-item',
  handler: function(request, reply) {
    renderItems(request, reply, {
      test: true
    }, createForm(), true);
  }
}, {
  method: 'POST',
  path: '/create-item',
  handler: function(request, reply) {
    request.models.one.create({
      id: 'test-' + request.payload.phone,
      phone: request.payload.phone,
      test: true
    }, function() {
      reply.redirect('/create-item');
    });
  }
}, {
  method: 'GET',
  path: '/call/{id}',
  handler: function(request, reply) {
    request.models.one.findOne({
      id: request.params.id
    }).exec(function(err, r) {
      //reply();
      exec('sudo php /usr/src/avito/asterisk/call.php ' + r.id + ' ' + r.phone, function(err, err2, output) {
        console.log(err, err2, output);
        reply('calling');
      });
    });
  }
}];

