#!/usr/bin/env node
"use strict";

var _fastGlob = _interopRequireDefault(require("fast-glob"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _logHorizon = _interopRequireDefault(require("log-horizon"));

var _render = _interopRequireDefault(require("./render"));

var _parse = require("./parse");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const logger = _logHorizon.default.create();

const cli = require('cac')();

cli.command('gen', 'Generate vuex store documentation').allowUnknownOptions().action(async () => {
  // let genMarkdown = async(config) => {
  let genType = 'docute',
      // title = 'Components',
  include = ['src/*.js'],
      exclude = [],
      outDir = 'website',
      markdownDir = 'components',
      markdownFile = ''; // host = '127.0.0.1';
  // let { include, exclude, outDir, markdownDir, markdownFile, babelParserPlugins, isPreview, genType } = config;

  logger.progress('Start creating markdown files...');
  if (typeof include === 'string') include = [include];
  if (typeof exclude === 'string') exclude = [exclude];
  exclude = exclude.concat('node_modules/**/*');
  const files = await (0, _fastGlob.default)(include.concat(exclude.map(p => `!${p}`)));
  files.map(async p => {
    const abs = _path.default.resolve(p);

    const source = await _fsExtra.default.readFile(abs, 'utf-8');

    try {
      const parserRes = (0, _parse.vueseParser)(source, {
        babelParserPlugins: {},
        jsFile: abs.endsWith('.js')
      });
      const r = new _render.default(parserRes);
      let markdownRes = r.renderMarkdown();
      if (!markdownRes) return;
      let str = markdownRes.content;
      let compName = markdownRes.componentName ? markdownRes.componentName : _path.default.basename(abs, '.vue');
      const groupName = markdownRes.groupName;
      str = str.replace(/\[name\]/g, compName);
      let targetDir = '';
      let targetFile = '';

      if (genType === 'markdown' && markdownDir === '*') {
        targetDir = _path.default.dirname(abs);
        targetFile = markdownFile || compName;
      } else {
        targetDir = _path.default.resolve(outDir, '');
        targetFile = compName;
      }

      const target = _path.default.resolve(targetDir, targetFile + '.md');

      await _fsExtra.default.ensureDir(targetDir);
      await _fsExtra.default.writeFile(target, str);
      logger.success(`Successfully created: ${target}`);
      return {
        compName,
        groupName,
        content: str
      };
    } catch (e) {
      logger.error(`The error occurred when processing: ${abs}`);
      logger.error(e);
    }
  }); // };
  // await genMarkdown({
  //         genType: 'docute',
  //         title: 'Components',
  //         include: ['src/*.js'],
  //         exclude: [],
  //         outDir: 'website',
  //         markdownDir: 'components',
  //         markdownFile: '',
  //         host: '127.0.0.1'
  //     });
  //

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

