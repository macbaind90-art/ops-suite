/* PWADC Security Operations Suite v3.3.1.0 | module: data-core */
async function loadAttendance(){try{const res=await SuiteBridge.send('suite:loadModuleData',{}, {module:'attendance'});recordModuleLoadInfo('attendance',res);let raw=res.data;if(typeof raw==='string')attendance=JSON.parse(raw||'{}');else attendance=raw||{};normalizeAttendance();}catch(e){toast('Attendance load failed: '+e.message);normalizeAttendance()}}
function normalizeAttendance(){attendance.employees=Array.isArray(attendance.employees)?attendance.employees:[];attendance.attendance=attendance.attendance&&typeof attendance.attendance==='object'?attendance.attendance:{};attendance.notes=attendance.notes&&typeof attendance.notes==='object'?attendance.notes:{};attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];attendance.flagActions=attendance.flagActions&&typeof attendance.flagActions==='object'?attendance.flagActions:{};attendance.patternActions=attendance.patternActions&&typeof attendance.patternActions==='object'?attendance.patternActions:{};attendance.notices=Array.isArray(attendance.notices)?attendance.notices:[];attendance.nextNoticeId=Number(attendance.nextNoticeId||0)||((attendance.notices.reduce((m,n)=>Math.max(m,Number(n.id)||0),0))+1);attendance.settings={weekThreshold:3,monthThreshold:5,rollingThreshold:6,patternThreshold:3,...(attendance.settings||{})}}
function isIsoDateKey(d){return /^\d{4}-\d{2}-\d{2}$/.test(String(d||'')) && !Number.isNaN(Date.parse(String(d)+'T00:00:00'))}
function latestAttendanceDataDate(src=attendance){
  const store=src&&src.attendance&&typeof src.attendance==='object'?src.attendance:{};
  let latest='';
  for(const rec of Object.values(store)){
    if(!rec||typeof rec!=='object')continue;
    for(const [d,c] of Object.entries(rec)){
      const code=String(c||'').trim();
      if(!isIsoDateKey(d)||!code||code==='NE')continue;
      if(!latest||d>latest)latest=d;
    }
  }
  const saved=String(src&&src.lastSaved||'').slice(0,10);
  if(!latest && isIsoDateKey(saved))latest=saved;
  return latest || new Date().toISOString().slice(0,10);
}
function focusAttendanceOnLatestDataDate(){const d=latestAttendanceDataDate(attendance);entryDate=d;gridEnd=d;return d}
function recordModuleLoadInfo(module,res){
  moduleLoadInfo=moduleLoadInfo&&typeof moduleLoadInfo==='object'?moduleLoadInfo:{};
  moduleLoadInfo[module]={module,source:res&&res.source||'unknown',sourceDetail:res&&res.sourceDetail||'',path:res&&res.path||'',fileModified:res&&res.fileModified||'',loadedAt:res&&res.loadedAt||new Date().toLocaleString(),dataRoot:res&&res.dataRoot||settings.dataRoot||'',liveFileExisted:!!(res&&res.liveFileExisted)};
}
function markModuleImported(module,fileName,detail){moduleLoadInfo[module]={module,source:'imported-backup',sourceDetail:detail||('Imported JSON: '+(fileName||'')),path:fileName||'',fileModified:'',loadedAt:new Date().toLocaleString(),dataRoot:settings.dataRoot||''};}
function markModuleRestored(module,path){moduleLoadInfo[module]={module,source:'restored-backup',sourceDetail:'Restored from previewed backup.',path:path||'',fileModified:'',loadedAt:new Date().toLocaleString(),dataRoot:settings.dataRoot||''};}
function sourceKey(info){return String(info&&info.source||'unknown').toLowerCase();}
function sourceLabel(info){const k=sourceKey(info);if(k==='live-shared')return 'Live Shared Data';if(k.includes('packaged'))return 'Packaged Recovery Data';if(k.includes('imported'))return 'Imported Backup';if(k.includes('restored'))return 'Restored Backup';if(k==='missing')return 'Missing Data File';return 'Unknown Source';}
function sourceClass(info){const k=sourceKey(info);if(k==='live-shared')return 'source-live';if(k.includes('packaged'))return 'source-recovery';if(k.includes('imported'))return 'source-imported';if(k.includes('restored'))return 'source-imported';if(k==='missing')return 'source-missing';return 'source-unknown';}
function sourceBadge(info){return `<span class="source-badge ${sourceClass(info)}">${esc(sourceLabel(info))}</span>`}
function moduleLabel(id){return (MODULES.find(m=>m.id===id)||{}).label||({'shift-reports':'Shift Reports','shift-intelligence':'Shift Intelligence','suite-settings':'Suite Settings'}[id])||id;}
function newestDateFromArray(rows,keys=['date','reportDate','lastSeen','updatedAt','createdAt','at','dueDate']){let latest='';for(const item of rows||[]){if(!item||typeof item!=='object')continue;for(const key of keys){let raw=String(item[key]||'');let d=raw.length>=10?raw.slice(0,10):raw;if(isIsoDateKey(d)&&(!latest||d>latest))latest=d;}}return latest;}
function rosterNewestDate(){return newestDateFromArray([...(roster.employees||[]),...(roster.schedule||[]),...(roster.audit||[])])||String(roster.lastSaved||'').slice(0,10)||'';}
function shiftReportsNewestDate(){return newestDateFromArray([...(shiftReports.reports||[]),...(shiftReports.issues||[]),...(shiftReports.audit||[])])||String(shiftReports.lastSaved||'').slice(0,10)||'';}
function shiftIntelNewestDate(){return newestDateFromArray([...(shiftIntel.issues||[]),...(shiftIntel.intake||[]),...(shiftIntel.reference||[]),...(shiftIntel.audit||[])])||String(shiftIntel.lastSaved||'').slice(0,10)||'';}
function tasksNewestDate(){return newestDateFromArray([...(tasks.tasks||[]),...(tasks.audit||[])])||String(tasks.lastSaved||'').slice(0,10)||'';}
function daysSinceDate(d){if(!isIsoDateKey(d))return null;const a=new Date(d+'T00:00:00');const b=new Date();return Math.floor((new Date(b.getFullYear(),b.getMonth(),b.getDate())-a)/86400000);}
function freshnessClass(d,warningDays=3,badDays=10){const n=daysSinceDate(d);if(n===null)return 'stale-bad';if(n>badDays)return 'stale-bad';if(n>warningDays)return 'stale-warn';return 'ok';}
function moduleFreshnessRows(){return [
  {module:'attendance',label:'Attendance latest populated date',date:latestAttendanceDataDate(attendance),warn:2,bad:7},
  {module:'roster',label:'Roster newest change marker',date:rosterNewestDate(),warn:14,bad:45},
  {module:'shift-reports',label:'Newest Shift Report / issue date',date:shiftReportsNewestDate(),warn:3,bad:14},
  {module:'shift-intelligence',label:'Newest Shift Intelligence activity',date:shiftIntelNewestDate(),warn:3,bad:14},
  {module:'tasks',label:'Newest Task activity / due marker',date:tasksNewestDate(),warn:7,bad:30}
];}
function dataSourceBanner(){const attInfo=moduleLoadInfo.attendance||{};const recovery=Object.values(moduleLoadInfo||{}).filter(i=>sourceKey(i).includes('packaged')).length;const imported=Object.values(moduleLoadInfo||{}).filter(i=>sourceKey(i).includes('imported')||sourceKey(i).includes('restored')).length;const freshness=moduleFreshnessRows();return `<div class="data-source-strip"><div class="data-source-card primary"><div class="data-source-title">Current Data Source</div><div class="data-source-main">${sourceBadge(attInfo)} ${esc(sourceLabel(attInfo))}</div><div class="data-source-detail">Root: ${esc(settings.dataRoot||'Not set')}<br>${esc(attInfo.sourceDetail||'Loaded by the desktop bridge.')}</div></div><div class="data-source-card"><div class="data-source-title">Attendance Through</div><div class="data-source-main ${freshnessClass(freshness[0].date,2,7)}">${esc(fmt(freshness[0].date))}</div><div class="data-source-detail">Daily Entry and Review should open near this date after import or restore.</div></div><div class="data-source-card"><div class="data-source-title">Recovery Warning</div><div class="data-source-main ${recovery?'stale-warn':'ok'}">${recovery?recovery+' module(s)':'No recovery source'}</div><div class="data-source-detail">Packaged Recovery Data is for repair/demo use, not the normal live source.</div></div><div class="data-source-card"><div class="data-source-title">Imported / Restored</div><div class="data-source-main ${imported?'source-imported':''}">${imported?imported+' module(s)':'None this session'}</div><div class="data-source-detail">Imports and restores are labeled so old-data confusion is easier to spot.</div></div></div>`;}
function dataSourceClarityPanel(){const rows=['attendance','roster','tasks','shift-reports','shift-intelligence'].map(m=>{const i=moduleLoadInfo[m]||{};return `<tr><td>${esc(moduleLabel(m))}</td><td>${sourceBadge(i)}</td><td>${esc(i.fileModified||'')}</td><td>${esc(i.loadedAt||'')}</td><td><div>${esc(i.path||'')}</div><div class="mini-note">${esc(i.sourceDetail||'')}</div></td></tr>`}).join('');const fresh=moduleFreshnessRows().map(r=>`<div class="freshness-row"><span>${esc(r.label)}</span><span class="freshness-date ${freshnessClass(r.date,r.warn,r.bad)}">${esc(fmt(r.date||''))}</span></div>`).join('');return `<div class="card"><div class="card-title">Live Data Clarity</div><div class="notice">Use this panel when something looks old. It shows what source was loaded this session, where the live folder points, and the newest meaningful date found in each major module.</div><div class="data-source-detail" style="margin:10px 0"><strong>Configured data root:</strong> ${esc(settings.dataRoot||'Not set')}</div><div class="settings-table-wrap"><table><thead><tr><th>Module</th><th>Loaded Source</th><th>File Modified</th><th>Loaded At</th><th>Path / Detail</th></tr></thead><tbody>${rows}</tbody></table></div><div class="card" style="margin-top:12px"><div class="card-title">Freshness Summary</div>${fresh}</div><div class="toolbar"><button onclick="loadModuleFileStatusPanel()">Verify Live Files</button><button onclick="SuiteBridge.send('suite:openPath',{path:settings.dataRoot+'\\\\Data'}).catch(e=>toast('Open data folder failed: '+e.message))">Open Data Folder</button></div></div>`;}

function isArchivedAttendanceEmployee(e){return !!(e&&((e.archived===true)||(e.active===false)||(String(e.status||'').toLowerCase()==='archived')||(String(e.status||'').toLowerCase()==='sync duplicate')))}
function activeAttendanceEmployees(){return (attendance.employees||[]).filter(e=>!isArchivedAttendanceEmployee(e))}
async function loadRoster(){try{const res=await SuiteBridge.send('suite:loadModuleData',{}, {module:'roster'});recordModuleLoadInfo('roster',res);let raw=res.data;if(typeof raw==='string')roster=JSON.parse(raw||'{}');else roster=raw||{};normalizeRoster();}catch(e){toast('Roster load failed: '+e.message);normalizeRoster();}}
function normalizeRoster(){roster.employees=Array.isArray(roster.employees)?roster.employees:[];roster.schedule=Array.isArray(roster.schedule)?roster.schedule:[];roster.scheduleDrafts=Array.isArray(roster.scheduleDrafts)?roster.scheduleDrafts:[];roster.trainingTopics=Array.isArray(roster.trainingTopics)?roster.trainingTopics:[];roster.trainingRecords=Array.isArray(roster.trainingRecords)?roster.trainingRecords:[];roster.officeSupplies=Array.isArray(roster.officeSupplies)?roster.officeSupplies:[];roster.audit=Array.isArray(roster.audit)?roster.audit:[];normalizeTrainingConfiguration();for(const e of roster.employees){e.employmentClass=employmentClass(e);}roster.nextId=Number(roster.nextId||0)||((roster.employees.reduce((m,e)=>Math.max(m,Number(e.id)||0),0))+1);roster.nextTrainingTopicId=Number(roster.nextTrainingTopicId||0)||((roster.trainingTopics.reduce((m,t)=>Math.max(m,Number(t.id)||0),0))+1);roster.nextTrainingRecordId=Number(roster.nextTrainingRecordId||0)||((roster.trainingRecords.reduce((m,r)=>Math.max(m,Number(r.id)||0),0))+1);roster.nextOfficeSupplyId=Number(roster.nextOfficeSupplyId||0)||((roster.officeSupplies.reduce((m,r)=>Math.max(m,Number(r.id)||0),0))+1);}
function defaultTrainingTopics(){return [
  {name:'Security Department Orientation',intervalDays:0,warningDays:30,required:true,active:true,requirementGroup:'All',notes:'Required for all Security employees. No expiration unless policy changes.'},
  {name:'Emergency Procedures',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'All',notes:'Annual emergency response, evacuation, severe weather, and escalation review.'},
  {name:'Post Orders Review',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'All',notes:'Annual review of assigned post orders.'},
  {name:'Supervisor Standards',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'Supervisors',notes:'Required for supervisors and acting supervisors.'},
  {name:'Gate Post Training',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'Gate',notes:'Gate traffic, visitor/vendor flow, check-in, escalation, and gate controls.'},
  {name:'Base / EOC Training',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'BaseEOC',notes:'Base/EOC, camera review, access control coordination, radio traffic, and incident intake.'},
  {name:'Dock / Crosswalk Training',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'DockCrosswalk',notes:'Crosswalk, grocery/perishable dock safety, truck movement, and stop sign enforcement.'},
  {name:'Forklift / PLE Certification',intervalDays:365,warningDays:30,required:true,active:true,requirementGroup:'PLE',notes:'Required only for employees assigned or authorized to operate forklift/PLE equipment.'}
]}
function normalizeTrainingConfiguration(){
  const existing=(roster.trainingTopics||[]);
  const byName=new Map(existing.map(t=>[String(t.name||'').trim().toLowerCase(),t]));
  let nextTopicId=Math.max(0,...existing.map(t=>Number(t.id)||0),Number(roster.nextTrainingTopicId||0)-1)+1;
  for(const d of defaultTrainingTopics()){
    const key=d.name.toLowerCase();
    if(!byName.has(key)){const created={id:nextTopicId++,...d};existing.push(created);byName.set(key,created);}
  }
  const seenIds=new Set();
  roster.trainingTopics=existing.map((t,i)=>{let id=Number(t.id)||0;if(!id||seenIds.has(id))id=nextTopicId++;seenIds.add(id);return {id,name:t.name||('Training Topic '+(i+1)),intervalDays:Number(t.intervalDays)||0,warningDays:Number(t.warningDays||30)||30,required:t.required!==false,active:t.active!==false,requirementGroup:t.requirementGroup||inferTrainingRequirementGroup(t),requirementText:t.requirementText||'',notes:t.notes||''};});
  roster.trainingRecords=(roster.trainingRecords||[]).map((r,i)=>({id:r.id||i+1,employeeId:r.employeeId,topicId:r.topicId,completed:r.completed||'',due:r.due||'',trainer:r.trainer||'',notes:r.notes||''}));
}
function inferTrainingRequirementGroup(t){const n=String(t&&t.name||'').toLowerCase();if(n.includes('gate'))return 'Gate';if(n.includes('supervisor'))return 'Supervisors';if(n.includes('base')||n.includes('eoc')||n.includes('amag')||n.includes('access'))return 'BaseEOC';if(n.includes('dock')||n.includes('crosswalk'))return 'DockCrosswalk';if(n.includes('forklift')||n.includes('ple'))return 'PLE';return 'All'}
function isArchivedEmployee(e){return !!(e&&((e.archived===true)||(String(e.status||'').toLowerCase()==='archived')))}
function rosterActiveEmployees(){return (roster.employees||[]).filter(e=>!isArchivedEmployee(e))}

function employmentClass(e){
  e=e||{};
  let c=String(e.employmentClass||e.empClass||e.ftPtTemp||'').trim();
  const raw=c.toLowerCase().replace(/[\s\-_]/g,'');
  if(['ft','fulltime','full'].includes(raw))return 'FT';
  if(['pt','parttime','part'].includes(raw))return 'PT';
  if(['temptohire','temp','temporary','onin','aps'].includes(raw))return 'TempToHire';
  const type=String(e.type||'').toLowerCase();
  const rank=String(e.rank||'').toLowerCase();
  if(type.includes('onin')||type.includes('aps')||rank==='onin'||rank==='aps')return 'TempToHire';
  return 'FT';
}
function loadedCostRateForClass(cls){cls=String(cls||'').toLowerCase();if(cls==='pt')return Number(settings.ptLoadedRate??0.20);if(cls==='temptohire'||cls==='temp')return Number(settings.tempLoadedRate??0.35);return Number(settings.ftLoadedRate??0.33)}
function loadedCostPercent(cls){return Math.round(loadedCostRateForClass(cls)*100)+'%'}
function laborRateSummary(){return `FT ${loadedCostPercent('FT')}, PT ${loadedCostPercent('PT')}, TempToHire ${loadedCostPercent('TempToHire')}`}
function loadedHourlyRate(e){const base=Number(e&&e.rate||0);return base>0?base*(1+loadedCostRateForClass(employmentClass(e))):0}
function employmentClassCounts(list){const out={FT:0,PT:0,TempToHire:0};for(const e of list||[])out[employmentClass(e)]=(out[employmentClass(e)]||0)+1;return out}

function schedulePersonName(raw){
  let x=String(raw||'').trim();
  if(!x||['none','open','pending','closed'].includes(x.toLowerCase()))return '';
  x=x.replace(/^(SUPV|LSO|SSO|SO|PSO|APS|ONIN|RECEP|Receptionist)\s+/i,'').trim();
  if(x.includes(',')){
    const parts=x.split(',');
    x=(String(parts[1]||'')+' '+String(parts[0]||'')).trim();
  }
  return x.replace(/\s+/g,' ').trim();
}
function scheduleCellIsOpen(val){let low=String(val||'').trim().toLowerCase();return low==='open'||low==='pending'}
function scheduleCellIsBlank(val){let low=String(val||'').trim().toLowerCase();return !low||low==='none'||low==='closed'}
function scheduleSectionShift(section){section=String(section||'Unassigned');if(section.includes('1st'))return '1st';if(section.includes('2nd'))return '2nd';if(section.includes('3rd'))return '3rd';if(section.toLowerCase().includes('gate'))return 'Gate';if(section.toLowerCase().includes('dock'))return 'Dock';if(section.toLowerCase().includes('crosswalk'))return 'Crosswalk';if(section.toLowerCase().includes('reception'))return 'Reception';return section.split('—')[0].trim()||'Unassigned'}
function scheduleNameMatchesEmployee(raw,e){const cleaned=schedulePersonName(raw);if(!cleaned||!e)return false;const p=attendanceNameParts(cleaned);const sl=normalizeNameKey(p.last),sf=normalizeNameKey(p.first);const rp=attendanceNameParts(rosterEmployeeAttendanceName(e));const rl=normalizeNameKey(rp.last),rf=normalizeNameKey(rp.first);return !!(rl&&sl&&rl===sl&&firstNameCompatible(rf,sf))}
function employeeScheduledHours(e){let hours=0;for(const row of (roster.schedule||[])){let hrs=Number(row.hrs||8);for(const cell of (row.days||[])){if(!scheduleCellIsBlank(cell)&&!scheduleCellIsOpen(cell)&&scheduleNameMatchesEmployee(cell,e))hours+=hrs;}}return hours}
function employeeExpectedFallbackHours(e){let cls=employmentClass(e);if(cls==='PT')return 24;return 40}
function employeeCostProfile(e){let hours=employeeScheduledHours(e);let source='schedule only';let baseWeek=(Number(e&&e.rate||0)||0)*hours;let loadedWeek=loadedHourlyRate(e)*hours;let baseMonth=baseWeek*Number(settings.monthlyMultiplier||4.333),loadedMonth=loadedWeek*Number(settings.monthlyMultiplier||4.333),baseYear=baseWeek*Number(settings.annualMultiplier||52),loadedYear=loadedWeek*Number(settings.annualMultiplier||52);return{hours,source,baseWeek,loadedWeek,baseMonth,loadedMonth,baseYear,loadedYear,loadedAddOn:loadedWeek-baseWeek}}
function employeeCostRows(list){return (list||[]).slice().sort((a,b)=>fullName(a).localeCompare(fullName(b))).map(e=>{const c=employeeCostProfile(e);return{employee:fullName(e),eid:e.eid||'',shift:e.shift||'',rank:e.rank||'',class:employmentClass(e),rate:Number(e.rate||0),hours:c.hours,source:c.source,baseWeek:c.baseWeek,loadedWeek:c.loadedWeek,baseMonth:c.baseMonth,loadedMonth:c.loadedMonth,baseYear:c.baseYear,loadedYear:c.loadedYear}})}

function employeeProfileKey(e){return String(e&&e.id!==undefined?e.id:'')}
function activeProfileRosterEmployee(){return (roster.employees||[]).find(e=>String(e.id)===String(activeEmployeeProfileId))||null}
function attendanceEmpKeyFromName(name){const p=attendanceNameParts(name||'');return compactPersonKey(p.last,p.first)}
function rosterKeyForEmployee(e){const p=attendanceNameParts(rosterEmployeeAttendanceName(e)||fullName(e));return compactPersonKey(p.last,p.first)}
function attendanceEmployeeForRoster(re){if(!re)return null;const rk=rosterKeyForEmployee(re);return (attendance.employees||[]).find(a=>attendanceEmpKeyFromName(a.name)===rk)||null}
function rosterEmployeeForAttendance(ae){if(!ae)return null;const ak=attendanceEmpKeyFromName(ae.name);return (roster.employees||[]).find(r=>rosterKeyForEmployee(r)===ak)||null}
function rosterEmployeeById(id){return (roster.employees||[]).find(e=>String(e.id)===String(id)||String(e.rosterId||'')===String(id))||null}
function employeeProfileRecord(){let rosterEmp=activeProfileRosterEmployee();let attendanceEmp=null;if(rosterEmp)attendanceEmp=attendanceEmployeeForRoster(rosterEmp);else{attendanceEmp=(attendance.employees||[]).find(e=>String(e.id)===String(activeEmployeeProfileId))||null;rosterEmp=rosterEmployeeForAttendance(attendanceEmp)}return{rosterEmp,attendanceEmp};}
function globalEmployeeSearchRows(){const q=String(employeeSearch||'').toLowerCase().trim();if(q.length<2)return[];const seen=new Set(),rows=[];for(const e of roster.employees||[]){const blob=[fullName(e),e.eid,e.rank,e.shift,e.gateShift,e.type,employmentClass(e),e.status].join(' ').toLowerCase();if(blob.includes(q)){seen.add('r'+e.id);rows.push({id:e.id,name:fullName(e),meta:[e.rank,e.shift,employmentClass(e),e.eid].filter(Boolean).join(' · '),source:'Roster'});}}
for(const a of attendance.employees||[]){const re=rosterEmployeeForAttendance(a);const id=re?re.id:a.id;if(seen.has('r'+id))continue;const blob=[a.name,a.title,a.shift,a.status].join(' ').toLowerCase();if(blob.includes(q)){rows.push({id:id,name:a.name||'Unknown',meta:[a.title,a.shift,a.status].filter(Boolean).join(' · '),source:'Attendance'});}}
return rows.slice(0,12);}
function renderGlobalSearchResults(){const box=document.getElementById('globalEmployeeResults');const input=document.getElementById('globalEmployeeSearch');if(input&&input.value!==employeeSearch)input.value=employeeSearch||'';if(!box)return;const rows=globalEmployeeSearchRows();if(!String(employeeSearch||'').trim()){box.classList.remove('show');box.innerHTML='';return;}box.classList.add('show');box.innerHTML=rows.length?rows.map(r=>`<div class="employee-search-item" onclick="openEmployeeProfile('${esc(r.id)}')"><div><div class="employee-search-name">${esc(r.name)}</div><div class="employee-search-meta">${esc(r.meta||'No details')}</div></div><div class="employee-search-meta">${esc(r.source)}</div></div>`).join(''):`<div class="employee-search-item"><div><div class="employee-search-name">No matches</div><div class="employee-search-meta">Try last name, EID, shift, or rank.</div></div></div>`;}
function openEmployeeProfile(id){activeEmployeeProfileId=String(id||'');employeeSearch='';const box=document.getElementById('globalEmployeeResults');if(box){box.classList.remove('show');box.innerHTML='';}const input=document.getElementById('globalEmployeeSearch');if(input)input.value='';navigate('employee-profile');}
function profileAttendanceCounts(ae,daysBack){const out={};if(!ae)return out;const end=new Date();const start=new Date();start.setDate(end.getDate()-(daysBack-1));const data=(attendance.attendance||{})[ae.id]||{};for(const [d,c] of Object.entries(data)){const dt=parseISO(d);if(dt>=start&&dt<=end&&c){out[c]=(out[c]||0)+1;}}return out;}
function profileRecentAttendance(ae,limit=10){if(!ae)return[];const data=(attendance.attendance||{})[ae.id]||{};return Object.entries(data).filter(x=>x[1]).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,limit).map(([date,code])=>({date,code,label:codeLabel(code)}));}
function profileScheduleRows(re){if(!re)return[];const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const rows=[];for(const row of (roster.schedule||[])){(row.days||[]).forEach((cell,i)=>{if(scheduleNameMatchesEmployee(cell,re))rows.push({section:row.section||'',post:row.post||'',shift:row.shiftLabel||'',day:days[i]||'',hours:Number(row.hrs||8)});});}return rows;}
function profileTrainingSummary(re){if(!re)return{complete:0,dueSoon:0,overdue:0,noRecord:0,score:100,rows:[],post:[]};const ready=trainingReadinessForEmployee(re);return{complete:ready.current,dueSoon:ready.expiring,overdue:ready.expired,noRecord:ready.missing,score:ready.score,post:employeePostReadiness(re),rows:ready.rows.map(r=>({topic:r.topic.name||'',status:r.status,completed:r.completed||'',due:r.due||'',trainer:r.trainer||''}))};}
function profileUniformSummary(re){if(!re)return[];return getUniformItemsForEmployee(re).map(i=>({item:titleCase(i.item),size:i.size||'',status:titleCase(i.status||'needed'),qty:i.qty||1,due:i.replacementDue||'',value:i.cost||0}));}
function profileCountLine(label,counts){return `<div class="health-row"><span>${esc(label)}</span><span>${['T','U','UE','AL','V','E','LE'].map(c=>`<span class="badge ${esc(c)}">${esc(c)}</span> ${Number(counts[c]||0)}`).join(' &nbsp; ')}</span></div>`}
function renderEmployeeProfile(){const rec=employeeProfileRecord();const re=rec.rosterEmp,ae=rec.attendanceEmp;const name=re?fullName(re):(ae?ae.name:'No employee selected');if(!re&&!ae){return `<div class="page-head"><div><div class="page-title">Employee Profile</div><div class="page-sub">Search for an employee in the top bar or open Profile from the roster.</div></div></div>${screenGuide('employee-profile')}${renderPeopleWorkflowNav('profile')}<div class="card"><div class="card-title">No Employee Selected</div><p class="mini-note">Use the global employee search box at the top of the suite to open a profile, or open Profile from any roster row.</p></div>`}
const cost=re?employeeCostProfile(re):{hours:0,baseWeek:0,loadedWeek:0,baseMonth:0,loadedMonth:0,baseYear:0,loadedYear:0,source:''};const c30=profileAttendanceCounts(ae,30),c90=profileAttendanceCounts(ae,90);const recent=profileRecentAttendance(ae,12);const sched=profileScheduleRows(re);const train=profileTrainingSummary(re);const uni=profileUniformSummary(re);const activeStatus=re?(isArchivedEmployee(re)?'Archived':'Active'):(isArchivedAttendanceEmployee(ae)?'Archived':'Active');return `<div class="page-head"><div><div class="page-title">Employee Profile</div><div class="page-sub">${esc(name)} · one-screen roster, attendance, schedule, training, uniform, and labor view.</div></div><div class="profile-actions"><button onclick="navigate('roster')">Go to Roster</button><button onclick="activeAttView='grid';navigate('attendance')">Go to Attendance Grid</button><button onclick="navigate('training')">Go to Training</button><button onclick="activeRosterView='uniforms';navigate('roster')">Go to Uniforms</button><button class="gold" onclick="printEmployeeProfile()">Print Profile</button></div></div>${renderPeopleWorkflowNav('profile')}${renderEmployeePeopleCommand(re,ae)}<div class="profile-grid"><div><div class="card"><div class="card-title">Employee Summary</div><div class="profile-kv"><div>Name</div><div>${esc(name)}</div><div>EID</div><div>${esc(re&&re.eid||'')}</div><div>Rank / Title</div><div>${esc(re&&re.rank||ae&&ae.title||'')}</div><div>Shift / Section</div><div>${esc(re&&re.shift||ae&&ae.shift||'')}</div><div>Gate Shift</div><div>${esc(re&&re.gateShift||'')}</div><div>Employment Class</div><div>${esc(re?employmentClass(re):'')}</div><div>Status</div><div>${esc(activeStatus)}</div><div class="admin-pay">Hourly Rate</div><div class="admin-pay">${money(re&&re.rate)}</div></div></div><div class="card admin-pay"><div class="card-title">Labor Cost</div><div class="grid cols-3"><div class="kpi"><div class="num">${cost.hours}</div><div class="lbl">Named Scheduled HPW</div></div><div class="kpi"><div class="num">${money(cost.baseWeek)||'$0.00'}</div><div class="lbl">Base Weekly</div></div><div class="kpi"><div class="num">${money(cost.loadedWeek)||'$0.00'}</div><div class="lbl">Loaded Weekly</div></div></div><table class="profile-mini-table"><tbody><tr><th></th><th>Base</th><th>Loaded</th></tr><tr><td>Month</td><td>${money(cost.baseMonth)}</td><td>${money(cost.loadedMonth)}</td></tr><tr><td>Year</td><td>${money(cost.baseYear)}</td><td>${money(cost.loadedYear)}</td></tr></tbody></table><div class="mini-note">Source: ${esc(cost.source||'')} · loaded rates use ${esc(laborRateSummary())}.</div></div><div class="card"><div class="card-title">Attendance Summary</div>${profileCountLine('Last 30 Days',c30)}${profileCountLine('Last 90 Days',c90)}<div class="card-title" style="margin-top:14px">Recent Entries</div>${recent.length?`<table class="profile-mini-table"><thead><tr><th>Date</th><th>Code</th><th>Meaning</th></tr></thead><tbody>${recent.map(r=>`<tr><td>${esc(fmt(r.date))}</td><td><span class="badge ${esc(r.code)}">${esc(r.code)}</span></td><td>${esc(r.label)}</td></tr>`).join('')}</tbody></table>`:'<p class="mini-note">No attendance entries found.</p>'}</div></div><div><div class="card"><div class="card-title">Schedule Summary</div><div class="grid cols-3"><div class="kpi"><div class="num">${sched.length}</div><div class="lbl">Assigned Cells</div></div><div class="kpi"><div class="num">${cost.hours}</div><div class="lbl">Named Scheduled HPW</div></div><div class="kpi"><div class="num">${cost.hours>40?'Yes':'No'}</div><div class="lbl">OT Flag</div></div></div>${sched.length?`<div class="profile-list">${sched.slice(0,12).map(x=>`<div class="profile-list-row"><strong>${esc(x.day)} · ${esc(x.section)}</strong><br><span class="mini-note">${esc(x.post)} · ${esc(x.shift)} · ${esc(x.hours)} hrs</span></div>`).join('')}</div>`:'<p class="mini-note">No schedule assignments matched this employee.</p>'}</div><div class="card"><div class="card-title">Training Readiness</div><span class="risk-chip ok">Readiness ${train.score}%</span><span class="risk-chip ok">Current ${train.complete}</span><span class="risk-chip warn">Expiring ${train.dueSoon}</span><span class="risk-chip bad">Expired ${train.overdue}</span><span class="risk-chip warn">Missing ${train.noRecord}</span><div class="mini-note" style="margin-top:8px">Post readiness</div>${train.post&&train.post.length?`<table class="profile-mini-table"><thead><tr><th>Post Area</th><th>Status</th><th>Issues</th></tr></thead><tbody>${train.post.map(p=>`<tr><td>${esc(p.label)}</td><td>${postReadinessBadge(p.status)}</td><td>${esc(p.issues||0)}</td></tr>`).join('')}</tbody></table>`:''}${train.rows.length?`<table class="profile-mini-table"><thead><tr><th>Topic</th><th>Status</th><th>Due</th></tr></thead><tbody>${train.rows.slice(0,10).map(r=>`<tr><td>${esc(r.topic)}</td><td>${trainingStatusBadge(r.status)}</td><td>${esc(fmtDate(r.due))}</td></tr>`).join('')}</tbody></table>`:'<p class="mini-note">No required training topics configured.</p>'}</div><div class="card"><div class="card-title">Uniform Summary</div>${uni.length?`<table class="profile-mini-table"><thead><tr><th>Item</th><th>Qty</th><th>Size</th><th>Status</th><th>Replace Due</th></tr></thead><tbody>${uni.map(u=>`<tr><td>${esc(u.item)}</td><td>${esc(u.qty)}</td><td>${esc(u.size)}</td><td>${esc(u.status)}</td><td>${esc(fmtDate(u.due))}</td></tr>`).join('')}</tbody></table>`:'<p class="mini-note">No uniform record found.</p>'}</div></div></div>`}
function printEmployeeProfile(){const p=document.getElementById('page-employee-profile');if(!p){toast('Profile page not ready');return;}const html=`<div class="print-overlay" id="printOverlay"><div class="print-toolbar"><div><h2>PWADC Employee Profile</h2><div>${new Date().toLocaleString()}</div></div><div><button onclick="window.print()">Print</button> <button onclick="document.getElementById('printOverlay').remove()">Close</button></div></div>${p.innerHTML}</div>`;document.body.insertAdjacentHTML('beforeend',html);setTimeout(()=>window.print(),150)}


function fullName(e){
  e=e||{};
  if(e.name) return String(e.name).trim();
  const last=String(e.last||'').trim();
  const first=String(e.first||'').trim();
  if(last&&first) return last+', '+first;
  if(first) return first;
  if(last) return last;
  return String(e.eid||e.id||'Unknown').trim();
}

function rosterArchivedEmployees(){return (roster.employees||[]).filter(isArchivedEmployee).sort((a,b)=>fullName(a).localeCompare(fullName(b)))}
function normalizeNameKey(x){return String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'')}
function rosterEmployeeAttendanceName(e){const last=String(e.last||'').trim(),first=String(e.first||'').trim();return last&&first?`${last}, ${first}`:(last||first||'')}
function rosterShiftToAttendanceShift(sh){const x=String(sh||'').toLowerCase();if(x.includes('1st'))return '1st Shift';if(x.includes('2nd'))return '2nd Shift';if(x.includes('3rd'))return '3rd Shift';if(x.includes('gate'))return 'Gate';if(x.includes('dock')||x.includes('crosswalk'))return 'Dock';if(x.includes('recp')||x.includes('reception'))return 'Reception';return sh||''}
function rosterShift(e){
  const raw=typeof e==='string'?e:String((e&&e.shift)||'');
  const x=raw.toLowerCase();
  if(x.includes('1st'))return '01 1st Shift';
  if(x.includes('2nd'))return '02 2nd Shift';
  if(x.includes('3rd'))return '03 3rd Shift';
  if(x.includes('gate'))return '04 Gate';
  if(x.includes('dock')||x.includes('crosswalk'))return '05 Dock';
  if(x.includes('recp')||x.includes('reception'))return '06 Reception';
  return '99 '+raw;
}
function rosterRdoToAttendanceRdos(rdo){const map={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};return (rdo||[]).map(x=>typeof x==='number'?x:map[String(x||'').slice(0,3).toLowerCase()]).filter(x=>x!==undefined)}
function attendanceNameParts(name){
  let raw=String(name||'').trim();
  let last='', first='';
  if(raw.includes(',')){let parts=raw.split(','); last=(parts[0]||'').trim(); first=(parts.slice(1).join(',')||'').trim();}
  else {let parts=raw.split(/\s+/).filter(Boolean); first=parts[0]||''; last=parts.slice(1).join(' ')||'';}
  return {last:first?last:raw, first:first||''};
}
function compactPersonKey(last,first){return normalizeNameKey(String(last||'')+'|'+String(first||''));}
function employeeRecordCount(empId){return Object.keys((attendance.attendance||{})[empId]||{}).length}
function shiftCompatible(a,b){a=String(a||'').toLowerCase();b=String(b||'').toLowerCase();if(!a||!b)return true;if(a===b)return true;if(a.includes('gate')&&b.includes('gate'))return true;if((a.includes('dock')||a.includes('crosswalk'))&&(b.includes('dock')||b.includes('crosswalk')))return true;if(a.includes('1st')&&b.includes('1st'))return true;if(a.includes('2nd')&&b.includes('2nd'))return true;if(a.includes('3rd')&&b.includes('3rd'))return true;if((a.includes('rec')||a.includes('recep'))&&(b.includes('rec')||b.includes('recep')))return true;return false}
function firstNameCompatible(a,b){
  const x=normalizeNameKey(a), y=normalizeNameKey(b);
  if(!x||!y)return false;
  if(x===y||x.startsWith(y)||y.startsWith(x))return true;
  if(x[0]&&x[0]===y[0]){
    // Allow first-initial matching for staff records where one system uses nicknames/short names.
    return true;
  }
  const aliases=[['liz','elizabeth'],['jaz','jazmine'],['jae','jalisa'],['ray','raymond'],['dan','danillo'],['kay','kaylan'],['kd','kendarius'],['day','damyn'],['ricky','rickey']];
  return aliases.some(pair=>pair.includes(x)&&pair.includes(y));
}
function likelySamePerson(attEmp,re){
  return personRecordsMatch(attEmp,re,{requireShift:true});
}
function personRecordsMatch(attEmp,re,opts={}){
  const rp=attendanceNameParts(rosterEmployeeAttendanceName(re));
  const ap=attendanceNameParts(attendanceDisplayName(attEmp));
  const rl=normalizeNameKey(rp.last), al=normalizeNameKey(ap.last);
  const rf=normalizeNameKey(rp.first), af=normalizeNameKey(ap.first);
  if(!rl||!al||rl!==al)return false;
  if(!firstNameCompatible(rf,af))return false;
  if(opts.requireShift===false)return true;
  return shiftCompatible(attEmp.shift, rosterShiftToAttendanceShift(re.shift));
}
function findAttendanceEmployeeForRosterLoose(re){
  const active=(attendance.employees||[]).filter(a=>!isArchivedAttendanceEmployee(a));
  const rid=String(re&&re.id||'');
  const exact=active.find(a=>String(a.rosterId||'')===rid && personRecordsMatch(a,re,{requireShift:false}));
  if(exact)return exact;
  const strict=active.filter(a=>personRecordsMatch(a,re,{requireShift:true}));
  if(strict.length)return strict.sort((a,b)=>meaningfulAttendanceCount(b.id)-meaningfulAttendanceCount(a.id))[0];
  const loose=active.filter(a=>personRecordsMatch(a,re,{requireShift:false}));
  return loose.sort((a,b)=>meaningfulAttendanceCount(b.id)-meaningfulAttendanceCount(a.id))[0]||null;
}
function findRosterEmployeeForAttendanceLoose(a){
  const active=rosterActiveEmployees();
  const linked=(a&&a.rosterId)?active.find(r=>String(r.id)===String(a.rosterId)&&personRecordsMatch(a,r,{requireShift:false})):null;
  if(linked)return linked;
  const strict=active.filter(r=>personRecordsMatch(a,r,{requireShift:true}));
  if(strict.length)return strict[0];
  return active.find(r=>personRecordsMatch(a,r,{requireShift:false}))||null;
}
function mergeAttendanceEmployeeRecords(target,source){
  if(!target||!source||String(target.id)===String(source.id))return 0;
  const tid=String(target.id), sid=String(source.id);
  attendance.attendance[tid]=attendance.attendance[tid]||{};
  let moved=0;
  for(const [date,code] of Object.entries((attendance.attendance||{})[sid]||{})){
    if(!attendance.attendance[tid][date]){attendance.attendance[tid][date]=code;moved++;}
  }
  const oldNotes=attendance.notes||{};
  for(const [key,val] of Object.entries(oldNotes)){
    if(key.startsWith(sid+'|')){
      const nk=tid+'|'+key.slice((sid+'|').length);
      if(!oldNotes[nk])oldNotes[nk]=val;
      delete oldNotes[key];
    }
  }
  delete attendance.attendance[sid];
  attendance.employees=(attendance.employees||[]).filter(e=>String(e.id)!==sid);
  return moved;
}
function findAttendanceEmployeeForRoster(re){
  const rid=String(re.id);
  const active=(attendance.employees||[]).filter(a=>!isArchivedAttendanceEmployee(a));
  // Prefer a live roster link if it is correct.
  const exact=active.find(a=>String(a.rosterId||'')===rid);
  if(exact)return exact;
  // Do not ignore rows with stale/incorrect rosterId values. Match all active rows by person/shift and prefer real history.
  const candidates=active.filter(a=>likelySamePerson(a,re)).sort((a,b)=>meaningfulAttendanceCount(b.id)-meaningfulAttendanceCount(a.id));
  return candidates[0]||null;
}
function buildAttendanceEmployeeFromRoster(re,existing){return {...(existing||{}),id:(existing&&existing.id)?existing.id:('r-'+String(re.id)),rosterId:String(re.id),name:rosterEmployeeAttendanceName(re),title:re.rank||'',shift:rosterShiftToAttendanceShift(re.shift),rdos:rosterRdoToAttendanceRdos(re.rdo),startDate:re.doh||re.dop||new Date().toISOString().slice(0,10),active:!isArchivedEmployee(re),archived:isArchivedEmployee(re),status:isArchivedEmployee(re)?'Archived':'Active'}}
function fillNEBeforeStart(attEmp){try{const start=attEmp.startDate;if(!start)return;attendance.attendance[attEmp.id]=attendance.attendance[attEmp.id]||{};const allDates=new Set();for(const rec of Object.values(attendance.attendance||{})){for(const d of Object.keys(rec||{}))allDates.add(d)}for(const d of allDates){if(d<start&&!attendance.attendance[attEmp.id][d])attendance.attendance[attEmp.id][d]='NE'}}catch(e){console.warn('NE backfill skipped',e)}}
function meaningfulAttendanceCount(empId){return Object.values((attendance.attendance||{})[empId]||{}).filter(c=>c&&c!=='NE').length}
function sameAttendancePerson(a,b){
  const ap=attendanceNameParts(a.name), bp=attendanceNameParts(b.name);
  const al=normalizeNameKey(ap.last), bl=normalizeNameKey(bp.last);
  const af=normalizeNameKey(ap.first), bf=normalizeNameKey(bp.first);
  if(!al||!bl||al!==bl)return false;
  if(!af||!bf)return true;
  return af===bf||af.startsWith(bf)||bf.startsWith(af)||af[0]===bf[0];
}
function quarantineEmptySyncDuplicates(){
  normalizeAttendance();
  let quarantined=0;
  for(const dup of attendance.employees||[]){
    if(!String(dup.id||'').startsWith('r-'))continue;
    if(isArchivedAttendanceEmployee(dup))continue;
    const dupMeaningful=meaningfulAttendanceCount(dup.id);
    const match=(attendance.employees||[]).filter(a=>String(a.id)!==String(dup.id)&&!isArchivedAttendanceEmployee(a)&&sameAttendancePerson(a,dup)).sort((a,b)=>meaningfulAttendanceCount(b.id)-meaningfulAttendanceCount(a.id))[0];
    if(match && meaningfulAttendanceCount(match.id)>0 && dupMeaningful===0){
      dup.active=false;dup.archived=true;dup.status='Sync Duplicate';dup.archivedAt=dup.archivedAt||new Date().toISOString();
      quarantined++;
    }
  }
  if(quarantined){
    attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
    attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Sync duplicates hidden',detail:`${quarantined} empty roster-sync duplicate row(s) hidden. No historical attendance records were deleted.`});
  }
  return quarantined;
}
async function syncOneRosterEmployeeToAttendance(re,allowCreate=false){
  normalizeRoster();normalizeAttendance();
  if(!re||!rosterEmployeeAttendanceName(re))return {skipped:true};
  let existing=findAttendanceEmployeeForRoster(re);
  if(existing && !existing.rosterId)existing.rosterId=String(re.id);
  if(!existing && !allowCreate)return {missing:true};
  let next=buildAttendanceEmployeeFromRoster(re,existing);
  if(!existing){attendance.employees.push(next);attendance.attendance[next.id]=attendance.attendance[next.id]||{};fillNEBeforeStart(next);return {added:true,employee:next};}
  Object.assign(existing,next);attendance.attendance[existing.id]=attendance.attendance[existing.id]||{};return {updated:true,employee:existing};
}
async function syncAttendanceFromRoster(showToast=true){
  normalizeRoster();normalizeAttendance();
  if(showToast&&!confirm('Safe Sync Attendance from Roster? This will ONLY link/update people that already exist in Attendance. It will NOT bulk-add missing roster employees. New employees are added to Attendance only when you save them from Roster. A backup is created first.'))return {cancelled:true};
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){console.warn('Pre-sync attendance backup failed',e)}
  let updated=0,linked=0,missing=0,archived=0,skipped=0;
  const archivedRoster=new Set();
  const quarantined=quarantineEmptySyncDuplicates();
  for(const re of roster.employees||[]){
    if(isArchivedEmployee(re)){archivedRoster.add(String(re.id));continue;}
    const name=rosterEmployeeAttendanceName(re);if(!name){skipped++;continue;}
    let before=findAttendanceEmployeeForRoster(re);
    if(!before){missing++;continue;}
    let hadLink=!!before.rosterId;
    let result=await syncOneRosterEmployeeToAttendance(re,false);
    if(result.updated){updated++; if(!hadLink)linked++;}
  }
  for(const ae of attendance.employees||[]){if(ae.rosterId&&archivedRoster.has(String(ae.rosterId))){if(ae.active!==false||ae.archived!==true)archived++;ae.active=false;ae.archived=true;ae.status='Archived';ae.archivedAt=ae.archivedAt||new Date().toISOString();}}
  attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
  attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Safe roster sync',detail:`Updated ${updated}, newly linked ${linked}, missing/not added ${missing}, archived ${archived}, hidden duplicates ${quarantined}, skipped ${skipped}. No attendance rows were bulk-added and no history was deleted.`});
  await saveAttendanceNow('safe-roster-sync');
  if(showToast)toast(`Safe sync: ${updated} updated, ${linked} linked, ${missing} missing not added, ${quarantined} duplicates hidden.`);
  safeRenderPages({preserveScroll:true});
  return {updated,linked,missing,archived,quarantined,skipped};
}
async function hideAttendanceSyncDuplicates(){try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(e){console.warn('Pre-cleanup attendance backup failed',e)}const n=quarantineEmptySyncDuplicates();await saveAttendanceNow('hide-sync-duplicates');safeRenderPages({preserveScroll:true});toast(n+' sync duplicate row(s) hidden. No history deleted.')}
async function repairAttendanceHistoryFromRoster(){
  alert('Automatic attendance history merge is disabled for safety. It can combine duplicate people, but it can also hide history if names do not match exactly. Use JSON backup restore or manual review instead.');
}


async function saveModuleDataStrict(module,obj){
  if(!module) throw new Error('Save module name is missing.');
  const json=JSON.stringify(obj||{});
  if(!json||json==='undefined') throw new Error('Save payload is undefined before bridge write.');
  try{
    const res=await SuiteBridge.send('suite:saveModuleData2',{module,json});
    window.__lastSaveResult={module,...(res||{})};
    return res;
  }catch(e){
    throw new Error(`${module} save failed. Confirm the shared drive is online and not locked, then retry. ${e.message||e}`);
  }
}
async function saveRosterNow(reason='manual'){
  clearTimeout(rosterSaveTimer);
  const save=document.getElementById('saveStatus');
  if(save)save.textContent='Saving roster...';
  try{
    normalizeRoster();
    roster.lastSaved=new Date().toISOString();
    await saveModuleDataStrict('roster',roster);
    if(save)save.textContent='Roster saved '+new Date().toLocaleTimeString();
    return true;
  }catch(e){reportActionError('Roster save',e);return false;}
}
function saveRoster(reason='autosave'){
  clearTimeout(rosterSaveTimer);
  const save=document.getElementById('saveStatus');
  if(save)save.textContent='Saving roster...';
  rosterSaveTimer=setTimeout(()=>saveRosterNow(reason),350);
}
async function saveAttendanceNow(reason='manual'){
  clearTimeout(saveTimer);
  const save=document.getElementById('saveStatus');
  if(save)save.textContent='Saving attendance...';
  try{
    normalizeAttendance();
    attendance.lastSaved=new Date().toISOString();
    await saveModuleDataStrict('attendance',attendance);
    if(save)save.textContent='Attendance saved '+new Date().toLocaleTimeString();
    return true;
  }catch(e){reportActionError('Attendance save',e);return false;}
}
function saveAttendance(reason='autosave'){
  clearTimeout(saveTimer);
  const save=document.getElementById('saveStatus');
  if(save)save.textContent='Saving attendance...';
  saveTimer=setTimeout(()=>saveAttendanceNow(reason),350);
}
function audit(action,detail){attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action,detail});attendance.audit=attendance.audit.slice(0,1000)}function getCode(id,date){
  const key=String(id||'');
  if(!attendance.attendance)attendance.attendance={};
  const row=attendance.attendance[key]||attendance.attendance[id];
  return row&&date&&row[date]?String(row[date]):'';
}
function setCode(id,date,code,opts={}){
  const key=String(id||'');
  if(!attendance.attendance)attendance.attendance={};
  if(!attendance.attendance[key])attendance.attendance[key]={};
  const clean=String(code||'').trim().toUpperCase();
  const noteKey=key+'|'+date;
  if(!clean){delete attendance.attendance[key][date];audit('Attendance code cleared',key+' · '+date);saveAttendance();return true;}
  if(ISSUE_NOTE_CODES.has(clean)&&!opts.skipReason){
    const existing=(attendance.notes&&attendance.notes[noteKey])||'';
    const promptText=clean==='CO'?'Reason/note required for Call-Out:':clean==='NCNS'?'Reason/note required for No Call No Show:':'Reason/note required for '+clean+':';
    const note=prompt(promptText,existing);
    if(note===null)return false;
    if(!String(note||'').trim()){toast(clean+' requires a reason/note before it can be saved.');return false;}
    attendance.notes=attendance.notes||{};
    attendance.notes[noteKey]=String(note).trim();
  }
  attendance.attendance[key][date]=clean;
  const note=(attendance.notes&&attendance.notes[noteKey])?' · Note: '+attendance.notes[noteKey]:'';
  audit('Attendance code updated',key+' · '+date+' · '+clean+note);
  saveAttendance();
  return true;
}
const NAV_GROUPS=[
  {label:'Core',items:['home','start-here']},
  {label:'People',items:['attendance','roster','employee-profile','training']},
  {label:'Operations',items:['shift-reports','shift-intelligence','tasks']},
  {label:'Inventory',items:['office-supplies']},
  {label:'Reports / Data',items:['reports','data-health','restore','change-log']},
  {label:'Tools',items:['other-programs','settings']}
];
PWADCModuleRegistry.register('data-core');
