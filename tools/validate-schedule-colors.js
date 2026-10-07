'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const inputs=new Map();let modal='',csv=null,saved=null;
const context={console,Date,Intl,Map,Set,JSON,Promise,setTimeout,clearTimeout,
  document:{documentElement:{clientWidth:1400,clientHeight:900,setAttribute(){},style:{setProperty(){}}},getElementById:id=>inputs.get(id)||null,addEventListener(){},querySelectorAll(){return[]}},
  window:{addEventListener(){}},PWADCModuleRegistry:{register(){}}};
vm.createContext(context);
for(const name of ['10-bootstrap','20-data-core','30-shell-audits','40-reports-governance','50-workflows-home','60-roster-schedule','95-settings'])vm.runInContext(fs.readFileSync('app/js/'+name+'.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
run("screenGuide=()=>'';renderOperationsWorkflowNav=()=>'';safeRenderPages=()=>{};toast=()=>{};closeModal=()=>{};");
context.showModal=html=>{modal=html};context.downloadCSV=(name,rows)=>{csv=rows};
const row=(section,names)=>({section,post:'Post',days:[...names,...Array(7-names.length).fill('None')]});
const interleaved=[row('A',['SO Alpha','SO Beta']),row('B',['SO Other']),row('A',['SO Gamma','SO Delta'])];
run(`roster={schedule:${JSON.stringify(interleaved)}};scheduleWorkspaceMode='live';buildScheduleColorCache();`);
assert.equal(run("scheduleRowGroups()[0][1][1].days[0]"),'SO Gamma');
assert.ok(run("scheduleColorCache.graph.alpha.has('gamma') && scheduleColorCache.graph.alpha.has('delta')"),'Actual displayed vertical and diagonal neighbors must be connected');
assert.ok(run("empColorFromCell('SO Alpha')===empColorFromCell('SSO Alpha')"),'Rank prefix does not change employee color');
assert.equal(run('scheduleAdjacentColorConflicts().length'),0);
const seed=JSON.parse(fs.readFileSync('app/seed/roster-data.json','utf8'));
run(`roster=${JSON.stringify(seed)};buildScheduleColorCache();`);
const audit=run(`(()=>{let min=Infinity;for(const [a,neighbors] of Object.entries(scheduleColorCache.graph))for(const b of neighbors)min=Math.min(min,scheduleColorDistance(scheduleColorCache.byEmployee[a],scheduleColorCache.byEmployee[b]));return {min,colors:JSON.stringify(scheduleColorCache.byEmployee),conflicts:scheduleAdjacentColorConflicts().length}})()`);
assert.equal(audit.conflicts,0);assert.ok(audit.min>=.12,'Neighboring seed assignments must have meaningful perceptual separation: '+audit.min);
run('buildScheduleColorCache()');assert.equal(run('JSON.stringify(scheduleColorCache.byEmployee)'),audit.colors,'Colors must be deterministic on redraw');
run(`roster.scheduleDrafts=[{id:'draft',schedule:${JSON.stringify(interleaved)}}];scheduleWorkspaceMode='draft';scheduleWorkspaceDraftId='draft';buildScheduleColorCache();`);
assert.equal(run('scheduleAdjacentColorConflicts().length'),0);
assert.ok(run("scheduleColorCache.graph.alpha.has('delta')"),'Mock schedules use the same displayed-neighbor rule');

console.log('PASS displayed schedule order, diagonal neighbors, stable colors and mock schedules; minimum distance '+audit.min.toFixed(3));
