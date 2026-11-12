const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('native Dyson overflow no longer turns the black-hole clock and displayed acceleration into NaN/zero', () => {
  const ctx = game(true);
  const result = run(ctx, `
    squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=10000;
    renderNumberBlackHoleBoard();
    return {dyson:String(dysonEffectNumber()),time:gameTick(1000),limit:numberBlackHoleTimeLimit(),
      display:numberBlackHoleTimeMultiplierValue.textContent,errors};
  `);
  assert.equal(result.dyson, 'Infinity');
  assert.equal(result.time, 1000 * result.limit);
  assert.notEqual(result.display, '×0');
  assert.doesNotMatch(result.display, /NaN|undefined|Infinity/);
  assert.deepEqual(result.errors, []);
});

test('large but finite Dyson factors that overflow during milliseconds multiplication also saturate at the existing cap', () => {
  for (const level of [1000, 1010, 1020, 1023, 1024, 10000]) {
    const ctx = game(true);
    const result = run(ctx, `squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=${level};
      return [1,10,50,1000,1e9].map(ms=>({ms,tick:gameTick(ms),limit:numberBlackHoleTimeLimit()}));`);
    for (const row of result) {
      assert.ok(Number.isFinite(row.tick) && row.tick > 0);
      assert.ok(Math.abs(row.tick / (row.ms * row.limit) - 1) < 1e-12);
    }
  }
});

test('uncapped ordinary ticks keep every previous floor and multiplier exactly', () => {
  const ctx = game(true);
  const rows = run(ctx, `const rows=[];
    for(const speed of [false,true])for(const blackHole of [0,1])for(const timium of [false,true]){
      squareUpgradeState.game_speed_1_5=speed;squareBreakthroughLevels.black_hole=blackHole;
      squareBreakthroughLevels.dyson_swarm=4;squareConvergenceUpgradeState.timium=timium;
      numberBlackHoleTotalInvested=1e100;
      for(const ms of [0,.1,.5,1,10,10.5,50,1000]){
        let expected=speed?Math.floor(ms*1.5):ms;
        if(blackHole)expected=Math.floor(expected*2*dysonEffectNumber()*abstractionBlackHoleTimeMultiplier());
        if(timium)expected*=2048;
        if(ms>0)expected=Math.floor(expected*Math.min(numberBlackHoleTimeMultiplier(),
          numberBlackHoleTimeLimit()/Math.max(expected/ms,Number.MIN_VALUE)));
        rows.push({actual:gameTick(ms),expected});
      }
    }return rows;`);
  for (const row of rows) assert.equal(row.actual, row.expected);
});

test('overflow fallback matches an independent big-number reference including all speed effects and huge elapsed intervals', () => {
  const ctx = game(true);
  const result = run(ctx, `
    squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=1010;
    squareUpgradeState.game_speed_1_5=true;squareConvergenceUpgradeState.timium=true;
    abstractionResearchState['5-1']=true;
    knuthBaseUpgradeLevels.probabilizer=1;randomPower=NumberMath.fromString('1e1e100');
    const rows=[];
    for(const ms of [1,10,1000,1e13,1e30,1e100,Number.MAX_VALUE]){
      let expected=NumberMath.floor(multiplyNumberValue(ms,1.5));
      expected=NumberMath.floor(multiplyNumberValue(multiplyNumberValue(multiplyNumberValue(expected,2),
        dysonEffectMultiplier()),abstractionBlackHoleTimeMultiplier()));
      expected=multiplyNumberValue(multiplyNumberValue(expected,2048),numberBlackHoleTimeMultiplier());
      expected=NumberMath.floor(NumberMath.min(expected,multiplyNumberValue(ms,numberBlackHoleTimeLimit())));
      expected=NumberMath.toNumber(NumberMath.min(Number.MAX_VALUE,expected));
      rows.push({actual:gameTick(ms),expected});
    }return rows;`);
  for (const row of result) {
    assert.ok(Number.isFinite(row.actual) && row.actual > 0);
    assert.ok(Math.abs(row.actual / row.expected - 1) < 1e-12);
  }
});

test('a tiny elapsed interval is not incorrectly promoted to the cap merely because its native Dyson factor overflowed', () => {
  const ctx = game(true);
  const rows = run(ctx, `squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=1030;
    knuthBaseUpgradeLevels.probabilizer=1;randomPower=NumberMath.fromString('1e1e100');
    return [1e-310,1e-300,1e-290].map(ms=>({actual:gameTick(ms),cap:ms*numberBlackHoleTimeLimit()}));`);
  for (const row of rows) assert.equal(row.actual, Math.floor(row.cap));
});

test('huge elapsed milliseconds obey both the real acceleration cap and native timer range', () => {
  const ctx = game(true);
  const row = run(ctx, `squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=970;
    knuthBaseUpgradeLevels.probabilizer=1;randomPower=NumberMath.fromString('1e1e100');
    const ms=1e20;return {actual:gameTick(ms),limit:numberBlackHoleTimeLimit(),
      expected:NumberMath.toNumber(NumberMath.min(Number.MAX_VALUE,NumberMath.min(
        multiplyNumberValue(ms,numberBlackHoleTimeLimit()),multiplyNumberValue(ms*2,dysonEffectMultiplier()))))};`);
  assert.ok(Number.isFinite(row.actual));
  assert.equal(row.actual, row.expected);
});

test('KC4 still slows the capped clock and KC5/locked/disabled black holes keep their old rules', () => {
  const ctx = game(true);
  const result = run(ctx, `squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=10000;
    const full=gameTick(1000);activeKnuthChallengeId='kc4';kc4ElapsedRealSeconds=1;
    const slow=gameTick(1000);activeKnuthChallengeId='kc5';squareBreakthroughLevels.dyson_swarm=4;
    const kc5=gameTick(1000);activeKnuthChallengeId=null;numberBlackHoleSystemEnabled=false;
    const disabled=gameTick(1000);numberBlackHoleSystemEnabled=true;knuthUnlocked=false;
    return {full,slow,kc5,disabled,locked:gameTick(1000)};`);
  assert.equal(result.slow, result.full / 2);
  assert.equal(result.kc5, 32000);
  assert.equal(result.disabled, 32000);
  assert.equal(result.locked, 32000);
});

test('save/load of an overflow-scale Dyson upgrade retains progression and a positive clock', () => {
  const ctx = game(true);
  const row = run(ctx, `squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=10000;
    knuthBaseUpgradeLevels.dyson_limit=9992;
    higgsParticles=526000;const before=gameTick(1000);saveGame();squareBreakthroughLevels.dyson_swarm=0;
    const loaded=loadGame();return {before,after:gameTick(1000),level:squareBreakthroughLevels.dyson_swarm,
      higgs:NumberMath.serialize(higgsParticles),loaded,errors};`);
  assert.equal(row.loaded, true);
  assert.equal(row.level, 10000);
  assert.equal(row.after, row.before);
  assert.equal(row.higgs, '526000');
  assert.deepEqual(row.errors, []);
});

test('time-based production and accumulated time continue advancing with the repaired overflow clock', () => {
  const ctx = game(true);
  const row = run(ctx, `squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.dyson_swarm=10000;
    squareUnlocked=true;generalizationResearchState['3-2']=true;divergerInterval=1000;
    const before=divergerN;advanceDiverger(10);advanceSquareRunTime(10);advanceNumberBlackHole(10);
    return {n:compareNumberValues(divergerN,before)>0,time:isPositiveNumberValue(squareRunGameSeconds),
      accumulated:isPositiveNumberValue(numberBlackHoleAccumulatedGameSeconds),errors};`);
  assert.deepEqual(row, { n: true, time: true, accumulated: true, errors: [] });
});
