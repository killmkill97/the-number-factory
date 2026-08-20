const squareDimensionUi = [];

function squareDimensionName(index) {
  return `${index + 1}차원`;
}

function squareDimensionTargetName(index) {
  return index === 0 ? '제곱수' : squareDimensionName(index - 1);
}

function squareDimensionProduction(index) {
  const amount = squareDimensions[index];
  if (amount <= 0n) return 0n;
  return amount * squareDimensionMultiplier(index);
}

function squareDimensionMultiplier(index) {
  const purchases = squareDimensionPurchases[index];
  if (purchases <= 1n) return 1n;
  if (purchases === 2n) return 2n;
  return 4n;
}

function canAffordSquareDimension(index) {
  const cost = squareDimensionCosts[index];
  return num >= cost.base && squareExponent >= cost.exponent;
}

function squareDimensionCostText(index) {
  const cost = squareDimensionCosts[index];
  return `${fmtPowerBase(cost.base)} ^ ${fmtPowerBase(cost.exponent)}`;
}

function ensureSquareDimensionUi(index) {
  if (squareDimensionUi[index]) return squareDimensionUi[index];

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
  buyBtn.addEventListener('click', () => buySquareDimension(index));

  row.appendChild(info);
  row.appendChild(buyBtn);
  squareDimensionsEl.appendChild(row);

  squareDimensionUi[index] = { name, rate, buyBtn };
  return squareDimensionUi[index];
}

function renderSquareDimensions() {
  for (let index = 0; index < SQUARE_DIMENSION_COUNT; index++) {
    const ui = ensureSquareDimensionUi(index);
    const dimensionName = squareDimensionName(index);
    const targetName = squareDimensionTargetName(index);
    const production = squareDimensionProduction(index);
    const multiplier = squareDimensionMultiplier(index);

    ui.name.textContent = `${dimensionName} · 보유 ${fmtPowerBase(squareDimensions[index])} · 구매 ${fmtPowerBase(squareDimensionPurchases[index])}회`;
    ui.rate.textContent = `배율 x${fmtPowerBase(multiplier)}${multiplier >= 4n ? ' MAX' : ''} · 초당 ${fmtPowerBase(production)} ${targetName} 생산`;
    ui.buyBtn.innerHTML = `${dimensionName} +1<span class="cost">비용: ${squareDimensionCostText(index)}</span>`;
    ui.buyBtn.disabled = !squareUnlocked || !canAffordSquareDimension(index);
  }
}

function buySquareDimension(index) {
  if (!squareUnlocked) return;
  if (!canAffordSquareDimension(index)) return;

  const cost = squareDimensionCosts[index];
  num -= cost.base;
  squareExponent -= cost.exponent;
  squareDimensions[index] += 1n;
  squareDimensionPurchases[index] += 1n;
  cost.base *= 10n;
  cost.exponent *= 10n;
  render();
}

setInterval(() => {
  if (!squareUnlocked) return;

  const production = squareDimensions.map((_, index) => squareDimensionProduction(index));
  let changed = false;

  if (production[0] > 0n) {
    squareExponent += production[0];
    changed = true;
  }

  for (let index = 1; index < production.length; index++) {
    if (production[index] <= 0n) continue;
    squareDimensions[index - 1] += production[index];
    changed = true;
  }

  if (changed) render();
}, 1000);
