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
    autoUnlocked: false,
    autoPrice: scaleByLane(150n, laneNumber),
    autoSpeedLevels: [1000, 800, 600, 400, 200],
    autoSpeedLevel: 0,
    autoSpeed: 1000,
    autoSpeedPrice: scaleByLane(250n, laneNumber),
    autoTimer: 0,
    ui: null
  };
}

function percentPowerText() {
  return `+${percentPower}%`;
}

function lanePowerText(power) {
  return `+${power}%`;
}

function upgradeLanePower(lane) {
  lane.power++;
  lane.powerCost = percentPowerUpgradeCostForNextLevel(
    lane.power,
    scaleByLane(40000n, lane.laneNumber)
  );
  return true;
}

function buyExtraLanePower(lane) {
  if (overflowed || squareMode) return false;
  if (percentChargeNeeded > PERCENT_POWER_UNLOCK_CHARGE) return false;
  const currentCost = discountedCost(lane.powerCost);
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
  const currentlyMaxed = lane.autoSpeedLevel >= lane.autoSpeedLevels.length - 1;
  const currentCost = discountedCost(lane.autoSpeedPrice);
  if (!lane.autoUnlocked || currentlyMaxed || !canAffordBaseCost(currentCost)) return false;

  spendBaseCost(currentCost);
  lane.autoSpeedLevel++;
  lane.autoSpeed = lane.autoSpeedLevels[lane.autoSpeedLevel];
  lane.autoSpeedPrice *= 2n;
  lane.autoTimer = 0;
  render();
  return true;
}

function useExtraPercent(lane) {
  if (overflowed || squareMode) return false;
  if (lane.charge < percentChargeNeeded) return false;
  addToBaseNumber(percentGain(getBaseNumber(), lane.power));
  lane.charge = 0;
  lane.autoTimer = 0;
  checkOverflow();
  render();
  return true;
}

function chargeAllPercentLanes(amount) {
  if (!percentUnlocked) return;
  percentCharge = Math.min(percentChargeNeeded, percentCharge + amount);
  for (const lane of extraPercentLanes) {
    lane.charge = Math.min(percentChargeNeeded, lane.charge + amount);
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
    const powerCost = discountedCost(lane.powerCost);
    powerBtn.innerHTML = `퍼센트 파워 업그레이드 (현재 ${lanePowerText(lane.power)})<span class="cost">비용: ${fmtScientific(powerCost)} · ${percentPowerSoftcapStatus(lane.power)}</span>`;
    powerBtn.disabled = !canAffordBaseCost(powerCost) || overflowed || squareMode;
  } else {
    powerRow.classList.add('hidden');
  }

  autoBtn.innerHTML = lane.autoUnlocked
    ? `% 오토클리커 (구매 완료)<span class="cost">대기 ${(lane.autoSpeed / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초</span>`
    : `% 오토클리커<span class="cost">비용: ${fmt(discountedCost(lane.autoPrice))}</span>`;
  autoBtn.disabled = lane.autoUnlocked || !canAffordBaseCost(discountedCost(lane.autoPrice)) || overflowed || squareMode;

  const maxed = lane.autoSpeedLevel >= lane.autoSpeedLevels.length - 1;
  const speedCost = discountedCost(lane.autoSpeedPrice);
  speedBtn.innerHTML = `% 오토클리커 속도 업그레이드<span class="cost">${maxed ? '최대 속도 (0.2초)' : `비용: ${fmt(speedCost)} · 현재 ${(lane.autoSpeed / 1000).toFixed(1)}초`}</span>`;
  speedBtn.disabled = !lane.autoUnlocked || maxed || !canAffordBaseCost(speedCost) || overflowed || squareMode;
}

function renderExtraPercentLanes() {
  for (const lane of extraPercentLanes) {
    updateExtraPercentLaneUI(lane);
  }
}
