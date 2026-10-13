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
