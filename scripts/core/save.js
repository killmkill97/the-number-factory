let saveStatsLoadedFromStorage = false;

function normalizeSaveCounter(value) {
  const counter = Number(value);
  return Number.isSafeInteger(counter) && counter >= 0 ? counter : 0;
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
  updateAchievements();
  if (baseNumberIsInNoUnit()) unlockAchievement('no_unit_save');
  const nextSaveCount = saveCount + 1;
  const primarySquareDimension = squareDimensionState(0);
  const data = {
    version: SAVE_VERSION,
    num: serializeBaseNumber(),
    perClick: perClick.toString(),
    perClickUpgradeCost: perClickUpgradeCost.toString(),

    percentUnlocked,
    percentCharge,
    percentChargeNeeded,
    percentChargeLevel,
    percentChargeUpgradeCost: percentChargeUpgradeCost.toString(),
    percentPower,
    percentPowerUpgradeCost: serializeNumberValue(percentPowerUpgradeCost),
    percentPowerCostCompounding,

    autoClickerUnlocked,
    autoClickerPrice: autoClickerPrice.toString(),
    autoClickerSpeed,
    autoClickerSpeedPrice: autoClickerSpeedPrice.toString(),
    autoClickerParallel: autoClickerParallel.toString(),
    autoClickerParallelPrice: autoClickerParallelPrice.toString(),
    autoClickerPercentFillUnlocked,

    percentAutoUnlocked,
    percentAutoPrice: percentAutoPrice.toString(),
    percentAutoSpeedLevel,
    percentAutoSpeed,
    percentAutoSpeedPrice: percentAutoSpeedPrice.toString(),

    percentLaneCount,
    nextPercentLaneUnlockCost: nextPercentLaneUnlockCost.toString(),
    extraPercentLanes: extraPercentLanes.map(lane => ({
      laneNumber: lane.laneNumber,
      charge: lane.charge,
      power: lane.power,
      powerCost: serializeNumberValue(lane.powerCost),
      powerCostCompounding: lane.powerCostCompounding,
      autoUnlocked: lane.autoUnlocked,
      autoPrice: lane.autoPrice.toString(),
      autoSpeedLevel: lane.autoSpeedLevel,
      autoSpeed: lane.autoSpeed,
      autoSpeedPrice: lane.autoSpeedPrice.toString()
    })),

    squareUnlocked,
    squareBreakthroughEntered,
    kunuthUnlocked,
    kunuthPoints: serializeNumberValue(kunuthPoints),
    hasClaimedKunuthPoint,
    pendingKunuthPointClaim,
    kunuthOperationLevel,
    kunuthResetEquipmentOnNextPrestige,
    kunuthEquippedUpgradeIds: [...kunuthEquippedUpgradeIds],
    activeChapter,
    squarePoints: serializeNumberValue(squarePoints),
    squareConvergenceUnlocked,
    squareConvergencePoints: serializeNumberValue(squareConvergencePoints),
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
    divergerSpeedCpCost: serializeNumberValue(divergerSpeedCpCost),
    divergerUpgradeHistory,
    theory: serializeNumberValue(theory),
    totalTheoryPurchased: serializeNumberValue(totalTheoryPurchased),
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
    squareDimensionAutoUpgradeEnabled
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  saveCount = nextSaveCount;
  saveStatsLoadedFromStorage = true;
  persistSaveStats();
  log('게임을 이 브라우저에 저장했습니다.', true);
}

function loadGame(rawOverride = null, options = {}) {
  const countAsLoad = options.countAsLoad !== false;
  const raw = rawOverride ?? localStorage.getItem(SAVE_KEY);
  if (!raw) {
    log('저장 데이터가 없습니다.', true);
    return;
  }

  try {
    const d = JSON.parse(raw);
    if (rawOverride !== null) localStorage.setItem(SAVE_KEY, raw);
    const saveVersion = Number(d.version ?? 1);
    const isLegacySave = !Number.isFinite(saveVersion) || saveVersion < 5;

    if (!saveStatsLoadedFromStorage) {
      saveCount = normalizeSaveCounter(d.saveCount);
      loadCount = normalizeSaveCounter(d.loadCount);
      saveStatsLoadedFromStorage = true;
    }

    theory = numberValueFromSave(d.theory);
    totalTheoryPurchased = numberValueFromSave(d.totalTheoryPurchased, theory);
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
      theory = addBaseNumbers(theory, 8n);
    }
    divergerN = divergerNumberValueFromSave(d.divergerN, 1n);
    divergerPower = divergerNumberValueFromSave(d.divergerPower, 0n);
    divergerA = numberValueFromSave(d.divergerA, 1n);
    const savedDivergerB = Number(d.divergerB ?? 1.05);
    divergerB = Number.isFinite(savedDivergerB) && savedDivergerB >= 1.05 ? savedDivergerB : 1.05;
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
    divergerCLevel = Number.isFinite(savedDivergerCLevel)
      ? Math.min(DIVERGER_C_MAX, Math.max(0, Math.floor(savedDivergerCLevel)))
      : divergerC;
    divergerSpeedLevel = Number.isFinite(savedDivergerSpeedLevel)
      ? Math.max(0, Math.floor(savedDivergerSpeedLevel))
      : divergerSpeedLevelFromInterval(divergerInterval);
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
    divergerTimer = 0;
    divergerGraphSamples.length = 0;
    divergerGraphScaleMinimum = null;
    divergerGraphScaleMaximum = null;
    squareDimensionAutoUpgradeEnabled = hasGeneralizationResearch('7-2')
      && (d.squareDimensionAutoUpgradeEnabled ?? true);
    squareDimensionAutoUpgradeTimer = 0;

    // 잠시 존재했던 누적 버퍼 저장값은 불러올 때 한 번만 실제 숫자에 합쳐 마이그레이션한다.
    setBaseNumber(addBaseNumbers(
      numberValueFromSave(d.num),
      numberValueFromSave(d.numPendingGain)
    ));
    perClick = BigInt(d.perClick ?? '1');
    perClickUpgradeCost = BigInt(d.perClickUpgradeCost ?? '10');

    percentUnlocked = d.percentUnlocked ?? false;
    percentCharge = d.percentCharge ?? 0;
    percentChargeNeeded = d.percentChargeNeeded ?? 100;
    percentChargeLevel = d.percentChargeLevel ?? 0;
    percentChargeUpgradeCost = BigInt(d.percentChargeUpgradeCost ?? '250');
    percentPower = d.percentPower ?? 1;
    percentPowerUpgradeCost = 40000n;
    percentPowerCostCompounding = false;

    autoClickerUnlocked = d.autoClickerUnlocked ?? false;
    autoClickerPrice = BigInt(d.autoClickerPrice ?? '100');
    autoClickerSpeed = d.autoClickerSpeed ?? 1000;
    autoClickerSpeedPrice = BigInt(d.autoClickerSpeedPrice ?? '200');
    autoClickerParallel = BigInt(d.autoClickerParallel ?? '1');
    autoClickerParallelPrice = BigInt(d.autoClickerParallelPrice ?? '1000');
    autoClickerPercentFillUnlocked = d.autoClickerPercentFillUnlocked ?? false;

    percentAutoUnlocked = d.percentAutoUnlocked ?? false;
    percentAutoPrice = BigInt(d.percentAutoPrice ?? '150');
    percentAutoSpeedLevel = d.percentAutoSpeedLevel ?? 0;
    percentAutoSpeed = d.percentAutoSpeed ?? percentAutoSpeedLevels[percentAutoSpeedLevel];
    percentAutoSpeedPrice = BigInt(d.percentAutoSpeedPrice ?? '250');
    percentAutoTimer = 0;
    autoClickerTimer = 0;

    percentLaneCount = d.percentLaneCount ?? 1;
    nextPercentLaneUnlockCost = BigInt(d.nextPercentLaneUnlockCost ?? '200000');

    // 기존 동적 레인 UI와 데이터를 깨끗하게 재생성
    extraPercentLanes.length = 0;
    extraPercentLanesEl.innerHTML = '';
    for (const saved of (d.extraPercentLanes ?? [])) {
      const lane = makePercentLane(saved.laneNumber);
      lane.charge = saved.charge ?? 0;
      lane.power = saved.power ?? 1;
      lane.powerCost = scaleByLane(40000n, lane.laneNumber);
      lane.powerCostCompounding = false;
      lane.autoUnlocked = saved.autoUnlocked ?? false;
      lane.autoPrice = BigInt(saved.autoPrice ?? lane.autoPrice.toString());
      lane.autoSpeedLevel = saved.autoSpeedLevel ?? 0;
      lane.autoSpeed = saved.autoSpeed ?? lane.autoSpeedLevels[lane.autoSpeedLevel];
      lane.autoSpeedPrice = BigInt(saved.autoSpeedPrice ?? lane.autoSpeedPrice.toString());
      lane.autoTimer = 0;
      extraPercentLanes.push(lane);
      createExtraPercentLaneUI(lane);
    }

    if (isLegacySave) {
      squareUnlocked = d.squareUnlocked ?? d.squareMode ?? false;
      squareBreakthroughEntered = false;
      kunuthUnlocked = false;
      kunuthPoints = 0n;
      hasClaimedKunuthPoint = false;
      pendingKunuthPointClaim = false;
      kunuthOperationLevel = 0;
      kunuthResetEquipmentOnNextPrestige = false;
      kunuthEquippedUpgradeIds.clear();
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
      squarePoints = numberValueFromSave(d.squarePoints, squareUnlocked ? 1n : 0n);
      squareConvergenceUnlocked = false;
      squareConvergencePoints = 0n;
      resetSquareUpgradeState();
      resetSquareBreakthroughState();
      resetSquareConvergenceUpgradeState();
    } else {
      squareUnlocked = d.squareUnlocked ?? false;
      kunuthUnlocked = d.kunuthUnlocked === true;
      kunuthPoints = numberValueFromSave(d.kunuthPoints);
      hasClaimedKunuthPoint = d.hasClaimedKunuthPoint === true || isPositiveNumberValue(kunuthPoints);
      pendingKunuthPointClaim = d.pendingKunuthPointClaim === true && kunuthUnlocked && !hasClaimedKunuthPoint;
      const savedKunuthOperationLevel = Number(d.kunuthOperationLevel ?? 0);
      kunuthOperationLevel = Number.isSafeInteger(savedKunuthOperationLevel)
        ? Math.max(0, savedKunuthOperationLevel)
        : 0;
      kunuthResetEquipmentOnNextPrestige = d.kunuthResetEquipmentOnNextPrestige === true;
      kunuthEquippedUpgradeIds.clear();
      const knownKunuthUpgradeIds = new Set(KUNUTH_SLOT_UPGRADES.map(upgrade => upgrade.id));
      for (const id of d.kunuthEquippedUpgradeIds ?? []) {
        if (knownKunuthUpgradeIds.has(id)) kunuthEquippedUpgradeIds.add(id);
      }
      while (kunuthSlotsUsed() > kunuthSlotCapacity()) {
        const lastId = [...kunuthEquippedUpgradeIds].pop();
        if (!lastId) break;
        kunuthEquippedUpgradeIds.delete(lastId);
      }
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
    if (isPositiveNumberValue(kunuthPoints)) {
      kunuthUnlocked = true;
      hasClaimedKunuthPoint = true;
      pendingKunuthPointClaim = false;
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
      ensureBaseNumberAtLeast(2000000n);
    }
    // 저장 당시 플래그가 오래된 세이브와 어긋나도 실제 해금 조건을 다시 판정한다.
    // 높은 수를 가진 세이브가 퍼센트 잠금 상태로 복원되면 자동 생산이 멈춘다.
    maybeUnlockPercent();
    if (hasSquareBreakthrough('overcharge')) percentChargeNeeded = 1;
    if (percentChargeNeeded < minimumPercentChargeNeeded()) percentChargeNeeded = minimumPercentChargeNeeded();
    percentCharge = Math.min(percentCharge, percentChargeNeeded);
    percentPower = normalizedPercentPower(percentPower);
    const savedPercentPowerCost = numberValueFromSave(d.percentPowerUpgradeCost);
    const savedPercentPowerCostIsCompounding = d.percentPowerCostCompounding === true;
    if (savedPercentPowerCostIsCompounding && isPositiveNumberValue(savedPercentPowerCost)) {
      percentPowerCostCompounding = true;
      percentPowerUpgradeCost = savedPercentPowerCost;
    } else {
      const rawPercentPowerCost = percentPowerUpgradeCostForNextLevel(percentPower);
      const adjustedPercentPowerCost = discountedCost(rawPercentPowerCost);
      percentPowerCostCompounding = compareNumberValues(adjustedPercentPowerCost, powerOfTenValue(500)) >= 0;
      percentPowerUpgradeCost = percentPowerCostCompounding
        ? nextCompoundingPercentPowerCost(adjustedPercentPowerCost)
        : rawPercentPowerCost;
    }
    for (const lane of extraPercentLanes) {
      lane.power = normalizedPercentPower(lane.power);
      const savedLanePowerCost = numberValueFromSave(d.extraPercentLanes?.find(item => item.laneNumber === lane.laneNumber)?.powerCost);
      const savedLanePowerCostIsCompounding = d.extraPercentLanes?.find(item => item.laneNumber === lane.laneNumber)?.powerCostCompounding === true;
      if (savedLanePowerCostIsCompounding && isPositiveNumberValue(savedLanePowerCost)) {
        lane.powerCostCompounding = true;
        lane.powerCost = savedLanePowerCost;
        continue;
      }

      const rawLanePowerCost = percentPowerUpgradeCostForNextLevel(
        lane.power,
        scaleByLane(40000n, lane.laneNumber)
      );
      const adjustedLanePowerCost = discountedCost(rawLanePowerCost);
      lane.powerCostCompounding = compareNumberValues(adjustedLanePowerCost, powerOfTenValue(500)) >= 0;
      lane.powerCost = lane.powerCostCompounding
        ? nextCompoundingPercentPowerCost(adjustedLanePowerCost)
        : rawLanePowerCost;
    }
    syncPermanentPercentLanes();

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
    addBtn.textContent = `+${perClick.toString()}`;
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
