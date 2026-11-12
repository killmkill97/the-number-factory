// Partial fixture from the user's visible 2026-10-21 game, not an exported save.
function seedObservedProbabilizerGame() {
  knuthUnlocked = true; hasClaimedKnuthPoint = true; squareUnlocked = true;
  hasEverEarnedSquareConvergencePoint = true;
  knuthPoints = NumberMath.fromString('1.52e320');
  Object.assign(knuthBaseUpgradeLevels, { cp_gain:206, sp_gain:240, kp_gain:192, diverger_gain:162,
    dimension_gain:255, dyson_limit:141, number_black_hole:1, extra_branch:1, diverger_b_strength:1,
    starting_resources:1, overclock_limit:375, theory_exchange:1, late_abstraction:1,
    diverger_b_bonus:2, starting_upgrades:1, probabilizer:1 });
  for (const r of GENERALIZATION_RESEARCHES) generalizationResearchState[r.id] = true;
  for (const r of SQUARE_UPGRADES) squareUpgradeState[r.id] = true;
  for (const r of ABSTRACTION_RESEARCHES) abstractionResearchState[r.id] = r.column <= 17
    && r.id !== '2-2' && (!r.branch || ['time','expansion','active','passive'].includes(r.branch));
  for (const id of ['18-1','18-4','18-5','18-8','19-2']) abstractionResearchState[id] = true;
  abstractionSecondBranchPurchaseOrder = ['active','passive'];
  KNUTH_SLOT_UPGRADES.forEach(u => knuthEquippedUpgradeIds.add(u.id)); knuthOperationLevel = 300;
  ACHIEVEMENTS.slice(0,57).forEach(a => { achievementState[a.id] = true; });
  KNUTH_CHALLENGES.forEach(c => completedKnuthChallengeIds.add(c.id));
  squareBreakthroughLevels.dyson_swarm = 294; squareBreakthroughLevels.black_hole = 1;
  squareConvergenceUpgradeState.timium = true;
  squareConvergenceUpgradeLevels.cp_gain_5x = 1204;
  singularityPoints = 12; singularityUpgradeLevels.black_hole = 2; singularityUpgradeLevels.kp_gain = 1;
  numberBlackHoleSystemEnabled = true; numberBlackHoleDonationResource = 'sp';
  numberBlackHoleDonationPercent = 20; numberBlackHoleDonationRate = 18151;
  numberBlackHoleDonationAmountLevel = 99; numberBlackHoleDonationSpeedLevel = 1815;
  numberBlackHoleSpDonationCount = 358000000;
  numberBlackHoleTotalSpInvested = NumberMath.fromString('1e6.32e128');
  numberBlackHoleAccumulatedGameSeconds = NumberMath.fromString('4.54e105');
  squareRunGameSeconds = NumberMath.fromString('4.5e105');
  knuthRunStartedAtMs = gameUtcNowMs() - 61400000; shortestKnuthRealSeconds = 0.179;
  knuthPercentOverflow = NumberMath.fromString('1.62e17');
  divergerN = NumberMath.fromString('2.45e110'); divergerA = NumberMath.fromString('5.04e4270');
  divergerBLevel = 6274; divergerB = divergerBAtLevel(divergerBLevel); divergerC = 99;
  divergerALevel = 14187; divergerCLevel = 99; divergerInterval = 100;
  divergerACpCost = divergerACpCostAtLevel(divergerALevel);
  divergerBCpCost = divergerBCpCostAtLevel(divergerBLevel);
  for (const d of squareDimensionStates) {
    d.x = NumberMath.fromString('1.11e115'); d.y = NumberMath.fromString('7.08e109');
    d.z = NumberMath.fromString('7.08e109'); d.power = NumberMath.fromString('1e248000000000000');
  }
  setBaseNumber('1e1.52e132'); squarePoints = NumberMath.fromString('1e6.32e128');
  squareConvergencePoints = NumberMath.fromString('1.73e2500'); theory = 419000; greatTheory = 1200;
  percentUnlocked = true; percentPower = 200; percentPowerPurchaseBonus = 20;
  randomPower = 530000; probabilizerTimerMs = 0; probabilizerLastRoll = null;
  probabilizerUpgradeLevels = { a:3, b:5, speed:2, shift:2 };
  divergerPower = divergerProductionValue();
}

function observedProbabilizerSnapshot() {
  const log = value => NumberMath.toNumber(NumberMath.log10(NumberMath.max(1,value)));
  return { power:NumberMath.toNumber(randomPower), aLog:log(abstractionEffectiveDivergerA()),
    b:abstractionEffectiveDivergerB(), dLog:log(divergerProductionValue()),
    cpLog:log(squareConvergencePointGain()), kpLog:log(knuthPointGain()),
    parameterMultiplier:log(probabilizerDivergerParameterMultiplier()) };
}

// One manual CP/KP exchange, followed by the observed base-autobuyer choices and
// enough existing percent uses to settle the new cap. This is not a full N replay.
function projectObservedSpCycle(parameterStrength, power = 1000000, legacyPower = false,
  parameterScale = PROBABILIZER_BALANCE.divergerParameterScale) {
  const originalStrength = PROBABILIZER_BALANCE.divergerParameterLogStrength;
  const originalScale = PROBABILIZER_BALANCE.divergerParameterScale;
  const originalMultiplier = probabilizerDivergerParameterMultiplier;
  try {
    PROBABILIZER_BALANCE.divergerParameterLogStrength = parameterStrength;
    PROBABILIZER_BALANCE.divergerParameterScale = parameterScale;
    if (legacyPower) probabilizerDivergerParameterMultiplier = () =>
      !probabilizerAvailable() || !isPositiveNumberValue(randomPower) ? 1
        : NumberMath.power(addBaseNumbers(1, NumberMath.divideApproximate(randomPower,
          PROBABILIZER_BALANCE.referencePower)), parameterStrength);
    seedObservedProbabilizerGame(); randomPower = power; divergerPower = divergerProductionValue();
    const cp = collectSquareConvergenceIfReady(), kp = knuthPointGain();
    if (!exchangeKnuthPointsManually()) throw Error('Observed KP exchange unavailable');
    const choices = ['operation','cp_gain','sp_gain','kp_gain','diverger_gain','dimension_gain',
      'dyson_limit','overclock_limit','diverger_b_bonus'];
    for (const id of ['operation', ...KNUTH_BASE_UPGRADES.map(u => u.id)]) {
      knuthBaseAutoEnabled[id] = choices.includes(id);
    }
    knuthBaseAutoCursor = 0; knuthBaseAutoTimerMs = 0;
    for (let i = 0; i < 256; i++) {
      advanceKnuthBaseAutomation(1000);
      if (!choices.some(id => id !== 'operation' && canBuyKnuthBaseUpgrade(id))) break;
      if (i === 255) throw Error('Observed base autobuyers failed to settle');
    }
    let purchases = 0;
    for (let step = 0; step < 3; step++) {
      advanceDiverger(1000); advanceSquareRunTime(1000); advanceSquareDimensions(1000);
      applyPercentUsesBatch(percentPower, 1e12, 'probabilizer-sp-projection', percentPowerPurchaseBonus);
      advanceAbstraction(1000);
      for (const id of ['dyson_swarm','overclock']) {
        while (buySquareBreakthroughUpgrade(id)) {
          if (++purchases > 4096) throw Error('Unexpected projection purchase loop');
        }
      }
    }
    const gain = squarePointGainForValue(getBaseNumber());
    return { parameterStrength, parameterScale, curve:legacyPower ? 'power' : 'log', power, cp:NumberMath.serialize(cp), kp:NumberMath.serialize(kp),
      sp:NumberMath.serialize(gain), spLogLog:NumberMath.toNumber(NumberMath.log10(NumberMath.log10(gain))),
      number:NumberMath.serialize(getBaseNumber()), dyson:squareBreakthroughLevel('dyson_swarm'),
      effectiveDyson:effectiveDysonSwarmLevel(), overclock:squareBreakthroughLevel('overclock'),
      dysonLimit:knuthBaseUpgradeLevel('dyson_limit'), purchases };
  } finally {
    PROBABILIZER_BALANCE.divergerParameterLogStrength = originalStrength;
    PROBABILIZER_BALANCE.divergerParameterScale = originalScale;
    probabilizerDivergerParameterMultiplier = originalMultiplier;
  }
}

module.exports = { seedObservedProbabilizerGame, observedProbabilizerSnapshot, projectObservedSpCycle };
