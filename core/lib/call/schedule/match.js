const fs = require('fs');
let settings = fs.readFileSync('data/settings.json');
settings = JSON.parse(settings);

module.exports  = (date) => {
  console.log(settings.scheduleDays, date.getDay());
  if (settings.scheduleDays.indexOf(date.getDay().toString()) < 0) return false;
  const hours = date.getHours();
  const hoursFrom = parseInt(settings.scheduleTimeFrom.replace(/(\d+):\d+/, '$1'));
  const hoursTo = parseInt(settings.scheduleTimeTo.replace(/(\d+):\d+/, '$1'));
  if (hours >= hoursFrom && hours <= hoursTo) return true;
  return false;
};
