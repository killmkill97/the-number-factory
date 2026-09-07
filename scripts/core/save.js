function saveGame() {
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
    tetrationUnlocked,
    tetrationDimensionsUnlocked,
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
    divergerATheoryCost: serializeNumberValue(divergerATheoryCost),
    divergerACpCost: serializeNumberValue(divergerACpCost),
    divergerBTheoryCost: serializeNumberValue(divergerBTheoryCost),
    divergerBCpCost: serializeNumberValue(divergerBCpCost),
    divergerCTheoryCost: serializeNumberValue(divergerCTheoryCost),
    divergerCCpCost: serializeNumberValue(divergerCCpCost),
    divergerALevel,
    divergerBLevel,
    divergerCLevel,
    divergerSpeedLevel,
    divergerSpeedTheoryCost: serializeNumberValue(divergerSpeedTheoryCost),
    divergerSpeedCpCost: serializeNumberValue(divergerSpeedCpCost),
    divergerUpgradeHistory,
    theory: serializeNumberValue(theory),
    theorySquarePointCost: serializeNumberValue(theorySquarePointCost),
    theoryConvergencePointCost: serializeNumberValue(theoryConvergencePointCost),
    generalizationResetCost: serializeNumberValue(generalizationResetCost),
    theoryCostResourceIndex,
    generalizationResearchState,
    squareUpgradeState,
    squareBreakthroughLevels,
    squareConvergenceUpgradeState,
    squareConvergenceUpgradeLevels,
    autoUpgradeEnabled,
    squareDimensionAutoUpgradeEnabled,
    tetrationUpgradeState,

    lsp: serializeNumberValue(lsp),
    tetraP: serializeNumberValue(tetraP),
    autoLspConverterUnlocked,
    autoLspConverterEnabled,
    tetrationDimensions: tetrationDimensions.map(serializeNumberValue),
    tetrationDimensionPurchases: tetrationDimensionPurchases.map(serializeNumberValue),
    tetrationDimensionCosts: tetrationDimensionCosts.map(serializeNumberValue)
  };

  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  log('게임을 이 브라우저에 저장했습니다.', true);
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    log('저장 데이터가 없습니다.', true);
    return;
  }

  try {
    const d = JSON.parse(raw);
    const saveVersion = Number(d.version ?? 1);
    const isLegacySave = !Number.isFinite(saveVersion) || saveVersion < 5;

    theory = numberValueFromSave(d.theory);
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
    loadGeneralizationResearchState(d.generalizationResearchState);
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
    divergerATheoryCost = numberValueFromSave(d.divergerATheoryCost, 4n);
    divergerACpCost = numberValueFromSave(d.divergerACpCost, 20n);
    divergerBTheoryCost = numberValueFromSave(d.divergerBTheoryCost, 8n);
    divergerBCpCost = numberValueFromSave(d.divergerBCpCost, 32n);
    divergerCTheoryCost = numberValueFromSave(d.divergerCTheoryCost, 12n);
    divergerCCpCost = numberValueFromSave(d.divergerCCpCost, 48n);
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
    divergerSpeedTheoryCost = numberValueFromSave(
      d.divergerSpeedTheoryCost,
      divergerSpeedTheoryCostAtLevel(divergerSpeedLevel)
    );
    divergerSpeedCpCost = numberValueFromSave(
      d.divergerSpeedCpCost,
      divergerSpeedCpCostAtLevel(divergerSpeedLevel)
    );
    loadDivergerUpgradeHistory(d.divergerUpgradeHistory, {
      a: divergerALevel,
      b: divergerBLevel,
      c: divergerCLevel,
      speed: divergerSpeedLevel
    });
    divergerTimer = 0;
    divergerGraphSamples.length = 0;
    divergerGraphScaleMinimum = null;
    divergerGraphScaleMaximum = null;
    squareDimensionAutoUpgradeEnabled = hasGeneralizationResearch('7-3')
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
      tetrationUnlocked = false;
      tetrationDimensionsUnlocked = false;
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
      squarePoints = numberValueFromSave(d.squarePoints, squareUnlocked ? 1n : 0n);
      squareConvergenceUnlocked = false;
      squareConvergencePoints = 0n;
      tetraP = 0n;
      resetSquareUpgradeState();
      resetSquareBreakthroughState();
      resetSquareConvergenceUpgradeState();
      resetTetrationUpgradeState();
      resetTetrationProductionState();
    } else {
      squareUnlocked = d.squareUnlocked ?? false;
      tetrationUnlocked = d.tetrationUnlocked ?? false;
      tetrationDimensionsUnlocked = d.tetrationDimensionsUnlocked ?? tetrationUnlocked;
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
      resetTetrationUpgradeState();
      for (const upgrade of TETRATION_UPGRADES) {
        tetrationUpgradeState[upgrade.id] = d.tetrationUpgradeState?.[upgrade.id] === true;
      }
      lsp = numberValueFromSave(d.lsp);
      tetraP = numberValueFromSave(d.tetraP);
      autoLspConverterUnlocked = d.autoLspConverterUnlocked ?? false;
      autoLspConverterEnabled = d.autoLspConverterEnabled ?? false;
      for (let index = 0; index < TETRATION_DIMENSION_COUNT; index++) {
        tetrationDimensions[index] = numberValueFromSave(d.tetrationDimensions?.[index]);
        tetrationDimensionPurchases[index] = numberValueFromSave(d.tetrationDimensionPurchases?.[index]);
        tetrationDimensionCosts[index] = numberValueFromSave(
          d.tetrationDimensionCosts?.[index],
          initialTetrationDimensionCost(index)
        );
      }
      if (saveVersion < 17 && tetrationUnlocked && isZeroNumberValue(tetraP)) {
        tetrationDimensionsUnlocked = true;
      }
      if (saveVersion < 15 && tetrationUnlocked && isPositiveNumberValue(tetraP)) {
        tetrationDimensionsUnlocked = false;
        resetTetrationProductionState();
      }
    }
    if (activeChapter === 'tetration' && !isTetrationAvailable()) {
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
    }
    if (activeChapter === 'square-convergence' && !canOpenSquareConvergence()) {
      activeChapter = squareUnlocked ? 'square' : 'multiplication';
    }
    if (tetrationUnlocked) {
      squareUnlocked = true;
    }
    if (!tetrationUnlocked || !autoLspConverterUnlocked) {
      autoLspConverterEnabled = false;
    }
    if (!tetrationUnlocked) {
      tetrationDimensionsUnlocked = false;
    }
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
    resetTetrationDimensionUi();

    if (!squareUnlocked) {
      setChapter('multiplication');
    } else {
      setChapter(activeChapter);
    }
    addBtn.textContent = `+${perClick.toString()}`;
    upgradeClickBtn.classList.remove('hidden');

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
}

function requestLoadGame() {
  if (!window.confirm('불러오시겠습니까?')) return;
  loadGame();
}

saveBtn.addEventListener('click', requestSaveGame);
loadBtn.addEventListener('click', requestLoadGame);
