from pathlib import Path
import subprocess

BASE_REF = 'be4d40d059ed824b6c13aaa82dedaf9a6ca0908e'

old = subprocess.check_output(['git', 'show', f'{BASE_REF}:app/index.html'], text=True, encoding='utf-8')
current = Path('app/index.html').read_text(encoding='utf-8')

# Pull the working dashboard from current repaired build path if present. Otherwise use a safe embedded dashboard.
def extract_function(src, name):
    start = src.find(f'function {name}(){{')
    if start < 0:
        start = src.find(f'function {name}()' + '{')
    if start < 0:
        return None
    i = src.find('{', start)
    depth = 0
    for j in range(i, len(src)):
        if src[j] == '{':
            depth += 1
        elif src[j] == '}':
            depth -= 1
            if depth == 0:
                return src[start:j+1]
    return None

safe_helpers = r'''
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

dash_css = r'''
/* v3.0.10 Manager Dashboard polish */
.dashboard-grid{display:grid;grid-template-columns:minmax(320px,.95fr) minmax(380px,1.1fr) minmax(420px,1.1fr) minmax(330px,.9fr);gap:16px;align-items:stretch}.dashboard-grid .card{min-height:260px}.dash-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(170px,1fr));gap:14px;margin-bottom:16px}.dash-task-grid{display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:12px}.dash-task-grid .kpi{min-height:86px}.stat-line{display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid rgba(255,255,255,.07);padding:8px 0;font-size:13px}.stat-line strong{color:var(--text);white-space:nowrap}.stat-line span{color:var(--dim);text-align:right}.quick-actions-grid{display:flex;gap:8px;flex-wrap:wrap}.quick-actions-grid button{flex:0 0 auto}@media(max-width:1500px){.dashboard-grid{grid-template-columns:1fr 1fr}.dash-kpi-row{grid-template-columns:repeat(2,1fr)}.dash-task-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:900px){.dashboard-grid{grid-template-columns:1fr}.dash-kpi-row{grid-template-columns:1fr}.dash-task-grid{grid-template-columns:1fr}}
'''

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
  return `<div class="page-head"><div><div class="page-title">Security Operations Dashboard</div><div class="page-sub">${esc(env.user||'User')} @ ${esc(env.machine||'Machine')} · v3.0.10</div></div><div class="btn-group"><button onclick="navigate('data-health')">Run Data Health</button><button class="gold" onclick="backupEverything()">Backup Everything</button></div></div>
  <div class="dash-kpi-row"><div class="kpi"><div class="num">${entered}/${rows.length}</div><div class="lbl">Attendance Entered Today</div></div><div class="kpi"><div class="num">${blanks}</div><div class="lbl">Attendance Blanks</div></div><div class="kpi"><div class="num">${openPatterns}</div><div class="lbl">Open Attendance Patterns</div></div><div class="kpi"><div class="num">${health.critical}/${health.warning}</div><div class="lbl">Critical / Warning Health</div></div></div>
  <div class="dashboard-grid"><div class="card"><div class="card-title">Attendance</div><div class="grid cols-3"><div class="kpi"><div class="num">${entered}</div><div class="lbl">Entered</div></div><div class="kpi"><div class="num">${blanks}</div><div class="lbl">Blank</div></div><div class="kpi"><div class="num">${rdos}</div><div class="lbl">RDO</div></div></div><div class="mini-note">Open patterns use discipline-review codes only: T, U, and UE.</div></div><div class="card"><div class="card-title">Staffing for Today</div>${staffingHtml}</div><div class="card"><div class="card-title">Task Watch</div><div class="dash-task-grid"><div class="kpi"><div class="num">${activeTasks}</div><div class="lbl">Active</div></div><div class="kpi"><div class="num">${highTasks}</div><div class="lbl">High Priority</div></div><div class="kpi"><div class="num">${waitingTasks}</div><div class="lbl">Waiting / On Hold</div></div><div class="kpi"><div class="num">${archivedTasks}</div><div class="lbl">Completed / Archived</div></div></div></div><div class="card"><div class="card-title">Quick Actions</div><div class="quick-actions-grid"><button onclick="navigate('attendance'); activeAttView='daily'; safeRenderPages();">Daily Entry</button><button onclick="navigate('attendance'); activeAttView='grid'; safeRenderPages();">90-Day Grid</button><button onclick="navigate('attendance'); activeAttView='review'; safeRenderPages();">Attendance Review</button><button onclick="navigate('attendance'); activeAttView='patterns'; safeRenderPages();">Patterns</button><button onclick="navigate('roster')">Roster</button><button onclick="navigate('roster'); activeRosterView='schedule'; safeRenderPages();">Schedule</button><button onclick="navigate('tasks')">Task Tracker</button><button class="gold" onclick="backupEverything()">Backup Everything</button><button onclick="navigate('data-health')">Data Health</button><button onclick="navigate('other-programs')">Other Programs</button></div></div></div>`;
}
'''

s = old
for a, b in {
    'v3.0.8':'v3.0.10',
    'v3.0.7':'v3.0.10',
    'v3.0.9':'v3.0.10',
}.items():
    s = s.replace(a, b)
if 'v3.0.10 Manager Dashboard polish' not in s:
    s = s.replace('</style>', dash_css + '\n</style>', 1)
if 'function findRosterByScheduleName(' not in s:
    marker = 'function buildRosterIndexes(){'
    if marker not in s:
        raise SystemExit('Missing buildRosterIndexes marker')
    s = s.replace(marker, safe_helpers + '\n' + marker, 1)
start = s.index('function renderHome(){')
end = s.index('\nfunction renderAttendance', start)
s = s[:start] + render_home + s[end:]

# QA: required renderers from v3.0.7 plus dashboard helpers must exist.
required = ['renderHome','renderAttendance','renderRoster','renderTasks','renderDataHealth','renderRestoreCenter','renderChangeLog','renderOtherPrograms','findRosterByScheduleName','todayISO']
missing = [name for name in required if f'function {name}(' not in s]
if missing:
    raise SystemExit('Materialize QA failed. Missing: ' + ', '.join(missing))

Path('app/index.html').write_text(s, encoding='utf-8')
print('Materialized v3.0.10 app/index.html from v3.0.7 baseline plus new Manager Dashboard')
