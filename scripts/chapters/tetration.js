const tetrationDimensionUi = [];
const tetrationUpgradeUi = {};

function tetrationDimensionName(index) {
  return `${index + 1}차원`;
}

function tetrationDimensionTargetName(index) {
  return index === 0 ? 'LSP' : tetrationDimensionName(index - 1);
}

function tetrationDimensionProduction(index) {
  const amount = tetrationDimensions[index];
  if (!isPositiveNumberValue(amount)) return 0n;
  return divideNumberValue(
    multiplyNumberValue(amount, tetrationDimensionMultiplierUnits(index)),
    4n
  );
}

function tetrationDimensionMultiplierUnits(index) {
  const purchases = tetrationDimensionPurchases[index];
  if (compareNumberValues(purchases, 1n) <= 0) return 4n;
  if (compareNumberValues(purchases, 2n) === 0) return 8n;
  return addBaseNumbers(16n, subtractNumberValues(purchases, 3n));
}

function tetrationDimensionMultiplierText(index) {
  const units = tetrationDimensionMultiplierUnits(index);
  if (!isApproximateNumber(units)) {
    const whole = units / 4n;
    const remainder = units % 4n;
    if (remainder === 0n) return fmtPowerBase(whole);
    const decimal = remainder === 1n ? '25' : remainder === 2n ? '5' : '75';
    return `${fmtPowerBase(whole)}.${decimal}`;
  }
  return fmtPowerBase(divideNumberValue(units, 4n));
}

function canAffordTetrationDimension(index) {
  if (!tetrationDimensionsUnlocked) return false;
  return compareNumberValues(lsp, tetrationDimensionCosts[index]) >= 0;
}

function tetrationDimensionCostText(index) {
  const cost = tetrationDimensionCosts[index];
  return isZeroNumberValue(cost) ? '무료' : `${fmtPowerBase(cost)} LSP`;
}

function resetTetrationDimensionUi() {
  tetrationDimensionUi.length = 0;
  tetrationDimensionsEl.innerHTML = '';
}

function buyTetrationUpgrade(id) {
  if (!isTetrationAvailable()) return false;
  const upgrade = TETRATION_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;
  if (hasTetrationUpgrade(id)) return false;
  if (compareNumberValues(tetraP, upgrade.cost) < 0) return false;

  tetraP = subtractNumberValues(tetraP, upgrade.cost);
  tetrationUpgradeState[id] = true;
  log(`${upgrade.title} 업그레이드를 구매했습니다.`, true);
  render();
  return true;
}

function ensureTetrationUpgradeUi(upgrade) {
  if (tetrationUpgradeUi[upgrade.id]) return tetrationUpgradeUi[upgrade.id];

  const button = document.createElement('button');
  button.className = 'square-upgrade tetration-upgrade';
  button.addEventListener('click', () => buyTetrationUpgrade(upgrade.id));
  tetrationUpgradeGrid.appendChild(button);

  tetrationUpgradeUi[upgrade.id] = button;
  return button;
}

function renderTetrationUpgradeBoard() {
  for (const upgrade of TETRATION_UPGRADES) {
    const button = ensureTetrationUpgradeUi(upgrade);
    const bought = hasTetrationUpgrade(upgrade.id);

    button.classList.toggle('bought', bought);
    button.innerHTML = `
      <span class="upgrade-title">${upgrade.title}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
      <span class="cost">${bought ? '구매 완료' : `비용: ${fmt(upgrade.cost)} tetraP`}</span>
    `;
    button.disabled = !isTetrationAvailable() || bought || compareNumberValues(tetraP, upgrade.cost) < 0;
  }
}

function ensureTetrationDimensionUi(index) {
  if (tetrationDimensionUi[index]) return tetrationDimensionUi[index];

  const row = document.createElement('div');
  row.className = 'dimension-row';

  const info = document.createElement('div');
  info.className = 'dimension-info';

  const name = document.createElement('div');
  name.className = 'dimension-name';
  info.appendChild(name);

  const rate = document.createElement('div');
  rate.className = 'dimension-rate';
  info.appendChild(rate);

  const buyBtn = document.createElement('button');
  buyBtn.addEventListener('click', () => buyTetrationDimension(index));

  row.appendChild(info);
  row.appendChild(buyBtn);
  tetrationDimensionsEl.appendChild(row);

  tetrationDimensionUi[index] = { name, rate, buyBtn };
  return tetrationDimensionUi[index];
}

function renderTetrationDimensions() {
  tetrationDimensionMeta.textContent = tetrationDimensionsUnlocked
    ? `보유 tetraP: ${fmtPowerBase(tetraP)}`
    : `보유 tetraP: ${fmtPowerBase(tetraP)} · 제곱 화면에서 테트레이션 차원을 다시 열어야 구매할 수 있습니다.`;

  for (let index = 0; index < TETRATION_DIMENSION_COUNT; index++) {
    const ui = ensureTetrationDimensionUi(index);
    const dimensionName = tetrationDimensionName(index);
    const targetName = tetrationDimensionTargetName(index);
    const production = tetrationDimensionProduction(index);
    const multiplier = tetrationDimensionMultiplierText(index);

    ui.name.textContent = `${dimensionName} · 보유 ${fmtPowerBase(tetrationDimensions[index])} · 구매 ${fmtPowerBase(tetrationDimensionPurchases[index])}회`;
    ui.rate.textContent = `배율 x${multiplier} · 초당 ${fmtPowerBase(production)} ${targetName} 생산`;
    ui.buyBtn.innerHTML = `${dimensionName} +1<span class="cost">${tetrationDimensionsUnlocked ? `비용: ${tetrationDimensionCostText(index)}` : '잠김 · 제곱 화면에서 재해금 필요'}</span>`;
    ui.buyBtn.disabled = !isTetrationAvailable() || !tetrationDimensionsUnlocked || !canAffordTetrationDimension(index);
  }
}

function buyTetrationDimension(index) {
  if (!isTetrationAvailable()) return false;
  if (!tetrationDimensionsUnlocked) return false;
  if (!canAffordTetrationDimension(index)) return false;

  const cost = tetrationDimensionCosts[index];
  lsp = subtractNumberValues(lsp, cost);
  tetrationDimensions[index] = addBaseNumbers(tetrationDimensions[index], 1n);
  tetrationDimensionPurchases[index] = addBaseNumbers(tetrationDimensionPurchases[index], 1n);
  tetrationDimensionCosts[index] = isZeroNumberValue(cost) ? 16n : multiplyNumberValue(cost, 10n);
  render();
  return true;
}

function convertLspToSp({ automatic = false } = {}) {
  if (!isTetrationAvailable()) return false;
  const gainedSp = convertibleLspToSpAmount();
  if (!isPositiveNumberValue(gainedSp)) return false;

  lsp = subtractNumberValues(lsp, multiplyNumberValue(gainedSp, LSP_PER_SP));
  squarePoints = addBaseNumbers(squarePoints, gainedSp);
  log(`${automatic ? '자동으로 ' : ''}LSP를 변환해 ${fmtPowerBase(gainedSp)} SP를 얻었습니다.`, true);
  render();
  return true;
}

function buyOrToggleAutoLspConverter() {
  if (!isTetrationAvailable()) return false;

  if (!autoLspConverterUnlocked) {
    if (compareNumberValues(squarePoints, AUTO_LSP_CONVERTER_COST) < 0) return false;
    squarePoints = subtractNumberValues(squarePoints, AUTO_LSP_CONVERTER_COST);
    autoLspConverterUnlocked = true;
    autoLspConverterEnabled = true;
    log('자동 LSP 변환기를 구매했습니다. LSP가 충분하면 자동으로 SP로 변환합니다.', true);
    render();
    return true;
  }

  autoLspConverterEnabled = !autoLspConverterEnabled;
  log(`자동 LSP 변환기 ${autoLspConverterEnabled ? 'ON' : 'OFF'}`, true);
  render();
  return true;
}

function gainTetraPointIfReady({ automatic = false } = {}) {
  if (!isTetrationAvailable()) return false;
  if (compareNumberValues(squarePoints, LONG_MAX) < 0) return false;

  const gainedTetraP = 1n;
  tetraP = addBaseNumbers(tetraP, gainedTetraP);
  resetAfterTetraPointGain();
  log(`${automatic ? '자동으로 ' : ''}${fmtPowerBase(gainedTetraP)} tetraP를 얻었습니다.`, true);
  render();
  return true;
}

function exchangeTetraPointManually() {
  return gainTetraPointIfReady();
}

function resetAfterTetraPointGain() {
  squarePoints = 0n;
  squareUnlocked = true;
  tetrationUnlocked = true;
  tetrationDimensionsUnlocked = false;
  resetSquareUpgradeState();
  resetRunStateAfterSquarePrestige();
  resetTetrationProductionState();
  tetrationDimensionsUnlocked = false;
  resetTetrationDimensionUi();
  extraPercentLanesEl.innerHTML = '';

  overflowed = false;
  squareMode = false;
  displayBox.classList.remove('glitch');
  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');

  setChapter('tetration');
}

function unlockTetrationChapter() {
  if (!canUnlockTetrationChapter()) return false;

  squarePoints = 0n;
  tetrationUnlocked = true;
  resetSquareUpgradeState();
  resetRunStateAfterSquarePrestige();
  resetTetrationProductionState();
  tetrationDimensionsUnlocked = true;
  resetTetrationDimensionUi();
  extraPercentLanesEl.innerHTML = '';
  squareUnlocked = true;
  overflowed = false;

  displayBox.classList.remove('glitch');
  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');

  setChapter('tetration');
  log('테트레이션 챕터가 열렸습니다. 제곱 영구 업그레이드와 기본 진행이 초기화되고, 테트레이션 차원이 해금되었습니다.', true);
  render();
  return true;
}

function unlockTetrationDimensionsFromSquare() {
  if (!canUnlockTetrationDimensions()) return false;

  squarePoints = 0n;
  resetSquareUpgradeState();
  resetRunStateAfterSquarePrestige();
  resetTetrationProductionState();
  resetTetrationDimensionUi();
  extraPercentLanesEl.innerHTML = '';
  squareUnlocked = true;
  tetrationUnlocked = true;
  tetrationDimensionsUnlocked = true;
  overflowed = false;

  displayBox.classList.remove('glitch');
  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');

  setChapter('tetration');
  log('제곱 진행을 다시 넘어서 테트레이션 차원이 재해금되었습니다.', true);
  render();
  return true;
}

function handleTetrationUnlockButton() {
  if (unlockTetrationChapter()) return;
  unlockTetrationDimensionsFromSquare();
}

setInterval(() => {
  if (!isTetrationAvailable() || !tetrationDimensionsUnlocked) return;

  const production = tetrationDimensions.map((_, index) => tetrationDimensionProduction(index));
  const productionSpeed = hasTetrationUpgrade('made_in_heaven') ? 2048n : 1n;
  let changed = false;

  if (isPositiveNumberValue(production[0])) {
    lsp = addBaseNumbers(lsp, multiplyNumberValue(production[0], productionSpeed));
    changed = true;
  }

  for (let index = 1; index < production.length; index++) {
    if (!isPositiveNumberValue(production[index])) continue;
    tetrationDimensions[index - 1] = addBaseNumbers(
      tetrationDimensions[index - 1],
      multiplyNumberValue(production[index], productionSpeed)
    );
    changed = true;
  }

  if (changed) render();
}, 1000);

setInterval(() => {
  if (!isTetrationAvailable() || !autoLspConverterUnlocked || !autoLspConverterEnabled) return;
  convertLspToSp({ automatic: true });
}, 500);

unlockTetrationBtn.addEventListener('click', handleTetrationUnlockButton);
convertLspBtn.addEventListener('click', convertLspToSp);
autoLspConverterBtn.addEventListener('click', buyOrToggleAutoLspConverter);
manualTetrationExchangeBtn.addEventListener('click', exchangeTetraPointManually);
