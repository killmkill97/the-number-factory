const squareConvergenceUi = {};
const generalizationResearchUi = {};
let activeConvergenceView = 'convergence';
const RESEARCH_NODE_WIDTH = 220;
const RESEARCH_NODE_HEIGHT = 190;
const RESEARCH_COLUMN_GAP = 56;
const RESEARCH_ROW_GAP = 56;
const RESEARCH_TREE_PADDING = 24;
let researchTreePanX = 0;
let researchTreePanY = 0;
let researchTreePanState = null;

function researchNodePosition(research) {
  return {
    left: RESEARCH_TREE_PADDING + ((research.column ?? 1) - 1) * (RESEARCH_NODE_WIDTH + RESEARCH_COLUMN_GAP),
    top: RESEARCH_TREE_PADDING + ((research.row ?? 1) - 1) * (RESEARCH_NODE_HEIGHT + RESEARCH_ROW_GAP)
  };
}

function renderGeneralizationTreeLayout() {
  if (!generalizationTreeCanvas || !generalizationConnections) return;

  const maxColumn = Math.max(...GENERALIZATION_RESEARCHES.map(research => research.column ?? 1), 1);
  const maxRow = Math.max(...GENERALIZATION_RESEARCHES.map(research => research.row ?? 1), 1);
  const canvasWidth = RESEARCH_TREE_PADDING * 2
    + maxColumn * RESEARCH_NODE_WIDTH
    + (maxColumn - 1) * RESEARCH_COLUMN_GAP;
  const canvasHeight = RESEARCH_TREE_PADDING * 2
    + maxRow * RESEARCH_NODE_HEIGHT
    + (maxRow - 1) * RESEARCH_ROW_GAP;

  generalizationTreeCanvas.style.width = `${canvasWidth}px`;
  generalizationTreeCanvas.style.height = `${canvasHeight}px`;
  generalizationTreeCanvas.style.transform = `translate(${researchTreePanX}px, ${researchTreePanY}px)`;
  generalizationConnections.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
  generalizationConnections.setAttribute('width', String(canvasWidth));
  generalizationConnections.setAttribute('height', String(canvasHeight));
  generalizationConnections.replaceChildren();

  const researchById = new Map(GENERALIZATION_RESEARCHES.map(research => [research.id, research]));
  for (const research of GENERALIZATION_RESEARCHES) {
    const childPosition = researchNodePosition(research);
    for (const parentId of research.parents ?? []) {
      const parent = researchById.get(parentId);
      if (!parent) continue;

      const parentPosition = researchNodePosition(parent);
      const isHorizontal = parent.column !== research.column;
      const startX = isHorizontal
        ? parentPosition.left + (parent.column < research.column ? RESEARCH_NODE_WIDTH : 0)
        : parentPosition.left + RESEARCH_NODE_WIDTH / 2;
      const startY = isHorizontal
        ? parentPosition.top + RESEARCH_NODE_HEIGHT / 2
        : parentPosition.top + (parent.row < research.row ? RESEARCH_NODE_HEIGHT : 0);
      const endX = isHorizontal
        ? childPosition.left + (parent.column < research.column ? 0 : RESEARCH_NODE_WIDTH)
        : childPosition.left + RESEARCH_NODE_WIDTH / 2;
      const endY = isHorizontal
        ? childPosition.top + RESEARCH_NODE_HEIGHT / 2
        : childPosition.top + (parent.row < research.row ? 0 : RESEARCH_NODE_HEIGHT);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const curveOffset = isHorizontal
        ? Math.max(28, Math.abs(endX - startX) * 0.35)
        : Math.max(28, Math.abs(endY - startY) * 0.35);
      const pathData = isHorizontal
        ? `M ${startX} ${startY} C ${startX + (endX > startX ? curveOffset : -curveOffset)} ${startY}, ${endX - (endX > startX ? curveOffset : -curveOffset)} ${endY}, ${endX} ${endY}`
        : `M ${startX} ${startY} C ${startX} ${startY + (endY > startY ? curveOffset : -curveOffset)}, ${endX} ${endY - (endY > startY ? curveOffset : -curveOffset)}, ${endX} ${endY}`;
      path.setAttribute('d', pathData);
      path.classList.add('research-connection');
      if (hasGeneralizationResearch(parent.id) && hasGeneralizationResearch(research.id)) {
        path.classList.add('complete');
      }
      generalizationConnections.appendChild(path);
    }
  }
}

function initializeGeneralizationTreePan() {
  if (!generalizationTree) return;

  generalizationTree.addEventListener('contextmenu', event => event.preventDefault());
  generalizationTree.addEventListener('pointerdown', event => {
    if (event.button !== 2) return;
    event.preventDefault();
    researchTreePanState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: researchTreePanX,
      originY: researchTreePanY
    };
    generalizationTree.classList.add('is-panning');
    generalizationTree.setPointerCapture(event.pointerId);
  });
  generalizationTree.addEventListener('pointermove', event => {
    if (!researchTreePanState || event.pointerId !== researchTreePanState.pointerId) return;
    event.preventDefault();
    researchTreePanX = researchTreePanState.originX + event.clientX - researchTreePanState.startX;
    researchTreePanY = researchTreePanState.originY + event.clientY - researchTreePanState.startY;
    if (generalizationTreeCanvas) {
      generalizationTreeCanvas.style.transform = `translate(${researchTreePanX}px, ${researchTreePanY}px)`;
    }
  });

  const stopPan = event => {
    if (!researchTreePanState || event.pointerId !== researchTreePanState.pointerId) return;
    researchTreePanState = null;
    generalizationTree.classList.remove('is-panning');
    if (generalizationTree.hasPointerCapture(event.pointerId)) {
      generalizationTree.releasePointerCapture(event.pointerId);
    }
  };
  generalizationTree.addEventListener('pointerup', stopPan);
  generalizationTree.addEventListener('pointercancel', stopPan);
}

initializeGeneralizationTreePan();

function setConvergenceView(view) {
  activeConvergenceView = view === 'generalization' ? 'generalization' : 'convergence';
  renderConvergenceView();
}

function renderConvergenceView() {
  const showingGeneralization = activeConvergenceView === 'generalization';
  squareConvergenceUpgradePanel.classList.toggle('hidden', showingGeneralization);
  generalizationPanel.classList.toggle('hidden', !showingGeneralization);
  squareConvergenceViewBtn.classList.toggle('active', !showingGeneralization);
  generalizationViewBtn.classList.toggle('active', showingGeneralization);
  squareConvergenceViewBtn.setAttribute('aria-selected', String(!showingGeneralization));
  generalizationViewBtn.setAttribute('aria-selected', String(showingGeneralization));
}

function buySquareConvergenceUpgrade(id) {
  const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;
  const level = squareConvergenceUpgradeLevel(id);
  if (hasSquareConvergenceUpgrade(id) && (!upgrade.max || level >= upgrade.max)) {
    if (id === 'automatium') return openAutomatiumEditor();
    return false;
  }
  const cost = squareConvergenceUpgradeCost(upgrade);
  if (compareNumberValues(squareConvergencePoints, cost) < 0) return false;

  squareConvergencePoints = subtractNumberValues(squareConvergencePoints, cost);
  squareConvergenceUpgradeState[id] = true;
  squareConvergenceUpgradeLevels[id] = level + 1;

  if (id === 'automatium') {
    applyAutomatiumSquareUpgradeUnlocks({ resetAutoUpgrade: true });
  }

  render();
  return true;
}

function squareConvergenceCostText(upgrade) {
  const level = squareConvergenceUpgradeLevel(upgrade.id);
  if (upgrade.max) {
    if (level >= upgrade.max) return `최대 레벨 ${upgrade.max}/${upgrade.max}`;
    return `레벨 ${level}/${upgrade.max} · 비용: ${fmt(squareConvergenceUpgradeCost(upgrade))} CP`;
  }
  if (!hasSquareConvergenceUpgrade(upgrade.id)) return `비용: ${fmt(upgrade.cost)} CP`;
  return upgrade.id === 'automatium' ? '구매 완료 · 편집기 열기' : '구매 완료';
}

function ensureSquareConvergenceUi(upgrade) {
  if (squareConvergenceUi[upgrade.id]) return squareConvergenceUi[upgrade.id];

  const button = document.createElement('button');
  button.className = 'square-upgrade convergence-upgrade';
  button.dataset.devUpgradeKind = 'square_convergence';
  button.dataset.devUpgradeId = upgrade.id;
  button.addEventListener('click', () => buySquareConvergenceUpgrade(upgrade.id));
  squareConvergenceGrid.appendChild(button);

  squareConvergenceUi[upgrade.id] = button;
  return button;
}

function renderSquareConvergenceBoard() {
  for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
    const button = ensureSquareConvergenceUi(upgrade);
    const bought = hasSquareConvergenceUpgrade(upgrade.id);
    const level = squareConvergenceUpgradeLevel(upgrade.id);

    button.classList.toggle('bought', bought);
    button.innerHTML = `
      <span class="upgrade-title">${upgrade.title}</span>
      <span class="upgrade-desc">${upgrade.description}</span>
      <span class="cost">${squareConvergenceCostText(upgrade)}</span>
    `;
    const devMode = typeof devConsoleIsOpen === 'function' && devConsoleIsOpen();
    const opensEditor = bought && upgrade.id === 'automatium';
    const atMaximum = upgrade.max ? level >= upgrade.max : false;
    const fixedUpgradeBought = bought && !upgrade.max && !opensEditor;
    const cannotAfford = compareNumberValues(squareConvergencePoints, squareConvergenceUpgradeCost(upgrade)) < 0;
    button.disabled = devMode ? false : opensEditor ? false : fixedUpgradeBought || atMaximum || cannotAfford;
  }
}

function ensureGeneralizationResearchUi(research) {
  if (generalizationResearchUi[research.id]) return generalizationResearchUi[research.id];

  const node = document.createElement('article');
  node.className = 'research-node';

  const id = document.createElement('div');
  id.className = 'research-node-id';
  id.textContent = research.id;

  const title = document.createElement('div');
  title.className = 'research-node-title';
  title.textContent = research.title;

  const description = document.createElement('div');
  description.className = 'research-node-description';
  description.textContent = research.description;

  const parents = document.createElement('div');
  parents.className = 'research-node-parents';

  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.devUpgradeKind = 'generalization';
  button.dataset.devUpgradeId = research.id;
  button.addEventListener('click', () => researchGeneralization(research.id));

  node.append(id, title, description, parents, button);
  generalizationTreeCanvas.appendChild(node);
  generalizationResearchUi[research.id] = { node, parents, button };
  return generalizationResearchUi[research.id];
}

function renderGeneralizationResearchBoard() {
  for (const research of GENERALIZATION_RESEARCHES) {
    const ui = ensureGeneralizationResearchUi(research);
    const position = researchNodePosition(research);
    const bought = hasGeneralizationResearch(research.id);
    const parentsReady = research.parents.every(parentId => hasGeneralizationResearch(parentId));
    const available = canResearchGeneralization(research.id);

    ui.node.classList.toggle('bought', bought);
    ui.node.classList.toggle('locked', !bought && !parentsReady);
    ui.node.style.left = `${position.left}px`;
    ui.node.style.top = `${position.top}px`;
    ui.parents.textContent = research.parents.length > 0
      ? `선행 연구: ${research.parents.join(', ')}`
      : '선행 연구 없음';
    const devMode = typeof devConsoleIsOpen === 'function' && devConsoleIsOpen();
    ui.button.disabled = devMode ? false : bought || !available;
    ui.button.textContent = bought
      ? '연구 완료'
      : `연구 · ${fmt(research.theoryCost)} 이론`;
  }
  renderGeneralizationTreeLayout();
}

function renderTheoryResourceSelector() {
  const resources = [
    [theorySquarePointResourceBtn, theorySquarePointResourceCost, 0],
    [theoryConvergencePointResourceBtn, theoryConvergencePointResourceCost, 1]
  ];

  for (const [button, costElement, resourceIndex] of resources) {
    button.classList.toggle('active', theoryCostResourceIndex === resourceIndex);
    button.disabled = !canOpenSquareConvergence();
    costElement.textContent = fmt(theoryCostForResource(resourceIndex));
  }

  const selectedCost = theoryCostForResource(theoryCostResourceIndex);
  researchTheoryCost.textContent = `${theoryCostResourceLabel(theoryCostResourceIndex)} ${fmt(selectedCost)}`;
}

function renderGeneralizationBoard() {
  theoryValue.textContent = `${fmt(theory)} 이론`;
  theorySubValue.textContent = '선택한 화폐로 이론 +1 · 비용 상승폭 SP ×10 (e300부터 ×1e100) / CP ×2';
  renderTheoryResourceSelector();
  renderGeneralizationResearchBoard();
  const maximumPurchases = theoryMaximumPurchases();
  researchTheoryBtn.disabled = maximumPurchases <= 0;
  researchTheoryMaxBtn.disabled = maximumPurchases <= 0;
  researchTheoryMaxBtn.title = maximumPurchases > 0
    ? `이론 ${maximumPurchases}개를 한 번에 연구`
    : '구매 가능한 이론이 없습니다';
  generalizationResetCostEl.textContent = `비용: ${fmtPowerBase(generalizationResetCost)} CP`;
  generalizationResetBtn.disabled = !canResetGeneralizationResearch();
  generalizationResetBtn.title = canResetGeneralizationResearch()
    ? '모든 일반화 연구를 초기화하고 사용한 이론을 반환합니다'
    : hasAnyGeneralizationResearch()
      ? `CP ${fmtPowerBase(generalizationResetCost)} 필요`
      : '초기화할 연구가 없습니다';
  renderConvergenceView();
}

function finishSquareConvergence(gainedConvergencePoints) {
  if (!isPositiveNumberValue(gainedConvergencePoints)) return false;

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

function exchangeSquareConvergencePointsManually() {
  const gainedConvergencePoints = collectSquareConvergenceIfReady();
  return finishSquareConvergence(gainedConvergencePoints);
}

squareConvergenceViewBtn.addEventListener('click', () => setConvergenceView('convergence'));
generalizationViewBtn.addEventListener('click', () => setConvergenceView('generalization'));
theorySquarePointResourceBtn.addEventListener('click', () => setTheoryCostResource(0));
theoryConvergencePointResourceBtn.addEventListener('click', () => setTheoryCostResource(1));
researchTheoryBtn.addEventListener('click', researchTheory);
researchTheoryMaxBtn.addEventListener('click', researchTheoryMaximum);
generalizationResetBtn.addEventListener('click', resetGeneralizationResearch);
manualConvergenceExchangeBtn.addEventListener('click', exchangeSquareConvergencePointsManually);
