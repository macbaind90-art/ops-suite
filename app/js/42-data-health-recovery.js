/* PWADC Security Operations Suite v4.2.0 | Data Health & Recovery */
'use strict';

let dataHealthDashboard=null,dataHealthLoading=false,dataHealthError='',dataHealthSelectedModule='',dataHealthLkgPreview=null;
let healthIndicator={severity:'gray',unreviewedEvents:0,checkedAt:''};

function dataHealthAdminAuth(){return{adminUserId:String(currentUser?.id||''),adminPin:String(currentUser?.pin||'')}}
function packagedRecoveryApproval(module,label){
  const activeAdmin=canAdmin()&&currentUser;
  const adminUserId=activeAdmin?String(currentUser.id||''):String(prompt('Administrator user ID required for governed recovery:','admin')||'').trim();
  if(!adminUserId)return null;
  const adminPin=activeAdmin?String(currentUser.pin||''):String(prompt('Administrator PIN required for governed recovery:','')||'');
  if(!adminPin)return null;
  const reason=String(prompt(`Document the reason for replacing ${label||module} with packaged recovery data:`,'')||'').trim();
  if(!reason){toast('A recovery reason is required');return null;}
  if(!confirm(`Replace live ${label||module} data with the packaged recovery seed? The desktop bridge will create a pre-recovery backup and permanently audit the outcome.`))return null;
  return{adminUserId,adminPin,reason};
}
function dataHealthSeverityLabel(s){return({green:'Healthy',yellow:'Attention',red:'Blocked',gray:'Not in Use / No Data Yet'})[s]||'Unknown'}
function dataHealthBytes(n){n=Number(n||0);if(!n)return 'Not reported';const units=['B','KB','MB','GB','TB'];let i=0;while(n>=1024&&i<units.length-1){n/=1024;i++;}return n.toFixed(i?1:0)+' '+units[i]}
function dataHealthNavLabel(){const s=healthIndicator.severity||'gray',n=Number(healthIndicator.unreviewedEvents||0);return s==='green'?'Data Health ✓':`Data Health • ${n}`}

async function loadHealthIndicator(){
  if(!canAdmin())return;
  try{const r=await SuiteBridge.send('suite:getDataHealthSummary');healthIndicator={severity:r.severity||'gray',unreviewedEvents:Number(r.unreviewedEvents||0),checkedAt:r.checkedAt||''};renderShell();}
  catch(e){healthIndicator={severity:'red',unreviewedEvents:healthIndicator.unreviewedEvents||0,checkedAt:''};console.warn('Health indicator unavailable',e);}
}

async function openDataHealthDashboard(){
  if(!canAdmin()){toast('This module is unavailable. Contact an Administrator.');return;}
  await refreshDataHealth('dashboard-open');
  if(Number(dataHealthDashboard?.unreviewedEvents||0)>0){
    try{await SuiteBridge.send('suite:reviewHealthEvents',dataHealthAdminAuth());healthIndicator.unreviewedEvents=0;healthIndicator.severity=dataHealthDashboard.overallSeverity||'gray';renderShell();}
    catch(e){console.warn('Health-event review acknowledgment failed',e);}
  }
}

async function refreshDataHealth(trigger='manual-refresh'){
  if(!canAdmin())return;
  dataHealthLoading=true;dataHealthError='';safeRenderPages({preserveScroll:true});
  try{
    dataHealthDashboard=await SuiteBridge.send('suite:getDataHealth',{...dataHealthAdminAuth(),trigger});
    healthIndicator={severity:dataHealthDashboard.overallSeverity||'gray',unreviewedEvents:Number(dataHealthDashboard.unreviewedEvents||0),checkedAt:dataHealthDashboard.checkedAt||''};
  }catch(e){dataHealthError=e.message||String(e);}
  dataHealthLoading=false;renderShell();safeRenderPages({preserveScroll:true});
}

function dataHealthStorageHtml(){
  const s=dataHealthDashboard?.sharedStorage;if(!s)return '';
  return `<section class="dh-storage dh-${esc(s.severity||'red')}"><div><div class="dh-eyebrow">Shared Storage Health</div><div class="dh-storage-title">${s.reachable?'Shared path reachable':'Shared path unavailable'}</div><div class="dh-storage-sub">${esc(s.error||s.path||'')}</div></div><div class="dh-storage-metrics"><span><strong>${s.readAllowed?'Yes':'No'}</strong>Read</span><span><strong>${s.writeAllowed?'Yes':'No'}</strong>Write</span><span><strong>${esc(dataHealthBytes(s.freeSpaceBytes))}</strong>Free Space</span><span><strong>${esc(s.dataMode||'')}</strong>Data Mode</span><span><strong>${esc(s.lastChecked||'Not checked')}</strong>Last Check</span><span><strong>${esc(s.lastSuccessfulConnection||'Not recorded')}</strong>Last Successful Connection</span></div></section>`;
}

function dataHealthModuleCard(m){
  const lkg=m.lkg||{};
  return `<article class="dh-module-card dh-${esc(m.severity||'gray')}"><div class="dh-card-head"><div><div class="dh-card-title">${esc(m.label||m.module)}</div><div class="dh-status">${esc(m.statusLabel||dataHealthSeverityLabel(m.severity))}</div></div><span class="dh-dot" aria-label="${esc(m.severity||'gray')}"></span></div><div class="dh-card-grid"><span>Schema<strong>${esc(m.schemaVersion||m.expectedSchemaVersion||'No data')}</strong></span><span>Access<strong>${esc(m.accessState||'Unknown')}</strong></span><span>Last successful save<strong>${esc(m.lastSuccessfulSave||'Not recorded')}</strong></span><span>Last-Known-Good<strong>${lkg.valid?(lkg.currentToday?'Verified today':'Valid · '+(lkg.snapshotDate||'older')):(lkg.error||'Unavailable')}</strong></span><span>Last migration<strong>${esc(m.lastMigrationStatus||'No migration recorded')}</strong></span><span>Recovery<strong>${m.recoveryAvailable?'Available':'Not available'}</strong></span></div><button class="sm" onclick="selectDataHealthModule('${escAttr(m.module)}')">View Details</button></article>`;
}

function selectDataHealthModule(module){dataHealthSelectedModule=dataHealthSelectedModule===module?'':module;safeRenderPages({preserveScroll:true});}

function dataHealthModuleDetails(){
  const m=(dataHealthDashboard?.modules||[]).find(x=>x.module===dataHealthSelectedModule);if(!m)return '';
  const t=m.technical||{},c=m.conflicts||{},l=m.lkg||{};
  return `<section class="dh-details"><div class="dh-details-head"><div><div class="dh-eyebrow">Governed Module Detail</div><h2>${esc(m.label||m.module)}</h2><p>${esc(m.summary||'')}</p></div><button onclick="dataHealthSelectedModule='';safeRenderPages({preserveScroll:true})">Close</button></div><div class="dh-detail-grid"><div><span>30-Day Conflicts</span><strong>${Number(c.count30Days||0)}</strong><small>${esc(c.trend||'None')} trend</small></div><div><span>Most Recent Conflict</span><strong>${esc(c.mostRecentAt||'None')}</strong><small>${esc([c.user,c.machine].filter(Boolean).join(' @ '))}</small></div><div><span>Resolution</span><strong>${esc(c.resolution||'Not recorded')}</strong></div><div><span>Last Recovery</span><strong>${esc(m.lastRecoveryStatus||'None')}</strong><small>${esc(m.lastRecoveryAt||'')}</small></div></div><div class="dh-actions"><button class="primary" onclick="previewModuleLkg('${escAttr(m.module)}')" ${l.available?'':'disabled'}>Preview Last Known Good</button><button class="danger" onclick="previewModuleLkg('${escAttr(m.module)}',true)" ${m.recoveryAvailable?'':'disabled'}>Restore Last Known Good</button><button onclick="openModuleBackupManager('${escAttr(m.module)}')">Open Backup Manager</button><button onclick="showModuleMigrationHistory('${escAttr(m.module)}')">View Migration History</button><button onclick="exportDataHealthDiagnostics()">Export Diagnostics</button></div><details class="dh-technical"><summary>Technical details</summary><div class="dh-tech-grid"><span>Live path<strong>${esc(t.livePath||'')}</strong></span><span>Live hash<strong>${esc(t.liveSha256||'')}</strong></span><span>Integrity<strong>${esc(t.integrityStatus||'unknown')} ${esc(t.integrityError||'')}</strong></span><span>Schema state<strong>${esc(t.schemaStatus||'')} ${esc(t.schemaMessage||'')}</strong></span><span>LKG path<strong>${esc(t.lkgPath||'')}</strong></span><span>LKG hash<strong>${esc(t.lkgSha256||'')}</strong></span></div></details></section>`;
}

async function previewModuleLkg(module,restoreIntent=false){
  try{
    dataHealthLkgPreview=await SuiteBridge.send('suite:previewLastKnownGood',{...dataHealthAdminAuth(),module});
    const p=dataHealthLkgPreview;
    showModal(`<div class="modal-head"><div><div class="modal-title">Last-Known-Good Preview · ${esc(p.label||module)}</div><div class="mini-note">Summary comparison only. No record-by-record diff is performed.</div></div><button onclick="closeModal()">Close</button></div><div class="dh-preview-grid"><div><span>Current timestamp</span><strong>${esc(p.currentTimestamp||'')}</strong></div><div><span>LKG timestamp</span><strong>${esc(p.lkgTimestamp||'')}</strong></div><div><span>Current schema</span><strong>${esc(p.currentSchema||'')}</strong></div><div><span>LKG schema</span><strong>${esc(p.lkgSchema||'')}</strong></div><div><span>Current record count</span><strong>${Number(p.currentRecordCount||0)}</strong></div><div><span>LKG record count</span><strong>${Number(p.lkgRecordCount||0)}</strong></div><div><span>LKG validation</span><strong class="${p.lkgValid?'ok':'bad'}">${p.lkgValid?'VALID':'FAILED'}</strong></div><div><span>Recovery availability</span><strong>${p.recoveryAvailable?'Available':'Not available'}</strong></div></div><div class="notice">${esc(p.differenceSummary||'')}</div>${restoreIntent?`<div class="form-grid" style="margin-top:12px"><div class="full"><label>Recovery Reason Required</label><textarea id="lkgRestoreReason" rows="3" placeholder="Document why the LKG restore is required."></textarea></div></div>`:''}<details class="dh-technical"><summary>Technical details</summary><div class="mini-note">Current: ${esc(p.technical?.currentPath||'')}<br>Hash: ${esc(p.technical?.currentHash||'')}<br><br>LKG: ${esc(p.technical?.lkgPath||'')}<br>Hash: ${esc(p.technical?.lkgHash||'')}<br>${esc(p.technical?.validationError||'')}</div></details><div class="modal-actions"><button onclick="closeModal()">Cancel</button>${restoreIntent?`<button class="danger" onclick="restoreModuleLkg('${escAttr(module)}')" ${p.recoveryAvailable?'':'disabled'}>Restore This LKG</button>`:''}</div>`);
  }catch(e){toast('LKG preview failed: '+e.message);}
}

async function restoreModuleLkg(module){
  const p=dataHealthLkgPreview||{},reason=String(document.getElementById('lkgRestoreReason')?.value||'').trim();
  if(!reason){toast('Recovery reason is required');return;}
  if(!confirm(`Restore ${p.label||module} from the LKG created ${p.lkgTimestamp||'at the displayed time'}? The current live file will be backed up first.`))return;
  try{
    const r=await SuiteBridge.send('suite:restoreLastKnownGood',{...dataHealthAdminAuth(),module,reason,expectedRevision:p.currentRevision||''});
    applyRecoveredModule(module,r);
    closeModal();toast((p.label||module)+' restored from Last Known Good');await refreshDataHealth('restore');
  }catch(e){toast('LKG restore failed: '+e.message);await refreshDataHealth('restore-failure');}
}

function applyRecoveredModule(module,r){
  const parsed=JSON.parse(r.data||'{}');
  if(module==='attendance'){attendance=parsed;normalizeAttendance();}
  else if(module==='roster'){roster=parsed;normalizeRoster();}
  else if(module==='tasks'){tasks=parsed;normalizeTasks();}
  else if(module==='shift-reports'){shiftReports=parsed;normalizeShiftReports();}
  else if(module==='shift-intelligence'){shiftIntel=parsed;normalizeShiftIntel();}
  else if(module==='suite-settings'){settings=normalizeSettings(parsed);applyTheme();}
  recordModuleLoadInfo(module,{...r,source:'restored-last-known-good',sourceDetail:'Restored through Data Health & Recovery with permanent recovery audit.',loadedAt:new Date().toLocaleString(),dataRoot:settings.dataRoot});
}

function openModuleBackupManager(module){restoreSelectedModule=module;restorePreview=null;navigate('restore');loadRestoreBackups(module);loadBackupManager();}
function showModuleMigrationHistory(module){
  const rows=(dataHealthDashboard?.migrationHistory||[]).filter(x=>String(x.module||'')===String(module));
  showModal(`<div class="modal-head"><div><div class="modal-title">Migration History · ${esc(module)}</div><div class="mini-note">Permanent append-only migration outcomes.</div></div><button onclick="closeModal()">Close</button></div>${rows.length?`<div class="settings-table-wrap"><table><thead><tr><th>Time</th><th>Source</th><th>Target</th><th>Result</th><th>Details</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.at||'')}</td><td>${esc(r.sourceSchema||'')}</td><td>${esc(r.targetSchema||'')}</td><td class="${r.success===true?'ok':'bad'}">${r.success===true?'Succeeded':'Failed'}</td><td>${esc(r.error||r.approvalMode||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><strong>No Migration History</strong>No migration has been recorded for this module.</div>'}`);
}

async function exportDataHealthDiagnostics(){
  try{const r=await SuiteBridge.send('suite:exportDataHealthDiagnostics',dataHealthAdminAuth());toast('Metadata-only diagnostics exported: '+(r.fileName||r.path));}
  catch(e){toast('Diagnostics export failed: '+e.message);}
}

function dataHealthSpecialistHtml(){
  const rows=dataHealthDashboard?.specialistData||[];
  return `<details class="governance-details"><summary>Specialist Data <span>Informational only</span></summary><div class="governance-details-body"><div class="notice">Specialist files are checked for presence and valid JSON only. Core Data Health does not assign schemas, change access state, migrate, alter, or directly restore these files.</div>${rows.length?`<div class="settings-table-wrap"><table><thead><tr><th>File</th><th>Path</th><th>JSON</th><th>Modified</th><th>Morning LKG</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name||'')}</td><td>${esc(r.relativePath||'')}</td><td class="${r.validJson?'ok':'bad'}">${r.validJson?'Valid':'Invalid'}</td><td>${esc(r.modified||'')}</td><td>${r.capturedInLkg?'Captured':'Not captured'}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><strong>No Specialist JSON Detected</strong>No unregistered specialist JSON files were found in the live Data tree.</div>'}</div></details>`;
}

function dataHealthHistoryHtml(){
  const rows=dataHealthDashboard?.healthEvents||[];
  return `<details class="governance-details"><summary>Data Health Event History <span>${Number(dataHealthDashboard?.unreviewedEvents||0)} new since last review</span></summary><div class="governance-details-body"><div class="notice">History records meaningful state changes and recovery conditions. Routine successful refreshes are intentionally excluded.</div>${rows.length?`<div class="settings-table-wrap"><table><thead><tr><th>Time</th><th>Module</th><th>Change</th><th>Trigger</th><th>Detail</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.at||'')}</td><td>${esc(r.module||'')}</td><td>${esc(r.previousSeverity||'')} → ${esc(r.severity||'')}</td><td>${esc(r.trigger||'')}</td><td>${esc(r.detail||'')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty-state"><strong>No Meaningful Events Recorded</strong>Routine healthy refreshes do not create history entries.</div>'}</div></details>`;
}

renderDataHealth=function(){
  if(!canAdmin())return `<div class="page-head"><div><div class="page-title">Data Health & Recovery</div><div class="page-sub">This administrative module is unavailable for the current role.</div></div></div><div class="notice warn">Contact an Administrator if an operational module is read-only or unavailable.</div>`;
  if(dataHealthLoading&&!dataHealthDashboard)return `<div class="page-head"><div><div class="page-title">Data Health & Recovery</div><div class="page-sub">Checking governed data and recovery controls.</div></div></div><div class="notice">Running event-driven health check...</div>`;
  if(dataHealthError&&!dataHealthDashboard)return `<div class="page-head"><div><div class="page-title">Data Health & Recovery</div><div class="page-sub">The dashboard could not be loaded.</div></div><button class="primary" onclick="refreshDataHealth('manual-refresh')">Retry</button></div><div class="notice bad">${esc(dataHealthError)}</div>`;
  if(!dataHealthDashboard)return `<div class="page-head"><div><div class="page-title">Data Health & Recovery</div><div class="page-sub">Admin-only visibility into governed data health and recoverability.</div></div><button class="primary" onclick="refreshDataHealth('manual-refresh')">Run Health Check</button></div><div class="notice">Open or refresh the dashboard to check current health.</div>`;
  const d=dataHealthDashboard;
  return `<div class="page-head"><div><div class="page-title">Data Health & Recovery</div><div class="page-sub">Status first. Technical evidence and recovery controls remain behind each governed module.</div></div><div class="btn-group"><button class="primary" onclick="refreshDataHealth('manual-refresh')">Refresh Health</button><button onclick="exportDataHealthDiagnostics()">Export Diagnostics</button><button onclick="navigate('restore')">Backup & Restore</button></div></div>${governanceNav('data-health')}<div class="dh-suite-banner dh-${esc(d.overallSeverity||'gray')}"><div><div class="dh-eyebrow">Overall Suite Status</div><strong>${esc(d.overallLabel||dataHealthSeverityLabel(d.overallSeverity))}</strong><span>Health checked at: ${esc(d.checkedAt||'')}</span></div><div class="dh-event-count"><strong>${Number(d.unreviewedEvents||0)}</strong><span>new since last review</span></div></div>${dataHealthStorageHtml()}<div class="dh-module-grid">${(d.modules||[]).map(dataHealthModuleCard).join('')}</div>${dataHealthModuleDetails()}${dataHealthSpecialistHtml()}${dataHealthHistoryHtml()}`;
};

const mockResponseV420=mockResponse;
mockResponse=async function(type,payload,extra){
  if(type==='suite:getDataHealthSummary')return{severity:'yellow',label:'Preview Mode',unreviewedEvents:1,checkedAt:new Date().toLocaleString()};
  if(type==='suite:getDataHealth')return{checkedAt:new Date().toLocaleString(),overallSeverity:'yellow',overallLabel:'Attention',unreviewedEvents:1,sharedStorage:{severity:'green',reachable:true,readAllowed:true,writeAllowed:true,lastChecked:new Date().toLocaleString(),freeSpaceBytes:0,dataMode:'Browser preview',path:settings.dataRoot},modules:['attendance','roster','tasks','shift-reports','shift-intelligence','suite-settings'].map((module,i)=>({module,label:moduleLabel(module),severity:i?'green':'yellow',statusLabel:i?'Healthy':'Attention',accessState:'Writable',schemaVersion:module==='attendance'?'attendance-2':module+'-1',expectedSchemaVersion:module==='attendance'?'attendance-2':module+'-1',lastSuccessfulSave:'Preview',lkg:{available:true,valid:true,currentToday:true,snapshotDate:new Date().toISOString().slice(0,10)},lastMigrationStatus:'No migration recorded',recoveryAvailable:true,summary:i?'Healthy preview module.':'Preview attention state.',conflicts:{count30Days:i?0:3,trend:i?'None':'Increasing'},technical:{integrityStatus:'valid'}})),specialistData:[],healthEvents:[],migrationHistory:[],recoveryHistory:[]};
  if(type==='suite:reviewHealthEvents')return{unreviewedEvents:0,reviewedAt:new Date().toISOString()};
  if(type==='suite:previewLastKnownGood')return{module:payload.module,label:moduleLabel(payload.module),currentTimestamp:'Preview',lkgTimestamp:'Preview',currentSchema:'preview-1',lkgSchema:'preview-1',currentRecordCount:10,lkgRecordCount:10,lkgValid:true,recoveryAvailable:true,differenceSummary:'Record-count totals match.',currentRevision:'preview',technical:{}};
  if(type==='suite:exportDataHealthDiagnostics')return{path:'Preview',fileName:'PWADC-Data-Health-Diagnostics-Preview.zip',metadataOnly:true};
  return mockResponseV420(type,payload,extra);
};

PWADCModuleRegistry.register('data-health-recovery');
