const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function setup() {
  const ctx = game(true);
  ctx.loadSource(`squareBreakthroughLevels.dyson_swarm=2000;
    squareBreakthroughLevels.overclock=8;squareBreakthroughLevels.bottleneck_tracker=8;
    squareBreakthroughLevels.invisible_hand=8;`);
  return ctx;
}

test('ordinary breakthrough effects preserve their original formulas', () => {
  const rows = run(game(true), `return [0,1,8,12].map(dyson=>{
    squareBreakthroughLevels.dyson_swarm=dyson;
    squareBreakthroughLevels.overclock=3;squareBreakthroughLevels.bottleneck_tracker=2;
    squareBreakthroughLevels.invisible_hand=4;
    return {dyson,cap:plain(percentPowerSoftcapBonusLevels()),start:plain(percentPowerPriceAccelerationStart()),
      efficiency:plain(percentEfficiencyMultiplier()),speed:plain(autoUpgradeSpeedMultiplier()),
      cost:plain(percentPowerUpgradeCostForNextLevel(20))};
  });`);
  for (const row of rows) {
    const multiplier = 2 ** row.dyson;
    assert.equal(row.cap, 12 * multiplier);
    assert.equal(row.start, 8 + 4 * multiplier);
    assert.equal(row.efficiency, 1 + multiplier / 2);
    assert.ok(Math.abs(row.speed / ((1.5 * multiplier) ** 4) - 1) < 1e-12);
    const accelerated = Math.max(0, 21 - row.start);
    assert.ok(Math.abs(Math.log10(row.cost) - (Math.log10(40000) + 19 + accelerated * (accelerated + 1) / 2)) < 1e-10);
  }
});

test('large Dyson counts retain growing effects and softcaps beyond native numeric range', () => {
  const rows = run(setup(), `return [1023,1024,2000,2000000].map(dyson=>{
    squareBreakthroughLevels.dyson_swarm=dyson;
    const boost=dysonEffectMultiplier();
    const expectedBonus=multiplyNumberValue(32,boost);
    const values=[percentPowerSoftcapBonusLevels(),percentPowerPriceAccelerationStart(),
      percentEfficiencyMultiplier(),autoUpgradeSpeedMultiplier(),percentPowerSoftcap(1)];
    return {positive:values.every(NumberMath.isPositive),text:values.map(NumberMath.serialize),
      bonus:compareNumberValues(values[0],expectedBonus)===0,
      capLog:compareNumberValues(NumberMath.log10(values[4]),addBaseNumbers(12,expectedBonus))===0,
      cost:NumberMath.serialize(percentPowerUpgradeCostForNextLevel(2)),speedLog:logValue(values[3])};
  });`);
  for (const row of rows) {
    assert.equal(row.positive, true);
    assert.equal(row.bonus, true);
    assert.equal(row.capLog, true);
    assert.equal(row.cost, '400000');
    assert.ok(row.text.every(text => !/Infinity|NaN|undefined/.test(text)));
  }
  for (let i=1;i<rows.length;i++) assert.ok(rows[i].speedLog > rows[i-1].speedLog);
});

test('unbought breakthrough effects stay neutral even with millions of swarms', () => {
  const r = run(setup(), `squareBreakthroughLevels.dyson_swarm=2000000;
    squareBreakthroughLevels.overclock=0;squareBreakthroughLevels.bottleneck_tracker=0;
    squareBreakthroughLevels.invisible_hand=0;
    return [percentPowerSoftcapBonusLevels(),percentPowerPriceAccelerationStart(),percentEfficiencyMultiplier(),
      autoUpgradeSpeedMultiplier(),percentPowerSoftcap(1),percentPowerUpgradeCostForNextLevel(20)]
      .map(NumberMath.serialize);`);
  assert.deepEqual(r, ['0','8','1','1','1000000000000','4e114']);
});

test('bottleneck efficiency stays consistent between single and bulk percent production', () => {
  const r = run(setup(), `
    const gain=applyPercentEfficiency(400);
    const numerator=percentEfficiencyMultiplierNumerator();
    const ratio=percentUseGainRatio(1);
    const expectedRatio=NumberMath.divideApproximate(numerator,400);
    const single=percentUseValueAfterOne(100,1);
    setBaseNumber(100);applyPercentUsesBatch(1,100,'test');
    const expected= multiplyNumberValue(100,NumberMath.power(addBaseNumbers(1,expectedRatio),100));
    return {gain:plain(NumberMath.divideApproximate(gain,multiplyNumberValue(100,numerator))),
      ratio:compareNumberValues(ratio,expectedRatio)===0,
      single:compareNumberValues(single,addBaseNumbers(100,NumberMath.divideApproximate(numerator,4)))===0,
      bulkLog:logValue(getBaseNumber()),expectedLog:logValue(expected)};`);
  assert.ok(Math.abs(r.gain - 1) < 1e-12);
  assert.equal(r.ratio, true);
  assert.equal(r.single, true);
  assert.ok(Math.abs(r.bulkLog - r.expectedLog) < 1e-5);
});

test('effect cards and N amounts format huge values without native coercion', () => {
  const ctx = setup();
  const rows = run(ctx, `return ['overclock','bottleneck_tracker','invisible_hand'].map(id=>{
    const upgrade=SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id===id);
    const amount=nBreakthroughUpgradeAmount(id,squareBreakthroughLevel(id));
    return {text:squareBreakthroughEffectText(upgrade),amount:NumberMath.serialize(amount),
      large:compareNumberValues(amount,Number.MAX_VALUE)>0};
  });`);
  for(const row of rows) {
    assert.ok(row.large);
    assert.ok(!/Infinity|NaN|undefined|object Object/.test(row.text + row.amount));
  }
});

test('automatic buyers cap scheduler work without truncating the stored speed multiplier', () => {
  const r = run(setup(), `
    gameTick=ms=>ms;
    const zero=autoUpgradeElapsedTime(0),bounded=autoUpgradeElapsedTime(50,64000);
    generalizationResearchState['3-4']=true;generalizationResearchState['7-2']=true;
    squareDimensionAutoUpgradeEnabled=true;
    let dimension=0;tryAutomaticSquareDimensionUpgradeBatch=n=>(dimension=n);
    advanceSquareDimensionAutoUpgrade(50);
    generalizationResearchState['3-2']=true;abstractionResearchState['7-1']=true;divergerAutoUpgradeEnabled=true;
    let diverger=0;buyDivergerAUpgrade=()=>{diverger++;return true;};advanceDivergerAutoUpgrade(50);
    completedKnuthChallengeIds.add('kc4');numberBlackHoleAutoUpgradeEnabled=true;
    let blackHole=0;buyNumberBlackHoleUpgrade=()=>{blackHole++;return true;};advanceNumberBlackHoleAutomation(50);
    completedKnuthChallengeIds.add('kc5');knuthBaseAutoEnabled.cp_gain=true;
    let knuth=0;buyKnuthBaseUpgrade=()=>{knuth++;return true;};advanceKnuthBaseAutomation(50);
    return {zero,bounded,dimension,diverger,blackHole,knuth,base:automaticUpgradeBatchSizeForElapsed(50),
      timers:[squareDimensionAutoUpgradeTimer,divergerAutoUpgradeTimer,numberBlackHoleAutoTimerMs,knuthBaseAutoTimerMs].every(Number.isFinite),
      speedNotCapped:compareNumberValues(autoUpgradeSpeedMultiplier(),Number.MAX_VALUE)>0};`);
  assert.deepEqual(r,{zero:0,bounded:64000,dimension:256,diverger:256,blackHole:256,knuth:64,base:256,
    timers:true,speedNotCapped:true});
});

test('legacy purchase levels restore derived effects rather than storing overflowed numbers', () => {
  const r = run(setup(), `
    knuthBaseUpgradeLevels.dyson_limit=2000;knuthBaseUpgradeLevels.overclock_limit=10;
    const saved=JSON.stringify(captureGameSaveData());squareBreakthroughLevels.dyson_swarm=0;
    const loaded=loadGame(saved,{persistOverride:false,countAsLoad:false});
    const values=[percentPowerSoftcapBonusLevels(),percentEfficiencyMultiplier(),autoUpgradeSpeedMultiplier()];
    return {loaded,level:squareBreakthroughLevel('dyson_swarm'),
      valid:values.every(v=>compareNumberValues(v,Number.MAX_VALUE)>0)
        &&values.map(NumberMath.serialize).every(v=>!/Infinity|NaN/.test(v)),errors};`);
  assert.deepEqual(r,{loaded:true,level:2000,valid:true,errors:[]});
});

test('abstraction 2-1 percent automation consumes ready uses with a huge hand multiplier', () => {
  const r = run(setup(), `
    gameTick=ms=>ms;abstractionResearchState['2-1']=true;
    percentUnlocked=true;percentAutoUnlocked=true;percentAutoSpeed=1000;
    percentCharge=0;pendingPercentUses=10;setBaseNumber(100);
    advanceAutomaticPercentUses(0);const untouched=pendingPercentUses===10&&percentAutoTimer===0;
    advanceAutomaticPercentUses(1);
    return {untouched,pending:pendingPercentUses,timer:Number.isFinite(percentAutoTimer),
      grew:compareBaseNumber(100)>0,value:NumberMath.serialize(getBaseNumber())};`);
  assert.equal(r.untouched,true);
  assert.equal(r.pending,0);
  assert.equal(r.timer,true);
  assert.equal(r.grew,true);
  assert.ok(!/Infinity|NaN|undefined/.test(r.value));
});
