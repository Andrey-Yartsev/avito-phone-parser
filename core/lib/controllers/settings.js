const fs = require('fs');
const forms = require('forms');
const fields = forms.fields;
const validators = forms.validators;
const widgets = require('forms').widgets;

const bootstrapField = function (name, object) {
  if (!Array.isArray(object.widget.classes)) {
    object.widget.classes = [];
  }
  if (object.widget.classes.indexOf('form-control') === -1 && object.widget.type !== 'multipleCheckbox') {
    object.widget.classes.push('form-control');
  }

  const label = object.labelHTML(name);
  const error = object.error ? '<div class="alert alert-error help-block">' + object.error + '</div>' : '';

  let validationclass = object.value && !object.error ? 'has-success' : '';
  validationclass = object.error ? 'has-error' : validationclass;

  const widget = object.widget.toHTML(name, object);
  return '<div class="form-group fn-' + name + ' ' + validationclass + '">' + label + widget + error + '</div>';
};


const timeOptions = {};
const times = [
  '6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00',
  '16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'
];
for (let time of times) {
  timeOptions[time] = time;
}

const buildForm = () => {
    return forms.create({
      clientSmsText: fields.string({
        required: true,
        label: 'Текст СМС клиенту *',
        widget: widgets.textarea()
      }),
      managerSmsText: fields.string({
        required: true,
        label: 'Текст СМС менеджеру *',
        widget: widgets.textarea()
      }),
      managerPhone: fields.string({
        label: 'Телефон менеджера'
      }),
      linksParseLimit: fields.number({
        label: 'Лимит ссылок при парсинге источника'
      }),
      scheduleDays: fields.array({
        label: 'Дни недели',
        choices: {1: 'Понедельник', 2: 'Вторник', 3: 'Среда', 4: 'Четверг', 5: 'Пятница', 6: 'Суббота', 0: 'Воскресенье'},
        widget: widgets.multipleCheckbox()
      }),
      scheduleTimeFrom: fields.array({
        label: 'Время с',
        choices: timeOptions,
        widget: widgets.select()
      }),
      scheduleTimeTo: fields.array({
        label: 'Время по',
        choices: timeOptions,
        widget: widgets.select()
      }),
    });

  }
;

const layout = require('../views/layout');

module.exports = {
  form: (request, reply) => {
    let settings = fs.readFileSync('data/settings.json');
    settings = JSON.parse(settings);
    form = buildForm().bind(settings);

    const formBody = form.toHTML(bootstrapField);
    reply(layout(`
<h2>Настройки</h2>
<form action="" method="post" class="settings">
${formBody}
<div class="submit"><button type="submit" class="btn btn-primary">Сохранить</button></div>
</form>
`));
  },
  save: (request, reply) => {
    fs.writeFileSync('data/settings.json', JSON.stringify(request.payload));
    reply.redirect('/settings');
  }
};