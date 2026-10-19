const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const { repeatablePriceLog, operationPriceLog } = require('./helpers/knuth-prices.cjs');

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9 * Math.max(1, Math.abs(expected)), JSON.stringify({ actual, expected }));
}

test('both current-price thresholds are inclusive and the second multiplier stacks', () => {
  const rows = run(game(), `
    return ['1e49','1e50','1.79e308','1.8e308','1e400'].map(price => {
      const before = NumberMath.fromString(price);
      return plain(NumberMath.divideApproximate(knuthRepeatableCostAfterPurchases(before,2,1),before));
    });
  `);
  rows.forEach((ratio, index) => close(ratio, [2,4,4,16,16][index]));
});

test('all seven repeatable upgrades match a separate sequential price reference', () => {
  const rows = run(game(), `
    return KNUTH_BASE_UPGRADES.filter(u => u.growth && u.group <= 3).flatMap(u =>
      [0,1,19,20,48,49,50,100,200,500,1000,1000000].map(level => {
        knuthBaseUpgradeLevels[u.id]=level;
        return {id:u.id,base:u.baseCost,growth:u.growth,level,log:logValue(knuthBaseUpgradeCost(u))};
      }));
  `);
  assert.equal(rows.length, 7 * 12);
  for (const row of rows) close(row.log, repeatablePriceLog(row.base, row.growth, row.level));
});

test('operation growth uses independent count tiers rather than KP price thresholds', () => {
  const rows = run(game(), `
    return [0,1,18,19,20,21,64,99,100,199,200,250,299,300,301,500,1000,1000000].map(level => {
      knuthOperationLevel=level;
      const cost=knuthOperationUpgradeCost();
      knuthOperationLevel++;
      return {level,log:logValue(cost),ratio:plain(NumberMath.divideApproximate(knuthOperationUpgradeCost(),cost))};
    });
  `);
  for (const row of rows) {
    close(row.log, operationPriceLog(row.level));
    close(row.ratio, row.level < 99 ? 2 : row.level < 199 ? 4 : 8);
  }
});

test('a threshold-crossing purchase uses the previous tier then changes future growth', () => {
  assert.deepEqual(run(game(), `
    const first=knuthRepeatableCostAfterPurchases('5e49',2,1);
    const second=knuthRepeatableCostAfterPurchases('5e49',2,2);
    const top=knuthRepeatableCostAfterPurchases('9e307',2,2);
    return {first:logValue(first),second:plain(NumberMath.divideApproximate(second,first)),
      top:plain(NumberMath.divideApproximate(top,'9e307'))};
  `), { first:50, second:4, top:64 });
});

test('actual purchases spend the quoted price and use tiered next prices in every group', () => {
  const rows = run(game(), `
    completedKnuthChallengeIds.add('kc5');
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,1])));
    return KNUTH_BASE_UPGRADES.filter(u=>u.growth).flatMap(u=>(u.max ? [0,2,5] : [2,100,600]).map(level=>{
      knuthBaseUpgradeLevels[u.id]=level;
      const cost=knuthBaseUpgradeCost(u);
      knuthPoints=NumberMath.divideApproximate(cost,2);
      const rejected=buyKnuthBaseUpgrade(u.id);
      const unchanged=knuthBaseUpgradeLevel(u.id)===level;
      knuthPoints=cost;
      const bought=buyKnuthBaseUpgrade(u.id);
      return {id:u.id,growth:u.growth,log:logValue(cost),rejected,unchanged,bought,kp:plain(knuthPoints),
        level:knuthBaseUpgradeLevel(u.id),expectedLevel:level+1,
        ratio:plain(NumberMath.divideApproximate(knuthBaseUpgradeCost(u),cost))};
    }));
  `);
  for (const row of rows) {
    assert.equal(row.rejected, false, row.id);
    assert.equal(row.unchanged, true, row.id);
    assert.equal(row.bought, true, row.id);
    assert.equal(row.kp, 0, row.id);
    assert.equal(row.level, row.expectedLevel, row.id);
    close(row.ratio, row.growth * (row.log >= 308 + Math.log10(1.8) ? 8 : row.log >= 50 ? 2 : 1));
  }
});

test('owned KP and non-repeatable upgrades do not change the price progression', () => {
  assert.deepEqual(run(game(), `
    const quote=()=>KNUTH_BASE_UPGRADES.map(u=>NumberMath.serialize(knuthBaseUpgradeCost(u)));
    knuthPoints=0;const before=quote();
    knuthPoints=NumberMath.fromString('1e10000');
    const independent=JSON.stringify(before)===JSON.stringify(quote());
    const singles=KNUTH_BASE_UPGRADES.filter(u=>!u.growth).every(u=>{
      knuthBaseUpgradeLevels[u.id]=1;
      return compareNumberValues(knuthBaseUpgradeCost(u),u.baseCost)===0;
    });
    return {independent,singles};
  `), { independent:true, singles:true });
});

test('existing saved counts derive new prices without changing currencies or effects', () => {
  const row = run(game(), `
    knuthOperationLevel=1000;knuthPoints=123;
    knuthBaseUpgradeLevels.cp_gain=600;
    const multiplier=NumberMath.serialize(knuthBaseMultiplier('cp_gain',25));
    saveGame();const saved=localStorage.getItem(SAVE_KEY);
    knuthOperationLevel=0;knuthBaseUpgradeLevels.cp_gain=0;knuthPoints=0;
    loadGame(saved,{countAsLoad:false});
    return {level:knuthOperationLevel,baseLevel:knuthBaseUpgradeLevel('cp_gain'),kp:plain(knuthPoints),
      price:logValue(knuthOperationUpgradeCost()),basePrice:logValue(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0])),
      sameEffect:multiplier===NumberMath.serialize(knuthBaseMultiplier('cp_gain',25)),errors};
  `);
  assert.equal(row.level, 1000);
  assert.equal(row.baseLevel, 600);
  assert.equal(row.kp, 123);
  close(row.price, operationPriceLog(1000));
  close(row.basePrice, repeatablePriceLog(4,20,600));
  assert.equal(row.sameEffect, true);
  assert.deepEqual(row.errors, []);
});

test('maximum safe purchase counts take bounded work and keep huge prices positive', () => {
  const row = run(game(), `
    const original=NumberMath.power;let calls=0;
    NumberMath.power=(...args)=>{calls++;return original(...args);};
    const prices=KNUTH_BASE_UPGRADES.filter(u=>u.growth).map(u=>{
      knuthBaseUpgradeLevels[u.id]=Number.MAX_SAFE_INTEGER;
      return knuthBaseUpgradeCost(u);
    });
    knuthOperationLevel=Number.MAX_SAFE_INTEGER;prices.push(knuthOperationUpgradeCost());
    NumberMath.power=original;
    return {calls,valid:prices.every(p=>compareNumberValues(p,0)>0&&Number.isFinite(logValue(p)))};
  `);
  assert.equal(row.valid, true);
  assert.ok(row.calls <= 60, JSON.stringify(row));
});

test('basic purchase area states the price thresholds and cumulative multiplier', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const rule = html.match(/id="knuthRepeatablePriceRule">([^<]*)/)[1];
  assert.match(rule, /그룹 반복 구매/);
  assert.match(rule, /연산 강화는 별도/);
  assert.match(rule, /현재 비용.*1e50 KP.*×2.*1\.8e308 KP.*×4.*×8/);
});
