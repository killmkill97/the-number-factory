const LONG_MAX = '9223372036854775807';
const INT_MAX = '2147483647';
const MIN_PERCENT_CHARGE = 2;
const PERCENT_POWER_UNLOCK_CHARGE = 50;
const PERCENT_POWER_SOFTCAP_START = '1000000000000';
const APPROXIMATE_NUMBER_THRESHOLD = '1000000000000000000000000000000000';
const APPROXIMATE_COST_IGNORE_EXPONENT_GAP = 12;
const BASE_PERCENT_LANE_LIMIT = 8;
const MAX_PERCENT_LANES = 16;
const BASE_PER_CLICK_CAP = 256;
const BASE_AUTO_CLICKER_PARALLEL_CAP = 32;
const UPGRADED_AUTO_CLICKER_PARALLEL_CAP = 64;
const AUTO_CLICKER_TICK_MS = 10;
const PERCENT_AUTO_TICK_MS = 10;
const SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL = 1000;
const SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL = 1;
const SQUARE_DIMENSION_POWER_TIME_BASE_COST = '100000000000000000000000000';
const SQUARE_DIMENSION_POWER_STRENGTH_COST = '100000000000000000000';
const DIVERGER_BASE_INTERVAL = 1000;
const DIVERGER_MIN_INTERVAL = 500;
const DIVERGER_RESEARCH_MIN_INTERVAL = 100;
const DIVERGER_C_MAX = 99;
const NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT = 1;
const NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT = 100;
const NUMBER_BLACK_HOLE_BASE_DONATION_RATE = 1;
const NUMBER_BLACK_HOLE_DONATION_RATE_PER_UPGRADE = 10;
const NUMBER_BLACK_HOLE_BASE_UPGRADE_COST = 2;
const NUMBER_BLACK_HOLE_DONATION_COST_GROWTH = 2;
const NUMBER_BLACK_HOLE_SPEED_COST_GROWTH = 1.5;
const NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER = 1e100;
const PROBABILIZER_BALANCE = {
  a: 1,
  b: 100,
  rangeGrowth: 1.5,
  intervalMs: 1000,
  referencePower: 50,
  divergerParameterLogStrength: 0.15,
  divergerParameterScale: 4,
  timeLimitStrength: 6
};
const PROBABILIZER_UPGRADES = [
  { id: 'a', title: 'a값 증가', priceExponent: 2 },
  { id: 'b', title: 'b값 증가', priceExponent: 1 },
  { id: 'speed', title: '속도 증가', priceExponent: 5 },
  { id: 'shift', title: '분포도 이동', priceExponent: 10 }
];
const PROBABILIZER_POWER_UPGRADES = [
  { id: 'gain', title: '무작위력 증폭', baseCost: 1000000000, growth: 10 },
  { id: 'diverger', title: '발산자 강화 증폭', baseCost: 5000000000, growth: 50 },
  { id: 'interval_floor', title: '속도 하한 완화', baseCost: 5000000000, growth: 25 }
];
const PROBABILIZER_COST_BALANCE = {
  kpThresholdExponent: 500,
  kpGrowthExponentMultiplier: 2,
  kpBandStartExponent: 500,
  kpBandWidth: 100,
  kpBandGrowth: 4,
  divergerPowerThreshold: 1e40,
  divergerPowerGrowth: 2000
};
const NUMBER_BLACK_HOLE_MAX_DONATION_RATE = Number.MAX_SAFE_INTEGER;
const KC4_TIME_BALANCE = { halfLifeSeconds: 1 };
const KNUTH_BASE_AUTO_INTERVAL_MS = 250;
const KNUTH_BASE_AUTO_BATCH_LIMIT = 64;
const KNUTH_BASE_AUTO_BUDGET_MS = 4;
const KNUTH_LATE_BASE_BALANCE = {
  passiveRadiusPerRealSecond: 1,
  singularityBaseLimit: 16,
  singularityMinimumGrowth: 4
};
const KNUTH_OPERATION_MAX_LEVEL = 300;
const KC6_BALANCE = {
  percentGainExponent: 1e-10,
  operationGrowthExponent: 10,
  kpBandStartExponent: 200,
  kpBandWidth: 100,
  kpBandGrowth: 2
};
const KNUTH_ADVANCED_POWER_DECAY = { fullCopies: 30, bonusPower: 1.2 };
const KNUTH_ADVANCED_UPGRADES = [
  { id: 'cp_power', title: '수렴 거듭제곱', description: '최종 CP 획득량을 1.03제곱합니다. 30개까지는 기존 효과를 유지하고, 31개째부터 추가 강화분을 매번 1.2제곱해 약화합니다. (1.03 → 약 1.01488 → 약 1.00641…)', diminishingPower: true, slots: 10, effect: 1.03, startExponent: 1000, growthExponent: 250 },
  { id: 'kp_power', title: '커누스 거듭제곱', description: '최종 KP 획득량을 1.05제곱합니다. 30개까지는 기존 효과를 유지하고, 31개째부터 추가 강화분을 매번 1.2제곱해 약화합니다. 최종 지급량은 정수로 버립니다.', diminishingPower: true, slots: 16, effect: 1.05, startExponent: 1000, growthExponent: 400 },
  { id: 'percent_power', title: '퍼센트 거듭제곱', description: '퍼센트로 얻는 최종 수를 1.05제곱합니다.', slots: 16, effect: 1.05, startExponent: 1200, growthExponent: 500 },
  { id: 'random_gain', title: '무작위력 증폭', description: '확률자가 얻는 무작위력을 1.05배 합니다.', slots: 20, effect: 1.05, startExponent: 1200, growthExponent: 300 },
  { id: 'group_effect', title: '기초 연산 공명', description: '기본 커누스 1그룹의 구매당 효과를 1.04배 합니다.', slots: 24, effect: 1.04, startExponent: 1400, growthExponent: 320 }
];
const KNUTH_REPEATABLE_COST_BALANCE = { kpBandStartExponent: 400, kpBandWidth: 100, kpBandGrowth: 4 };
const NUMBER_BLACK_HOLE_AUTO_INTERVAL_MS = 250;
const NUMBER_BLACK_HOLE_AUTO_BATCH_LIMIT = 256;
const NUMBER_BLACK_HOLE_BALANCE = {
  radiusReference: 0.5,
  timeScale: 200,
  timeExponent: 1,
  spRadiusMultiplier: 4,
  spDonationCountStrength: 0.01
};
const SINGULARITY_BALANCE = {
  radiusStart: 20,
  radiusGrowth: 10,
  radiusStrength: 0.05,
  spRequirementMaxDivisor: 10,
  spRequirementSpeedLogScale: 1,
  spRequirementRadiusLogScale: 1,
  blackHoleStrength: 99,
  percentStrength: 99,
  softcapStrength: 99,
  kpStrength: 4,
  kpPower: 2
};
const SINGULARITY_UPGRADES = [
  { id: 'black_hole', title: '특이점 블랙홀 강화', baseCost: 1, growth: 4 },
  { id: 'kp_gain', title: '특이점 KP 증폭', baseCost: 2, growth: 8 }
];
const THEORY_SQUARE_POINT_BASE_COST = '1000000000';
const THEORY_SQUARE_POINT_COST_GROWTH = 10;
const THEORY_SQUARE_POINT_COST_ACCELERATION_THRESHOLD = `1${'0'.repeat(300)}`;
const THEORY_SQUARE_POINT_COST_ACCELERATED_GROWTH = `1${'0'.repeat(100)}`;
const THEORY_CONVERGENCE_POINT_BASE_COST = 1;
const THEORY_CONVERGENCE_POINT_COST_GROWTH = 2;
const ABSTRACTION_CP_BASE_COST = '1000000000000000';
const ABSTRACTION_CP_COST_GROWTH = 10;
const ABSTRACTION_KP_BASE_COST = 1;
const ABSTRACTION_KP_COST_GROWTH = 2;
const ABSTRACTION_SP_BASE_COST = '1e1000';
const ABSTRACTION_SP_COST_GROWTH = '1e1000';
const ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD = '1e1000000';
const ABSTRACTION_SP_COST_ACCELERATED_GROWTH = '1e500000';
const ABSTRACTION_SP_PURCHASE_COST_LIMIT = '1e100000000';
// M = 1 + strength * log2(1 + O / scale).
const KNUTH_PERCENT_OVERFLOW_BALANCE = { strength: 3, scale: 100000 };
// Exponential curves use the scaled value as log10(M); others retain 1 + scaled.
// Tier-4.5 anchors: N=34, R=20, A=49; q=4/K=1 and squared cap yield ~1.5 SP exponents.
const KNUTH_EQUIPMENT_BALANCE = {
  dysonDiverger: { logStrength: 0.045, scale: 12 },
  accumulatedTimeSp: { strength: 7, scale: 1000000, curve: 1 },
  groupPercent: { strength: 400, scale: 34, curve: 1.1, exponential: true },
  researchResources: { strength: 1.5, scale: 20, curve: 1.1, exponential: true },
  divergerBlackHole: { strength: 100, scale: 1000, curve: 1.1 },
  achievementPercent: { strength: 400, scale: 49, curve: 1.5, exponential: true },
  includeSecretAchievements: true
};
// M = 1 + strength * log2(1 + (input / scale)^curve).
// Number research uses log10(1 + Number) as input; scale anchors the current stage.
const ABSTRACTION_TIER9_BALANCE = {
  cpFromKp: { strength: 7, scale: 13, curve: 1 },
  percentFromNumber: { strength: 7, scale: 2000000, curve: 1 }
};
const ABSTRACTION_TIER16_BALANCE = {
  dysonStrength: 0.16,
  squarePowerLogScale: 1000
};
const ABSTRACTION_TIER17_BALANCE = {
  singularityCpLogStrength: 30,
  singularityReference: 2,
  singularityCpCurve: 1.25,
  cpBasePower: 6,
  divergerNSpeedStrength: 170,
  divergerALogScale: 100
};
const ABSTRACTION_MINI_BRANCH_BALANCE = {
  requirementLogDiscountPerSingularity: 0.75,
  radiusEffectStrength: 0.15,
  radiusReference: 50,
  spFromCpPower: 0.5,
  cpRadiusLogStrength: 30,
  dysonSingularityStrength: 0.075,
  dysonReference: 16,
  dysonEffectPower: 1.005,
  aFromBStrength: 0.125,
  bReference: 800,
  nSingularityStrength: 0.075,
  nLogReference: 26
};
const ABSTRACTION_TIER19_BALANCE = {
  softcapPowerStrength: 3.9e35,
  singularityScale: 11,
  divergerDysonMaxBonus: 128,
  divergerDysonLogScale: 10800
};
const ABSTRACTION_TIER20_BALANCE = {
  requiredRandomPower: 2500000000,
  boostLogStrength: 1,
  timeLimitPower: 2
};
const ABSTRACTION_TIER21_BALANCE = { rangeMaximum: 1e308, rangeGrowth: 1.1 };
const ABSTRACTION_TIER23_BALANCE = {
  passiveCpFraction: 0.01,
  randomPowerKpLogScale: 50,
  randomPowerKpExponent: 60,
  randomPowerKpCurve: 0.75,
  permanentSpFraction: 0.01
};
const ABSTRACTION_TIER24_BALANCE = {
  randomPowerLogScale: 50,
  percentLogStrength: 12,
  percentCurve: 0.75
};
const ABSTRACTION_PRODUCTION_BRANCH_BALANCE = {
  cpLogScale: 50,
  cpLogStrength: 3885,
  cpCurve: 0.75,
  distributionLogScale: 50,
  rangeLogScale: 50,
  rangeLogStrength: 6,
  rangeCurve: 0.5,
  probabilizerTimePower: 0.02,
  reserveRadiusScale: 20,
  reservePerRadiusDecade: 4,
  singularityBonusRadiusScale: 20,
  singularityBonusStrength: 1,
  singularityBonusCurve: 0.5,
  blackHoleLimitMultiplier: 1000,
  blackHoleCpLogScale: 6,
  blackHoleCpLogStrength: 6177,
  blackHoleCpCurve: 0.75
};
const ABSTRACTION_TIER28_BALANCE = {
  massReferenceMg: 60000,
  massCurve: 0.75,
  singularityLimitStrength: 4,
  timeLimitLogStrength: 40
};
// All times in this branch are unaccelerated wall-clock seconds.
const ABSTRACTION_SECOND_BRANCH_BALANCE = {
  timeScale: 300,
  // Resource peaks: active = 4x passive, idle = 5x passive.
  activeSpStrength: 799999,
  activeCpStrength: 199,
  activeKpStrength: 21,
  activeParameterStrength: 3,
  activeDecayPower: 0.5,
  activeSpeedReduction: 8,
  passiveSp: 200000,
  passiveCp: 50,
  passiveKp: 5.5,
  passiveSpeed: 1.5,
  passiveParameters: 1.5,
  idleSpStrength: 999999,
  idleCpStrength: 249,
  idleKpStrength: 26.5,
  idleSpeed: 0.1,
  idleParameters: 5
};
const GENERALIZATION_RESET_BASE_COST = '10000';
const GENERALIZATION_CONVERGENCE_SP_REWARD = '10000000000';
const SQUARE_CONVERGENCE_EXCHANGE_REQUIREMENT = `1${'0'.repeat(16)}`;
const SQUARE_CONVERGENCE_IMPROVED_EXCHANGE_REQUIREMENT = `1${'0'.repeat(15)}`;
const SAVE_VERSION = 42;
const ABSTRACTION_PRESET_FREE_SLOTS = 8;
const ABSTRACTION_PRESET_EXTRA_BASE_COST = 1000000;
const ABSTRACTION_PRESET_NAME_MAX_LENGTH = 300;
const SAVE_KEY = 'numberTycoonSave_v1';
const SAVE_STATS_KEY = 'numberTycoonSaveStats_v1';
const AUTH_SIGN_OUT_COUNT_KEY = 'numberTycoonAuthSignOutCount';
const SPACE_EXPANSION_BALANCE = {
  multiplierPower: 0.25,
  higgsCpLogScale: 10,
  higgsPower: 3,
  massReferenceMg: 60000,
  massCurve: 0.75,
  radiusStrength: 99,
  randomLogStrength: 12
};
const STAGNANT_SINGULARITY_BALANCE = { firstMassMg: 1000, requirementPower: 2 };
const SPACE_EXPANSION_UPGRADES = [
  { id: 'higgs_gain', title: '힉스입자 증폭', description: '힉스입자를 구매마다 3배 더 얻습니다.', baseCostMg: 64000, growth: 9, effect: 3 },
  { id: 'mass_gain', title: '정체된 질량 생산 강화', description: '정체된 질량을 구매마다 5배 더 얻습니다.', baseCostMg: 32000, growth: 25, effect: 5 },
  { id: 'mass_effect', title: '정체된 특이점 효과 강화', description: '정체된 특이점이 주는 최종 배율을 구매마다 2배로 만듭니다.', baseCostMg: 64000, growth: 32, effect: 2 }
];
const SPACE_EXPANSION_EXTRA_BALANCE = {
  multiplierPower: 0.3,
  spLogPower: 1.5,
  percentMassMg: 15000000,
  percentLogStrength: 24,
  massCurve: 0.75,
  slotHiggsLogScale: 6,
  slotStrength: 16,
  slotCurve: 0.85,
  overfeedMassMg: 500000000,
  overfeedStrength: 999,
  groupMassMg: 2000000000,
  groupStrength: 0.15
};
const SPACE_EXPANSION_ONE_TIME_UPGRADES = [
  { id: 'penalty_relief', title: '공간 팽창 완화', costMg: 5000000, description: '공간 팽창의 배율 약화와 SP의 추가 로그 압축을 완화합니다.' },
  { id: 'mass_percent', title: '질량의 퍼센트', costMg: 15000000, description: '정체된 특이점의 개수에 따라 퍼센트로 얻는 수를 증폭합니다.' },
  { id: 'n_automation', title: '공간 팽창 자동화', costMg: 5000000, description: 'N에서 힉스입자·SM·공간 팽창 상태·종료 보상을 조회하고 공간 팽창을 시작하거나 종료할 수 있습니다.' },
  { id: 'higgs_slots', title: '힉스 연산', costMg: 100000000, description: '보유 힉스입자에 따라 연산 슬롯을 추가로 얻습니다. 연산 강화의 구매 횟수와 가격은 바뀌지 않습니다.' },
  { id: 'overfeed', title: '질량 초과 투여', costMg: 500000000, description: '정체된 특이점의 개수에 따라 블랙홀 투여량을 100% 넘게 설정할 수 있습니다. 25-2 연구가 활성화되어 있어야 적용됩니다.' },
  { id: 'group_boost', title: '기초 연산의 질량', costMg: 2000000000, description: '정체된 특이점의 개수에 따라 기본 커누스 1그룹의 구매당 배율과 2그룹 다이슨 스웜 확장의 추가 개수를 강화합니다.' },
  { id: 'definition_space', title: '정의에 닿기 위한 공간', costMg: 5.9722e30, description: '정의에 닿기 위한 공간을 확장합니다.' }
];
const DEFINITION_STORY_LINES = [
  '???: 설마 여기까지 도달한 사람이 있을 줄이야.',
  '???: 공간을 무식하게 늘려서 여기까지 도달하다니, 정말 상상을 초월하는군',
  '???: 아 인사가 늦었지, 난 그레이엄 수라고 한다',
  '그레이엄 수: 전 어센디드자, 이 구역의 문지기지',
  '그레이엄 수: 너에게는 이제 특별한 권한이 생겼어',
  '그레이엄 수: 바로 정의 파편이지',
  '그레이엄 수: 그걸 몇 개 가지고 있으면 이제 나랑 대면할 수 있을 거야',
  '그레이엄 수: 너에게 권한을 주마',
  '그레이엄 수: KP가 충분하다면 여러 개를 한 번에 얻을 수 있을 거야',
  '그레이엄 수: 물론 지금은 내가 바로 해야 할 의무가 있어서 말이야, 바로 바꿀 거야.',
  '그레이엄 수: 그러면 나중에 보자 친구'
];
