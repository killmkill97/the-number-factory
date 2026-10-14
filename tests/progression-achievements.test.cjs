const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function game() {
  const elements = new Map();
  const listeners = new Map();
  const storage = new Map();
  function element(id = '') {
    const classes = new Set();
    return {
      id, dataset: {}, children: [], style: {}, textContent: '', innerHTML: '', disabled: false,
      classList: {
        add: (...values) => values.forEach(value => classes.add(value)),
        remove: (...values) => values.forEach(value => classes.delete(value)),
        contains: value => classes.has(value),
        toggle(value, force) { const on = force ?? !classes.has(value); on ? classes.add(value) : classes.delete(value); return on; }
      },
      addEventListener() {}, setAttribute() {}, remove() {},
      append(...nodes) { this.children.push(...nodes); },
      appendChild(node) { this.children.push(node); return node; },
      closest() { return null; }, matches() { return false; }
    };
  }
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); },
    createElement: () => element(),
    querySelector: () => element(),
    addEventListener(type, fn) { listeners.set(type, fn); }
  };
  const context = vm.createContext({
    document, listeners, URLSearchParams, performance: { now: () => 0 },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    window: { location: { pathname: '/', search: '' }, addEventListener() {}, setTimeout() { return 1; }, clearTimeout() {} },
    setInterval() {}, setTimeout() {}, clearTimeout() {},
    fetch: () => ({ then() { return this; }, catch() { return this; } }),
    errors: [], console: { error: error => context.errors.push(String(error)) }
  });
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js', 'core/dom.js',
    'systems/percent-lanes.js', 'systems/achievements.js', 'core/save.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext(`
    render=()=>{};log=()=>{};setChapter=()=>{};
    let activeSquareView='upgrades';
    function achieved(id) { return achievementState[id] === true; }
    function condition(id) { return ACHIEVEMENTS.find(item=>item.id===id).condition(); }
    function action(id, {trusted=true,disabled=false,upgrade=false,panel=false,help=false}={}) {
      const button={id,disabled,dataset:{},matches:selector=>selector==='.formula-help-trigger'?help:upgrade,
        closest:selector=>selector==='button'?button:panel?{}:null};
      recordAchievementPlayerAction({isTrusted:trusted,target:button});
    }
  `, context);
  return context;
}

function run(context, body) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${body}})()`, context)));
}

test('all 25 new achievements are general, unique, and present in the existing UI', () => {
  assert.deepEqual(run(game(), `
    const general=ACHIEVEMENTS.filter(item=>item.category!=='secret');
    return {count:general.length,unique:new Set(ACHIEVEMENTS.map(item=>item.id)).size===ACHIEVEMENTS.length,
      ui:general.every(item=>achievementUi.has(item.id)),icons:ACHIEVEMENT_ICONS_ENABLED};
  `), {count:44,unique:true,ui:true,icons:false});
});

test('resource, slot, Dyson, click and time achievements respect exact large-number thresholds', () => {
  assert.deepEqual(run(game(), `
    const checks=[];
    for (const [id,expression,threshold] of [
      ['trained_convergence','squareConvergencePoints','1e50'],
      ['pierce_universe','divergerPower','1e1000'],
      ['destroyer_of_worlds','perClick','1e150000'],
      ['hello_mr_knuth','knuthPoints','1e100'],
      ['beyond_universe','numberBlackHoleAccumulatedGameSeconds',ACHIEVEMENT_UNIVERSE_AGE_SECONDS],
      ['infinity_starts_here','numberBlackHoleAccumulatedGameSeconds',ACHIEVEMENT_INFINITE_YEAR_SECONDS]
    ]) {
      globalThis.threshold=threshold;
      eval(expression+'=multiplyNumberValue(threshold,0.999)');checks.push(!condition(id));
      eval(expression+'=NumberMath.fromValue(threshold)');checks.push(condition(id));
    }
    knuthOperationLevel=1;checks.push(!condition('two_arrow_slots'));
    knuthOperationLevel=2;checks.push(condition('two_arrow_slots'));
    squareBreakthroughLevels.dyson_swarm=31;checks.push(!condition('current_energy_509'));
    squareBreakthroughLevels.dyson_swarm=32;checks.push(condition('current_energy_509'));
    numberBlackHoleTotalInvested=1;numberBlackHoleSchwarzschildRadius=()=>119999999999;
    checks.push(!condition('ultramassive_black_hole'));
    numberBlackHoleSchwarzschildRadius=()=>120000000000;checks.push(condition('ultramassive_black_hole'));
    return {all:checks.every(Boolean),infinite:compareNumberValues(ACHIEVEMENT_INFINITE_YEAR_SECONDS,'1e308')>0};
  `), {all:true,infinite:true});
});

test('Great Theory purchase is recognized even after spending it all, while refunds are not needed', () => {
  assert.deepEqual(run(game(), `
    const before=condition('is_that_abstraction');knuthUnlocked=true;squareConvergencePoints=ABSTRACTION_CP_BASE_COST;
    const bought=purchaseGreatTheory(1);greatTheory=0;
    return {before,bought,after:condition('is_that_abstraction')};
  `), {before:false,bought:true,after:true});
});

test('challenge completion and all-one-slot equipment follow their registries, including future entries', () => {
  assert.deepEqual(run(game(), `
    const checks=[!condition('a_challenge'),!condition('praise_sticker'),!condition('enough_already')];
    completedKnuthChallengeIds.add(KNUTH_CHALLENGES[0].id);checks.push(condition('a_challenge'));
    KNUTH_CHALLENGES.forEach(item=>completedKnuthChallengeIds.add(item.id));checks.push(condition('praise_sticker'));
    KNUTH_CHALLENGES.push({id:'future-kc'});checks.push(!condition('praise_sticker'));
    completedKnuthChallengeIds.add('future-kc');checks.push(condition('praise_sticker'));
    KNUTH_SLOT_UPGRADES.filter(item=>item.slots===1).forEach(item=>knuthEquippedUpgradeIds.add(item.id));
    checks.push(condition('enough_already'));
    KNUTH_SLOT_UPGRADES.push({id:'future-one-slot',slots:1});checks.push(!condition('enough_already'));
    knuthEquippedUpgradeIds.add('future-one-slot');checks.push(condition('enough_already'));
    return checks.every(Boolean);
  `), true);
});

test('math doctor requires branch expansion and every compatible path, ignoring locked alternatives but not future research', () => {
  assert.deepEqual(run(game(), `
    knuthUnlocked=true;
    for(const research of ABSTRACTION_RESEARCHES) {
      if(!research.branch || ['time','active'].includes(research.branch)) abstractionResearchState[research.id]=true;
    }
    const noExpansion=condition('math_doctor');knuthBaseUpgradeLevels.extra_branch=1;
    const onlyOnePath=condition('math_doctor');
    ABSTRACTION_RESEARCHES.filter(r=>r.branch==='expansion').forEach(r=>abstractionResearchState[r.id]=true);
    const full=condition('math_doctor');
    ABSTRACTION_RESEARCHES.push({id:'future-normal',parents:['14-1'],greatTheoryCost:1});
    const missingNew=condition('math_doctor');abstractionResearchState['future-normal']=true;
    const afterNew=condition('math_doctor');
    ABSTRACTION_RESEARCHES.push({id:'future-time',branch:'time',branchGroup:1,parents:['6-1'],greatTheoryCost:1});
    const missingPath=condition('math_doctor');abstractionResearchState['future-time']=true;
    return {noExpansion,onlyOnePath,full,missingNew,afterNew,missingPath,complete:condition('math_doctor'),
      firstBranch:condition('life_is_choices')};
  `), {noExpansion:false,onlyOnePath:false,full:true,missingNew:false,afterNew:true,missingPath:false,complete:true,firstBranch:true});
});

test('second base group requires every first-group upgrade, not a fixed list of IDs', () => {
  assert.deepEqual(run(game(), `
    knuthUnlocked=true;hasClaimedKnuthPoint=true;
    const before=condition('all_those_upgrades');
    KNUTH_BASE_UPGRADES.filter(item=>item.group===1).forEach(item=>knuthBaseUpgradeLevels[item.id]=1);
    const full=condition('all_those_upgrades');
    KNUTH_BASE_UPGRADES.push({id:'future-first',group:1});
    return {before,full,missingFuture:condition('all_those_upgrades')};
  `), {before:false,full:true,missingFuture:false});
});

test('softcap overrun compares against the highest lane cap using huge-number arithmetic', () => {
  assert.deepEqual(run(game(), `
    percentUnlocked=true;percentPower=1;extraPercentLanes.push(makePercentLane(2));extraPercentLanes[0].power=11;
    setBaseNumber('1e1000021');const below=condition('twist_everything');
    setBaseNumber('1e1000022');const exact=condition('twist_everything');
    return {below,exact};
  `), {below:false,exact:true});
});

test('only trusted gameplay input is manual; navigation, help, N controls and disabled actions are not', () => {
  assert.deepEqual(run(game(), `
    for(const id of ['squareDimensionsViewBtn','knuthProductionViewBtn','saveBtn','automatiumSaveBtn','automatiumQuickEditorBtn']) action(id);
    action('percentBtn',{trusted:false});action('addBtn',{disabled:true});action('help',{panel:true,help:true});
    const untouched=!achievementRunProgress.manualGameplay;
    action('percentBtn');const percent=achievementRunProgress.manualGameplay;
    achievementRunProgress=makeAchievementRunProgress();action('manualSquareExchangeBtn');
    return {untouched,percent,sp:achievementRunProgress.manualSpExchange,game:achievementRunProgress.manualGameplay};
  `), {untouched:true,percent:true,sp:true,game:true});
});

test('single and bulk percent use record both windows even if precision hides the gain', () => {
  assert.deepEqual(run(game(), `
    setBaseNumber(0);const zero=applyPercentUse(0,1,'test');const unused=!achievementRunProgress.percentUsedKnuth;
    setBaseNumber(100);applyPercentUse(100,1,'test');const single=achievementRunProgress.percentUsedConvergence;
    achievementRunProgress=makeAchievementRunProgress();setBaseNumber('1e1000');
    const batch=applyPercentUsesBatch(1,100,'test');
    const flags=achievementRunProgress.percentUsedConvergence&&achievementRunProgress.percentUsedKnuth;
    resetRunStateAfterSquarePrestige();
    return {zero,unused,single,batch,flags,preserved:achievementRunProgress.percentUsedKnuth};
  `), {zero:0,unused:true,single:true,batch:true,flags:true,preserved:true});
});

test('CP award uses the convergence window, never resets the Knuth window, and ignores failed exchanges', () => {
  assert.deepEqual(run(game(), `
    const failed=collectSquareConvergenceIfReady();const noFalse= !achieved('already_dead');
    recordAchievementPercentUse();squarePoints=squareConvergenceExchangeRequirement();collectSquareConvergenceIfReady();
    const used=achieved('already_dead');const knuthStillUsed=achievementRunProgress.percentUsedKnuth;
    squarePoints=squareConvergenceExchangeRequirement();collectSquareConvergenceIfReady();
    return {failed,noFalse,used,knuthStillUsed,nextClean:achieved('already_dead')};
  `), {failed:0,noFalse:true,used:false,knuthStillUsed:true,nextClean:true});
});

test('KP conditional achievements use newly awarded integer KP and sticky run restrictions', () => {
  assert.deepEqual(run(game(), `
    recordAchievementKnuthReward(499,31,snapshotAchievementKnuthRun());const below=achieved('no_hands');
    recordAchievementKnuthReward(500,31,snapshotAchievementKnuthRun());const exact=achieved('no_hands');
    loadAchievementState({});achievementRunProgress.manualGameplay=true;achievementRunProgress.manualSpExchange=true;
    achievementRunProgress.percentUsedKnuth=true;achievementRunProgress.productionUnlocked=true;
    recordAchievementKnuthReward(500,31,snapshotAchievementKnuthRun());
    return {below,exact,blocked:['no_hands','ora_ora','how_to_erase_you','that_is_wrong'].every(id=>!achieved(id))};
  `), {below:false,exact:true,blocked:true});
});

test('production unlock history survives cancelling research or unequipping production', () => {
  assert.deepEqual(run(game(), `
    knuthUnlocked=true;hasClaimedKnuthPoint=true;hasEverEarnedSquareConvergencePoint=true;theory=100;
    generalizationResearchState['2-1']=true;researchGeneralization('3-1');resetGeneralizationResearchState();
    const researchSticky=achievementRunProgress.productionUnlocked;
    achievementRunProgress=makeAchievementRunProgress();knuthOperationLevel=1;
    toggleKnuthUpgrade('permanent_production');completedKnuthChallengeIds.add('kc1');toggleKnuthUpgrade('permanent_production');
    recordAchievementKnuthReward(20,31,snapshotAchievementKnuthRun());
    return {researchSticky,equipmentSticky:achievementRunProgress.productionUnlocked,notGranted:!achieved('that_is_wrong')};
  `), {researchSticky:true,equipmentSticky:true,notGranted:true});
});

test('speed achievements use inclusive real-time boundaries, not accelerated game time', () => {
  assert.deepEqual(run(game(), `
    squareRunGameSeconds=NumberMath.fromString('1e1000');
    const results=[];
    for(const seconds of [30.001,30,0.501,0.5]) {
      loadAchievementState({});recordAchievementKnuthReward(1,seconds,snapshotAchievementKnuthRun());
      results.push([achieved('not_a_knuth'),achieved('i_am_speed')]);
    }
    return results;
  `), [[false,false],[true,false],[true,false],[true,true]]);
});

test('actual KP reset checks the old run before erasing it and preserves formula and payout', () => {
  assert.deepEqual(run(game(), `
    hasClaimedKnuthPoint=true;knuthUnlocked=true;knuthPoints=4;squareConvergencePoints=NumberMath.fromString('1e7500');
    const expected=knuthPointGain();knuthRunStartedAtMs=Date.now()-400;
    beginKnuthPrestige();
    return {gain:NumberMath.serialize(expected),total:NumberMath.serialize(knuthPoints),
      hands:achieved('no_hands'),speed:achieved('i_am_speed'),clean:achievementRunProgress.knuthKnown&&!achievementRunProgress.manualGameplay};
  `), {gain:'500',total:'504',hands:true,speed:true,clean:true});
});

test('first KP waits for the claim and keeps the original arrival time and run snapshot', () => {
  assert.deepEqual(run(game(), `
    knuthRunStartedAtMs=Date.now()-400;beginKnuthPrestige();
    const before=achieved('i_am_speed');pendingKnuthCompletionSeconds=0.4;
    achievementRunProgress.percentUsedKnuth=true;claimKnuthPoint();
    return {before,after:achieved('i_am_speed'),original:achieved('ora_ora'),pending:pendingAchievementKnuthRun,
      gain:NumberMath.serialize(knuthPoints)};
  `), {before:false,after:true,original:true,pending:null,gain:'1'});
});

test('starting, abandoning and completing KC reset tracking but never count as KP awards', () => {
  assert.deepEqual(run(game(), `
    hasClaimedKnuthPoint=true;knuthUnlocked=true;
    achievementRunProgress.manualGameplay=true;startKnuthChallenge('kc1');
    const fresh=achievementRunProgress.knuthKnown&&!achievementRunProgress.manualGameplay;
    abandonKnuthChallenge();startKnuthChallenge('kc1');squarePoints=500000;completeKnuthChallenge();
    updateAchievements();
    return {fresh,noKp:!achieved('not_a_knuth')&&!achieved('ora_ora'),challenge:achieved('a_challenge')};
  `), {fresh:true,noKp:true,challenge:true});
});

test('actual save/load preserves restrictions and pending first-KP history without changing production values', () => {
  const context=game();
  assert.deepEqual(run(context, `
    achievementRunProgress.manualGameplay=true;achievementRunProgress.manualSpExchange=true;
    recordAchievementPercentUse();pendingKnuthPointClaim=true;knuthUnlocked=true;
    pendingAchievementKnuthRun=snapshotAchievementKnuthRun();setBaseNumber('1e1000');
    saveGame();const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    achievementRunProgress=makeAchievementRunProgress();pendingAchievementKnuthRun=null;
    loadGame(JSON.stringify(saved),{countAsLoad:false});
    return {same:JSON.stringify(achievementRunProgress)===JSON.stringify(saved.achievementRunProgress),
      pending:pendingAchievementKnuthRun?.percentUsedKnuth===true,number:NumberMath.serialize(getBaseNumber()),errors};
  `), {same:true,pending:true,number:'1e1000',errors:[]});
});

test('old saves cannot falsely prove no-use restrictions and become trackable at the next real reset', () => {
  assert.deepEqual(run(game(), `
    loadAchievementRunProgress(undefined,undefined);recordAchievementKnuthReward(500,31,snapshotAchievementKnuthRun());
    recordAchievementConvergence();const old=!achieved('already_dead')&&!achieved('no_hands')&&!achieved('ora_ora');
    recordAchievementConvergence();const nextCp=achieved('already_dead');
    resetProgressForNewKnuthRun();recordAchievementKnuthReward(500,31,snapshotAchievementKnuthRun());
    return {old,nextCp,nextKp:achieved('no_hands')&&achieved('ora_ora')};
  `), {old:true,nextCp:true,nextKp:true});
});

test('click achievement uses the actual softened one-click gain rather than the raw displayed multiplier', () => {
  assert.deepEqual(run(game(), `
    perClick=NumberMath.fromString('1e150000');percentUnlocked=true;setBaseNumber('1e100');
    const rawEnough=compareNumberValues(effectivePerClick(),'1e150000')>=0;
    const softened=condition('destroyer_of_worlds');setBaseNumber(1);
    return {rawEnough,softened,unsoftened:condition('destroyer_of_worlds')};
  `), {rawEnough:true,softened:false,unsoftened:true});
});

test('twenty-KP no-production threshold is inclusive and zero reward never awards prestige achievements', () => {
  assert.deepEqual(run(game(), `
    recordAchievementKnuthReward(0,0,snapshotAchievementKnuthRun());
    const zero=['not_a_knuth','i_am_speed','ora_ora','how_to_erase_you','that_is_wrong'].every(id=>!achieved(id));
    recordAchievementKnuthReward(19,31,snapshotAchievementKnuthRun());const below=achieved('that_is_wrong');
    recordAchievementKnuthReward(20,31,snapshotAchievementKnuthRun());
    return {zero,below,exact:achieved('that_is_wrong')};
  `), {zero:true,below:false,exact:true});
});
