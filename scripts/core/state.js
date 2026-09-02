let num = 0n;
let approximateNum = null;
let perClick = 1n;
let perClickUpgradeCost = 10n;

let percentUnlocked = false;
let percentCharge = 0;
let percentChargeNeeded = 100;
let percentChargeLevel = 0;
let percentChargeUpgradeCost = 250n;

// 퍼센트 파워: 기본 +1%. 요구 클릭 수가 50 이하일 때 해금
let percentPower = 1;
let percentPowerUpgradeCost = 40000n;

let overflowed = false;
let squareMode = false;
let squareUnlocked = false;
let squareBreakthroughEntered = false;
let tetrationUnlocked = false;
let tetrationDimensionsUnlocked = false;
let activeChapter = 'multiplication';
let squarePoints = 0n;
let squareConvergenceUnlocked = false;
let squareConvergencePoints = 0n;
const SQUARE_DIMENSION_SCALE = 100n;
let squareDimensionX = 500n;
let squareDimensionY = 600n;
let squareDimensionXCost = 1n;
let squareDimensionYCost = 1n;
let squareDimensionXGrowthLevel = 1n;
let squareDimensionYGrowthLevel = 1n;
let squareDimensionXGrowthCarry = 0;
let squareDimensionYGrowthCarry = 0;
let squareDimensionPowerInterval = SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL;
let squareDimensionPowerIntervalCost = SQUARE_DIMENSION_POWER_TIME_BASE_COST;
let squareDimensionPowerStrengthUnlocked = false;
let theory = 0n;
let theoryNumberCost = THEORY_NUMBER_BASE_COST;
let theorySquarePointCost = THEORY_SQUARE_POINT_BASE_COST;
let theoryConvergencePointCost = THEORY_CONVERGENCE_POINT_BASE_COST;
let theoryCostResourceIndex = 0;
let pendingSquarePrestigeValue = null;
let pendingSquarePrestigePoints = null;
let pendingSquarePrestigeRequirement = null;
let lsp = 0n;
let tetraP = 0n;
let autoLspConverterUnlocked = false;
let autoLspConverterEnabled = false;
let autoUpgradeEnabled = false;
let autoUpgradeTimer = 0;
let autoClickerSpeed = 1000;

let autoClickerUnlocked = false;
let autoClickerPrice = 100n;
let autoClickerSpeedPrice = 200n;
let autoClickerTimer = 0;

// 오토 클릭커 병렬화: 구매할 때마다 한 주기당 클릭 수가 2배
let autoClickerParallel = 1n;
let autoClickerParallelPrice = 1000n;

// 오토 클릭커의 자동 클릭도 % 충전으로 인정하는 업그레이드
let autoClickerPercentFillUnlocked = false;
const autoClickerPercentFillPrice = 20000n;

// % 오토클리커 설정
let percentAutoUnlocked = false;
let percentAutoPrice = 150n;
const percentAutoSpeedLevels = [1000, 800, 600, 400, 200]; // 1초 → 0.8초 → 0.6초 → 0.4초 → 0.2초
let percentAutoSpeedLevel = 0;
let percentAutoSpeed = percentAutoSpeedLevels[percentAutoSpeedLevel];
let percentAutoSpeedPrice = 250n;
let percentAutoTimer = 0;

function isApproximateNumber(value) {
  return NumberMath.isScientific(value);
}

function normalizeApproximateNumber(mantissa, exponent) {
  return NumberMath.normalize(mantissa, exponent);
}

function approximateNumberFromBigInt(value) {
  const normalized = NumberMath.fromBigInt(value);
  return isApproximateNumber(normalized) ? normalized : null;
}

function approximateNumberFromString(rawValue) {
  const normalized = NumberMath.fromString(rawValue, null);
  return isApproximateNumber(normalized) ? normalized : null;
}

function getBaseNumber() {
  return approximateNum ?? num;
}

function setBaseNumber(value) {
  if (isApproximateNumber(value)) {
    approximateNum = normalizeApproximateNumber(value.mantissa, value.exponent);
    num = APPROXIMATE_NUMBER_THRESHOLD;
    return;
  }

  const normalized = NumberMath.fromBigInt(value);
  if (isApproximateNumber(normalized)) {
    approximateNum = normalized;
    num = APPROXIMATE_NUMBER_THRESHOLD;
    return;
  }

  approximateNum = null;
  num = normalized;
}

function setBaseNumberFromSave(rawValue) {
  setBaseNumber(NumberMath.fromString(rawValue));
}

function serializeBaseNumber() {
  return NumberMath.serialize(getBaseNumber());
}

function serializeNumberValue(value) {
  return NumberMath.serialize(value);
}

function toApproximateNumber(value) {
  return NumberMath.toScientific(value);
}

function compareNumberValues(left, right) {
  return NumberMath.compare(left, right);
}

function compareBaseNumber(value) {
  return compareNumberValues(getBaseNumber(), value);
}

function canAffordBaseCost(cost) {
  return compareBaseNumber(cost) >= 0;
}

function addBaseNumbers(left, right) {
  return NumberMath.add(left, right);
}

function subtractNumberValues(left, right) {
  return NumberMath.subtract(left, right);
}

function multiplyNumberValue(value, multiplier) {
  return NumberMath.multiply(value, multiplier);
}

function divideNumberValue(value, divisor) {
  return NumberMath.divide(value, divisor);
}

function powerOfTenValue(exponent) {
  return NumberMath.powerOfTen(exponent);
}

function addToBaseNumber(value) {
  setBaseNumber(addBaseNumbers(getBaseNumber(), value));
}

function multiplyBaseNumber(multiplier) {
  setBaseNumber(multiplyNumberValue(getBaseNumber(), multiplier));
}

function addFractionOfBaseNumber(numerator, denominator = 100n) {
  const gain = divideNumberValue(
    multiplyNumberValue(getBaseNumber(), numerator),
    denominator
  );
  addToBaseNumber(gain);
}

function spendBaseCost(cost) {
  if (!canAffordBaseCost(cost)) return false;
  setBaseNumber(NumberMath.subtract(getBaseNumber(), cost, {
    ignoreGap: APPROXIMATE_COST_IGNORE_EXPONENT_GAP
  }));
  return true;
}

function ensureBaseNumberAtLeast(value) {
  if (compareBaseNumber(value) < 0) setBaseNumber(value);
}

function numberValueFromSave(rawValue, fallback = 0n) {
  return NumberMath.fromString(rawValue, fallback);
}

function isPositiveNumberValue(value) {
  return NumberMath.isPositive(value);
}

function isZeroNumberValue(value) {
  return NumberMath.isZero(value);
}

function minimumNumberValue(left, right) {
  return NumberMath.min(left, right);
}

// 퍼센트 병렬화: 2번째 레인은 20만, 이후 레인 해금 비용은 2배씩 증가
let percentLaneCount = 1;
let nextPercentLaneUnlockCost = 200000n;
const extraPercentLanes = [];
const tetrationDimensions = Array(TETRATION_DIMENSION_COUNT).fill(0n);
const tetrationDimensionPurchases = Array(TETRATION_DIMENSION_COUNT).fill(0n);
const tetrationDimensionCosts = Array.from(
  { length: TETRATION_DIMENSION_COUNT },
  (_, index) => initialTetrationDimensionCost(index)
);

function initialTetrationDimensionCost(index) {
  if (index === 0) return 0n;
  return 16n ** BigInt(index);
}

const TETRATION_UPGRADES = [];

const tetrationUpgradeState = {};
for (const upgrade of TETRATION_UPGRADES) {
  tetrationUpgradeState[upgrade.id] = false;
}

const SQUARE_CONVERGENCE_UPGRADES = [
  {
    id: 'timium',
    title: 'timium',
    description: '게임 전체가 2048배 빠르게 흐릅니다.',
    cost: 1n
  },
  {
    id: 'galaxium',
    title: 'galaxium',
    description: '클릭과 오토 클릭커로 얻는 숫자가 2048배가 됩니다.',
    cost: 1n
  },
  {
    id: 'automatium',
    title: 'automatium',
    description: 'N 프로그램으로 게임을 자동화합니다. 구매 후 다시 눌러 편집기를 엽니다.',
    cost: 1n
  },
];

const squareConvergenceUpgradeState = {};
for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
  squareConvergenceUpgradeState[upgrade.id] = false;
}

const GENERALIZATION_RESEARCHES = [
  {
    id: '1-1',
    column: 1,
    row: 1,
    title: '병목 추적기 효율 강화',
    description: '병목 추적기가 제공하는 퍼센트 효율 증가량이 2배가 됩니다.',
    parents: [],
    theoryCost: 1n
  },
  {
    id: '2-1',
    column: 2,
    row: 1,
    title: '제곱 교환 효율',
    description: '제곱 포인트 교환 요구량이 long 최댓값에서 800경으로 줄어듭니다.',
    parents: ['1-1'],
    theoryCost: 2n
  },
  {
    id: '2-2',
    column: 2,
    row: 2,
    title: '수렴 교환 효율',
    description: '수렴 포인트 교환 요구량 기준을 100sp로 설정합니다.',
    parents: ['1-1'],
    theoryCost: 2n
  },
  {
    id: '3-1',
    column: 3,
    row: 1,
    title: '제곱 차원',
    description: '제곱 차원 화면과 제곱력 생산 효과를 해금합니다.',
    parents: ['2-1'],
    theoryCost: 3n
  }
];

const generalizationResearchState = {};
for (const research of GENERALIZATION_RESEARCHES) {
  generalizationResearchState[research.id] = false;
}

const SQUARE_BREAKTHROUGH_UPGRADES = [
  { id: 'black_hole', title: '블랙홀', description: '게임시간이 2배 빨라집니다.', baseCost: 8n, max: 1, affectedByDyson: true },
  { id: 'extra_investment', title: '추가투자', description: 'SP 획득량이 2배 증가합니다.', baseCost: 8n, costMultiplier: [4n, 1n], max: 8, affectedByDyson: true },
  { id: 'tas', title: 'TAS', description: '일반 오토 클릭커 속도 하한선을 10ms로 설정합니다.', baseCost: 4n, max: 1 },
  { id: 'invisible_hand', title: '보이지 않는 손', description: '자동 업그레이드 속도가 1.5배 빨라집니다.', baseCost: 2n, costMultiplier: [6n, 5n], max: 8, affectedByDyson: true },
  { id: 'overclock', title: '오버클럭', description: '퍼센트 파워 소프트캡을 4단계 확장합니다.', baseCost: 8n, costMultiplier: [7n, 4n], max: 8, affectedByDyson: true },
  { id: 'deflation', title: '디플레이션', description: '모든 베이스 챕터 비용이 0.1배가 됩니다.', baseCost: 16n, max: 1 },
  { id: 'doctor_octopus', title: '닥터옥토퍼스', description: '모든 클릭 획득량이 8배 증가합니다.', baseCost: 16n, costMultiplier: [2n, 1n], max: 8, affectedByDyson: true },
  { id: 'solid_start', title: '탄탄한 시작', description: '퍼센트 시스템을 해금하고 시작수가 200만이 됩니다.', baseCost: 32n, max: 1 },
  { id: 'overcharge', title: '과충전', description: '퍼센트 요구량이 항상 1로 고정됩니다.', baseCost: 16n, max: 1 },
  { id: 'gregtech', title: '그렉텍', description: '오토클릭커 병렬화 상한이 2배 증가합니다.', baseCost: 8n, costMultiplier: [3n, 2n], max: 8, affectedByDyson: true },
  { id: 'bottleneck_tracker', title: '병목 추적기', description: '퍼센트 가격 상승을 늦추고 퍼센트 효율을 높입니다.', baseCost: 64n, costMultiplier: [10n, 1n], max: 8, affectedByDyson: true },
  { id: 'percent_expansion', title: '퍼센트 확장', description: '퍼센트 라인을 1개 추가합니다.', baseCost: 4n, costMultiplier: [2n, 1n], max: 8 },
  { id: 'dyson_swarm', title: '다이슨 스웜', description: '별표가 붙은 제곱돌파 업그레이드 효과가 2배가 됩니다.', baseCost: 1000n, costMultiplier: [20n, 1n], max: 8 }
];

const squareBreakthroughLevels = {};
for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) {
  squareBreakthroughLevels[upgrade.id] = 0;
}

const SQUARE_UPGRADES = [
  {
    id: 'click_double',
    column: 0,
    row: 0,
    title: '클릭 수 2배',
    description: '클릭과 오토 클릭커의 기본 증가량이 2배가 됩니다.',
    cost: 1n
  },
  {
    id: 'percent_power_8',
    column: 0,
    row: 1,
    title: '퍼센트 효율 개선',
    description: '소프트캡 이후 퍼센트 증가량의 감쇠가 완화됩니다.',
    cost: 2n
  },
  {
    id: 'percent_auto_125',
    column: 0,
    row: 2,
    title: '% 오토 10ms',
    description: '% 오토클리커의 하한 속도가 10ms로 내려갑니다.',
    cost: 1n
  },
  {
    id: 'percent_charge_minus_16',
    column: 0,
    row: 3,
    title: '% 요구량 -16',
    description: '퍼센트 충전 요구량 감소 업그레이드가 -4 대신 -16 감소합니다.',
    cost: 1n
  },
  {
    id: 'all_cost_half',
    column: 0,
    row: 4,
    title: '모든 비용 0.5배',
    description: '기본 게임에서 쓰는 숫자 비용이 절반이 됩니다.',
    cost: 2n
  },
  {
    id: 'auto_parallel_64',
    column: 0,
    row: 5,
    title: '오토 병렬 64배',
    description: '오토 클릭커 병렬화 제한이 64배로 증가합니다.',
    cost: 1n
  },
  {
    id: 'game_speed_1_5',
    column: 1,
    row: 0,
    title: '게임 속도 1.5배',
    description: '오토 클릭커와 자동 % 사용 타이머가 1.5배 빠르게 흐릅니다.',
    cost: 1n
  },
  {
    id: 'sp_gain_double',
    column: 1,
    row: 1,
    title: 'SP 획득량 2배',
    description: '제곱 프레스티지의 SP 획득량이 2배가 됩니다.',
    cost: 4n
  },
  {
    id: 'auto_upgrade_top_down',
    column: 1,
    row: 2,
    title: '자동 업그레이드',
    description: '살 수 있는 기본 게임 업그레이드 중 하나를 골라 자동 구매합니다.',
    cost: 1n
  },
  {
    id: 'skip_cutscene',
    column: 2,
    row: 0,
    title: '컷신 스킵',
    description: '기본 게임 목표수에 도달하면 컷신 없이 바로 제곱 프레스티지합니다.',
    cost: 1n
  },
  {
    id: 'restart_percent_unlock',
    column: 2,
    row: 1,
    title: '재시작 % 해금',
    description: '제곱 프레스티지 후 재시작할 때 % 시스템이 자동 해금됩니다.',
    cost: 2n
  },
  {
    id: 'restart_auto_4x',
    column: 2,
    row: 2,
    title: '재시작 오토 4배',
    description: '재시작할 때 오토 클릭커와 4배 병렬화가 자동 해금됩니다.',
    cost: 1n
  },
  {
    id: 'restart_auto_percent_fill',
    column: 2,
    row: 3,
    title: '재시작 % 채우기',
    description: '재시작할 때 오토 클릭커 퍼센트 채우기가 자동 해금됩니다.',
    cost: 1n
  },
  {
    id: 'restart_start_100k',
    column: 2,
    row: 4,
    title: '재시작 시작수 10만',
    description: '제곱 프레스티지 후 재시작할 때 숫자 100,000부터 시작합니다.',
    cost: 4n
  },
  {
    id: 'restart_percent_lane2',
    column: 2,
    row: 5,
    title: '재시작 2라인',
    description: '제곱 프레스티지 후 재시작할 때 퍼센트 라인 2가 자동 해금됩니다.',
    cost: 2n
  }
];

const squareUpgradeState = {};
for (const upgrade of SQUARE_UPGRADES) {
  squareUpgradeState[upgrade.id] = false;
}

function hasSquareUpgrade(id) {
  return squareUpgradeState[id] === true;
}

function hasTetrationUpgrade(id) {
  return isTetrationAvailable() && tetrationUpgradeState[id] === true;
}

function hasSquareConvergenceUpgrade(id) {
  return squareConvergenceUpgradeState[id] === true;
}

function hasGeneralizationResearch(id) {
  return generalizationResearchState[id] === true;
}

function squareBreakthroughLevel(id) {
  return squareBreakthroughLevels[id] ?? 0;
}

function hasSquareBreakthrough(id) {
  return squareBreakthroughLevel(id) > 0;
}

function isTetrationAvailable() {
  return tetrationUnlocked && !TETRATION_TEMPORARILY_LOCKED;
}

function canOpenSquareBreakthrough() {
  return squareUnlocked && allSquareUpgradesBought();
}

function canOpenSquareConvergence() {
  return squareConvergenceUnlocked || compareNumberValues(squarePoints, INT_MAX) >= 0;
}

function powBigInt(base, exponent) {
  let result = 1n;
  for (let index = 0; index < exponent; index++) {
    result *= BigInt(base);
  }
  return result;
}

function ceilDiv(numerator, denominator) {
  return (numerator + denominator - 1n) / denominator;
}

function dysonEffectMultiplier() {
  return 2n ** BigInt(squareBreakthroughLevel('dyson_swarm'));
}

function dysonEffectNumber() {
  return Number(dysonEffectMultiplier());
}

function affectedBigIntPerLevel(base) {
  return BigInt(base) * dysonEffectMultiplier();
}

function affectedBigIntMultiplier(base, level) {
  return powBigInt(affectedBigIntPerLevel(base), level);
}

function affectedNumberMultiplier(base, level) {
  return Math.pow(base * dysonEffectNumber(), level);
}

function squareBreakthroughCost(upgrade) {
  const level = squareBreakthroughLevel(upgrade.id);
  if (level >= squareBreakthroughMax(upgrade)) return null;
  const [numerator, denominator] = upgrade.costMultiplier ?? [1n, 1n];
  return ceilDiv(upgrade.baseCost * powBigInt(numerator, level), powBigInt(denominator, level));
}

function squareBreakthroughMax(upgrade) {
  return upgrade.max;
}

function squareBreakthroughEffectSuffix(upgrade) {
  return upgrade.affectedByDyson ? ' *' : '';
}

function numberGainMultiplier() {
  return hasSquareConvergenceUpgrade('galaxium') ? 2048n : 1n;
}

function squareDimensionAvailable() {
  return hasGeneralizationResearch('3-1');
}

function numberValueFromReal(value) {
  if (!Number.isFinite(value) || value <= 0) return 0n;
  if (Number.isSafeInteger(value)) return BigInt(value);

  const exponent = Math.floor(Math.log10(value));
  return NumberMath.normalize(value / (10 ** exponent), exponent);
}

function realNumberFromValue(value) {
  const scientific = NumberMath.toScientific(value);
  if (!scientific) return 0;
  const result = scientific.mantissa * (10 ** scientific.exponent);
  return Number.isFinite(result) ? result : Number.MAX_VALUE;
}

function squareDimensionLengthValue(sideValue) {
  if (!isApproximateNumber(sideValue)) {
    const scaledLength = Number(sideValue);
    if (Number.isSafeInteger(scaledLength)) {
      return numberValueFromReal(scaledLength / Number(SQUARE_DIMENSION_SCALE));
    }
  }
  return divideNumberValue(sideValue, SQUARE_DIMENSION_SCALE);
}

function squareDimensionArea() {
  if (!isApproximateNumber(squareDimensionX) && !isApproximateNumber(squareDimensionY)) {
    const x = Number(squareDimensionX);
    const y = Number(squareDimensionY);
    if (Number.isSafeInteger(x) && Number.isSafeInteger(y)) {
      return numberValueFromReal((x * y) / Number(SQUARE_DIMENSION_SCALE ** 2n));
    }
  }

  return divideNumberValue(
    multiplyNumberValue(squareDimensionX, squareDimensionY),
    SQUARE_DIMENSION_SCALE ** 2n
  );
}

function squareDimensionPowerExponent() {
  return squareDimensionPowerStrengthUnlocked ? 0.5 : 0.25;
}

function squareDimensionPower() {
  return squareDimensionAvailable()
    ? NumberMath.powerApproximate(squareDimensionArea(), squareDimensionPowerExponent())
    : 1n;
}

function squareDimensionNumberMultiplier() {
  return squareDimensionAvailable()
    ? NumberMath.powerApproximate(squareDimensionArea(), squareDimensionPowerExponent() * 2)
    : 1n;
}

function squareDimensionSideValue(side) {
  return side === 'y' ? squareDimensionY : squareDimensionX;
}

function squareDimensionSideGrowth(sideValue) {
  const length = squareDimensionLengthValue(sideValue);
  const logarithm = realNumberFromValue(NumberMath.log10(length));
  return BigInt(Math.max(0, Math.round(logarithm * Number(SQUARE_DIMENSION_SCALE))));
}

function squareDimensionSideCost(side) {
  return side === 'y' ? squareDimensionYCost : squareDimensionXCost;
}

function squareDimensionSideGrowthLevel(side) {
  return side === 'y' ? squareDimensionYGrowthLevel : squareDimensionXGrowthLevel;
}

function squareDimensionSideGrowthRate(side) {
  return multiplyNumberValue(
    squareDimensionSideGrowth(squareDimensionSideValue(side)),
    squareDimensionSideGrowthLevel(side)
  );
}

function resetSquareDimensionState() {
  squareDimensionX = 500n;
  squareDimensionY = 600n;
  squareDimensionXCost = 1n;
  squareDimensionYCost = 1n;
  squareDimensionXGrowthLevel = 1n;
  squareDimensionYGrowthLevel = 1n;
  squareDimensionXGrowthCarry = 0;
  squareDimensionYGrowthCarry = 0;
  squareDimensionPowerInterval = SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL;
  squareDimensionPowerIntervalCost = SQUARE_DIMENSION_POWER_TIME_BASE_COST;
  squareDimensionPowerStrengthUnlocked = false;
}

function buySquareDimensionSide(side) {
  if (!squareDimensionAvailable()) return false;
  const cost = squareDimensionSideCost(side);
  if (compareNumberValues(squarePoints, cost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, cost);
  if (side === 'y') {
    squareDimensionYGrowthLevel = addBaseNumbers(squareDimensionYGrowthLevel, 1n);
    squareDimensionYCost = multiplyNumberValue(squareDimensionYCost, 2n);
  } else {
    squareDimensionXGrowthLevel = addBaseNumbers(squareDimensionXGrowthLevel, 1n);
    squareDimensionXCost = multiplyNumberValue(squareDimensionXCost, 2n);
  }
  render();
  return true;
}

function buySquareDimensionPowerTimeUpgrade() {
  if (!squareDimensionAvailable() || squareDimensionPowerInterval <= SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL) {
    return false;
  }
  if (compareNumberValues(squarePoints, squareDimensionPowerIntervalCost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, squareDimensionPowerIntervalCost);
  squareDimensionPowerInterval = Math.max(
    SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL,
    Math.ceil(squareDimensionPowerInterval / 2)
  );
  squareDimensionPowerIntervalCost = multiplyNumberValue(squareDimensionPowerIntervalCost, 10n);
  render();
  return true;
}

function buySquareDimensionPowerStrength() {
  if (!squareDimensionAvailable() || squareDimensionPowerStrengthUnlocked) return false;
  if (compareNumberValues(squarePoints, SQUARE_DIMENSION_POWER_STRENGTH_COST) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, SQUARE_DIMENSION_POWER_STRENGTH_COST);
  squareDimensionPowerStrengthUnlocked = true;
  log('제곱력 생산 강화가 적용되었습니다. 제곱력 공식 지수가 1/4에서 1/2로 변경되었습니다.', true);
  render();
  return true;
}

function squareDimensionSideGrowthNumber(side) {
  const rate = squareDimensionSideGrowthRate(side);
  const numericRate = realNumberFromValue(rate);
  return Number.isFinite(numericRate) ? numericRate / Number(SQUARE_DIMENSION_SCALE) : Number.MAX_VALUE;
}

function advanceSquareDimensions(elapsedMs) {
  if (!squareDimensionAvailable() || overflowed || elapsedMs <= 0) return false;

  const productionSpeed = SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL / squareDimensionPowerInterval;
  const elapsedSeconds = (elapsedMs / 1000) * productionSpeed;
  const xGrowth = squareDimensionSideGrowthNumber('x') * elapsedSeconds * Number(SQUARE_DIMENSION_SCALE);
  const yGrowth = squareDimensionSideGrowthNumber('y') * elapsedSeconds * Number(SQUARE_DIMENSION_SCALE);
  let changed = false;

  if (Number.isFinite(xGrowth) && xGrowth < Number.MAX_SAFE_INTEGER) {
    squareDimensionXGrowthCarry += xGrowth;
    const wholeGrowth = Math.floor(squareDimensionXGrowthCarry);
    squareDimensionXGrowthCarry -= wholeGrowth;
    if (wholeGrowth > 0) {
      squareDimensionX = addBaseNumbers(squareDimensionX, BigInt(wholeGrowth));
      changed = true;
    }
  } else if (Number.isFinite(xGrowth) && xGrowth > 0) {
    squareDimensionX = addBaseNumbers(squareDimensionX, numberValueFromReal(xGrowth));
    changed = true;
  }

  if (Number.isFinite(yGrowth) && yGrowth < Number.MAX_SAFE_INTEGER) {
    squareDimensionYGrowthCarry += yGrowth;
    const wholeGrowth = Math.floor(squareDimensionYGrowthCarry);
    squareDimensionYGrowthCarry -= wholeGrowth;
    if (wholeGrowth > 0) {
      squareDimensionY = addBaseNumbers(squareDimensionY, BigInt(wholeGrowth));
      changed = true;
    }
  } else if (Number.isFinite(yGrowth) && yGrowth > 0) {
    squareDimensionY = addBaseNumbers(squareDimensionY, numberValueFromReal(yGrowth));
    changed = true;
  }

  return changed;
}

function squarePointGain() {
  let gain = hasSquareUpgrade('sp_gain_double') ? 2n : 1n;
  gain *= affectedBigIntMultiplier(2, squareBreakthroughLevel('extra_investment'));
  return gain;
}

function squarePointGainForValue(value) {
  const requirement = squarePointExchangeRequirement();
  if (compareNumberValues(value, requirement) < 0) return 0n;

  const ratio = divideNumberValue(value, requirement);
  const logarithmicGain = NumberMath.max(NumberMath.log10(ratio), 1n);
  return multiplyNumberValue(squarePointGain(), logarithmicGain);
}

function squarePointExchangeRequirement() {
  return hasGeneralizationResearch('2-1') ? 8000000000000000000n : LONG_MAX;
}

function squarePrestigeTargetPointReward(pointReward) {
  const requestedReward = BigInt(pointReward);
  if (!squareBreakthroughEntered) return 1n;
  return requestedReward > 0n ? requestedReward : 1n;
}

function squarePrestigeNumberForPointReward(pointReward) {
  return gameEndValue() * squarePrestigeTargetPointReward(pointReward);
}

function squarePrestigeConversionRequest() {
  return squareUnlocked ? null : { requiredValue: gameEndValue(), pointReward: null };
}

function squarePrestigeTriggerValue() {
  return squarePrestigeConversionRequest()?.requiredValue ?? null;
}

function squarePointCapacityBeforeTetraPoint() {
  return compareNumberValues(squarePoints, LONG_MAX) >= 0
    ? 0n
    : subtractNumberValues(LONG_MAX, squarePoints);
}

function convertibleLspToSpAmount() {
  const rawAmount = divideNumberValue(lsp, LSP_PER_SP);
  const capacity = squarePointCapacityBeforeTetraPoint();
  return minimumNumberValue(rawAmount, capacity);
}

function effectivePerClick() {
  let gain = perClick;
  gain = multiplyNumberValue(gain, hasSquareUpgrade('click_double') ? 2n : 1n);
  gain = multiplyNumberValue(gain, numberGainMultiplier());
  gain = multiplyNumberValue(gain, affectedBigIntMultiplier(8, squareBreakthroughLevel('doctor_octopus')));
  return multiplyNumberValue(gain, squareDimensionNumberMultiplier());
}

function maybeUnlockPercent() {
  if (percentUnlocked || compareBaseNumber(1000n) < 0) return false;

  percentUnlocked = true;
  log('1000 도달 — % 시스템이 해금되었습니다.');
  return true;
}

function autoClickerParallelCap() {
  const baseCap = hasSquareUpgrade('auto_parallel_64')
    ? UPGRADED_AUTO_CLICKER_PARALLEL_CAP
    : BASE_AUTO_CLICKER_PARALLEL_CAP;
  return baseCap * affectedBigIntMultiplier(2, squareBreakthroughLevel('gregtech'));
}

function normalizedPercentPower(power) {
  const value = Number(power);
  return Number.isSafeInteger(value) && value >= 1 ? value : 1;
}

function percentPowerSoftcapBonusLevels() {
  return 4 * dysonEffectNumber() * squareBreakthroughLevel('overclock');
}

function percentPowerPriceAccelerationStart() {
  return 8 + (2 * dysonEffectNumber() * squareBreakthroughLevel('bottleneck_tracker'));
}

function percentPowerSoftcapDecayPower() {
  return hasSquareUpgrade('percent_power_8') ? 3 : 4;
}

function percentEfficiencyMultiplierNumerator() {
  const bottleneckEfficiencyMultiplier = hasGeneralizationResearch('1-1') ? 2 : 1;
  return 4 + (bottleneckEfficiencyMultiplier * dysonEffectNumber() * squareBreakthroughLevel('bottleneck_tracker'));
}

function percentEfficiencyMultiplier() {
  return percentEfficiencyMultiplierNumerator() / 4;
}

function applyPercentEfficiency(gain) {
  return divideNumberValue(
    multiplyNumberValue(gain, BigInt(percentEfficiencyMultiplierNumerator())),
    4n
  );
}

function percentPowerUpgradeCostForNextLevel(currentPower, baseCost = 40000n) {
  const nextPower = normalizedPercentPower(currentPower) + 1;
  const standardExponent = nextPower - 2;
  const acceleratedLevels = Math.max(0, nextPower - percentPowerPriceAccelerationStart());
  const acceleratedExponent = (acceleratedLevels * (acceleratedLevels + 1)) / 2;
  return multiplyNumberValue(baseCost, powerOfTenValue(standardExponent + acceleratedExponent));
}

function percentPowerSoftcap(power) {
  const level = normalizedPercentPower(power) + percentPowerSoftcapBonusLevels() - 1;
  return multiplyNumberValue(PERCENT_POWER_SOFTCAP_START, powerOfTenValue(level));
}

function percentPowerGrowthLimit(power) {
  return multiplyNumberValue(percentPowerSoftcap(power), 10n);
}

function percentGain(value, power) {
  const softcap = percentPowerSoftcap(power);
  if (compareNumberValues(value, softcap) <= 0) {
    const gain = applyPercentEfficiency(divideNumberValue(
      multiplyNumberValue(value, BigInt(normalizedPercentPower(power))),
      100n
    ));
    return multiplyNumberValue(gain, squareDimensionNumberMultiplier());
  }

  const growthLimit = percentPowerGrowthLimit(power);
  if (compareNumberValues(value, growthLimit) >= 0) return 0n;

  const remaining = subtractNumberValues(growthLimit, value);
  const slowdownSpan = multiplyNumberValue(softcap, 9n);
  let gain = divideNumberValue(
    multiplyNumberValue(softcap, BigInt(normalizedPercentPower(power))),
    100n
  );

  // 정체선까지 남은 비율의 거듭제곱으로 감쇠시켜 진입 직후부터 증가량이 줄어든다.
  for (let i = 0; i < percentPowerSoftcapDecayPower(); i++) {
    gain = divideNumberValue(multiplyNumberValue(gain, remaining), slowdownSpan);
    if (compareNumberValues(gain, 0n) <= 0) return 0n;
  }
  return multiplyNumberValue(applyPercentEfficiency(gain), squareDimensionNumberMultiplier());
}

function percentPowerSoftcapStatus(power, value = getBaseNumber()) {
  const softcap = percentPowerSoftcap(power);
  const growthLimit = percentPowerGrowthLimit(power);
  const state = compareNumberValues(value, growthLimit) >= 0
    ? '정체'
    : compareNumberValues(value, softcap) > 0
      ? '감쇠 중'
      : '부터 감쇠';
  return `소프트캡 ${fmtPowerBase(softcap)} ${state} · 정체선 ${fmtPowerBase(growthLimit)}`;
}

function percentAutoMinSpeed() {
  return hasSquareUpgrade('percent_auto_125') ? 10 : 200;
}

function autoClickerMinSpeed() {
  return hasSquareBreakthrough('tas') ? 10 : 25;
}

function formatDelay(ms) {
  if (ms < 100) return `${ms}ms`;
  return `${(ms / 1000).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}초`;
}

function gameTick(ms) {
  let tick = hasSquareUpgrade('game_speed_1_5') ? Math.floor(ms * 1.5) : ms;
  if (hasSquareBreakthrough('black_hole')) {
    tick = Math.floor(tick * 2 * dysonEffectNumber());
  }
  if (hasSquareConvergenceUpgrade('timium')) tick *= 2048;
  return tick;
}

function gameEndValue() {
  return LONG_MAX;
}

function discountedCost(cost) {
  let discounted = isApproximateNumber(cost) ? cost : BigInt(cost);
  if (hasSquareBreakthrough('deflation')) {
    discounted = isApproximateNumber(discounted)
      ? divideNumberValue(discounted, 10n)
      : discounted <= 1n ? discounted : ceilDiv(discounted, 10n);
  }
  if (hasSquareUpgrade('all_cost_half')) {
    discounted = isApproximateNumber(discounted)
      ? divideNumberValue(discounted, 2n)
      : discounted <= 1n ? discounted : ceilDiv(discounted, 2n);
  }
  return discounted;
}

function percentChargeReduction() {
  return hasSquareUpgrade('percent_charge_minus_16') ? 16 : 4;
}

function minimumPercentChargeNeeded() {
  return hasSquareBreakthrough('overcharge') ? 1 : MIN_PERCENT_CHARGE;
}

function percentLaneLimit() {
  return Math.min(
    MAX_PERCENT_LANES,
    BASE_PERCENT_LANE_LIMIT + squareBreakthroughLevel('percent_expansion')
  );
}

function targetPermanentPercentLaneCount() {
  return Math.min(percentLaneLimit(), hasSquareUpgrade('restart_percent_lane2') ? 2 : 1);
}

function nextPercentLaneCostForCount(count) {
  let cost = 200000n;
  for (let index = 1; index < count; index++) {
    cost *= 2n;
  }
  return cost;
}

function syncPermanentPercentLanes() {
  const targetCount = targetPermanentPercentLaneCount();
  while (percentLaneCount < targetCount) {
    percentLaneCount++;
    const lane = makePercentLane(percentLaneCount);
    extraPercentLanes.push(lane);
    createExtraPercentLaneUI(lane);
  }

  const limit = percentLaneLimit();
  while (percentLaneCount > limit) {
    const lane = extraPercentLanes.pop();
    lane?.ui?.box?.remove();
    percentLaneCount--;
  }

  nextPercentLaneUnlockCost = nextPercentLaneCostForCount(percentLaneCount);
}

function autoUpgradeSpeedMultiplier() {
  return affectedNumberMultiplier(1.5, squareBreakthroughLevel('invisible_hand'));
}

function resetSquareUpgradeState() {
  for (const upgrade of SQUARE_UPGRADES) {
    squareUpgradeState[upgrade.id] = false;
  }
  autoUpgradeEnabled = false;
  autoUpgradeTimer = 0;
}

function applyAutomatiumSquareUpgradeUnlocks({ resetAutoUpgrade = false } = {}) {
  if (!hasSquareConvergenceUpgrade('automatium')) return false;

  squareUpgradeState.skip_cutscene = true;
  squareUpgradeState.auto_upgrade_top_down = true;
  if (resetAutoUpgrade) {
    autoUpgradeEnabled = false;
    autoUpgradeTimer = 0;
  }
  return true;
}

function resetSquareBreakthroughState() {
  squareBreakthroughEntered = false;
  for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) {
    squareBreakthroughLevels[upgrade.id] = 0;
  }
}

function resetSquareConvergenceUpgradeState() {
  for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
    squareConvergenceUpgradeState[upgrade.id] = false;
  }
}

function resetGeneralizationResearchState() {
  for (const research of GENERALIZATION_RESEARCHES) {
    generalizationResearchState[research.id] = false;
  }
}

function loadGeneralizationResearchState(savedState) {
  resetGeneralizationResearchState();
  for (const research of GENERALIZATION_RESEARCHES) {
    generalizationResearchState[research.id] = savedState?.[research.id] === true;
  }
}

function loadSquareConvergenceUpgradeState(savedState) {
  resetSquareConvergenceUpgradeState();
  for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
    squareConvergenceUpgradeState[upgrade.id] = savedState?.[upgrade.id] === true;
  }
}

function loadSquareBreakthroughState(savedState) {
  resetSquareBreakthroughState();
  for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) {
    const rawLevel = Number(savedState?.[upgrade.id] ?? 0);
    const level = Number.isFinite(rawLevel) ? Math.floor(rawLevel) : 0;
    squareBreakthroughLevels[upgrade.id] = Math.max(0, Math.min(squareBreakthroughMax(upgrade), level));
  }
}

function resetTetrationUpgradeState() {
  for (const upgrade of TETRATION_UPGRADES) {
    tetrationUpgradeState[upgrade.id] = false;
  }
}

function allSquareUpgradesBought() {
  return SQUARE_UPGRADES.every(upgrade => hasSquareUpgrade(upgrade.id));
}

function squareConvergencePointGain() {
  const requirement = squareConvergenceExchangeRequirement();
  if (compareNumberValues(squarePoints, requirement) < 0) return 0n;

  const ratio = divideNumberValue(squarePoints, requirement);
  return NumberMath.max(NumberMath.log10(ratio), 1n);
}

function squareConvergenceExchangeRequirement() {
  return SQUARE_CONVERGENCE_EXCHANGE_REQUIREMENT;
}

function collectSquareConvergenceIfReady() {
  const gainedConvergencePoints = squareConvergencePointGain();
  if (!isPositiveNumberValue(gainedConvergencePoints)) return 0n;

  squarePoints = 0n;
  squareConvergencePoints = addBaseNumbers(squareConvergencePoints, gainedConvergencePoints);
  squareConvergenceUnlocked = true;
  squareUnlocked = true;
  resetSquareDimensionState();
  resetSquareUpgradeState();
  resetSquareBreakthroughState();
  applyAutomatiumSquareUpgradeUnlocks({ resetAutoUpgrade: true });
  return gainedConvergencePoints;
}

function canResearchTheory() {
  return canOpenSquareConvergence() && canAffordTheoryResource(theoryCostResourceIndex);
}

function theoryCostForResource(resourceIndex) {
  if (resourceIndex === 0) return theoryNumberCost;
  if (resourceIndex === 1) return theorySquarePointCost;
  return theoryConvergencePointCost;
}

function theoryCostResourceLabel(resourceIndex) {
  if (resourceIndex === 0) return '수';
  if (resourceIndex === 1) return 'SP';
  return 'CP';
}

function canAffordTheoryResource(resourceIndex) {
  if (resourceIndex === 0) return compareBaseNumber(theoryNumberCost) >= 0;
  if (resourceIndex === 1) return compareNumberValues(squarePoints, theorySquarePointCost) >= 0;
  if (resourceIndex === 2) return compareNumberValues(squareConvergencePoints, theoryConvergencePointCost) >= 0;
  return false;
}

function setTheoryCostResource(resourceIndex) {
  const nextIndex = Number(resourceIndex);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex > 2) return false;
  theoryCostResourceIndex = nextIndex;
  render();
  return true;
}

function researchTheory() {
  if (!canResearchTheory()) return false;

  const selectedResource = theoryCostResourceIndex;
  const paidResourceLabel = theoryCostResourceLabel(selectedResource);
  if (theoryCostResourceIndex === 0) {
    spendBaseCost(theoryNumberCost);
    theoryNumberCost = multiplyNumberValue(theoryNumberCost, THEORY_NUMBER_COST_GROWTH);
  } else if (theoryCostResourceIndex === 1) {
    squarePoints = subtractNumberValues(squarePoints, theorySquarePointCost);
    theorySquarePointCost = multiplyNumberValue(theorySquarePointCost, THEORY_SQUARE_POINT_COST_GROWTH);
  } else {
    squareConvergencePoints = subtractNumberValues(squareConvergencePoints, theoryConvergencePointCost);
    theoryConvergencePointCost = multiplyNumberValue(theoryConvergencePointCost, THEORY_CONVERGENCE_POINT_COST_GROWTH);
  }

  theory = addBaseNumbers(theory, 1n);
  log(`${paidResourceLabel}로 이론을 연구했습니다. 현재 ${fmt(theory)} 이론`, true);
  render();
  return true;
}

function canResearchGeneralization(id) {
  const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
  if (!research || hasGeneralizationResearch(id)) return false;
  return canOpenSquareConvergence() &&
    research.parents.every(parentId => hasGeneralizationResearch(parentId)) &&
    compareNumberValues(theory, research.theoryCost) >= 0;
}

function researchGeneralization(id) {
  const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
  if (!research || !canResearchGeneralization(id)) return false;

  theory = subtractNumberValues(theory, research.theoryCost);
  generalizationResearchState[id] = true;
  log(`${research.id} ${research.title} 연구를 완료했습니다.`, true);
  render();
  return true;
}

function canUnlockTetrationChapter() {
  return false;
}

function canUnlockTetrationDimensions() {
  return false;
}

function resetTetrationProductionState() {
  lsp = 0n;
  autoLspConverterUnlocked = false;
  autoLspConverterEnabled = false;
  for (let index = 0; index < TETRATION_DIMENSION_COUNT; index++) {
    tetrationDimensions[index] = 0n;
    tetrationDimensionPurchases[index] = 0n;
    tetrationDimensionCosts[index] = initialTetrationDimensionCost(index);
  }
}

function resetRunStateAfterSquarePrestige() {
  pendingSquarePrestigeValue = null;
  pendingSquarePrestigePoints = null;
  pendingSquarePrestigeRequirement = null;
  setBaseNumber(hasSquareBreakthrough('solid_start')
    ? 2000000n
    : hasSquareUpgrade('restart_start_100k') ? 100000n : 0n);
  perClick = 1n;
  perClickUpgradeCost = 10n;

  percentUnlocked = hasSquareUpgrade('restart_percent_unlock');
  percentCharge = 0;
  percentChargeNeeded = hasSquareBreakthrough('overcharge') ? 1 : 100;
  percentChargeLevel = 0;
  percentChargeUpgradeCost = 250n;
  percentPower = 1;
  percentPowerUpgradeCost = 40000n;

  overflowed = false;
  squareMode = false;

  autoClickerUnlocked = hasSquareUpgrade('restart_auto_4x');
  autoClickerPrice = 100n;
  autoClickerSpeed = 1000;
  autoClickerSpeedPrice = 200n;
  autoClickerTimer = 0;
  autoUpgradeTimer = 0;
  autoClickerParallel = hasSquareUpgrade('restart_auto_4x') ? 4n : 1n;
  autoClickerParallelPrice = hasSquareUpgrade('restart_auto_4x') ? 4000n : 1000n;
  autoClickerPercentFillUnlocked = hasSquareUpgrade('restart_auto_percent_fill');

  percentAutoUnlocked = false;
  percentAutoPrice = 150n;
  percentAutoSpeedLevel = 0;
  percentAutoSpeed = percentAutoSpeedLevels[percentAutoSpeedLevel];
  percentAutoSpeedPrice = 250n;
  percentAutoTimer = 0;

  percentLaneCount = Math.max(
    hasSquareUpgrade('restart_percent_lane2') ? 2 : 1,
    targetPermanentPercentLaneCount()
  );
  nextPercentLaneUnlockCost = nextPercentLaneCostForCount(percentLaneCount);
  extraPercentLanes.length = 0;
  for (let laneNumber = 2; laneNumber <= percentLaneCount; laneNumber++) {
    extraPercentLanes.push(makePercentLane(laneNumber));
  }
  maybeUnlockPercent();
}
