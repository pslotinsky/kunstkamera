const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function run(code,savedState={version:1,day:1,vacancies:[],applications:[],messages:[]}){
 const nodes={};
 const element=()=>({textContent:'',innerHTML:'',hidden:true,style:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector(){return null},closest(){return null},querySelectorAll(){return[]},focus(){}});
 const sandbox={console,localStorage:{getItem(){return JSON.stringify(savedState)},setItem(){}},document:{getElementById(id){return nodes[id]??=element()},body:{style:{},classList:{add(){},remove(){}}},addEventListener(){},activeElement:element()},setTimeout(){},clearTimeout(){},matchMedia(){return{matches:true}}};
 vm.createContext(sandbox);
 return vm.runInContext(fs.readFileSync('dist/content.js','utf8')+'\n'+fs.readFileSync('dist/app.js','utf8')+'\n'+code,sandbox);
}
test('new exercises start with eligible unread candidates and keep future arrivals unique',()=>run(`
 if(state.day!==1||active().length!==2||state.applications.length!==4)throw Error('Starter desk');
 for(const a of state.applications){
   const vacancy=state.vacancies.find(v=>v.id===a.vacancy);
   if(a.day!==1||a.status!=='pending'||a.read||!eligible(candidateFor(a),vacancy))throw Error('Invalid starter application');
 }
 if(!$('notice').textContent.includes('Applications are waiting'))throw Error('Missing review prompt');
 for(let i=0;i<6;i++)advanceDay();
 if(state.applications.length<=4)throw Error('No later arrivals');
 if(new Set(state.applications.map(a=>a.candidate)).size!==state.applications.length)throw Error('Duplicate candidate');
`,null));
test('saved empty first day is preserved, eligible future arrivals, one application per person',()=>run(`
 if(state.day!==1||state.applications.length||active().length)throw Error('Initial state');
 state.vacancies.push({id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],day:1,closed:false});
 for(let i=0;i<6;i++)advanceDay();
 if(!state.applications.length)throw Error('No arrivals');
 if(new Set(state.applications.map(a=>a.candidate)).size!==state.applications.length)throw Error('Duplicate');
 for(const a of state.applications){if(a.day<=1||!eligible(candidateFor(a),state.vacancies[0]))throw Error('Invalid arrival');}
`));
test('closed search stops arrivals; impossible stats produce no candidates',()=>run(`
 state.vacancies.push({id:'v0',slot:0,role:0,requirements:[20,20,20,20,20,20],day:1,closed:false});
 advanceDay();if(state.applications.length)throw Error('Impossible candidate');
 state.vacancies[0].requirements=[1,1,1,1,1,1];state.vacancies[0].closed=true;
 advanceDay();if(state.applications.length)throw Error('Closed arrival');
`));
test('invite survives waiting and undo restores pending application',()=>run(`
 state.vacancies.push({id:'v0',slot:0,role:0,requirements:[1,1,1,1,1,1],day:1,closed:false});
 advanceDay();const a=state.applications[0];
 decide(a.id,'invited');undoDecision();if(state.applications[0].status!=='pending')throw Error('Undo');
 decide(a.id,'invited');for(let i=0;i<12;i++){advanceDay();}
 if(state.applications[0].status!=='invited')throw Error('Invitation expired');
`));
test('candidate roster and attribute records remain consistent',()=>run(`
 if(CANDIDATES.length!==24||CANDIDATES.filter(c=>c.race==='Human').length!==18)throw Error('Roster');
 for(const c of CANDIDATES)if(c.stats.length!==6||c.stats.some(n=>n<1||n>20))throw Error('Attributes');
`));
test('newest applications stay on top even after being read; navigation follows stack order',()=>run(`
 state.vacancies.push({id:'v0',slot:0,role:0,requirements:[1,1,1,1,1,1],day:1,closed:false});
 state.applications=[{id:'old',candidate:0,vacancy:'v0',day:2,status:'pending',read:false},{id:'new',candidate:1,vacancy:'v0',day:3,status:'pending',read:true}];
 if(pending(state.vacancies[0])[0].id!=='new')throw Error('Read flag changed ordering');
 const n=cvNeighbours('new');if(n.index!==0||n.apps[1].id!=='old')throw Error('Navigation order');
`));
test('new vacancy defaults to a job without an active search',()=>run(`
 if(defaultVacancyRole()!==0)throw Error('Empty desk default');
 state.vacancies=[{role:0,closed:false},{role:1,closed:false},{role:2,closed:true}];
 if(defaultVacancyRole()!==2)throw Error('Must skip active jobs and allow closed searches');
 state.vacancies.push({role:0,closed:false});
 if(defaultVacancyRole()!==2)throw Error('Duplicate search should not affect default');
`));
test('continuous CV navigation crosses vacancies explicitly and skips empty searches',()=>run(`
 state.vacancies=[{id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],day:1,closed:false},{id:'empty',slot:1,role:1,requirements:[1,1,1,1,1,1],day:1,closed:false},{id:'v2',slot:2,role:2,requirements:[1,1,1,11,10,1],day:1,closed:false}];
 state.applications=[{id:'old',candidate:0,vacancy:'v0',day:2,status:'pending',read:false},{id:'new',candidate:1,vacancy:'v0',day:3,status:'pending',read:false},{id:'doctor',candidate:8,vacancy:'v2',day:3,status:'pending',read:false}];
 if(navigationTarget('new',1).id!=='old')throw Error('Within-search order');
 if(navigationTarget('old',1).id!=='doctor')throw Error('Skip empty searches');
 if(navigationTarget('doctor',-1).id!=='old')throw Error('Reverse boundary');
 if(navigationTarget('new',-1)!==null||navigationTarget('doctor',1)!==null)throw Error('Queue boundaries');
 viewCV('old');
 if($('modal').innerHTML.includes('vacancy-switcher'))throw Error('Old switcher retained');
 if(!$('modal').innerHTML.includes('Next vacancy: Court physician'))throw Error('Missing boundary label');
 state.applications[2].status='invited';
 if(navigationTarget('old',1)!==null)throw Error('Resolved CV should be skipped');
`));
test('burn continuation selects next CV, next occupied vacancy, then remaining previous CV',()=>run(`
 state.vacancies=[{id:'v0',slot:0,role:0,closed:false},{id:'v1',slot:1,role:1,closed:false}];
 state.applications=[{id:'first',candidate:0,vacancy:'v0',day:3,status:'pending'},{id:'second',candidate:1,vacancy:'v0',day:2,status:'pending'},{id:'third',candidate:4,vacancy:'v1',day:2,status:'pending'}];
 if(nextPendingAfterRejection('first').id!=='second')throw Error('Next CV');
 if(nextPendingAfterRejection('second').id!=='third')throw Error('Next vacancy');
 state.applications[2].status='rejected';
 if(nextPendingAfterRejection('second').id!=='first')throw Error('Remaining earlier CV');
 state.applications[0].status='rejected';
 if(nextPendingAfterRejection('second')!==null)throw Error('Queue exhausted');
`));
test('CV and vacancy controls use separate navigation scopes',()=>run(`
 state.vacancies=[{id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],closed:false},{id:'v1',slot:1,role:1,requirements:[1,1,1,1,1,1],closed:false}];
 state.applications=[{id:'a0',candidate:0,vacancy:'v0',day:1,status:'pending'},{id:'a1',candidate:4,vacancy:'v1',day:1,status:'pending'}];
 if(cvNavigationTarget('a0',1)!==null)throw Error('CV next must stop at vacancy boundary');
 if(vacancyNavigationTarget('v0',1).id!=='v1')throw Error('Vacancy next');
 if(vacancyNavigationTarget('v1',-1).id!=='v0')throw Error('Vacancy previous');
 viewCV('a0');
 if(!$('modal').innerHTML.includes('class="vacancy-heading"'))throw Error('Missing vacancy heading controls');
 if(!$('modal').innerHTML.includes('aria-label="Next CV"'))throw Error('Missing fixed CV control');
`));
test('undo reopens the restored CV instead of leaving the next document on screen',()=>run(`
 state.vacancies=[{id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],day:1,closed:false}];
 state.applications=[{id:'burned',candidate:0,vacancy:'v0',day:2,status:'pending',read:true},{id:'next',candidate:1,vacancy:'v0',day:2,status:'pending',read:true}];
 undoState=JSON.stringify(state);
 state.applications[0].status='rejected';
 viewCV('next');
 undoDecision();
 if(currentApplication!=='burned')throw Error('Restored CV not visible');
 if(state.applications[0].status!=='pending')throw Error('Decision not restored');
 if(!$('modal').innerHTML.includes('Marta Voss'))throw Error('Wrong CV rendered');
 if(!$('modal').innerHTML.includes("decide('burned','invited')"))throw Error('Restored decision controls missing');
 if(!$('toast').innerHTML.includes('application restored'))throw Error('Missing visible confirmation');
 if(undoState!==null)throw Error('Undo should be consumed');
`));
test('CV removes only requested qualifiers and keeps original captions',()=>run(`
 state.vacancies=[{id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],day:1,closed:false}];
 state.applications=[{id:'a0',candidate:0,vacancy:'v0',day:1,status:'pending'}];
 viewCV('a0');
 const html=$('modal').innerHTML;
 if((html.match(/Waiting 0 days/g)||[]).length!==1)throw Error('Waiting time repeated');
 if(html.includes('Attributes certified')||html.includes('Awaiting response'))throw Error('Duplicate status text');
 if(html.split('<h4>Stats</h4>').length!==2)throw Error('Stats heading');
 if(['Newest first','1–20','Disclosed','Certified','CURRICULUM VITAE'].some(text=>html.includes(text)))throw Error('Requested qualifier retained');
 if(!['ROYAL APPOINTMENT','About Me','Experience','Skills'].every(text=>html.includes(text)))throw Error('Original caption missing');
 if(html.includes('APPLICATION FOR QUARTERMASTER'))throw Error('Repeated job title');
`));

test('invitation advances to the next CV and undo restores the invited application',()=>run(`
 (async()=>{
   state.vacancies=[{id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],day:1,closed:false}];
   state.applications=[{id:'first',candidate:0,vacancy:'v0',day:3,status:'pending'},{id:'second',candidate:1,vacancy:'v0',day:2,status:'pending'}];
   viewCV('first');
   decide('first','invited');
   await Promise.resolve();
   if(currentApplication!=='second')throw Error('Invitation did not advance');
   if(state.applications[0].status!=='invited')throw Error('Invitation not retained');
   undoDecision();
   if(currentApplication!=='first'||state.applications[0].status!=='pending')throw Error('Undo did not restore CV');
   decide('first','invited');
   undoDecision();
   await Promise.resolve();
   if(currentApplication!=='first')throw Error('Stale invitation animation replaced restored CV');
 })()
`));

test('Invited opens the CV viewer and navigates invited candidates across closed searches',()=>run(`
 state.vacancies=[
  {id:'old',slot:0,role:0,day:1,requirements:[1,1,1,11,9,1],closed:true},
  {id:'new',slot:0,role:0,day:4,requirements:[1,1,1,11,9,1],closed:false},
  {id:'border',slot:1,role:1,day:1,requirements:[10,1,10,1,8,1],closed:false}
 ];
 state.applications=[
  {id:'a',candidate:0,vacancy:'old',day:3,status:'invited'},
  {id:'b',candidate:1,vacancy:'old',day:2,status:'invited'},
  {id:'c',candidate:2,vacancy:'new',day:4,status:'invited'},
  {id:'d',candidate:4,vacancy:'border',day:5,status:'invited'},
  {id:'pending',candidate:5,vacancy:'border',day:6,status:'pending'}
 ];
 invitedTray();
 if(currentApplication!=='a')throw Error('Invited did not open the first vacancy at CV 1');
 if(!$('modal').innerHTML.includes('CV 1 of 2'))throw Error('Viewer did not start at CV 1');
 if(!$('modal').innerHTML.includes('cv-wrap')||$('modal').innerHTML.includes('class="list"'))throw Error('List popup retained');
 if(!$('modal').innerHTML.includes("changeVacancy('old',1,'invited')"))throw Error('Wrong navigation scope');
 if(vacancyNavigationTarget('border',-1,'invited').id!=='new')throw Error('Invited vacancy previous');
 if(vacancyNavigationTarget('new',-1,'invited').id!=='old')throw Error('Closed search inaccessible');
 if(cvNavigationTarget('a',1).id!=='b')throw Error('Invited CV navigation');
 if(cvNavigationTarget('d',1)!==null)throw Error('Pending candidate leaked into invited queue');
 viewCV('a');
 if(!$('modal').innerHTML.includes('CV 1 of 2'))throw Error('Invited count');
 if(!$('modal').innerHTML.includes('invitation-stamp is-filed'))throw Error('Stamp missing');
`));

test('card tooltip follows the scaled stage and stays within its edges',()=>run(`
 let cancelled=false;
 globalThis.requestAnimationFrame=()=>42;
 globalThis.cancelAnimationFrame=id=>{if(id===42)cancelled=true;};
 const stage=$('game-stage'),tip=$('card-skill-tooltip');
 stage.offsetWidth=1600;stage.offsetHeight=900;
 stage.getBoundingClientRect=()=>({left:100,top:50,width:800});
 tip.offsetWidth=300;tip.offsetHeight=90;
 const anchor={isConnected:true,querySelector(){return null;},getBoundingClientRect(){return {left:875,top:455,bottom:475,width:20};}};
 showCardSkillTooltip({currentTarget:anchor},0);
 if(tip.hidden||tip.textContent!==CANDIDATES[0].perk[1])throw Error('Tooltip missing');
 if(tip.style.left!=='1288px'||tip.style.top!=='710px')throw Error('Tooltip escaped scaled stage');
 hideCardSkillTooltip();
 if(!tip.hidden||!cancelled)throw Error('Tooltip cleanup');
`));

test('End day stops at day eight without opening a shortlist screen',()=>run(`
 state.day=7;render();
 if($('next').disabled)throw Error('End day disabled too early');
 advanceDay();
 if(state.day!==8||!$('next').disabled)throw Error('Day eight limit');
 if(!$('next').innerHTML.startsWith('End day'))throw Error('Button label changed');
 const snapshot=JSON.stringify(state);
 advanceDay();
 if(JSON.stringify(state)!==snapshot)throw Error('Disabled day advancement still mutated state');
 if(!$('modal').hidden)throw Error('Unexpected shortlist popup');
`));

test('experience years count worked months without gaps or duplicate overlaps',()=>run(`
 const job=(startDate,endDate)=>({startDate,endDate});
 if(totalExperienceYears({experience:[job('Jan 720','Dec 720')]})!==1)throw Error('Complete year');
 if(totalExperienceYears({experience:[job('Jan 720','Dec 720'),job('Jan 722','Dec 722')]})!==2)throw Error('Employment gap counted');
 if(totalExperienceYears({experience:[job('Jan 720','Dec 720'),job('Jun 720','May 721')]})!==1)throw Error('Overlap counted twice');
 state.vacancies=[{id:'v0',slot:0,role:0,requirements:[1,1,1,11,9,1],day:1,closed:false}];
 state.applications=[{id:'a0',candidate:0,vacancy:'v0',day:2,status:'pending'}];
 render();
 if(!$('desk').innerHTML.includes(totalExperienceYears(CANDIDATES[0])+' years of experience'))throw Error('Card experience missing');
`));
