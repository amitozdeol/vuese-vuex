#!/usr/bin/env node
// import genDocute from '@vuese/cli/genDocute'
// import genMarkdown from './genMarkdown'

import vuese from '@vuese/cli/dist';

const cli = require('cac')()

cli
  .command('gen', 'Generate target resources')
  .allowUnknownOptions()
  .action(async flags => {
      // console.log('ACTION');
      // console.log(genMarkdown);
    // const config = await getConfig(flags)
    // if (!['docute', 'markdown'].includes(config.genType as string)) {
    //   logger.error(`Please provide the correct genType: ${config.genType}`)
    // }
    // if (config.genType === 'docute') genDocute(config as CliOptions)
    // else if (config.genType === 'markdown') genMarkdown(config as CliOptions)
  })


const parsed = cli.parse()
