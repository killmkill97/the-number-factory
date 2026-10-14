let saveStatsLoadedFromStorage = false;

function normalizeSaveCounter(value) {
  const counter = Number(value);
  return Number.isSafeInteger(counter) && counter >= 0 ? counter : 0;
}

function normalizePendingPercentUses(value) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function serializeKnuthContinuousValue(value) {
  return NumberMath.isScientific(value) ? NumberMath.serialize(value) : String(value);
}

function loadKnuthContinuousValue(rawValue) {
  const numeric = Number(rawValue);
  return Number.isFinite(numeric) && numeric >= 0 && numeric < 1e33
    ? NumberMath.fromValue(numeric)
    : numberValueFromSave(rawValue);
}

function loadPersistedSaveStats() {
  try {
    const raw = localStorage.getItem(SAVE_STATS_KEY);
    if (!raw) return;
    const stats = JSON.parse(raw);
    saveCount = normalizeSaveCounter(stats.saveCount);
    loadCount = normalizeSaveCounter(stats.loadCount);
    saveStatsLoadedFromStorage = true;
  } catch {
    saveCount = 0;
    loadCount = 0;
  }
}

function persistSaveStats() {
  localStorage.setItem(SAVE_STATS_KEY, JSON.stringify({ saveCount, loadCount }));
}

loadPersistedSaveStats();

function saveGame() {
  repairPercentPowerCostState();
  repairExtraPercentLanePowerCosts();
  updateAchievements();
  if (baseNumberIsInNoUnit()) unlockAchievement('no_unit_save');
  const nextSaveCount = saveCount + 1;
  const primarySquareDimension = squareDimensionState(0);
  const data = {
    version: SAVE_VERSION,
    num: serializeBaseNumber(),
    perClick: serializeNumberValue(perClick),
    perClickUpgradeCost: serializeNumberValue(perClickUpgradeCost),

    percentUnlocked,
    percentCharge,
    pendingPercentUses,
    percentChargeNeeded,
    percentChargeLevel,
    percentChargeUpgradeCost: serializeNumberValue(percentChargeUpgradeCost),
    percentPower,
    percentPowerPurchaseCount,
    percentPowerPurchaseBonus,
    percentPowerUpgradeCost: serializeNumberValue(percentPowerUpgradeCost),
    percentPowerCostCompounding,

    autoClickerUnlocked,
    autoClickerPrice: serializeNumberValue(autoClickerPrice),
    autoClickerSpeed,
    autoClickerSpeedPrice: serializeNumberValue(autoClickerSpeedPrice),
    autoClickerParallel: serializeNumberValue(autoClickerParallel),
    autoClickerParallelPrice: serializeNumberValue(autoClickerParallelPrice),
    autoClickerPercentFillUnlocked,

    percentAutoUnlocked,
    percentAutoPrice: serializeNumberValue(percentAutoPrice),
    percentAutoSpeedLevel,
    percentAutoSpeed,
    percentAutoSpeedPrice: serializeNumberValue(percentAutoSpeedPrice),

    percentLaneCount,
    nextPercentLaneUnlockCost: serializeNumberValue(nextPercentLaneUnlockCost),
    extraPercentLanes: extraPercentLanes.map(lane => ({
      laneNumber: lane.laneNumber,
      charge: lane.charge,
      pendingUses: lane.pendingUses,
      power: lane.power,
      powerPurchaseCount: lane.powerPurchaseCount,
      powerPurchaseBonus: lane.powerPurchaseBonus,
      powerCost: serializeNumberValue(lane.powerCost),
      powerCostCompounding: lane.powerCostCompounding,
      autoUnlocked: lane.autoUnlocked,
      autoPrice: serializeNumberValue(lane.autoPrice),
      autoSpeedLevel: lane.autoSpeedLevel,
      autoSpeed: lane.autoSpeed,
      autoSpeedPrice: serializeNumberValue(lane.autoSpeedPrice)
    })),

    squareUnlocked,
    squareBreakthroughEntered,
    knuthUnlocked,
    knuthPoints: serializeNumberValue(knuthPoints),
    squareRunGameSeconds: serializeKnuthContinuousValue(squareRunGameSeconds),
    knuthRunStartedAtMs,
    shortestKnuthRealSeconds,
    longestKnuthRealSeconds,
    pendingKnuthCompletionSeconds,
    squareSincePrestigeGameSeconds: serializeKnuthContinuousValue(squareSincePrestigeGameSeconds),
    knuthPercentOverflow: serializeKnuthContinuousValue(knuthPercentOverflow),
    numberBlackHoleSystemEnabled,
    numberBlackHoleDonationPercent,
    numberBlackHoleDonationRate,
    numberBlackHoleDonationAmountLevel,
    numberBlackHoleDonationSpeedLevel,
    numberBlackHoleDonationAmountCost: serializeNumberValue(numberBlackHoleDonationAmountCost),
    numberBlackHoleDonationSpeedCost: serializeNumberValue(numberBlackHoleDonationSpeedCost),
    numberBlackHoleTotalInvested: serializeNumberValue(numberBlackHoleTotalInvested),
    numberBlackHoleAccumulatedGameSeconds: serializeNumberValue(numberBlackHoleAccumulatedGameSeconds),
    hasClaimedKnuthPoint,
    pendingKnuthPointClaim,
    knuthOperationLevel,
    knuthBaseUpgradeLevels: { ...knuthBaseUpgradeLevels },
    knuthResetEquipmentOnNextPrestige,
    knuthEquippedUpgradeIds: [...knuthEquippedUpgradeIds],
    activeKnuthChallengeId,
    knuthChallengeDysonSwarmMaxAtEntry,
    completedKnuthChallengeIds: [...completedKnuthChallengeIds],
    activeChapter,
    squarePoints: serializeNumberValue(squarePoints),
    squareConvergenceUnlocked,
    squareConvergencePoints: serializeNumberValue(squareConvergencePoints),
    hasEverEarnedSquareConvergencePoint,
    squareDimensionX: serializeNumberValue(primarySquareDimension.x),
    squareDimensionY: serializeNumberValue(primarySquareDimension.y),
    squareDimensionZ: serializeNumberValue(primarySquareDimension.z),
    squareDimensionXCost: serializeNumberValue(primarySquareDimension.xCost),
    squareDimensionYCost: serializeNumberValue(primarySquareDimension.yCost),
    squareDimensionZCost: serializeNumberValue(primarySquareDimension.zCost),
    squareDimensionXGrowthLevel: serializeNumberValue(primarySquareDimension.xGrowthLevel),
    squareDimensionYGrowthLevel: serializeNumberValue(primarySquareDimension.yGrowthLevel),
    squareDimensionZGrowthLevel: serializeNumberValue(primarySquareDimension.zGrowthLevel),
    squareDimensionPowerInterval: primarySquareDimension.powerInterval,
    squareDimensionPowerIntervalCost: serializeNumberValue(primarySquareDimension.powerIntervalCost),
    squareDimensionPowerStrengthUnlocked: primarySquareDimension.powerStrengthUnlocked,
    squareDimensions: squareDimensionStates.map(dimension => ({
      x: serializeNumberValue(dimension.x),
      y: serializeNumberValue(dimension.y),
      z: serializeNumberValue(dimension.z),
      xCost: serializeNumberValue(dimension.xCost),
      yCost: serializeNumberValue(dimension.yCost),
      zCost: serializeNumberValue(dimension.zCost),
      xGrowthLevel: serializeNumberValue(dimension.xGrowthLevel),
      yGrowthLevel: serializeNumberValue(dimension.yGrowthLevel),
      zGrowthLevel: serializeNumberValue(dimension.zGrowthLevel),
      powerInterval: dimension.powerInterval,
      powerIntervalCost: serializeNumberValue(dimension.powerIntervalCost),
      powerStrengthUnlocked: dimension.powerStrengthUnlocked
    })),
    divergerN: serializeNumberValue(divergerN),
    divergerPower: serializeNumberValue(divergerPower),
    divergerA: serializeNumberValue(divergerA),
    divergerB,
    divergerC,
    divergerInterval,
    divergerACpCost: serializeNumberValue(divergerACpCost),
    divergerBCpCost: serializeNumberValue(divergerBCpCost),
    divergerCCpCost: serializeNumberValue(divergerCCpCost),
    divergerALevel,
    divergerBLevel,
    divergerCLevel,
    divergerSpeedLevel,
    divergerSpeedIntervalHistory: [...divergerSpeedIntervalHistory],
    divergerSpeedCpCost: serializeNumberValue(divergerSpeedCpCost),
    divergerUpgradeHistory,
    theory: serializeNumberValue(theory),
    totalTheoryPurchased: serializeNumberValue(totalTheoryPurchased),
    greatTheory: serializeNumberValue(greatTheory),
    greatTheoryCpCost: serializeNumberValue(greatTheoryCpCost),
    greatTheoryKpCost: serializeNumberValue(greatTheoryKpCost),
    greatTheorySpCost: serializeNumberValue(greatTheorySpCost),
    greatTheoryTheoryCost: serializeNumberValue(greatTheoryTheoryCost),
    abstractionCostResourceIndex,
    automatiumPrestigeRetentionUnlocked,
    abstractionResearchState: { ...abstractionResearchState },
    abstractionResearchPaidCosts: { ...abstractionResearchPaidCosts },
    abstractionResetOnNextKnuthPoint,
    abstractionBranchPriorities: { 1: [...abstractionBranchPriorities[1]], 2: [...abstractionBranchPriorities[2]] },
    generalizationResetCount,
    saveCount: nextSaveCount,
    loadCount,
    achievementState,
    theorySquarePointCost: serializeNumberValue(theorySquarePointCost),
    theoryConvergencePointCost: serializeNumberValue(theoryConvergencePointCost),
    generalizationResetCost: serializeNumberValue(generalizationResetCost),
    theoryCostResourceIndex,
    generalizationResearchState,
    squareUpgradeState,
    squareBreakthroughLevels,
    squareConvergenceUpgradeState,
    squareConvergenceUpgradeLevels,
    activeSquareView,
    autoUpgradeEnabled,
    squareDimensionAutoUpgradeEnabled,
    divergerAutoUpgradeEnabled
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  saveCount = nextSaveCount;
  saveStatsLoadedFromStorage = true;
  persistSaveStats();
  log('게임을 이 브라우저에 저장했습니다.', true);
}

function normalizeKnuthSaveFields(data) {
  const legacyAliases = [
    ['knuthUnlocked', 'kunuthUnlocked'],
    ['knuthPoints', 'kunuthPoints'],
    ['hasClaimedKnuthPoint', 'hasClaimedKunuthPoint'],
    ['pendingKnuthPointClaim', 'pendingKunuthPointClaim'],
    ['knuthOperationLevel', 'kunuthOperationLevel'],
    ['knuthResetEquipmentOnNextPrestige', 'kunuthResetEquipmentOnNextPrestige'],
    ['knuthEquippedUpgradeIds', 'kunuthEquippedUpgradeIds'],
    ['activeKnuthChallengeId', 'activeKunuthChallengeId'],
    ['completedKnuthChallengeIds', 'completedKunuthChallengeIds']
  ];

  for (const [currentKey, legacyKey] of legacyAliases) {
    if (data[currentKey] === undefined && data[legacyKey] !== undefined) {
      data[currentKey] = data[legacyKey];
    }
  }

  if (data.activeChapter === 'kunuth') data.activeChapter = 'knuth';
  return data;
}

function loadGame(rawOverride = null, options = {}) {
  const countAsLoad = options.countAsLoad !== false;
  const raw = rawOverride ?? localStorage.getItem(SAVE_KEY);
  if (!raw) {
    log('저장 데이터가 없습니다.', true);
    return;
  }

  try {
    const d = normalizeKnuthSaveFields(JSON.parse(raw));
    if (rawOverride !== null) localStorage.setItem(SAVE_KEY, raw);
    const saveVersion = Number(d.version ?? 1);
    const isLegacySave = !Number.isFinite(saveVersion) || saveVersion < 5;
    loadKnuthBaseUpgradeLevels(isLegacySave ? null : d.knuthBaseUpgradeLevels);

    if (!saveStatsLoadedFromStorage) {
      saveCount = normalizeSaveCounter(d.saveCount);
      loadCount = normalizeSaveCounter(d.loadCount);
      saveStatsLoadedFromStorage = true;
    }

    theory = numberValueFromSave(d.theory);
    totalTheoryPurchased = numberValueFromSave(d.totalTheoryPurchased, theory);
    greatTheory = numberValueFromSave(d.greatTheory);
    greatTheoryCpCost = numberValueFromSave(d.greatTheoryCpCost, ABSTRACTION_CP_BASE_COST);
    greatTheoryKpCost = numberValueFromSave(d.greatTheoryKpCost, ABSTRACTION_KP_BASE_COST);
    greatTheorySpCost = numberValueFromSave(d.greatTheorySpCost, ABSTRACTION_SP_BASE_COST);
    greatTheoryTheoryCost = numberValueFromSave(d.greatTheoryTheoryCost, 4);
    const savedAbstractionResourceIndex = Number(d.abstractionCostResourceIndex ?? 0);
    abstractionCostResourceIndex = Number.isInteger(savedAbstractionResourceIndex)
      && savedAbstractionResourceIndex >= 0
      && savedAbstractionResourceIndex <= 3
      && (savedAbstractionResourceIndex !== 3 || knuthBaseUpgradeLevel('theory_exchange') > 0)
      ? savedAbstractionResourceIndex
      : 0;
    loadAbstractionPermanentEffects(
      d.automatiumPrestigeRetentionUnlocked,
      d.abstractionResearchState
    );
    loadAbstractionResearchState(d.abstractionResearchState);
    loadAbstractionResetState(d.abstractionResearchPaidCosts, d.abstractionResetOnNextKnuthPoint);
    loadAbstractionBranchPriorities(d.abstractionBranchPriorities);
    loadKnuthRealTimeState(isLegacySave ? {} : d);
    generalizationResetCount = normalizeSaveCounter(d.generalizationResetCount);
    loadAchievementState(d.achievementState);
    theorySquarePointCost = numberValueFromSave(d.theorySquarePointCost, THEORY_SQUARE_POINT_BASE_COST);
    theoryConvergencePointCost = numberValueFromSave(d.theoryConvergencePointCost, THEORY_CONVERGENCE_POINT_BASE_COST);
    generalizationResetCost = numberValueFromSave(d.generalizationResetCost, GENERALIZATION_RESET_BASE_COST);
    const savedTheoryResourceIndex = Number(d.theoryCostResourceIndex ?? 0);
    theoryCostResourceIndex = Number.isFinite(saveVersion) && saveVersion >= 34
      ? savedTheoryResourceIndex
      : savedTheoryResourceIndex === 2 ? 1 : 0;
    if (!Number.isInteger(theoryCostResourceIndex) || theoryCostResourceIndex < 0 || theoryCostResourceIndex > 1) {
      theoryCostResourceIndex = 0;
    }
    const savedGeneralizationResearchState = d.generalizationResearchState;
    loadGeneralizationResearchState(savedGeneralizationResearchState);
    if (savedGeneralizationResearchState?.['6-4'] === true) {
      theory = addBaseNumbers(theory, 8);
    }
    divergerN = divergerNumberValueFromSave(d.divergerN, 1);
    divergerPower = divergerNumberValueFromSave(d.divergerPower, 0);
    divergerA = divergerNumberValueFromSave(d.divergerA, 1);
    const savedDivergerC = Number(d.divergerC ?? 0);
    divergerC = Number.isFinite(savedDivergerC)
      ? Math.min(DIVERGER_C_MAX, Math.max(0, Math.floor(savedDivergerC)))
      : 0;
    const savedDivergerInterval = Number(d.divergerInterval ?? DIVERGER_BASE_INTERVAL);
    divergerInterval = Number.isFinite(savedDivergerInterval)
      ? Math.min(DIVERGER_BASE_INTERVAL, Math.max(divergerMinInterval(), savedDivergerInterval))
      : DIVERGER_BASE_INTERVAL;
    const savedDivergerALevel = Number(d.divergerALevel ?? d.divergerUpgradeHistory?.a?.length ?? 0);
    const savedDivergerBLevel = Number(d.divergerBLevel ?? d.divergerUpgradeHistory?.b?.length ?? 0);
    const savedDivergerCLevel = Number(d.divergerCLevel ?? d.divergerUpgradeHistory?.c?.length ?? divergerC);
    const savedDivergerSpeedLevel = Number(d.divergerSpeedLevel ?? d.divergerUpgradeHistory?.speed?.length);
    divergerALevel = Number.isFinite(savedDivergerALevel) ? Math.max(0, Math.floor(savedDivergerALevel)) : 0;
    divergerBLevel = Number.isFinite(savedDivergerBLevel) ? Math.max(0, Math.floor(savedDivergerBLevel)) : 0;
    divergerB = divergerBAtLevel(divergerBLevel);
    divergerCLevel = Number.isFinite(savedDivergerCLevel)
      ? Math.min(DIVERGER_C_MAX, Math.max(0, Math.floor(savedDivergerCLevel)))
      : divergerC;
    divergerSpeedLevel = Number.isFinite(savedDivergerSpeedLevel)
      ? Math.max(0, Math.floor(savedDivergerSpeedLevel))
      : divergerSpeedLevelFromInterval(divergerInterval);
    loadDivergerSpeedIntervalHistory(d.divergerSpeedIntervalHistory);
    // 발산자 강화는 CP 전용으로 변경되었으므로 이전 저장의 가격 대신 현재 레벨 기준으로 재계산한다.
    divergerACpCost = divergerACpCostAtLevel(divergerALevel);
    divergerBCpCost = divergerBCpCostAtLevel(divergerBLevel);
    divergerCCpCost = divergerCCpCostAtLevel(divergerCLevel);
    divergerSpeedCpCost = divergerSpeedCpCostAtLevel(divergerSpeedLevel);
    loadDivergerUpgradeHistory(d.divergerUpgradeHistory, {
      a: divergerALevel,
      b: divergerBLevel,
      c: divergerCLevel,
      speed: divergerSpeedLevel
    }, !Number.isFinite(saveVersion) || saveVersion < SAVE_VERSION);
    divergerPower = divergerProductionValue(divergerN);
    divergerTimer = 0;
    divergerGraphSamples.length = 0;
    divergerGraphScaleMinimum = null;
    divergerGraphScaleMaximum = null;
    divergerAutoUpgradeEnabled = d.divergerAutoUpgradeEnabled !== false;
    divergerAutoUpgradeTimer = 0;
    divergerAutoUpgradeCursor = 0;
    squareDimensionAutoUpgradeEnabled = hasGeneralizationResearch('7-2')
      && (d.squareDimensionAutoUpgradeEnabled ?? true);
    squareDimensionAutoUpgradeTimer = 0;

    // 잠시 존재했던 누적 버퍼 저장값은 불러올 때 한 번만 실제 숫자에 합쳐 마이그레이션한다.
    setBaseNumber(addBaseNumbers(
      numberValueFromSave(d.num),
      numberValueFromSave(d.numPendingGain)
    ));
    perClick = numberValueFromSave(d.perClick, 1);
    perClickUpgradeCost = numberValueFromSave(d.perClickUpgradeCost, 10);

    percentUnlocked = d.percentUnlocked ?? false;
    percentCharge = d.percentCharge ?? 0;
    pendingPercentUses = normalizePendingPercentUses(d.pendingPercentUses);
    percentChargeNeeded = d.percentChargeNeeded ?? 100;
    percentChargeLevel = d.percentChargeLevel ?? 0;
    percentChargeUpgradeCost = numberValueFromSave(d.percentChargeUpgradeCost, 250);
    const loadedPercentPower = normalizedPercentPower(d.percentPower ?? 1);
    percentPowerPurchaseCount = normalizePercentPowerPurchaseCount(d.percentPowerPurchaseCount, loadedPercentPower);
    if (d.percentPowerPurchaseBonus !== undefined) {
      percentPower = loadedPercentPower;
      percentPowerPurchaseBonus = normalizedPercentPowerBonus(d.percentPowerPurchaseBonus);
    } else {
      percentPower = Math.min(loadedPercentPower, percentPowerPurchaseCount + 1);
      percentPowerPurchaseBonus = Math.max(0, loadedPercentPower - percentPower);
    }
    const reconciledMainPower = reconcilePercentPowerProgress(
      percentPower,
      percentPowerPurchaseCount
    );
    percentPower = reconciledMainPower.power;
    percentPowerPurchaseCount = reconciledMainPower.purchaseCount;
    if (percentPowerPurchaseBonus > 0) {
      percentPowerPurchaseBonus = percentPowerBonusForPurchase(percentPowerPurchaseCount);
    }
    percentPowerUpgradeCost = 40000;
    percentPowerCostCompounding = false;

    autoClickerUnlocked = d.autoClickerUnlocked ?? false;
    autoClickerPrice = numberValueFromSave(d.autoClickerPrice, 100);
    autoClickerSpeed = d.autoClickerSpeed ?? 1000;
    autoClickerSpeedPrice = numberValueFromSave(d.autoClickerSpeedPrice, 200);
    autoClickerParallel = numberValueFromSave(d.autoClickerParallel, 1);
    autoClickerParallelPrice = numberValueFromSave(d.autoClickerParallelPrice, 1000);
    autoClickerPercentFillUnlocked = d.autoClickerPercentFillUnlocked ?? false;

    percentAutoUnlocked = d.percentAutoUnlocked ?? false;
    percentAutoPrice = numberValueFromSave(d.percentAutoPrice, 150);
    percentAutoSpeedLevel = d.percentAutoSpeedLevel ?? 0;
    percentAutoSpeed = d.percentAutoSpeed ?? percentAutoSpeedLevels[percentAutoSpeedLevel];
    percentAutoSpeedPrice = numberValueFromSave(d.percentAutoSpeedPrice, 250);
    percentAutoTimer = 0;
    autoClickerTimer = 0;

    percentLaneCount = d.percentLaneCount ?? 1;
    nextPercentLaneUnlockCost = numberValueFromSave(d.nextPercentLaneUnlockCost, 200000);

    // 기존 동적 레인 UI와 데이터를 깨끗하게 재생성
    extraPercentLanes.length = 0;
    extraPercentLanesEl.innerHTML = '';
    for (const saved of (d.extraPercentLanes ?? [])) {
      const lane = makePercentLane(saved.laneNumber);
      lane.charge = saved.charge ?? 0;
      lane.pendingUses = normalizePendingPercentUses(saved.pendingUses);
      const loadedLanePower = normalizedPercentPower(saved.power ?? 1);
      lane.powerPurchaseCount = normalizePercentPowerPurchaseCount(saved.powerPurchaseCount, loadedLanePower);
      if (saved.powerPurchaseBonus !== undefined) {
        lane.power = loadedLanePower;
        lane.powerPurchaseBonus = normalizedPercentPowerBonus(saved.powerPurchaseBonus);
      } else {
        lane.power = Math.min(loadedLanePower, lane.powerPurchaseCount + 1);
        lane.powerPurchaseBonus = Math.max(0, loadedLanePower - lane.power);
      }
      const reconciledLanePower = reconcilePercentPowerProgress(
        lane.power,
        lane.powerPurchaseCount
      );
      lane.power = reconciledLanePower.power;
      lane.powerPurchaseCount = reconciledLanePower.purchaseCount;
      if (lane.powerPurchaseBonus > 0) {
        lane.powerPurchaseBonus = percentPowerBonusForPurchase(lane.powerPurchaseCount);
      }
      lane.powerCost = scaleByLane(40000, lane.laneNumber);
      lane.powerCostCompounding = false;
      lane.autoUnlocked = saved.autoUnlocked ?? false;
      lane.autoPrice = numberValueFromSave(saved.autoPrice, lane.autoPrice);
      lane.autoSpeedLevel = saved.autoSpeedLevel ?? 0;
      lane.autoSpeed = saved.autoSpeed ?? lane.autoSpeedLevels[lane.autoSpeedLevel];
      lane.autoSpeedPrice = numberValueFromSave(saved.autoSpeedPrice, lane.autoSpeedPrice);
      lane.autoTimer = 0;
      extraPercentLanes.push(lane);
      createExtraPercentLaneUI(lane);
    }

    numberBlackHoleSystemEnabled = d.numberBlackHoleSystemEnabled === true;
    const savedBlackHoleAmountLevel = Number(d.numberBlackHoleDonationAmountLevel ?? 0);
    numberBlackHoleDonationAmountLevel = Number.isSafeInteger(savedBlackHoleAmountLevel)
      ? Math.min(NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT - 1, Math.max(0, savedBlackHoleAmountLevel))
      : 0;
    const savedBlackHoleSpeedLevel = Number(d.numberBlackHoleDonationSpeedLevel ?? 0);
    const maxBlackHoleSpeedLevel = Math.ceil(
      (NUMBER_BLACK_HOLE_MAX_DONATION_RATE - NUMBER_BLACK_HOLE_BASE_DONATION_RATE)
      / NUMBER_BLACK_HOLE_DONATION_RATE_PER_UPGRADE
    );
    numberBlackHoleDonationSpeedLevel = Number.isSafeInteger(savedBlackHoleSpeedLevel)
      ? Math.min(maxBlackHoleSpeedLevel, Math.max(0, savedBlackHoleSpeedLevel))
      : 0;
    const maxBlackHoleDonationPercent = Math.min(
      NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT,
      NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT + numberBlackHoleDonationAmountLevel
    );
    const savedBlackHoleDonationPercent = Number(d.numberBlackHoleDonationPercent ?? NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT);
    numberBlackHoleDonationPercent = Number.isSafeInteger(savedBlackHoleDonationPercent)
      ? Math.max(NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT, Math.min(maxBlackHoleDonationPercent, savedBlackHoleDonationPercent))
      : NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT;
    const maxBlackHoleDonationRate = Math.min(
      NUMBER_BLACK_HOLE_MAX_DONATION_RATE,
      NUMBER_BLACK_HOLE_BASE_DONATION_RATE
        + (numberBlackHoleDonationSpeedLevel * NUMBER_BLACK_HOLE_DONATION_RATE_PER_UPGRADE)
    );
    const savedBlackHoleDonationRate = Number(d.numberBlackHoleDonationRate ?? NUMBER_BLACK_HOLE_BASE_DONATION_RATE);
    numberBlackHoleDonationRate = Number.isSafeInteger(savedBlackHoleDonationRate)
      ? Math.max(NUMBER_BLACK_HOLE_BASE_DONATION_RATE, Math.min(maxBlackHoleDonationRate, savedBlackHoleDonationRate))
      : NUMBER_BLACK_HOLE_BASE_DONATION_RATE;
    numberBlackHoleDonationAmountCost = numberValueFromSave(
      d.numberBlackHoleDonationAmountCost,
      NUMBER_BLACK_HOLE_BASE_UPGRADE_COST
    );
    numberBlackHoleDonationSpeedCost = numberValueFromSave(
      d.numberBlackHoleDonationSpeedCost,
      NUMBER_BLACK_HOLE_BASE_UPGRADE_COST
    );
    numberBlackHoleTotalInvested = numberValueFromSave(d.numberBlackHoleTotalInvested);
    numberBlackHoleAccumulatedGameSeconds = numberValueFromSave(d.numberBlackHoleAccumulatedGameSeconds);
    if (typeof resetNumberBlackHoleTimers === 'function') resetNumberBlackHoleTimers();

    if (isLegacySave) {
      squareUnlocked = d.squareUnlocked ?? d.squareMode ?? false;
      squareBreakthroughEntered = false;
      knuthUnlocked = false;
      knuthPoints = 0;
      squareRunGameSeconds = 0;
      squareSincePrestigeGameSeconds = 0;
      knuthPercentOverflow = 0;
      hasClaimedKnuthPoint = false;
      pendingKnuthPointClaim = false;
      knuthOperationLevel = 0;
      knuthResetEquipmentOnNextPrestige = false;
      knuthEquippedUpgradeIds.clear();
      activeKnuthChallengeId = null;
      knuthChallengeDysonSwarmMaxAtEntry = 8;
      completedKnuthChallengeIds.clear();
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
      squarePoints = numberValueFromSave(d.squarePoints, squareUnlocked ? 1 : 0);
      squareConvergenceUnlocked = false;
      squareConvergencePoints = 0;
      hasEverEarnedSquareConvergencePoint = false;
      resetSquareUpgradeState();
      resetSquareBreakthroughState();
      resetSquareConvergenceUpgradeState();
    } else {
      squareUnlocked = d.squareUnlocked ?? false;
      knuthUnlocked = d.knuthUnlocked === true;
      const loadedKnuthPoints = numberValueFromSave(d.knuthPoints);
      knuthPoints = NumberMath.isScientific(loadedKnuthPoints)
        ? loadedKnuthPoints
        : Math.floor(loadedKnuthPoints);
      squareRunGameSeconds = loadKnuthContinuousValue(d.squareRunGameSeconds ?? d.knuthRunGameSeconds);
      squareSincePrestigeGameSeconds = loadKnuthContinuousValue(d.squareSincePrestigeGameSeconds);
      knuthPercentOverflow = loadKnuthContinuousValue(d.knuthPercentOverflow);
      hasClaimedKnuthPoint = d.hasClaimedKnuthPoint === true || isPositiveNumberValue(knuthPoints);
      pendingKnuthPointClaim = d.pendingKnuthPointClaim === true && knuthUnlocked && !hasClaimedKnuthPoint;
      const savedKnuthOperationLevel = Number(d.knuthOperationLevel ?? 0);
      knuthOperationLevel = Number.isSafeInteger(savedKnuthOperationLevel)
        ? Math.max(0, savedKnuthOperationLevel)
        : 0;
      knuthResetEquipmentOnNextPrestige = d.knuthResetEquipmentOnNextPrestige === true;
      knuthEquippedUpgradeIds.clear();
      const knownKnuthUpgradeIds = new Set(KNUTH_SLOT_UPGRADES.map(upgrade => upgrade.id));
      for (const id of d.knuthEquippedUpgradeIds ?? []) {
        const restoredId = id === 'percent_exponentiation' || id === 'percent_time_multiplier'
          ? 'diverger_percent_price_delay'
          : id;
        if (knownKnuthUpgradeIds.has(restoredId)) knuthEquippedUpgradeIds.add(restoredId);
      }
      while (knuthSlotsUsed() > knuthSlotCapacity()) {
        const lastId = [...knuthEquippedUpgradeIds].pop();
        if (!lastId) break;
        knuthEquippedUpgradeIds.delete(lastId);
      }
      const knownKnuthChallengeIds = new Set(KNUTH_CHALLENGES.map(challenge => challenge.id));
      completedKnuthChallengeIds.clear();
      for (const id of d.completedKnuthChallengeIds ?? []) {
        if (knownKnuthChallengeIds.has(id)) completedKnuthChallengeIds.add(id);
      }
      activeKnuthChallengeId = knownKnuthChallengeIds.has(d.activeKnuthChallengeId)
        && !completedKnuthChallengeIds.has(d.activeKnuthChallengeId)
        ? d.activeKnuthChallengeId
        : null;
      knuthChallengeDysonSwarmMaxAtEntry = activeKnuthChallengeId === 'kc1'
        && Number.isSafeInteger(Number(d.knuthChallengeDysonSwarmMaxAtEntry))
        && Number(d.knuthChallengeDysonSwarmMaxAtEntry) >= 8
        ? Number(d.knuthChallengeDysonSwarmMaxAtEntry)
        : 8;
      activeChapter = d.activeChapter ?? (squareUnlocked ? 'square' : 'multiplication');
    squarePoints = numberValueFromSave(d.squarePoints);
    squareConvergenceUnlocked = d.squareConvergenceUnlocked ?? false;
    squareConvergencePoints = numberValueFromSave(d.squareConvergencePoints);
    for (let index = 0; index < squareDimensionStates.length; index++) {
      const dimension = squareDimensionState(index);
      const savedDimension = d.squareDimensions?.[index] ?? (index === 0 ? {
        x: d.squareDimensionX,
        y: d.squareDimensionY,
        z: d.squareDimensionZ,
        xCost: d.squareDimensionXCost,
        yCost: d.squareDimensionYCost,
        zCost: d.squareDimensionZCost,
        xGrowthLevel: d.squareDimensionXGrowthLevel,
        yGrowthLevel: d.squareDimensionYGrowthLevel,
        zGrowthLevel: d.squareDimensionZGrowthLevel,
        powerInterval: d.squareDimensionPowerInterval,
        powerIntervalCost: d.squareDimensionPowerIntervalCost,
        powerStrengthUnlocked: d.squareDimensionPowerStrengthUnlocked
      } : null);
      if (!savedDimension) continue;

      dimension.x = numberValueFromSave(savedDimension.x, dimension.x);
      dimension.y = numberValueFromSave(savedDimension.y, dimension.y);
      dimension.z = numberValueFromSave(savedDimension.z, dimension.z);
      dimension.xCost = numberValueFromSave(savedDimension.xCost, dimension.xCost);
      dimension.yCost = numberValueFromSave(savedDimension.yCost, dimension.yCost);
      dimension.zCost = numberValueFromSave(savedDimension.zCost, dimension.zCost);
      dimension.xGrowthLevel = numberValueFromSave(savedDimension.xGrowthLevel, dimension.xGrowthLevel);
      dimension.yGrowthLevel = numberValueFromSave(savedDimension.yGrowthLevel, dimension.yGrowthLevel);
      dimension.zGrowthLevel = numberValueFromSave(savedDimension.zGrowthLevel, dimension.zGrowthLevel);
      dimension.xGrowthCarry = 0;
      dimension.yGrowthCarry = 0;
      dimension.zGrowthCarry = 0;

      const savedSquareDimensionInterval = Number(
        savedDimension.powerInterval ?? SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL
      );
      dimension.powerInterval = Number.isFinite(savedSquareDimensionInterval)
        ? Math.min(
          SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL,
          Math.max(SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL, Math.floor(savedSquareDimensionInterval))
        )
        : SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL;
      dimension.powerIntervalCost = numberValueFromSave(
        savedDimension.powerIntervalCost,
        dimension.powerIntervalCost
      );
      dimension.powerStrengthUnlocked = savedDimension.powerStrengthUnlocked === true;
    }
      resetSquareUpgradeState();
      for (const upgrade of SQUARE_UPGRADES) {
        squareUpgradeState[upgrade.id] = d.squareUpgradeState?.[upgrade.id] === true;
      }
      loadSquareConvergenceUpgradeState(d.squareConvergenceUpgradeState, d.squareConvergenceUpgradeLevels);
      if (
        isPositiveNumberValue(squareConvergencePoints) ||
        Object.values(squareConvergenceUpgradeState).some(value => value)
      ) {
        squareConvergenceUnlocked = true;
      }
      const legacyConvergenceSpendingRecorded =
        Object.values(squareConvergenceUpgradeLevels).some(level => level > 0)
        || divergerALevel > 0
        || divergerBLevel > 0
        || divergerCLevel > 0
        || divergerSpeedLevel > 0
        || generalizationResetCount > 0
        || compareNumberValues(theoryConvergencePointCost, THEORY_CONVERGENCE_POINT_BASE_COST) > 0;
      hasEverEarnedSquareConvergencePoint = d.hasEverEarnedSquareConvergencePoint === true
        || isPositiveNumberValue(squareConvergencePoints)
        || legacyConvergenceSpendingRecorded;
      applyAutomatiumSquareUpgradeUnlocks();
      loadSquareBreakthroughState(d.squareBreakthroughLevels);
      const hadEnteredSquareBreakthrough = d.squareBreakthroughEntered === true
        || activeChapter === 'square-breakthrough'
        || Object.values(squareBreakthroughLevels).some(level => level > 0);
      squareBreakthroughEntered = hadEnteredSquareBreakthrough && canOpenSquareBreakthrough();
      autoUpgradeEnabled = hasSquareUpgrade('auto_upgrade_top_down')
        ? d.autoUpgradeEnabled ?? false
        : false;
    }

    // 화폐가 저장되어 있으면 오래된 해금 플래그가 빠져 있어도 해당 챕터 탭을 복구한다.
    if (isPositiveNumberValue(squarePoints) || isPositiveNumberValue(squareConvergencePoints)) {
      squareUnlocked = true;
    }
    if (isPositiveNumberValue(squareConvergencePoints)) {
      squareConvergenceUnlocked = true;
    }
    if (isPositiveNumberValue(knuthPoints)) {
      knuthUnlocked = true;
      hasClaimedKnuthPoint = true;
      pendingKnuthPointClaim = false;
    }
    if (activeChapter === 'tetration' || activeChapter === 'square-breakthrough' || activeChapter === 'square-convergence') {
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
    }
    if (activeChapter === 'square-convergence' && !canOpenSquareConvergence()) {
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
    }
    activeSquareView = ['upgrades', 'breakthrough', 'convergence', 'dimensions'].includes(d.activeSquareView)
      ? d.activeSquareView
      : d.activeChapter === 'square-breakthrough' ? 'breakthrough'
        : d.activeChapter === 'square-convergence' ? 'convergence'
          : 'upgrades';
    squareMode = false;
    if (perClick > BASE_PER_CLICK_CAP) perClick = BASE_PER_CLICK_CAP;
    if (autoClickerParallel > autoClickerParallelCap()) autoClickerParallel = autoClickerParallelCap();
    if (autoClickerSpeed < autoClickerMinSpeed()) autoClickerSpeed = autoClickerMinSpeed();
    if (hasSquareBreakthrough('solid_start')) {
      ensureBaseNumberAtLeast(2000000);
    }
    // 저장 당시 플래그가 오래된 세이브와 어긋나도 실제 해금 조건을 다시 판정한다.
    // 높은 수를 가진 세이브가 퍼센트 잠금 상태로 복원되면 자동 생산이 멈춘다.
    maybeUnlockPercent();
    if (hasSquareBreakthrough('overcharge')) percentChargeNeeded = 1;
    if (percentChargeNeeded < minimumPercentChargeNeeded()) percentChargeNeeded = minimumPercentChargeNeeded();
    percentCharge = Math.min(percentCharge, percentChargeNeeded);
    percentPower = normalizedPercentPower(percentPower);
    const savedPercentPowerCost = numberValueFromSave(d.percentPowerUpgradeCost);
    const restoredMainCost = restoredPercentPowerCost(
      savedPercentPowerCost,
      d.percentPowerCostCompounding === true,
      percentPowerPurchaseCount,
      40000
    );
    percentPowerCostCompounding = restoredMainCost.compounding;
    percentPowerUpgradeCost = restoredMainCost.cost;
    repairPercentPowerCostState();
    for (const lane of extraPercentLanes) {
      lane.power = normalizedPercentPower(lane.power);
      const savedLanePowerCost = numberValueFromSave(d.extraPercentLanes?.find(item => item.laneNumber === lane.laneNumber)?.powerCost);
      const savedLanePowerCostIsCompounding = d.extraPercentLanes?.find(item => item.laneNumber === lane.laneNumber)?.powerCostCompounding === true;
      const restoredLaneCost = restoredPercentPowerCost(
        savedLanePowerCost,
        savedLanePowerCostIsCompounding,
        lane.powerPurchaseCount,
        scaleByLane(40000, lane.laneNumber)
      );
      lane.powerCostCompounding = restoredLaneCost.compounding;
      lane.powerCost = restoredLaneCost.cost;
      repairPercentLanePowerCost(lane);
    }
    syncPermanentPercentLanes();
    rebasePercentPowerPricesForDiverger(true);

    overflowed = false;
    pendingSquarePrestigeValue = null;
    pendingSquarePrestigePoints = null;
    pendingSquarePrestigeRequirement = null;
    displayBox.classList.remove('glitch');
    dialogueBox.classList.remove('show');
    dialogueBox.innerHTML = '';
    prestigeBtn.classList.add('hidden');
    document.getElementById('squareUpgradeRow')?.remove();

    if (!squareUnlocked) {
      setChapter('multiplication');
    } else {
      setChapter(activeChapter);
    }
  addBtn.textContent = `+${fmt(perClick)}`;
    upgradeClickBtn.classList.remove('hidden');

    resetAchievementTimers();
    if (countAsLoad) {
      loadCount += 1;
      hasPerformedLoad = true;
      persistSaveStats();
    }
    updateAchievements();
    render();
    log(
      isLegacySave
        ? '구버전 저장 데이터를 새 제곱 포인트 규칙으로 복구했습니다.'
        : '저장 데이터를 불러왔습니다.',
      true
    );
  } catch (e) {
    console.error(e);
    log('저장 데이터를 읽는 중 오류가 발생했습니다.', true);
  }
}

function requestSaveGame() {
  if (!window.confirm('저장하시겠습니까?')) return;
  saveGame();
  window.numberTycoonCloud?.saveCurrent?.();
}

function requestLoadGame() {
  if (!window.confirm('불러오시겠습니까?')) return;
  if (window.numberTycoonCloud?.isReady?.()) {
    window.numberTycoonCloud.loadCurrent();
  } else {
    loadGame();
  }
}

saveBtn.addEventListener('click', requestSaveGame);
loadBtn.addEventListener('click', requestLoadGame);

window.saveGame = saveGame;
window.loadGame = loadGame;
