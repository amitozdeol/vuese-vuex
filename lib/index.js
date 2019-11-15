#!/usr/bin/env node

import path from 'path';
import fs from 'fs-extra';
import Log from 'log-horizon';

import genMarkdown from './genMarkdown';

const logger = Log.create();
const cli = require('cac')();

cli
    .command('gen', 'Generate vuex store documentation')
    .allowUnknownOptions()
    .action(async () => {
        await genMarkdown();
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
