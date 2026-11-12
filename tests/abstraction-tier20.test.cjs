const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx = game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.probabilizer=1;knuthBaseUpgradeLevels.late_abstraction=1;
    greatTheory=10000;randomPower=2500000000;`);
  return ctx;
}
const close = (value, expected) => assert.ok(Math.abs(value / expected - 1) < 1e-10, `${value} != ${expected}`);

test('20-1 costs 1200, needs at least 2.5b random power, and accepts either exclusive parent', () => {
  for (const parent of ['19-1', '19-2']) {
    const r = run(ready(), `
      const definition=abstractionResearchDefinitions.get('20-1');
      const missingParent=!canResearchAbstraction('20-1');
      abstractionResearchState[${JSON.stringify(parent)}]=true;
      randomPower=2499999999;const below=!canResearchAbstraction('20-1')&&!researchAbstraction('20-1');
      randomPower=2500000000;greatTheory=1199;const short=!canResearchAbstraction('20-1');
      greatTheory=1200;const bought=researchAbstraction('20-1');
      return {parents:definition.parents,cost:definition.greatTheoryCost,condition:definition.randomPowerRequirement,
        missingParent,below,short,bought,left:plain(greatTheory),power:plain(randomPower),paid:abstractionResearchPaidCosts['20-1']};
    `);
    assert.deepEqual(r, {parents:['19-1','19-2'],cost:1200,condition:2500000000,missingParent:true,
      below:true,short:true,bought:true,left:0,power:2500000000,paid:1200});
  }
});

test('ancestor purchases preflight the power condition, funds and tier without partial purchases', () => {
  assert.deepEqual(run(ready(), `
    randomPower=2499999999;
    const before=JSON.stringify(abstractionResearchState),funds=greatTheory;
    const below=researchPurchasePlan('abstraction','20-1')===null&&!purchaseResearchWithParents('abstraction','20-1');
    const unchanged=before===JSON.stringify(abstractionResearchState)&&funds===greatTheory;
    randomPower=2500000000;knuthBaseUpgradeLevels.late_abstraction=0;
    const locked=researchPurchasePlan('abstraction','20-1')===null;
    knuthBaseUpgradeLevels.late_abstraction=1;const plan=researchPurchasePlan('abstraction','20-1');
    greatTheory=subtractNumberValues(plan.cost,1);const short=!purchaseResearchWithParents('abstraction','20-1');
    const unspent=before===JSON.stringify(abstractionResearchState);
    greatTheory=plan.cost;const bought=purchaseResearchWithParents('abstraction','20-1');
    return {below,unchanged,locked,short,unspent,bought,left:plain(greatTheory),
      parentCount:['19-1','19-2'].filter(hasAbstractionResearch).length,owned:hasAbstractionResearch('20-1')};
  `), {below:true,unchanged:true,locked:true,short:true,unspent:true,bought:true,left:0,parentCount:1,owned:true});
});

test('presets reject insufficient random power atomically and purchase at the exact threshold', () => {
  assert.deepEqual(run(ready(), `
    const plan=researchPurchasePlan('abstraction','20-1');
    abstractionResearchPresets[0]={name:'20-1',ids:plan.ids};greatTheory=plan.cost;
    randomPower=2499999999;
    const rejected=Boolean(abstractionPresetPurchasePlan(0).error)&&!loadAbstractionResearchPreset(0);
    const unchanged=compareNumberValues(greatTheory,plan.cost)===0&&!ABSTRACTION_RESEARCHES.some(r=>hasPurchasedAbstractionResearch(r.id));
    randomPower=2500000000;const loaded=loadAbstractionResearchPreset(0);
    return {rejected,unchanged,loaded,owned:hasAbstractionResearch('20-1'),left:plain(greatTheory),power:plain(randomPower)};
  `), {rejected:true,unchanged:true,loaded:true,owned:true,left:0,power:2500000000});
});

test('research doubles the a/b effect and quadruples only the additional time-limit lift at 2.5b', () => {
  const r=run(ready(), `
    generalizationResearchState['3-2']=true;divergerA=10;divergerB=3;divergerN=10;
    const base={multiplier:probabilizerDivergerParameterMultiplier(),limit:numberBlackHoleTimeLimit(),
      a:abstractionEffectiveDivergerA(),b:abstractionEffectiveDivergerB(),d:divergerProductionValue()};
    const raw=JSON.stringify([divergerA,divergerB,divergerN,probabilizerUpgradeLevels]);
    abstractionResearchState['19-1']=true;const bought=researchAbstraction('20-1');
    return {bought,boost:plain(abstractionProbabilizerMultiplier()),
      ratio:plain(NumberMath.divideApproximate(probabilizerDivergerParameterMultiplier(),base.multiplier)),
      aRatio:plain(NumberMath.divideApproximate(abstractionEffectiveDivergerA(),base.a)),
      bRatio:abstractionEffectiveDivergerB()/base.b,
      liftRatio:(numberBlackHoleTimeLimit()/NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER-1)/(base.limit/NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER-1),
      refreshed:compareNumberValues(divergerPower,divergerProductionValue())===0,
      stronger:compareNumberValues(divergerPower,base.d)>0,
      rawSame:raw===JSON.stringify([divergerA,divergerB,divergerN,probabilizerUpgradeLevels])};
  `);
  close(r.boost,2);close(r.ratio,2);close(r.aRatio,2);close(r.bRatio,2);close(r.liftRatio,4);
  assert.ok(r.bought&&r.refreshed&&r.stronger&&r.rawSame);
});

test('zero power, unavailable probabilizer and KC5 keep neutral effects even with the research', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['20-1']=true;const rows=[];
    for(const mode of ['zero','locked','kc5']){
      randomPower=mode==='zero'?0:2500000000;knuthBaseUpgradeLevels.probabilizer=mode==='locked'?0:1;
      activeKnuthChallengeId=mode==='kc5'?'kc5':null;
      rows.push([plain(abstractionProbabilizerMultiplier()),plain(probabilizerDivergerParameterMultiplier()),numberBlackHoleTimeLimit()]);
    }
    return rows;
  `), [[1,1,1e100],[1,1,1e100],[1,1,1e100]]);
});

test('logarithmic amplification stays monotonic and finite for layered random power', () => {
  const r=run(ready(), `
    abstractionResearchState['20-1']=true;generalizationResearchState['3-2']=true;
    const rows=[];
    for(const value of ['0','2500000000','25000000000','1e1000','1e1e100']){
      randomPower=NumberMath.fromString(value);
      rows.push({boost:NumberMath.serialize(abstractionProbabilizerMultiplier()),
        multiplier:NumberMath.serialize(probabilizerDivergerParameterMultiplier()),limit:numberBlackHoleTimeLimit(),
        b:abstractionEffectiveDivergerB(),d:NumberMath.serialize(divergerProductionValue())});
    }
    return {monotonic:rows.every((row,i)=>i===0||compareNumberValues(row.boost,rows[i-1].boost)>0),rows,errors};
  `);
  assert.ok(r.monotonic);assert.doesNotMatch(JSON.stringify(r),/NaN|Infinity|undefined/);
  assert.ok(r.rows.every(row=>row.limit>=1e100&&row.limit<=Number.MAX_VALUE/1e12&&row.b>0));
  assert.deepEqual(r.errors,[]);
});

test('legacy saves default to no research; bought state, paid cost and effects survive load and refund', () => {
  assert.deepEqual(run(ready(), `
    loadAbstractionResearchState({'19-1':true});const legacy=!hasAbstractionResearch('20-1');
    greatTheory=1200;researchAbstraction('20-1');const before=NumberMath.serialize(probabilizerDivergerParameterMultiplier());
    const saved=captureGameSaveData();abstractionResearchState['20-1']=false;randomPower=0;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const owned=hasAbstractionResearch('20-1'),paid=abstractionResearchPaidCosts['20-1'];
    const same=NumberMath.serialize(probabilizerDivergerParameterMultiplier())===before;
    resetProgressForNewKnuthRun();const retained=hasAbstractionResearch('20-1');
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {legacy,loaded,owned,paid,same,retained,removed:!hasAbstractionResearch('20-1'),refund:plain(greatTheory),errors};
  `), {legacy:true,loaded:true,owned:true,paid:1200,same:true,retained:true,removed:true,refund:1700,errors:[]});
});

test('console force purchase and cancellation immediately refresh current divergence without changing power', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    generalizationResearchState['3-2']=true;divergerA=10;divergerB=3;divergerN=10;
    const before=divergerProductionValue();
    const bought=forceUnlockDevUpgrade('abstraction','20-1');
    const boosted=compareNumberValues(divergerPower,before)>0&&compareNumberValues(divergerPower,divergerProductionValue())===0;
    const removed=removeDevUpgrade('abstraction','20-1');
    return {bought,boosted,removed,restored:compareNumberValues(divergerPower,before)===0,power:plain(randomPower)};
  `), {bought:true,boosted:true,removed:true,restored:true,power:2500000000});
});

test('card shows the resource condition and only unlocks normal purchasing when it is met', () => {
  assert.deepEqual(run(ready(), `
    renderAbstractionTreeLayout=()=>{};renderAbstractionPresetBoard=()=>{};renderGreatTheoryResourceSelector=()=>{};
    abstractionResearchState['19-2']=true;randomPower=2499999999;renderAbstractionBoard();
    const ui=abstractionResearchUi['20-1'];
    const below=ui.button.disabled&&ui.node.classList.contains('locked');
    const condition=ui.parents.textContent.includes('무작위력 2.5b 이상');
    randomPower=2500000000;renderAbstractionBoard();
    return {below,condition,ready:!ui.button.disabled&&!ui.node.classList.contains('locked'),
      price:ui.button.textContent.includes('1.2k 대이론')};
  `), {below:true,condition:true,ready:true,price:true});
});
