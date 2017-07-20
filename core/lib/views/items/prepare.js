module.exports = function (v) {
  let url = '';
  if (v.url) {
    url = `<a href="https://avito.ru${v.url}" target="_blank">Ссылка</a>`;
  }
  let accepted;
  if (v.accepted === 1) {
    accepted = 'Да';
  } else if (v.accepted === 0) {
    accepted = 'Нет';
  } else if (v.accepted === 2) {
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

  const result = {};
  result.id = v.id;
  result.url = url;
  result.phone = v.phone === undefined ? '-' : v.phone;
  result.lastCallDt = v.lastCallDt;
  result.resultDt = v.resultDt;
  result.callStatus = callStatus;
  result.accepted = accepted;
  result.retries = v.retries;
  return result;
};
