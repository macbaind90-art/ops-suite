/* v3.5.0.9 controlled retirement of legacy Attendance pattern/notice workflow */
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const attendanceBase=read('app/js/80-attendance.js');
const points=read('app/js/82-attendance-points.js');
const reports=read('app/js/40-reports-governance.js');
const bootstrap=read('app/js/10-bootstrap.js');
const health=read('app/js/30-shell-audits.js');
const dataCore=read('app/js/20-data-core.js');
const forbiddenLive=[
  'function renderPatterns','function renderAttendanceNotices','function attendancePatternFindings',
  'function computeFlags','function noticeKpis','function noticeRecords','function reportAttendancePatterns',
  "id:'patterns'","id:'notices'","activeAttView='patterns'","activeAttView='notices'"
];
for(const token of forbiddenLive){
  if(attendanceBase.includes(token)||reports.includes(token)||bootstrap.includes(token)||health.includes(token))throw new Error('Legacy Attendance workflow still live: '+token);
}
for(const token of ['renderPointDaily','renderPointGrid','renderPointReview','renderPointCorrectiveActions','attendancePointSnapshot','latestCorrectiveAction']){
  if(!points.includes(token))throw new Error('Current Attendance Point function missing: '+token);
}
if(!reports.includes("title:'Attendance Point Summary'"))throw new Error('Report Center is missing the current Attendance Point Summary.');
if(!reports.includes('Corrective Actions Due')||!reports.includes('Positive Credits Banked'))throw new Error('Current attendance point metrics are missing from reports.');
if(health.includes('Attendance Notices'))throw new Error('Data Health still presents legacy Attendance Notices as a live module.');
if(!health.includes('Attendance Points'))throw new Error('Data Health does not validate current Attendance Point controls.');
// Historical raw fields are intentionally preserved if they exist in old JSON; they are not initialized as live workflows.
for(const token of ['attendance.patternActions!==undefined','attendance.notices!==undefined','attendance.flagActions!==undefined']){
  if(!dataCore.includes(token))throw new Error('Historical Attendance compatibility preservation missing: '+token);
}
if(/attendance=\{[^\n]*patternActions|attendance=\{[^\n]*notices/.test(bootstrap))throw new Error('New in-memory Attendance state still initializes legacy pattern/notice workflows.');
console.log('Attendance legacy retirement validation PASS');
console.log('- Pattern / Notice / legacy flag workflows removed from live Attendance code');
console.log('- Report Center and Data Health use the Attendance Point System');
console.log('- Historical raw legacy JSON fields are preserved read-only when present');
