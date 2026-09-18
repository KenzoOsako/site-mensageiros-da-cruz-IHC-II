import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const files=['package.json','package-lock.json','tsconfig.json','next.config.ts','next-env.d.ts','proxy.ts','.env.example','.gitignore','README.md'];
async function walk(dir) { for(const f of await readdir(dir,{withFileTypes:true})) { const p=path.join(dir,f.name); if(f.isDirectory()) await walk(p); else files.push(p); } }
for(const dir of ['app','components','lib','supabase','tests','scripts']) await walk(dir);
let diff='';
for(const file of files.sort()) { const name=file.replaceAll('\\','/'); const text=await readFile(file,'utf8'); const lines=text.trimEnd().split(/\r?\n/); diff+=`diff --git a/${name} b/${name}\nnew file mode 100644\n--- /dev/null\n+++ b/${name}\n@@ -0,0 +1,${lines.length} @@\n`+lines.map(l=>'+'+l).join('\n')+'\n'; }
await writeFile('tmp/review/first-version.diff',diff);
console.log(`Diff NO_VCS: ${files.length} arquivos, ${diff.length} caracteres.`);
