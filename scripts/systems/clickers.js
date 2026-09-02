function performManualNumberClick() {
  if (overflowed) return false;
  addToBaseNumber(effectivePerClick());
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
  return totalClicks > BigInt(Number.MAX_SAFE_INTEGER)
    ? Number.MAX_SAFE_INTEGER
    : Number(totalClicks);
}

function applyAutoClickerGain(cycles) {
  const totalClicks = autoClickerParallel * cycles;
  addToBaseNumber(effectivePerClick() * totalClicks);

  if (autoClickerPercentFillUnlocked && percentUnlocked) {
    chargeAllPercentLanes(safeChargeAmount(totalClicks));
  }
}

setInterval(() => {
  if (!autoClickerUnlocked || overflowed) {
    autoClickerTimer = 0;
    return;
  }

  autoClickerTimer += gameTick(AUTO_CLICKER_TICK_MS);

  if (autoClickerTimer >= autoClickerSpeed) {
    const cycles = BigInt(Math.floor(autoClickerTimer / autoClickerSpeed));
    applyAutoClickerGain(cycles);

    autoClickerTimer %= autoClickerSpeed;
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

  autoClickerSpeedPrice *= 2n;
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
  autoClickerParallel = autoClickerParallel * 2n;
  if (autoClickerParallel > autoClickerParallelCap()) {
    autoClickerParallel = autoClickerParallelCap();
  }
  autoClickerParallelPrice *= 2n;

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
  perClick += 1n;
  if (perClick > BASE_PER_CLICK_CAP) perClick = BASE_PER_CLICK_CAP;
  perClickUpgradeCost = perClickUpgradeCost * 3n;
  render();
  return true;
}

upgradeClickBtn.addEventListener('click', upgradePerClick);
