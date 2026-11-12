const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const source = file => fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8');

function ready(session = false) {
  const ctx = game(false, session ? {} : null);
  ctx.loadSource(source('systems/probabilizer.js'));
  ctx.loadSource(`knuthBaseUpgradeLevels.probabilizer=1;
    function seededRandom(seed=12345){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}`);
  return ctx;
}
const close = (actual, expected) => assert.ok(Math.abs(actual / expected - 1) < 1e-9, `${actual} != ${expected}`);

test('triangular rolls stay inside 1..100 and favor the center without concentrating everything there', () => {
  const row = run(ready(), `
    const random=seededRandom();let total=0,middle=0,near=0,min=100,max=1;
    for(let i=0;i<100000;i++){
      const roll=rollProbabilizer(random);total+=roll;min=Math.min(min,roll);max=Math.max(max,roll);
      if(roll>=25&&roll<=75)middle++;if(roll>=46&&roll<=55)near++;
    }
    return {mean:total/100000,middle:middle/100000,near:near/100000,min,max,
      endpoints:[rollProbabilizer(()=>0),rollProbabilizer(()=>1-Number.EPSILON)]};
  `);
  assert.ok(Math.abs(row.mean-50.5)<0.2);
  assert.ok(row.middle>0.73&&row.middle<0.79);
  assert.ok(row.near>0.17&&row.near<0.21);
  assert.deepEqual([row.min,row.max,...row.endpoints],[1,100,1,100]);
});

test('real milliseconds, not game acceleration, determine rolls; fractions carry between ticks', () => {
  assert.deepEqual(run(ready(), `
    gameTick=()=>1e200;
    const first=advanceProbabilizer(999,()=>0.5),before=plain(randomPower);
    const second=advanceProbabilizer(1,()=>0.5),third=advanceProbabilizer(2500,()=>0.5);
    return {first,before,second,third,power:plain(randomPower),last:probabilizerLastRoll,remainder:probabilizerTimerMs,
      bad:[advanceProbabilizer(-1),advanceProbabilizer(NaN),advanceProbabilizer(Infinity)]};
  `), {first:0,before:0,second:1,third:2,power:153,last:51,remainder:500,bad:[0,0,0]});
});

test('unlock and KC5 gate production and effects, never deleting accumulated power', () => {
  assert.deepEqual(run(ready(), `
    randomPower=3030;knuthBaseUpgradeLevels.probabilizer=0;
    const locked=[advanceProbabilizer(1000),plain(probabilizerDivergerParameterMultiplier()),numberBlackHoleTimeLimit()];
    knuthBaseUpgradeLevels.probabilizer=1;activeKnuthChallengeId='kc5';
    const challenge=[advanceProbabilizer(1000),plain(probabilizerDivergerParameterMultiplier()),numberBlackHoleTimeLimit()];
    activeKnuthChallengeId=null;return {locked,challenge,held:plain(randomPower),restored:plain(probabilizerDivergerParameterMultiplier())>1};
  `),{locked:[0,1,1e100],challenge:[0,1,1e100],held:3030,restored:true});
});

test('random power strengthens effective a/b inside the formula, without a second output multiplier or changes to purchased parameters', () => {
  const row=run(ready(), `
    generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
    divergerA=8;divergerB=2;divergerC=5;divergerN=20;
    const before=divergerProductionValue();advanceProbabilizer(1000,()=>0.5);
    const multiplier=plain(probabilizerDivergerParameterMultiplier());
    return {ratio:logValue(divideNumberValue(divergerProductionValue(),before)),
      expected:2*Math.log10(multiplier)+2*(multiplier-1)*Math.log10(20),
      effectiveA:plain(abstractionEffectiveDivergerA()),effectiveB:abstractionEffectiveDivergerB(),multiplier,
      updated:compareNumberValues(divergerPower,divergerProductionValue())===0,
      parameters:[divergerA,divergerB,divergerC,divergerN,divergerBLevel,divergerBCpCost]};
  `);
  close(row.ratio,row.expected);close(row.effectiveA,8*row.multiplier);close(row.effectiveB,2*row.multiplier);
  assert.equal(row.updated,true);assert.deepEqual(row.parameters,[8,2,5,20,0,32]);
});

test('one-minute no-upgrade anchor lifts the real game clock and the black-hole display beyond 1e100', () => {
  const row=run(ready(), `
    randomPower=3030;numberBlackHoleSchwarzschildRadius=()=>NumberMath.fromString('1e300');
    renderNumberBlackHoleBoard();
    return {boost:logValue(probabilizerDivergerParameterMultiplier()),limit:numberBlackHoleTimeLimit(),
      actual:numberBlackHoleTimeMultiplier(),clock:gameTick(1000)/1000,
      display:numberBlackHoleTimeLimitValue.textContent};
  `);
  close(row.boost,Math.log10(4*(1+0.15*Math.log10(1+3030/50))));
  close(row.limit,1e100*(1+6*Math.log2(1+3030/50)));
  close(row.actual,row.limit);close(row.clock,row.limit);assert.match(row.display,/e101/);
});

test('large offline batches use bounded random draws and their combined production stays within valid bounds', () => {
  const row=run(ready(), `
    let calls=0;const random=seededRandom();
    const count=advanceProbabilizer(86400*1000,()=>{calls++;return random();});
    return {count,calls,power:plain(randomPower),last:probabilizerLastRoll,remainder:probabilizerTimerMs};
  `);
  assert.equal(row.count,86400);assert.equal(row.calls,14);
  assert.ok(Math.abs(row.power-86400*50.5)<86400*0.5);
  assert.ok(row.last>=1&&row.last<=100);assert.equal(row.remainder,0);
});

test('game save roundtrips power, last roll and partial seconds; legacy saves clear only new state', () => {
  assert.deepEqual(run(ready(), `
    randomPower=NumberMath.fromString('1e1e100');probabilizerTimerMs=725;probabilizerLastRoll=67;
    const saved=captureGameSaveData();randomPower=0;probabilizerTimerMs=0;probabilizerLastRoll=null;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=[compareNumberValues(randomPower,'1e1e100')===0,probabilizerTimerMs,probabilizerLastRoll];
    delete saved.randomPower;delete saved.probabilizerTimerMs;delete saved.probabilizerLastRoll;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,restored,legacy:[plain(randomPower),probabilizerTimerMs,probabilizerLastRoll],errors};
  `),{loaded:true,restored:[true,725,67],legacy:[0,0,null],errors:[]});
});

test('Knuth, challenge and singularity resets all retain random power and the remaining roll progress', () => {
  assert.deepEqual(run(ready(), `
    randomPower=1234;probabilizerTimerMs=250;probabilizerLastRoll=75;
    resetProgressForNewKnuthRun();const knuth=plain(randomPower);
    startKnuthChallenge('kc1');const challenge=plain(randomPower);abandonKnuthChallenge();
    numberBlackHoleSystemEnabled=true;singularityPoints=0;numberBlackHoleTotalInvested=NumberMath.fromString('1e1e20');
    const singularity=purchaseSingularity();
    return {knuth,challenge,singularity,after:[plain(randomPower),probabilizerTimerMs,probabilizerLastRoll]};
  `),{knuth:1234,challenge:1234,singularity:true,after:[1234,250,75]});
});

test('nested enormous power and elapsed time never produce NaN, zero boosts or an infinite clock limit', () => {
  const rows=run(ready(), `return ['1e100','1e1e100','1e1e1000'].map(power=>{
    randomPower=NumberMath.fromString(power);const boost=probabilizerDivergerParameterMultiplier(),limit=numberBlackHoleTimeLimit();
    return {positive:compareNumberValues(boost,1)>0,serialized:NumberMath.serialize(boost).includes('NaN'),
      finite:Number.isFinite(limit),higher:limit>1e100};
  });`);
  for(const row of rows)assert.deepEqual(row,{positive:true,serialized:false,finite:true,higher:true});
});

test('subtabs and decorative dots cannot change game state or the production clock; dots have bounded DOM work', () => {
  const ctx=ready();ctx.loadSource(source('chapters/knuth.js'));
  const row=run(ctx, `
    activeChapter='knuth';setKnuthView('production');probabilizerLastTickAt=100;
    probabilizerTimerMs=321;randomPower=1234;probabilizerLastRoll=25;
    const before=JSON.stringify(captureGameSaveData());setKnuthProductionView('probabilizer');
    for(let i=0;i<20;i++)showProbabilizerRoll(i+25);
    const visible=knuthBlackHolePanel.classList.contains('hidden')&&!knuthProbabilizerPanel.classList.contains('hidden');
    const bounded=probabilizerVisualDots.length;setKnuthProductionView('black_hole');
    return {visible,bounded,clock:probabilizerLastTickAt,unchanged:before===JSON.stringify(captureGameSaveData()),
      cleaned:probabilizerVisualDots.length,blackHole:!knuthBlackHolePanel.classList.contains('hidden')};
  `);
  assert.deepEqual(row,{visible:true,bounded:3,clock:100,unchanged:true,cleaned:0,blackHole:true});
});

test('offline replay includes random production once, reports it in the summary and remains bounded at low accuracy', async () => {
  const ctx=ready(true);
  ctx.loadSource(`render=()=>window.numberTycoonSession.requestMaintenance();Math.random=()=>0.5;
    window.numberTycoonSession.initialize();`);
  run(ctx,`window.numberTycoonSession.enter();`);ctx.advance(3600000);
  assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),true);
  const row=run(ctx,`return {power:plain(randomPower),timer:probabilizerTimerMs,again:window.numberTycoonSession.phase,
    summary:document.getElementById('offlineSummaryChanges').children.some(row=>row.children[0].textContent==='무작위력:'),errors};`);
  assert.ok(row.power>=3600*50&&row.power<=3600*51);assert.equal(row.timer,0);
  assert.equal(row.again,'online');assert.equal(row.summary,true);assert.deepEqual(row.errors,[]);
});

test('all four upgrades pay KP exactly and follow their own exponential prices', () => {
  const rows = run(ready(), `return PROBABILIZER_UPGRADES.map(({id,priceExponent})=>{
    const initial=compareNumberValues(probabilizerUpgradeCost(id),'1e300')===0;
    knuthPoints=NumberMath.fromString('9.999e299');
    const blocked=buyProbabilizerUpgrade(id)===false&&probabilizerUpgradeLevels[id]===0;
    knuthPoints=probabilizerUpgradeCost(id);const bought=buyProbabilizerUpgrade(id);
    return {id,initial,blocked,bought,empty:compareNumberValues(knuthPoints,0)===0,
      level:probabilizerUpgradeLevels[id],next:logValue(probabilizerUpgradeCost(id)),priceExponent};
  });`);
  for (const row of rows) {
    assert.deepEqual([row.initial,row.blocked,row.bought,row.empty,row.level],[true,true,true,true,1]);
    close(row.next,300+row.priceExponent);
  }
  assert.deepEqual(rows.map(row=>row.priceExponent),[2,1,5,10]);
});

test('locked systems, KC5, unknown IDs and unaffordable purchases cannot spend KP or modify upgrades', () => {
  assert.deepEqual(run(ready(), `
    knuthPoints=NumberMath.fromString('1e1000');const before=NumberMath.serialize(knuthPoints);
    knuthBaseUpgradeLevels.probabilizer=0;const locked=buyProbabilizerUpgrade('a');
    knuthBaseUpgradeLevels.probabilizer=1;activeKnuthChallengeId='kc5';const kc5=buyProbabilizerUpgrade('b');
    activeKnuthChallengeId=null;const invalid=buyProbabilizerUpgrade('missing');
    return {locked,kc5,invalid,same:before===NumberMath.serialize(knuthPoints),levels:probabilizerUpgradeLevels};
  `),{locked:false,kc5:false,invalid:false,same:true,levels:{a:0,b:0,speed:0,shift:0}});
});

test('a and b multiply by 1.5, a never crosses b, and degenerate ranges remain finite', () => {
  const row = run(ready(), `
    knuthPoints=NumberMath.fromString('1e10000');
    for(let i=0;i<12;i++)if(!buyProbabilizerUpgrade('a'))throw Error('a stopped early');
    const full=probabilizerParameters(),blocked=buyProbabilizerUpgrade('a');
    const fixed=rollProbabilizer(()=>0.3);advanceProbabilizer(1000,()=>0.3);
    buyProbabilizerUpgrade('b');const reopened=!probabilizerUpgradeAtMaximum('a');buyProbabilizerUpgrade('a');
    return {full,blocked,fixed,power:plain(randomPower),reopened,after:probabilizerParameters()};
  `);
  assert.deepEqual(row.full,{a:100,b:100,mode:100,intervalMs:1000});
  assert.equal(row.blocked,false);assert.equal(row.fixed,100);assert.equal(row.power,100);assert.equal(row.reopened,true);
  assert.deepEqual(row.after,{a:150,b:150,mode:150,intervalMs:1000});
});

test('shift moves the triangular peak toward b by one per purchase and never past the range', () => {
  const row = run(ready(), `
    PROBABILIZER_COST_BALANCE.kpBandStartExponent=1e9;
    knuthPoints=NumberMath.fromString('1e100000');for(let i=0;i<20;i++)buyProbabilizerUpgrade('shift');
    const partial=probabilizerParameters(),random=seededRandom();let sum=0,min=100,max=1;
    for(let i=0;i<100000;i++){const roll=rollProbabilizer(random);sum+=roll;min=Math.min(min,roll);max=Math.max(max,roll);}
    let added=0;while(buyProbabilizerUpgrade('shift'))if(++added>100)throw Error('unbounded shift');
    const final=probabilizerParameters();
    return {partial,mean:sum/100000,min,max,final,added,level:probabilizerUpgradeLevels.shift,
      endpoints:[rollProbabilizer(()=>0),rollProbabilizer(()=>1-Number.EPSILON)]};
  `);
  assert.equal(row.partial.mode,70.5);assert.ok(Math.abs(row.mean-(1+100+70.5)/3)<0.2);
  assert.ok(row.min>=1&&row.max<=100);assert.equal(row.final.mode,100);
  assert.deepEqual([row.added,row.level,...row.endpoints],[30,50,1,100]);
});

test('speed preserves fractional roll progress, reaches 1ms after 31 purchases and cannot bypass its floor', () => {
  const row = run(ready(), `
    knuthPoints=NumberMath.fromString('1e10000');advanceProbabilizer(500,()=>0.5);
    buyProbabilizerUpgrade('speed');const fraction=probabilizerTimerMs;
    const early=advanceProbabilizer(399,()=>0.5),onTime=advanceProbabilizer(1,()=>0.5);
    let purchases=1;while(buyProbabilizerUpgrade('speed'))if(++purchases>40)throw Error('unbounded speed');
    const before=NumberMath.serialize(knuthPoints);const extra=buyProbabilizerUpgrade('speed');
    randomPower=0;let calls=0;const count=advanceProbabilizer(1000,()=>{calls++;return 0.5;});
    return {fraction,early,onTime,purchases,interval:probabilizerParameters().intervalMs,extra,
      same:before===NumberMath.serialize(knuthPoints),count,calls,power:plain(randomPower)};
  `);
  assert.deepEqual(row,{fraction:400,early:0,onTime:1,purchases:31,interval:1,extra:false,same:true,count:1000,calls:14,power:50500});
});

test('shifted fast offline batches use the shifted mean and variance with bounded random work', () => {
  const row = run(ready(), `
    probabilizerUpgradeLevels={a:10,b:20,speed:31,shift:40};
    let calls=0;const count=advanceProbabilizer(3600000,()=>{calls++;return 0.5;});
    const {a,b,mode}=probabilizerParameters();
    return {count,calls,power:plain(randomPower),expected:Math.floor((count-1)*(a+b+mode)/3)+probabilizerLastRoll,
      remainder:probabilizerTimerMs,last:probabilizerLastRoll,a,b};
  `);
  assert.equal(row.count,3600000);assert.equal(row.calls,13);
  assert.ok(Math.abs(row.power-row.expected)<2);assert.equal(row.remainder,0);
  assert.ok(row.last>=row.a&&row.last<=row.b);
});

test('save roundtrips upgrade levels and upgraded timer bounds; old and malformed saves get safe defaults', () => {
  assert.deepEqual(run(ready(), `
    probabilizerUpgradeLevels={a:3,b:9,speed:31,shift:10};probabilizerTimerMs=0.75;probabilizerLastRoll=105;
    const saved=captureGameSaveData();probabilizerUpgradeLevels.a=99;
    const independent=saved.probabilizerUpgradeLevels.a===3;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored={...probabilizerUpgradeLevels},timer=probabilizerTimerMs,last=probabilizerLastRoll;
    resetProgressForNewKnuthRun();startKnuthChallenge('kc1');abandonKnuthChallenge();
    const retained=JSON.stringify(restored)===JSON.stringify(probabilizerUpgradeLevels);
    delete saved.probabilizerUpgradeLevels;loadProbabilizerState(saved);
    const legacy={...probabilizerUpgradeLevels};
    loadProbabilizerState({probabilizerUpgradeLevels:{a:-1,b:Infinity,speed:999,shift:NaN},probabilizerTimerMs:Infinity});
    return {independent,restored,timer,last,retained,legacy,bad:probabilizerUpgradeLevels,badTimer:probabilizerTimerMs,errors};
  `),{independent:true,restored:{a:3,b:9,speed:31,shift:10},timer:0.75,last:105,retained:true,
    legacy:{a:0,b:0,speed:0,shift:0},bad:{a:0,b:0,speed:31,shift:0},badTimer:0,errors:[]});
});

test('upgrade buttons, range labels, 1ms price cap and fast visual work remain synchronized', () => {
  const ctx=ready();ctx.loadSource(source('chapters/knuth.js'));
  const row=run(ctx, `
    knuthPoints=NumberMath.fromString('1e1000');setKnuthView('production');setKnuthProductionView('probabilizer');
    const initialMode=probabilizerModeValue.textContent,initialTick=probabilizerTicks[1].textContent;
    document.getElementById('probabilizerBUpgradeBtn').events.click();
    document.getElementById('probabilizerShiftUpgradeBtn').events.click();
    probabilizerUpgradeLevels.speed=31;renderProbabilizerBoard();activeChapter='knuth';
    for(let i=0;i<1000;i++)showProbabilizerRoll(25);
    const before=plain(randomPower);showProbabilizerRoll(99);
    return {initialMode,initialTick,levels:probabilizerUpgradeLevels,b:probabilizerBValue.textContent,mode:probabilizerModeValue.textContent,
      interval:probabilizerIntervalValue.textContent,disabled:document.getElementById('probabilizerSpeedUpgradeBtn').disabled,
      cost:document.getElementById('probabilizerSpeedUpgradeCost').textContent,
      tick:probabilizerTicks[4].textContent,visuals:probabilizerVisualDots.length,unchanged:before===plain(randomPower)};
  `);
  assert.deepEqual(row,{initialMode:'50.5',initialTick:'25.75',levels:{a:0,b:1,speed:31,shift:1},b:'150',mode:'76.5',interval:'현실 시간 1ms',disabled:true,
    cost:'최소 간격 1ms',tick:'150',visuals:21,unchanged:true});
});

test('saved a/b purchases use multiplicative growth without changing paid levels, prices or accumulated power', () => {
  const row=run(ready(), `
    loadProbabilizerState({randomPower:'1234',probabilizerUpgradeLevels:{a:2,b:2,speed:0,shift:0},
      probabilizerTimerMs:250,probabilizerLastRoll:100});
    renderProbabilizerBoard();
    return {parameters:probabilizerParameters(),levels:probabilizerUpgradeLevels,power:plain(randomPower),
      timer:probabilizerTimerMs,last:probabilizerLastRoll,costs:['a','b'].map(id=>logValue(probabilizerUpgradeCost(id))),
      previews:['A','B'].map(id=>document.getElementById('probabilizer'+id+'UpgradeLabel').textContent)};
  `);
  assert.deepEqual(row.parameters,{a:2.25,b:225,mode:113.625,intervalMs:1000});
  assert.deepEqual(row.levels,{a:2,b:2,speed:0,shift:0});
  assert.deepEqual([row.power,row.timer,row.last,...row.costs],[1234,250,100,304,302]);
  assert.deepEqual(row.previews,['a값 증가 · 2.25 → 3.38','b값 증가 · 225 → 337.5']);
});

test('fractional ranges never leak rounded rolls outside bounds and equal fractional endpoints survive save/load and bulk production', () => {
  const row=run(ready(), `
    probabilizerUpgradeLevels={a:2,b:2,speed:0,shift:0};
    const {a,b}=probabilizerParameters(),random=seededRandom();let valid=true;
    for(const shift of [0,1,1000]){
      probabilizerUpgradeLevels.shift=shift;
      for(let i=0;i<10000;i++){const value=rollProbabilizer(random);if(value<a||value>b||!Number.isFinite(value))valid=false;}
    }
    probabilizerUpgradeLevels={a:30,b:2,speed:31,shift:0};
    const fixed=rollProbabilizer(()=>0.5);advanceProbabilizer(1000,()=>0.5);
    const saved=captureGameSaveData();loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=probabilizerLastRoll;
    probabilizerUpgradeLevels.a=1000000;probabilizerUpgradeLevels.b=1000000;
    const huge=probabilizerParameters();
    return {valid,fixed,power:plain(randomPower),restored,hugeFinite:Object.values(huge).every(Number.isFinite),
      maxed:probabilizerUpgradeAtMaximum('b')};
  `);
  assert.deepEqual(row,{valid:true,fixed:225,power:225000,restored:225,hugeFinite:true,maxed:true});
});
