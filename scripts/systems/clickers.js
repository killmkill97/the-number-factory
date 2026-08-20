function performManualNumberClick() {
  if (overflowed) return false;
  num += effectivePerClick();
  if (hasSquareUpgrade('manual_click_double_chance') && Math.random() < 0.05) {
    num *= 2n;
  }
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
  if (num < cost || autoClickerUnlocked) return false;

  num -= cost;
  autoClickerUnlocked = true;
  render();
  return true;
}

autoClickerBtn.addEventListener('click', buyAutoClicker);

function estimatedChanceHits(totalRolls, percentChance) {
  if (totalRolls <= 0n || percentChance <= 0) return 0n;
  if (totalRolls <= 2048n) {
    let hits = 0n;
    for (let roll = 0n; roll < totalRolls; roll++) {
      if (Math.random() * 100 < percentChance) hits++;
    }
    return hits;
  }

  const numerator = BigInt(percentChance);
  const guaranteedHits = (totalRolls * numerator) / 100n;
  const remainder = Number((totalRolls * numerator) % 100n);
  return guaranteedHits + (Math.random() * 100 < remainder ? 1n : 0n);
}

function safeChargeAmount(totalClicks) {
  return totalClicks > BigInt(Number.MAX_SAFE_INTEGER)
    ? Number.MAX_SAFE_INTEGER
    : Number(totalClicks);
}

function applyAutoClickerGain(cycles) {
  const totalClicks = autoClickerParallel * cycles;
  num += effectivePerClick() * totalClicks;

  const breakthroughBonusPercent = autoClickBonusPercent();
  const breakthroughBonusHits = estimatedChanceHits(totalClicks, hasSquareBreakthrough('amplification') ? 5 : 0);
  if (breakthroughBonusHits > 0n && breakthroughBonusPercent > 0) {
    num += (num * BigInt(breakthroughBonusPercent) * breakthroughBonusHits) / 100n;
  }

  const squareBonusHits = estimatedChanceHits(cycles, hasSquareUpgrade('auto_click_plus_50_chance') ? 1 : 0);
  if (squareBonusHits > 0n) {
    num += (num * 50n * squareBonusHits) / 100n;
  }

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
  if (num < cost) return false;

  num -= cost;
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
  if (num < cost) return false;

  num -= cost;
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
  if (num < cost) return false;

  num -= cost;
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
  if (num < cost) return false;
  num -= cost;
  perClick += 1n;
  if (perClick > BASE_PER_CLICK_CAP) perClick = BASE_PER_CLICK_CAP;
  perClickUpgradeCost = perClickUpgradeCost * 3n;
  render();
  return true;
}

upgradeClickBtn.addEventListener('click', upgradePerClick);
