const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

const menu = `
<html>
<head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.slim.js"></script>
<script
  src="https://code.jquery.com/jquery-3.2.1.min.js"
  integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
  crossorigin="anonymous"></script>
</head>
<body>

<script>
	var socket = io.connect('http://localhost:3050');
	socket.on('changed', function () {
		console.log('changed');
    $('#table').load(window.location.pathname + ' #table table', function() {});		
	});
</script>

<p>
<a href="/">Все</a> |
<a href="/items-parsing">Парсятся</a> |
<a href="/items-with-phone">С телефоном</a> |
<a href="/create-item">Добавить телефон</a> |
<a href="/links">Выдачи</a> |
</p>

`;

const table = function(r, call) {
  let html = `
      `;
  html += `
<div id="table">
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
    exec('pm2 status run', function(error, output) {
      renderItems(request, reply, {
        parsing: true
      }, `<p>
<a href="/reset-parsing">Сбросить</a>
<a href="/start-parsing">Запустить</a>
<a href="/stop-parsing">Остановить</a>
</p><pre>` + output + `</pre>`);

    });
  }
}, {
  method: 'GET',
  path: '/reset-parsing',
  handler: function(request, reply) {
    request.models.one.updateMany({
      parsing: true
    }, {
      $set: {
        parsing: false
      }
    }).exec(function() {
      request.models.one.updateMany({
        parseDt: {$ne: null}
      }, {
        $set: {
          parseDt: null
        }
      }).exec(function() {
        reply.redirect('/items-parsing');
      });
    });
  }
}, {
  method: 'GET',
  path: '/start-parsing',
  handler: function(request, reply) {
    spawn('pm2', ['start', 'run.js'], {
      detached: true
    });
    reply.redirect('/items-parsing');
  }
}, {
  method: 'GET',
  path: '/stop-parsing',
  handler: function(request, reply) {
    spawn('pm2', ['stop', 'run'], {
      detached: true
    });
    reply.redirect('/items-parsing');
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
  method: 'GET',
  path: '/links',
  handler: function(request, reply) {
    reply(menu + 'asd');
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
      exec('sudo php /usr/src/collector/asterisk/call.php ' + r.id + ' ' + r.phone, function(err, err2, output) {
        console.log(err, err2, output);
        reply.redirect('/create-item');
      });
    });
  }
}];

