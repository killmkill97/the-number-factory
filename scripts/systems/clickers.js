function performManualNumberClick() {
  if (pendingKnuthPointClaim) return claimKnuthPoint();
  if (overflowed) return false;
  addToBaseNumber(
    perClick,
    'manual-click',
    percentPower,
    percentPowerPurchaseBonus,
    effectivePerClickMultiplier()
  );
  if (percentUnlocked) {
    chargeAllPercentLanes(1);
  }
  maybeUnlockPercent();
  checkOverflow();
  render();
  return true;
}

addBtn.addEventListener('click', performManualNumberClick);

function buyAutoClicker() {
  const cost = discountedCost(autoClickerPrice);
  if (!canAffordBaseCost(cost) || autoClickerUnlocked) return false;

  spendBaseCost(cost);
  autoClickerUnlocked = true;
  render();
  return true;
}

autoClickerBtn.addEventListener('click', buyAutoClicker);

function safeChargeAmount(totalClicks) {
  const numericClicks = realNumberFromValue(totalClicks);
  return Number.isFinite(numericClicks)
    ? Math.max(0, Math.floor(numericClicks))
    : Number.MAX_VALUE;
}

function applyAutoClickerGain(cycles) {
  const totalClicks = multiplyNumberValue(autoClickerParallel, cycles);
  traceNumberEvent('auto-clicker-fire', {
      cycles: serializeNumberValue(cycles),
      clicks: serializeNumberValue(totalClicks),
    percentFill: autoClickerPercentFillUnlocked,
    number: numberTraceValue(getBaseNumber())
  });
  addToBaseNumber(
    multiplyNumberValue(perClick, totalClicks),
    'auto-click',
    percentPower,
    percentPowerPurchaseBonus,
    effectivePerClickMultiplier()
  );

  // 숫자 증가로 퍼센트 해금 조건을 넘긴 첫 자동 클릭도 바로 충전에 반영한다.
  maybeUnlockPercent();
  if (autoClickerPercentFillUnlocked && percentUnlocked) {
    chargeAllPercentLanes(safeChargeAmount(totalClicks));
  }
}

let lastAutoClickerTraceHeartbeatAt = -Infinity;
let autoClickerLastTickAt = gameTimelineNowMs();

setGameInterval(() => {
  const { now, elapsedMs: elapsedRealMs } = elapsedRealTimeSince(autoClickerLastTickAt);
  autoClickerLastTickAt = now;
  if (!autoClickerUnlocked || overflowed) {
    if (numberTraceEnabled && now - lastAutoClickerTraceHeartbeatAt >= 50) {
      lastAutoClickerTraceHeartbeatAt = now;
      traceNumberEvent('auto-clicker-tick', {
        state: autoClickerUnlocked ? 'overflowed' : 'locked',
        percentFill: autoClickerPercentFillUnlocked,
        timer: `${autoClickerTimer}/${autoClickerSpeed}`
      });
    }
    autoClickerTimer = 0;
    return;
  }

  const elapsed = gameTick(elapsedRealMs);
  autoClickerTimer += elapsed;

  if (numberTraceEnabled && now - lastAutoClickerTraceHeartbeatAt >= 50) {
    lastAutoClickerTraceHeartbeatAt = now;
    traceNumberEvent('auto-clicker-tick', {
      state: 'running',
      percentFill: autoClickerPercentFillUnlocked,
      elapsed,
      timer: `${autoClickerTimer}/${autoClickerSpeed}`
    });
  }

  if (autoClickerTimer >= autoClickerSpeed) {
    const cycles = Math.floor(autoClickerTimer / autoClickerSpeed);
    applyAutoClickerGain(cycles);

    autoClickerTimer %= autoClickerSpeed;
    traceNumberEvent('auto-clicker-complete', {
      timer: `${autoClickerTimer}/${autoClickerSpeed}`,
      percentFill: autoClickerPercentFillUnlocked
    });
    maybeUnlockPercent();
    checkOverflow();
    render();
  }
}, AUTO_CLICKER_TICK_MS);

function buyAutoClickerPercentFill() {
  if (!autoClickerUnlocked || !percentUnlocked) return false;
  if (autoClickerPercentFillUnlocked) return false;
  const cost = discountedCost(autoClickerPercentFillPrice);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  autoClickerPercentFillUnlocked = true;
  log('오토 클릭커 퍼센트 채우기를 구매했습니다. 이제 자동 클릭도 % 충전을 1회씩 채웁니다.');
  render();
  return true;
}

autoClickerPercentFillBtn.addEventListener('click', buyAutoClickerPercentFill);

function upgradeAutoClickerSpeed() {
  if (!autoClickerUnlocked) return false;
  if (autoClickerSpeed <= autoClickerMinSpeed()) return false;
  const cost = discountedCost(autoClickerSpeedPrice);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  if (autoClickerSpeed > 200) autoClickerSpeed = Math.max(200, autoClickerSpeed - 200);
  else if (autoClickerSpeed === 200) autoClickerSpeed = 100;
  else if (autoClickerSpeed === 100) autoClickerSpeed = 50;
  else if (autoClickerSpeed === 50) autoClickerSpeed = 25;
  else if (autoClickerSpeed === 25) autoClickerSpeed = autoClickerMinSpeed();
  if (autoClickerSpeed < autoClickerMinSpeed()) autoClickerSpeed = autoClickerMinSpeed();

  autoClickerSpeedPrice = multiplyNumberValue(autoClickerSpeedPrice, 2);
  autoClickerTimer = 0;
  render();
  return true;
}

autoClickerSpeedBtn.addEventListener('click', upgradeAutoClickerSpeed);

function upgradeAutoClickerParallel() {
  if (!autoClickerUnlocked) return false;
  if (autoClickerParallel >= autoClickerParallelCap()) return false;
  const cost = discountedCost(autoClickerParallelPrice);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  autoClickerParallel = multiplyNumberValue(autoClickerParallel, 2);
  if (autoClickerParallel > autoClickerParallelCap()) {
    autoClickerParallel = autoClickerParallelCap();
  }
  autoClickerParallelPrice = multiplyNumberValue(autoClickerParallelPrice, 2);

  log(`오토 클릭커가 병렬화되었습니다. 이제 한 주기마다 ${fmt(autoClickerParallel)}회 클릭합니다.`);
  render();
  return true;
}

autoClickerParallelBtn.addEventListener('click', upgradeAutoClickerParallel);

function upgradePerClick() {
  if (perClick >= BASE_PER_CLICK_CAP) return false;
  const cost = discountedCost(perClickUpgradeCost);
  if (!canAffordBaseCost(cost)) return false;
  spendBaseCost(cost);
  perClick = addBaseNumbers(perClick, 1);
  if (perClick > BASE_PER_CLICK_CAP) perClick = BASE_PER_CLICK_CAP;
  perClickUpgradeCost = multiplyNumberValue(perClickUpgradeCost, 3);
  render();
  return true;
}

upgradeClickBtn.addEventListener('click', upgradePerClick);
