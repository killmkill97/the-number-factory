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
  if (typeof refreshChapterTabs === 'function') refreshChapterTabs();
  updateAchievements();
  renderAchievements();
  mainValue.textContent = fmtPowerBase(getBaseNumber());
  if (currencyNumberValue) currencyNumberValue.textContent = fmtPowerBase(getBaseNumber());
  traceNumberEvent('render', {
    display: mainValue.textContent,
    number: numberTraceValue(getBaseNumber())
  });
  if (currencySpValue) currencySpValue.textContent = fmtPowerBase(squarePoints);
  if (currencyCpValue) currencyCpValue.textContent = fmtPowerBase(squareConvergencePoints);
  if (currencyKunuthValue) currencyKunuthValue.textContent = fmtPowerBase(kunuthPoints);
  if (kunuthPointValue) kunuthPointValue.textContent = `${fmtPowerBase(kunuthPoints)} KP`;
  if (currencyTheoryValue) currencyTheoryValue.textContent = fmtPowerBase(theory);
  subValue.textContent = `클릭당 +${fmt(effectivePerClick())}`;
  addBtn.textContent = pendingKunuthPointClaim
    ? '나는 제곱에 얽매이면 안 돼... 난 더 무한해야 돼...'
    : `+${fmt(effectivePerClick())}`;
  squarePointValue.textContent = `${fmt(squarePoints)} SP`;
  squarePointSubValue.textContent = `제곱 포인트 교환 요구량 ${fmtPowerBase(squarePointExchangeRequirement())} · 교환마다 +${fmtPowerBase(squarePointGain())} SP · ${fmt(squareConvergenceExchangeRequirement())} SP마다 수동 교환으로 CP 획득`;
  renderSquareUpgradeBoard();
  renderSquareDimensionView();
  renderDivergerView();
  renderSquareBreakthroughBoard();
  renderSquareConvergenceBoard();
  renderGeneralizationBoard();
  if (typeof renderKunuthBoard === 'function') renderKunuthBoard();
  renderManualExchangeDock();
  renderAutomatiumAccess();
  squareConvergencePointValue.textContent = `${fmt(squareConvergencePoints)} CP`;
  squareConvergenceSubValue.textContent = `${fmt(squareConvergenceExchangeRequirement())} SP당 CP 1 · 수동 교환 시 가능한 CP를 한 번에 획득 · 남은 SP 제거 · 수렴 시 제곱/제곱돌파 업그레이드 초기화`;

  const autoClickerCost = discountedCost(autoClickerPrice);
  const autoClickerSpeedCost = discountedCost(autoClickerSpeedPrice);
  const autoClickerParallelCost = discountedCost(autoClickerParallelPrice);
  const autoClickerPercentFillCost = discountedCost(autoClickerPercentFillPrice);
  const percentAutoCost = discountedCost(percentAutoPrice);
  const percentAutoSpeedCost = discountedCost(percentAutoSpeedPrice);
  const perClickCost = discountedCost(perClickUpgradeCost);
  const percentPowerUpgradeCostValue = percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
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
    : `비용: ${fmt(percentAutoCost)} · 충전 완료 즉시 자동 사용`;

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
      percentPowerCostText.textContent = `비용: ${fmtScientific(percentPowerUpgradeCostValue)} · ${percentPowerSoftcapStatus(percentPower)}`;
      percentPowerBtn.disabled = overflowed || !canAffordBaseCost(percentPowerUpgradeCostValue);
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
