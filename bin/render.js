"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _markdownRender = _interopRequireDefault(require("@vuese/markdown-render"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
const htmlCommentRE = /<!--\s*@vuese:([a-zA-Z_][\w\-.]*|\[name\]):(\w+):start\s*-->[^]*<!--\s*@vuese:\1:\2:end\s*-->/;

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
  }

  renderMarkdown() {
    return renderMarkdown(this.render(), this.parserResult);
  }

}

exports.default = VuexRender;

