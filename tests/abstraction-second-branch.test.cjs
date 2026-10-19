const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function run(source) {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context);
  }
  vm.runInContext(`
    let testNow=1000000;Date.now=()=>testNow;
    knuthRunStartedAtMs=testNow;render=()=>{};setChapter=()=>{};
    extraPercentLanesEl={innerHTML:''};knuthUnlocked=true;
  `, context);
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${source}})()`, context)));
}

function close(actual, expected) {
  assert.ok(Math.abs(actual / expected - 1) < 1e-10, `${actual} != ${expected}`);
}

test('second branch has three paths with 5/6/8 costs and active final research includes both effects', () => {
  assert.deepEqual(run(`
    greatTheory=19;abstractionResearchState['11-1']=true;
    const before=['12-1','12-2','12-3'].map(canResearchAbstraction);
    const bought=['12-1','13-1','14-1'].map(researchAbstraction);
    return {before,bought,left:NumberMath.toNumber(greatTheory),
      costs:ABSTRACTION_RESEARCHES.filter(r=>r.branchGroup===2).map(r=>r.greatTheoryCost),
      locked:['12-2','12-3'].map(canResearchAbstraction),extra:ABSTRACTION_RESEARCHES.some(r=>r.column===15&&r.branchGroup===2)};
  `), {before:[true,true,true],bought:[true,true,true],left:0,costs:[5,6,8,5,6,8,5,6,8],locked:[false,false],extra:false});
});

test('branch choices are independent and extra_branch only expands the first group', () => {
  assert.deepEqual(run(`
    greatTheory=100;abstractionResearchState['3-1']=true;abstractionResearchState['11-1']=true;
    researchAbstraction('4-1');researchAbstraction('12-3');
    const before=[canResearchAbstraction('4-2'),canResearchAbstraction('12-1'),canResearchAbstraction('13-3')];
    knuthBaseUpgradeLevels.extra_branch=1;
    return {before,after:[canResearchAbstraction('4-2'),canResearchAbstraction('12-1')],
      mixed:abstractionResearchParentsReady({parents:['11-1','12-1','12-2','12-3']})};
  `), {before:[false,false,true],after:[true,false],mixed:true});
});

test('active and idle rewards use unaccelerated real time with smooth neutral asymptotes', () => {
  const result=run(`
    gameTick=()=>1e100;
    abstractionResearchState['12-1']=true;
    const active=[0,300,3600].map(s=>{testNow=1000000+s*1000;return abstractionSecondBranchResourceMultiplier();});
    abstractionResearchState['12-1']=false;abstractionResearchState['12-3']=true;
    const idle=[0,300,3600].map(s=>{testNow=1000000+s*1000;return abstractionSecondBranchResourceMultiplier();});
    return {active,idle};
  `);
  [800000,1+799999/Math.sqrt(2),1+799999/Math.sqrt(13)].forEach((v,i)=>close(result.active[i],v));
  [1,500000.5,1+999999*Math.log2(13)/(1+Math.log2(13))].forEach((v,i)=>close(result.idle[i],v));
});

test('passive resource multipliers affect actual SP/CP rewards and KP remains integer', () => {
  const data=run(`
    setBaseNumber(NumberMath.fromString('1e100'));squarePoints=NumberMath.fromString('1e30');
    const sp=squarePointGainForValue(getBaseNumber()),cp=squareConvergencePointGain();
    hasClaimedKnuthPoint=true;squareConvergencePoints=1e30;
    abstractionResearchState['12-2']=true;abstractionResearchState['13-2']=true;
    return {sp:NumberMath.toNumber(NumberMath.divideApproximate(squarePointGainForValue(getBaseNumber()),sp)),
      cp:NumberMath.toNumber(NumberMath.divideApproximate(squareConvergencePointGain(),cp)),kp:NumberMath.toNumber(knuthPointGain())};
  `);
  close(data.sp,200000);close(data.cp,50);assert.equal(data.kp,11);
});

test('active fastest and idle longest KP rewards include the current completion and match payout', () => {
  for(const [id,expected] of [['13-1',Math.floor(10*(1+21/Math.sqrt(2)))],['13-3',142]]){
    const data=run(`
      hasClaimedKnuthPoint=true;knuthPoints=0;squareConvergencePoints=NumberMath.fromString('1e150');
      abstractionResearchState['${id}']=true;testNow+=300000;
      const preview=NumberMath.toNumber(knuthPointGain());beginKnuthPrestige();
      return {preview,paid:NumberMath.toNumber(knuthPoints),short:shortestKnuthRealSeconds,long:longestKnuthRealSeconds,elapsed:knuthRunRealSeconds()};
    `);
    assert.deepEqual(data,{preview:expected,paid:expected,short:300,long:300,elapsed:0});
  }
});

test('records exclude challenge starts, abandonments and completions and persist across ordinary resets', () => {
  assert.deepEqual(run(`
    hasClaimedKnuthPoint=true;testNow+=120000;
    startKnuthChallenge('kc1');testNow+=10000;abandonKnuthChallenge();
    startKnuthChallenge('kc1');squarePoints=500000;completeKnuthChallenge();
    const none=[shortestKnuthRealSeconds,longestKnuthRealSeconds];
    recordKnuthCompletion(30);recordKnuthCompletion(600);resetProgressForNewKnuthRun();
    return {none,records:[shortestKnuthRealSeconds,longestKnuthRealSeconds]};
  `),{none:[null,null],records:[30,600]});
});

test('first Knuth grants exactly one KP and only records the run once claimed', () => {
  assert.deepEqual(run(`
    abstractionResearchState['13-1']=true;abstractionResearchState['13-2']=true;
    testNow+=300000;beginKnuthPrestige();
    const before=[shortestKnuthRealSeconds,pendingKnuthCompletionSeconds,knuthPointGain()];
    testNow+=5000;claimKnuthPoint();
    return {before,paid:knuthPoints,records:[shortestKnuthRealSeconds,longestKnuthRealSeconds],pending:pendingKnuthCompletionSeconds};
  `),{before:[null,300,1],paid:1,records:[300,300],pending:null});
});

test('passive and idle diverger effects change actual formula and speed while preserving base parameters', () => {
  for(const [id,factor,speed,bFactor] of [['14-2',1.5,1.5,1],['14-3',5,0.1,5]]){
    const data=run(`
      generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
      divergerA=2;divergerB=2;divergerC=99;divergerN=2;
      abstractionResearchState['${id}']=true;
      return {a:NumberMath.toNumber(abstractionEffectiveDivergerA()),b:abstractionEffectiveDivergerB(),c:abstractionEffectiveDivergerC(),
        denominator:divergerDenominator(),log:NumberMath.toNumber(NumberMath.log10(divergerProductionValue())),
        interval:divergerEffectiveInterval(),base:[divergerA,divergerB,divergerC]};
    `);
    close(data.a,2*factor);close(data.b,2*bFactor);close(data.c,99*factor);
    close(data.log,Math.log10((2*factor)**2)+(2*bFactor+99*factor/2)*Math.log10(2));
    close(data.interval,1000/speed);assert.equal(data.denominator,1);assert.deepEqual(data.base,[2,2,99]);
  }
});

test('active final research strengthens parameters inversely with real time and accelerates speed purchases', () => {
  const data=run(`
    generalizationResearchState['3-2']=true;generalizationResearchState['4-3']=true;
    applyDivergerSpeedUpgrade(false);const before=divergerInterval;
    abstractionResearchState['14-1']=true;applyDivergerSpeedUpgrade(false);
    const after=divergerInterval;const initial=abstractionSecondBranchParameterMultiplier('a');
    testNow+=300000;const later=abstractionSecondBranchParameterMultiplier('b');
    removeDivergerUpgrade('speed');const undo=divergerInterval;
    divergerInterval=105;applyDivergerSpeedUpgrade(false);
    return {before,after,initial,later,undo,floor:divergerInterval};
  `);
  close(data.after,data.before-8*Math.log10(data.before));close(data.initial,4);close(data.later,1+3/Math.sqrt(2));
  assert.equal(data.undo,data.before);assert.equal(data.floor,100);
});

test('offline real time, completion records, branch flags and mixed speed histories survive JSON', () => {
  assert.deepEqual(run(`
    abstractionResearchState['14-1']=true;applyDivergerSpeedUpgrade(false);
    const saved=JSON.parse(JSON.stringify({knuthRunStartedAtMs,shortestKnuthRealSeconds:15,longestKnuthRealSeconds:600,
      pendingKnuthCompletionSeconds:100,history:divergerSpeedIntervalHistory,flags:abstractionResearchState}));
    testNow+=3600000;loadKnuthRealTimeState(saved);loadDivergerSpeedIntervalHistory(saved.history);loadAbstractionResearchState(saved.flags);
    const restored={seconds:knuthRunRealSeconds(),records:[shortestKnuthRealSeconds,longestKnuthRealSeconds],pending:pendingKnuthCompletionSeconds,
      history:divergerSpeedIntervalHistory,flag:hasAbstractionResearch('14-1')};
    loadKnuthRealTimeState({});loadDivergerSpeedIntervalHistory(null);
    return {restored,legacy:[knuthRunRealSeconds(),shortestKnuthRealSeconds,longestKnuthRealSeconds,pendingKnuthCompletionSeconds,divergerSpeedIntervalHistory.length]};
  `),{restored:{seconds:3600,records:[15,600],pending:100,history:[1000],flag:true},legacy:[0,null,null,null,0]});
});

test('save integration includes the real clock, records and speed history', () => {
  const source=fs.readFileSync(path.join(__dirname,'../scripts/core/save.js'),'utf8');
  for(const name of ['knuthRunStartedAtMs','shortestKnuthRealSeconds','longestKnuthRealSeconds','pendingKnuthCompletionSeconds']){
    assert.ok(source.includes(`    ${name},`));
  }
  assert.match(source,/loadKnuthRealTimeState\(isLegacySave \? \{\} : d\)/);
  assert.match(source,/divergerSpeedIntervalHistory: \[\.\.\.divergerSpeedIntervalHistory\]/);
  assert.match(source,/loadDivergerSpeedIntervalHistory\(d.divergerSpeedIntervalHistory\)/);
});

test('active peaks exceed passive fourfold and idle soft peaks are only twenty-five percent above active', () => {
  const data=run(`
    const t=ABSTRACTION_SECOND_BRANCH_BALANCE;
    return {active:[abstractionActiveTimeBonus(0,t.activeSpStrength),abstractionActiveTimeBonus(0,t.activeCpStrength),abstractionActiveTimeBonus(0,t.activeKpStrength)],
      passive:[t.passiveSp,t.passiveCp,t.passiveKp],
      idle:[abstractionIdleTimeBonus(Infinity,t.idleSpStrength),abstractionIdleTimeBonus(Infinity,t.idleCpStrength),abstractionIdleTimeBonus(Infinity,t.idleKpStrength)]};
  `);
  assert.deepEqual(data.active,[800000,200,22]);assert.deepEqual(data.passive,[200000,50,5.5]);
  assert.deepEqual(data.idle,[1000000,250,27.5]);
  for(let i=0;i<3;i++){close(data.active[i]/data.passive[i],4);close(data.idle[i]/data.active[i],1.25);}
});

test('active declines and idle rises smoothly with real seconds while idle remains bounded', () => {
  const data=run(`
    const t=ABSTRACTION_SECOND_BRANCH_BALANCE,times=[0,1,30,300,3600,86400,1e300];
    return ['Sp','Cp','Kp'].map(key=>({
      active:times.map(time=>abstractionActiveTimeBonus(time,t['active'+key+'Strength'])),
      idle:times.map(time=>abstractionIdleTimeBonus(time,t['idle'+key+'Strength'])),
      limit:1+t['idle'+key+'Strength']}));
  `);
  for(const row of data){
    assert.equal(row.idle[0],1);
    for(let i=1;i<row.active.length;i++){assert.ok(row.active[i]<row.active[i-1]);assert.ok(row.idle[i]>row.idle[i-1]);}
    assert.ok(row.idle.every(v=>Number.isFinite(v)&&v<=row.limit));
    assert.ok(row.idle[5]>row.active[0]);assert.ok(row.idle[5]<row.active[0]*1.25);
  }
});

test('actual SP CP and integer KP payouts favor active early and idle later without weakening passive', () => {
  const data=run(`
    hasClaimedKnuthPoint=true;setBaseNumber(NumberMath.fromString('1e100'));
    squarePoints=NumberMath.fromString('1e100');squareConvergencePoints=NumberMath.fromString('1e15000');
    const baseline=[squarePointGainForValue(getBaseNumber()),squareConvergencePointGain(),knuthPointGain()];
    return [['12-2','13-2',0],['12-1','13-1',0],['12-3','13-3',86400]].map(([resource,kp,seconds])=>{
      for(const id of ['12-1','12-2','12-3','13-1','13-2','13-3'])abstractionResearchState[id]=false;
      abstractionResearchState[resource]=true;abstractionResearchState[kp]=true;testNow=1000000+seconds*1000;
      const rewards=[squarePointGainForValue(getBaseNumber()),squareConvergencePointGain(),knuthPointGain()];
      return {ratios:rewards.map((v,i)=>NumberMath.toNumber(NumberMath.divideApproximate(v,baseline[i]))),
        kp:NumberMath.toNumber(rewards[2]),preview:NumberMath.toNumber(knuthPointGain())};
    });
  `);
  [200000,50,5.5].forEach((v,i)=>close(data[0].ratios[i],v));
  [800000,200,22].forEach((v,i)=>close(data[1].ratios[i],v));
  for(let i=0;i<3;i++){assert.ok(data[2].ratios[i]>data[1].ratios[i]);assert.ok(data[2].ratios[i]<data[1].ratios[i]*1.25);}
  for(const row of data){assert.equal(row.kp,row.preview);assert.equal(row.kp,Math.floor(row.kp));}
});

test('first-minute idle rewards are already meaningful and ordinary five-minute active rewards beat passive', () => {
  const data=run(`
    const t=ABSTRACTION_SECOND_BRANCH_BALANCE;
    return ['Sp','Cp','Kp'].map(key=>({passive:t['passive'+key],
      idle:abstractionIdleTimeBonus(60,t['idle'+key+'Strength']),
      active:abstractionActiveTimeBonus(300,t['active'+key+'Strength'])}));
  `);
  for(const row of data){assert.ok(row.idle>row.passive);assert.ok(row.active>row.passive*2.8);}
});

test('diverger branch parameter peaks keep active below idle but both above passive', () => {
  const data=run(`
    generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
    divergerA=2;divergerB=2;divergerC=50;divergerN=100;
    return ['14-2','14-1','14-3'].map(id=>{
      for(const research of ['14-1','14-2','14-3'])abstractionResearchState[research]=false;
      abstractionResearchState[id]=true;
      return {parameters:['a','b','c'].map(abstractionSecondBranchParameterMultiplier),
        powerLog:NumberMath.toNumber(NumberMath.log10(divergerProductionValue())),base:[divergerA,divergerB,divergerC]};
    });
  `);
  assert.deepEqual(data[0].parameters,[1.5,1,1.5]);assert.deepEqual(data[1].parameters,[4,4,4]);assert.deepEqual(data[2].parameters,[5,5,5]);
  assert.ok(data[2].powerLog>data[1].powerLog&&data[1].powerLog>data[0].powerLog);
  for(const row of data)assert.deepEqual(row.base,[2,2,50]);
});
