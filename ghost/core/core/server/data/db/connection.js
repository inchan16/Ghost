const _ = require('lodash');
const knex = require('knex');
const os = require('os');

const logging = require('@tryghost/logging');
const config = require('../../../shared/config');
const { logEvent } = require('../../../policy_zone');
let knexInstance;

// @TODO:
// - if you require this file before config file was loaded,
// - then this file is cached and you have no chance to connect to the db anymore
// - bring dynamic into this file (db.connect())
function configure(dbConfig) {
  const client = dbConfig.client;

  // Backwards compatibility with old knex behaviour
  dbConfig.useNullAsDefault = Object.prototype.hasOwnProperty.call(
    dbConfig,
    'useNullAsDefault'
  )
    ? dbConfig.useNullAsDefault
    : true;

  // Enables foreign key checks and delete on cascade
  dbConfig.pool = {
    afterCreate(conn, cb) {
      conn.run('PRAGMA foreign_keys = ON', cb);

      // These two are meant to improve performance at the cost of reliability
      // Should be safe for tests. We add them here and leave them on
      if (config.get('env').startsWith('testing')) {
        conn.run('PRAGMA synchronous = OFF;');
        conn.run('PRAGMA journal_mode = TRUNCATE;');
      }
    },
  };

  // In the default SQLite test config we set the path to /tmp/ghost-test.db,
  // but this won't work on Windows, so we need to replace the /tmp bit with
  // the Windows temp folder
  const filename = dbConfig.connection.filename;
  if (
    process.platform === 'win32' &&
    _.isString(filename) &&
    filename.match(/^\/tmp/)
  ) {
    dbConfig.connection.filename = filename.replace(/^\/tmp/, os.tmpdir());
    logging.info(`Ghost DB path: ${dbConfig.connection.filename}`);
  }

  return dbConfig;
}

if (!knexInstance && config.get('database') && config.get('database').client) {
  knexInstance = knex(configure(config.get('database')));
  knexInstance.on('query', (query) => {
    if (query.sql.includes('COMMIT') || query.sql.includes('BEGIN')) {
      return;
    }
    logEvent(query.sql);
  });
}

module.exports = knexInstance;
