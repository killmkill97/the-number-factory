function scaleByLane(base, laneNumber) {
  let value = BigInt(base);
  for (let i = 1; i < laneNumber; i++) {
    value = (value * 3n + 1n) / 2n; // 이전 티어보다 약 1.5배
  }
  return value;
}

function makePercentLane(laneNumber) {
  return {
    laneNumber,
    charge: 0,
    power: 1,
    powerCost: scaleByLane(40000n, laneNumber),
    powerCostCompounding: false,
    autoUnlocked: false,
    autoPrice: scaleByLane(150n, laneNumber),
    autoSpeedLevels: [1000, 800, 600, 400, 200, 10],
    autoSpeedLevel: 0,
    autoSpeed: 1000,
    autoSpeedPrice: scaleByLane(250n, laneNumber),
    autoTimer: 0,
    ui: null
  };
}

function percentPowerText() {
  return `+${percentEffectivePower(percentPower)}%`;
}

function lanePowerText(power) {
  return `+${percentEffectivePower(power)}%`;
}

function upgradeLanePower(lane) {
  lane.power++;
  const currentCost = percentPowerCost(lane.powerCost, lane.powerCostCompounding);
  if (lane.powerCostCompounding || compareNumberValues(currentCost, powerOfTenValue(500)) >= 0) {
    lane.powerCostCompounding = true;
    lane.powerCost = nextCompoundingPercentPowerCost(currentCost);
    return true;
  }

  const nextRawCost = percentPowerUpgradeCostForNextLevel(
    lane.power,
    scaleByLane(40000n, lane.laneNumber)
  );
  const nextAdjustedCost = discountedCost(nextRawCost);
  if (compareNumberValues(nextAdjustedCost, powerOfTenValue(500)) >= 0) {
    lane.powerCostCompounding = true;
    lane.powerCost = nextCompoundingPercentPowerCost(nextAdjustedCost);
  } else {
    lane.powerCost = nextRawCost;
  }
  return true;
}

function buyExtraLanePower(lane) {
  if (overflowed || squareMode) return false;
  if (percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return false;
  const currentCost = percentPowerCost(lane.powerCost, lane.powerCostCompounding);
  if (!canAffordBaseCost(currentCost)) return false;

  spendBaseCost(currentCost);
  if (upgradeLanePower(lane)) {
    log(`퍼센트 레인 ${lane.laneNumber} 파워가 ${lanePowerText(lane.power)}로 증가했습니다. ${percentPowerSoftcapStatus(lane.power)}`);
  }
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
  lane.autoSpeedPrice *= 2n;
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
  if (lane.charge < percentChargeNeeded) {
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

  const gain = percentGain(before, lane.power);
  traceNumberEvent('percent-gain', {
    lane: lane.laneNumber,
    power: lane.power,
    before: numberTraceValue(before),
    gain: numberTraceValue(gain)
  });
  if (!isPositiveNumberValue(gain)) return false;

  addToBaseNumber(gain, `percent-lane-${lane.laneNumber}`);
  lane.charge = 0;
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
  const beforeMainCharge = percentCharge;
  const beforeLaneCharges = extraPercentLanes.map(lane => ({ laneNumber: lane.laneNumber, charge: lane.charge }));
  percentCharge = Math.min(percentChargeNeeded, percentCharge + amount);
  for (const lane of extraPercentLanes) {
    lane.charge = Math.min(percentChargeNeeded, lane.charge + amount);
  }

  traceNumberEvent('percent-auto-charge', {
    amount,
    main: `${beforeMainCharge}/${percentChargeNeeded}->${percentCharge}/${percentChargeNeeded}`,
    lanes: extraPercentLanes.map(lane => {
      const before = beforeLaneCharges.find(item => item.laneNumber === lane.laneNumber)?.charge ?? 0;
      return `${lane.laneNumber}:${before}->${lane.charge}`;
    }).join(' ')
  });

  if (beforeMainCharge < percentChargeNeeded && percentCharge >= percentChargeNeeded) {
    traceNumberEvent('percent-ready', { lane: 1, charge: `${percentCharge}/${percentChargeNeeded}` });
  }
  for (const lane of extraPercentLanes) {
    const before = beforeLaneCharges.find(item => item.laneNumber === lane.laneNumber)?.charge ?? 0;
    if (before < percentChargeNeeded && lane.charge >= percentChargeNeeded) {
      traceNumberEvent('percent-ready', { lane: lane.laneNumber, charge: `${lane.charge}/${percentChargeNeeded}` });
    }
  }
}

function createExtraPercentLaneUI(lane) {
  if (lane.ui) return;

  const box = document.createElement('div');
  box.className = 'percent-lane';

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

  useBtn.textContent = `% 사용 (${lane.charge} / ${percentChargeNeeded}) · 파워 ${lanePowerText(lane.power)} · ${percentPowerSoftcapStatus(lane.power)}`;
  useBtn.disabled = lane.charge < percentChargeNeeded || overflowed || squareMode;

  if (percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE) {
    powerRow.classList.remove('hidden');
    const powerCost = percentPowerCost(lane.powerCost, lane.powerCostCompounding);
    powerBtn.innerHTML = `퍼센트 파워 업그레이드 (현재 ${lanePowerText(lane.power)})<span class="cost">비용: ${fmtScientific(powerCost)} · ${percentPowerSoftcapStatus(lane.power)}</span>`;
    powerBtn.disabled = !canAffordBaseCost(powerCost) || overflowed || squareMode;
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
