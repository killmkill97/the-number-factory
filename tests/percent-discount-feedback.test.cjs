const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gameContext() {
  const element = { addEventListener() {}, remove() {} };
  const context = vm.createContext({
    performance: { now: () => 0 },
    setInterval() {},
    document: { getElementById: () => element },
    render() {},
    log() {},
    fmtScientific: String,
    fmtPowerBase: String,
    percentParallelUnlockBtn: element,
    percentBtn: element,
    percentPowerBtn: element,
    percentAutoBtn: element,
    percentAutoSpeedBtn: element,
    upgradeChargeBtn: element
  });
  for (const file of [
    'core/constants.js', 'core/number-math.js', 'core/state.js',
    'systems/percent-lanes.js', 'systems/percent-system.js'
  ]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context, { filename: file });
  }
  return context;
}

const fixture = `
  for (const id of Object.keys(squareUpgradeState)) squareUpgradeState[id] = true;
  for (const id of Object.keys(squareConvergenceUpgradeState)) squareConvergenceUpgradeState[id] = true;
  for (const id of Object.keys(generalizationResearchState)) generalizationResearchState[id] = id !== '8-1';
  for (const item of SQUARE_BREAKTHROUGH_UPGRADES) squareBreakthroughLevels[item.id] = squareBreakthroughMax(item);
  // Keep the original price-regression loadout independent of future equipment.
  for (const id of ['diverger_percent_price_delay','permanent_production','knuth_time_gain',
    'percent_purchase_bonus','percent_cap_200','percent_count_discount','percent_overflow','percent_time_discount']) {
    knuthEquippedUpgradeIds.add(id);
  }
  squareUnlocked = true;
  squareBreakthroughEntered = true;
  squareConvergenceUnlocked = true;
  hasEverEarnedSquareConvergencePoint = true;
  knuthUnlocked = true;
  hasClaimedKnuthPoint = true;
  knuthOperationLevel = 12;
  squarePoints = NumberMath.fromString('1e100');
  squareConvergencePoints = NumberMath.fromString('1e20');
  knuthPoints = 100000;
  theory = 100;
  greatTheory = 100;
  squareRunGameSeconds = 300;
  divergerPower = NumberMath.fromString('1e100');
  for (const dimension of squareDimensionStates) {
    for (const side of ['x', 'y', 'z']) dimension[side] = 10000;
  }
  setBaseNumber(NumberMath.fromString('1e100'));
  percentUnlocked = true;
  percentChargeNeeded = 1;
  percentPower = 1000;
  percentPowerPurchaseCount = 999;
  percentPowerPurchaseBonus = percentPowerBonusForPurchase(999);
`;

// The prior implementation is retained only as a regression reference.
const legacyFloor = `minimumPercentPowerCompoundingCost = (count, baseCost = 40000) => {
  const start = firstPercentPowerCompoundingPurchase(count, baseCost);
  if (start === null) return null;
  const steps = count - start + 1;
  const initial = Math.min(steps, Math.ceil(Math.log(4) / Math.log(1.005)));
  return powerOfTenValue(addBaseNumbers(multiplyNumberValue(500, NumberMath.power(1.005, initial)), 10 * (steps - initial)));
};`;

function feedbackRun(branch, legacy = false) {
  const context = gameContext();
  vm.runInContext(fixture, context);
  vm.runInContext(`
    for (const id of ['1-1','2-1','3-1']) abstractionResearchState[id] = true;
    for (const column of [4,5,6]) abstractionResearchState[column + '-${branch}'] = true;
    ${legacy ? legacyFloor : ''}
    const restored = rebasePercentPowerPriceForProgress(percentPowerPurchaseCount, 40000);
    percentPowerUpgradeCost = restored.cost;
    percentPowerCostCompounding = restored.compounding;
    globalThis.rounds = [];
    for (let round = 0; round < 40; round++) {
      applyPercentUsesBatch(percentPower, 1, 'feedback-test', percentPowerPurchaseBonus);
      let bought = 0;
      while (bought < 256 && upgradePercentPower()) bought++;
      rounds.push({ bought, count: percentPowerPurchaseCount, number: numberLog10(getBaseNumber()),
        price: numberLog10(percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding)),
        cap: numberLog10(percentPowerSoftcap(percentPower, percentPowerPurchaseBonus)) });
    }
  `, context);
  return JSON.parse(JSON.stringify(context.rounds));
}

test('discount feedback stops bulk purchases without reducing production or softcap formulas', () => {
  for (const branch of [1, 2, 3]) {
    const legacy = feedbackRun(branch, true);
    const current = feedbackRun(branch);
    assert.equal(legacy[19].bought, 256, `legacy branch ${branch} should reproduce the loop`);
    assert.equal(current.at(-1).bought, 0, `branch ${branch} should reach an unaffordable price`);
    assert.ok(current.at(-1).price > current.at(-1).number);
    assert.ok(current.at(-1).count < legacy.at(-1).count);
    assert.equal(current[0].number, legacy[0].number, 'the same initial percent use must produce the same Number');
  }
});

test('researched compounded prices grow quadratically even at the maximum discount', () => {
  const context = gameContext();
  vm.runInContext(fixture, context);
  const result = vm.runInContext(`(() => {
    abstractionResearchState['6-3'] = true;
    const samples = [1000, 10000, 100000, 1e9].map(count => {
      const start = firstPercentPowerCompoundingPurchase(count, 40000);
      const steps = count - start + 1;
      const raw = minimumPercentPowerCompoundingCost(count, 40000);
      const price = percentPowerCost(raw, true, count);
      const nextRaw = minimumPercentPowerCompoundingCost(count + 1, 40000);
      const nextPrice = percentPowerCost(nextRaw, true, count + 1);
      const capBefore = percentPowerSoftcap(count + 1, percentPowerBonusForPurchase(count));
      const capAfter = percentPowerSoftcap(count + 2, percentPowerBonusForPurchase(count + 1));
      return { steps, rawLog: numberLog10(raw), priceLog: numberLog10(price),
        growth: numberLog10(nextPrice) - numberLog10(price),
        capGrowth: numberLog10(capAfter) - numberLog10(capBefore), discount: percentPowerPriceDiscountRate(count + 1) };
    });
    return samples;
  })()`, context);
  for (const sample of result) {
    assert.equal(sample.rawLog, 500 + sample.steps * (sample.steps + 999));
    assert.ok(sample.priceLog >= sample.rawLog * 0.1 * (1 - 1e-12));
    assert.ok(sample.growth > sample.capGrowth);
    assert.equal(sample.discount, 0.9);
  }
});

test('main and extra-lane purchases charge the new floor and stale saves adopt it', () => {
  const context = gameContext();
  vm.runInContext(fixture, context);
  const result = vm.runInContext(`(() => {
    const savedPower = percentPower;
    const savedBonus = percentPowerPurchaseBonus;
    percentPowerUpgradeCost = NumberMath.fromString('1e600');
    percentPowerCostCompounding = true;
    const repaired = repairPercentPowerCostState();
    const price = percentPowerCost(repaired.cost, true);
    setBaseNumber(divideNumberValue(price, 2));
    const rejected = !upgradePercentPower();
    const unchanged = percentPower === savedPower && percentPowerPurchaseBonus === savedBonus;
    setBaseNumber(price);
    const bought = upgradePercentPower();
    const spent = compareNumberValues(getBaseNumber(), 0) === 0;
    const nextPrice = percentPowerCost(percentPowerUpgradeCost, true);
    const reloaded = restoredPercentPowerCost(NumberMath.serialize(percentPowerUpgradeCost), true, percentPowerPurchaseCount, 40000);
    const preserved = compareNumberValues(percentPowerCost(reloaded.cost, true, percentPowerPurchaseCount), nextPrice) === 0;
    const laneResults = [2, 8, 16].map(number => {
      const lane = makePercentLane(number);
      Object.assign(lane, { power: 1000, powerPurchaseCount: 999, powerCost: NumberMath.fromString('1e600'), powerCostCompounding: true });
      repairPercentLanePowerCost(lane);
      const lanePrice = percentPowerCost(lane.powerCost, true, lane.powerPurchaseCount, scaleByLane(40000, number));
      setBaseNumber(lanePrice);
      const purchased = buyExtraLanePower(lane);
      return purchased && compareNumberValues(getBaseNumber(), 0) === 0 && lane.powerPurchaseCount === 1000;
    });
    return { rejected, unchanged, bought, spent, preserved, laneResults, increased: compareNumberValues(nextPrice, price) > 0 };
  })()`, context);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    rejected: true, unchanged: true, bought: true, spent: true, preserved: true,
    laneResults: [true, true, true], increased: true
  });
});

test('early prices, surge delay, and pre-3-3 compounding are unchanged', () => {
  const context = gameContext();
  const result = vm.runInContext(`(() => {
    const initial = NumberMath.serialize(percentPowerCost(40000, false, 0));
    generalizationResearchState['3-3'] = true;
    const early = NumberMath.serialize(percentPowerCost(40000, false, 0));
    const normalStart = firstPercentPowerCompoundingPurchase(1000, 40000);
    knuthEquippedUpgradeIds.add('diverger_percent_price_delay');
    divergerPower = NumberMath.fromString('1e100');
    const delayedStart = firstPercentPowerCompoundingPurchase(1000, 40000);
    generalizationResearchState['3-3'] = false;
    const steps = 1000 - delayedStart + 1;
    const expected = multiplyNumberValue(500, NumberMath.power(1.005, steps));
    const actual = NumberMath.log10(minimumPercentPowerCompoundingCost(1000, 40000));
    return { initial, early, normalStart, delayedStart, sameOldFloor: compareNumberValues(actual, expected) === 0 };
  })()`, context);
  assert.equal(result.initial, '40000');
  assert.equal(result.early, '40000');
  assert.ok(result.delayedStart > result.normalStart);
  assert.equal(result.sameOldFloor, true);
});
