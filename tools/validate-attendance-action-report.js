'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const need=(hay,needle,message)=>{if(!hay.includes(needle))throw new Error(message||`Missing: ${needle}`)};

const reports=read('app/js/40-reports-governance.js');
const bootstrap=read('app/js/10-bootstrap.js');
const workflow=read('.github/workflows/build-windows.yml');
new vm.Script(reports,{filename:'app/js/40-reports-governance.js'});

for(const token of [
  "{id:'attendance-actions',title:'Attendance Action Report'",
  "'attendance-actions':reportAttendanceAction",
  "else if(type==='attendance-actions')",
  'function attendanceActionReportRange()',
  'function attendanceActionReportRows()',
  'function attendanceActionReportControlsHtml()',
  'function reportAttendanceAction(',
  'function attendanceActionReportCsvRows()',
  "reportControlStatusValue('attendance-actions')==='Open Attention'",
  "['Due','Generated','Issued'].includes(x.status)",
  "const levels=['All','Notice','Final Warning','Below Threshold']",
  "if(id==='attendance-actions')return [['Open Attention','Open Attention']",
  'Most Recent Point Event',
  'Points Added in Period',
  'Points Reduced in Period',
  'Manual Current-Point Adjustment',
  'Doctor Note Relevant',
  'Doctor-note coverage is shown only as a Yes/No indicator',
  'No open action — acknowledgment complete',
  'Obtain acknowledgment or record outcome',
  'Report start date must be on or before the end date'
])need(reports,token,`Attendance Action Report contract missing: ${token}`);

for(const token of [
  "attendanceActionShiftFilter='All'",
  "attendanceActionLevelFilter='All'",
  "attendanceActionStatusFilter='Open Attention'"
])need(bootstrap,token,`Attendance Action Report state missing: ${token}`);

if(reports.includes('doctorNote.reference')||reports.includes('doctorNote.note')||reports.includes('medicalNote.reference'))throw new Error('Attendance Action Report exposes doctor-note detail.');
need(reports,"id==='attendance-actions'?attendanceActionReportControlsHtml()",'Report Center does not display Attendance Action Report filters.');
need(reports,"reportControlEmployeeValue('attendance-actions')",'Attendance Action Report does not apply employee scope.');
need(reports,"showReport('Attendance Action Report'",'Attendance Action Report print/PDF preview is not wired.');
need(workflow,'node tools/validate-attendance-action-report.js','Windows workflow does not run Attendance Action Report validation.');

console.log('Attendance Action Report validation PASS');
console.log('- Current attention queue uses Due, Generated, and Issued lifecycle states');
console.log('- Shift, required-level, lifecycle, and date-range filters are wired');
console.log('- Point additions/reductions, latest event, manual adjustment, and safe doctor-note indicator are present');
console.log('- Print/PDF and CSV outputs use the shared point and notice-lifecycle data');
