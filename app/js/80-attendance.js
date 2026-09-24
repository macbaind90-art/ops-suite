/* PWADC Security Operations Suite v4.7.0 | module: attendance-base */
'use strict';

function shiftRank(shift){let i=SHIFT_ORDER.indexOf(shift||'');return i>=0?i:99}
function sortedEmployees(){return activeAttendanceEmployees().slice().sort((a,b)=>shiftRank(a.shift)-shiftRank(b.shift)||(a.shift||'').localeCompare(b.shift||'')||(a.name||'').localeCompare(b.name||''))}

function editNote(id,date){
  const k=String(id)+'|'+String(date);
  const n=prompt('Attendance note:',attendance.notes[k]||'');
  if(n===null)return;
  attendance.notes=attendance.notes||{};
  if(String(n).trim())attendance.notes[k]=String(n).trim();else delete attendance.notes[k];
  audit('Attendance note updated',k);
  saveAttendance('attendance-note');
  safeRenderPages({preserveScroll:true});
}

function openAttendanceRemoveModal(){
  if(!canRemoveAttendanceEmployee()){toast('Attendance employee removal is Admin-only');return;}
  const emps=activeAttendanceEmployees().slice().sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if(!emps.length){toast('No active Attendance employees found.');return;}
  showModal(`<div class="modal-head"><div class="modal-title">Remove Employee from Attendance</div><button onclick="closeModal()">Close</button></div><div class="notice"><strong>This does not delete history.</strong><br>The selected person will be hidden from active Daily Entry, 90-Day Grid, Point Review, and Notice Control screens. Existing attendance, point adjustments, attendance notices, and audit history remain in the JSON.</div><div class="form-grid"><div class="full"><label>Employee</label><select id="attendanceRemoveEmp">${emps.map(e=>`<option value="${esc(e.id)}">${esc(e.name||'Unnamed')} · ${esc(e.shift||'')} · ${esc(e.title||'')}</option>`).join('')}</select></div><div class="full"><label>Reason / Note</label><textarea id="attendanceRemoveNote">Manual Attendance removal backup control.</textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="danger" onclick="confirmAttendanceRemove()">Remove from Active Attendance</button></div>`);
}
async function confirmAttendanceRemove(){
  if(!canRemoveAttendanceEmployee()){toast('Attendance employee removal is Admin-only');return;}
  const id=val('attendanceRemoveEmp');
  const emp=(attendance.employees||[]).find(e=>String(e.id)===String(id));
  if(!emp){toast('Attendance employee not found.');return;}
  const note=val('attendanceRemoveNote')||'Manual Attendance removal backup control.';
  if(!confirm('Remove '+(emp.name||'this employee')+' from active Attendance?\n\nHistory will be preserved.'))return;
  try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});}catch(err){console.warn('Pre-removal attendance backup failed',err)}
  emp.active=false;emp.archived=true;emp.status='Archived';emp.archivedAt=emp.archivedAt||new Date().toISOString();
  emp.removedFromAttendanceAt=new Date().toISOString();emp.removedFromAttendanceBy=currentUserName()||env.user||'';emp.removedFromAttendanceNote=note;
  attendance.audit=Array.isArray(attendance.audit)?attendance.audit:[];
  attendance.audit.unshift({at:new Date().toISOString(),user:currentUserName()||env.user||'',machine:env.machine||'',action:'Attendance employee removed',detail:(emp.name||id)+' hidden from active Attendance. History preserved. Note: '+note});
  const ok=await saveAttendanceNow('attendance-manual-remove');
  if(ok){closeModal();selectedEntryEmpId='';selectedGridEmpId='';safeRenderPages();toast((emp.name||'Employee')+' removed from active Attendance. History preserved.');}
}

function renderAudit(){
  return `<div class="card"><div class="card-title">Attendance Audit Log</div><div class="table-wrap"><table><thead><tr><th>Date/Time</th><th>User</th><th>Action</th><th>Detail</th></tr></thead><tbody>${(attendance.audit||[]).slice(0,300).map(a=>`<tr><td>${esc(new Date(a.at).toLocaleString())}</td><td>${esc(a.user||'')}</td><td>${esc(a.action)}</td><td>${esc(a.detail)}</td></tr>`).join('')}</tbody></table></div></div>`;
}

async function importAttendanceJSON(input){
  const file=input&&input.files&&input.files[0];if(!file)return;
  try{
    const text=await file.text();const data=JSON.parse(text);
    if(!Array.isArray(data.employees)||!data.attendance||typeof data.attendance!=='object')throw new Error('File does not look like a PWADC attendance JSON export.');
    const oldCount=attendance.employees.length;attendance=data;normalizeAttendance();markModuleImported('attendance',file.name,'Imported attendance JSON backup.');
    const focusDate=focusAttendanceOnLatestDataDate();audit('Attendance JSON imported',file.name+' · '+attendance.employees.length+' employees · previous '+oldCount+' · focused '+focusDate);
    await createAttendanceBackup();saveAttendance('import');safeRenderPages();toast('Imported attendance JSON: '+file.name+' · showing '+fmt(focusDate));
  }catch(e){toast('Import failed: '+e.message)}finally{if(input)input.value=''}
}
async function reloadPackagedAttendanceData(){
  const approval=packagedRecoveryApproval('attendance','Attendance');if(!approval)return;
  try{
    let r=await SuiteBridge.send('suite:resetModuleFromSeed',approval,{module:'attendance'});let raw=r.data;
    if(typeof raw==='string')attendance=JSON.parse(raw||'{}');else attendance=raw||{};
    normalizeAttendance();recordModuleLoadInfo('attendance',{...r,source:'packaged-recovery-manual',sourceDetail:'Manually loaded packaged attendance recovery JSON through governed recovery.',path:'app/seed/attendance-data.json',loadedAt:new Date().toLocaleString(),dataRoot:settings.dataRoot,liveFileExisted:true,revision:r.revision||''});
    if(typeof refreshDataHealth==='function')await refreshDataHealth('packaged-recovery');
    const focusDate=focusAttendanceOnLatestDataDate();safeRenderPages();toast('Loaded packaged attendance recovery data · showing '+fmt(focusDate));
  }catch(e){toast('Reload failed: '+e.message)}
}
async function createAttendanceBackup(){try{await SuiteBridge.send('suite:createBackup',attendance,{module:'attendance'});toast('Backup created');}catch(e){toast('Backup failed: '+e.message)}}
function exportAttendanceCSV(){
  const rows=['Employee,Shift,Title,Date,Code,Point Value,Note'];
  for(const e of attendance.employees||[]){
    for(const [d,c] of Object.entries((attendance.attendance||{})[e.id]||{})){
      const n=(attendance.notes||{})[e.id+'|'+d]||'';
      const pts=typeof attendanceEventPointValue==='function'?attendanceEventPointValue(e.id,d,c):0;
      rows.push([e.name,e.shift,e.title,d,c,pts,n].map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(','));
    }
  }
  SuiteBridge.send('suite:writeExport',rows.join('\n'),{module:'attendance',fileName:'attendance-export-'+new Date().toISOString().slice(0,10)+'.csv'}).then(()=>toast('CSV exported')).catch(e=>toast('Export failed: '+e.message));
}

PWADCModuleRegistry.register('attendance');
