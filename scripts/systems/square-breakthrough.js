const squareBreakthroughUi = {};

function buySquareBreakthroughUpgrade(id) {
  const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;

  const level = squareBreakthroughLevel(id);
  if (level >= squareBreakthroughMax(upgrade)) return false;

  const cost = squareBreakthroughCost(upgrade);
  if (cost === null || compareNumberValues(squarePoints, cost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, cost);
  squareBreakthroughLevels[id] = level + 1;
  applySquareBreakthroughSideEffects(id);
  render();
  return true;
}

function applySquareBreakthroughSideEffects(id) {
  if (id === 'solid_start') {
    ensureBaseNumberAtLeast(2000000n);
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
  if (upgrade.id === 'overclock') return `현재 퍼센트 소프트캡 +${4 * dysonEffectNumber() * level}단계`;
  if (upgrade.id === 'doctor_octopus') return `현재 클릭 획득 x${fmtPowerBase(affectedBigIntMultiplier(8, level))}`;
  if (upgrade.id === 'gregtech') return `현재 병렬 상한 x${fmtPowerBase(affectedBigIntMultiplier(2, level))}`;
  if (upgrade.id === 'bottleneck_tracker') {
    return level > 0
      ? `퍼센트 가격 가속 시작 +${2 * dysonEffectNumber() * level}레벨 · 퍼센트 효율 x${percentEfficiencyMultiplier().toFixed(2)}`
      : '미작동';
  }
  if (upgrade.id === 'percent_expansion') return `현재 퍼센트 라인 한도 ${percentLaneLimit()} / ${MAX_PERCENT_LANES}`;
  if (upgrade.id === 'dyson_swarm') return `별표 효과 x${fmtPowerBase(dysonEffectMultiplier())}`;
  return upgrade.description;
}

function ensureSquareBreakthroughUi(upgrade) {
  if (squareBreakthroughUi[upgrade.id]) return squareBreakthroughUi[upgrade.id];

  const button = document.createElement('button');
  button.className = 'square-upgrade breakthrough-upgrade';
  button.dataset.devUpgradeKind = 'square_breakthrough';
  button.dataset.devUpgradeId = upgrade.id;
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
    const devMode = typeof devConsoleIsOpen === 'function' && devConsoleIsOpen();
    button.disabled = devMode ? false : maxed || cost === null || compareNumberValues(squarePoints, cost) < 0;
  }
}
