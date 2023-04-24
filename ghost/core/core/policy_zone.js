/**
 * Poor man's policy zone (just cipp_events actually :P)
 */

const captureStacktrace = require('./stacktrace');
const fs = require('fs');
const os = require('os');
const path = require('path');

const homeDir = os.homedir();
const dir = path.join(homeDir, 'mock_cipp_events');

try {
  fs.mkdirSync(dir);
} catch (e) {}

const logFilePath = path.join(dir, 'cipp_events.log');

const POLICY_EXAMPLE_A = 'EXAMPLE_A';

// table name -> policy
const POLICY_ASSIGNMENT = {
  posts: POLICY_EXAMPLE_A,
};

function appendToFile(str) {
  fs.appendFileSync(logFilePath, str + '\n######\n');
}

function logEvent(sql) {
  const [operationType] = sql.split(' ');

  const eventType =
    operationType === 'select' ? 'DATA_FLOW_IN' : 'DATA_FLOW_OUT';

  const table = sql.match(/(from|into|update) `(.*?)`/)[2];
  const policy = POLICY_ASSIGNMENT[table] ?? 'ALLOW';

  const stacktrace = captureStacktrace();

  if (stacktrace.length === 0) {
    return;
  }

  const shape = {
    dataClass: table,
    policy,
    eventType,
    operationType,
    stacktrace,
  };

  appendToFile(JSON.stringify(shape, null, 2));
}

module.exports = {
  logEvent,
};
