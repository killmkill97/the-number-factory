const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

function ready() {
  const ctx=game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.late_abstraction=1;knuthBaseUpgradeLevels.probabilizer=1;
    completedKnuthChallengeIds.add('kc6');greatTheory=20000;`);
  return ctx;
}

test('29-1 costs 20k grand theory, requires 28-1 and is not automatically granted',()=>{
  assert.deepEqual(run(ready(),`
    const r=abstractionResearchDefinitions.get('29-1'),off=!independentUpgradePriceReferenceActive();
    const parent=!researchAbstraction('29-1');abstractionResearchState['28-1']=true;
    knuthBaseUpgradeLevels.late_abstraction=0;const locked=!researchAbstraction('29-1');
    knuthBaseUpgradeLevels.late_abstraction=1;greatTheory=19999;const poor=!researchAbstraction('29-1');
    greatTheory=20000;const bought=researchAbstraction('29-1');
    return {off,parent,locked,poor,bought,left:plain(greatTheory),parents:r.parents,cost:r.greatTheoryCost,
      column:r.column,paid:abstractionResearchPaidCosts['29-1'],twice:researchAbstraction('29-1')};
  `),{off:true,parent:true,locked:true,poor:true,bought:true,left:0,parents:['28-1'],cost:20000,column:29,paid:20000,twice:false});
});

test('unresearched group/slot/random prices match the original current-payment recurrence',()=>{
  const rows=run(ready(),`
    return [400,499,599].flatMap(start=>[1,2,3].map(n=>({start,n,
      base:logValue(knuthRepeatableCostAfterPurchases(NumberMath.powerOfTen(start),2,n)),
      slot:logValue(knuthOperationRewardCostAfterPurchases(NumberMath.powerOfTen(start),n))})));
  `);
  for(const r of rows){
    let base=r.start,slot=r.start;
    for(let i=0;i<r.n;i++){
      base+=Math.log10(16)*4**(1+Math.floor((base-400)/100));
      slot+=10*2**(1+Math.floor((slot-200)/100));
    }
    if(Number.isFinite(base))close(r.base,base);
    if(Number.isFinite(slot))close(r.slot,slot);
  }
  assert.deepEqual(run(ready(),`
    return [23,24].map(n=>{probabilizerUpgradeLevels.shift=n;return logValue(probabilizerUpgradeCost('shift'));});
  `),[980,21460]);
});

test('research immediately replaces warmed legacy prices in every cache, and cancel restores them without changing levels or KP',()=>{
  const r=run(ready(),`
    knuthOperationLevel=1000;knuthBaseUpgradeLevels.cp_gain=1000;probabilizerUpgradeLevels.shift=24;knuthPoints=123;
    const quote=()=>[knuthOperationUpgradeCost(),knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0]),probabilizerUpgradeCost('shift')];
    const legacy=quote();abstractionResearchState['28-1']=true;researchAbstraction('29-1');
    const separated=quote();abstractionResearchState['29-1']=false;const restored=quote();
    return {legacyNull:legacy.slice(0,2).every(v=>v===null),newPositive:separated.every(v=>v!==null&&isPositiveNumberValue(v)),
      lower:compareUpgradeCost(legacy[2],separated[2])>0,
      restored:JSON.stringify(legacy.map(serializeNumberValue))===JSON.stringify(restored.map(serializeNumberValue)),
      levels:[knuthOperationLevel,knuthBaseUpgradeLevels.cp_gain,probabilizerUpgradeLevels.shift],kp:plain(knuthPoints)};
  `);
  assert.deepEqual(r,{legacyNull:true,newPositive:true,lower:true,restored:true,levels:[1000,1000,24],kp:123});
});

test('current small-price behavior, one-shot costs and non-KP-upgrade prices do not change',()=>{
  assert.deepEqual(run(ready(),`
    const quote=()=>[knuthOperationLegacyCost(299),knuthRepeatableCostAfterPurchases(4,20,10),
      ...KNUTH_BASE_UPGRADES.filter(u=>!u.growth).map(knuthBaseUpgradeCost),
      spaceExpansionUpgradeCost('mass_gain'),probabilizerPowerUpgradeCost('diverger'),divergerACpCostAtLevel(10)];
    const before=quote().map(serializeNumberValue);abstractionResearchState['29-1']=true;
    return {same:JSON.stringify(before)===JSON.stringify(quote().map(serializeNumberValue))};
  `),{same:true});
});

test('save/load retains paid research and refunds 20k through the existing reset; missing old-save research stays disabled',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['28-1']=true;abstractionResearchPaidCosts['28-1']=0;researchAbstraction('29-1');
    knuthOperationLevel=310;const expected=serializeNumberValue(knuthOperationUpgradeCost()),saved=captureGameSaveData();
    abstractionResearchState['29-1']=false;knuthOperationUpgradeCost();
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=hasAbstractionResearch('29-1')&&serializeNumberValue(knuthOperationUpgradeCost())===expected;
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();const refund=plain(greatTheory);
    const reset=!independentUpgradePriceReferenceActive();
    delete saved.abstractionResearchState['29-1'];loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {restored,refund,reset,old:hasAbstractionResearch('29-1'),errors};
  `),{restored:true,refund:20000,reset:true,old:false,errors:[]});
});

test('debug purchase/cancel bypasses costs but switches prices immediately and leaves paid balances untouched',()=>{
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8'));
  assert.deepEqual(run(ctx,`
    probabilizerUpgradeLevels.shift=24;const old=logValue(probabilizerUpgradeCost('shift'));
    const bought=forceUnlockDevUpgrade('abstraction','29-1'),next=logValue(probabilizerUpgradeCost('shift'));
    removeDevUpgrade('abstraction','29-1');return {old,bought,next,restored:logValue(probabilizerUpgradeCost('shift')),gt:plain(greatTheory)};
  `),{old:21460,bought:true,next:820,restored:21460,gt:20000});
});

test('purchase plans and presets include the new research and keep all-or-nothing grand theory payment',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['28-1']=true;const plan=researchPurchasePlan('abstraction','29-1');
    greatTheory=19999;const poor=!purchaseResearchWithParents('abstraction','29-1'),empty=!hasAbstractionResearch('29-1');
    greatTheory=20000;const bought=purchaseResearchWithParents('abstraction','29-1');
    saveAbstractionResearchPreset(0);const contains=abstractionResearchPresets[0].ids.includes('29-1');
    return {ids:plan.ids,cost:plan.cost,poor,empty,bought,left:plain(greatTheory),contains};
  `),{ids:['29-1'],cost:20000,poor:true,empty:true,bought:true,left:0,contains:true});
});

test('cards show separated reference labels only while 29-1 is active and legacy null prices stay blocked',()=>{
  const ctx=ready();
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  ctx.loadSource('renderKnuthUpgradeGroups=()=>{};');
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  const r=run(ctx,`
    knuthOperationLevel=1000;abstractionResearchState['21-1']=true;probabilizerUpgradeLevels.b=250;initializeProbabilizerRangeProgress();
    const text=()=>{renderKnuthBoard();renderProbabilizerBoard();return [knuthOperationUpgradeCostText.textContent,
      document.getElementById('probabilizerBUpgradeCost').textContent];};
    const off=text(),blocked=knuthOperationUpgradeBtn.disabled;abstractionResearchState['29-1']=true;
    const on=text(),live=abstractionTimeResearchInfo('29-1');abstractionResearchState['29-1']=false;
    const restored=text();ensureAbstractionResearchUi(abstractionResearchDefinitions.get('29-1'));
    return {off,on,restored,blocked,live,node:!!abstractionResearchUi['29-1']};
  `);
  assert.ok(r.off.every(t=>!t.includes('상승 기준'))&&r.on.every(t=>t.includes('상승 기준'))&&r.blocked&&r.node);
  assert.deepEqual(r.restored,r.off);assert.match(r.live,/독립 상승 기준 적용 중/);
});
