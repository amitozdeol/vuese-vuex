import {
    getComments,
    getComponentDescribe,
    isVueOption,
} from '@vuese/parser';

var bt = require('@babel/types');

var build = require('vue-template-compiler/build');
import { parse as babelParse } from '@babel/parser';


// function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

// var traverse = require('@babel/traverse');
import traverse from "@babel/traverse";

// var traverse__default = _interopDefault(traverse);

export function sfcToAST(source, babelParserPlugins, jsFile) {
    const sfc = build.parseComponent(source),
        res = {};
    res.sourceType = sfc.script && sfc.script.lang ? sfc.script.lang : 'js';
    res.jsAst = babelParse(jsFile ? source : sfc.script.content, {
        sourceType: 'module', plugins: []
    });
    return res;
}

export function handleMethod(path, handler) {
    const properties = path.node.value.properties.filter(n => bt.isObjectMethod(n) || bt.isObjectProperty(n));
    properties.forEach(node => {
        const commentsRes = getComments(node);
        // Collect only methods that have @vuese annotations
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

export function parseJavascript(ast, options = {}) {
    traverse(ast, {
        ExportDefaultDeclaration(rootPath) {
            if (options.onDesc) {
                options.onDesc(getComponentDescribe(rootPath.node));
            }
            rootPath.traverse({
                ObjectProperty(path) {
                    const { onGetter, onAction, onMutation, onState } = options;
                    if (onGetter && isVueOption(path, 'getters')) {
                        handleMethod(path, onGetter);
                    }
                    if (onAction && isVueOption(path, 'actions')) {
                        handleMethod(path, onAction);
                    }
                    if (onMutation && isVueOption(path, 'mutations')) {
                        handleMethod(path, onMutation);
                    }
                    if (onState && isVueOption(path, 'state')) {
                        const properties = path.node.value.properties;
                        properties.forEach(node => {
                            const commentsRes = getComments(node);
                            const result = {
                                name: node.key.name,
                                describe: commentsRes.default
                            };
                            onState(result);
                        });
                    }
                },
            });
        }
    });
}

export function vueseParser(source, options = {}) {
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
        },
    };
    const finallyOptions = Object.assign(defaultOptions, options);
    if (astRes.jsAst) {
        parseJavascript(astRes.jsAst, finallyOptions);
    }
    return res;
}
