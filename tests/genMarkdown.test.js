import fs from 'fs-extra';

import genMarkdown from '../lib/genMarkdown';

test('genMarkdown returns correct data for file ', async () => {
    const result = await genMarkdown(['tests/__fixtures__/src/store.js']);
    expect(result[0].compName).toBe('store.js');
    expect(result[0].content).toEqual(await fs.readFile('tests/__fixtures__/expected.md', 'utf-8'));
});

