module.exports = function captureStacktrace() {
  const stacks = Error()
    .stack.split('\n')
    .map((s) => s.trim())
    .filter((_, idx) => idx > 0)
    .map(transformFrame)
    .map((frame) => {
      const [file, line, func] = frame.split('@');

      const funcWithoutAsync = func.startsWith('async ')
        ? func.slice('async '.length, func.length)
        : func;

      return `${file}@${line}@${funcWithoutAsync}`;
    });

  /**
   * Cut off all the junk before the application logic &
   * filter out all the not-so-interesting frames
   */

  const cutToIdx = stacks.findIndex((frame) =>
    /api-framework\/lib\/pipeline.js/.test(frame)
  );

  const appStacks = stacks
    .slice(0, cutToIdx + 1)
    .map((frame) => [frame, getGroupKey(frame)])
    .filter(([_, key]) => key !== 'IGNORE');

  /**
   * Group consecutive frames of "kinda interesting" logic together
   */

  let group = { key: 'NULL', frames: [] };
  const groups = [];

  for (let [frame, key] of appStacks) {
    if (group.key !== key) {
      groups.push(group);
      group = { key, frames: [] };
    }
    group.frames.push(frame);
  }
  groups.push(group);

  return groups.flatMap((g) => (g.key === 'NULL' ? g.frames : [g.key]));
};

function transformFrame(frame) {
  const matches = frame.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);

  if (matches != null) {
    const [_, func, file, line, col] = matches;

    return `${file}@${line}:${col}@${func}`;
  }

  const matches2 = frame.match(/at\s+(.*)\s+(.*):(\d+):(\d+)/);

  if (matches2 != null) {
    const [_, func, file, line, col] = matches2;

    return `${file}@${line}:${col}@${func}`;
  }

  const matches3 = frame.match(/at\s+(.*):(\d+):(\d+)/);

  if (matches3 != null) {
    const [_, file, line, col] = matches3;

    return `${file}@${line}:${col}@`;
  }

  const matches4 = frame.match(/at\s+(.*)\s+\(<anonymous>\)/);

  if (matches4 != null) {
    const [_, func] = matches4;

    return `@0:0@${func}`;
  }

  console.log('??????', frame);

  return '@@@';
}

const GROUPS = [
  [/node_modules\/bluebird/, 'IGNORE'],
  [/node:/, 'IGNORE'],
  [/knex/, 'DATABASE_OPS'],
];

function getGroupKey(frame) {
  const [file, line, func] = frame.split('@');

  if (frame.includes('<anonymous>')) {
    return 'IGNORE';
  }

  if (file === '') {
    return 'IGNORE';
  }

  for (let [regex, groupKey] of GROUPS) {
    if (regex.test(file)) {
      return groupKey;
    }
  }

  return 'NULL';
}
