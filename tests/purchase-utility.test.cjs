const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx = game(true), timers = new Map();
  let nextTimer = 0;
  ctx.setTimeout = callback => { const id = ++nextTimer; timers.set(id, callback); return id; };
  ctx.clearTimeout = id => timers.delete(id);
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/systems/purchase-utility.js'), 'utf8'));
  ctx.loadSource(`function clickMaximum(button, shiftKey=true){
    const event={target:{closest:()=>button},shiftKey,button:0,isTrusted:true,defaultPrevented:false,stopped:false,
      preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;}};
    handleMaximumPurchaseClick(event);return event;
  }`);
  ctx.drain = () => {
    for (let turns = 0; timers.size; turns++) {
      assert.ok(turns < 10000, 'maximum purchase must terminate');
      const [id, callback] = timers.entries().next().value;
      timers.delete(id); callback();
    }
  };
  return ctx;
}

test('Shift purchases to affordability without 3-4; ordinary clicks and one-shot/navigation/equipment keep their handlers', () => {
  const ctx = ready();
  assert.deepEqual(run(ctx, `setBaseNumber(10000);
    const button=document.getElementById('upgradeClickBtn');
    const normal=clickMaximum(button,false),before=perClick;
    const shifted=clickMaximum(button);
    return {normal:normal.stopped,before,shifted:shifted.stopped,manual:achievementRunProgress.manualGameplay};`),
  { normal: false, before: 1, shifted: true, manual: true });
  ctx.drain();
  assert.deepEqual(run(ctx, `return {level:perClick,blocked:!upgradePerClick(),research:hasGeneralizationResearch('3-4'),
    remaining:plain(getBaseNumber()),untouched:['autoClickerBtn','manualSquareExchangeBtn','knuthResetEquipmentToggle'].every(id=>
      !clickMaximum(document.getElementById(id)).stopped)};`),
  { level: 7, blocked: true, research: false, remaining: 6360, untouched: true });
});

test('sequential max matches ordinary purchases for each base repeatable button, including caps and lane unlocks', () => {
  const cases = [
    ['upgradeClickBtn','upgradePerClick','perClick'],
    ['autoClickerSpeedBtn','upgradeAutoClickerSpeed','autoClickerSpeed'],
    ['autoClickerParallelBtn','upgradeAutoClickerParallel','autoClickerParallel'],
    ['upgradeChargeBtn','upgradePercentCharge','percentChargeNeeded'],
    ['percentAutoSpeedBtn','upgradePercentAutoSpeed','percentAutoSpeed'],
    ['percentParallelUnlockBtn','unlockNextPercentLane','percentLaneCount']
  ];
  for (const [id, buy, value] of cases) {
    const actual=ready(), reference=ready();
    const setup=`setBaseNumber(1e12);percentUnlocked=true;autoClickerUnlocked=true;percentAutoUnlocked=true;`;
    actual.loadSource(setup);reference.loadSource(setup);
    run(actual, `clickMaximum(document.getElementById('${id}'));`);actual.drain();
    const expected=run(reference,`for(let i=0;i<1000&&${buy}();i++);return {value:${value},balance:NumberMath.serialize(getBaseNumber())};`);
    assert.deepEqual(run(actual,`return {value:${value},balance:NumberMath.serialize(getBaseNumber())};`),expected,id);
  }
});

test('large jobs yield, exceed 1024 purchases, and cannot spend income earned after the click', () => {
  const ctx=ready();
  const first=run(ctx,`setBaseNumber(2000);globalThis.purchased=0;
    const button=document.createElement('button');
    registerMaximumPurchase(button,maximumPurchaseAction('number',()=>1,()=>{
      if(!canAffordBaseCost(1))return false;spendBaseCost(1);purchased++;return true;
    }));clickMaximum(button);return {purchased,active:!!activeMaximumPurchase};`);
  assert.deepEqual(first,{purchased:128,active:true});
  run(ctx,'setBaseNumber(addBaseNumbers(getBaseNumber(),10000));');ctx.drain();
  assert.deepEqual(run(ctx,'return {purchased,balance:plain(getBaseNumber()),active:!!activeMaximumPurchase};'),
    {purchased:2000,balance:10000,active:false});
});

test('deadline yields independently of the operation cap and repeat clicks replace rather than multiply jobs', () => {
  const ctx=ready();
  assert.deepEqual(run(ctx,`setBaseNumber(1000);globalThis.purchased=0;
    const button=document.createElement('button');
    registerMaximumPurchase(button,maximumPurchaseAction('number',()=>1,()=>{spendBaseCost(1);purchased++;clock.advance(4);return true;}));
    clickMaximum(button);const first=purchased;clickMaximum(button);return {first,second:purchased};`),{first:3,second:6});
  ctx.drain();assert.equal(run(ctx,'return purchased;'),1000);
});

test('another click, detached button, pause, load and prestige cancel deferred purchases', () => {
  for (const action of ['click','detach','pause','load','square','knuth']) {
    const ctx=ready();
    run(ctx,`setBaseNumber(1000);globalThis.purchased=0;globalThis.button=document.createElement('button');
      registerMaximumPurchase(button,maximumPurchaseAction('number',()=>1,()=>{spendBaseCost(1);purchased++;return true;}));
      clickMaximum(button);`);
    run(ctx, action==='click' ? "clickMaximum(document.getElementById('addBtn'),false);"
      : action==='detach' ? 'button.isConnected=false;'
      : action==='pause' ? 'gameSessionPaused=()=>true;'
      : action==='load' ? 'loadGame(JSON.stringify(captureGameSaveData()),{persistOverride:false,countAsLoad:false});'
      : action==='square' ? 'resetRunStateAfterSquarePrestige();' : 'resetProgressForNewKnuthRun();');
    ctx.drain();assert.equal(run(ctx,'return purchased;'),128,action);
  }
});

test('CP/KP/SP purchase families use real costs and guards including challenges and maximum levels', () => {
  const cases=[
    ['divergerAUpgradeBtn',`generalizationResearchState['3-2']=true;squareConvergencePoints=10000;`,'divergerALevel','buyDivergerAUpgrade()'],
    ['divergerBUpgradeBtn',`generalizationResearchState['3-2']=true;squareConvergencePoints=10000;`,'divergerBLevel','buyDivergerBUpgrade()'],
    ['divergerCUpgradeBtn',`generalizationResearchState['3-2']=true;squareConvergencePoints=NumberMath.fromString('1e40');`,'divergerCLevel','buyDivergerCUpgrade()'],
    ['divergerSpeedUpgradeBtn',`generalizationResearchState['3-2']=true;squareConvergencePoints=NumberMath.fromString('1e200');`,'divergerSpeedLevel','buyDivergerSpeedUpgrade()'],
    ['knuthOperationUpgradeBtn','knuthPoints=1e10;','knuthOperationLevel','buyKnuthOperationUpgrade()'],
    ['numberBlackHoleAmountUpgradeBtn','knuthPoints=10000;','numberBlackHoleDonationAmountLevel',"buyNumberBlackHoleUpgrade('amount')"],
    ['numberBlackHoleSpeedUpgradeBtn','knuthPoints=10000;','numberBlackHoleDonationSpeedLevel',"buyNumberBlackHoleUpgrade('speed')"],
    ['singularityBlackHoleUpgradeBtn','singularityPoints=1000;',"plain(singularityUpgradeLevels.black_hole)","buySingularityUpgrade('black_hole')"],
    ['singularityKpUpgradeBtn','singularityPoints=1000;',"plain(singularityUpgradeLevels.kp_gain)","buySingularityUpgrade('kp_gain')"],
    ['squareDimensionPowerTimeBtn',"generalizationResearchState['3-1']=true;squarePoints=1e30;",'squareDimensionState(0).powerInterval','buySquareDimensionPowerTimeUpgrade()']
  ];
  for(const [id,setup,value,buy] of cases){
    const actual=ready(),reference=ready();actual.loadSource(setup);reference.loadSource(setup);
    run(actual,`clickMaximum(document.getElementById('${id}'));`);actual.drain();
    const expected=run(reference,`for(let i=0;i<1000&&${buy};i++);return ${value};`);
    assert.ok(expected>0,id);assert.equal(run(actual,`return ${value};`),expected,id);
  }
  const ctx=ready();
  assert.equal(run(ctx,`activeKnuthChallengeId='kc5';knuthPoints=1e12;
    clickMaximum(document.getElementById('numberBlackHoleSpeedUpgradeBtn'));return numberBlackHoleDonationSpeedLevel;`),0);
});

test('theory, grand theory and dimension sides reuse existing exact maximum purchases', () => {
  for (const [id,setup,value,buy] of [
    ['researchTheoryBtn',"squareConvergenceUnlocked=true;squarePoints=1e100;",'plain(theory)','researchTheoryMaximum()'],
    ['buyGreatTheoryBtn',"squareConvergenceUnlocked=true;knuthPoints=1e15;abstractionCostResourceIndex=1;",'plain(greatTheory)','purchaseGreatTheory(greatTheoryMaximumPurchases())'],
    ['squareDimensionXBtn',"generalizationResearchState['3-1']=true;squarePoints=1e30;",'plain(squareDimensionState(0).xGrowthLevel)',"buySquareDimensionSideMaximum('x')"]
  ]) {
    const actual=ready(),reference=ready();actual.loadSource(setup);reference.loadSource(setup);
    run(actual,`clickMaximum(document.getElementById('${id}'));`);actual.drain();run(reference,`${buy};`);
    assert.equal(run(actual,`return ${value};`),run(reference,`return ${value};`),id);
    assert.ok(run(actual,`return ${value};`)>1,id);
  }
});

test('dynamic base, breakthrough and convergence buttons max only the selected upgrade', () => {
  for(const [dataset,setup,value] of [
    [{knuthBaseUpgrade:'cp_gain'},'knuthPoints=1e10;','knuthBaseUpgradeLevels.cp_gain'],
    [{devUpgradeKind:'square_breakthrough',devUpgradeId:'dyson_swarm'},'squarePoints=1e30;',"squareBreakthroughLevel('dyson_swarm')"],
    [{devUpgradeKind:'square_convergence',devUpgradeId:'cp_gain_5x'},'squareConvergencePoints=1e30;',"squareConvergenceUpgradeLevel('cp_gain_5x')"]
  ]){
    const ctx=ready();
    run(ctx,`${setup}const button=document.createElement('button');Object.assign(button.dataset,${JSON.stringify(dataset)});clickMaximum(button);`);ctx.drain();
    assert.ok(run(ctx,`return ${value};`)>1);
  }
});

test('advanced purchase max divides KP per purchase, keeps slots unchanged and never equips', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  run(ctx,`knuthBaseUpgradeLevels.advanced_equipment=1;knuthPoints=NumberMath.fromString('1e10000');
    renderKnuthAdvancedEquipment();clickMaximum(knuthAdvancedUpgradeUi.get('kp_power').purchase.button);`);ctx.drain();
  assert.deepEqual(run(ctx,`return {owned:knuthAdvancedOwned.kp_power,equipped:knuthAdvancedEquipped.kp_power,
    balance:logValue(knuthPoints),cost:logValue(knuthAdvancedUpgradeCost('kp_power')),
    inventory:resolveMaximumPurchase(knuthAdvancedUpgradeUi.get('kp_power').inventory.button)};`),
  {owned:5,equipped:0,balance:1000,cost:3000,inventory:null});
});

test('probabilizer, random-power and mass max preserve prices and resource types', () => {
  for(const [id,setup,value,buy] of [
    ['probabilizerBUpgradeBtn',"knuthBaseUpgradeLevels.probabilizer=1;knuthPoints=NumberMath.fromString('1e320');",'probabilizerUpgradeLevels.b',"buyProbabilizerUpgrade('b')"],
    ['probabilizerPowerGainUpgradeBtn','knuthBaseUpgradeLevels.probabilizer=1;randomPower=1e20;','probabilizerPowerUpgradeLevels.gain',"buyProbabilizerPowerUpgrade('gain')"],
    ['spaceExpansionMassGainUpgradeBtn','knuthBaseUpgradeLevels.space_expansion=1;stagnantMassMg=1e15;',"plain(spaceExpansionUpgradeLevels.mass_gain)","buySpaceExpansionUpgrade('mass_gain')"]
  ]){
    const actual=ready(),reference=ready();actual.loadSource(setup);reference.loadSource(setup);
    run(actual,`clickMaximum(document.getElementById('${id}'));`);actual.drain();
    const expected=run(reference,`for(let i=0;i<1000&&${buy};i++);return ${value};`);
    assert.ok(expected>1,id);assert.equal(run(actual,`return ${value};`),expected,id);
  }
});

test('protected SP is reusable up to current funds, not treated as a consumed balance', () => {
  const ctx=ready();
  run(ctx,`generalizationResearchState['3-1']=true;abstractionResearchState['23-3']=true;
    abstractionPermanentSp=1e100;setSquarePoints(1e100);
    clickMaximum(document.getElementById('squareDimensionPowerTimeBtn'));`);ctx.drain();
  assert.equal(run(ctx,'return squareDimensionState(0).powerInterval;'),1);
  assert.equal(run(ctx,'return plain(squarePoints);'),1e100);
});

test('percent max uses the bounded bulk solver and matches sequential purchases', () => {
  const actual=ready(),reference=ready();
  const setup=`percentUnlocked=true;percentChargeNeeded=1;setBaseNumber(NumberMath.fromString('1e2000000'));
    generalizationResearchState['3-3']=true;percentPowerCostCompounding=true;percentPowerPurchaseCount=1000;
    percentPower=1001;percentPowerUpgradeCost=minimumPercentPowerCompoundingCost(1000);`;
  actual.loadSource(setup);reference.loadSource(setup);
  run(actual,"clickMaximum(document.getElementById('percentPowerBtn'));");actual.drain();
  const expected=run(reference,`for(let i=0;i<10000&&upgradePercentPower();i++);return {count:percentPowerPurchaseCount,balance:NumberMath.serialize(getBaseNumber())};`);
  assert.ok(expected.count>1000);
  assert.deepEqual(run(actual,'return {count:percentPowerPurchaseCount,balance:NumberMath.serialize(getBaseNumber())};'),expected);
});

test('percent batches honor a snapshot budget without deleting or spending later income', () => {
  const ctx=ready();
  const r=run(ctx,`percentUnlocked=true;percentChargeNeeded=1;generalizationResearchState['3-3']=true;
    percentPowerCostCompounding=true;percentPowerPurchaseCount=1000;percentPower=1001;
    percentPowerUpgradeCost=minimumPercentPowerCompoundingCost(1000);
    setBaseNumber(NumberMath.fromString('1e10000000'));
    const budget={remaining:NumberMath.fromString('1e2000000')};
    const result=buyPercentPowerBatch(Number.MAX_SAFE_INTEGER,null,Infinity,budget);
    return {purchased:result.purchased,balance:logValue(getBaseNumber()),budget:logValue(budget.remaining),
      blocked:compareNumberValues(budget.remaining,percentPowerCost(percentPowerUpgradeCost,percentPowerCostCompounding))<0};`);
  assert.ok(r.purchased>0);assert.equal(r.balance,10000000);assert.ok(r.budget<=2000000);assert.ok(r.blocked);
});

test('extra lane max targets only that lane, and removed lane objects cannot keep purchasing', () => {
  const ctx=ready();
  run(ctx,`percentUnlocked=true;percentChargeNeeded=1;percentLaneCount=2;
    globalThis.lane=makePercentLane(2);extraPercentLanes.push(lane);createExtraPercentLaneUI(lane);
    setBaseNumber(1e40);clickMaximum(lane.ui.powerBtn);`);ctx.drain();
  assert.deepEqual(run(ctx,`return {main:percentPowerPurchaseCount,extra:lane.powerPurchaseCount>1,
    blocked:!buyExtraLanePower(lane)};`),{main:0,extra:true,blocked:true});
  run(ctx,`setBaseNumber(NumberMath.fromString('1e100000000'));
    const action=percentMaximumPurchaseAction(lane);globalThis.originalBatch=action.batch;
    action.batch=(job,deadline)=>{clock.advance(20);return {purchased:1};};
    startMaximumPurchase(action,lane.ui.powerBtn);extraPercentLanes.length=0;`);
  ctx.drain();assert.equal(run(ctx,'return !!activeMaximumPurchase;'),false);
});

test('second dimension roles and preset slot purchases receive the same max utility', () => {
  const ctx=ready();
  run(ctx,`generalizationResearchState['3-1']=true;generalizationResearchState['4-2']=true;
    squarePoints=1e30;squareDimensionAdditional.contains=button=>button.dataset.role==='y-btn';
    const button=document.createElement('button');button.dataset.role='y-btn';clickMaximum(button);`);
  assert.ok(run(ctx,"return plain(squareDimensionState(1).yGrowthLevel);")>1);
  assert.equal(run(ctx,"return plain(squareDimensionState(0).yGrowthLevel);"),1);
  run(ctx,`knuthPoints=1e9;clickMaximum(document.getElementById('abstractionBuyPresetSlotBtn'));`);ctx.drain();
  assert.equal(run(ctx,'return abstractionResearchPresets.length;'),17);
  assert.equal(run(ctx,'return buyAbstractionPresetSlot();'),false);
});

test('the utility loads after developer capture handlers, before main, and adds no controls or save fields', () => {
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.ok(html.indexOf('scripts/systems/dev-console.js')<html.indexOf('scripts/systems/purchase-utility.js'));
  assert.ok(html.indexOf('scripts/systems/purchase-utility.js')<html.indexOf('scripts/main.js'));
  const ctx=ready();
  assert.equal(run(ctx,"return Object.keys(captureGameSaveData()).some(k=>/maximumPurchase/i.test(k));"),false);
});

test('an expired bulk deadline still makes bounded progress rather than scheduling empty jobs forever', () => {
  const ctx=ready();
  run(ctx,`setBaseNumber(3);globalThis.purchased=0;
    startMaximumPurchase(maximumPurchaseAction('number',()=>1,()=>{
      if(!canAffordBaseCost(1))return false;spendBaseCost(1);purchased++;return true;
    },{batch:()=>{clock.advance(20);return {purchased:0};}}));`);
  assert.equal(run(ctx,'return purchased;'),1);ctx.drain();
  assert.deepEqual(run(ctx,'return {purchased,balance:plain(getBaseNumber()),active:!!activeMaximumPurchase};'),
    {purchased:3,balance:0,active:false});
});
