/* Recruitment domain and interface. No dependencies or network requests. */
const SAVE_KEY = 'kingdom-hr-recruitment-v1';
const freshState = () => {
  const vacancies=[0,2].map((role,slot)=>({
    id:`v-1-${slot}`,slot,role,requirements:[...ROLES[role].defaults],day:1,closed:false
  }));
  const applications=vacancies.flatMap(vacancy=>CANDIDATES
    .filter(candidate=>eligible(candidate,vacancy))
    .slice(0,2)
    .map(candidate=>({id:`a-1-${candidate.id}`,candidate:candidate.id,vacancy:vacancy.id,day:1,status:'pending',read:false})));
  return {version:1,day:1,vacancies,applications,messages:[]};
};
let state;
try { state = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (_) { /* Recover below. */ }
if (!state || state.version !== 1 || !Array.isArray(state.vacancies) || !Array.isArray(state.applications)) state = freshState();
let undoState = null;
let decisionSequence = 0;
let currentApplication = null;
let focusReturn = null;
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// One shared icon style: no emoji glyphs or font-dependent alignment.
function buttonIcon(name) {
  const paths={
    left:'<path d="M14 5l-7 7 7 7"/>',
    right:'<path d="M10 5l7 7-7 7"/>',
    close:'<path d="M6 6l12 12M18 6L6 18"/>',
    instructions:'<path d="M5 3h11l3 3v15H5zM15 3v5h4M8 11h8M8 15h8M8 18h5"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 6l9 7 9-7"/>',
    archive:'<path d="M4 8h16v13H4zM3 3h18v5H3zM9 12h6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M10 3h4l1 3 3 1 3 3v4l-3 1-1 3-3 3h-4l-1-3-3-1-3-3v-4l3-1 1-3z"/>',
    check:'<path d="M5 12l4 4 10-10"/>'
  };
  return `<svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||''}</svg>`;
}
const candidateFor = app => CANDIDATES[app.candidate];
const roleFor = vacancy => ROLES[vacancy.role];
function save() {
  try { localStorage.setItem(SAVE_KEY,JSON.stringify(state)); }
  catch (_) { toast('Progress cannot be saved in this browser. Keep this tab open.'); }
}
function pending(vacancy) { return state.applications.filter(a=>a.vacancy===vacancy.id && a.status==='pending').sort((a,b)=>b.day-a.day || b.candidate-a.candidate); }
function eligible(candidate,vacancy) { return candidate.role===vacancy.role && candidate.stats.every((value,i)=>value>=vacancy.requirements[i]); }
function active() { return state.vacancies.filter(v=>!v.closed); }
function openModal(html) {
  hideCardSkillTooltip();
  focusReturn = document.activeElement;
  $('modal').innerHTML = html;
  $('modal').classList.toggle('cv-mode', html.includes('cv-wrap'));
  $('game-stage')?.classList.toggle('cv-preview', html.includes('cv-wrap'));
  document.body.classList.add('document-open');
  $('modal').hidden = false;
  $('modal').setAttribute('role','dialog');
  $('modal').setAttribute('aria-modal','true');
  $('modal').setAttribute('aria-label','Recruitment document');
  document.body.style.overflow='hidden';
  $('modal').querySelector('button,input,select')?.focus();
}
function closeModal() {
  $('modal').hidden=true;
  $('game-stage')?.classList.remove('cv-preview');
  document.body.classList.remove('document-open');
  document.body.style.overflow='';
  currentApplication=null;
  focusReturn?.focus();
}
function panel(title,content) {
  openModal(`<div class="panel"><header><h3>${title}</h3><button onclick="closeModal()" aria-label="Close">${buttonIcon('close')}</button></header>${content}</div>`);
}
function toast(message,undo=false) {
  $('toast').innerHTML=escapeHTML(message)+(undo?'<button onclick="undoDecision()">Undo</button>':'');
  $('toast').hidden=false;
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>$('toast').hidden=true,undo?10000:4500);
}
// A stage-level tooltip cannot be clipped by the card's content container.
let cardTooltipFrame=null;
function hideCardSkillTooltip() {
  $('card-skill-tooltip').hidden=true;
  if(cardTooltipFrame!==null){cancelAnimationFrame(cardTooltipFrame);cardTooltipFrame=null;}
}
function showCardSkillTooltip(event,candidateId) {
  hideCardSkillTooltip();
  const source=event.currentTarget;
  const anchor=source.querySelector('.skill-badge')||source;
  const tooltip=$('card-skill-tooltip');
  tooltip.textContent=CANDIDATES[candidateId].perk[1];
  tooltip.hidden=false;
  function positionTooltip() {
    if(tooltip.hidden||!anchor.isConnected)return;
    const stage=$('game-stage');
    const frame=stage.getBoundingClientRect();
    const bounds=anchor.getBoundingClientRect();
    const scale=frame.width/stage.offsetWidth;
    const width=tooltip.offsetWidth;
    const height=tooltip.offsetHeight;
    const left=(bounds.left+bounds.width/2-frame.left)/scale-width/2;
    const below=(bounds.bottom-frame.top)/scale+10;
    const top=below+height>stage.offsetHeight-12
      ? (bounds.top-frame.top)/scale-height-10 : below;
    tooltip.style.left=`${Math.max(12,Math.min(left,stage.offsetWidth-width-12))}px`;
    tooltip.style.top=`${Math.max(12,top)}px`;
    cardTooltipFrame=requestAnimationFrame(positionTooltip);
  }
  positionTooltip();
}

function totalExperienceYears(candidate) {
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthIndex=date=>{
    const [month,year]=date.split(' ');
    return Number(year)*12+months.indexOf(month);
  };
  // Count worked months, excluding gaps and counting overlapping roles once.
  const intervals=candidate.experience.map(job=>[monthIndex(job.startDate),monthIndex(job.endDate)+1]).sort((a,b)=>a[0]-b[0]);
  let total=0,end=-Infinity;
  for(const [start,finish] of intervals){
    total+=Math.max(0,finish-Math.max(start,end));
    end=Math.max(end,finish);
  }
  return Math.floor(total/12);
}

function render() {
  hideCardSkillTooltip();
  $('day').textContent=`Day ${String(state.day).padStart(2,'0')}`;
  $('next').innerHTML='End day'+buttonIcon('right');
  $('next').disabled=state.day>=8;
  $('invited').disabled=!state.applications.some(a=>a.status==='invited');
  $('invited').innerHTML=buttonIcon('mail')+`Invited · ${state.applications.filter(a=>a.status==='invited').length}`;
  $('capacity').textContent=`${active().length} / 6 searches published`;
  $('notice').textContent=state.messages.length?state.messages.join(' '):active().some(v=>pending(v).length)?'Applications are waiting on your desk. Open a résumé to review a candidate.':active().length?'Searches are published. Advance the day to receive correspondence.':'Your desk is clear. Open a vacancy to begin receiving applications.';
  $('desk').innerHTML=Array.from({length:6},(_,slot)=>{
    const v=active().find(v=>v.slot===slot);
    if(!v)return `<div class="slot"><button class="empty" onclick="vacancyForm(${slot})"><span class="plus">＋</span><span>Publish a vacancy</span><span>OPEN SEARCH ${String(slot+1).padStart(2,'0')}</span></button></div>`;
    const apps=pending(v), unread=apps.filter(a=>!a.read).length;
    const top=apps[0];
    const c=top?candidateFor(top):null;
    const experienceYears=c?totalExperienceYears(c):0;
    return `<div class="slot occupied">
      <button ${top?`aria-describedby="card-skill-tooltip" onfocus="showCardSkillTooltip(event,${c.id})" onblur="hideCardSkillTooltip()"`:''} class="paper ${top?'application-paper':'vacancy-paper'} ${apps.length>1?'stacked':''}" onclick="${top?`viewCV('${top.id}')`:`viewSearch('${v.id}')`}" aria-label="${top?`Read ${c.name}'s application for ${roleFor(v).name}`:`View ${roleFor(v).name} vacancy`}">
        ${top?`<span class="wax-seal" title="${apps.length} pending applications"><span class="circle-value">${apps.length}</span></span><div class="mini-cv">${portrait(c)}<div><h3>${c.name}</h3><p class="card-experience">${experienceYears} ${experienceYears===1?'year':'years'} of experience</p><hr><div class="card-skill-badges"><span class="card-skill-item"><span class="skill-badge" aria-describedby="card-skill-tooltip" onpointerenter="showCardSkillTooltip(event,${c.id})" onpointerleave="hideCardSkillTooltip()">${escapeHTML(c.perk[0])}</span></span></div><p>${v.requirements.map((n,i)=>n>1?`${ATTRIBUTES[i].slice(0,3).toUpperCase()} ${c.stats[i]}`:'').filter(Boolean).join(' · ')}</p></div></div>`:`<small>— ROYAL VACANCY —</small>${areaSummary(roleFor(v),`desk-${v.id}`)}<div class="vacancy-minimums">${v.requirements.map((n,i)=>n>1?`<span>${ATTRIBUTES[i]} ${n}+</span>`:'').join('')||'All applicants considered'}</div><p class="awaiting">Awaiting applications</p>`}
      </button>
      <button class="brass-label" onclick="viewSearch('${v.id}')">${roleFor(v).name}</button>
      <div class="slot-bottom"><span>${unread?`${unread} unread · `:''}Published day ${v.day}</span><button onclick="closeSearch('${v.id}')">Close search</button></div>
    </div>`;
  }).join('');
}
function defaultVacancyRole() {
  const occupied=new Set(active().map(v=>v.role));
  const available=ROLES.findIndex((_,i)=>!occupied.has(i));
  return available<0?0:available;
}
function vacancyForm(slot) {
  let selectedRole=defaultVacancyRole();
  const publishedCount=role=>active().filter(v=>v.role===role).length;
  panel('Publish an opening',`<p>Choose an office and the minimum attributes. Higher requirements narrow the applicant pool.</p><form id="vacancy-form"><fieldset class="job-picker"><legend>Position</legend><div class="job-badges">${ROLES.map((r,i)=>`<button type="button" class="job-badge" data-job="${i}" aria-pressed="${i===selectedRole}"><span>${r.name}</span><small>${publishedCount(i)?`${publishedCount(i)} active search${publishedCount(i)>1?'es':''}`:'No active search'}</small></button>`).join('')}</div></fieldset><div id="role-context" class="role-context"></div><div class="requirements">${ATTRIBUTES.map((a,i)=>`<div><label for="stat-${i}">${a}</label><input type="number" id="stat-${i}" min="1" max="20" required></div>`).join('')}</div><p id="pool" class="pool-note" role="status"></p><div class="actions"><button type="submit" class="gold">Publish vacancy</button><button type="button" onclick="closeModal()">Cancel</button></div></form>`);
  function updatePool() {
    const requirements=ATTRIBUTES.map((_,i)=>Number($(`stat-${i}`).value));
    const count=CANDIDATES.filter(c=>eligible(c,{role:selectedRole,requirements})&&!state.applications.some(a=>a.candidate===c.id)).length;
    $('pool').textContent=count===0?'No remaining candidates in this exercise meet these requirements.':count===1?'Very restrictive · few applicants expected.':count===2?'Selective · applications may take time.':'Broad search · a wider range of applicants.';
  }
  function changeRole(role) {
    selectedRole=role;
    const r=ROLES[role];
    $('role-context').innerHTML=areaSummary(r);
    r.defaults.forEach((n,i)=>{ const input=$(`stat-${i}`); input.value=n; input.parentElement.hidden=n===1; });
    $('vacancy-form').querySelectorAll('[data-job]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.job)===role)));
    updatePool();
  }
  $('vacancy-form').querySelectorAll('[data-job]').forEach(button=>{
    button.onclick=()=>changeRole(Number(button.dataset.job));
  });
  $('vacancy-form').oninput=updatePool;
  $('vacancy-form').onsubmit=event=>{
    event.preventDefault();
    if(active().length>=6 || active().some(v=>v.slot===slot))return;
    state.vacancies.push({id:`v-${state.day}-${state.vacancies.length}`,slot,role:selectedRole,requirements:ATTRIBUTES.map((_,i)=>Number($(`stat-${i}`).value)),day:state.day,closed:false});
    save();closeModal();render();toast('Vacancy published. Applications may arrive on subsequent days.');
  };
  changeRole(selectedRole);
}

function closeSearch(id) {
  panel('Close this search?',`<p>New applications will stop. Invited candidates remain available from Invited. The desk slot becomes available.</p><div class="actions"><button class="gold" id="confirm-close">Close search</button><button onclick="closeModal()">Keep open</button></div>`);
  $('confirm-close').onclick=()=>{state.vacancies.find(v=>v.id===id).closed=true;save();closeModal();render();};
}
function areaSummary(role,scope='viewer') {
  const findings=role.report||[];
  const group=(status,title)=>{
    const conditions=findings.filter(condition=>condition.status===status);
    const content=conditions.length
      ? `<div class="condition-badges">${conditions.map(condition=>{
          const index=findings.indexOf(condition);
          const tooltipId=`condition-${scope}-${ROLES.indexOf(role)}-${index}`;
          const tone=status==='good'?'good':'concern';
          return `<div class="condition-item">
            <span class="skill-badge condition-badge ${tone}" ${scope.startsWith('desk-')?'':'tabindex="0"'} aria-describedby="${tooltipId}">${escapeHTML(condition.label)}</span>
            <div class="condition-tooltip" id="${tooltipId}" role="tooltip">
              <p>${escapeHTML(condition.description)}</p>
              <strong>Effects</strong>
              <ul>${condition.effects.map(effect=>`<li>${escapeHTML(effect)}</li>`).join('')}</ul>
            </div>
          </div>`;
        }).join('')}</div>`
      : '<p class="area-neutral">None</p>';
    return `<div class="condition-group ${status}"><h4>${title}</h4>${content}</div>`;
  };
  return `<section class="area-summary" aria-label="${escapeHTML(role.area)} summary">${group('good','Strengths')}${group('concern','Problems')}</section>`;
}

function vacancySidebar(v, application=null) {
  const n=application?cvNeighbours(application.id):{apps:[],index:-1};
  const previous=application?cvNavigationTarget(application.id,-1):null;
  const next=application?cvNavigationTarget(application.id,1):null;
  const status=application?.status||'pending';
  const previousVacancy=vacancyNavigationTarget(v.id,-1,status);
  const nextVacancy=vacancyNavigationTarget(v.id,1,status);
  const vacancyButton=(target,direction)=>`<button class="vacancy-arrow" onclick="changeVacancy('${v.id}',${direction},'${status}')" ${target?'':'disabled'} aria-label="${direction>0?'Next':'Previous'} vacancy${target?`: ${roleFor(target).name}`:''}" title="${target?roleFor(target).name:status==='invited'?'No more vacancies with invited candidates':'No more vacancies with candidates'}">${buttonIcon(direction>0?'right':'left')}</button>`;
  const navButton=(target,direction)=>`<button class="cv-arrow" onclick="changeCV(${direction})" ${target?'':'disabled'} aria-label="${direction>0?'Next':'Previous'} CV">${buttonIcon(direction>0?'right':'left')}</button>`;
  return `<aside class="vacancy-reference"><small>${status==='invited'?'INVITED TO INTERVIEW':'ROYAL APPOINTMENT'}</small><div class="vacancy-heading">${vacancyButton(previousVacancy,-1)}<h3>${roleFor(v).name}</h3>${vacancyButton(nextVacancy,1)}</div>${areaSummary(roleFor(v))}<section class="vacancy-requirements"><h4>Requirements</h4><div class="required-stats">${v.requirements.map((value,i)=>value>1?`<span>${ATTRIBUTES[i]} <b>${value}+</b></span>`:'').join('')||'<span>None</span>'}</div></section><div class="cv-counter-nav">${navButton(previous,-1)}<p class="cv-position" aria-live="polite">${application?`CV ${n.index+1} of ${n.apps.length}`:'No pending applications'}</p>${navButton(next,1)}</div><div class="cv-actions">${application?.status==='pending'?`<button onclick="decide('${application.id}','invited')" class="gold">Invite to interview</button><button class="reject" onclick="decide('${application.id}','rejected')">Reject &amp; burn</button>`:''}</div></aside>`;
}
function viewSearch(id) {
  const v=state.vacancies.find(v=>v.id===id), apps=pending(v);
  changingCV=false;
  if(apps.length){viewCV(apps[0].id);return;}
  currentApplication=null;
  openModal(`${vacancySidebar(v)}<div class="cv-wrap"><button class="close-cv" onclick="closeModal()" aria-label="Close CV">${buttonIcon('close')}</button><article class="cv empty-search"><div class="cv-content"><p class="cv-note">ROYAL VACANCY</p><div class="empty-search-message"><h3>No pending applications.</h3><p>${v.closed?'This search is closed.':'You have reviewed the available correspondence, or no applications have arrived yet. Advance the day at the desk to receive new correspondence.'}</p></div></div></article></div>`);
}

function cvNeighbours(id) {
  const current=state.applications.find(a=>a.id===id);
  if(!current)return {apps:[],index:-1};
  const apps=state.applications.filter(a=>a.vacancy===current.vacancy && a.status===current.status).sort((a,b)=>b.day-a.day || b.candidate-a.candidate);
  return {apps,index:apps.findIndex(a=>a.id===id)};
}
function cvNavigationTarget(id,direction) {
  const {apps,index}=cvNeighbours(id);
  return apps[index+direction]||null;
}
function vacancyNavigationTarget(id,direction,status='pending') {
  // Invited candidates remain available even when their original search is closed.
  const searches=state.vacancies
    .filter(v=>(status!=='pending'||!v.closed)&&state.applications.some(a=>a.vacancy===v.id&&a.status===status))
    .sort((a,b)=>a.slot-b.slot||(a.day||0)-(b.day||0));
  const index=searches.findIndex(v=>v.id===id);
  if(index>=0)return searches[index+direction]||null;
  const current=state.vacancies.find(v=>v.id===id);
  if(!current)return null;
  return direction>0?searches.find(v=>v.slot>current.slot)||null:[...searches].reverse().find(v=>v.slot<current.slot)||null;
}
// A continuous review queue: newest-first within a search, then the next
// occupied search in desk order. Empty searches and resolved CVs are skipped.
function navigationTarget(id,direction) {
  const current=state.applications.find(a=>a.id===id);
  if(!current)return null;
  const {apps,index}=cvNeighbours(id);
  if(apps[index+direction])return apps[index+direction];
  if(current.status!=='pending')return null;
  const searches=active().filter(v=>pending(v).length).sort((a,b)=>a.slot-b.slot);
  const searchIndex=searches.findIndex(v=>v.id===current.vacancy);
  if(searchIndex<0)return null;
  const search=searches[searchIndex+direction];
  if(!search)return null;
  const candidates=pending(search);
  return direction>0?candidates[0]:candidates.at(-1);
}
let changingCV=false;
function changeCV(direction) {
  if(!currentApplication)return;
  transitionToCV(cvNavigationTarget(currentApplication,direction),direction,false);
}
function changeVacancy(vacancyId,direction,status='pending') {
  const vacancy=vacancyNavigationTarget(vacancyId,direction,status);
  if(!vacancy)return;
  const target=state.applications.filter(a=>a.vacancy===vacancy.id&&a.status===status).sort((a,b)=>b.day-a.day||b.candidate-a.candidate)[0];
  transitionToCV(target,direction,true);
}
function transitionToCV(target,direction,differentVacancy) {
  if(changingCV||!target)return;
  changingCV=true;
  const sourceId=currentApplication;
  const sheet=$('modal').querySelector('.cv-wrap');
  sheet.classList.add(differentVacancy?(direction>0?'vacancy-out-next':'vacancy-out-previous'):(direction>0?'paper-out-right':'paper-out-left'));
  setTimeout(()=>{
    if($('modal').hidden || currentApplication!==sourceId){changingCV=false;return;}
    viewCV(target.id);
    $('cv').closest('.cv-wrap').classList.add(differentVacancy?(direction>0?'vacancy-in-next':'vacancy-in-previous'):(direction>0?'paper-in-left':'paper-in-right'));
    if(differentVacancy)$('modal').querySelector('.vacancy-reference')?.classList.add('vacancy-label-in');
    changingCV=false;
  },matchMedia('(prefers-reduced-motion: reduce)').matches?0:260);
}

function advanceDay() {
  if(state.day>=8)return;
  undoState=null;$('toast').hidden=true;state.day++;
  let arrived=0, left=0;
  state.applications.forEach(a=>{if(a.status==='pending' && state.day-a.day>candidateFor(a).patience){a.status='withdrawn';left++;}});
  // Round-robin openings keep total volume bounded while eligibility and dates remain strict.
  const openings=active();
  if(openings.length){
    const offset=(state.day-2)%openings.length;
    for(let step=0;step<openings.length && arrived<3;step++){
      const v=openings[(offset+step)%openings.length];
      if(v.day>=state.day || (state.day+v.slot)%4===0)continue;
      const pool=CANDIDATES.filter(c=>eligible(c,v)&&!state.applications.some(a=>a.candidate===c.id));
      if(pool.length){const c=pool[0];state.applications.push({id:`a-${c.id}`,candidate:c.id,vacancy:v.id,day:state.day,status:'pending',read:false});arrived++;}
    }
  }
  state.messages=[arrived?`${arrived} new ${arrived===1?'application has':'applications have'} arrived.`:'No new applications today.'];
  if(left)state.messages.push(`${left} ${left===1?'candidate has':'candidates have'} withdrawn after waiting.`);
  if(!active().length)state.messages.push('Publish an opening to receive applications.');
  save();render();
}
function portrait(c) {
  const col=c.id%6, row=Math.floor(c.id/6);
  return `<span class="portrait painted-portrait" role="img" aria-label="Portrait of ${c.name}" style="background-position:${col*20}% ${row*100/3}%"></span>`;
}

function chart(c,requirements=[]) {
  const point=(i,r)=>[100+Math.sin(i*Math.PI/3)*r,95-Math.cos(i*Math.PI/3)*r];
  const polygon=values=>values.map((n,i)=>point(i,n/20*68).join(',')).join(' ');
  // Use 3 as the visual baseline for unadvertised attributes, without changing eligibility.
  const minimums=ATTRIBUTES.map((_,i)=>requirements[i]>1?requirements[i]:3);
  const requiredText=ATTRIBUTES.map((name,i)=>requirements[i]>1?`${name} ${requirements[i]}`:'').filter(Boolean).join(', ')||'None';
  return `<svg width="210" height="232" viewBox="0 0 200 227" role="img" aria-label="Candidate attributes in solid green and job minimums in dashed copper, fixed scale 0 to 20. Required: ${requiredText}. Unrequired attributes use a visual baseline of 3.">
    ${[17,34,51,68].map(r=>`<polygon points="${ATTRIBUTES.map((_,i)=>point(i,r).join(',')).join(' ')}" fill="none" stroke="#a99a7c66"/>`).join('')}
    ${ATTRIBUTES.map((a,i)=>{const axis=point(i,68),label=point(i,83);return `<line x1="100" y1="95" x2="${axis[0]}" y2="${axis[1]}" stroke="#a99a7c66"/><text x="${label[0]}" y="${label[1]+3}" text-anchor="middle" font-size="9" fill="#6d654e">${a.slice(0,3).toUpperCase()}</text>`;}).join('')}
    <polygon points="${polygon(c.stats)}" fill="#61785c40" stroke="#496743" stroke-width="2"/>
    <polygon points="${polygon(minimums)}" fill="#b56b3620" stroke="#ad5b2f" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round"/>
    <g transform="translate(0 12)">
    <line x1="23" y1="188" x2="43" y2="188" stroke="#496743" stroke-width="2"/><text x="49" y="191" font-size="10" fill="#4e6041">Candidate</text>
    <line x1="23" y1="205" x2="43" y2="205" stroke="#ad5b2f" stroke-width="2" stroke-dasharray="4 3"/><text x="49" y="208" font-size="10" fill="#94502e">Job minimum</text>
    </g>
  </svg>`;
}

function stampPlacement(candidate) {
  // Stable variation: reopening a document must not move its existing stamp.
  let hash=2166136261;
  for(const character of candidate.name){
    hash=Math.imul(hash^character.codePointAt(0),16777619)>>>0;
  }
  return {angle:hash%25-12,dx:(hash>>>8)%13-6,dy:(hash>>>16)%11-5};
}
function stampStyle(candidate) {
  const {angle,dx,dy}=stampPlacement(candidate);
  return `--stamp-angle:${angle}deg;--stamp-dx:${dx}px;--stamp-dy:${dy}px`;
}
function filedInvitationStamp(candidate) {
  return `<div class="invitation-stamp is-filed" style="${stampStyle(candidate)}"><strong>INVITED</strong><span>FOR INTERVIEW</span></div>`;
}

function viewCV(id) {
  const a=state.applications.find(a=>a.id===id),c=candidateFor(a),v=state.vacancies.find(v=>v.id===a.vacancy);
  const neighbours=cvNeighbours(id);
  a.read=true;save();render();
  openModal(`${vacancySidebar(v,a)}<div class="cv-wrap"><button class="close-cv" onclick="closeModal()" aria-label="Close CV">${buttonIcon('close')}</button><article class="cv" id="cv"><div class="cv-content" tabindex="0" aria-label="Candidate CV content"><div class="cv-columns"><div class="cv-main-column"><section><h4>Experience</h4>${c.experience.map(job=>`<div class="experience"><div class="experience-heading"><strong>${escapeHTML(job.jobTitle)}</strong><span class="experience-dates">${job.startDate} – ${job.endDate}</span></div><p class="experience-employer">${escapeHTML(job.company)}, ${escapeHTML(job.location)}</p><p class="experience-description">${escapeHTML(job.description)}</p></div>`).join('')}</section><section><h4>Stats</h4><div class="stats">${chart(c,v.requirements)}<div class="numbers">${ATTRIBUTES.map((n,i)=>`<span>${n}<b>${c.stats[i]}</b></span>`).join('')}</div></div></section></div><aside class="cv-side-column"><div class="cv-head">${portrait(c)}<div><h3>${c.name}</h3><p class="cv-job-title">${roleFor(v).name}</p><p class="meta">${c.race} · ${c.age} years · ${c.location}</p><p class="meta">${a.status==='pending'?`Waiting ${state.day-a.day} days`:a.status==='withdrawn'?'Withdrawn · accepted other plans after waiting':a.status==='invited'?'Invited to interview': 'Application declined'}</p></div></div><section><h4>About Me</h4><p>${c.summary}</p></section><section><h4>Skills</h4><div class="skill-badges"><span class="skill-item"><span class="skill-badge" tabindex="0" aria-describedby="skill-tip-${c.id}">${escapeHTML(c.perk[0])}</span><span class="skill-tooltip" id="skill-tip-${c.id}" role="tooltip">${escapeHTML(c.perk[1])}</span></span></div></section>${a.status==='invited'?filedInvitationStamp(c):''}</aside></div></div></article></div>`);
  currentApplication=id;
}
function nextPendingAfterRejection(id) {
  // Determine the continuation before changing the current application's status.
  // At the queue's end, use a remaining previous CV instead of closing early.
  return navigationTarget(id,1)||navigationTarget(id,-1)||null;
}
async function animatePaperInvite(paper,candidate) {
  if(!paper || matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const wrap=paper.closest('.cv-wrap');
  const stamp=document.createElement('div');
  stamp.className='invitation-stamp';
  stamp.style.cssText=stampStyle(candidate);
  stamp.innerHTML='<strong>INVITED</strong><span>FOR INTERVIEW</span>';
  paper.querySelector('.cv-side-column').appendChild(stamp);
  const {angle,dx,dy}=stampPlacement(candidate);
  const pose=`translate(${dx}px,${dy}px) rotate(${angle}deg)`;
  await stamp.animate([
    {opacity:0,transform:`${pose} scale(2.2)`,filter:'blur(3px)',offset:0},
    {opacity:1,transform:`${pose} scale(.94)`,filter:'blur(0)',offset:.65},
    {opacity:1,transform:`${pose} scale(1)`,filter:'blur(0)',offset:1}
  ],{duration:450,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).finished.catch(()=>{});
  await new Promise(resolve=>setTimeout(resolve,450));
  await wrap.animate([
    {opacity:1,transform:'translate(0,0) rotate(0deg) scale(1)'},
    {opacity:1,transform:'translate(-25px,-12px) rotate(-2deg) scale(.98)',offset:.25},
    {opacity:0,transform:'translate(-330px,-95px) rotate(-9deg) scale(.78)'}
  ],{duration:500,easing:'cubic-bezier(.55,0,.8,.4)',fill:'forwards'}).finished.catch(()=>{});
}

function decide(id,status) {
  const a=state.applications.find(a=>a.id===id);
  if(!a||a.status!=='pending'||!['invited','rejected'].includes(status))return;
  const continuation=nextPendingAfterRejection(id);
  const sequence=++decisionSequence;
  undoState=JSON.stringify(state);
  a.status=status;save();render();
  const name=candidateFor(a).name;
  $('modal').querySelectorAll('button').forEach(b=>b.disabled=true);
  const animation=status==='rejected'?animatePaperBurn($('cv')):animatePaperInvite($('cv'),candidateFor(a));
  animation.then(()=>{
    // Undo or a newer decision must not be overwritten by an older animation.
    if(sequence!==decisionSequence)return;
    const stillReviewing=!$('modal').hidden && currentApplication===id;
    if(stillReviewing && continuation?.status==='pending'){
      const crossVacancy=continuation.vacancy!==a.vacancy;
      viewCV(continuation.id);
      $('cv').closest('.cv-wrap')?.classList.add(crossVacancy?'vacancy-in-next':'paper-in-left');
    } else if(stillReviewing){
      closeModal();
    }
    toast(status==='rejected'?`${name}'s application declined.`:`${name} invited. CV moved to the invited tray.`,true);
  });
}
function undoDecision() {
  if(!undoState)return;
  decisionSequence++;
  const restored=JSON.parse(undoState);
  const application=restored.applications.find(before=>{
    const after=state.applications.find(item=>item.id===before.id);
    return after && after.status!==before.status;
  });
  state=restored;
  undoState=null;
  changingCV=false;
  save();render();
  if(application){
    // Rebuild the document, clearing burned canvases, opacity and stale actions.
    viewCV(application.id);
    $('modal').querySelector('.cv-wrap')?.classList.add('cv-restored');
    toast(`${candidateFor(application).name}'s application restored. Awaiting your decision.`);
  } else {
    $('toast').hidden=true;
  }
}
function invitedTray() {
  const invited=state.applications.filter(a=>a.status==='invited').sort((a,b)=>b.day-a.day||b.candidate-a.candidate);
  if(!invited.length){toast('No invited candidates yet.');return;}
  const firstVacancy=state.vacancies
    .filter(v=>invited.some(a=>a.vacancy===v.id))
    .sort((a,b)=>a.slot-b.slot||(a.day||0)-(b.day||0))[0];
  changingCV=false;
  viewCV(invited.find(a=>a.vacancy===firstVacancy.id).id);
}
$('next').onclick=advanceDay;
$('invited').onclick=invitedTray;
$('settings').onclick=()=>{
  panel('Desk options',`<p>Your progress is saved in this browser after each decision. Motion follows your device’s reduced-motion setting.</p><button id="restart">Start a new exercise</button>`);
  $('restart').onclick=()=>{panel('Start again?',`<p>This replaces your current recruitment exercise with a fresh first day and candidates ready to review.</p><div class="actions"><button id="reset-confirm" class="gold">Start a new exercise</button><button onclick="closeModal()">Cancel</button></div>`);$('reset-confirm').onclick=()=>{state=freshState();undoState=null;save();closeModal();render();};};
};
document.addEventListener('keydown',event=>{
  if($('modal').hidden)return;
  if(event.key==='Escape'){closeModal();return;}
  if(currentApplication && !['INPUT','SELECT','TEXTAREA'].includes(event.target?.tagName)){
    if(event.key==='ArrowLeft'){event.preventDefault();changeCV(-1);return;}
    if(event.key==='ArrowRight'){event.preventDefault();changeCV(1);return;}
  }
  if(event.key==='Tab'){
    const elements=[...$('modal').querySelectorAll('button:not(:disabled),input:not([hidden]),select,[tabindex="0"]')];
    const first=elements[0],last=elements.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }
});
render();

// Letterbox a single logical canvas so the office and document views never change shape.
function fitGameStage() {
  const stage=$('game-stage');
  if(!stage)return;
  const scale=Math.min(window.innerWidth/1600,window.innerHeight/900);
  stage.style.transform=`translate(-50%, -50%) scale(${scale})`;
}
if(typeof window!=='undefined'){
  window.addEventListener('resize',fitGameStage);
  fitGameStage();
}

$('settings').innerHTML=buttonIcon('settings');
