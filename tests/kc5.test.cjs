const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function uiGame() {
  const ctx = game();
  ctx.loadSource('document.createDocumentFragment=()=>document.createElement("div");createFormulaHelpButton=()=>null;');
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/chapters/knuth.js'), 'utf8'));
  return ctx;
}

test('KC5 uses an editable e170 CP goal, manual completion and dynamic all-challenge achievements', () => {
  assert.deepEqual(run(game(), `
    const all=()=>ACHIEVEMENTS.find(a=>a.id==='praise_sticker').condition();
    KNUTH_CHALLENGES.filter(c=>c.id!=='kc5').forEach(c=>completedKnuthChallengeIds.add(c.id));
    const before=all();startKnuthChallenge('kc5');
    squareConvergencePoints=NumberMath.fromString('9e169');const short=canCompleteKnuthChallenge();
    squareConvergencePoints=NumberMath.fromString('1e170');const ready=canCompleteKnuthChallenge();
    const active=activeKnuthChallengeId;const done=completeKnuthChallenge();
    return {goal:knuthChallenge('kc5').goal,before,short,ready,active,done,all:all(),
      unlocked:knuthBaseAutomationAvailable(),groups:[4,5,6].map(g=>hasCompletedKnuthChallenge('kc5'))};
  `), {goal:'1e170',before:false,short:false,ready:true,active:'kc5',done:true,all:true,unlocked:true,groups:[true,true,true]});
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html, /목표: 1e170 CP/);
});

test('KC5 suppresses all basic effects and purchases while retaining bought levels and equipment effects', () => {
  const ctx = game();
  assert.deepEqual(run(ctx, `
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,u.growth?3:1])));
    knuthOperationLevel=30;knuthPoints=NumberMath.fromString('1e5000');
    knuthEquippedUpgradeIds.add('percent_cap_200');
    const dyson=SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm');
    const overclock=SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='overclock');
    const before=[squareBreakthroughMax(dyson),squareBreakthroughMax(overclock),divergerBUpgradeGain(),abstractionBranchLimit(1)];
    activeKnuthChallengeId='kc5';
    const multipliers=KNUTH_BASE_UPGRADES.filter(u=>u.group===1).map(u=>plain(knuthBaseMultiplier(u.id,25)));
    abstractionCostResourceIndex=3;theory=100;
    const noTheory=greatTheoryMaximumPurchases()===0&&!setAbstractionCostResource(3);
    const blocked=KNUTH_BASE_UPGRADES.every(u=>!canBuyKnuthBaseUpgrade(u.id)&&!buyKnuthBaseUpgrade(u.id));
    const operationBlocked=!buyKnuthOperationUpgrade();
    const during=[squareBreakthroughMax(dyson),squareBreakthroughMax(overclock),divergerBUpgradeGain(),abstractionBranchLimit(1)];
    const equipment=percentPowerEffectiveLimit();
    activeKnuthChallengeId=null;
    return {before,during,multipliers,noTheory,blocked,operationBlocked,equipment,
      retained:knuthBaseUpgradeLevel('cp_gain'),restored:plain(knuthBaseMultiplier('cp_gain',25))};
  `), {before:[11,20,0.4,2],during:[8,8,0.2,1],multipliers:[1,1,1,1,1],noTheory:true,
    blocked:true,operationBlocked:true,equipment:200,retained:3,restored:15625});
});

test('KC5 disables starter resources and restores them after abandoning the challenge', () => {
  assert.deepEqual(run(game(), `
    knuthBaseUpgradeLevels.starting_resources=1;startKnuthChallenge('kc5');
    const during=[plain(getBaseNumber()),plain(squarePoints),plain(squareConvergencePoints)];
    abandonKnuthChallenge();
    return {during,after:[plain(getBaseNumber()),plain(squarePoints),plain(squareConvergencePoints)],
      owned:knuthBaseUpgradeLevel('starting_resources'),reward:hasCompletedKnuthChallenge('kc5')};
  `), {during:[0,0,0],after:[1e14,1e10,1000],owned:1,reward:false});
});

test('slots divide the effective 16-2 capacity by three and round at every boundary', () => {
  const rows=run(game(), `
    activeKnuthChallengeId='kc5';
    return [false,true].flatMap(boost=>{
      abstractionResearchState['16-2']=boost;
      return Array.from({length:100},(_,level)=>({level,boost,capacity:knuthSlotCapacity(level)}));
    });
  `);
  for (const row of rows) assert.equal(row.capacity, Math.round((row.boost?Math.round(row.level*1.25):row.level)/3));
});

test('starting KC5 trims newest excess equipment while preserving the remaining effects and purchase count', () => {
  assert.deepEqual(run(game(), `
    knuthOperationLevel=6;knuthEquippedUpgradeIds.add('percent_cap_200');
    knuthEquippedUpgradeIds.add('percent_overflow');startKnuthChallenge('kc5');
    const during={slots:knuthSlotCapacity(),used:knuthSlotsUsed(),ids:[...knuthEquippedUpgradeIds],cap:percentPowerEffectiveLimit()};
    abandonKnuthChallenge();return {during,after:knuthSlotCapacity(),level:knuthOperationLevel};
  `), {during:{slots:2,used:1,ids:['percent_cap_200'],cap:200},after:6,level:6});
});

test('black-hole mass, settings, upgrades and accumulated time freeze without erasing any progress', () => {
  const row=run(game(), `
    completedKnuthChallengeIds.add('kc4');numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    numberBlackHoleAccumulatedGameSeconds=100;numberBlackHoleAutoUpgradeEnabled=true;numberBlackHoleAutoMaxEnabled=true;
    singularityPoints=10;knuthPoints=1e10;setBaseNumber(1000);
    const accelerated=numberBlackHoleTimeMultiplier()>1;
    const snapshot=()=>JSON.stringify([getBaseNumber(),numberBlackHoleTotalInvested,numberBlackHoleAccumulatedGameSeconds,
      numberBlackHoleDonationPercent,numberBlackHoleDonationRate,numberBlackHoleDonationAmountLevel,
      numberBlackHoleDonationSpeedLevel,numberBlackHoleSystemEnabled,singularityPoints]);
    const before=snapshot();activeKnuthChallengeId='kc5';
    const blocked=[advanceNumberBlackHole(10000),applyNumberBlackHoleDonations(10),advanceNumberBlackHoleAutomation(10000),
      buyNumberBlackHoleUpgrade('amount'),buyNumberBlackHoleUpgrade('speed'),setNumberBlackHoleSetting('amount',100),
      setNumberBlackHoleResource('number'),toggleNumberBlackHoleSystem(),purchaseSingularity(),buySingularityUpgrade('black_hole')];
    renderNumberBlackHoleBoard();
    return {accelerated,blocked,unchanged:before===snapshot(),multiplier:numberBlackHoleTimeMultiplier(),
      tick:gameTick(1000),status:numberBlackHoleStatus.textContent,inputDisabled:numberBlackHoleAmountInput.disabled,
      autoDisabled:numberBlackHoleAutoUpgradeToggle.disabled};
  `);
  assert.equal(row.accelerated,true);
  assert.deepEqual(row.blocked,Array(10).fill(false));
  assert.equal(row.unchanged,true);
  assert.equal(row.multiplier,1);
  assert.equal(row.tick,1000);
  assert.equal(row.status,'KC5 · 비활성');
  assert.equal(row.inputDisabled,true);
  assert.equal(row.autoDisabled,true);
});

test('new automatic controls unlock only on KC5 completion and persist per known upgrade', () => {
  assert.deepEqual(run(game(), `
    const blocked=toggleKnuthBaseAutomation('cp_gain');completedKnuthChallengeIds.add('kc5');
    const toggle=toggleKnuthBaseAutomation('cp_gain');toggleKnuthBaseAutomation('operation');
    const invalid=toggleKnuthBaseAutomation('missing');saveGame();const saved=localStorage.getItem(SAVE_KEY);
    loadKnuthBaseAutomation(null);loadGame(saved,{countAsLoad:false});
    const restored={...knuthBaseAutoEnabled};
    const old=JSON.parse(saved);delete old.knuthBaseAutoEnabled;loadGame(JSON.stringify(old),{countAsLoad:false});
    return {blocked,toggle,invalid,cp:restored.cp_gain,operation:restored.operation,
      oldOff:Object.values(knuthBaseAutoEnabled).every(v=>v===false),errors};
  `), {blocked:false,toggle:true,invalid:false,cp:true,operation:true,oldOff:true,errors:[]});
});

test('automatic purchases repeat when enabled, stop when off and buy single upgrades only once', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc5');knuthPoints=1e12;knuthBaseAutoEnabled.cp_gain=true;
    const first=advanceKnuthBaseAutomation(250);const second=advanceKnuthBaseAutomation(250);
    toggleKnuthBaseAutomation('cp_gain');const off=advanceKnuthBaseAutomation(10000);
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,u.group===1?1:0])));
    knuthBaseAutoEnabled.number_black_hole=true;
    const single=advanceKnuthBaseAutomation(250);const again=advanceKnuthBaseAutomation(250);
    return {first,second,off,single,again,count:knuthBaseUpgradeLevel('number_black_hole')};
  `), {first:true,second:true,off:false,single:true,again:false,count:1});
});

test('huge acceleration remains bounded, respects 3-4 and never starves later enabled upgrades', () => {
  const row=run(game(), `
    completedKnuthChallengeIds.add('kc5');knuthPoints=NumberMath.fromString('1e1000000');
    knuthBaseAutoEnabled.cp_gain=true;knuthBaseAutoEnabled.sp_gain=true;knuthBaseAutoEnabled.operation=true;
    gameTick=()=>1e100;let renders=0;render=()=>renders++;
    advanceKnuthBaseAutomation(1000);
    const single=knuthBaseUpgradeLevel('cp_gain')+knuthBaseUpgradeLevel('sp_gain')+knuthOperationLevel;
    generalizationResearchState['3-4']=true;advanceKnuthBaseAutomation(1000);
    const counts=[knuthBaseUpgradeLevel('cp_gain'),knuthBaseUpgradeLevel('sp_gain'),knuthOperationLevel];
    const before=JSON.stringify(counts);activeKnuthChallengeId='kc5';const paused=advanceKnuthBaseAutomation(1000);
    return {single,total:counts.reduce((a,b)=>a+b,0),all:counts.every(v=>v>0),renders,paused,
      same:before===JSON.stringify([knuthBaseUpgradeLevel('cp_gain'),knuthBaseUpgradeLevel('sp_gain'),knuthOperationLevel])};
  `);
  assert.deepEqual(row,{single:1,total:65,all:true,renders:0,paused:false,same:true});
});

test('automatic purchases obey a wall-clock work budget and keep unlock gates', () => {
  const row=run(game(), `
    completedKnuthChallengeIds.add('kc5');generalizationResearchState['3-4']=true;
    knuthPoints=NumberMath.fromString('1e10000');knuthBaseAutoEnabled.cp_gain=true;
    gameTick=()=>1e100;let calls=0;gameClockNowMs=()=>calls++;
    advanceKnuthBaseAutomation(1000);const count=knuthBaseUpgradeLevel('cp_gain');
    knuthBaseAutoEnabled.cp_gain=false;knuthBaseAutoEnabled.dyson_limit=true;
    const locked=!advanceKnuthBaseAutomation(1000);
    return {count,calls,locked};
  `);
  assert.ok(row.count>0&&row.count<=4,JSON.stringify(row));
  assert.ok(row.calls<20,JSON.stringify(row));
  assert.equal(row.locked,true);
});

test('the existing chapter timer advances basic automation even before square time is available', () => {
  const ctx=uiGame();
  run(ctx, `completedKnuthChallengeIds.add('kc5');knuthPoints=1000;knuthBaseAutoEnabled.cp_gain=true;`);
  ctx.advance(250);
  const timer=ctx.intervals.find(item=>item.fn.toString().includes('advanceKnuthBaseAutomation'));
  assert.ok(timer);
  timer.fn();
  assert.deepEqual(run(ctx, `return {count:knuthBaseUpgradeLevel('cp_gain'),kp:plain(knuthPoints),squareTime:plain(squareRunGameSeconds)};`),
    {count:1,kp:996,squareTime:0});
});

test('N supports knuth purchases, get properties, skip/wait, single purchases and lane rejection', () => {
  assert.deepEqual(run(game(), String.raw`
    knuthPoints=1e12;const blocked=executeN('buy knuth cp_gain');
    const before=knuthBaseUpgradeLevel('cp_gain');const wait=!executeN('buy knuth cp_gain s');
    completedKnuthChallengeIds.add('kc5');
    const bought=executeN('if get.knuth.cp_gain.available {\n buy knuth cp_gain\n}\nbuy knuth operation');
    const get=(id,key)=>automatiumGameAdapter.get([{name:'knuth',index:null},{name:id,index:null},{name:key,index:null}],{});
    const stats=[plain(get('cp_gain','upgraded')),plain(get('cp_gain','amount')),plain(get('cp_gain','cost')),
      plain(get('cp_gain','max')),get('cp_gain','available'),plain(get('operation','amount'))];
    let badId=false,badLane=false;
    try {executeN('buy knuth missing');}catch{badId=true;}
    try {executeN('buy knuth cp_gain[2]');}catch{badLane=true;}
    activeKnuthChallengeId='kc5';const paused=!get('cp_gain','available');
    executeN('buy knuth cp_gain');return {blocked,before,wait,bought,stats,badId,badLane,paused,level:knuthBaseUpgradeLevel('cp_gain')};
  `), {blocked:true,before:0,wait:true,bought:true,stats:[1,1,80,0,true,1],badId:true,badLane:true,paused:true,level:1});
});

test('N bulk purchasing and group gates use the same tiered KP costs as the UI', () => {
  const row=run(game(), `
    completedKnuthChallengeIds.add('kc5');generalizationResearchState['3-4']=true;
    knuthPoints=NumberMath.fromString('1e4000');executeN('buy knuth dyson_limit');
    const locked=knuthBaseUpgradeLevel('dyson_limit')===0;
    executeN('buy knuth cp_gain');const repeat=knuthBaseUpgradeLevel('cp_gain');
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,1])));
    knuthBaseUpgradeLevels.number_black_hole=0;executeN('buy knuth number_black_hole');
    const single=knuthBaseUpgradeLevel('number_black_hole');
    return {locked,repeat,single};
  `);
  assert.equal(row.locked,true);
  assert.ok(row.repeat>1);
  assert.equal(row.single,1);
});

test('KC5 saved and normal states restore capacity before trimming instead of using the previous challenge', () => {
  assert.deepEqual(run(game(), `
    knuthOperationLevel=6;knuthEquippedUpgradeIds.add('percent_cap_200');knuthEquippedUpgradeIds.add('percent_overflow');
    saveGame();const normal=localStorage.getItem(SAVE_KEY);startKnuthChallenge('kc5');saveGame();
    const challenged=localStorage.getItem(SAVE_KEY);
    loadGame(normal,{countAsLoad:false});
    const restoredNormal={slots:knuthSlotCapacity(),used:knuthSlotsUsed(),active:activeKnuthChallengeId};
    loadGame(challenged,{countAsLoad:false});
    return {restoredNormal,challenge:{slots:knuthSlotCapacity(),used:knuthSlotsUsed(),active:activeKnuthChallengeId},errors};
  `), {restoredNormal:{slots:6,used:3,active:null},challenge:{slots:2,used:1,active:'kc5'},errors:[]});
});

test('KC5 reward exposes populated groups 4-6 with prior-group locks and auto toggles', () => {
  const ctx=uiGame();
  assert.deepEqual(run(ctx, `
    renderKnuthBaseUpgrades();const before=knuthBaseUpgradeUi.get('cp_gain').autoControl.classList.contains('hidden');
    completedKnuthChallengeIds.add('kc5');renderKnuthBaseUpgrades();renderKnuthBoard();
    const ui=knuthBaseUpgradeUi.get('cp_gain');ui.autoToggle.events.click();
    return {before,after:ui.autoControl.classList.contains('hidden'),enabled:!ui.autoToggle.disabled,
      toggled:knuthBaseAutoEnabled.cp_gain,groups:[...knuthBaseGroupUi.keys()],populated:[4,5,6].every(g=>
        KNUTH_BASE_UPGRADES.some(u=>u.group===g)&&knuthBaseGroupUi.get(g).textContent.startsWith('잠김')),
      operation:!knuthOperationAutoControl.classList.contains('hidden')};
  `),{before:true,after:false,enabled:true,toggled:true,groups:[1,2,3,4,5,6],populated:true,operation:true});
});

test('auto cards toggle highlights and pressed state without buying or changing stored settings', () => {
  assert.deepEqual(run(uiGame(), `
    completedKnuthChallengeIds.add('kc5');knuthPoints=1000;renderKnuthBaseUpgrades();
    const ui=knuthBaseUpgradeUi.get('cp_gain');const attributes={};
    ui.autoToggle.setAttribute=(name,value)=>{attributes[name]=value;};
    renderKnuthBaseUpgrades();const off=[ui.autoToggle.classList.contains('on'),attributes['aria-pressed']];
    ui.autoToggle.events.click();renderKnuthBaseUpgrades();
    const on=[ui.autoToggle.classList.contains('on'),attributes['aria-pressed']];
    saveGame();const saved=localStorage.getItem(SAVE_KEY);
    ui.autoToggle.events.click();renderKnuthBaseUpgrades();
    const offAgain=!ui.autoToggle.classList.contains('on');
    loadGame(saved,{countAsLoad:false});renderKnuthBaseUpgrades();
    activeKnuthChallengeId='kc5';renderKnuthBaseUpgrades();
    return {type:ui.autoToggle.type,label:ui.autoToggle.textContent,off,on,offAgain,
      restored:ui.autoToggle.classList.contains('on'),disabled:ui.autoToggle.disabled,
      purchased:knuthBaseUpgradeLevel('cp_gain'),kp:plain(knuthPoints),errors};
  `),{type:'button',label:'자동',off:[false,'false'],on:[true,'true'],offAgain:true,
    restored:true,disabled:true,purchased:0,kp:1000,errors:[]});
});

test('operation automation uses the same auto-card click and highlight behavior', () => {
  assert.deepEqual(run(uiGame(), `
    completedKnuthChallengeIds.add('kc5');const attributes={};
    knuthOperationAutoToggle.setAttribute=(name,value)=>{attributes[name]=value;};
    knuthOperationAutoToggle.events.click();
    renderKnuthBaseAutoControl(knuthOperationAutoControl,knuthOperationAutoToggle,'operation');
    return {enabled:knuthBaseAutoEnabled.operation,highlight:knuthOperationAutoToggle.classList.contains('on'),
      pressed:attributes['aria-pressed'],level:knuthOperationLevel};
  `),{enabled:true,highlight:true,pressed:'true',level:0});
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html, /<button id="knuthOperationAutoToggle"[^>]*aria-pressed="false">자동<\/button>/);
  assert.doesNotMatch(html, /<input id="knuthOperationAutoToggle"/);
});

test('KC5 developer completion/removal and completed-card controls use the existing debug-only behavior', () => {
  const ctx=uiGame();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    devConsole.visible=true;document.body.classList.add('dev-console-open');renderKnuthChallenges();
    const enabled=!knuthChallengeKc5Btn.disabled;
    const event={type:'click',shiftKey:true,target:{closest:()=>knuthChallengeKc5Btn},preventDefault(){},stopImmediatePropagation(){}};
    handleDevChallengePointer(event);const unlocked=knuthBaseAutomationUnlocked();
    event.type='contextmenu';handleDevChallengePointer(event);
    return {enabled,unlocked,removed:!knuthBaseAutomationUnlocked()};
  `),{enabled:true,unlocked:true,removed:true});
});

test('N help, ID list and contextual completions expose all basic Knuth upgrades', () => {
  const ctx=game();
  const source=fs.readFileSync(path.join(__dirname,'../scripts/systems/automatium.js'),'utf8');
  ctx.loadSource(source.slice(source.indexOf('function automatiumUpgradeIdRows('),source.indexOf('function renderAutomatiumUpgradeIds(')));
  ctx.loadSource(source.slice(source.indexOf('function nAutocompleteUpgradeRows('),source.indexOf('function hideAutomatiumAutocomplete(')));
  const row=run(ctx, `
    const suggestions=value=>{automatiumSource.value=value;automatiumSource.selectionStart=value.length;return nAutocompleteContext().items.map(item=>item.label);};
    return {buy:suggestions('buy knuth cp'),get:suggestions('if get.knuth.cp_gain.'),
      ids:automatiumUpgradeIdRows().filter(row=>row.kind==='knuth').map(row=>row.id)};
  `);
  assert.deepEqual(row.buy,['cp_gain']);
  assert.deepEqual(row.get,['upgraded','amount','cost','max','available']);
  assert.equal(row.ids.length,25);
  assert.ok(row.ids.includes('operation')&&row.ids.includes('theory_exchange'));
  assert.match(source, /기본 커누스 업그레이드 · KC5 보상/);
});
