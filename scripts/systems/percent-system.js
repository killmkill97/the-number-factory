function unlockNextPercentLane() {
  if (!percentUnlocked) return false;
  if (percentLaneCount >= percentLaneLimit()) return false;
  const cost = discountedCost(nextPercentLaneUnlockCost);
  if (num < cost) return false;

  num -= cost;
  percentLaneCount++;
  // 새 레인은 독립된 업그레이드 상태를 가진 새 객체로 생성
  const newLane = makePercentLane(percentLaneCount);
  extraPercentLanes.push(newLane);
  createExtraPercentLaneUI(newLane);
  nextPercentLaneUnlockCost *= 2n;
  log(`퍼센트 레인 ${percentLaneCount}이 해금되었습니다.`);
  render();
  return true;
}

percentParallelUnlockBtn.addEventListener('click', unlockNextPercentLane);
function usePercent() {
  if (overflowed || squareMode) return false;
  if (percentCharge < percentChargeNeeded) return false;

  num += (num * BigInt(percentPower)) / 100n;
  percentCharge = 0;
  checkOverflow();

  // 사람이 먼저 눌렀든 자동으로 눌렀든 다음 자동 클릭은 처음부터 다시 기다림
  percentAutoTimer = 0;
  render();
  return true;
}

percentBtn.addEventListener('click', usePercent);

function upgradePercentPower() {
  if (!percentUnlocked) return false;
  if (percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return false;
  if (percentPower >= percentPowerMax()) return false;
  const cost = discountedCost(percentPowerUpgradeCost);
  if (num < cost) return false;

  num -= cost;
  percentPower = percentPower < 4 ? 4 : percentPowerMax();
  percentPowerUpgradeCost *= 16n;
  log(`퍼센트 파워가 ${percentPowerText()}로 증가했습니다.${percentPower >= percentPowerMax() ? ' (MAX)' : ''}`);
  render();
  return true;
}

percentPowerBtn.addEventListener('click', upgradePercentPower);

function buyPercentAuto() {
  if (!percentUnlocked) return false;
  if (percentAutoUnlocked) return false;
  const cost = discountedCost(percentAutoPrice);
  if (num < cost) return false;

  num -= cost;
  percentAutoUnlocked = true;
  percentAutoTimer = 0;
  log(`% 오토클리커를 구매했습니다. %가 사용 가능해지면 ${formatDelay(percentAutoSpeed)} 후 자동 사용합니다.`);
  render();
  return true;
}

percentAutoBtn.addEventListener('click', buyPercentAuto);

function upgradePercentAutoSpeed() {
  if (!percentUnlocked) return false;
  if (!percentAutoUnlocked) return false;
  if (percentAutoSpeed <= percentAutoMinSpeed()) return false;
  const cost = discountedCost(percentAutoSpeedPrice);
  if (num < cost) return false;

  num -= cost;
  if (percentAutoSpeed > 200) percentAutoSpeed = Math.max(200, percentAutoSpeed - 200);
  else if (percentAutoSpeed > percentAutoMinSpeed()) percentAutoSpeed = percentAutoMinSpeed();
  percentAutoSpeedPrice *= 2n;
  percentAutoTimer = 0;
  log(`% 오토클리커 대기 시간이 ${formatDelay(percentAutoSpeed)}로 감소했습니다.`);
  render();
  return true;
}

percentAutoSpeedBtn.addEventListener('click', upgradePercentAutoSpeed);

// % 버튼이 실제로 눌릴 수 있을 때만 대기 시간이 흐름
setInterval(() => {
  if (!percentAutoUnlocked || overflowed || squareMode) {
    percentAutoTimer = 0;
    return;
  }

  const percentCanClick = percentCharge >= percentChargeNeeded;

  if (!percentCanClick) {
    percentAutoTimer = 0;
    return;
  }

  percentAutoTimer += gameTick(PERCENT_AUTO_TICK_MS);

  if (percentAutoTimer >= percentAutoSpeed) {
    usePercent();
  }
}, PERCENT_AUTO_TICK_MS);

// 추가 퍼센트 레인들의 독립 오토클리커
setInterval(() => {
  if (overflowed || squareMode) {
    for (const lane of extraPercentLanes) lane.autoTimer = 0;
    return;
  }

  for (const lane of extraPercentLanes) {
    if (!lane.autoUnlocked || lane.charge < percentChargeNeeded) {
      lane.autoTimer = 0;
      continue;
    }
    lane.autoTimer += gameTick(PERCENT_AUTO_TICK_MS);
    if (lane.autoTimer >= lane.autoSpeed) {
      useExtraPercent(lane);
    }
  }
}, PERCENT_AUTO_TICK_MS);

function upgradePercentCharge() {
  if (!percentUnlocked) return false;
  if (percentChargeNeeded <= minimumPercentChargeNeeded()) return false;
  const cost = discountedCost(percentChargeUpgradeCost);
  if (num < cost) return false;

  num -= cost;
  percentChargeLevel++;
  const reduction = percentChargeReduction();
  percentChargeNeeded = Math.max(minimumPercentChargeNeeded(), percentChargeNeeded - reduction);
  percentCharge = Math.min(percentCharge, percentChargeNeeded);
  for (const lane of extraPercentLanes) {
    lane.charge = Math.min(lane.charge, percentChargeNeeded);
  }

  // 업그레이드 횟수가 많으므로 가격은 완만하게 증가
  percentChargeUpgradeCost = (percentChargeUpgradeCost * 6n + 4n) / 5n;

  log(`% 충전 필요 클릭 수가 최대 ${reduction}회 감소하여 ${percentChargeNeeded}회가 되었습니다.`);
  render();
  return true;
}

upgradeChargeBtn.addEventListener('click', upgradePercentCharge);
