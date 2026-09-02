function saveGame() {
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
    squareDimensionX: serializeNumberValue(squareDimensionX),
    squareDimensionY: serializeNumberValue(squareDimensionY),
    squareDimensionXCost: serializeNumberValue(squareDimensionXCost),
    squareDimensionYCost: serializeNumberValue(squareDimensionYCost),
    squareDimensionXGrowthLevel: serializeNumberValue(squareDimensionXGrowthLevel),
    squareDimensionYGrowthLevel: serializeNumberValue(squareDimensionYGrowthLevel),
    squareDimensionPowerInterval,
    squareDimensionPowerIntervalCost: serializeNumberValue(squareDimensionPowerIntervalCost),
    squareDimensionPowerStrengthUnlocked,
    theory: serializeNumberValue(theory),
    theoryNumberCost: serializeNumberValue(theoryNumberCost),
    theorySquarePointCost: serializeNumberValue(theorySquarePointCost),
    theoryConvergencePointCost: serializeNumberValue(theoryConvergencePointCost),
    theoryCostResourceIndex,
    generalizationResearchState,
    squareUpgradeState,
    squareBreakthroughLevels,
    squareConvergenceUpgradeState,
    autoUpgradeEnabled,
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
    theoryNumberCost = approximateNumberFromString(d.theoryNumberCost ?? '') ?? THEORY_NUMBER_BASE_COST;
    theorySquarePointCost = numberValueFromSave(d.theorySquarePointCost, THEORY_SQUARE_POINT_BASE_COST);
    theoryConvergencePointCost = numberValueFromSave(d.theoryConvergencePointCost, THEORY_CONVERGENCE_POINT_BASE_COST);
    theoryCostResourceIndex = Number(d.theoryCostResourceIndex ?? 0);
    if (!Number.isInteger(theoryCostResourceIndex) || theoryCostResourceIndex < 0 || theoryCostResourceIndex > 2) {
      theoryCostResourceIndex = 0;
    }
    loadGeneralizationResearchState(d.generalizationResearchState);

    setBaseNumberFromSave(d.num ?? '0');
    perClick = BigInt(d.perClick ?? '1');
    perClickUpgradeCost = BigInt(d.perClickUpgradeCost ?? '10');

    percentUnlocked = d.percentUnlocked ?? false;
    percentCharge = d.percentCharge ?? 0;
    percentChargeNeeded = d.percentChargeNeeded ?? 100;
    percentChargeLevel = d.percentChargeLevel ?? 0;
    percentChargeUpgradeCost = BigInt(d.percentChargeUpgradeCost ?? '250');
    percentPower = d.percentPower ?? 1;
    percentPowerUpgradeCost = 40000n;

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
    squareDimensionX = numberValueFromSave(d.squareDimensionX, 500n);
    squareDimensionY = numberValueFromSave(d.squareDimensionY, 600n);
    squareDimensionXCost = numberValueFromSave(d.squareDimensionXCost, 1n);
    squareDimensionYCost = numberValueFromSave(d.squareDimensionYCost, 1n);
    squareDimensionXGrowthLevel = numberValueFromSave(d.squareDimensionXGrowthLevel, 1n);
    squareDimensionYGrowthLevel = numberValueFromSave(d.squareDimensionYGrowthLevel, 1n);
    squareDimensionXGrowthCarry = 0;
    squareDimensionYGrowthCarry = 0;
    const savedSquareDimensionInterval = Number(
      d.squareDimensionPowerInterval ?? SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL
    );
    squareDimensionPowerInterval = Number.isFinite(savedSquareDimensionInterval)
      ? Math.min(
        SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL,
        Math.max(SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL, Math.floor(savedSquareDimensionInterval))
      )
      : SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL;
    squareDimensionPowerIntervalCost = numberValueFromSave(
      d.squareDimensionPowerIntervalCost,
      SQUARE_DIMENSION_POWER_TIME_BASE_COST
    );
    squareDimensionPowerStrengthUnlocked = d.squareDimensionPowerStrengthUnlocked === true;
      resetSquareUpgradeState();
      for (const upgrade of SQUARE_UPGRADES) {
        squareUpgradeState[upgrade.id] = d.squareUpgradeState?.[upgrade.id] === true;
      }
      loadSquareConvergenceUpgradeState(d.squareConvergenceUpgradeState);
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
      maybeUnlockPercent();
    }
    if (hasSquareBreakthrough('overcharge')) percentChargeNeeded = 1;
    if (percentChargeNeeded < minimumPercentChargeNeeded()) percentChargeNeeded = minimumPercentChargeNeeded();
    percentCharge = Math.min(percentCharge, percentChargeNeeded);
    percentPower = normalizedPercentPower(percentPower);
    percentPowerUpgradeCost = percentPowerUpgradeCostForNextLevel(percentPower);
    for (const lane of extraPercentLanes) {
      lane.power = normalizedPercentPower(lane.power);
      lane.powerCost = percentPowerUpgradeCostForNextLevel(
        lane.power,
        scaleByLane(40000n, lane.laneNumber)
      );
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
