const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gameContext() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  vm.runInContext('render = () => {}; knuthUnlocked = true;', context);
  return context;
}

test('abstraction paths are exclusive, require their predecessor, and survive saves', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    for (const id of ['1-1', '2-1', '3-1']) abstractionResearchState[id] = true;
    greatTheory = 16;
    const firstChoices = ['4-1', '4-2', '4-3'].map(canResearchAbstraction);
    const bought = researchAbstraction('4-2');
    const locked = ['4-1', '4-3', '6-2'].map(canResearchAbstraction);
    const next = researchAbstraction('5-2') && researchAbstraction('6-2');
    const allCostsPaid = compareNumberValues(greatTheory, 0) === 0;
    const mixedParents = { parents: ['1-1', '2-1', '4-1', '4-2', '4-3'] };
    const anyBranchWithAllNormal = abstractionResearchParentsReady(mixedParents);
    abstractionResearchState['2-1'] = false;
    const missingNormal = abstractionResearchParentsReady(mixedParents);
    abstractionResearchState['2-1'] = true;
    const saved = JSON.parse(JSON.stringify({ ...abstractionResearchState }));
    loadAbstractionResearchState(null);
    loadAbstractionResearchState(saved);
    return {
      firstChoices, bought, locked, next, allCostsPaid,
      anyBranchWithAllNormal, missingNormal,
      restored: ['4-1', '4-2', '4-3', '5-2', '6-2'].map(hasAbstractionResearch),
      otherBranchLocked: abstractionResearchBranchLocked(ABSTRACTION_RESEARCHES.find(r => r.id === '4-3'))
    };
  })()`, context)));

  assert.deepEqual(result, {
    firstChoices: [true, true, true], bought: true,
    locked: [false, false, false], next: true, allCostsPaid: true,
    anyBranchWithAllNormal: true, missingNormal: false,
    restored: [false, true, false, true, true], otherBranchLocked: true
  });
});

test('time path changes equipped time reward, black-hole speed, and earned time', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    squareUnlocked = true;
    squareRunGameSeconds = 10;
    knuthEquippedUpgradeIds.add('knuth_time_gain');
    const rewardBefore = NumberMath.toNumber(knuthSpCpGainMultiplier());
    abstractionResearchState['4-1'] = true;
    const rewardAfter = NumberMath.toNumber(knuthSpCpGainMultiplier());
    generalizationResearchState['3-1'] = true;
    squareDimensionStates[0].x = NumberMath.fromString('1e100');
    squareBreakthroughLevels.black_hole = 1;
    const tickBefore = gameTick(1000);
    abstractionResearchState['5-1'] = true;
    const tickAfter = gameTick(1000);
    squareBreakthroughLevels.black_hole = 0;
    squareRunGameSeconds = 0;
    abstractionResearchState['6-1'] = true;
    advanceSquareRunTime(1000);
    return { rewardBefore, rewardAfter, tickBefore, tickAfter, earnedTime: squareRunGameSeconds };
  })()`, context)));

  assert.ok(result.rewardAfter > result.rewardBefore);
  assert.ok(Math.abs(result.rewardAfter - (1 + 10 ** 0.75)) < 1e-12);
  assert.ok(result.tickAfter > result.tickBefore);
  assert.equal(result.earnedTime, 49);
});

test('expansion path improves diverger growth, CP gain, and the percent softcap', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    generalizationResearchState['3-1'] = true;
    generalizationResearchState['3-2'] = true;
    knuthPoints = 100000;
    divergerN = 1000;
    divergerB = 2;
    divergerPower = NumberMath.fromString('1e100');
    squareDimensionStates[0].x = NumberMath.fromString('1e400');
    squarePoints = NumberMath.fromString('1e20');
    const productionBefore = divergerProductionValue();
    abstractionResearchState['4-2'] = true;
    const productionAfter = divergerProductionValue();
    const cpBefore = squareConvergencePointGain();
    abstractionResearchState['5-2'] = true;
    const cpAfter = squareConvergencePointGain();
    const capBefore = percentPowerSoftcap(100);
    abstractionResearchState['6-2'] = true;
    const capAfter = percentPowerSoftcap(100);
    return {
      productionRaised: compareNumberValues(productionAfter, productionBefore) > 0,
      cpRaised: compareNumberValues(cpAfter, cpBefore) > 0,
      capRaised: compareNumberValues(capAfter, capBefore) > 0
    };
  })()`, context)));

  assert.deepEqual(result, { productionRaised: true, cpRaised: true, capRaised: true });
});

test('percent path increases percent gain and softcap while lowering power price', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    generalizationResearchState['3-1'] = true;
    generalizationResearchState['3-2'] = true;
    divergerPower = NumberMath.fromString('1e100');
    squareDimensionStates[0].x = NumberMath.fromString('1e400');
    squarePoints = NumberMath.fromString('1e100');
    squareConvergencePoints = NumberMath.fromString('1e50');
    knuthPoints = NumberMath.fromString('1e5');
    theory = 100;
    greatTheory = 10;
    const gainBefore = percentGain(NumberMath.fromString('1e100'), 100);
    abstractionResearchState['4-3'] = true;
    const gainAfter = percentGain(NumberMath.fromString('1e100'), 100);
    const capBefore = percentPowerSoftcap(100);
    abstractionResearchState['5-3'] = true;
    const capAfter = percentPowerSoftcap(100);
    const priceBefore = applyPercentPowerPriceDiscount(NumberMath.fromString('1e1000'), 100);
    abstractionResearchState['6-3'] = true;
    const priceAfter = applyPercentPowerPriceDiscount(NumberMath.fromString('1e1000'), 100);
    return {
      gainRaised: compareNumberValues(gainAfter, gainBefore) > 0,
      capRaised: compareNumberValues(capAfter, capBefore) > 0,
      priceLowered: compareNumberValues(priceAfter, priceBefore) < 0
    };
  })()`, context)));

  assert.deepEqual(result, { gainRaised: true, capRaised: true, priceLowered: true });
});

test('percent branch softcap power saturates without growing beyond the rebalanced limit', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    percentUnlocked = true;
    squareUpgradeState.percent_power_8 = true;
    generalizationResearchState['3-1'] = true;
    generalizationResearchState['5-2'] = true;
    generalizationResearchState['5-4'] = true;
    abstractionResearchState['8-2'] = true;
    knuthEquippedUpgradeIds.add('percent_softcap_square');
    squareDimensionStates[0].x = NumberMath.fromString('1e4000');
    const number = NumberMath.powerOfTen(10.2e9);
    const baseCapLog = numberLog10(percentPowerSoftcap(320000));
    const baseGain = percentFinalUseGain(number, 320000);
    const baseRewardLog = numberLog10(squarePointGainForValue(baseGain));
    const cases = [0, '1e100', '1e4260000', '1e1e20'].map(sp => {
      squarePoints = NumberMath.fromString(String(sp));
      abstractionResearchState['5-3'] = true;
      return {
        capStrength: numberLog10(percentPowerSoftcap(320000)) / baseCapLog,
        rewardLogBonus: numberLog10(squarePointGainForValue(percentFinalUseGain(number, 320000))) - baseRewardLog
      };
    });
    return cases;
  })()`, context)));

  assert.equal(result[0].capStrength, 1);
  assert.equal(result[0].rewardLogBonus, 0);
  for (let index = 1; index < result.length; index++) {
    assert.ok(result[index].capStrength > result[index - 1].capStrength);
    assert.ok(result[index].capStrength <= 1.500001);
    assert.ok(result[index].rewardLogBonus > 0);
  }
  assert.ok(result[2].capStrength > 1.49);
});

test('standalone percent output falls between time and expansion on the observed high-progress fixture', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    squareUnlocked = true;
    percentUnlocked = true;
    for (const id of Object.keys(squareUpgradeState)) squareUpgradeState[id] = true;
    for (const id of Object.keys(squareConvergenceUpgradeState)) squareConvergenceUpgradeState[id] = true;
    for (const id of Object.keys(generalizationResearchState)) generalizationResearchState[id] = true;
    for (const id of ['1-1', '2-1', '3-1', '8-2', '9-2', '14-1']) {
      abstractionResearchState[id] = true;
    }
    for (const id of ['knuth_time_gain', 'percent_softcap_square', 'percent_time_discount',
      'percent_count_discount', 'percent_purchase_bonus', 'percent_cap_200']) {
      knuthEquippedUpgradeIds.add(id);
    }
    squareBreakthroughLevels.black_hole = 1;
    squareBreakthroughLevels.dyson_swarm = 8;
    squarePoints = NumberMath.powerOfTen(4260000);
    knuthPoints = 1.42e9;
    knuthRunStartedAtMs = Date.now() - 1920000;
    divergerA = 1;
    divergerB = 1;
    divergerC = 0;
    divergerN = NumberMath.fromString('2.8e20');
    for (const [index, sides] of [[0, ['1.04e31', '2.91e27', '2.91e27']],
      [1, ['2.56e24', '2.56e24', '1.52e24']]]) {
      for (const [sideIndex, side] of ['x', 'y', 'z'].entries()) {
        squareDimensionStates[index][side] = NumberMath.fromString(sides[sideIndex]);
      }
    }
    squareRunGameSeconds = 4.65e19;
    const number = NumberMath.powerOfTen(10.2e9);
    function sample(path) {
      for (const id of ['4-1', '5-1', '6-1', '4-2', '5-2', '6-2', '4-3', '5-3', '6-3']) {
        abstractionResearchState[id] = false;
      }
      for (const id of path) abstractionResearchState[id] = true;
      divergerPower = divergerProductionValue();
      const gameMs = gameTick(1000);
      const production = multiplyNumberValue(percentFinalUseGain(number, 320000, 19.938), gameMs / 10);
      const sp = multiplyNumberValue(squarePointGainForValue(production), gameMs / 100000);
      return { numberLog: numberLog10(production), spLog: numberLog10(sp) };
    }
    return { base: sample([]), time: sample(['4-1', '5-1', '6-1']),
      expansion: sample(['4-2', '5-2', '6-2']), percent: sample(['4-3', '5-3', '6-3']) };
  })()`, context)));

  assert.ok(result.percent.numberLog > result.time.numberLog, JSON.stringify(result));
  assert.ok(result.percent.numberLog < result.expansion.numberLog, JSON.stringify(result));
  const position = (result.percent.numberLog - result.time.numberLog)
    / (result.expansion.numberLog - result.time.numberLog);
  assert.ok(position > 0.25 && position < 0.45, JSON.stringify(result));
});
