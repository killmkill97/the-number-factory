const devConsole = {
  form: null,
  input: null,
  trace: null,
  debugBoard: null,
  traceTimer: null,
  visible: false
};

let devTitleClickCount = 0;

function devConsoleIsOpen() {
  return devConsole.visible
    || document.body.classList.contains('dev-console-open')
    || Boolean(devConsole.form && !devConsole.form.classList.contains('hidden'));
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

  if (kind === 'abstraction') {
    const research = ABSTRACTION_RESEARCHES.find(item => item.id === id);
    if (!research) return false;
    if (!hasPurchasedAbstractionResearch(id)) abstractionResearchPaidCosts[id] = 0;
    recordAbstractionBranchPurchase(research);
    abstractionResearchState[id] = true;
    if (id === '3-1') automatiumPrestigeRetentionUnlocked = true;
    if (id === '18-7' && divergerAvailable()) divergerPower = divergerProductionValue();
    return true;
  }

  if (kind === 'knuth') {
    const upgrade = KNUTH_SLOT_UPGRADES.find(item => item.id === id);
    if (!upgrade || hasKnuthUpgrade(id)) return false;
    knuthEquippedUpgradeIds.add(id);
    refreshKnuthEquipmentDerivedState(id);
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

  if (kind === 'abstraction') {
    const research = ABSTRACTION_RESEARCHES.find(item => item.id === id);
    if (!research || !hasPurchasedAbstractionResearch(id)) return false;
    abstractionResearchState[id] = false;
    delete abstractionResearchPaidCosts[id];
    if (id === '18-7' && divergerAvailable()) divergerPower = divergerProductionValue();
    if (id === '16-2') trimKnuthEquipmentToCapacity();
    if (research.branchGroup === 2) loadAbstractionSecondBranchOrder(abstractionSecondBranchPurchaseOrder);
    return true;
  }

  if (kind === 'knuth') {
    const upgrade = KNUTH_SLOT_UPGRADES.find(item => item.id === id);
    if (!upgrade || !hasKnuthUpgrade(id)) return false;
    knuthEquippedUpgradeIds.delete(id);
    refreshKnuthEquipmentDerivedState(id);
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

function handleDevChallengePointer(event) {
  if (!devConsoleIsOpen() || !event.shiftKey) return;

  const target = event.target.closest?.('[data-dev-challenge-id]');
  if (!target) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  const id = target.dataset.devChallengeId;
  if (event.type === 'click') {
    if (forceCompleteKnuthChallengeForDev(id)) {
      log(`[DEV] challenge ${id} 강제 완료`, true);
    }
    return;
  }

  if (resetKnuthChallengeForDev(id)) {
    log(`[DEV] challenge ${id} 미해금 상태로 되돌림`, true);
  }
}

document.addEventListener('click', handleDevChallengePointer, true);
document.addEventListener('contextmenu', handleDevChallengePointer, true);

function handleDevUpgradePointer(event) {
  if (!devConsole.visible) return;

  const target = event.target.closest?.('[data-dev-upgrade-kind][data-dev-upgrade-id]');
  if (!target) return;

  const { devUpgradeKind: kind, devUpgradeId: id } = target.dataset;
  if ((kind === 'knuth' || kind === 'abstraction') && !event.shiftKey) return;
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

function stopDevDebugMode() {
  if (!devConsole.visible) return;

  devTitleClickCount = 0;
  devConsole.visible = false;
  devConsole.form?.classList.add('hidden');
  devConsole.debugBoard?.classList.add('hidden');
  document.body.classList.remove('dev-console-open');
  render();
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

function debugBoardLog10GrowthPerSecond(value, rate) {
  if (!isPositiveNumberValue(rate)) return 0;
  if (!isPositiveNumberValue(value)) return Infinity;

  const relativeGain = NumberMath.divideApproximate(rate, value);
  return NumberMath.toNumber(NumberMath.log10(addBaseNumbers(1, relativeGain)));
}

function debugBoardRateValue(value, cyclesPerSecond) {
  if (!Number.isFinite(cyclesPerSecond) || cyclesPerSecond <= 0) return 0;
  return multiplyNumberValue(value, numberValueFromReal(cyclesPerSecond));
}

function debugBoardGameCyclesPerSecond(interval) {
  if (!Number.isFinite(interval) || interval <= 0) return 0;
  return gameTick(1000) / interval;
}

function debugBoardAutoClickRate() {
  if (!autoClickerUnlocked || overflowed) return 0;
  const cyclesPerSecond = debugBoardGameCyclesPerSecond(autoClickerSpeed);
  const clicksPerSecond = cyclesPerSecond * Number(autoClickerParallel);
  return debugBoardRateValue(
    finalNumberProductionGain(perClick, effectivePerClickMultiplier()),
    clicksPerSecond
  );
}

function debugBoardPercentLaneRate(laneNumber, lane = null) {
  if (!percentUnlocked || overflowed || squareMode) return 0;

  const unlocked = laneNumber === 1 ? percentAutoUnlocked : lane?.autoUnlocked === true;
  if (!unlocked) return 0;

  const power = laneNumber === 1 ? percentPower : lane.power;
  const purchaseBonus = laneNumber === 1 ? percentPowerPurchaseBonus : lane.powerPurchaseBonus;
  const speed = laneNumber === 1 ? percentAutoSpeed : lane.autoSpeed;
  const gain = percentGain(getBaseNumber(), power, purchaseBonus);
  return debugBoardRateValue(
    finalNumberProductionGain(
      gain,
      percentPreExponentMultiplier(getBaseNumber()),
      getBaseNumber(),
      power,
      purchaseBonus,
      percentProductionExponent()
    ),
    debugBoardGameCyclesPerSecond(speed)
  );
}

function debugBoardContributionRows() {
  const rows = [
    ['수동 클릭', `${fmtPowerBase(finalNumberProductionGain(perClick, effectivePerClickMultiplier()))} / 클릭`],
    ['오토 클릭커', `${fmtPowerBase(debugBoardAutoClickRate())} / 초`]
  ];

  if (percentUnlocked) {
    rows.push(['퍼센트 1번', `${fmtPowerBase(debugBoardPercentLaneRate(1))} / 초`]);
    for (const lane of extraPercentLanes) {
      rows.push([`퍼센트 ${lane.laneNumber}번`, `${fmtPowerBase(debugBoardPercentLaneRate(lane.laneNumber, lane))} / 초`]);
    }
  } else {
    rows.push(['퍼센트 시스템', '잠김']);
  }

  rows.push([
    '제곱 차원',
    squareDimensionAvailable() ? `×${fmtPowerBase(squareDimensionNumberMultiplier())}` : '잠김'
  ]);
  rows.push([
    '발산자',
    divergerAvailable() ? `제곱력 생산·최종 숫자 ×${fmtPowerBase(divergerSquareDimensionMultiplier())}` : '잠김'
  ]);
  return rows;
}

function ensureDevDebugBoardUi() {
  if (devConsole.debugBoard) return;

  const board = document.createElement('aside');
  board.className = 'debug-board hidden';
  board.setAttribute('aria-label', '디버그 보드');
  board.innerHTML = `
    <div class="debug-board-header">
      <strong>디버그 보드</strong>
      <span>가격 진단 v14</span>
    </div>
    <div class="debug-board-summary">
      <div class="debug-board-row"><span>초당 log10 증가량</span><strong id="debugBoardLog10Rate">-</strong></div>
      <div class="debug-board-row"><span>현재 적용 중인 소프트캡</span><strong id="debugBoardSoftcap">-</strong></div>
      <div class="debug-board-row"><span>1분 뒤 예상 수</span><strong id="debugBoardFutureNumber">-</strong></div>
    </div>
    <div class="debug-board-section-title">퍼센트 레인 가격 진단</div>
    <div id="debugBoardPercentDiagnostics" class="debug-board-contributions"></div>
    <div class="debug-board-section-title">생산 시스템 최종 기여량</div>
    <div id="debugBoardContributions" class="debug-board-contributions"></div>
  `;
  document.body.appendChild(board);
  devConsole.debugBoard = board;
}

function renderDevDebugBoard() {
  if (!devConsole.debugBoard) return;
  devConsole.debugBoard.classList.toggle('hidden', !devConsole.visible);
  if (!devConsole.visible) return;

  const currentNumber = getBaseNumber();
  const automaticContributions = [
    debugBoardAutoClickRate(),
    debugBoardPercentLaneRate(1)
  ];
  for (const lane of extraPercentLanes) {
    automaticContributions.push(debugBoardPercentLaneRate(lane.laneNumber, lane));
  }

  let totalRate = 0;
  for (const contribution of automaticContributions) {
    totalRate = addBaseNumbers(totalRate, contribution);
  }

  const log10Rate = debugBoardLog10GrowthPerSecond(currentNumber, totalRate);
  const softcap = percentUnlocked ? percentPowerSoftcap(percentPower, percentPowerPurchaseBonus) : 0;
  const futureNumber = addBaseNumbers(
    currentNumber,
    multiplyNumberValue(totalRate, 60)
  );
  const log10RateText = Number.isFinite(log10Rate) ? `${log10Rate.toFixed(6)} / 초` : '∞ / 초';

  document.getElementById('debugBoardLog10Rate').textContent = log10RateText;
  document.getElementById('debugBoardSoftcap').textContent = percentUnlocked
    ? fmtPowerBase(softcap)
    : '퍼센트 잠김';
  document.getElementById('debugBoardFutureNumber').textContent = `${fmtPowerBase(futureNumber)} · 현재 속도 기준`;

  const percentDiagnostics = document.getElementById('debugBoardPercentDiagnostics');
  percentDiagnostics.replaceChildren();
  const percentLanes = [{
    laneNumber: 1,
    power: percentPower,
    bonus: percentPowerPurchaseBonus,
    purchaseCount: percentPowerPurchaseCount,
    cost: percentPowerUpgradeCost,
    compounding: percentPowerCostCompounding,
    baseCost: 40000
  }, ...extraPercentLanes.map(lane => ({
    laneNumber: lane.laneNumber,
    power: lane.power,
    bonus: lane.powerPurchaseBonus,
    purchaseCount: lane.powerPurchaseCount,
    cost: lane.powerCost,
    compounding: lane.powerCostCompounding,
    baseCost: scaleByLane(40000, lane.laneNumber)
  }))];

  for (const lane of percentLanes) {
    const row = document.createElement('div');
    row.className = 'debug-board-row';
    const label = document.createElement('span');
    label.textContent = lane.laneNumber === 1 ? '기본 레인' : `${lane.laneNumber}번 레인`;
    const value = document.createElement('strong');
    const displayedCost = percentPowerCost(
      lane.cost,
      lane.compounding,
      lane.purchaseCount,
      lane.baseCost
    );
    const laneSoftcap = percentPowerSoftcap(lane.power, lane.bonus);
    const normalizedPower = normalizedPercentPower(lane.power);
    const normalizedBonus = normalizedPercentPowerBonus(lane.bonus);
    value.textContent = `파워 ${fmtScientific(lane.power)} + 보너스 ${fmtScientific(lane.bonus)} (계산 ${fmtScientific(normalizedPower + normalizedBonus)}) · 구매 ${fmtScientific(lane.purchaseCount)} · 캡 ${fmtScientific(laneSoftcap)} · 원가 ${fmtScientific(lane.cost)} → 버튼 ${fmtScientific(displayedCost)}${lane.compounding ? ' (복리)' : ''}`;
    row.append(label, value);
    percentDiagnostics.appendChild(row);
  }

  const contributions = document.getElementById('debugBoardContributions');
  contributions.replaceChildren();
  for (const [label, value] of debugBoardContributionRows()) {
    const row = document.createElement('div');
    row.className = 'debug-board-row';
    const labelElement = document.createElement('span');
    labelElement.textContent = label;
    const valueElement = document.createElement('strong');
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    contributions.appendChild(row);
  }
}

function runDevCommand(commandText) {
  const command = commandText.trim();
  if (!command) return;

  if (/^stop$/i.test(command)) {
    stopDevDebugMode();
    return;
  }

  if (runNumberTraceCommand(command)) return;

  if (/^system\s+number_black_hole$/i.test(command)) {
    toggleNumberBlackHoleSystem();
    return;
  }

  const match = command.match(/^set\s+(number|n|sp|cp|kp|theory|t|grand_theory|grad_theory|grandtheory|gt|diverger|diverger_power|square_power|squarepower|knuth_slot)\s+(.+)$/i);
  if (!match) {
    throw new Error('지원 명령어: stop, system number_black_hole, set number(n)/sp/cp/kp/theory(t)/grand_theory(gt)/diverger/square_power/knuth_slot <숫자>, trace number on/off/clear');
  }

  const rawTarget = match[1].toLowerCase();
  const target = ({
    n: 'number',
    t: 'theory',
    grad_theory: 'grand_theory',
    grandtheory: 'grand_theory',
    gt: 'grand_theory'
  })[rawTarget] ?? rawTarget;

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

  if (target === 'knuth_slot') {
    const slots = NumberMath.toNumber(value);
    if (!Number.isSafeInteger(slots) || slots < 0) {
      throw new Error('커누스 슬롯 수는 0 이상 9007199254740991 이하의 정수로 입력하세요.');
    }
    knuthOperationLevel = slots;
    let removed = 0;
    for (const id of [...knuthEquippedUpgradeIds].reverse()) {
      if (knuthSlotsUsed() <= knuthSlotCapacity()) break;
      if (removeDevUpgrade('knuth', id)) removed += 1;
    }
    if (slots > 0) {
      knuthUnlocked = true;
      hasClaimedKnuthPoint = true;
      pendingKnuthPointClaim = false;
      setChapter('knuth');
    }
    render();
    log(`[DEV] 커누스 슬롯 = ${knuthSlotCapacity()} · 구매 횟수 ${slots} · 다음 비용: ${formatDevValue(knuthOperationUpgradeCost())} KP${removed ? ` · 초과 장착 ${removed}개 해제` : ''}`, true);
    return;
  }

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
      hasEverEarnedSquareConvergencePoint = true;
      squareUnlocked = true;
      squareConvergenceUnlocked = true;
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
      setChapter('square');
      setSquareView('convergence');
    }
    render();
    log(`[DEV] 이론 = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'kp') {
    knuthPoints = value;
    knuthUnlocked = isPositiveNumberValue(value);
    hasClaimedKnuthPoint = knuthUnlocked;
    pendingKnuthPointClaim = false;
    if (knuthUnlocked) setChapter('knuth');
    render();
    log(`[DEV] KP = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'grand_theory') {
    greatTheory = value;
    if (isPositiveNumberValue(value)) {
      knuthUnlocked = true;
      hasClaimedKnuthPoint = true;
      pendingKnuthPointClaim = false;
      setChapter('knuth');
      setKnuthView('abstraction');
    }
    render();
    log(`[DEV] 대이론 = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'diverger' || target === 'diverger_power') {
    divergerPower = value;
    render();
    log(`[DEV] 발산력 = ${formatDevValue(value)}`, true);
    return;
  }

  if (target === 'square_power' || target === 'squarepower') {
    if (!setSquareDimensionPowerForDev(value)) {
      throw new Error('제곱 차원이 해금되어 있어야 제곱력을 설정할 수 있습니다.');
    }
    render();
    log(`[DEV] 제곱력 = ${formatDevValue(squareDimensionPower())}`, true);
    return;
  }
}

function ensureDevConsoleUi() {
  if (devConsole.form) {
    ensureDevDebugBoardUi();
    return;
  }

  const form = document.createElement('form');
  form.className = 'dev-console hidden';

  const prompt = document.createElement('span');
  prompt.className = 'dev-console-prompt';
  prompt.textContent = '>';

  const input = document.createElement('input');
  input.type = 'text';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = 'set gt 10';
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
  ensureDevDebugBoardUi();
}

function toggleDevConsole() {
  if (!devConsole.visible && !window.numberTycoonAuth?.isAuthorized?.()) {
    unlockAchievement('debug_mode');
    window.numberTycoonAuth?.notify?.('killmkill97@gmail.com 계정으로 로그인해야 디버그 모드를 사용할 수 있습니다.');
    render();
    return false;
  }

  ensureDevConsoleUi();
  devConsole.visible = !devConsole.visible;
  devConsole.form.classList.toggle('hidden', !devConsole.visible);
  devConsole.debugBoard.classList.toggle('hidden', !devConsole.visible);
  document.body.classList.toggle('dev-console-open', devConsole.visible);
  if (devConsole.visible) {
    if (knuthChallengeKc1Btn) knuthChallengeKc1Btn.disabled = false;
    if (knuthChallengeCompleteBtn) knuthChallengeCompleteBtn.disabled = false;
    if (typeof renderKnuthBoard === 'function') renderKnuthBoard();
    if (typeof renderManualExchangeDock === 'function') renderManualExchangeDock();
  }
  if (devConsole.visible) unlockAchievement('debug_mode');
  render();

  if (devConsole.visible) {
    devConsole.input.focus();
    renderDevDebugBoard();
    renderNumberTrace();
    log('[DEV] 콘솔 열림: stop, system number_black_hole, set n/sp/cp/kp/t/gt/knuth_slot <숫자>, trace number on/off/clear · 업그레이드 좌클릭=강제 해금 · Shift+우클릭=해제 · 추상화 연구 Shift+좌/우클릭=강제 구매/취소', true);
  }
}

function handleGameTitleDebugToggle() {
  devTitleClickCount += 1;
  if (devTitleClickCount < 8) return;

  devTitleClickCount = 0;
  toggleDevConsole();
}

gameTitle?.addEventListener('click', handleGameTitleDebugToggle);

setInterval(() => {
  if (gameSessionPaused()) return;
  if (devConsole.visible) renderDevDebugBoard();
}, 250);

document.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !event.shiftKey) return;
  if (document.body.classList.contains('automatium-open')) return;
  event.preventDefault();
  toggleDevConsole();
});

window.devConsoleIsOpen = devConsoleIsOpen;
window.stopDevDebugMode = stopDevDebugMode;
