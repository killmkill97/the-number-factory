const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = vm.createContext({ performance: { now: () => 0 } });
for (const file of ['constants.js', 'number-math.js', 'state.js']) {
  const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
  vm.runInContext(source, context);
}
vm.runInContext('globalThis.probe = (saved, compounding, count, base) => ({ '
  + 'result: restoredPercentPowerCost(NumberMath.fromString(saved), compounding, count, base), '
  + 'compare: (left, right) => NumberMath.compare(left, NumberMath.fromString(right)), '
  + 'serialize: NumberMath.serialize, '
  + 'softcap: (power, bonus) => percentPowerSoftcap(power, bonus), '
  + 'normalizePower: normalizedPercentPower, '
  + 'normalizeBonus: normalizedPercentPowerBonus, '
  + 'normalizePurchaseCount: normalizePercentPowerPurchaseCount, '
  + 'continuousBonus: percentPowerBonusForPurchase, '
  + 'grantBonus: (power, bonus, count) => grantPercentPower(power, bonus, count).purchaseBonus, '
  + 'discountRate: count => percentPowerPriceDiscountRate(count), '
  + 'softcapStatus: (power, bonus, value) => percentPowerSoftcapStatus(power, bonus, value), '
  + 'reconcileProgress: (power, count) => reconcilePercentPowerProgress(power, count), '
  + 'payable: (restored) => percentPowerCost(restored.cost, restored.compounding, count, base), '
  + 'repairLive: (saved, compounding, count, power = percentPower) => { '
  + 'percentPower = power; '
  + 'percentPowerUpgradeCost = NumberMath.fromString(saved); '
  + 'percentPowerCostCompounding = compounding; '
  + 'percentPowerPurchaseCount = count; '
  + 'const repaired = repairPercentPowerCostState(); '
  + 'return { raw: percentPowerUpgradeCost, compounding: percentPowerCostCompounding, '
  + 'effective: percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding, count), '
  + 'power: percentPower, purchaseCount: percentPowerPurchaseCount, repaired }; } });', context);

test('repairs a saved cost of 1 for a high-level extra percent lane', () => {
  vm.runInContext('knuthEquippedUpgradeIds.add("percent_count_discount"); '
    + 'knuthEquippedUpgradeIds.add("percent_time_discount"); squareRunGameSeconds = 300;', context);
  const { result, compare, serialize, payable } = context.probe('1', true, 55993, 60000);
  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '1e500') >= 0);
  assert.notEqual(serialize(result.cost), '1');
  assert.ok(compare(payable(result), '1') > 0);
});

test('repairs a saved cost of 1 using the current main-lane purchase count', () => {
  const { result, compare, serialize, payable } = context.probe('1', true, 89716, 40000);
  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '1e500') >= 0);
  assert.notEqual(serialize(result.cost), '1');
  assert.ok(compare(payable(result), '1') > 0);
});

test('repairs a stale but positive uncompounded cost using purchase progress', () => {
  const { result, compare, serialize, payable, repairLive, softcap } = context.probe('40000', false, 89716, 40000);
  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '1e500') >= 0);
  assert.notEqual(serialize(result.cost), '40000');
  assert.ok(compare(payable(result), '1') > 0);

  const live = repairLive('40000', false, 89716, 1);
  assert.equal(live.power, 89717);
  assert.equal(live.compounding, true);
  assert.ok(compare(live.raw, '1e500') >= 0);
  assert.ok(compare(softcap(live.power, 0), '1e12') > 0);
});

test('reconciles saved base power with purchases that each grant one power', () => {
  const { reconcileProgress } = context.probe('1', false, 0, 40000);
  const purchaseCountAhead = reconcileProgress(70261, 89716);
  assert.equal(purchaseCountAhead.power, 89717);
  assert.equal(purchaseCountAhead.purchaseCount, 89716);
  const powerAhead = reconcileProgress(70261, 70260);
  assert.equal(powerAhead.power, 70261);
  assert.equal(powerAhead.purchaseCount, 70260);
});

test('continuous reinforcement bonus follows the bounded 20-percent asymptote', () => {
  const { continuousBonus } = context.probe('1', false, 0, 40000);

  assert.equal(continuousBonus(0), 0);
  assert.ok(Math.abs(continuousBonus(1000) - 10) < 1e-12);
  assert.ok(Math.abs(continuousBonus(9000) - 18) < 1e-12);
  assert.ok(continuousBonus(Number.MAX_SAFE_INTEGER) < 20);
  assert.ok(continuousBonus(Number.MAX_SAFE_INTEGER) > 19.999);
});

test('continuous reinforcement stores the cumulative curve value, not a sum per purchase', () => {
  vm.runInContext('knuthEquippedUpgradeIds.add("percent_purchase_bonus");', context);
  const { continuousBonus, grantBonus } = context.probe('1', false, 0, 40000);

  assert.ok(Math.abs(grantBonus(1, continuousBonus(1), 2) - continuousBonus(2)) < 1e-12);
  assert.ok(Math.abs(grantBonus(1001, continuousBonus(1000), 1001) - continuousBonus(1001)) < 1e-12);
  vm.runInContext('knuthEquippedUpgradeIds.delete("percent_purchase_bonus");', context);
});

test('repeat purchase discount follows the 50-percent asymptote without changing time discount', () => {
  const { discountRate } = context.probe('1', false, 0, 40000);
  vm.runInContext('knuthEquippedUpgradeIds.clear(); '
    + 'knuthEquippedUpgradeIds.add("percent_count_discount");', context);

  assert.equal(discountRate(0), 0);
  assert.ok(Math.abs(discountRate(2000) - 0.475) < 1e-12);
  assert.ok(discountRate(20000) < 0.5);
  assert.ok(discountRate(20000) > 0.499999999999);

  vm.runInContext('knuthEquippedUpgradeIds.clear(); '
    + 'knuthEquippedUpgradeIds.add("percent_time_discount"); '
    + 'squareRunGameSeconds = 300;', context);
  assert.ok(Math.abs(discountRate(0) - 0.855) < 1e-12);
  vm.runInContext('knuthEquippedUpgradeIds.clear(); squareRunGameSeconds = 0;', context);
});

test('stacked percent-price discounts cap at 90 percent and preserve compounding growth', () => {
  const result = vm.runInContext(`(() => {
    knuthEquippedUpgradeIds.clear();
    knuthEquippedUpgradeIds.add('percent_count_discount');
    knuthEquippedUpgradeIds.add('percent_time_discount');
    abstractionResearchState['6-3'] = true;
    generalizationResearchState['3-3'] = false;
    squareRunGameSeconds = 1000;
    squarePoints = NumberMath.fromString('1e100000');
    squareConvergencePoints = NumberMath.fromString('1e100000');
    knuthPoints = NumberMath.fromString('1e100000');
    theory = NumberMath.fromString('1e100000');
    greatTheory = NumberMath.fromString('1e100000');

    const discount = percentPowerPriceDiscountRate(100000);
    const retention = percentPowerPriceGrowthRetention(100000);
    const rawPrice = NumberMath.fromString('1e500');
    const nextRawPrice = percentPowerCostStep(rawPrice, 100000);
    const currentPrice = applyPercentPowerPriceDiscount(rawPrice, 100000);
    const nextPrice = applyPercentPowerPriceDiscount(nextRawPrice, 100001);
    const priceIncreases = NumberMath.compare(nextPrice, currentPrice) > 0;

    knuthEquippedUpgradeIds.clear();
    abstractionResearchState['6-3'] = false;
    squareRunGameSeconds = 0;
    squarePoints = 0;
    squareConvergencePoints = 0;
    knuthPoints = 0;
    theory = 0;
    greatTheory = 0;
    return { discount, retention, priceIncreases };
  })()`, context);

  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    discount: 0.9,
    retention: 0.1,
    priceIncreases: true
  });
});

test('repairs a stale compounded cost and preserves the repaired minimum', () => {
  const { result, compare, serialize } = context.probe('1e600', true, 55993, 60000);
  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '1e600') > 0);

  const repairedCost = serialize(result.cost);
  const preserved = context.probe(repairedCost, true, 55993, 60000);
  assert.equal(preserved.compare(preserved.result.cost, repairedCost), 0);

  const initial = context.probe('1', false, 0, 60000).result;
  assert.equal(serialize(initial.cost), '60000');
  assert.equal(initial.compounding, false);
});

test('repairs the exact high-count compounded cost shown in the debug screenshot', () => {
  vm.runInContext('knuthEquippedUpgradeIds.clear(); '
    + 'knuthEquippedUpgradeIds.add("percent_count_discount"); '
    + 'knuthEquippedUpgradeIds.add("percent_time_discount"); '
    + 'squareRunGameSeconds = 300; '
    + 'generalizationResearchState["3-3"] = false;', context);
  const { result, compare, payable } = context.probe('2.01e103000', true, 7560, 40000);

  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '2.01e103000') > 0);
  assert.ok(compare(payable(result), '1e1000') > 0);
});

test('keeps the compounding floor conservative when 3-3 changes the cost formula', () => {
  vm.runInContext('generalizationResearchState["3-3"] = true;', context);
  const { result, compare, payable } = context.probe('1e600', true, 10000, 60000);

  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '1e600') > 0);
  assert.ok(compare(payable(result), '1e500') > 0);
  vm.runInContext('generalizationResearchState["3-3"] = false;', context);
});

test('repairs a corrupt live main cost before render, automation, or purchase reads it', () => {
  const { repairLive, compare, serialize } = context.probe('1', true, 55993, 40000);
  const live = repairLive('1', true, 55993);

  assert.equal(live.compounding, true);
  assert.ok(compare(live.raw, '1e500') >= 0);
  assert.notEqual(serialize(live.raw), '1');
  assert.ok(compare(live.effective, '1') > 0);
});

test('live main repair restores power and cost from a mismatched high purchase count', () => {
  const { repairLive, compare, softcap } = context.probe('1', true, 89716, 40000);
  const live = repairLive('1', true, 89716, 70261);

  assert.equal(live.power, 89717);
  assert.equal(live.purchaseCount, 89716);
  assert.ok(compare(live.raw, '1e500') >= 0);
  assert.ok(compare(softcap(live.power, 0), '1e12') > 0);
});

test('repairs invalid lane costs using that lane tier base cost', () => {
  const normalized = vm.runInContext(
    'normalizePercentPowerCostState(NumberMath.fromString("1"), true, 55993, 60000)',
    context
  );
  assert.equal(normalized.compounding, true);
  assert.ok(context.probe('1', true, 55993, 60000).compare(normalized.cost, '1e500') >= 0);
  assert.notEqual(context.probe('1', true, 55993, 60000).serialize(normalized.cost), '1');
});

test('repairs a stale lane cost from purchase progress before discounts are applied', () => {
  vm.runInContext('knuthEquippedUpgradeIds.add("percent_count_discount"); '
    + 'knuthEquippedUpgradeIds.add("percent_time_discount"); '
    + 'squareRunGameSeconds = 300;', context);
  const { result, compare, payable, softcap } = context.probe('60000', false, 1670, 60000);

  assert.equal(result.compounding, true);
  assert.ok(compare(result.cost, '1e1000000') > 0);
  assert.ok(compare(payable(result), '1e10000') > 0);
  assert.ok(compare(softcap(7560, 11000), '1e18000') > 0);
});

test('softcap uses separately accumulated purchase bonus instead of staying at 1t', () => {
  const { softcap, compare, serialize } = context.probe('1', false, 0, 40000);
  const baseline = softcap(1, 0);
  const boosted = softcap(1, 11687.711);
  const screenshotCase = softcap(7560, 11000);

  assert.equal(compare(baseline, '1e12'), 0);
  assert.ok(compare(boosted, '1e12') > 0);
  assert.equal(serialize(boosted), '5.140436515794808e11699');
  assert.equal(serialize(screenshotCase), '1e18571');
});

test('restores legacy NumberMath objects in saved percent power fields before calculations', () => {
  const legacyPower = { approximate: true, mantissa: 7.99, exponent: 3 };
  const legacyBonus = { approximate: true, mantissa: 1.18, exponent: 4 };
  const legacyPurchases = { approximate: true, mantissa: 7.99, exponent: 3 };
  const { normalizePower, normalizeBonus, normalizePurchaseCount, reconcileProgress, softcap, serialize } = context.probe('40000', false, 0, 40000);

  assert.equal(normalizePower(legacyPower), 7990);
  assert.equal(normalizeBonus(legacyBonus), 11800);
  assert.equal(normalizePurchaseCount(legacyPurchases, legacyPower), 7990);
  const reconciled = reconcileProgress(legacyPower, legacyPurchases);
  assert.equal(reconciled.power, 7991);
  assert.equal(reconciled.purchaseCount, 7990);
  assert.equal(serialize(softcap(legacyPower, legacyBonus)), '1e19801');

  const live = context.probe('40000', false, 0, 40000)
    .repairLive('40000', false, legacyPurchases, legacyPower);
  assert.equal(live.power, 7991);
  assert.equal(live.purchaseCount, 7990);
  assert.ok(context.probe('40000', false, 0, 40000).compare(live.raw, '1e500') >= 0);
});

test('reconstructs the screenshot lane from ordinary numeric save fields', () => {
  vm.runInContext('knuthEquippedUpgradeIds.add("percent_count_discount"); '
    + 'knuthEquippedUpgradeIds.add("percent_time_discount"); squareRunGameSeconds = 300;', context);
  const lane = context.probe('40000', false, 7990, 40000);
  const expectedCap = lane.softcap(7990, 11800);

  assert.equal(lane.serialize(expectedCap), '1e19801');
  assert.ok(lane.compare(lane.result.cost, '1e500') >= 0);
  assert.ok(lane.compare(lane.payable(lane.result), '1e1000') > 0);
});

test('legacy main-lane status calls inherit the saved purchase bonus', () => {
  vm.runInContext('percentPower = 1; percentPowerPurchaseBonus = 11687.711; '
    + 'globalThis.fmtPowerBase = value => NumberMath.serialize(value);', context);
  const { softcapStatus } = context.probe('1', false, 0, 40000);

  const status = softcapStatus(1, undefined, 0);
  assert.match(status, /e11699/);
  assert.doesNotMatch(status, /1t/);
});

test('percent upgrade cost formatting does not truncate fractional prices to 1', () => {
  const formatterContext = vm.createContext({
    document: { getElementById: () => null, querySelector: () => null }
  });
  for (const file of ['number-math.js', 'dom.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), formatterContext);
  }

  const formatted = vm.runInContext(
    'fmtScientific(NumberMath.fromString("1.1660840899401224"))',
    formatterContext
  );
  assert.equal(formatted, '1.17e0');
  assert.equal(vm.runInContext('fmtScientific(12)', formatterContext), '1.2e1');
  assert.equal(vm.runInContext('fmtScientific(13)', formatterContext), '1.3e1');
});

test('large percent softcap and layered price remain visible in the UI formatter', () => {
  const formatterContext = vm.createContext({
    document: { getElementById: () => null, querySelector: () => null }
  });
  for (const file of ['number-math.js', 'dom.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), formatterContext);
  }

  const formattedCap = vm.runInContext(
    'fmtPowerBase(NumberMath.fromString("1e18571"))',
    formatterContext
  );
  const formattedPrice = vm.runInContext(
    'fmtScientific(NumberMath.fromString("1e1.3029339244222956e195"))',
    formatterContext
  );

  assert.equal(formattedCap, '1e18.6k');
  assert.match(formattedPrice, /^1e1\.3e195$/);
  assert.notEqual(formattedCap, '1t');
  assert.notEqual(formattedPrice, '1');
});

test('a percent power purchase advances both the actual price and softcap', () => {
  const result = vm.runInContext(`(() => {
    knuthEquippedUpgradeIds.clear();
    squareRunGameSeconds = 0;
    percentPower = 1;
    percentPowerPurchaseCount = 0;
    percentPowerPurchaseBonus = 0;
    percentPowerUpgradeCost = 40000;
    percentPowerCostCompounding = false;
    const beforeCost = percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
    const beforeCap = percentPowerSoftcap(percentPower, percentPowerPurchaseBonus);
    updatePercentPowerCostAfterPurchase();
    return {
      beforeCost: NumberMath.serialize(beforeCost),
      afterCost: NumberMath.serialize(percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding)),
      beforeCap: NumberMath.serialize(beforeCap),
      afterCap: NumberMath.serialize(percentPowerSoftcap(percentPower, percentPowerPurchaseBonus))
    };
  })()`, context);

  assert.equal(result.beforeCost, '40000');
  assert.equal(result.afterCost, '400000');
  assert.equal(result.beforeCap, '1000000000000');
  assert.equal(result.afterCap, '10000000000000');
});
