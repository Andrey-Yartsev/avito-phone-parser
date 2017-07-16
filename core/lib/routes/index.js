require('dotenv').config();
const fs = require('fs');

const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const dateFormat = require('dateformat');

const Path = require('path');
const staticFolder = Path.join(__dirname, '../../static');
const sound = require('../sound');
const call = require('../call/call');
const wsClient = require("socket.io-client");
const wsConnection = wsClient.connect("http://localhost:3050/");

const header = require('../views/header');
const layout = require('../views/layout');

const renderLayout = (reply, body) => {
  reply(layout(body));
};

const itemsMenu = require('../views/itemsMenu');

const table = function (r, call) {
  let html = ``;
  if (!r.length) {
    html += '<p>&nbsp;</p><div class="alert alert-info">Не найдены</div>';
  } else {
    html += `
<script>
socket.on('changed', function (what) {
  if (what !== 'item') return;
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


const renderSources = (request, reply) => {
  request.models.item.aggregate([
    {"$group": {_id: "$sourceHash", count: {$sum: 1}}}
  ]).exec((err, r) => {
    let counts = {};
    for (let v of r) {
      counts[v._id] = v.count;
    }

    request.models.source.find().exec((err, r) => {
      const parseProcess = require('../parseLinks/process');
      let html = `
<script>
socket.on('changed', function (what) {
  if (what !== 'source') return;
  console.log('source changed');
  $('#sources').load(window.location.pathname + ' #sources ul', function() {});
});
</script>

<div id="sources">
<ul>`;
      for (let v of r) {
        let count = counts[v.hash] || 0;
        let updating = parseProcess(v.hash).inProgress();
        let links = count ?
          `<a href="/items/${v.hash}" class="btn btn-default"><b>Ссылки</b> (${count})</a> ` +
          `<a href="/items-with-phone/${v.hash}" class="btn btn-default">Ссылки с телефоном</a>` : '';
        updating = updating ?
          `<a href="/stop-links-parsing/${v.hash}" class="btn btn-primary">Обновляются. Остановить</a>` :
          `<a href="/start-links-parsing/${v.hash}" class="btn btn-warning">Обновить ссылки</a>`;
        html += `<li>
<h3><a href="/items/${v.hash}"><b>${v.title}</b></a></h3>
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
        reply(layout(prependHtml +
          '<div class="pagination"><span class="total">Всего: ' + totalRecordsCount + '</span>' + paginationData.pNums + '</div>'
          + table(r, true)));
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
    reply(layout(`<h2>Welcome to Avito Parse'n'Call</h2>`));
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
    require('../parse/process')(request.params.sourceHash).start();
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
    reply(layout(itemsMenu(request.params.sourceHash) + createForm(request.params.sourceHash)));
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
    reply(layout(createSourceForm()));
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
  path: '/start-links-parsing/{sourceHash}',
  handler: function (request, reply) {
    require('../parseLinks/process')(request.params.sourceHash).start();
    reply.redirect('/sources');
  }
}, {
  method: 'GET',
  path: '/stop-links-parsing/{sourceHash}',
  handler: function (request, reply) {
    require('../parseLinks/process')(request.params.sourceHash).stop();
    reply.redirect('/sources');
  }
}, {
  method: 'GET',
  path: '/settings',
  handler: require('../controllers/settings').form
}, {
  method: 'POST',
  path: '/settings',
  handler: require('../controllers/settings').save
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
    let snd = sound(request.params.hash);
    if (!snd.existsMp3()) {
      reply('mp3 for "' + request.params.hash + '" does not exists');
      return;
    }
    let html = `
<div class="page-header"><h2>Прослушать звук</h2></div>
<div class="media">
<audio controls preload="metadata" style="width:300px;">
  <source src="${snd.mp3Path()}" type="audio/mpeg">
</audio>
</div>
`;
    reply(layout(itemsMenu(request.params.hash) + html));
  }
}, {
  method: 'GET',
  path: '/source-upload-sound/{hash}',
  handler: function (request, reply) {
    let page = fs.readFileSync(staticFolder + '/upload.html');
    page = page.toString().replace(/{{uploadUrl}}/, '/source-upload-sound/' + request.params.hash);
    page = page.toString().replace(/{{redirectUrl}}/, '/source-sound/' + request.params.hash);
    reply(layout(itemsMenu(request.params.hash) + page));
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
    handler: require('../sound/upload').handler
  }
}, {
  method: 'GET',
  path: '/start-calling/{sourceHash}',
  handler: function (request, reply) {
    require('../call/start')(request.params.sourceHash, wsConnection);
    setTimeout(() => {
      reply.redirect('/items/' + request.params.sourceHash + '/calling');
    }, 1000);
  }
}, {
  method: 'GET',
  path: '/stop-calling/{sourceHash}',
  handler: function (request, reply) {
    require('../call/stop')(request.params.sourceHash, wsConnection);
    setTimeout(() => {
      reply.redirect('/items/' + request.params.sourceHash + '/calling');
    }, 1000);
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
}, {
  method: 'GET',
  path: '/get-error-log',
  handler: (request, reply) => {
    reply(fs.readFileSync('data/log/error.log'));
  }
}, {
  method: 'GET',
  path: '/delete-error-log',
  handler: (request, reply) => {
    fs.writeFileSync('data/log/error.log', '');
    reply.redirect('/');
  }
}
];

