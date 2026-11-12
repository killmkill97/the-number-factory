const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  ctx.loadSource(`knuthBaseUpgradeLevels.probabilizer=1;knuthBaseUpgradeLevels.late_abstraction=1;
    abstractionResearchState['20-1']=true;greatTheory=2400;knuthPoints=NumberMath.fromString('1e100000');`);
  return ctx;
}
const close=(actual,expected)=>assert.ok(Math.abs(actual/expected-1)<1e-10,`${actual} != ${expected}`);

test('21-1 needs 20-1 and 2400 grand theory, preserving existing ranges and using 1.1 for every later purchase', () => {
  const r=run(ready(), `
    probabilizerUpgradeLevels.a=3;probabilizerUpgradeLevels.b=5;
    const before=probabilizerParameters(),costs=['a','b'].map(probabilizerUpgradeCost);
    abstractionResearchState['20-1']=false;const parentBlocked=!researchAbstraction('21-1');
    abstractionResearchState['20-1']=true;greatTheory=2399;const costBlocked=!researchAbstraction('21-1');
    greatTheory=2400;const bought=researchAbstraction('21-1'),same=JSON.stringify(before)===JSON.stringify(probabilizerParameters());
    const checkpoint={...probabilizerRangeProgress};
    const samePrices=costs.every((cost,i)=>compareNumberValues(cost,probabilizerUpgradeCost(['a','b'][i]))===0);
    const bBought=buyProbabilizerUpgrade('b'),aBought=buyProbabilizerUpgrade('a');
    const after=probabilizerParameters(),definition=abstractionResearchDefinitions.get('21-1');
    return {parentBlocked,costBlocked,bought,same,samePrices,bBought,aBought,left:plain(greatTheory),
      aRatio:after.a/before.a,bRatio:after.b/before.b,parents:definition.parents,cost:definition.greatTheoryCost,
      checkpoint,paid:abstractionResearchPaidCosts['21-1']};
  `);
  close(r.aRatio,1.1);close(r.bRatio,1.1);
  assert.deepEqual({...r,aRatio:undefined,bRatio:undefined},{parentBlocked:true,costBlocked:true,bought:true,same:true,samePrices:true,
    bBought:true,aBought:true,left:0,aRatio:undefined,bRatio:undefined,parents:['20-1'],cost:2400,
    checkpoint:{a:3.375,b:759.375,aLevel:3,bLevel:5},paid:2400});
});

test('old capped values do not jump on research, and both range purchases reopen above the old limit', () => {
  const r=run(ready(), `
    probabilizerUpgradeLevels.a=100;probabilizerUpgradeLevels.b=100;
    const before=probabilizerParameters(),oldMaximum=probabilizerUpgradeAtMaximum('b');
    researchAbstraction('21-1');const same=JSON.stringify(before)===JSON.stringify(probabilizerParameters());
    const opened=!probabilizerUpgradeAtMaximum('b'),bBought=buyProbabilizerUpgrade('b'),aBought=buyProbabilizerUpgrade('a');
    return {oldMaximum,same,opened,bBought,aBought,a:probabilizerParameters().a,b:probabilizerParameters().b};
  `);
  assert.ok(r.oldMaximum&&r.same&&r.opened&&r.bBought&&r.aBought);
  close(r.a,Number.MAX_SAFE_INTEGER*1.1);close(r.b,Number.MAX_SAFE_INTEGER*1.1);
});

test('1e308 is the inclusive maximum with finite previews and no further range purchases', () => {
  assert.deepEqual(run(ready(), `
    researchAbstraction('21-1');probabilizerUpgradeLevels.a=100000;probabilizerUpgradeLevels.b=100000;
    const parameters=probabilizerParameters(),before=NumberMath.serialize(knuthPoints);
    return {parameters,aMax:probabilizerUpgradeAtMaximum('a'),bMax:probabilizerUpgradeAtMaximum('b'),
      aBlocked:!buyProbabilizerUpgrade('a'),bBlocked:!buyProbabilizerUpgrade('b'),
      same:before===NumberMath.serialize(knuthPoints),finite:Object.values(parameters).every(Number.isFinite)};
  `),{parameters:{a:1e308,b:1e308,mode:1e308,intervalMs:1000},aMax:true,bMax:true,aBlocked:true,bBlocked:true,same:true,finite:true});
});

test('research resets clamp only visible ranges; re-research restores paid extension values and mixed growth history', () => {
  const r=run(ready(), `
    researchAbstraction('21-1');buyProbabilizerUpgrade('a');
    probabilizerRangeProgress.b=1e100;probabilizerRangeProgress.bLevel=5;
    probabilizerUpgradeLevels.b=5;buyProbabilizerUpgrade('b');
    const before=probabilizerParameters();
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    const clamped=probabilizerParameters().b===Number.MAX_SAFE_INTEGER;
    buyProbabilizerUpgrade('a');const offA=probabilizerParameters().a;
    abstractionResearchState['20-1']=true;greatTheory=2400;const bought=researchAbstraction('21-1');
    const restored=probabilizerParameters();buyProbabilizerUpgrade('b');
    return {clamped,bought,bPreserved:restored.b===before.b,aRatio:offA/before.a,aPreserved:restored.a===offA,
      nextRatio:probabilizerParameters().b/restored.b};
  `);
  close(r.aRatio,1.5);close(r.nextRatio,1.1);assert.ok(r.clamped&&r.bought&&r.bPreserved&&r.aPreserved);
});

test('range checkpoints round-trip independently; legacy and malformed saves use safe existing values', () => {
  assert.deepEqual(run(ready(), `
    probabilizerUpgradeLevels.b=5;researchAbstraction('21-1');buyProbabilizerUpgrade('b');
    const before=probabilizerParameters(),saved=captureGameSaveData(),checkpoint={...saved.probabilizerRangeProgress};
    probabilizerRangeProgress.b=1;const independent=saved.probabilizerRangeProgress.b===checkpoint.b;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const same=JSON.stringify(before)===JSON.stringify(probabilizerParameters());
    const retainedBefore=JSON.stringify(probabilizerRangeProgress);resetProgressForNewKnuthRun();
    const retained=retainedBefore===JSON.stringify(probabilizerRangeProgress);
    delete saved.probabilizerRangeProgress;delete saved.abstractionResearchState['21-1'];
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const legacy=probabilizerRangeProgress===null&&probabilizerParameters().b===100*1.5**6;
    loadProbabilizerState({probabilizerUpgradeLevels:{a:0,b:0},
      probabilizerRangeProgress:{a:-1,b:Infinity,aLevel:0,bLevel:0}});
    return {independent,loaded,same,retained,legacy,malformed:probabilizerRangeProgress===null,errors};
  `),{independent:true,loaded:true,same:true,retained:true,legacy:true,malformed:true,errors:[]});
});

test('huge triangular samples stay finite, bounded and centered with or without shifting', () => {
  const rows=run(ready(), `
    researchAbstraction('21-1');let seed=12345;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const rows=[];
    for(const a of [1,9.9e307])for(const shift of [0,1]){
      probabilizerRangeProgress={a,b:1e308,aLevel:0,bLevel:0};probabilizerUpgradeLevels.shift=shift;
      const p=probabilizerParameters();let valid=true,sum=0;
      for(let i=0;i<10000;i++){const x=rollProbabilizer(random);valid&&=Number.isFinite(x)&&x>=p.a&&x<=p.b;sum+=(x-p.a)/(p.b-p.a);}
      rows.push({valid,mean:sum/10000,endpoints:[rollProbabilizer(()=>0),rollProbabilizer(()=>1)]});
    }return rows;
  `);
  rows.forEach(row=>{assert.ok(row.valid&&Math.abs(row.mean-.5)<.015);assert.ok(row.endpoints.every(Number.isFinite));});
});

test('exact and coarse production accumulate beyond native limits, including the smallest interval', () => {
  const rows=run(ready(), `
    researchAbstraction('21-1');probabilizerRangeProgress={a:1e308,b:1e308,aLevel:0,bLevel:0};
    probabilizerUpgradeLevels.speed=31;const rows=[];
    for(const elapsed of [16,1000]){
      randomPower=0;probabilizerTimerMs=0;let calls=0;
      const count=advanceProbabilizer(elapsed,()=>{calls++;return .5;});
      rows.push({ratio:plain(NumberMath.divideApproximate(randomPower,multiplyNumberValue(count,'1e308'))),calls,
        valid:!JSON.stringify(randomPower).match(/NaN|Infinity|undefined/)});
    }
    probabilizerPowerUpgradeLevels.interval_floor=1074;probabilizerUpgradeLevels.speed=4000;
    randomPower=0;const count=advanceProbabilizer(1000,()=>.5);
    rows.push({ratio:plain(NumberMath.divideApproximate(randomPower,multiplyNumberValue(count,'1e308'))),
      valid:!JSON.stringify(randomPower).match(/NaN|Infinity|undefined/)});
    return rows;
  `);
  rows.forEach(row=>{close(row.ratio,1);assert.ok(row.valid);});
  assert.equal(rows[0].calls,0);assert.equal(rows[1].calls,12);
});

test('large-range variance and exact sums remain inside theoretical production bounds', () => {
  const rows=run(ready(), `
    researchAbstraction('21-1');probabilizerRangeProgress={a:1,b:1e308,aLevel:0,bLevel:0};
    probabilizerUpgradeLevels.speed=31;probabilizerUpgradeLevels.shift=1;
    const rows=[];
    for(const elapsed of [16,1000])for(const u of [0,.5,1]){
      randomPower=0;probabilizerTimerMs=0;let calls=0;
      const count=advanceProbabilizer(elapsed,()=>{calls++;return u;});
      rows.push({elapsed,u,gain:NumberMath.serialize(randomPower),count:NumberMath.serialize(count),calls,positive:isPositiveNumberValue(randomPower),bounded:
        plain(NumberMath.divideApproximate(randomPower,count))>=1-1e-12
        &&plain(NumberMath.divideApproximate(randomPower,multiplyNumberValue(count,'1e308')))<=1+1e-12,
        valid:!JSON.stringify(randomPower).match(/NaN|Infinity|undefined/)});
    }return rows;
  `);
  rows.forEach(row=>assert.ok(row.positive&&row.bounded&&row.valid&&row.calls<=16,JSON.stringify(row)));
});

test('the plot keeps its centered peak and dot with huge endpoints and renders the new growth text', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    researchAbstraction('21-1');probabilizerRangeProgress={a:1,b:1e308,aLevel:0,bLevel:0};
    let shape='';probabilizerDistribution.setAttribute=(key,value)=>{if(key==='d')shape=value;};
    activeChapter='knuth';setKnuthView('production');setKnuthProductionView('probabilizer');
    showProbabilizerRoll(5e307);renderProbabilizerBoard();
    return {shape,position:probabilizerVisualDots.at(-1).style.left,
      ticks:probabilizerTicks.every(t=>!t.textContent.match(/NaN|Infinity/)),
      description:document.getElementById('probabilizerBUpgradeDescription').textContent};
  `),{shape:'M 0 100 L 50 8 L 100 100 Z',position:'50%',ticks:true,
    description:'끝점 b를 1.1배 늘립니다. 상한은 1e308입니다. 가격은 ×10, 1e500 KP부터 ×100입니다.'});
});

test('console force unlock and remove preserve checkpoints and switch range caps safely', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    probabilizerUpgradeLevels.b=100;const before=probabilizerParameters().b;
    const bought=forceUnlockDevUpgrade('abstraction','21-1'),same=probabilizerParameters().b===before;
    buyProbabilizerUpgrade('b');const extended=probabilizerParameters().b;
    const removed=removeDevUpgrade('abstraction','21-1'),clamped=probabilizerParameters().b===Number.MAX_SAFE_INTEGER;
    forceUnlockDevUpgrade('abstraction','21-1');
    return {bought,same,removed,clamped,restored:probabilizerParameters().b===extended};
  `),{bought:true,same:true,removed:true,clamped:true,restored:true});
});

test('a preset rollback also restores the new checkpoint state', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['20-1']=false;randomPower=2500000000;greatTheory=50000;
    const plan=researchPurchasePlan('abstraction','21-1');
    ABSTRACTION_RESEARCHES.push({id:'22-1',column:22,row:1.75,parents:['21-1'],greatTheoryCost:1});
    abstractionResearchPresets[0]={name:'rollback',ids:[...plan.ids,'22-1']};
    const original=researchAbstraction;researchAbstraction=(id,options)=>id==='22-1'?false:original(id,options);
    const rejected=!loadAbstractionResearchPreset(0);
    return {rejected,checkpoint:probabilizerRangeProgress,left:plain(greatTheory),
      empty:!ABSTRACTION_RESEARCHES.some(r=>hasPurchasedAbstractionResearch(r.id))};
  `),{rejected:true,checkpoint:null,left:50000,empty:true});
});
