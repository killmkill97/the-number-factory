let activeKnuthProductionView = 'black_hole';
let probabilizerLastTickAt = gameTimelineNowMs();
const probabilizerVisualDots = [];
let probabilizerDistributionKey = '';
const probabilizerUpgradeControls = PROBABILIZER_UPGRADES.map(upgrade => {
  const prefix = `probabilizer${upgrade.id[0].toUpperCase()}${upgrade.id.slice(1)}Upgrade`;
  return { ...upgrade, button: document.getElementById(`${prefix}Btn`),
    label: document.getElementById(`${prefix}Label`), cost: document.getElementById(`${prefix}Cost`) };
});
const probabilizerPowerUpgradeControls = PROBABILIZER_POWER_UPGRADES.map(upgrade => {
  const suffix = upgrade.id.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('');
  const prefix = `probabilizerPower${suffix}Upgrade`;
  return { ...upgrade, button: document.getElementById(`${prefix}Btn`),
    label: document.getElementById(`${prefix}Label`), cost: document.getElementById(`${prefix}Cost`) };
});

function resetProbabilizerVisuals() {
  for (const point of probabilizerVisualDots) point.remove();
  probabilizerVisualDots.length = 0;
}

function resetProbabilizerRuntime() {
  resetProbabilizerVisuals();
  probabilizerLastTickAt = gameTimelineNowMs();
}

function setKnuthProductionView(view) {
  activeKnuthProductionView = view === 'space_expansion' && spaceExpansionUnlocked() ? view
    : view === 'probabilizer' ? view : 'black_hole';
  resetProbabilizerVisuals();
  renderKnuthProduction();
}

function renderKnuthProduction() {
  const expansionUnlocked = spaceExpansionUnlocked();
  if (activeKnuthProductionView === 'space_expansion' && !expansionUnlocked) activeKnuthProductionView = 'black_hole';
  const showingExpansion = activeKnuthProductionView === 'space_expansion';
  const showingProbabilizer = activeKnuthProductionView === 'probabilizer';
  const showingBlackHole = !showingExpansion && !showingProbabilizer;
  knuthSpaceExpansionTabBtn.classList.toggle('hidden', !expansionUnlocked);
  knuthSpaceExpansionTabBtn.classList.toggle('active', showingExpansion);
  knuthSpaceExpansionTabBtn.setAttribute('aria-selected', String(showingExpansion));
  knuthSpaceExpansionPanel.classList.toggle('hidden', !showingExpansion);
  knuthBlackHoleTabBtn.classList.toggle('active', showingBlackHole);
  knuthProbabilizerTabBtn.classList.toggle('active', showingProbabilizer);
  knuthBlackHoleTabBtn.setAttribute('aria-selected', String(showingBlackHole));
  knuthProbabilizerTabBtn.setAttribute('aria-selected', String(showingProbabilizer));
  knuthBlackHolePanel.classList.toggle('hidden', !showingBlackHole);
  knuthProbabilizerPanel.classList.toggle('hidden', !showingProbabilizer);
  if (showingExpansion) renderSpaceExpansionBoard();
  else if (showingProbabilizer) renderProbabilizerBoard();
  else renderNumberBlackHoleBoard();
}

function renderProbabilizerBoard() {
  const separated = independentUpgradePriceReferenceActive();
  const priceRule = document.getElementById('probabilizerPriceRule');
  if (priceRule) priceRule.textContent = `${separated ? '상승 기준 가격' : '현재 결제 가격'}이 1e500 KP부터 기존 지수 ×2에 더해, 1e100배 구간마다 가격 상승폭의 지수가 추가로 4배 됩니다. `
    + (separated ? '29-1 적용: 상승 기준은 원래 KP 가격 상승만 반영하고 결제 가격 가속은 반영하지 않습니다.'
      : '29-1 연구 시 결제 가격과 상승 기준을 분리합니다.');
  const available = probabilizerAvailable();
  probabilizerStatus.textContent = available ? '작동 중'
    : isKnuthChallengeActive('kc5') ? 'KC5 · 비활성' : '4그룹 확률자 구매 필요';
  probabilizerStatus.classList.toggle('active', available);
  probabilizerBoard.classList.toggle('hidden', !available);
  if (!available) return;
  randomPowerValue.textContent = fmtPowerBase(randomPower);
  const { a, b, mode, intervalMs } = probabilizerParameters();
  const rangeGrowth = probabilizerRangeGrowth();
  document.getElementById('probabilizerAUpgradeDescription').textContent =
    `시작점 a를 ${rangeGrowth}배 늘립니다. a는 b를 넘지 않습니다. 가격은 ×100, 1e500 KP부터 ×10k입니다.`;
  document.getElementById('probabilizerBUpgradeDescription').textContent =
    `끝점 b를 ${rangeGrowth}배 늘립니다.${hasAbstractionResearch('21-1') ? ' 상한은 1e308입니다.' : ''} 가격은 ×10, 1e500 KP부터 ×100입니다.`;
  probabilizerAValue.textContent = formatProbabilizerValue(a);
  probabilizerBValue.textContent = formatProbabilizerValue(b);
  probabilizerModeValue.textContent = formatProbabilizerValue(mode);
  const productionTimeMultiplier = abstractionProbabilizerTimeMultiplier();
  probabilizerIntervalValue.textContent = productionTimeMultiplier === 1
    ? `현실 시간 ${formatProbabilizerInterval(intervalMs)}`
    : `기본 ${formatProbabilizerInterval(intervalMs)} · 블랙홀 생산 시간 ×${formatProbabilizerValue(productionTimeMultiplier)}`;
  const minimumInterval = probabilizerMinimumInterval();
  const minimumText = formatProbabilizerInterval(minimumInterval);
  document.getElementById('probabilizerPowerGainValue').textContent = `×${fmtPowerBase(probabilizerPowerMultiplier())}`;
  document.getElementById('probabilizerMinimumIntervalValue').textContent = minimumText;
  document.getElementById('probabilizerSpeedUpgradeDescription').textContent =
    `추첨 간격을 20% 줄입니다. 최소 간격은 ${minimumText}입니다. 가격은 ×1e5, 1e500 KP부터 ×1e10입니다.`;
  probabilizerLastRollValue.textContent = probabilizerLastRoll === null ? '—'
    : `+${probabilizerLastRoll >= 1e6 ? fmtPowerBase(probabilizerLastRoll) : probabilizerLastRoll}`;
  const parameterMultiplier = probabilizerDivergerParameterMultiplier();
  const parameterMultiplierText = compareNumberValues(parameterMultiplier, 1000) < 0
    ? formatProbabilizerValue(NumberMath.toNumber(parameterMultiplier)) : fmtPowerBase(parameterMultiplier);
  probabilizerDivergerEffect.textContent = `각각 ×${parameterMultiplierText}`;
  probabilizerTimeLimitEffect.textContent = `×${fmtPowerBase(numberBlackHoleTimeLimit())}`;
  renderProbabilizerDistribution(a, b, mode);
  probabilizerTicks.forEach((tick, index) => {
    tick.textContent = formatProbabilizerValue(a + (b - a) * (index / 4));
    tick.style.visibility = a === b && index !== 2 ? 'hidden' : 'visible';
  });
  for (const { id, title, button, label, cost } of probabilizerUpgradeControls) {
    const maximum = probabilizerUpgradeAtMaximum(id);
    const price = probabilizerUpgradeCost(id);
    let effect;
    if (id === 'speed') effect = `${formatProbabilizerInterval(intervalMs)} → ${formatProbabilizerInterval(probabilizerParameters({ ...probabilizerUpgradeLevels, speed: probabilizerUpgradeLevels.speed + 1 }).intervalMs)}`;
    else {
      const current = id === 'shift' ? mode : id === 'a' ? a : b;
      const nextParameters = probabilizerParameters({ ...probabilizerUpgradeLevels, [id]: probabilizerUpgradeLevels[id] + 1 });
      const next = nextParameters[id === 'shift' ? 'mode' : id];
      effect = `${formatProbabilizerValue(current)} → ${formatProbabilizerValue(next)}`;
    }
    label.textContent = `${title} · ${price === null ? '계산 범위 초과' : maximum ? '최대' : effect}`;
    cost.textContent = price === null ? '비용이 큰수 표현 범위를 넘었습니다.' : maximum
      ? (id === 'speed' ? `최소 간격 ${minimumText}` : id === 'a' ? 'a는 b 이하' : id === 'shift' ? '분포 중심이 b에 도달' : '최대 범위')
      : `비용: ${NumberMath.isScientific(price) ? formatScientificParts(price.mantissa, price.exponent) : fmtPowerBase(price)} KP`;
    if (separated && !maximum) cost.textContent += ` · 상승 기준: ${fmtPowerBase(probabilizerUpgradeReferenceCost(id))} KP`;
    button.disabled = maximum || !probabilizerCanAffordCost(knuthPoints, price);
  }
  for (const { id, title, button, label, cost } of probabilizerPowerUpgradeControls) {
    const maximum = probabilizerPowerUpgradeAtMaximum(id);
    let effect;
    if (id === 'interval_floor') {
      effect = `${minimumText} → ${formatProbabilizerInterval(Math.max(Number.MIN_VALUE, minimumInterval / 2))}`;
    } else {
      const multiplier = NumberMath.power(id === 'gain' ? 3 : 1.5, probabilizerPowerUpgradeLevels[id]);
      effect = `×${compareNumberValues(multiplier, 1000) < 0
        ? formatProbabilizerValue(NumberMath.toNumber(multiplier)) : fmtPowerBase(multiplier)}`;
    }
    label.textContent = `${title} · ${maximum ? '최대' : effect}`;
    cost.textContent = maximum ? '계산 가능한 최댓값' : `비용: ${fmtPowerBase(probabilizerPowerUpgradeCost(id))} 무작위력`;
    button.disabled = maximum || compareNumberValues(randomPower, probabilizerPowerUpgradeCost(id)) < 0;
  }
}

function renderProbabilizerDistribution(a, b, mode) {
  const key = `${a}:${b}:${mode}`;
  if (key === probabilizerDistributionKey) return;
  probabilizerDistributionKey = key;
  for (const point of probabilizerVisualDots) {
    const value = Number(point.title);
    point.style.left = `${a === b ? 50 : Math.max(0, Math.min(100, (value - a) / (b - a) * 100))}%`;
  }
  // The pre-rounding triangular density has straight sides; normalize only its display height.
  const peak = a === b ? 50 : Math.max(0, Math.min(100, (mode - a) / (b - a) * 100));
  probabilizerDistribution.setAttribute('d', a === b
    ? 'M 50 100 L 50 8' : `M 0 100 L ${peak} 8 L 100 100 Z`);
  probabilizerPlot.setAttribute('aria-label', a === b
    ? `항상 ${a}을 추첨하는 확률 분포`
    : `${a}부터 ${b}까지의 추첨 수직선과 상대 확률밀도, 최빈값 ${mode}`);
}

function formatProbabilizerInterval(interval) {
  if (interval < 1) return `${Number(interval.toPrecision(4))}ms`;
  return interval >= 1000 ? `${Number((interval / 1000).toFixed(3))}초` : `${Number(interval.toFixed(3))}ms`;
}

function formatProbabilizerValue(value) {
  return value < 1000 ? String(Number(value.toFixed(2))) : fmtPowerBase(value);
}

function showProbabilizerRoll(value) {
  if (gameSessionPaused() || activeChapter !== 'knuth' || typeof activeKnuthView === 'undefined'
    || activeKnuthView !== 'production' || activeKnuthProductionView !== 'probabilizer') return;
  const point = document.createElement('span');
  point.className = 'probabilizer-point';
  const { a, b, intervalMs } = probabilizerParameters();
  point.style.left = `${a === b ? 50 : Math.max(0, Math.min(100, (value - a) / (b - a) * 100))}%`;
  point.title = String(value);
  point.addEventListener('animationend', () => point.remove(), { once: true });
  probabilizerDots.appendChild(point);
  probabilizerVisualDots.push(point);
  const visualLimit = Math.ceil(2000 / Math.max(100, intervalMs)) + 1;
  while (probabilizerVisualDots.length > visualLimit) probabilizerVisualDots.shift().remove();
}

knuthBlackHoleTabBtn.addEventListener('click', () => setKnuthProductionView('black_hole'));
knuthProbabilizerTabBtn.addEventListener('click', () => setKnuthProductionView('probabilizer'));
for (const { id, button } of probabilizerUpgradeControls) {
  button.addEventListener('click', () => {
    tickProbabilizer();
    if (buyProbabilizerUpgrade(id)) resetProbabilizerVisuals();
  });
}
for (const { id, button } of probabilizerPowerUpgradeControls) {
  button.addEventListener('click', () => {
    tickProbabilizer();
    buyProbabilizerPowerUpgrade(id);
  });
}

function tickProbabilizer() {
  const now = gameTimelineNowMs();
  const elapsedMs = Math.max(0, now - probabilizerLastTickAt);
  probabilizerLastTickAt = now;
  if (advanceProbabilizer(elapsedMs)) {
    showProbabilizerRoll(probabilizerLastRoll);
    render();
  }
}
setGameInterval(() => tickProbabilizer(), 100);
