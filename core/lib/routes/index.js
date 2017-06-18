require('dotenv').config();
const fs = require('fs');

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const hashCode = require('../../lib/hashCode');
const dateFormat = require('dateformat');

const Path = require('path');
const staticFolder = Path.join(__dirname, '../../static');
const soundsFolder = Path.join(staticFolder, '/sound');
const soundsAsterFolder = Path.join(__dirname, '../../../asterisk/sound');

const call = require('../call/call');

const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

const host = process.env.SERVER_HOST || 'localhost';
const menu = `
<html>
<head>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">

  <link href="/i/layout.css" rel="stylesheet">
  <link href="/i/pagination.css" rel="stylesheet">
  <link href="/i/upload.css" rel="stylesheet">

  <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.1/socket.io.slim.js"></script>
  <script src="https://code.jquery.com/jquery-2.2.0.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
</head>
<body>

<script>
	var socket = io.connect('http://${host}:3050');
</script>

<nav class="navbar navbar-default" role="navigation">
  <div class="container-fluid">
    <!-- Brand and toggle get grouped for better mobile display -->
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
      <a class="navbar-brand" href="/">Avito Parse'n'Call</a>
    </div>
    <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
      <ul class="nav navbar-nav">
        <li class="dropdown">
          <a href="№" class="dropdown-toggle" data-toggle="dropdown">Выдачи <b class="caret"></b></a>
          <ul class="dropdown-menu">
          
            <li><a href="/sources">Посмотреть</a></li>
            <li><a href="/add-source">Добавить выдачу</a></li>
          </ul>
        </li> 
        <li><a href="/settings">Настройки</a><li>
        <!--
        <li class="dropdown">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown">Dropdown <b class="caret"></b></a>
          <ul class="dropdown-menu">
            <li><a href="#">Действие</a></li>
            <li><a href="#">Другое действие</a></li>
            <li><a href="#">Что-то еще</a></li>
            <li class="divider"></li>
            <li><a href="#">Отдельная ссылка</a></li>
            <li class="divider"></li>
            <li><a href="#">Еще одна отдельная ссылка</a></li>
          </ul>
        </li>
        -->
      </ul>
    </div>
  </div>
</nav>
<div class="body">
`;

const footer = `</div></body></html>`;

const renderLayout = (reply, body) => {
  reply(menu + body + footer);
};

const soundExists = (sourceHash) => {
  return fs.existsSync(soundsAsterFolder + '/' + sourceHash + '.gsm');
};

const itemsMenu = (sourceHash) => {
  const parseInProgress = require('../parse/process')(sourceHash).inProgress();
  const callInProgress = require('../call/process')(sourceHash).inProgress();
  let parseBtn;
  if (parseInProgress) {
    parseBtn =
      `<a href="/stop-item-parsing/${sourceHash}" class="btn btn-default btn-primary">Стоп (парс.тел.)</a>` +
      `<a href="/items/${sourceHash}/parsing" class="btn btn-default">Парсятся</a>`;
  } else {
    parseBtn =
      `<a href="/start-item-parsing/${sourceHash}" class="btn btn-default"></span>Старт (парс.тел.)</a> `;
  }

  let soundBtns = ``;
  if (soundExists(sourceHash)) {
    soundBtns = `<a href="/source-sound/${sourceHash}" class="btn btn-default">Прослушать звук</a>`;
    if (callInProgress) {
      soundBtns +=
        `<a href="/stop-calling/${sourceHash}" class="btn btn-default btn-primary">Стоп (обзвон)</a>` +
        ``;
    } else {
      soundBtns +=
        `<a href="/start-calling/${sourceHash}" class="btn btn-default">Старт (обзвон)</a>`;
    }
  }

  return `
<div class="btn-group">
  <a href="/items/${sourceHash}" class="btn btn-default">Все</a>
  ${parseBtn}
  <a href="/items/${sourceHash}/with-phone" class="btn btn-default">С телефоном</a>
</div>
<div class="btn-group">
  <a href="/source-upload-sound/${sourceHash}" class="btn btn-default">Загрузить звук</a>
  ${soundBtns}
  <a href="/items/${sourceHash}/called" class="btn btn-default">Завершенные звонки</a>
  <a href="/items/${sourceHash}/calling" class="btn btn-default">Звонки в процессе</a>
  <a href="/test-items/${sourceHash}" class="btn btn-default">Тестовые телефоны</a>
  <a href="/create-test-item/${sourceHash}" class="btn btn-default">Добавить тестовый телефон</a>
</div>`;
};

const table = function (r, call) {
  let html = ``;
  if (!r.length) {
    html += '<p>&nbsp;</p><div class="alert alert-info">Не найдены</div>';
  } else {
    html += `
<script>
socket.on('changed', function (what) {
  if (what !== 'item') return;
  console.log('changed item');
  $('#table').load(window.location.pathname + ' #table div', function() {});		
});
</script>

<div id="table" class="panel panel-default">
<div>
<table class="table">
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

      let callLink = '';
      if (call && v.phone) callLink = `<a href="/call/${v._id}" class="btn btn-default">Позвонить</a>`;

      deleteLink = `<a href="/delete-item/${v._id}" class="btn btn-danger">Удалить</a>`;

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
<td>${v.phone === undefined ? '-' : v.phone}</td>
<td>${lastCallDt}<br>${resultDt}</td>
<td>${callStatus}</td>
<td>${accepted}</td>
<td>${v.retries}</td>
<td>
  ${deleteLink}
  ${callLink}
</td>
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
  <input name="phone" placeholder="8XXXXXXXXXX" />
</p>
<p>
  <input type="submit" value="Создать" class="btn btn-default" />
</p>
</form>
`;
};

const createSourceForm = function () {
  return `
<div class="page-header">
  <h2>Добавить выдачу</h2>
</div>
<form method="POST" action="/create-source" class="form">
<p>
  Название: *<br />
  <input name="title" style="width:300px;" placeholder="Россия - транспорт"/>
</p>
<p>
  Ссылка на выдачу: *<br />
  <input name="link" style="width:500px;" placeholder="https://www.avito.ru/rossiya/transport" />
</p>
<p>
  <input type="submit" value="Создать" class="btn btn-default" />
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
  if (!settings.linksParseLimit) settings.linksParseLimit = '';
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
  Лимит ссылок при парсинге источника: *<br />
  <input name="linksParseLimit" value="${settings.linksParseLimit}" />
</p>
<p>
  <input type="submit" value="Сохранить" class="btn btn-default" />
</p>
</form>
`;

};

const renderSources = (request, reply) => {
  request.models.item.aggregate([
    {"$group": {_id: "$sourceHash", count: {$sum: 1}}}
  ]).exec((err, r) => {
    let counts = {};
    for (let v of r) {
      counts[v._id] = v.count;
    }

    request.models.source.find().exec((err, r) => {
      let html = `
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
        let links = count ?
          `<a href="/items/${v.hash}" class="btn btn-default"><b>Ссылки</b> (${count})</a> ` +
          `<a href="/items-with-phone/${v.hash}" class="btn btn-default">Ссылки с телефоном</a>` : '';
        let updating = v.updating ?
          `<span class="btn btn-primary">Обновляются</span>` :
          `<a href="/parse-source/${v.hash}" class="btn btn-warning">Обновить ссылки</a>`;
        html += `<li>
<h3><a href="/items/${v.hash}"><b>${v.title}</b></a> <span class="label label-default">${v.hash}</span></h3>
<p>
  ${updating}
   
  ${links}
  <a href="https://www.avito.ru/${v.link}" target="_blank" 
  class="btn btn-default" 
  data-toggle="tooltip" data-placement="top" title="Ссылка на выдачу Авито">Avito</a>
  <a href="/delete-source-links/${v.hash}" class="btn btn-default">Удалить ссылки</a> 
  <a href="/delete-source/${v.hash}" class="btn btn-default">Удалить выдачу</a>
</p>
</li>
`;
      }
      html += '</table>';
      renderLayout(reply, html);
    });
  });

};

const renderItems = function (request, reply, sourceHash, filter, prependHtml, call) {
  if (!prependHtml) prependHtml = '';
  request.models.source.findOne({
    hash: request.params.sourceHash
  }).exec(function (err, source) {
    let title = source ? `<h2>Выдача: ${source.title}</h2>` : '<h2>Не найден</h2>';
    title = `<div class="page-header">${title}</div>`;

    prependHtml += title;
    prependHtml += itemsMenu(sourceHash);
    filter.sourceHash = sourceHash;

    request.models.item.count(filter, (err, totalRecordsCount) => {

      // ------------
      let Pagination = require('ngn-pagination');
      let pagination = new Pagination({
        basePath: '/items/' + sourceHash,
        maxPages: 20
      });

      let currentPageN = 1; // first page
      if (request.params.pn) {
        currentPageN = request.params.pn;
      }
      let paginationData = pagination.data(currentPageN, totalRecordsCount);
      // ------------

      request.models.item.find(filter).//
      skip(pagination.options.n * (paginationData.page - 1)).//
      limit(pagination.options.n).//
      exec(function (err, r) {
        reply(menu + prependHtml + 
          '<div class="pagination"><span class="total">Всего: ' + totalRecordsCount + '</span>' + paginationData.pNums + '</div>'
          + table(r, true));
      });
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
  path: '/items/{sourceHash}/pg{pn}',
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
  path: '/welcome',
  handler: function (request, reply) {
    reply(menu + `<h2>Welcome to Avito Parse'n'Call</h2>`);
  }
}, {
  method: 'GET',
  path: '/items/{sourceHash}/parsing',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      parsing: true
    });
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
  path: '/items-with-phone/{sourceHash}',
  handler: function (request, reply) {
    renderItems(request, reply, request.params.sourceHash, {
      phone: {$ne: null}
    });
  }
}, {
  method: 'GET',
  path: '/start-item-parsing/{sourceHash}',
  handler: function (request, reply) {
    const parseProcess = require('../parse/process')(request.params.sourceHash);
    parseProcess.start();
    setTimeout(() => {
      reply.redirect('/items/' + request.params.sourceHash);
    }, 1000);
  }
}, {
  method: 'GET',
  path: '/stop-item-parsing/{sourceHash}',
  handler: function (request, reply) {
    request.models.item.updateMany(
      {sourceHash: request.params.sourceHash},
      {$set: {parsing: false}}
    ).exec(() => {
      require('../parse/process')(request.params.sourceHash).stop();
      reply.redirect('/items/' + request.params.sourceHash);
    });
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
    reply(menu + itemsMenu(request.params.sourceHash) + createForm(request.params.sourceHash));
  }
}, {
  method: 'GET',
  path: '/delete-item/{id}',
  handler: function (request, reply) {
    if (request.raw.req.headers.referer) {
      request.models.item.find({_id: request.params.id}).remove().exec((err, r) => {
        reply.redirect(request.raw.req.headers.referer);
      });
    } else {
      reply('done');
    }
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
    renderSources(request, reply);
  }
}, {
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    renderSources(request, reply);
  }
}, {
  method: 'GET',
  path: '/add-source',
  handler: function (request, reply) {
    reply(menu + createSourceForm());
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
  path: '/delete-source-links/{hash}',
  handler: function (request, reply) {
    request.models.item.find({sourceHash: request.params.hash}).remove().exec((err, r) => {
      reply.redirect('/sources');
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
        if (request.raw.req.headers.referer) {
          reply.redirect(request.raw.req.headers.referer);
        } else {
          reply('Звоню');
        }
      }
    );
  }
}, {
  method: 'GET',
  path: '/source-sound/{hash}',
  handler: (request, reply) => {
    let fileName = request.params.hash + '.mp3';
    if (!fs.existsSync(soundsFolder + '/' + fileName)) {
      reply('file "' + soundsFolder + '/' + fileName + '" does not exists');
      return;
    }
    let stat = fs.statSync(soundsFolder + '/' + fileName);
    let html = `
<div class="page-header"><h2>Прослушать звук</h2></div>
<div class="media">
<audio controls preload="metadata" style="width:300px;">
  <source src="/i/sound/${fileName}?${stat.mtime}" type="audio/mpeg">
</audio>
</div>
`;
    reply(menu + itemsMenu(request.params.hash) + html);
  }
}, {
  method: 'GET',
  path: '/source-upload-sound/{hash}',
  handler: function (request, reply) {
    let page = fs.readFileSync(staticFolder + '/upload.html');
    page = page.toString().replace(/{{uploadUrl}}/, '/source-upload-sound/' + request.params.hash);
    page = page.toString().replace(/{{redirectUrl}}/, '/source-sound/' + request.params.hash);
    reply(menu + itemsMenu(request.params.hash) + page);
  }
}, {
  method: 'POST',
  path: '/source-upload-sound/{hash}',
  config: {
    payload: {
      output: 'stream',
      parse: true,
      allow: 'multipart/form-data',
      maxBytes: 500000000
    },
    handler: (request, reply) => {
      const data = request.payload;
      if (data.file) {
        const name = request.params.hash + '.wav';
        const wavFile = soundsFolder + '/' + name;
        const pm3File = soundsFolder + '/' + request.params.hash + '.mp3';
        if (fs.existsSync(wavFile)) {
          fs.unlinkSync(wavFile);
        }
        const file = fs.createWriteStream(wavFile);
        file.on('error', function (err) {
          console.error(err);
          reply(err);
        });
        data.file.pipe(file);
        data.file.on('end', function (err) {
          const ret = {
            status: 'success',
            filename: data.file.hapi.filename,
            headers: data.file.hapi.headers
          };
          const gsmFile = soundsAsterFolder + '/' + request.params.hash + '.gsm';
          exec(`sox -V ${wavFile} -r 8000 -c 1 -t gsm ${gsmFile}`, function (err, err2, output) {
            if (err) {
              console.error(err);
              reply({error: err.code});
              return;
            }
            console.log('gsm converted');
            exec(`lame -b 32 --resample 8 -a ${wavFile} ${pm3File}`,
              function (err, err2, output) {
                if (err) {
                  console.error(err);
                  reply({error: err.code});
                  return;
                }
                console.log('mp3 converted');
                reply(ret);
              });
          });
        });
      }
    }
  }
}, {
  method: 'GET',
  path: '/start-calling/{sourceHash}',
  handler: function (request, reply) {
    const callProcess = require('../call/process')(request.params.sourceHash);
    callProcess.start();
    setTimeout(() => {
      reply.redirect('/items/' + request.params.sourceHash + '/calling');
    }, 1000);
  }
}, {
  method: 'GET',
  path: '/stop-calling/{sourceHash}',
  handler: function (request, reply) {
    require('../call/process')(request.params.sourceHash).stop();
    reply.redirect('/items/' + request.params.sourceHash + '/calling');
  }
}, {
  method: 'GET',
  path: '/i/{param*}',
  handler: {
    directory: {
      path: staticFolder,
      redirectToSlash: true,
      index: true
    }
  }
}];

