const squareBreakthroughUi = {};
let autoSpConverterTargetDirty = false;
let autoSpConverterRenderedTarget = null;

function parseAutoSpConverterTarget(rawValue) {
  const text = String(rawValue ?? '').trim().replace(/\s*sp$/i, '').replace(/[,_\s]/g, '');
  if (!text) throw new Error('목표 SP를 입력하세요.');

  if (/^\+?\d+$/.test(text)) {
    const value = BigInt(text.replace(/^\+/, ''));
    if (value <= 0n) throw new Error('목표 SP는 1 이상이어야 합니다.');
    return value;
  }

  const scientific = text.match(/^\+?(\d+)(?:\.(\d+))?[eE]\+?(\d+)$/);
  if (!scientific) throw new Error('목표 SP는 8, 8SP, 1e6 같은 형식으로 입력하세요.');

  const whole = scientific[1];
  const fraction = scientific[2] ?? '';
  const exponent = Number(scientific[3]);
  if (!Number.isSafeInteger(exponent) || exponent < fraction.length) {
    throw new Error('목표 SP 형식이 너무 큽니다.');
  }

  const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '');
  const value = BigInt(digits || '0') * (10n ** BigInt(exponent - fraction.length));
  if (value <= 0n) throw new Error('목표 SP는 1 이상이어야 합니다.');
  return value;
}

function setAutoSpConverterTargetFromInput() {
  try {
    if (!squareBreakthroughEntered) {
      autoSpConverterTargetSp = 1n;
      autoSpConverterTargetInput.value = '1';
      throw new Error('제곱돌파에 진입하기 전에는 목표 SP가 1로 고정됩니다.');
    }
    autoSpConverterTargetSp = parseAutoSpConverterTarget(autoSpConverterTargetInput.value);
    autoSpConverterTargetInput.value = autoSpConverterTargetSp.toString();
    autoSpConverterTargetDirty = false;
    autoSpConverterRenderedTarget = autoSpConverterTargetSp.toString();
    log(`자동 SP 변환기 목표가 ${fmt(autoSpConverterTargetSp)} SP로 설정되었습니다.`, true);
    checkOverflow();
    render();
  } catch (error) {
    log(`[자동 SP 변환기] ${error.message}`, true);
  }
}

function toggleAutoSpConverter() {
  if (!autoSpConverterAvailable()) return false;
  autoSpConverterEnabled = !autoSpConverterEnabled;
  log(`자동 SP 변환기 ${autoSpConverterEnabled ? 'ON' : 'OFF'}`, true);
  checkOverflow();
  render();
  return true;
}

function buySquareBreakthroughUpgrade(id) {
  const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;

  const level = squareBreakthroughLevel(id);
  if (level >= squareBreakthroughMax(upgrade)) return false;

  const cost = squareBreakthroughCost(upgrade);
  if (cost === null || squarePoints < cost) return false;

  squarePoints -= cost;
  squareBreakthroughLevels[id] = level + 1;
  applySquareBreakthroughSideEffects(id);
  render();
  return true;
}

function applySquareBreakthroughSideEffects(id) {
  if (id === 'solid_start') {
    if (num < 2000000n) num = 2000000n;
    maybeUnlockPercent();
    syncPermanentPercentLanes();
  }

  if (id === 'percent_expansion') {
    syncPermanentPercentLanes();
  }

  if (id === 'overcharge') {
    percentChargeNeeded = 1;
    percentCharge = Math.min(percentCharge, percentChargeNeeded);
    for (const lane of extraPercentLanes) {
      lane.charge = Math.min(lane.charge, percentChargeNeeded);
    }
  }

  if (id === 'shortcut') {
    checkOverflow();
  }

  if (id === 'tas' && autoClickerSpeed < autoClickerMinSpeed()) {
    autoClickerSpeed = autoClickerMinSpeed();
  }
}

function squareBreakthroughLevelText(upgrade) {
  const level = squareBreakthroughLevel(upgrade.id);
  const max = squareBreakthroughMax(upgrade);
  return max === 1 ? (level > 0 ? '구매 완료' : '미구매') : `${fmt(BigInt(level))} / ${fmt(BigInt(max))}`;
}

function squareBreakthroughCostText(upgrade) {
  const cost = squareBreakthroughCost(upgrade);
  return cost === null ? 'MAX' : `비용: ${fmt(cost)} SP`;
}

function squareBreakthroughEffectText(upgrade) {
  const level = squareBreakthroughLevel(upgrade.id);
  if (upgrade.id === 'extra_investment') return `현재 SP 획득 x${fmtPowerBase(affectedBigIntMultiplier(2, level))}`;
  if (upgrade.id === 'invisible_hand') return `현재 자동 업글 속도 x${autoUpgradeSpeedMultiplier().toFixed(2).replace(/\.?0+$/, '')}`;
  if (upgrade.id === 'overclock') return `현재 퍼센트 파워 상한 +${4 * dysonEffectNumber() * level}%`;
  if (upgrade.id === 'doctor_octopus') return `현재 클릭 획득 x${fmtPowerBase(affectedBigIntMultiplier(8, level))}`;
  if (upgrade.id === 'gregtech') return `현재 병렬 상한 x${fmtPowerBase(affectedBigIntMultiplier(2, level))}`;
  if (upgrade.id === 'bottleneck_tracker') return level > 0 ? `현재 1초마다 x${fmtPowerBase(bottleneckTrackerMultiplier())}` : '미작동';
  if (upgrade.id === 'percent_expansion') return `현재 퍼센트 라인 한도 ${percentLaneLimit()} / ${MAX_PERCENT_LANES}`;
  if (upgrade.id === 'dyson_swarm') return `별표 효과 x${fmtPowerBase(dysonEffectMultiplier())}`;
  return upgrade.description;
}

function ensureSquareBreakthroughUi(upgrade) {
  if (squareBreakthroughUi[upgrade.id]) return squareBreakthroughUi[upgrade.id];

  const button = document.createElement('button');
  button.className = 'square-upgrade breakthrough-upgrade';
  button.addEventListener('click', () => buySquareBreakthroughUpgrade(upgrade.id));
  squareBreakthroughGrid.appendChild(button);

  squareBreakthroughUi[upgrade.id] = button;
  return button;
}

function renderSquareBreakthroughBoard() {
  for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) {
    const button = ensureSquareBreakthroughUi(upgrade);
    const level = squareBreakthroughLevel(upgrade.id);
    const maxed = level >= squareBreakthroughMax(upgrade);
    const cost = squareBreakthroughCost(upgrade);
    const effectText = squareBreakthroughEffectText(upgrade);
    const effectLine = effectText && effectText !== upgrade.description
      ? `<span class="upgrade-desc">${effectText}</span>`
      : '';

    button.classList.toggle('bought', level > 0);
    button.innerHTML = `
      <span class="upgrade-title">${upgrade.title}${squareBreakthroughEffectSuffix(upgrade)}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
      ${effectLine}
      <span class="cost">${squareBreakthroughLevelText(upgrade)} · ${squareBreakthroughCostText(upgrade)}</span>
    `;
    button.disabled = maxed || cost === null || squarePoints < cost;
  }
}

function renderAutoSpConverter() {
  if (!autoSpConverterToggleBtn) return;

  const available = autoSpConverterAvailable();
  const targetSp = autoSpConverterTargetValue();
  const requiredChunks = autoSpConverterRequiredChunks();
  const targetNumber = autoSpConverterTargetNumber();
  const currentGain = autoSpConverterEnabled && num >= targetNumber
    ? autoSpConverterPointReward()
    : 0n;

  autoSpConverterToggleBtn.classList.toggle('toggle-active', available && autoSpConverterEnabled);
  autoSpConverterToggleBtn.classList.toggle('toggle-inactive', available && !autoSpConverterEnabled);
  autoSpConverterToggleLabel.textContent = `자동 SP 변환기 ${autoSpConverterEnabled ? 'ON' : 'OFF'}`;
  autoSpConverterToggleCost.textContent = available ? '제곱돌파로 자동 해금' : '제곱돌파 필요';
  autoSpConverterToggleBtn.disabled = !available;

  const targetText = targetSp.toString();
  if (autoSpConverterRenderedTarget !== targetText) {
    autoSpConverterTargetInput.value = targetText;
    autoSpConverterTargetDirty = false;
    autoSpConverterRenderedTarget = targetText;
  } else if (!autoSpConverterTargetDirty && document.activeElement !== autoSpConverterTargetInput) {
    autoSpConverterTargetInput.value = targetText;
  }
  autoSpConverterTargetInput.disabled = !available;
  autoSpConverterTargetBtn.disabled = !available;
  autoSpConverterStatus.textContent = !available
    ? '제곱돌파 탭에 진입하기 전에는 목표 SP가 1로 고정됩니다.'
    : autoSpConverterEnabled
      ? `목표 ${fmt(targetSp)} SP · 필요 ${fmt(requiredChunks)}구간 (${fmtPowerBase(targetNumber)}) · 지급 ${fmt(currentGain)} SP`
      : `자동 변환 OFF · 목표 ${fmt(targetSp)} SP · 필요 ${fmt(requiredChunks)}구간 (${fmtPowerBase(targetNumber)}) · 현재 변환량 0 SP`;
}

setInterval(() => {
  const multiplier = bottleneckTrackerMultiplier();
  if (multiplier <= 1n || overflowed || squareMode) {
    bottleneckTrackerTimer = 0;
    return;
  }

  bottleneckTrackerTimer += gameTick(100);
  if (bottleneckTrackerTimer < 1000) return;

  const cycles = Math.floor(bottleneckTrackerTimer / 1000);
  bottleneckTrackerTimer %= 1000;
  num *= powBigInt(multiplier, cycles);

  maybeUnlockPercent();
  checkOverflow();
  render();
}, 100);

autoSpConverterToggleBtn.addEventListener('click', toggleAutoSpConverter);
autoSpConverterTargetBtn.addEventListener('click', setAutoSpConverterTargetFromInput);
autoSpConverterTargetInput.addEventListener('input', () => {
  autoSpConverterTargetDirty = true;
});
autoSpConverterTargetInput.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  setAutoSpConverterTargetFromInput();
});
