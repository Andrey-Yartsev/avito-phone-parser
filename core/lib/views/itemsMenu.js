const sound = require('../sound');

module.exports = (sourceHash) => {
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
  if (sound(sourceHash)) {
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
  <a href="/items/${sourceHash}/accepted" class="btn btn-default">Подтверждённые</a>
  <a href="/test-items/${sourceHash}" class="btn btn-default">Тестовые телефоны</a>
  <a href="/create-test-item/${sourceHash}" class="btn btn-default">Добавить тестовый телефон</a>
</div>


<script>
  socket.on('changed', function (what) {
    if (what === 'source') {
      console.log('updated');
      $('.body').load(window.location.pathname + ' .body', function() {});
    }
  });

</script>




`;
};

