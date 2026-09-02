let renderFramePending = false;
let renderInProgress = false;

function render() {
  if (renderFramePending || renderInProgress) return;
  renderFramePending = true;

  const flush = () => {
    renderFramePending = false;
    renderInProgress = true;
    try {
      renderNow();
    } finally {
      renderInProgress = false;
    }
  };

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(flush);
  } else {
    setTimeout(flush, 16);
  }
}

function renderNow() {
  mainValue.textContent = fmtPowerBase(getBaseNumber());
  if (currencyNumberValue) currencyNumberValue.textContent = fmtPowerBase(getBaseNumber());
  if (currencySpValue) currencySpValue.textContent = fmtPowerBase(squarePoints);
  if (currencyCpValue) currencyCpValue.textContent = fmtPowerBase(squareConvergencePoints);
  if (currencyLspValue) currencyLspValue.textContent = fmtPowerBase(lsp);
  if (currencyTetraPValue) currencyTetraPValue.textContent = fmtPowerBase(tetraP);
  if (currencyTheoryValue) currencyTheoryValue.textContent = fmtPowerBase(theory);
  subValue.textContent = `클릭당 +${fmt(effectivePerClick())}`;
  addBtn.textContent = `+${fmt(effectivePerClick())}`;
  squarePointValue.textContent = `${fmt(squarePoints)} SP`;
  squarePointSubValue.textContent = `제곱 포인트 교환 요구량 ${fmtPowerBase(squarePointExchangeRequirement())} · 교환마다 +${fmtPowerBase(squarePointGain())} SP · ${fmt(squareConvergenceExchangeRequirement())} SP마다 수동 교환으로 CP 획득`;
  renderSquareUpgradeBoard();
  renderSquareDimensionView();
  renderSquareBreakthroughBoard();
  renderSquareConvergenceBoard();
  renderGeneralizationBoard();
  renderManualExchangeDock();
  renderAutomatiumAccess();
  squareBreakthroughTabBtn.classList.toggle('hidden', !canOpenSquareBreakthrough());
  squareConvergenceTabBtn.classList.toggle('hidden', !canOpenSquareConvergence());
  if (activeChapter === 'square-breakthrough' && !canOpenSquareBreakthrough()) {
    setChapter(squareUnlocked ? 'square' : 'multiplication');
  }
  if (activeChapter === 'square-convergence' && !canOpenSquareConvergence()) {
    setChapter(squareUnlocked ? 'square' : 'multiplication');
  }
  squareConvergencePointValue.textContent = `${fmt(squareConvergencePoints)} CP`;
  squareConvergenceSubValue.textContent = `${fmt(squareConvergenceExchangeRequirement())} SP당 CP 1 · 수동 교환 시 가능한 CP를 한 번에 획득 · 남은 SP 제거 · 수렴 시 제곱/제곱돌파 업그레이드 초기화`;
  lspValue.textContent = `${fmtPowerBase(lsp)} LSP`;
  lspSubValue.textContent = `${fmtPowerBase(LSP_PER_SP)} LSP마다 1 SP로 변환 · 현재 변환 가능 ${fmt(convertibleLspToSpAmount())} SP`;
  tetraPointValue.textContent = `${fmtPowerBase(tetraP)} tetraP · ${fmtPowerBase(LONG_MAX)} SP마다 +1`;
  convertLspCost.textContent = `필요: ${fmtPowerBase(LSP_PER_SP)} LSP`;
  convertLspBtn.disabled = !isTetrationAvailable() || !isPositiveNumberValue(convertibleLspToSpAmount());
  autoLspConverterBtn.classList.toggle('toggle-active', autoLspConverterUnlocked && autoLspConverterEnabled);
  autoLspConverterBtn.classList.toggle('toggle-inactive', autoLspConverterUnlocked && !autoLspConverterEnabled);
  if (!isTetrationAvailable()) {
    autoLspConverterLabel.textContent = '자동 LSP 변환기';
    autoLspConverterCost.textContent = '테트레이션 필요';
    autoLspConverterBtn.disabled = true;
  } else if (autoLspConverterUnlocked) {
    autoLspConverterLabel.textContent = `자동 LSP 변환기 ${autoLspConverterEnabled ? 'ON' : 'OFF'}`;
    autoLspConverterCost.textContent = '구매 완료 · 클릭해서 작동 토글';
    autoLspConverterBtn.disabled = false;
  } else {
    autoLspConverterLabel.textContent = '자동 LSP 변환기';
    autoLspConverterCost.textContent = `비용: ${fmt(AUTO_LSP_CONVERTER_COST)} SP`;
    autoLspConverterBtn.disabled = compareNumberValues(squarePoints, AUTO_LSP_CONVERTER_COST) < 0;
  }
  renderTetrationUpgradeBoard();
  renderTetrationDimensions();

  if (!isTetrationAvailable()) {
    unlockTetrationBtn.firstChild.textContent = '테트레이션 임시 잠김';
    unlockTetrationCost.textContent = '제곱돌파 개편 중';
    unlockTetrationBtn.disabled = true;
  } else if (!tetrationDimensionsUnlocked) {
    unlockTetrationBtn.firstChild.textContent = '테트레이션 차원 임시 잠김';
    unlockTetrationCost.textContent = '제곱돌파 개편 중';
    unlockTetrationBtn.disabled = true;
  } else {
    unlockTetrationBtn.firstChild.textContent = '테트레이션 차원';
    unlockTetrationBtn.disabled = true;
    unlockTetrationCost.textContent = '해금 완료';
  }

  const autoClickerCost = discountedCost(autoClickerPrice);
  const autoClickerSpeedCost = discountedCost(autoClickerSpeedPrice);
  const autoClickerParallelCost = discountedCost(autoClickerParallelPrice);
  const autoClickerPercentFillCost = discountedCost(autoClickerPercentFillPrice);
  const percentAutoCost = discountedCost(percentAutoPrice);
  const percentAutoSpeedCost = discountedCost(percentAutoSpeedPrice);
  const perClickCost = discountedCost(perClickUpgradeCost);
  const percentPowerCost = discountedCost(percentPowerUpgradeCost);
  const percentChargeCost = discountedCost(percentChargeUpgradeCost);
  const percentParallelUnlockCost = discountedCost(nextPercentLaneUnlockCost);
  const currentPercentLaneLimit = percentLaneLimit();

  autoClickerCostText.textContent =
    `비용: ${fmt(autoClickerCost)}`;
  autoClickerBtn.parentElement.classList.toggle('hidden', autoClickerUnlocked);

  autoClickerSpeedCostText.textContent =
    autoClickerSpeed <= autoClickerMinSpeed()
      ? `최대 속도 (${formatDelay(autoClickerMinSpeed())})`
      : `비용: ${fmt(autoClickerSpeedCost)} · 현재 ${(autoClickerSpeed / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초`;

  autoClickerSpeedBtn.disabled =
    overflowed || !autoClickerUnlocked || autoClickerSpeed <= autoClickerMinSpeed() || !canAffordBaseCost(autoClickerSpeedCost);

  autoClickerParallelCostText.textContent =
    autoClickerParallel >= autoClickerParallelCap()
      ? `최대 병렬화 (${fmt(autoClickerParallelCap())}배)`
      : `비용: ${fmt(autoClickerParallelCost)} · 한 주기당 ${fmt(autoClickerParallel)}회 클릭`;

  autoClickerParallelBtn.disabled =
    overflowed || !autoClickerUnlocked || autoClickerParallel >= autoClickerParallelCap() ||
    !canAffordBaseCost(autoClickerParallelCost);

  autoClickerBtn.disabled =
    overflowed || autoClickerUnlocked || !canAffordBaseCost(autoClickerCost);

  autoClickerPercentFillCostText.textContent = autoClickerPercentFillUnlocked
    ? '구매 완료 · 자동 클릭도 % 충전 +1'
    : `비용: ${fmt(autoClickerPercentFillCost)}`;

  autoClickerPercentFillBtn.disabled =
    overflowed || !autoClickerUnlocked || !percentUnlocked ||
    autoClickerPercentFillUnlocked || !canAffordBaseCost(autoClickerPercentFillCost);

  percentAutoCostText.textContent = percentAutoUnlocked
    ? `구매 완료 · 대기 ${formatDelay(percentAutoSpeed)}`
    : `비용: ${fmt(percentAutoCost)} · 사용 가능해진 뒤 1초 후 자동 사용`;

  percentAutoBtn.disabled =
    overflowed || !percentUnlocked || percentAutoUnlocked || !canAffordBaseCost(percentAutoCost);

  percentAutoSpeedCostText.textContent =
    percentAutoSpeed <= percentAutoMinSpeed()
      ? `최대 속도 (${formatDelay(percentAutoMinSpeed())})`
      : `비용: ${fmt(percentAutoSpeedCost)} · 현재 ${formatDelay(percentAutoSpeed)}`;

  percentAutoSpeedBtn.disabled =
    overflowed || !percentAutoUnlocked ||
    percentAutoSpeed <= percentAutoMinSpeed() ||
    !canAffordBaseCost(percentAutoSpeedCost);

  upgradeClickCost.textContent =
    perClick >= BASE_PER_CLICK_CAP
      ? `최대 강화 (${fmt(BASE_PER_CLICK_CAP)})`
      : `비용: ${fmt(perClickCost)}`;

  upgradeClickBtn.disabled = overflowed || perClick >= BASE_PER_CLICK_CAP || !canAffordBaseCost(perClickCost);

  if (percentUnlocked) {
    percentSection.classList.remove('hidden');
    percentTitle.textContent = '퍼센트 시스템';
    document.getElementById('chargeFill').parentElement.classList.remove('hidden');
    upgradeChargeBtn.classList.remove('hidden');

    const pct = Math.min(100, (percentCharge / percentChargeNeeded) * 100);
    chargeFill.style.width = pct + '%';
    percentBtn.textContent = `% 사용 (${percentCharge} / ${percentChargeNeeded}) · 파워 ${percentPowerText()} · ${percentPowerSoftcapStatus(percentPower)}`;
    percentBtn.disabled = percentCharge < percentChargeNeeded;

    if (percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE) {
      percentPowerRow.classList.remove('hidden');
      percentPowerLabel.textContent = `퍼센트 파워 업그레이드 (현재 ${percentPowerText()})`;
      percentPowerCostText.textContent = `비용: ${fmtScientific(percentPowerCost)} · ${percentPowerSoftcapStatus(percentPower)}`;
      percentPowerBtn.disabled = overflowed || !canAffordBaseCost(percentPowerCost);
    } else {
      percentPowerRow.classList.add('hidden');
    }

    if (percentChargeNeeded <= minimumPercentChargeNeeded()) {
      upgradeChargeCost.textContent = `최대 · 필요 클릭 ${minimumPercentChargeNeeded()}회`;
      upgradeChargeLabel.textContent = '퍼센트 충전 요구량 감소 (MAX)';
      upgradeChargeBtn.disabled = true;
    } else {
      upgradeChargeLabel.textContent = `퍼센트 충전 요구량 -${percentChargeReduction()}`;
      upgradeChargeCost.textContent = `비용: ${fmt(percentChargeCost)} · 현재 ${percentChargeNeeded}회`;
      upgradeChargeBtn.disabled = !canAffordBaseCost(percentChargeCost);
    }

    if (percentLaneCount < currentPercentLaneLimit) {
      percentParallelUnlockBtn.classList.remove('hidden');
      percentParallelUnlockCostText.textContent = `비용: ${fmt(percentParallelUnlockCost)} · 다음 ${percentLaneCount + 1}레인`;
      percentParallelUnlockBtn.disabled = !canAffordBaseCost(percentParallelUnlockCost) || overflowed;
    } else {
      percentParallelUnlockCostText.textContent = currentPercentLaneLimit >= MAX_PERCENT_LANES
        ? `최대 병렬화 (${MAX_PERCENT_LANES}레인)`
        : `퍼센트 확장 필요 (${currentPercentLaneLimit} / ${MAX_PERCENT_LANES}레인)`;
      percentParallelUnlockBtn.disabled = true;
    }

    renderExtraPercentLanes();
  }
  if (!percentUnlocked) {
    percentSection.classList.add('hidden');
  }
}
