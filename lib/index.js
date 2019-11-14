#!/usr/bin/env node

import fg from 'fast-glob';
import path from 'path';
import fs from 'fs-extra';
import Log from 'log-horizon';

import VuexRender from './render';
import { vueseParser } from './parse';

const logger = Log.create();
const cli = require('cac')();

cli
    .command('gen', 'Generate vuex store documentation')
    .allowUnknownOptions()
    .action(async () => {
        let genType = 'docute',
            include = ['src/*.js'],
            exclude = [],
            outDir = 'website',
            markdownDir = 'components',
            markdownFile = '';
        logger.progress('Start creating markdown files...');
        if (typeof include === 'string') include = [include];
        if (typeof exclude === 'string') exclude = [exclude];
        exclude = exclude.concat('node_modules/**/*');
        const files = await fg(include.concat(exclude.map(p => `!${p}`)));
        files.map(async (p) => {
            const abs = path.resolve(p);
            const source = await fs.readFile(abs, 'utf-8');
            try {
                const parserRes = vueseParser(source, {
                    babelParserPlugins: {},
                    jsFile: abs.endsWith('.js')
                });
                const r = new VuexRender(parserRes);
                let markdownRes = r.renderMarkdown();
                if (!markdownRes)
                    return;
                let str = markdownRes.content;
                let compName = markdownRes.componentName
                    ? markdownRes.componentName
                    : path.basename(abs, '.vue');
                const groupName = markdownRes.groupName;
                str = str.replace(/\[name\]/g, compName);
                let targetDir = '';
                let targetFile = '';
                if (genType === 'markdown' && markdownDir === '*') {
                    targetDir = path.dirname(abs);
                    targetFile = markdownFile || compName;
                } else {
                    targetDir = path.resolve(outDir, '');
                    targetFile = compName;
                }
                const target = path.resolve(targetDir, targetFile + '.md');
                await fs.ensureDir(targetDir);
                await fs.writeFile(target, str);
                logger.success(`Successfully created: ${target}`);
                return {
                    compName,
                    groupName,
                    content: str
                };
            }
            catch (e) {
                logger.error(`The error occurred when processing: ${abs}`);
                logger.error(e);
            }
        });
    try {
        logger.progress('Adding store to vuese site');
        const filename = path.resolve('website/index.html'),
            indexSource = await fs.readFile(filename, 'utf-8'),
            reg = /JSON.parse\('(.*)'.replace\(.*\)/,
            matches = indexSource.match(reg),
            data = JSON.parse(matches[1].replace(/&#34;/g, '"'));
        data.push({title: 'Vuex', links: [{title: 'Store', link: '/store.js'}]});
        await fs.writeFile(filename, indexSource.replace(reg, JSON.stringify(data)));
        logger.success('Store added!');
    }
    catch (e) {
        logger.error('Error adding store to vuese site');
        logger.error(e);
    }
  });

cli.parse();
