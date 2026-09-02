let activeSquareView = 'upgrades';

function formatSquareDimensionScientific(value) {
  const scientific = NumberMath.toScientific(value);
  if (!scientific) return '0e0';
  return `${compactMantissa(scientific.mantissa)}e${scientific.exponent}`;
}

function formatSquareDimensionSide(sideValue) {
  const lengthValue = squareDimensionLengthValue(sideValue);
  return formatSquareDimensionScientific(lengthValue);
}

function formatSquareDimensionNumber(value) {
  return formatSquareDimensionScientific(value);
}

function formatSquareDimensionDuration(milliseconds) {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  return `${(milliseconds / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초`;
}

function renderSquareDimensionView() {
  if (!squareDimensionsViewBtn || !squareUpgradesViewPanel || !squareDimensionsViewPanel) return;

  const available = squareDimensionAvailable();
  squareDimensionsViewBtn.classList.toggle('hidden', !available);
  if (!available && activeSquareView === 'dimensions') activeSquareView = 'upgrades';

  const showingDimensions = available && activeSquareView === 'dimensions';
  squareUpgradesViewPanel.classList.toggle('hidden', showingDimensions);
  squareDimensionsViewPanel.classList.toggle('hidden', !showingDimensions);
  squareUpgradesViewBtn.classList.toggle('active', !showingDimensions);
  squareDimensionsViewBtn.classList.toggle('active', showingDimensions);
  squareUpgradesViewBtn.setAttribute('aria-selected', String(!showingDimensions));
  squareDimensionsViewBtn.setAttribute('aria-selected', String(showingDimensions));

  if (!available) return;

  const x = squareDimensionSideValue('x');
  const y = squareDimensionSideValue('y');
  const xText = formatSquareDimensionSide(x);
  const yText = formatSquareDimensionSide(y);
  const xGrowthRate = squareDimensionSideGrowthRate('x');
  const yGrowthRate = squareDimensionSideGrowthRate('y');
  const xCost = squareDimensionSideCost('x');
  const yCost = squareDimensionSideCost('y');

  squareDimensionPowerValue.textContent = formatSquareDimensionNumber(squareDimensionPower());
  squareDimensionPowerSubValue.textContent = `제곱력 = (x × y)^(1/${squareDimensionPowerExponent() === 0.5 ? 2 : 4}) · 생산 주기 ${formatSquareDimensionDuration(squareDimensionPowerInterval)}`;
  squareDimensionMultiplierValue.textContent = `기본 숫자 생산 배율 ×${formatSquareDimensionNumber(squareDimensionNumberMultiplier())}`;
  squareDimensionShapeLabel.textContent = `${xText} × ${yText}`;
  squareDimensionXValue.textContent = xText;
  squareDimensionYValue.textContent = yText;
  squareDimensionXLabel.textContent = 'x 성장 배율 +1';
  squareDimensionYLabel.textContent = 'y 성장 배율 +1';
  if (squareDimensionXRate) {
    squareDimensionXRate.textContent = `초당 +${formatSquareDimensionSide(xGrowthRate)} · 배율 ×${fmtPowerBase(squareDimensionSideGrowthLevel('x'))}`;
  }
  if (squareDimensionYRate) {
    squareDimensionYRate.textContent = `초당 +${formatSquareDimensionSide(yGrowthRate)} · 배율 ×${fmtPowerBase(squareDimensionSideGrowthLevel('y'))}`;
  }
  squareDimensionXCostEl.textContent = `비용: ${fmtPowerBase(xCost)} SP`;
  squareDimensionYCostEl.textContent = `비용: ${fmtPowerBase(yCost)} SP`;
  squareDimensionXBtn.disabled = compareNumberValues(squarePoints, xCost) < 0;
  squareDimensionYBtn.disabled = compareNumberValues(squarePoints, yCost) < 0;

  if (squareDimensionPowerTimeBtn && squareDimensionPowerTimeLabel && squareDimensionPowerTimeCost) {
    const atMaximumSpeed = squareDimensionPowerInterval <= SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL;
    const nextInterval = Math.max(
      SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL,
      Math.ceil(squareDimensionPowerInterval / 2)
    );
    squareDimensionPowerTimeLabel.textContent = atMaximumSpeed
      ? '제곱력 생산 시간 강화 · 최대'
      : `제곱력 생산 시간 강화 · ${formatSquareDimensionDuration(squareDimensionPowerInterval)} → ${formatSquareDimensionDuration(nextInterval)}`;
    squareDimensionPowerTimeCost.textContent = atMaximumSpeed
      ? '최대 속도 (1ms)'
      : `비용: ${fmtPowerBase(squareDimensionPowerIntervalCost)} SP`;
    squareDimensionPowerTimeBtn.disabled = atMaximumSpeed
      || compareNumberValues(squarePoints, squareDimensionPowerIntervalCost) < 0;
  }

  if (squareDimensionPowerStrengthBtn && squareDimensionPowerStrengthLabel && squareDimensionPowerStrengthCost) {
    squareDimensionPowerStrengthLabel.textContent = squareDimensionPowerStrengthUnlocked
      ? '제곱력 생산 강화 · 적용됨'
      : '제곱력 생산 강화 · 지수 1/4 → 1/2';
    squareDimensionPowerStrengthCost.textContent = squareDimensionPowerStrengthUnlocked
      ? '구매 완료'
      : `비용: ${fmtPowerBase(SQUARE_DIMENSION_POWER_STRENGTH_COST)} SP`;
    squareDimensionPowerStrengthBtn.disabled = squareDimensionPowerStrengthUnlocked
      || compareNumberValues(squarePoints, SQUARE_DIMENSION_POWER_STRENGTH_COST) < 0;
    squareDimensionPowerStrengthBtn.classList.toggle('bought', squareDimensionPowerStrengthUnlocked);
  }

  const xNumeric = realNumberFromValue(squareDimensionLengthValue(x));
  const yNumeric = realNumberFromValue(squareDimensionLengthValue(y));
  if (Number.isFinite(xNumeric) && Number.isFinite(yNumeric) && yNumeric > 0) {
    const ratio = Math.min(2.6, Math.max(0.65, xNumeric / yNumeric));
    squareDimensionShapeLabel.parentElement.style.width = `${Math.round(180 * ratio)}px`;
  }
}

function setSquareView(view) {
  activeSquareView = view === 'dimensions' ? 'dimensions' : 'upgrades';
  renderSquareDimensionView();
}

if (squareUpgradesViewBtn) {
  squareUpgradesViewBtn.addEventListener('click', () => setSquareView('upgrades'));
}
if (squareDimensionsViewBtn) {
  squareDimensionsViewBtn.addEventListener('click', () => setSquareView('dimensions'));
}
if (squareDimensionXBtn) {
  squareDimensionXBtn.addEventListener('click', () => buySquareDimensionSide('x'));
}
if (squareDimensionYBtn) {
  squareDimensionYBtn.addEventListener('click', () => buySquareDimensionSide('y'));
}
if (squareDimensionPowerTimeBtn) {
  squareDimensionPowerTimeBtn.addEventListener('click', buySquareDimensionPowerTimeUpgrade);
}
if (squareDimensionPowerStrengthBtn) {
  squareDimensionPowerStrengthBtn.addEventListener('click', buySquareDimensionPowerStrength);
}

const SQUARE_DIMENSION_TICK_MS = 100;
setInterval(() => {
  const elapsedMs = gameTick(SQUARE_DIMENSION_TICK_MS);
  if (advanceSquareDimensions(elapsedMs)) render();
}, SQUARE_DIMENSION_TICK_MS);
