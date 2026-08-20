function checkOverflow() {
  const request = squarePrestigeConversionRequest();
  if (request !== null && num >= request.requiredValue && !overflowed) {
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
  if (request === null || overflowed || num < request.requiredValue) return false;

  const targetedConversion = request.pointReward !== null;
  pendingSquarePrestigeRequirement = request.requiredValue;
  pendingSquarePrestigeValue = targetedConversion ? request.requiredValue : num;
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

  const displayValue = num > LONG_MAX ? num - (1n << 64n) : num;
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
  const rewardValue = prestigeValue ?? pendingSquarePrestigeValue ?? num;
  const targetedReward = squarePointReward ?? pendingSquarePrestigePoints;
  const minimumValue = requiredValue
    ?? pendingSquarePrestigeRequirement
    ?? (targetedReward === null ? gameEndValue() : squarePrestigeNumberForPointReward(targetedReward));
  if (num < minimumValue) return false;

  pendingSquarePrestigeValue = null;
  pendingSquarePrestigePoints = null;
  pendingSquarePrestigeRequirement = null;
  squareUnlocked = true;
  squareMode = false;
  const gainedSquarePoints = targetedReward ?? squarePointGainForValue(rewardValue);
  squarePoints += gainedSquarePoints;
  const gainedConvergencePoints = collectSquareConvergenceIfReady();

  resetRunStateAfterSquarePrestige();
  overflowed = false;
  displayBox.classList.remove('glitch');

  dialogueBox.classList.remove('show');
  dialogueBox.innerHTML = '';
  prestigeBtn.classList.add('hidden');
  percentSection.classList.toggle('hidden', !percentUnlocked);
  extraPercentLanesEl.innerHTML = '';

  addBtn.disabled = false;
  addBtn.textContent = `+${perClick.toString()}`;

  setChapter(gainedConvergencePoints > 0n ? 'square-convergence' : keepCurrentChapter ? activeChapter : 'square');
  log(`제곱 프레스티지 완료${skippedCutscene ? ' (컷신 스킵)' : ''} — ${fmt(gainedSquarePoints)} SP를 얻고 기본 게임을 재시작했습니다.`, true);
  if (gainedConvergencePoints > 0n) {
    log(`${fmt(gainedConvergencePoints)} CP를 얻고 제곱 업그레이드와 제곱돌파 업그레이드가 초기화되었습니다.`, true);
  }
  render();
  return true;
}

prestigeBtn.addEventListener('click', () => completeSquarePrestige());
