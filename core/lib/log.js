const rufus = require('rufus');

// rufus.addHandler(new rufus.handlers.File('data/log/common.log'));
// rufus.addHandler(new rufus.handlers.Console());

rufus.config({
  handlers: {
    errors: {
      class: rufus.handlers.File,
      file: 'data/log/error.log',
      level: rufus.WARN
    },
    main: {
      class: rufus.handlers.File,
      file: 'data/log/main.log'
    },
    console: {
      class: rufus.handlers.Console
    }
  },
  loggers: {
    root: {
      level: rufus.TRACE,
      handlers: ['console', 'errors', 'main']
    }
  }
});


process.on('uncaughtException', function (err) {
  console.log('!!!!!!!!!!!!!!!!!!');
  // log.info('xxx');
  // log.warn(new Error('aaa'));
  // log.info('ggg');
  rufus.error(err);
});

module.exports = rufus;
