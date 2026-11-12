const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx = game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.late_abstraction=1;greatTheory=2500;
    for(const id of ['23-1','23-2','23-3']) abstractionResearchState[id]=true;`);
  return ctx;
}
const close = (actual, expected, tolerance=1e-8) =>
  assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)), `${actual} != ${expected}`);

test('24-1 costs 2500 and requires all three normal parents and the existing late research unlock', () => {
  const r=run(ready(), `
    const spec=abstractionResearchDefinitions.get('24-1'),blocked=[];
    for(const id of spec.parents){abstractionResearchState[id]=false;blocked.push(!researchAbstraction('24-1'));abstractionResearchState[id]=true;}
    knuthBaseUpgradeLevels.late_abstraction=0;const locked=!researchAbstraction('24-1');
    knuthBaseUpgradeLevels.late_abstraction=1;greatTheory=2499;const poor=!researchAbstraction('24-1');
    greatTheory=2500;const bought=researchAbstraction('24-1');
    return {parents:spec.parents,cost:spec.greatTheoryCost,branch:!!spec.branch,blocked,locked,poor,bought,left:plain(greatTheory),again:researchAbstraction('24-1')};
  `);
  assert.deepEqual(r,{parents:['23-1','23-2','23-3'],cost:2500,branch:false,blocked:[true,true,true],locked:true,
    poor:true,bought:true,left:0,again:false});
});

test('research planning buys all missing normal parents atomically and records the full refund', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['21-1']=true;
    for(const id of ['23-1','23-2','23-3'])abstractionResearchState[id]=false;
    const originalRefund=abstractionResearchRefund();
    const plan=researchPurchasePlan('abstraction','24-1');greatTheory=plan.cost-1;
    const before=JSON.stringify(abstractionResearchState),blocked=!purchaseResearchWithParents('abstraction','24-1');
    const unchanged=before===JSON.stringify(abstractionResearchState);greatTheory=plan.cost;
    const bought=purchaseResearchWithParents('abstraction','24-1');
    return {cost:plan.cost,unique:new Set(plan.ids).size===plan.ids.length,blocked,unchanged,bought,
      all:plan.ids.every(hasAbstractionResearch),left:plain(greatTheory),refund:plain(subtractNumberValues(abstractionResearchRefund(),originalRefund))};
  `), {cost:9700,unique:true,blocked:true,unchanged:true,bought:true,all:true,left:0,refund:9700});
});

test('random power multiplier is neutral when inactive or zero, monotone, and handles nested huge numbers', () => {
  const r=run(ready(), `
    randomPower=1e50;const off=plain(abstractionRandomPowerPercentMultiplier());researchAbstraction('24-1');
    const rows=['0','1','1e10','1e50','1e100','1e1e100'].map(text=>{
      randomPower=NumberMath.fromString(text);const before=NumberMath.serialize(randomPower),m=abstractionRandomPowerPercentMultiplier();
      return {log:logValue(m),valid:isPositiveNumberValue(m),same:before===NumberMath.serialize(randomPower)};
    });return {off,rows};
  `);
  assert.equal(r.off,1);close(r.rows[0].log,0);close(r.rows[3].log,12);
  r.rows.forEach((r,i)=>{assert.ok(r.valid&&r.same);if(i)assert.ok(r.log>0);});
  for(let i=1;i<5;i++)assert.ok(r.rows[i].log>r.rows[i-1].log);
});

test('manual, generic and K=1 optimized percent gains receive exactly one final multiplier across powers', () => {
  for(const k of [1,2])for(const q of [1,2,4,8]){
    const r=run(ready(), `
      percentUnlocked=true;randomPower=1e50;singularityPoints=2;percentPowerSoftcapDecayPower=()=>${k};
      abstractionResearchState['8-2']=${q>=4};if(${q===2||q===8})knuthEquippedUpgradeIds.add('percent_gain_square');
      knuthBaseUpgradeLevels.advanced_equipment=1;knuthAdvancedEquipped.percent_power=2;
      const rows=[];
      for(const text of ['10000','1e50','1e1000000001']){
        const value=NumberMath.fromString(text),cap=NumberMath.serialize(percentPowerSoftcap(10));
        abstractionResearchState['24-1']=false;const before=percentFinalUseGain(value,10);
        const clickBefore=finalNumberProductionGain(100,1,value);abstractionResearchState['24-1']=true;
        const expected=multiplyNumberValue(before,abstractionRandomPowerPercentMultiplier()),actual=percentFinalUseGain(value,10);
        setBaseNumber(value);applyPercentUse(value,10,'test');
        rows.push({difference:plain(NumberMath.subtract(NumberMath.log10(actual),NumberMath.log10(expected))),
          manual:plain(NumberMath.subtract(NumberMath.log10(getBaseNumber()),NumberMath.log10(addBaseNumbers(value,expected)))),
          cap:cap===NumberMath.serialize(percentPowerSoftcap(10)),click:compareNumberValues(clickBefore,finalNumberProductionGain(100,1,value))===0});
      }return rows;
    `);
    r.forEach(row=>{close(row.difference,0,1e-5);close(row.manual,0,1e-5);assert.ok(row.cap&&row.click);});
  }
});

test('q=1 fast ratios and bulk purchases use the research, keep caches within a batch and remain bounded', () => {
  const r=run(ready(), `
    percentUnlocked=true;randomPower=1;researchAbstraction('24-1');const m=plain(abstractionRandomPowerPercentMultiplier());
    const on=percentUseGainRatio(1);abstractionResearchState['24-1']=false;const off=percentUseGainRatio(1);
    abstractionResearchState['24-1']=true;percentPowerSoftcap=()=>100;percentPowerSoftcapDecayPower=()=>1;
    let sequential=120;for(let i=0;i<1000;i++)sequential=percentUseValueAfterOne(sequential,1);
    setBaseNumber(120);applyPercentUsesBatch(1,1000,'test');const ratio=plain(NumberMath.divideApproximate(getBaseNumber(),sequential));
    const calculate=abstractionRandomPowerPercentMultiplier;let calls=0;
    abstractionRandomPowerPercentMultiplier=()=>{calls++;return calculate();};
    applyPercentUsesBatch(1,1e50,'test');const bounded=calls;
    randomPower=1e50;const updated=withPercentProductionCache(()=>abstractionRandomPowerPercentMultiplier());
    return {m,ratio,ratioMultiplier:plain(NumberMath.divideApproximate(on,off)),bounded,positive:isPositiveNumberValue(getBaseNumber()),updated:logValue(updated)};
  `);
  close(r.ratioMultiplier,r.m);close(r.ratio,1,.02);assert.ok(r.bounded<=1&&r.positive);close(r.updated,12);
});

test('save/load preserves the new research and paid cost, while old saves keep it unpurchased', () => {
  assert.deepEqual(run(ready(), `
    randomPower=1e50;researchAbstraction('24-1');const saved=captureGameSaveData();
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const owned=hasAbstractionResearch('24-1'),paid=abstractionResearchPaidCosts['24-1'],log=logValue(abstractionRandomPowerPercentMultiplier());
    delete saved.abstractionResearchState['24-1'];delete saved.abstractionResearchPaidCosts['24-1'];
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,owned,paid,log,old:!hasAbstractionResearch('24-1'),neutral:plain(abstractionRandomPowerPercentMultiplier()),errors};
  `),{loaded:true,owned:true,paid:2500,log:12,old:true,neutral:1,errors:[]});
});
