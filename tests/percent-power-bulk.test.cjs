const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gameContext() {
  const element = { addEventListener() {}, remove() {} };
  const timers = [];
  const context = vm.createContext({
    performance: { now: () => context.clock }, clock: 0,
    setInterval(fn) { timers.push(fn); },
    document: { getElementById: () => element },
    render() {}, log() {}, fmtScientific: String, fmtPowerBase: String,
    percentParallelUnlockBtn: element, percentBtn: element, percentPowerBtn: element,
    percentAutoBtn: element, percentAutoSpeedBtn: element, upgradeChargeBtn: element
  });
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js',
    'systems/percent-lanes.js', 'systems/percent-system.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context, { filename: file });
  }
  context.timers = timers;
  return context;
}

function run(context, source) {
  return vm.runInContext(source, context);
}

function setup(context, { count = 1000, research = true, gear = [], lane = 1, storedLog = null } = {}) {
  run(context, `
    percentUnlocked = true; percentChargeNeeded = 1;
    generalizationResearchState['3-3'] = ${research};
    generalizationResearchState['3-4'] = true;
    for (const id of ${JSON.stringify(gear)}) knuthEquippedUpgradeIds.add(id);
    squareRunGameSeconds = 300;
    globalThis.targetLane = ${lane} === 1 ? null : makePercentLane(${lane});
    const restored = restoredPercentPowerCost(0, false, ${count}, scaleByLane(40000, ${lane}));
    if (targetLane) {
      Object.assign(targetLane, { power: ${count} + 1, powerPurchaseCount: ${count},
        powerCost: ${storedLog === null ? 'restored.cost' : `powerOfTenValue(${storedLog})`},
        powerCostCompounding: restored.compounding });
      extraPercentLanes.push(targetLane); percentLaneCount = ${lane};
    } else {
      percentPower = ${count} + 1; percentPowerPurchaseCount = ${count};
      percentPowerUpgradeCost = ${storedLog === null ? 'restored.cost' : `powerOfTenValue(${storedLog})`};
      percentPowerCostCompounding = restored.compounding;
    }
  `);
}

function snapshot(context) {
  return JSON.parse(JSON.stringify(run(context, `(() => {
    const lane = targetLane;
    if (lane) repairPercentLanePowerCost(lane); else repairPercentPowerCostState();
    const count = lane ? lane.powerPurchaseCount : percentPowerPurchaseCount;
    const power = lane ? lane.power : percentPower;
    const bonus = lane ? lane.powerPurchaseBonus : percentPowerPurchaseBonus;
    const cost = lane ? lane.powerCost : percentPowerUpgradeCost;
    const compound = lane ? lane.powerCostCompounding : percentPowerCostCompounding;
    return {count, power, bonus, compound, balance: NumberMath.serialize(getBaseNumber()),
      overflow: NumberMath.serialize(knuthPercentOverflow), raw: NumberMath.serialize(cost),
      price: NumberMath.serialize(percentPowerCost(cost, compound, count, lane ? scaleByLane(40000, lane.laneNumber) : 40000)),
      cap: NumberMath.serialize(percentPowerSoftcap(power, bonus))};
  })()`)));
}

function equivalent(actual, expected, context) {
  for (const key of ['count', 'power', 'bonus', 'compound', 'overflow', 'cap']) {
    assert.equal(actual[key], expected[key], key);
  }
  for (const key of ['balance', 'raw', 'price']) {
    const equal = run(context, `compareNumberValues(${JSON.stringify(actual[key])}, ${JSON.stringify(expected[key])}) === 0`);
    if (equal) continue;
    const relativeLogError = run(context, `(() => {
      const a = NumberMath.toNumber(NumberMath.log10(NumberMath.fromString(${JSON.stringify(actual[key])})));
      const b = NumberMath.toNumber(NumberMath.log10(NumberMath.fromString(${JSON.stringify(expected[key])})));
      return Math.abs(a - b) / Math.max(1, Math.abs(b));
    })()`);
    assert.ok(relativeLogError < 1e-11, `${key}: ${actual[key]} vs ${expected[key]}`);
  }
}

for (const options of [
  { count: 1000 },
  { count: 1000, gear: ['percent_count_discount', 'percent_purchase_bonus', 'percent_overflow'] },
  { count: 1000, lane: 8, gear: ['percent_count_discount', 'percent_time_discount', 'percent_cap_200', 'percent_overflow'] },
  { count: 1000, research: false },
  { count: 1000, research: false, gear: ['percent_time_discount'] },
  { count: 30000, gear: ['percent_count_discount'], storedLog: 1e12 }
]) {
  test(`batch equals sequential prices, effects and payment: ${JSON.stringify(options)}`, () => {
    const sequential = gameContext();
    const bulk = gameContext();
    const purchases = 1200;
    for (const context of [sequential, bulk]) {
      setup(context, options);
      run(context, `
        const raw = targetLane ? targetLane.powerCost : percentPowerUpgradeCost;
        const count = targetLane ? targetLane.powerPurchaseCount : percentPowerPurchaseCount;
        const model = percentPowerBulkPriceModel(raw, true, count, scaleByLane(40000, ${options.lane || 1}));
        setBaseNumber(${options.research === false
          ? `NumberMath.power(multiplyNumberValue(model.priceAt(${purchases - 1}), model.priceAt(${purchases})), 0.5)`
          : `multiplyNumberValue(model.priceAt(${purchases - 1}), 2)`});
      `);
    }
    const sequentialCount = run(sequential, `(() => {
      let bought = 0;
      while (bought < ${purchases + 1} && (targetLane ? buyExtraLanePower(targetLane) : upgradePercentPower())) bought++;
      return bought;
    })()`);
    const bulkResult = run(bulk, `buyPercentPowerBatch(Number.MAX_SAFE_INTEGER, targetLane)`);
    assert.equal(sequentialCount, purchases);
    assert.equal(bulkResult.purchased, sequentialCount);
    assert.ok(bulkResult.operations <= 2);
    equivalent(snapshot(bulk), snapshot(sequential), bulk);
  });
}

test('early prices and the e500 transition retain single-purchase semantics', () => {
  const sequential = gameContext();
  const bulk = gameContext();
  for (const context of [sequential, bulk]) {
    setup(context, { count: 0, gear: ['percent_purchase_bonus', 'percent_overflow'] });
    run(context, `setBaseNumber(NumberMath.fromString('1e100000'));`);
  }
  for (let iteration = 0; iteration < 12; iteration++) {
    const result = run(bulk, 'buyPercentPowerBatch(1000)');
    run(sequential, `for (let i = 0; i < ${result.purchased}; i++) upgradePercentPower();`);
    equivalent(snapshot(bulk), snapshot(sequential), bulk);
    if (result.purchased === 0) break;
  }
  assert.ok(snapshot(bulk).compound);
  assert.equal(run(bulk, 'buyPercentPowerBatch(1000).purchased'), 0);
});

test('an oversized legacy price with a changing discount uses the bounded exact fallback', () => {
  const sequential = gameContext();
  const bulk = gameContext();
  for (const context of [sequential, bulk]) {
    setup(context, { count: 1000, gear: ['percent_count_discount'], storedLog: 1e12 });
    run(context, `setBaseNumber(powerOfTenValue(1e15));`);
  }
  const result = run(bulk, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER)');
  assert.equal(result.purchased, 64);
  run(sequential, 'for (let i = 0; i < 64; i++) upgradePercentPower();');
  equivalent(snapshot(bulk), snapshot(sequential), bulk);
});

test('changing count, time and currency discounts retain the same affordable floor across lane tiers', () => {
  for (const count of [60, 350, 2000, 12000]) {
    const sequential = gameContext();
    const bulk = gameContext();
    for (const context of [sequential, bulk]) {
      setup(context, { count, lane: 16, gear: ['percent_count_discount', 'percent_time_discount', 'percent_purchase_bonus'] });
      run(context, `
        squareRunGameSeconds = ${count / 100};
        abstractionResearchState['6-3'] = true;
        squarePoints = NumberMath.fromString('1e1000'); squareConvergencePoints = NumberMath.fromString('1e20');
        knuthPoints = 100000; theory = 100; greatTheory = 100;
        squareUpgradeState.all_cost_half = true; squareBreakthroughLevels.deflation = 1;
        repairPercentLanePowerCost(targetLane);
        const model = percentPowerBulkPriceModel(targetLane.powerCost, true, targetLane.powerPurchaseCount, scaleByLane(40000, 16));
        setBaseNumber(multiplyNumberValue(model.priceAt(79), 2));
      `);
    }
    run(sequential, 'while (buyExtraLanePower(targetLane)) {}');
    assert.equal(run(bulk, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER, targetLane).purchased'), 80);
    equivalent(snapshot(bulk), snapshot(sequential), bulk);
  }
});

test('significant prior costs are paid rather than treating the last price as the whole bill', () => {
  const sequential = gameContext();
  const bulk = gameContext();
  for (const context of [sequential, bulk]) {
    setup(context, { count: 1000, storedLog: 1e12, gear: ['percent_time_discount', 'percent_count_discount'] });
    run(context, `
      abstractionResearchState['6-3'] = true;
      squarePoints = NumberMath.fromString('1e100000'); squareConvergencePoints = squarePoints;
      knuthPoints = squarePoints; theory = squarePoints; greatTheory = squarePoints;
      const model = percentPowerBulkPriceModel(percentPowerUpgradeCost, true, percentPowerPurchaseCount, 40000);
      setBaseNumber(model.priceAt(99));
    `);
  }
  run(sequential, 'while (upgradePercentPower()) {}');
  const result = run(bulk, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER)');
  assert.equal(result.purchased, 99);
  equivalent(snapshot(bulk), snapshot(sequential), bulk);
});

test('an early legacy compounding flag does not invent a floor before the actual threshold', () => {
  const sequential = gameContext();
  const bulk = gameContext();
  for (const context of [sequential, bulk]) {
    setup(context, { count: 0, storedLog: 1e12 });
    run(context, `percentPowerCostCompounding = true; setBaseNumber(powerOfTenValue(1e20));`);
    assert.equal(run(context, 'percentPowerBulkPriceModel(percentPowerUpgradeCost, true, 0, 40000)'), null);
  }
  const result = run(bulk, 'buyPercentPowerBatch(1000)');
  assert.equal(result.purchased, 1000);
  run(sequential, 'for (let i = 0; i < 1000; i++) upgradePercentPower();');
  equivalent(snapshot(bulk), snapshot(sequential), bulk);
});

test('corrupt saved costs are repaired before a bulk quote, without changing the save format', () => {
  const context = gameContext();
  setup(context, { count: 1000, lane: 8 });
  const result = run(context, `(() => {
    targetLane.powerCost = 1;
    const cost = percentPowerCost(targetLane.powerCost, true, 1000, scaleByLane(40000, 8));
    setBaseNumber(cost);
    const result = buyPercentPowerBatch(Number.MAX_SAFE_INTEGER, targetLane);
    const saved = JSON.parse(JSON.stringify(targetLane));
    return {purchased: result.purchased, count: saved.powerPurchaseCount,
      positive: NumberMath.isPositive(saved.powerCost), zero: NumberMath.isZero(getBaseNumber())};
  })()`);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { purchased: 1, count: 1001, positive: true, zero: true });
});

test('bulk power crosses both effective caps without counting reinforcement as overflow', () => {
  for (const cap of [100, 200]) {
    const context = gameContext();
    setup(context, { count: cap - 6, gear: ['percent_purchase_bonus', 'percent_overflow', ...(cap === 200 ? ['percent_cap_200'] : [])] });
    const result = run(context, `(() => {
      setBaseNumber(powerOfTenValue(1e20));
      const result = buyPercentPowerBatch(40);
      return {purchased: result.purchased, overflow: NumberMath.toNumber(knuthPercentOverflow),
        bonus: percentPowerPurchaseBonus, expectedBonus: percentPowerBonusForPurchase(percentPowerPurchaseCount)};
    })()`);
    assert.equal(result.purchased, 40);
    assert.equal(result.overflow, 35);
    assert.equal(result.bonus, result.expectedBonus);
  }
});

test('quotes preserve exact boundary payments and do not grant an unaffordable extra level', () => {
  for (const multiplier of [0.999, 1, 1.001, 2]) {
    const context = gameContext();
    setup(context, { count: 1000 });
    const result = run(context, `(() => {
      const model = percentPowerBulkPriceModel(percentPowerUpgradeCost, true, percentPowerPurchaseCount, 40000);
      const cost = model.priceAt(99999);
      setBaseNumber(multiplyNumberValue(cost, numberValueFromReal(${multiplier})));
      const result = buyPercentPowerBatch(Number.MAX_SAFE_INTEGER);
      return {bought: result.purchased, nextAffordable: canAffordBaseCost(percentPowerCost(percentPowerUpgradeCost, true)),
        zero: compareBaseNumber(0) === 0};
    })()`);
    assert.equal(result.bought, multiplier < 1 ? 99999 : 100000);
    assert.equal(result.nextAffordable, false);
    assert.equal(result.zero, multiplier === 1);
  }
});

test('millions of levels use bounded quotes rather than millions of purchase calls', () => {
  const context = gameContext();
  setup(context, { count: 1000, gear: ['percent_purchase_bonus', 'percent_overflow'] });
  const result = run(context, `(() => {
    const model = percentPowerBulkPriceModel(percentPowerUpgradeCost, true, percentPowerPurchaseCount, 40000);
    const budget = multiplyNumberValue(model.priceAt(9999999), 2);
    const original = percentPowerBulkPriceModel;
    let quotes = 0;
    percentPowerBulkPriceModel = (...args) => {
      const model = original(...args); const priceAt = model.priceAt;
      model.priceAt = offset => { quotes++; return priceAt(offset); }; return model;
    };
    let singleCalls = 0; upgradePercentPower = () => { singleCalls++; return false; };
    setBaseNumber(budget);
    const result = buyPercentPowerBatch(Number.MAX_SAFE_INTEGER);
    return {...result, quotes, singleCalls, overflow: NumberMath.toNumber(knuthPercentOverflow),
      power: percentPower, bonus: percentPowerPurchaseBonus};
  })()`);
  assert.equal(result.purchased, 10000000);
  assert.ok(result.quotes < 200);
  assert.equal(result.singleCalls, 0);
  assert.equal(result.operations, 1);
  assert.equal(result.overflow, 10000000);
  assert.equal(result.power, 10001001);
  assert.ok(result.bonus < 20 && result.bonus > 19);
});

test('low speed respects the requested count and locked/expired purchases are inert', () => {
  const context = gameContext();
  setup(context);
  run(context, `setBaseNumber(powerOfTenValue(1e20));`);
  assert.equal(run(context, 'buyPercentPowerBatch(3).purchased'), 3);
  const before = snapshot(context);
  assert.equal(run(context, 'buyPercentPowerBatch(1000, null, 0).purchased'), 0);
  assert.deepEqual(snapshot(context), before);
  for (const flag of ['overflowed = true', 'squareMode = true', 'percentUnlocked = false', 'percentChargeNeeded = 1000']) {
    run(context, `overflowed = false; squareMode = false; percentUnlocked = true; percentChargeNeeded = 1; ${flag};`);
    assert.equal(run(context, 'buyPercentPowerBatch(1000).purchased'), 0);
    assert.deepEqual(snapshot(context), before);
  }
});

test('time-budgeted search makes partial progress and resumes on a later tick', () => {
  const context = gameContext();
  setup(context);
  run(context, `
    setBaseNumber(powerOfTenValue(1e20));
    const original = percentPowerBulkPriceModel;
    percentPowerBulkPriceModel = (...args) => {
      const model = original(...args); const priceAt = model.priceAt;
      model.priceAt = offset => { clock += 0.1; return priceAt(offset); }; return model;
    };
  `);
  const first = run(context, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER, null, 2)');
  assert.ok(first.purchased > 0);
  assert.ok(first.purchased < 10000000);
  const second = run(context, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER, null, clock + 2)');
  assert.ok(second.purchased > 0);
  assert.ok(context.clock < 4.5);
});

test('native purchase counters never wrap or lose integer progress at their limit', () => {
  const context = gameContext();
  setup(context, { count: Number.MAX_SAFE_INTEGER - 100 });
  run(context, `setBaseNumber(NumberMath.fromString('1e1e1000'));`);
  const result = run(context, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER)');
  assert.ok(result.purchased > 0 && result.purchased < 100);
  assert.equal(run(context, 'Number.isSafeInteger(percentPowerPurchaseCount) && Number.isSafeInteger(percentPower)'), true);
  assert.equal(run(context, 'buyPercentPowerBatch(Number.MAX_SAFE_INTEGER).purchased'), 0);
});

function loadAdapter(context) {
  const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');
  const end = source.indexOf('\n};\n\nfunction automatiumGameAdapterFor');
  run(context, source.slice(0, end + 4));
  run(context, 'automatiumBulkRemaining = 2048; automatiumBulkDeadline = Infinity;');
}

test('N buys the affordable maximum on base and indexed lanes without spending a per-level CPU budget', () => {
  for (const lane of [1, 2, 16]) {
    const context = gameContext();
    setup(context, { lane });
    loadAdapter(context);
    const result = run(context, `(() => {
      const count = targetLane ? targetLane.powerPurchaseCount : percentPowerPurchaseCount;
      const raw = targetLane ? targetLane.powerCost : percentPowerUpgradeCost;
      const model = percentPowerBulkPriceModel(raw, true, count, scaleByLane(40000, ${lane}));
      setBaseNumber(multiplyNumberValue(model.priceAt(999999), 2));
      const bought = automatiumGameAdapter.buy('base', 'percent_power', ${lane === 1 ? 'null' : lane}, null);
      return {bought, remaining: automatiumBulkRemaining,
        count: targetLane ? targetLane.powerPurchaseCount : percentPowerPurchaseCount};
    })()`);
    assert.equal(result.bought, true);
    assert.equal(result.count, 1001000);
    assert.equal(result.remaining, 2047);
  }
});

test('N without 3-4 still buys one level and CPU exhaustion still requests a yield', () => {
  const context = gameContext();
  setup(context);
  loadAdapter(context);
  run(context, `setBaseNumber(powerOfTenValue(1e20)); generalizationResearchState['3-4'] = false;`);
  assert.equal(run(context, "automatiumGameAdapter.buy('base', 'percent_power', null, null)"), true);
  assert.equal(snapshot(context).count, 1001);
  run(context, "generalizationResearchState['3-4'] = true; automatiumBulkDeadline = 0;");
  assert.equal(run(context, "automatiumGameAdapter.buy('base', 'percent_power', null, null)"), false);
  assert.equal(run(context, 'automatiumGameAdapter.consumeBudgetYield()'), true);
  assert.equal(snapshot(context).count, 1001);
});

test('an absent indexed lane never falls through to buying the main lane', () => {
  const context = gameContext();
  setup(context);
  loadAdapter(context);
  run(context, 'percentLaneCount = 2; setBaseNumber(powerOfTenValue(1e20));');
  assert.equal(run(context, "automatiumGameAdapter.buy('base', 'percent_power', 2, null)"), false);
  assert.equal(snapshot(context).count, 1000);
});

test('normal automation at 8e39 batches actual levels while retaining non-power operation limits', () => {
  const context = gameContext();
  setup(context);
  run(context, fs.readFileSync(path.join(__dirname, '../scripts/systems/auto-upgrades.js'), 'utf8'));
  const poll = context.timers.at(-1);
  run(context, `
    squareUpgradeState.auto_upgrade_top_down = true; autoUpgradeEnabled = true;
    gameTick = elapsed => elapsed; autoUpgradeSpeedMultiplier = () => 8e39;
    let singleCalls = 0;
    automaticUpgradeChoices = () => [() => { singleCalls++; return true; }, Object.assign(() => false, {
      buyBulk: (limit, deadline) => buyPercentPowerBatch(limit, null, deadline)
    })];
    const model = percentPowerBulkPriceModel(percentPowerUpgradeCost, true, percentPowerPurchaseCount, 40000);
    setBaseNumber(multiplyNumberValue(model.priceAt(999999), 2));
  `);
  context.clock = 50;
  poll();
  assert.equal(snapshot(context).count, 1001000);
  assert.equal(run(context, 'singleCalls'), 255);
  assert.equal(run(context, 'autoUpgradeTimer'), 0);
});
