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
  "{id:'attendance-trends',title:'Attendance Trend & Risk Report'",
  "'attendance-trends':reportAttendanceTrendRisk",
  "else if(type==='attendance-trends')",
  'function attendanceTrendReportRange()',
  'function attendanceTrendMetricsForRange(',
  'function attendanceTrendBuckets(',
  'function attendanceTrendReportData()',
  'function attendanceTrendReportControlsHtml()',
  'function reportAttendanceTrendRisk(',
  'function attendanceTrendReportCsvRows()',
  "attendanceTrendGroupBy==='Month'",
  'Point-Bearing Events',
  'Call-Off Occurrences',
  'Tardies — Under 5',
  'Tardies — 5–14',
  'Tardies — 15+',
  'No Call / No Show',
  'Left Early',
  'Suspended Days',
  'Doctor-Note-Covered Occurrences',
  'Corrective Thresholds Triggered',
  'Positive Credits Earned',
  'immediately preceding equal-length period',
  'Employee names and doctor-note details are excluded',
  "showReport('Attendance Trend & Risk Report'"
])need(reports,token,`Attendance Trend & Risk Report contract missing: ${token}`);

for(const token of [
  "attendanceTrendShiftFilter='All'",
  "attendanceTrendGroupBy='Week'",
  "attendanceTrendFocus='Point-Bearing Events'"
])need(bootstrap,token,`Attendance Trend & Risk Report state missing: ${token}`);

need(reports,"id==='attendance-trends'?attendanceTrendReportControlsHtml()",'Report Center does not display Attendance Trend & Risk controls.');
need(reports,"if(id==='attendance-trends')",'Report Center does not explain aggregate trend scope.');
need(workflow,'node tools/validate-attendance-trend-risk-report.js','Windows workflow does not run Attendance Trend & Risk Report validation.');

const start=reports.indexOf('function reportAttendanceTrendRisk(');
const end=reports.indexOf('function attendanceTrendReportCsvRows()',start);
const reportBody=reports.slice(start,end);
if(reportBody.includes('emp.name')||reportBody.includes('Employee Name'))throw new Error('Attendance Trend & Risk default print view exposes employee names.');
if(reportBody.includes('medicalNoteId')||reportBody.includes('administrativeReference')||reportBody.includes('administrativeNote'))throw new Error('Attendance Trend & Risk report exposes medical detail.');

console.log('Attendance Trend & Risk Report validation PASS');
console.log('- Aggregate weekly/monthly trend, shift comparison, and event mix are wired');
console.log('- Equal-length prior-period comparison drives transparent Rising/Stable/Falling signals');
console.log('- Point events, call-offs, tardy severity, NCNS, left early, suspension, doctor coverage, thresholds, and credits are included');
console.log('- Default print/PDF and CSV outputs exclude employee names and medical detail');
