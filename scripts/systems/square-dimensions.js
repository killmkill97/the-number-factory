let activeSquareView = 'upgrades';
let secondarySquareDimensionUi = null;

const primarySquareDimensionUi = {
  powerValue: squareDimensionPowerValue,
  powerSubValue: squareDimensionPowerSubValue,
  multiplierValue: squareDimensionMultiplierValue,
  softcapValue: squareDimensionSoftcapValue,
  shapeLabel: squareDimensionShapeLabel,
  xValue: squareDimensionXValue,
  yValue: squareDimensionYValue,
  zValue: squareDimensionZValue,
  xRate: squareDimensionXRate,
  yRate: squareDimensionYRate,
  zRate: squareDimensionZRate,
  xBtn: squareDimensionXBtn,
  yBtn: squareDimensionYBtn,
  zBtn: squareDimensionZBtn,
  xMaxBtn: squareDimensionXMaxBtn,
  yMaxBtn: squareDimensionYMaxBtn,
  zMaxBtn: squareDimensionZMaxBtn,
  xLabel: squareDimensionXLabel,
  yLabel: squareDimensionYLabel,
  zLabel: squareDimensionZLabel,
  xCost: squareDimensionXCostEl,
  yCost: squareDimensionYCostEl,
  zCost: squareDimensionZCostEl,
  powerTimeBtn: squareDimensionPowerTimeBtn,
  powerTimeLabel: squareDimensionPowerTimeLabel,
  powerTimeCost: squareDimensionPowerTimeCost,
  powerStrengthBtn: squareDimensionPowerStrengthBtn,
  powerStrengthLabel: squareDimensionPowerStrengthLabel,
  powerStrengthCost: squareDimensionPowerStrengthCost
};

function formatSquareDimensionScientific(value) {
  const scientific = NumberMath.toScientific(value);
  if (!scientific) return '0e0';
  return `${compactMantissa(scientific.mantissa)}e${scientific.exponent}`;
}

function formatSquareDimensionSide(sideValue) {
  return formatSquareDimensionScientific(squareDimensionLengthValue(sideValue));
}

function formatSquareDimensionNumber(value) {
  return formatSquareDimensionScientific(value);
}

function formatSquareDimensionDuration(milliseconds) {
  if (milliseconds < 1000) return `${milliseconds}ms`;
  return `${(milliseconds / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초`;
}

function squareDimensionPowerExponentText(exponent) {
  if (exponent === 3) return '3';
  if (exponent === 2) return '2';
  if (exponent === 1) return '1';
  if (exponent === 0.5) return '1/2';
  if (exponent === 0.25) return '1/4';
  if (exponent === (1 / 3)) return '1/3';
  return '1/6';
}

function squareDimensionPowerFormulaText(index, exponent) {
  const variables = hasGeneralizationResearch('5-1') ? 'x × y × z' : 'x × y';
  return `(${variables})^(${squareDimensionPowerExponentText(exponent)})`;
}

function ensureSecondarySquareDimensionUi() {
  if (secondarySquareDimensionUi || !squareDimensionAdditional) return secondarySquareDimensionUi;

  squareDimensionAdditional.innerHTML = `
    <div class="square-dimension-instance">
      <div class="section-title">제곱 차원 2</div>
      <div class="display square-display square-dimension-display">
        <div class="value" data-role="power-value">0e0</div>
        <div class="sub" data-role="power-sub-value"></div>
        <div class="sub" data-role="multiplier-value"></div>
        <div class="sub hidden" data-role="softcap-value"></div>
      </div>
      <div class="square-dimension-board">
        <div class="square-dimension-rectangle" aria-hidden="true">
          <span data-role="shape-label"></span>
        </div>
        <div class="square-dimension-sides">
          <div class="square-dimension-side">
            <div class="square-dimension-side-label">x 변</div>
            <div class="square-dimension-side-value" data-role="x-value"></div>
            <div class="square-dimension-side-rate" data-role="x-rate"></div>
            <button type="button" data-role="x-btn">
              <span data-role="x-label"></span>
              <span class="cost" data-role="x-cost"></span>
            </button>
            <button class="square-dimension-max-btn" type="button" data-role="x-max-btn" title="사용 가능한 SP로 최대 구매" aria-label="x 성장 배율 최대 구매">최대</button>
          </div>
          <div class="square-dimension-side">
            <div class="square-dimension-side-label">y 변</div>
            <div class="square-dimension-side-value" data-role="y-value"></div>
            <div class="square-dimension-side-rate" data-role="y-rate"></div>
            <button type="button" data-role="y-btn">
              <span data-role="y-label"></span>
              <span class="cost" data-role="y-cost"></span>
            </button>
            <button class="square-dimension-max-btn" type="button" data-role="y-max-btn" title="사용 가능한 SP로 최대 구매" aria-label="y 성장 배율 최대 구매">최대</button>
          </div>
          <div class="square-dimension-side">
            <div class="square-dimension-side-label">z 변</div>
            <div class="square-dimension-side-value" data-role="z-value"></div>
            <div class="square-dimension-side-rate" data-role="z-rate"></div>
            <button type="button" data-role="z-btn">
              <span data-role="z-label"></span>
              <span class="cost" data-role="z-cost"></span>
            </button>
            <button class="square-dimension-max-btn" type="button" data-role="z-max-btn" title="사용 가능한 SP로 최대 구매" aria-label="z 성장 배율 최대 구매">최대</button>
          </div>
        </div>
      </div>
      <div class="section-title">제곱력 업그레이드</div>
      <div class="square-dimension-upgrades">
        <button type="button" data-role="power-time-btn">
          <span data-role="power-time-label">제곱력 생산 시간 강화</span>
          <span class="cost" data-role="power-time-cost"></span>
        </button>
        <button type="button" data-role="power-strength-btn">
          <span data-role="power-strength-label">제곱력 생산 강화</span>
          <span class="cost" data-role="power-strength-cost"></span>
        </button>
      </div>
    </div>
  `;

  const root = squareDimensionAdditional.querySelector('.square-dimension-instance');
  const find = role => root.querySelector(`[data-role="${role}"]`);
  secondarySquareDimensionUi = {
    powerValue: find('power-value'),
    powerSubValue: find('power-sub-value'),
    multiplierValue: find('multiplier-value'),
    softcapValue: find('softcap-value'),
    shapeLabel: find('shape-label'),
    xValue: find('x-value'),
    yValue: find('y-value'),
    zValue: find('z-value'),
    xRate: find('x-rate'),
    yRate: find('y-rate'),
    zRate: find('z-rate'),
    xBtn: find('x-btn'),
    yBtn: find('y-btn'),
    zBtn: find('z-btn'),
    xMaxBtn: find('x-max-btn'),
    yMaxBtn: find('y-max-btn'),
    zMaxBtn: find('z-max-btn'),
    xLabel: find('x-label'),
    yLabel: find('y-label'),
    zLabel: find('z-label'),
    xCost: find('x-cost'),
    yCost: find('y-cost'),
    zCost: find('z-cost'),
    powerTimeBtn: find('power-time-btn'),
    powerTimeLabel: find('power-time-label'),
    powerTimeCost: find('power-time-cost'),
    powerStrengthBtn: find('power-strength-btn'),
    powerStrengthLabel: find('power-strength-label'),
    powerStrengthCost: find('power-strength-cost')
  };

  secondarySquareDimensionUi.xBtn.addEventListener('click', () => buySquareDimensionSide('x', 1));
  secondarySquareDimensionUi.yBtn.addEventListener('click', () => buySquareDimensionSide('y', 1));
  secondarySquareDimensionUi.zBtn.addEventListener('click', () => buySquareDimensionSide('z', 1));
  secondarySquareDimensionUi.xMaxBtn.addEventListener('click', () => buySquareDimensionSideMaximum('x', 1));
  secondarySquareDimensionUi.yMaxBtn.addEventListener('click', () => buySquareDimensionSideMaximum('y', 1));
  secondarySquareDimensionUi.zMaxBtn.addEventListener('click', () => buySquareDimensionSideMaximum('z', 1));
  secondarySquareDimensionUi.powerTimeBtn.addEventListener('click', () => buySquareDimensionPowerTimeUpgrade(1));
  secondarySquareDimensionUi.powerStrengthBtn.addEventListener('click', () => buySquareDimensionPowerStrength(1));
  return secondarySquareDimensionUi;
}

function renderSquareDimensionCard(ui, index) {
  const dimension = squareDimensionState(index);
  const x = squareDimensionSideValue('x', index);
  const y = squareDimensionSideValue('y', index);
  const z = squareDimensionSideValue('z', index);
  const xText = formatSquareDimensionSide(x);
  const yText = formatSquareDimensionSide(y);
  const zText = formatSquareDimensionSide(z);
  const xGrowthRate = squareDimensionSideGrowthRate('x', index);
  const yGrowthRate = squareDimensionSideGrowthRate('y', index);
  const zGrowthRate = squareDimensionSideGrowthRate('z', index);
  const xCost = squareDimensionSideCost('x', index);
  const yCost = squareDimensionSideCost('y', index);
  const zCost = squareDimensionSideCost('z', index);
  const exponent = squareDimensionPowerExponent(index);
  const generalized = hasGeneralizationResearch('5-1');
  const contributionPower = generalized ? 3 : 2;
  const squaredContribution = hasGeneralizationResearch('6-1');
  const powerStrengthResearch = hasGeneralizationResearch('6-2');
  const softcapExtensionResearch = hasGeneralizationResearch('6-4');
  const contributionExponent = contributionPower * (squaredContribution ? 2 : 1);

  ui.powerValue.textContent = formatSquareDimensionNumber(squareDimensionPower(index));
  ui.powerSubValue.textContent = `제곱력 = ${squareDimensionPowerFormulaText(index, exponent)} · 숫자 생산 기여 제곱력^${contributionExponent} · 생산 주기 ${formatSquareDimensionDuration(dimension.powerInterval)}`;
  ui.multiplierValue.textContent = `기본 숫자 생산 배율 ×${formatSquareDimensionNumber(squareDimensionNumberMultiplier(index))}`;
  ui.softcapValue.classList.toggle('hidden', !softcapExtensionResearch);
  ui.softcapValue.textContent = softcapExtensionResearch
    ? `제곱력 ${fmtPowerBase(squareDimensionTotalPower())} · 소프트캡 확장 ×${fmtPowerBase(squareDimensionPercentSoftcapMultiplier())} · 현재 소프트캡 ${fmtPowerBase(percentPowerSoftcap(percentPower))}`
    : '';
  ui.shapeLabel.textContent = generalized ? `${xText} × ${yText} × ${zText}` : `${xText} × ${yText}`;
  ui.xValue.textContent = xText;
  ui.yValue.textContent = yText;
  ui.zValue.textContent = zText;
  ui.xLabel.textContent = 'x 성장 배율 +1';
  ui.yLabel.textContent = 'y 성장 배율 +1';
  ui.zLabel.textContent = generalized ? 'z 성장 배율 +1' : 'z 성장 배율 · 잠김';
  ui.xRate.textContent = `초당 +${formatSquareDimensionSide(xGrowthRate)} · 배율 ×${fmtPowerBase(squareDimensionSideGrowthLevel('x', index))}`;
  ui.yRate.textContent = `초당 +${formatSquareDimensionSide(yGrowthRate)} · 배율 ×${fmtPowerBase(squareDimensionSideGrowthLevel('y', index))}`;
  ui.zRate.textContent = generalized
    ? `초당 +${formatSquareDimensionSide(zGrowthRate)} · 배율 ×${fmtPowerBase(squareDimensionSideGrowthLevel('z', index))}`
    : '차원 일반화 연구 필요';
  ui.xCost.textContent = `비용: ${fmtPowerBase(xCost)} SP`;
  ui.yCost.textContent = `비용: ${fmtPowerBase(yCost)} SP`;
  ui.zCost.textContent = generalized ? `비용: ${fmtPowerBase(zCost)} SP` : '차원 일반화 연구 필요';
  ui.xBtn.disabled = compareNumberValues(squarePoints, xCost) < 0;
  ui.yBtn.disabled = compareNumberValues(squarePoints, yCost) < 0;
  ui.zBtn.disabled = !generalized || compareNumberValues(squarePoints, zCost) < 0;
  ui.xMaxBtn.disabled = compareNumberValues(squarePoints, xCost) < 0;
  ui.yMaxBtn.disabled = compareNumberValues(squarePoints, yCost) < 0;
  ui.zMaxBtn.disabled = !generalized || compareNumberValues(squarePoints, zCost) < 0;

  const atMaximumSpeed = dimension.powerInterval <= SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL;
  const nextInterval = Math.max(
    SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL,
    Math.ceil(dimension.powerInterval / 2)
  );
  ui.powerTimeLabel.textContent = atMaximumSpeed
    ? '제곱력 생산 시간 강화 · 최대'
    : `제곱력 생산 시간 강화 · ${formatSquareDimensionDuration(dimension.powerInterval)} → ${formatSquareDimensionDuration(nextInterval)}`;
  ui.powerTimeCost.textContent = atMaximumSpeed
    ? '최대 속도 (1ms)'
    : `비용: ${fmtPowerBase(dimension.powerIntervalCost)} SP`;
  ui.powerTimeBtn.disabled = atMaximumSpeed
    || compareNumberValues(squarePoints, dimension.powerIntervalCost) < 0;

  const powerStrengthCost = multiplyNumberValue(
    SQUARE_DIMENSION_POWER_STRENGTH_COST,
    index === 0 ? 1n : 2n
  );
  ui.powerStrengthLabel.textContent = powerStrengthResearch
    ? '제곱력 생산 강화 · 6-2 연구 적용'
    : dimension.powerStrengthUnlocked
      ? '제곱력 생산 강화 · 적용됨'
      : generalized
        ? '제곱력 생산 강화 · 지수 1/6 → 1/3'
        : '제곱력 생산 강화 · 지수 1/4 → 1/2';
  ui.powerStrengthCost.textContent = powerStrengthResearch || dimension.powerStrengthUnlocked
    ? '연구 완료'
    : `비용: ${fmtPowerBase(powerStrengthCost)} SP`;
  ui.powerStrengthBtn.disabled = powerStrengthResearch || dimension.powerStrengthUnlocked
    || compareNumberValues(squarePoints, powerStrengthCost) < 0;
  ui.powerStrengthBtn.classList.toggle('bought', powerStrengthResearch || dimension.powerStrengthUnlocked);

  const xNumeric = realNumberFromValue(squareDimensionLengthValue(x));
  const yNumeric = realNumberFromValue(squareDimensionLengthValue(y));
  if (Number.isFinite(xNumeric) && Number.isFinite(yNumeric) && yNumeric > 0) {
    const ratio = Math.min(2.6, Math.max(0.65, xNumeric / yNumeric));
    ui.shapeLabel.parentElement.style.width = `${Math.round(180 * ratio)}px`;
  }
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

  if (!available) {
    squareDimensionAdditional?.classList.add('hidden');
    return;
  }

  const autoUpgradeAvailable = squareDimensionAutoUpgradeAvailable();
  squareDimensionAutoUpgradeBtn.disabled = !autoUpgradeAvailable;
  squareDimensionAutoUpgradeBtn.classList.toggle('toggle-active', autoUpgradeAvailable && squareDimensionAutoUpgradeEnabled);
  squareDimensionAutoUpgradeBtn.classList.toggle('toggle-inactive', autoUpgradeAvailable && !squareDimensionAutoUpgradeEnabled);
  squareDimensionAutoUpgradeLabel.textContent = autoUpgradeAvailable
    ? `제곱 차원 자동 업그레이드 · ${squareDimensionAutoUpgradeEnabled ? 'ON' : 'OFF'}`
    : '제곱 차원 자동 업그레이드 · 잠김';
  squareDimensionAutoUpgradeStatus.textContent = autoUpgradeAvailable
    ? '변·생산 시간·생산력 업글 자동 구매'
    : '일반화 7-3 연구 필요';

  renderSquareDimensionCard(primarySquareDimensionUi, 0);
  if (squareDimensionCount() > 1) {
    const secondUi = ensureSecondarySquareDimensionUi();
    squareDimensionAdditional?.classList.remove('hidden');
    if (secondUi) renderSquareDimensionCard(secondUi, 1);
  } else {
    squareDimensionAdditional?.classList.add('hidden');
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
  squareDimensionXBtn.addEventListener('click', () => buySquareDimensionSide('x', 0));
}
if (squareDimensionYBtn) {
  squareDimensionYBtn.addEventListener('click', () => buySquareDimensionSide('y', 0));
}
if (squareDimensionZBtn) {
  squareDimensionZBtn.addEventListener('click', () => buySquareDimensionSide('z', 0));
}
if (squareDimensionXMaxBtn) {
  squareDimensionXMaxBtn.addEventListener('click', () => buySquareDimensionSideMaximum('x', 0));
}
if (squareDimensionYMaxBtn) {
  squareDimensionYMaxBtn.addEventListener('click', () => buySquareDimensionSideMaximum('y', 0));
}
if (squareDimensionZMaxBtn) {
  squareDimensionZMaxBtn.addEventListener('click', () => buySquareDimensionSideMaximum('z', 0));
}
if (squareDimensionPowerTimeBtn) {
  squareDimensionPowerTimeBtn.addEventListener('click', () => buySquareDimensionPowerTimeUpgrade(0));
}
if (squareDimensionPowerStrengthBtn) {
  squareDimensionPowerStrengthBtn.addEventListener('click', () => buySquareDimensionPowerStrength(0));
}
if (squareDimensionAutoUpgradeBtn) {
  squareDimensionAutoUpgradeBtn.addEventListener('click', toggleSquareDimensionAutoUpgrade);
}

const SQUARE_DIMENSION_TICK_MS = 100;
setInterval(() => {
  const elapsedMs = gameTick(SQUARE_DIMENSION_TICK_MS);
  if (advanceSquareDimensions(elapsedMs)) render();
}, SQUARE_DIMENSION_TICK_MS);
