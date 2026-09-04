function unlockNextPercentLane() {
  if (!percentUnlocked) return false;
  if (percentLaneCount >= percentLaneLimit()) return false;
  const cost = discountedCost(nextPercentLaneUnlockCost);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
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
  if (overflowed || squareMode) {
    traceNumberEvent('percent-use-skip', { lane: 1, reason: overflowed ? 'overflowed' : 'square-mode' });
    return false;
  }
  if (percentCharge < percentChargeNeeded) {
    traceNumberEvent('percent-use-skip', {
      lane: 1,
      reason: 'not-ready',
      charge: `${percentCharge}/${percentChargeNeeded}`
    });
    return false;
  }

  const before = getBaseNumber();
  traceNumberEvent('percent-use-enter', {
    lane: 1,
    charge: `${percentCharge}/${percentChargeNeeded}`,
    autoTimer: `${percentAutoTimer}/${percentAutoSpeed}`,
    number: numberTraceValue(before)
  });

  const gain = percentGain(before, percentPower);
  traceNumberEvent('percent-gain', {
    lane: 1,
    power: percentPower,
    before: numberTraceValue(before),
    gain: numberTraceValue(gain)
  });
  if (!isPositiveNumberValue(gain)) return false;

  addToBaseNumber(gain, 'percent-lane-1');
  percentCharge = 0;
  checkOverflow();

  // 사람이 먼저 눌렀든 자동으로 눌렀든 다음 자동 클릭은 처음부터 다시 기다림
  percentAutoTimer = 0;
  traceNumberEvent('percent-use-complete', {
    lane: 1,
    charge: `${percentCharge}/${percentChargeNeeded}`,
    number: numberTraceValue(getBaseNumber())
  });
  render();
  return true;
}

percentBtn.addEventListener('click', usePercent);

function upgradePercentPower() {
  if (!percentUnlocked) return false;
  if (percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return false;
  const cost = percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  updatePercentPowerCostAfterPurchase();
  log(`퍼센트 파워가 ${percentPowerText()}로 증가했습니다. ${percentPowerSoftcapStatus(percentPower)}`);
  render();
  return true;
}

percentPowerBtn.addEventListener('click', upgradePercentPower);

function buyPercentAuto() {
  if (!percentUnlocked) return false;
  if (percentAutoUnlocked) return false;
  const cost = discountedCost(percentAutoPrice);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  percentAutoUnlocked = true;
  percentAutoTimer = 0;
  log(`% 오토클리커를 구매했습니다. 충전이 완료된 %는 즉시 자동 사용합니다.`);
  render();
  return true;
}

percentAutoBtn.addEventListener('click', buyPercentAuto);

function upgradePercentAutoSpeed() {
  if (!percentUnlocked) return false;
  if (!percentAutoUnlocked) return false;
  if (percentAutoSpeed <= percentAutoMinSpeed()) return false;
  const cost = discountedCost(percentAutoSpeedPrice);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  if (percentAutoSpeed > 200) percentAutoSpeed = Math.max(200, percentAutoSpeed - 200);
  else if (percentAutoSpeed > percentAutoMinSpeed()) percentAutoSpeed = percentAutoMinSpeed();
  percentAutoSpeedPrice *= 2n;
  percentAutoTimer = 0;
  log(`% 오토클리커 대기 시간이 ${formatDelay(percentAutoSpeed)}로 감소했습니다.`);
  render();
  return true;
}

percentAutoSpeedBtn.addEventListener('click', upgradePercentAutoSpeed);

let lastPercentTraceHeartbeatAt = -Infinity;

// 충전 중에도 각 레인의 쿨다운을 진행한다. 준비된 레인은 독립적으로 사용하므로
// 퍼센트 병렬화의 원래 성장성은 유지하되, percentGain의 1회 +100% 제한을 따른다.
setInterval(() => {
  if (overflowed || squareMode) {
    percentAutoTimer = 0;
    for (const lane of extraPercentLanes) lane.autoTimer = 0;
    return;
  }

  const elapsed = gameTick(PERCENT_AUTO_TICK_MS);
  if (percentAutoUnlocked) {
    percentAutoTimer = Math.min(percentAutoSpeed, percentAutoTimer + elapsed);
  } else {
    percentAutoTimer = 0;
  }

  for (const lane of extraPercentLanes) {
    if (!lane.autoUnlocked) {
      lane.autoTimer = 0;
      continue;
    }

    lane.autoTimer = Math.min(
      lane.autoSpeed,
      lane.autoTimer + elapsed
    );
  }

  const now = typeof performance === 'undefined' ? 0 : performance.now();
  if (numberTraceEnabled && now - lastPercentTraceHeartbeatAt >= 50) {
    lastPercentTraceHeartbeatAt = now;
    traceNumberEvent('percent-auto-tick', {
      elapsed,
      main: `${percentCharge}/${percentChargeNeeded}`,
      mainTimer: `${percentAutoTimer}/${percentAutoSpeed}`,
      lanes: extraPercentLanes.map(lane => `${lane.laneNumber}:${lane.charge}/${percentChargeNeeded}@${lane.autoTimer}/${lane.autoSpeed}`).join(' ')
    });
  }

  if (
    percentAutoUnlocked &&
    percentCharge >= percentChargeNeeded &&
    percentAutoTimer >= percentAutoSpeed
  ) {
    traceNumberEvent('percent-auto-fire', { lane: 1, timer: `${percentAutoTimer}/${percentAutoSpeed}` });
    usePercent();
  }

  for (const lane of extraPercentLanes) {
    if (lane.charge >= percentChargeNeeded && lane.autoTimer >= lane.autoSpeed) {
      traceNumberEvent('percent-auto-fire', {
        lane: lane.laneNumber,
        timer: `${lane.autoTimer}/${lane.autoSpeed}`
      });
      useExtraPercent(lane);
    }
  }
}, PERCENT_AUTO_TICK_MS);

function upgradePercentCharge() {
  if (!percentUnlocked) return false;
  if (percentChargeNeeded <= minimumPercentChargeNeeded()) return false;
  const cost = discountedCost(percentChargeUpgradeCost);
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
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
