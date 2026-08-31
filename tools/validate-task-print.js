'use strict';
const fs=require('fs');
const vm=require('vm');
const path=require('path');

const root=path.resolve(__dirname,'..');
const startupPath=path.join(root,'app','js','99-startup.js');
const startup=fs.readFileSync(startupPath,'utf8');
new vm.Script(startup,{filename:'app/js/99-startup.js'});

const requiredTokens=[
  'openTaskPrintModal',
  'setTaskPrintCols',
  'printTaskTrackerCustom',
  'taskPrintFilterSummary',
  'taskPrintColumnNames',
  'Current filtered view',
  'All task records',
  'PWADC Security Task Tracker',
  'renderTasksV3411Base',
  '<button onclick="openTaskPrintModal()">Print Tasks</button>',
  "printHtmlDirect('PWADC Security Task Tracker'"
];
for(const token of requiredTokens){
  if(!startup.includes(token))throw new Error('Task Tracker print contract missing: '+token);
}

const columnMatch=startup.match(/const taskPrintColumnNames=\[([^\]]+)\]/);
if(!columnMatch)throw new Error('Task print column list is missing.');
const columns=[...columnMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
const expected=['Project','Status','Priority','Category','Assigned To','Due','Follow-up','Blocked By','Next Action','Last Update'];
if(JSON.stringify(columns)!==JSON.stringify(expected))throw new Error('Task print columns changed unexpectedly: '+JSON.stringify(columns));
if(columns.includes('Actions'))throw new Error('Task Tracker Actions column must never be printable.');
if(!startup.includes("scope==='all'?taskPrintSort(tasks.tasks||[]):filteredTasks()"))throw new Error('Current-filtered Task Tracker print scope does not preserve filteredTasks().');
if(!startup.includes("cols.length>6?'landscape':'portrait'"))throw new Error('Task Tracker print orientation rule is missing.');
if(/saveTasks(?:Now)?\s*\(/.test(startup))throw new Error('Task Tracker print extension must remain read-only and cannot call task-save functions.');

console.log('Task Tracker print validation: PASS');
console.log('Selectable columns: '+columns.join(', '));
console.log('Actions column excluded: PASS');
console.log('Current filtered scope: PASS');
console.log('Read-only print extension: PASS');
