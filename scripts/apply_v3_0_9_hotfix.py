from pathlib import Path
import re

index = Path('app/index.html')
s = index.read_text(encoding='utf-8')

for old, new in {
    'PWADC Security Operations Suite v3.0.8': 'PWADC Security Operations Suite v3.0.9',
    'PWADC Security Operations Suite v3.0.7': 'PWADC Security Operations Suite v3.0.9',
    'Command Suite v3.0.8': 'Command Suite v3.0.9',
    'Command Suite v3.0.7': 'Command Suite v3.0.9',
    'COMMAND SUITE v3.0.8': 'COMMAND SUITE v3.0.9',
    'COMMAND SUITE v3.0.7': 'COMMAND SUITE v3.0.9',
    '· v3.0.8': '· v3.0.9',
    '· v3.0.7': '· v3.0.9',
}.items():
    s = s.replace(old, new)

css = r'''
/* v3.0.9 dashboard and roster flow polish */
.dashboard-grid{display:grid;grid-template-columns:minmax(320px,.95fr) minmax(380px,1.1fr) minmax(420px,1.1fr) minmax(330px,.9fr);gap:16px;align-items:stretch}.dashboard-grid .card{min-height:260px}.dash-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(170px,1fr));gap:14px;margin-bottom:16px}.dash-task-grid{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:12px}.dash-task-grid .kpi{min-height:86px}.stat-line{display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid rgba(255,255,255,.07);padding:8px 0;font-size:13px}.stat-line strong{color:var(--text);white-space:nowrap}.stat-line span{color:var(--dim);text-align:right}.quick-actions-grid{display:flex;gap:8px;flex-wrap:wrap}.quick-actions-grid button{flex:0 0 auto}.roster-wide{max-width:1920px}.roster-summary{display:grid;grid-template-columns:repeat(4,minmax(190px,1fr));gap:14px;margin-bottom:14px}.roster-actionbar{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.roster-control-grid{display:grid;grid-template-columns:minmax(260px,1.4fr) repeat(3,minmax(140px,.7fr)) auto;gap:10px;align-items:end}.roster-table-wrap{max-height:calc(100vh - 360px);overflow:auto;border:1px solid var(--border);border-radius:8px}.roster-table th{position:sticky;top:0;background:var(--surface2);z-index:1}.roster-table td,.roster-table th{white-space:nowrap}.roster-name-cell strong{display:block}.uniform-pill{display:inline-flex;margin:2px 3px 2px 0;padding:3px 8px;border-radius:999px;font-size:10px;font-weight:900;background:#203b2a;color:#91eaa4;border:1px solid #315f3e}.uniform-pill.ordered{background:#3d321e;color:#e8cd75;border-color:#69562a}.uniform-pill.needed{background:#432424;color:#ff9b9b;border-color:#6b3434}.schedule-board{display:grid;gap:18px}.schedule-section-box{border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--surface)}.schedule-section-header{display:flex;justify-content:space-between;align-items:center;background:var(--surface2);border-left:4px solid var(--red);padding:9px 12px;color:var(--red2);font-weight:900;text-transform:uppercase;letter-spacing:1px}.schedule-board-grid{display:grid;grid-template-columns:110px repeat(7,minmax(125px,1fr));gap:1px;background:var(--border)}.schedule-board-grid .sch-head,.schedule-board-grid .sch-post,.schedule-board-grid .sch-cell{border:0}.schedule-board-grid .sch-cell{min-height:48px;display:flex;align-items:center;justify-content:center}.schedule-board-grid .sch-name{font-weight:900}.schedule-board-grid .sch-name small{display:block;color:var(--gold);font-size:10px;margin-top:2px}.schedule-scroll{overflow:auto}@media(max-width:1500px){.dashboard-grid{grid-template-columns:1fr 1fr}.dash-kpi-row{grid-template-columns:repeat(2,1fr)}.dash-task-grid{grid-template-columns:repeat(2,1fr)}.roster-control-grid{grid-template-columns:1fr 1fr}.schedule-board-grid{min-width:980px}}@media(max-width:900px){.dashboard-grid,.roster-summary{grid-template-columns:1fr}.roster-control-grid{grid-template-columns:1fr}.dash-kpi-row{grid-template-columns:1fr}.dash-task-grid{grid-template-columns:1fr}}
'''
if 'v3.0.9 dashboard and roster flow polish' not in s:
    s = s.replace('</style>', css + '\n</style>', 1)

helpers = r'''
function findRosterByScheduleName(name){
  const key=scheduleNameToPersonKey(name);
  if(!key)return null;
  return rosterActiveEmployees().find(e=>{
    const keys=[fullName(e),rosterEmployeeAttendanceName(e),`${e.first||''} ${e.last||''}`,`${e.last||''}, ${e.first||''}`].map(scheduleNameToPersonKey);
    return keys.includes(key);
  })||null;
}
function todayISO(){return new Date().toISOString().slice(0,10)}
function dashboardTodayRows(){return activeAttendanceEmployees().slice().sort((a,b)=>shiftRank(a.shift)-shiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''))}
function dashboardIsRdo(emp,date){try{return !!(emp&&Array.isArray(emp.rdos)&&emp.rdos.includes(parseISO(date).getDay()))}catch(_){return false}}
function dashboardOpenPatternCount(){try{return attendancePatternFindings({includeAcknowledged:false}).length}catch(_){return 0}}
function isRdo(emp,date){return dashboardIsRdo(emp,date)}
'''
if 'function findRosterByScheduleName(' not in s:
    marker = 'function buildRosterIndexes(){'
    if marker not in s:
        raise SystemExit('Could not find buildRosterIndexes insertion point')
    s = s.replace(marker, helpers + '\n' + marker, 1)

if 'function renderHome(){' not in s:
    raise SystemExit('renderHome not found')
start = s.index('function renderHome(){')
end = s.index('\nfunction renderAttendance', start)
render_home = r'''function renderHome(){
  const health=computeDataHealth();
  const today=todayISO();
  const rows=dashboardTodayRows();
  const entered=rows.filter(e=>!!getCode(e.id,today)).length;
  const blanks=rows.filter(e=>!getCode(e.id,today)).length;
  const rdos=rows.filter(e=>dashboardIsRdo(e,today)).length;
  const openPatterns=dashboardOpenPatternCount();
  const allTasks=(tasks.tasks||[]);
  const activeTasks=allTasks.filter(t=>!['Complete','Archived','On Hold','Tabled'].includes(String(t.status||''))).length;
  const highTasks=allTasks.filter(t=>!['Complete','Archived'].includes(String(t.status||''))&&String(t.priority||'').toLowerCase()==='high').length;
  const waitingTasks=allTasks.filter(t=>['Waiting','Follow-up','On Hold','Tabled','Blocked'].includes(String(t.status||''))).length;
  const archivedTasks=allTasks.filter(t=>['Complete','Archived'].includes(String(t.status||''))).length;
  const groups=groupRowsByShift(rows);
  const staffingHtml=(groups||[]).map(g=>{const list=g.rows||[];const ge=list.filter(e=>!!getCode(e.id,today)).length;const gb=list.filter(e=>!getCode(e.id,today)).length;const gr=list.filter(e=>dashboardIsRdo(e,today)).length;return `<div class="stat-line"><strong>${esc(g.shift||'Unassigned')}</strong><span>${list.length} scheduled · ${ge} entered · ${gb} blank · ${gr} RDO</span></div>`;}).join('') || '<div class="mini-note">No staffing rows found for today.</div>';
  return `<div class="page-head"><div><div class="page-title">Security Operations Dashboard</div><div class="page-sub">${esc(env.user||'User')} @ ${esc(env.machine||'Machine')} · v3.0.9</div></div><div class="btn-group"><button onclick="navigate('data-health')">Run Data Health</button><button class="gold" onclick="backupEverything()">Backup Everything</button></div></div>
  <div class="dash-kpi-row"><div class="kpi"><div class="num">${entered}/${rows.length}</div><div class="lbl">Attendance Entered Today</div></div><div class="kpi"><div class="num">${blanks}</div><div class="lbl">Attendance Blanks</div></div><div class="kpi"><div class="num">${openPatterns}</div><div class="lbl">Open Attendance Patterns</div></div><div class="kpi"><div class="num">${health.critical}/${health.warning}</div><div class="lbl">Critical / Warning Health</div></div></div>
  <div class="dashboard-grid"><div class="card"><div class="card-title">Attendance</div><div class="grid cols-3"><div class="kpi"><div class="num">${entered}</div><div class="lbl">Entered</div></div><div class="kpi"><div class="num">${blanks}</div><div class="lbl">Blank</div></div><div class="kpi"><div class="num">${rdos}</div><div class="lbl">RDO</div></div></div><div class="mini-note">Open patterns use discipline-review codes only: T, U, and UE.</div></div><div class="card"><div class="card-title">Staffing for Today</div>${staffingHtml}</div><div class="card"><div class="card-title">Task Watch</div><div class="dash-task-grid"><div class="kpi"><div class="num">${activeTasks}</div><div class="lbl">Active</div></div><div class="kpi"><div class="num">${highTasks}</div><div class="lbl">High Priority</div></div><div class="kpi"><div class="num">${waitingTasks}</div><div class="lbl">Waiting / On Hold</div></div><div class="kpi"><div class="num">${archivedTasks}</div><div class="lbl">Completed / Archived</div></div></div></div><div class="card"><div class="card-title">Quick Actions</div><div class="quick-actions-grid"><button onclick="navigate('attendance'); activeAttView='daily'; safeRenderPages();">Daily Entry</button><button onclick="navigate('attendance'); activeAttView='grid'; safeRenderPages();">90-Day Grid</button><button onclick="navigate('attendance'); activeAttView='review'; safeRenderPages();">Attendance Review</button><button onclick="navigate('attendance'); activeAttView='patterns'; safeRenderPages();">Patterns</button><button onclick="navigate('roster')">Roster</button><button onclick="navigate('roster'); activeRosterView='schedule'; safeRenderPages();">Schedule</button><button onclick="navigate('tasks')">Task Tracker</button><button class="gold" onclick="backupEverything()">Backup Everything</button><button onclick="navigate('data-health')">Data Health</button><button onclick="navigate('other-programs')">Other Programs</button></div></div></div>`;
}
'''
s = s[:start] + render_home + s[end:]

roster_fallback = r'''
function renderRoster(){
  const views=['roster','schedule','training','uniforms','analytics'];
  const label=v=>v==='roster'?'Roster':v==='schedule'?'Schedule':v==='training'?'Training':v==='uniforms'?'Uniforms':'Analytics';
  const employees=activeRosterRowsFallback();
  const hourly=employees.filter(e=>String(e.type||'').toLowerCase()==='hourly').length;
  const salary=employees.filter(e=>String(e.type||'').toLowerCase()==='salary').length;
  const needs=employees.reduce((n,e)=>n+uniformItemsFallback(e).filter(u=>u.status!=='issued').length,0);
  return `<div class="page-head roster-wide"><div><div class="page-title">Roster</div><div class="page-sub">Staff records, schedule, training, uniforms, and labor analytics. This module uses the shared roster JSON and keeps the original Staff Manager workflow as the blueprint.</div></div><div class="roster-actionbar"><button>Import JSON</button><button>Use Packaged Latest JSON</button><button>Backup Now</button><button>Link Existing Attendance</button><button>Hide Sync Duplicates</button><button>Archive / Old Employees</button><button>Export CSV</button></div></div><div class="subnav">${views.map(v=>`<button class="${activeRosterView===v?'active':''}" onclick="activeRosterView='${v}';safeRenderPages()">${label(v)}</button>`).join('')}</div><div class="roster-summary"><div class="kpi"><div class="num">${employees.length}</div><div class="lbl">Employees</div></div><div class="kpi"><div class="num">${hourly}</div><div class="lbl">Hourly</div></div><div class="kpi"><div class="num">${salary}</div><div class="lbl">Salary</div></div><div class="kpi"><div class="num">${needs}</div><div class="lbl">Uniform Needs / Orders</div></div></div>${activeRosterView==='schedule'?renderScheduleFallback():activeRosterView==='training'?renderTrainingFallback():activeRosterView==='uniforms'?renderUniformsFallback():activeRosterView==='analytics'?renderRosterAnalyticsFallback():renderRosterFallback()}`;
}
function rosterNameFallback(e){return e.name||[e.first,e.last].filter(Boolean).join(' ')||'Unnamed'}
function rosterShiftLabelFallback(e){return e.shift||e.gateShift||e.section||''}
function activeRosterRowsFallback(){return (roster.employees||[]).filter(e=>!e.archived&&e.status!=='Archived').slice().sort((a,b)=>String(rosterShiftLabelFallback(a)).localeCompare(String(rosterShiftLabelFallback(b)))||rosterNameFallback(a).localeCompare(rosterNameFallback(b)))}
function uniformItemsFallback(e){const out=[];['shirt','pants','jacket','shoes'].forEach(k=>{const v=e[k]||e.uniform?.[k];if(v)out.push({name:k,value:v,status:String(v).toLowerCase().includes('need')?'needed':String(v).toLowerCase().includes('order')?'ordered':'issued'})});if(Array.isArray(e.uniforms))e.uniforms.forEach(u=>out.push({name:u.name||u.item||'Uniform',value:u.value||u.size||u.status||'',status:String(u.status||'issued').toLowerCase()}));return out}
function renderUniformPillsFallback(e){const items=uniformItemsFallback(e);return items.length?items.map(u=>`<span class="uniform-pill ${u.status==='ordered'?'ordered':u.status==='needed'?'needed':''}">${esc(u.name.toUpperCase())} ${esc(u.value)}</span>`).join(''):'<span class="mini-note">Not set</span>'}
function renderRosterFallback(){
  const rows=activeRosterRowsFallback();
  const shifts=['all',...Array.from(new Set(rows.map(rosterShiftLabelFallback).filter(Boolean)))];
  return `<div class="card"><div class="card-title">Roster Controls</div><div class="roster-control-grid"><div><label>Search</label><input placeholder="Name, EID, rank, shift..." oninput="rosterSearch=this.value;safeRenderPages()" value="${escAttr(rosterSearch||'')}"></div><div><label>Shift</label><select onchange="rosterShiftFilter=this.value;safeRenderPages()">${shifts.map(sh=>`<option value="${escAttr(sh)}" ${rosterShiftFilter===sh?'selected':''}>${sh==='all'?'All Shifts':esc(sh)}</option>`).join('')}</select></div><div><label>Rank</label><select><option>All Ranks</option></select></div><div><label>Type</label><select><option>All Types</option></select></div><div class="roster-actionbar"><button class="primary">+ Add Employee</button><button>Manage Ranks</button><button>Print Roster</button><button>Export CSV</button></div></div><div class="mini-note">Showing ${rows.length} active employee(s). Employee management, promote, merit, remove, import/export, and custom print remain staged for the next stable rebuild.</div></div><div class="roster-table-wrap"><table class="roster-table"><thead><tr><th>Name</th><th>EID</th><th>Rank</th><th>Shift</th><th>Gate Shift</th><th>Rate</th><th>Type</th><th>RDO</th><th>Uniform</th><th>DOH</th><th>DOP</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${rows.filter(e=>!rosterSearch||JSON.stringify(e).toLowerCase().includes(String(rosterSearch).toLowerCase())).filter(e=>!rosterShiftFilter||rosterShiftFilter==='all'||rosterShiftLabelFallback(e)===rosterShiftFilter).map(e=>`<tr><td class="roster-name-cell"><strong>${esc(rosterNameFallback(e))}</strong></td><td>${esc(e.eid||e.employeeId||e.id||'')}</td><td><span class="rank-pill">${esc(e.rank||e.title||'')}</span></td><td>${esc(e.shift||'')}</td><td>${esc(e.gateShift||'')}</td><td>${e.rate?('$'+esc(e.rate)):''}</td><td>${esc(e.type||'')}</td><td>${esc(Array.isArray(e.rdo)?e.rdo.join('/'):Array.isArray(e.rdos)?e.rdos.join('/'):e.rdo||'')}</td><td>${renderUniformPillsFallback(e)}</td><td>${esc(e.doh||e.hireDate||'')}</td><td>${esc(e.dop||e.promotionDate||'')}</td><td>${esc(e.notes||'')}</td><td><button class="sm">Edit</button> <button class="sm gold">Promote</button> <button class="sm">Merit</button> <button class="sm danger">Remove</button></td></tr>`).join('')||'<tr><td colspan="13" class="empty">No active roster employees found.</td></tr>'}</tbody></table></div>`;
}
function scheduleCellValueFallback(row,day,idx){if(Array.isArray(row.days))return row.days[idx]||'';return row[day]||row[day.toLowerCase()]||row[day.toUpperCase()]||row.assignments?.[day]||row.assignments?.[day.toLowerCase()]||''}
function renderScheduleFallback(){
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const rows=roster.schedule||[];
  const grouped={}; rows.forEach((r,i)=>{const sec=r.section||r.shift||r.group||'Schedule';(grouped[sec]=grouped[sec]||[]).push({...r,_idx:i})});
  return `<div class="page-head"><div><div class="page-title">Master Schedule</div><div class="page-sub">Click any cell to reassign. Non/Open cells can be reopened and assigned.</div></div><div class="roster-actionbar"><button>Share Schedule</button><button>Print Schedule</button><button>+ Add Row</button><button class="gold">+ Add Section</button></div></div><div class="schedule-scroll"><div class="schedule-board">${Object.entries(grouped).map(([sec,list])=>`<div class="schedule-section-box"><div class="schedule-section-header"><span>${esc(sec)}</span><span>${list.length} rows</span></div><div class="schedule-board-grid"><div class="sch-head">Post</div>${days.map(d=>`<div class="sch-head">${d}</div>`).join('')}${list.map(row=>`<div class="sch-post"><div>${esc(row.post||row.role||'Post')}<small>${esc(row.hours||'8 HRS')}</small></div><div class="sch-row-tools"><button class="sm danger" onclick="removeScheduleRowByIndex(${row._idx})">Remove</button></div></div>${days.map((d,i)=>{const val=scheduleCellValueFallback(row,d,i);const closed=String(val||'').toLowerCase()==='closed'||!val;return `<div class="sch-cell"><div class="sch-name ${closed?'none':''}">${closed?'Closed':esc(val)}${row.rank?`<small>${esc(row.rank)}</small>`:''}</div></div>`}).join('')}`).join('')}</div></div>`).join('')||'<div class="card"><div class="card-title">No Schedule Rows</div><p class="mini-note">No schedule rows found.</p></div>'}</div></div>`;
}
function renderTrainingFallback(){return `<div class="card"><div class="card-title">Training</div><p class="mini-note">Training records are preserved in shared data. Full training controls will return in the next cleanup pass.</p></div>`}
function renderUniformsFallback(){return `<div class="card"><div class="card-title">Uniforms</div><p class="mini-note">Uniform records are preserved in shared data. Full print controls will return in the next cleanup pass.</p></div>`}
function renderRosterAnalyticsFallback(){return `<div class="card"><div class="card-title">Analytics</div><p class="mini-note">Roster analytics are preserved for rebuild after v3.0.9 stabilization.</p></div>`}
'''
if 'function renderRoster(' not in s:
    marker = 'function renderModule(id){'
    if marker not in s:
        raise SystemExit('Could not find renderModule insertion point for renderRoster fallback')
    s = s.replace(marker, roster_fallback + '\n' + marker, 1)

module_fallbacks = r'''
function renderOtherPrograms(){
  const programs=typeof OTHER_PROGRAMS!=='undefined'?OTHER_PROGRAMS:[];
  return `<div class="page-head"><div><div class="page-title">Other Programs</div><div class="page-sub">Standalone audit and utility tools</div></div></div><div class="grid cols-3">${programs.map(p=>`<div class="card module-card"><h3>${esc(p.title||p.id||'Program')}</h3><p>${esc(p.purpose||'Standalone tool')}</p><div class="toolbar"><button onclick="openOtherProgramFallback('${escAttr(p.folder||'')}','${escAttr(p.file||'')}')">Open</button></div></div>`).join('')||'<div class="card"><div class="card-title">No Programs Configured</div><p class="mini-note">No standalone programs were found in the packaged configuration.</p></div>'}</div>`;
}
function openOtherProgramFallback(folder,file){const base=(settings&&settings.dataRoot?settings.dataRoot:'\\\\pig-fs\\Security\\MacBain\\Security Operations Suite')+'\\Programs';const path=base+'\\'+folder+'\\'+file;try{if(window.chrome&&window.chrome.webview){window.chrome.webview.postMessage({type:'openPath',payload:{path}});toast('Opening '+file);return}}catch(_){ }toast('Program path: '+path)}
function renderDataHealth(){let h={critical:0,warning:0,items:[]};try{h=computeDataHealth()}catch(e){h={critical:1,warning:0,items:[{level:'critical',msg:e.message}]}}const items=h.items||h.findings||[];return `<div class="page-head"><div><div class="page-title">Data Health</div><div class="page-sub">Read-only integrity checks</div></div><button onclick="safeRenderPages()">Refresh</button></div><div class="grid cols-3"><div class="kpi"><div class="num">${h.critical||0}</div><div class="lbl">Critical</div></div><div class="kpi"><div class="num">${h.warning||0}</div><div class="lbl">Warning</div></div><div class="kpi"><div class="num">${items.length}</div><div class="lbl">Total Findings</div></div></div><div class="card"><div class="card-title">Findings</div>${items.length?items.map(i=>`<div class="log-row"><div>${esc(i.level||i.sev||'info')}</div><div>${esc(i.module||'System')}</div><div>${esc(i.msg||i.message||i.detail||'')}</div></div>`).join(''):'<p class="mini-note">No data health findings.</p>'}</div>`}
function renderRestoreCenter(){return `<div class="page-head"><div><div class="page-title">Restore Center</div><div class="page-sub">Backup and restore controls</div></div></div><div class="card"><div class="card-title">Restore Center</div><p class="mini-note">Restore data is preserved. Full restore controls will return in the cleanup pass.</p><button class="gold" onclick="backupEverything()">Backup Everything</button></div>`}
function renderChangeLog(){return `<div class="page-head"><div><div class="page-title">Change Log</div><div class="page-sub">Combined audit trail</div></div></div><div class="card"><div class="card-title">Recent Activity</div><p class="mini-note">Change log data is preserved. Full filters will return in the cleanup pass.</p></div>`}
function renderTasks(){const rows=(tasks.tasks||[]);return `<div class="page-head"><div><div class="page-title">Task Tracker</div><div class="page-sub">Active and archived task tracking</div></div></div><div class="card"><div class="card-title">Tasks</div><div class="table-wrap"><table><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Owner</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${esc(t.title||t.name||'Task')}</td><td>${esc(t.status||'Open')}</td><td>${esc(t.priority||'')}</td><td>${esc(t.owner||'')}</td></tr>`).join('')||'<tr><td colspan="4">No tasks found.</td></tr>'}</tbody></table></div></div>`}
'''
for fn in ['renderOtherPrograms','renderDataHealth','renderRestoreCenter','renderChangeLog','renderTasks']:
    if f'function {fn}(' not in s:
        marker = 'function renderModule(id){'
        if marker not in s:
            raise SystemExit('Could not find renderModule insertion point for module fallbacks')
        s = s.replace(marker, module_fallbacks + '\n' + marker, 1)
        break

schedule_helpers = r'''
function removeScheduleRowByIndex(rowIndex){const idx=Number(rowIndex);if(!Number.isInteger(idx)||idx<0||idx>=(roster.schedule||[]).length){toast('Schedule row not found');return}const row=roster.schedule[idx]||{};const label=[row.section,row.post,row.role,row.name].filter(Boolean).join(' / ')||('row '+(idx+1));if(!confirm('Remove schedule row: '+label+'? This removes the row from the schedule but does not delete anyone from the roster.'))return;roster.schedule.splice(idx,1);roster.audit=Array.isArray(roster.audit)?roster.audit:[];roster.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Removed schedule row',detail:label});saveRosterNow('remove-schedule-row').then(ok=>{if(ok){toast('Schedule row removed');safeRenderPages({preserveScroll:true})}})}
function decorateScheduleRemoveButtons(){try{if(activeModule!=='roster'||activeRosterView!=='schedule')return;const posts=Array.from(document.querySelectorAll('#page-roster .sch-post'));posts.forEach((post,idx)=>{if(post.querySelector('.remove-schedule-row-btn'))return;const tools=post.querySelector('.sch-row-tools')||post;const btn=document.createElement('button');btn.type='button';btn.className='sm danger remove-schedule-row-btn';btn.textContent='Remove';btn.title='Remove this schedule row';btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();removeScheduleRowByIndex(idx)});tools.appendChild(btn)})}catch(e){console.warn('Schedule row remover decoration failed',e)}}
'''
if 'function removeScheduleRowByIndex(' not in s:
    marker = 'function renderAttendance(){'
    if marker not in s:
        raise SystemExit('Could not find renderAttendance insertion point')
    s = s.replace(marker, schedule_helpers + '\n' + marker, 1)

try:
    segment = s[s.index('function safeRenderPages'):s.index('function showStartupError')]
except ValueError:
    segment = ''
if 'decorateScheduleRemoveButtons();' not in segment:
    old = "renderPages();\n    if(preserveScroll){setTimeout(()=>window.scrollTo(sx,sy),0);}"
    new = "renderPages();\n    setTimeout(()=>{try{decorateScheduleRemoveButtons();}catch(_){ }},0);\n    if(preserveScroll){setTimeout(()=>window.scrollTo(sx,sy),0);}"
    if old in s:
        s = s.replace(old, new, 1)

called = set(re.findall(r'return\s+(render[A-Za-z0-9_]+)\(', s)) | set(re.findall(r'\?\s*(render[A-Za-z0-9_]+)\(', s)) | set(re.findall(r':\s*(render[A-Za-z0-9_]+)\(', s))
defined = set(re.findall(r'function\s+(render[A-Za-z0-9_]+)\s*\(', s))
required = {'renderHome','renderAttendance','renderRoster','renderTasks','renderDataHealth','renderRestoreCenter','renderChangeLog','renderOtherPrograms'}
missing = sorted((called | required) - defined)
if missing:
    raise SystemExit('QA failed. Missing renderer function(s): ' + ', '.join(missing))

index.write_text(s, encoding='utf-8')
print('Applied v3.0.9 hotfix to app/index.html')
print('QA render function sweep passed')
