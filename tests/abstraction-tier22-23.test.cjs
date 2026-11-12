const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx = game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.late_abstraction=1;greatTheory=100000;
    abstractionResearchState['21-1']=true;`);
  return ctx;
}
const close = (value, expected) => assert.ok(Math.abs(value / expected - 1) < 1e-9, `${value} != ${expected}`);

test('six independent 1200-cost nodes use the confirmed parents and require the late research unlock', () => {
  const rows = run(ready(), `
    const rows=[];
    for(const id of ['22-1','22-2','22-3','23-1','23-2','23-3']){
      const r=abstractionResearchDefinitions.get(id);
      greatTheory=1199;const fundsBlocked=!researchAbstraction(id);
      greatTheory=1200;knuthBaseUpgradeLevels.late_abstraction=0;const tierBlocked=!researchAbstraction(id);
      knuthBaseUpgradeLevels.late_abstraction=1;
      const bought=researchAbstraction(id);
      rows.push({id,parent:r.parents,cost:r.greatTheoryCost,branch:!!r.branch,fundsBlocked,tierBlocked,bought,left:plain(greatTheory)});
    }
    return rows;
  `);
  rows.forEach((r, i) => assert.deepEqual(r, {id: ['22-1','22-2','22-3','23-1','23-2','23-3'][i],
    parent: [i < 3 ? '21-1' : `22-${i-2}`], cost:1200,branch:false,fundsBlocked:true,tierBlocked:true,bought:true,left:0}));
});

test('first branch gains one additive path and all three priorities are selectable without expanding the second branch', () => {
  assert.deepEqual(run(ready(), `
    const initial=abstractionBranchLimit(1);researchAbstraction('22-1');const researchOnly=abstractionBranchLimit(1);
    knuthBaseUpgradeLevels.extra_branch=1;const together=abstractionBranchLimit(1);
    abstractionResearchState['3-1']=true;greatTheory=100000;
    const bought=['4-1','4-2','4-3'].map(researchAbstraction);
    const third=setAbstractionBranchPriority(1,2,'time');
    return {initial,researchOnly,together,bought,third,priorities:abstractionBranchPriorities[1],
      noFourth:!setAbstractionBranchPriority(1,3,'time'),second:abstractionBranchLimit(2),
      noSecondThird:!setAbstractionBranchPriority(2,2,'idle')};
  `), {initial:1,researchOnly:2,together:3,bought:[true,true,true],third:true,
    priorities:['percent','expansion','time'],noFourth:true,second:1,noSecondThird:true});
});

test('presets can acquire the third path after 22-1 in the same atomic transaction', () => {
  assert.deepEqual(run(ready(), `
    loadAbstractionResearchState({});knuthBaseUpgradeLevels.extra_branch=1;randomPower=1e50;
    const allowed=new Set(['time','expansion','passive','singularity_discount','cp_sp_link','dyson_singularity','b_to_a','singularity_softcap']);
    const ids=ABSTRACTION_RESEARCHES.filter(r=>r.column<=22&&(!r.branch||allowed.has(r.branch)))
      .map(r=>r.id).filter(id=>!['22-2','22-3'].includes(id));
    ids.push('4-3','5-3','6-3');editAbstractionResearchPreset(0,ids.join(','));
    const plan=abstractionPresetPurchasePlan(0);
    const before=JSON.stringify(abstractionResearchState);greatTheory=plan.cost-1;
    const blocked=!loadAbstractionResearchPreset(0)&&before===JSON.stringify(abstractionResearchState);
    greatTheory=plan.cost;const loaded=loadAbstractionResearchPreset(0);
    return {valid:!plan.error,blocked,loaded,left:plain(greatTheory),all:ids.every(hasAbstractionResearch),
      ordered:plan.ids.indexOf('22-1')<plan.ids.indexOf('4-3'),limit:abstractionBranchLimit(1)};
  `), {valid:true,blocked:true,loaded:true,left:0,all:true,ordered:true,limit:3});
});

test('22-2 doubles effect counts in all five group-one upgrades without changing prices, ownership or other groups', () => {
  const rows = run(ready(), `
    const rows=[];knuthBaseUpgradeLevels.dyson_limit=2;
    for(const [id,base]of [['cp_gain',25],['sp_gain',10000],['kp_gain',5],['diverger_gain',2],['dimension_gain',4]]){
      knuthBaseUpgradeLevels[id]=3;abstractionResearchState['22-2']=false;
      const price=NumberMath.serialize(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES.find(u=>u.id===id)));
      const before=knuthBaseMultiplier(id,base);abstractionResearchState['22-2']=true;
      const after=knuthBaseMultiplier(id,base);
      rows.push({id,ratio:plain(NumberMath.divideApproximate(after,NumberMath.power(before,2))),level:knuthBaseUpgradeLevel(id),
        samePrice:price===NumberMath.serialize(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES.find(u=>u.id===id)))});
    }
    abstractionResearchState['11-1']=true;knuthBaseUpgradeLevels.cp_gain=1;
    const combined=plain(knuthBaseMultiplier('cp_gain',25));activeKnuthChallengeId='kc5';
    return {rows,combined,dyson:knuthBaseUpgradeLevel('dyson_limit'),disabled:plain(knuthBaseMultiplier('cp_gain',25))};
  `);
  rows.rows.forEach(r => {close(r.ratio,1);assert.equal(r.level,3);assert.ok(r.samePrice);});
  close(rows.combined,31.25**2);assert.equal(rows.dyson,2);assert.equal(rows.disabled,1);
});

const seedProduction = `
  squareDimensionStates[0].x=123456;squareDimensionStates[1].zGrowthCarry=0.75;
  squareDimensionStates[1].powerStrengthUnlocked=true;squareDimensionAutoUpgradeTimer=173;
  divergerN=99;divergerPower=1234;divergerA=8;divergerALevel=3;divergerACpCost=67.5;
  divergerB=2;divergerBLevel=5;divergerC=9;divergerCLevel=9;divergerInterval=19.5;
  divergerTimer=3;divergerAutoUpgradeTimer=49;divergerSpeedIntervalHistory=[1000,997];
  divergerUpgradeHistory.a.push({cpCost:20});divergerGraphSamples.push(12);`;
const snapshotProduction = `function productionSnapshot(){return JSON.stringify({dimensions:squareDimensionStates,
  auto:squareDimensionAutoUpgradeTimer,n:divergerN,d:divergerPower,a:divergerA,b:divergerB,c:divergerC,
  aLevel:divergerALevel,bLevel:divergerBLevel,cLevel:divergerCLevel,cost:divergerACpCost,interval:divergerInterval,
  timer:divergerTimer,autoTimer:divergerAutoUpgradeTimer,speedHistory:divergerSpeedIntervalHistory,
  history:divergerUpgradeHistory,graph:divergerGraphSamples});}`;

test('22-3 preserves production state only on real KP completion, even when that completion refunds research', () => {
  for (const refund of [false,true]) {
    assert.deepEqual(run(ready(), `
      abstractionResearchState['22-3']=true;abstractionResetOnNextKnuthPoint=${refund};squareConvergencePoints=1e30;
      ${seedProduction}${snapshotProduction}
      const before=productionSnapshot();beginKnuthPrestige();
      return {same:before===productionSnapshot(),kp:plain(knuthPoints),owned:hasAbstractionResearch('22-3'),sp:plain(squarePoints)};
    `), {same:true,kp:2,owned:!refund,sp:0});
  }
});

test('challenge start, abandonment and completion still reset production and never update the permanent SP record', () => {
  for (const action of ['startKnuthChallenge("kc1")','activeKnuthChallengeId="kc1";abandonKnuthChallenge()',
    'activeKnuthChallengeId="kc1";squarePoints=500000;completeKnuthChallenge()']) {
    assert.deepEqual(run(ready(), `
      abstractionResearchState['22-3']=true;abstractionResearchState['23-3']=true;
      abstractionPermanentSp=10;squarePoints=1e50;${seedProduction}
      ${action};return {n:plain(divergerN),x:plain(squareDimensionStates[0].x),record:plain(abstractionPermanentSp),sp:plain(squarePoints)};
    `), {n:1,x:500,record:10,sp:10});
  }
});

test('23-1 pays one percent CP per real second without consuming SP or triggering convergence side effects', () => {
  const r=run(ready(), `
    abstractionResearchState['23-1']=true;squarePoints=1e50;
    activeKnuthChallengeId='kc4';kc4ElapsedRealSeconds=3;
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1000000');
    const possible=squareConvergencePointGain(),sp=NumberMath.serialize(squarePoints);
    const changed=advanceAbstraction(1000),first=squareConvergencePoints;
    const elapsed=kc4ElapsedRealSeconds;
    for(let i=0;i<10;i++)advanceAbstraction(100);
    return {changed,ratio:plain(NumberMath.divideApproximate(first,possible)),partition:plain(NumberMath.divideApproximate(squareConvergencePoints,first)),
      sameSp:sp===NumberMath.serialize(squarePoints),elapsed,seen:hasEverEarnedSquareConvergencePoint,unlocked:squareConvergenceUnlocked,
      invalid:[0,-1,NaN,Infinity].every(t=>!advanceAbstraction(t))};
  `);
  close(r.ratio,.01);close(r.partition,2);
  assert.ok(r.changed&&r.sameSp&&r.seen&&r.unlocked&&r.invalid);assert.equal(r.elapsed,3);
});

test('passive CP works with zero SP production and contributes no payout below the convergence requirement', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['23-1']=true;setBaseNumber(0);squarePoints=0;
    const empty=!advanceAbstraction(1000);squarePoints=1e50;advanceAbstraction(1000);
    const before=NumberMath.serialize(squareConvergencePoints);abstractionResearchState['23-1']=false;
    return {empty,positive:isPositiveNumberValue(squareConvergencePoints),off:!advanceAbstraction(1000),same:before===NumberMath.serialize(squareConvergencePoints)};
  `), {empty:true,positive:true,off:true,same:true});
});

test('offline CP production uses real elapsed time at both coarse and precise accuracy without duplicate payouts', async () => {
  for (const accuracy of [1,1000]) {
    const ctx=game(true,{storage:[['numberTycoonSessionPreferences_v1',JSON.stringify({offlineAccuracy:accuracy})]]});
    ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/abstraction.js'),'utf8'));
    ctx.loadSource(`abstractionResearchState['23-1']=true;squarePoints=1e50;
      render=()=>window.numberTycoonSession.requestMaintenance();window.numberTycoonSession.initialize();`);
    const rate=run(ctx,'return plain(abstractionCpGainPerRealSecond());');
    run(ctx,'window.numberTycoonSession.enter();');ctx.advance(2000);
    assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),true);
    const result=run(ctx,'return {cp:plain(squareConvergencePoints),sp:plain(squarePoints),errors};');
    close(result.cp,rate*2);close(result.sp,1e50);assert.deepEqual(result.errors,[]);
    assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),false);
    close(run(ctx,'return plain(squareConvergencePoints);'),rate*2);
  }
});

test('23-2 is neutral at zero, smooth at small values and increases KP through nested huge random power', () => {
  const r=run(ready(), `
    abstractionResearchState['23-2']=true;const values=[0,1,1000,'1e50','1e200','1e1e100'];
    const rows=values.map(value=>{randomPower=NumberMath.fromValue(value);return abstractionRandomPowerKpMultiplier();});
    randomPower=NumberMath.fromString('1e50');squareConvergencePoints=1e30;
    const boosted=knuthPointGain();abstractionResearchState['23-2']=false;const base=knuthPointGain();
    hasClaimedKnuthPoint=false;abstractionResearchState['23-2']=true;
    return {neutral:plain(rows[0]),increasing:rows.slice(1).every((v,i)=>compareNumberValues(v,rows[i])>0),
      anchor:logValue(rows[3]),boosted:logValue(boosted),base:plain(base),integer:compareNumberValues(boosted,NumberMath.floor(boosted))===0,
      first:plain(knuthPointGain())};
  `);
  close(r.anchor,60);close(r.boosted,60+Math.log10(2));
  assert.deepEqual({...r,anchor:0,boosted:0},{neutral:1,increasing:true,anchor:0,boosted:0,base:2,integer:true,first:1});
});

test('23-3 records only a higher one-percent SP candidate and retains an unspendable floor across purchases and convergence', () => {
  const r=run(ready(), `
    abstractionResearchState['23-3']=true;squarePoints=1e20;squareConvergencePoints=1e30;beginKnuthPrestige();
    const first=plain(abstractionPermanentSp),after=plain(squarePoints);
    setSquarePoints(0);const floor=plain(squarePoints);
    squareUnlocked=true;const bought=buySquareUpgrade('click_double');const spent=plain(squarePoints);
    collectSquareConvergenceIfReady();const converged=plain(squarePoints);
    squareConvergencePoints=1e30;beginKnuthPrestige();const lower=plain(abstractionPermanentSp);
    squarePoints=1e30;squareConvergencePoints=1e30;beginKnuthPrestige();
    return {first,after,floor,bought,spent,converged,lower,higher:plain(abstractionPermanentSp)};
  `);
  for(const key of ['first','after','floor','spent','converged','lower'])close(r[key],1e18);
  close(r.higher,1e28);assert.ok(r.bought);
});

test('research refund hides only the permanent floor and repurchase immediately restores the highest record', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['23-3']=true;squarePoints=1000000;squareConvergencePoints=1e30;
    abstractionResetOnNextKnuthPoint=true;beginKnuthPrestige();
    const off=plain(squarePoints),record=plain(abstractionPermanentSp);setSquarePoints(1);
    const noFloor=plain(squarePoints);abstractionResearchState['22-3']=true;greatTheory=1200;
    const bought=researchAbstraction('23-3');
    return {off,record,noFloor,bought,restored:plain(squarePoints)};
  `), {off:0,record:10000,noFloor:1,bought:true,restored:10000});
});

test('SP floor applies to black-hole donations with bounded bulk results identical to sequential donations', () => {
  for(const percent of [1,50,100]) {
    const r=run(ready(), `
      abstractionResearchState['23-3']=true;abstractionResearchState['15-1']=true;
      abstractionPermanentSp=100;numberBlackHoleDonationResource='sp';numberBlackHoleDonationPercent=${percent};
      squarePoints=1000;applyNumberBlackHoleDonations(1000);
      const bulk=numberBlackHoleTotalSpInvested,bulkSp=squarePoints,bulkCount=numberBlackHoleSpDonationCount;
      numberBlackHoleTotalSpInvested=0;numberBlackHoleSpDonationCount=0;squarePoints=1000;
      for(let i=0;i<1000;i++)applyNumberBlackHoleDonations(1);
      return {ratio:plain(NumberMath.divideApproximate(numberBlackHoleTotalSpInvested,bulk)),
        bulkSp:plain(bulkSp),sp:plain(squarePoints),bulkCount:plain(bulkCount),count:plain(numberBlackHoleSpDonationCount)};
    `);
    close(r.ratio,1);assert.equal(r.bulkSp,100);assert.equal(r.sp,100);assert.equal(r.bulkCount,1000);assert.equal(r.count,1000);
  }
});

test('nested SP reserve and new research roundtrip; old or malformed saves cannot inherit a previous reserve', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['23-3']=true;abstractionPermanentSp=NumberMath.fromString('1e1e100');setSquarePoints(0);
    const saved=captureGameSaveData(),key=NumberMath.serialize(abstractionPermanentSp);abstractionPermanentSp=0;squarePoints=0;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const same=key===NumberMath.serialize(abstractionPermanentSp)&&compareNumberValues(squarePoints,abstractionPermanentSp)===0;
    delete saved.abstractionResearchState['23-3'];saved.squarePoints=0;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const hidden=plain(squarePoints)===0&&key===NumberMath.serialize(abstractionPermanentSp);
    delete saved.abstractionPermanentSp;loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const legacy=plain(abstractionPermanentSp)===0;
    saved.abstractionPermanentSp=-100;loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,same,hidden,legacy,malformed:plain(abstractionPermanentSp)===0,errors};
  `), {loaded:true,same:true,hidden:true,legacy:true,malformed:true,errors:[]});
});

test('research purchases and debug force controls honor immediate SP restoration without charging extra theory', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8').split('\nfunction restorePercentPowerPriceForDev')[0]);
  assert.deepEqual(run(ctx, `
    abstractionPermanentSp=100;abstractionResearchState['22-3']=true;greatTheory=1200;
    const bought=researchAbstraction('23-3');const sp=plain(squarePoints),paid=plain(greatTheory);
    removeDevUpgrade('abstraction','23-3');setSquarePoints(0);const off=plain(squarePoints);
    forceUnlockDevUpgrade('abstraction','23-3');
    return {bought,sp,paid,off,restored:plain(squarePoints),record:plain(abstractionPermanentSp),errors};
  `), {bought:true,sp:100,paid:0,off:0,restored:100,record:100,errors:[]});
});
