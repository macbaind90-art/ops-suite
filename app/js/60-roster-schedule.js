/* PWADC Security Operations Suite v3.3.0.2 | module: roster-schedule */
function programBasePath(){return String(settings.dataRoot||DEFAULT_SETTINGS.dataRoot)+'\\Programs'}
function programPath(p){return programBasePath()+'\\'+p.folder+'\\'+p.file}
function programFolderPath(p){return programBasePath()+'\\'+p.folder}
async function openProgram(id){const p=OTHER_PROGRAMS.find(x=>x.id===id);if(!p)return;try{await SuiteBridge.send('suite:openPath',{path:programPath(p)});toast('Opening '+p.title);}catch(e){toast('Open failed: '+e.message)}}
async function openProgramFolder(id){const p=OTHER_PROGRAMS.find(x=>x.id===id);if(!p)return;try{await SuiteBridge.send('suite:openPath',{path:programFolderPath(p)});toast('Opening '+p.title+' folder');}catch(e){toast('Open folder failed: '+e.message)}}
async function refreshStandalonePrograms(){try{const r=await SuiteBridge.send('suite:refreshPrograms');toast('Standalone programs refreshed');safeRenderPages();return r;}catch(e){toast('Refresh programs failed: '+e.message)}}

function renderOtherPrograms(){return `<div class="page-head"><div><div class="page-title">Other Programs</div><div class="page-sub">Standalone specialist tools launched outside the main suite to avoid script collisions and preserve the original workflows.</div></div><div class="btn-group"><button onclick="refreshStandalonePrograms()">Refresh Program Files</button><button onclick="SuiteBridge.send('suite:openPath',{path:programBasePath()}).catch(e=>toast('Open Programs folder failed: '+e.message))">Open Programs Folder</button></div></div>${screenGuide('other-programs')}<div class="notice">Program files are stored under <strong>${esc(programBasePath())}</strong>. The suite copies the packaged versions there on startup. If a tool is updated, use Refresh Program Files.</div><div class="grid cols-3">${OTHER_PROGRAMS.map(p=>`<div class="card module-card"><h3>${esc(p.title)}</h3><p>${esc(p.purpose)}</p><div class="notice" style="margin-top:12px"><strong>Expected file:</strong><br>${esc('Programs\\'+p.folder+'\\'+p.file)}</div><div class="btn-group" style="margin-top:14px"><button class="primary" onclick="openProgram('${p.id}')">Open Program</button><button onclick="openProgramFolder('${p.id}')">Open Folder</button></div></div>`).join('')}</div>`}

function renderRoster(){const views=['roster','schedule','uniforms'].concat(canViewLaborSummary()?['analytics']:[]);if(!views.includes(activeRosterView))activeRosterView='roster';return `<div class="page-head roster-page-head"><div><div class="page-title">Roster</div><div class="page-sub">Staff records, schedule, uniforms, and labor analytics. Training now lives on its own page. This module uses the shared roster JSON and keeps the original Staff Manager workflow as the blueprint.</div></div><div class="roster-utility-actions"><button class="admin-only" onclick="document.getElementById('rosterImportFile').click()">Import JSON</button><button class="admin-only" onclick="reloadPackagedRosterData()">Use Packaged Recovery JSON</button><button onclick="createRosterBackup()">Backup Now</button><button class="admin-only" onclick="syncAttendanceFromRoster(true)">Link Existing Attendance</button><button class="admin-only" onclick="hideAttendanceSyncDuplicates()">Hide Sync Duplicates</button><button class="admin-only" onclick="showArchivedRoster=!showArchivedRoster;safeRenderPages()">Archive / Old Employees</button><button onclick="exportRosterCSV()">Export CSV</button><input id="rosterImportFile" type="file" accept=".json,application/json" class="hidden" onchange="importRosterJSON(this)"></div></div>${screenGuide('roster')}${renderPeopleWorkflowNav(activeRosterView==='uniforms'?'uniforms':'roster')}<div class="subnav">${views.map(v=>`<button class="${activeRosterView===v?'active':''}" onclick="activeRosterView='${v}';safeRenderPages()">${v==='roster'?'Roster':v==='schedule'?'Schedule':v==='uniforms'?'Uniforms':'Analytics'}</button>`).join('')}</div>${activeRosterView==='roster'?renderRosterList():activeRosterView==='schedule'?renderRosterSchedule():activeRosterView==='uniforms'?renderRosterUniforms():renderRosterAnalytics()}`}

function renderRosterList(){const list=filteredRoster();const activeEmps=rosterActiveEmployees();const archiveCount=rosterArchivedEmployees().length;const total=activeEmps.length;const classCounts=employmentClassCounts(activeEmps);const openUni=activeEmps.reduce((n,e)=>n+['shirt','pants','jacket'].filter(k=>(e[k+'Status']||'')&&e[k+'Status']!=='issued').length,0);return `<div class="grid cols-4 roster-summary"><div class="kpi"><div class="num">${total}</div><div class="lbl">Employees</div></div><div class="kpi"><div class="num">${classCounts.FT||0}</div><div class="lbl">FT Pig</div></div><div class="kpi"><div class="num">${classCounts.PT||0}</div><div class="lbl">PT Pig</div></div><div class="kpi"><div class="num">${classCounts.TempToHire||0}</div><div class="lbl">TempToHire</div></div></div><div class="card roster-workbar-card"><div class="card-title">Roster Controls</div><div class="roster-filters roster-workbar"><div><label>Search</label><input value="${esc(rosterSearch)}" placeholder="Name, EID, rank, shift..." oninput="rosterSearch=this.value;safeRenderPages()"></div><div><label>Shift</label><select onchange="rosterShiftFilter=this.value;safeRenderPages()"><option value="all">All Shifts</option>${rosterShifts().map(x=>`<option value="${esc(x)}" ${rosterShiftFilter===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div><label>Rank</label><select onchange="rosterRankFilter=this.value;safeRenderPages()"><option value="all">All Ranks</option>${rosterRanks().map(x=>`<option value="${esc(x)}" ${rosterRankFilter===x?'selected':''}>${esc(rankLong(x))}</option>`).join('')}</select></div><div><label>Type</label><select onchange="rosterTypeFilter=this.value;safeRenderPages()"><option value="all">All Types</option>${rosterTypes().map(x=>`<option value="${esc(x)}" ${rosterTypeFilter===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="top-actions"><button class="primary admin-only" onclick="openEmployeeModal()">+ Add Employee</button><button class="admin-only" onclick="openManageRanksModal()">Manage Ranks</button><button onclick="openRosterPrintModal()">Print Roster</button><button onclick="exportRosterCSV()">Export CSV</button></div></div><div class="mini-note">Showing ${list.length} of ${total} active employees. ${archiveCount} archived / old employee(s) hidden by default. ${openUni} uniform need/order item(s) are still open. Employment class drives loaded-cost analytics: ${esc(laborRateSummary())}.</div></div><div class="table-wrap"><table class="wide-table roster-table"><thead><tr>${sortHeader('Name','name')}${sortHeader('EID','eid')}${sortHeader('Rank','rank')}${sortHeader('Shift','shift')}${sortHeader('Gate Shift','gateShift')}${sortHeader('Rate','rate')}${sortHeader('Type','type')}${sortHeader('PT/FT/Temp','employmentClass')}${sortHeader('HPW','scheduledHours')}${sortHeader('Base Wk','baseWeekCost')}${sortHeader('Loaded Wk','loadedWeekCost')}${sortHeader('RDO','rdo')}${sortHeader('Uniform','uniform')}${sortHeader('DOH','doh')}${sortHeader('DOP','dop')}${sortHeader('Notes','notes')}<th>Actions</th></tr></thead><tbody>${list.map(e=>`<tr><td><strong>${esc(fullName(e))}</strong></td><td>${esc(e.eid||'')}</td><td>${rankBadge(e.rank)}</td><td>${esc(e.shift||'')}</td><td>${esc(e.gateShift||'')}</td><td class="admin-pay">${money(e.rate)}</td><td>${esc(e.type||'')}</td><td>${esc(employmentClass(e))}</td><td class="admin-pay">${employeeCostProfile(e).hours}</td><td class="admin-pay">${money(employeeCostProfile(e).baseWeek)}</td><td class="admin-pay">${money(employeeCostProfile(e).loadedWeek)}</td><td>${esc((e.rdo||[]).join('/'))}</td><td>${uniformSummary(e)}</td><td>${esc(fmtDate(e.doh))}</td><td>${esc(fmtDate(e.dop))}</td><td class="notes-cell">${esc(e.notes||'')}</td><td><div class="td-actions"><button class="sm admin-only" onclick="openEmployeeModal('${esc(e.id)}')">Edit</button><button class="sm" onclick="openEmployeeProfile('${esc(e.id)}')">Profile</button><button class="sm" onclick="openTrainingForEmployee('${esc(e.id)}')">Training</button><button class="sm" onclick="openUniformsForEmployee('${esc(e.id)}')">Uniforms</button><button class="sm gold admin-only" onclick="openPromoteModal('${esc(e.id)}')">Promote</button><button class="sm admin-only" onclick="openMeritModal('${esc(e.id)}')">Merit</button><button class="sm danger admin-only" onclick="removeRosterEmployee('${esc(e.id)}')">Remove</button></div></td></tr>`).join('')||'<tr><td colspan="17">No roster records match the current filters.</td></tr>'}</tbody></table></div>${renderArchivedRosterSection()}`}
function rosterTypes(){return [...new Set(roster.employees.map(e=>e.type||'').filter(Boolean))].sort()}
const DEFAULT_RANKS=['PSO','SO','SSO','LSO','SUPV','Receptionist','ONIN','APS'];
function rosterCustomRanks(){
  roster.customRanks=Array.isArray(roster.customRanks)?roster.customRanks:[];
  return roster.customRanks.map(r=>String(r||'').trim()).filter(Boolean);
}
function allRosterRanks(){
  const set=new Set([...DEFAULT_RANKS,...rosterCustomRanks(),...roster.employees.map(e=>e.rank||'').filter(Boolean)]);
  return [...set].filter(Boolean).sort((a,b)=>rankLong(a).localeCompare(rankLong(b))||String(a).localeCompare(String(b)));
}
function rosterShifts(){return [...new Set(rosterActiveEmployees().map(e=>e.shift||'').filter(Boolean))].sort((a,b)=>rosterShift(a).localeCompare(rosterShift(b))||String(a).localeCompare(String(b)))}
function rosterRanks(){return allRosterRanks()}
function rankLong(rank){return ({PSO:'Security Trainee',SO:'Security Officer',SSO:'Senior Security Officer',LSO:'Lead Security Officer',SUPV:'Supervisor',ONIN:'ONIN',APS:'APS',Receptionist:'Receptionist'}[rank]||rank||'')}
function openManageRanksModal(){if(!canAdmin()){toast('Manage ranks is Admin-only');return;}
  roster.customRanks=Array.isArray(roster.customRanks)?roster.customRanks:[];
  const existing=rosterCustomRanks();
  showModal(`<div class="modal-head"><div class="modal-title">Manage Ranks</div><button onclick="closeModal()">Close</button></div><div class="notice">Default ranks stay available. Add custom ranks here when you need a new title/rank option.</div><div class="form-grid"><div class="full"><label>Add Rank</label><input id="newRankName" placeholder="Example: Coordinator, Manager, Lead Guard"></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmAddRank()">Add Rank</button></div><div class="card"><div class="card-title">Custom Ranks</div>${existing.length?existing.map(r=>`<div class="list-row"><strong>${esc(r)}</strong><button class="sm danger" onclick="removeCustomRank('${esc(r)}')">Remove</button></div>`).join(''):'<p class="mini-note">No custom ranks yet.</p>'}</div>`);
}
async function confirmAddRank(){
  const r=String(val('newRankName')||'').trim();
  if(!r){toast('Enter a rank first');return;}
  roster.customRanks=Array.isArray(roster.customRanks)?roster.customRanks:[];
  const exists=allRosterRanks().some(x=>x.toLowerCase()===r.toLowerCase());
  if(exists){toast('That rank already exists');return;}
  roster.customRanks.push(r);
  roster.audit=Array.isArray(roster.audit)?roster.audit:[];
  roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Rank added',detail:r});
  await saveRosterNow('rank-add');
  openManageRanksModal();
  safeRenderPages();
}
async function removeCustomRank(rank){
  const inUse=roster.employees.some(e=>String(e.rank||'').toLowerCase()===String(rank||'').toLowerCase());
  if(inUse){toast('Cannot remove rank while assigned to employees');return;}
  if(!confirm('Remove custom rank: '+rank+'?'))return;
  roster.customRanks=rosterCustomRanks().filter(r=>String(r).toLowerCase()!==String(rank).toLowerCase());
  roster.audit=Array.isArray(roster.audit)?roster.audit:[];
  roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Rank removed',detail:rank});
  await saveRosterNow('rank-remove');
  openManageRanksModal();
  safeRenderPages();
}
function rankBadge(rank){let cls=String(rank||'').toLowerCase().replace(/[^a-z0-9]/g,'');return `<span class="rank-badge ${cls}">${esc(rank||'')}</span>`}
function money(v){let n=Number(v);return Number.isFinite(n)&&n>0?'$'+n.toFixed(2):''}
function fmtDate(d){if(!d)return '';let x=new Date(d+'T00:00:00');return isNaN(x)?d:x.toLocaleDateString()}
function uniformSummary(e){let chips=[];for(const k of ['shirt','pants','jacket']){let st=e[k+'Status']||'';let size=e[k]||'';if(st)chips.push(`<span class="uniform-chip ${esc(st)}">${k[0].toUpperCase()} ${esc(size)} ${esc(st)}</span>`)}return `<div class="uniform-needs">${chips.join('')||'<span class="mini-note">Not set</span>'}</div>`}
function renderRosterTraining(){return renderTrainingPage()}
function openTrainingForEmployee(id){window._trainingEmployeeFocus=String(id||'');navigate('training');setTimeout(()=>{let el=document.getElementById('trainingEmp_'+String(id||'').replace(/[^a-zA-Z0-9_-]/g,''));if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('uniform-focus-flash');setTimeout(()=>el.classList.remove('uniform-focus-flash'),1800);}},140)}
function openUniformsForEmployee(id){window._uniformEmployeeFocus=String(id||'');activeRosterView='uniforms';safeRenderPages();setTimeout(()=>{let el=document.getElementById('uniformEmp_'+String(id||'').replace(/[^a-zA-Z0-9_-]/g,''));if(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('uniform-focus-flash');setTimeout(()=>el.classList.remove('uniform-focus-flash'),1800);}},120)}
function rosterSortValue(e,key){
 const v={name:fullName(e),eid:e.eid,rank:e.rank,shift:e.shift,gateShift:e.gateShift,rate:Number(e.rate||0),type:e.type,employmentClass:employmentClass(e),rdo:(e.rdo||[]).join('/'),uniform:[e.shirtStatus,e.pantsStatus,e.jacketStatus,e.shirt,e.pants,e.jacket].join(' '),doh:e.doh,dop:e.dop,notes:e.notes,scheduledHours:employeeCostProfile(e).hours,baseWeekCost:employeeCostProfile(e).baseWeek,loadedWeekCost:employeeCostProfile(e).loadedWeek}[key];
 return v===undefined||v===null?'':v;
}
function setRosterSort(key){if(rosterSortKey===key)rosterSortDir=rosterSortDir==='asc'?'desc':'asc';else{rosterSortKey=key;rosterSortDir='asc'}safeRenderPages()}
function sortHeader(label,key){const arrow=rosterSortKey===key?(rosterSortDir==='asc'?' ▲':' ▼'):'';const pay=['rate','scheduledHours','baseWeekCost','loadedWeekCost'].includes(key)?' admin-pay':'';return `<th class="sortable${pay}" onclick="setRosterSort('${key}')" title="Sort by ${esc(label)}">${esc(label)}${arrow}</th>`}
function filteredRoster(){let q=(rosterSearch||'').toLowerCase();return rosterActiveEmployees().filter(e=>{let blob=[fullName(e),e.eid,e.rank,e.shift,e.gateShift,e.type,employmentClass(e),e.notes].join(' ').toLowerCase();return (!q||blob.includes(q))&&(rosterShiftFilter==='all'||e.shift===rosterShiftFilter)&&(rosterRankFilter==='all'||e.rank===rosterRankFilter)&&(rosterTypeFilter==='all'||e.type===rosterTypeFilter)}).sort((a,b)=>{let av=rosterSortValue(a,rosterSortKey),bv=rosterSortValue(b,rosterSortKey);let cmp=0;if(typeof av==='number'||typeof bv==='number')cmp=(Number(av)||0)-(Number(bv)||0);else cmp=String(av||'').localeCompare(String(bv||''),undefined,{numeric:true,sensitivity:'base'});if(cmp===0)cmp=fullName(a).localeCompare(fullName(b),undefined,{numeric:true,sensitivity:'base'});return rosterSortDir==='desc'?-cmp:cmp})}
function renderArchivedRosterSection(){const list=rosterArchivedEmployees();if(!list.length)return '';return `<div class="archive-panel"><div class="archive-head" onclick="showArchivedRoster=!showArchivedRoster;safeRenderPages()"><div><div class="archive-title">Archive / Old Employees</div><div class="page-sub">Hidden by default. These records stay out of daily roster views but remain available for reference.</div></div><button onclick="showArchivedRoster=!showArchivedRoster;event.stopPropagation()">${showArchivedRoster?'Hide':'Show'} Archive (${list.length})</button></div>${showArchivedRoster?`<div class="archive-body"><div class="table-wrap"><table class="wide-table roster-table"><thead><tr><th>Name</th><th>EID</th><th>Rank</th><th>Shift</th><th>Archived</th><th>Notes</th><th>Actions</th></tr></thead><tbody>${list.map(e=>`<tr class="archived-row"><td><strong>${esc(fullName(e))}</strong> <span class="archive-badge">Archived</span></td><td>${esc(e.eid||'')}</td><td>${rankBadge(e.rank)}</td><td>${esc(e.shift||'')}</td><td>${esc(e.archivedAt?new Date(e.archivedAt).toLocaleDateString():'')}</td><td>${esc(e.notes||'')}</td><td><div class="td-actions"><button class="sm admin-only" onclick="openEmployeeModal('${esc(e.id)}')">Edit</button><button class="sm" onclick="openEmployeeProfile('${esc(e.id)}')">Profile</button><button class="sm gold" onclick="restoreArchivedEmployee('${esc(e.id)}')">Restore</button><button class="sm danger" onclick="deleteArchivedEmployee('${esc(e.id)}')">Delete</button></div></td></tr>`).join('')}</tbody></table></div></div>`:''}</div>`}
async function restoreArchivedEmployee(id){if(!canAdmin()){toast('Archive restore is Admin-only');return;}let e=roster.employees.find(x=>String(x.id)===String(id));if(!e)return;e.archived=false;e.status='Active';delete e.archivedAt;roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Employee restored',detail:fullName(e)});const ok=await saveRosterNow('employee-restore');if(ok){await syncAttendanceFromRoster(false);safeRenderPages();toast('Employee restored and synced to Attendance')}} 
async function deleteArchivedEmployee(id){if(!canAdmin()){toast('Archive deletion is Admin-only');return;}
  let idx=(roster.employees||[]).findIndex(x=>String(x.id)===String(id));
  if(idx<0)return;
  let e=roster.employees[idx];
  if(!isArchivedEmployee(e)){toast('Only archived employees can be deleted from this section.');return;}
  if(!confirm('Permanently delete '+fullName(e)+' from the Roster archive? Attendance history will not be deleted.'))return;
  roster.employees.splice(idx,1);
  roster.audit=roster.audit||[];
  roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Archived employee deleted from roster archive',detail:fullName(e)});
  let attChanged=false;
  for(let i=(attendance.employees||[]).length-1;i>=0;i--){
    const ae=attendance.employees[i];
    if(ae&&String(ae.rosterId||'')===String(id)){
      const hist=attendance.attendance&&attendance.attendance[ae.id]?Object.keys(attendance.attendance[ae.id]).length:0;
      if(hist===0){
        attendance.employees.splice(i,1);
        if(attendance.attendance)delete attendance.attendance[ae.id];
        attChanged=true;
      }else{
        ae.active=false;ae.archived=true;ae.status='Deleted from Roster Archive';ae.archivedAt=ae.archivedAt||new Date().toISOString();
        attChanged=true;
      }
    }
  }
  const ok=await saveRosterNow('archive-delete');
  if(attChanged)await saveAttendance('archive-delete-sync');
  if(ok){safeRenderPages();toast('Archived employee deleted from roster archive. Attendance history preserved.')}
}

function openEmployeeModal(id=''){if(!canAdmin()){toast('Roster editing is Admin-only');return;}let e=id?roster.employees.find(x=>String(x.id)===String(id)):null;e=e||{last:'',first:'',eid:'',doh:'',dop:'',rank:'PSO',shift:'1st',gateShift:'',rate:17,type:'Hourly',employmentClass:'FT',shirt:'',pants:'',jacket:'',shirtStatus:'',pantsStatus:'',jacketStatus:'',notes:'',rdo:[]};let days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];showModal(`<div class="modal-head"><div class="modal-title">${id?'Edit Employee':'Add Employee'}</div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div><label>Last Name</label><input id="empLast" value="${esc(e.last||'')}"></div><div><label>First Name</label><input id="empFirst" value="${esc(e.first||'')}"></div><div><label>EID</label><input id="empEid" value="${esc(e.eid||'')}"></div><div><label>Date of Hire</label><input id="empDoh" type="date" value="${esc(e.doh||'')}"></div><div><label>Date of Promotion</label><input id="empDop" type="date" value="${esc(e.dop||'')}"></div><div><label>Current Rank</label><select id="empRank">${allRosterRanks().map(r=>`<option value="${esc(r)}" ${e.rank===r?'selected':''}>${esc(rankLong(r))}</option>`).join('')}</select></div><div><label>Shift</label><select id="empShift" onchange="updateGateShiftControls()">${['1st','2nd','3rd','GATE','DOCK','RECP','Crosswalk','W/E Gate'].map(x=>`<option ${e.shift===x?'selected':''}>${x}</option>`).join('')}</select></div><div id="gateShiftGroup"><label>Gate Shift Assignment</label><select id="empGateShift">${['','0400-1200','1200-2000','2000-0400','0400-1600','1600-0400'].map(x=>`<option value="${x}" ${(e.gateShift||'')===x?'selected':''}>${x?((x==='0400-1600'||x==='1600-0400')?'W/E only: ':'Gate: ')+x:'None'}</option>`).join('')}</select></div><div><label>Pay Rate</label><input id="empRate" type="number" step="0.01" min="0" value="${esc(e.rate??'')}"></div><div><label>Employment Type</label><select id="empType">${['Hourly','Salary','Onin','APS'].map(t=>`<option ${e.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div><label>PT / FT / TempToHire</label><select id="empClass">${['FT','PT','TempToHire'].map(t=>`<option value="${t}" ${employmentClass(e)===t?'selected':''}>${t}</option>`).join('')}</select></div><div><label>Shirt Size</label><select id="empShirt">${['','XS','S','M','L','XL','2X','3X','4X','5X'].map(x=>`<option value="${x}" ${(e.shirt||'')===x?'selected':''}>${x}</option>`).join('')}</select></div><div><label>Shirt Status</label><select id="empShirtStatus">${['','needed','ordered','issued'].map(t=>`<option value="${t}" ${(e.shirtStatus||'')===t?'selected':''}>${t||'Not Set'}</option>`).join('')}</select></div><div><label>Pants Size</label><input id="empPants" value="${esc(e.pants||'')}" placeholder="32/34 or 14"></div><div><label>Pants Status</label><select id="empPantsStatus">${['','needed','ordered','issued'].map(t=>`<option value="${t}" ${(e.pantsStatus||'')===t?'selected':''}>${t||'Not Set'}</option>`).join('')}</select></div><div><label>Jacket Size</label><select id="empJacket">${['','XS','S','M','L','XL','2X','3X','4X','5X'].map(x=>`<option value="${x}" ${(e.jacket||'')===x?'selected':''}>${x}</option>`).join('')}</select></div><div><label>Jacket Status</label><select id="empJacketStatus">${['','needed','ordered','issued'].map(t=>`<option value="${t}" ${(e.jacketStatus||'')===t?'selected':''}>${t||'Not Set'}</option>`).join('')}</select></div><div class="full"><label>Regular Days Off</label><div class="day-grid">${days.map(d=>`<label class="day-check"><input type="checkbox" class="rdoBox" value="${d}" ${(e.rdo||[]).includes(d)?'checked':''}> ${d}</label>`).join('')}</div></div><div class="full"><label>Notes</label><textarea id="empNotes">${esc(e.notes||'')}</textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="saveEmployeeModal('${esc(id)}')">Save Employee</button></div>`);setTimeout(updateGateShiftControls,0)}
function updateGateShiftControls(){let sh=document.getElementById('empShift'),g=document.getElementById('gateShiftGroup');if(!sh||!g)return;g.style.display=(sh.value==='GATE'||sh.value==='W/E Gate')?'block':'none'}
async function saveEmployeeModal(id=''){if(!canAdmin()){toast('Roster editing is Admin-only');return;}
  try{
    const btn=document.querySelector('#modalBackdrop .modal-actions .primary, #modalBackdrop .form-actions .primary');
    if(btn){btn.disabled=true;btn.textContent='Saving...';}
    roster.employees=Array.isArray(roster.employees)?roster.employees:[];
    roster.audit=Array.isArray(roster.audit)?roster.audit:[];
    roster.nextId=Number(roster.nextId||0)||((roster.employees.reduce((m,e)=>Math.max(m,Number(e.id)||0),0))+1);
    let existing=id?roster.employees.find(e=>String(e.id)===String(id)):null;
    const wasNewEmployee=!existing;
    let e=existing||{id:roster.nextId++};
    const last=val('empLast').trim(), first=val('empFirst').trim();
    if(!last&&!first){toast('Employee needs a first or last name');if(btn){btn.disabled=false;btn.textContent='Save Employee';}return;}
    Object.assign(e,{last,first,eid:val('empEid').trim(),rank:val('empRank'),shift:val('empShift'),gateShift:val('empGateShift'),rate:Number(val('empRate')||0),type:val('empType'),employmentClass:val('empClass')||'FT',doh:val('empDoh'),dop:val('empDop'),shirt:val('empShirt'),pants:val('empPants'),jacket:val('empJacket'),shirtStatus:val('empShirtStatus'),pantsStatus:val('empPantsStatus'),jacketStatus:val('empJacketStatus'),notes:val('empNotes'),rdo:[...document.querySelectorAll('.rdoBox:checked')].map(x=>x.value)});
    if(!existing)roster.employees.push(e);
    roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:id?'Employee updated':'Employee added',detail:fullName(e)});
    const ok=await saveRosterNow(id?'employee-update':'employee-add');
    if(!ok){if(btn){btn.disabled=false;btn.textContent='Save Employee';}return;}
    try{await syncOneRosterEmployeeToAttendance(e,wasNewEmployee); await saveAttendanceNow(wasNewEmployee?'roster-add-employee-sync':'roster-edit-employee-sync');}catch(syncErr){reportActionError('Roster to Attendance sync',syncErr);}
    closeModal();safeRenderPages();toast(wasNewEmployee?'Roster employee added and synced to Attendance':'Roster employee saved and synced to Attendance');
  }catch(e){reportActionError('Save employee',e);}
}
async function archiveAttendanceForRosterEmployee(re){
  normalizeRoster();normalizeAttendance();
  if(!re)return {archived:false,matched:false};
  let ae=findAttendanceEmployeeForRoster(re)||findAttendanceEmployeeForRosterLoose(re);
  if(!ae)return {archived:false,matched:false};
  const already=isArchivedAttendanceEmployee(ae);
  ae.rosterId=String(re.id);
  ae.active=false;
  ae.archived=true;
  ae.status='Archived';
  ae.archivedAt=ae.archivedAt||new Date().toISOString();
  ae.removedFromRosterAt=ae.removedFromRosterAt||new Date().toISOString();
  ae.removedFromRosterBy=currentUserName()||env.user||'';
  attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
  attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Roster removal synced',detail:`${attendanceDisplayName(ae)} hidden from active Attendance after ${fullName(re)} was removed from Roster. Attendance history was preserved.`});
  return {archived:!already,matched:true,employee:ae};
}
async function removeRosterEmployee(id){if(!canAdmin()){toast('Roster removal is Admin-only');return;}
  let e=roster.employees.find(x=>String(x.id)===String(id));
  if(!e)return;
  if(!confirm('Archive '+fullName(e)+' as an old employee? They will also be removed from active Attendance. Attendance history will stay preserved.'))return;
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(err){console.warn('Pre-removal attendance backup failed',err)}
  const attendanceResult=await archiveAttendanceForRosterEmployee(e);
  e.archived=true;e.status='Archived';e.archivedAt=e.archivedAt||new Date().toISOString();
  roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Employee archived',detail:fullName(e)+(attendanceResult.matched?' · hidden from active Attendance':' · no active Attendance match found')});
  const rosterOk=await saveRosterNow('employee-archive');
  let attendanceOk=true;
  if(attendanceResult.matched)attendanceOk=await saveAttendanceNow('employee-archive-sync');
  if(rosterOk){safeRenderPages();toast(attendanceResult.matched?'Employee moved to Archive and removed from active Attendance':'Employee moved to Archive. No active Attendance record was found.');}
  if(!attendanceOk)toast('Roster archive saved, but Attendance sync failed. Check Data Health.');
}
function openPromoteModal(id){if(!canAdmin()){toast('Promotion changes are Admin-only');return;}let e=roster.employees.find(x=>String(x.id)===String(id));if(!e)return;let ranks=['PSO','SO','SSO','LSO','SUPV','Receptionist','ONIN','APS'];let idx=Math.max(0,ranks.indexOf(e.rank));let suggested=ranks[Math.min(idx+1,ranks.length-1)]||e.rank;showModal(`<div class="modal-head"><div class="modal-title">Promote Employee</div><button onclick="closeModal()">Close</button></div><div class="notice"><strong>${esc(fullName(e))}</strong><br>Current rank: ${esc(e.rank||'')}</div><div class="form-grid"><div><label>New Rank</label><select id="promoRank">${ranks.map(r=>`<option value="${r}" ${r===suggested?'selected':''}>${rankLong(r)}</option>`).join('')}</select></div><div><label>Effective Date</label><input id="promoDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div><label>New Rate</label><input id="promoRate" type="number" step="0.01" value="${esc(e.rate??'')}"></div><div><label>Update Schedule Labels</label><select id="promoSchedule"><option value="yes">Yes</option><option value="no">No</option></select></div><div class="full"><label>Note</label><textarea id="promoNote">Promoted from ${esc(e.rank||'')} to ${esc(suggested)}.</textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="gold" onclick="confirmPromote('${esc(id)}')">Confirm Promotion</button></div>`)}
function confirmPromote(id){if(!canAdmin()){toast('Promotion changes are Admin-only');return;}let e=roster.employees.find(x=>String(x.id)===String(id));if(!e)return;let oldRank=e.rank,newRank=val('promoRank');let oldLabel=(oldRank?oldRank+' ':'')+fullName(e),newLabel=(newRank?newRank+' ':'')+fullName(e);e.rank=newRank;e.dop=val('promoDate')||e.dop;e.rate=Number(val('promoRate')||e.rate||0);if(val('promoSchedule')==='yes'){for(const r of roster.schedule||[]){r.days=(r.days||[]).map(d=>d===oldLabel?newLabel:d)}}roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Employee promoted',detail:fullName(e)+' '+oldRank+' -> '+newRank});saveRosterNow('promotion').then(async ok=>{if(ok){await syncAttendanceFromRoster(false);closeModal();safeRenderPages();toast('Promotion applied and synced to Attendance')}})}
function openMeritModal(id){if(!canAdmin()){toast('Merit changes are Admin-only');return;}let e=roster.employees.find(x=>String(x.id)===String(id));if(!e)return;showModal(`<div class="modal-head"><div class="modal-title">Merit Increase</div><button onclick="closeModal()">Close</button></div><div class="notice"><strong>${esc(fullName(e))}</strong><br>Current rate: ${money(e.rate)}</div><div class="form-grid"><div><label>Increase Type</label><select id="meritType" onchange="calcMeritPreview('${esc(id)}')"><option value="dollar">Dollar Amount</option><option value="percent">Percent</option></select></div><div><label>Increase</label><input id="meritAmt" type="number" step="0.01" value="0.00" oninput="calcMeritPreview('${esc(id)}')"></div><div><label>Effective Date</label><input id="meritDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div><div><label>New Rate Preview</label><input id="meritPreview" readonly value="${money(e.rate)}"></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmMerit('${esc(id)}')">Apply Increase</button></div>`)}
function calcMeritPreview(id){let e=roster.employees.find(x=>String(x.id)===String(id));if(!e)return;let base=Number(e.rate||0),amt=Number(val('meritAmt')||0),type=val('meritType');let next=type==='percent'?base+(base*amt/100):base+amt;let out=document.getElementById('meritPreview');if(out)out.value=money(next)}
function confirmMerit(id){if(!canAdmin()){toast('Merit changes are Admin-only');return;}let e=roster.employees.find(x=>String(x.id)===String(id));if(!e)return;let base=Number(e.rate||0),amt=Number(val('meritAmt')||0),type=val('meritType');let next=type==='percent'?base+(base*amt/100):base+amt;e.rate=Number(next.toFixed(2));e.dop=val('meritDate')||e.dop;roster.audit.push({at:new Date().toISOString(),user:currentUserName()||env.user||'',action:'Merit increase',detail:fullName(e)+' '+money(base)+' -> '+money(e.rate)});saveRosterNow('merit').then(ok=>{if(ok){closeModal();safeRenderPages();toast('Merit increase applied')}})}

function printHtmlDirect(title,contentHtml,orientation='portrait'){
  const old=document.getElementById('directPrintFrame');
  if(old)old.remove();
  const frame=document.createElement('iframe');
  frame.id='directPrintFrame';
  frame.style.position='fixed';frame.style.right='0';frame.style.bottom='0';frame.style.width='0';frame.style.height='0';frame.style.border='0';frame.style.opacity='0';
  document.body.appendChild(frame);
  const doc=frame.contentWindow.document;
  const orient=orientation==='landscape'?'landscape':'portrait';
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title||'PWADC Print')}</title><style>
    @page{size:${orient};margin:.35in}
    *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;margin:0;font-size:11px;line-height:1.25}
    h1{font-size:20px;margin:0 0 3px 0}h2{font-size:15px;margin:14px 0 6px 0}h3{font-size:13px;margin:12px 0 5px 0}
    .print-header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:2px solid #222;padding-bottom:8px;margin-bottom:10px}
    .print-brand{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#444}.print-meta{font-size:10px;text-align:right;color:#555}.print-note{font-size:10px;color:#555;margin-top:2px}
    table{width:100%;border-collapse:collapse;page-break-inside:auto}thead{display:table-header-group}tr{page-break-inside:avoid;page-break-after:auto}
    th,td{border:1px solid #999;padding:4px;text-align:left;vertical-align:top}th{background:#eee;font-weight:700}.group-row th{background:#dfe3ea;text-transform:uppercase;letter-spacing:.4px}
    .muted{color:#666}.nowrap{white-space:nowrap}
  



</style></head><body>${contentHtml}</body></html>`);
  doc.close();
  setTimeout(()=>{try{frame.contentWindow.focus();frame.contentWindow.print();}catch(e){toast('Print dialog could not open');}setTimeout(()=>{try{frame.remove();}catch(_){ }},1500);},250);
}

function openRosterPrintModal(){let cols=['Name','EID','Rank','Shift','Gate Shift','Rate','Type','PT/FT/Temp','HPW','Base Week','Loaded Week','Base Month','Loaded Month','Base Year','Loaded Year','RDO','Uniform','DOH','DOP','Notes'];showModal(`<div class="modal-head"><div class="modal-title">Print Roster</div><button onclick="closeModal()">Close</button></div><div class="notice">Choose columns for a printable roster. Current filters are respected unless you choose all employees.</div><div class="form-grid"><div class="full"><label>Rows to Print</label><select id="rpScope"><option value="filtered">Current filtered roster</option><option value="all">All employees</option></select></div><div class="full"><label>Columns</label><div class="day-grid">${cols.map(c=>`<label class="day-check"><input type="checkbox" class="rpCol" value="${c}" checked> ${c}</label>`).join('')}</div></div></div><div class="modal-actions"><button onclick="setRosterPrintCols(false)">Basic</button><button onclick="setRosterPrintCols(true)">All Columns</button><button onclick="closeModal()">Cancel</button><button class="primary" onclick="printRosterCustom()">Print</button></div>`)}
function setRosterPrintCols(all){let basic=['Name','EID','Rank','Shift','Rate','RDO'];document.querySelectorAll('.rpCol').forEach(x=>x.checked=all||basic.includes(x.value))}
function printRosterCustom(){let scope=val('rpScope');let cols=[...document.querySelectorAll('.rpCol:checked')].map(x=>x.value);if(!cols.length){toast('Choose at least one roster column');return;}let list=scope==='all'?[...roster.employees].sort((a,b)=>fullName(a).localeCompare(fullName(b))):filteredRoster();let cell=(e,c)=>({Name:fullName(e),EID:e.eid,Rank:e.rank,Shift:e.shift,'Gate Shift':e.gateShift,Rate:money(e.rate),Type:e.type,'PT/FT/Temp':employmentClass(e),HPW:employeeCostProfile(e).hours,'Base Week':money(employeeCostProfile(e).baseWeek),'Loaded Week':money(employeeCostProfile(e).loadedWeek),'Base Month':money(employeeCostProfile(e).baseMonth),'Loaded Month':money(employeeCostProfile(e).loadedMonth),'Base Year':money(employeeCostProfile(e).baseYear),'Loaded Year':money(employeeCostProfile(e).loadedYear),RDO:(e.rdo||[]).join('/'),Uniform:['shirt','pants','jacket'].map(k=>`${k}:${e[k]||''} ${e[k+'Status']||''}`).join(' | '),DOH:fmtDate(e.doh),DOP:fmtDate(e.dop),Notes:e.notes}[c]||'');let body=`<div class="print-header"><div><div class="print-brand">PWADC Security Operations Suite</div><h1>PWADC Security Roster</h1><div class="print-note">${esc(scope==='all'?'All employees':'Current filtered roster')} · ${list.length} employee(s)</div></div><div class="print-meta">Generated ${esc(new Date().toLocaleString())}<br>Version v3.3.0.2</div></div><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${list.map(e=>`<tr>${cols.map(c=>`<td>${esc(cell(e,c))}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}">No roster records match the selected scope.</td></tr>`}</tbody></table>`;closeModal();printHtmlDirect('PWADC Security Roster',body,cols.length>8?'landscape':'portrait')}
function cloneScheduleRows(rows){return JSON.parse(JSON.stringify(Array.isArray(rows)?rows:[]))}
function scheduleDraftList(){roster.scheduleDrafts=Array.isArray(roster.scheduleDrafts)?roster.scheduleDrafts:[];return roster.scheduleDrafts}
function activeScheduleDraft(){if(scheduleWorkspaceMode!=='draft'||!scheduleWorkspaceDraftId)return null;return scheduleDraftList().find(d=>String(d.id)===String(scheduleWorkspaceDraftId))||null}
function scheduleWorkspaceIsDraft(){return !!activeScheduleDraft()}
function scheduleWorkspaceRows(){const d=activeScheduleDraft();if(d){d.schedule=Array.isArray(d.schedule)?d.schedule:[];return d.schedule}scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';return roster.schedule||[]}
function scheduleWorkspaceName(){const d=activeScheduleDraft();return d?(d.name||'Untitled Mock Schedule'):'Live Master Schedule'}
function scheduleWorkspaceAudit(action,detail=''){roster.audit=Array.isArray(roster.audit)?roster.audit:[];roster.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',action,detail})}
function touchScheduleDraft(){const d=activeScheduleDraft();if(!d)return;d.updatedAt=new Date().toISOString();d.updatedBy=currentUserName()||env.user||''}
function scheduleWorkspaceDetail(extra=''){const d=activeScheduleDraft();const base=d?('Mock: '+(d.name||'Untitled')):'Live schedule';return extra?base+' · '+extra:base}
function renderScheduleWorkspaceBanner(){const d=activeScheduleDraft();const drafts=scheduleDraftList().length;const clip=scheduleClipboard?`<span class="schedule-clipboard">Copied: ${esc(scheduleClipboard.value||'Closed')} · ${esc(scheduleClipboard.source||'schedule cell')}</span>`:'';if(d)return `<div class="schedule-workspace-banner mock"><div><span class="schedule-mode-pill mock">Mock / Not Published</span><strong>${esc(d.name||'Untitled Mock Schedule')}</strong><span>${esc(d.notes||'Draft staffing scenario. Changes here do not affect live HPW, labor analytics, attendance, or management reports.')}</span></div><div class="schedule-workspace-tools">${clip}<button onclick="openMockScheduleManager()">Mock Schedules (${drafts})</button><button onclick="returnToLiveSchedule()">Return to Live</button><button class="gold" onclick="openApplyMockScheduleModal('${esc(d.id)}')">Apply to Live</button></div></div>`;return `<div class="schedule-workspace-banner"><div><span class="schedule-mode-pill">Live / Published</span><strong>Live Master Schedule</strong><span>This is the schedule authority used for HPW, staffing reports, and labor analytics. ${drafts} mock schedule${drafts===1?' is':'s are'} being held separately.</span></div><div class="schedule-workspace-tools">${clip}<button onclick="openMockScheduleManager()">Mock Schedules (${drafts})</button><button class="gold" onclick="openCreateMockScheduleModal('live')">Save Current as Mock</button></div></div>`}
function renderRosterSchedule(){
 const rows=scheduleWorkspaceRows();const groups={};
 for(const row of rows){const sec=row.section||'Unsectioned';(groups[sec]=groups[sec]||[]).push(row)}
 const sections=Object.entries(groups);const draft=activeScheduleDraft();const title=draft?'Mock Schedule: '+(draft.name||'Untitled'):'Master Schedule';const sub=draft?'Sandbox schedule. Edit freely; it is held separately and does not drive live HPW, labor cost, attendance, or reports.':'The published schedule is the authority for HPW, staffing reports, and labor cost. Use Open/Pending intentionally for unfilled shifts. Closed cells are excluded from HPW.';
 const clearLabel=draft?'Clear Mock':'Clear Schedule';
 return `${renderScheduleWorkspaceBanner()}<div class="schedule-command"><div><div class="page-title" style="font-size:24px">${esc(title)}</div><div class="page-sub">${esc(sub)}</div></div><div class="schedule-actions"><button onclick="viewRosterSchedule()">${draft?'View Mock':'View Schedule'}</button><button onclick="printRosterSchedule()">${draft?'Print Mock':'Print Schedule'}</button><button onclick="exportScheduleOnly()">${draft?'Share Mock':'Share Schedule'}</button><button onclick="openAddScheduleRowModal()">+ Add Row</button><button class="gold" onclick="openAddScheduleSectionModal()">+ Add Section</button><button class="danger admin-only" onclick="openClearScheduleModal()">${clearLabel}</button></div></div>${renderScheduleWarningsPanel()}<div id="schedule-container">${sections.length?sections.map(([sec,rs])=>renderScheduleSection(sec,rs,false)).join(''):'<div class="card"><div class="card-title">No Schedule Rows</div><p class="muted">Add a section, return to the live schedule, or create a mock from the live schedule structure.</p></div>'}</div>`
}

const EMP_SECTION_COLORS={
 '1st Shift — 0800-1600':{'aiken, don':'#f65555','brewer, jazmine':'#1c38ec','birdsong, tiffany':'#54ec1c','reese, javontae':'#1caeec','bennett, jasmine':'#bc1cec','cleveland, kenyetta':'#f6c555','small, kendarius':'#55f6e0'},
 '2nd Shift — 1600-2400':{'parker, lacey':'#f65555','ferguson, matt':'#1c38ec','smathers, raymond':'#54ec1c','cave, jalisa':'#1caeec','wilson, damyn':'#bc1cec','westbrook, sharon':'#f6c555','howard, tamika':'#55f6e0'},
 '3rd Shift — 0000-0800':{'anderson, shaun':'#f65555','summerhill, rickey':'#1c38ec','nelson, addison':'#54ec1c','perry, elizabeth':'#1caeec','king, faith':'#bc1cec','bennett, zachary':'#f6c555','alvarez, raina':'#55f6e0','edwards, derriana':'#ff8fd1'},
 'Gate':{'paul, danillo':'#f65555','lancaster, kettrin':'#1c38ec','mack, danielle':'#54ec1c','hightower, kendrick':'#1caeec','abernathy, davetta':'#bc1cec','daniels, dominique':'#f6c555'},
 'Dock & Support':{'jones, kaylan':'#f65555','jones, kay':'#f65555','mack, gilbert':'#1c38ec','mack, mack':'#1c38ec','williams, kyesha':'#54ec1c','de la torre, nelli':'#1caeec'}
};
function normalizeScheduleNameKey(cell){
 const known=new Set(['PSO','SO','SSO','LSO','SUPV','ONIN','APS','RECEP','RECEPTIONIST']);
 const parts=String(cell||'').trim().split(/\s+/); if(parts.length>1&&known.has(parts[0].toUpperCase())) return parts.slice(1).join(' ').toLowerCase();
 return String(cell||'').trim().toLowerCase();
}
const SCHEDULE_COLOR_PALETTE=['#f65555','#1c38ec','#54ec1c','#1caeec','#bc1cec','#f6c555','#55f6e0','#ff8fd1','#a0e060','#e08a2f','#4a90d9','#c6b273','#ff6f91','#845ec2','#00c9a7','#ffc75f','#008f7a','#b39cd0','#4d8076','#d65db1'];
let scheduleColorCache=null;
function scheduleColorKey(cell){const x=String(cell||'').trim();if(!x||['none','open','pending','closed'].includes(x.toLowerCase()))return '';return normalizeScheduleNameKey(x)}
function buildScheduleColorCache(){
  const cache={};
  for(const row of scheduleWorkspaceRows()){
    const sec=row.section||'Unsectioned';
    const secCache=cache[sec]||(cache[sec]={});
    const fixed=EMP_SECTION_COLORS[sec]||{};
    const used=new Set(Object.values(secCache).concat(Object.values(fixed)));
    for(const cell of (row.days||[])){
      const key=scheduleColorKey(cell); if(!key||secCache[key])continue;
      if(fixed[key]){secCache[key]=fixed[key]; used.add(fixed[key]); continue;}
      let color=SCHEDULE_COLOR_PALETTE.find(c=>!used.has(c));
      if(!color){
        let h=0; const seed=sec+'|'+key; for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;
        color=SCHEDULE_COLOR_PALETTE[h%SCHEDULE_COLOR_PALETTE.length];
      }
      secCache[key]=color; used.add(color);
    }
  }
  scheduleColorCache=cache;
}
function empColorFromCell(cell,section){
  const key=scheduleColorKey(cell); if(!key)return null;
  if(!scheduleColorCache)buildScheduleColorCache();
  const sec=section||'Unsectioned';
  return (scheduleColorCache[sec]&&scheduleColorCache[sec][key])||null;
}
function scheduleCellParts(cell){
 const x=String(cell||'None').trim()||'None';
 if(['None','Open','Pending'].includes(x)) return {special:x,display:x==='None'?'Closed':x,rank:''};
 const known=new Set(['PSO','SO','SSO','LSO','SUPV','ONIN','APS','Receptionist','RECEP']);
 const m=x.match(/^([A-Za-z]+)\s(.+)$/); const raw=(m&&known.has(m[1]))?m[1]:''; const name=raw?m[2]:x;
 let abbr=''; const upper=raw.toUpperCase();
 if(['PSO','ONIN','APS'].includes(upper)) abbr='ST'; else if(!['SUPV','RECEP','RECEPTIONIST',''].includes(upper)) abbr=upper;
 return {special:'',display:name,rank:abbr};
}
function renderScheduleSection(sec,rows,forExport=false){
 const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 return `<div class="schedule-section"><div class="section-head"><span>${esc(sec)}</span>${forExport?'':`<span class="row-count">${rows.length} row${rows.length===1?'':'s'}</span>`}</div><div class="table-wrap schedule-wrap"><div class="schedule-grid"><div class="sch-head">Post</div>${days.map(d=>`<div class="sch-head">${d}</div>`).join('')}${rows.map(row=>renderScheduleRow(row,sec,forExport)).join('')}</div></div></div>`
}
function renderScheduleRow(row,sec,forExport=false){
 const idx=scheduleWorkspaceRows().indexOf(row);
 const post=`<div>${esc(row.post||'Post')}${row.shiftLabel?`<br><span style="font-size:9px;color:var(--muted);font-weight:500;">${esc(row.shiftLabel)}</span>`:''}${row.hrs?`<br><span style="font-size:9px;color:var(--muted);font-weight:500;">${esc(row.hrs)} cost hrs</span>`:''}${row.notes?`<span class="schedule-row-note">${esc(row.notes)}</span>`:''}</div>`;
 const tools=forExport?'':`<span class="sch-row-tools"><button class="sm" title="Edit row" onclick="openEditScheduleRowModal(${idx});event.stopPropagation()">Edit</button><button class="sm" title="Duplicate row" onclick="duplicateScheduleRow(${idx});event.stopPropagation()">Dup</button><button class="sm danger" title="Remove row" onclick="removeScheduleRow(${idx});event.stopPropagation()">Remove</button></span>`;
 const cells=(row.days||['None','None','None','None','None','None','None']).slice(0,7); while(cells.length<7)cells.push('None');
 return `<div class="sch-post">${post}${tools}</div>${cells.map((name,day)=>renderScheduleCell(name,sec,idx,day,forExport)).join('')}`
}
function renderScheduleCell(name,sec,idx,day,forExport=false){
 const p=scheduleCellParts(name); const color=empColorFromCell(name,sec); const cls=p.special==='None'?'sch-cell sch-closed':'sch-cell';
 if(p.special==='None') return `<div class="${cls}" ${forExport?'':`onclick="openScheduleCellModal(${idx},${day})"`}><div class="sch-name none">Closed</div>${forExport?'':'<div class="sch-edit-badge">EDIT</div>'}</div>`;
 if(p.special==='Open'||p.special==='Pending') return `<div class="sch-cell" ${forExport?'':`onclick="openScheduleCellModal(${idx},${day})"`}><div class="sch-name ${p.special.toLowerCase()}">${p.display}</div>${forExport?'':'<div class="sch-edit-badge">EDIT</div>'}</div>`;
 const personClass=color?'sch-cell sch-person-cell':'sch-cell';
 const style=color?`style="--emp-color:${color};--emp-bg:${color}28;background:${color}28;border-left:3px solid ${color};padding-left:5px;"`:'';
 const rank=p.rank?`<span class="sch-rank-abbr" style="color:${forExport?'#fff':(color||'var(--muted)')}">${esc(p.rank)}</span>`:'';
 return `<div class="${personClass}" ${style} ${forExport?'':`onclick="openScheduleCellModal(${idx},${day})"`}><div class="sch-person-name" style="color:${forExport?'#fff':'var(--text)'};font-weight:700;font-size:11px;line-height:1.3;">${esc(p.display)}${rank}</div>${forExport?'':'<div class="sch-edit-badge">EDIT</div>'}</div>`
}
function scheduleNameClass(name){const x=String(name||'').toLowerCase();if(x==='none')return 'none';if(x==='open')return 'open';if(x==='pending')return 'pending';return ''}
function uniqueScheduleSections(){return Array.from(new Set(scheduleWorkspaceRows().map(r=>r.section||'Unsectioned')))}
function employeeScheduleLabel(e){return ((e.rank||'')?e.rank+' ':'')+fullName(e)}
function normalizedShiftText(v){return String(v||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim()}
function employeeMatchesScheduleContext(e,section='',post=''){
 const sec=normalizedShiftText(section),pst=normalizedShiftText(post),sh=normalizedShiftText(e.shift),gate=normalizedShiftText(e.gateShift),blob=[sh,gate,pst].join(' ');
 if(!sec)return true;
 if(sec.includes('1st'))return sh.includes('1st')||sh==='first';
 if(sec.includes('2nd'))return sh.includes('2nd')||sh==='second';
 if(sec.includes('3rd'))return sh.includes('3rd')||sh==='third';
 if(sec.includes('gate'))return sh.includes('gate')||gate.length>0||pst.includes('gate');
 if(sec.includes('dock')||sec.includes('support'))return sh.includes('dock')||sh.includes('crosswalk')||sh.includes('reception')||pst.includes('dock')||pst.includes('grocery')||pst.includes('perishable')||pst.includes('crosswalk')||pst.includes('reception');
 return blob.includes(sec.split(' ')[0]);
}
function scheduleEmployeePool(section='',post=''){
 const active=rosterActiveEmployees();
 const pool=scheduleWorkspaceIsDraft()?active:active.filter(e=>employeeMatchesScheduleContext(e,section,post));
 return pool.sort((a,b)=>fullName(a).localeCompare(fullName(b),undefined,{numeric:true,sensitivity:'base'}));
}
function scheduleEmployeeSearchText(e){return [fullName(e),e.eid||'',e.rank||'',e.shift||'',e.gateShift||''].join(' ').toLowerCase()}
function scheduleEmployeeSearchPool(section='',post=''){
 const active=rosterActiveEmployees();
 const pool=scheduleWorkspaceIsDraft()?active:active.filter(e=>employeeMatchesScheduleContext(e,section,post));
 return pool.sort((a,b)=>fullName(a).localeCompare(fullName(b),undefined,{numeric:true,sensitivity:'base'}));
}
function scheduleEmployeeTypeaheadResults(query='',section='',post=''){
 const q=String(query||'').trim().toLowerCase();
 const pool=scheduleEmployeeSearchPool(section,post);
 if(!q)return pool.slice(0,12);
 return pool.filter(e=>scheduleEmployeeSearchText(e).includes(q)).sort((a,b)=>{
   const an=fullName(a).toLowerCase(),bn=fullName(b).toLowerCase(),ae=String(a.eid||'').toLowerCase(),be=String(b.eid||'').toLowerCase();
   const as=(an.startsWith(q)||ae.startsWith(q))?0:1,bs=(bn.startsWith(q)||be.startsWith(q))?0:1;
   return as-bs||an.localeCompare(bn,undefined,{numeric:true,sensitivity:'base'});
 }).slice(0,12);
}
let scheduleTypeaheadActiveIndex=-1;
function renderScheduleEmployeeTypeahead(){
 const input=document.getElementById('schedCellSearch'),box=document.getElementById('schedCellTypeahead');if(!input||!box||!scheduleEditContext)return;
 const row=scheduleWorkspaceRows()[scheduleEditContext.idx];if(!row)return;
 const results=scheduleEmployeeTypeaheadResults(input.value,row.section||'',row.post||'');
 scheduleTypeaheadActiveIndex=-1;
 box.innerHTML=results.length?results.map((e,i)=>`<button type="button" class="schedule-typeahead-option" data-typeahead-index="${i}" onmousedown="event.preventDefault();selectScheduleTypeaheadEmployee('${esc(e.id)}')"><strong>${esc(fullName(e))}</strong><span>EID ${esc(e.eid||'—')} · ${esc(rankLong(e.rank||'')||e.rank||'No rank')} · ${esc(e.shift||'No shift')}</span></button>`).join(''):`<div class="schedule-typeahead-empty">No matching active roster employee${scheduleWorkspaceIsDraft()?'':' in this live schedule section'}.</div>`;
 box.classList.add('open');
}
function hideScheduleEmployeeTypeahead(){const box=document.getElementById('schedCellTypeahead');if(box)box.classList.remove('open')}
function scheduleCellSearchChanged(){const hidden=document.getElementById('schedCellAssign');if(hidden)hidden.value='';renderScheduleEmployeeTypeahead()}
function selectScheduleTypeaheadEmployee(id){
 const e=rosterActiveEmployees().find(x=>String(x.id)===String(id));if(!e)return;
 const hidden=document.getElementById('schedCellAssign'),input=document.getElementById('schedCellSearch');
 if(hidden)hidden.value=employeeScheduleLabel(e);if(input)input.value=fullName(e)+(e.eid?' · '+e.eid:'');
 hideScheduleEmployeeTypeahead();
}
function scheduleTypeaheadKey(event){
 const box=document.getElementById('schedCellTypeahead');if(!box)return;const opts=[...box.querySelectorAll('.schedule-typeahead-option')];
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();if(!opts.length)return;
   scheduleTypeaheadActiveIndex=event.key==='ArrowDown'?Math.min(opts.length-1,scheduleTypeaheadActiveIndex+1):Math.max(0,scheduleTypeaheadActiveIndex<0?opts.length-1:scheduleTypeaheadActiveIndex-1);
   opts.forEach((o,i)=>o.classList.toggle('active',i===scheduleTypeaheadActiveIndex));opts[scheduleTypeaheadActiveIndex]?.scrollIntoView({block:'nearest'});return;
 }
 if(event.key==='Enter'&&opts.length){event.preventDefault();const i=scheduleTypeaheadActiveIndex>=0?scheduleTypeaheadActiveIndex:0;opts[i]?.dispatchEvent(new MouseEvent('mousedown',{bubbles:true}));return;}
 if(event.key==='Escape'){hideScheduleEmployeeTypeahead();}
}
function scheduleEmployeeOptions(selected='',section='',post=''){
 const base=['None','Open','Pending'];
 const selectedLabel=String(selected||'');
 let emps=scheduleEmployeePool(section,post).map(employeeScheduleLabel);
 if(selectedLabel&&!base.includes(selectedLabel)&&!emps.includes(selectedLabel))emps=[selectedLabel,...emps];
 return [...base,...emps].map(v=>`<option value="${esc(v)}" ${String(selected)===String(v)?'selected':''}>${esc(v)}</option>`).join('')
}
function updateScheduleAssignOptions(){const sec=val('schedRowSection')||'';const post=val('schedRowPost')||'';const el=document.getElementById('schedRowAssign');if(el)el.innerHTML=scheduleEmployeeOptions(el.value||'None',sec,post)}

function scheduleRowWindowHours(row){
 const t=String(row.shiftLabel||'').match(/(\d{3,4})\s*-\s*(\d{3,4})/); if(!t)return null;
 const mins=x=>{x=String(x).padStart(4,'0');return Number(x.slice(0,2))*60+Number(x.slice(2));};
 let a=mins(t[1]),b=mins(t[2]); if(b<=a)b+=1440; return Math.round((b-a)/60*100)/100;
}
function scheduleWarnings(rowsOverride=null){
 const warnings=[]; const rows=Array.isArray(rowsOverride)?rowsOverride:scheduleWorkspaceRows();
 rows.forEach((row,idx)=>{
   const label=(row.section||'Unsectioned')+' / '+(row.post||'Post');
   const hrs=Number(row.hrs||0);
   if(!hrs||hrs<=0)warnings.push({level:'bad',msg:`${label}: missing or invalid cost hours.`});
   const windowHours=scheduleRowWindowHours(row);
   if(windowHours!==null&&hrs&&Math.abs(windowHours-hrs)>1){warnings.push({level:'warn',msg:`${label}: coverage window is ${windowHours} hours but cost hours is ${hrs}. Confirm this is intentional.`});}
   (row.days||[]).slice(0,7).forEach((cell,day)=>{
     const v=String(cell||'').trim(); const dayName=DAYS[day]||('Day '+day);
     if(v==='')warnings.push({level:'warn',msg:`${label} ${dayName}: blank active cell. Use Closed, Open, Pending, or assign an employee.`});
     if(['open','pending'].includes(v.toLowerCase()))warnings.push({level:'warn',msg:`${label} ${dayName}: ${v} will count as unfilled HPW.`});
     if(v&&!['none','closed','open','pending'].includes(v.toLowerCase())){const emp=findRosterByScheduleName(v); if(emp&&isRosterArchived(emp))warnings.push({level:'bad',msg:`${label} ${dayName}: ${schedulePersonName(v)} is inactive/archived on the roster.`});}
   });
 });
 const byEmp={};
 for(const row of rows){for(const cell of (row.days||[]).slice(0,7)){const low=String(cell||'').trim().toLowerCase();if(!cell||['none','closed','open','pending'].includes(low))continue;const emp=findRosterByScheduleName(cell);if(emp){const id=String(emp.id);byEmp[id]=(byEmp[id]||{name:fullName(emp),hours:0});byEmp[id].hours+=Number(row.hrs||8);}}}
 const base=Number(settings.fteBaselineHours||40); Object.values(byEmp).forEach(x=>{if(x.hours>base)warnings.push({level:'warn',msg:`${x.name}: scheduled ${x.hours} HPW, above the ${base} HPW baseline.`});});
 return warnings;
}
function renderScheduleWarningsPanel(){
 const warnings=scheduleWarnings();
 if(!warnings.length)return `<div class="schedule-warning-panel ok"><div class="schedule-warning-title">Schedule Data Check</div><div class="mini-note">No schedule warnings found. HPW will use named assignments, while Open/Pending cells count as unfilled.</div></div>`;
 const top=warnings.slice(0,8);
 return `<div class="schedule-warning-panel"><div class="schedule-warning-title">Schedule Data Check · ${warnings.length} item${warnings.length===1?'':'s'}</div><ul class="schedule-warning-list">${top.map(w=>`<li><strong>${w.level==='bad'?'Fix':'Review'}:</strong> ${esc(w.msg)}</li>`).join('')}${warnings.length>top.length?`<li><strong>More:</strong> ${warnings.length-top.length} additional item(s). Use Data Health for broader review.</li>`:''}</ul></div>`;
}
function scheduleStatusOptions(selected='',section='',post=''){
 const base=[['None','Closed'],['Open','Open / Unfilled'],['Pending','Pending / Tentative']];
 const selectedLabel=String(selected||'');
 let emps=scheduleEmployeePool(section,post).map(employeeScheduleLabel);
 if(selectedLabel&&!['None','Open','Pending'].includes(selectedLabel)&&!emps.includes(selectedLabel))emps=[selectedLabel,...emps];
 return base.map(([v,l])=>`<option value="${esc(v)}" ${String(selected)===String(v)?'selected':''}>${esc(l)}</option>`).join('')+emps.map(v=>`<option value="${esc(v)}" ${String(selected)===String(v)?'selected':''}>${esc(v)}</option>`).join('');
}
function scheduleDayAssignmentGrid(row,prefix='editDay'){
 const cells=(row.days||['None','None','None','None','None','None','None']).slice(0,7);while(cells.length<7)cells.push('None');
 return `<div class="schedule-day-grid">${DAYS.map((d,i)=>`<div><label>${d}</label><select id="${prefix}${i}">${scheduleStatusOptions(cells[i],row.section||'',row.post||'')}</select></div>`).join('')}</div>`;
}
function collectScheduleDayAssignments(prefix='editDay'){
 return DAYS.map((_,i)=>val(prefix+i)||'None');
}
function setScheduleEditorPattern(pattern){
 const get=i=>document.getElementById('editDay'+i); if(!get(0))return;
 if(pattern==='clear'){for(let i=0;i<7;i++)get(i).value='None';}
 if(pattern==='close-weekends'){get(0).value='None';get(6).value='None';}
 if(pattern==='mon-fri-open'){get(0).value='None';get(6).value='None';for(let i=1;i<=5;i++)get(i).value='Open';}
 if(pattern==='copy-mon-weekdays'){const mon=get(1).value||'None';for(let i=2;i<=5;i++)get(i).value=mon;}
 if(pattern==='copy-sun-sat'){const sun=get(0).value||'None';get(6).value=sun;}
}
function duplicateScheduleRow(idx){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}const rows=scheduleWorkspaceRows();const row=rows[idx];if(!row)return;const copy=JSON.parse(JSON.stringify(row));copy.post=(copy.post||'Post')+' Copy';copy.autoAdded=false;rows.splice(idx+1,0,copy);touchScheduleDraft();scheduleColorCache=null;scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule row duplicated':'Schedule row duplicated',scheduleWorkspaceDetail((row.section||'')+' · '+(row.post||'')));saveRoster('schedule-row-duplicate');safeRenderPages();toast(scheduleWorkspaceIsDraft()?'Mock schedule row duplicated':'Schedule row duplicated');}
function openAddScheduleRowModal(){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}
 const sections=uniqueScheduleSections();
 showModal(`<div class="modal-head"><div><div class="modal-title">Add Schedule Row</div><div class="schedule-editor-help">Coverage window is the shift time shown on the schedule. Cost hours drive HPW and labor cost.</div></div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div class="full"><label>Section</label><select id="schedRowSection" onchange="updateScheduleAssignOptions()">${sections.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select></div><div><label>Post Label</label><input id="schedRowPost" placeholder="Response, Floater, Gate" oninput="updateScheduleAssignOptions()"></div><div><label>Coverage Window</label><input id="schedRowShift" placeholder="0600-1400"></div><div><label>Cost Hours</label><input id="schedRowHours" type="number" min="0" step="0.25" value="8"></div><div class="full"><label>Initial Assignment / Status</label><select id="schedRowAssign">${scheduleStatusOptions('None',sections[0]||'','')}</select><div class="schedule-editor-help">Use Open or Pending for unfilled shifts. Use Closed for inactive days. Blank cells should be avoided.</div></div><div class="full"><label>Row Notes</label><textarea id="schedRowNotes" placeholder="Lunch relief covered by rover, weekend-only post, remote gate eligible..."></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmAddScheduleRow()">Add Row</button></div>`)
}
function confirmAddScheduleRow(){
 const assignment=val('schedRowAssign')||'None';
 const hrs=Number(val('schedRowHours')||8); if(hrs<0){toast('Cost hours cannot be negative');return;}
 scheduleColorCache=null;scheduleWorkspaceRows().push({section:val('schedRowSection')||'Unsectioned',post:val('schedRowPost')||'New Row',shiftLabel:val('schedRowShift')||'',hrs:hrs,notes:val('schedRowNotes')||'',autoAdded:false,days:[assignment,assignment,assignment,assignment,assignment,assignment,assignment]});
 touchScheduleDraft();scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule row added':'Schedule row added',scheduleWorkspaceDetail((val('schedRowSection')||'')+' · '+(val('schedRowPost')||'New Row')));
 saveRoster('schedule-row-add');closeModal();safeRenderPages();toast(scheduleWorkspaceIsDraft()?'Mock schedule row added':'Schedule row added')
}
function openAddScheduleSectionModal(){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}
 showModal(`<div class="modal-head"><div class="modal-title">Add Schedule Section</div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div class="full"><label>Section Name</label><input id="schedSectionName" placeholder="4th Shift — 1000-1800"></div><div><label>First Post Label</label><input id="schedSectionPost" placeholder="Supervisor"></div><div><label>Shift Time</label><input id="schedSectionShift" placeholder="1000-1800"></div><div><label>Hours</label><select id="schedSectionHours"><option value="8">8 hours</option><option value="10">10 hours</option><option value="12">12 hours</option></select></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmAddScheduleSection()">Create Section</button></div>`)
}
function confirmAddScheduleSection(){
 const sec=val('schedSectionName')||'New Section';
 scheduleColorCache=null;scheduleWorkspaceRows().push({section:sec,post:val('schedSectionPost')||'New Post',shiftLabel:val('schedSectionShift')||'',hrs:Number(val('schedSectionHours')||8),autoAdded:false,days:['None','None','None','None','None','None','None']});
 touchScheduleDraft();scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule section added':'Schedule section added',scheduleWorkspaceDetail(sec));
 saveRoster('schedule-section-add');closeModal();safeRenderPages();toast(scheduleWorkspaceIsDraft()?'Mock schedule section added':'Schedule section added')
}
function openEditScheduleRowModal(idx){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}
 const row=scheduleWorkspaceRows()[idx];if(!row)return;
 showModal(`<div class="modal-head"><div><div class="modal-title">Edit Schedule Row</div><div class="schedule-editor-help">Edit coverage window, cost hours, notes, and each day status/assignment in one place.</div></div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div class="full"><label>Section</label><input id="editRowSection" value="${esc(row.section||'')}"></div><div><label>Post Label</label><input id="editRowPost" value="${esc(row.post||'')}"></div><div><label>Coverage Window</label><input id="editRowShift" value="${esc(row.shiftLabel||'')}"></div><div><label>Cost Hours</label><input id="editRowHours" type="number" min="0" step="0.25" value="${esc(row.hrs||8)}"></div><div class="full"><label>Row Notes</label><textarea id="editRowNotes" placeholder="Lunch relief covered by rover, weekend-only post, remote gate eligible...">${esc(row.notes||'')}</textarea></div><div class="full"><label>Daily Assignments / Status</label>${scheduleDayAssignmentGrid(row,'editDay')}<div class="schedule-pattern-tools"><button onclick="setScheduleEditorPattern('copy-mon-weekdays')" type="button">Copy Mon to Tue-Fri</button><button onclick="setScheduleEditorPattern('close-weekends')" type="button">Close Weekends</button><button onclick="setScheduleEditorPattern('mon-fri-open')" type="button">Mon-Fri Open</button><button onclick="setScheduleEditorPattern('copy-sun-sat')" type="button">Copy Sun to Sat</button><button onclick="setScheduleEditorPattern('clear')" type="button">Close Entire Row</button></div><div class="schedule-status-note"><strong>Status rules:</strong> Named employees count as scheduled HPW. Open and Pending count as unfilled HPW. Closed is ignored by HPW and labor reports.</div></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button onclick="duplicateScheduleRow(${idx});closeModal()">Duplicate Row</button><button class="danger" onclick="removeScheduleRow(${idx});closeModal()">Remove Row</button><button class="primary" onclick="confirmEditScheduleRow(${idx})">Save Row</button></div>`)
}
function confirmEditScheduleRow(idx){const rows=scheduleWorkspaceRows();const row=rows[idx];if(!row)return;const hrs=Number(val('editRowHours')||row.hrs||8);if(hrs<0){toast('Cost hours cannot be negative');return;}row.section=val('editRowSection')||row.section;scheduleColorCache=null;row.post=val('editRowPost')||row.post;row.shiftLabel=val('editRowShift')||'';row.hrs=hrs;row.notes=val('editRowNotes')||'';row.days=collectScheduleDayAssignments('editDay');touchScheduleDraft();scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule row edited':'Schedule row edited',scheduleWorkspaceDetail(row.section+' · '+row.post));saveRoster('schedule-row-edit');closeModal();safeRenderPages();toast(scheduleWorkspaceIsDraft()?'Mock schedule row updated':'Schedule row updated')}
function openCreateMockScheduleModal(source='live'){if(!canAdmin()){toast('Mock schedule creation is Admin-only');return;}const defaultName='Mock Schedule '+new Date().toLocaleDateString();showModal(`<div class="modal-head"><div><div class="modal-title">Create Mock Schedule</div><div class="schedule-editor-help">Mock schedules are stored in the roster data file but never become the schedule authority until you explicitly apply one to live.</div></div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div class="full"><label>Mock Schedule Name</label><input id="mockScheduleName" value="${esc(defaultName)}"></div><div class="full"><label>Starting Point</label><select id="mockScheduleSource"><option value="live" ${source==='live'?'selected':''}>Copy current live schedule</option><option value="blank" ${source==='blank'?'selected':''}>Blank assignments, keep current live sections/posts</option></select></div><div class="full"><label>Notes / Purpose</label><textarea id="mockScheduleNotes" rows="3" placeholder="Example: Proposed gate realignment, staffing reduction scenario, 12-hour shift concept..."></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="gold" onclick="confirmCreateMockSchedule()">Create & Open Mock</button></div>`)}
function confirmCreateMockSchedule(){const name=String(val('mockScheduleName')||'').trim();if(!name){toast('Mock schedule name is required');return;}const source=val('mockScheduleSource')||'live';let rows=cloneScheduleRows(roster.schedule||[]);if(source==='blank'){for(const row of rows){row.days=['None','None','None','None','None','None','None'];}}const now=new Date().toISOString();const draft={id:'mock-'+Date.now()+'-'+Math.floor(Math.random()*1000),name,notes:val('mockScheduleNotes')||'',createdAt:now,updatedAt:now,createdBy:currentUserName()||env.user||'',updatedBy:currentUserName()||env.user||'',source:source==='blank'?'Blank assignments from live structure':'Copy of live schedule',schedule:rows};scheduleDraftList().unshift(draft);scheduleWorkspaceMode='draft';scheduleWorkspaceDraftId=draft.id;scheduleColorCache=null;scheduleWorkspaceAudit('Mock schedule created',name+' · '+draft.source);saveRoster('mock-schedule-create');closeModal();safeRenderPages();toast('Mock schedule created. Live schedule is unchanged.')}
function openMockSchedule(id){const d=scheduleDraftList().find(x=>String(x.id)===String(id));if(!d){toast('Mock schedule not found');return;}scheduleWorkspaceMode='draft';scheduleWorkspaceDraftId=d.id;scheduleColorCache=null;closeModal();safeRenderPages();toast('Opened mock schedule: '+d.name)}
function returnToLiveSchedule(){scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';scheduleColorCache=null;safeRenderPages();toast('Returned to live master schedule')}
function openRenameMockScheduleModal(id){const d=scheduleDraftList().find(x=>String(x.id)===String(id));if(!d)return;showModal(`<div class="modal-head"><div class="modal-title">Rename Mock Schedule</div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div class="full"><label>Name</label><input id="renameMockName" value="${esc(d.name||'')}"></div><div class="full"><label>Notes / Purpose</label><textarea id="renameMockNotes" rows="3">${esc(d.notes||'')}</textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="confirmRenameMockSchedule('${esc(d.id)}')">Save</button></div>`)}
function confirmRenameMockSchedule(id){const d=scheduleDraftList().find(x=>String(x.id)===String(id));if(!d)return;const name=String(val('renameMockName')||'').trim();if(!name){toast('Name is required');return;}const old=d.name||'Untitled';d.name=name;d.notes=val('renameMockNotes')||'';d.updatedAt=new Date().toISOString();d.updatedBy=currentUserName()||env.user||'';scheduleWorkspaceAudit('Mock schedule renamed',old+' -> '+name);saveRoster('mock-schedule-rename');closeModal();safeRenderPages();toast('Mock schedule updated')}
function duplicateMockSchedule(id){if(!canAdmin()){toast('Mock schedule changes are Admin-only');return;}const d=scheduleDraftList().find(x=>String(x.id)===String(id));if(!d)return;const now=new Date().toISOString();const copy={...JSON.parse(JSON.stringify(d)),id:'mock-'+Date.now()+'-'+Math.floor(Math.random()*1000),name:(d.name||'Mock Schedule')+' Copy',createdAt:now,updatedAt:now,createdBy:currentUserName()||env.user||'',updatedBy:currentUserName()||env.user||''};scheduleDraftList().unshift(copy);scheduleWorkspaceAudit('Mock schedule duplicated',(d.name||'Untitled')+' -> '+copy.name);saveRoster('mock-schedule-duplicate');openMockScheduleManager();toast('Mock schedule duplicated')}
function deleteMockSchedule(id){if(!canAdmin()){toast('Mock schedule deletion is Admin-only');return;}const list=scheduleDraftList();const idx=list.findIndex(x=>String(x.id)===String(id));if(idx<0)return;const d=list[idx];if(!confirm('Delete mock schedule "'+(d.name||'Untitled')+'"? This does not affect the live schedule.'))return;list.splice(idx,1);if(String(scheduleWorkspaceDraftId)===String(id)){scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';}scheduleWorkspaceAudit('Mock schedule deleted',d.name||'Untitled');saveRoster('mock-schedule-delete');openMockScheduleManager();toast('Mock schedule deleted')}
function openMockScheduleManager(){const list=scheduleDraftList().slice().sort((a,b)=>String(b.updatedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.createdAt||'')));showModal(`<div class="modal-head"><div><div class="modal-title">Mock Schedule Library</div><div class="schedule-editor-help">Held scenarios remain separate from the live master schedule. Applying a mock to live requires a backup and explicit confirmation.</div></div><button onclick="closeModal()">Close</button></div><div class="modal-actions" style="justify-content:flex-start"><button class="gold" onclick="openCreateMockScheduleModal('live')">New from Live</button><button onclick="openCreateMockScheduleModal('blank')">New Blank Assignments</button></div><div class="schedule-draft-list">${list.length?list.map(d=>`<div class="schedule-draft-row"><div><strong>${esc(d.name||'Untitled Mock Schedule')}</strong><small>${esc(d.notes||d.source||'Held staffing scenario')}</small></div><div><span class="mock-watermark">Mock</span><small>Updated ${esc(d.updatedAt?new Date(d.updatedAt).toLocaleString():'Unknown')}</small></div><div><small>Created by ${esc(d.createdBy||'Unknown')}</small><small>${esc(d.source||'')}</small></div><div class="schedule-draft-actions"><button class="sm primary" onclick="openMockSchedule('${esc(d.id)}')">Open</button><button class="sm" onclick="openRenameMockScheduleModal('${esc(d.id)}')">Rename</button><button class="sm" onclick="duplicateMockSchedule('${esc(d.id)}')">Duplicate</button><button class="sm gold" onclick="openApplyMockScheduleModal('${esc(d.id)}')">Apply Live</button><button class="sm danger" onclick="deleteMockSchedule('${esc(d.id)}')">Delete</button></div></div>`).join(''):'<div class="notice">No mock schedules are being held. Create one from the live schedule or start with blank assignments while keeping the current post structure.</div>'}</div>`)}
function openApplyMockScheduleModal(id){if(!canAdmin()){toast('Applying a mock schedule is Admin-only');return;}const d=scheduleDraftList().find(x=>String(x.id)===String(id));if(!d)return;showModal(`<div class="modal-head"><div><div class="modal-title">Apply Mock Schedule to Live</div><div class="schedule-editor-help">This replaces the live schedule rows and assignments with this mock. The mock itself will remain saved after publication.</div></div><button onclick="closeModal()">Close</button></div><div class="notice"><strong>${esc(d.name||'Untitled Mock Schedule')}</strong><br>A roster backup will be created first. Type <strong>APPLY SCHEDULE</strong> to authorize replacement of the live schedule.</div><div class="form-grid"><div class="full"><label>Required Confirmation</label><input id="applyMockConfirm" autocomplete="off" placeholder="APPLY SCHEDULE"></div><div class="full"><label>Reason / Change Note</label><textarea id="applyMockReason" rows="3" placeholder="Why is this mock becoming the live schedule?"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="gold" onclick="confirmApplyMockSchedule('${esc(d.id)}')">Backup & Apply to Live</button></div>`)}
async function confirmApplyMockSchedule(id){const d=scheduleDraftList().find(x=>String(x.id)===String(id));if(!d)return;if(String(val('applyMockConfirm')||'').trim().toUpperCase()!=='APPLY SCHEDULE'){toast('Type APPLY SCHEDULE exactly');return;}const reason=String(val('applyMockReason')||'').trim();if(!reason){toast('A reason is required');return;}try{await SuiteBridge.send('suite:createBackup',roster,{module:'roster'});roster.schedule=cloneScheduleRows(d.schedule||[]);scheduleWorkspaceMode='live';scheduleWorkspaceDraftId='';scheduleColorCache=null;scheduleWorkspaceAudit('Mock schedule applied to live',(d.name||'Untitled')+' · '+reason);const ok=await saveRosterNow('mock-apply-live');if(!ok)throw new Error('Live schedule save did not complete.');closeModal();safeRenderPages();toast('Mock schedule applied to live. Backup created first.')}catch(e){reportActionError('Apply mock schedule',e)}}
function openClearScheduleModal(){if(!canAdmin()){toast('Schedule clearing is Admin-only');return;}const draft=activeScheduleDraft();const phrase=draft?'CLEAR MOCK':'CLEAR SCHEDULE';showModal(`<div class="modal-head"><div><div class="modal-title">${draft?'Clear Mock Schedule':'Clear Live Schedule'}</div><div class="schedule-editor-help">This clears every daily assignment/status to Closed but preserves sections, posts, coverage windows, cost hours, and row notes.</div></div><button onclick="closeModal()">Close</button></div><div class="notice">${draft?'Only this mock scenario will be cleared. The live schedule will not change.':'A roster backup will be created before the live schedule is cleared.'}<br>Type <strong>${phrase}</strong> to continue.</div><div class="form-grid"><div class="full"><label>Required Confirmation</label><input id="clearScheduleConfirm" autocomplete="off" placeholder="${phrase}"></div><div class="full"><label>Reason</label><textarea id="clearScheduleReason" rows="3" placeholder="Reason for clearing the schedule"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="danger" onclick="confirmClearSchedule()">${draft?'Clear Mock':'Backup & Clear Live Schedule'}</button></div>`)}
async function confirmClearSchedule(){const draft=activeScheduleDraft();const phrase=draft?'CLEAR MOCK':'CLEAR SCHEDULE';if(String(val('clearScheduleConfirm')||'').trim().toUpperCase()!==phrase){toast('Type '+phrase+' exactly');return;}const reason=String(val('clearScheduleReason')||'').trim();if(!reason){toast('A reason is required');return;}try{if(!draft)await SuiteBridge.send('suite:createBackup',roster,{module:'roster'});const rows=scheduleWorkspaceRows();for(const row of rows)row.days=['None','None','None','None','None','None','None'];touchScheduleDraft();scheduleColorCache=null;scheduleWorkspaceAudit(draft?'Mock schedule cleared':'Live schedule cleared',scheduleWorkspaceDetail(reason));const ok=await saveRosterNow(draft?'mock-schedule-clear':'live-schedule-clear');if(!ok)throw new Error('Schedule save did not complete.');closeModal();safeRenderPages();toast(draft?'Mock schedule cleared. Live schedule unchanged.':'Live schedule cleared. Backup created first.')}catch(e){reportActionError('Clear schedule',e)}}
function scheduleCellSourceLabel(idx,day){const row=scheduleWorkspaceRows()[idx];return row?((row.section||'')+' / '+(row.post||'')+' / '+(DAYS[day]||('Day '+day))):'schedule cell'}
function copyScheduleCell(idx,day){const row=scheduleWorkspaceRows()[idx];if(!row)return;row.days=Array.isArray(row.days)?row.days:[];const value=row.days[day]||'None';scheduleClipboard={value,source:scheduleCellSourceLabel(idx,day),copiedAt:new Date().toISOString()};toast('Copied '+(scheduleCellParts(value).display||value)+' to schedule clipboard');safeRenderPages({preserveScroll:true})}
function pasteScheduleCell(idx,day){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}if(!scheduleClipboard){toast('Copy a schedule cell first');return;}const row=scheduleWorkspaceRows()[idx];if(!row)return;row.days=Array.isArray(row.days)?row.days:['None','None','None','None','None','None','None'];while(row.days.length<7)row.days.push('None');const prior=row.days[day]||'None';row.days[day]=scheduleClipboard.value||'None';touchScheduleDraft();scheduleColorCache=null;scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule cell pasted':'Schedule cell pasted',scheduleWorkspaceDetail(scheduleCellSourceLabel(idx,day)+' · '+prior+' -> '+row.days[day]+' · copied from '+scheduleClipboard.source));saveRoster('schedule-cell-paste');closeModal();safeRenderPages({preserveScroll:true});toast('Pasted '+(scheduleCellParts(row.days[day]).display||row.days[day]))}
function clearScheduleClipboard(){scheduleClipboard=null;safeRenderPages({preserveScroll:true});toast('Schedule clipboard cleared')}
function openScheduleCellModal(idx,day){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}
 const row=scheduleWorkspaceRows()[idx];if(!row)return;const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];const current=(row.days||[])[day]||'None';const parts=scheduleCellParts(current);scheduleEditContext={idx,day};const clip=scheduleClipboard?`<div class="schedule-status-note"><strong>Clipboard:</strong> ${esc(scheduleCellParts(scheduleClipboard.value).display||scheduleClipboard.value)}<br><span class="mini-note">Copied from ${esc(scheduleClipboard.source)}</span></div>`:'';
 const currentEmployee=parts.special?null:findRosterByScheduleName(current);const searchValue=parts.special?'':(currentEmployee?fullName(currentEmployee):parts.display);
 const poolNote=scheduleWorkspaceIsDraft()?'Mock schedule: search the entire active roster. Any employee can be assigned to any slot.':'Live schedule: suggestions follow the employee/section context already used by the published schedule.';
 showModal(`<div class="modal-head"><div><div class="modal-title">Reassign Slot</div><div class="schedule-editor-help">Start typing an employee name or employee number and choose the person from the dropdown. Copy/paste remains available for repetitive staffing moves.</div></div><button onclick="closeModal()">Close</button></div><div class="notice"><strong>${esc(row.section||'')}</strong><br>${esc(row.post||'')} ${row.shiftLabel?'· '+esc(row.shiftLabel):''} · ${days[day]} ${scheduleWorkspaceIsDraft()?'<span class="mock-watermark">Mock</span>':''}</div><div class="form-grid"><div class="full"><label>Find Employee</label><div class="schedule-person-picker"><input id="schedCellSearch" value="${esc(searchValue)}" autocomplete="off" placeholder="Start typing name or employee number..." onfocus="renderScheduleEmployeeTypeahead()" oninput="scheduleCellSearchChanged()" onkeydown="scheduleTypeaheadKey(event)" onblur="setTimeout(hideScheduleEmployeeTypeahead,160)"><input id="schedCellAssign" type="hidden" value="${esc(current)}"><div id="schedCellTypeahead" class="schedule-typeahead"></div></div><div class="schedule-editor-help">${esc(poolNote)}</div></div></div>${clip}<div class="modal-actions"><button onclick="closeModal()">Cancel</button><button onclick="copyScheduleCell(${idx},${day});closeModal()">Copy Assignment</button>${scheduleClipboard?`<button class="gold" onclick="pasteScheduleCell(${idx},${day})">Paste ${esc(scheduleCellParts(scheduleClipboard.value).display||scheduleClipboard.value)}</button>`:''}<button onclick="setScheduleCellSpecial('None')">Closed</button><button onclick="setScheduleCellSpecial('Open')">Open</button><button onclick="setScheduleCellSpecial('Pending')">Pending</button><button class="primary" onclick="confirmScheduleCell()">Save Assignment</button></div>`);setTimeout(()=>{const input=document.getElementById('schedCellSearch');if(input&&['None','Open','Pending'].includes(current)){input.focus();renderScheduleEmployeeTypeahead();}},0)
}
function setScheduleCellSpecial(v){const hidden=document.getElementById('schedCellAssign'),input=document.getElementById('schedCellSearch');if(hidden)hidden.value=v;if(input)input.value=v==='None'?'Closed':v;hideScheduleEmployeeTypeahead()}
function confirmScheduleCell(){if(!scheduleEditContext)return;const {idx,day}=scheduleEditContext;const row=scheduleWorkspaceRows()[idx];if(!row)return;const selected=String(val('schedCellAssign')||'').trim();const typed=String(val('schedCellSearch')||'').trim();if(!selected){toast(typed?'Choose an employee from the dropdown or select Closed/Open/Pending.':'Choose an employee or status.');return;}row.days=row.days||['None','None','None','None','None','None','None'];while(row.days.length<7)row.days.push('None');row.days[day]=selected;touchScheduleDraft();scheduleColorCache=null;scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule cell reassigned':'Schedule cell reassigned',scheduleWorkspaceDetail((row.section||'')+' · '+(row.post||'')+' · '+(DAYS[day]||day)+' -> '+row.days[day]));saveRoster('schedule-cell-edit');closeModal();safeRenderPages();toast(scheduleWorkspaceIsDraft()?'Mock schedule updated':'Schedule updated')}

function removeScheduleRow(idx){if(!canAdmin()){toast('Schedule editing is Admin-only');return;}const rows=scheduleWorkspaceRows();const row=rows[idx];if(!row)return;if(!confirm('Remove schedule row: '+(row.section||'')+' / '+(row.post||'')+'?'))return;rows.splice(idx,1);touchScheduleDraft();scheduleColorCache=null;scheduleWorkspaceAudit(scheduleWorkspaceIsDraft()?'Mock schedule row removed':'Schedule row removed',scheduleWorkspaceDetail((row.section||'')+' · '+(row.post||'')));saveRoster('schedule-row-remove');safeRenderPages();toast(scheduleWorkspaceIsDraft()?'Mock schedule row removed':'Schedule row removed')}
function scheduleSections(){scheduleColorCache=null;buildScheduleColorCache();let groups={};for(const r of scheduleWorkspaceRows()){(groups[r.section||'Unsectioned']=groups[r.section||'Unsectioned']||[]).push(r)}return Object.entries(groups)}
function scheduleHtmlSnapshot(){return scheduleSections().map(([sec,rows])=>renderScheduleSection(sec,rows,true)).join('')}
function schedulePrintSummaryHtml(){
  const m=scheduleMetrics(scheduleWorkspaceRows());
  return `<div class="schedule-summary"><div><strong>${Number(m.assignedHours||0)}</strong><span>Named Scheduled HPW</span></div><div><strong>${Number(m.openHours||0)}</strong><span>Open/Pending HPW</span></div><div><strong>${Number(m.requiredHours||0)}</strong><span>Total Schedule HPW</span></div><div><strong>${Number(m.open||0)}</strong><span>Open/Pending Cells</span></div><div><strong>${Number(m.overtimePeople||0)}</strong><span>People Over FTE Baseline</span></div></div>`;
}
function scheduleExportCss(){return `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');
:root { --red:#C0272D; --gold:#C6B273; --charcoal:#1e2330; --surface:#28303f; --surface2:#313b4d; --surface3:#3d4a5e; --border:#404d62; --text:#eef0f4; --text-muted:#8a96a8; --text-dim:#c4cad5; --orange:#e08a2f; }
* { box-sizing:border-box; }
body { margin:0; font-family:'Barlow',Arial,sans-serif; background:var(--charcoal); color:var(--text); padding:24px; }
.header { border-bottom:3px solid var(--red); padding:0 0 14px 0; margin-bottom:14px; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; }
.title { font-family:'Barlow Condensed',Arial,sans-serif; font-weight:800; font-size:30px; color:var(--gold); letter-spacing:1px; text-transform:uppercase; }
.subtitle { font-size:12px; color:var(--text-muted); letter-spacing:.4px; margin-top:3px; }
.actions { display:flex; gap:8px; }
.btn { font-family:'Barlow Condensed',Arial,sans-serif; font-weight:700; font-size:13px; letter-spacing:.8px; text-transform:uppercase; padding:8px 14px; border-radius:4px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; }
.schedule-summary { display:grid; grid-template-columns:repeat(5,minmax(120px,1fr)); gap:8px; margin:0 0 14px 0; }
.schedule-summary div { border:1px solid var(--border); border-radius:6px; background:var(--surface); padding:10px 12px; }
.schedule-summary strong { display:block; font-size:20px; color:var(--gold); }
.schedule-summary span { display:block; font-family:'Barlow Condensed',Arial,sans-serif; font-weight:700; font-size:10px; letter-spacing:.7px; text-transform:uppercase; color:var(--text-muted); }
.print-note { border:1px solid var(--border); border-left:4px solid var(--gold); border-radius:6px; padding:9px 12px; margin:0 0 14px 0; background:var(--surface); color:var(--text-dim); font-size:12px; }
.schedule-section { margin-bottom:18px; break-inside:auto; page-break-inside:auto; }
.section-head { font-family:'Barlow Condensed',Arial,sans-serif; font-weight:800; font-size:15px; letter-spacing:1px; text-transform:uppercase; color:var(--red); padding:8px 12px; background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--red); border-radius:4px; margin-bottom:8px; display:flex; justify-content:space-between; gap:12px; }
.table-wrap { overflow-x:auto; border-radius:6px; border:1px solid var(--border); }
.schedule-grid { display:grid; grid-template-columns:130px repeat(7, minmax(95px,1fr)); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:6px; overflow:hidden; font-size:12px; min-width:900px; }
.sch-head { background:var(--surface2); font-family:'Barlow Condensed',Arial,sans-serif; font-weight:700; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--gold); padding:8px 6px; text-align:center; }
.sch-post { background:var(--surface2); color:var(--text-muted); font-family:'Barlow Condensed',Arial,sans-serif; font-weight:700; font-size:10px; letter-spacing:.5px; text-transform:uppercase; padding:7px 8px; display:flex; align-items:center; }
.sch-cell { background:var(--surface); padding:5px 6px; text-align:center; position:relative; min-height:34px; }
.sch-name { font-size:11px; color:var(--text-dim); line-height:1.25; }
.sch-name.none { color:var(--surface3); font-style:italic; }
.sch-name.open { color:var(--orange); font-style:italic; font-weight:800; }
.sch-name.pending { color:var(--gold); font-style:italic; font-weight:800; }
.sch-closed { background:#161c28 !important; }
.sch-rank-abbr { font-size:9px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:700;letter-spacing:.5px;opacity:.85;display:block;margin-top:1px; }
.schedule-row-note{display:block;color:var(--gold);font-size:9px;font-weight:700;text-transform:none;letter-spacing:.2px;margin-top:3px;line-height:1.2;}
@media print {
  @page { size:letter landscape; margin:.10in; }
  html,body { width:100%; margin:0!important; padding:0!important; background:white!important; color:#111!important; font-family:Arial,sans-serif!important; }
  body { font-size:7.6pt!important; zoom:.88!important; }
  .actions { display:none!important; }
  .header { border-bottom:2px solid #111!important; margin-bottom:2px!important; padding-bottom:3px!important; align-items:flex-start!important; break-inside:avoid; page-break-inside:avoid; }
  .title { color:#111!important; font-size:13.5pt!important; letter-spacing:.25px!important; line-height:1!important; }
  .subtitle { color:#444!important; font-size:6.4pt!important; line-height:1!important; margin-top:0!important; }
  .print-note { display:none!important; }
  .schedule-summary { display:none!important; }
  .schedule-summary div { background:#f7f7f7!important; border:1px solid #aaa!important; padding:3px 5px!important; min-height:0!important; }
  .schedule-summary strong { color:#111!important; font-size:10.5pt!important; line-height:1!important; display:inline-block!important; margin-right:4px!important; }
  .schedule-summary span { color:#555!important; font-size:6.3pt!important; line-height:1!important; display:inline!important; }
  .schedule-section { margin:1px 0 2px 0!important; break-inside:auto!important; page-break-inside:auto!important; }
  .section-head { color:#111!important; border:1px solid #777!important; border-left:4px solid #111!important; background:#eee!important; padding:1px 4px!important; margin-bottom:1px!important; font-size:7.9pt!important; line-height:1!important; break-after:avoid; page-break-after:avoid; }
  .table-wrap { overflow:visible!important; border:0!important; border-radius:0!important; }
  .schedule-wrap { width:100%!important; }
  .schedule-grid { display:grid!important; grid-template-columns:.85fr repeat(7,1fr)!important; min-width:0!important; width:100%!important; gap:1px!important; border:1px solid #777!important; background:#777!important; font-size:7.05pt!important; line-height:1!important; page-break-inside:auto!important; break-inside:auto!important; }
  .sch-head { background:#ddd!important; color:#111!important; padding:1px 2px!important; font-size:6.5pt!important; line-height:1!important; }
  .sch-post { background:#eee!important; color:#111!important; padding:1px 2px!important; font-size:6.45pt!important; line-height:1!important; min-height:0!important; align-items:flex-start!important; }
  .sch-post span[style] { font-size:5.8pt!important; line-height:1!important; color:#333!important; }
  .sch-cell { color:#111!important; padding:1px 2px!important; min-height:13px!important; break-inside:avoid!important; page-break-inside:avoid!important; overflow:hidden!important; }
  .sch-cell:not(.sch-person-cell) { background:#fff!important; }
  .sch-person-cell { background:var(--emp-bg,#eef2f6)!important; border-left:3px solid var(--emp-color,#555)!important; box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)!important; }

  .sch-person-cell .sch-person-name, .sch-person-cell .sch-person-name[style], .sch-person-cell .sch-rank-abbr, .sch-person-cell .sch-rank-abbr[style] { color:#fff!important; font-weight:900!important; text-shadow:0 1px 1px rgba(0,0,0,.78),0 0 2px rgba(0,0,0,.58)!important; }
  .sch-cell > div[style], .sch-person-name { color:#fff!important; font-weight:900!important; font-size:6.85pt!important; line-height:1!important; text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.55)!important; }
  .sch-name { color:#fff!important; font-size:6.75pt!important; line-height:1!important; font-weight:900!important; text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.55)!important; }
  .sch-rank-abbr { color:#fff!important; opacity:.95!important; text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.55)!important; }
  .sch-name.none { display:none!important; color:transparent!important; font-size:0!important; text-shadow:none!important; }
  .sch-name.open { color:#111!important; font-weight:800!important; text-shadow:none!important; border:1px solid #111!important; padding:0 2px!important; display:inline-block!important; font-size:6.45pt!important; }
  .sch-name.pending { color:#111!important; font-weight:800!important; text-shadow:none!important; border:1px dashed #111!important; padding:0 2px!important; display:inline-block!important; font-size:6.45pt!important; }
  .sch-closed { background:#fff!important; color:transparent!important; min-height:8px!important; }
  .sch-closed * { display:none!important; }
  .sch-rank-abbr { color:#fff!important; font-size:5.3pt!important; line-height:1!important; opacity:.95!important; text-shadow:0 1px 1px rgba(0,0,0,.75),0 0 2px rgba(0,0,0,.55)!important; }
  .schedule-row-note { color:#333!important; font-size:5.2pt!important; line-height:1!important; margin-top:0!important; }

  .schedule-wrap, .table-wrap { break-inside:auto!important; page-break-inside:auto!important; }
  .schedule-section:first-of-type { margin-top:0!important; }
  .schedule-section + .schedule-section { margin-top:1px!important; }
  * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}`}
function scheduleShareHtml(){
  const date=new Date();
  const dateStamp=date.toISOString().slice(0,10);
  const printedDate=date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PWADC Security ${scheduleWorkspaceIsDraft()?'Mock ':''}Schedule - ${dateStamp}</title>
<style>
${scheduleExportCss()}

.audit-native-frame-wrap{border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--surface);height:calc(100vh - 150px);min-height:720px}.audit-native-frame{width:100%;height:100%;border:0;background:#fff}.audit-action-note{margin-bottom:12px}





/* v3.1.17 professional report center */
.report-card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.report-card{border:1px solid var(--border);border-radius:12px;background:var(--surface);padding:16px;box-shadow:var(--shadow-sm)}.report-card h3{margin:0 0 6px 0;color:var(--gold);font-size:16px;text-transform:uppercase;letter-spacing:.7px}.report-card p{color:var(--dim);font-size:13px;line-height:1.4;min-height:54px}.report-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.report-note{font-size:12px;color:var(--muted);line-height:1.4}.report-doc{font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:28px;line-height:1.35}.report-doc .report-header{border-bottom:3px solid #222;padding-bottom:12px;margin-bottom:18px;display:flex;justify-content:space-between;gap:16px}.report-doc .report-brand{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#555;font-weight:700}.report-doc h1{font-size:24px;margin:4px 0 0 0}.report-doc .report-meta{font-size:11px;color:#555;text-align:right}.report-doc .report-section{break-inside:auto;page-break-inside:auto;margin:10px 0}.report-doc h2{font-size:15px;text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid #bbb;padding-bottom:5px;margin:0 0 8px 0}.report-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}.report-kpi{border:1px solid #bbb;padding:9px;border-radius:6px;background:#f7f7f7}.report-kpi strong{display:block;font-size:19px}.report-kpi span{display:block;font-size:10px;text-transform:uppercase;color:#555;font-weight:700;letter-spacing:.5px}.report-table{border-collapse:collapse;width:100%;font-size:10.5pt}.report-table th{background:#eee;border:1px solid #aaa;text-align:left;padding:6px;font-size:10pt}.report-table td{border:1px solid #bbb;padding:5px;vertical-align:top}.report-risk{font-weight:700}.report-risk.bad{color:#9b1c1c}.report-summary{border:1px solid #aaa;border-left:5px solid #222;padding:10px;background:#fafafa}.report-footer{font-size:10px;color:#555;border-top:1px solid #bbb;margin-top:18px;padding-top:8px}.report-print-toolbar{position:sticky;top:0;background:#1e2330;color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:10}.report-print-toolbar button{margin-left:6px}@media print{
@page{size:letter landscape;margin:.18in}
.report-print-toolbar{display:none!important}
.print-overlay.report-print{position:static!important;overflow:visible!important;background:#fff!important;padding:0!important;margin:0!important}
.report-doc{padding:0!important;margin:0!important;line-height:1.22!important}
.report-doc .report-header{margin-bottom:10px!important;padding-bottom:8px!important;break-inside:avoid;page-break-inside:avoid}
.report-doc .report-section{break-inside:auto!important;page-break-inside:auto!important;margin:8px 0!important}
.report-doc .report-summary,.report-kpis,.report-kpi{break-inside:avoid;page-break-inside:avoid}
.report-doc h1{font-size:20pt!important;margin:2px 0 0 0!important}
.report-doc h2{font-size:12pt!important;margin:8px 0 5px 0!important;break-after:avoid;page-break-after:avoid}
.report-table{font-size:9.5pt!important;page-break-inside:auto!important}
.report-table thead{display:table-header-group}
.report-table tfoot{display:table-footer-group}
.report-table tr{break-inside:avoid;page-break-inside:avoid}
.report-table th{padding:4px!important;font-size:9.5pt!important}
.report-table td{padding:3px 4px!important}
.report-footer{margin-top:10px!important;padding-top:6px!important}
body:has(.report-print){background:#fff!important;margin:0!important}
.report-print~*{display:none!important}
}


/* v3.1.17 training requirements and expiration tracking */
.training-readiness-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}.training-topic-scope{display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:999px;padding:3px 8px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--gold);font-weight:900;background:var(--surface2);margin-top:5px}.training-req-note{font-size:11px;color:var(--muted);line-height:1.35;margin-top:4px}.training-status.training-current{background:#1a3a2a;color:#8ae0a0;border-color:#2a5a3a}.training-status.training-missing{background:#3a3020;color:#e0c87a;border-color:#5a4a20}.training-status.training-expiring{background:#3a3020;color:#e0c87a;border-color:#5a4a20}.training-status.training-expired{background:#3a2020;color:#ff9b9b;border-color:#6a2828}.training-status.training-na{background:#202633;color:var(--muted);border-color:var(--border)}.training-cell.not-required{opacity:.55}.training-topic-config{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:10px}.readiness-score{font-size:28px;font-weight:900;color:var(--gold)}

/* v3.1.17 training page polish */
.training-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start;margin-bottom:12px}.training-quick-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.training-main-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}.training-command-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:12px}.training-command-card{border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:12px}.training-command-card strong{display:block;color:var(--gold);text-transform:uppercase;font-size:12px;letter-spacing:.8px}.training-command-card span{display:block;color:var(--muted);font-size:11px;line-height:1.35;margin:5px 0 9px}.training-layout-polished{display:grid;grid-template-columns:310px minmax(0,1fr);gap:14px;align-items:start}.training-employee-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;background:var(--surface2);border:1px solid var(--border);border-radius:10px 10px 0 0;padding:10px 12px}.training-employee-name{font-weight:900;font-size:14px}.training-employee-meta{font-size:11px;color:var(--muted);margin-top:2px}.training-required-tag{display:inline-flex;align-items:center;border-radius:999px;padding:2px 7px;font-size:9px;text-transform:uppercase;letter-spacing:.55px;font-weight:900;margin-top:5px;border:1px solid var(--border);background:var(--surface2);color:var(--muted)}.training-required-tag.required{color:var(--gold)}.training-required-tag.optional{color:#9dd7ff}.training-cell.optional-recorded{opacity:1}.training-cell.not-required .training-status.training-current{background:#15324a;color:#9dd7ff;border-color:#255c7a}.training-employee-print{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.training-section-note{font-size:11px;color:var(--muted);line-height:1.35;margin:6px 0}.training-employee-card{border:1px solid var(--border);border-radius:12px;background:var(--surface);overflow:hidden;margin-bottom:14px}.training-employee-card.focused{outline:3px solid var(--gold);box-shadow:0 0 0 4px rgba(214,166,74,.18)}.training-matrix-wrap.polished{border-radius:0 0 10px 10px;border-top:0}.training-matrix.polished th:first-child,.training-matrix.polished td:first-child{min-width:0;width:auto}.training-matrix.polished .training-topic-th{min-width:145px}.training-topic-subline{font-size:10px;color:var(--muted);margin-top:3px;line-height:1.2}@media(max-width:1100px){.training-layout-polished{grid-template-columns:1fr}.training-hero{grid-template-columns:1fr}.training-quick-actions{justify-content:flex-start}}

/* v3.1.17 attendance patterns rebuild */
.dashboard-hero{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(260px,.55fr);gap:14px;align-items:stretch;margin-bottom:14px}.dashboard-hero-card{border:1px solid var(--border);background:linear-gradient(135deg,var(--surface),var(--surface2));border-radius:14px;padding:16px}.dashboard-eyebrow{text-transform:uppercase;letter-spacing:.9px;color:var(--gold);font-size:11px;font-weight:900}.dashboard-title{font-size:26px;font-weight:900;line-height:1.1;margin-top:4px}.dashboard-sub{color:var(--muted);font-size:13px;line-height:1.4;margin-top:8px;max-width:760px}.dashboard-shift-line{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.dashboard-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:18px 0 9px}.dashboard-section-title h2{margin:0;font-size:15px;text-transform:uppercase;letter-spacing:.8px;color:var(--gold)}.dashboard-section-title span{color:var(--muted);font-size:12px}.attention-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}.attention-card{border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:8px;min-height:130px}.attention-card.hot{border-color:var(--danger);box-shadow:inset 3px 0 0 var(--danger)}.attention-card.ok{box-shadow:inset 3px 0 0 var(--ok)}.attention-card h3{margin:0;font-size:14px}.attention-metric{font-size:28px;font-weight:900;line-height:1;color:var(--gold)}.attention-card.hot .attention-metric{color:var(--danger)}.attention-card p{margin:0;color:var(--muted);font-size:12px;line-height:1.35;flex:1}.workflow-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.workflow-card{border:1px solid var(--border);background:var(--surface);border-radius:12px;padding:12px;cursor:pointer}.workflow-card strong{display:block;font-size:13px}.workflow-card span{display:block;color:var(--muted);font-size:11px;line-height:1.35;margin:5px 0 10px}.snapshot-strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:12px}.snapshot-pill{border:1px solid var(--border);border-radius:10px;padding:8px 10px;background:rgba(255,255,255,.03)}.snapshot-pill strong{display:block;font-size:20px;line-height:1}.snapshot-pill span{display:block;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.65px}@media(max-width:1050px){.dashboard-hero{grid-template-columns:1fr}.dashboard-title{font-size:22px}}

/* v3.1.17 dedicated settings page */
.settings-page{display:grid;gap:16px}.settings-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start}.settings-section{border:1px solid var(--border);border-radius:12px;background:var(--surface);box-shadow:var(--shadow-sm);overflow:hidden}.settings-section-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:14px 16px;border-bottom:1px solid var(--border);background:var(--surface2)}.settings-section-title{color:var(--gold);font-size:15px;font-weight:900;text-transform:uppercase;letter-spacing:1px}.settings-section-sub{font-size:12px;color:var(--muted);margin-top:4px;line-height:1.4}.settings-section-body{padding:16px}.settings-help{font-size:11px;color:var(--muted);line-height:1.35;margin-top:5px}.settings-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.settings-danger{border-left:5px solid var(--red)}.settings-danger .settings-section-title{color:#ff9b9b}.settings-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.settings-kpi{border:1px solid var(--border);border-radius:10px;background:var(--surface2);padding:12px}.settings-kpi strong{display:block;font-size:20px;color:var(--gold)}.settings-kpi span{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--muted);font-weight:900}.settings-table-wrap{overflow:auto;border:1px solid var(--border);border-radius:8px;background:var(--surface2)}.settings-table-wrap table{margin:0}.settings-table-wrap input,.settings-table-wrap select{min-width:110px}.settings-savebar{position:sticky;bottom:0;z-index:5;display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid var(--border);border-left:5px solid var(--gold);border-radius:10px;background:var(--surface);box-shadow:var(--shadow);padding:12px 14px}.settings-validation{display:grid;gap:6px}.settings-validation .bad{font-weight:900}@media(max-width:900px){.settings-hero{grid-template-columns:1fr}.settings-savebar{position:static;align-items:flex-start;flex-direction:column}.settings-section-head{display:block}.settings-actions{margin-top:10px}}





</style>
</head>
<body>
<div class="header"><div><div class="title">PWADC Security ${scheduleWorkspaceIsDraft()?'Mock Schedule':'Master Schedule'}</div><div class="subtitle">${scheduleWorkspaceIsDraft()?'MOCK / NOT PUBLISHED · ' + esc(scheduleWorkspaceName()) + ' · ':''}Schedule-only snapshot exported ${printedDate}. Roster, pay, uniforms, analytics, and edit controls are not included.</div></div><div class="actions"><button class="btn" onclick="window.print()">Print / Save PDF</button></div></div>
${schedulePrintSummaryHtml()}
<div class="print-note"><strong>${scheduleWorkspaceIsDraft()?'MOCK SCHEDULE / NOT PUBLISHED':'Print standard:'}</strong> ${scheduleWorkspaceIsDraft()?'This scenario is held separately and does not drive live HPW, labor analytics, attendance, or management reports. ':''}Schedule prints landscape. Named employees count as scheduled HPW. Open/Pending cells are unfilled shifts. Closed cells are excluded and print as blank space.</div>
${scheduleHtmlSnapshot()}
</body>
</html>`;
}
function exportScheduleOnly(){const html=scheduleShareHtml();const dateStamp=new Date().toISOString().slice(0,10);const blob=new Blob([html],{type:'text/html'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(scheduleWorkspaceIsDraft()?'PWADC_Security_MOCK_Schedule_':'PWADC_Security_Schedule_')+dateStamp+'.html';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast(scheduleWorkspaceIsDraft()?'Exported MOCK schedule HTML.':'Exported schedule-only HTML for supervisors.')}
function openSchedulePrintWindow(autoPrint=false){const w=window.open('','_blank');if(!w){toast('Popup blocked. Allow popups to view/print schedule.');return null;}w.document.write(scheduleShareHtml());w.document.close();if(autoPrint)setTimeout(()=>w.print(),450);return w;}
function viewRosterSchedule(){openSchedulePrintWindow(false)}
function printRosterSchedule(){openSchedulePrintWindow(true)}
PWADCModuleRegistry.register('roster-schedule');
