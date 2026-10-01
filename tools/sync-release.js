'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
if(!/^\d+\.\d+\.\d+$/.test(version))throw Error('VERSION must be Major.Feature.Minor');
const check=process.argv.includes('--check');let mismatches=[];
function sync(file,transform){const full=path.join(root,file),before=fs.readFileSync(full,'utf8'),after=transform(before);if(before!==after){if(check)mismatches.push(file);else fs.writeFileSync(full,after);}}
sync('MainForm.cs',s=>s.replace(/private const string AppVersion = "[\d.]+";/,`private const string AppVersion = "${version}";`));
sync('SecurityOperationsSuite.csproj',s=>s.replace(/<(Version|FileVersion|AssemblyVersion)>[\d.]+<\/\1>/g,(_,tag)=>`<${tag}>${version}${tag==='Version'?'':'.0'}</${tag}>`));
sync('README.md',s=>s.replace(/^# PWADC Security Operations Suite v[\d.]+/m,'# PWADC Security Operations Suite v'+version));
sync('app.manifest',s=>s.replace(/assemblyIdentity version="[\d.]+"/,`assemblyIdentity version="${version}.0"`));
for(const file of ['app/index.html',...fs.readdirSync(path.join(root,'app/js')).filter(f=>f.endsWith('.js')).map(f=>'app/js/'+f)])sync(file,s=>s.split('\n').map(line=>/^\s*(?:\/\*|\/\/)/.test(line)&&!line.includes('PWADC Security Operations Suite')?line:line.replace(/v\d+\.\d+\.\d+(?![\d.])/g,'v'+version)).join('\n'));
sync('app/seed/promotion-packets-data.json',s=>s.replace(/"lastWrittenByAppVersion": "[\d.]+"/,`"lastWrittenByAppVersion": "${version}"`));
if(mismatches.length)throw Error('Generated release files are stale. Run node tools/sync-release.js:\n'+mismatches.join('\n'));
console.log(`${check?'Checked':'Synchronized'} release ${version}.`);
