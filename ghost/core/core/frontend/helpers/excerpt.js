// # Excerpt Helper
// Usage: `{{excerpt}}`, `{{excerpt words="50"}}`, `{{excerpt characters="256"}}`
//
// Attempts to remove all HTML from the string, and then shortens the result according to the provided option.
//
// Defaults to words="50"

const { SafeString } = require('../services/handlebars');
const { metaData } = require('../services/proxy');
const _ = require('lodash');
const getMetaDataExcerpt = metaData.getMetaDataExcerpt;

module.exports = function excerpt(options) {
  let truncateOptions = (options || {}).hash || {};

  let excerptText;

  if (this.custom_excerpt) {
    excerptText = String(this.custom_excerpt);
  } else if (this.excerpt) {
    excerptText = String(this.excerpt);
  } else {
    excerptText = '';
  }

  truncateOptions = _.reduce(
    truncateOptions,
    (_truncateOptions, value, key) => {
      if (['words', 'characters'].includes(key)) {
        _truncateOptions[key] = parseInt(value, 10);
      }
      return _truncateOptions;
    },
    {}
  );

  if (!_.isEmpty(this.custom_excerpt)) {
    truncateOptions.characters = this.custom_excerpt.length;
    if (truncateOptions.words) {
      delete truncateOptions.words;
    }
  }

  return new SafeString(getMetaDataExcerpt(excerptText, truncateOptions));
};
