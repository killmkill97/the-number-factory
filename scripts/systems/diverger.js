let activeProductionView = 'dimensions';

function formatDivergerScientific(value) {
  const scientific = NumberMath.toScientific(value);
  if (!scientific) return '0e0';
  return formatScientificParts(scientific.mantissa, scientific.exponent);
}

function formatDivergerInterval(interval) {
  if (interval >= 1000) return `${(interval / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초`;
  return `${interval.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}ms`;
}

function formatDivergerProduction(logarithm) {
  return formatDivergerScientific(logarithm);
}

function setProductionView(view) {
  activeProductionView = view === 'diverger' ? 'diverger' : 'dimensions';
  if (typeof invalidateSquareControlRender === 'function') invalidateSquareControlRender();
  else render();
}

function renderProductionSubView() {
  const dimensionsAvailable = squareDimensionAvailable();
  const divergerUnlocked = divergerAvailable();
  if (!dimensionsAvailable && activeProductionView === 'dimensions') activeProductionView = 'diverger';
  if (!divergerUnlocked && activeProductionView === 'diverger') activeProductionView = 'dimensions';

  const showingDimensions = dimensionsAvailable && activeProductionView === 'dimensions';
  const showingDiverger = divergerUnlocked && activeProductionView === 'diverger';
  squareDimensionProductionTabBtn?.classList.toggle('hidden', !dimensionsAvailable);
  divergerProductionTabBtn?.classList.toggle('hidden', !divergerUnlocked);
  squareDimensionProductionTabBtn?.classList.toggle('active', showingDimensions);
  divergerProductionTabBtn?.classList.toggle('active', showingDiverger);
  squareDimensionProductionTabBtn?.setAttribute('aria-selected', String(showingDimensions));
  divergerProductionTabBtn?.setAttribute('aria-selected', String(showingDiverger));
  squareDimensionProductionPanel?.classList.toggle('hidden', !showingDimensions);
  divergerProductionPanel?.classList.toggle('hidden', !showingDiverger);
}

function renderDivergerGraph() {
  if (!divergerGraphLine) return;
  const samples = divergerGraphSamples.filter(value => Number.isFinite(value));
  if (samples.length < 2) {
    divergerGraphLine.setAttribute('points', '0,20 100,20');
    return;
  }

  const minimum = divergerGraphScaleMinimum ?? Math.min(...samples);
  const maximum = divergerGraphScaleMaximum ?? Math.max(...samples);
  const range = Math.max(0.12, maximum - minimum);
  const points = samples.map((value, index) => {
    const x = (index / (samples.length - 1)) * 100;
    const normalized = Math.max(0, Math.min(1, (value - minimum) / range));
    const y = 36 - (normalized * 32);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  divergerGraphLine.setAttribute('points', points.join(' '));
}

function renderDivergerView() {
  renderProductionSubView();
  if (!divergerAvailable()) return;
  const autoAvailable = divergerAutoUpgradeAvailable();
  divergerAutoUpgradeBtn.classList.toggle('hidden', !autoAvailable);
  divergerAutoUpgradeBtn.classList.toggle('toggle-active', autoAvailable && divergerAutoUpgradeEnabled);
  divergerAutoUpgradeBtn.classList.toggle('toggle-inactive', autoAvailable && !divergerAutoUpgradeEnabled);
  divergerAutoUpgradeBtn.setAttribute('aria-pressed', String(divergerAutoUpgradeEnabled));
  divergerAutoUpgradeBtn.textContent = `발산자 자동 업그레이드 · ${divergerAutoUpgradeEnabled ? 'ON' : 'OFF'}`;

  const developerConsoleOpen = typeof devConsoleIsOpen === 'function' && devConsoleIsOpen();
  const minimumInterval = divergerMinInterval();
  const production = divergerProductionValue(divergerN);
  const nextInterval = divergerInterval <= minimumInterval
    ? minimumInterval
    : divergerNextInterval();
  const cAtMaximum = divergerC >= DIVERGER_C_MAX;

  divergerPowerValue.textContent = formatDivergerScientific(divergerPower);
  const enhancedParameters = ['14-1', '14-2', '14-3'].some(hasAbstractionResearch);
  const bSymbol = hasAbstractionResearch('4-2') || enhancedParameters ? 'b효과' : 'b';
  const aSymbol = enhancedParameters ? 'a효과' : 'a';
  const cSymbol = enhancedParameters ? 'c효과' : 'c';
  const denominatorText = enhancedParameters ? `max(1, 100 - ${cSymbol})` : '(100 - c)';
  const formula = hasGeneralizationResearch('5-3')
    ? `D(n) = ${aSymbol}^2 × n^(${bSymbol}+${cSymbol}/2) / ${denominatorText}`
    : `D(n) = ${aSymbol} × n^${bSymbol} / ${denominatorText}`;
  divergerPowerSubValue.textContent = `${formula} · 현재 +${formatDivergerProduction(production)} / ${formatDivergerInterval(divergerEffectiveInterval())}`;
  divergerSoftcapValue.textContent = `제곱력 생산 및 최종 숫자 생산 배율 ×${formatDivergerScientific(divergerSquareDimensionMultiplier())}`;
  divergerNValue.textContent = formatDivergerScientific(divergerN);
  divergerAValue.textContent = compareNumberValues(abstractionEffectiveDivergerA(), divergerA) === 0
    ? formatDivergerScientific(divergerA)
    : `${formatDivergerScientific(divergerA)} → ${formatDivergerScientific(abstractionEffectiveDivergerA())}`;
  const baseBText = divergerB.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  const effectiveBText = abstractionEffectiveDivergerB().toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  divergerBValue.textContent = abstractionEffectiveDivergerB() !== divergerB
    ? `${baseBText} → ${effectiveBText}`
    : baseBText;
  divergerCValue.textContent = `${divergerC} / ${DIVERGER_C_MAX}${abstractionEffectiveDivergerC() !== divergerC ? ` → 효과 ${abstractionEffectiveDivergerC().toFixed(3)} · 분모 ${divergerDenominator().toFixed(3)}` : ''}`;
  divergerIntervalValue.textContent = formatDivergerInterval(divergerEffectiveInterval());

  divergerAUpgradeLabel.textContent = `a 강화 · ${formatDivergerScientific(divergerA)} → ${formatDivergerScientific(multiplyNumberValue(divergerA, 2))}`;
  divergerAUpgradeCost.textContent = `비용: ${fmtPowerBase(divergerACpCost)} CP`;
  divergerAUpgradeBtn.disabled = !developerConsoleOpen
    && !divergerCanAfford(divergerACpCost);

  divergerBUpgradeLabel.textContent = `b 강화 · ${divergerB.toFixed(6)} → ${(divergerB + divergerBUpgradeGain()).toFixed(6)}`;
  divergerBUpgradeCost.textContent = `비용: ${fmtPowerBase(divergerBCpCost)} CP`;
  divergerBUpgradeBtn.disabled = !developerConsoleOpen
    && !divergerCanAfford(divergerBCpCost);

  divergerCUpgradeLabel.textContent = cAtMaximum
    ? 'c 강화 · 최대'
    : `c 강화 · ${divergerC} → ${divergerC + 1}`;
  divergerCUpgradeCost.textContent = cAtMaximum
    ? '최대 강화 · 분모 1'
    : `비용: ${fmtPowerBase(divergerCCpCost)} CP`;
  divergerCUpgradeBtn.disabled = !developerConsoleOpen
    && (cAtMaximum || !divergerCanAfford(divergerCCpCost));

  divergerSpeedUpgradeLabel.textContent = divergerInterval <= minimumInterval
    ? '발산자 속도 강화 · 최대'
    : `발산자 속도 강화 · ${formatDivergerInterval(divergerInterval)} → ${formatDivergerInterval(nextInterval)}`;
  divergerSpeedUpgradeCost.textContent = divergerInterval <= minimumInterval
    ? `최소 간격 ${formatDivergerInterval(minimumInterval)}`
    : `비용: ${fmtPowerBase(divergerSpeedCpCost)} CP`;
  divergerSpeedUpgradeBtn.disabled = !developerConsoleOpen
    && (divergerInterval <= minimumInterval
      || !divergerCanAfford(divergerSpeedCpCost));
  renderDivergerGraph();
}

squareDimensionProductionTabBtn?.addEventListener('click', () => setProductionView('dimensions'));
divergerProductionTabBtn?.addEventListener('click', () => setProductionView('diverger'));
divergerAUpgradeBtn?.addEventListener('click', buyDivergerAUpgrade);
divergerBUpgradeBtn?.addEventListener('click', buyDivergerBUpgrade);
divergerCUpgradeBtn?.addEventListener('click', buyDivergerCUpgrade);
divergerSpeedUpgradeBtn?.addEventListener('click', buyDivergerSpeedUpgrade);
divergerAutoUpgradeBtn?.addEventListener('click', toggleDivergerAutoUpgrade);

const DIVERGER_TICK_MS = 10;
let divergerLastTick = gameClockNowMs();
setInterval(() => {
  const { now, elapsedMs } = elapsedRealTimeSince(divergerLastTick);
  divergerLastTick = now;
  const upgraded = advanceDivergerAutoUpgrade(elapsedMs);
  if (advanceDiverger(elapsedMs) || upgraded) render();
}, DIVERGER_TICK_MS);
