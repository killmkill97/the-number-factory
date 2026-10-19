const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function game() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context);
  }
  vm.runInContext(`
    let renderCount=0;render=()=>{renderCount++;};log=()=>{};setChapter=()=>{};
    extraPercentLanesEl={innerHTML:''};
    knuthUnlocked=true;hasClaimedKnuthPoint=true;hasEverEarnedSquareConvergencePoint=true;
    function snapshot() {
      return JSON.stringify({theory,greatTheory,generalizationResearchState,abstractionResearchState,
        abstractionResearchPaidCosts,automatiumPrestigeRetentionUnlocked,squareDimensionAutoUpgradeEnabled});
    }
  `, context);
  return context;
}

function run(context, code) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${code}})()`, context)));
}

test('generalization planning collects all missing ancestors once without modifying progression', () => {
  assert.deepEqual(run(game(), `
    const before=snapshot();
    const plan=researchPurchasePlan('generalization','8-1');
    const expected=new Set();
    function visit(id){GENERALIZATION_RESEARCHES.find(r=>r.id===id).parents.forEach(visit);expected.add(id);}
    visit('8-1');
    const done=new Set();
    const ordered=plan.ids.every(id=>{
      const valid=GENERALIZATION_RESEARCHES.find(r=>r.id===id).parents.every(parent=>done.has(parent));
      done.add(id);return valid;
    });
    return {same:snapshot()===before,ordered,unique:new Set(plan.ids).size===plan.ids.length,
      expected:[...expected].sort().join(',')===plan.ids.slice().sort().join(','),
      cost:plan.cost===GENERALIZATION_RESEARCHES.filter(r=>expected.has(r.id)).reduce((sum,r)=>sum+r.theoryCost,0)};
  `), {same:true,ordered:true,unique:true,expected:true,cost:true});
});

test('insufficient Theory prevents every ancestor purchase and does not render or spend', () => {
  assert.deepEqual(run(game(), `
    const plan=researchPurchasePlan('generalization','8-1');theory=plan.cost-1;
    const before=snapshot();const bought=purchaseResearchWithParents('generalization','8-1');
    return {bought,same:snapshot()===before,renderCount};
  `), {bought:false,same:true,renderCount:0});
});

test('exact total Theory purchases the complete chain and preserves existing research side effects', () => {
  assert.deepEqual(run(game(), `
    const plan=researchPurchasePlan('generalization','8-1');theory=plan.cost;
    const bought=purchaseResearchWithParents('generalization','8-1');
    return {bought,theory,complete:plan.ids.every(hasGeneralizationResearch),
      auto:squareDimensionAutoUpgradeEnabled,renderCount,again:purchaseResearchWithParents('generalization','8-1')};
  `), {bought:true,theory:0,complete:true,auto:true,renderCount:1,again:false});
});

test('first Knuth fires only after the entire generalization chain is paid and completed', () => {
  assert.deepEqual(run(game(), `
    hasClaimedKnuthPoint=false;
    const plan=researchPurchasePlan('generalization','8-1');theory=plan.cost;
    let calls=0,readyAtPrestige=false;
    beginKnuthPrestige=()=>{calls++;readyAtPrestige=theory===0&&plan.ids.every(hasGeneralizationResearch);};
    const bought=purchaseResearchWithParents('generalization','8-1');
    return {bought,calls,readyAtPrestige};
  `), {bought:true,calls:1,readyAtPrestige:true});
});

test('owned and permanently unlocked generalization ancestors are not charged again', () => {
  assert.deepEqual(run(game(), `
    generalizationResearchState['1-1']=true;
    const plan=researchPurchasePlan('generalization','3-1');
    knuthEquippedUpgradeIds.add('permanent_production');
    const permanent=researchPurchasePlan('generalization','4-2');
    return {ids:plan.ids,cost:plan.cost,permanent};
  `), {ids:['2-1','3-1'],cost:5,permanent:{ids:['4-2'],cost:6}});
});

test('abstraction uses the first priority and includes only its required chain with one available path', () => {
  assert.deepEqual(run(game(), `
    setAbstractionBranchPriority(1,0,'percent');
    const plan=researchPurchasePlan('abstraction','7-1');
    greatTheory=plan.cost;const bought=purchaseResearchWithParents('abstraction','7-1');
    return {ids:plan.ids,cost:plan.cost,bought,greatTheory,renderCount,
      retained:automatiumPrestigeRetentionUnlocked,refund:abstractionResearchRefund()};
  `), {ids:['1-1','2-1','3-1','4-3','5-3','6-3','7-1'],cost:20,
    bought:true,greatTheory:0,renderCount:1,retained:true,refund:20});
});

test('two unlocked paths purchase both saved priorities and share their common ancestors', () => {
  assert.deepEqual(run(game(), `
    knuthBaseUpgradeLevels.extra_branch=1;
    setAbstractionBranchPriority(1,0,'percent');setAbstractionBranchPriority(1,1,'expansion');
    const plan=researchPurchasePlan('abstraction','7-1');greatTheory=plan.cost;
    const bought=purchaseResearchWithParents('abstraction','7-1');
    return {ids:plan.ids,cost:plan.cost,bought,greatTheory,
      skipped:!hasAbstractionResearch('6-1'),refund:abstractionResearchRefund()};
  `), {ids:['1-1','2-1','3-1','4-3','5-3','6-3','4-2','5-2','6-2','7-1'],cost:36,
    bought:true,greatTheory:0,skipped:true,refund:36});
});

test('insufficient Great Theory cannot buy just the cheaper first path or change permanent unlocks', () => {
  assert.deepEqual(run(game(), `
    knuthBaseUpgradeLevels.extra_branch=1;greatTheory=35;
    const before=snapshot();const bought=purchaseResearchWithParents('abstraction','7-1');
    return {bought,same:snapshot()===before,renderCount};
  `), {bought:false,same:true,renderCount:0});
});

test('existing branch choices take precedence over settings and the remaining slot follows priority', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['4-2']=true;
    setAbstractionBranchPriority(1,0,'percent');
    const one=researchPurchasePlan('abstraction','7-1');
    knuthBaseUpgradeLevels.extra_branch=1;
    const two=researchPurchasePlan('abstraction','7-1');
    return {one:one.ids.filter(id=>id.startsWith('6-')),two:two.ids.filter(id=>id.startsWith('6-')),
      explicit:researchPurchasePlan('abstraction','6-1')!==null};
  `), {one:['6-2'],two:['6-2','6-3'],explicit:true});
});

test('explicit branch targets follow their own path and incompatible choices remain blocked', () => {
  assert.deepEqual(run(game(), `
    const explicit=researchPurchasePlan('abstraction','6-3');
    abstractionResearchState['4-1']=true;greatTheory=1000;
    const before=snapshot();
    const plan=researchPurchasePlan('abstraction','6-3');
    const bought=purchaseResearchWithParents('abstraction','6-3');
    return {ids:explicit.ids,plan,bought,same:snapshot()===before};
  `), {ids:['1-1','2-1','3-1','4-3','5-3','6-3'],plan:null,bought:false,same:true});
});

test('later branch targets retain normal AND parents and the earlier branch selection', () => {
  assert.deepEqual(run(game(), `
    setAbstractionBranchPriority(1,0,'expansion');setAbstractionBranchPriority(2,0,'passive');
    const plan=researchPurchasePlan('abstraction','14-3');greatTheory=plan.cost;
    const bought=purchaseResearchWithParents('abstraction','14-3');
    return {bought,normal:['9-1','9-2','10-1','11-1'].every(hasAbstractionResearch),
      first:hasAbstractionResearch('6-2'),second:hasAbstractionResearch('14-3'),
      other:hasAbstractionResearch('12-2'),left:greatTheory,refunded:abstractionResearchRefund()===plan.cost};
  `), {bought:true,normal:true,first:true,second:true,other:false,left:0,refunded:true});
});

test('access gates, unknown IDs, cycles and missing parents do not cause partial purchases', () => {
  assert.deepEqual(run(game(), `
    hasEverEarnedSquareConvergencePoint=false;
    const noCp=researchPurchasePlan('generalization','3-1');
    hasEverEarnedSquareConvergencePoint=true;activeKnuthChallengeId='kc3';
    const kc3=researchPurchasePlan('generalization','3-1');
    knuthUnlocked=false;const locked=researchPurchasePlan('abstraction','7-1');knuthUnlocked=true;
    ABSTRACTION_RESEARCHES.push({id:'cycle',parents:['cycle'],greatTheoryCost:1});
    const cycle=researchPurchasePlan('abstraction','cycle');
    ABSTRACTION_RESEARCHES.push({id:'missing',parents:['not-found'],greatTheoryCost:1});
    return {noCp,kc3,locked,cycle,missing:researchPurchasePlan('abstraction','missing'),
      unknown:researchPurchasePlan('abstraction','not-found'),kind:researchPurchasePlan('bad','1-1')};
  `), {noCp:null,kc3:null,locked:null,cycle:null,missing:null,unknown:null,kind:null});
});

test('priority validation swaps duplicates, restores old defaults, and survives reset and save round trips', () => {
  assert.deepEqual(run(game(), `
    setAbstractionBranchPriority(1,0,'percent');setAbstractionBranchPriority(1,1,'time');
    setAbstractionBranchPriority(2,0,'idle');
    const saved=JSON.parse(JSON.stringify(abstractionBranchPriorities));
    loadAbstractionBranchPriorities(undefined);const defaults=JSON.parse(JSON.stringify(abstractionBranchPriorities));
    loadAbstractionBranchPriorities(saved);
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();resetProgressForNewKnuthRun();
    const preserved=JSON.stringify(saved)===JSON.stringify(abstractionBranchPriorities);
    loadAbstractionBranchPriorities({1:['bad','percent','percent'],2:'active'});
    return {defaults,preserved,restored:abstractionBranchPriorities,
      invalid:setAbstractionBranchPriority(2,2,'idle'),invalidBranch:setAbstractionBranchPriority(1,0,'bad')};
  `), {defaults:{1:['time','expansion','percent'],2:['active','passive','idle']},preserved:true,
    restored:{1:['percent','time','expansion'],2:['active','passive','idle']},invalid:false,invalidBranch:false});
  const save = fs.readFileSync(path.join(__dirname, '../scripts/core/save.js'), 'utf8');
  assert.match(save, /abstractionBranchPriorities: \{ 1: \[\.\.\.abstractionBranchPriorities\[1\]\]/);
  assert.match(save, /loadAbstractionBranchPriorities\(d\.abstractionBranchPriorities\)/);
});

test('individual N/API purchases still skip missing parents rather than buying them automatically', () => {
  assert.deepEqual(run(game(), `
    theory=1000;greatTheory=1000;
    return {gz:researchGeneralization('3-1'),ab:researchAbstraction('7-1'),
      gzAvailable:canResearchGeneralization('3-1'),abAvailable:canResearchAbstraction('7-1'),
      theory,greatTheory,renderCount};
  `), {gz:false,ab:false,gzAvailable:false,abAvailable:false,theory:1000,greatTheory:1000,renderCount:0});
});

test('every current target completes at its planned exact price for all first-priority and branch-limit combinations', () => {
  for (const kind of ['generalization','abstraction']) {
    const ids=run(game(), `return (${JSON.stringify(kind)}==='abstraction'?ABSTRACTION_RESEARCHES:GENERALIZATION_RESEARCHES).map(r=>r.id);`);
    for (const id of ids) {
      for (const [priority, limit] of kind==='abstraction'
        ? ['time','expansion','percent'].flatMap(branch=>[[branch,1],[branch,2]]) : [['time',1]]) {
        const context=game();
        assert.deepEqual(run(context, `
          knuthBaseUpgradeLevels.extra_branch=${limit-1};
          setAbstractionBranchPriority(1,0,${JSON.stringify(priority)});
          const kind=${JSON.stringify(kind)},id=${JSON.stringify(id)};
          const plan=researchPurchasePlan(kind,id);
          if(kind==='abstraction')greatTheory=plan.cost;else theory=plan.cost;
          const bought=purchaseResearchWithParents(kind,id);
          const has=kind==='abstraction'?hasAbstractionResearch:hasGeneralizationResearch;
          return {bought,done:plan.ids.every(has),left:kind==='abstraction'?greatTheory:theory};
        `), {bought:true,done:true,left:0}, `${kind} ${id}, ${priority}, limit ${limit}`);
      }
    }
  }
});

test('an already initialized generalization tree can refresh its connections and prerequisite focus repeatedly', () => {
  const context = game();
  const ui = fs.readFileSync(path.join(__dirname, '../scripts/systems/square-convergence.js'), 'utf8');
  vm.runInContext(`
    const toggles=[];
    const generalizationTree={classList:{toggle:(name,enabled)=>toggles.push([name,enabled])}};
    const generalizationTreeCanvas={};
    const generalizationResearchUi={};
    let generalizationTreeLayoutInitialized=true;
    let focusedGeneralizationResearchId='2-1';
    const connection={dataset:{parentId:'1-1',childId:'2-1'},
      classList:{toggle:(name,enabled)=>toggles.push([name,enabled])}};
    const generalizationConnections={querySelectorAll:()=>[connection]};
    updateGeneralizationTreeViewportExtent=()=>{};
    generalizationResearchState['1-1']=true;generalizationResearchState['2-1']=true;
  `, context);
  vm.runInContext(ui.slice(ui.indexOf('function generalizationResearchAncestry('),
    ui.indexOf('function updateGeneralizationTreeViewportExtent(')), context);
  vm.runInContext(ui.slice(ui.indexOf('function renderGeneralizationTreeLayout('),
    ui.indexOf('function initializeGeneralizationTreePan(')), context);
  assert.deepEqual(run(context, `
    renderGeneralizationTreeLayout();renderGeneralizationTreeLayout();return toggles;
  `), [
    ['complete',true],['has-research-focus',true],['research-focus-path',true],
    ['complete',true],['has-research-focus',true],['research-focus-path',true]
  ]);
});
