const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function need(src,needle,msg){if(!src.includes(needle))throw new Error(msg+' Missing: '+needle)}
const core=read('app/js/20-data-core.js');
const roster=read('app/js/60-roster-schedule.js');
const training=read('app/js/70-training-uniforms.js');
const att=read('app/js/82-attendance-points.js');
const tasks=read('app/js/95-tasks-settings.js');
const css=read('app/assets/styles.css');
need(core,'function employeeProfileLink(','Shared employee profile link helper is missing.');
need(core,'function attendanceEmployeeProfileLink(','Attendance-to-profile helper is missing.');
need(core,'function employeeProfileLinkByName(','Schedule name-to-profile helper is missing.');
need(core,'event.stopPropagation();openEmployeeProfile','Profile links must stop propagation before navigating.');
need(roster,'${rosterEmployeeProfileLink(e)}</td>','Roster names are not linked to profiles.');
need(roster,'${rosterEmployeeProfileLink(e)} <span class="archive-badge">Archived</span>','Archived roster names are not linked.');
need(roster,'employeeProfileLinkByName(p.display)','Schedule employee names are not linked.');
need(training,'<div class="training-employee-name">${rosterEmployeeProfileLink(emp)}</div>','Training employee names are not linked.');
need(training,'<div class="card-title">${rosterEmployeeProfileLink(e)}</div>','Uniform employee names are not linked.');
need(training,'employeeProfileLink(r.id,r.employee)','Labor detail employee names are not linked.');
need(att,'${attendanceEmployeeProfileLink(e)}<span>${esc(e.title)}','Daily Attendance employee names are not linked.');
need(att,'${attendanceEmployeeProfileLink(emp)}','Attendance grid/review/action employee name helper does not use profile links.');
need(att,'attendance-point-grid-wrap','90-Day Grid dedicated sticky wrapper is missing.');
need(att,'attendanceEmployeeProfileLink(emp,n.employee||emp.name)','Doctor Note employee names are not linked.');
need(tasks,"employeeProfileLinkByName(t.assignedTo||t.owner||'')",'Task assignee names do not resolve to employee profiles when they match a roster employee.');
need(css,'.attendance-point-grid-wrap thead th{position:sticky;top:0','90-Day Grid date header is not sticky.');
need(css,'.attendance-point-grid-wrap thead th.name{left:0','90-Day Grid Employee corner header is not sticky in both axes.');
need(css,'.employee-profile-link{','Employee profile link styling is missing.');
console.log('PASS employee profile navigation + sticky Attendance header regression');
