import ts from 'typescript';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Execute the actual TypeScript handlers; replace only framework/service boundaries.
export async function loadSource(filename, replacements = {}) {
  const cache=new Map();
  async function moduleUrl(file) {
    if(cache.has(file)) return cache.get(file);
    const source=await readFile(file,'utf8');
    let code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    const matches=[...code.matchAll(/(?:from\s*|import\s*)(['"])([^'"]+)\1/g)];
    for(const match of matches) {
      const name=match[2]; let url;
      if(name in replacements) url='data:text/javascript;base64,'+Buffer.from(replacements[name]).toString('base64');
      else if(name.startsWith('@/') || name.startsWith('.')) {
        let target=name.startsWith('@/')?path.resolve(name.slice(2)):path.resolve(path.dirname(file),name);
        if(!path.extname(target)) target+='.ts';
        url=await moduleUrl(target);
      } else url=import.meta.resolve(name);
      code=code.replace(match[0],match[0].replace(name,url));
    }
    code+='\n//# sourceURL='+pathToFileURL(file).href;
    const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64'); cache.set(file,url); return url;
  }
  return import(await moduleUrl(path.resolve(filename)));
}
export class RedirectSignal extends Error { constructor(location) { super(location); this.location=location; } }
export const redirectMock="export function redirect(location) { throw new globalThis.__appTest.RedirectSignal(location); }";
