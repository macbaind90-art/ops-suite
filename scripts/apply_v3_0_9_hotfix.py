from pathlib import Path
import re

index = Path('app/index.html')
s = index.read_text(encoding='utf-8')

# Version labels inside the packaged app.
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
  const staffingHtml=(groups||[]).map(g=>{
    const list=g.rows||[];
    const ge=list.filter(e=>!!getCode(e.id,today)).length;
    const gb=list.filter(e=>!getCode(e.id,today)).length;
    const gr=list.filter(e=>dashboardIsRdo(e,today)).length;
    return `<div class="stat-line"><strong>${esc(g.shift||'Unassigned')}</strong><span>${list.length} scheduled · ${ge} entered · ${gb} blank · ${gr} RDO</span></div>`;
  }).join('') || '<div class="mini-note">No staffing rows found for today.</div>';
  return `<div class="page-head"><div><div class="page-title">Security Operations Dashboard</div><div class="page-sub">${esc(env.user||'User')} @ ${esc(env.machine||'Machine')} · v3.0.9</div></div><div class="btn-group"><button onclick="navigate('data-health')">Run Data Health</button><button class="gold" onclick="backupEverything()">Backup Everything</button></div></div>
  <div class="grid cols-4"><div class="kpi"><div class="num">${entered}/${rows.length}</div><div class="lbl">Attendance Entered Today</div></div><div class="kpi"><div class="num">${blanks}</div><div class="lbl">Attendance Blanks</div></div><div class="kpi"><div class="num">${openPatterns}</div><div class="lbl">Open Attendance Patterns</div></div><div class="kpi"><div class="num">${health.critical}/${health.warning}</div><div class="lbl">Critical / Warning Health</div></div></div>
  <div class="grid cols-2"><div class="card"><div class="card-title">Attendance</div><div class="grid cols-3"><div class="kpi"><div class="num">${entered}</div><div class="lbl">Entered</div></div><div class="kpi"><div class="num">${blanks}</div><div class="lbl">Blank</div></div><div class="kpi"><div class="num">${rdos}</div><div class="lbl">RDO</div></div></div><div class="mini-note">Open patterns use discipline-review codes only: T, U, and UE.</div></div><div class="card"><div class="card-title">Staffing for Today</div>${staffingHtml}</div><div class="card"><div class="card-title">Task Watch</div><div class="grid cols-4"><div class="kpi"><div class="num">${activeTasks}</div><div class="lbl">Active</div></div><div class="kpi"><div class="num">${highTasks}</div><div class="lbl">High Priority</div></div><div class="kpi"><div class="num">${waitingTasks}</div><div class="lbl">Waiting / On Hold</div></div><div class="kpi"><div class="num">${archivedTasks}</div><div class="lbl">Completed / Archived</div></div></div></div><div class="card"><div class="card-title">Quick Actions</div><div class="toolbar"><button onclick="navigate('attendance'); activeAttView='daily'; safeRenderPages();">Daily Entry</button><button onclick="navigate('attendance'); activeAttView='grid'; safeRenderPages();">90-Day Grid</button><button onclick="navigate('attendance'); activeAttView='review'; safeRenderPages();">Attendance Review</button><button onclick="navigate('attendance'); activeAttView='patterns'; safeRenderPages();">Patterns</button><button onclick="navigate('roster')">Roster</button><button onclick="navigate('roster'); activeRosterView='schedule'; safeRenderPages();">Schedule</button><button onclick="navigate('tasks')">Task Tracker</button><button class="gold" onclick="backupEverything()">Backup Everything</button><button onclick="navigate('data-health')">Data Health</button><button onclick="navigate('other-programs')">Other Programs</button></div></div></div>`;
}
'''
s = s[:start] + render_home + s[end:]

roster_fallback = r'''
function renderRoster(){
  const views=['roster','schedule','training','uniforms'];
  const label=v=>v==='roster'?'Roster':v==='schedule'?'Schedule':v==='training'?'Training':'Uniforms';
  return `<div class="page-head"><div><div class="page-title">Roster</div><div class="page-sub">Staff records, master schedule, uniforms, training, and shared JSON autosave</div></div><div class="top-actions"><button onclick="saveRosterNow('manual')">Save Roster</button><button onclick="backupEverything()">Backup Everything</button></div></div><div class="subnav">${views.map(v=>`<button class="${activeRosterView===v?'active':''}" onclick="activeRosterView='${v}';safeRenderPages()">${label(v)}</button>`).join('')}</div>${activeRosterView==='schedule'?renderScheduleFallback():activeRosterView==='training'?renderTrainingFallback():activeRosterView==='uniforms'?renderUniformsFallback():renderRosterFallback()}`;
}
function rosterNameFallback(e){return e.name||[e.first,e.last].filter(Boolean).join(' ')||'Unnamed'}
function activeRosterRowsFallback(){return (roster.employees||[]).filter(e=>!e.archived&&e.status!=='Archived').slice().sort((a,b)=>String(a.shift||'').localeCompare(String(b.shift||''))||rosterNameFallback(a).localeCompare(rosterNameFallback(b)))}
function renderRosterFallback(){
  const rows=activeRosterRowsFallback();
  return `<div class="card"><div class="card-title">Active Roster</div><div class="table-wrap"><table class="roster-table"><thead><tr><th>Name</th><th>Rank</th><th>Shift</th><th>Section</th><th>RDO</th><th>Status</th></tr></thead><tbody>${rows.map(e=>`<tr><td class="td-name"><strong>${esc(rosterNameFallback(e))}</strong><br><small>${esc(e.eid||e.id||'')}</small></td><td>${esc(e.rank||e.title||'')}</td><td>${esc(e.shift||'')}</td><td>${esc(e.section||'')}</td><td>${esc(Array.isArray(e.rdo)?e.rdo.join(', '):(e.rdo||''))}</td><td>${esc(e.status||'Active')}</td></tr>`).join('')||'<tr><td colspan="6" class="empty">No active roster employees found.</td></tr>'}</tbody></table></div></div>`;
}
function renderScheduleFallback(){
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const rows=roster.schedule||[];
  return `<div class="card"><div class="card-title">Master Schedule</div><div class="notice">Use Remove to delete a schedule row only. This does not delete anyone from the roster.</div><div class="schedule-grid"><div class="sch-head">Post</div>${days.map(d=>`<div class="sch-head">${d}</div>`).join('')}${rows.map((row,idx)=>{const vals=Array.isArray(row.days)?row.days:days.map(d=>row[d]||row[d.toLowerCase()]||'');return `<div class="sch-post"><div>${esc(row.post||row.role||'Post')}<small>${esc(row.section||'')}</small></div><div class="sch-row-tools"><button class="sm danger" onclick="removeScheduleRowByIndex(${idx})">Remove</button></div></div>${days.map((d,i)=>`<div class="sch-cell"><div class="sch-name ${vals[i]?'':'none'}">${esc(vals[i]||'Open')}</div></div>`).join('')}`}).join('')||'<div class="sch-cell" style="grid-column:1 / -1">No schedule rows found.</div>'}</div></div>`;
}
function renderTrainingFallback(){return `<div class="card"><div class="card-title">Training</div><p class="mini-note">Training records are preserved in shared data. Full training controls will return in the next cleanup pass.</p></div>`}
function renderUniformsFallback(){return `<div class="card"><div class="card-title">Uniforms</div><p class="mini-note">Uniform records are preserved in shared data. Full print controls will return in the next cleanup pass.</p></div>`}
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
function openOtherProgramFallback(folder,file){
  const base=(settings&&settings.dataRoot?settings.dataRoot:'\\\\pig-fs\\Security\\MacBain\\Security Operations Suite')+'\\Programs';
  const path=base+'\\'+folder+'\\'+file;
  try{if(window.chrome&&window.chrome.webview){window.chrome.webview.postMessage({type:'openPath',payload:{path}});toast('Opening '+file);return}}catch(_){ }
  toast('Program path: '+path);
}
function renderDataHealth(){
  let h={critical:0,warning:0,items:[]};
  try{h=computeDataHealth()}catch(e){h={critical:1,warning:0,items:[{level:'critical',msg:e.message}]}}
  const items=h.items||h.findings||[];
  return `<div class="page-head"><div><div class="page-title">Data Health</div><div class="page-sub">Read-only integrity checks</div></div><button onclick="safeRenderPages()">Refresh</button></div><div class="grid cols-3"><div class="kpi"><div class="num">${h.critical||0}</div><div class="lbl">Critical</div></div><div class="kpi"><div class="num">${h.warning||0}</div><div class="lbl">Warning</div></div><div class="kpi"><div class="num">${items.length}</div><div class="lbl">Total Findings</div></div></div><div class="card"><div class="card-title">Findings</div>${items.length?items.map(i=>`<div class="log-row"><div>${esc(i.level||i.sev||'info')}</div><div>${esc(i.module||'System')}</div><div>${esc(i.msg||i.message||i.detail||'')}</div></div>`).join(''):'<p class="mini-note">No data health findings.</p>'}</div>`;
}
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
function removeScheduleRowByIndex(rowIndex){
  const idx=Number(rowIndex);
  if(!Number.isInteger(idx)||idx<0||idx>=(roster.schedule||[]).length){toast('Schedule row not found');return;}
  const row=roster.schedule[idx]||{};
  const label=[row.section,row.post,row.role,row.name].filter(Boolean).join(' / ')||('row '+(idx+1));
  if(!confirm('Remove schedule row: '+label+'? This removes the row from the schedule but does not delete anyone from the roster.'))return;
  roster.schedule.splice(idx,1);
  roster.audit=Array.isArray(roster.audit)?roster.audit:[];
  roster.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Removed schedule row',detail:label});
  saveRosterNow('remove-schedule-row').then(ok=>{if(ok){toast('Schedule row removed');safeRenderPages({preserveScroll:true})}});
}
function decorateScheduleRemoveButtons(){
  try{
    if(activeModule!=='roster'||activeRosterView!=='schedule')return;
    const posts=Array.from(document.querySelectorAll('#page-roster .sch-post'));
    posts.forEach((post,idx)=>{
      if(post.querySelector('.remove-schedule-row-btn'))return;
      const tools=post.querySelector('.sch-row-tools')||post;
      const btn=document.createElement('button');
      btn.type='button';btn.className='sm danger remove-schedule-row-btn';btn.textContent='Remove';btn.title='Remove this schedule row';
      btn.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();removeScheduleRowByIndex(idx)});
      tools.appendChild(btn);
    });
  }catch(e){console.warn('Schedule row remover decoration failed',e)}
}
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

# QA sweep: every render function referenced by renderModule must exist after patching.
called = set(re.findall(r'return\s+(render[A-Za-z0-9_]+)\(', s)) | set(re.findall(r'\?\s*(render[A-Za-z0-9_]+)\(', s)) | set(re.findall(r':\s*(render[A-Za-z0-9_]+)\(', s))
defined = set(re.findall(r'function\s+(render[A-Za-z0-9_]+)\s*\(', s))
required = {'renderHome','renderAttendance','renderRoster','renderTasks','renderDataHealth','renderRestoreCenter','renderChangeLog','renderOtherPrograms'}
missing = sorted((called | required) - defined)
if missing:
    raise SystemExit('QA failed. Missing renderer function(s): ' + ', '.join(missing))

index.write_text(s, encoding='utf-8')
print('Applied v3.0.9 hotfix to app/index.html')
print('QA render function sweep passed')
