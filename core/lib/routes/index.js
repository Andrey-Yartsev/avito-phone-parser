require('dotenv').config();
const fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const hashCode = require('../../lib/hashCode');
const dateFormat = require('dateformat');

const call = require('../utils/call');

const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

const host = process.env.SERVER_HOST || 'localhost';
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
	var socket = io.connect('http://${host}:3050');
</script>

<p>
  <a href="/sources">Выдачи</a> | 
  <a href="/start-parsing">Запустить</a> | 
  <a href="/stop-parsing">Остановить</a> |
  <a href="/settings">Настройки</a>
</p>
`;

const itemsMenu = (sourceHash) => {
  return `
<p>
  <a href="/items/${sourceHash}">Все</a> | 
  <a href="/items/${sourceHash}/parsing">Парсятся</a> | 
  <a href="/items/${sourceHash}/with-phone">С телефоном</a> | 
  <a href="/items/${sourceHash}/called">Звонки</a> | 
  <a href="/items/${sourceHash}/calling">Дозвон</a> | 
  <a href="/items/${sourceHash}/cleanup">Очистка</a> | 
  <a href="/test-items/${sourceHash}">Тестовые телефоны</a> | 
  <a href="/create-test-item/${sourceHash}">Добавить тестовый телефон</a>
</p>`;
};

const table = function (r, call) {
  let html = ``;
  if (!r.length) {
    html += '<p>Не найдены</p>';
  } else {
    html += `
<script>
socket.on('changed', function (what) {
  if (what !== 'item') return;
  console.log('changed item');
  $('#table').load(window.location.pathname + ' #table div', function() {});		
});
</script>
Всего: ${r.length}
<div id="table">
<div>
<table border="1">
<tr>
  <th>ID</th>
  <th>Ссылка</th>
  <th></th>
  <th>Телефон</th>
  <th>Начало звонока/Конец звонка</th>
  <th>Статус звонка</th>
  <th>Результат звонка</th>
  <th>Попыток дозвона</th>
  <th></th>
</tr>
`;

    let callStatuses = {
      maxRetriesReached: 'превышено количество попыток дозвона',
      calling: 'звоню',
      answered: 'есть ответ',
      hangup: 'трубка брошена'
    };

    for (let v of r) {
      let url = '';
      if (v.url) {
        url = `<a href="https://avito.ru${v.url}" target="_blank">Ссылка</a>`;
      }

      let callLink = '<td></td>';
      if (call && v.phone) callLink = `<td><a href="/call/${v._id}">Позвонить</a></td>`;
      let accepted;
      if (v.accepted === 1) {
        accepted = 'Да';
      } else if (v.accepted == 0) {
        accepted = 'Нет';
      } else if (v.accepted == 2) {
        accepted = 'Нет ответа';
      } else {
        accepted = '-';
      }

      let callStatus = '-';
      if (v.callStatus) {
        callStatus = callStatuses[v.callStatus] || v.callStatus;
      }


      let parsing = v.parsing ? 'парсится' : '';

      let lastCallDt = '';
      if (v.lastCallDt) {
        lastCallDt = dateFormat(new Date(v.lastCallDt));
      }
      let resultDt = '';
      if (v.resultDt) {
        resultDt = dateFormat(new Date(v.resultDt));
      }


      html += `<tr>
<td>${v.id}</td>
<td>${url}</td>
<td>${parsing}</td>
<td>${v.phone}</td>
<td>${lastCallDt}<br>${resultDt}</td>
<td>${callStatus}</td>
<td>${accepted}</td>
<td>${v.retries}</td>
${callLink}
</tr>`;
    }
    html += '</table>';
  }
  return html;
};

const createForm = function (sourceHash) {
  return `
<h2>Добавить телефон</h2>
<form method="POST" action="/create-test-item/${sourceHash}">
<p>
  <input name="phone" />
</p>
<p>
  <input type="submit" value="Создать" />
</p>
</form>
`;
};

const createSourceForm = function () {
  return `
<h2>Добавить выдачу</h2>
<form method="POST" action="/create-source">
<p>
  Название: *<br />
  <input name="title" style="width:300px;" placeholder="Россия - транспорт"/>
</p>
<p>
  Ссылка на выдачу: *<br />
  <input name="link" style="width:500px;" placeholder="https://www.avito.ru/rossiya/transport" />
</p>
<p>
  <input type="submit" value="Создать" />
</p>
</form>
`;
};

const settingsForm = () => {
  let settings = fs.readFileSync('data/settings.json');
  settings = JSON.parse(settings);
  if (!settings.clientSmsText) settings.clientSmsText = '';
  if (!settings.managerSmsText) settings.managerSmsText = '';
  if (!settings.managerPhone) settings.managerPhone = '';
  return `
<h2>Настройки</h2>
<form method="POST" action="/settings">
<p>
  Текст СМС клиенту: *<br />
  <textarea name="clientSmsText" style="width:400px;height:100px;">${settings.clientSmsText}</textarea>
</p>
<p>
  Текст СМС менеджеру: *<br />
  <textarea name="managerSmsText" style="width:400px;height:100px;">${settings.managerSmsText}</textarea>
</p>
<p>
  Телефон менеджера: *<br />
  <input name="managerPhone" value="${settings.managerPhone}" />
</p>
<p>
  <input type="submit" value="Сохранить" />
</p>
</form>
`;

};

const renderSources = (request, reply, prependHtml) => {
  request.models.item.aggregate([
    {"$group": {_id: "$sourceHash", count: {$sum: 1}}}
  ]).exec((err, r) => {
    let counts = {};
    for (let v of r) {
      counts[v._id] = v.count;
    }

    request.models.source.find().exec((err, r) => {
      let html = prependHtml + `
<script>
socket.on('changed', function (what) {
  if (what !== 'source') return;
  $('#sources').load(window.location.pathname + ' #sources ul', function() {});		
});
</script>

<div id="sources">
<ul>`;
      for (let v of r) {
        let count = counts[v.hash] || 0;
        let links = count ? `<a href="/items/${v.hash}"><b>Ссылки</b> (${count})</a> | <a href="/items-with-phone/${v.hash}">Ссылки с телефоном</a> | ` : '';
        let updating = v.updating ? `<i>обновляется (${count})</i>` : '';
        html += `<li>
<b>${v.title}</b> (${v.hash}) <a href="https://www.avito.ru/${v.link}" target="_blank">ссылка на выдачу avito</a>
<p>
  ${updating}
  ${links}
  <a href="/parse-source/${v.hash}">Обновить ссылки с выдачи</a> | 
  <a href="/delete-source/${v.hash}">Удалить</a>
</p>
</li>
`;
      }
      html += '</table>';
      reply(html);
    });
  });

};

const renderItems = function (request, reply, sourceHash, filter, prependHtml, call) {
  if (!prependHtml) prependHtml = '';
  request.models.source.findOne({
    hash: request.params.sourceHash
  }).exec(function (err, source) {
    let title = source ? `<h2>Выдача: ${source.title}</h2>` : '<h2>Не найден</h2>';
    prependHtml += title;
    prependHtml += itemsMenu(sourceHash);
    filter.sourceHash = sourceHash;
    request.models.item.find(filter).exec(function (err, r) {
      reply(menu + prependHtml + table(r, true));
    });
  });
};

module.exports = [{
  method: 'GET',
  path: '/items/{sourceHash}',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      sourceHash: request.params.sourceHash
    });
  }
}, {
  method: 'GET',
  path: '/items/{sourceHash}/with-phone',
  handler: function (request, reply) {
    request.models.source.findOne({
      hash: request.params.sourceHash
    }).exec(function (err, source) {
      renderItems(request, reply, request.params.sourceHash, {
        phone: {$ne: null}
      });
    });
  }
}, {
  method: 'GET',
  path: '/items/{sourceHash}/called',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      lastCallDt: {$ne: null}
    });
  }
}, {
  method: 'GET',
  path: '/items/{sourceHash}/calling',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      callStatus: 'calling'
    });
  }
}, {
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply(menu + '<h2>Welcome to Avito Parser</h2>');
  }
}, {
  method: 'GET',
  path: '/items/{sourceHash}/parsing',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      parsing: true
    }, itemsMenu(request.params.sourceHash));
  }
}, {
  method: 'GET',
  path: '/reset-parsing/{sourceHash}',
  handler: function (request, reply) {
    request.models.item.updateMany({
      sourceHash: request.params.sourceHash,
      parsing: true
    }, {
      $set: {
        parsing: false
      }
    }).exec(function () {
      request.models.item.updateMany({
        parseDt: {$ne: null}
      }, {
        $set: {
          parseDt: null
        }
      }).exec(function () {
        reply.redirect('/items-parsing');
      });
    });
  }
}, {
  method: 'GET',
  path: '/items/{sourceHash}/cleanup',
  handler: function (request, reply) {
    request.models.item.updateMany({
      sourceHash: request.params.sourceHash,
    }, {
      $set: {
        parsing: false
      }
    }).exec(function () {
      reply.redirect('/items/' + request.params.sourceHash);
    });
  }
}, {
  method: 'GET',
  path: '/start-parsing',
  handler: function (request, reply) {
    spawn('pm2', ['start', 'run.js'], {
      detached: true
    });
    reply.redirect('/items-parsing');
  }
}, {
  method: 'GET',
  path: '/stop-parsing',
  handler: function (request, reply) {
    spawn('pm2', ['stop', 'run'], {
      detached: true
    });
    reply.redirect('/items-parsing');
  }
}, {
  method: 'GET',
  path: '/test-items/{sourceHash}',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      test: true
    });
  }
}, {
  method: 'GET',
  path: '/create-test-item/{sourceHash}',
  handler: function (request, reply) {
    reply(createForm(request.params.sourceHash));
  }
}, {
  method: 'POST',
  path: '/create-test-item/{sourceHash}',
  handler: function (request, reply) {
    request.models.item.create({
      id: 'test-' + request.payload.phone,
      phone: request.payload.phone,
      sourceHash: request.params.sourceHash,
      test: true
    }, function (err) {
      if (err) {
        console.log(err);
        reply(err);
        return;
      }
      reply.redirect('/test-items/' + request.params.sourceHash);
    });
  }
}, {
  method: 'GET',
  path: '/sources',
  handler: function (request, reply) {
    renderSources(request, reply, menu + createSourceForm());
  }
}, {
  method: 'POST',
  path: '/create-source',
  handler: function (request, reply) {
    if (!request.payload.title) {
      reply('title required');
      return;
    }
    if (!request.payload.link) {
      reply('link required');
      return;
    }
    let link = request.payload.link.replace(/https:\/\/www\.avito\.ru\/(.*)/, '$1');
    request.models.source.create({
      title: request.payload.title,
      hash: hashCode(link),
      link: link
    }, function () {
      reply.redirect('/sources');
    });
  }
}, {
  method: 'GET',
  path: '/delete-source/{hash}',
  handler: function (request, reply) {
    request.models.source.find({hash: request.params.hash}).remove().exec((err, r) => {
      request.models.item.find({sourceHash: request.params.hash}).remove().exec((err, r) => {
        reply.redirect('/sources');
      });
    });
  }
}, {
  method: 'GET',
  path: '/parse-source/{hash}',
  handler: function (request, reply) {
    spawn('node', ['parseLinks.js', request.params.hash], {
      detached: true
    });
    reply.redirect('/sources');
  }
}, {
  method: 'GET',
  path: '/settings',
  handler: function (request, reply) {
    reply(menu + settingsForm(request, reply));
  }
}, {
  method: 'POST',
  path: '/settings',
  handler: function (request, reply) {
    fs.writeFileSync('data/settings.json', JSON.stringify(request.payload));
    reply.redirect('/settings');
  }
}, {
  method: 'GET',
  path: '/call/{id}',
  handler: function (request, reply) {
    call(
      request.params.id,
      request.models,
      wsConnection,
      () => {
        reply('Звоню. <a href="javascript:history.back();">Назад</a>');
      }
    );
  }
}];

