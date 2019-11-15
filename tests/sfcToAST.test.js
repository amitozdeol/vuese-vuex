import * as bt from '@babel/types';
import { sfcToAST } from '../lib/parse';
import * as path from 'path';
import * as fs from 'fs';

function getAST(fileName, jsFile) {
  const p = path.resolve(__dirname, `./__fixtures__/src/${fileName}`);
  const source = fs.readFileSync(p, 'utf-8');
  return sfcToAST(source, { jsx: false }, jsFile);
}

test('The source type of `jsAst` is set to `js` if `jsFile` passed', () => {
  const sfc = getAST('store.js', true);
  expect(bt.isFile(sfc.jsAst)).toBe(true);
  expect(sfc.sourceType).toBe('js');
  expect(sfc.templateAst).toBe(undefined);
});

