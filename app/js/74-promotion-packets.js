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
    <div class="settings-table-wrap"><table><thead><tr><th>Employee</th><th>Promotion</th><th>Issued</th><th>Status</th><th>Packet ID</th><th>Actions</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${esc(p.employee?.name||'Employee removed')}<div class="mini-note">${esc(p.employee?.eid||'')} · ${esc(p.employee?.shift||'')}</div></td><td>${esc(p.tier?.replace('-', ' → ')||'')}</td><td>${esc(promotionLocalDate(p.issuedAt))}</td><td>${esc(p.status||'')}</td><td><small>${esc(p.id||'')}</small></td><td><div class="td-actions">${p.status!=='Deleted'?`<button class="sm" onclick="printPromotionPacket('${esc(p.id)}')">Preview / Print</button>`:''}${p.status==='Issued'&&promotionPacketCan('review')?`<button class="sm" onclick="openPromotionReviewModal('${esc(p.id)}')">Record Review</button>`:''}${p.status==='Reviewed'&&promotionPacketCan('decide')?`<button class="sm gold" onclick="openPromotionDecisionModal('${esc(p.id)}')">Manager Decision</button>`:''}${canAdmin()?`<button class="sm ${p.status==='Deleted'?'':'danger'}" onclick="openPromotionDeleteModal('${esc(p.id)}','${p.status==='Deleted'?'restore':'delete'}')">${p.status==='Deleted'?'Restore':'Delete'}</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6">No packets match the filter.</td></tr>'}</tbody></table></div></div>`;
}
function openPromotionForEmployee(id){window._promotionEmployeeFocus=String(id||'');navigate('promotion-packets')}
function renderEmployeeProfilePromotion(emp){
  const list=(promotionPackets.packets||[]).filter(p=>p.status!=='Deleted'&&String(p.employeeId)===String(emp.id)).sort((a,b)=>String(b.issuedAt).localeCompare(String(a.issuedAt)));
  return `<div class="card"><div class="card-title">Promotion Packets</div><div class="td-actions">${promotionPacketCan('issue')?`<button class="sm primary" onclick="openPromotionIssueModal('${esc(emp.id)}')">Issue Packet</button>`:''}<button class="sm" onclick="openPromotionForEmployee('${esc(emp.id)}')">Open Promotion Packets</button></div>${list.length?`<div class="profile-list">${list.map(p=>`<div class="profile-list-row"><strong>${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.status||'')}</strong><br><span class="mini-note">${esc(promotionLocalDate(p.issuedAt))} · ID ${esc(p.id)}</span> <button class="sm" onclick="printPromotionPacket('${esc(p.id)}')">Preview</button></div>`).join('')}</div>`:'<p class="mini-note">No promotion packets issued.</p>'}</div>`;
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
  showModal(`<div class="modal-head"><div class="modal-title">Evaluator / Supervisor Recommendation</div><button onclick="closeModal()">Close</button></div><p>${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.id)}</p><div class="notice">Evaluate the comprehensive checklist and grade all six verbal responses on the paper packet. Document key answers, observed evidence, gaps, and rechecks. A recommendation may include a documented Needs Development item. File the signed packet or controlled scan.</div><div class="form-grid"><div><label>Recommendation</label><select id="promoRecommendation"><option value="Recommend">Recommend</option><option value="Return for development">Return for development</option></select></div><div><label>Completed packet / scan reference</label><input id="promoReference" placeholder="Controlled file or paper record location"></div><div class="full"><label>Assessment and specific gaps</label><textarea id="promoNotes" rows="5" placeholder="Summarize checklist evidence, verbal scenario grades, and follow-up"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePromotionReview('${esc(id)}')">Save Recommendation</button></div>`);
}
function savePromotionReview(id){
  const reference=val('promoReference')?.trim(),notes=val('promoNotes')?.trim();
  if(!reference||!notes){toast('Completed packet reference and assessment are required.');return}
  promotionCommand('review',{packetId:id,recommendation:val('promoRecommendation'),reference,notes});
}
function openPromotionDecisionModal(id){
  if(!promotionPacketCan('decide'))return;
  const p=promotionPacket(id);if(!p||p.status!=='Reviewed')return;
  const interview=p.tier==='T3-T4'?`<div class="full"><h3>Required T4 Security Manager interview</h3><div class="mini-note">Discuss leadership judgment, incident response, training integrity, and Acting Supervisor limits. Approval requires a dated interview rated Meets standard.</div></div><div><label>Interview date</label><input id="promoInterviewDate" type="date"></div><div><label>Interview outcome</label><select id="promoInterviewOutcome"><option value="">Select outcome</option><option>Meets standard</option><option>Needs development</option></select></div><div class="full"><label>Interview assessment</label><textarea id="promoInterviewNotes" rows="4" placeholder="Record the candidate's responses and your assessment"></textarea></div>`:'';
  showModal(`<div class="modal-head"><div class="modal-title">Security Manager Approval</div><button onclick="closeModal()">Close</button></div><p>${esc(p.employee?.name||'')} · ${esc(p.tier?.replace('-', ' → ')||'')} · ${esc(p.id)}</p><div class="notice">Supervisor: ${esc(p.review?.recommendation||'')} · ${esc(p.review?.reviewerName||'')}<br>${esc(p.review?.notes||'')}</div><div class="form-grid"><div><label>Decision</label><select id="promoDecision"><option value="Approve promotion">Approve promotion</option><option value="Defer">Defer</option><option value="Decline">Decline</option></select></div><div><label>Signed packet / scan reference</label><input id="promoDecisionReference" value="${esc(p.review?.paperReference||'')}"></div><div class="full"><label><input type="checkbox" id="promoRecordsVerified"> Signed qualifications and eligibility records verified</label></div><div class="full"><label><input type="checkbox" id="promoChecklistReviewed"> Completed checklist and supporting evidence reviewed</label></div><div class="full"><label><input type="checkbox" id="promoScenariosReviewed"> All six verbal scenario grades and evaluator notes reviewed</label></div>${interview}<div class="full"><label>Decision basis and HR follow-up</label><textarea id="promoDecisionNotes" rows="5" placeholder="Record approval or deferral rationale and any HR follow-up"></textarea></div></div><div class="modal-actions"><button onclick="closeModal()">Cancel</button><button class="primary" onclick="savePromotionDecision('${esc(id)}')">Record Decision</button></div>`);
}
function savePromotionDecision(id){
  const p=promotionPacket(id),decision=val('promoDecision');
  const reference=val('promoDecisionReference')?.trim(),notes=val('promoDecisionNotes')?.trim();
  const recordsVerified=document.getElementById('promoRecordsVerified')?.checked===true;
  const checklistReviewed=document.getElementById('promoChecklistReviewed')?.checked===true;
  const scenariosReviewed=document.getElementById('promoScenariosReviewed')?.checked===true;
  const interviewDate=val('promoInterviewDate')||'',interviewOutcome=val('promoInterviewOutcome')||'',interviewNotes=val('promoInterviewNotes')?.trim()||'';
  if(!reference||!notes){toast('Signed packet reference and decision reason are required.');return}
  if(decision==='Approve promotion'&&(!recordsVerified||!checklistReviewed||!scenariosReviewed)){toast('Verify signed records, checklist, and all six verbal grades before approval.');return}
  if(decision==='Approve promotion'&&p?.tier==='T3-T4'&&(!interviewDate||interviewOutcome!=='Meets standard'||interviewNotes.length<20)){toast('T4 approval requires a dated Manager interview, Meets standard rating, and assessment.');return}
  promotionCommand('decide',{packetId:id,decision,reference,notes,recordsVerified,checklistReviewed,scenariosReviewed,interviewDate,interviewOutcome,interviewNotes});
}
function printPromotionPacket(id){
  const p=promotionPacket(id);if(!p||p.status==='Deleted')return;
  if(!Array.isArray(p.scenarios)||p.scenarios.length!==6){toast('This packet does not contain exactly six scenarios.');return}
  const style=`<style>@page{size:letter;margin:.58in}*{box-sizing:border-box}body{font-family:"Century Gothic",Arial,sans-serif!important;color:#171717!important;background:white!important;font-size:9.5pt!important;line-height:1.35!important}.pp-header{border-top:8px solid #c8102e;padding-top:10px}.pp-brand{font-size:9pt;font-weight:700;letter-spacing:1.5px}.pp-header h1{font-size:21pt;color:#c8102e;margin:4px 0}.pp-meta{color:#555;font-size:8pt}.pp-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:15px 0}.pp-field{border-bottom:1px solid #888;min-height:37px;padding:4px 2px}.pp-field b{font-size:7.5pt;color:#555;text-transform:uppercase;letter-spacing:.4px}.pp-note{background:#f8f5f3;border-left:4px solid #c8102e;padding:10px;margin:12px 0}.pp-section{break-before:page;page-break-before:always}.pp-heading{color:#c8102e;border-bottom:2px solid #c8102e;padding-bottom:5px;margin:8px 0 10px;font-size:15pt}.pp-subheading{font-size:11pt;color:#111;border-bottom:1px solid #aaa;margin:18px 0 6px;padding-bottom:3px}.pp-check{padding:8px 0;border-bottom:1px solid #ddd;break-inside:avoid;page-break-inside:avoid}.pp-check-title{font-weight:700}.pp-eval{font-size:8pt;margin-top:5px;color:#333}.pp-scenario{padding:12px;border:1px solid #bbb;margin:12px 0;break-inside:avoid;page-break-inside:avoid}.pp-scenario h3{margin:0 0 5px;font-size:11pt;color:#c8102e}.pp-line{border-bottom:1px solid #999;min-height:26px;margin:5px 0}.pp-sign{min-height:55px;border-bottom:1px solid #888;margin:10px 0}.pp-small{font-size:8pt;color:#555}.pp-footer{font-size:8pt;border-top:1px solid #999;margin-top:18px;padding-top:5px}table{width:100%;border-collapse:collapse;font-size:8pt}th,td{border:1px solid #aaa;padding:5px;text-align:left;vertical-align:top}th{background:#f1efec}tr{break-inside:avoid}@media print{.printbar,.report-print-toolbar{display:none!important}}</style>`;
  const header=`<div class="pp-header"><div class="pp-brand">PIGGLY WIGGLY ALABAMA DISTRIBUTING COMPANY · SECURITY</div><h1>Promotion Assessment & Approval</h1><div class="pp-meta">${esc(p.tier?.replace('-', ' → ')||'')} · Packet ${esc(p.id)} · Template revision ${esc(p.templateRevision||1)}</div></div><div class="pp-grid"><div class="pp-field"><b>Candidate</b><br>${esc(p.employee?.name||'')}</div><div class="pp-field"><b>Employee ID</b><br>${esc(p.employee?.eid||'')}</div><div class="pp-field"><b>Current rank / shift</b><br>${esc(p.employee?.rank||'')} · ${esc(p.employee?.shift||'')}</div><div class="pp-field"><b>Issued / assessment date</b><br>${esc(promotionLocalDate(p.issuedAt))} / __________________</div><div class="pp-field"><b>Evaluator / supervisor</b><br>______________________________</div><div class="pp-field"><b>Security Manager</b><br>______________________________</div></div><div class="pp-note"><b>Evaluator instructions:</b> Verify the signed source records and assess live observed performance. Ask all six scenarios aloud; the candidate answers verbally. Grade each response and record the key points, gaps, and follow-up. Scenarios may supplement an incident example but do not replace required live post observations or signed qualifications. The Security Manager reviews this completed packet for final approval.</div>`;
  const evidence=`<h2 class="pp-subheading">Qualification records at issue</h2><table><thead><tr><th>Assigned requirement</th><th>Snapshot</th><th>Signed date</th><th>Current signed record verified</th></tr></thead><tbody>${(p.trainingEvidence||[]).map(x=>`<tr><td>${esc(x.requirement||'')}</td><td>${x.signoffId?'Signoff recorded':'No signoff in snapshot'}</td><td>${esc(x.signoffDate||'')}</td><td>□ Yes &nbsp; □ Gap</td></tr>`).join('')||'<tr><td colspan="4">No Training assignments found at issue. Check the required signed records directly.</td></tr>'}</tbody></table><p class="pp-small">This is an issue-time snapshot, not proof of current qualification. Verify the applicable OJT/PMC originals, evaluation dates, attendance and review-window records, and any corrective action before approval.</p><div class="pp-grid"><div class="pp-field"><b>Personnel / training file reference</b><br>&nbsp;</div><div class="pp-field"><b>Review-window dates</b><br>&nbsp;</div></div>`;
  const groups=[];for(const item of p.checklist||[]){let group=groups.at(-1);const name=item.section||'Competency review';if(!group||group.name!==name){group={name,items:[]};groups.push(group)}group.items.push(item)}
  const checklist=`<div class="pp-section"><h2 class="pp-heading">Competency & eligibility checklist</h2><p>Grade each standard using live evidence and the signed record. Mark gaps even when recommending promotion. Record the evidence source/date or the required recheck.</p>${groups.map(g=>`<h3 class="pp-subheading">${esc(g.name)}</h3>${g.items.map(x=>`<div class="pp-check"><div class="pp-check-title">□ ${esc(x.text||'')}</div><div class="pp-eval">□ Meets / verified &nbsp; □ Needs development / missing &nbsp; □ Not observed &nbsp; Evidence / date: __________________________________</div></div>`).join('')}`).join('')}<div class="pp-sign">Checklist gaps, recheck dates, and source records:</div></div>`;
  const scenarios=`<div class="pp-section"><h2 class="pp-heading">Six verbal scenarios · evaluator record</h2><div class="pp-note"><b>Scoring guide:</b> 3 = meets standard with sound priorities and role limits; 2 = partially meets with a documented gap; 1 = does not meet a critical standard; 0 = no answer. Ask follow-up questions as needed. Record what the candidate actually said. The total informs judgment; it is not an automatic promotion cutoff.</div>${p.scenarios.map((x,i)=>`<div class="pp-scenario"><h3>Scenario ${i+1} of 6 · ${esc(x.id||'')}</h3><div>${esc(x.prompt||'')}</div><div class="pp-eval"><b>Evaluator grade:</b> □ 3 Meets &nbsp; □ 2 Partial &nbsp; □ 1 Does not meet &nbsp; □ 0 No answer &nbsp; Initials: ______ Date: ______</div><div class="pp-small">Key verbal answer / follow-up / policy gap:</div><div class="pp-line"></div><div class="pp-line"></div><div class="pp-small">Required coaching or recheck: __________________________________________________________________________</div></div>`).join('')}</div>`;
  const supervisor=`<div class="pp-section"><h2 class="pp-heading">Evaluator summary & supervisor recommendation</h2><div class="pp-grid"><div class="pp-field"><b>Verbal grades 1–3</b><br>_____ / _____ / _____</div><div class="pp-field"><b>Verbal grades 4–6</b><br>_____ / _____ / _____</div><div class="pp-field"><b>Total of 18 (decision aid only)</b><br>________</div><div class="pp-field"><b>Observed work / file reviewed on</b><br>________</div></div><div class="pp-sign">Specific strengths and observed evidence:</div><div class="pp-sign">Development needs, missing documentation, and required recheck:</div><div>□ Recommend promotion &nbsp; □ Return for development &nbsp; Recheck date: ______________</div><p class="pp-small">A recommendation may include a Needs Development item when the gap and follow-up are documented. Final approval rests with the Security Manager.</p><div class="pp-grid"><div class="pp-field">Evaluator signature: __________________________ Date: __________</div><div class="pp-field">Supervisor signature: _________________________ Date: __________</div><div class="pp-field">Candidate acknowledgment (receipt only): __________________</div><div class="pp-field">Date: __________</div></div></div>`;
  const interview=p.tier==='T3-T4'?`<div class="pp-section"><h2 class="pp-heading">Security Manager interview · required for T4</h2><p>Interview the candidate live before final approval. Discuss actual examples and follow-up questions; record the basis for your assessment.</p>${['Leadership judgment and a decision you would handle differently','Concurrent incident priorities, life safety, and Supervisor/incident-command handoff','Fair FTO evaluation, withholding a signoff, and mentoring a struggling Trainee','Lead authority, formal Acting Supervisor activation, and decisions requiring Manager direction'].map((x,i)=>`<div class="pp-scenario"><b>${i+1}. ${esc(x)}</b><div class="pp-small">Candidate example, Manager follow-up, and assessment:</div><div class="pp-line"></div><div class="pp-line"></div></div>`).join('')}<div>Interview outcome: □ Meets standard &nbsp; □ Needs development &nbsp; Date: __________</div><div class="pp-sign">Manager summary / development action:</div><div class="pp-grid"><div class="pp-field">Security Manager signature: __________________________</div><div class="pp-field">Date: __________</div></div></div>`:'';
  const decision=`<div class="pp-section"><h2 class="pp-heading">Security Manager final decision</h2><div>□ Signed qualifications and eligibility verified &nbsp; □ Full checklist and evidence reviewed &nbsp; □ Six verbal grades reviewed</div>${p.tier==='T3-T4'?'<p>□ Required Security Manager interview completed and rated Meets standard for T4 approval.</p>':''}<p><b>Decision:</b> □ Approve promotion &nbsp; □ Defer &nbsp; □ Decline</p><div class="pp-sign">Approval basis, gaps, conditions, or HR follow-up:</div><div class="pp-grid"><div class="pp-field">Security Manager signature: __________________________</div><div class="pp-field">Decision date: __________</div><div class="pp-field">Controlled paper / scan reference: _______________________</div><div class="pp-field">Effective date, if separately processed: __________</div></div><p class="pp-small">This signed packet is the Security Manager's promotion approval record. Process roster, compensation, and HR changes separately under applicable policy.</p><div class="pp-footer">PWADC Security · Packet ${esc(p.id)} · v5.0.1 · Retain the signed original or controlled scan as confidential personnel material.</div></div>`;
  openReportWindow(style+header+evidence+checklist+scenarios+supervisor+interview+decision,false,'portrait');
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
