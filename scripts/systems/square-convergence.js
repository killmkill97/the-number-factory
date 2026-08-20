const squareConvergenceUi = {};

function buySquareConvergenceUpgrade(id) {
  const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;
  if (hasSquareConvergenceUpgrade(id)) {
    if (id === 'automatium') return openAutomatiumEditor();
    return false;
  }
  if (squareConvergencePoints < upgrade.cost) return false;

  squareConvergencePoints -= upgrade.cost;
  squareConvergenceUpgradeState[id] = true;

  if (id === 'automatium') {
    applyAutomatiumSquareUpgradeUnlocks({ resetAutoUpgrade: true });
  }

  if (id === 'unlimitium') {
    loadSquareBreakthroughState({ ...squareBreakthroughLevels });
  }

  render();
  return true;
}

function squareConvergenceCostText(upgrade) {
  if (!hasSquareConvergenceUpgrade(upgrade.id)) return `비용: ${fmt(upgrade.cost)} CP`;
  return upgrade.id === 'automatium' ? '구매 완료 · 편집기 열기' : '구매 완료';
}

function ensureSquareConvergenceUi(upgrade) {
  if (squareConvergenceUi[upgrade.id]) return squareConvergenceUi[upgrade.id];

  const button = document.createElement('button');
  button.className = 'square-upgrade convergence-upgrade';
  button.addEventListener('click', () => buySquareConvergenceUpgrade(upgrade.id));
  squareConvergenceGrid.appendChild(button);

  squareConvergenceUi[upgrade.id] = button;
  return button;
}

function renderSquareConvergenceBoard() {
  for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
    const button = ensureSquareConvergenceUi(upgrade);
    const bought = hasSquareConvergenceUpgrade(upgrade.id);

    button.classList.toggle('bought', bought);
    button.innerHTML = `
      <span class="upgrade-title">${upgrade.title}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
      <span class="cost">${squareConvergenceCostText(upgrade)}</span>
    `;
    button.disabled = bought ? upgrade.id !== 'automatium' : squareConvergencePoints < upgrade.cost;
  }
}

function finishSquareConvergence(gainedConvergencePoints) {
  if (gainedConvergencePoints <= 0n) return false;

  resetRunStateAfterSquarePrestige();
  overflowed = false;
  squareMode = false;
  displayBox.classList.remove('glitch');
  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');
  extraPercentLanesEl.innerHTML = '';

  setChapter('square-convergence');
  log(`${fmt(gainedConvergencePoints)} CP를 얻고 제곱 업그레이드와 제곱돌파 업그레이드가 초기화되었습니다.`, true);
  render();
  return true;
}

function checkSquareConvergence() {
  const gainedConvergencePoints = collectSquareConvergenceIfReady();
  return finishSquareConvergence(gainedConvergencePoints);
}

setInterval(checkSquareConvergence, 500);
