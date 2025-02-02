const rewire = require('rewire');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const defaults = rewire('react-scripts/scripts/build.js');
let config = defaults.__get__('config');
const fs = require('fs');
/* eslint-disable no-console */
const log = console.log;
/* eslint-enable no-console */

fs.copyFile('./public/main.css', './umd/main.css', (err) => {
  if (err) {
    throw err;
  }
  log('Copied main.css');
});

config.optimization.splitChunks = {
  cacheGroups: {
    default: false,
  },
};

config.optimization.runtimeChunk = false;

// JS: Save built file in `/umd`
config.output.filename = '../umd/sodo-search.min.js';

// CSS: Remove MiniCssPlugin from list of plugins
config.plugins = config.plugins.filter(
  (plugin) => !(plugin instanceof MiniCssExtractPlugin)
);
// CSS: replaces all MiniCssExtractPlugin.loader with style-loader to embed CSS in JS
config.module.rules[1].oneOf = config.module.rules[1].oneOf.map((rule) => {
  if (!Object.prototype.hasOwnProperty.call(rule, 'use')) {
    return rule;
  }
  return Object.assign({}, rule, {
    use: rule.use.map((options) =>
      /mini-css-extract-plugin/.test(options.loader)
        ? { loader: require.resolve('style-loader'), options: {} }
        : options
    ),
  });
});
