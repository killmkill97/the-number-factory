const ACHIEVEMENT_ONE_MILLION = 1000000n;
const ACHIEVEMENT_ONE_SEXTILLION = 10n ** 21n;
const ACHIEVEMENT_E9000 = 10n ** 9000n;
const ACHIEVEMENT_NO_UNIT_MINIMUM = 10n ** 30n;
const ACHIEVEMENT_NO_UNIT_MAXIMUM = 10n ** 33n;
const ACHIEVEMENT_OBFUSCATION_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=?<>[]{}';
const SECRET_ACHIEVEMENT_HINTS = {
  number_69_hold: '69의 의지',
  add_button_hold: '이것이 홀드로 되면 좋겠다고 생각한 거',
  negative_number: '물리세요',
  zero_ten_minutes: '기다려봐',
  exact_9000: '9000의 의지는 이어져야한다',
  research_reset_20: '이론 돌려막기',
  no_unit_save: 'no',
  load_save_ratio: '아무것도 얻지 않는 불러오기',
  all_currencies_same: '우린 하나야 영원한 평화속에서'
};

const ACHIEVEMENTS = [
  {
    id: 'first_step',
    title: '천리길도 한 걸음부터',
    description: '숫자 1을 얻으세요.',
    condition: () => compareBaseNumber(1n) >= 0
  },
  {
    id: 'power_of_multiplication',
    title: '곱셈의 힘',
    description: '퍼센트 시스템을 해금하세요.',
    condition: () => percentUnlocked
  },
  {
    id: 'million_is_not_much',
    title: '백만도 많지',
    description: '숫자 1M을 달성하세요.',
    condition: () => compareBaseNumber(ACHIEVEMENT_ONE_MILLION) >= 0
  },
  {
    id: 'good',
    title: '좋~아',
    description: '숫자 1sx 이상을 얻으세요.',
    condition: () => compareBaseNumber(ACHIEVEMENT_ONE_SEXTILLION) >= 0
  },
  {
    id: 'beginning_of_many_starts',
    title: '수많은 시작의 시작',
    description: 'SP를 얻으세요.',
    condition: () => isPositiveNumberValue(squarePoints)
  },
  {
    id: 'here_we_go',
    title: '가볼까?!',
    description: '제곱돌파를 해금하세요.',
    condition: () => squareBreakthroughEntered || canOpenSquareBreakthrough()
  },
  {
    id: 'current_energy',
    title: '현재 에너지 2e33W',
    description: '다이슨 스웜을 8개 이상 구매하세요.',
    condition: () => squareBreakthroughLevel('dyson_swarm') >= 8
  },
  {
    id: 'current_combination_time',
    title: '현재 조합 시간 2M h',
    description: '그렉텍 업그레이드를 최댓값으로 구매하세요.',
    condition: () => {
      const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === 'gregtech');
      return upgrade && squareBreakthroughLevel('gregtech') >= squareBreakthroughMax(upgrade);
    }
  },
  {
    id: 'convergence_and_divergence',
    title: '수렴과 발산',
    description: '수렴 포인트를 얻으세요.',
    condition: () => isPositiveNumberValue(squareConvergencePoints)
  },
  {
    id: 'my_theory_is_infinite',
    title: '나의 이론은 무한하오',
    description: '이론을 구매하세요.',
    condition: () => isPositiveNumberValue(theory)
  },
  {
    id: 'a_hundred_is_not_much',
    title: '100개도 많지',
    description: '이론을 총 100개 구매하세요.',
    condition: () => compareNumberValues(totalTheoryPurchased, 100n) >= 0
  },
  {
    id: 'convergence_times_divergence',
    title: '수렴을 발산번 만큼',
    description: '수렴 포인트 5배 업그레이드를 최대치로 구매하세요.',
    condition: () => squareConvergenceUpgradeLevel('cp_gain_5x') >= 8
  },
  {
    id: 'is_it_safe',
    title: '안전한 거 맞아?',
    description: '발산자를 해금하세요.',
    condition: () => divergerAvailable()
  },
  {
    id: 'one_hundred_percent_efficiency',
    title: '100퍼 효율 가동!',
    description: '발산자의 c를 최댓값(99)으로 만드세요.',
    condition: () => divergerC >= DIVERGER_C_MAX
  },
  {
    id: 'now_that_is_square',
    title: '이제야 제곱답군',
    description: '제곱 차원을 해금하세요.',
    condition: () => squareDimensionAvailable()
  },
  {
    id: 'third_dimension',
    title: '이제 3차원이지',
    description: 'z 변을 해금하세요.',
    condition: () => hasGeneralizationResearch('5-1')
  },
  {
    id: 'its_over_9000',
    title: "It's over 9000!!",
    description: '숫자를 e9000 이상 모으세요.',
    condition: () => compareBaseNumber(ACHIEVEMENT_E9000) >= 0
  },
  {
    id: 'its_over_square_9000',
    title: "It's over ^9000!!!",
    description: '제곱 포인트를 e9000 이상 모으세요.',
    condition: () => compareNumberValues(squarePoints, ACHIEVEMENT_E9000) >= 0
  },
  {
    id: 'debug_mode',
    category: 'secret',
    title: '야 그거 키면 안돼',
    description: '디버그 모드를 키세요.',
    condition: () => false
  },
  {
    id: 'number_69_hold',
    category: 'secret',
    title: '이거지 어~',
    description: '수를 69에서 69초 동안 유지하세요.',
    condition: () => false
  },
  {
    id: 'add_button_hold',
    category: 'secret',
    title: '그거 홀드로 안돼',
    description: '수 올리는 버튼을 5초간 홀드하세요.',
    condition: () => false
  },
  {
    id: 'negative_number',
    category: 'secret',
    title: '사람이 죽는다고!',
    description: '수를 음수로 만드세요. 현재는 달성 방법 없음.',
    condition: () => false
  },
  {
    id: 'zero_ten_minutes',
    category: 'secret',
    title: '이거 왜켰어?',
    description: '숫자 0을 10분간 유지하세요.',
    condition: () => false
  },
  {
    id: 'exact_9000',
    category: 'secret',
    title: 'it isnt over 9000',
    description: '수를 정확히 9000으로 만드세요.',
    condition: () => compareNumberValues(getBaseNumber(), 9000n) === 0
  },
  {
    id: 'research_reset_20',
    category: 'secret',
    title: '연구를 열심히하는너에게 찬사를',
    description: '일반화 연구 초기화를 20번 하세요.',
    condition: () => generalizationResetCount >= 20
  },
  {
    id: 'no_unit_save',
    category: 'secret',
    title: '아니야',
    description: '수를 no 단위에서 저장하세요.',
    condition: () => false
  },
  {
    id: 'load_save_ratio',
    category: 'secret',
    title: '뭘 불러오고 싶은거야?',
    description: '불러온 횟수를 저장 횟수의 최소 100배 이상으로 만드세요.',
    condition: () => saveCount > 0 && loadCount >= saveCount * 100
  },
  {
    id: 'all_currencies_same',
    category: 'secret',
    title: '우리는 모두 친구',
    description: '수, SP, CP, 이론을 전부 같은 값으로 맞추세요.',
    condition: () => isPositiveNumberValue(getBaseNumber())
      && compareNumberValues(getBaseNumber(), squarePoints) === 0
      && compareNumberValues(squarePoints, squareConvergencePoints) === 0
      && compareNumberValues(squareConvergencePoints, theory) === 0
  }
];

const achievementState = {};
const achievementUi = new Map();
let expandedAchievementId = null;
let number69HoldMs = 0;
let zeroNumberHoldMs = 0;
let lastAchievementTimerAt = achievementClockNow();
let addButtonHoldTimer = null;

for (const achievement of ACHIEVEMENTS) {
  achievementState[achievement.id] = false;
}

function achievementClockNow() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function unlockAchievement(id) {
  if (!(id in achievementState) || achievementState[id]) return false;
  achievementState[id] = true;
  return true;
}

function baseNumberIsInNoUnit() {
  return compareNumberValues(getBaseNumber(), ACHIEVEMENT_NO_UNIT_MINIMUM) >= 0
    && compareNumberValues(getBaseNumber(), ACHIEVEMENT_NO_UNIT_MAXIMUM) < 0;
}

function updateAchievements() {
  let changed = false;
  for (const achievement of ACHIEVEMENTS) {
    if (achievementState[achievement.id] || !achievement.condition()) continue;
    achievementState[achievement.id] = true;
    changed = true;
  }
  return changed;
}

function loadAchievementState(savedState) {
  for (const achievement of ACHIEVEMENTS) {
    achievementState[achievement.id] = savedState?.[achievement.id] === true;
  }
}

function resetAchievementTimers() {
  number69HoldMs = 0;
  zeroNumberHoldMs = 0;
  lastAchievementTimerAt = achievementClockNow();
}

function advanceAchievementTimers(elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return false;

  const currentNumber = getBaseNumber();
  if (compareNumberValues(currentNumber, 69n) === 0) number69HoldMs += elapsedMs;
  else number69HoldMs = 0;

  if (compareNumberValues(currentNumber, 0n) === 0) zeroNumberHoldMs += elapsedMs;
  else zeroNumberHoldMs = 0;

  let changed = false;
  if (number69HoldMs >= 69000) changed = unlockAchievement('number_69_hold') || changed;
  if (zeroNumberHoldMs >= 600000) changed = unlockAchievement('zero_ten_minutes') || changed;
  return changed;
}

function obfuscateAchievementText(text) {
  return Array.from(String(text), character => {
    if (/\s/.test(character)) return character;
    const index = Math.floor(Math.random() * ACHIEVEMENT_OBFUSCATION_GLYPHS.length);
    return ACHIEVEMENT_OBFUSCATION_GLYPHS[index];
  }).join('');
}

function ensureAchievementUi(achievement) {
  const existing = achievementUi.get(achievement.id);
  if (existing) return existing;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'achievement-card';
  button.addEventListener('click', () => {
    expandedAchievementId = expandedAchievementId === achievement.id ? null : achievement.id;
    renderAchievements();
  });

  const title = document.createElement('span');
  title.className = 'achievement-title';
  const description = document.createElement('span');
  description.className = 'achievement-description';
  const hint = document.createElement('span');
  hint.className = 'achievement-hint';
  const status = document.createElement('span');
  status.className = 'achievement-status';
  button.append(title, description, hint, status);

  const list = achievement.category === 'secret' ? secretAchievementList : achievementList;
  list?.appendChild(button);

  const ui = { button, title, description, hint, status };
  achievementUi.set(achievement.id, ui);
  return ui;
}

function renderAchievements() {
  if (!achievementList || !secretAchievementList) return;

  for (const achievement of ACHIEVEMENTS) {
    const ui = ensureAchievementUi(achievement);
    const achieved = achievementState[achievement.id] === true;
    const expanded = expandedAchievementId === achievement.id;
    const isSecretAndHidden = achievement.category === 'secret' && !achieved;
    const hintText = achievement.category === 'secret'
      && achievement.id !== 'debug_mode'
      && achievementState.debug_mode === true
      && !achieved
      ? SECRET_ACHIEVEMENT_HINTS[achievement.id]
      : '';
    ui.button.classList.toggle('achieved', achieved);
    ui.button.classList.toggle('is-expanded', expanded);
    ui.button.setAttribute('aria-expanded', String(expanded));
    ui.title.textContent = isSecretAndHidden
      ? obfuscateAchievementText(achievement.title)
      : achievement.title;
    ui.description.textContent = isSecretAndHidden
      ? obfuscateAchievementText(achievement.description)
      : achievement.description;
    ui.hint.textContent = hintText ? `힌트: ${hintText}` : '';
    ui.hint.hidden = !hintText;
    ui.status.textContent = achieved ? '달성 완료' : '미달성';
    ui.description.hidden = !expanded;
    ui.status.hidden = !expanded;
  }
}

function setAchievementCategory(category) {
  const showingSecret = category === 'secret';
  achievementList.classList.toggle('hidden', showingSecret);
  secretAchievementList.classList.toggle('hidden', !showingSecret);
  generalAchievementsTabBtn.classList.toggle('active', !showingSecret);
  secretAchievementsTabBtn.classList.toggle('active', showingSecret);
  generalAchievementsTabBtn.setAttribute('aria-selected', String(!showingSecret));
  secretAchievementsTabBtn.setAttribute('aria-selected', String(showingSecret));
  renderAchievements();
}

function setMultiplicationView(view) {
  const showingAchievements = view === 'achievements';
  multiplicationNumberViewPanel.classList.toggle('hidden', showingAchievements);
  achievementsViewPanel.classList.toggle('hidden', !showingAchievements);
  multiplicationNumberViewBtn.classList.toggle('active', !showingAchievements);
  achievementsViewBtn.classList.toggle('active', showingAchievements);
  multiplicationNumberViewBtn.setAttribute('aria-selected', String(!showingAchievements));
  achievementsViewBtn.setAttribute('aria-selected', String(showingAchievements));
  if (showingAchievements) renderAchievements();
}

function beginAddButtonHold() {
  if (addButtonHoldTimer !== null) return;
  addButtonHoldTimer = window.setTimeout(() => {
    addButtonHoldTimer = null;
    if (unlockAchievement('add_button_hold')) render();
  }, 5000);
}

function endAddButtonHold() {
  if (addButtonHoldTimer === null) return;
  window.clearTimeout(addButtonHoldTimer);
  addButtonHoldTimer = null;
}

addBtn?.addEventListener('pointerdown', event => {
  if (event.button !== undefined && event.button !== 0) return;
  try {
    addBtn.setPointerCapture(event.pointerId);
  } catch {
    // 일부 브라우저의 합성 포인터 이벤트에서는 포인터 캡처를 지원하지 않는다.
  }
  beginAddButtonHold();
});
addBtn?.addEventListener('pointerup', endAddButtonHold);
addBtn?.addEventListener('pointercancel', endAddButtonHold);
addBtn?.addEventListener('lostpointercapture', endAddButtonHold);
window.addEventListener('pointerup', endAddButtonHold);
window.addEventListener('pointercancel', endAddButtonHold);
window.addEventListener('blur', endAddButtonHold);
addBtn?.addEventListener('keydown', event => {
  if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
  beginAddButtonHold();
});
addBtn?.addEventListener('keyup', event => {
  if (event.key === 'Enter' || event.key === ' ') endAddButtonHold();
});

generalAchievementsTabBtn?.addEventListener('click', () => setAchievementCategory('general'));
secretAchievementsTabBtn?.addEventListener('click', () => setAchievementCategory('secret'));
multiplicationNumberViewBtn.addEventListener('click', () => setMultiplicationView('number'));
achievementsViewBtn.addEventListener('click', () => setMultiplicationView('achievements'));
setAchievementCategory('general');
setMultiplicationView('number');

setInterval(() => {
  const now = achievementClockNow();
  const elapsedMs = Math.max(0, now - lastAchievementTimerAt);
  lastAchievementTimerAt = now;
  if (advanceAchievementTimers(elapsedMs) && typeof render === 'function') render();
}, 100);

setInterval(() => {
  const hasHiddenSecret = ACHIEVEMENTS.some(
    achievement => achievement.category === 'secret' && !achievementState[achievement.id]
  );
  if (hasHiddenSecret) renderAchievements();
}, 120);
