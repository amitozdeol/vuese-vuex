#!/usr/bin/env node
"use strict";

var _markdownRender = _interopRequireDefault(require("@vuese/markdown-render"));

var _joycon = _interopRequireDefault(require("joycon"));

var _fastGlob = _interopRequireDefault(require("fast-glob"));

var _path = _interopRequireDefault(require("path"));

var _fsExtra = _interopRequireDefault(require("fs-extra"));

var _parser = require("@vuese/parser");

var _parser2 = require("@babel/parser");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var bt = require('@babel/types');

var build = require('vue-template-compiler/build');

var parser = require('@babel/parser');

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var traverse = require('@babel/traverse');

var traverse__default = _interopDefault(traverse);

const joycon = new _joycon.default({
  packageKey: 'vuese-vuex'
});

const cli = require('cac')();

Object.defineProperty(exports, '__esModule', {
  value: true
});

function genMarkdownTpl(parserRes) {
  const desc = parserRes.componentDesc;
  let templateStr = '# [name]\n\n';

  if (desc && desc.default.length) {
    templateStr += `${desc.default.join(' ')}\n\n`;
  }

  const forceGenerate = desc && desc.vuese && parserRes.name;
  const original = templateStr;
  templateStr += parserRes.getters ? genBaseTemplate('getters') : '';
  templateStr += parserRes.actions ? genBaseTemplate('actions') : '';
  templateStr += parserRes.mutations ? genBaseTemplate('mutations') : '';
  templateStr += parserRes.state ? genBaseTemplate('state') : '';
  return !forceGenerate && original === templateStr ? '' : templateStr;
}

function upper(word) {
  return word[0].toUpperCase() + word.slice(1);
}

function genBaseTemplate(label) {
  let str = `## ${upper(label)}\n\n`;
  str += `<!-- @vuese:[name]:${label}:start -->\n`;
  str += `<!-- @vuese:[name]:${label}:end -->\n\n`;
  return str;
}

const nameRE = /\[name\]/g;
const htmlCommentRE = /<!--\s*@vuese:([a-zA-Z_][\w\-\.]*|\[name\]):(\w+):start\s*-->[^]*<!--\s*@vuese:\1:\2:end\s*-->/;

function renderMarkdown(renderRes, parserRes) {
  const mdTemplate = genMarkdownTpl(parserRes); // Indicates that this component has no documentable content

  if (!mdTemplate) return null;
  let str = mdTemplate;
  let compName = parserRes.name;
  const groupName = parserRes.componentDesc && parserRes.componentDesc.group ? parserRes.componentDesc.group[0] : undefined;

  if (compName) {
    str = mdTemplate.replace(nameRE, compName);
  }

  let index = 0,
      stream = str;

  while (stream) {
    const res = stream.match(htmlCommentRE);

    if (res) {
      const matchText = res[0];
      const type = res[2];
      const i = stream.indexOf(matchText);
      const currentHtmlCommentRE = new RegExp(`<!--\\s*@vuese:(${compName ? compName : '\\[name\\]'}):(${type}):start\\s*-->[^]*<!--\\s*@vuese:\\1:\\2:end\\s*-->`);
      str = str.replace(currentHtmlCommentRE, (s, c1, c2) => {
        if (renderRes[type]) {
          let code = `<!-- @vuese:${c1}:${c2}:start -->\n`;
          code += renderRes[type];
          code += `\n<!-- @vuese:${c1}:${c2}:end -->\n`;
          return code;
        }

        return s;
      });
      index = i + matchText.length;
    } else {
      index = stream.length;
    }

    stream = stream.slice(index);
  }

  return {
    content: str,
    componentName: compName || '',
    groupName: groupName || 'BASIC'
  };
}

class VuexRender extends _markdownRender.default {
  constructor(parserResult, options) {
    super(parserResult, options);
    this.parserResult = parserResult;
    this.options = options;
    this.options = Object.assign({}, {
      getters: ['Getter', 'Description'],
      actions: ['Action', 'Description', 'Parameters'],
      mutations: ['Mutation', 'Description', 'Parameters'],
      state: ['Name', 'Description']
    }, this.options);
  }

  render() {
    const {
      props,
      slots,
      events,
      methods,
      mixIns,
      data,
      computed,
      watch,
      getters,
      actions,
      mutations,
      state
    } = this.parserResult;
    let md = {};

    if (getters) {
      md.getters = this.getterRender(getters);
    }

    if (actions) {
      md.actions = this.actionRender(actions);
    }

    if (mutations) {
      md.mutations = this.mutationRender(mutations);
    }

    if (state) {
      md.state = this.stateRender(state);
    }

    return md;
  }

  addFuncCodeRow(data, code, nameStr, config) {
    const row = [];

    for (let i = 0; i < config.length; i++) {
      if (config[i] === nameStr) {
        row.push(data.name);
      } else if (config[i] === 'Description') {
        if (data.describe) {
          row.push(data.describe.join(' '));
        } else {
          row.push('-');
        }
      } else if (config[i] === 'Parameters') {
        if (data.argumentsDesc) {
          row.push(data.argumentsDesc.join(' '));
        } else {
          row.push('-');
        }
      } else {
        row.push('-');
      }
    }

    code += this.renderTabelRow(row);
    return code;
  }

  actionRender(actionRes) {
    const actionConfig = this.options.actions;
    let code = this.renderTabelHeader(actionConfig);
    actionRes.forEach(action => {
      code = this.addFuncCodeRow(action, code, 'Action', actionConfig);
    });
    return code;
  }

  mutationRender(mutationRes) {
    const mutationConfig = this.options.mutations;
    let code = this.renderTabelHeader(mutationConfig);
    mutationRes.forEach(mutation => {
      code = this.addFuncCodeRow(mutation, code, 'Mutation', mutationConfig);
    });
    return code;
  }

  addPropertyCodeRow(data, code, nameStr, config) {
    const row = [];

    for (let i = 0; i < config.length; i++) {
      if (config[i] === nameStr) {
        row.push(data.name);
      } else if (config[i] === 'Description') {
        if (data.describe) {
          row.push(data.describe.join(' '));
        } else {
          row.push('-');
        }
      } else {
        row.push('-');
      }
    }

    code += this.renderTabelRow(row);
    return code;
  }

  getterRender(getterRes) {
    const getterConfig = this.options.getters;
    let code = this.renderTabelHeader(getterConfig);
    getterRes.forEach(getter => {
      code = this.addPropertyCodeRow(getter, code, 'Getter', getterConfig);
    });
    return code;
  }

  stateRender(stateRes) {
    const stateConfig = this.options.state;
    let code = this.renderTabelHeader(stateConfig);
    stateRes.forEach(state => {
      code = this.addPropertyCodeRow(state, code, 'Name', stateConfig);
    });
    return code;
  } // renderMarkdown() {
  //     return renderMarkdown(this.render(), this.parserResult);
  // }


}

function sfcToAST(source, babelParserPlugins, jsFile) {
  const sfc = build.parseComponent(source),
        res = {};
  res.sourceType = sfc.script && sfc.script.lang ? sfc.script.lang : 'js';
  res.jsAst = (0, _parser2.parse)(jsFile ? source : sfc.script.content, {
    sourceType: 'module',
    plugins: []
  });
  return res;
}

function handleMethod(path, handler) {
  const properties = path.node.value.properties.filter(n => bt.isObjectMethod(n) || bt.isObjectProperty(n));
  properties.forEach(node => {
    const commentsRes = (0, _parser.getComments)(node); // Collect only methods that have @vuese annotations

    if (commentsRes.vuese) {
      const result = {
        name: node.key.name,
        describe: commentsRes.default,
        argumentsDesc: commentsRes.arg
      };
      handler(result);
    }
  });
}

function parseJavascript(ast, options = {}) {
  traverse__default(ast, {
    ExportDefaultDeclaration(rootPath) {
      if (options.onDesc) {
        options.onDesc((0, _parser.getComponentDescribe)(rootPath.node));
      }

      rootPath.traverse({
        ObjectProperty(path) {
          const {
            onProp,
            onMethod,
            onComputed,
            onName,
            onSlot,
            onMixIn,
            onData,
            onWatch,
            onGetter,
            onAction,
            onMutation,
            onState
          } = options;

          if (onGetter && (0, _parser.isVueOption)(path, 'getters')) {
            handleMethod(path, onGetter);
          }

          if (onAction && (0, _parser.isVueOption)(path, 'actions')) {
            handleMethod(path, onAction);
          }

          if (onMutation && (0, _parser.isVueOption)(path, 'mutations')) {
            handleMethod(path, onMutation);
          }

          if (onState && (0, _parser.isVueOption)(path, 'state')) {
            const properties = path.node.value.properties;
            properties.forEach(node => {
              const commentsRes = (0, _parser.getComments)(node);
              const result = {
                name: node.key.name,
                describe: commentsRes.default
              };
              onState(result);
            });
          }
        }

      });
    }

  });
}

function vueseParser(source, options = {}) {
  const astRes = sfcToAST(source, options.babelParserPlugins, options.jsFile);
  const res = {};
  const defaultOptions = {
    onGetter(getterRes) {
      (res.getters || (res.getters = [])).push(getterRes);
    },

    onAction(actionRes) {
      (res.actions || (res.actions = [])).push(actionRes);
    },

    onMutation(mutationRes) {
      (res.mutations || (res.mutations = [])).push(mutationRes);
    },

    onState(stateRes) {
      (res.state || (res.state = [])).push(stateRes);
    }

  };
  const finallyOptions = Object.assign(defaultOptions, options);

  if (astRes.jsAst) {
    parseJavascript(astRes.jsAst, finallyOptions);
  }

  return res;
}

cli.command('genagain', 'Generate target resources').allowUnknownOptions().action(async flags => {
  var genMarkdown = async config => {
    let {
      include,
      exclude,
      outDir,
      markdownDir,
      markdownFile,
      babelParserPlugins,
      isPreview,
      genType
    } = config; // logger.progress('Start creating markdown files...');

    if (typeof include === 'string') include = [include];
    if (typeof exclude === 'string') exclude = [exclude];
    exclude = exclude.concat('node_modules/**/*');
    const files = await (0, _fastGlob.default)(include.concat(exclude.map(p => `!${p}`)));
    return files.map(async p => {
      const abs = _path.default.resolve(p);

      const source = await _fsExtra.default.readFile(abs, 'utf-8');

      try {
        const parserRes = vueseParser(source, {
          babelParserPlugins,
          jsFile: abs.endsWith('.js')
        });
        const r = new VuexRender(parserRes);
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

        if (!isPreview) {
          await _fsExtra.default.ensureDir(targetDir);
          await _fsExtra.default.writeFile(target, str); // logger.success(`Successfully created: ${target}`);
        }

        return {
          compName,
          groupName,
          content: str
        };
      } catch (e) {
        console.log(`The error occurred when processing: ${abs}`);
        console.log(e);
      }
    });
  };

  const markdown = genMarkdown({
    genType: 'docute',
    title: 'Components',
    include: ['src/*.js'],
    exclude: [],
    outDir: 'website',
    markdownDir: 'components',
    markdownFile: '',
    host: '127.0.0.1'
  }),
        filename = _path.default.resolve('website/index.html'),
        indexSource = await _fsExtra.default.readFile(filename, 'utf-8'),
        reg = /JSON.parse\('(.*)'.replace\(.*\)/,
        matches = indexSource.match(reg),
        data = JSON.parse(matches[1].replace(/\&\#34\;/g, '"'));

  data.push({
    title: 'Vuex',
    links: [{
      title: 'Store',
      link: '/store.js'
    }]
  });
  await _fsExtra.default.writeFile(filename, indexSource.replace(reg, JSON.stringify(data)));
});
const parsed = cli.parse();

