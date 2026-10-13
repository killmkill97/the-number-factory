const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createGameContext() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

test('keeps small integer powers exact before the approximation path', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    const value = NumberMath.power(2, 12);
    return {
      value: NumberMath.serialize(value),
      comparison: NumberMath.compare(value, 4096),
      floor: NumberMath.serialize(NumberMath.floor(value))
    };
  })()`, context);

  assert.deepEqual({ ...result }, { value: '4096', comparison: 0, floor: '4096' });
});

test('matches exact native results for small nonnegative integer powers', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    for (let base = 0; base <= 12; base++) {
      for (let exponent = 0; exponent <= 12; exponent++) {
        const actual = NumberMath.power(base, exponent);
        if (NumberMath.compare(actual, Math.pow(base, exponent)) !== 0) {
          return { base, exponent, actual: NumberMath.serialize(actual) };
        }
      }
    }
    return null;
  })()`, context);

  assert.equal(result, null);
});

test('supports finite fractional exponent values consistently across compare, floor, and ceil', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    const parsed = NumberMath.fromString('1e0.5', null);
    const powered = NumberMath.power(10, 0.5);
    const negativeParsed = NumberMath.fromString('1e-0.5', null);
    const tiny = NumberMath.fromString('1e-1e1000', null);
    return {
      parsedNumber: NumberMath.toNumber(parsed),
      comparison: NumberMath.compare(parsed, powered),
      floor: NumberMath.serialize(NumberMath.floor(parsed)),
      ceil: NumberMath.serialize(NumberMath.ceil(parsed)),
      negativeNumber: NumberMath.toNumber(negativeParsed),
      negativeFloor: NumberMath.serialize(NumberMath.floor(negativeParsed)),
      negativeCeil: NumberMath.serialize(NumberMath.ceil(negativeParsed)),
      tinyFloor: NumberMath.serialize(NumberMath.floor(tiny)),
      tinyCeil: NumberMath.serialize(NumberMath.ceil(tiny))
    };
  })()`, context);

  assert.ok(Math.abs(result.parsedNumber - Math.sqrt(10)) < 1e-14);
  assert.equal(result.comparison, 0);
  assert.equal(result.floor, '3');
  assert.equal(result.ceil, '4');
  assert.ok(Math.abs(result.negativeNumber - (1 / Math.sqrt(10))) < 1e-14);
  assert.equal(result.negativeFloor, '0');
  assert.equal(result.negativeCeil, '1');
  assert.equal(result.tinyFloor, '0');
  assert.equal(result.tinyCeil, '1');
});

test('rounds discounted integer costs upward independently of representation', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    squareUpgradeState.all_cost_half = true;
    const integer = discountedCost(5);
    const scientific = discountedCost(NumberMath.normalize(5, 0));
    const ceiling = ceilDiv(15, 10);
    return {
      integer: NumberMath.serialize(integer),
      scientific: NumberMath.serialize(scientific),
      ceiling: NumberMath.serialize(ceiling)
    };
  })()`, context);

  assert.deepEqual({ ...result }, { integer: '3', scientific: '3', ceiling: '2' });
});

test('does not turn invalid powers into a neutral multiplier or compare NaN asymmetrically', () => {
  const context = createGameContext();
  const result = vm.runInContext(`({
    invalidPowerOfTen: NumberMath.serialize(NumberMath.powerOfTen(NaN)),
    invalidPower: NumberMath.serialize(NumberMath.power(10, NaN)),
    positiveInfinity: NumberMath.serialize(NumberMath.fromNumber(Infinity)),
    positiveInfinityMatchesPowerCap: NumberMath.compare(
      NumberMath.fromNumber(Infinity),
      NumberMath.powerOfTen(Infinity)
    ),
    compareInvalidFirst: NumberMath.compare(NaN, 1),
    compareInvalidSecond: NumberMath.compare(1, NaN),
    compareInvalidPair: NumberMath.compare(NaN, NaN)
  })`, context);

  assert.deepEqual({ ...result }, {
    invalidPowerOfTen: '0',
    invalidPower: '0',
    positiveInfinity: `1e${Number.MAX_VALUE}`,
    positiveInfinityMatchesPowerCap: 0,
    compareInvalidFirst: -1,
    compareInvalidSecond: 1,
    compareInvalidPair: 0
  });
});

test('preserves the smallest positive JavaScript number through normalization', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    const cases = [];
    for (let units = 1; units <= 100; units++) {
      const input = Number.MIN_VALUE * units;
      const parsed = NumberMath.fromNumber(input);
      const normalized = NumberMath.normalize(input, 0);
      cases.push({
        input,
        parsed: NumberMath.toNumber(parsed),
        normalized: NumberMath.toNumber(normalized),
        mantissaFinite: Number.isFinite(normalized.mantissa)
      });
    }
    return cases;
  })()`, context);

  for (const entry of result) {
    assert.equal(entry.mantissaFinite, true);
    assert.equal(entry.parsed, entry.input);
    assert.equal(entry.normalized, entry.input);
  }
});

test('accepts legacy NumberMath object values in generic save fields', () => {
  const context = createGameContext();
  const result = vm.runInContext(`NumberMath.serialize(numberValueFromSave({
    approximate: true,
    mantissa: 7.5,
    exponent: 40
  }))`, context);

  assert.equal(result, '7.5e40');
});

test('keeps Dyson 12 game ticks, diverger production, and softcap finite', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    generalizationResearchState['2-3'] = true;
    generalizationResearchState['3-2'] = true;
    squareBreakthroughLevels.dyson_swarm = 12;
    squareBreakthroughLevels.black_hole = 1;
    squareBreakthroughLevels.overclock = 1;
    const tick = gameTick(1000);
    resetDivergerProgress();
    advanceDiverger(1000);
    return {
      multiplier: dysonEffectNumber(),
      tick,
      divergerN: NumberMath.serialize(divergerN),
      divergerPower: NumberMath.serialize(divergerPower),
      divergerPositive: NumberMath.isPositive(divergerPower),
      softcapAboveBaseline: NumberMath.compare(percentPowerSoftcap(1, 0), '1e12') > 0
    };
  })()`, context);

  assert.equal(result.multiplier, 4096);
  assert.equal(result.tick, 8192000);
  assert.equal(result.divergerN, '8193');
  assert.equal(result.divergerPositive, true);
  assert.equal(result.softcapAboveBaseline, true);
});

test('KC1 adds breakthrough caps based on Dyson max at challenge entry', () => {
  const runChallenge = (withDysonResearch) => {
    const context = createGameContext();
    const result = vm.runInContext(`(() => {
      extraPercentLanesEl = { innerHTML: '' };
      setChapter = () => {};
      render = () => {};
      knuthUnlocked = true;
      hasClaimedKnuthPoint = true;
      if (${withDysonResearch}) {
        generalizationResearchState['2-3'] = true;
        generalizationResearchState['2-4'] = true;
      }
      if (!startKnuthChallenge('kc1')) throw new Error('KC1 did not start');
      const maxima = {
        dysonAtEntry: knuthChallengeDysonSwarmMaxAtEntry,
        dysonMaxDuringChallenge: squareBreakthroughMax(SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === 'dyson_swarm')),
        dysonEffectMultiplier: NumberMath.toNumber(dysonEffectMultiplier()),
        overclock: squareBreakthroughMax(SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === 'overclock')),
        bottleneck: squareBreakthroughMax(SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === 'bottleneck_tracker'))
      };
      return maxima;
    })()`, context);
    return { ...result };
  };

  assert.deepEqual(runChallenge(false), {
    dysonAtEntry: 8,
    dysonMaxDuringChallenge: 8,
    dysonEffectMultiplier: 1,
    overclock: 40,
    bottleneck: 24
  });
  assert.deepEqual(runChallenge(true), {
    dysonAtEntry: 12,
    dysonMaxDuringChallenge: 8,
    dysonEffectMultiplier: 1,
    overclock: 56,
    bottleneck: 32
  });
});

test('KC1 completion unlocks unequipping Knuth upgrades', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    render = () => {};
    knuthEquippedUpgradeIds.add('knuth_time_gain');
    const blockedBeforeCompletion = !toggleKnuthUpgrade('knuth_time_gain');
    completedKnuthChallengeIds.add('kc1');
    const unequippedAfterCompletion = toggleKnuthUpgrade('knuth_time_gain')
      && !hasKnuthUpgrade('knuth_time_gain');
    return { blockedBeforeCompletion, unequippedAfterCompletion };
  })()`, context);
  assert.deepEqual({ ...result }, {
    blockedBeforeCompletion: true,
    unequippedAfterCompletion: true
  });
});

test('KC2 blocks dimensions and diverger and uses CP as its completion target', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    extraPercentLanesEl = { innerHTML: '' };
    setChapter = () => {};
    render = () => {};
    knuthUnlocked = true;
    hasClaimedKnuthPoint = true;
    knuthEquippedUpgradeIds.add('permanent_production');
    generalizationResearchState['3-1'] = true;
    generalizationResearchState['3-2'] = true;
    if (!startKnuthChallenge('kc2')) throw new Error('KC2 did not start');
    squarePoints = NumberMath.fromString('1e100');
    squareConvergencePoints = 999;
    const belowGoal = canCompleteKnuthChallenge();
    squareConvergencePoints = 1000;
    return {
      dimensionsAvailable: squareDimensionAvailable(),
      divergerAvailable: divergerAvailable(),
      belowGoal,
      atGoal: canCompleteKnuthChallenge()
    };
  })()`, context);

  assert.deepEqual({ ...result }, {
    dimensionsAvailable: false,
    divergerAvailable: false,
    belowGoal: false,
    atGoal: true
  });
});

test('KC2 preserves square dimensions on convergence after completion', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    const converge = preserve => {
      completedKnuthChallengeIds.delete('kc2');
      if (preserve) completedKnuthChallengeIds.add('kc2');
      generalizationResearchState['3-1'] = true;
      generalizationResearchState['4-2'] = true;
      squareDimensionStates[0].x = 1234;
      squareDimensionStates[0].xCost = 31;
      squareDimensionStates[1].x = 4321;
      squareDimensionAutoUpgradeTimer = 275;
      squarePoints = squareConvergenceExchangeRequirement();
      collectSquareConvergenceIfReady();
      return {
        firstX: squareDimensionStates[0].x,
        firstCost: squareDimensionStates[0].xCost,
        secondX: squareDimensionStates[1].x,
        timer: squareDimensionAutoUpgradeTimer
      };
    };
    return { preserved: converge(true), reset: converge(false) };
  })()`, context);

  assert.deepEqual({ ...result, preserved: { ...result.preserved }, reset: { ...result.reset } }, {
    preserved: { firstX: 1234, firstCost: 31, secondX: 4321, timer: 275 },
    reset: { firstX: 500, firstCost: 1, secondX: 500, timer: 0 }
  });
});

test('KC3 blocks generalization, requires 1b CP, and doubles purchased theory', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    extraPercentLanesEl = { innerHTML: '' };
    setChapter = () => {};
    log = () => {};
    fmt = value => String(value);
    render = () => {};
    knuthUnlocked = true;
    hasClaimedKnuthPoint = true;
    completedKnuthChallengeIds.delete('kc3');
    if (!startKnuthChallenge('kc3')) throw new Error('KC3 did not start');
    hasEverEarnedSquareConvergencePoint = true;
    theory = 20;
    const generalizationLocked = !canOpenGeneralizationResearch();
    const purchaseBlocked = !canResearchGeneralization('1-1');
    squareConvergencePoints = 999999999;
    const belowGoal = !canCompleteKnuthChallenge();
    squareConvergencePoints = 1000000000;
    const atGoal = canCompleteKnuthChallenge();
    if (!completeKnuthChallenge()) throw new Error('KC3 did not complete at goal');

    squareConvergenceUnlocked = true;
    theorySquarePointCost = 1;
    theoryConvergencePointCost = 1;
    squarePoints = 100;
    squareConvergencePoints = 100;
    theoryCostResourceIndex = 0;
    const boughtWithSp = purchaseTheory(1);
    const afterSp = NumberMath.toNumber(theory);
    theoryCostResourceIndex = 1;
    const boughtWithCp = purchaseTheory(1);
    return {
      goal: knuthChallenge('kc3').goal,
      generalizationLocked,
      purchaseBlocked,
      belowGoal,
      atGoal,
      completed: hasCompletedKnuthChallenge('kc3'),
      boughtWithSp,
      afterSp,
      boughtWithCp,
      finalTheory: NumberMath.toNumber(theory),
      totalTheoryPurchased: NumberMath.toNumber(totalTheoryPurchased)
    };
  })()`, context);

  assert.deepEqual({ ...result }, {
    goal: 1000000000,
    generalizationLocked: true,
    purchaseBlocked: true,
    belowGoal: true,
    atGoal: true,
    completed: true,
    boughtWithSp: true,
    afterSp: 2,
    boughtWithCp: true,
    finalTheory: 4,
    totalTheoryPurchased: 4
  });
});

test('diverger price-delay equipment shifts the percent-power price acceleration milestones', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    knuthEquippedUpgradeIds.add('diverger_percent_price_delay');
    divergerPower = NumberMath.fromString('9999999999');
    const beforeFirst = percentPowerPriceAccelerationStart();
    divergerPower = NumberMath.fromString('1e10');
    const firstMilestone = percentPowerPriceAccelerationStart();
    divergerPower = NumberMath.fromString('1.5e10');
    const secondMilestone = percentPowerPriceAccelerationStart();
    divergerPower = NumberMath.fromString('2.25e10');
    const thirdMilestone = percentPowerPriceAccelerationStart();
    return {
      beforeFirst,
      firstMilestone,
      secondMilestone,
      thirdMilestone,
      milestones: divergerPercentPriceShiftMilestones(),
      shift: NumberMath.serialize(divergerPercentPriceShiftAmount())
    };
  })()`, context);

  assert.deepEqual({ ...result }, {
    beforeFirst: 8,
    firstMilestone: 10000000008,
    secondMilestone: 20000000008,
    thirdMilestone: 30000000008,
    milestones: 3,
    shift: '30000000000'
  });
});

test('diverger price-delay rebases stored compounded prices once for every percent lane', () => {
  const context = createGameContext();
  const lanesSource = fs.readFileSync(path.join(__dirname, '../scripts/systems/percent-lanes.js'), 'utf8');
  vm.runInContext(lanesSource, context, { filename: 'percent-lanes.js' });
  const result = vm.runInContext(`(() => {
    percentPower = 101;
    percentPowerPurchaseCount = 100;
    percentPowerUpgradeCost = NumberMath.fromString('1e100000');
    percentPowerCostCompounding = true;
    extraPercentLanes.push({
      laneNumber: 2,
      power: 101,
      powerPurchaseCount: 100,
      powerCost: NumberMath.fromString('1e200000'),
      powerCostCompounding: true
    });
    knuthEquippedUpgradeIds.add('diverger_percent_price_delay');
    divergerPower = NumberMath.fromString('1e10');

    const rebased = rebasePercentPowerPricesForDiverger();
    const mainCost = NumberMath.serialize(percentPowerUpgradeCost);
    const laneCost = NumberMath.serialize(extraPercentLanes[0].powerCost);
    const mainCompounding = percentPowerCostCompounding;
    const laneCompounding = extraPercentLanes[0].powerCostCompounding;

    percentPowerUpgradeCost = NumberMath.fromString('1e900');
    const repeatedRenderRebased = rebasePercentPowerPricesForDiverger();
    const unchangedAfterRepeatedRender = NumberMath.serialize(percentPowerUpgradeCost);

    divergerPower = NumberMath.fromString('1.5e10');
    const nextMilestoneRebased = rebasePercentPowerPricesForDiverger();
    percentPowerUpgradeCost = NumberMath.fromString('1e900');
    const forcedLoadRebased = rebasePercentPowerPricesForDiverger(true);
    return {
      rebased,
      mainCost,
      laneCost,
      mainBelowThreshold: NumberMath.compare(percentPowerUpgradeCost, '1e500') < 0,
      laneBelowThreshold: NumberMath.compare(extraPercentLanes[0].powerCost, '1e500') < 0,
      mainCompounding,
      laneCompounding,
      repeatedRenderRebased,
      unchangedAfterRepeatedRender,
      nextMilestoneRebased,
      forcedLoadRebased,
      forcedLoadBelowThreshold: NumberMath.compare(percentPowerUpgradeCost, '1e500') < 0,
      nextAccelerationStart: percentPowerPriceAccelerationStart()
    };
  })()`, context);

  assert.equal(result.rebased, true);
  assert.equal(result.mainCompounding, false);
  assert.equal(result.laneCompounding, false);
  assert.equal(result.mainBelowThreshold, true);
  assert.equal(result.laneBelowThreshold, true);
  assert.equal(result.repeatedRenderRebased, false);
  assert.equal(result.unchangedAfterRepeatedRender, '1e900');
  assert.equal(result.nextMilestoneRebased, true);
  assert.equal(result.forcedLoadRebased, true);
  assert.equal(result.forcedLoadBelowThreshold, true);
  assert.equal(result.nextAccelerationStart, 20000000008);
});

test('diverger price delay only changes price progression, not percent production', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    percentUnlocked = true;
    percentPower = 1;
    percentPowerPurchaseBonus = 0;
    squareSincePrestigeGameSeconds = 100;
    divergerPower = NumberMath.fromString('1e10');
    knuthEquippedUpgradeIds.add('diverger_percent_price_delay');
    setBaseNumber(NumberMath.fromString('2e12'));

    const before = getBaseNumber();
    applyPercentUse(before, percentPower, 'test-percent', percentPowerPurchaseBonus);
    return NumberMath.serialize(subtractNumberValues(getBaseNumber(), before));
  })()`, context);

  assert.equal(result, '5000000000');
});

test('square-cycle time equipment accumulates across tabs and resets on square exchange', () => {
  const context = createGameContext();
  const result = vm.runInContext(`(() => {
    squareUnlocked = true;
    activeChapter = 'multiplication';
    advanceSquarePrestigeCycleTime(10000);
    const afterBase = NumberMath.serialize(squareSincePrestigeGameSeconds);
    activeChapter = 'square';
    advanceSquarePrestigeCycleTime(2000);
    const afterSquare = NumberMath.serialize(squareSincePrestigeGameSeconds);
    activeChapter = 'knuth';
    advanceSquarePrestigeCycleTime(3000);
    const afterKnuth = NumberMath.serialize(squareSincePrestigeGameSeconds);
    resetSquarePrestigeCycleTime();
    return {
      afterBase,
      afterSquare,
      afterKnuth,
      afterPrestige: NumberMath.serialize(squareSincePrestigeGameSeconds)
    };
  })()`, context);

  assert.deepEqual({ ...result }, {
    afterBase: '10',
    afterSquare: '12',
    afterKnuth: '15',
    afterPrestige: '0'
  });
});

test('computes black-hole radius and time from NumberMath values without native coercion', () => {
  const context = createGameContext();
  const source = fs.readFileSync(
    path.join(__dirname, '../scripts/systems/number-black-hole.js'),
    'utf8'
  );
  vm.runInContext(source.split('\nnumberBlackHoleAmountUpgradeBtn.addEventListener')[0], context);
  const result = vm.runInContext(`(() => {
    numberBlackHoleSystemEnabled = true;
    knuthUnlocked = true;
    numberBlackHoleTotalInvested = NumberMath.fromString('1e100');
    numberBlackHoleDonationPercent = 1;
    return {
      radius: NumberMath.toNumber(numberBlackHoleSchwarzschildRadius()),
      time: numberBlackHoleTimeMultiplier()
    };
  })()`, context);

  const expectedRadius = Math.log10(401);
  const expectedTime = 200 * (expectedRadius / 0.5);
  assert.ok(Math.abs(result.radius - expectedRadius) < 1e-10);
  assert.ok(Math.abs(result.time / expectedTime - 1) < 1e-10);
});
