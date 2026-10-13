function checkOverflow() {
  const request = squarePrestigeConversionRequest();
  if (request !== null && compareBaseNumber(request.requiredValue) >= 0 && !overflowed) {
    triggerOverflow(request);
  }
}

const dialogueLines = [
  "수가 음수가 됬네요! 머지않아 거기가 될겁니다!",
  "장례식장 갈돈 없어서 누가 길바닥에 버리겠네요... 안타까워라.",
  "...",
  "장난이고, 이건 개발자 실수다 인정.",
  "그니까 내가 신세계를 보여줄게."
];

function triggerOverflow(request = squarePrestigeConversionRequest()) {
  if (request === null || overflowed || compareBaseNumber(request.requiredValue) < 0) return false;

  const targetedConversion = request.pointReward !== null;
  pendingSquarePrestigeRequirement = request.requiredValue;
  pendingSquarePrestigeValue = targetedConversion ? request.requiredValue : getBaseNumber();
  pendingSquarePrestigePoints = request.pointReward;
  log(`제곱 프레스티지 요구수 ${fmt(request.requiredValue)}에 도달했습니다.`, true);

  if (hasSquareUpgrade('skip_cutscene')) {
    return completeSquarePrestige({
      skippedCutscene: true,
      keepCurrentChapter: true,
      prestigeValue: pendingSquarePrestigeValue,
      squarePointReward: pendingSquarePrestigePoints,
      requiredValue: pendingSquarePrestigeRequirement
    });
  }

  overflowed = true;
  addBtn.disabled = true;
  upgradeClickBtn.disabled = true;
  percentBtn.disabled = true;
  upgradeChargeBtn.disabled = true;
  displayBox.classList.add('glitch');

  const currentValue = getBaseNumber();
  const displayValue = isApproximateNumber(currentValue)
    ? currentValue
    : compareNumberValues(currentValue, LONG_MAX) > 0
      ? subtractNumberValues(currentValue, NumberMath.power(2, 64))
      : currentValue;
  mainValue.textContent = fmt(displayValue);
  subValue.textContent = '// PRESTIGE READY';

  let i = 0;
  dialogueBox.classList.add('show');
  const showNext = () => {
    if (i < dialogueLines.length) {
      const line = document.createElement('div');
      line.className = 'line';
      line.textContent = dialogueLines[i];
      dialogueBox.appendChild(line);
      i++;
      setTimeout(showNext, 900);
    } else {
      prestigeBtn.classList.remove('hidden');
    }
  };
  showNext();
  return true;
}

function completeSquarePrestige({
  skippedCutscene = false,
  keepCurrentChapter = false,
  prestigeValue = null,
  squarePointReward = null,
  requiredValue = null
} = {}) {
  const rewardValue = prestigeValue ?? pendingSquarePrestigeValue ?? getBaseNumber();
  const targetedReward = squarePointReward ?? pendingSquarePrestigePoints;
  const minimumValue = requiredValue
    ?? pendingSquarePrestigeRequirement
    ?? (targetedReward === null ? gameEndValue() : squarePrestigeNumberForPointReward(targetedReward));
  if (compareBaseNumber(minimumValue) < 0) return false;

  pendingSquarePrestigeValue = null;
  pendingSquarePrestigePoints = null;
  pendingSquarePrestigeRequirement = null;
  squareUnlocked = true;
  squareMode = false;
  const gainedSquarePoints = targetedReward === null
    ? squarePointGainForValue(rewardValue)
    : multiplyNumberValue(targetedReward, knuthSpCpGainMultiplier());
  squarePoints = addBaseNumbers(squarePoints, gainedSquarePoints);

  resetSquarePrestigeCycleTime();
  resetRunStateAfterSquarePrestige();
  overflowed = false;
  displayBox.classList.remove('glitch');

  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');
  percentSection.classList.toggle('hidden', !percentUnlocked);
  extraPercentLanesEl.innerHTML = '';

  addBtn.disabled = false;
  addBtn.textContent = `+${fmt(perClick)}`;

  setChapter(keepCurrentChapter ? activeChapter : 'square');
  log(`제곱 프레스티지 완료${skippedCutscene ? ' (컷신 스킵)' : ''} — ${fmtPowerBase(gainedSquarePoints)} SP를 얻고 기본 게임을 재시작했습니다.`, true);
  render();
  return true;
}

function exchangeSquarePointsManually() {
  if (!squareUnlocked || overflowed || compareBaseNumber(squarePointExchangeRequirement()) < 0) return false;

  return completeSquarePrestige({
    skippedCutscene: true,
    keepCurrentChapter: true,
    prestigeValue: getBaseNumber(),
    requiredValue: squarePointExchangeRequirement()
  });
}

function renderManualExchangeDock() {
  manualExchangeDock.classList.toggle('hidden', !squareUnlocked);

  const challengeReady = canCompleteKnuthChallenge();
  const devConsoleOpen = document.body.classList.contains('dev-console-open')
    || (typeof devConsoleIsOpen === 'function' && devConsoleIsOpen());
  const challengeId = activeKnuthChallengeId ?? 'kc1';
  knuthChallengeCompleteBtn.dataset.devChallengeId = challengeId;
  knuthChallengeCompleteBtn.textContent = `${challengeId.toUpperCase()} 도전 완료`;
  knuthChallengeCompleteBtn.classList.toggle('hidden', !challengeReady && !devConsoleOpen);
  knuthChallengeCompleteBtn.disabled = !devConsoleOpen && !challengeReady;

  const squareReady = squareUnlocked && !overflowed && compareBaseNumber(squarePointExchangeRequirement()) >= 0;
  manualSquareExchangeBtn.disabled = !squareReady;
  manualSquareExchangeCost.textContent = squareReady
    ? `획득 ${fmtPowerBase(squarePointGainForValue(getBaseNumber()))} SP`
    : `필요 ${fmtPowerBase(squarePointExchangeRequirement())}`;

  const convergenceReady = compareNumberValues(squarePoints, squareConvergenceExchangeRequirement()) >= 0;
  manualConvergenceExchangeBtn.disabled = !convergenceReady;
  manualConvergenceExchangeCost.textContent = convergenceReady
    ? `획득 ${fmt(squareConvergencePointGain())} CP`
    : `필요 ${fmt(squareConvergenceExchangeRequirement())} SP`;

  const knuthExchangeReady = canManuallyExchangeKnuthPoints();
  manualKnuthExchangeBtn.classList.toggle('hidden', !knuthUnlocked || !hasClaimedKnuthPoint);
  manualKnuthExchangeBtn.disabled = !knuthExchangeReady;
  const knuthGainText = fmtPowerBase(knuthPointGain());
  manualKnuthExchangeCost.textContent = knuthExchangeReady
    ? `획득 ${knuthGainText} KP`
    : `예상 획득 ${knuthGainText} KP · 필요 일반화 연구 8-1`;

}

prestigeBtn.addEventListener('click', () => completeSquarePrestige());
knuthChallengeCompleteBtn.addEventListener('click', completeKnuthChallenge);
manualSquareExchangeBtn.addEventListener('click', exchangeSquarePointsManually);
manualKnuthExchangeBtn.addEventListener('click', exchangeKnuthPointsManually);
