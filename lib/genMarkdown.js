import path from 'path';
import fg from 'fast-glob';
import fs from 'fs-extra';
import Log from 'log-horizon';

import VuexRender from './render';
import { vueseParser } from './parse';

const logger = Log.create();

export default async function genMarkdown(include = ['src/*.js']) {
    let genType = 'docute',
        exclude = [],
        outDir = 'website',
        markdownDir = 'components',
        markdownFile = '';
    logger.progress('Start creating markdown files...');
    if (typeof include === 'string') include = [include];
    if (typeof exclude === 'string') exclude = [exclude];
    exclude = exclude.concat('node_modules/**/*');
    const files = await fg(include.concat(exclude.map(p => `!${p}`)));
    return await Promise.all(files.map(async (p) => {
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
    }));
}
