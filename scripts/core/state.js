let num = 0n;
let approximateNum = null;
let perClick = 1n;
let perClickUpgradeCost = 10n;

// 런타임 원인 추적용: 기본적으로 꺼져 있으며 게임 수치에는 관여하지 않는다.
let numberTraceEnabled = false;
let numberTraceStartedAt = 0;
let numberTraceRenderScheduled = false;
const numberTraceEvents = [];
const NUMBER_TRACE_EVENT_LIMIT = 2500;

let percentUnlocked = false;
let percentCharge = 0;
let percentChargeNeeded = 100;
let percentChargeLevel = 0;
let percentChargeUpgradeCost = 250n;

// 퍼센트 파워: 기본 +1%. 요구 클릭 수가 50 이하일 때 해금
let percentPower = 1;
let percentPowerUpgradeCost = 40000n;
let percentPowerCostCompounding = false;

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
function makeSquareDimensionState(costMultiplier = 1n) {
  return {
    x: 500n,
    y: 600n,
    z: 700n,
    xCost: costMultiplier,
    yCost: costMultiplier,
    zCost: costMultiplier,
    xGrowthLevel: 1n,
    yGrowthLevel: 1n,
    zGrowthLevel: 1n,
    xGrowthCarry: 0,
    yGrowthCarry: 0,
    zGrowthCarry: 0,
    powerInterval: SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL,
    powerIntervalCost: SQUARE_DIMENSION_POWER_TIME_BASE_COST * costMultiplier,
    powerStrengthUnlocked: false
  };
}

const squareDimensionStates = [
  makeSquareDimensionState(1n),
  makeSquareDimensionState(2n)
];
let theory = 0n;
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
let squareDimensionAutoUpgradeEnabled = false;
let squareDimensionAutoUpgradeTimer = 0;
let squareDimensionAutoUpgradeCursor = 0;
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

function numberTraceTimestamp() {
  if (typeof performance === 'undefined') return 0;
  return Math.round((performance.now() - numberTraceStartedAt) * 10) / 10;
}

function numberTraceValue(value) {
  return NumberMath.serialize(value);
}

function traceNumberEvent(type, details = {}) {
  if (!numberTraceEnabled) return;

  numberTraceEvents.push({
    at: numberTraceTimestamp(),
    type,
    ...details
  });
  if (numberTraceEvents.length > NUMBER_TRACE_EVENT_LIMIT) {
    numberTraceEvents.splice(0, numberTraceEvents.length - NUMBER_TRACE_EVENT_LIMIT);
  }

  if (typeof scheduleNumberTraceRender === 'function' && !numberTraceRenderScheduled) {
    numberTraceRenderScheduled = true;
    scheduleNumberTraceRender();
  }
}

function startNumberTrace() {
  numberTraceEnabled = true;
  numberTraceStartedAt = typeof performance === 'undefined' ? 0 : performance.now();
  numberTraceEvents.length = 0;
  traceNumberEvent('trace-start', {
    number: numberTraceValue(getBaseNumber()),
    percentCharge: `${percentCharge}/${percentChargeNeeded}`,
    percentAutoSpeed,
    laneCount: percentLaneCount
  });
}

function stopNumberTrace() {
  traceNumberEvent('trace-stop');
  numberTraceEnabled = false;
}

function clearNumberTrace() {
  numberTraceEvents.length = 0;
  if (typeof scheduleNumberTraceRender === 'function') scheduleNumberTraceRender();
}

function addToBaseNumber(value, source = 'unknown') {
  if (compareNumberValues(value, 0n) <= 0) return;
  const before = getBaseNumber();
  const after = addBaseNumbers(before, value);
  setBaseNumber(after);
  traceNumberEvent('number-change', {
    source,
    before: numberTraceValue(before),
    gain: numberTraceValue(value),
    after: numberTraceValue(after)
  });
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
  {
    id: 'cp_gain_5x',
    title: 'CP 획득량 5배',
    description: 'CP 획득량이 레벨마다 5배가 됩니다.',
    cost: 5n,
    costMultiplier: 5n,
    max: 8
  },
];

const squareConvergenceUpgradeState = {};
const squareConvergenceUpgradeLevels = {};
for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
  squareConvergenceUpgradeState[upgrade.id] = false;
  squareConvergenceUpgradeLevels[upgrade.id] = 0;
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
    description: '수렴 포인트 교환 요구량 기준을 90sp로 줄입니다.',
    parents: ['1-1'],
    theoryCost: 2n
  },
  {
    id: '2-3',
    column: 2,
    row: 3,
    title: '다이슨 스웜 허용치 확장',
    description: '다이슨 스웜의 최대 구매 가능 개수를 12개로 늘립니다.',
    parents: ['1-1'],
    theoryCost: 4n
  },
  {
    id: '2-4',
    column: 2,
    row: 4,
    title: '병목 추적기 허용치 확장',
    description: '병목 추적기의 최대 구매 가능 개수를 16개로 늘립니다.',
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
  },
  {
    id: '3-2',
    column: 3,
    row: 2,
    title: '발산자',
    description: '발산자를 해금합니다. 현재는 기능이 없습니다.',
    parents: ['2-2'],
    theoryCost: 6n
  },
  {
    id: '3-3',
    column: 3,
    row: 3,
    title: '퍼센트 가격 감쇠',
    description: 'e500 이후 퍼센트 업그레이드 가격의 거듭제곱을 1.5에서 1.1로 낮춥니다.',
    parents: ['2-4'],
    theoryCost: 6n
  },
  {
    id: '4-1',
    column: 4,
    row: 1,
    title: '제곱 차원 성장 공식 개선',
    description: '제곱 차원의 변 성장 공식이 log10에서 log9로 바뀝니다.',
    parents: ['3-1'],
    theoryCost: 3n
  },
  {
    id: '4-2',
    column: 4,
    row: 2,
    title: '제곱 차원 확장',
    description: '제곱 차원을 2개로 늘립니다. 두 번째 차원의 모든 업그레이드는 2배 비쌉니다.',
    parents: ['3-1'],
    theoryCost: 6n
  },
  {
    id: '5-1',
    column: 5,
    row: 1,
    title: '차원 일반화',
    description: '제곱 차원에 z 변을 추가합니다. 제곱력이 숫자 생산에 기여하는 방식이 제곱에서 3제곱으로 바뀝니다.',
    parents: ['4-1', '4-2'],
    theoryCost: 8n
  },
  {
    id: '5-2',
    column: 5,
    row: 2,
    title: '제곱 포인트 획득 공식 개선',
    description: 'SP 획득량을 [수^(1/2400) / 종료수] 공식으로 계산합니다. 최소 획득량은 1 SP입니다.',
    parents: ['4-2'],
    theoryCost: 6n
  },
  {
    id: '6-1',
    column: 6,
    row: 1,
    title: '제곱력 기여 제곱화',
    description: '제곱력이 수 강화에 기여하는 배율을 한 번 더 제곱합니다.',
    parents: ['5-1'],
    theoryCost: 12n
  },
  {
    id: '6-2',
    column: 6,
    row: 2,
    title: '제곱력 생산 강화',
    description: '제곱력 생산 공식을 (xyz)^1까지 강화합니다.',
    parents: ['5-1'],
    theoryCost: 4n
  },
  {
    id: '7-1',
    column: 7,
    row: 1,
    title: '제곱력 생산 공식 개선',
    description: '제곱력 생산 공식이 (xyz)^3이 됩니다.',
    parents: ['6-2'],
    theoryCost: 4n
  },
  {
    id: '6-4',
    column: 6,
    row: 4,
    title: '제곱력 소프트캡 강화',
    description: '제곱력의 지수를 3제곱한 만큼 퍼센트 소프트캡을 확장합니다.',
    parents: ['5-1'],
    theoryCost: 8n
  },
  {
    id: '7-3',
    column: 7,
    row: 3,
    title: '제곱 차원 자동 업그레이드',
    description: '제곱 차원의 변, 생산 시간, 생산력 강화 업그레이드를 자동 구매합니다.',
    parents: ['6-1'],
    theoryCost: 2n
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

function squareConvergenceUpgradeLevel(id) {
  return squareConvergenceUpgradeLevels[id] ?? (hasSquareConvergenceUpgrade(id) ? 1 : 0);
}

function squareConvergenceUpgradeCost(upgrade) {
  const level = squareConvergenceUpgradeLevel(upgrade.id);
  if (!upgrade.costMultiplier) return upgrade.cost;
  return multiplyNumberValue(
    upgrade.cost,
    NumberMath.power(upgrade.costMultiplier, level)
  );
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

function affectedBigIntMultiplier(base, level) {
  return powBigInt(BigInt(base) * dysonEffectMultiplier(), level);
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
  if (upgrade.id === 'dyson_swarm' && hasGeneralizationResearch('2-3')) return 12;
  if (upgrade.id === 'bottleneck_tracker' && hasGeneralizationResearch('2-4')) return 16;
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

function squareDimensionCount() {
  return hasGeneralizationResearch('4-2') ? 2 : 1;
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

function squareDimensionState(index = 0) {
  return squareDimensionStates[index] ?? squareDimensionStates[0];
}

function squareDimensionIsAvailable(index = 0) {
  return squareDimensionAvailable() && index >= 0 && index < squareDimensionCount();
}

function squareDimensionVolume(index = 0) {
  const dimension = squareDimensionState(index);
  if (!hasGeneralizationResearch('5-1')) {
    if (!isApproximateNumber(dimension.x) && !isApproximateNumber(dimension.y)) {
      const x = Number(dimension.x);
      const y = Number(dimension.y);
      if (Number.isSafeInteger(x) && Number.isSafeInteger(y)) {
        return numberValueFromReal((x * y) / Number(SQUARE_DIMENSION_SCALE ** 2n));
      }
    }
    return divideNumberValue(
      multiplyNumberValue(dimension.x, dimension.y),
      SQUARE_DIMENSION_SCALE ** 2n
    );
  }

  if (!isApproximateNumber(dimension.x) && !isApproximateNumber(dimension.y) && !isApproximateNumber(dimension.z)) {
    const x = Number(dimension.x);
    const y = Number(dimension.y);
    const z = Number(dimension.z);
    if (Number.isSafeInteger(x) && Number.isSafeInteger(y) && Number.isSafeInteger(z)) {
      return numberValueFromReal((x * y * z) / Number(SQUARE_DIMENSION_SCALE ** 3n));
    }
  }

  return divideNumberValue(
    multiplyNumberValue(multiplyNumberValue(dimension.x, dimension.y), dimension.z),
    SQUARE_DIMENSION_SCALE ** 3n
  );
}

// 기존 호출부와 저장 데이터 호환을 위해 이름만 유지한다. 실제 값은 이제 x*y*z 부피다.
function squareDimensionArea(index = 0) {
  return squareDimensionVolume(index);
}

function squareDimensionPowerExponent(index = 0) {
  if (hasGeneralizationResearch('7-1')) return 3;
  if (hasGeneralizationResearch('6-2')) return 1;
  const generalized = hasGeneralizationResearch('5-1');
  if (squareDimensionState(index).powerStrengthUnlocked) {
    return generalized ? (1 / 3) : 0.5;
  }
  return generalized ? (1 / 6) : 0.25;
}

function squareDimensionPower(index = 0) {
  if (!squareDimensionIsAvailable(index)) return 1n;
  return NumberMath.powerApproximate(squareDimensionVolume(index), squareDimensionPowerExponent(index));
}

function squareDimensionNumberMultiplier(index = null) {
  if (index !== null) {
    if (!squareDimensionIsAvailable(index)) return 1n;
    let multiplier = NumberMath.powerApproximate(
      squareDimensionPower(index),
      hasGeneralizationResearch('5-1') ? 3 : 2
    );
    if (hasGeneralizationResearch('6-1')) {
      multiplier = NumberMath.powerApproximate(multiplier, 2);
    }
    return multiplier;
  }

  if (!squareDimensionAvailable()) return 1n;
  let multiplier = 1n;
  for (let dimensionIndex = 0; dimensionIndex < squareDimensionCount(); dimensionIndex++) {
    multiplier = multiplyNumberValue(
      multiplier,
      squareDimensionNumberMultiplier(dimensionIndex)
    );
  }
  return multiplier;
}

function squareDimensionTotalPower() {
  if (!squareDimensionAvailable()) return 1n;

  let totalPower = 1n;
  for (let dimensionIndex = 0; dimensionIndex < squareDimensionCount(); dimensionIndex++) {
    totalPower = multiplyNumberValue(
      totalPower,
      squareDimensionPower(dimensionIndex)
    );
  }
  return totalPower;
}

function squareDimensionPercentSoftcapExponent() {
  if (!hasGeneralizationResearch('6-4') || !squareDimensionAvailable()) return 0;

  const logarithm = realNumberFromValue(NumberMath.log10(squareDimensionTotalPower()));
  if (!Number.isFinite(logarithm) || logarithm <= 0) return 0;
  const cubeRootMax = Math.cbrt(Number.MAX_VALUE);
  return logarithm > cubeRootMax
    ? Number.MAX_VALUE
    : Math.floor(logarithm ** 3);
}

function squareDimensionPercentSoftcapMultiplier() {
  return NumberMath.powerApproximate(10n, squareDimensionPercentSoftcapExponent());
}

function squareDimensionSideValue(side, index = 0) {
  const dimension = squareDimensionState(index);
  if (side === 'z') return dimension.z;
  return side === 'y' ? dimension.y : dimension.x;
}

function squareDimensionSideGrowth(sideValue) {
  const length = squareDimensionLengthValue(sideValue);
  const baseLogarithm = realNumberFromValue(NumberMath.log10(length));
  const logarithm = hasGeneralizationResearch('4-1')
    ? baseLogarithm / Math.log10(9)
    : baseLogarithm;
  return BigInt(Math.max(0, Math.round(logarithm * Number(SQUARE_DIMENSION_SCALE))));
}

function squareDimensionSideCost(side, index = 0) {
  const dimension = squareDimensionState(index);
  if (side === 'z') return dimension.zCost;
  return side === 'y' ? dimension.yCost : dimension.xCost;
}

function squareDimensionSideGrowthLevel(side, index = 0) {
  const dimension = squareDimensionState(index);
  if (side === 'z') return dimension.zGrowthLevel;
  return side === 'y' ? dimension.yGrowthLevel : dimension.xGrowthLevel;
}

function squareDimensionSideGrowthRate(side, index = 0) {
  return multiplyNumberValue(
    squareDimensionSideGrowth(squareDimensionSideValue(side, index)),
    squareDimensionSideGrowthLevel(side, index)
  );
}

function resetSquareDimensionState() {
  squareDimensionAutoUpgradeTimer = 0;
  squareDimensionAutoUpgradeCursor = 0;
  for (let index = 0; index < squareDimensionStates.length; index++) {
    Object.assign(squareDimensionStates[index], makeSquareDimensionState(index === 0 ? 1n : 2n));
  }
}

function buySquareDimensionSide(side, index = 0) {
  if (!squareDimensionIsAvailable(index)) return false;
  if (side === 'z' && !hasGeneralizationResearch('5-1')) return false;
  const dimension = squareDimensionState(index);
  const cost = squareDimensionSideCost(side, index);
  if (compareNumberValues(squarePoints, cost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, cost);
  if (side === 'z') {
    dimension.zGrowthLevel = addBaseNumbers(dimension.zGrowthLevel, 1n);
    dimension.zCost = multiplyNumberValue(dimension.zCost, 2n);
  } else if (side === 'y') {
    dimension.yGrowthLevel = addBaseNumbers(dimension.yGrowthLevel, 1n);
    dimension.yCost = multiplyNumberValue(dimension.yCost, 2n);
  } else {
    dimension.xGrowthLevel = addBaseNumbers(dimension.xGrowthLevel, 1n);
    dimension.xCost = multiplyNumberValue(dimension.xCost, 2n);
  }
  render();
  return true;
}

function squareDimensionSideBulkCost(cost, purchases) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0) return 0n;
  const doubling = NumberMath.power(2n, purchases);
  return multiplyNumberValue(cost, subtractNumberValues(doubling, 1n));
}

function squareDimensionSideMaxPurchases(side, index = 0) {
  if (!squareDimensionIsAvailable(index)) return 0;
  if (side === 'z' && !hasGeneralizationResearch('5-1')) return 0;

  const cost = squareDimensionSideCost(side, index);
  if (compareNumberValues(squarePoints, cost) < 0) return 0;

  let affordable = 1;
  let unaffordable = 2;
  while (compareNumberValues(squarePoints, squareDimensionSideBulkCost(cost, unaffordable)) >= 0) {
    affordable = unaffordable;
    if (unaffordable > Math.floor(Number.MAX_SAFE_INTEGER / 2)) return affordable;
    unaffordable *= 2;
  }

  while (unaffordable - affordable > 1) {
    const middle = affordable + Math.floor((unaffordable - affordable) / 2);
    if (compareNumberValues(squarePoints, squareDimensionSideBulkCost(cost, middle)) >= 0) {
      affordable = middle;
    } else {
      unaffordable = middle;
    }
  }
  return affordable;
}

function buySquareDimensionSideMaximum(side, index = 0) {
  const purchases = squareDimensionSideMaxPurchases(side, index);
  if (purchases <= 0) return false;

  const dimension = squareDimensionState(index);
  const cost = squareDimensionSideCost(side, index);
  const totalCost = squareDimensionSideBulkCost(cost, purchases);
  const nextCost = multiplyNumberValue(cost, NumberMath.power(2n, purchases));

  squarePoints = subtractNumberValues(squarePoints, totalCost);
  if (side === 'z') {
    dimension.zGrowthLevel = addBaseNumbers(dimension.zGrowthLevel, BigInt(purchases));
    dimension.zCost = nextCost;
  } else if (side === 'y') {
    dimension.yGrowthLevel = addBaseNumbers(dimension.yGrowthLevel, BigInt(purchases));
    dimension.yCost = nextCost;
  } else {
    dimension.xGrowthLevel = addBaseNumbers(dimension.xGrowthLevel, BigInt(purchases));
    dimension.xCost = nextCost;
  }
  render();
  return true;
}

function buySquareDimensionPowerTimeUpgrade(index = 0) {
  const dimension = squareDimensionState(index);
  if (!squareDimensionIsAvailable(index) || dimension.powerInterval <= SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL) {
    return false;
  }
  if (compareNumberValues(squarePoints, dimension.powerIntervalCost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, dimension.powerIntervalCost);
  dimension.powerInterval = Math.max(
    SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL,
    Math.ceil(dimension.powerInterval / 2)
  );
  dimension.powerIntervalCost = multiplyNumberValue(dimension.powerIntervalCost, 10n);
  render();
  return true;
}

function buySquareDimensionPowerStrength(index = 0) {
  const dimension = squareDimensionState(index);
  if (!squareDimensionIsAvailable(index) || dimension.powerStrengthUnlocked || hasGeneralizationResearch('6-2')) return false;
  const cost = multiplyNumberValue(SQUARE_DIMENSION_POWER_STRENGTH_COST, index === 0 ? 1n : 2n);
  if (compareNumberValues(squarePoints, cost) < 0) return false;

  squarePoints = subtractNumberValues(squarePoints, cost);
  dimension.powerStrengthUnlocked = true;
  log(
    hasGeneralizationResearch('5-1')
      ? '제곱력 생산 강화가 적용되었습니다. 제곱력 공식 지수가 1/6에서 1/3으로 변경되었습니다.'
      : '제곱력 생산 강화가 적용되었습니다. 제곱력 공식 지수가 1/4에서 1/2로 변경되었습니다.',
    true
  );
  render();
  return true;
}

function squareDimensionAutoUpgradeAvailable() {
  return hasGeneralizationResearch('7-3');
}

function toggleSquareDimensionAutoUpgrade() {
  if (!squareDimensionAutoUpgradeAvailable()) return false;
  squareDimensionAutoUpgradeEnabled = !squareDimensionAutoUpgradeEnabled;
  squareDimensionAutoUpgradeTimer = 0;
  render();
  return true;
}

function tryAutomaticSquareDimensionUpgrade() {
  if (!squareDimensionAutoUpgradeAvailable() || !squareDimensionAutoUpgradeEnabled) return false;

  const choices = [];
  for (let index = 0; index < squareDimensionCount(); index++) {
    for (const side of ['x', 'y', 'z']) {
      choices.push(() => buySquareDimensionSide(side, index));
    }
    choices.push(() => buySquareDimensionPowerTimeUpgrade(index));
    choices.push(() => buySquareDimensionPowerStrength(index));
  }
  if (choices.length === 0) return false;

  const start = squareDimensionAutoUpgradeCursor % choices.length;
  for (let offset = 0; offset < choices.length; offset++) {
    const choiceIndex = (start + offset) % choices.length;
    if (choices[choiceIndex]()) {
      squareDimensionAutoUpgradeCursor = (choiceIndex + 1) % choices.length;
      return true;
    }
  }
  return false;
}

function advanceSquareDimensionAutoUpgrade(elapsedMs) {
  if (
    !squareDimensionAutoUpgradeAvailable()
    || !squareDimensionAutoUpgradeEnabled
    || overflowed
    || squareMode
    || elapsedMs <= 0
  ) {
    squareDimensionAutoUpgradeTimer = 0;
    return false;
  }

  squareDimensionAutoUpgradeTimer += gameTick(elapsedMs) * autoUpgradeSpeedMultiplier();
  if (!Number.isFinite(squareDimensionAutoUpgradeTimer)) squareDimensionAutoUpgradeTimer = 250 * 16;

  const attempts = Math.min(16, Math.floor(squareDimensionAutoUpgradeTimer / 250));
  if (attempts <= 0) return false;

  let changed = false;
  for (let index = 0; index < attempts; index++) {
    if (!tryAutomaticSquareDimensionUpgrade()) break;
    squareDimensionAutoUpgradeTimer -= 250;
    changed = true;
  }
  if (squareDimensionAutoUpgradeTimer > 250) squareDimensionAutoUpgradeTimer = 250;
  return changed;
}

function squareDimensionSideGrowthNumber(side, index = 0) {
  const rate = squareDimensionSideGrowthRate(side, index);
  const numericRate = realNumberFromValue(rate);
  return Number.isFinite(numericRate) ? numericRate / Number(SQUARE_DIMENSION_SCALE) : Number.MAX_VALUE;
}

function advanceSquareDimensionState(dimension, index, elapsedMs) {
  const productionSpeed = SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL / dimension.powerInterval;
  const elapsedSeconds = (elapsedMs / 1000) * productionSpeed;
  const xGrowth = squareDimensionSideGrowthNumber('x', index) * elapsedSeconds * Number(SQUARE_DIMENSION_SCALE);
  const yGrowth = squareDimensionSideGrowthNumber('y', index) * elapsedSeconds * Number(SQUARE_DIMENSION_SCALE);
  const zGrowth = hasGeneralizationResearch('5-1')
    ? squareDimensionSideGrowthNumber('z', index) * elapsedSeconds * Number(SQUARE_DIMENSION_SCALE)
    : 0;
  let changed = false;

  if (Number.isFinite(xGrowth) && xGrowth < Number.MAX_SAFE_INTEGER) {
    dimension.xGrowthCarry += xGrowth;
    const wholeGrowth = Math.floor(dimension.xGrowthCarry);
    dimension.xGrowthCarry -= wholeGrowth;
    if (wholeGrowth > 0) {
      dimension.x = addBaseNumbers(dimension.x, BigInt(wholeGrowth));
      changed = true;
    }
  } else if (Number.isFinite(xGrowth) && xGrowth > 0) {
    dimension.x = addBaseNumbers(dimension.x, numberValueFromReal(xGrowth));
    changed = true;
  }

  if (Number.isFinite(yGrowth) && yGrowth < Number.MAX_SAFE_INTEGER) {
    dimension.yGrowthCarry += yGrowth;
    const wholeGrowth = Math.floor(dimension.yGrowthCarry);
    dimension.yGrowthCarry -= wholeGrowth;
    if (wholeGrowth > 0) {
      dimension.y = addBaseNumbers(dimension.y, BigInt(wholeGrowth));
      changed = true;
    }
  } else if (Number.isFinite(yGrowth) && yGrowth > 0) {
    dimension.y = addBaseNumbers(dimension.y, numberValueFromReal(yGrowth));
    changed = true;
  }

  if (Number.isFinite(zGrowth) && zGrowth < Number.MAX_SAFE_INTEGER) {
    dimension.zGrowthCarry += zGrowth;
    const wholeGrowth = Math.floor(dimension.zGrowthCarry);
    dimension.zGrowthCarry -= wholeGrowth;
    if (wholeGrowth > 0) {
      dimension.z = addBaseNumbers(dimension.z, BigInt(wholeGrowth));
      changed = true;
    }
  } else if (Number.isFinite(zGrowth) && zGrowth > 0) {
    dimension.z = addBaseNumbers(dimension.z, numberValueFromReal(zGrowth));
    changed = true;
  }

  return changed;
}

function advanceSquareDimensions(elapsedMs) {
  if (!squareDimensionAvailable() || overflowed || elapsedMs <= 0) {
    squareDimensionAutoUpgradeTimer = 0;
    return false;
  }

  let changed = false;
  for (let index = 0; index < squareDimensionCount(); index++) {
    if (advanceSquareDimensionState(squareDimensionState(index), index, elapsedMs)) {
      changed = true;
    }
  }
  if (advanceSquareDimensionAutoUpgrade(elapsedMs)) changed = true;
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

  const gain = hasGeneralizationResearch('5-2')
    ? NumberMath.max(
      divideNumberValue(NumberMath.power(value, 1 / 2400), gameEndValue()),
      1n
    )
    : NumberMath.max(
      NumberMath.log10(divideNumberValue(value, requirement)),
      1n
    );
  return multiplyNumberValue(squarePointGain(), gain);
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

// 파워 레벨은 계속 올릴 수 있지만 실제 퍼센트 획득 배율은 +100%에서 고정한다.
function percentEffectivePower(power) {
  return Math.min(100, normalizedPercentPower(power));
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
  const baseSoftcap = multiplyNumberValue(PERCENT_POWER_SOFTCAP_START, powerOfTenValue(level));
  return multiplyNumberValue(baseSoftcap, squareDimensionPercentSoftcapMultiplier());
}

function percentPowerGrowthLimit(power) {
  // 기존 저장 데이터와 호출부 호환을 위해 이름은 유지하지만,
  // 현재 퍼센트 시스템의 실제 상한은 소프트캡 하나만 사용한다.
  return percentPowerSoftcap(power);
}

function percentGain(value, power) {
  const softcap = percentPowerSoftcap(power);
  if (compareNumberValues(value, softcap) >= 0) return 0n;

  const remaining = subtractNumberValues(softcap, value);
  let gain = divideNumberValue(
    multiplyNumberValue(value, BigInt(percentEffectivePower(power))),
    100n
  );

  // 소프트캡에 가까워질수록 남은 공간 비율의 거듭제곱으로 감쇠한다.
  // 근사 수에서는 비율을 먼저 계산해야 거대한 지수에서 gain이 소실되지 않는다.
  // 일반 정수에서는 먼저 곱해야 정수 나눗셈으로 비율이 0으로 잘리지 않는다.
  const useStableRatio = isApproximateNumber(remaining) || isApproximateNumber(softcap);
  const remainingRatio = useStableRatio ? divideNumberValue(remaining, softcap) : null;
  for (let i = 0; i < percentPowerSoftcapDecayPower(); i++) {
    gain = useStableRatio
      ? multiplyNumberValue(gain, remainingRatio)
      : divideNumberValue(multiplyNumberValue(gain, remaining), softcap);
    if (compareNumberValues(gain, 0n) <= 0) return 0n;
  }

  gain = multiplyNumberValue(applyPercentEfficiency(gain), squareDimensionNumberMultiplier());
  return minimumNumberValue(gain, remaining);
}

function percentPowerSoftcapStatus(power, value = getBaseNumber()) {
  const softcap = percentPowerSoftcap(power);
  const state = compareNumberValues(value, softcap) >= 0
    ? '정체'
    : '부터 감쇠';
  return `소프트캡 ${fmtPowerBase(softcap)} ${state}`;
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

function percentPowerCostExponent() {
  return hasGeneralizationResearch('3-3') ? 1.1 : 1.5;
}

function percentPowerCost(cost, compounding = false) {
  if (compounding) return cost;
  const adjustedCost = discountedCost(cost);
  const threshold = powerOfTenValue(500);
  return compareNumberValues(adjustedCost, threshold) >= 0
    ? NumberMath.power(adjustedCost, percentPowerCostExponent())
    : adjustedCost;
}

function nextCompoundingPercentPowerCost(currentCost) {
  return NumberMath.power(currentCost, percentPowerCostExponent());
}

function updatePercentPowerCostAfterPurchase() {
  const currentCost = percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
  percentPower++;

  if (percentPowerCostCompounding || compareNumberValues(currentCost, powerOfTenValue(500)) >= 0) {
    percentPowerCostCompounding = true;
    percentPowerUpgradeCost = nextCompoundingPercentPowerCost(currentCost);
    return;
  }

  const nextRawCost = percentPowerUpgradeCostForNextLevel(percentPower);
  const nextAdjustedCost = discountedCost(nextRawCost);
  if (compareNumberValues(nextAdjustedCost, powerOfTenValue(500)) >= 0) {
    percentPowerCostCompounding = true;
    percentPowerUpgradeCost = nextCompoundingPercentPowerCost(nextAdjustedCost);
  } else {
    percentPowerUpgradeCost = nextRawCost;
  }
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
    squareConvergenceUpgradeLevels[upgrade.id] = 0;
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
    const legacyResearchId = research.id === '6-4' ? '7-2' : null;
    generalizationResearchState[research.id] =
      savedState?.[research.id] === true || savedState?.[legacyResearchId] === true;
  }
}

function loadSquareConvergenceUpgradeState(savedState, savedLevels) {
  resetSquareConvergenceUpgradeState();
  for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
    if (upgrade.max) {
      const rawLevel = Number(savedLevels?.[upgrade.id] ?? (savedState?.[upgrade.id] === true ? 1 : 0));
      const level = Number.isFinite(rawLevel)
        ? Math.max(0, Math.min(upgrade.max, Math.floor(rawLevel)))
        : 0;
      squareConvergenceUpgradeLevels[upgrade.id] = level;
      squareConvergenceUpgradeState[upgrade.id] = level > 0;
    } else {
      squareConvergenceUpgradeState[upgrade.id] = savedState?.[upgrade.id] === true;
      squareConvergenceUpgradeLevels[upgrade.id] = squareConvergenceUpgradeState[upgrade.id] ? 1 : 0;
    }
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
  let gain = NumberMath.max(NumberMath.log10(ratio), 1n);
  const upgradeLevel = squareConvergenceUpgradeLevel('cp_gain_5x');
  if (upgradeLevel > 0) {
    gain = multiplyNumberValue(gain, NumberMath.power(5n, upgradeLevel));
  }
  return gain;
}

function squareConvergenceExchangeRequirement() {
  return hasGeneralizationResearch('2-2')
    ? SQUARE_CONVERGENCE_IMPROVED_EXCHANGE_REQUIREMENT
    : SQUARE_CONVERGENCE_EXCHANGE_REQUIREMENT;
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
  if (resourceIndex === 0) return theorySquarePointCost;
  return theoryConvergencePointCost;
}

function theoryCostResourceLabel(resourceIndex) {
  return resourceIndex === 0 ? 'SP' : 'CP';
}

function canAffordTheoryResource(resourceIndex) {
  if (resourceIndex === 0) return compareNumberValues(squarePoints, theorySquarePointCost) >= 0;
  if (resourceIndex === 1) return compareNumberValues(squareConvergencePoints, theoryConvergencePointCost) >= 0;
  return false;
}

function setTheoryCostResource(resourceIndex) {
  const nextIndex = Number(resourceIndex);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex > 1) return false;
  theoryCostResourceIndex = nextIndex;
  render();
  return true;
}

function researchTheory() {
  if (!canResearchTheory()) return false;

  const selectedResource = theoryCostResourceIndex;
  const paidResourceLabel = theoryCostResourceLabel(selectedResource);
  if (theoryCostResourceIndex === 0) {
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
  if (id === '7-3') {
    squareDimensionAutoUpgradeEnabled = true;
    squareDimensionAutoUpgradeTimer = 0;
  }
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
  percentPowerCostCompounding = false;

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
