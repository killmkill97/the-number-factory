const ACHIEVEMENT_ONE_MILLION = 1000000;
const ACHIEVEMENT_ONE_SEXTILLION = NumberMath.powerOfTen(21);
const ACHIEVEMENT_E9000 = NumberMath.powerOfTen(9000);
const ACHIEVEMENT_NO_UNIT_MINIMUM = NumberMath.powerOfTen(30);
const ACHIEVEMENT_NO_UNIT_MAXIMUM = NumberMath.powerOfTen(33);
const ACHIEVEMENT_SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
const ACHIEVEMENT_UNIVERSE_AGE_SECONDS = multiplyNumberValue(13800000000, ACHIEVEMENT_SECONDS_PER_YEAR);
const ACHIEVEMENT_INFINITE_YEAR_SECONDS = multiplyNumberValue('1.8e308', ACHIEVEMENT_SECONDS_PER_YEAR);
const ACHIEVEMENT_OBFUSCATION_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*+=?<>[]{}';
const ACHIEVEMENT_CARD_CLICK_COUNT_KEY = 'numberTycoonAchievementCardClickCounts_v1';
const ANSAN_RAIN_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=37.3333&longitude=126.7956&current=rain,showers&timezone=Asia%2FSeoul';
const SECRET_ACHIEVEMENT_HINTS = {
  real_one: '뉴스를 유심히봐',
  developer_presence: '힌트랄께 없어. 그냥 운이 좋아야해',
  developer_friend_presence: '힌트랄께 없어. 그냥 운이 좋아야해',
  internet_mental_share: '계정 연결',
  disconnected: '계정 해제',
  number_69_hold: '69의 의지',
  add_button_hold: '이것이 홀드로 되면 좋겠다고 생각한 거',
  negative_number: '물리세요',
  zero_ten_minutes: '기다려봐',
  exact_9000: '9000의 의지는 이어져야한다',
  research_reset_20: '이론 돌려막기',
  no_unit_save: 'no',
  load_save_ratio: '아무것도 얻지 않는 불러오기',
  all_currencies_same: '우린 하나야 영원한 평화속에서',
  konami_code: '유명한 치트 커맨드',
  killmkill97_program: 'killmkill97 실행',
  free: '클릭',
  achievement_card_click_100: '클릭클릭',
  secret_collection: '컬렉션',
  diverger_graph_up: '위로 드래그',
  currency_scale_max: '크게크게',
  lottery: '운',
  why: '왜',
  rainy_day: '개발자가 사는곳에 비가올때'
};

const ACHIEVEMENTS = [
  {
    id: 'first_step',
    title: '천리길도 한 걸음부터',
    description: '숫자 1을 얻으세요.',
    condition: () => compareBaseNumber(1) >= 0
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
    condition: () => compareNumberValues(totalTheoryPurchased, 100) >= 0
  },
  {
    id: 'convergence_times_divergence',
    title: '수렴을 발산번 만큼',
    description: '수렴 포인트 5배 업그레이드를 8회 구매하세요.',
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
    id: 'hyper_operation',
    title: '하이퍼 연산',
    description: 'KP 1개를 얻으세요.',
    condition: () => compareNumberValues(knuthPoints, 1) >= 0
  },
  {
    id: 'is_that_abstraction', title: '추상화라고?',
    description: '대이론을 구매하세요.',
    condition: () => isPositiveNumberValue(greatTheory)
      || compareNumberValues(greatTheoryCpCost, ABSTRACTION_CP_BASE_COST) > 0
      || compareNumberValues(greatTheoryKpCost, ABSTRACTION_KP_BASE_COST) > 0
      || compareNumberValues(greatTheorySpCost, ABSTRACTION_SP_BASE_COST) > 0
      || compareNumberValues(greatTheoryTheoryCost, 4) > 0
  },
  {
    id: 'two_arrow_slots', title: '슬롯이 두 개지요!',
    description: '커누스 화살표 슬롯을 2개 이상 가지세요.',
    condition: () => knuthSlotCapacity() >= 2
  },
  {
    id: 'life_is_choices', title: '인생은 선택의 연속',
    description: '추상화의 첫 번째 분기에서 연구를 하나 구매하세요.',
    condition: () => ABSTRACTION_RESEARCHES.some(research => research.branch
      && (research.branchGroup ?? 1) === 1 && hasAbstractionResearch(research.id))
  },
  {
    id: 'no_hands', title: '난 손이 없어',
    description: '이번 커누스 동안 직접 생산·구매·교환하지 않고 KP를 한 번에 500개 이상 얻으세요.',
    condition: () => false
  },
  {
    id: 'not_a_knuth', title: '이건 커누스가 아니야',
    description: '현실 시간 30초 이내에 커누스에 도달해 KP를 얻으세요.',
    condition: () => false
  },
  {
    id: 'i_am_speed', title: '내가 스피드야',
    description: '현실 시간 0.5초 이내에 커누스에 도달해 KP를 얻으세요.',
    condition: () => false
  },
  {
    id: 'all_those_upgrades', title: '이거 하려고 수많은 업글을 해 왔어',
    description: '기본 커누스 업그레이드의 2그룹을 해금하세요.',
    condition: () => knuthUnlocked && hasClaimedKnuthPoint && knuthBaseGroupUnlocked(2)
  },
  {
    id: 'current_energy_509', title: '현재 에너지 4.2e509',
    description: '다이슨 스웜을 32개 이상 보유하세요.',
    condition: () => squareBreakthroughLevel('dyson_swarm') >= 32
  },
  {
    id: 'a_challenge', title: '오호 도전이라',
    description: '아무 커누스 도전이나 완료하세요.',
    condition: () => KNUTH_CHALLENGES.some(challenge => hasCompletedKnuthChallenge(challenge.id))
  },
  {
    id: 'praise_sticker', title: '칭찬 스티커를 주마!',
    description: '모든 커누스 도전을 완료하세요.',
    condition: () => KNUTH_CHALLENGES.length > 0
      && KNUTH_CHALLENGES.every(challenge => hasCompletedKnuthChallenge(challenge.id))
  },
  {
    id: 'trained_convergence', title: '수렴을 수련한 자',
    description: 'CP를 1e50 이상 모으세요.',
    condition: () => compareNumberValues(squareConvergencePoints, '1e50') >= 0
  },
  {
    id: 'math_doctor', title: '수학박사',
    description: '분기 확장을 구매하고, 첫 분기 두 길을 포함해 함께 연구할 수 있는 모든 추상화 연구를 완료하세요.',
    condition: () => allCompatibleAbstractionResearchComplete()
  },
  {
    id: 'already_dead', title: '넌 이미 죽어 있다',
    description: '이번 수렴 구간 동안 퍼센트를 한 번도 사용하지 않고 CP를 얻으세요. 자동 사용도 포함합니다.',
    condition: () => false
  },
  {
    id: 'ora_ora', title: '설마 오라오라입니까~!?',
    description: '이번 커누스 동안 퍼센트를 한 번도 사용하지 않고 KP를 얻으세요. 자동 사용도 포함합니다.',
    condition: () => false
  },
  {
    id: 'pierce_universe', title: '우주를 뚫어 버려',
    description: '발산력을 1e1k 이상 얻으세요.',
    condition: () => compareNumberValues(divergerPower, '1e1000') >= 0
  },
  {
    id: 'how_to_erase_you', title: '널 없애려면 어떻게 해야 돼?',
    description: '이번 커누스 동안 직접 SP를 교환하지 않고 KP를 얻으세요.',
    condition: () => false
  },
  {
    id: 'destroyer_of_worlds', title: '세계의 파괴자',
    description: '클릭당 획득 수를 1e150k 이상으로 만드세요.',
    condition: () => compareNumberValues(effectivePerClick(), '1e150000') >= 0
      && compareNumberValues(finalNumberProductionGain(perClick, effectivePerClickMultiplier()), '1e150000') >= 0
  },
  {
    id: 'enough_already', title: '고마해라 마이 무겄다 아이가',
    description: '모든 1연산 장착 업그레이드를 동시에 착용하세요.',
    condition: () => {
      const upgrades = KNUTH_SLOT_UPGRADES.filter(upgrade => upgrade.slots === 1);
      return upgrades.length > 0 && upgrades.every(upgrade => hasKnuthUpgrade(upgrade.id));
    }
  },
  {
    id: 'twist_everything', title: '온몸 비틀기',
    description: '현재 가장 높은 퍼센트 소프트캡보다 수를 1e1m배 이상으로 만드세요.',
    condition: () => numberExceedsAchievementSoftcap()
  },
  {
    id: 'that_is_wrong', title: '그건 틀렸어!',
    description: '이번 커누스 동안 발산자와 제곱 차원을 한 번도 해금하지 않고 KP를 한 번에 20개 이상 얻으세요.',
    condition: () => false
  },
  {
    id: 'interstellar', title: '인터스텔라',
    description: '숫자 블랙홀을 해금하세요.',
    condition: () => knuthBaseUpgradeLevel('number_black_hole') > 0 || numberBlackHoleSystemEnabled
  },
  {
    id: 'beyond_universe', title: '우주를 지나서',
    description: '숫자 블랙홀의 누적 가속 시간을 138억 년 이상으로 만드세요.',
    condition: () => compareNumberValues(numberBlackHoleAccumulatedGameSeconds, ACHIEVEMENT_UNIVERSE_AGE_SECONDS) >= 0
  },
  {
    id: 'infinity_starts_here', title: '여기부터는 무한이야',
    description: '숫자 블랙홀의 누적 가속 시간을 1.8e308년 이상으로 만드세요.',
    condition: () => compareNumberValues(numberBlackHoleAccumulatedGameSeconds, ACHIEVEMENT_INFINITE_YEAR_SECONDS) >= 0
  },
  {
    id: 'ultramassive_black_hole', title: '극대질량 블랙홀',
    description: '숫자 블랙홀의 슈바르츠실트 반지름을 120b 이상으로 만드세요.',
    condition: () => (isPositiveNumberValue(numberBlackHoleTotalInvested) || isPositiveNumberValue(numberBlackHoleTotalSpInvested))
      && typeof numberBlackHoleSchwarzschildRadius === 'function'
      && compareNumberValues(numberBlackHoleSchwarzschildRadius(), 120000000000) >= 0
  },
  {
    id: 'hello_mr_knuth', title: '커누스 씨 안녕하세요',
    description: 'KP를 1e100 이상으로 만드세요.',
    condition: () => compareNumberValues(knuthPoints, '1e100') >= 0
  },
  {
    id: 'debug_mode',
    category: 'secret',
    title: '야 그거 키면 안돼',
    description: '디버그 모드를 키세요.',
    condition: () => false
  },
  {
    id: 'free',
    category: 'secret',
    title: '공짜',
    description: '이 업적을 누르세요.',
    condition: () => false
  },
  {
    id: 'achievement_card_click_100',
    category: 'secret',
    title: '그래 알았어 알았다고',
    description: '이 업적을 100번 누르세요.',
    condition: () => achievementCardClickCount('achievement_card_click_100') >= 100
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
    condition: () => compareNumberValues(getBaseNumber(), 9000) === 0
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
    condition: () => hasPerformedLoad && saveCount > 0 && loadCount >= saveCount * 100
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
  },
  {
    id: 'real_one',
    category: 'secret',
    title: '찐',
    description: '클릭할 수 있는 뉴스를 클릭하세요.',
    condition: () => false
  },
  {
    id: 'developer_presence',
    category: 'secret',
    title: '개발자 영접',
    description: '개발자 계정이 로그인한 상태로 게임에 머무를 때 함께 있으세요.',
    condition: () => currentAuthEmail() === 'killmkill97@gmail.com'
  },
  {
    id: 'developer_friend_presence',
    category: 'secret',
    title: '개발자 친구 영접',
    description: 'fdhewerg01@gmail.com 계정이 로그인한 상태로 게임에 머무를 때 함께 있으세요.',
    condition: () => currentAuthEmail() === 'fdhewerg01@gmail.com'
  },
  {
    id: 'internet_mental_share',
    category: 'secret',
    title: '인터넷과 정신 공유',
    description: '로그인하세요.',
    condition: () => Boolean(window.numberTycoonAuth?.getUser?.())
  },
  {
    id: 'disconnected',
    category: 'secret',
    title: 'DISCONNECTED',
    description: '로그아웃을 10번 하세요.',
    condition: () => authSignOutCount() >= 10
  },
  {
    id: 'konami_code',
    category: 'secret',
    title: '디버그 그렇게 키는거 아니야',
    description: '코나미 코드를 입력하세요(↑↑↓↓←→←→BA 입력).',
    condition: () => false
  },
  {
    id: 'killmkill97_program',
    category: 'secret',
    title: '내가 궁금하니?',
    description: 'Automatium의 N 언어 편집기에서 killmkill97을 입력하고 실행하세요.',
    condition: () => false
  },
  {
    id: 'secret_collection',
    category: 'secret',
    title: '비밀보다 더한 비밀',
    description: '이 업적을 제외한 모든 비밀 업적을 달성하세요.',
    condition: () => ACHIEVEMENTS
      .filter(achievement => achievement.category === 'secret' && achievement.id !== 'secret_collection')
      .every(achievement => achievementState[achievement.id] === true)
  },
  {
    id: 'diverger_graph_up',
    category: 'secret',
    title: '떡상가자!',
    description: '발산자의 그래프를 위로 드래그하세요.',
    condition: () => false
  },
  {
    id: 'currency_scale_max',
    category: 'secret',
    title: '근시',
    description: '화폐 표시 크기를 최대로 올리세요.',
    condition: () => Number(localStorage.getItem('numberTycoonCurrencyStatusScale')) >= 4
  },
  {
    id: 'lottery',
    category: 'secret',
    title: '로또 당첨',
    description: '1초마다 0.0000123% 확률로 이 업적이 달성됩니다.',
    condition: () => false
  },
  {
    id: 'why',
    category: 'secret',
    title: '왜',
    description: '게임 URL 뒤에 why를 붙여 접속하세요.',
    condition: () => isWhyEntryPath()
  },
  {
    id: 'rainy_day',
    category: 'secret',
    title: '비 오는 날 언제나',
    description: '대한민국 경기도 안산시 단원구 원곡동에 비가 올 때 게임에 접속하세요.',
    condition: () => false
  }
];

const ACHIEVEMENT_ICONS_ENABLED = false;
const GENERAL_ACHIEVEMENT_ICON_NUMBERS = new Map(
  ACHIEVEMENTS
    .filter(achievement => achievement.category !== 'secret')
    .map((achievement, index) => [achievement.id, index + 1])
);

const achievementState = {};
const achievementUi = new Map();
let expandedAchievementId = null;
let number69HoldMs = 0;
let zeroNumberHoldMs = 0;
let lastAchievementTimerAt = achievementClockNow();
let addButtonHoldTimer = null;
let hasPerformedLoad = false;
const achievementToastQueue = [];
let achievementToastActive = false;
let achievementToastTimer = null;
let achievementCardClickCounts = loadAchievementCardClickCounts();
let divergerGraphDragStart = null;

for (const achievement of ACHIEVEMENTS) {
  achievementState[achievement.id] = false;
}

function achievementClockNow() {
  return gameTimelineNowMs();
}

function currentAuthEmail() {
  return String(window.numberTycoonAuth?.getUser?.()?.email ?? '').trim().toLowerCase();
}

function authSignOutCount() {
  const count = Number(localStorage.getItem(AUTH_SIGN_OUT_COUNT_KEY));
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function loadAchievementCardClickCounts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACHIEVEMENT_CARD_CLICK_COUNT_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function achievementCardClickCount(id) {
  const count = Number(achievementCardClickCounts[id]);
  return Number.isSafeInteger(count) && count >= 0 ? count : 0;
}

function recordAchievementCardClick(id) {
  achievementCardClickCounts[id] = achievementCardClickCount(id) + 1;
  try {
    localStorage.setItem(ACHIEVEMENT_CARD_CLICK_COUNT_KEY, JSON.stringify(achievementCardClickCounts));
  } catch {
    // 저장 공간이 없어도 현재 세션의 업적 진행은 계속한다.
  }
}

function isWhyEntryPath() {
  const path = String(window.location.pathname ?? '').replace(/\/+$/, '');
  return path.endsWith('/why') || new URLSearchParams(window.location.search).has('why');
}

function unlockAchievementAndRender(id) {
  const changed = unlockAchievement(id);
  if (changed && typeof render === 'function') render();
  return changed;
}

function runAchievementToastQueue() {
  if (achievementToastActive || achievementToastQueue.length === 0) return;
  const achievement = achievementToastQueue.shift();
  if (!achievementToast || !achievementToastText) return;

  achievementToastActive = true;
  achievementToastText.textContent = achievement.title;
  achievementToast.classList.remove('is-visible', 'is-secret', 'is-general');
  achievementToast.classList.add(achievement.category === 'secret' ? 'is-secret' : 'is-general');
  void achievementToast.offsetWidth;
  achievementToast.classList.add('is-visible');

  achievementToastTimer = window.setTimeout(() => {
    achievementToast.classList.remove('is-visible', 'is-secret', 'is-general');
    achievementToastActive = false;
    achievementToastTimer = null;
    runAchievementToastQueue();
  }, 3000);
}

function queueAchievementToast(achievement) {
  if (!achievementToast || !achievementToastText) return;
  achievementToastQueue.push(achievement);
  runAchievementToastQueue();
}

function unlockAchievement(id) {
  if (!(id in achievementState) || achievementState[id]) return false;
  achievementState[id] = true;
  const achievement = ACHIEVEMENTS.find(item => item.id === id);
  if (achievement) queueAchievementToast(achievement);
  return true;
}

function baseNumberIsInNoUnit() {
  return compareNumberValues(getBaseNumber(), ACHIEVEMENT_NO_UNIT_MINIMUM) >= 0
    && compareNumberValues(getBaseNumber(), ACHIEVEMENT_NO_UNIT_MAXIMUM) < 0;
}

function allCompatibleAbstractionResearchComplete() {
  if (!knuthUnlocked || knuthBaseUpgradeLevel('extra_branch') < 1 || ABSTRACTION_RESEARCHES.length === 0) return false;
  return ABSTRACTION_RESEARCHES.every(research => hasPurchasedAbstractionResearch(research.id)
    || abstractionResearchBranchLocked(research));
}

function numberExceedsAchievementSoftcap() {
  if (!percentUnlocked || compareNumberValues(NumberMath.log10(getBaseNumber()), 1000000) < 0) return false;
  let highestSoftcap = percentPowerSoftcap(percentPower, percentPowerPurchaseBonus);
  for (const lane of extraPercentLanes) {
    highestSoftcap = NumberMath.max(highestSoftcap, percentPowerSoftcap(lane.power, lane.powerPurchaseBonus));
  }
  return compareNumberValues(
    NumberMath.subtract(NumberMath.log10(getBaseNumber()), NumberMath.log10(highestSoftcap)),
    1000000
  ) >= 0;
}

function observeAchievementProductionUnlocks() {
  if (hasGeneralizationResearch('3-1') || hasGeneralizationResearch('3-2') || hasKnuthUpgrade('permanent_production')) {
    achievementRunProgress.productionUnlocked = true;
  }
}

function snapshotAchievementKnuthRun() {
  observeAchievementProductionUnlocks();
  return { ...achievementRunProgress };
}

function normalizedAchievementRunProgress(saved) {
  const state = makeAchievementRunProgress(false);
  if (!saved || saved.version !== 1) return state;
  for (const key of Object.keys(state)) {
    if (key !== 'version') state[key] = saved[key] === true;
  }
  return state;
}

function loadAchievementRunProgress(saved, pending) {
  // Missing history cannot prove a restriction was respected in an old run.
  achievementRunProgress = normalizedAchievementRunProgress(saved);
  pendingAchievementKnuthRun = pendingKnuthPointClaim && pending
    ? normalizedAchievementRunProgress(pending)
    : null;
  observeAchievementProductionUnlocks();
}

function recordAchievementPercentUse() {
  achievementRunProgress.percentUsedKnuth = true;
  achievementRunProgress.percentUsedConvergence = true;
}

function recordAchievementConvergence() {
  if (compareNumberValues(squareConvergencePoints, '1e50') >= 0) unlockAchievement('trained_convergence');
  if (achievementRunProgress.convergenceKnown && !achievementRunProgress.percentUsedConvergence) {
    unlockAchievement('already_dead');
  }
  achievementRunProgress.convergenceKnown = true;
  achievementRunProgress.percentUsedConvergence = false;
}

function recordAchievementKnuthReward(gain, seconds, run) {
  if (!isPositiveNumberValue(gain)) return;
  if (Number.isFinite(seconds) && seconds >= 0) {
    if (seconds <= 30) unlockAchievement('not_a_knuth');
    if (seconds <= 0.5) unlockAchievement('i_am_speed');
  }
  if (!run?.knuthKnown) return;
  if (!run.manualGameplay && compareNumberValues(gain, 500) >= 0) unlockAchievement('no_hands');
  if (!run.percentUsedKnuth) unlockAchievement('ora_ora');
  if (!run.manualSpExchange) unlockAchievement('how_to_erase_you');
  if (!run.productionUnlocked && compareNumberValues(gain, 20) >= 0) unlockAchievement('that_is_wrong');
}

const ACHIEVEMENT_GAMEPLAY_BUTTON_IDS = new Set([
  'addBtn', 'upgradeClickBtn', 'autoClickerBtn', 'autoClickerSpeedBtn', 'autoClickerParallelBtn',
  'autoClickerPercentFillBtn', 'percentBtn', 'upgradeChargeBtn', 'percentPowerBtn', 'percentAutoBtn',
  'percentAutoSpeedBtn', 'percentParallelUnlockBtn', 'prestigeBtn', 'manualSquareExchangeBtn',
  'manualConvergenceExchangeBtn', 'manualKnuthExchangeBtn', 'knuthChallengeCompleteBtn',
  'researchTheoryBtn', 'researchTheoryMaxBtn', 'generalizationResetBtn', 'buyGreatTheoryBtn',
  'buyGreatTheoryMaxBtn', 'squareDimensionAutoUpgradeBtn', 'divergerAutoUpgradeBtn',
  'knuthOperationUpgradeBtn', 'autoUpgradeToggleBtn', 'abstractionResetToggle', 'knuthResetEquipmentToggle'
]);

function recordAchievementPlayerAction(event) {
  if (!event.isTrusted) return;
  if (event.type === 'contextmenu'
    && (!event.shiftKey || typeof devConsoleIsOpen !== 'function' || !devConsoleIsOpen())) return;
  const button = event.target?.closest?.('button');
  if (!button || button.disabled) return;
  const gameplay = ACHIEVEMENT_GAMEPLAY_BUTTON_IDS.has(button.id)
    || button.matches('.square-upgrade, .knuth-upgrade, [data-dev-upgrade-kind], [data-diverger-upgrade-id], .percent-lane button')
    || button.closest('#squareDimensionProductionPanel, #knuthProductionPanel');
  if (!gameplay || button.matches('.formula-help-trigger')) return;
  // Reopening the purchased N editor is navigation, not another purchase.
  if (button.dataset.devUpgradeId === 'automatium' && hasSquareConvergenceUpgrade('automatium')) return;
  achievementRunProgress.manualGameplay = true;
  if (button.id === 'manualSquareExchangeBtn' || button.id === 'prestigeBtn') {
    achievementRunProgress.manualSpExchange = true;
  }
}

document.addEventListener('click', recordAchievementPlayerAction, true);
document.addEventListener('contextmenu', recordAchievementPlayerAction, true);
document.addEventListener('keydown', event => {
  if (!event.isTrusted || event.key !== 'Enter') return;
  if (['numberBlackHoleAmountInput', 'numberBlackHoleSpeedInput'].includes(event.target?.id)
    || event.target?.closest?.('.dev-console')) {
    achievementRunProgress.manualGameplay = true;
  }
}, true);

function updateAchievements() {
  observeAchievementProductionUnlocks();
  let changed = false;
  for (const achievement of ACHIEVEMENTS) {
    if (achievementState[achievement.id] || !achievement.condition()) continue;
    changed = unlockAchievement(achievement.id) || changed;
  }
  return changed;
}

function checkAnsanRainAchievement() {
  fetch(ANSAN_RAIN_WEATHER_URL, { cache: 'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      const current = data?.current;
      const rain = Number(current?.rain ?? 0);
      const showers = Number(current?.showers ?? 0);
      if (rain > 0 || showers > 0) unlockAchievementAndRender('rainy_day');
    })
    .catch(() => {});
}

function finishDivergerGraphDrag(event) {
  if (!divergerGraphDragStart) return;
  const start = divergerGraphDragStart;
  divergerGraphDragStart = null;
  const dx = event.clientX - start.x;
  const dy = event.clientY - start.y;
  const distance = Math.hypot(dx, dy);
  const upwardAngle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
  if (distance >= 16 && dy < 0 && upwardAngle >= 45) {
    unlockAchievementAndRender('diverger_graph_up');
  }
}

divergerGraphScreen?.addEventListener('pointerdown', event => {
  if (event.button !== undefined && event.button !== 0) return;
  divergerGraphDragStart = { x: event.clientX, y: event.clientY };
  try {
    divergerGraphScreen.setPointerCapture(event.pointerId);
  } catch {
    // 포인터 캡처를 지원하지 않는 브라우저에서는 전역 pointerup으로 마무리한다.
  }
});
divergerGraphScreen?.addEventListener('pointerup', finishDivergerGraphDrag);
divergerGraphScreen?.addEventListener('pointercancel', () => {
  divergerGraphDragStart = null;
});
window.addEventListener('pointerup', finishDivergerGraphDrag);

setGameInterval(() => {
  if (achievementState.lottery || Math.random() >= 0.000000123) return;
  unlockAchievementAndRender('lottery');
}, 1000);

checkAnsanRainAchievement();

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
];
let konamiCodeIndex = 0;

window.addEventListener('keydown', event => {
  if (event.repeat) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (key === KONAMI_CODE[konamiCodeIndex]) {
    konamiCodeIndex += 1;
  } else {
    konamiCodeIndex = key === KONAMI_CODE[0] ? 1 : 0;
  }

  if (konamiCodeIndex !== KONAMI_CODE.length) return;
  konamiCodeIndex = 0;
  if (unlockAchievement('konami_code') && typeof render === 'function') render();
});

window.addEventListener('numberTycoonAuthChanged', () => {
  if (updateAchievements() && typeof render === 'function') render();
});

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
  if (compareNumberValues(currentNumber, 69) === 0) number69HoldMs += elapsedMs;
  else number69HoldMs = 0;

  if (compareNumberValues(currentNumber, 0) === 0) zeroNumberHoldMs += elapsedMs;
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
    if (achievement.id === 'free') unlockAchievementAndRender('free');
    if (achievement.id === 'achievement_card_click_100') {
      recordAchievementCardClick('achievement_card_click_100');
      if (achievementCardClickCount('achievement_card_click_100') >= 100) {
        unlockAchievementAndRender('achievement_card_click_100');
      }
    }
    expandedAchievementId = expandedAchievementId === achievement.id ? null : achievement.id;
    renderAchievements();
  });

  const title = document.createElement('span');
  title.className = 'achievement-title';
  const titleText = document.createElement('span');
  titleText.className = 'achievement-title-text';
  title.appendChild(titleText);

  const iconNumber = GENERAL_ACHIEVEMENT_ICON_NUMBERS.get(achievement.id);
  if (ACHIEVEMENT_ICONS_ENABLED && iconNumber && iconNumber !== 4) {
    const iconFrame = document.createElement('span');
    iconFrame.className = 'achievement-icon-frame';
    iconFrame.setAttribute('aria-hidden', 'true');
    const icon = document.createElement('img');
    icon.className = 'achievement-icon';
    icon.alt = '';
    icon.draggable = false;
    icon.src = `./assets/achievements/general/${iconNumber}.png?v=20261005-achievement-icons-v1`;
    icon.addEventListener('error', () => { iconFrame.hidden = true; }, { once: true });
    iconFrame.appendChild(icon);
    title.appendChild(iconFrame);
  }

  const description = document.createElement('span');
  description.className = 'achievement-description';
  const hint = document.createElement('span');
  hint.className = 'achievement-hint';
  const status = document.createElement('span');
  status.className = 'achievement-status';
  button.append(title, description, hint, status);

  const list = achievement.category === 'secret' ? secretAchievementList : achievementList;
  list?.appendChild(button);

  const ui = { button, title, titleText, description, hint, status };
  achievementUi.set(achievement.id, ui);
  return ui;
}

function renderAchievements() {
  if (!achievementList || !secretAchievementList) return;

  // The obfuscated text intentionally animates, but only while the secret
  // achievement list is actually visible. Rewriting every hidden card on each
  // game frame was a permanent source of layout work.
  const showingAchievementPanel = !achievementsViewPanel?.classList.contains('hidden');
  const showingSecretAchievements = showingAchievementPanel
    && !secretAchievementList.classList.contains('hidden');
  if (!showingAchievementPanel && achievementUi.size > 0) return;

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
    if (!isSecretAndHidden || showingSecretAchievements) {
      ui.titleText.textContent = isSecretAndHidden
        ? obfuscateAchievementText(achievement.title)
        : achievement.title;
      ui.description.textContent = isSecretAndHidden
        ? obfuscateAchievementText(achievement.description)
        : achievement.description;
    }
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

setGameInterval(() => {
  const now = achievementClockNow();
  const elapsedMs = Math.max(0, now - lastAchievementTimerAt);
  lastAchievementTimerAt = now;
  if (advanceAchievementTimers(elapsedMs) && typeof render === 'function') render();
}, 100);

setInterval(() => {
  if (gameSessionPaused()) return;
  const hasHiddenSecret = ACHIEVEMENTS.some(
    achievement => achievement.category === 'secret' && !achievementState[achievement.id]
  );
  const showingSecretAchievements = !achievementsViewPanel?.classList.contains('hidden')
    && !secretAchievementList?.classList.contains('hidden');
  if (hasHiddenSecret && showingSecretAchievements) renderAchievements();
}, 180);
