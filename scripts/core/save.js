function saveGame() {
  const data = {
    version: SAVE_VERSION,
    num: num.toString(),
    perClick: perClick.toString(),
    perClickUpgradeCost: perClickUpgradeCost.toString(),

    percentUnlocked,
    percentCharge,
    percentChargeNeeded,
    percentChargeLevel,
    percentChargeUpgradeCost: percentChargeUpgradeCost.toString(),
    percentPower,
    percentPowerUpgradeCost: percentPowerUpgradeCost.toString(),

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
      powerCost: lane.powerCost.toString(),
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
    squarePoints: squarePoints.toString(),
    squareConvergenceUnlocked,
    squareConvergencePoints: squareConvergencePoints.toString(),
    autoSpConverterEnabled,
    autoSpConverterTargetSp: autoSpConverterTargetSp.toString(),
    squareUpgradeState,
    squareBreakthroughLevels,
    squareConvergenceUpgradeState,
    autoUpgradeEnabled,
    tetrationUpgradeState,

    lsp: lsp.toString(),
    tetraP: tetraP.toString(),
    autoLspConverterUnlocked,
    autoLspConverterEnabled,
    tetrationDimensions: tetrationDimensions.map(value => value.toString()),
    tetrationDimensionPurchases: tetrationDimensionPurchases.map(value => value.toString()),
    tetrationDimensionCosts: tetrationDimensionCosts.map(value => value.toString())
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

    num = BigInt(d.num ?? '0');
    perClick = BigInt(d.perClick ?? '1');
    perClickUpgradeCost = BigInt(d.perClickUpgradeCost ?? '10');

    percentUnlocked = d.percentUnlocked ?? false;
    percentCharge = d.percentCharge ?? 0;
    percentChargeNeeded = d.percentChargeNeeded ?? 100;
    percentChargeLevel = d.percentChargeLevel ?? 0;
    percentChargeUpgradeCost = BigInt(d.percentChargeUpgradeCost ?? '250');
    percentPower = d.percentPower ?? 1;
    percentPowerUpgradeCost = BigInt(d.percentPowerUpgradeCost ?? '40000');

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
      lane.powerCost = BigInt(saved.powerCost ?? lane.powerCost.toString());
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
      squarePoints = BigInt(d.squarePoints ?? (squareUnlocked ? '1' : '0'));
      squareConvergenceUnlocked = false;
      squareConvergencePoints = 0n;
      autoSpConverterEnabled = true;
      autoSpConverterTargetSp = 1n;
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
      squarePoints = BigInt(d.squarePoints ?? '0');
      squareConvergenceUnlocked = d.squareConvergenceUnlocked ?? false;
      squareConvergencePoints = BigInt(d.squareConvergencePoints ?? '0');
      autoSpConverterEnabled = d.autoSpConverterEnabled ?? true;
      autoSpConverterTargetSp = BigInt(d.autoSpConverterTargetSp ?? '1');
      if (autoSpConverterTargetSp <= 0n) autoSpConverterTargetSp = 1n;
      resetSquareUpgradeState();
      for (const upgrade of SQUARE_UPGRADES) {
        squareUpgradeState[upgrade.id] = d.squareUpgradeState?.[upgrade.id] === true;
      }
      loadSquareConvergenceUpgradeState(d.squareConvergenceUpgradeState);
      if (
        squareConvergencePoints > 0n ||
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
      if (!squareBreakthroughEntered) autoSpConverterTargetSp = 1n;
      autoUpgradeEnabled = hasSquareUpgrade('auto_upgrade_top_down')
        ? d.autoUpgradeEnabled ?? false
        : false;
      resetTetrationUpgradeState();
      for (const upgrade of TETRATION_UPGRADES) {
        tetrationUpgradeState[upgrade.id] = d.tetrationUpgradeState?.[upgrade.id] === true;
      }
      lsp = BigInt(d.lsp ?? '0');
      tetraP = BigInt(d.tetraP ?? '0');
      autoLspConverterUnlocked = d.autoLspConverterUnlocked ?? false;
      autoLspConverterEnabled = d.autoLspConverterEnabled ?? false;
      for (let index = 0; index < TETRATION_DIMENSION_COUNT; index++) {
        tetrationDimensions[index] = BigInt(d.tetrationDimensions?.[index] ?? '0');
        tetrationDimensionPurchases[index] = BigInt(d.tetrationDimensionPurchases?.[index] ?? '0');
        tetrationDimensionCosts[index] = BigInt(d.tetrationDimensionCosts?.[index] ?? initialTetrationDimensionCost(index).toString());
      }
      if (saveVersion < 17 && tetrationUnlocked && tetraP === 0n) {
        tetrationDimensionsUnlocked = true;
      }
      if (saveVersion < 15 && tetrationUnlocked && tetraP > 0n) {
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
    const loadedConvergencePoints = collectSquareConvergenceIfReady();
    if (loadedConvergencePoints > 0n) {
      resetRunStateAfterSquarePrestige();
      activeChapter = 'square-convergence';
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
      if (num < 2000000n) num = 2000000n;
      maybeUnlockPercent();
    }
    if (hasSquareBreakthrough('overcharge')) percentChargeNeeded = 1;
    if (percentChargeNeeded < minimumPercentChargeNeeded()) percentChargeNeeded = minimumPercentChargeNeeded();
    percentCharge = Math.min(percentCharge, percentChargeNeeded);
    if (percentPower > percentPowerMax()) percentPower = percentPowerMax();
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
