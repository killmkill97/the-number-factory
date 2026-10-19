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
  nextPercentLaneUnlockCost = multiplyNumberValue(nextPercentLaneUnlockCost, 2);
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
  if (percentCharge < percentChargeNeeded && pendingPercentUses < 1) {
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

  const gain = percentUseGain(before, percentPower, percentPowerPurchaseBonus);
  traceNumberEvent('percent-gain', {
    lane: 1,
    power: percentPower,
    before: numberTraceValue(before),
    gain: numberTraceValue(gain)
  });
  if (!isPositiveNumberValue(gain)) return false;

  if (pendingPercentUses >= 1) {
    pendingPercentUses--;
    applyPercentUsesBatch(percentPower, 1, 'percent-lane-1', percentPowerPurchaseBonus);
  } else {
    applyPercentUse(before, percentPower, 'percent-lane-1', percentPowerPurchaseBonus);
    percentCharge = 0;
  }
  checkOverflow();

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
  repairPercentPowerCostState();
  if (!percentUnlocked) return false;
  if (percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return false;
  const cost = percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
  if (!percentPowerCostAvailable(cost)) return false;
  if (!canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  updatePercentPowerCostAfterPurchase();
  render();
  return true;
}

percentPowerBtn.addEventListener('click', upgradePercentPower);

function buyPercentPowerBatch(maxPurchases, lane = null, deadline = Infinity) {
  const result = { purchased: 0, operations: 0 };
  if (overflowed || squareMode || !percentUnlocked || percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return result;
  const requested = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(maxPurchases)));
  if (!(requested > 0)) return result;

  while (result.purchased < requested && result.operations < 64 && gameClockNowMs() < deadline) {
    if (lane) repairPercentLanePowerCost(lane);
    else repairPercentPowerCostState();
    const count = lane ? lane.powerPurchaseCount : percentPowerPurchaseCount;
    const power = lane ? lane.power : percentPower;
    const bonus = lane ? lane.powerPurchaseBonus : percentPowerPurchaseBonus;
    const limit = Math.min(
      requested - result.purchased,
      Number.MAX_SAFE_INTEGER - 1 - count,
      Number.MAX_SAFE_INTEGER - power
    );
    if (limit <= 0) break;
    const model = percentPowerBulkPriceModel(
      lane ? lane.powerCost : percentPowerUpgradeCost,
      lane ? lane.powerCostCompounding : percentPowerCostCompounding,
      count,
      lane ? scaleByLane(40000, lane.laneNumber) : 40000
    );
    result.operations++;
    const plan = model ? planPercentPowerBulkPurchase(model, limit, deadline) : null;
    if (plan !== null) {
      if (plan.purchased <= 0) break;
      const nextCost = model.nextCost(plan.purchased);
      const granted = grantPercentPowerBatch(power, bonus, count, plan.purchased);
      setBaseNumber(plan.balance);
      if (lane) {
        lane.power = granted.power;
        lane.powerPurchaseBonus = granted.purchaseBonus;
        lane.powerPurchaseCount = count + plan.purchased;
        lane.powerCost = nextCost;
        lane.powerCostCompounding = true;
      } else {
        percentPower = granted.power;
        percentPowerPurchaseBonus = granted.purchaseBonus;
        percentPowerPurchaseCount = count + plan.purchased;
        percentPowerUpgradeCost = nextCost;
        percentPowerCostCompounding = true;
      }
      result.purchased += plan.purchased;
      render();
      break;
    }
    if (gameClockNowMs() >= deadline) break;
    if (!(lane ? buyExtraLanePower(lane) : upgradePercentPower())) break;
    result.purchased++;
  }
  return result;
}

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
  percentAutoSpeedPrice = multiplyNumberValue(percentAutoSpeedPrice, 2);
  percentAutoTimer = 0;
  log(`% 오토클리커 대기 시간이 ${formatDelay(percentAutoSpeed)}로 감소했습니다.`);
  render();
  return true;
}

percentAutoSpeedBtn.addEventListener('click', upgradePercentAutoSpeed);

let lastPercentTraceHeartbeatAt = -Infinity;
let percentAutoLastTickAt = gameTimelineNowMs();

function addPercentAutoTime(timer, elapsed) {
  const total = timer + elapsed;
  return Number.isFinite(total) ? Math.max(0, total) : Number.MAX_VALUE;
}

function consumeAutomaticPercentUses({ charge, setCharge, pendingUses, setPendingUses, power, purchaseBonus = 0, timer, setTimer, speed, source }) {
  const cooldownsReady = Math.floor(timer / speed);
  if (cooldownsReady <= 0) return false;

  const readyUses = Math.min(Number.MAX_VALUE, pendingUses + (charge >= percentChargeNeeded ? 1 : 0));
  if (readyUses <= 0) {
    setTimer(Math.min(timer, speed));
    return false;
  }

  const uses = Math.min(cooldownsReady, readyUses);
  if (!applyPercentUsesBatch(power, uses, source, purchaseBonus)) {
    setTimer(Math.min(timer, speed));
    return false;
  }

  const queuedUsesConsumed = Math.min(pendingUses, uses);
  setPendingUses(Math.max(0, pendingUses - queuedUsesConsumed));
  if (uses > queuedUsesConsumed && charge >= percentChargeNeeded) setCharge(0);
  const remainingTimer = Math.max(0, timer - (uses * speed));

  const remainingReadyUses = Math.max(0, readyUses - uses);
  setTimer(remainingReadyUses <= 0 ? Math.min(remainingTimer, speed) : remainingTimer);
  traceNumberEvent('percent-auto-fire', { source, uses: String(uses), timer: `${timer}/${speed}` });
  return true;
}

// 충전 중에도 각 레인의 쿨다운을 진행한다. 준비된 레인은 독립적으로 사용하므로
// 가속 틱에 누적된 충전과 쿨다운을 묶어서 처리한다.
function advanceAutomaticPercentUses(elapsedRealMs) {
  if (overflowed || squareMode) {
    percentAutoTimer = 0;
    for (const lane of extraPercentLanes) lane.autoTimer = 0;
    return;
  }

  const elapsed = gameTick(elapsedRealMs);
  const percentAutoElapsed = hasAbstractionResearch('2-1')
    ? elapsed * autoUpgradeSpeedMultiplier()
    : elapsed;
  percentAutoTimer = percentAutoUnlocked
    ? addPercentAutoTime(percentAutoTimer, percentAutoElapsed)
    : 0;

  for (const lane of extraPercentLanes) {
    if (!lane.autoUnlocked) {
      lane.autoTimer = 0;
      continue;
    }

    lane.autoTimer = addPercentAutoTime(lane.autoTimer, percentAutoElapsed);
  }

  const traceNow = gameClockNowMs();
  if (numberTraceEnabled && traceNow - lastPercentTraceHeartbeatAt >= 50) {
    lastPercentTraceHeartbeatAt = traceNow;
    traceNumberEvent('percent-auto-tick', {
      elapsed,
      main: `${percentCharge}/${percentChargeNeeded}`,
      mainTimer: `${percentAutoTimer}/${percentAutoSpeed}`,
      lanes: extraPercentLanes.map(lane => `${lane.laneNumber}:${lane.charge}/${percentChargeNeeded}@${lane.autoTimer}/${lane.autoSpeed}`).join(' ')
    });
  }

  let changed = false;
  if (percentAutoUnlocked) {
    changed = consumeAutomaticPercentUses({
      charge: percentCharge,
      setCharge: value => { percentCharge = value; },
      pendingUses: pendingPercentUses,
      setPendingUses: value => { pendingPercentUses = value; },
      power: percentPower,
      purchaseBonus: percentPowerPurchaseBonus,
      timer: percentAutoTimer,
      setTimer: value => { percentAutoTimer = value; },
      speed: percentAutoSpeed,
      source: 'percent-lane-1'
    }) || changed;
  }

  for (const lane of extraPercentLanes) {
    if (!lane.autoUnlocked) continue;
    changed = consumeAutomaticPercentUses({
      charge: lane.charge,
      setCharge: value => { lane.charge = value; },
      pendingUses: lane.pendingUses,
      setPendingUses: value => { lane.pendingUses = value; },
      power: lane.power,
      purchaseBonus: lane.powerPurchaseBonus,
      timer: lane.autoTimer,
      setTimer: value => { lane.autoTimer = value; },
      speed: lane.autoSpeed,
      source: `percent-lane-${lane.laneNumber}`
    }) || changed;
    if (overflowed) break;
  }
  if (changed) {
    checkOverflow();
    render();
  }
}

function flushAutomaticPercentUses() {
  const { now, elapsedMs } = elapsedRealTimeSince(percentAutoLastTickAt);
  percentAutoLastTickAt = now;
  withPercentProductionCache(() => advanceAutomaticPercentUses(elapsedMs));
}

setGameInterval(flushAutomaticPercentUses, PERCENT_AUTO_TICK_MS);

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
  percentChargeUpgradeCost = divideNumberValue(
    addBaseNumbers(multiplyNumberValue(percentChargeUpgradeCost, 6), 4),
    5
  );

  log(`% 충전 필요 클릭 수가 최대 ${reduction}회 감소하여 ${percentChargeNeeded}회가 되었습니다.`);
  render();
  return true;
}

upgradeChargeBtn.addEventListener('click', upgradePercentCharge);
