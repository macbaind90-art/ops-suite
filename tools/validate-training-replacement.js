'use strict';
const fs=require('fs'),vm=require('vm');
const source=fs.readFileSync('app/js/72-training-replacement.js','utf8');
const host=fs.readFileSync('MainForm.Training.cs','utf8');
const main=fs.readFileSync('MainForm.cs','utf8');
const profile=fs.readFileSync('app/js/20-data-core.js','utf8');
const registry=fs.readFileSync('MainForm.GovernedModules.cs','utf8');
const authorization=fs.readFileSync('MainForm.Authorization.cs','utf8');
const seed=JSON.parse(fs.readFileSync('app/seed/training-data.json','utf8'));
const context={console,Date,trainingSeed:seed,roster:{employees:[{id:1,first:'Alex',last:'Sample',shift:'Gate'}]},window:{},PWADCModuleRegistry:{register(){}},
  isArchivedEmployee:()=>false,fullName:e=>(e.first||'')+' '+(e.last||''),esc:s=>String(s??''),rosterEmployeeProfileLink:e=>e.first,
  screenGuide:()=>'',renderPeopleWorkflowNav:()=>'',hasCapability:()=>true};
vm.createContext(context);vm.runInContext(source,context);
const run=x=>vm.runInContext(x,context);
run('training=JSON.parse(JSON.stringify(trainingSeed))');
if(run('trainingReadinessForEmployee(roster.employees[0]).total')!==0)throw Error('Unassigned catalog items became false missing requirements');
run("training.assignments.push({id:'neo-assignment',employeeId:'1',requirementId:'neo',assignedAt:'2026-09-28T00:00:00Z',dueDate:'',status:'active',events:[]})");
const profileHtml=run('renderEmployeeProfileTraining(roster.employees[0])');
for(const action of ['New Employee Orientation','Edit due','Observe','Sign off','History']){
 if(!profileHtml.includes(action))throw Error('Profile Training record or action missing: '+action);
}
run('training.assignments.pop()');
run("training.assignments.push({id:'a',employeeId:'1',requirementId:'gate',assignedAt:'2026-09-28T00:00:00Z',dueDate:'',status:'active',events:[]})");
const status=()=>run("trainingAssignmentStatus(training.assignments[0],trainingRequirement('gate'))");
if(status()!=='Assigned')throw Error('Assignment must start as Assigned');
run("training.assignments[0].events.push({id:'observation',type:'record',date:'2026-09-28',at:'2026-09-28T10:00:00Z',actorId:'trainer',actorName:'Trainer',outcome:'Pass'})");
if(status()!=='Awaiting Signoff')throw Error('Passing observation cannot qualify without independent signoff');
run("training.assignments[0].events.push({id:'sign',type:'signoff',date:'2026-09-28',at:'2026-09-28T11:00:00Z',actorId:'senior',actorName:'Senior'})");
if(status()!=='Qualified')throw Error('Signoff must qualify the employee');
run("training.assignments[0].events.push({id:'retrain',type:'retrain',date:'2026-09-28',at:'2026-09-28T12:00:00Z',actorId:'trainer'})");
if(status()!=='In Progress')throw Error('Retraining must reopen qualification');
run("training.assignments[0].events.push({id:'correction',type:'void',at:'2026-09-28T13:00:00Z',reference:'sign',notes:'Correction reason'})");
if(run("trainingEffective(training.assignments[0],'signoff')")!==null)throw Error('Corrected signoff remains effective');
if(source.includes('DockCrosswalk')||JSON.stringify(seed).includes('Crosswalk'))throw Error('Retired Dock/Crosswalk seeded into new Training');
for(const text of ['suite:trainingCommand','training-data.json','Training changes must use protected training commands.']){
 const combined=fs.readFileSync('MainForm.Bridge.cs','utf8')+registry+authorization;if(!combined.includes(text))throw Error('Host boundary missing: '+text);
}
for(const text of ['RequireBridgeCapability(root, capability)','SaveModuleData("training"','A candidate cannot record or sign off their own training','passing observation after any retraining','independent signoff actor'])if(!host.includes(text))throw Error('Host authorization or evidence gate missing: '+text);
for(const text of ['AssignCurrentTrainingToCurrentEmployees()','currentRosterTrainingAssignedAt','existing.Add((employeeId, requirementId))','["events"] = new JsonArray()','SaveModuleData("training", data.ToJsonString(JsonOptions), loaded.Revision)','"updateDueDate"','oldDueDate','newDueDate']){
 if(!(host+main).includes(text))throw Error('Current-roster enrollment or due-date audit missing: '+text);
}
if(!profile.includes('renderEmployeeProfileTraining(re)')||!profile.includes("openTrainingRecordModal('','${esc(re.id)}')"))throw Error('Employee Profile does not wire direct Training controls.');
console.log('PASS governed Training workflow, separation, correction, and host authorization checks');
console.log('PASS Employee Profile Training controls and one-time current-roster enrollment contract');
