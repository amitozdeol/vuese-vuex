#!/usr/bin/env node
"use strict";

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _logHorizon = _interopRequireDefault(require("log-horizon"));

var _genMarkdown = _interopRequireDefault(require("./genMarkdown"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _logHorizon.default.create();

const cli = require('cac')();

cli.command('gen', 'Generate vuex store documentation').allowUnknownOptions().action(async () => {
  await (0, _genMarkdown.default)();

  try {
    logger.progress('Adding store to vuese site');

    const filename = _path.default.resolve('website/index.html'),
          indexSource = await _fsExtra.default.readFile(filename, 'utf-8'),
          reg = /JSON.parse\('(.*)'.replace\(.*\)/,
          matches = indexSource.match(reg),
          data = JSON.parse(matches[1].replace(/&#34;/g, '"'));

    data.push({
      title: 'Vuex',
      links: [{
        title: 'Store',
        link: '/store.js'
      }]
    });
    await _fsExtra.default.writeFile(filename, indexSource.replace(reg, JSON.stringify(data)));
    logger.success('Store added!');
  } catch (e) {
    logger.error('Error adding store to vuese site');
    logger.error(e);
  }
});
cli.parse();

