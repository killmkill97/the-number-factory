const squareConvergenceUi = {};
const generalizationResearchUi = {};
const abstractionResearchUi = {};
let activeConvergenceView = 'convergence';
const RESEARCH_NODE_WIDTH = 220;
const RESEARCH_NODE_HEIGHT = 190;
const RESEARCH_COLUMN_GAP = 56;
const RESEARCH_ROW_GAP = 56;
const RESEARCH_TREE_PADDING = 24;
const RESEARCH_TREE_MIN_ZOOM = 0.5;
const RESEARCH_TREE_MAX_ZOOM = 2;
const RESEARCH_TREE_ZOOM_STEP = 0.1;
let researchTreePanX = 0;
let researchTreePanY = 0;
let researchTreeZoom = 1;
let researchTreePanState = null;
let focusedGeneralizationResearchId = null;
let generalizationTreeLayoutInitialized = false;
let abstractionTreePanX = 0;
let abstractionTreePanY = 0;
let abstractionTreeZoom = 1;
let abstractionTreePanState = null;
let focusedAbstractionResearchId = null;
let abstractionTreeLayoutInitialized = false;

function generalizationResearchAncestry(researchId) {
  const researchById = new Map(GENERALIZATION_RESEARCHES.map(research => [research.id, research]));
  const ancestry = new Set();
  const visit = id => {
    if (ancestry.has(id)) return;
    const research = researchById.get(id);
    if (!research) return;
    ancestry.add(id);
    for (const parentId of research.parents ?? []) visit(parentId);
  };
  visit(researchId);
  return ancestry;
}

function applyGeneralizationResearchFocus() {
  if (!generalizationTree) return;
  const focusedIds = focusedGeneralizationResearchId
    ? generalizationResearchAncestry(focusedGeneralizationResearchId)
    : null;
  generalizationTree.classList.toggle('has-research-focus', Boolean(focusedIds));

  for (const [researchId, ui] of Object.entries(generalizationResearchUi)) {
    ui.node.classList.toggle('research-focus-path', focusedIds?.has(researchId) === true);
  }
  for (const path of generalizationConnections?.querySelectorAll('.research-connection') ?? []) {
    const onFocusedPath = focusedIds?.has(path.dataset.parentId) === true
      && focusedIds?.has(path.dataset.childId) === true;
    path.classList.toggle('research-focus-path', onFocusedPath);
  }
}

function setGeneralizationResearchFocus(researchId) {
  focusedGeneralizationResearchId = researchId;
  applyGeneralizationResearchFocus();
}

function updateGeneralizationTreeViewportExtent() {
  if (!generalizationTree || generalizationPanel?.classList.contains('hidden')) return;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const treeTop = Math.max(0, Math.min(viewportHeight, generalizationTree.getBoundingClientRect().top));
  generalizationTree.style.setProperty('--generalization-tree-top', `${treeTop}px`);
}

function applyGeneralizationTreeTransform() {
  if (generalizationTreeCanvas) {
    generalizationTreeCanvas.style.transform = `translate(${researchTreePanX}px, ${researchTreePanY}px) scale(${researchTreeZoom})`;
  }
  if (generalizationZoomValue) {
    generalizationZoomValue.textContent = `${Math.round(researchTreeZoom * 100)}%`;
  }
  if (generalizationZoomOutBtn) {
    generalizationZoomOutBtn.disabled = researchTreeZoom <= RESEARCH_TREE_MIN_ZOOM;
  }
  if (generalizationZoomInBtn) {
    generalizationZoomInBtn.disabled = researchTreeZoom >= RESEARCH_TREE_MAX_ZOOM;
  }
}

function setGeneralizationTreeZoom(nextZoom, anchorX = null, anchorY = null) {
  if (!generalizationTree) return false;
  const clampedZoom = Math.min(RESEARCH_TREE_MAX_ZOOM, Math.max(RESEARCH_TREE_MIN_ZOOM, nextZoom));
  if (Math.abs(clampedZoom - researchTreeZoom) < 0.0001) return false;

  const bounds = generalizationTree.getBoundingClientRect();
  const localX = anchorX ?? bounds.width / 2;
  const localY = anchorY ?? bounds.height / 2;
  const contentX = (localX - researchTreePanX) / researchTreeZoom;
  const contentY = (localY - researchTreePanY) / researchTreeZoom;

  researchTreePanX = localX - contentX * clampedZoom;
  researchTreePanY = localY - contentY * clampedZoom;
  researchTreeZoom = clampedZoom;
  applyGeneralizationTreeTransform();
  return true;
}

function researchNodePosition(research) {
  return {
    left: RESEARCH_TREE_PADDING + ((research.column ?? 1) - 1) * (RESEARCH_NODE_WIDTH + RESEARCH_COLUMN_GAP),
    top: RESEARCH_TREE_PADDING + ((research.row ?? 1) - 1) * (RESEARCH_NODE_HEIGHT + RESEARCH_ROW_GAP)
  };
}

function renderGeneralizationTreeLayout() {
  if (!generalizationTreeCanvas || !generalizationConnections) return;

  updateGeneralizationTreeViewportExtent();

  if (generalizationTreeLayoutInitialized) {
    for (const path of generalizationConnections.querySelectorAll('.research-connection')) {
      path.classList.toggle(
        'complete',
        hasGeneralizationResearch(path.dataset.parentId)
          && hasGeneralizationResearch(path.dataset.childId)
      );
    }
    applyGeneralizationTreeFocus();
    return;
  }

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
  applyGeneralizationTreeTransform();
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
      path.dataset.parentId = parent.id;
      path.dataset.childId = research.id;
      if (hasGeneralizationResearch(parent.id) && hasGeneralizationResearch(research.id)) {
        path.classList.add('complete');
      }
      generalizationConnections.appendChild(path);
    }
  }
  generalizationTreeLayoutInitialized = true;
  applyGeneralizationResearchFocus();
}

function initializeGeneralizationTreePan() {
  if (!generalizationTree) return;

  window.addEventListener('resize', updateGeneralizationTreeViewportExtent);
  window.addEventListener('scroll', updateGeneralizationTreeViewportExtent, { passive: true });
  window.visualViewport?.addEventListener('resize', updateGeneralizationTreeViewportExtent);

  generalizationTree.addEventListener('contextmenu', event => event.preventDefault());
  generalizationTree.addEventListener('pointerdown', event => {
    // Any pointer button, touch, and pen input can begin a pan. Wait until the
    // pointer actually moves so a left click on a research card stays a click.
    if (event.button !== 0) event.preventDefault();
    researchTreePanState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: researchTreePanX,
      originY: researchTreePanY,
      moved: false
    };
  });
  generalizationTree.addEventListener('pointermove', event => {
    if (!researchTreePanState || event.pointerId !== researchTreePanState.pointerId) return;
    const deltaX = event.clientX - researchTreePanState.startX;
    const deltaY = event.clientY - researchTreePanState.startY;
    if (!researchTreePanState.moved && Math.hypot(deltaX, deltaY) < 4) return;

    if (!researchTreePanState.moved) {
      researchTreePanState.moved = true;
      generalizationTree.classList.add('is-panning');
      generalizationTree.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    researchTreePanX = researchTreePanState.originX + deltaX;
    researchTreePanY = researchTreePanState.originY + deltaY;
    applyGeneralizationTreeTransform();
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
  generalizationTree.addEventListener('wheel', event => {
    if (event.deltaY === 0) return;
    event.preventDefault();
    const bounds = generalizationTree.getBoundingClientRect();
    const direction = event.deltaY < 0 ? 1 : -1;
    setGeneralizationTreeZoom(
      researchTreeZoom + direction * RESEARCH_TREE_ZOOM_STEP,
      event.clientX - bounds.left,
      event.clientY - bounds.top
    );
  }, { passive: false });

  generalizationZoomOutBtn?.addEventListener('click', () => {
    setGeneralizationTreeZoom(researchTreeZoom - RESEARCH_TREE_ZOOM_STEP);
  });
  generalizationZoomInBtn?.addEventListener('click', () => {
    setGeneralizationTreeZoom(researchTreeZoom + RESEARCH_TREE_ZOOM_STEP);
  });
  generalizationZoomResetBtn?.addEventListener('click', () => {
    setGeneralizationTreeZoom(1);
  });
  applyGeneralizationTreeTransform();
}

initializeGeneralizationTreePan();

function setConvergenceView(view) {
  activeConvergenceView = view === 'generalization' && canOpenGeneralizationResearch()
    ? 'generalization'
    : 'convergence';
  renderConvergenceView();
  if (typeof invalidateSquareControlRender === 'function') invalidateSquareControlRender();
  else if (typeof render === 'function') render();
}

function renderConvergenceView() {
  if (!canOpenGeneralizationResearch()) activeConvergenceView = 'convergence';
  const showingGeneralization = activeConvergenceView === 'generalization';
  squareConvergenceUpgradePanel.classList.toggle('hidden', showingGeneralization);
  generalizationPanel.classList.toggle('hidden', !showingGeneralization);
  squareConvergenceViewBtn.classList.toggle('active', !showingGeneralization);
  generalizationViewBtn.classList.toggle('active', showingGeneralization);
  generalizationViewBtn.disabled = !canOpenGeneralizationResearch();
  squareConvergenceViewBtn.setAttribute('aria-selected', String(!showingGeneralization));
  generalizationViewBtn.setAttribute('aria-selected', String(showingGeneralization));
  if (showingGeneralization) requestAnimationFrame(updateGeneralizationTreeViewportExtent);
}

function buySquareConvergenceUpgrade(id) {
  const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;
  const level = squareConvergenceUpgradeLevel(id);
  if (hasSquareConvergenceUpgrade(id) && !upgrade.repeatable && (!upgrade.max || level >= upgrade.max)) {
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
  if (upgrade.repeatable) {
    return `레벨 ${level} · 비용: ${fmt(squareConvergenceUpgradeCost(upgrade))} CP`;
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
  wrapFormulaHelpCard(button, 'convergence', upgrade.id, 'square-upgrade-card');

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
    const fixedUpgradeBought = bought && !upgrade.max && !upgrade.repeatable && !opensEditor;
    const cannotAfford = compareNumberValues(squareConvergencePoints, squareConvergenceUpgradeCost(upgrade)) < 0;
    button.disabled = devMode ? false : opensEditor ? false : fixedUpgradeBought || atMaximum || cannotAfford;
  }
}

function ensureGeneralizationResearchUi(research) {
  if (generalizationResearchUi[research.id]) return generalizationResearchUi[research.id];

  const node = document.createElement('article');
  node.className = 'research-node';
  node.addEventListener('mouseenter', () => setGeneralizationResearchFocus(research.id));
  node.addEventListener('mouseleave', () => setGeneralizationResearchFocus(null));

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
  ensureFormulaHelpButton(node, 'generalization', research.id);
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
    ui.button.disabled = !canOpenGeneralizationResearch() || (devMode ? false : bought || !available);
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

function renderGreatTheoryResourceSelector() {
  const resources = [
    [greatTheoryCpResourceBtn, greatTheoryCpResourceCost, 0],
    [greatTheoryKpResourceBtn, greatTheoryKpResourceCost, 1],
    [greatTheorySpResourceBtn, greatTheorySpResourceCost, 2],
    [greatTheoryTheoryResourceBtn, greatTheoryTheoryResourceCost, 3]
  ];

  for (const [button, costElement, resourceIndex] of resources) {
    const locked = resourceIndex === 3 && !knuthBaseUpgradeLevel('theory_exchange');
    button.classList.toggle('hidden', locked);
    button.classList.toggle('active', abstractionCostResourceIndex === resourceIndex);
    button.disabled = locked || !canOpenAbstraction();
    costElement.textContent = ` · ${fmt(greatTheoryCostForResource(resourceIndex))}`;
  }

  const selectedCost = greatTheoryCostForResource(abstractionCostResourceIndex);
  buyGreatTheoryCost.textContent = `비용: ${fmt(selectedCost)} ${greatTheoryResourceLabel(abstractionCostResourceIndex)}`;
  const maximumPurchases = greatTheoryMaximumPurchases();
  buyGreatTheoryBtn.disabled = maximumPurchases < 1;
  buyGreatTheoryMaxBtn.disabled = maximumPurchases < 1;
  buyGreatTheoryMaxBtn.title = maximumPurchases > 0
    ? `대이론 ${maximumPurchases}개를 한 번에 구매`
    : '구매 가능한 대이론이 없습니다';
}

function abstractionResearchAncestry(researchId) {
  const researchById = new Map(ABSTRACTION_RESEARCHES.map(research => [research.id, research]));
  const ancestry = new Set();
  const visit = id => {
    if (ancestry.has(id)) return;
    const research = researchById.get(id);
    if (!research) return;
    ancestry.add(id);
    for (const parentId of research.parents ?? []) visit(parentId);
  };
  visit(researchId);
  return ancestry;
}

function applyAbstractionResearchFocus() {
  if (!abstractionTree) return;
  const focusedIds = focusedAbstractionResearchId
    ? abstractionResearchAncestry(focusedAbstractionResearchId)
    : null;
  abstractionTree.classList.toggle('has-research-focus', Boolean(focusedIds));

  for (const [researchId, ui] of Object.entries(abstractionResearchUi)) {
    ui.node.classList.toggle('research-focus-path', focusedIds?.has(researchId) === true);
  }
  for (const path of abstractionConnections?.querySelectorAll('.research-connection') ?? []) {
    const onFocusedPath = focusedIds?.has(path.dataset.parentId) === true
      && focusedIds?.has(path.dataset.childId) === true;
    path.classList.toggle('research-focus-path', onFocusedPath);
  }
}

function setAbstractionResearchFocus(researchId) {
  focusedAbstractionResearchId = researchId;
  applyAbstractionResearchFocus();
}

function updateAbstractionTreeViewportExtent() {
  if (!abstractionTree || abstractionPanel?.classList.contains('hidden') || knuthPanel?.classList.contains('hidden')) return;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const treeTop = Math.max(0, Math.min(viewportHeight, abstractionTree.getBoundingClientRect().top));
  abstractionTree.style.setProperty('--abstraction-tree-top', `${treeTop}px`);
}

function applyAbstractionTreeTransform() {
  if (abstractionTreeCanvas) {
    abstractionTreeCanvas.style.transform = `translate(${abstractionTreePanX}px, ${abstractionTreePanY}px) scale(${abstractionTreeZoom})`;
  }
  if (abstractionZoomValue) {
    abstractionZoomValue.textContent = `${Math.round(abstractionTreeZoom * 100)}%`;
  }
  if (abstractionZoomOutBtn) abstractionZoomOutBtn.disabled = abstractionTreeZoom <= RESEARCH_TREE_MIN_ZOOM;
  if (abstractionZoomInBtn) abstractionZoomInBtn.disabled = abstractionTreeZoom >= RESEARCH_TREE_MAX_ZOOM;
}

function setAbstractionTreeZoom(nextZoom, anchorX = null, anchorY = null) {
  if (!abstractionTree) return false;
  const clampedZoom = Math.min(RESEARCH_TREE_MAX_ZOOM, Math.max(RESEARCH_TREE_MIN_ZOOM, nextZoom));
  if (Math.abs(clampedZoom - abstractionTreeZoom) < 0.0001) return false;

  const bounds = abstractionTree.getBoundingClientRect();
  const localX = anchorX ?? bounds.width / 2;
  const localY = anchorY ?? bounds.height / 2;
  const contentX = (localX - abstractionTreePanX) / abstractionTreeZoom;
  const contentY = (localY - abstractionTreePanY) / abstractionTreeZoom;

  abstractionTreePanX = localX - contentX * clampedZoom;
  abstractionTreePanY = localY - contentY * clampedZoom;
  abstractionTreeZoom = clampedZoom;
  applyAbstractionTreeTransform();
  return true;
}

function abstractionLiveValueText(value) {
  return compareNumberValues(value, 1000) < 0
    ? Number(NumberMath.toNumber(value).toPrecision(4)).toString()
    : fmt(value);
}

function abstractionTimeResearchInfo(id) {
  if (!hasAbstractionResearch(id)) return '';
  const show = abstractionLiveValueText;
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  if (id === '4-1') {
    const time = abstractionEffectiveTime();
    const ratio = isPositiveNumberValue(squareRunGameSeconds)
      ? NumberMath.divideApproximate(time, squareRunGameSeconds) : 1;
    return `T 기본 ${show(squareRunGameSeconds)}초 (제곱 게임 시간)\n적용 T ${show(time)}초 · T 변환 ×${show(ratio)}`;
  }
  if (id === '6-1') {
    const rate = abstractionTimeRecoveryRate();
    return `U ${show(squareRunGameSeconds)}초 (제곱 게임 시간)\n추가 T +${show(rate)}초/게임초 · 회수 속도 ×${show(1 + rate)}`;
  }
  if (id === '12-1' || id === '14-1') {
    const U = knuthRunRealSeconds();
    const parameterBonus = id === '14-1';
    const multiplier = abstractionActiveTimeBonus(U,
      parameterBonus ? tuning.activeParameterStrength : tuning.activeResourceStrength);
    return `U ${show(U)}초 (커누스 현실 시간)\n${parameterBonus ? 'a·b·c' : 'SP·CP'} ×${show(multiplier)}`
      + (parameterBonus ? `\n속도 구매 감소량 ×${show(tuning.activeSpeedReduction)}` : '');
  }
  if (id === '12-3') {
    const T = knuthRunRealSeconds();
    return `T ${show(T)}초 (커누스 현실 시간)\nSP·CP ×${show(abstractionIdleTimeBonus(T, tuning.idleResourceStrength))}`;
  }
  if (id === '13-1' || id === '13-3') {
    const active = id === '13-1';
    const symbol = active ? 'U' : 'T';
    const record = active ? shortestKnuthRealSeconds : longestKnuthRealSeconds;
    const applied = abstractionKpTimeRecord(active ? 'shortest' : 'longest');
    const multiplier = applied === null ? 1
      : active ? abstractionActiveTimeBonus(applied, tuning.activeKpStrength)
      : abstractionIdleTimeBonus(applied, tuning.idleKpStrength);
    return `${active ? '최단' : '최장'} ${symbol} ${record === null ? '미기록' : `${show(record)}초`}\n`
      + `교환 적용 ${symbol} ${applied === null ? '미기록' : `${show(applied)}초`} · KP ×${show(multiplier)}`;
  }
  return '';
}

function updateAbstractionTimeResearchUi(id, ui) {
  const text = abstractionTimeResearchInfo(id);
  if (ui.liveInfo.textContent !== text) ui.liveInfo.textContent = text;
  ui.liveInfo.classList.toggle('hidden', !text);
  ui.node.classList.toggle('has-live-info', Boolean(text));
}

setInterval(() => {
  if (activeChapter !== 'knuth' || typeof activeKnuthView === 'undefined' || activeKnuthView !== 'abstraction') return;
  for (const [id, ui] of Object.entries(abstractionResearchUi)) updateAbstractionTimeResearchUi(id, ui);
}, 1000);

function ensureAbstractionResearchUi(research) {
  if (abstractionResearchUi[research.id]) return abstractionResearchUi[research.id];

  const node = document.createElement('article');
  node.className = 'research-node';
  node.classList.toggle('abstraction-branch-research', Boolean(research.branch));
  node.addEventListener('mouseenter', () => setAbstractionResearchFocus(research.id));
  node.addEventListener('mouseleave', () => setAbstractionResearchFocus(null));

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
  const liveInfo = document.createElement('div');
  liveInfo.className = 'research-node-live-info hidden';
  liveInfo.setAttribute('role', 'status');
  liveInfo.setAttribute('aria-live', 'off');
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.devUpgradeKind = 'abstraction';
  button.dataset.devUpgradeId = research.id;
  button.addEventListener('click', () => researchAbstraction(research.id));

  node.append(id, title, description, parents, liveInfo, button);
  ensureFormulaHelpButton(node, 'abstraction', research.id);
  abstractionTreeCanvas.appendChild(node);
  abstractionResearchUi[research.id] = { node, parents, button, liveInfo };
  return abstractionResearchUi[research.id];
}

function renderAbstractionTreeLayout() {
  if (!abstractionTreeCanvas || !abstractionConnections) return;
  updateAbstractionTreeViewportExtent();

  for (const research of ABSTRACTION_RESEARCHES) {
    const ui = ensureAbstractionResearchUi(research);
    const position = researchNodePosition(research);
    ui.node.style.left = `${position.left}px`;
    ui.node.style.top = `${position.top}px`;
  }

  if (abstractionTreeLayoutInitialized) {
    for (const path of abstractionConnections.querySelectorAll('.research-connection')) {
      path.classList.toggle(
        'complete',
        hasAbstractionResearch(path.dataset.parentId) && hasAbstractionResearch(path.dataset.childId)
      );
    }
    applyAbstractionResearchFocus();
    return;
  }

  const maxColumn = Math.max(...ABSTRACTION_RESEARCHES.map(research => research.column ?? 1), 1);
  const maxRow = Math.max(...ABSTRACTION_RESEARCHES.map(research => research.row ?? 1), 1);
  const canvasWidth = RESEARCH_TREE_PADDING * 2
    + maxColumn * RESEARCH_NODE_WIDTH
    + (maxColumn - 1) * RESEARCH_COLUMN_GAP;
  const canvasHeight = RESEARCH_TREE_PADDING * 2
    + maxRow * RESEARCH_NODE_HEIGHT
    + (maxRow - 1) * RESEARCH_ROW_GAP;

  abstractionTreeCanvas.style.width = `${canvasWidth}px`;
  abstractionTreeCanvas.style.height = `${canvasHeight}px`;
  applyAbstractionTreeTransform();
  abstractionConnections.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
  abstractionConnections.setAttribute('width', String(canvasWidth));
  abstractionConnections.setAttribute('height', String(canvasHeight));
  abstractionConnections.replaceChildren();

  const researchById = new Map(ABSTRACTION_RESEARCHES.map(research => [research.id, research]));
  for (const research of ABSTRACTION_RESEARCHES) {
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
      path.dataset.parentId = parent.id;
      path.dataset.childId = research.id;
      if (hasAbstractionResearch(parent.id) && hasAbstractionResearch(research.id)) path.classList.add('complete');
      abstractionConnections.appendChild(path);
    }
  }

  abstractionTreeLayoutInitialized = true;
  applyAbstractionResearchFocus();
}

function initializeAbstractionTreePan() {
  if (!abstractionTree) return;
  window.addEventListener('resize', updateAbstractionTreeViewportExtent);
  window.addEventListener('scroll', updateAbstractionTreeViewportExtent, { passive: true });
  window.visualViewport?.addEventListener('resize', updateAbstractionTreeViewportExtent);
  abstractionTree.addEventListener('contextmenu', event => event.preventDefault());
  abstractionTree.addEventListener('pointerdown', event => {
    if (event.button !== 0) event.preventDefault();
    abstractionTreePanState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: abstractionTreePanX,
      originY: abstractionTreePanY,
      moved: false
    };
  });
  abstractionTree.addEventListener('pointermove', event => {
    if (!abstractionTreePanState || event.pointerId !== abstractionTreePanState.pointerId) return;
    const deltaX = event.clientX - abstractionTreePanState.startX;
    const deltaY = event.clientY - abstractionTreePanState.startY;
    if (!abstractionTreePanState.moved && Math.hypot(deltaX, deltaY) < 4) return;
    if (!abstractionTreePanState.moved) {
      abstractionTreePanState.moved = true;
      abstractionTree.classList.add('is-panning');
      abstractionTree.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    abstractionTreePanX = abstractionTreePanState.originX + deltaX;
    abstractionTreePanY = abstractionTreePanState.originY + deltaY;
    applyAbstractionTreeTransform();
  });
  const stopPan = event => {
    if (!abstractionTreePanState || event.pointerId !== abstractionTreePanState.pointerId) return;
    abstractionTreePanState = null;
    abstractionTree.classList.remove('is-panning');
    if (abstractionTree.hasPointerCapture(event.pointerId)) abstractionTree.releasePointerCapture(event.pointerId);
  };
  abstractionTree.addEventListener('pointerup', stopPan);
  abstractionTree.addEventListener('pointercancel', stopPan);
  abstractionTree.addEventListener('wheel', event => {
    if (event.deltaY === 0) return;
    event.preventDefault();
    const bounds = abstractionTree.getBoundingClientRect();
    const direction = event.deltaY < 0 ? 1 : -1;
    setAbstractionTreeZoom(
      abstractionTreeZoom + direction * RESEARCH_TREE_ZOOM_STEP,
      event.clientX - bounds.left,
      event.clientY - bounds.top
    );
  }, { passive: false });
  abstractionZoomOutBtn?.addEventListener('click', () => setAbstractionTreeZoom(abstractionTreeZoom - RESEARCH_TREE_ZOOM_STEP));
  abstractionZoomInBtn?.addEventListener('click', () => setAbstractionTreeZoom(abstractionTreeZoom + RESEARCH_TREE_ZOOM_STEP));
  abstractionZoomResetBtn?.addEventListener('click', () => setAbstractionTreeZoom(1));
  applyAbstractionTreeTransform();
}

initializeAbstractionTreePan();

function renderAbstractionBoard() {
  greatTheoryValue.textContent = `${fmt(greatTheory)} 대이론`;
  abstractionSpRate.textContent = hasAbstractionResearch('1-1')
    ? `현재 생산량 ${fmt(abstractionSpGainPerRealSecond())} SP/초`
    : '1-1 연구 후 현재 획득 가능 SP의 1%를 초당 생산';
  abstractionResetToggle.classList.toggle('toggle-active', abstractionResetOnNextKnuthPoint);
  abstractionResetToggle.classList.toggle('toggle-inactive', !abstractionResetOnNextKnuthPoint);
  abstractionResetToggle.setAttribute('aria-pressed', String(abstractionResetOnNextKnuthPoint));
  abstractionResetLabel.textContent = `다음 KP 획득 시 추상화 초기화: ${abstractionResetOnNextKnuthPoint ? 'ON' : 'OFF'}`;
  abstractionResetRefund.textContent = `반환 예정: ${fmt(abstractionResearchRefund())} 대이론`;
  renderGreatTheoryResourceSelector();

  for (const research of ABSTRACTION_RESEARCHES) {
    const ui = ensureAbstractionResearchUi(research);
    const bought = hasAbstractionResearch(research.id);
    const parentsReady = abstractionResearchParentsReady(research);
    const branchLocked = abstractionResearchBranchLocked(research);
    const available = canResearchAbstraction(research.id);
    ui.node.classList.toggle('bought', bought);
    ui.node.classList.toggle('locked', !bought && (!parentsReady || branchLocked));
    updateAbstractionTimeResearchUi(research.id, ui);
    ui.parents.textContent = research.parents.length > 0
      ? `선행 연구: ${research.parents.join(', ')}`
      : '선행 연구 없음';
    const devMode = typeof devConsoleIsOpen === 'function' && devConsoleIsOpen();
    ui.button.disabled = devMode ? false : bought || !available;
    ui.button.textContent = bought
      ? '연구 완료'
      : branchLocked ? '다른 분기 선택됨'
      : `연구 · ${fmt(research.greatTheoryCost)} 대이론`;
  }
  renderAbstractionTreeLayout();
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
abstractionResetToggle.addEventListener('click', toggleAbstractionReset);
greatTheoryCpResourceBtn.addEventListener('click', () => setAbstractionCostResource(0));
greatTheoryKpResourceBtn.addEventListener('click', () => setAbstractionCostResource(1));
greatTheorySpResourceBtn.addEventListener('click', () => setAbstractionCostResource(2));
greatTheoryTheoryResourceBtn.addEventListener('click', () => setAbstractionCostResource(3));
buyGreatTheoryBtn.addEventListener('click', () => purchaseGreatTheory(1));
buyGreatTheoryMaxBtn.addEventListener('click', () => purchaseGreatTheory(greatTheoryMaximumPurchases()));
manualConvergenceExchangeBtn.addEventListener('click', exchangeSquareConvergencePointsManually);
