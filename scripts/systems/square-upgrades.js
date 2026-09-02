const squareUpgradeUi = {};

function buySquareUpgrade(id) {
  const upgrade = SQUARE_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;

  if (hasSquareUpgrade(id)) {
    if (id !== 'auto_upgrade_top_down') return false;

    autoUpgradeEnabled = !autoUpgradeEnabled;
    log(`자동 업그레이드 ${autoUpgradeEnabled ? 'ON' : 'OFF'}`, true);
    render();
    return true;
  }

  if (compareNumberValues(squarePoints, upgrade.cost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, upgrade.cost);
  squareUpgradeState[id] = true;
  if (id === 'auto_upgrade_top_down') {
    autoUpgradeEnabled = true;
  }
  render();
  return true;
}

function ensureSquareUpgradeUi(upgrade) {
  if (squareUpgradeUi[upgrade.id]) return squareUpgradeUi[upgrade.id];

  const button = document.createElement('button');
  button.className = 'square-upgrade';
  button.dataset.devUpgradeKind = 'square';
  button.dataset.devUpgradeId = upgrade.id;
  button.style.gridColumn = String(upgrade.column + 1);
  button.style.gridRow = String(upgrade.row + 1);
  button.addEventListener('click', () => buySquareUpgrade(upgrade.id));
  squareUpgradeGrid.appendChild(button);

  squareUpgradeUi[upgrade.id] = button;
  return button;
}

function renderSquareUpgradeBoard() {
  for (const upgrade of SQUARE_UPGRADES) {
    const button = ensureSquareUpgradeUi(upgrade);
    const bought = hasSquareUpgrade(upgrade.id);
    const toggleable = upgrade.id === 'auto_upgrade_top_down';
    const boughtCostText = toggleable
      ? `구매 완료 · ${autoUpgradeEnabled ? 'ON' : 'OFF'}`
      : '구매 완료';

    button.classList.toggle('bought', bought);
    button.classList.toggle('toggle-active', bought && toggleable && autoUpgradeEnabled);
    button.classList.toggle('toggle-inactive', bought && toggleable && !autoUpgradeEnabled);
    button.innerHTML = `
      <span class="upgrade-title">${upgrade.title}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
      <span class="cost">${bought ? boughtCostText : `비용: ${fmt(upgrade.cost)} SP`}</span>
    `;
    const devMode = typeof devConsoleIsOpen === 'function' && devConsoleIsOpen();
    button.disabled = devMode ? false : bought ? !toggleable : compareNumberValues(squarePoints, upgrade.cost) < 0;
  }
}
