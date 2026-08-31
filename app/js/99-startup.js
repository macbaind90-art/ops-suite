/* PWADC Security Operations Suite v3.4.1.1 | startup gate + Task Tracker print extension */
const taskPrintColumnNames=['Project','Status','Priority','Category','Assigned To','Due','Follow-up','Blocked By','Next Action','Last Update'];

function taskPrintFilterSummary(){
  const bits=[taskStatusFilter==='all'?'Status: Open':`Status: ${taskStatusFilter}`];
  if(taskPriorityFilter!=='all')bits.push(`Priority: ${taskPriorityFilter}`);
  if(taskCategoryFilter!=='all')bits.push(`Category: ${taskCategoryFilter}`);
  const q=String(taskSearch||'').trim();
  if(q)bits.push(`Search: "${q}"`);
  return bits.join(' · ');
}
function taskPrintSort(list){
  const p={Critical:0,High:1,Normal:2,Low:3};
  const s={Blocked:0,Waiting:1,'In Progress':2,'Not Started':3,Completed:4,Archived:5};
  return [...list].sort((a,b)=>(p[a.priority]??2)-(p[b.priority]??2)||(s[a.status]??3)-(s[b.status]??3)||String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))||String(a.project||'').localeCompare(String(b.project||'')));
}
function openTaskPrintModal(){
  const cols=taskPrintColumnNames;
  showModal(`<div class="modal-head"><div><div class="modal-title">Print Task Tracker</div><div class="mini-note">Choose the task scope and exactly which Task Tracker columns to include.</div></div><button onclick="closeModal()">Close</button></div><div class="notice">Current filtered view preserves the Task Tracker search, status, priority, and category filters. All task records prints the full tracker, including completed and archived records.</div><div class="form-grid"><div class="full"><label>Rows to Print</label><select id="tpScope"><option value="filtered">Current filtered view</option><option value="all">All task records</option></select></div><div class="full"><label>Columns</label><div class="day-grid">${cols.map(c=>`<label class="day-check"><input type="checkbox" class="tpCol" value="${esc(c)}" checked> ${esc(c)}</label>`).join('')}</div></div></div><div class="modal-actions"><button onclick="setTaskPrintCols('basic')">Basic</button><button onclick="setTaskPrintCols('all')">All Columns</button><button onclick="setTaskPrintCols('none')">Clear</button><button onclick="closeModal()">Cancel</button><button class="primary" onclick="printTaskTrackerCustom()">Print</button></div>`);
}
function setTaskPrintCols(mode){
  const basic=new Set(['Project','Status','Priority','Category','Assigned To','Due','Next Action','Last Update']);
  document.querySelectorAll('.tpCol').forEach(x=>x.checked=mode==='all'||(mode==='basic'&&basic.has(x.value)));
}
function taskPrintCell(t,c){
  return ({Project:t.project,Status:t.status,Priority:t.priority,Category:t.category,'Assigned To':t.assignedTo||t.owner,Due:taskDateShort(t.dueDate),'Follow-up':taskDateShort(t.followUpDate),'Blocked By':t.blockedBy,'Next Action':t.nextAction,'Last Update':t.lastUpdate||t.update}[c]||'');
}
function printTaskTrackerCustom(){
  const scope=val('tpScope')||'filtered';
  const cols=[...document.querySelectorAll('.tpCol:checked')].map(x=>x.value);
  if(!cols.length){toast('Choose at least one Task Tracker column');return;}
  const list=scope==='all'?taskPrintSort(tasks.tasks||[]):filteredTasks();
  const scopeLabel=scope==='all'?'All task records':'Current filtered view';
  const filterDetail=scope==='all'?'':taskPrintFilterSummary();
  const body=`<div class="print-header"><div><div class="print-brand">PWADC Security Operations Suite</div><h1>PWADC Security Task Tracker</h1><div class="print-note">${esc(scopeLabel)} · ${list.length} task(s)${filterDetail?` · ${esc(filterDetail)}`:''}</div></div><div class="print-meta">Generated ${esc(new Date().toLocaleString())}<br>Version v3.4.1.1</div></div><table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${list.map(t=>`<tr>${cols.map(c=>`<td>${esc(taskPrintCell(t,c))}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${cols.length}">No task records match the selected scope.</td></tr>`}</tbody></table>`;
  closeModal();
  printHtmlDirect('PWADC Security Task Tracker',body,cols.length>6?'landscape':'portrait');
}

if(typeof renderTasks==='function'){
  const renderTasksV3411Base=renderTasks;
  renderTasks=function(){
    const html=renderTasksV3411Base();
    const anchor='<button onclick="exportTasksCSV()">Export CSV</button>';
    const printButton='<button onclick="openTaskPrintModal()">Print Tasks</button>';
    return html.includes(anchor)?html.replace(anchor,printButton+anchor):html;
  };
}

(function(){
  const expected=['bootstrap','data-core','shell-audits','reports-governance','workflows-home','roster-schedule','training-uniforms','attendance','shift-operations','tasks-settings'];
  const result=PWADCModuleRegistry.validate(expected);
  if(!result.ok){
    const detail='Missing front-end module(s): '+result.missing.join(', ');
    console.error(detail,result);
    if(typeof showStartupError==='function') showStartupError(new Error(detail),'Module load validation failed');
    return;
  }
  init();
})();
