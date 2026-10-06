'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const inputs=new Map();let modal='',csv=null,saved=null;
const context={console,Date,Intl,Map,Set,JSON,Promise,setTimeout,clearTimeout,
  document:{documentElement:{clientWidth:1400,clientHeight:900,setAttribute(){},style:{setProperty(){}}},getElementById:id=>inputs.get(id)||null,addEventListener(){},querySelectorAll(){return[]}},
  window:{addEventListener(){}},PWADCModuleRegistry:{register(){}}};
vm.createContext(context);
for(const name of ['10-bootstrap','20-data-core','30-shell-audits','40-reports-governance','50-workflows-home','60-roster-schedule','95-tasks-settings'])vm.runInContext(fs.readFileSync('app/js/'+name+'.js','utf8'),context);
const run=code=>vm.runInContext(code,context);
run("screenGuide=()=>'';renderOperationsWorkflowNav=()=>'';safeRenderPages=()=>{};toast=()=>{};closeModal=()=>{};taskAudit=()=>{};");
context.showModal=html=>{modal=html};context.downloadCSV=(name,rows)=>{csv=rows};
context.saveTasksNow=async()=>{saved=run('JSON.stringify(tasks)');return true};
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

const task={id:1,project:'Fence',status:'In Progress',priority:'High',category:'Projects',dueDate:'',recurring:'None',lastUpdate:'Survey scheduled',update:'Survey scheduled',assignedTo:'Legacy assignee',owner:'Legacy owner',followUpDate:'2020-01-01',blockedBy:'Legacy blocker',nextAction:'Legacy action',customField:'Keep this'};
run(`tasks={tasks:[${JSON.stringify(task)}],nextId:2,audit:[]};normalizeTasks();`);
const page=run('renderTasks()');run('openTaskModal(1)');
for(const label of ['Assigned To','Follow-up','Blocked By','Next Action','Last Update']){
  assert.ok(!page.includes('<th>'+label+'</th>'));assert.ok(!modal.includes('<label>'+label));
}
assert.ok(page.includes('<th>Current Updates</th>')&&modal.includes('<label>Current Updates</label>'));
run('exportTasksCSV()');assert.deepEqual(Array.from(csv[0]),['Project','Status','Priority','Category','Due Date','Recurring','Current Updates','Updated At','Completed At','Archived At']);
for(const text of [run('weeklyTaskText()'),run('weeklyTaskHtml()'),csv.flat().join(' ')])for(const hidden of ['Legacy assignee','Legacy owner','Legacy blocker','Legacy action','2020-01-01'])assert.ok(!text.includes(hidden));
assert.equal(run('taskBucketLists().upcoming.length'),0,'Hidden legacy follow-up dates must not affect the weekly upcoming list');
for(const [id,value] of Object.entries({taskProject:'Fence',taskStatus:'In Progress',taskPriority:'Normal',taskCategory:'Projects',taskDue:'2026-10-20',taskRecurring:'None',taskLastUpdate:'Installer confirmed'}))inputs.set(id,{value});
run('saveTaskFromModal()');
const edited=JSON.parse(saved).tasks[0];
assert.equal(edited.lastUpdate,'Installer confirmed');assert.equal(edited.update,'Installer confirmed');
for(const key of ['assignedTo','owner','followUpDate','blockedBy','nextAction','customField'])assert.equal(edited[key],task[key],'Editing must preserve existing saved '+key);
run('openTaskModal();saveTaskFromModal()');assert.equal(JSON.parse(saved).tasks.length,2,'New tasks save without removed DOM inputs');
console.log('PASS displayed schedule order, diagonal neighbors, stable employee colors and mock schedules; minimum seed color distance '+audit.min.toFixed(3));
console.log('PASS simplified task form/table/CSV/weekly updates; edits and new tasks save while retaining legacy stored fields');
