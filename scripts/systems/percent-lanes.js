function scaleByLane(base, laneNumber) {
  let value = base;
  for (let i = 1; i < laneNumber; i++) {
    value = divideNumberValue(
      addBaseNumbers(multiplyNumberValue(value, 3), 1),
      2
    ); // 이전 티어보다 약 1.5배
  }
  return value;
}

function makePercentLane(laneNumber) {
  return {
    laneNumber,
    charge: 0,
    pendingUses: 0,
    power: 1,
    powerPurchaseCount: 0,
    powerPurchaseBonus: 0,
    powerCost: scaleByLane(40000, laneNumber),
    powerCostCompounding: false,
    autoUnlocked: false,
    autoPrice: scaleByLane(150, laneNumber),
    autoSpeedLevels: [1000, 800, 600, 400, 200, 10],
    autoSpeedLevel: 0,
    autoSpeed: 1000,
    autoSpeedPrice: scaleByLane(250, laneNumber),
    autoTimer: 0,
    ui: null
  };
}

function repairPercentLanePowerCost(lane) {
  const progress = reconcilePercentPowerProgress(lane.power, lane.powerPurchaseCount);
  lane.power = progress.power;
  lane.powerPurchaseCount = progress.purchaseCount;

  const baseCost = scaleByLane(40000, lane.laneNumber);
  const repaired = normalizePercentPowerCostState(
    lane.powerCost,
    lane.powerCostCompounding,
    lane.powerPurchaseCount,
    baseCost
  );
  lane.powerCost = repaired.cost;
  lane.powerCostCompounding = repaired.compounding;
  return repaired;
}

function repairExtraPercentLanePowerCosts() {
  for (const lane of extraPercentLanes) repairPercentLanePowerCost(lane);
}

let lastDivergerPercentPriceState = null;

function rebasePercentPowerPriceForProgress(purchaseCount, baseCost) {
  return restoredPercentPowerCost(0, false, purchaseCount, baseCost);
}

function rebasePercentPowerPricesForDiverger(force = false) {
  const equipped = hasKnuthUpgrade('diverger_percent_price_delay');
  const milestones = equipped ? divergerPercentPriceShiftMilestones() : 0;
  const stateKey = `${equipped ? 1 : 0}:${milestones}`;
  const previousState = lastDivergerPercentPriceState;
  if (!force && stateKey === previousState) return false;
  lastDivergerPercentPriceState = stateKey;

  const shouldRebase = equipped || (!force && previousState?.startsWith('1:'));
  if (!shouldRebase) return false;

  const mainProgress = reconcilePercentPowerProgress(percentPower, percentPowerPurchaseCount);
  percentPower = mainProgress.power;
  percentPowerPurchaseCount = mainProgress.purchaseCount;
  const mainCost = rebasePercentPowerPriceForProgress(percentPowerPurchaseCount, 40000);
  percentPowerUpgradeCost = mainCost.cost;
  percentPowerCostCompounding = mainCost.compounding;

  for (const lane of extraPercentLanes) {
    const progress = reconcilePercentPowerProgress(lane.power, lane.powerPurchaseCount);
    lane.power = progress.power;
    lane.powerPurchaseCount = progress.purchaseCount;
    const cost = rebasePercentPowerPriceForProgress(
      lane.powerPurchaseCount,
      scaleByLane(40000, lane.laneNumber)
    );
    lane.powerCost = cost.cost;
    lane.powerCostCompounding = cost.compounding;
  }
  return true;
}

function percentPowerText() {
  return `+${Number(percentEffectivePower(percentPower, percentPowerPurchaseBonus).toFixed(3))}%`;
}

function lanePowerText(lane) {
  return `+${Number(percentEffectivePower(lane.power, lane.powerPurchaseBonus).toFixed(3))}%`;
}

function upgradeLanePower(lane) {
  repairPercentLanePowerCost(lane);
  const baseCost = scaleByLane(40000, lane.laneNumber);
  const currentCost = percentPowerBaseCost(
    lane.powerCost,
    lane.powerCostCompounding,
    lane.powerPurchaseCount,
    baseCost
  );
  if (!percentPowerCostAvailable(currentCost)) return false;
  const purchaseNumber = lane.powerPurchaseCount + 1;
  const purchase = grantPercentPower(lane.power, lane.powerPurchaseBonus, purchaseNumber);
  lane.power = purchase.power;
  lane.powerPurchaseBonus = purchase.purchaseBonus;
  lane.powerPurchaseCount = purchaseNumber;
  if (lane.powerCostCompounding || compareNumberValues(currentCost, powerOfTenValue(500)) >= 0) {
    lane.powerCostCompounding = true;
    lane.powerCost = nextCompoundingPercentPowerCost(currentCost, purchaseNumber);
    return true;
  }

  const nextRawCost = percentPowerUpgradeCostForNextLevel(
    1 + lane.powerPurchaseCount,
    baseCost
  );
  const nextAdjustedCost = discountedCost(nextRawCost);
  if (compareNumberValues(nextAdjustedCost, powerOfTenValue(500)) >= 0) {
    lane.powerCostCompounding = true;
    lane.powerCost = nextCompoundingPercentPowerCost(nextAdjustedCost, purchaseNumber);
  } else {
    lane.powerCost = nextRawCost;
  }
  return true;
}

function buyExtraLanePower(lane) {
  if (overflowed || squareMode) return false;
  if (percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return false;
  repairPercentLanePowerCost(lane);
  const currentCost = percentPowerCost(
    lane.powerCost,
    lane.powerCostCompounding,
    lane.powerPurchaseCount,
    scaleByLane(40000, lane.laneNumber)
  );
  if (!percentPowerCostAvailable(currentCost)) return false;
  if (!canAffordBaseCost(currentCost)) return false;

  spendBaseCost(currentCost);
  upgradeLanePower(lane);
  render();
  return true;
}

function buyExtraLaneAuto(lane) {
  if (overflowed || squareMode) return false;
  const cost = discountedCost(lane.autoPrice);
  if (lane.autoUnlocked || !canAffordBaseCost(cost)) return false;

  spendBaseCost(cost);
  lane.autoUnlocked = true;
  lane.autoTimer = 0;
  log(`퍼센트 레인 ${lane.laneNumber} 오토클리커를 구매했습니다.`);
  render();
  return true;
}

function upgradeExtraLaneAutoSpeed(lane) {
  if (overflowed || squareMode) return false;
  const minimumSpeed = percentAutoMinSpeed();
  const currentlyMaxed = lane.autoSpeed <= minimumSpeed;
  const currentCost = discountedCost(lane.autoSpeedPrice);
  if (!lane.autoUnlocked || currentlyMaxed || !canAffordBaseCost(currentCost)) return false;

  spendBaseCost(currentCost);
  if (lane.autoSpeed > 200) {
    lane.autoSpeed = Math.max(200, lane.autoSpeed - 200);
  } else {
    lane.autoSpeed = minimumSpeed;
  }
  lane.autoSpeedLevel = Math.min(lane.autoSpeedLevel + 1, lane.autoSpeedLevels.length - 1);
  lane.autoSpeedPrice = multiplyNumberValue(lane.autoSpeedPrice, 2);
  lane.autoTimer = 0;
  render();
  return true;
}

function useExtraPercent(lane) {
  if (overflowed || squareMode) {
    traceNumberEvent('percent-use-skip', {
      lane: lane.laneNumber,
      reason: overflowed ? 'overflowed' : 'square-mode'
    });
    return false;
  }
  if (lane.charge < percentChargeNeeded && lane.pendingUses < 1) {
    traceNumberEvent('percent-use-skip', {
      lane: lane.laneNumber,
      reason: 'not-ready',
      charge: `${lane.charge}/${percentChargeNeeded}`
    });
    return false;
  }

  const before = getBaseNumber();
  traceNumberEvent('percent-use-enter', {
    lane: lane.laneNumber,
    charge: `${lane.charge}/${percentChargeNeeded}`,
    autoTimer: `${lane.autoTimer}/${lane.autoSpeed}`,
    number: numberTraceValue(before)
  });

  const gain = percentUseGain(before, lane.power, lane.powerPurchaseBonus);
  traceNumberEvent('percent-gain', {
    lane: lane.laneNumber,
    power: lane.power,
    before: numberTraceValue(before),
    gain: numberTraceValue(gain)
  });
  if (!isPositiveNumberValue(gain)) return false;

  if (lane.pendingUses >= 1) {
    lane.pendingUses--;
    applyPercentUsesBatch(lane.power, 1, `percent-lane-${lane.laneNumber}`, lane.powerPurchaseBonus);
  } else {
    applyPercentUse(before, lane.power, `percent-lane-${lane.laneNumber}`, lane.powerPurchaseBonus);
    lane.charge = 0;
  }
  lane.autoTimer = 0;
  checkOverflow();
  traceNumberEvent('percent-use-complete', {
    lane: lane.laneNumber,
    charge: `${lane.charge}/${percentChargeNeeded}`,
    number: numberTraceValue(getBaseNumber())
  });
  render();
  return true;
}

function chargeAllPercentLanes(amount) {
  if (!percentUnlocked) {
    maybeUnlockPercent();
    if (!percentUnlocked) return;
  }
  const numericAmount = typeof amount === 'number' ? amount : realNumberFromValue(amount);
  const chargeAmount = Number.isFinite(numericAmount)
    ? Math.max(0, numericAmount)
    : Number.MAX_VALUE;
  const beforeMainCharge = percentCharge;
  const beforeLaneCharges = numberTraceEnabled ? extraPercentLanes.map(lane => ({
    laneNumber: lane.laneNumber,
    charge: lane.charge,
    pendingUses: lane.pendingUses
  })) : null;

  const mainTotal = Math.min(Number.MAX_VALUE, percentCharge + chargeAmount);
  const mainUses = Math.floor(mainTotal / percentChargeNeeded);
  percentCharge = mainTotal % percentChargeNeeded;
  pendingPercentUses = Math.min(Number.MAX_VALUE, pendingPercentUses + mainUses);

  for (const lane of extraPercentLanes) {
    const total = Math.min(Number.MAX_VALUE, lane.charge + chargeAmount);
    const earnedUses = Math.floor(total / percentChargeNeeded);
    lane.charge = total % percentChargeNeeded;
    lane.pendingUses = Math.min(Number.MAX_VALUE, lane.pendingUses + earnedUses);
  }

  if (!numberTraceEnabled) {
    if (typeof flushAutomaticPercentUses === 'function') flushAutomaticPercentUses();
    return;
  }
  traceNumberEvent('percent-auto-charge', {
    amount,
    main: `${beforeMainCharge}/${percentChargeNeeded}->${percentCharge}/${percentChargeNeeded} (+${mainUses}, ${pendingPercentUses} pending)`,
    lanes: extraPercentLanes.map(lane => {
      const before = beforeLaneCharges.find(item => item.laneNumber === lane.laneNumber)?.charge ?? 0;
      return `${lane.laneNumber}:${before}->${lane.charge} (${lane.pendingUses} pending)`;
    }).join(' ')
  });

  if (mainUses > 0) {
    traceNumberEvent('percent-ready', {
      lane: 1,
      uses: mainUses,
      pending: pendingPercentUses,
      charge: `${percentCharge}/${percentChargeNeeded}`
    });
  }
  for (const lane of extraPercentLanes) {
    const before = beforeLaneCharges.find(item => item.laneNumber === lane.laneNumber);
    const earnedUses = Math.floor(Math.min(Number.MAX_VALUE, (before?.charge ?? 0) + chargeAmount) / percentChargeNeeded);
    if (earnedUses > 0) {
      traceNumberEvent('percent-ready', {
        lane: lane.laneNumber,
        uses: earnedUses,
        pending: lane.pendingUses,
        charge: `${lane.charge}/${percentChargeNeeded}`
      });
    }
  }
  if (typeof flushAutomaticPercentUses === 'function') flushAutomaticPercentUses();
}

function createExtraPercentLaneUI(lane) {
  if (lane.ui) return;

  const box = document.createElement('div');
  box.className = 'percent-lane formula-help-host';

  const title = document.createElement('div');
  title.className = 'percent-lane-title';
  title.textContent = `퍼센트 레인 ${lane.laneNumber}`;
  box.appendChild(title);

  const bar = document.createElement('div');
  bar.className = 'charge-bar';
  const fill = document.createElement('div');
  fill.className = 'charge-fill';
  bar.appendChild(fill);
  box.appendChild(bar);

  const useRow = document.createElement('div');
  useRow.className = 'row';
  const useBtn = document.createElement('button');
  useBtn.addEventListener('click', () => useExtraPercent(lane));
  useRow.appendChild(useBtn);
  box.appendChild(useRow);

  const powerRow = document.createElement('div');
  powerRow.className = 'row hidden';
  const powerBtn = document.createElement('button');
  powerBtn.addEventListener('click', () => buyExtraLanePower(lane));
  powerRow.appendChild(powerBtn);
  box.appendChild(powerRow);

  ensureFormulaHelpButton(box, 'percent', 'softcap');

  const autoRow = document.createElement('div');
  autoRow.className = 'row';
  const autoBtn = document.createElement('button');
  autoBtn.addEventListener('click', () => buyExtraLaneAuto(lane));
  autoRow.appendChild(autoBtn);
  box.appendChild(autoRow);

  const speedRow = document.createElement('div');
  speedRow.className = 'row';
  const speedBtn = document.createElement('button');
  speedBtn.addEventListener('click', () => upgradeExtraLaneAutoSpeed(lane));
  speedRow.appendChild(speedBtn);
  box.appendChild(speedRow);

  lane.ui = { box, fill, useBtn, powerRow, powerBtn, autoBtn, speedBtn };
  extraPercentLanesEl.appendChild(box);
}

function updateExtraPercentLaneUI(lane) {
  createExtraPercentLaneUI(lane);
  const { fill, useBtn, powerRow, powerBtn, autoBtn, speedBtn } = lane.ui;

  fill.style.width = Math.min(100, (lane.charge / percentChargeNeeded) * 100) + '%';

  const pendingUsesText = lane.pendingUses > 0
    ? ` · 대기 ${fmtPowerBase(numberValueFromReal(lane.pendingUses))}회`
    : '';
  useBtn.textContent = `% 사용 (${lane.charge} / ${percentChargeNeeded})${pendingUsesText} · 파워 ${lanePowerText(lane)} · ${percentPowerSoftcapStatus(lane.power, lane.powerPurchaseBonus)}`;
  useBtn.disabled = (lane.charge < percentChargeNeeded && lane.pendingUses < 1) || overflowed || squareMode;

  if (percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE) {
    powerRow.classList.remove('hidden');
    const powerCost = percentPowerCost(
      lane.powerCost,
      lane.powerCostCompounding,
      lane.powerPurchaseCount,
      scaleByLane(40000, lane.laneNumber)
    );
    const costAvailable = percentPowerCostAvailable(powerCost);
    const costText = costAvailable ? `비용: ${fmtScientific(powerCost)}` : '비용: 지원 범위 초과 · 구매 불가';
    powerBtn.innerHTML = `퍼센트 파워 업그레이드 (현재 ${lanePowerText(lane)})<span class="cost">${costText} · ${percentPowerSoftcapStatus(lane.power, lane.powerPurchaseBonus)}</span>`;
    powerBtn.disabled = !costAvailable || !canAffordBaseCost(powerCost) || overflowed || squareMode;
  } else {
    powerRow.classList.add('hidden');
  }

  autoBtn.innerHTML = lane.autoUnlocked
    ? `% 오토클리커 (구매 완료)<span class="cost">대기 ${(lane.autoSpeed / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초</span>`
    : `% 오토클리커<span class="cost">비용: ${fmt(discountedCost(lane.autoPrice))}</span>`;
  autoBtn.disabled = lane.autoUnlocked || !canAffordBaseCost(discountedCost(lane.autoPrice)) || overflowed || squareMode;

  const maxed = lane.autoSpeed <= percentAutoMinSpeed();
  const speedCost = discountedCost(lane.autoSpeedPrice);
  speedBtn.innerHTML = `% 오토클리커 속도 업그레이드<span class="cost">${maxed ? `최대 속도 (${formatDelay(percentAutoMinSpeed())})` : `비용: ${fmt(speedCost)} · 현재 ${formatDelay(lane.autoSpeed)}`}</span>`;
  speedBtn.disabled = !lane.autoUnlocked || maxed || !canAffordBaseCost(speedCost) || overflowed || squareMode;
}

function renderExtraPercentLanes() {
  for (const lane of extraPercentLanes) {
    updateExtraPercentLaneUI(lane);
  }
}
