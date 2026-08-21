/* PWADC Security Operations Suite v3.3.0.2 | module: shell-audits */
function navModule(id){return MODULES.find(m=>m.id===id)}
function navGroupFor(id){return NAV_GROUPS.find(g=>(g.items||[]).includes(id))}
function renderNavGroup(g,visible){const items=(g.items||[]).map(id=>visible.find(m=>m.id===id)).filter(Boolean);if(!items.length)return '';if(items.length===1){const m=items[0];return `<button class="nav-single" data-module="${m.id}" onclick="navigate('${m.id}')">${esc(m.label)}</button>`;}return `<div class="nav-group" data-group="${esc(g.label)}"><button class="nav-group-btn" type="button">${esc(g.label)} ▾</button><div class="nav-menu">${items.map(m=>`<button data-module="${m.id}" onclick="navigate('${m.id}')">${esc(m.label)}</button>`).join('')}</div></div>`}
function renderShell(){const visible=visibleModules();const groupedIds=new Set(NAV_GROUPS.flatMap(g=>g.items||[]));const grouped=NAV_GROUPS.map(g=>renderNavGroup(g,visible)).join('');const ungrouped=visible.filter(m=>!groupedIds.has(m.id)).map(m=>`<button class="nav-single" data-module="${m.id}" onclick="navigate('${m.id}')">${esc(m.label)}</button>`).join('');document.getElementById('nav').innerHTML=grouped+ungrouped;updateNavActive();updateUserStatus()}
function updateNavActive(){document.querySelectorAll('.nav button[data-module]').forEach(b=>b.classList.toggle('active',b.dataset.module===activeModule));document.querySelectorAll('.nav-group').forEach(g=>{const active=!!g.querySelector(`button[data-module="${activeModule}"]`);const btn=g.querySelector('.nav-group-btn');if(btn)btn.classList.toggle('active',active);});}
function navigate(id){if(!canAccessModule(id)){toast('Access denied for '+id);id='home';}activeModule=id;updateNavActive();document.getElementById('moduleStatus').textContent=MODULES.find(m=>m.id===id)?.label||id;updateUserStatus();safeRenderPages()}
function renderPages(){ensureAllowedModule();const p=document.getElementById('pages');p.innerHTML=visibleModules().map(m=>`<section class="page ${activeModule===m.id?'active':''}" id="page-${m.id}">${renderModule(m.id)}</section>`).join('')}
function renderModule(id){if(id==='home')return renderHome();if(id==='start-here')return renderStartHere();if(id==='attendance')return renderAttendance();if(id==='roster')return renderRoster();if(id==='employee-profile')return renderEmployeeProfile();if(id==='training')return renderTrainingPage();if(id==='office-supplies')return renderOfficeSupplies();if(id==='shift-reports')return renderShiftReports();if(id==='shift-intelligence')return renderShiftIntelligence();if(id==='reports')return renderReports();if(id==='settings')return renderSettingsPage();if(id==='tasks')return renderTasks();if(id==='data-health')return renderDataHealth();if(id==='restore')return renderRestoreCenter();if(id==='change-log')return renderChangeLog();if(id==='other-programs')return renderOtherPrograms();return `<div class="page-head"><div><div class="page-title">${MODULES.find(m=>m.id===id)?.label||id}</div><div class="page-sub">Module not available.</div></div></div>`}

function renderAuditTool(id){
  if(id==='badge-audit') return renderBadgeAuditNative();
  if(id==='amag-audit') return renderSimpleNativeAudit('amag-audit','AMAG Audit','Native AMAG rebuild shell. Upload exports, document findings, and export the report. Full AMAG comparison logic is the next audit pass.');
  if(id==='access-audit') return renderSimpleNativeAudit('access-audit','Access Audit','Native Access Audit rebuild shell. Upload access review files, document findings, and export the report. Full comparison logic is the next audit pass.');
  return `<div class="page-head"><div><div class="page-title">Audit Module</div><div class="page-sub">Unknown audit module.</div></div></div>`;
}

let badgeAuditState={files:{punch:null,ts:null,gate:null,dispatch:null,recep:null},rows:[],findings:[],ranAt:''};
let simpleAuditState={};

function renderBadgeAuditNative(){
  return `<div class="native-audit">
    <div class="page-head">
      <div><div class="page-title">Badge Audit</div><div class="page-sub">Full Badge Audit v18 engine · drag/drop uploads · XLSX punch parsing · reader logs · original audit findings</div></div>
      <div class="btn-group">
        <button onclick="document.getElementById('badgeAuditFrame').contentWindow.location.reload()">Reload Tool</button>
        <button onclick="window.open('modules/badge-audit-native.html','_blank')">Open Standalone</button>
      </div>
    </div>
    <div class="notice audit-action-note">This module now uses the full Badge Audit v18 workflow instead of the temporary simplified parser. Use the drop zones inside the tool for punch details and reader logs.</div>
    <div class="audit-native-frame-wrap"><iframe id="badgeAuditFrame" class="audit-native-frame" src="modules/badge-audit-native.html"></iframe></div>
  </div>`;
}
function renderAuditDrop(key,title,desc,accept){
  const f=badgeAuditState.files&&badgeAuditState.files[key];
  return `<div class="drop-card"><h3>${esc(title)}</h3><p>${esc(desc)}</p><input type="file" accept="${accept}" onchange="handleNativeBadgeFile('${key}',this)"><div class="audit-status">${f?esc(f.name):'No file loaded'}</div></div>`;
}
async function handleNativeBadgeFile(key,input){
  const file=input&&input.files&&input.files[0]; if(!file)return;
  badgeAuditState.files[key]=file;
  toast(file.name+' loaded');
  safeRenderPages();
}
async function readAuditFile(file){
  if(!file)return '';
  return await file.text();
}
function parseCsvLine(line){
  const out=[];let cur='',q=false;
  for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}else if(ch===','&&!q){out.push(cur);cur='';}else cur+=ch;}
  out.push(cur);return out.map(x=>x.trim());
}
function rowsFromCsv(text){
  return String(text||'').split(/\r?\n/).filter(x=>x.trim()).map(parseCsvLine);
}
function normalizePersonName(s){
  s=String(s||'').trim().replace(/\s+/g,' ');
  if(!s)return '';
  if(s.includes(','))return s;
  const parts=s.split(' ');
  if(parts.length>=2)return parts.slice(-1)[0]+', '+parts.slice(0,-1).join(' ');
  return s;
}
function maybeDate(s){
  const d=new Date(s);return isNaN(d.getTime())?'':d.toISOString().slice(0,10);
}
function maybeTime(s){
  const m=String(s||'').match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
  if(!m)return '';
  let h=Number(m[1]),min=m[2],ap=(m[3]||'').toUpperCase();
  if(ap==='PM'&&h<12)h+=12;if(ap==='AM'&&h===12)h=0;
  return String(h).padStart(2,'0')+':'+min;
}
function minutesOf(t){const m=String(t||'').match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):null;}
async function runNativeBadgeAudit(){
  try{
    const punch=badgeAuditState.files.punch;
    if(!punch){toast('Badge audit needs the punch file first');return;}
    const punchText=await readAuditFile(punch);
    const punchRows=rowsFromCsv(punchText);
    if(!punchRows.length){toast('Punch file did not contain readable CSV/text rows');return;}
    const badgeFiles=['ts','gate','dispatch','recep'].filter(k=>badgeAuditState.files[k]);
    let badges=[];
    for(const k of badgeFiles){
      const txt=await readAuditFile(badgeAuditState.files[k]);
      for(const line of String(txt||'').split(/\r?\n/)){
        const date=maybeDate(line), time=maybeTime(line);
        if(!date||!time)continue;
        badges.push({date,time,line,source:k});
      }
    }
    const findings=[];
    const headers=punchRows[0].map(h=>String(h).toLowerCase());
    const nameIdx=headers.findIndex(h=>/name|employee/.test(h));
    const dateIdx=headers.findIndex(h=>/date/.test(h));
    const clockIdx=headers.findIndex(h=>/in|clock|punch|time/.test(h));
    for(const r of punchRows.slice(1)){
      const employee=normalizePersonName(r[nameIdx]||r[0]||'Unknown');
      const date=maybeDate(r[dateIdx]||r.join(' '));
      const clock=maybeTime(r[clockIdx]||r.join(' '));
      if(!date||!clock)continue;
      const sameDay=badges.filter(b=>b.date===date);
      if(!sameDay.length){findings.push({type:'No Badge Match',employee,date,clock,badge:'',source:'',notes:'No reader event found for this date in loaded logs'});continue;}
      const cm=minutesOf(clock);
      const prior=sameDay.filter(b=>minutesOf(b.time)!==null&&minutesOf(b.time)<=cm).sort((a,b)=>minutesOf(b.time)-minutesOf(a.time))[0];
      if(!prior){findings.push({type:'Clock-in Before Badge',employee,date,clock,badge:sameDay[0].time,source:sameDay[0].source,notes:'Clock time appears before first loaded badge event for that date'});}
    }
    badgeAuditState.findings=findings;
    badgeAuditState.ranAt=new Date().toISOString();
    safeRenderPages();toast('Badge audit complete: '+findings.length+' finding(s)');
  }catch(e){toast('Badge audit failed: '+e.message)}
}
function exportNativeBadgeAuditCSV(){
  const rows=[['Type','Employee','Date','Clock','Badge','Source','Notes'],...(badgeAuditState.findings||[]).map(x=>[x.type,x.employee,x.date,x.clock,x.badge,x.source,x.notes])];
  downloadCSV('PWADC_Badge_Audit_'+new Date().toISOString().slice(0,10)+'.csv',rows);
}
function printNativeBadgeAudit(){const html=`<html><head><title>PWADC Badge Audit</title></head><body><h1>PWADC Badge Audit</h1><p>Run: ${esc(new Date().toLocaleString())}</p>${document.querySelector('.native-audit .card:last-child')?.innerHTML||''}</body></html>`;const w=window.open('','_blank');w.document.write(html);w.document.close();w.print();}
function clearNativeBadgeAudit(){if(!confirm('Clear loaded Badge Audit files and findings?'))return;badgeAuditState={files:{punch:null,ts:null,gate:null,dispatch:null,recep:null},rows:[],findings:[],ranAt:''};safeRenderPages();}
function renderSimpleNativeAudit(id,title,desc){
  const st=simpleAuditState[id]||{files:[],findings:[]};
  simpleAuditState[id]=st;
  return `<div class="native-audit">
    <div class="page-head"><div><div class="page-title">${esc(title)}</div><div class="page-sub">${esc(desc)}</div></div><div class="btn-group"><button onclick="document.getElementById('${id}File').click()">Add Files</button><button onclick="addSimpleFinding('${id}')">Add Finding</button><button onclick="exportSimpleAudit('${id}','${esc(title)}')">Export CSV</button></div></div>
    <input id="${id}File" class="hidden" type="file" multiple onchange="handleSimpleAuditFiles('${id}',this)">
    <div class="grid cols-3"><div class="kpi"><div class="num">${st.files.length}</div><div class="lbl">Files Loaded</div></div><div class="kpi"><div class="num">${st.findings.length}</div><div class="lbl">Findings</div></div><div class="kpi"><div class="num">Native</div><div class="lbl">Module Type</div></div></div>
    <div class="card"><div class="card-title">Loaded Files</div>${st.files.length?st.files.map(f=>`<span class="result-pill">${esc(f)}</span>`).join(''):'<p class="muted">No files loaded.</p>'}</div>
    <div class="card"><div class="card-title">Findings / Notes</div>${st.findings.length?`<div class="findings-list">${st.findings.map((f,i)=>`<div class="finding-card"><div class="finding-title">${esc(f.title)}</div><div class="finding-meta">${esc(f.detail)}</div><div style="margin-top:8px"><button onclick="removeSimpleFinding('${id}',${i})">Remove</button></div></div>`).join('')}</div>`:'<p class="muted">No findings entered.</p>'}</div>
  </div>`;
}
function handleSimpleAuditFiles(id,input){const st=simpleAuditState[id]||{files:[],findings:[]};for(const f of Array.from(input.files||[]))st.files.push(f.name);simpleAuditState[id]=st;safeRenderPages();}
function addSimpleFinding(id){const title=prompt('Finding title:');if(!title)return;const detail=prompt('Finding details:')||'';const st=simpleAuditState[id]||{files:[],findings:[]};st.findings.push({title,detail,at:new Date().toISOString()});simpleAuditState[id]=st;safeRenderPages();}
function removeSimpleFinding(id,i){const st=simpleAuditState[id];if(!st)return;st.findings.splice(i,1);safeRenderPages();}
function exportSimpleAudit(id,title){const st=simpleAuditState[id]||{files:[],findings:[]};const rows=[['Audit','Files','Finding','Details'],...st.findings.map(f=>[title,st.files.join('; '),f.title,f.detail])];downloadCSV(title.replace(/\s+/g,'_')+'_'+new Date().toISOString().slice(0,10)+'.csv',rows);}
function reloadAuditFrame(id){const f=document.getElementById('frame-'+id);if(f)f.src=f.src}
function openAuditToolWindow(file){try{window.open(file,'_blank')}catch(e){showToast('Could not open standalone tool: '+e.message,true)}}

function normPersonName(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function rosterDisplayName(e){return fullName(e||{});}
function attendanceDisplayName(e){return String((e&&e.name)||'').trim();}
function scheduleNameToPersonKey(s){let x=String(s||'').trim();if(!x||['none','open','pending','closed'].includes(x.toLowerCase()))return '';x=x.replace(/^(SUPV|LSO|SSO|SO|PSO|APS|ONIN|RECEP|Receptionist)\s+/i,'').trim();if(x.includes(',')){let parts=x.split(',');x=(parts[1]+' '+parts[0]).trim();}return normPersonName(x);}
function buildRosterIndexes(){const active=(roster.employees||[]).filter(e=>!e.archived&&e.status!=='Archived');const archived=(roster.employees||[]).filter(e=>e.archived||e.status==='Archived');const byName=new Map(),archByName=new Map(),byId=new Map();active.forEach(e=>{byName.set(normPersonName(rosterDisplayName(e)),e);byId.set(String(e.id),e);});archived.forEach(e=>archByName.set(normPersonName(rosterDisplayName(e)),e));return{active,archived,byName,archByName,byId};}
function buildAttendanceIndexes(){const active=(attendance.employees||[]).filter(e=>e.active!==false&&!e.archived&&e.status!=='Archived');const archived=(attendance.employees||[]).filter(e=>e.active===false||e.archived||e.status==='Archived');const byName=new Map(),byId=new Map();active.forEach(e=>{byName.set(normPersonName(attendanceDisplayName(e)),e);byId.set(String(e.id),e);});return{active,archived,byName,byId};}
function findRosterEmployeeForAttendance(a){return findRosterEmployeeForAttendanceLoose(a);}
function computeDataHealth(){const issues=[];const add=(severity,module,title,detail)=>issues.push({severity,module,title,detail});const ri=buildRosterIndexes(),ai=buildAttendanceIndexes();
 const rosterNameCounts={},attNameCounts={},eidCounts={};
 for(const e of roster.employees||[]){const nk=normPersonName(rosterDisplayName(e));if(nk)rosterNameCounts[nk]=(rosterNameCounts[nk]||0)+1;const eid=String(e.eid||'').trim().toUpperCase();if(eid&&eid!=='ONIN'&&eid!=='AUTOMATION')eidCounts[eid]=(eidCounts[eid]||0)+1;if(!e.last&&!e.first)add('warning','Roster','Blank roster name','Roster employee id '+(e.id||'?')+' is missing first/last name.');if(!e.shift)add('warning','Roster','Missing shift',rosterDisplayName(e)+' does not have a shift.');if(!Array.isArray(e.rdo))add('warning','Roster','Invalid RDO',rosterDisplayName(e)+' has missing or invalid RDO values.');}
 for(const e of attendance.employees||[]){const nk=normPersonName(attendanceDisplayName(e));if(nk)attNameCounts[nk]=(attNameCounts[nk]||0)+1;if(!attendanceDisplayName(e))add('warning','Attendance','Blank attendance name','Attendance employee id '+(e.id||'?')+' is missing a name.');if(!e.shift)add('warning','Attendance','Missing shift',attendanceDisplayName(e)+' does not have a shift.');}
 Object.keys(rosterNameCounts).filter(k=>rosterNameCounts[k]>1).forEach(k=>add('warning','Roster','Duplicate roster name',k+' appears '+rosterNameCounts[k]+' times.'));
 Object.keys(attNameCounts).filter(k=>attNameCounts[k]>1).forEach(k=>add('warning','Attendance','Duplicate attendance name',k+' appears '+attNameCounts[k]+' times.'));
 Object.keys(eidCounts).filter(k=>eidCounts[k]>1).forEach(k=>add('critical','Roster','Duplicate EID',k+' appears '+eidCounts[k]+' times in active/archived roster data.'));
 for(const e of ri.active){if(!findAttendanceEmployeeForRosterLoose(e))add('info','Roster/Attendance','Roster employee not linked to Attendance',rosterDisplayName(e)+' is active in Roster but not confidently matched in Attendance.');}
 for(const e of ai.active){if(!findRosterEmployeeForAttendanceLoose(e))add('warning','Roster/Attendance','Attendance employee missing from active Roster',attendanceDisplayName(e)+' is active in Attendance but not confidently matched in active Roster.');}
 for(const e of ai.active){const key=normPersonName(attendanceDisplayName(e));if(key&&ri.archByName.has(key))add('critical','Roster/Attendance','Archived employee still active in Attendance',attendanceDisplayName(e)+' is archived in Roster but still active in Attendance.');}
 for(const row of roster.schedule||[]){for(const d of row.days||[]){const k=scheduleNameToPersonKey(d);if(!k)continue;const match=findRosterByScheduleName(d);if(!match)add('warning','Schedule','Schedule assignment not found in Roster',String(d)+' in '+(row.section||'Schedule')+' / '+(row.post||'post')+' does not match a roster employee.');else if(isArchivedEmployee(match))add('critical','Schedule','Archived person on schedule',String(d)+' appears on the schedule but is archived.');}}
 const topicById=new Map((roster.trainingTopics||[]).map(t=>[String(t.id),t]));for(const tr of roster.trainingRecords||[]){if(!ri.byId.has(String(tr.employeeId)))add('warning','Training','Training record for missing employee','Training record '+(tr.id||'?')+' points to employeeId '+(tr.employeeId||'?')+'.');const topic=topicById.get(String(tr.topicId));if(topic&&Number(topic.interval||topic.renewalDays||0)>0&&!tr.dueDate)add('warning','Training','Missing due date','Training record '+(tr.id||'?')+' is tied to renewable topic '+(topic.name||topic.title||tr.topicId)+' but has no due date.');if(tr.dueDate&&tr.dueDate<new Date().toISOString().slice(0,10))add('info','Training','Overdue training record','Training record '+(tr.id||'?')+' due '+tr.dueDate+'.');}
 for(const e of roster.employees||[]){const nm=rosterDisplayName(e);[['shirt','shirtStatus'],['pants','pantsStatus'],['jacket','jacketStatus']].forEach(pair=>{const size=e[pair[0]],status=String(e[pair[1]]||'').toLowerCase();if(['needed','ordered','issued'].includes(status)&&!size)add('warning','Uniforms','Uniform status without size',nm+' has '+pair[0]+' marked '+status+' but no size entered.');});}
 const today=new Date().toISOString().slice(0,10);
 for(const i of Array.isArray(roster.officeSupplies)?roster.officeSupplies:[]){if(!String(i.item||'').trim())add('warning','Office Supplies','Supply item missing name','An office supply record is missing an item name.');if(!i.archived){const qty=Number(i.qty||0),min=Number(i.minQty||0);if(qty<=0)add('warning','Office Supplies','Supply item out of stock',(i.item||'Unnamed supply')+' has quantity 0.');else if(min>0&&qty<=min)add('info','Office Supplies','Supply item low stock',(i.item||'Unnamed supply')+' is at or below minimum quantity.');if(String(i.status||'Auto')==='Ordered'&&!i.lastOrdered)add('info','Office Supplies','Ordered supply missing order date',(i.item||'Unnamed supply')+' is marked Ordered but has no last ordered date.');}}
 try{for(const u of getUniformItems('all')||[]){if(!String(u.item||'').trim())add('warning','Uniforms','Uniform item missing type','A uniform record has no item type.');if(!String(u.employeeId||'').trim())add('warning','Uniforms','Uniform item missing employee','A uniform record is not linked to an employee.');if(['needed','ordered','issued'].includes(String(u.status||'').toLowerCase())&&!String(u.size||'').trim())add('info','Uniforms','Uniform item missing size',(u.item||'Uniform item')+' for '+(((roster.employees||[]).find(e=>String(e.id)===String(u.employeeId))?fullName((roster.employees||[]).find(e=>String(e.id)===String(u.employeeId))):'')||u.employeeId||'unknown employee')+' has no size/identifier.');}}catch(_){ }
 for(const n of Array.isArray(attendance.notices)?attendance.notices:[]){if(!String(n.employeeId||'').trim())add('warning','Attendance Notices','Notice missing employee link','A notice record has no employeeId.');if(['Delivered','Acknowledged','Refused to Sign'].includes(String(n.status||''))&&!n.deliveredDate)add('info','Attendance Notices','Notice status missing delivered date',(n.employeeName||'Notice')+' is marked '+(n.status||'')+' but has no delivered date.');}
 for(const t of tasks.tasks||[]){const st=String(t.status||'');if(st!=='Complete'&&st!=='Completed'&&st!=='Archived'){if(t.dueDate&&t.dueDate<today)add('warning','Tasks','Overdue active task',(t.project||'Task')+' was due '+t.dueDate+'.');if(!t.status)add('warning','Tasks','Task missing status',(t.project||'Task')+' has no status.');if(!t.update&&!t.lastUpdate)add('info','Tasks','Task missing update',(t.project||'Task')+' has no current update.');if(['Blocked','Waiting'].includes(st)&&!String(t.blockedBy||'').trim())add('info','Tasks','Task blocked/waiting without blocker',(t.project||'Task')+' is '+st+' but does not list what it is blocked/waiting on.');}}
 const critical=issues.filter(i=>i.severity==='critical').length,warning=issues.filter(i=>i.severity==='warning').length,info=issues.filter(i=>i.severity==='info').length;return{issues,critical,warning,info,ok:critical===0&&warning===0};}
async function alignAttendanceNamesToRoster(){
  if(!confirm('Align Attendance employee names and basic fields to the Roster source of truth? This will NOT merge, delete, or erase attendance history. A backup will be created first.'))return;
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){console.warn('Pre-align backup failed',e)}
  let updated=0, linked=0, skipped=0;
  const activeRoster=rosterActiveEmployees();
  for(const re of activeRoster){
    const a=findAttendanceEmployeeForRosterLoose(re);
    if(!a){skipped++;continue;}
    const before=JSON.stringify({name:a.name,title:a.title,shift:a.shift,rdos:a.rdos,startDate:a.startDate,rosterId:a.rosterId});
    a.rosterId=String(re.id);
    a.name=rosterEmployeeAttendanceName(re);
    a.title=re.rank||a.title||'';
    a.shift=rosterShiftToAttendanceShift(re.shift)||a.shift||'';
    a.rdos=rosterRdoToAttendanceRdos(re.rdo);
    a.startDate=a.startDate||re.doh||re.dop||'';
    a.active=true;
    a.archived=false;
    a.status='Active';
    const after=JSON.stringify({name:a.name,title:a.title,shift:a.shift,rdos:a.rdos,startDate:a.startDate,rosterId:a.rosterId});
    if(before!==after)updated++;
    linked++;
  }
  attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
  attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Aligned Attendance names to Roster',detail:`Linked ${linked}, updated ${updated}, skipped ${skipped}. No history deleted or merged.`});
  const ok=await saveAttendanceNow('align-attendance-names');
  safeRenderPages();
  toast(ok?`Attendance names aligned: ${updated} updated, ${skipped} skipped.`:'Attendance alignment failed');
}

async function archiveAttendanceNotInRoster(){
  if(!canAdmin()){toast('Data fixes are Admin-only');return;}
  const missing=activeAttendanceEmployees().filter(e=>!findRosterEmployeeForAttendanceLoose(e));
  if(!missing.length){toast('No active Attendance employees are missing from the active Roster');return;}
  if(!confirm('Archive '+missing.length+' active Attendance employee(s) that are not found on the active Roster? Attendance history will stay preserved.'))return;
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){console.warn('Pre-fix backup failed',e)}
  for(const e of missing){e.active=false;e.archived=true;e.status='Archived';e.archivedAt=new Date().toISOString();e.archiveReason='Data Health: missing from active roster';}
  attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
  attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Data Health fix: archived attendance employees missing from roster',detail:`Archived ${missing.length}: ${missing.map(attendanceDisplayName).join(', ')}. History preserved.`});
  const ok=await saveAttendanceNow('health-archive-missing-roster');
  safeRenderPages();
  toast(ok?'Archived '+missing.length+' Attendance employee(s)':'Archive fix failed');
}
async function repairMissingEmployeeIds(){
  if(!canAdmin()){toast('Data fixes are Admin-only');return;}
  let rosterFixed=0,attendanceFixed=0,scheduleFixed=0;
  for(const e of roster.employees||[]){if(!e.id){e.id='emp'+Date.now()+Math.floor(Math.random()*100000);rosterFixed++;}}
  for(const e of attendance.employees||[]){if(!e.id){e.id='att'+Date.now()+Math.floor(Math.random()*100000);attendanceFixed++;}}
  for(const r of roster.schedule||[]){if(!r.id){r.id='sch'+Date.now()+Math.floor(Math.random()*100000);scheduleFixed++;}}
  if(!rosterFixed&&!attendanceFixed&&!scheduleFixed){toast('No missing IDs found');return;}
  if(!confirm(`Repair missing IDs? Roster: ${rosterFixed}, Attendance: ${attendanceFixed}, Schedule rows: ${scheduleFixed}. Backups will be created first.`))return;
  try{await SuiteBridge.send('suite:createBackup',roster,{module:'roster'});}catch(e){console.warn('Roster pre-fix backup failed',e)}
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){console.warn('Attendance pre-fix backup failed',e)}
  roster.audit=Array.isArray(roster.audit)?roster.audit:[];attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
  roster.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Data Health fix: repaired missing IDs',detail:`Roster employees ${rosterFixed}; schedule rows ${scheduleFixed}.`});
  attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Data Health fix: repaired missing IDs',detail:`Attendance employees ${attendanceFixed}.`});
  await saveRosterNow('health-repair-missing-ids');
  await saveAttendanceNow('health-repair-missing-ids');
  safeRenderPages();toast('Missing IDs repaired');
}
async function removeBlankScheduleRows(){
  if(!canAdmin()){toast('Data fixes are Admin-only');return;}
  const before=(roster.schedule||[]).length;
  const cleaned=(roster.schedule||[]).filter(r=>String(r.section||'').trim()||String(r.post||'').trim()||((r.days||[]).some(d=>String(d||'').trim())));
  const removed=before-cleaned.length;
  if(!removed){toast('No blank schedule rows found');return;}
  if(!confirm('Remove '+removed+' blank/invalid schedule row(s)? A Roster backup will be created first.'))return;
  try{await SuiteBridge.send('suite:createBackup',roster,{module:'roster'});}catch(e){console.warn('Roster pre-fix backup failed',e)}
  roster.schedule=cleaned;roster.audit=Array.isArray(roster.audit)?roster.audit:[];
  roster.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Data Health fix: removed blank schedule rows',detail:`Removed ${removed} blank/invalid schedule row(s).`});
  await saveRosterNow('health-remove-blank-schedule');safeRenderPages();toast('Removed '+removed+' schedule row(s)');
}
async function loadBackupStatusPanel(){
  backupStatusRows=[{module:'Attendance',status:'Loading'},{module:'Roster',status:'Loading'},{module:'Task Tracker',status:'Loading'},{module:'Shift Reports',status:'Loading'},{module:'Shift Intelligence',status:'Loading'},{module:'Suite Settings',status:'Loading'}];safeRenderPages();
  const modules=[['attendance','Attendance'],['roster','Roster'],['tasks','Task Tracker'],['shift-reports','Shift Reports'],['shift-intelligence','Shift Intelligence'],['suite-settings','Suite Settings']];
  const rows=[];
  for(const m of modules){
    try{const r=await SuiteBridge.send('suite:listBackups',{}, {module:m[0]});const b=(r.backups||[])[0];rows.push({module:m[1],status:b?'OK':'NO BACKUP',name:b?.name||'',modified:b?.modified||'',sizeBytes:b?.sizeBytes||0});}
    catch(e){rows.push({module:m[1],status:'ERROR',error:e.message});}
  }
  backupStatusRows=rows;safeRenderPages();
}
function backupStatusHtml(){
  if(!backupStatusRows)return '<div class="notice">Click <strong>Load Backup Status</strong> to check the newest backup by module.</div>';
  return `<div class="settings-table-wrap"><table><thead><tr><th>Module</th><th>Status</th><th>Newest Backup</th><th>Modified</th><th>Size</th></tr></thead><tbody>${backupStatusRows.map(r=>`<tr><td>${esc(r.module)}</td><td class="${r.status==='OK'?'ok':r.status==='Loading'?'warn':'bad'}">${esc(r.status)}</td><td>${esc(r.name||r.error||'')}</td><td>${esc(r.modified||'')}</td><td>${r.sizeBytes?Math.round(Number(r.sizeBytes)/1024)+' KB':''}</td></tr>`).join('')}</tbody></table></div>`;
}
function dataHealthFixPanel(){return `<div class="card"><div class="card-title">Fix Actions</div><div class="notice warn">Fix buttons create backups before changing live data. They preserve attendance history unless the action clearly says otherwise.</div><div class="toolbar" style="margin-top:10px"><button class="gold" onclick="alignAttendanceNamesToRoster()">Sync Roster to Attendance</button><button class="gold" onclick="archiveAttendanceNotInRoster()">Archive Attendance Not on Roster</button><button onclick="repairMissingEmployeeIds()">Repair Missing IDs</button><button onclick="removeBlankScheduleRows()">Remove Blank Schedule Rows</button></div></div>`;}
function bytesLabel(n){n=Number(n||0);if(n>=1048576)return (n/1048576).toFixed(1)+' MB';if(n>=1024)return Math.round(n/1024)+' KB';return n+' B'}
async function loadBackupManager(){backupManager={loading:true};safeRenderPages({preserveScroll:true});try{backupManager=await SuiteBridge.send('suite:backupInventory');}catch(e){backupManager={error:e.message};toast('Backup inventory failed: '+e.message);}safeRenderPages({preserveScroll:true})}
async function previewBackupCleanup(module){backupCleanupModule=module||backupCleanupModule||'all';backupCleanupPreview={loading:true};safeRenderPages({preserveScroll:true});try{backupCleanupPreview=await SuiteBridge.send('suite:previewBackupCleanup',{module:backupCleanupModule});}catch(e){backupCleanupPreview={error:e.message};toast('Cleanup preview failed: '+e.message);}safeRenderPages({preserveScroll:true})}
async function runBackupCleanup(){if(!backupCleanupPreview||backupCleanupPreview.loading||backupCleanupPreview.error){toast('Run cleanup preview first');return;}const count=Number(backupCleanupPreview.deleteCount||0);if(!count){toast('No cleanup candidates found');return;}if(!confirm(`Delete ${count} cleanup candidate backup file(s)? Manual, archive, legacy, and protected backups are kept.`))return;if(!confirm('Final confirmation: this deletes only the previewed cleanup candidates and writes a cleanup log. Continue?'))return;try{const r=await SuiteBridge.send('suite:cleanupBackups',{module:backupCleanupModule||'all'});toast(`Backup cleanup deleted ${r.deletedCount||0} file(s); recovered ${bytesLabel(r.bytesRecovered||0)}.`);backupCleanupPreview=null;await loadBackupManager();}catch(e){toast('Backup cleanup failed: '+e.message)}}
function backupManagerPanel(){const mods=[['all','All Modules'],['attendance','Attendance'],['roster','Roster'],['tasks','Task Tracker'],['shift-reports','Shift Reports'],['shift-intelligence','Shift Intelligence'],['suite-settings','Suite Settings']];let body='';if(!backupManager)body='<div class="notice">Click <strong>Load Backup Manager</strong> to inventory backup counts, sizes, types, and cleanup candidates.</div>';else if(backupManager.loading)body='<div class="notice">Loading backup inventory...</div>';else if(backupManager.error)body=`<div class="notice bad">${esc(backupManager.error)}</div>`;else body=`<div class="settings-kpi-grid"><div class="settings-kpi"><strong>${Number(backupManager.totalFiles||0)}</strong><span>Total Backups</span></div><div class="settings-kpi"><strong>${bytesLabel(backupManager.totalBytes||0)}</strong><span>Total Size</span></div><div class="settings-kpi"><strong>${Number(backupManager.totalCleanable||0)}</strong><span>Cleanup Candidates</span></div><div class="settings-kpi"><strong>${esc(backupManager.generatedAt||'')}</strong><span>Inventory Time</span></div></div><div class="notice" style="margin-top:10px">${esc(backupManager.policy||'')}</div><div class="settings-table-wrap" style="margin-top:10px"><table><thead><tr><th>Module</th><th>Total</th><th>Size</th><th>Newest</th><th>Oldest</th><th>Manual</th><th>Auto</th><th>Pre-Restore</th><th>Archive</th><th>Legacy</th><th>Cleanable</th></tr></thead><tbody>${(backupManager.rows||[]).map(r=>`<tr><td>${esc(r.label||r.module)}</td><td>${Number(r.count||0)}</td><td>${bytesLabel(r.sizeBytes||0)}</td><td>${esc(r.newest||'')}</td><td>${esc(r.oldest||'')}</td><td>${Number(r.manual||0)}</td><td>${Number(r.auto||0)}</td><td>${Number(r.preRestore||0)}</td><td>${Number(r.archive||0)}</td><td>${Number(r.legacy||0)}</td><td class="${Number(r.cleanable||0)?'warn':'ok'}">${Number(r.cleanable||0)}</td></tr>`).join('')}</tbody></table></div>`;let preview='';if(backupCleanupPreview){if(backupCleanupPreview.loading)preview='<div class="notice">Building cleanup preview...</div>';else if(backupCleanupPreview.error)preview=`<div class="notice bad">${esc(backupCleanupPreview.error)}</div>`;else preview=`<div class="notice ${Number(backupCleanupPreview.deleteCount||0)?'warn':'ok'}"><strong>${Number(backupCleanupPreview.deleteCount||0)}</strong> file(s) would be deleted, recovering <strong>${bytesLabel(backupCleanupPreview.deleteBytes||0)}</strong>. ${Number(backupCleanupPreview.keepCount||0)} file(s) would be kept.</div>${(backupCleanupPreview.delete||[]).length?`<details open class="details-panel"><summary>Files marked for cleanup</summary><div class="settings-table-wrap"><table><thead><tr><th>Module</th><th>Kind</th><th>Name</th><th>Modified</th><th>Size</th><th>Reason</th></tr></thead><tbody>${(backupCleanupPreview.delete||[]).slice(0,80).map(f=>`<tr><td>${esc(f.label||f.module)}</td><td>${esc(f.kind||'')}</td><td>${esc(f.name||'')}</td><td>${esc(f.modified||'')}</td><td>${bytesLabel(f.sizeBytes||0)}</td><td>${esc(f.reason||'')}</td></tr>`).join('')}</tbody></table></div></details>`:''}`;}return `<div class="card"><div class="card-title">Backup Manager</div><div class="notice">Backups use a tiered retention policy. Cleanup is never silent: preview first, confirm twice, then a cleanup log is written.</div><div class="toolbar" style="margin-top:10px"><button onclick="loadBackupManager()">Load Backup Manager</button><button class="gold" onclick="backupEverything().then(()=>loadBackupManager())">Backup Everything</button><select onchange="backupCleanupModule=this.value;backupCleanupPreview=null;safeRenderPages({preserveScroll:true})">${mods.map(m=>`<option value="${m[0]}" ${backupCleanupModule===m[0]?'selected':''}>${m[1]}</option>`).join('')}</select><button onclick="previewBackupCleanup(backupCleanupModule)">Preview Cleanup</button><button class="danger" onclick="runBackupCleanup()">Clean Up Previewed Files</button></div><div style="margin-top:10px">${body}</div><div style="margin-top:10px">${preview}</div></div>`}
function dataHealthBackupPanel(){return `<div class="card"><div class="card-title">Backup Status</div><div class="toolbar"><button onclick="loadBackupStatusPanel()">Load Backup Status</button><button class="gold" onclick="backupEverything()">Backup Everything</button><button onclick="SuiteBridge.send('suite:openPath',{path:settings.dataRoot+'\\\\Backups'}).catch(e=>toast('Open backup folder failed: '+e.message))">Open Backups</button></div><div style="margin-top:10px">${backupStatusHtml()}</div></div>`;}

async function loadModuleFileStatusPanel(){moduleFileStatusRows=[{label:'Loading live module files...',loading:true}];safeRenderPages({preserveScroll:true});try{const r=await SuiteBridge.send('suite:healthCheck');moduleFileStatusRows=r.moduleFiles||[];}catch(e){moduleFileStatusRows=[{label:'File status error',error:e.message||String(e)}];}safeRenderPages({preserveScroll:true});}
function moduleFileStatusHtml(){if(!moduleFileStatusRows)return '<div class="notice">Click <strong>Load File Status</strong> to inspect live JSON file paths, sizes, last saves, and newest backups.</div>';return `<div class="settings-table-wrap"><table><thead><tr><th>Module</th><th>Live File</th><th>Status</th><th>Size</th><th>Modified</th><th>Newest Data Date</th><th>lastSaved</th><th>Source</th><th>Newest Backup</th></tr></thead><tbody>${moduleFileStatusRows.map(r=>`<tr><td>${esc(r.label||r.module||'')}</td><td><div>${esc(r.fileName||'')}</div><div class="mini-note">${esc(r.path||'')}</div></td><td class="${r.exists?'ok':r.error?'bad':'warn'}">${r.error?esc(r.error):(r.exists?'EXISTS':'MISSING')}</td><td>${r.sizeBytes?Math.round(Number(r.sizeBytes)/1024)+' KB':''}</td><td>${esc(r.modified||'')}</td><td class="${r.newestDataDate?freshnessClass(r.newestDataDate,3,14):'warn'}">${esc(fmt(r.newestDataDate||''))}</td><td>${esc(r.lastSaved||'')}</td><td>${sourceBadge({source:r.sourceStatus||'unknown'})}</td><td><div>${esc(r.newestBackup||'')}</div><div class="mini-note">${esc(r.newestBackupModified||'')}</div></td></tr>`).join('')}</tbody></table></div>`;}
function dataHealthFilePanel(){return `<div class="card"><div class="card-title">Live Module Files</div><div class="notice">This panel verifies the real shared JSON files the desktop app is using. It is the quick sanity check before restore, cleanup, or build handoff work.</div><div class="toolbar" style="margin-top:10px"><button onclick="loadModuleFileStatusPanel()">Load File Status</button><button onclick="SuiteBridge.send('suite:openPath',{path:settings.dataRoot+'\\\\Data'}).catch(e=>toast('Open data folder failed: '+e.message))">Open Data Folder</button></div><div style="margin-top:10px">${moduleFileStatusHtml()}</div></div>`;}
PWADCModuleRegistry.register('shell-audits');
