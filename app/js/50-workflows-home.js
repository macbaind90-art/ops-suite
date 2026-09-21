/* PWADC Security Operations Suite v4.1.3 | module: workflows-home */
function workflowBanner(title,steps,note){const safeSteps=(Array.isArray(steps)?steps:[]).filter(Boolean);return `<div class="workflow-banner"><strong>${esc(title||'Workflow')}</strong>${safeSteps.length?`<div class="workflow-steps">${safeSteps.map((x,i)=>`<span class="workflow-step"><strong>${i+1}</strong> ${esc(x)}</span>`).join('')}</div>`:''}${note?`<div class="mini-note" style="margin-top:8px">${esc(note)}</div>`:''}</div>`}

function safePeopleMetric(fn,fallback=0){try{const n=Number(fn());return Number.isFinite(n)?n:fallback;}catch(_){return fallback;}}
function homeAttendanceMetrics(asOf=attendanceLocalToday()){
  const out={active:0,atThreshold:0,highRisk:0,correctiveDue:0,positiveEmployees:0,totalPositiveBank:0,scheduledToday:0,missingToday:0,issuesToday:0};
  try{
    ensureAttendancePointSystem();
    const emps=activeAttendanceEmployees();
    out.active=emps.length;
    for(const emp of emps){
      const snap=attendancePointSnapshot(emp.id,asOf);
      const pts=Number(snap.activePoints)||0;
      if(pts>=3)out.atThreshold++;
      if(pts>=7)out.highRisk++;
      if(Number(snap.bank)>0){out.positiveEmployees++;out.totalPositiveBank=Number((out.totalPositiveBank+Number(snap.bank||0)).toFixed(2));}
      const last=latestCorrectiveAction(emp.id);
      if(attendanceActionRank(snap.level)>attendanceActionRank(last&&last.level||'None'))out.correctiveDue++;
      const sched=attendanceScheduleStatus(emp,asOf);
      if(sched.scheduled){
        out.scheduledToday++;
        const code=attendanceEffectiveCode(emp,asOf);
        if(!code)out.missingToday++;
        else if(isChargeableAttendanceCode(code)&&!attendanceMedicalCoverageFor(emp.id,asOf,code))out.issuesToday++;
      }
    }
  }catch(_e){}
  return out;
}
function peopleWorkflowMetrics(){
  const activeRoster=safePeopleMetric(()=>rosterActiveEmployees().length);
  const attendance=homeAttendanceMetrics(attendanceLocalToday());
  const trainingIssues=safePeopleMetric(()=>trainingRows().filter(r=>['Expired','Overdue','Expiring Soon','Due Soon','Missing','No Record'].includes(r.status)).length);
  const uniform=safePeopleMetric(()=>{const m=uniformMetrics();return Number(m.needed||0)+Number(m.ordered||0)+Number(m.dueSoon||0);});
  return {activeRoster,attendanceActive:attendance.active,attendanceMissing:attendance.missingToday,attendanceThreshold:attendance.atThreshold,attendanceDue:attendance.correctiveDue,trainingIssues,uniform};
}
function peopleFlowChip(label,value,kind=''){
  return `<span class="people-flow-chip ${esc(kind)}"><strong>${esc(value)}</strong>${esc(label)}</span>`;
}
function peopleWorkflowNav(active=''){
  const m=peopleWorkflowMetrics();
  const issueTotal=Number(m.attendanceMissing||0)+Number(m.attendanceDue||0)+Number(m.trainingIssues||0)+Number(m.uniform||0);
  const buttons=[
    {id:'attendance',label:'Daily Entry',count:m.attendanceMissing,sub:'missing today',cmd:"activeAttView='daily';navigate('attendance')"},
    {id:'points',label:'Point Review',count:m.attendanceThreshold,sub:'3+ points',cmd:"activeAttView='review';navigate('attendance')"},
    {id:'actions',label:'Corrective',count:m.attendanceDue,sub:'action due',cmd:"activeAttView='actions';navigate('attendance')"},
    {id:'roster',label:'Roster',count:m.activeRoster,sub:'active',cmd:"activeRosterView='roster';navigate('roster')"},
    {id:'training',label:'Training',count:m.trainingIssues,sub:'issues',cmd:"navigate('training')"},
    {id:'uniforms',label:'Uniforms',count:m.uniform,sub:'open',cmd:"activeRosterView='uniforms';navigate('roster')"}
  ];
  return `<div class="people-flow-strip"><div class="people-flow-head"><div><div class="people-flow-title">People Workflow</div><div class="people-flow-note">Use one current workflow: complete Daily Attendance, review active points and positive credits, record corrective action when due, then maintain roster, training, and uniforms.</div></div><div class="people-flow-kpis">${peopleFlowChip('Active Roster',m.activeRoster)}${peopleFlowChip('Attendance Employees',m.attendanceActive)}${peopleFlowChip('Open People Items',issueTotal,issueTotal?'warn':'')}</div></div><div class="people-flow-actions">${buttons.map(b=>`<button class="${active===b.id?'active':''}" onclick="${b.cmd}">${esc(b.label)}<span>${esc(b.count)} ${esc(b.sub)}</span></button>`).join('')}</div></div>`;
}
function renderPeopleWorkflowNav(active=''){return peopleWorkflowNav(active)}

function safeOpsMetric(fn,fallback=0){try{const n=Number(fn());return Number.isFinite(n)?n:fallback;}catch(_){return fallback;}}
function operationsWorkflowMetrics(){
  const sr=safeOpsMetric(()=>shiftReportMetrics().reports), sourceOpen=safeOpsMetric(()=>Number(shiftReportMetrics().open||0)+Number(shiftReportMetrics().monitoring||0));
  const bc=(()=>{try{return siBucketCounts()}catch(_){return {pending:0,auto:0,suggest:0,new:0,ref:0}}})();
  const im=(()=>{try{return siIssueMetrics()}catch(_){return {active:0,needs:0,recurring:0,dormant:0}}})();
  const tm=(()=>{try{return taskMetrics()}catch(_){return {total:0,overdue:0,blocked:0,high:0}}})();
  const sm=(()=>{try{return officeSupplyMetrics()}catch(_){return {low:0,out:0,ordered:0,active:[]}}})();
  const supplyIssues=Number(sm.low||0)+Number(sm.out||0)+Number(sm.ordered||0);
  return {reports:sr,sourceOpen,pendingIntel:Number(bc.pending||0),auto:Number(bc.auto||0),suggest:Number(bc.suggest||0),needs:Number(im.needs||0),recurring:Number(im.recurring||0),activeIntel:Number(im.active||0),openTasks:Number(tm.total||0),overdueTasks:Number(tm.overdue||0),blockedTasks:Number(tm.blocked||0),highTasks:Number(tm.high||0),supplyIssues,lowSupplies:Number(sm.low||0),outSupplies:Number(sm.out||0),orderedSupplies:Number(sm.ordered||0)};
}
function opsFlowChip(label,value,kind=''){return `<span class="ops-flow-chip ${esc(kind)}"><strong>${esc(value)}</strong>${esc(label)}</span>`;}
function operationsWorkflowNav(active=''){
  const m=operationsWorkflowMetrics();
  const decisionTotal=m.pendingIntel+m.needs+m.overdueTasks+m.blockedTasks+m.supplyIssues;
  const buttons=[
    {id:'shift-reports',label:'Import Reports',count:m.reports,sub:'source docs',cmd:"navigate('shift-reports')"},
    {id:'shift-intelligence',label:'Review Intelligence',count:m.pendingIntel,sub:'pending intake',cmd:"shiftIntelBucketFilter='all';shiftIntelStatusFilter='active';navigate('shift-intelligence')"},
    {id:'watchlist',label:'Work Watchlist',count:m.needs,sub:'needs action',cmd:"shiftIntelStatusFilter='Needs Action';navigate('shift-intelligence')"},
    {id:'tasks',label:'Move Follow-Ups',count:m.openTasks,sub:'open tasks',cmd:"navigate('tasks')"},
    {id:'office-supplies',label:'Supply Readiness',count:m.supplyIssues,sub:'supply issues',cmd:"navigate('office-supplies')"},
    {id:'reports',label:'Report Closure',count:'Exec',sub:'briefing',cmd:"navigate('reports')"}
  ];
  return `<div class="ops-flow-strip"><div class="ops-flow-head"><div><div class="ops-flow-title">Operations Workflow</div><div class="ops-flow-note">Keep operational work in one lane: import source reports, review intelligence, convert follow-ups to tasks, keep supplies ready, then report closure.</div></div><div class="ops-flow-kpis">${opsFlowChip('Pending Intake',m.pendingIntel,m.pendingIntel?'warn':'')}${opsFlowChip('Needs Action',m.needs,m.needs?'bad':'')}${opsFlowChip('Open Tasks',m.openTasks,m.overdueTasks?'warn':'')}${opsFlowChip('Supply Issues',m.supplyIssues,m.supplyIssues?'warn':'')}</div></div><div class="ops-flow-actions">${buttons.map(b=>`<button class="${active===b.id?'active':''}" onclick="${b.cmd}">${esc(b.label)}<span>${esc(b.count)} ${esc(b.sub)}</span></button>`).join('')}</div></div>`;
}
function renderOperationsWorkflowNav(active=''){return operationsWorkflowNav(active)}
function operationsLifecyclePanel(){const m=operationsWorkflowMetrics();const steps=[['Import',m.reports,'Shift PDFs stored as source history'],['Review',m.pendingIntel,'Intelligence intake awaiting decision'],['Track',m.activeIntel,'Active operational watchlist items'],['Task',m.openTasks,'Open follow-up assignments'],['Ready',m.supplyIssues,'Supply readiness items to monitor'],['Report','Exec','Brief command status']];return `<div class="ops-control-row"><div class="ops-lifecycle"><div class="ops-lifecycle-title">Operational lifecycle</div><div class="ops-lifecycle-grid">${steps.map(s=>`<div class="ops-life-step"><strong>${esc(s[1])}</strong><span>${esc(s[0])}: ${esc(s[2])}</span></div>`).join('')}</div></div><div class="ops-decision-note"><strong>Decision rule</strong>Raw notes stay in Shift Reports. Only meaningful operational issues move to Shift Intelligence. Follow-ups that require owner/date/action move to Task Tracker. Routine N/A, none, and reference-only notes should not become noise.</div></div>`;}
async function createTaskFromShiftIntelIssue(id){const i=(shiftIntel.issues||[]).find(x=>Number(x.id)===Number(id));if(!i)return;normalizeTasks();tasks.tasks.unshift({id:tasks.nextId++,project:'Shift Intelligence Follow-Up: '+(i.title||i.category||'Operational Issue'),status:'Not Started',priority:i.priority==='High'?'High':(i.status==='Needs Action'?'High':'Normal'),category:'Shift Intelligence',assignedTo:i.owner||'',owner:i.owner||'',dueDate:'',followUpDate:'',blockedBy:'',nextAction:siRecommendedAction(i)||i.recommendedAction||'',lastUpdate:`From SI-${String(i.id).padStart(4,'0')} · ${i.category||''} · last seen ${i.lastSeen||''}`,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});taskAudit('Task created from Shift Intelligence',`SI-${String(i.id).padStart(4,'0')} · ${i.title||''}`);i.managerNotes=(i.managerNotes?i.managerNotes+'\n':'')+'Task created in Task Tracker.';i.updatedAt=new Date().toISOString();await saveTasksNow('shift-intelligence-task');await saveShiftIntelNow('task-link');safeRenderPages({preserveScroll:true});toast('Task created from Shift Intelligence issue');}

function employeeTrainingIssueCount(re){if(!re)return 0;try{const t=profileTrainingSummary(re);return Number(t.dueSoon||0)+Number(t.overdue||0)+Number(t.noRecord||0);}catch(_){return 0;}}
function employeeUniformOpenCount(re){if(!re)return 0;try{return profileUniformSummary(re).filter(u=>!['Issued','Returned','Retired'].includes(String(u.status||''))||['due-soon','past-due'].includes(replacementDueClass(u.due))).length;}catch(_){return 0;}}
function renderEmployeePeopleCommand(re,ae){
  const asOf=attendanceLocalToday();
  const snap=ae?attendancePointSnapshot(ae.id,asOf):null;
  const last=ae?latestCorrectiveAction(ae.id):null;
  const actionDue=!!(snap&&attendanceActionRank(snap.level)>attendanceActionRank(last&&last.level||'None'));
  const trainingCount=employeeTrainingIssueCount(re), uniformCount=employeeUniformOpenCount(re), schedCount=safePeopleMetric(()=>profileScheduleRows(re).length);
  const pts=snap?Number(snap.activePoints)||0:0;
  const pointKind=pts>=7?'bad':pts>=3?'warn':'';
  const total=(actionDue?1:0)+trainingCount+uniformCount;
  const actionLabel=!snap?'No Attendance Record':actionDue?'Action Due':snap.level==='None'?'Below Threshold':'Current';
  return `<div class="card people-command-panel"><div class="card-title">Employee People Command</div><div class="profile-priority-row"><div class="profile-priority-tile ${pointKind}"><b>${snap?esc(snap.activePoints):'-'}</b><span>Active Attendance Points</span></div><div class="profile-priority-tile"><b>${snap?esc(snap.bank)+' / '+esc(snap.maxCredits):'-'}</b><span>Positive Credit Bank</span></div><div class="profile-priority-tile"><b>${snap?esc(snap.cleanWorkingDays)+' / 12':'-'}</b><span>Clean Working Days</span></div><div class="profile-priority-tile ${actionDue?'bad':''}"><b>${esc(actionLabel)}</b><span>Corrective Action</span></div><div class="profile-priority-tile ${trainingCount?'bad':''}"><b>${trainingCount}</b><span>Training Exceptions</span></div><div class="profile-priority-tile ${uniformCount?'warn':''}"><b>${uniformCount}</b><span>Uniform Follow-Ups</span></div></div><div class="people-page-note">${total?`This employee has ${total} people-work item(s) requiring review. Attendance decisions are driven by current active points after positive credits, not the retired pattern/notice workflow.`:`No current corrective-action, training, or uniform exception is flagged. ${schedCount} live schedule assignment(s) matched this employee.`}</div><div class="people-next-actions"><button onclick="activeAttView='review';navigate('attendance')">Point Review</button><button onclick="activeAttView='actions';navigate('attendance')">Corrective Action</button><button onclick="activeAttView='grid';navigate('attendance')">90-Day Grid</button><button onclick="navigate('training')">Training</button><button onclick="activeRosterView='uniforms';navigate('roster')">Uniforms</button>${re?`<button class="gold admin-only" onclick="openEmployeeModal('${esc(re.id)}')">Edit Roster Record</button>`:''}</div></div>`;
}

function renderStartHere(){
  const included=[['Dashboard','Daily command view for attendance completion, active points, corrective action, coverage, tasks, and operational signals.','<button onclick="navigate(\'home\')">Open Dashboard</button>'],['Shift Operations','Import source reports, decide operational meaning, and maintain the watchlist.','<button onclick="navigate(\'shift-reports\')">Open Shift Reports</button><button onclick="navigate(\'shift-intelligence\')">Open Intelligence</button>'],['Task Tracker','Own follow-ups, blockers, due dates, and weekly status updates.','<button onclick="navigate(\'tasks\')">Open Tasks</button>'],['Reports / Data / Admin','Generate management outputs, verify integrity, manage backups, review audit activity, and govern settings.','<button onclick="navigate(\'reports\')">Open Reports</button><button onclick="navigate(\'data-health\')">Open Data Health</button>'],['People Workflow','Daily Attendance, 90-Day Grid, Point Review, Corrective Action, roster, schedule, training, and uniform accountability.','<button onclick="navigate(\'attendance\')">Open Attendance</button><button onclick="navigate(\'roster\')">Open Roster</button>'],['Other Programs','Standalone Badge, AMAG, and Access Audit tools.','<button onclick="navigate(\'other-programs\')">Open Programs</button>']];
  return `<div class="page-head"><div><div class="page-title">Start Here</div><div class="page-sub">v4.1.3 Command Center alignment · current Attendance Point System workflow.</div></div><div class="btn-group"><button onclick="navigate('home')">Dashboard</button><button class="gold" onclick="printStartHere()">Print Start Here</button></div></div>${screenGuide('start-here')}<div class="notice"><strong>Current operating model:</strong> Home and the People Workflow now use the Attendance Point System only. Legacy Pattern and Notice workflows have been retired from the live application. Historical raw fields remain untouched only when present in older Attendance JSON.</div><div class="card"><div class="card-title">Daily Operating Flow</div><ol class="clean-list"><li><strong>Complete Daily Attendance.</strong> Work by shift and resolve missing scheduled entries first.</li><li><strong>Review Point Status.</strong> Check active 90-day points, positive credits, clean-workday progress, and employees at or above threshold.</li><li><strong>Record Corrective Action when due.</strong> Use the 3 / 6 / 9 point levels and document completion separately from the point calculation.</li><li><strong>Confirm Live Schedule and Roster.</strong> The Live Schedule is the primary work/off authority; Roster RDO is the fallback when no usable live schedule exists for the weekday.</li><li><strong>Process Shift Operations and Tasks.</strong> Import source reports, review meaningful intelligence, and assign owned follow-up.</li><li><strong>Close with Reports and Data Health.</strong> Produce management outputs after queues are clean and verify integrity before high-impact changes.</li></ol></div><div class="card"><div class="card-title">Attendance Control Flow</div><div class="governance-path"><div class="governance-step"><strong>1. Daily Entry</strong><span>Complete scheduled attendance by shift.</span></div><div class="governance-step"><strong>2. 90-Day Grid</strong><span>Review or reason-edit historical records.</span></div><div class="governance-step"><strong>3. Point Review</strong><span>Review active points, positive bank, and clean-workday progress.</span></div><div class="governance-step"><strong>4. Doctor Notes</strong><span>Apply documented date-range coverage when applicable without rewriting the original attendance event.</span></div><div class="governance-step"><strong>5. Corrective Action</strong><span>Record due 3 / 6 / 9 point actions.</span></div><div class="governance-step"><strong>6. Audit</strong><span>Preserve corrections, adjustments, doctor-note controls, and accountability.</span></div></div></div><div class="grid cols-3"><div class="kpi"><div class="num">90</div><div class="lbl">Rolling Point Days</div></div><div class="kpi"><div class="num">12</div><div class="lbl">Clean Workdays per +1 Credit</div></div><div class="kpi"><div class="num">3</div><div class="lbl">Maximum Positive Credit Bank</div></div></div><div class="card"><div class="card-title">What Is Included</div><div class="grid cols-3">${included.map(x=>moduleIncludedCard(x[0],x[1],x[2])).join('')}</div></div><div class="card"><div class="card-title">Reliability Foundation Retained</div><table><thead><tr><th>Area</th><th>Controlled Improvement</th></tr></thead><tbody><tr><td>Loaded Revision</td><td>Each operational shared JSON load returns a SHA-256 revision fingerprint that remains associated with the in-memory dataset.</td></tr><tr><td>Save Gate</td><td>Before the atomic replacement proceeds, the live shared-file revision must still match the revision this workstation originally loaded.</td></tr><tr><td>Conflict Handling</td><td>Newer shared data blocks the save. Current in-memory work remains open and can be exported before the user chooses to reload latest.</td></tr><tr><td>Conflict Audit</td><td>Blocked stale writes record user, workstation, module, expected revision, current revision, target, and live-file metadata.</td></tr><tr><td>Boundary</td><td>No automatic merge is attempted. Short-duration write locking remains deferred unless production evidence justifies it.</td></tr></tbody></table></div>`;
}

function printStartHere(){openReportWindow(reportDoc('Start Here','v4.1.3 Attendance Point System',document.querySelector('#page-start-here')?.innerHTML||renderStartHere(),'portrait'),false)}

function dashboardAttentionCard(title,value,desc,btn,onclick,hot){return `<div class="attention-card ${hot?'hot':'ok'}" onclick="${onclick}"><h3>${esc(title)}</h3><div class="attention-metric">${esc(String(value))}</div><p>${esc(desc)}</p><div class="toolbar"><button class="${hot?'gold':'primary'}" onclick="event.stopPropagation();${onclick}">${esc(btn)}</button></div></div>`}
function queueCard(title,value,desc,btn,go,hot){return `<div class="priority-compact ${hot?'hot':''}" onclick="${go}"><strong>${esc(String(value))}</strong><h3>${esc(title)}</h3><span>${esc(desc)}</span><button class="sm primary" onclick="event.stopPropagation();${go}">${esc(btn)}</button></div>`}
function shiftIntelPendingCount(){try{return (siBucketCounts&&typeof siBucketCounts==='function')?Number(siBucketCounts().pending||0):((shiftIntel.intake||[]).filter(i=>(i.status||'Pending')==='Pending').length);}catch(_){return 0}}
function shiftIntelNeedsActionCount(){try{return (siIssueMetrics&&typeof siIssueMetrics==='function')?Number(siIssueMetrics().needs||0):((shiftIntel.issues||[]).filter(i=>(i.status||'New')==='Needs Action').length);}catch(_){return 0}}
function shiftIntelDormantCount(){try{return (siIssueMetrics&&typeof siIssueMetrics==='function')?Number(siIssueMetrics().dormant||0):((shiftIntel.issues||[]).filter(i=>typeof siComputedStatus==='function'&&siComputedStatus(i)==='Dormant').length);}catch(_){return 0}}
function commandPriorityCard(item,lead=false){if(!item)return '';if(lead)return `<div class="priority-lead ${item.hot?'':'clear'}" onclick="${item.go}"><div class="priority-lead-label">${item.hot?'Top Priority':'All Clear'}</div><div class="priority-lead-title">${esc(item.title)}</div><div class="priority-lead-metric">${esc(String(item.value))}</div><p>${esc(item.desc)}</p><button class="${item.hot?'gold':'primary'}" onclick="event.stopPropagation();${item.go}">${esc(item.btn)}</button></div>`;return queueCard(item.title,item.value,item.desc,item.btn,item.go,item.hot)}
function commandMetric(value,label){return `<div class="command-kpi"><strong>${esc(String(value))}</strong><span>${esc(label)}</span></div>`}
function dashboardWorkflowCard(title,desc,btn,onclick){return `<div class="workflow-card" onclick="${onclick}"><strong>${esc(title)}</strong><span>${esc(desc)}</span><button class="primary" onclick="event.stopPropagation();${onclick}">${esc(btn)}</button></div>`}
function commandWorkflowStep(i,title,desc,btn,onclick){return `<div class="daily-flow-step" onclick="${onclick}"><div class="daily-flow-num">${i}</div><div><div class="daily-flow-title">${esc(title)}</div><div class="daily-flow-text">${esc(desc)}</div></div><button class="sm primary" onclick="event.stopPropagation();${onclick}">${esc(btn)}</button></div>`}
function commandSidebarAction(title,desc,btn,onclick){return `<div class="sidebar-action" onclick="${onclick}"><div><strong>${esc(title)}</strong><span>${esc(desc)}</span></div><button class="sm" onclick="event.stopPropagation();${onclick}">${esc(btn)}</button></div>`}
function commandRecentActivityRows(){
 const rows=[];
 const push=(module,arr)=>{for(const a of (arr||[])){rows.push({module,at:a.at||a.date||a.createdAt||a.updatedAt||'',action:a.action||a.title||a.status||'Activity',detail:a.detail||a.note||a.notes||''});}}
 push('Attendance',attendance.audit);push('Roster',roster.audit);push('Tasks',tasks.audit);push('Shift Reports',shiftReports.audit);push('Shift Intelligence',shiftIntel.audit);
 return rows.filter(r=>r.at).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,5).map(r=>`<div class="recent-activity-row"><strong>${esc(r.module)} · ${esc(r.action)}</strong><span>${esc(fmtDate(r.at)||r.at)}${r.detail?' · '+esc(String(r.detail).slice(0,120)):''}</span></div>`).join('')||'<div class="home-empty">No recent activity found yet. Once saves, imports, reviews, or restores occur, the most recent actions will appear here.</div>';
}
function renderHome(){
 const health=computeDataHealth();
 const tm=taskMetrics();
 const shiftM=shiftReportMetrics();
 const siPending=shiftIntelPendingCount();
 const siNeeds=shiftIntelNeedsActionCount();
 const siDormant=shiftIntelDormantCount();
 const cov=scheduleAuthorityModel(scheduleMetrics());
 const sup=(typeof officeSupplyMetrics==='function')?officeSupplyMetrics():{low:0,out:0,ordered:0};
 const activeEmps=activeRosterForReports?activeRosterForReports():rosterActiveEmployees();
 const training=(typeof trainingReadinessMetrics==='function')?trainingReadinessMetrics(activeEmps):{missing:0,expired:0,expiring:0,issueCount:0,score:100};
 const uniforms=(typeof uniformMetrics==='function')?uniformMetrics():{needed:0,ordered:0,lostDamaged:0,dueSoon:0};
 const todayIso=attendanceLocalToday();
 const att=homeAttendanceMetrics(todayIso);
 const rosterCount=(roster.employees||[]).filter(e=>!isArchivedEmployee(e)).length;
 const today=new Date().toLocaleDateString();
 const latestAttendance=latestAttendanceDataDate(attendance);
 const priorityItems=[
   {title:'Attendance Entries Missing',value:att.missingToday,desc:`${att.scheduledToday} employee(s) are scheduled today. Complete blank scheduled attendance entries first.`,btn:'Open Daily Entry',go:"activeAttView='daily';navigate('attendance')",hot:att.missingToday>0,weight:100},
   {title:'Attendance Corrective Action Due',value:att.correctiveDue,desc:'Employees whose current 3 / 6 / 9 point level is above their last recorded corrective action.',btn:'Open Corrective Action',go:"activeAttView='actions';navigate('attendance')",hot:att.correctiveDue>0,weight:95},
   {title:'High Attendance Points',value:att.highRisk,desc:'Employees at 7+ active points. Review current balance, positive credits, and corrective status.',btn:'Open Point Review',go:"activeAttView='review';navigate('attendance')",hot:att.highRisk>0,weight:90},
   {title:'Shift Intake Awaiting Review',value:siPending,desc:'Approve, link, reference, or ignore new report-derived items.',btn:'Review Intake',go:"navigate('shift-intelligence')",hot:siPending>0,weight:85},
   {title:'Needs Action Watchlist',value:siNeeds,desc:'Operational items that need ownership, correction, or a decision.',btn:'Open Watchlist',go:"navigate('shift-intelligence')",hot:siNeeds>0,weight:80},
   {title:'Overdue Tasks',value:tm.overdue||0,desc:'Owned follow-ups that are already beyond their due date.',btn:'Open Tasks',go:"navigate('tasks')",hot:(tm.overdue||0)>0,weight:75},
   {title:'Schedule Gaps',value:cov.total.openPosts||0,desc:`${cov.total.openHours||0} open/pending HPW from the master schedule.`,btn:'Review Schedule',go:"activeRosterView='schedule';navigate('roster')",hot:(cov.total.openPosts||0)>0||(cov.total.openHours||0)>0,weight:70}
 ];
 const hotItems=priorityItems.filter(x=>x.hot).sort((a,b)=>b.weight-a.weight);
 const lead=hotItems[0]||{title:'No urgent command items',value:'Clear',desc:'No primary queues are currently flagging urgent attention. Complete the normal daily workflow and review secondary signals as needed.',btn:'Open Daily Attendance',go:"activeAttView='daily';navigate('attendance')",hot:false};
 const remaining=priorityItems.filter(x=>x!==hotItems[0]);
 const openPriority=(att.missingToday||0)+(att.correctiveDue||0)+(att.highRisk||0)+(siPending||0)+(siNeeds||0)+(tm.overdue||0)+(cov.total.openPosts||0);
 const workflow=[
   ['Complete Daily Attendance','Work scheduled employees by shift and clear missing entries.','Attendance',"activeAttView='daily';navigate('attendance')"],
   ['Review Points & Corrective Action','Review active 90-day points, positive credits, and any 3 / 6 / 9 action due.','Points',"activeAttView='review';navigate('attendance')"],
   ['Confirm Schedule & Roster','Use the Live Schedule as work/off authority and repair roster-to-attendance gaps when needed.','Schedule',"activeRosterView='schedule';navigate('roster')"],
   ['Process Shift Operations','Import source reports, review intelligence, and keep only meaningful operational issues active.','Operations',"navigate('shift-reports')"],
   ['Move Owned Follow-Ups','Use Task Tracker for owners, blockers, due dates, and next actions.','Tasks',"navigate('tasks')"],
   ['Close & Verify','Run management reports and check Data Health before high-impact data changes.','Close',"navigate('reports')"]
 ];
 const secondary=[
   dashboardAttentionCard('Employees at 3+ Points',att.atThreshold,`${att.highRisk} employee(s) are at 7+ active points. Positive credits are already reflected in active balances.`,'Point Review',"activeAttView='review';navigate('attendance')",att.atThreshold>0),
   dashboardAttentionCard('Positive Attendance Credits',att.totalPositiveBank,`${att.positiveEmployees} employee(s) currently hold banked positive attendance credit, capped at 3 each.`,'Point Review',"activeAttView='review';navigate('attendance')",false),
   dashboardAttentionCard('Training Issues',(training.missing||0)+(training.expired||0),`${training.missing||0} missing, ${training.expired||0} expired, ${training.expiring||0} expiring soon.`,'Open Training',"navigate('training')",((training.missing||0)+(training.expired||0))>0),
   dashboardAttentionCard('Uniform Issues',(uniforms.needed||0)+(uniforms.ordered||0)+(uniforms.lostDamaged||0)+(uniforms.dueSoon||0),`${uniforms.needed||0} needed, ${uniforms.ordered||0} ordered, ${uniforms.lostDamaged||0} lost/damaged, ${uniforms.dueSoon||0} replacement due.`,'Open Uniforms',"activeRosterView='uniforms';navigate('roster')",((uniforms.needed||0)+(uniforms.lostDamaged||0)+(uniforms.dueSoon||0))>0),
   dashboardAttentionCard('Supply Issues',(sup.low||0)+(sup.out||0),`${sup.low||0} low, ${sup.out||0} out, ${sup.ordered||0} ordered.`,'Open Supplies',"navigate('office-supplies')",((sup.low||0)+(sup.out||0))>0),
   dashboardAttentionCard('Dormant Shift Issues',siDormant,'No repeat mention in 7+ days; decide watch, resolve, or keep active.','Review Dormant',"shiftIntelStatusFilter='Dormant';navigate('shift-intelligence')",siDormant>0),
   dashboardAttentionCard('Data Health',health.critical||0,`${health.critical||0} critical, ${health.warning||0} warning. Back up before major changes.`,'Open Data Health',"navigate('data-health')",(health.critical||0)>0)
 ];
 const adminTools=canAdmin()?`<details class="home-collapsible"><summary><span>Admin Tools</span><span>Backup, restore, and configure deliberately</span></summary><div class="home-collapsible-body"><div class="workflow-grid">${[
   ['Data Health','Run integrity checks and review live module files.','Data Health',"navigate('data-health')"],
   ['Backup Everything','Create a full backup before major changes or imports.','Backup',"backupEverything()"],
   ['Settings','Users, roles, data paths, programs, and labor assumptions.','Settings',"navigate('settings')"],
   ['Restore Center','Preview backups, enter a reason, and restore deliberately.','Restore',"navigate('restore')"]
 ].map(x=>dashboardWorkflowCard(x[0],x[1],x[2],x[3])).join('')}</div></div></details>`:'';
 const moduleMap=`<details class="home-collapsible"><summary><span>Module Map</span><span>Open only when you need the full suite directory</span></summary><div class="home-collapsible-body"><div class="grid cols-3">${visibleModules().filter(m=>!['home'].includes(m.id)).map(m=>{const desc={
 'start-here':'Supervisor orientation and current daily operating flow.',attendance:'Daily Entry, 90-Day Grid, Point Review, Corrective Action, and Audit Log.',roster:'Staff records, live schedule, uniforms, and roster analytics.','employee-profile':'Focused employee history, current attendance points, schedule, training, and uniforms.',training:'Training readiness, missing items, due-soon, and records.','office-supplies':'Office/security supplies, stock levels, vendors, and orders.','shift-reports':'Import daily PDFs and maintain source report history.','shift-intelligence':'Review report-derived items and manage the operational watchlist.',reports:'Professional reports, print views, and CSV exports.',settings:'Users, roles, data root, coverage, labor assumptions, and programs.',tasks:'Open follow-ups, due dates, blockers, and manager draft text.','data-health':'Integrity checks, live module files, backups, and regression checklist.',restore:'Guarded restore workflow with preview and reason.','change-log':'Combined audit trail across operational modules.','other-programs':'Standalone tools copied to the shared Programs folder.'};return `<div class="card" onclick="navigate('${m.id}')"><div class="card-title">${esc(m.label)}</div><p class="muted">${esc(desc[m.id]||'Open module.')}</p><button class="sm primary" onclick="event.stopPropagation();navigate('${m.id}')">Open</button></div>`}).join('')}</div></div></details>`;
 return `<div class="page-head"><div><div class="page-title">Security Operations Command Center</div><div class="page-sub">${env.user||'User'} @ ${env.machine||'Machine'} · v4.1.3</div></div><div class="btn-group"><button onclick="navigate('start-here')">Start Here</button><button onclick="activeAttView='daily';navigate('attendance')">Daily Attendance</button><button class="gold" onclick="activeAttView='review';navigate('attendance')">Point Review</button><button class="admin-only" onclick="backupEverything()">Backup</button></div></div>
 ${screenGuide('home')}${dataSourceBanner()}<div class="command-center"><section class="command-hero"><div class="command-hero-main"><div class="dashboard-eyebrow">Today’s command view</div><div class="command-hero-title">Start with what needs action now.</div><div class="command-hero-sub">Attendance completion, active point status, corrective action, schedule coverage, operational intelligence, and owned follow-up now use one current workflow. Legacy attendance pattern and notice queues are no longer part of Home.</div><div class="command-kpi-row">${commandMetric(today,'Today')}${commandMetric(att.missingToday,'Attendance Missing')}${commandMetric(att.correctiveDue,'Corrective Due')}${commandMetric(att.highRisk,'7+ Points')}${commandMetric(tm.overdue||0,'Overdue Tasks')}</div></div><aside class="command-hero-side"><div class="dashboard-eyebrow">System Snapshot</div><div class="command-status-row"><span>Critical</span><strong>${health.critical||0}</strong></div><div class="command-status-row"><span>Warnings</span><strong>${health.warning||0}</strong></div><div class="command-status-row"><span>Attendance Through</span><strong>${esc(fmt(latestAttendance)||'-')}</strong></div><div class="command-status-row"><span>Positive Credits Banked</span><strong>${esc(att.totalPositiveBank)}</strong></div><div class="command-status-row"><span>Active Roster</span><strong>${rosterCount}</strong></div></aside></section>
 ${peopleWorkflowNav('')}
 <section class="command-layout"><div class="command-main"><div class="command-panel"><div class="command-panel-head"><div><div class="command-panel-title">Today’s Priority</div><div class="command-panel-sub">Lead with the highest-risk queue, then work the remaining signals.</div></div><button onclick="safeRenderPages()">Refresh</button></div>${commandPriorityCard(lead,true)}<div class="priority-compact-grid">${remaining.map(x=>commandPriorityCard(x,false)).join('')}</div></div><div class="command-panel"><div class="command-panel-head"><div><div class="command-panel-title">Daily Workflow</div><div class="command-panel-sub">A controlled operating sequence from attendance through closure.</div></div></div><div class="daily-flow">${workflow.map((x,i)=>commandWorkflowStep(i+1,x[0],x[1],x[2],x[3])).join('')}</div></div></div><aside class="command-sidebar"><div class="command-panel"><div class="command-panel-head"><div><div class="command-panel-title">Quick Actions</div><div class="command-panel-sub">Current attendance and coverage controls without legacy queues.</div></div></div><div class="sidebar-action-grid">${[
   ['Attendance Daily Entry',"Complete or correct today's attendance by shift.",'Open',"activeAttView='daily';navigate('attendance')"],
   ['90-Day Grid','Review and reason-edit attendance history.','Open',"activeAttView='grid';navigate('attendance')"],
   ['Point Review','Review active points, positive bank, and clean workdays.','Open',"activeAttView='review';navigate('attendance')"],
   ['Corrective Action','Record due 3 / 6 / 9 point actions.','Open',"activeAttView='actions';navigate('attendance')"],
   ['Live Schedule','Review scheduled/off authority and coverage.','Open',"activeRosterView='schedule';navigate('roster')"]
 ].map(x=>commandSidebarAction(x[0],x[1],x[2],x[3])).join('')}</div></div><div class="command-panel"><div class="command-panel-head"><div><div class="command-panel-title">Recent Activity</div><div class="command-panel-sub">Most recent cross-module audit entries.</div></div></div><div class="recent-activity">${commandRecentActivityRows()}</div></div></aside></section>
 <details class="home-collapsible"><summary><span>Secondary Signals</span><span>Point status, positive credits, training, uniforms, supplies, intelligence, data health</span></summary><div class="home-collapsible-body"><div class="attention-grid">${secondary.join('')}</div></div></details>
 ${adminTools}${moduleMap}</div>`;
}
PWADCModuleRegistry.register('workflows-home');
