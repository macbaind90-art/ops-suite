/* Governed Promotion Packets: printed candidate assessment and supervisor review. */
let promotionPackets={schemaVersion:'promotion-packets-1',templates:[],packets:[],audit:[]};

async function loadPromotionPackets(){
  try{
    const res=await SuiteBridge.send('suite:loadModuleData',{}, {module:'promotion-packets'});
    recordModuleLoadInfo('promotion-packets',res);
    const value=typeof res.data==='string'?JSON.parse(res.data||'{}'):(res.data||{});
    if(!Array.isArray(value.templates)||!Array.isArray(value.packets)||!Array.isArray(value.audit))throw new Error('Packet arrays are missing.');
    promotionPackets=value;
  }catch(e){
    moduleLoadInfo['promotion-packets']={...(moduleLoadInfo['promotion-packets']||{}),writeAllowed:false};
    toast('Promotion Packets load failed: '+e.message);
  }
}
function promotionPacket(id){return (promotionPackets.packets||[]).find(p=>p.id===id)}
function promotionLocalDate(value){const date=new Date(value||'');return Number.isNaN(date.getTime())?'':date.toLocaleDateString()}
function promotionEmployee(id){return (roster.employees||[]).find(e=>String(e.id)===String(id))}
function promotionPacketCan(action){return hasCapability(action==='issue'||action==='scenario'||action==='delete'||action==='restore'?'promotion.manage':action==='review'?'promotion.review':'promotion.decide')}
async function promotionCommand(action,fields){
  if(!promotionPacketCan(action)){toast('Promotion packet permission is required.');return null}
  const info=moduleLoadInfo['promotion-packets']||{};
  if(info.writeAllowed===false||info.conflict){toast('Promotion Packets is read-only. Reload the latest data or review Data Health.');return null}
  try{
    const res=await SuiteBridge.send('suite:promotionPacketCommand',{action,...fields,expectedRevision:info.revision||''},{authorization:authorizationEnvelope()});
    promotionPackets=JSON.parse(res.data);
    updateModuleRevisionAfterSave('promotion-packets',res.save);
    closeModal();
    safeRenderPages({preserveScroll:true});
    toast('Promotion packet '+action+' saved.');
    return res;
  }catch(e){
    if(isStaleWriteConflictError(e)){
      moduleLoadInfo['promotion-packets']={...info,conflict:true,conflictMessage:e.message};
      showDataConflictModal('promotion-packets',e.message);
    }else toast('Promotion packet save failed: '+e.message);
    return null;
  }
}
function renderPromotionPackets(){
  const all=[...(promotionPackets.packets||[])].sort((a,b)=>String(b.issuedAt).localeCompare(String(a.issuedAt)));
  const focus=String(window._promotionEmployeeFocus||'');
  const q=String(window._promotionSearch||'').toLowerCase();
  const showDeleted=window._promotionShowDeleted===true;
  const visible=all.filter(p=>showDeleted?p.status==='Deleted':p.status!=='Deleted');
  const rows=visible.filter(p=>(!focus||String(p.employeeId)===focus)&&(!q||((p.employee?.name||'')+' '+(p.employee?.eid||'')+' '+p.tier+' '+p.status).toLowerCase().includes(q)));
  const pending=all.filter(p=>p.status==='Reviewed').length;
  const canIssue=promotionPacketCan('issue');
  return `<div class="page-head"><div><div class="page-title">Promotion Packets</div><div class="page-sub">Issue a controlled print packet, collect the candidate's six written answers, and record the supervisor recommendation and manager decision.</div></div><div class="top-actions">${canIssue?'<button class="primary" onclick="openPromotionIssueModal()">+ Issue Packet</button><button onclick="openPromotionBank()">Manage Scenario Banks</button>':''}<button onclick="printPromotionRegister()">Print Register</button><button onclick="exportPromotionRegister()">Export CSV</button></div></div>
    ${renderPeopleWorkflowNav('promotion-packets')}
    <div class="notice">Issue creates a packet with six randomly selected scenarios from its level's bank. Manager deletion hides a packet and preserves an audit record. Reprinting uses those same questions. A packet recommendation does not change rank, pay, or HR approval.</div>
    <div class="grid cols-3"><div class="kpi"><div class="num">${all.filter(p=>p.status!=='Deleted').length}</div><div class="lbl">Active Packets</div></div><div class="kpi"><div class="num">${all.filter(p=>p.status==='Issued').length}</div><div class="lbl">With Supervisor</div></div><div class="kpi"><div class="num">${pending}</div><div class="lbl">Awaiting Manager</div></div></div>
    <div class="card"><div class="card-title">Packet Register</div><div class="training-filters"><div><label>Search</label><input value="${esc(window._promotionSearch||'')}" placeholder="Employee, ID, level or status" oninput="window._promotionSearch=this.value;safeRenderPages()"></div>${canAdmin()?'<div><label>Register view</label><button onclick="window._promotionShowDeleted=!window._promotionShowDeleted;safeRenderPages()">'+(showDeleted?'Show active packets':'Show deleted packets')+'</button></div>':''}${focus?'<div><label>Employee</label><button onclick="window._promotionEmployeeFocus=\'\';safeRenderPages()">Clear employee filter</button></div>':''}</div>
    <div class="settings-table-wrap"><table><thead><tr><th>Employee</th><th>Promotion</th><th>Issued</th><th>Status</th><th>Packet ID</th><th>Actions</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.employee?.name||'Employee removed')}<div class="mini-note">${esc(p.employee?.eid||'')} · ${esc(p.employee?.shift||'')}</div></td><td>${esc(p.tier?.replace('-', ' → ')||'')}</td><td>${esc(promotionLocalDate(p.issuedAt))}</td><td>${esc(p.status||'')}</td><td><small>${esc(p.id||'')}</small></td><td><div class="td-actions">${p.status!=='Deleted'?`<button class="sm" onclick="printPromotionPacket('${esc(p.id)}')">Print / Reprint</button>`:''}${p.status==='Issued'&&promotionPacketCan('review')?`<button class="sm" onclick="openPromotionReviewModal('${esc(p.id)}')">Record Review</button>`:''}${p.status==='Reviewed'&&promotionPacketCan('decide')?`<button class="sm gold" onclick="openPromotionDecisionModal('${esc(p.id)}')">Manager Decision</button>`:''}${canAdmin()?`<button class="sm ${p.status==='Deleted'?'':'danger'}" onclick="openPromotionDeleteModal('${esc(p.id)}','${p.status==='Deleted'?'restore':'delete'}')">${p.status==='Deleted'?'Restore':'Delete'}</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6">No packets match the filter.</td></tr>'}</tbody></table></div></div>`;
}
function openPromotionForEmployee(id){window._promotionEmployeeFocus=String(id||'');navigate('promotion-packets')}
function renderEmployeeProfilePromotion(emp){
  const list=(promotionPackets.packets||[]).filter(p=>p.status!=='Deleted'&&String(p.employeeId)===String(emp.id)).sort((a,b)=>String(b.issuedAt).localeCompare(String(a.issuedAt)));
  return `<div class="card"><div class="card-title">Promotion Packets</div><div class="td-actions">${promotionPacketCan('issue')?`<button class="sm primary" onclick="openPromotionIssueModal('${esc(emp.id)}')">Issue Packet</button>`:''}<button class="sm" onclick="openPromotionForEmployee('${esc(emp.id)}')">Open Promotion Packets</button></div>${list.length?`<div class="profile-list">${list.map(p=>`<div class="profile-list-row"><strong>${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.status||'')}</strong><br><span class="mini-note">${esc(promotionLocalDate(p.issuedAt))} · ID ${esc(p.id)}</span> <button class="sm" onclick="printPromotionPacket('${esc(p.id)}')">Print</button></div>`).join('')}</div>`:'<p class="mini-note">No promotion packets issued.</p>'}</div>`;
}
function openPromotionDeleteModal(id,action){
  if(!canAdmin()||!promotionPacketCan(action))return;
  const p=promotionPacket(id);if(!p||((action==='restore')!==(p.status==='Deleted')))return;
  showModal(`<div class="modal-head"><div class="modal-title">${action==='delete'?'Delete':'Restore'} Promotion Packet</div><button onclick="closeModal()">Close</button></div><p>${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.id)}</p><div class="notice">${action==='delete'?'This removes the packet from the active register and employee profile. Its history remains in the audit record; you can restore it from the deleted view.':'Restore the prior packet status and its original questions, review, and decision.'}</div><label>Reason (at least 10 characters)</label><textarea id="promoDeleteReason" rows="3" placeholder="Document why this packet is being ${action==='delete'?'deleted':'restored'}"></textarea><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="${action==='delete'?'danger':'primary'}" onclick="savePromotionDelete('${esc(id)}','${action}')">${action==='delete'?'Delete packet':'Restore packet'}</button></div>`);
}
function savePromotionDelete(id,action){
  const notes=val('promoDeleteReason')?.trim()||'';
  if(notes.length<10){toast('Enter a reason of at least 10 characters.');return}
  promotionCommand(action,{packetId:id,notes});
}
function openPromotionBank(tier='T1-T2'){
  if(!promotionPacketCan('scenario'))return;
  const t=(promotionPackets.templates||[]).find(x=>x.tier===tier);if(!t)return;
  const bank=t.scenarios||[];
  showModal(`<div class="modal-head"><div><div class="modal-title">Scenario Banks</div><div class="mini-note">Changes create a new template revision. Issued packets keep their original questions.</div></div><button onclick="closeModal()">Close</button></div>
    <div class="form-grid"><div><label>Promotion level</label><select onchange="openPromotionBank(this.value)">${(promotionPackets.templates||[]).map(x=>`<option value="${esc(x.tier)}" ${x.tier===tier?'selected':''}>${esc(x.tier.replace('-', ' → '))}</option>`).join('')}</select></div><div><label>Active scenarios / revision</label><p>${bank.filter(x=>x.active!==false).length} active · version ${esc(t.revision||1)}</p></div></div>
    <div class="notice">Six distinct active questions are selected at random for each new packet. Keep at least six active scenarios.</div>
    <div class="settings-table-wrap"><table><thead><tr><th>Scenario</th><th>Status</th><th>Actions</th></tr></thead><tbody>${bank.map(s=>`<tr><td>${esc(s.prompt)}</td><td>${s.active===false?'Archived':'Active'}</td><td><button class="sm" onclick="openPromotionScenarioEdit('${esc(tier)}','${esc(s.id)}')">Edit</button> <button class="sm" onclick="togglePromotionScenario('${esc(tier)}','${esc(s.id)}',${s.active===false})">${s.active===false?'Restore':'Archive'}</button></td></tr>`).join('')}</tbody></table></div>
    <div class="modal-actions"><button onclick="closeModal()">Close</button><button class="primary" onclick="openPromotionScenarioEdit('${esc(tier)}')">+ Add Scenario</button></div>`);
}
function openPromotionScenarioEdit(tier,id=''){
  if(!promotionPacketCan('scenario'))return;
  const t=(promotionPackets.templates||[]).find(x=>x.tier===tier),s=t?.scenarios?.find(x=>x.id===id);
  showModal(`<div class="modal-head"><div class="modal-title">${id?'Edit':'Add'} ${esc(tier.replace('-', ' → '))} Scenario</div><button onclick="openPromotionBank('${esc(tier)}')">Back</button></div><div class="notice">Use current handbook language. Changes apply to future packets; existing issued packets retain their wording.</div><label>Candidate question</label><textarea id="promoScenarioPrompt" rows="7">${esc(s?.prompt||'')}</textarea><div class="modal-actions"><button onclick="openPromotionBank('${esc(tier)}')">Cancel</button><button class="primary" onclick="savePromotionScenario('${esc(tier)}','${esc(id)}')">Save Scenario</button></div>`);
}
async function savePromotionScenario(tier,id){
  const prompt=val('promoScenarioPrompt')?.trim();
  if(!prompt||prompt.length<45){toast('Write a complete scenario question of at least 45 characters.');return}
  await promotionCommand('scenario',{tier,scenarioId:id,prompt,active:true});
}
async function togglePromotionScenario(tier,id,active){
  const t=(promotionPackets.templates||[]).find(x=>x.tier===tier),s=t?.scenarios?.find(x=>x.id===id);
  if(!s||!confirm((active?'Restore':'Archive')+' this scenario for future packets?'))return;
  await promotionCommand('scenario',{tier,scenarioId:id,prompt:s.prompt,active});
}
function openPromotionIssueModal(employeeId=''){
  if(!promotionPacketCan('issue'))return;
  const employees=(roster.employees||[]).filter(e=>!isArchivedEmployee(e)).sort((a,b)=>fullName(a).localeCompare(fullName(b)));
  showModal(`<div class="modal-head"><div><div class="modal-title">Issue Promotion Packet</div><div class="mini-note">The selected six questions are frozen on issue and printed with the checklist.</div></div><button onclick="closeModal()">Close</button></div><div class="form-grid"><div><label>Candidate</label><select id="promoEmployee"><option value="">Choose employee</option>${employees.map(e=>`<option value="${esc(e.id)}" ${String(e.id)===String(employeeId)?'selected':''}>${esc(fullName(e))} · ${esc(e.eid||'')}</option>`).join('')}</select></div><div><label>Promotion Level</label><select id="promoTier">${(promotionPackets.templates||[]).filter(t=>t.active!==false).map(t=>`<option value="${esc(t.tier)}">${esc(t.tier.replace('-', ' → '))} · ${(t.scenarios||[]).filter(s=>s.active!==false).length} active scenarios</option>`).join('')}</select></div></div><div class="notice">Check the candidate's current qualifications before issuance. The packet captures a snapshot of Training assignments; missing signoffs do not become qualifications.</div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="issuePromotionPacket()">Issue and Print</button></div>`);
}
async function issuePromotionPacket(){
  const employeeId=val('promoEmployee'),tier=val('promoTier');
  if(!employeeId||!tier){toast('Choose an employee and promotion level.');return}
  const res=await promotionCommand('issue',{employeeId,tier});
  if(res?.packetId)printPromotionPacket(res.packetId);
}
function openPromotionReviewModal(id){
  if(!promotionPacketCan('review'))return;
  const p=promotionPacket(id);if(!p||p.status!=='Issued')return;
  showModal(`<div class="modal-head"><div class="modal-title">Supervisor Recommendation</div><button onclick="closeModal()">Close</button></div><p>${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.id)}</p><div class="notice">Review all checklist items and six candidate responses on the signed paper packet. You may recommend advancement with a Needs Development item when you document the gap, supporting evidence, and follow-up. Record where the completed packet is filed; the Security Manager makes the final decision.</div><div class="form-grid"><div><label>Recommendation</label><select id="promoRecommendation"><option value="Recommend">Recommend</option><option value="Return for development">Return for development</option></select></div><div><label>Completed paper packet / scan reference</label><input id="promoReference" placeholder="File path, scan ID, or paper file reference"></div><div class="full"><label>Assessment and specific gaps</label><textarea id="promoNotes" rows="5" placeholder="Summarize performance and any required recheck"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePromotionReview('${esc(id)}')">Save Recommendation</button></div>`);
}
function savePromotionReview(id){
  const reference=val('promoReference')?.trim(),notes=val('promoNotes')?.trim();
  if(!reference||!notes){toast('Paper packet reference and assessment are required.');return}
  promotionCommand('review',{packetId:id,recommendation:val('promoRecommendation'),reference,notes});
}
function openPromotionDecisionModal(id){
  if(!promotionPacketCan('decide'))return;
  const p=promotionPacket(id);if(!p||p.status!=='Reviewed')return;
  showModal(`<div class="modal-head"><div class="modal-title">Security Manager Decision</div><button onclick="closeModal()">Close</button></div><p>${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.id)}</p><div class="notice">Supervisor: ${esc(p.review?.recommendation||'')} · ${esc(p.review?.reviewerName||'')}<br>${esc(p.review?.notes||'')}</div><div class="form-grid"><div><label>Decision</label><select id="promoDecision"><option value="Recommend promotion">Recommend promotion</option><option value="Defer">Defer</option><option value="Decline">Decline</option></select></div><div><label>Completed paper packet / scan reference</label><input id="promoDecisionReference" value="${esc(p.review?.paperReference||'')}"></div><div class="full"><label>Reason and HR follow-up</label><textarea id="promoDecisionNotes" rows="5" placeholder="Record decision rationale and any HR follow-up"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePromotionDecision('${esc(id)}')">Record Decision</button></div>`);
}
function savePromotionDecision(id){
  const reference=val('promoDecisionReference')?.trim(),notes=val('promoDecisionNotes')?.trim();
  if(!reference||!notes){toast('Paper packet reference and decision reason are required.');return}
  promotionCommand('decide',{packetId:id,decision:val('promoDecision'),reference,notes});
}
function printPromotionPacket(id){
  const p=promotionPacket(id);if(!p||p.status==='Deleted')return;
  if(!Array.isArray(p.scenarios)||p.scenarios.length!==6){toast('This packet does not contain exactly six scenarios.');return}
  const title='PWADC Promotion Packet · '+p.tier?.replace('-', ' to ');
  const style=`<style>@page{size:letter;margin:.65in}body{font-family:"Century Gothic",Arial,sans-serif!important;font-size:10pt!important;line-height:1.4!important;color:#171717!important}.pp-top{border-top:8px solid #c8102e;padding-top:12px}.pp-top h1{font-size:21pt;color:#c8102e;margin:5px 0}.pp-sub{letter-spacing:2px;font-weight:bold;font-size:9pt}.pp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.pp-field{border-bottom:1px solid #777;padding:5px 1px;min-height:30px}.pp-field b{font-size:8pt;color:#555;text-transform:uppercase}.pp-note{background:#f6f3f0;border-left:4px solid #c8102e;padding:10px;margin:12px 0}.pp-section{break-before:page;page-break-before:always}.pp-section.first{break-before:auto;page-break-before:auto}.pp-heading{color:#c8102e;border-bottom:2px solid #c8102e;padding-bottom:5px;margin:18px 0 9px;font-size:14pt}.pp-check{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #ddd;break-inside:avoid}.pp-box{font-size:15pt;line-height:1}.pp-eval{font-size:8pt;color:#444;margin-top:4px}.pp-scenario{break-inside:avoid;page-break-inside:avoid;padding-top:8px;margin-bottom:16px}.pp-lines{height:140px;background:repeating-linear-gradient(to bottom,transparent 0,transparent 26px,#bbb 27px,#bbb 28px)}.pp-sign{min-height:55px;border-bottom:1px solid #777;margin:10px 0}.pp-small{font-size:8pt;color:#555}.pp-footer{font-size:8pt;border-top:1px solid #999;margin-top:18px;padding-top:5px}</style>`;
  const header=`<div class="pp-top"><div class="pp-sub">PIGGLY WIGGLY ALABAMA DISTRIBUTING COMPANY · SECURITY</div><h1>Promotion Assessment Packet</h1><div>${esc(p.tier?.replace('-', ' → ')||'')} · Template revision ${esc(p.templateRevision||1)} · Six candidate scenarios</div></div><div class="pp-grid"><div class="pp-field"><b>Candidate</b><br>${esc(p.employee?.name||'')}</div><div class="pp-field"><b>Employee ID</b><br>${esc(p.employee?.eid||'')}</div><div class="pp-field"><b>Current rank / shift</b><br>${esc(p.employee?.rank||'')} · ${esc(p.employee?.shift||'')}</div><div class="pp-field"><b>Packet ID / issue date</b><br>${esc(p.id)} · ${esc(promotionLocalDate(p.issuedAt))}</div><div class="pp-field"><b>Assigned supervisor</b><br>&nbsp;</div><div class="pp-field"><b>Assessment date</b><br>&nbsp;</div></div><div class="pp-note">Supervisor: give the candidate the six scenarios in this packet. Evaluate each answer and the checklist against the current Career Framework, controlled policy, and post handbooks. Record actual observed evidence, gaps, and any recheck. A documented Needs Development item may accompany your recommendation. The Security Manager decides after reviewing the required signed qualification records. This packet alone does not authorize a new post, promotion, or pay change.</div>`;
  const evidence=`<h2 class="pp-heading">Training evidence at issue</h2><table><thead><tr><th>Requirement</th><th>Signoff on record</th><th>Signed date</th></tr></thead><tbody>${(p.trainingEvidence||[]).map(x=>`<tr><td>${esc(x.requirement||'')}</td><td>${x.signoffId?'Recorded':'No signoff in issue snapshot'}</td><td>${esc(x.signoffDate||'')}</td></tr>`).join('')||'<tr><td colspan="3">No assigned Training requirements found in issue snapshot. Verify readiness before recommendation.</td></tr>'}</tbody></table><div class="pp-small">Review current Training status separately before final recommendation. This snapshot does not certify current qualification.</div>`;
  const checklist=`<div class="pp-section"><h2 class="pp-heading">Supervisor competency checklist</h2><p>Mark each item Meets / Needs Development / Not Observed. Enter specific evidence and any recheck. A recommendation may include a documented Needs Development item; the Security Manager makes the final decision.</p>${(p.checklist||[]).map((x,i)=>`<div class="pp-check"><span class="pp-box">□</span><div><b>${i+1}. ${esc(x.text||'')}</b><div class="pp-eval">□ Meets standard &nbsp; □ Needs development &nbsp; □ Not observed &nbsp; Evidence / date: __________________________________________</div></div></div>`).join('')}<div class="pp-sign">Checklist evidence and recheck notes:</div></div>`;
  const scenarios=`<div class="pp-section"><h2 class="pp-heading">Candidate written scenarios</h2><p>Candidate: answer all six. Include first actions, notifications, safety limits, and documentation. Use additional pages marked with packet ID and scenario number if needed.</p>${p.scenarios.map((s,i)=>`<div class="pp-scenario"><h3>Scenario ${i+1} of 6 · ${esc(s.id||'')}</h3><p>${esc(s.prompt||'')}</p><div class="pp-lines"></div><div class="pp-eval">Supervisor: □ Meets standard &nbsp; □ Needs development &nbsp; □ Not answered &nbsp; Notes / recheck: _______________________________________</div></div>`).join('')}</div>`;
  const close=`<div class="pp-section"><h2 class="pp-heading">Supervisor recommendation</h2><div>□ Recommend &nbsp;&nbsp; □ Return for development &nbsp;&nbsp; Recheck date: ___________________</div><div class="pp-sign">Specific strengths and evidence:</div><div class="pp-sign">Development needs / required recheck (document any Needs Development item even if recommending):</div><div class="pp-grid"><div class="pp-field">Supervisor signature: ______________________________</div><div class="pp-field">Date: __________________</div><div class="pp-field">Candidate acknowledgment (receipt only): ______________________________</div><div class="pp-field">Date: __________________</div></div><h2 class="pp-heading">Security Manager decision</h2><div>□ Recommend promotion &nbsp;&nbsp; □ Defer &nbsp;&nbsp; □ Decline</div><div class="pp-sign">Decision basis and any HR follow-up:</div><div class="pp-grid"><div class="pp-field">Security Manager signature: ______________________________</div><div class="pp-field">Date: __________________</div><div class="pp-field">HR follow-up / reference: ______________________________</div><div class="pp-field">Effective date, if separately approved: __________________</div></div><div class="pp-footer">PWADC Security · Packet ${esc(p.id)} · Retain the signed original or controlled scan and record its location in the app. Printed copy is confidential personnel material.</div></div>`;
  printHtmlDirect(title,style+header+evidence+checklist+scenarios+close,'portrait');
}
function printPromotionRegister(){
  const rows=(promotionPackets.packets||[]).filter(p=>p.status!=='Deleted');
  const body=`<div class="print-header"><div><div class="print-brand">PWADC Security</div><h1>Promotion Packet Register</h1></div><div class="print-meta">${esc(new Date().toLocaleString())}</div></div>${reportTable(['Candidate','Level','Issued','Status','Supervisor recommendation','Manager decision','Packet ID'],rows.map(p=>[esc(p.employee?.name||''),esc(p.tier||''),esc(promotionLocalDate(p.issuedAt)),esc(p.status||''),esc(p.review?.recommendation||''),esc(p.decision?.result||''),esc(p.id||'')]))}`;
  printHtmlDirect('PWADC Promotion Packet Register',body,'landscape');
}
function exportPromotionRegister(){
  downloadCSV('PWADC_Promotion_Packets_'+new Date().toISOString().slice(0,10)+'.csv',[['Candidate','EID','Level','Issued','Status','Supervisor recommendation','Manager decision','Packet ID'],...(promotionPackets.packets||[]).filter(p=>p.status!=='Deleted').map(p=>[p.employee?.name||'',p.employee?.eid||'',p.tier||'',p.issuedAt||'',p.status||'',p.review?.recommendation||'',p.decision?.result||'',p.id||''])]);
}
PWADCModuleRegistry.register('promotion-packets');
