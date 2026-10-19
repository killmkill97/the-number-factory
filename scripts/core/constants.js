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
