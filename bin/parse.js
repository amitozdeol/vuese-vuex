"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sfcToAST = sfcToAST;
exports.handleMethod = handleMethod;
exports.parseJavascript = parseJavascript;
exports.vueseParser = vueseParser;

var _parser = require("@vuese/parser");

var _parser2 = require("@babel/parser");

var bt = require('@babel/types');

var build = require('vue-template-compiler/build');

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var traverse = require('@babel/traverse');

var traverse__default = _interopDefault(traverse);

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

