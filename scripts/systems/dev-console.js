const devConsole = {
  form: null,
  input: null,
  trace: null,
  traceTimer: null,
  visible: false
};

function devConsoleIsOpen() {
  return devConsole.visible;
}

function restorePercentChargeRequirementForDev() {
  let required = 100;
  const reduction = percentChargeReduction();
  for (let level = 0; level < percentChargeLevel; level++) {
    required = Math.max(MIN_PERCENT_CHARGE, required - reduction);
  }
  percentChargeNeeded = required;
  percentCharge = Math.min(percentCharge, percentChargeNeeded);
  for (const lane of extraPercentLanes) {
    lane.charge = Math.min(lane.charge, percentChargeNeeded);
  }
}

function forceUnlockDevUpgrade(kind, id) {
  if (kind === 'square') {
    const upgrade = SQUARE_UPGRADES.find(item => item.id === id);
    if (!upgrade) return false;
    squareUpgradeState[id] = true;
    if (id === 'auto_upgrade_top_down') autoUpgradeEnabled = true;
    return true;
  }

  if (kind === 'square_breakthrough') {
    const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === id);
    if (!upgrade) return false;
    const level = squareBreakthroughLevel(id);
    if (level >= squareBreakthroughMax(upgrade)) return false;
    squareBreakthroughLevels[id] = level + 1;
    applySquareBreakthroughSideEffects(id);
    return true;
  }

  if (kind === 'square_convergence') {
    const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
    if (!upgrade) return false;
    squareConvergenceUpgradeState[id] = true;
    squareConvergenceUpgradeLevels[id] = upgrade.max ?? 1;
    if (id === 'automatium') {
      applyAutomatiumSquareUpgradeUnlocks({ resetAutoUpgrade: true });
    }
    return true;
  }

  if (kind === 'generalization') {
    const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
    if (!research) return false;
    generalizationResearchState[id] = true;
    return true;
  }

  return false;
}

function removeDevUpgrade(kind, id) {
  if (kind === 'square') {
    const upgrade = SQUARE_UPGRADES.find(item => item.id === id);
    if (!upgrade) return false;
    squareUpgradeState[id] = false;
    if (id === 'auto_upgrade_top_down') {
      autoUpgradeEnabled = false;
      autoUpgradeTimer = 0;
    }
    return true;
  }

  if (kind === 'square_breakthrough') {
    const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === id);
    if (!upgrade || squareBreakthroughLevel(id) <= 0) return false;
    squareBreakthroughLevels[id] = 0;
    if (id === 'percent_expansion') syncPermanentPercentLanes();
    if (id === 'overcharge') restorePercentChargeRequirementForDev();
    if (id === 'tas' && autoClickerSpeed < 1000) autoClickerSpeed = 1000;
    return true;
  }

  if (kind === 'square_convergence') {
    const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
    if (!upgrade || !hasSquareConvergenceUpgrade(id)) return false;
    squareConvergenceUpgradeState[id] = false;
    squareConvergenceUpgradeLevels[id] = 0;
    if (id === 'automatium') {
      squareUpgradeState.skip_cutscene = false;
      squareUpgradeState.auto_upgrade_top_down = false;
      autoUpgradeEnabled = false;
      autoUpgradeTimer = 0;
    }
    return true;
  }

  if (kind === 'generalization') {
    const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
    if (!research || !hasGeneralizationResearch(id)) return false;
    generalizationResearchState[id] = false;
    return true;
  }

  return false;
}

function handleDivergerDevUndo(event) {
  if (!devConsole.visible || event.type !== 'contextmenu' || !event.shiftKey) return;

  const target = event.target.closest?.('[data-diverger-upgrade-id]');
  if (!target) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const id = target.dataset.divergerUpgradeId;
  if (removeDivergerUpgrade(id)) {
    log(`[DEV] diverger ${id} 한 단계 취소`, true);
    render();
  }
}

document.addEventListener('contextmenu', handleDivergerDevUndo, true);

function handleDevUpgradePointer(event) {
  if (!devConsole.visible) return;

  const target = event.target.closest?.('[data-dev-upgrade-kind][data-dev-upgrade-id]');
  if (!target) return;

  const { devUpgradeKind: kind, devUpgradeId: id } = target.dataset;
  if (event.type === 'contextmenu') {
    if (!event.shiftKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (removeDevUpgrade(kind, id)) {
      log(`[DEV] ${kind} ${id} 해제`, true);
      render();
    }
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  if (forceUnlockDevUpgrade(kind, id)) {
    log(`[DEV] ${kind} ${id} 강제 해금`, true);
    render();
  }
}

document.addEventListener('click', handleDevUpgradePointer, true);
document.addEventListener('contextmenu', handleDevUpgradePointer, true);

function parseDevNumberValue(rawValue) {
  const text = String(rawValue ?? '').trim().replace(/[,_\s]/g, '');
  if (!text) {
    throw new Error('값을 입력하세요.');
  }

  const value = NumberMath.fromString(text, null);
  if (value === null) {
    throw new Error('숫자는 123, 1e200, 1.2e42 형식으로 입력하세요.');
  }
  return value;
}

function formatDevValue(value) {
  return fmtPowerBase(value);
}

function formatNumberTraceEvent(event) {
  const details = Object.entries(event)
    .filter(([key]) => key !== 'at' && key !== 'type')
    .map(([key, value]) => `${key}=${value}`)
    .join(' · ');
  return `[+${event.at.toFixed(1)}ms] ${event.type}${details ? ` · ${details}` : ''}`;
}

function renderNumberTrace() {
  numberTraceRenderScheduled = false;
  devConsole.traceTimer = null;
  if (!devConsole.trace) return;

  devConsole.trace.classList.toggle('hidden', !numberTraceEnabled && numberTraceEvents.length === 0);
  const visibleEvents = numberTraceEvents.slice(-160);
  devConsole.trace.textContent = visibleEvents.length
    ? visibleEvents.map(formatNumberTraceEvent).join('\n')
    : '추적 이벤트 없음';
  devConsole.trace.scrollTop = devConsole.trace.scrollHeight;
}

function scheduleNumberTraceRender() {
  if (devConsole.traceTimer !== null) return;
  devConsole.traceTimer = setTimeout(() => renderNumberTrace(), 100);
}

function runNumberTraceCommand(command) {
  const match = command.match(/^trace\s+number\s+(on|off|clear)$/i);
  if (!match) return false;

  const action = match[1].toLowerCase();
  if (action === 'on') startNumberTrace();
  else if (action === 'off') stopNumberTrace();
  else clearNumberTrace();
  renderNumberTrace();
  return true;
}

function clearOverflowForDevCommand() {
  overflowed = false;
  pendingSquarePrestigeValue = null;
  pendingSquarePrestigePoints = null;
  pendingSquarePrestigeRequirement = null;
  displayBox.classList.remove('glitch');
  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');
  addBtn.disabled = false;
}

function showTetrationForDevCommand() {
  squareUnlocked = true;
  tetrationUnlocked = true;
  setChapter('tetration');
}

function runDevCommand(commandText) {
  const command = commandText.trim();
  if (!command) return;

  if (runNumberTraceCommand(command)) return;

  const match = command.match(/^set\s+(number|sp|cp|lsp|tetrap|theory)\s+(.+)$/i);
  if (!match) {
    throw new Error('지원 명령어: set number/sp/cp/lsp/tetraP/theory <숫자>, trace number on/off/clear');
  }

  const target = match[1].toLowerCase();

  if (target === 'number') {
    const value = parseDevNumberValue(match[2]);
    clearOverflowForDevCommand();
    setBaseNumber(value);
    maybeUnlockPercent();
    checkOverflow();
    render();
    log(`[DEV] number = ${fmtPowerBase(getBaseNumber())}`, true);
    return;
  }

  const value = parseDevNumberValue(match[2]);

  if (target === 'sp') {
    squarePoints = value;
    if (isPositiveNumberValue(value)) {
      squareUnlocked = true;
      setChapter('square');
    }
    render();
    log(`[DEV] SP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'cp') {
    squareConvergencePoints = value;
    if (isPositiveNumberValue(value)) {
      squareUnlocked = true;
      squareConvergenceUnlocked = true;
      setChapter('square-convergence');
    }
    render();
    log(`[DEV] CP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'theory') {
    theory = value;
    if (isPositiveNumberValue(value)) {
      squareUnlocked = true;
      squareConvergenceUnlocked = true;
      setChapter('square-convergence');
    }
    render();
    log(`[DEV] 이론 = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'lsp') {
    lsp = value;
    showTetrationForDevCommand();
    render();
    log(`[DEV] LSP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'tetrap') {
    tetraP = value;
    showTetrationForDevCommand();
    render();
    log(`[DEV] tetraP = ${formatDevValue(value)}`, true);
    return;
  }
}

function ensureDevConsoleUi() {
  if (devConsole.form) return;

  const form = document.createElement('form');
  form.className = 'dev-console hidden';

  const prompt = document.createElement('span');
  prompt.className = 'dev-console-prompt';
  prompt.textContent = '>';

  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'set theory 10';
  input.setAttribute('aria-label', '개발자 명령어');

  form.append(prompt, input);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      runDevCommand(input.value);
      input.value = '';
    } catch (error) {
      log(`[DEV] ${error.message}`, true);
    }
    input.focus();
  });

  logEl.appendChild(form);

  const trace = document.createElement('pre');
  trace.className = 'dev-runtime-trace hidden';
  trace.setAttribute('aria-live', 'off');
  logEl.appendChild(trace);
  devConsole.form = form;
  devConsole.input = input;
  devConsole.trace = trace;
}

function toggleDevConsole() {
  ensureDevConsoleUi();
  devConsole.visible = !devConsole.visible;
  devConsole.form.classList.toggle('hidden', !devConsole.visible);
  document.body.classList.toggle('dev-console-open', devConsole.visible);
  render();

  if (devConsole.visible) {
    devConsole.input.focus();
    renderNumberTrace();
    log('[DEV] 콘솔 열림: set number/sp/cp/lsp/tetraP/theory <숫자>, trace number on/off/clear · 업그레이드 좌클릭=강제 해금 · Shift+우클릭=해제 · 발산자 Shift+우클릭=한 단계 취소', true);
  }
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !event.shiftKey) return;
  if (document.body.classList.contains('automatium-open')) return;
  event.preventDefault();
  toggleDevConsole();
});
