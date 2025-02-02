const _ = require('lodash');
const errors = require('@tryghost/errors');
const logging = require('@tryghost/logging');

const CHUNK_SIZE = 100;

function createBulkOperation(singular, multiple) {
  return async function (knex, table, data, options) {
    const result = {
      successful: 0,
      unsuccessful: 0,
      unsuccessfulData: [],
      errors: [],
    };

    for (const chunkedData of _.chunk(data, CHUNK_SIZE)) {
      try {
        await multiple(knex, table, chunkedData, options);
        result.successful += chunkedData.length;
      } catch (errToIgnore) {
        if (options.throwErrors) {
          throw errToIgnore;
        }
        for (const singularData of chunkedData) {
          try {
            await singular(knex, table, singularData, options);
            result.successful += 1;
          } catch (err) {
            err.errorDetails = singularData;
            result.errors.push(err);
            result.unsuccessfulData.push(singularData);
            result.unsuccessful += 1;
          }
        }
      }
    }

    return result;
  };
}

async function insertSingle(knex, table, record, options) {
  let k = knex(table);
  if (options.transacting) {
    k = k.transacting(options.transacting);
  }
  await k.insert(record);
}

async function insertMultiple(knex, table, chunk, options) {
  let k = knex(table);
  if (options.transacting) {
    k = k.transacting(options.transacting);
  }
  await k.insert(chunk);
}

async function editSingle(knex, table, id, options) {
  let k = knex(table);
  if (options.transacting) {
    k = k.transacting(options.transacting);
  }
  await k.where('id', id).update(options.data);
}

async function editMultiple(knex, table, chunk, options) {
  let k = knex(table);
  if (options.transacting) {
    k = k.transacting(options.transacting);
  }
  await k.whereIn('id', chunk).update(options.data);
}

async function delSingle(knex, table, id, options) {
  try {
    let k = knex(table);
    if (options.transacting) {
      k = k.transacting(options.transacting);
    }
    await k.where(options.column ?? 'id', id).del();
  } catch (err) {
    const importError = new errors.DataImportError({
      message: `Failed to remove entry from ${table}`,
      context: `Entry id: ${id}`,
      err: err,
    });
    logging.error(importError);
    throw importError;
  }
}

async function delMultiple(knex, table, chunk, options) {
  let k = knex(table);
  if (options.transacting) {
    k = k.transacting(options.transacting);
  }
  await k.whereIn(options.column ?? 'id', chunk).del();
}

const insert = createBulkOperation(insertSingle, insertMultiple);
const edit = createBulkOperation(editSingle, editMultiple);
const del = createBulkOperation(delSingle, delMultiple);

/**
 * @param {import('bookshelf')} Bookshelf
 */
module.exports = function (Bookshelf) {
  Bookshelf.Model = Bookshelf.Model.extend(
    {},
    {
      bulkAdd: function bulkAdd(data, tableName, options = {}) {
        tableName = tableName || this.prototype.tableName;

        return insert(Bookshelf.knex, tableName, data, options);
      },

      bulkEdit: async function bulkEdit(data, tableName, options = {}) {
        tableName = tableName || this.prototype.tableName;

        return await edit(Bookshelf.knex, tableName, data, options);
      },

      /**
       *
       * @param {string[]} data List of ids to delete
       * @param {*} tableName
       * @param {Object} [options]
       * @param {string} [options.column] Delete the rows where this column equals the ids in `data` (defaults to 'id')
       * @returns
       */
      bulkDestroy: async function bulkDestroy(data, tableName, options = {}) {
        tableName = tableName || this.prototype.tableName;
        return await del(Bookshelf.knex, tableName, data, options);
      },
    }
  );
};
