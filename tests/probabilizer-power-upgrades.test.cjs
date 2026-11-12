const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  ctx.loadSource('knuthBaseUpgradeLevels.probabilizer=1;');
  return ctx;
}
const close=(actual,expected)=>assert.ok(Math.abs(actual/expected-1)<1e-9,`${actual} != ${expected}`);

test('power upgrades spend only random power and use 1b/5b/5b bases and 10/50/25 growth', () => {
  const rows=run(ready(), `return PROBABILIZER_POWER_UPGRADES.map(({id,baseCost,growth})=>{
    knuthPoints=123;randomPower=baseCost-1;
    const blocked=!buyProbabilizerPowerUpgrade(id);
    randomPower=baseCost;const bought=buyProbabilizerPowerUpgrade(id);
    return {id,baseCost,growth,blocked,bought,left:plain(randomPower),kp:knuthPoints,
      level:probabilizerPowerUpgradeLevels[id],cost:plain(probabilizerPowerUpgradeCost(id))};
  });`);
  assert.deepEqual(rows,[
    {id:'gain',baseCost:1e9,growth:10,blocked:true,bought:true,left:0,kp:123,level:1,cost:1e10},
    {id:'diverger',baseCost:5e9,growth:50,blocked:true,bought:true,left:0,kp:123,level:1,cost:25e10},
    {id:'interval_floor',baseCost:5e9,growth:25,blocked:true,bought:true,left:0,kp:123,level:1,cost:125e9}
  ]);
});

test('locked, KC5 and invalid power purchases leave both currencies and levels untouched', () => {
  assert.deepEqual(run(ready(), `
    randomPower=NumberMath.fromString('1e100');knuthPoints=123;
    const before=JSON.stringify([randomPower,probabilizerPowerUpgradeLevels]);
    knuthBaseUpgradeLevels.probabilizer=0;const locked=!buyProbabilizerPowerUpgrade('gain');
    knuthBaseUpgradeLevels.probabilizer=1;activeKnuthChallengeId='kc5';const kc5=!buyProbabilizerPowerUpgrade('diverger');
    activeKnuthChallengeId=null;const invalid=!buyProbabilizerPowerUpgrade('missing');
    return {locked,kc5,invalid,unchanged:before===JSON.stringify([randomPower,probabilizerPowerUpgradeLevels]),kp:knuthPoints};
  `),{locked:true,kc5:true,invalid:true,unchanged:true,kp:123});
});

test('3x production compounds for exact and coarse batches without changing sampled values or distribution', () => {
  const rows=run(ready(), `const rows=[];
    for(const level of [0,1,2,10])for(const elapsed of [1000,1000000]){
      probabilizerPowerUpgradeLevels.gain=level;probabilizerTimerMs=0;randomPower=0;
      let calls=0;const count=advanceProbabilizer(elapsed,()=>{calls++;return .5;});
      rows.push({level,elapsed,count,calls,gain:plain(randomPower),last:probabilizerLastRoll});
    }return rows;`);
  for(const row of rows){
    const base=row.elapsed===1000?51:50500;
    close(row.gain,base*3**row.level);
    assert.equal(row.count,row.elapsed/1000);assert.equal(row.last,51);
    assert.equal(row.calls,row.elapsed===1000?2:14);
  }
});

test('1.5x diverger upgrades compound with 20-1 without amplifying the time ceiling or raw a/b purchases', () => {
  const r=run(ready(), `
    randomPower=NumberMath.fromString('1e16');abstractionResearchState['20-1']=true;
    generalizationResearchState['3-2']=true;divergerA=10;divergerB=3;divergerN=10;
    const raw=JSON.stringify([divergerA,divergerB,divergerN,divergerACpCost,divergerBCpCost]);
    buyProbabilizerPowerUpgrade('diverger');buyProbabilizerPowerUpgrade('diverger');
    const upgraded=probabilizerDivergerParameterMultiplier(),limit=numberBlackHoleTimeLimit();
    const refreshed=compareNumberValues(divergerPower,divergerProductionValue())===0;
    probabilizerPowerUpgradeLevels.diverger=0;
    return {ratio:plain(NumberMath.divideApproximate(upgraded,probabilizerDivergerParameterMultiplier())),refreshed,
      sameLimit:limit===numberBlackHoleTimeLimit(),rawSame:raw===JSON.stringify([divergerA,divergerB,divergerN,divergerACpCost,divergerBCpCost])};
  `);
  close(r.ratio,2.25);assert.ok(r.refreshed&&r.sameLimit&&r.rawSame);
});

test('halved floors reopen KP speed purchases, keep roll progress, and reach 0.5 then 0.25ms', () => {
  const r=run(ready(), `
    randomPower=NumberMath.fromString('1e100');knuthPoints=NumberMath.fromString('1e10000');
    probabilizerUpgradeLevels.speed=31;probabilizerTimerMs=.3;
    const oldMaximum=probabilizerUpgradeAtMaximum('speed'),rows=[];
    for(let level=1;level<=2;level++){
      buyProbabilizerPowerUpgrade('interval_floor');
      const ratio=probabilizerTimerMs/probabilizerParameters().intervalMs;
      const reopened=!probabilizerUpgradeAtMaximum('speed');let bought=0;
      while(buyProbabilizerUpgrade('speed'))if(++bought>10)throw Error('unbounded speed purchases');
      rows.push({floor:probabilizerMinimumInterval(),interval:probabilizerParameters().intervalMs,reopened,bought,ratio});
    }
    const stopped=!buyProbabilizerUpgrade('speed');return {oldMaximum,rows,stopped};
  `);
  assert.ok(r.oldMaximum&&r.stopped);
  assert.deepEqual(r.rows.map(({ratio,...rest})=>rest),[
    {floor:.5,interval:.5,reopened:true,bought:4},
    {floor:.25,interval:.25,reopened:true,bought:3}
  ]);
  r.rows.forEach(row=>close(row.ratio,.3));
});

test('sub-ms intervals produce the full real-time roll count with bounded sampling work', () => {
  const r=run(ready(), `
    probabilizerPowerUpgradeLevels={gain:2,diverger:1,interval_floor:2};probabilizerUpgradeLevels.speed=38;
    let calls=0;const count=advanceProbabilizer(1000,()=>{calls++;return .5;});
    return {count,calls,power:plain(randomPower),floor:probabilizerMinimumInterval(),last:probabilizerLastRoll};
  `);
  assert.deepEqual(r,{count:4000,calls:14,power:1818000,floor:.25,last:51});
});

test('extreme sub-ms floors use NumberMath instead of overflowing roll counts, with no 0ms display', () => {
  const r=run(ready(), `
    probabilizerPowerUpgradeLevels={gain:1000,diverger:1000,interval_floor:1074};probabilizerUpgradeLevels.speed=4000;
    let calls=0;const count=advanceProbabilizer(1000,()=>{calls++;return .5;});
    renderProbabilizerBoard();
    return {calls,positive:isPositiveNumberValue(randomPower),count:NumberMath.serialize(count),
      value:NumberMath.serialize(randomPower),interval:probabilizerParameters().intervalMs,
      intervalText:probabilizerIntervalValue.textContent,maximum:probabilizerPowerUpgradeAtMaximum('interval_floor'),
      timer:probabilizerTimerMs,errors};
  `);
  assert.equal(r.calls,14);assert.ok(r.positive&&r.maximum);assert.equal(r.interval,Number.MIN_VALUE);
  assert.doesNotMatch(JSON.stringify(r),/NaN|Infinity|undefined/);assert.doesNotMatch(r.intervalText,/시간 0ms/);
  assert.ok(r.timer>=0&&r.timer<r.interval);assert.deepEqual(r.errors,[]);
});

test('new levels save independently, restore sub-ms speeds, survive prestiges and default safely in old saves', () => {
  assert.deepEqual(run(ready(), `
    probabilizerPowerUpgradeLevels={gain:2,diverger:3,interval_floor:2};probabilizerUpgradeLevels.speed=38;
    randomPower=1234;probabilizerTimerMs=.125;
    const saved=captureGameSaveData();probabilizerPowerUpgradeLevels.gain=99;
    const independent=saved.probabilizerPowerUpgradeLevels.gain===2;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored={levels:{...probabilizerPowerUpgradeLevels},speed:probabilizerUpgradeLevels.speed,
      timer:probabilizerTimerMs,floor:probabilizerMinimumInterval(),power:plain(randomPower)};
    resetProgressForNewKnuthRun();startKnuthChallenge('kc1');abandonKnuthChallenge();
    singularityPoints=0;numberBlackHoleSystemEnabled=true;numberBlackHoleSchwarzschildRadius=()=>20;purchaseSingularity();
    const retained=JSON.stringify(restored.levels)===JSON.stringify(probabilizerPowerUpgradeLevels);
    delete saved.probabilizerPowerUpgradeLevels;saved.probabilizerUpgradeLevels.speed=999;loadProbabilizerState(saved);
    const legacy={levels:{...probabilizerPowerUpgradeLevels},speed:probabilizerUpgradeLevels.speed,floor:probabilizerMinimumInterval()};
    loadProbabilizerState({probabilizerPowerUpgradeLevels:{gain:-1,diverger:Infinity,interval_floor:Infinity}});
    return {independent,loaded,restored,retained,legacy,bad:probabilizerPowerUpgradeLevels,errors};
  `),{independent:true,loaded:true,restored:{levels:{gain:2,diverger:3,interval_floor:2},speed:38,timer:.125,floor:.25,power:1234},
    retained:true,legacy:{levels:{gain:0,diverger:0,interval_floor:0},speed:31,floor:1},
    bad:{gain:0,diverger:0,interval_floor:0},errors:[]});
});

test('UI buttons pay random power, refresh multiplier, next price and current floor labels', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    randomPower=NumberMath.fromString('1e16');knuthPoints=123;probabilizerUpgradeLevels.speed=31;
    setKnuthView('production');setKnuthProductionView('probabilizer');
    for(const name of ['Gain','Diverger','IntervalFloor'])document.getElementById('probabilizerPower'+name+'UpgradeBtn').events.click();
    renderProbabilizerBoard();
    return {levels:probabilizerPowerUpgradeLevels,kp:knuthPoints,
      gain:document.getElementById('probabilizerPowerGainValue').textContent,
      diverger:document.getElementById('probabilizerPowerDivergerUpgradeLabel').textContent,
      floor:document.getElementById('probabilizerMinimumIntervalValue').textContent,
      cost:document.getElementById('probabilizerPowerGainUpgradeCost').textContent,
      description:document.getElementById('probabilizerSpeedUpgradeDescription').textContent,
      speedEnabled:!document.getElementById('probabilizerSpeedUpgradeBtn').disabled};
  `),{levels:{gain:1,diverger:1,interval_floor:1},kp:123,gain:'×3',diverger:'발산자 강화 증폭 · ×1.5',floor:'0.5ms',cost:'비용: 10b 무작위력',
    description:'추첨 간격을 20% 줄입니다. 최소 간격은 0.5ms입니다. 가격은 ×1e5, 1e500 KP부터 ×1e10입니다.',speedEnabled:false});
});
