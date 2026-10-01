'use strict';
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const validators=fs.readdirSync(__dirname).filter(f=>/^validate-.*\.js$/.test(f)&&f!=='validate-all.js').sort();
let failures=0;
for(const file of ['sync-release.js',...validators]){
  const args=[path.join(__dirname,file)];
  if(file==='sync-release.js')args.push('--check');
  if(file==='validate-promotion-portable-wizard.js')args.push('--write-fixtures');
  console.log('\nRunning '+file);
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
  if(result.error||result.status!==0){failures++;console.error('FAILED '+file,result.error||'');}
}
console.log(`\n${validators.length} validators; ${failures} failures (including generated-file checks).`);
process.exitCode=failures?1:0;
