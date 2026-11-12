let num = 0;
let approximateNum = null;
let perClick = 1;
let perClickUpgradeCost = 10;

// 런타임 원인 추적용: 기본적으로 꺼져 있으며 게임 수치에는 관여하지 않는다.
let numberTraceEnabled = false;
let numberTraceStartedAt = 0;
let numberTraceRenderScheduled = false;
const numberTraceEvents = [];
const NUMBER_TRACE_EVENT_LIMIT = 2500;

let percentUnlocked = false;
let percentCharge = 0;
let pendingPercentUses = 0;
let percentChargeNeeded = 100;
let percentChargeLevel = 0;
let percentChargeUpgradeCost = 250;

// 퍼센트 파워: 기본 +1%. 요구 클릭 수가 50 이하일 때 해금
let percentPower = 1;
let percentPowerPurchaseCount = 0;
let percentPowerPurchaseBonus = 0;
let percentPowerUpgradeCost = 40000;
let percentPowerCostCompounding = false;

let overflowed = false;
let squareMode = false;
let squareUnlocked = false;
let squareBreakthroughEntered = false;
let knuthUnlocked = false;
let knuthPoints = 0;
let definitionFragments = 0;
let definitionStoryStep = 0;
let definitionStoryCompleted = false;
let numberBlackHoleSystemEnabled = false;
let numberBlackHoleDonationPercent = NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT;
let numberBlackHoleDonationRate = NUMBER_BLACK_HOLE_BASE_DONATION_RATE;
let numberBlackHoleDonationAmountLevel = 0;
let numberBlackHoleDonationSpeedLevel = 0;
let numberBlackHoleDonationAmountCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
let numberBlackHoleDonationSpeedCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
let numberBlackHoleTotalInvested = 0;
let numberBlackHoleDonationResource = 'number';
let numberBlackHoleTotalSpInvested = 0;
let numberBlackHoleSpDonationCount = 0;
let numberBlackHoleAccumulatedGameSeconds = 0;
let numberBlackHolePassiveRadius = 0;
let numberBlackHoleAutoUpgradeEnabled = false;
let numberBlackHoleAutoMaxEnabled = false;
// null represents an unbounded target without storing JSON-incompatible Infinity.
let numberBlackHoleAutoAmountLimit = null;
let numberBlackHoleAutoSpeedLimit = null;

function numberBlackHoleAutoLimitFromSave(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 ? value : null;
}

let singularityPoints = 0;
let totalSingularitiesPurchased = 0;
const singularityUpgradeLevels = { black_hole: 0, kp_gain: 0 };
let hasClaimedKnuthPoint = false;
let pendingKnuthPointClaim = false;
let knuthOperationLevel = 0;
const knuthBaseUpgradeLevels = {};
const knuthBaseAutoEnabled = {};
let knuthBaseAutoTimerMs = 0;
let knuthBaseAutoCursor = 0;
let knuthResetEquipmentOnNextPrestige = false;
const knuthEquippedUpgradeIds = new Set();
const knuthAdvancedOwned = {};
const knuthAdvancedEquipped = {};
let knuthEquipmentOrder = [];
for (const upgrade of KNUTH_ADVANCED_UPGRADES) {
  knuthAdvancedOwned[upgrade.id] = 0;
  knuthAdvancedEquipped[upgrade.id] = 0;
}
let squareRunGameSeconds = 0;
let knuthRunStartedAtMs = Date.now();
let shortestKnuthRealSeconds = null;
let longestKnuthRealSeconds = null;
let pendingKnuthCompletionSeconds = null;
function makeAchievementRunProgress(known = true) {
  return {
    version: 1,
    knuthKnown: known,
    convergenceKnown: known,
    manualGameplay: false,
    manualSpExchange: false,
    percentUsedKnuth: false,
    percentUsedConvergence: false,
    productionUnlocked: false
  };
}
let achievementRunProgress = makeAchievementRunProgress();
let pendingAchievementKnuthRun = null;
let squareSincePrestigeGameSeconds = 0;
let knuthPercentOverflow = 0;
let activeKnuthChallengeId = null;
let spaceExpansionActive = false;
let higgsParticles = 0;
let stagnantMassMg = 0;
let stagnantSingularities = 0;
const spaceExpansionUpgradeLevels = { higgs_gain: 0, mass_gain: 0, mass_effect: 0 };
const spaceExpansionOneTimeUpgradeState = Object.fromEntries(SPACE_EXPANSION_ONE_TIME_UPGRADES.map(u => [u.id, false]));
let knuthChallengeDysonSwarmMaxAtEntry = 8;
let kc4ElapsedRealSeconds = 0;
let kc4LastRealClockAt = null;
const completedKnuthChallengeIds = new Set();
let activeChapter = 'multiplication';
let squarePoints = 0;
let abstractionPermanentSp = 0;
let abstractionPermanentSingularities = 0;
let squareConvergenceUnlocked = false;
let squareConvergencePoints = 0;
let hasEverEarnedSquareConvergencePoint = false;
const SQUARE_DIMENSION_SCALE = 100;
const SQUARE_DIMENSION_AUTO_UPGRADE_BATCH_LIMIT = 256;
function makeSquareDimensionState(costMultiplier = 1) {
  return {
    x: 500,
    y: 600,
    z: 700,
    xCost: costMultiplier,
    yCost: costMultiplier,
    zCost: costMultiplier,
    xGrowthLevel: 1,
    yGrowthLevel: 1,
    zGrowthLevel: 1,
    xGrowthCarry: 0,
    yGrowthCarry: 0,
    zGrowthCarry: 0,
    powerInterval: SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL,
    powerIntervalCost: multiplyNumberValue(SQUARE_DIMENSION_POWER_TIME_BASE_COST, costMultiplier),
    powerStrengthUnlocked: false
  };
}

const squareDimensionStates = [
  makeSquareDimensionState(1),
  makeSquareDimensionState(2)
];
let divergerN = 1;
let divergerPower = 0;
let divergerA = 1;
let divergerB = 1;
let divergerC = 0;
let divergerInterval = DIVERGER_BASE_INTERVAL;
let divergerTimer = 0;
let divergerACpCost = 20;
let divergerBCpCost = 32;
let divergerCCpCost = 48;
let divergerSpeedCpCost = 10000;
let divergerALevel = 0;
let divergerBLevel = 0;
let divergerCLevel = 0;
let divergerSpeedLevel = 0;
let divergerSpeedIntervalHistory = [];
let divergerAutoUpgradeEnabled = true;
let divergerAutoUpgradeTimer = 0;
let divergerAutoUpgradeCursor = 0;
const DIVERGER_AUTO_UPGRADE_INTERVAL = 250;
const DIVERGER_AUTO_UPGRADE_BATCH_LIMIT = 256;

class DivergerUpgradeHistory {
  constructor() {
    this.runs = [];
    this.count = 0;
  }

  get length() { return this.count; }

  set length(value) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Invalid history length');
    if (value > this.count) {
      this.append(false, value - this.count);
      return;
    }
    while (this.count > value) {
      const last = this.runs[this.runs.length - 1];
      const removed = Math.min(last.count, this.count - value);
      last.count -= removed;
      this.count -= removed;
      if (last.count === 0) this.runs.pop();
    }
  }

  append(value, count = 1) {
    if (!Number.isSafeInteger(count) || count <= 0) return this.count;
    count = Math.min(count, Number.MAX_SAFE_INTEGER - this.count);
    if (count === 0) return this.count;
    value = value === 'legacy-theory' ? value : value === true;
    const last = this.runs[this.runs.length - 1];
    if (last && last.value === value) last.count += count;
    else this.runs.push({ value, count });
    this.count += count;
    return this.count;
  }

  push(...values) {
    for (const value of values) this.append(value);
    return this.count;
  }

  pop() {
    const last = this.runs[this.runs.length - 1];
    if (!last) return undefined;
    const value = last.value;
    if (--last.count === 0) this.runs.pop();
    this.count--;
    return value;
  }

  toJSON() {
    const encoded = { format: 'runs-v1', length: this.count, runs: this.runs.map(run => ({ ...run })) };
    const plainLength = 2 + Math.max(0, this.count - 1) + this.runs.reduce((size, run) =>
      size + run.count * (run.value === 'legacy-theory' ? 15 : run.value ? 4 : 5), 0);
    // Alternating paid/free entries can be smaller in the legacy flat format.
    if (JSON.stringify(encoded).length < plainLength) return encoded;
    const values = [];
    for (const run of this.runs) for (let index = 0; index < run.count; index++) values.push(run.value);
    return values;
  }
}

const divergerUpgradeHistory = {
  a: new DivergerUpgradeHistory(),
  b: new DivergerUpgradeHistory(),
  c: new DivergerUpgradeHistory(),
  speed: new DivergerUpgradeHistory()
};
const divergerGraphSamples = [];
let divergerGraphScaleMinimum = null;
let divergerGraphScaleMaximum = null;
let randomPower = 0;
let probabilizerTimerMs = 0;
let probabilizerLastRoll = null;
let probabilizerUpgradeLevels = { a: 0, b: 0, speed: 0, shift: 0 };
let probabilizerPowerUpgradeLevels = { gain: 0, diverger: 0, interval_floor: 0 };
let probabilizerRangeProgress = null;
let theory = 0;
let totalTheoryPurchased = 0;
let greatTheory = 0;
let totalGreatTheoryPurchased = 0;
let greatTheoryCpCost = ABSTRACTION_CP_BASE_COST;
let greatTheoryKpCost = ABSTRACTION_KP_BASE_COST;
let greatTheorySpCost = ABSTRACTION_SP_BASE_COST;
let greatTheoryTheoryCost = 4;
let abstractionCostResourceIndex = 0;
let automatiumPrestigeRetentionUnlocked = false;
const abstractionResearchState = {};
const abstractionResearchPaidCosts = {};
let abstractionResetOnNextKnuthPoint = false;
let abstractionBranchPriorities = { 1: ['time', 'expansion', 'percent'], 2: ['active', 'passive', 'idle'] };
let abstractionSecondBranchPurchaseOrder = [];
let abstractionResearchPresets = Array.from({ length: ABSTRACTION_PRESET_FREE_SLOTS }, () => ({ name: '', ids: [] }));
let generalizationResetCount = 0;
let saveCount = 0;
let loadCount = 0;
let theorySquarePointCost = THEORY_SQUARE_POINT_BASE_COST;
let theoryConvergencePointCost = THEORY_CONVERGENCE_POINT_BASE_COST;
let generalizationResetCost = GENERALIZATION_RESET_BASE_COST;
let theoryCostResourceIndex = 0;
let pendingSquarePrestigeValue = null;
let pendingSquarePrestigePoints = null;
let pendingSquarePrestigeRequirement = null;
let autoUpgradeEnabled = false;
let autoUpgradeTimer = 0;
let squareDimensionAutoUpgradeEnabled = false;
let squareDimensionAutoUpgradeTimer = 0;
let squareDimensionAutoUpgradeCursor = 0;
let autoClickerSpeed = 1000;

let autoClickerUnlocked = false;
let autoClickerPrice = 100;
let autoClickerSpeedPrice = 200;
let autoClickerTimer = 0;

// 오토 클릭커 병렬화: 구매할 때마다 한 주기당 클릭 수가 2배
let autoClickerParallel = 1;
let autoClickerParallelPrice = 1000;

// 오토 클릭커의 자동 클릭도 % 충전으로 인정하는 업그레이드
let autoClickerPercentFillUnlocked = false;
const autoClickerPercentFillPrice = 20000;

// % 오토클리커 설정
let percentAutoUnlocked = false;
let percentAutoPrice = 150;
const percentAutoSpeedLevels = [1000, 800, 600, 400, 200]; // 1초 → 0.8초 → 0.6초 → 0.4초 → 0.2초
let percentAutoSpeedLevel = 0;
let percentAutoSpeed = percentAutoSpeedLevels[percentAutoSpeedLevel];
let percentAutoSpeedPrice = 250;
let percentAutoTimer = 0;

function isApproximateNumber(value) {
  return NumberMath.isScientific(value);
}

function gameClockNowMs() {
  return typeof performance === 'undefined' ? Date.now() : performance.now();
}

function gameTimelineNowMs() {
  return typeof window !== 'undefined' && window.numberTycoonSession
    ? window.numberTycoonSession.timelineNow() : gameClockNowMs();
}

function gameUtcNowMs() {
  return typeof window !== 'undefined' && window.numberTycoonSession
    ? window.numberTycoonSession.utcNow() : Date.now();
}

function gameSessionPaused() {
  return typeof window !== 'undefined' && window.numberTycoonSession?.isPaused() === true;
}

function setGameInterval(callback, interval) {
  return typeof window !== 'undefined' && window.numberTycoonSession
    ? window.numberTycoonSession.register(callback, interval) : setInterval(callback, interval);
}

function elapsedRealTimeSince(lastAt) {
  const now = gameTimelineNowMs();
  return { now, elapsedMs: Math.max(0, now - lastAt) };
}

function normalizeApproximateNumber(mantissa, exponent) {
  return NumberMath.normalize(mantissa, exponent);
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
    num = 0;
    return;
  }

  const normalized = NumberMath.fromValue(value);
  if (isApproximateNumber(normalized)) {
    approximateNum = normalized;
    num = 0;
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

function addToBaseNumber(
  value,
  source = 'unknown',
  softcapPower = percentPower,
  purchaseBonus = percentPowerPurchaseBonus,
  finalMultiplier = 1,
  finalExponent = 1,
  finalGainExponent = 1
) {
  if (compareNumberValues(value, 0) <= 0) return;
  const before = getBaseNumber();
  const finalGain = finalNumberProductionGain(
    value,
    finalMultiplier,
    before,
    softcapPower,
    purchaseBonus,
    finalExponent,
    finalGainExponent
  );
  if (compareNumberValues(finalGain, 0) <= 0) return;
  const after = addBaseNumbers(before, finalGain);
  setBaseNumber(after);
  if (numberTraceEnabled) {
    traceNumberEvent('number-change', {
      source,
      before: numberTraceValue(before),
      gain: numberTraceValue(finalGain),
      after: numberTraceValue(after)
    });
  }
}

function multiplyBaseNumber(multiplier) {
  setBaseNumber(multiplyNumberValue(getBaseNumber(), multiplier));
}

function addFractionOfBaseNumber(numerator, denominator = 100) {
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

function numberValueFromSave(rawValue, fallback = 0) {
  return NumberMath.fromValue(rawValue, fallback);
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

function divergerAvailable() {
  if (isKnuthChallengeActive('kc2')) return false;
  return hasGeneralizationResearch('3-2') || (
    typeof hasKnuthUpgrade === 'function' &&
    hasKnuthUpgrade('permanent_production')
  );
}

function divergerMinInterval() {
  return hasGeneralizationResearch('4-3')
    ? DIVERGER_RESEARCH_MIN_INTERVAL
    : DIVERGER_MIN_INTERVAL;
}

function abstractionProductionSpeedMultiplier() {
  return hasAbstractionResearch('10-1') ? 4 : 1;
}

function divergerEffectiveInterval() {
  return divergerInterval / (abstractionProductionSpeedMultiplier() * abstractionSecondBranchDivergerSpeed());
}

function squareDimensionEffectiveInterval(dimension) {
  return dimension.powerInterval / abstractionProductionSpeedMultiplier();
}

function abstractionDivergerNSpeedMultiplier() {
  if (!hasAbstractionResearch('17-4')) return 1;
  const { divergerNSpeedStrength, divergerALogScale } = ABSTRACTION_TIER17_BALANCE;
  const aLog = NumberMath.log10(NumberMath.max(1, abstractionEffectiveDivergerA()));
  const logarithm = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1,
    NumberMath.divideApproximate(aLog, divergerALogScale))), Math.log10(2));
  return addBaseNumbers(1, multiplyNumberValue(divergerNSpeedStrength, logarithm));
}

function divergerDenominator() {
  return Math.max(1, 100 - abstractionEffectiveDivergerC());
}

function divergerLog10(value) {
  return NumberMath.log10Abs(value);
}

let divergerProductionInputCache = null;

function withDivergerProductionInputs(operation) {
  if (divergerProductionInputCache !== null) return operation();
  divergerProductionInputCache = {};
  try {
    return operation();
  } finally {
    divergerProductionInputCache = null;
  }
}

function divergerProductionInputs() {
  if (divergerProductionInputCache?.parameters) return divergerProductionInputCache.parameters;
  const a = abstractionEffectiveDivergerA();
  const improved = hasGeneralizationResearch('5-3');
  const parameters = {
    aPower: improved ? NumberMath.power(a, 2) : a,
    exponent: improved
      ? abstractionEffectiveDivergerB() + (abstractionEffectiveDivergerC() / 2)
      : abstractionEffectiveDivergerB(),
    denominator: divergerDenominator()
  };
  if (divergerProductionInputCache) divergerProductionInputCache.parameters = parameters;
  return parameters;
}

function divergerProductionBeforeDyson(n = divergerN, includeMultiplier = true) {
  const parameters = divergerProductionInputs();
  const nPower = NumberMath.power(n, parameters.exponent);
  const production = NumberMath.divideApproximate(
    multiplyNumberValue(parameters.aPower, nPower),
    parameters.denominator
  );
  return includeMultiplier ? multiplyNumberValue(production, knuthBaseMultiplier('diverger_gain', 2)) : production;
}

function probabilizerAvailable() {
  return knuthUnlocked && hasClaimedKnuthPoint && knuthBaseUpgradeEffectLevel('probabilizer') > 0;
}

function probabilizerGrowth() {
  return probabilizerAvailable() ? NumberMath.divideApproximate(
    NumberMath.log10(addBaseNumbers(1, NumberMath.divideApproximate(randomPower, PROBABILIZER_BALANCE.referencePower))),
    Math.log10(2)
  ) : 0;
}

function abstractionProbabilizerMultiplier() {
  if (!hasAbstractionResearch('20-1') || !probabilizerAvailable() || !isPositiveNumberValue(randomPower)) return 1;
  const growth = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1,
    NumberMath.divideApproximate(randomPower, ABSTRACTION_TIER20_BALANCE.requiredRandomPower))), Math.log10(2));
  return addBaseNumbers(1, multiplyNumberValue(ABSTRACTION_TIER20_BALANCE.boostLogStrength, growth));
}

function probabilizerDivergerParameterMultiplier() {
  if (!probabilizerAvailable() || !isPositiveNumberValue(randomPower)) return 1;
  const growth = NumberMath.log10(addBaseNumbers(1,
    NumberMath.divideApproximate(randomPower, PROBABILIZER_BALANCE.referencePower)));
  const multiplier = addBaseNumbers(1, multiplyNumberValue(PROBABILIZER_BALANCE.divergerParameterLogStrength, growth));
  return multiplyNumberValue(multiplyNumberValue(multiplier, PROBABILIZER_BALANCE.divergerParameterScale),
    multiplyNumberValue(abstractionProbabilizerMultiplier(), NumberMath.power(1.5, probabilizerPowerUpgradeLevels.diverger)));
}

function numberBlackHoleTimeLimit() {
  const lift = !probabilizerAvailable() || !isPositiveNumberValue(randomPower) ? 1 : addBaseNumbers(1, multiplyNumberValue(
    multiplyNumberValue(PROBABILIZER_BALANCE.timeLimitStrength, probabilizerGrowth()),
    multiplyNumberValue(NumberMath.power(abstractionProbabilizerMultiplier(), ABSTRACTION_TIER20_BALANCE.timeLimitPower),
      abstractionMassTimeLimitMultiplier())));
  // Timers still use finite native milliseconds; leave arithmetic headroom, not a gameplay threshold.
  return NumberMath.toNumber(NumberMath.min(Number.MAX_VALUE / 1e12,
    multiplyNumberValue(multiplyNumberValue(NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER, lift),
      hasAbstractionResearch('27-2') ? ABSTRACTION_PRODUCTION_BRANCH_BALANCE.blackHoleLimitMultiplier : 1)));
}

function abstractionProbabilizerCpMultiplier() {
  if (!hasAbstractionResearch('25-1') || !probabilizerAvailable() || !isPositiveNumberValue(randomPower)) return 1;
  const tuning = ABSTRACTION_PRODUCTION_BRANCH_BALANCE;
  const scaledLog = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, randomPower)), tuning.cpLogScale);
  return NumberMath.powerOfTen(multiplyNumberValue(tuning.cpLogStrength, NumberMath.power(scaledLog, tuning.cpCurve)));
}

function abstractionBlackHoleCpMultiplier() {
  if (!hasAbstractionResearch('27-2') || typeof numberBlackHoleAvailable !== 'function'
    || !numberBlackHoleAvailable()) return 1;
  const radius = numberBlackHoleSchwarzschildRadius();
  if (!isPositiveNumberValue(radius)) return 1;
  const tuning = ABSTRACTION_PRODUCTION_BRANCH_BALANCE;
  const scaledLog = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, radius)), tuning.blackHoleCpLogScale);
  return NumberMath.powerOfTen(multiplyNumberValue(tuning.blackHoleCpLogStrength,
    NumberMath.power(scaledLog, tuning.blackHoleCpCurve)));
}

function abstractionProbabilizerModeFraction() {
  if (!hasAbstractionResearch('26-1') || !isPositiveNumberValue(randomPower)) return 0;
  const log = NumberMath.log10(addBaseNumbers(1, randomPower));
  return NumberMath.toNumber(NumberMath.divideApproximate(log,
    addBaseNumbers(log, ABSTRACTION_PRODUCTION_BRANCH_BALANCE.distributionLogScale)));
}

function abstractionProbabilizerTimeMultiplier() {
  if (!hasAbstractionResearch('27-1') || typeof numberBlackHoleTimeMultiplier !== 'function') return 1;
  return Math.pow(Math.max(1, numberBlackHoleTimeMultiplier()), ABSTRACTION_PRODUCTION_BRANCH_BALANCE.probabilizerTimePower);
}

function abstractionProbabilizerRangeMultiplier() {
  if (!hasAbstractionResearch('26-1') || !isPositiveNumberValue(randomPower)) return 1;
  const tuning = ABSTRACTION_PRODUCTION_BRANCH_BALANCE;
  const scaledLog = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, randomPower)), tuning.rangeLogScale);
  return NumberMath.powerOfTen(multiplyNumberValue(tuning.rangeLogStrength,
    NumberMath.power(scaledLog, tuning.rangeCurve)));
}

function probabilizerMinimumInterval() {
  return Math.max(Number.MIN_VALUE, Math.pow(0.5, probabilizerPowerUpgradeLevels.interval_floor));
}

function probabilizerPowerMultiplier() {
  return probabilizerAvailable() ? spaceExpansionMultiplier(multiplyNumberValue(
    multiplyNumberValue(NumberMath.power(3, probabilizerPowerUpgradeLevels.gain), knuthAdvancedEffect('random_gain')),
    stagnantMassRandomMultiplier())) : 1;
}

function probabilizerPowerUpgradeCost(id) {
  const upgrade = PROBABILIZER_POWER_UPGRADES.find(item => item.id === id);
  if (!upgrade) return null;
  const level = probabilizerPowerUpgradeLevels[id];
  if (id === 'diverger') {
    const thresholdLevel = Math.ceil((Math.log10(PROBABILIZER_COST_BALANCE.divergerPowerThreshold)
      - Math.log10(upgrade.baseCost)) / Math.log10(upgrade.growth));
    if (level > thresholdLevel) {
      return multiplyNumberValue(multiplyNumberValue(upgrade.baseCost, NumberMath.power(upgrade.growth, thresholdLevel)),
        NumberMath.power(PROBABILIZER_COST_BALANCE.divergerPowerGrowth, level - thresholdLevel));
    }
  }
  return multiplyNumberValue(upgrade.baseCost, NumberMath.power(upgrade.growth, level));
}

function probabilizerPowerUpgradeAtMaximum(id) {
  return id === 'interval_floor' ? probabilizerMinimumInterval() <= Number.MIN_VALUE
    : probabilizerPowerUpgradeLevels[id] >= Number.MAX_SAFE_INTEGER;
}

function buyProbabilizerPowerUpgrade(id) {
  const cost = probabilizerPowerUpgradeCost(id);
  if (cost === null || !probabilizerAvailable() || probabilizerPowerUpgradeAtMaximum(id)
    || compareNumberValues(randomPower, cost) < 0) return false;
  const previousInterval = probabilizerParameters().intervalMs;
  randomPower = subtractNumberValues(randomPower, cost);
  probabilizerPowerUpgradeLevels[id]++;
  probabilizerTimerMs *= probabilizerParameters().intervalMs / previousInterval;
  if (divergerAvailable()) divergerPower = divergerProductionValue();
  render();
  return true;
}

function probabilizerRangeMaximum() {
  return hasAbstractionResearch('21-1') ? ABSTRACTION_TIER21_BALANCE.rangeMaximum : Number.MAX_SAFE_INTEGER;
}

function probabilizerRangeGrowth() {
  return hasAbstractionResearch('21-1') ? ABSTRACTION_TIER21_BALANCE.rangeGrowth : PROBABILIZER_BALANCE.rangeGrowth;
}

function initializeProbabilizerRangeProgress() {
  if (probabilizerRangeProgress !== null) return;
  const { a, b } = probabilizerBaseParameters();
  probabilizerRangeProgress = { a, b, aLevel: probabilizerUpgradeLevels.a, bLevel: probabilizerUpgradeLevels.b };
}

function probabilizerRangeValue(id, level) {
  if (probabilizerRangeProgress && level >= probabilizerRangeProgress[`${id}Level`]) {
    return Math.min(probabilizerRangeMaximum(), probabilizerRangeProgress[id]
      * Math.pow(probabilizerRangeGrowth(), level - probabilizerRangeProgress[`${id}Level`]));
  }
  // Checkpoint existing values before enabling the extension; never reprice old range levels.
  return Math.min(Number.MAX_SAFE_INTEGER,
    PROBABILIZER_BALANCE[id] * Math.pow(PROBABILIZER_BALANCE.rangeGrowth, level));
}

function probabilizerBaseParameters(levels = probabilizerUpgradeLevels) {
  const b = probabilizerRangeValue('b', levels.b);
  const a = Math.min(b, probabilizerRangeValue('a', levels.a));
  const baseMode = Math.min(b, a + (b - a) / 2 + levels.shift);
  return {
    a, b,
    mode: baseMode,
    intervalMs: Math.max(probabilizerMinimumInterval(), PROBABILIZER_BALANCE.intervalMs * Math.pow(0.8, levels.speed))
  };
}

function probabilizerParameters(levels = probabilizerUpgradeLevels) {
  const base = probabilizerBaseParameters(levels);
  if (!hasAbstractionResearch('26-1') || !isPositiveNumberValue(randomPower)) return base;
  const multiplier = abstractionProbabilizerRangeMultiplier();
  const maximum = probabilizerRangeMaximum();
  const scale = value => NumberMath.toNumber(NumberMath.min(maximum, multiplyNumberValue(value, multiplier)));
  const a = scale(base.a), b = scale(base.b), baseMode = scale(base.mode);
  return { a, b, mode: Math.min(b, baseMode + (b - baseMode) * abstractionProbabilizerModeFraction()),
    intervalMs: base.intervalMs };
}

const probabilizerCostCache = new Map();

function independentUpgradePriceReferenceActive() {
  return hasAbstractionResearch('29-1');
}

function probabilizerPriceLayers(value) {
  let layers = 0;
  while (NumberMath.isScientific(value)) { layers++; value = value.exponent; }
  return layers;
}

function upgradeReferenceBoundaryIndex(referenceCost, growthExponent, threshold, purchases) {
  const parts = NumberMath.isScientific(referenceCost) ? referenceCost : NumberMath.toScientific(referenceCost);
  // Subtract whole exponents first, retaining a mantissa just below an inclusive threshold.
  const distance = (threshold - parts.exponent) - Math.log10(parts.mantissa);
  return Math.min(purchases, Math.max(0, Math.ceil(distance / growthExponent)));
}

function referenceBandedGrowthExponent(referenceCost, referenceGrowth, actualGrowth, purchases, balance) {
  if (purchases <= 0) return 0;
  const parts = NumberMath.isScientific(referenceCost) ? referenceCost : NumberMath.toScientific(referenceCost);
  if (typeof parts.exponent !== 'number' || !(referenceGrowth > 0) || !(actualGrowth > 0)) return null;
  const { kpBandStartExponent: start, kpBandWidth: width, kpBandGrowth: growth } = balance;
  const offset = parts.exponent - start + referenceGrowth * (purchases - 1);
  const wholeBand = Math.floor(offset / width);
  const remainder = offset - wholeBand * width;
  const lastBand = Math.max(0, wholeBand + 1 + (Math.log10(parts.mantissa) >= width - remainder ? 1 : 0));
  if (lastBand === 0) return multiplyNumberValue(actualGrowth, purchases);
  // Older bands beyond this geometric tail are below NumberMath precision, even at MAX_SAFE_INTEGER purchases.
  const firstBand = Math.max(1, lastBand - 95);
  let weightedCount = 0;
  let previousBand = null;
  for (let index = 0; index <= lastBand - firstBand && index < 96; index++) {
    const band = lastBand - index;
    if (band === previousBand) continue;
    previousBand = band;
    const from = upgradeReferenceBoundaryIndex(referenceCost, referenceGrowth, start + (band - 1) * width, purchases);
    const to = band === lastBand ? purchases
      : upgradeReferenceBoundaryIndex(referenceCost, referenceGrowth, start + band * width, purchases);
    weightedCount += Math.max(0, to - from) * Math.pow(growth, band - lastBand);
  }
  const normalCount = firstBand === 1
    ? upgradeReferenceBoundaryIndex(referenceCost, referenceGrowth, start, purchases) : 0;
  return addBaseNumbers(multiplyNumberValue(actualGrowth, normalCount), multiplyNumberValue(
    actualGrowth * weightedCount, NumberMath.power(growth, lastBand)));
}

function bandedUpgradePriceExponent(exponent, growthExponent, purchases, balance, referenceExponent = exponent) {
  const increment = referenceBandedGrowthExponent(NumberMath.powerOfTen(referenceExponent),
    growthExponent, growthExponent, purchases, balance);
  return increment === null ? null : addBaseNumbers(exponent, increment);
}

function upgradePriceFromExponent(exponent) {
  return exponent === null ? null : NumberMath.isScientific(exponent.exponent)
    ? { approximate: true, mantissa: 1, exponent } : NumberMath.powerOfTen(exponent);
}

function feedbackBandedUpgradePriceExponent(exponent, growthExponent, purchases, balance) {
  const rate = Math.log10(balance.kpBandGrowth) / balance.kpBandWidth;
  while (purchases > 0) {
    if (NumberMath.isScientific(exponent.exponent)) {
      const layers = probabilizerPriceLayers(exponent);
      if (layers + purchases + 1 > 49) return null;
      for (let index = 0; index < purchases; index++) {
        const scaledMantissa = NumberMath.normalize(exponent.mantissa * rate, 0).mantissa;
        exponent = { approximate: true, mantissa: 1,
          exponent: { approximate: true, mantissa: scaledMantissa, exponent: exponent.exponent } };
      }
      return exponent;
    }
    const band = addBaseNumbers(1, NumberMath.floor(NumberMath.divideApproximate(
      subtractNumberValues(exponent, balance.kpBandStartExponent), balance.kpBandWidth)));
    const increment = typeof band === 'number' && band <= 50
      ? growthExponent * Math.pow(balance.kpBandGrowth, band)
      : NumberMath.powerOfTen(addBaseNumbers(Math.log10(growthExponent),
        multiplyNumberValue(Math.log10(balance.kpBandGrowth), band)));
    exponent = addBaseNumbers(exponent, increment);
    purchases--;
  }
  return exponent;
}

function compareUpgradeCost(funds, cost) {
  if (cost === null) return -1;
  if (funds === cost) return 0;
  let tieBreak = 0;
  // Compare enormous exponent fields first, retaining mantissas only to break exact exponent ties.
  if (NumberMath.isScientific(cost.exponent) && NumberMath.isScientific(cost.exponent.exponent)) {
    if (!NumberMath.isScientific(funds)) funds = NumberMath.toScientific(funds);
    while (NumberMath.isScientific(cost.exponent) && NumberMath.isScientific(cost.exponent.exponent)) {
      if (!funds || !NumberMath.isScientific(funds.exponent)) return -1;
      const mantissaOrder = Math.sign(funds.mantissa - cost.mantissa);
      if (mantissaOrder !== 0) tieBreak = mantissaOrder;
      funds = funds.exponent;
      cost = cost.exponent;
    }
  }
  return compareNumberValues(funds, cost) || tieBreak;
}

function probabilizerCanAffordCost(funds, cost) {
  return compareUpgradeCost(funds, cost) >= 0;
}

function probabilizerUpgradeCost(id) {
  const upgrade = PROBABILIZER_UPGRADES.find(item => item.id === id);
  if (!upgrade) return null;
  const level = probabilizerUpgradeLevels[id];
  const separated = independentUpgradePriceReferenceActive();
  const key = `${level}:${upgrade.priceExponent}:${JSON.stringify(PROBABILIZER_COST_BALANCE)}:${separated}`;
  const cached = probabilizerCostCache.get(id);
  if (cached?.key === key) return cached.cost;
  const thresholdLevel = Math.ceil((PROBABILIZER_COST_BALANCE.kpThresholdExponent - 300) / upgrade.priceExponent);
  const growthExponent = upgrade.priceExponent * PROBABILIZER_COST_BALANCE.kpGrowthExponentMultiplier;
  const normalPurchases = Math.min(level, thresholdLevel);
  const initialExponent = 300 + normalPurchases * upgrade.priceExponent;
  let exponent;
  if (separated) {
    const increment = referenceBandedGrowthExponent(NumberMath.powerOfTen(initialExponent), upgrade.priceExponent,
      growthExponent, level - normalPurchases, PROBABILIZER_COST_BALANCE);
    exponent = increment === null ? null : addBaseNumbers(initialExponent, increment);
  } else {
    const thresholdExponent = 300 + thresholdLevel * upgrade.priceExponent;
    const highLevel = thresholdLevel + Math.ceil(
      (PROBABILIZER_COST_BALANCE.kpBandStartExponent - thresholdExponent) / growthExponent);
    exponent = level <= highLevel
      ? addBaseNumbers(300, addBaseNumbers(multiplyNumberValue(upgrade.priceExponent, Math.min(level, thresholdLevel)),
        multiplyNumberValue(growthExponent, Math.max(0, level - thresholdLevel))))
      : feedbackBandedUpgradePriceExponent(thresholdExponent + (highLevel - thresholdLevel) * growthExponent,
        growthExponent, level - highLevel, PROBABILIZER_COST_BALANCE);
  }
  const cost = upgradePriceFromExponent(exponent);
  probabilizerCostCache.set(id, { key, cost });
  return cost;
}

function probabilizerUpgradeReferenceCost(id) {
  if (!independentUpgradePriceReferenceActive()) return probabilizerUpgradeCost(id);
  const upgrade = PROBABILIZER_UPGRADES.find(item => item.id === id);
  return upgrade ? NumberMath.powerOfTen(addBaseNumbers(300,
    multiplyNumberValue(upgrade.priceExponent, probabilizerUpgradeLevels[id]))) : null;
}

function probabilizerUpgradeAtMaximum(id) {
  const { a, b, mode, intervalMs } = probabilizerBaseParameters();
  if (probabilizerUpgradeCost(id) === null) return true;
  if (id === 'speed') return intervalMs <= probabilizerMinimumInterval();
  if (id === 'shift') return mode >= b;
  if (id === 'a') return a >= b || a >= probabilizerRangeMaximum();
  return id === 'b' && b >= probabilizerRangeMaximum();
}

function buyProbabilizerUpgrade(id) {
  const cost = probabilizerUpgradeCost(id);
  if (cost === null || !probabilizerAvailable() || probabilizerUpgradeAtMaximum(id)
    || !probabilizerCanAffordCost(knuthPoints, cost)) return false;
  if (hasAbstractionResearch('21-1')) initializeProbabilizerRangeProgress();
  const previousInterval = probabilizerParameters().intervalMs;
  knuthPoints = subtractNumberValues(knuthPoints, cost);
  probabilizerUpgradeLevels[id]++;
  if (probabilizerRangeProgress && (id === 'a' || id === 'b')) {
    probabilizerRangeProgress[id] = probabilizerBaseParameters()[id];
    probabilizerRangeProgress[`${id}Level`] = probabilizerUpgradeLevels[id];
  }
  // Preserve progress toward the next roll, without granting a backlog at the new speed.
  probabilizerTimerMs *= probabilizerParameters().intervalMs / previousInterval;
  render();
  return true;
}

function rollProbabilizer(random = Math.random, parameters = probabilizerParameters()) {
  const { a, b, mode } = parameters;
  if (a === b) return a;
  let value;
  if (probabilizerUpgradeLevels.shift === 0 && mode === a + (b - a) / 2) {
    value = b > 1e150 ? a + (b - a) * ((random() + random()) / 2)
      : a + (b - a) * (random() + random()) / 2;
  } else {
    // Inverse triangular CDF moves the peak while keeping both endpoints fixed.
    const u = random();
    if (b > 1e150) {
      const peakRatio = (mode - a) / (b - a);
      value = u < peakRatio ? a + (b - a) * Math.sqrt(u * peakRatio)
        : b - (b - a) * Math.sqrt((1 - u) * (1 - peakRatio));
    } else {
      value = u < (mode - a) / (b - a)
        ? a + Math.sqrt(u * (b - a) * (mode - a))
        : b - Math.sqrt((1 - u) * (b - a) * (b - mode));
    }
  }
  return Math.max(a, Math.min(b, Math.round(value)));
}

function advanceProbabilizer(elapsedMs, random = Math.random) {
  if (!probabilizerAvailable() || !Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0;
  const parameters = probabilizerParameters();
  const { a, b, mode, intervalMs } = parameters;
  const acceleratedMs = Math.min(Number.MAX_VALUE, elapsedMs * abstractionProbabilizerTimeMultiplier());
  probabilizerTimerMs = Math.min(Number.MAX_VALUE, probabilizerTimerMs + acceleratedMs);
  const nativeCount = Math.floor(probabilizerTimerMs / intervalMs);
  const count = Number.isSafeInteger(nativeCount) ? nativeCount
    : NumberMath.floor(NumberMath.divideApproximate(probabilizerTimerMs,
      NumberMath.fromString(intervalMs.toExponential())));
  if (!isPositiveNumberValue(count)) return 0;
  probabilizerTimerMs %= intervalMs;
  let gain = 0;
  if (compareNumberValues(count, 256) <= 0) {
    for (let index = 0; index < count; index++) {
      probabilizerLastRoll = rollProbabilizer(random, parameters);
      if (b > 1e150) gain = addBaseNumbers(gain, probabilizerLastRoll);
      else gain += probabilizerLastRoll;
    }
  } else {
    // Offline/coarse ticks approximate a sum, not one repeated roll: variance grows with sqrt(count).
    probabilizerLastRoll = rollProbabilizer(random, parameters);
    let normal = -6;
    for (let index = 0; index < 12; index++) normal += random();
    const trials = subtractNumberValues(count, 1);
    const range = b - a, peak = mode - a;
    const meanValue = b > 1e150 ? a + range / 3 + peak / 3 : (a + b + mode) / 3;
    const mean = multiplyNumberValue(trials, meanValue);
    const peakRatio = range > 0 ? peak / range : 0;
    const deviation = b > 1e150 ? range * Math.sqrt((1 + peakRatio * peakRatio - peakRatio) / 18)
      : Math.sqrt((range * range + peak * peak - range * peak) / 18);
    const offset = multiplyNumberValue(Math.abs(deviation * normal), NumberMath.power(trials, 0.5));
    const subtotal = normal >= 0 ? addBaseNumbers(mean, offset) : subtractNumberValues(mean, offset);
    gain = addBaseNumbers(probabilizerLastRoll, NumberMath.min(
      multiplyNumberValue(trials, b), NumberMath.max(multiplyNumberValue(trials, a), NumberMath.floor(subtotal))));
  }
  randomPower = addBaseNumbers(randomPower, multiplyNumberValue(gain, probabilizerPowerMultiplier()));
  if (divergerAvailable()) divergerPower = divergerProductionValue();
  return count;
}

function loadProbabilizerState(saved) {
  probabilizerRangeProgress = null;
  probabilizerPowerUpgradeLevels = { gain: 0, diverger: 0, interval_floor: 0 };
  for (const { id } of PROBABILIZER_POWER_UPGRADES) {
    const level = saved.probabilizerPowerUpgradeLevels?.[id];
    // Below the smallest positive native millisecond, timers cannot distinguish another halving.
    const limit = id === 'interval_floor' ? 1074 : Number.MAX_SAFE_INTEGER;
    probabilizerPowerUpgradeLevels[id] = Number.isFinite(level) && level >= 0 ? Math.min(limit, Math.floor(level)) : 0;
  }
  probabilizerUpgradeLevels = { a: 0, b: 0, speed: 0, shift: 0 };
  for (const { id } of PROBABILIZER_UPGRADES) {
    const level = saved.probabilizerUpgradeLevels?.[id];
    const limit = id === 'speed' ? Math.ceil((Math.log(probabilizerMinimumInterval()) - Math.log(PROBABILIZER_BALANCE.intervalMs)) / Math.log(0.8))
      : Number.MAX_SAFE_INTEGER - PROBABILIZER_BALANCE.b;
    probabilizerUpgradeLevels[id] = Number.isFinite(level) && level >= 0 ? Math.min(limit, Math.floor(level)) : 0;
  }
  const range = saved.probabilizerRangeProgress;
  if (range && ['a', 'b'].every(id => Number.isFinite(range[id]) && range[id] >= PROBABILIZER_BALANCE[id]
    && range[id] <= ABSTRACTION_TIER21_BALANCE.rangeMaximum && Number.isSafeInteger(range[`${id}Level`])
    && range[`${id}Level`] >= 0 && range[`${id}Level`] <= probabilizerUpgradeLevels[id]) && range.a <= range.b) {
    probabilizerRangeProgress = { a: range.a, b: range.b, aLevel: range.aLevel, bLevel: range.bLevel };
  }
  if (hasAbstractionResearch('21-1')) initializeProbabilizerRangeProgress();
  randomPower = numberValueFromSave(saved.randomPower);
  const { a, b, intervalMs } = probabilizerParameters();
  const timer = Number(saved.probabilizerTimerMs);
  probabilizerTimerMs = Number.isFinite(timer) && timer >= 0 ? timer % intervalMs : 0;
  const roll = saved.probabilizerLastRoll;
  probabilizerLastRoll = Number.isFinite(roll) && roll >= a && roll <= b ? roll : null;
  if (typeof resetProbabilizerRuntime === 'function') resetProbabilizerRuntime();
}

function divergerProductionValue(n = divergerN) {
  const basePower = divergerProductionBeforeDyson(n);
  if (!spaceExpansionActive) return hasKnuthUpgrade('dyson_diverger')
    ? multiplyNumberValue(basePower, knuthDysonDivergerMultiplier(basePower))
    : basePower;
  const multiplier = knuthBaseMultiplier('diverger_gain', 2);
  const totalMultiplier = hasKnuthUpgrade('dyson_diverger')
    ? multiplyNumberValue(multiplier, knuthDysonDivergerMultiplier(basePower)) : multiplier;
  return multiplyNumberValue(divergerProductionBeforeDyson(n, false), spaceExpansionMultiplier(totalMultiplier));
}

function divergerNumberValueFromSave(rawValue, fallback = 0) {
  const parsed = numberValueFromSave(rawValue, fallback);
  if (isPositiveNumberValue(parsed)) return parsed;

  const matched = String(rawValue ?? '').trim().match(/^(\d+(?:\.\d+)?)e(-\d+)$/i);
  if (!matched) return fallback;
  const mantissa = Number(matched[1]);
  const exponent = Number(matched[2]);
  return NumberMath.normalize(mantissa, exponent) ?? fallback;
}

function divergerSquareDimensionMultiplier() {
  if (!divergerAvailable() || !isPositiveNumberValue(divergerPower)) return 1;

  const powerLogarithm = divergerLog10(divergerPower);
  const exponent = NumberMath.divideApproximate(
    NumberMath.power(powerLogarithm, 2),
    3
  );
  return NumberMath.power(4, exponent);
}

function divergerProductionForGraph(n = divergerN, production = divergerProductionValue(n)) {
  const logarithm = NumberMath.compare(production, 1) < 0
    ? -NumberMath.toNumber(NumberMath.log10Abs(production))
    : NumberMath.toNumber(NumberMath.log10(production));
  return Number.isFinite(logarithm) ? logarithm : Math.sign(logarithm) * Number.MAX_VALUE;
}

function divergerCanAfford(cpCost) {
  return divergerAvailable()
    && compareNumberValues(squareConvergencePoints, cpCost) >= 0;
}

function scaleDivergerCpCost(cost, numerator, denominator = 1) {
  return divideNumberValue(
    multiplyNumberValue(cost, numerator),
    denominator
  );
}

function applyDivergerAUpgrade(paid = true) {
  divergerA = multiplyNumberValue(divergerA, 2);
  divergerACpCost = scaleDivergerCpCost(divergerACpCost, 3, 2);
  divergerALevel += 1;
  divergerUpgradeHistory.a.push(paid);
}

function applyDivergerBUpgrade(paid = true) {
  divergerBCpCost = scaleDivergerCpCost(divergerBCpCost, 5, 2);
  divergerBLevel += 1;
  divergerB = divergerBAtLevel(divergerBLevel);
  divergerUpgradeHistory.b.push(paid);
}

function divergerBUpgradeGain() {
  return knuthBaseUpgradeEffectLevel('diverger_b_strength') > 0 ? 0.4 : 0.2;
}

function divergerBAtLevel(level) {
  const base = 1 + Math.max(0, Math.floor(Number(level) || 0)) * divergerBUpgradeGain();
  const bonusLevel = knuthBaseUpgradeEffectLevel('diverger_b_bonus');
  if (bonusLevel === 0) return base;
  return realNumberFromValue(multiplyNumberValue(base,
    NumberMath.power(1.25, bonusLevel)));
}

function applyDivergerCUpgrade(paid = true) {
  divergerC = Math.min(DIVERGER_C_MAX, divergerC + 1);
  divergerCCpCost = multiplyNumberValue(divergerCCpCost, 2);
  divergerCLevel += 1;
  divergerUpgradeHistory.c.push(paid);
}

function divergerIntervalAtLevel(level) {
  const minimumInterval = divergerMinInterval();
  let interval = DIVERGER_BASE_INTERVAL;
  for (let index = 0; index < level; index++) {
    interval = Math.max(minimumInterval, interval - Math.log10(interval));
  }
  return interval;
}

function applyDivergerSpeedUpgrade(paid = false) {
  divergerSpeedIntervalHistory[divergerSpeedLevel] = divergerInterval;
  divergerInterval = divergerNextInterval();
  divergerSpeedCpCost = scaleDivergerCpCost(divergerSpeedCpCost, 3, 2);
  divergerSpeedLevel += 1;
  divergerUpgradeHistory.speed.push(paid);
}

function divergerNextInterval() {
  const reduction = hasAbstractionResearch('14-1')
    ? ABSTRACTION_SECOND_BRANCH_BALANCE.activeSpeedReduction : 1;
  return Math.max(divergerMinInterval(), divergerInterval - Math.log10(divergerInterval) * reduction);
}

function loadDivergerSpeedIntervalHistory(saved) {
  divergerSpeedIntervalHistory = Array.isArray(saved)
    ? saved.slice(0, divergerSpeedLevel).map(value =>
      typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= DIVERGER_BASE_INTERVAL
        ? value : null)
    : [];
}

function divergerSpeedLevelFromInterval(value) {
  const target = Number(value);
  const minimumInterval = divergerMinInterval();
  if (!Number.isFinite(target) || target >= DIVERGER_BASE_INTERVAL) return 0;

  let interval = DIVERGER_BASE_INTERVAL;
  for (let level = 1; level <= 100000; level++) {
    interval = Math.max(minimumInterval, interval - Math.log10(interval));
    const tolerance = 1e-9 * Math.max(1, Math.abs(target));
    if (Math.abs(interval - target) <= tolerance) return level;
    if (interval < target - tolerance) return 0;
  }
  return 0;
}

function buyDivergerAUpgrade(renderAfter = true) {
  if (!divergerCanAfford(divergerACpCost)) return false;
  squareConvergencePoints = subtractNumberValues(squareConvergencePoints, divergerACpCost);
  applyDivergerAUpgrade(true);
  if (renderAfter) render();
  return true;
}

function buyDivergerBUpgrade(renderAfter = true) {
  if (!divergerCanAfford(divergerBCpCost)) return false;
  squareConvergencePoints = subtractNumberValues(squareConvergencePoints, divergerBCpCost);
  applyDivergerBUpgrade(true);
  if (renderAfter) render();
  return true;
}

function buyDivergerCUpgrade(renderAfter = true) {
  if (divergerC >= DIVERGER_C_MAX || !divergerCanAfford(divergerCCpCost)) {
    return false;
  }
  squareConvergencePoints = subtractNumberValues(squareConvergencePoints, divergerCCpCost);
  applyDivergerCUpgrade(true);
  if (renderAfter) render();
  return true;
}

function buyDivergerSpeedUpgrade(renderAfter = true) {
  if (!divergerAvailable() || divergerInterval <= divergerMinInterval()) return false;
  if (!divergerCanAfford(divergerSpeedCpCost)) return false;
  squareConvergencePoints = subtractNumberValues(squareConvergencePoints, divergerSpeedCpCost);
  applyDivergerSpeedUpgrade(true);
  if (renderAfter) render();
  return true;
}

function divergerAutoUpgradeAvailable() {
  return hasAbstractionResearch('7-1') && divergerAvailable();
}

function toggleDivergerAutoUpgrade() {
  if (!divergerAutoUpgradeAvailable()) return false;
  divergerAutoUpgradeEnabled = !divergerAutoUpgradeEnabled;
  divergerAutoUpgradeTimer = 0;
  render();
  return true;
}

function advanceDivergerAutoUpgrade(elapsedMs) {
  if (!divergerAutoUpgradeAvailable() || !divergerAutoUpgradeEnabled || overflowed || squareMode || elapsedMs <= 0) {
    divergerAutoUpgradeTimer = 0;
    return false;
  }
  const maximumTime = DIVERGER_AUTO_UPGRADE_INTERVAL * DIVERGER_AUTO_UPGRADE_BATCH_LIMIT;
  const accelerated = autoUpgradeElapsedTime(gameTick(elapsedMs), maximumTime);
  divergerAutoUpgradeTimer = Math.min(maximumTime,
    divergerAutoUpgradeTimer + (Number.isFinite(accelerated) ? accelerated : maximumTime));
  const attempts = Math.min(
    hasGeneralizationResearch('3-4') ? DIVERGER_AUTO_UPGRADE_BATCH_LIMIT : 16,
    Math.floor(divergerAutoUpgradeTimer / DIVERGER_AUTO_UPGRADE_INTERVAL)
  );
  const choices = [buyDivergerAUpgrade, buyDivergerBUpgrade, buyDivergerCUpgrade, buyDivergerSpeedUpgrade];
  let changed = false;
  for (let index = 0; index < attempts; index++) {
    divergerAutoUpgradeTimer -= DIVERGER_AUTO_UPGRADE_INTERVAL;
    let bought = false;
    for (let offset = 0; offset < choices.length; offset++) {
      const choice = (divergerAutoUpgradeCursor + offset) % choices.length;
      if (!choices[choice](false)) continue;
      divergerAutoUpgradeCursor = (choice + 1) % choices.length;
      bought = true;
      changed = true;
      break;
    }
    if (!bought) {
      divergerAutoUpgradeTimer %= DIVERGER_AUTO_UPGRADE_INTERVAL;
      break;
    }
  }
  return changed;
}

const divergerCpCostModels = Object.fromEntries([
  ['a', 20, 3, 2], ['b', 32, 5, 2], ['c', 48, 2, 1], ['speed', 10000, 3, 2]
].map(([kind, base, numerator, denominator]) => [kind, {
  numerator, denominator, prefix: [base], cache: new Map()
}]));

function divergerCpCostAtLevel(kind, level) {
  const model = divergerCpCostModels[kind];
  level = Math.max(0, Math.floor(Number(level) || 0));
  if (model.cache.has(level)) return model.cache.get(level);
  // Preserve every integer-floor step before entering approximate arithmetic.
  while (model.prefix.length <= level && !NumberMath.isScientific(model.prefix[model.prefix.length - 1])) {
    model.prefix.push(scaleDivergerCpCost(model.prefix[model.prefix.length - 1], model.numerator, model.denominator));
  }
  const anchor = model.prefix.length - 1;
  const cost = level <= anchor ? model.prefix[level] : multiplyNumberValue(model.prefix[anchor],
    NumberMath.power(model.numerator / model.denominator, level - anchor));
  model.cache.set(level, cost);
  if (model.cache.size > 128) model.cache.delete(model.cache.keys().next().value);
  return cost;
}

function restoredDivergerCpCost(kind, level, rawCost) {
  const expected = divergerCpCostAtLevel(kind, level);
  const saved = numberValueFromSave(rawCost);
  if (!NumberMath.isScientific(expected) || !isPositiveNumberValue(saved)) return expected;
  const expectedLog = NumberMath.toNumber(NumberMath.log10(expected));
  const savedLog = NumberMath.toNumber(NumberMath.log10(saved));
  const tolerance = Math.max(1e-12, Math.abs(expectedLog) * Number.EPSILON * 8);
  // Keep the saved mantissa when only accumulated floating-point rounding differs.
  return Number.isFinite(savedLog) && Math.abs(savedLog - expectedLog) <= tolerance ? saved : expected;
}

function divergerACpCostAtLevel(level) { return divergerCpCostAtLevel('a', level); }
function divergerBCpCostAtLevel(level) { return divergerCpCostAtLevel('b', level); }
function divergerCCpCostAtLevel(level) { return divergerCpCostAtLevel('c', level); }
function divergerSpeedCpCostAtLevel(level) { return divergerCpCostAtLevel('speed', level); }

function divergerUpgradeRefunds(kind, level) {
  const history = divergerUpgradeHistory[kind];
  if (!history || level <= 0) return false;
  const entry = history.length >= level ? history.pop() : true;
  return entry !== false;
}

function removeDivergerUpgrade(id) {
  if (id === 'a') {
    if (divergerALevel <= 0) return false;
    const previousLevel = divergerALevel - 1;
    const refund = divergerUpgradeRefunds('a', divergerALevel);
    if (refund) {
      squareConvergencePoints = addBaseNumbers(squareConvergencePoints, divergerACpCostAtLevel(previousLevel));
    }
    divergerA = divideNumberValue(divergerA, 2);
    divergerACpCost = divergerACpCostAtLevel(previousLevel);
    divergerALevel = previousLevel;
    return true;
  }

  if (id === 'b') {
    if (divergerBLevel <= 0) return false;
    const previousLevel = divergerBLevel - 1;
    const refund = divergerUpgradeRefunds('b', divergerBLevel);
    if (refund) {
      squareConvergencePoints = addBaseNumbers(squareConvergencePoints, divergerBCpCostAtLevel(previousLevel));
    }
    divergerBLevel = previousLevel;
    divergerB = divergerBAtLevel(previousLevel);
    divergerBCpCost = divergerBCpCostAtLevel(previousLevel);
    return true;
  }

  if (id === 'c') {
    if (divergerCLevel <= 0) return false;
    const previousLevel = divergerCLevel - 1;
    const refund = divergerUpgradeRefunds('c', divergerCLevel);
    if (refund) {
      squareConvergencePoints = addBaseNumbers(squareConvergencePoints, divergerCCpCostAtLevel(previousLevel));
    }
    divergerC = previousLevel;
    divergerCCpCost = divergerCCpCostAtLevel(previousLevel);
    divergerCLevel = previousLevel;
    return true;
  }

  if (id === 'speed') {
    if (divergerSpeedLevel <= 0) {
      divergerSpeedLevel = divergerSpeedLevelFromInterval(divergerInterval);
    }
    if (divergerSpeedLevel <= 0) return false;
    const previousLevel = divergerSpeedLevel - 1;
    const refund = divergerUpgradeRefunds('speed', divergerSpeedLevel);
    if (refund) {
      squareConvergencePoints = addBaseNumbers(squareConvergencePoints, divergerSpeedCpCostAtLevel(previousLevel));
    }
    divergerSpeedLevel = previousLevel;
    divergerSpeedCpCost = divergerSpeedCpCostAtLevel(previousLevel);
    divergerInterval = Math.max(divergerMinInterval(),
      divergerSpeedIntervalHistory[previousLevel] ?? divergerIntervalAtLevel(divergerSpeedLevel));
    divergerSpeedIntervalHistory.length = Math.min(divergerSpeedIntervalHistory.length, previousLevel);
    return true;
  }

  return false;
}

function loadDivergerUpgradeHistory(savedHistory, levels = {}, legacyTheoryPaid = false) {
  const defaults = legacyTheoryPaid
    ? { a: 'legacy-theory', b: 'legacy-theory', c: 'legacy-theory', speed: false }
    : { a: true, b: true, c: true, speed: false };
  for (const key of Object.keys(divergerUpgradeHistory)) {
    const target = divergerUpgradeHistory[key];
    target.length = 0;
    const level = Math.max(0, Math.floor(Number(levels[key] ?? 0)));
    const saved = savedHistory?.[key];
    const normalize = value => value === 'legacy-theory' || (legacyTheoryPaid && value === true)
      ? 'legacy-theory' : value === true;
    if (Array.isArray(saved)) {
      let value, count = 0;
      for (let index = 0; index < Math.min(level, saved.length); index++) {
        const next = saved[index] === undefined ? defaults[key] : normalize(saved[index]);
        if (count > 0 && next !== value) {
          target.append(value, count);
          count = 0;
        }
        value = next;
        count++;
      }
      target.append(value, count);
    } else if (saved?.format === 'runs-v1' && Array.isArray(saved.runs)) {
      for (const run of saved.runs) {
        if (target.length >= level) break;
        if (!Number.isSafeInteger(run?.count) || run.count <= 0) continue;
        target.append(normalize(run.value), Math.min(run.count, level - target.length));
      }
    }
    target.append(defaults[key], level - target.length);
  }
}

function captureDivergerUpgradeHistory() {
  return Object.fromEntries(Object.entries(divergerUpgradeHistory).map(([key, history]) => [key, history.toJSON()]));
}

function advanceDiverger(elapsedMs) {
  if (!divergerAvailable() || overflowed || elapsedMs <= 0) return false;

  divergerTimer += gameTick(elapsedMs);
  const interval = divergerEffectiveInterval();
  const cycles = Math.floor(divergerTimer / interval);
  if (cycles <= 0) return false;
  divergerTimer = Math.max(0, divergerTimer - cycles * interval);
  return withDivergerProductionInputs(() => advanceDivergerCycles(cycles));
}

function advanceDivergerCycles(cycles) {
  const nStep = abstractionDivergerNSpeedMultiplier();
  const acceleratedN = compareNumberValues(nStep, 1) > 0;

  const sampleProduction = n => {
    const production = divergerProductionValue(n);
    const productionLogarithm = divergerProductionForGraph(n, production);
    if (Number.isFinite(productionLogarithm)) {
      divergerGraphSamples.push(productionLogarithm);
      divergerGraphScaleMinimum = divergerGraphScaleMinimum === null
        ? productionLogarithm
        : Math.min(divergerGraphScaleMinimum, productionLogarithm);
      divergerGraphScaleMaximum = divergerGraphScaleMaximum === null
        ? productionLogarithm
        : Math.max(divergerGraphScaleMaximum, productionLogarithm);
    }
    return production;
  };

  if (cycles <= 512) {
    for (let index = 0; index < cycles; index++) {
      divergerN = addBaseNumbers(divergerN, nStep);
      divergerPower = sampleProduction(divergerN);
    }
  } else {
    // Large accelerated spans use midpoint samples of the unchanged D(n)
    // formula instead of trying to execute an impractical number of cycles.
    const startingN = divergerN;
    const nIncrease = acceleratedN ? multiplyNumberValue(numberValueFromReal(cycles), nStep) : numberValueFromReal(cycles);
    const sampleCount = 32;
    for (let index = 0; index < sampleCount; index++) {
      const offset = acceleratedN ? multiplyNumberValue(nIncrease, (index + 0.5) / sampleCount)
        : numberValueFromReal(cycles * ((index + 0.5) / sampleCount));
      const sampleN = addBaseNumbers(startingN, offset);
      sampleProduction(sampleN);
    }
    divergerN = addBaseNumbers(startingN, nIncrease);
    divergerPower = sampleProduction(divergerN);
  }

  if (divergerGraphSamples.length > 120) {
    divergerGraphSamples.splice(0, divergerGraphSamples.length - 120);
  }
  return true;
}

// 퍼센트 병렬화: 2번째 레인은 20만, 이후 레인 해금 비용은 2배씩 증가
let percentLaneCount = 1;
let nextPercentLaneUnlockCost = 200000;
const extraPercentLanes = [];

const SQUARE_CONVERGENCE_UPGRADES = [
  {
    id: 'timium',
    title: 'timium',
    description: '게임 전체가 2048배 빠르게 흐릅니다.',
    cost: 1
  },
  {
    id: 'galaxium',
    title: 'galaxium',
    description: '클릭과 오토 클릭커로 얻는 숫자가 2048배가 됩니다.',
    cost: 1
  },
  {
    id: 'automatium',
    title: 'automatium',
    description: 'N 프로그램으로 게임을 자동화합니다. 구매 후 다시 눌러 편집기를 엽니다.',
    cost: 1
  },
  {
    id: 'cp_gain_5x',
    title: 'CP 획득량 5배',
    description: 'CP 획득량이 레벨마다 5배가 됩니다.',
    cost: 5,
    repeatable: true
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
    theoryCost: 1
  },
  {
    id: '2-1',
    column: 2,
    row: 1,
    title: '제곱 교환 효율',
    description: '제곱 포인트 교환 요구량이 long 최댓값에서 800경으로 줄어듭니다.',
    parents: ['1-1'],
    theoryCost: 2
  },
  {
    id: '2-2',
    column: 2,
    row: 2,
    title: '수렴 교환 효율',
    description: '수렴 포인트 1개 교환 요구량을 1qd로 줄입니다.',
    parents: ['1-1'],
    theoryCost: 2
  },
  {
    id: '2-3',
    column: 2,
    row: 3,
    title: '다이슨 스웜 허용치 확장',
    description: '다이슨 스웜의 최대 구매 가능 개수를 12개로 늘립니다.',
    parents: ['1-1'],
    theoryCost: 4
  },
  {
    id: '2-4',
    column: 2,
    row: 4,
    title: '병목 추적기 허용치 확장',
    description: '병목 추적기의 최대 구매 가능 개수를 16개로 늘립니다.',
    parents: ['1-1'],
    theoryCost: 2
  },
  {
    id: '3-1',
    column: 3,
    row: 1,
    title: '제곱 차원',
    description: '제곱 차원 화면과 제곱력 생산 효과를 해금합니다.',
    parents: ['2-1'],
    theoryCost: 3
  },
  {
    id: '3-2',
    column: 3,
    row: 2,
    title: '발산자',
    description: '생산 탭에 발산자를 해금합니다. 발산력은 제곱 차원을 강화합니다.',
    parents: ['2-2'],
    theoryCost: 6
  },
  {
    id: '3-3',
    column: 3,
    row: 3,
    title: '퍼센트 가격 감쇠',
    description: 'e500 이후 퍼센트 업그레이드의 기본 가격 상승을 1e1000배로 바꿉니다. 구매가 누적되면 최소 가격의 지수가 이차적으로 증가하며, 커누스 가격 할인은 유지됩니다.',
    parents: ['2-4'],
    theoryCost: 6
  },
  {
    id: '3-4',
    column: 3,
    row: 4,
    title: '자동 업그레이드 일괄 구매',
    description: '자동 업그레이드 속도가 1틱보다 빠르면 모든 자동 구매가 각 업그레이드를 한 번에 여러 번 구매합니다.',
    parents: ['2-4'],
    theoryCost: 2
  },
  {
    id: '4-1',
    column: 4,
    row: 1,
    title: '제곱 차원 성장 공식 개선',
    description: '제곱 차원의 변 성장 공식이 log10에서 log9로 바뀝니다.',
    parents: ['3-1'],
    theoryCost: 3
  },
  {
    id: '4-2',
    column: 4,
    row: 2,
    title: '제곱 차원 확장',
    description: '제곱 차원을 2개로 늘립니다. 두 번째 차원의 모든 업그레이드는 2배 비쌉니다.',
    parents: ['3-1'],
    theoryCost: 6
  },
  {
    id: '4-3',
    column: 4,
    row: 3,
    title: '발산자 하한 확장',
    description: '발산자의 최소 간격이 100ms가 됩니다.',
    parents: ['3-2'],
    theoryCost: 4
  },
  {
    id: '4-4',
    column: 4,
    row: 4,
    title: '수렴 시작 지원금',
    description: '새로운 수렴을 시작할 때 10b SP를 지급합니다.',
    parents: ['3-4'],
    theoryCost: 2
  },
  {
    id: '5-1',
    column: 5,
    row: 1,
    title: '차원 일반화',
    description: '제곱 차원에 z 변을 추가합니다. 제곱력이 숫자 생산에 기여하는 방식이 제곱에서 3제곱으로 바뀝니다.',
    parents: ['4-1', '4-2'],
    theoryCost: 8
  },
  {
    id: '5-2',
    column: 5,
    row: 2,
    title: '제곱 포인트 획득 공식 개선',
    description: '보유한 수에 따라 얻는 SP가 더 빠르게 늘어납니다. 최소 1 SP를 얻습니다.',
    parents: ['4-2'],
    theoryCost: 6
  },
  {
    id: '5-3',
    column: 5,
    row: 3,
    title: '발산자 공식 개선',
    description: '발산력 공식이 개선됩니다. a는 제곱해서 계산하고, c도 n의 지수를 높여줍니다.',
    parents: ['4-3', '4-2'],
    theoryCost: 6
  },
  {
    id: '5-4',
    column: 5,
    row: 4,
    title: '소프트캡 공식 개선',
    description: '퍼센트 파워에 따라 퍼센트 소프트캡이 더 빠르게 늘어납니다.',
    parents: ['4-4'],
    theoryCost: 8
  },
  {
    id: '6-1',
    column: 6,
    row: 1,
    title: '제곱력 기여 제곱화',
    description: '제곱력이 수 강화에 기여하는 배율을 한 번 더 제곱합니다.',
    parents: ['5-1'],
    theoryCost: 12
  },
  {
    id: '6-2',
    column: 6,
    row: 2,
    title: '제곱력 생산 강화',
    description: '제곱 차원의 세 변을 곱한 만큼 제곱력을 생산합니다.',
    parents: ['5-1'],
    theoryCost: 4
  },
  {
    id: '7-1',
    column: 7,
    row: 1,
    title: '제곱력 생산 공식 개선',
    description: '제곱 차원의 세 변을 곱한 값을 세제곱해서 제곱력을 생산합니다.',
    parents: ['6-2'],
    theoryCost: 4
  },
  {
    id: '7-2',
    column: 7,
    row: 2,
    title: '제곱 차원 자동 업그레이드',
    description: '제곱 차원의 변, 생산 시간, 생산력 강화 업그레이드를 자동 구매합니다.',
    parents: ['6-1'],
    theoryCost: 2
  },
  {
    id: '8-1',
    column: 8,
    row: 1,
    title: '커누스 해금',
    description: '커누스를 해금합니다. 처음에는 1 KP를 얻고, 이후에는 보유 CP에 따라 KP를 얻습니다. 커누스에 도달하면 현재 진행을 초기화합니다.',
    parents: ['7-1', '7-2', '5-3', '5-4'],
    theoryCost: 160
  }
];

const generalizationResearchState = {};
for (const research of GENERALIZATION_RESEARCHES) {
  generalizationResearchState[research.id] = false;
}

const ABSTRACTION_RESEARCHES = [
  {
    id: '1-1',
    column: 1,
    row: 1,
    title: 'SP 추상화',
    description: '현재 수에서 얻을 수 있는 SP의 1%를 매초 얻습니다. 시간 가속의 영향을 받습니다.',
    parents: [],
    greatTheoryCost: 1
  },
  {
    id: '2-1',
    column: 2,
    row: 1,
    title: '퍼센트 자동 사용 가속',
    description: '퍼센트 오토클리커의 속도가 자동 업그레이드 속도 배율만큼 증가합니다.',
    parents: ['1-1'],
    greatTheoryCost: 1
  },
  {
    id: '2-2',
    column: 2,
    row: 2,
    title: 'KP 자동 교환',
    description: 'N 언어의 kp 명령어를 해금합니다. 조건을 만족하면 자동으로 KP를 교환합니다.',
    parents: ['1-1'],
    greatTheoryCost: 1
  },
  {
    id: '3-1',
    column: 3,
    row: 1,
    title: 'automatium 영구 보존',
    description: '한 번 연구하면 automatium을 프레스티지해도 잃지 않습니다. 연구 초기화 후에도 유지됩니다.',
    parents: ['2-1'],
    greatTheoryCost: 1
  },
  {
    id: '4-1', column: 4, row: 1, branch: 'time', title: '시간의 거듭제곱',
    description: '시간 효과에 사용하는 T의 값을 항상 1.5제곱해서 계산합니다.',
    parents: ['3-1'], greatTheoryCost: 3
  },
  {
    id: '5-1', column: 5, row: 1, branch: 'time', title: '블랙홀 공명',
    description: '보유한 제곱력에 따라 제곱돌파 블랙홀의 시간 가속을 배율합니다.',
    parents: ['4-1'], greatTheoryCost: 5
  },
  {
    id: '6-1', column: 6, row: 1, branch: 'time', title: '시간 회수',
    description: '제곱에 머문 시간이 짧을수록 T를 더 빠르게 얻습니다. 시간이 지날수록 추가로 얻는 양이 줄어듭니다.',
    parents: ['5-1'], greatTheoryCost: 8
  },
  {
    id: '4-2', column: 4, row: 2, branch: 'expansion', title: '지수 확장',
    description: '보유한 KP에 따라 발산자의 b값을 배율합니다.',
    parents: ['3-1'], greatTheoryCost: 3
  },
  {
    id: '5-2', column: 5, row: 2, branch: 'expansion', title: '발산 수렴',
    description: '보유한 발산력에 따라 CP 획득량을 배율합니다.',
    parents: ['4-2'], greatTheoryCost: 5
  },
  {
    id: '6-2', column: 6, row: 2, branch: 'expansion', title: '차원 경계 확장',
    description: '보유한 제곱력에 따라 퍼센트 소프트캡을 늘립니다.',
    parents: ['5-2'], greatTheoryCost: 8
  },
  {
    id: '4-3', column: 4, row: 3, branch: 'percent', title: '퍼센트 공진',
    description: '보유한 발산력과 제곱력에 따라 퍼센트로 얻는 수를 배율합니다.',
    parents: ['3-1'], greatTheoryCost: 3
  },
  {
    id: '5-3', column: 5, row: 3, branch: 'percent', title: 'SP 경계 확장',
    description: '보유한 SP에 따라 퍼센트 소프트캡을 늘립니다. 늘어나는 폭은 점점 완만해집니다.',
    parents: ['4-3'], greatTheoryCost: 5
  },
  {
    id: '6-3', column: 6, row: 3, branch: 'percent', title: '화폐 압축',
    description: '보유한 SP, CP, KP, 이론, 대이론에 따라 퍼센트 파워의 구매 가격을 낮춥니다.',
    parents: ['5-3'], greatTheoryCost: 8
  },
  {
    id: '7-1', column: 7, row: 2, title: '발산자 자동 강화',
    description: '발산자의 a, b, c, 속도 강화를 자동 구매합니다. N의 buy diverger 명령도 해금합니다.',
    parents: ['6-1', '6-2', '6-3'], greatTheoryCost: 1
  },
  {
    id: '8-1', column: 8, row: 1, title: '커누스 포인트 공식 개선',
    description: 'KP 획득 공식이 개선됩니다. 첫 커누스 이후 CP에 따라 더 많은 KP를 얻습니다.',
    parents: ['7-1'], greatTheoryCost: 4
  },
  {
    id: '8-2', column: 8, row: 3, title: '퍼센트 획득 제곱 강화',
    description: '소프트캡 감쇠와 배율을 적용한 최종 퍼센트 숫자 획득량을 4제곱합니다.',
    parents: ['7-1'], greatTheoryCost: 5
  },
  {
    id: '9-1', column: 9, row: 1, title: '커누스 수렴 공명',
    description: '보유한 KP에 따라 CP 획득량을 배율합니다.',
    parents: ['8-1'], greatTheoryCost: 4
  },
  {
    id: '9-2', column: 9, row: 3, title: '숫자 퍼센트 공명',
    description: '보유한 수에 따라 퍼센트로 얻는 수를 배율합니다.',
    parents: ['8-2'], greatTheoryCost: 4
  },
  {
    id: '10-1', column: 10, row: 2, title: '생산 시간 가속',
    description: '발산자와 모든 제곱 차원의 생산 속도가 4배 빨라집니다.',
    parents: ['9-1', '9-2'], greatTheoryCost: 2
  },
  {
    id: '11-1', column: 11, row: 2, title: '커누스 기본 증폭 강화',
    description: '기본 커누스 1그룹의 구매당 효과를 1.25배 강화합니다. 기존 구매에도 적용됩니다.',
    parents: ['10-1'], greatTheoryCost: 4
  },
  {
    id: '12-1', column: 12, row: 1, branch: 'active', branchGroup: 2, title: '신속한 수렴',
    description: '이번 커누스에 머문 현실 시간이 짧을수록 SP와 CP를 더 많이 얻습니다. 시간이 지날수록 배율이 줄어듭니다.',
    parents: ['11-1'], greatTheoryCost: 5
  },
  {
    id: '13-1', column: 13, row: 1, branch: 'active', branchGroup: 2, title: '최단 기록 공명',
    description: '가장 짧게 끝낸 커누스의 현실 시간에 따라 KP 획득량을 배율합니다. 기록이 짧을수록 더 강해집니다.',
    parents: ['12-1'], greatTheoryCost: 6
  },
  {
    id: '14-1', column: 14, row: 1, branch: 'active', branchGroup: 2, title: '순간 발산',
    description: '발산자의 속도 강화를 더 강하게 만듭니다. 이번 커누스에 머문 현실 시간이 짧을수록 a, b, c값도 더 많이 배율합니다.',
    parents: ['13-1'], greatTheoryCost: 8
  },
  {
    id: '12-2', column: 12, row: 2, branch: 'passive', branchGroup: 2, title: '안정적인 수렴',
    description: '항상 SP를 200k배, CP를 50배 더 얻습니다.',
    parents: ['11-1'], greatTheoryCost: 5
  },
  {
    id: '13-2', column: 13, row: 2, branch: 'passive', branchGroup: 2, title: '안정적인 커누스',
    description: '항상 KP를 5.5배 더 얻습니다. 최종 지급량은 버림합니다.',
    parents: ['12-2'], greatTheoryCost: 6
  },
  {
    id: '14-2', column: 14, row: 2, branch: 'passive', branchGroup: 2, title: '안정적인 발산',
    description: '발산자가 50% 빨라지고 a, c의 효과값이 1.5배 됩니다. 분모는 최소 1입니다.',
    parents: ['13-2'], greatTheoryCost: 8
  },
  {
    id: '12-3', column: 12, row: 3, branch: 'idle', branchGroup: 2, title: '기다림의 수렴',
    description: '이번 커누스에 머문 현실 시간에 따라 SP와 CP를 배율합니다. 오래 머물수록 강해집니다.',
    parents: ['11-1'], greatTheoryCost: 5
  },
  {
    id: '13-3', column: 13, row: 3, branch: 'idle', branchGroup: 2, title: '최장 기록 공명',
    description: '가장 오래 머문 커누스의 현실 시간에 따라 KP 획득량을 배율합니다.',
    parents: ['12-3'], greatTheoryCost: 6
  },
  {
    id: '14-3', column: 14, row: 3, branch: 'idle', branchGroup: 2, title: '느리고 거대한 발산',
    description: '발산자 생산 속도가 1/10이 되는 대신 a, b, c의 효과값이 5배 됩니다. 분모는 최소 1입니다.',
    parents: ['13-3'], greatTheoryCost: 8
  },
  {
    id: '15-1', column: 15, row: 2, title: '제곱 블랙홀',
    description: '숫자 블랙홀에 SP를 투여합니다. 반지름에 4배 기여하고 특이점 요구량을 줄입니다.',
    parents: ['14-1', '14-2', '14-3'], greatTheoryCost: 900
  },
  {
    id: '16-1', column: 16, row: 0, title: '차원의 다이슨 공명',
    description: '보유한 제곱력에 따라 다이슨 스웜의 효과를 배율합니다.',
    parents: ['15-1'], greatTheoryCost: 10
  },
  {
    id: '16-2', column: 16, row: 4, title: '연산 슬롯 확장',
    description: '연산 강화를 구매한 횟수의 1.25배만큼 슬롯을 받습니다. 소수는 반올림합니다.',
    parents: ['15-1'], greatTheoryCost: 10
  },
  {
    id: '17-1', column: 17, row: -1, title: '특이점 수렴 가속',
    description: '보유한 특이점의 개수에 따라 CP 획득량을 배율합니다. 특이점을 소모하면 배율도 줄어듭니다.',
    parents: ['16-1'], greatTheoryCost: 100
  },
  {
    id: '17-2', column: 17, row: 1, title: '수렴 차수 개선',
    description: 'CP 획득 공식이 개선됩니다. 교환할 수 있는 SP가 많을수록 더 많은 CP를 얻습니다.',
    parents: ['16-1'], greatTheoryCost: 100
  },
  {
    id: '17-3', column: 17, row: 3, title: '다이슨 확장 배가',
    description: '다이슨 스웜 확장의 추가 한도를 구매당 2개로 늘립니다. 기존 구매에도 적용됩니다.',
    parents: ['16-2'], greatTheoryCost: 100
  },
  {
    id: '17-4', column: 17, row: 5, title: '발산 반복 가속',
    description: '발산자의 a값에 따라 n이 오르는 속도를 배율합니다. 증가폭은 점점 완만해집니다.',
    parents: ['16-2'], greatTheoryCost: 100
  },
  {
    id: '18-1', column: 18, row: -1.5, branch: 'singularity_discount', branchGroup: 3, title: '특이점 압축',
    description: '보유한 특이점의 개수에 따라 다음 특이점까지 필요한 반지름을 줄입니다. 특이점을 소모하면 할인도 줄어듭니다.',
    parents: ['17-1'], greatTheoryCost: 400
  },
  {
    id: '18-2', column: 18, row: -0.5, branch: 'singularity_resonance', branchGroup: 3, title: '반지름 공명',
    description: '슈바르츠실트 반지름 R에 따라 특이점의 기본 효과를 강화합니다. KP 획득 효과에는 적용되지 않습니다.',
    parents: ['17-1'], greatTheoryCost: 400
  },
  {
    id: '18-3', column: 18, row: 0.5, branch: 'cp_sp_link', branchGroup: 4, title: '수렴의 제곱 공명',
    description: 'CP 획득 배율에 따라 SP 획득량도 배율합니다. 기본 CP 획득 공식은 포함하지 않습니다.',
    parents: ['17-2'], greatTheoryCost: 400
  },
  {
    id: '18-4', column: 18, row: 1.5, branch: 'radius_cp', branchGroup: 4, title: '지평선 수렴',
    description: '슈바르츠실트 반지름 R에 따라 CP 획득량을 배율합니다.',
    parents: ['17-2'], greatTheoryCost: 400
  },
  {
    id: '18-5', column: 18, row: 2.5, branch: 'dyson_singularity', branchGroup: 5, title: '다이슨 특이점',
    description: '보유한 다이슨 스웜의 개수에 따라 특이점이 블랙홀의 시간 가속을 강화하는 효과를 높입니다.',
    parents: ['17-3'], greatTheoryCost: 400
  },
  {
    id: '18-6', column: 18, row: 3.5, branch: 'dyson_power', branchGroup: 5, title: '다이슨 차수 강화',
    description: '다이슨 스웜의 효과를 거듭제곱해서 더 강하게 만듭니다.',
    parents: ['17-3'], greatTheoryCost: 400
  },
  {
    id: '18-7', column: 18, row: 4.5, branch: 'b_to_a', branchGroup: 6, title: '발산 계수 공명',
    description: '발산자의 b값에 따라 a값을 강화합니다.',
    parents: ['17-4'], greatTheoryCost: 400
  },
  {
    id: '18-8', column: 18, row: 5.5, branch: 'n_singularity', branchGroup: 6, title: '반복의 사건 지평선',
    description: '발산자의 n값에 따라 특이점이 블랙홀의 시간 가속을 강화하는 효과를 높입니다.',
    parents: ['17-4'], greatTheoryCost: 400
  },
  {
    id: '19-1', column: 19, row: 0, branch: 'singularity_softcap', branchGroup: 7,
    branchLabel: '특수 분기 · 둘 중 하나 선택', title: '특이점 소프트캡 완화',
    description: '보유한 특이점의 개수에 따라 퍼센트 소프트캡을 늘립니다. 특이점이 많아질수록 늘어나는 폭은 점점 완만해집니다.',
    parents: ['18-1', '18-2', '18-3', '18-4'], greatTheoryCost: 500
  },
  {
    id: '19-2', column: 19, row: 3.5, branch: 'diverger_dyson', branchGroup: 7,
    branchLabel: '특수 분기 · 둘 중 하나 선택', title: '발산하는 다이슨 스웜',
    description: '보유한 발산력에 따라 다이슨 스웜을 추가로 얻습니다. 추가 개수는 다이슨 강화 전 발산력으로 계산하며, 구매 비용과 횟수는 바뀌지 않습니다.',
    parents: ['18-4', '18-5', '18-6', '18-7', '18-8'], greatTheoryCost: 500
  },
  {
    id: '20-1', column: 20, row: 1.75, title: '무작위 공명',
    description: '무작위력이 발산자의 a·b와 블랙홀 시간 가속 상한을 강화하는 효과를 증폭합니다.',
    parents: ['19-1', '19-2'], greatTheoryCost: 1200,
    randomPowerRequirement: ABSTRACTION_TIER20_BALANCE.requiredRandomPower
  },
  {
    id: '21-1', column: 21, row: 1.75, title: '확률 범위 확장',
    description: '확률자의 a·b 상한을 1e308로 늘립니다. 기존 값은 유지하며 이후 구매부터 1.1배씩 증가합니다.',
    parents: ['20-1'], greatTheoryCost: 2400
  },
  {
    id: '22-1', column: 22, row: 0, title: '첫 분기 완성',
    description: '첫 번째 분기에서 길을 하나 더 고를 수 있습니다. 기존 분기 확장과 함께 적용되며 최대 세 길까지 선택합니다.',
    parents: ['21-1'], greatTheoryCost: 1200
  },
  {
    id: '22-2', column: 22, row: 1.75, title: '기초 연산 이중화',
    description: '기본 커누스 업그레이드 1그룹의 효과를 구매 횟수의 두 배로 계산합니다. 실제 구매 횟수와 가격은 바뀌지 않습니다.',
    parents: ['21-1'], greatTheoryCost: 1200
  },
  {
    id: '22-3', column: 22, row: 3.5, title: '생산의 연속성',
    description: 'KP를 얻는 커누스 도달 시 제곱 차원과 발산자의 보유량·강화·진행 상태를 보존합니다. 도전 시작·포기·완료에는 적용하지 않습니다.',
    parents: ['21-1'], greatTheoryCost: 1200
  },
  {
    id: '23-1', column: 23, row: 0, title: '지속적인 수렴',
    description: '현실 시간 1초마다 현재 획득 가능한 CP의 1%를 계속 얻습니다. 시간 가속에 영향을 받지 않으며 수렴 초기화는 일어나지 않습니다.',
    parents: ['22-1'], greatTheoryCost: 1200
  },
  {
    id: '23-2', column: 23, row: 1.75, title: '무작위 커누스 증폭',
    description: '보유한 무작위력에 따라 KP 획득량을 배율합니다. 무작위력이 많아질수록 배율이 계속 증가합니다.',
    parents: ['22-2'], greatTheoryCost: 1200
  },
  {
    id: '23-3', column: 23, row: 3.5, title: '영구 제곱 비축',
    description: 'KP를 얻는 커누스 도달 시 보유 SP의 1%를 최고 기록으로 저장합니다. 연구 활성 중 이 기록은 소비되지 않는 최소 보유 SP가 됩니다. 연구를 잃어도 기록은 남으며 재연구하면 복구합니다. 공간 팽창 중에는 기록 갱신·최소 보유량 보호·복구가 중단되며 기존 기록은 보존됩니다.',
    parents: ['22-3'], greatTheoryCost: 1200
  },
  {
    id: '24-1', column: 24, row: 1.75, title: '무작위 퍼센트 증폭',
    description: '보유한 무작위력에 따라 퍼센트로 얻는 수를 증폭합니다. 무작위력을 소비하지 않으며 최종 퍼센트 획득량에 적용됩니다.',
    parents: ['23-1', '23-2', '23-3'], greatTheoryCost: 2500
  },
  {
    id: '25-1', column: 25, row: 0, branch: 'probabilizer', branchGroup: 8, branchLabel: '확률자',
    title: '무작위 수렴 증폭', description: '보유한 무작위력에 따라 CP 획득량을 증폭합니다. 확률자가 활성화되어 있을 때 적용됩니다.',
    parents: ['24-1'], greatTheoryCost: 400
  },
  {
    id: '26-1', column: 26, row: 0, branch: 'probabilizer', branchGroup: 8,
    title: '기울어진 확률', description: '무작위력이 많아질수록 확률 분포가 b 쪽으로 이동하고 실제 추첨에 쓰는 a와 b도 함께 강화됩니다. 구매 원본과 가격은 그대로 유지합니다.',
    parents: ['25-1'], greatTheoryCost: 1200
  },
  {
    id: '27-1', column: 27, row: 0, branch: 'probabilizer', branchGroup: 8,
    title: '확률의 시간', description: '무작위력 생산 시간이 숫자 블랙홀의 시간 가속 영향을 아주 조금 받습니다. 다른 시간 가속은 적용되지 않습니다.',
    parents: ['26-1'], greatTheoryCost: 2500
  },
  {
    id: '25-2', column: 25, row: 3.5, branch: 'black_hole', branchGroup: 8, branchLabel: '숫자 블랙홀',
    title: '사라지지 않는 투입', description: '숫자 블랙홀에 수와 SP를 투입해도 보유 자원을 소모하지 않습니다. 투입량과 투입 횟수는 그대로 누적됩니다.',
    parents: ['24-1'], greatTheoryCost: 400
  },
  {
    id: '26-2', column: 26, row: 3.5, branch: 'black_hole', branchGroup: 8,
    title: '영구 특이점', description: '슈바르츠실트 반지름에 따라 특이점을 구매할 때 더 많이 얻으며, 보유 특이점 일부를 영구 저장합니다. 연구 활성 중 저장량을 보호하고 재연구하면 복구합니다. 추가 획득은 보유 한도까지 적용됩니다. 공간 팽창 중에는 추가 획득을 포함한 모든 효과가 비활성화되며 기존 영구 기록은 보존됩니다.',
    parents: ['25-2'], greatTheoryCost: 1200
  },
  {
    id: '27-2', column: 27, row: 3.5, branch: 'black_hole', branchGroup: 8,
    title: '사건의 지평선 너머', description: `숫자 블랙홀의 최종 시간 가속 상한이 ${ABSTRACTION_PRODUCTION_BRANCH_BALANCE.blackHoleLimitMultiplier}배 늘어나고, 슈바르츠실트 반지름에 따라 CP 획득량을 배율합니다. 현재 가속 자체를 강제로 올리지는 않습니다.`,
    parents: ['26-2'], greatTheoryCost: 2500
  },
  {
    id: '28-1', column: 28, row: 1.75, title: '정체된 지평선 확장',
    description: '정체된 특이점의 개수에 따라 블랙홀 특이점 최대 보유량과 확률자가 블랙홀 시간 가속 상한을 추가로 늘리는 양을 증폭합니다. 특이점을 바로 지급하거나 현재 시간 가속을 강제로 올리지는 않습니다.',
    parents: ['27-1', '27-2'], greatTheoryCost: 50000
  },
  {
    id: '29-1', column: 29, row: 1.75, title: '가격 기준 분리',
    description: '기본 커누스 반복 업그레이드·KC6 이후 연산 강화·확률자 KP 업그레이드의 결제 가격과 상승 기준 가격을 분리합니다. 상승 기준은 기본 가격으로만 증가해 가격 급증이 다음 구간을 앞당기지 않습니다. 현재 가격에도 즉시 적용됩니다.',
    parents: ['28-1'], greatTheoryCost: 20000
  },
  {
    id: '30-1', column: 30, row: 1.75, title: '공간 팽창 심화',
    description: 'SM으로 구매하는 공간 팽창의 일회성 추가 업그레이드를 해금합니다. 구매 기록과 효과는 연구를 초기화해도 유지됩니다.',
    parents: ['29-1'], greatTheoryCost: 1000000
  }
];

for (const research of ABSTRACTION_RESEARCHES) {
  abstractionResearchState[research.id] = false;
}
const abstractionResearchDefinitions = new Map(ABSTRACTION_RESEARCHES.map(research => [research.id, research]));

const KNUTH_BASE_UPGRADES = [
  { id: 'cp_gain', group: 1, title: '수렴 증폭', description: 'CP 획득량이 구매마다 25배 증가합니다.', baseCost: 4, growth: 20 },
  { id: 'sp_gain', group: 1, title: '제곱 증폭', description: 'SP 획득량이 구매마다 10k배 증가합니다.', baseCost: 2, growth: 12 },
  { id: 'kp_gain', group: 1, title: '커누스 증폭', description: 'KP 획득량이 구매마다 5배 증가합니다.', baseCost: 500, growth: 25 },
  { id: 'diverger_gain', group: 1, title: '발산 증폭', description: '발산력이 구매마다 2배 증가합니다.', baseCost: 1500, growth: 50 },
  { id: 'dimension_gain', group: 1, title: '차원 증폭', description: '각 제곱 차원의 제곱력이 구매마다 4배 증가합니다.', baseCost: 10, growth: 10 },
  { id: 'dyson_limit', group: 2, title: '다이슨 스웜 확장', description: '다이슨 스웜의 구매 한도를 1개 늘립니다. 추가로 구매하는 다이슨 스웜의 가격은 더 빠르게 증가합니다.', baseCost: 50, growth: 100 },
  { id: 'number_black_hole', group: 2, title: '숫자 블랙홀', description: '숫자 블랙홀을 해금합니다.', baseCost: 20000 },
  { id: 'extra_branch', group: 2, title: '분기 확장', description: '추상화의 첫 번째 분기에서 두 가지 길을 선택할 수 있습니다.', baseCost: 5000000 },
  { id: 'diverger_b_strength', group: 2, title: '발산자 b 강화', description: 'b 강화의 증가량을 +0.2에서 +0.4로 늘립니다. 기존 구매분에도 적용됩니다.', baseCost: 10000000 },
  { id: 'starting_resources', group: 2, title: '커누스 출발 지원', description: '새 커누스 시작 시 수 100t, SP 10b, CP 1k를 지급합니다.', baseCost: 1000 },
  { id: 'overclock_limit', group: 3, title: '오버클럭 확장', description: '오버클럭의 구매 한도를 4개 늘립니다. 추가로 구매하는 오버클럭의 가격은 더 빠르게 증가합니다.', baseCost: 100, growth: 4 },
  { id: 'theory_exchange', group: 3, title: '대이론 교환', description: '이론으로 대이론을 구매합니다. 4이론부터 시작하며 구매마다 비용이 4배 증가합니다.', baseCost: 20000 },
  { id: 'late_abstraction', group: 4, title: '추상화 심화', description: '19행 이후의 추상화 연구를 해금합니다.', baseCost: '1e200' },
  { id: 'diverger_b_bonus', group: 4, title: '발산자 b 추가 강화', description: '구매마다 b가 1.25배 증가합니다. CP 강화 횟수와 가격은 바뀌지 않습니다.', baseCost: '1e200', growth: 1e100 },
  { id: 'starting_upgrades', group: 4, title: '커누스 완성 출발', description: '새 커누스 시작 시 모든 일반화 연구·제곱 업그레이드와 제곱 돌파 최대 강화를 지급합니다. 도전 제한은 우선 적용됩니다.', baseCost: '1e30' },
  { id: 'dyson_effect', group: 4, title: '다이슨 스웜 증폭', description: '다이슨 스웜의 최종 효과가 구매마다 1.25배 증가합니다.', baseCost: '1e350', growth: 1e50 },
  { id: 'probabilizer', group: 4, title: '확률자', description: '무작위력을 생산해 발산자의 a·b와 블랙홀 시간 가속 상한을 강화합니다.', baseCost: '1e308' },
  { id: 'passive_radius', group: 5, title: '지속하는 사건의 지평선', description: `블랙홀 활성 중 현실 초당 기본 반지름이 ${KNUTH_LATE_BASE_BALANCE.passiveRadiusPerRealSecond} 증가합니다. 특이점 획득 시 누적 성장도 초기화됩니다.`, baseCost: '1e500' },
  { id: 'singularity_limit', group: 5, title: '특이점 보유 확장', description: '특이점 최대 보유량이 기본 16개에서 구매마다 1개 증가합니다.', baseCost: '1e400', growth: 1e50 },
  { id: 'advanced_equipment', group: 5, title: '고급 장착 업그레이드', description: 'KP로 구매한 뒤 여러 개를 장착할 수 있는 고급 장착 업그레이드를 해금합니다.', baseCost: '1e400' },
  { id: 'singularity_growth', group: 5, title: '특이점 요구 완화', description: '보유 특이점당 요구 반지름 증가폭을 10배에서 구매마다 1씩 줄입니다. 최소 4배, 최대 6회 구매.', baseCost: '1e500', growth: 1e100, max: 6 },
  { id: 'space_expansion', group: 6, title: '공간 팽창', description: '공간 팽창을 해금합니다. 생산·교환 배율을 약화한 상태에서 CP를 모아 힉스입자 최고기록을 갱신합니다.', baseCost: '1e2600' },
  { id: 'stagnant_mass_gain', group: 6, title: '정체된 질량 증폭', description: '정체된 특이점이 블랙홀 반지름에 기여하는 배율을 구매마다 4배 강화합니다.', baseCost: '1e1200', growth: 1e200 }
];

function knuthBaseUpgradeLevel(id) {
  return knuthBaseUpgradeLevels[id] ?? 0;
}

function knuthBaseUpgradeEffectLevel(id) {
  return isKnuthChallengeActive('kc5') ? 0 : knuthBaseUpgradeLevel(id);
}

function knuthBaseUpgradeMax(upgrade) {
  return upgrade.max ?? (upgrade.growth ? Number.MAX_SAFE_INTEGER : 1);
}

function stagnantMassBlackHoleMultiplier() {
  return knuthBaseMultiplier('stagnant_mass_gain', 4);
}

function spaceExpansionUnlocked() {
  return knuthUnlocked && hasClaimedKnuthPoint && knuthBaseUpgradeLevel('space_expansion') > 0;
}

function hasSpaceExpansionOneTimeUpgrade(id) {
  return spaceExpansionOneTimeUpgradeState[id] === true;
}

function spaceExpansionExtraUpgradesUnlocked() {
  return spaceExpansionUnlocked() && hasAbstractionResearch('30-1');
}

function buySpaceExpansionOneTimeUpgrade(id) {
  const upgrade = SPACE_EXPANSION_ONE_TIME_UPGRADES.find(item => item.id === id);
  if (!upgrade || !spaceExpansionExtraUpgradesUnlocked() || gameSessionPaused() || hasSpaceExpansionOneTimeUpgrade(id)) return false;
  if (typeof tickSpaceExpansion === 'function') tickSpaceExpansion();
  if (compareNumberValues(stagnantMassMg, upgrade.costMg) < 0) return false;
  recordStagnantSingularities();
  stagnantMassMg = subtractNumberValues(stagnantMassMg, upgrade.costMg);
  spaceExpansionOneTimeUpgradeState[id] = true;
  if (id === 'definition_space' && !definitionStoryCompleted) definitionStoryStep = 1;
  render();
  return true;
}

function spaceExpansionPenaltyPower() {
  return hasSpaceExpansionOneTimeUpgrade('penalty_relief')
    ? SPACE_EXPANSION_EXTRA_BALANCE.multiplierPower : SPACE_EXPANSION_BALANCE.multiplierPower;
}

function stagnantSingularityRequirement(owned = stagnantSingularities) {
  const t = STAGNANT_SINGULARITY_BALANCE;
  // At counts beyond unit precision, use an upper estimate rather than display an already passed next milestone.
  if (isPositiveNumberValue(owned) && compareNumberValues(addBaseNumbers(owned, 1), owned) === 0) {
    owned = multiplyNumberValue(owned, 1 + 1e-12);
  }
  return NumberMath.powerOfTen(multiplyNumberValue(Math.log10(t.firstMassMg), NumberMath.power(t.requirementPower, owned)));
}

function stagnantSingularityCountForMass(mass) {
  const t = STAGNANT_SINGULARITY_BALANCE;
  if (compareNumberValues(mass, t.firstMassMg) < 0) return 0;
  const ratio = NumberMath.divideApproximate(NumberMath.log10(mass), Math.log10(t.firstMassMg));
  let count = addBaseNumbers(NumberMath.floor(NumberMath.divideApproximate(NumberMath.log10(ratio), Math.log10(t.requirementPower))), 1);
  // Check the actual boundary to correct logarithmic rounding without a per-milestone loop.
  if (compareNumberValues(mass, stagnantSingularityRequirement(subtractNumberValues(count, 1))) < 0) count = subtractNumberValues(count, 1);
  else if (compareNumberValues(mass, stagnantSingularityRequirement(count)) >= 0) count = addBaseNumbers(count, 1);
  return count;
}

function recordStagnantSingularities() {
  stagnantSingularities = NumberMath.max(stagnantSingularities, stagnantSingularityCountForMass(stagnantMassMg));
}

function stagnantSingularityEffectLog() {
  if (!isPositiveNumberValue(stagnantSingularities)) return 0;
  const t = STAGNANT_SINGULARITY_BALANCE;
  return multiplyNumberValue(Math.log10(t.firstMassMg), NumberMath.power(t.requirementPower, subtractNumberValues(stagnantSingularities, 1)));
}

function spaceExpansionMassCurve(referenceMg) {
  return NumberMath.power(NumberMath.divideApproximate(stagnantSingularityEffectLog(),
    Math.log10(1 + referenceMg)), SPACE_EXPANSION_EXTRA_BALANCE.massCurve);
}

function spaceExpansionMassPercentMultiplier() {
  if (!hasSpaceExpansionOneTimeUpgrade('mass_percent') || !isPositiveNumberValue(stagnantSingularities)) return 1;
  const t = SPACE_EXPANSION_EXTRA_BALANCE;
  return multiplyNumberValue(NumberMath.powerOfTen(multiplyNumberValue(t.percentLogStrength,
    spaceExpansionMassCurve(t.percentMassMg))), stagnantMassEffectMultiplier());
}

function percentFinalExtraMultiplier() {
  const random = abstractionRandomPowerPercentMultiplier();
  return hasSpaceExpansionOneTimeUpgrade('mass_percent')
    ? multiplyNumberValue(random, spaceExpansionMassPercentMultiplier()) : random;
}

function spaceExpansionHiggsSlotBonus() {
  if (!hasSpaceExpansionOneTimeUpgrade('higgs_slots') || !isPositiveNumberValue(higgsParticles)) return 0;
  const t = SPACE_EXPANSION_EXTRA_BALANCE;
  const scaled = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, higgsParticles)), t.slotHiggsLogScale);
  return NumberMath.toNumber(NumberMath.min(Number.MAX_SAFE_INTEGER,
    NumberMath.floor(multiplyNumberValue(t.slotStrength, NumberMath.power(scaled, t.slotCurve)))));
}

function spaceExpansionOverfeedMultiplier() {
  if (!hasSpaceExpansionOneTimeUpgrade('overfeed') || !hasAbstractionResearch('25-2')) return 1;
  const t = SPACE_EXPANSION_EXTRA_BALANCE;
  return multiplyNumberValue(addBaseNumbers(1, multiplyNumberValue(t.overfeedStrength,
    spaceExpansionMassCurve(t.overfeedMassMg))), stagnantMassEffectMultiplier());
}

function numberBlackHoleBaseDonationPercentLimit() {
  return Math.min(NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT,
    NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT + numberBlackHoleDonationAmountLevel);
}

function numberBlackHoleDonationPercentLimit() {
  return NumberMath.toNumber(NumberMath.min(Number.MAX_SAFE_INTEGER, NumberMath.floor(multiplyNumberValue(
    numberBlackHoleBaseDonationPercentLimit(), spaceExpansionOverfeedMultiplier()))));
}

function spaceExpansionGroupMultiplier() {
  if (!hasSpaceExpansionOneTimeUpgrade('group_boost')) return 1;
  const t = SPACE_EXPANSION_EXTRA_BALANCE;
  return multiplyNumberValue(addBaseNumbers(1, multiplyNumberValue(t.groupStrength,
    spaceExpansionMassCurve(t.groupMassMg))), stagnantMassEffectMultiplier());
}

function spaceExpansionNUnlocked() {
  return hasSpaceExpansionOneTimeUpgrade('n_automation');
}

function spaceExpansionHiggsAfterExit(reward = spaceExpansionHiggsReward()) {
  return NumberMath.max(higgsParticles, reward);
}

function spaceExpansionHiggsGainOnExit() {
  return spaceExpansionActive ? NumberMath.max(0, subtractNumberValues(spaceExpansionHiggsAfterExit(), higgsParticles)) : 0;
}

function spaceExpansionMultiplier(multiplier) {
  if (!spaceExpansionActive || compareNumberValues(multiplier, 10) <= 0) return multiplier;
  return NumberMath.powerOfTen(NumberMath.power(NumberMath.log10(multiplier), spaceExpansionPenaltyPower()));
}

function spaceExpansionFinalSpGain(gain) {
  if (!spaceExpansionActive || compareNumberValues(gain, 1) <= 0) return gain;
  const logarithm = NumberMath.log10(gain);
  return NumberMath.max(1, hasSpaceExpansionOneTimeUpgrade('penalty_relief')
    ? NumberMath.power(logarithm, SPACE_EXPANSION_EXTRA_BALANCE.spLogPower) : logarithm);
}

function spaceExpansionHiggsReward(cp = squareConvergencePoints) {
  const scaled = NumberMath.divideApproximate(NumberMath.log10(NumberMath.max(1, cp)),
    SPACE_EXPANSION_BALANCE.higgsCpLogScale);
  return NumberMath.floor(multiplyNumberValue(NumberMath.power(scaled, SPACE_EXPANSION_BALANCE.higgsPower),
    spaceExpansionUpgradeMultiplier('higgs_gain')));
}

function spaceExpansionUpgradeMultiplier(id) {
  const upgrade = SPACE_EXPANSION_UPGRADES.find(item => item.id === id);
  return upgrade ? NumberMath.power(upgrade.effect, spaceExpansionUpgradeLevels[id]) : 1;
}

function spaceExpansionUpgradeCost(id) {
  const upgrade = SPACE_EXPANSION_UPGRADES.find(item => item.id === id);
  return upgrade ? multiplyNumberValue(upgrade.baseCostMg, NumberMath.power(upgrade.growth, spaceExpansionUpgradeLevels[id])) : null;
}

function buySpaceExpansionUpgrade(id) {
  if (!spaceExpansionUnlocked() || gameSessionPaused() || !SPACE_EXPANSION_UPGRADES.some(item => item.id === id)) return false;
  if (typeof tickSpaceExpansion === 'function') tickSpaceExpansion();
  const cost = spaceExpansionUpgradeCost(id);
  if (compareNumberValues(stagnantMassMg, cost) < 0) return false;
  recordStagnantSingularities();
  stagnantMassMg = subtractNumberValues(stagnantMassMg, cost);
  spaceExpansionUpgradeLevels[id] = addBaseNumbers(spaceExpansionUpgradeLevels[id], 1);
  render();
  return true;
}

function stagnantMassGainPerRealSecond() {
  return multiplyNumberValue(higgsParticles, spaceExpansionUpgradeMultiplier('mass_gain'));
}

function stagnantMassEffectMultiplier() {
  return isPositiveNumberValue(stagnantSingularities) ? spaceExpansionUpgradeMultiplier('mass_effect') : 1;
}

function stagnantMassGrowth() {
  const tuning = SPACE_EXPANSION_BALANCE;
  return NumberMath.power(NumberMath.divideApproximate(stagnantSingularityEffectLog(),
    Math.log10(1 + tuning.massReferenceMg)), tuning.massCurve);
}

function abstractionMassExpansionGrowth() {
  if (!hasAbstractionResearch('28-1') || !isPositiveNumberValue(stagnantSingularities)) return 0;
  const tuning = ABSTRACTION_TIER28_BALANCE;
  return NumberMath.power(NumberMath.divideApproximate(stagnantSingularityEffectLog(),
    Math.log10(1 + tuning.massReferenceMg)), tuning.massCurve);
}

function abstractionMassSingularityLimitMultiplier() {
  if (!hasAbstractionResearch('28-1')) return 1;
  return multiplyNumberValue(addBaseNumbers(1, multiplyNumberValue(ABSTRACTION_TIER28_BALANCE.singularityLimitStrength,
    abstractionMassExpansionGrowth())), stagnantMassEffectMultiplier());
}

function abstractionMassTimeLimitMultiplier() {
  if (!hasAbstractionResearch('28-1')) return 1;
  return multiplyNumberValue(NumberMath.powerOfTen(multiplyNumberValue(ABSTRACTION_TIER28_BALANCE.timeLimitLogStrength,
    abstractionMassExpansionGrowth())), stagnantMassEffectMultiplier());
}

function stagnantMassRadiusMultiplier() {
  if (!isPositiveNumberValue(stagnantSingularities) || isKnuthChallengeActive('kc5')) return 1;
  return multiplyNumberValue(addBaseNumbers(1, multiplyNumberValue(SPACE_EXPANSION_BALANCE.radiusStrength,
    stagnantMassGrowth())), multiplyNumberValue(stagnantMassBlackHoleMultiplier(), stagnantMassEffectMultiplier()));
}

function stagnantMassRandomMultiplier() {
  return isPositiveNumberValue(stagnantSingularities)
    ? multiplyNumberValue(NumberMath.powerOfTen(multiplyNumberValue(SPACE_EXPANSION_BALANCE.randomLogStrength, stagnantMassGrowth())),
      stagnantMassEffectMultiplier()) : 1;
}

function advanceSpaceExpansion(elapsedRealMs) {
  if (!Number.isFinite(elapsedRealMs) || elapsedRealMs <= 0 || !isPositiveNumberValue(higgsParticles)) return false;
  stagnantMassMg = addBaseNumbers(stagnantMassMg, multiplyNumberValue(stagnantMassGainPerRealSecond(), elapsedRealMs / 1000));
  recordStagnantSingularities();
  return true;
}

function loadSpaceExpansionResources(saved) {
  higgsParticles = NumberMath.floor(numberValueFromSave(saved.higgsParticles));
  stagnantMassMg = numberValueFromSave(saved.stagnantMassMg);
  stagnantSingularities = NumberMath.floor(numberValueFromSave(saved.stagnantSingularities));
  recordStagnantSingularities();
  for (const upgrade of SPACE_EXPANSION_UPGRADES) {
    spaceExpansionUpgradeLevels[upgrade.id] = NumberMath.floor(NumberMath.max(0,
      numberValueFromSave(saved.spaceExpansionUpgradeLevels?.[upgrade.id])));
  }
  for (const upgrade of SPACE_EXPANSION_ONE_TIME_UPGRADES) {
    spaceExpansionOneTimeUpgradeState[upgrade.id] = saved.spaceExpansionOneTimeUpgradeState?.[upgrade.id] === true;
  }
}

function loadSpaceExpansionState(saved, { resourcesLoaded = false } = {}) {
  if (!resourcesLoaded) loadSpaceExpansionResources(saved);
  spaceExpansionActive = saved.spaceExpansionActive === true && spaceExpansionUnlocked() && !activeKnuthChallengeId;
  if (typeof resetSpaceExpansionClock === 'function') resetSpaceExpansionClock();
}

function toggleSpaceExpansion() {
  if (!spaceExpansionUnlocked() || activeKnuthChallengeId || pendingKnuthPointClaim) return false;
  if (typeof tickSpaceExpansion === 'function') tickSpaceExpansion();
  const exiting = spaceExpansionActive;
  const reward = exiting ? spaceExpansionHiggsReward() : 0;
  if (exiting) higgsParticles = spaceExpansionHiggsAfterExit(reward);
  if (canManuallyExchangeKnuthPoints()) beginKnuthPrestige({ spaceExpansionAfterPrestige: !exiting });
  else {
    spaceExpansionActive = !exiting;
    resetProgressForNewKnuthRun();
  }
  spaceExpansionActive = !exiting;
  if (exiting) restoreAbstractionPermanentSingularities();
  if (divergerAvailable()) divergerPower = divergerProductionValue();
  if (typeof setKnuthProductionView === 'function') setKnuthProductionView('space_expansion');
  render();
  return true;
}

function loadKnuthBaseUpgradeLevels(saved) {
  for (const upgrade of KNUTH_BASE_UPGRADES) {
    const value = Number(saved?.[upgrade.id] ?? 0);
    knuthBaseUpgradeLevels[upgrade.id] = Number.isSafeInteger(value) && value >= 0
      ? Math.min(knuthBaseUpgradeMax(upgrade), value)
      : 0;
  }
}

function knuthBaseEffectPerPurchase(id, base) {
  const isFirstGroup = KNUTH_BASE_UPGRADES.some(upgrade => upgrade.id === id && upgrade.group === 1);
  let effect = hasAbstractionResearch('11-1') && isFirstGroup ? base * 1.25 : base;
  if (isFirstGroup && hasSpaceExpansionOneTimeUpgrade('group_boost')) effect = multiplyNumberValue(effect, spaceExpansionGroupMultiplier());
  if (isFirstGroup && knuthAdvancedEquipped.group_effect > 0) {
    effect = multiplyNumberValue(effect, knuthAdvancedEffect('group_effect'));
    return hasAbstractionResearch('22-2') ? NumberMath.power(effect, 2) : effect;
  }
  return hasAbstractionResearch('22-2') && isFirstGroup
    ? typeof effect === 'number' ? effect * effect : NumberMath.power(effect, 2) : effect;
}

function knuthBaseMultiplier(id, base) {
  return NumberMath.power(knuthBaseEffectPerPurchase(id, base), knuthBaseUpgradeEffectLevel(id));
}

function knuthBaseGroupUnlocked(group) {
  if (group >= 4 && !hasCompletedKnuthChallenge('kc5')) return false;
  return KNUTH_BASE_UPGRADES.every(upgrade => upgrade.group >= group || knuthBaseUpgradeLevel(upgrade.id) > 0);
}

function feedbackKnuthHighPriceCost(currentCost, baseGrowth, purchases) {
  if (currentCost === null || purchases <= 0) return currentCost;
  const balance = KNUTH_REPEATABLE_COST_BALANCE;
  const baseLog = Math.log10(baseGrowth * 8);
  const scientific = NumberMath.isScientific(currentCost) ? currentCost : NumberMath.toScientific(currentCost);
  if (typeof scientific.exponent === 'number' && scientific.exponent < 1e18) {
    let exponent = Math.floor(scientific.exponent);
    let fraction = scientific.exponent - exponent + Math.log10(scientific.mantissa);
    while (purchases > 0 && exponent < 1e18) {
      const band = Math.floor((exponent - balance.kpBandStartExponent) / balance.kpBandWidth) + 1;
      const increment = baseLog * Math.pow(balance.kpBandGrowth, band);
      if (!Number.isFinite(increment)) break;
      const whole = Math.floor(increment);
      fraction += increment - whole;
      const carry = Math.floor(fraction);
      exponent += whole + carry;
      fraction -= carry;
      purchases--;
    }
    currentCost = NumberMath.normalize(Math.pow(10, fraction), exponent);
    if (purchases <= 0) return currentCost;
  }
  const logarithm = NumberMath.isScientific(currentCost.exponent)
    && NumberMath.isScientific(currentCost.exponent.exponent) ? currentCost.exponent : NumberMath.log10(currentCost);
  return upgradePriceFromExponent(feedbackBandedUpgradePriceExponent(logarithm, baseLog, purchases, balance));
}

function feedbackKnuthRepeatableCost(currentCost, baseGrowth, purchases) {
  if (currentCost === null || purchases <= 0) return currentCost;
  if (NumberMath.isScientific(currentCost.exponent) && NumberMath.isScientific(currentCost.exponent.exponent)) {
    return feedbackKnuthHighPriceCost(currentCost, baseGrowth, purchases);
  }
  let cost = currentCost;
  let remaining = purchases;
  for (const [limit, multiplier] of [['1e50', 1], ['1.8e308', 2], ['1e400', 8]]) {
    if (remaining <= 0) return cost;
    if (compareNumberValues(cost, limit) >= 0) continue;
    const growth = baseGrowth * multiplier;
    let untilBoundary = Math.max(1, Math.ceil((numberLog10(limit) - numberLog10(cost)) / Math.log10(growth)));
    const boundaryCost = multiplyNumberValue(cost, NumberMath.power(growth, untilBoundary));
    if (compareNumberValues(boundaryCost, limit) < 0) untilBoundary++;
    else if (untilBoundary > 1 && compareNumberValues(
      multiplyNumberValue(cost, NumberMath.power(growth, untilBoundary - 1)), limit
    ) >= 0) untilBoundary--;
    const count = Math.min(remaining, untilBoundary);
    cost = multiplyNumberValue(cost, NumberMath.power(growth, count));
    remaining -= count;
  }
  return remaining > 0 ? feedbackKnuthHighPriceCost(cost, baseGrowth, remaining) : cost;
}

function knuthRepeatableCostAfterPurchases(currentCost, baseGrowth, purchases, referenceCost = currentCost) {
  if (!independentUpgradePriceReferenceActive()) return feedbackKnuthRepeatableCost(currentCost, baseGrowth, purchases);
  if (currentCost === null || purchases <= 0) return currentCost;
  let cost = currentCost;
  let remaining = purchases;
  const referenceGrowth = Math.log10(baseGrowth);
  for (const [limit, multiplier] of [['1e50', 1], ['1.8e308', 2], ['1e400', 8]]) {
    if (remaining <= 0) return cost;
    if (compareNumberValues(referenceCost, limit) >= 0) continue;
    const growth = baseGrowth * multiplier;
    const count = upgradeReferenceBoundaryIndex(referenceCost, referenceGrowth, numberLog10(limit), remaining);
    cost = multiplyNumberValue(cost, NumberMath.power(growth, count));
    referenceCost = multiplyNumberValue(referenceCost, NumberMath.power(baseGrowth, count));
    remaining -= count;
  }
  if (remaining <= 0) return cost;
  const increment = referenceBandedGrowthExponent(referenceCost, referenceGrowth, Math.log10(baseGrowth * 8),
    remaining, KNUTH_REPEATABLE_COST_BALANCE);
  return increment === null ? null : multiplyNumberValue(cost, NumberMath.powerOfTen(increment));
}

const knuthBaseUpgradeCostCache = new Map();
function knuthBaseUpgradeCost(upgrade) {
  if (!upgrade.growth) return multiplyNumberValue(upgrade.baseCost, 1);
  const level = knuthBaseUpgradeLevel(upgrade.id);
  const cached = knuthBaseUpgradeCostCache.get(upgrade.id);
  const rule = `${JSON.stringify(KNUTH_REPEATABLE_COST_BALANCE)}:${independentUpgradePriceReferenceActive()}`;
  const reusable = cached && cached.baseCost === upgrade.baseCost && cached.growth === upgrade.growth
    && cached.rule === rule && cached.level === level;
  if (reusable) return cached.cost;
  const cost = knuthRepeatableCostAfterPurchases(upgrade.baseCost, upgrade.growth, level);
  knuthBaseUpgradeCostCache.set(upgrade.id, { level, cost, baseCost: upgrade.baseCost, growth: upgrade.growth, rule });
  return cost;
}

function knuthBaseUpgradeReferenceCost(upgrade) {
  if (!independentUpgradePriceReferenceActive()) return knuthBaseUpgradeCost(upgrade);
  return multiplyNumberValue(upgrade.baseCost, upgrade.growth ? NumberMath.power(upgrade.growth, knuthBaseUpgradeLevel(upgrade.id)) : 1);
}

function canBuyKnuthBaseUpgrade(id) {
  const upgrade = KNUTH_BASE_UPGRADES.find(item => item.id === id);
  if (!upgrade || !knuthUnlocked || !hasClaimedKnuthPoint || isKnuthChallengeActive('kc5') || !knuthBaseGroupUnlocked(upgrade.group)) return false;
  const level = knuthBaseUpgradeLevel(id);
  return level < knuthBaseUpgradeMax(upgrade)
    && compareUpgradeCost(knuthPoints, knuthBaseUpgradeCost(upgrade)) >= 0;
}

function buyKnuthBaseUpgrade(id, { renderAfter = true } = {}) {
  if (!canBuyKnuthBaseUpgrade(id)) return false;
  const upgrade = KNUTH_BASE_UPGRADES.find(item => item.id === id);
  const cost = knuthBaseUpgradeCost(upgrade);
  knuthPoints = compareUpgradeCost(knuthPoints, cost) === 0 ? 0 : subtractNumberValues(knuthPoints, cost);
  knuthBaseUpgradeLevels[id] = knuthBaseUpgradeLevel(id) + 1;
  if (id === 'number_black_hole') {
    numberBlackHoleSystemEnabled = true;
    if (typeof resetNumberBlackHoleTimers === 'function') resetNumberBlackHoleTimers();
  }
  if (id === 'diverger_b_strength' || id === 'diverger_b_bonus') divergerB = divergerBAtLevel(divergerBLevel);
  if (['diverger_gain', 'diverger_b_strength', 'diverger_b_bonus'].includes(id) && divergerAvailable()) {
    divergerPower = divergerProductionValue();
  }
  if (renderAfter) render();
  return true;
}

function knuthBaseAutomationUnlocked() {
  return hasCompletedKnuthChallenge('kc5');
}

function knuthBaseAutomationAvailable() {
  return knuthBaseAutomationUnlocked() && knuthUnlocked && hasClaimedKnuthPoint && !isKnuthChallengeActive('kc5');
}

function loadKnuthBaseAutomation(saved) {
  for (const id of ['operation', ...KNUTH_BASE_UPGRADES.map(upgrade => upgrade.id)]) {
    knuthBaseAutoEnabled[id] = saved?.[id] === true;
  }
  knuthBaseAutoTimerMs = 0;
  knuthBaseAutoCursor = 0;
}

function toggleKnuthBaseAutomation(id) {
  if (!knuthBaseAutomationAvailable() || (id !== 'operation' && !KNUTH_BASE_UPGRADES.some(upgrade => upgrade.id === id))) return false;
  knuthBaseAutoEnabled[id] = !knuthBaseAutoEnabled[id];
  knuthBaseAutoTimerMs = 0;
  render();
  return true;
}

function advanceKnuthBaseAutomation(elapsedRealMs) {
  if (!knuthBaseAutomationAvailable() || overflowed || squareMode || !(elapsedRealMs > 0)) {
    knuthBaseAutoTimerMs = 0;
    return false;
  }
  const choices = ['operation', ...KNUTH_BASE_UPGRADES.map(upgrade => upgrade.id)]
    .filter(id => knuthBaseAutoEnabled[id]);
  if (!choices.length) { knuthBaseAutoTimerMs = 0; return false; }
  const maximum = KNUTH_BASE_AUTO_INTERVAL_MS * KNUTH_BASE_AUTO_BATCH_LIMIT;
  const elapsed = autoUpgradeElapsedTime(gameTick(elapsedRealMs), maximum);
  knuthBaseAutoTimerMs = Math.min(maximum, knuthBaseAutoTimerMs + (Number.isFinite(elapsed) ? elapsed : maximum));
  const attempts = Math.min(hasGeneralizationResearch('3-4') ? KNUTH_BASE_AUTO_BATCH_LIMIT : 1,
    Math.floor(knuthBaseAutoTimerMs / KNUTH_BASE_AUTO_INTERVAL_MS));
  const deadline = gameClockNowMs() + KNUTH_BASE_AUTO_BUDGET_MS;
  let changed = false;
  for (let index = 0; index < attempts && gameClockNowMs() < deadline; index++) {
    knuthBaseAutoTimerMs -= KNUTH_BASE_AUTO_INTERVAL_MS;
    let bought = false;
    for (let offset = 0; offset < choices.length; offset++) {
      const choice = (knuthBaseAutoCursor + offset) % choices.length;
      const id = choices[choice];
      const success = id === 'operation' ? buyKnuthOperationUpgrade({ renderAfter: false })
        : buyKnuthBaseUpgrade(id, { renderAfter: false });
      if (!success) continue;
      knuthBaseAutoCursor = (choice + 1) % choices.length;
      bought = true;
      changed = true;
      break;
    }
    if (!bought) { knuthBaseAutoTimerMs %= KNUTH_BASE_AUTO_INTERVAL_MS; break; }
  }
  return changed;
}

const KNUTH_SLOT_UPGRADES = [
  {
    id: 'diverger_percent_price_delay',
    slots: 1,
    title: '발산자의 가격 지연',
    description: '발산력이 1e10, 1.5e10, 2.25e10…에 도달할 때마다 퍼센트 파워 가격 급증 시작 레벨을 1e10씩 늦춥니다.'
  },
  {
    id: 'permanent_production',
    slots: 1,
    title: '상시 생산 해금',
    description: '제곱 차원과 발산자를 항상 해금합니다.'
  },
  {
    id: 'knuth_time_gain',
    slots: 1,
    title: '시간의 가치',
    description: '제곱에 머문 시간 T에 따라 SP와 CP 획득량을 배율합니다. 시간 가속의 영향을 받습니다.'
  },
  {
    id: 'percent_purchase_bonus',
    slots: 1,
    title: '연속 강화',
    description: '각 레인에서 퍼센트 파워를 구매한 횟수에 따라 추가 파워를 얻습니다. 기본 파워가 상한에 도달해도 적용됩니다.'
  },
  {
    id: 'percent_cap_200',
    slots: 1,
    title: '퍼센트 한계 확장',
    description: '퍼센트 효과 상한이 +100%에서 +200%로 증가합니다.'
  },
  {
    id: 'percent_count_discount',
    slots: 1,
    title: '반복 구매 할인',
    description: '각 레인에서 퍼센트 파워를 구매한 횟수에 따라 구매 가격과 가격 상승을 줄입니다. 구매 횟수가 늘어날수록 할인은 점점 완만해집니다.'
  },
  {
    id: 'percent_overflow',
    slots: 2,
    title: '퍼센트 오버플로우',
    description: '상한을 넘어 얻은 퍼센트 파워가 사라지지 않고 오버플로우로 쌓입니다. 쌓인 양에 따라 SP와 CP 획득량을 배율합니다.'
  },
  {
    id: 'percent_time_discount',
    slots: 2,
    title: '시간의 할인',
    description: '현재 제곱 진행의 가속 게임 시간에 따라 퍼센트 파워의 로그 가격과 가격 상승을 줄입니다. 약 300초에서 최대 효과의 95%에 도달합니다.'
  },
  {
    id: 'percent_gain_square', slots: 16, title: '퍼센트 제곱',
    description: '퍼센트로 얻는 최종 수를 한 번 더 2제곱합니다. 추상화 8-2와 함께 장착하면 8제곱이 됩니다.'
  },
  {
    id: 'dyson_diverger', slots: 2, title: '항성 발산',
    description: '보유한 다이슨 스웜의 개수에 따라 발산력을 배율합니다. KC1에서는 적용되지 않습니다.'
  },
  {
    id: 'percent_softcap_square', slots: 2, title: '소프트캡 제곱',
    description: '모든 확장이 적용된 퍼센트 소프트캡을 2제곱합니다.'
  },
  {
    id: 'accumulated_time_sp', slots: 2, title: '시간의 유산',
    description: '숫자 블랙홀의 누적 가속 시간에 따라 SP 획득량을 배율합니다.'
  },
  {
    id: 'group_percent_growth', slots: 3, title: '연산의 축적',
    description: '기본 커누스 1그룹의 총 구매 횟수에 따라 퍼센트로 얻는 수와 소프트캡을 배율합니다.'
  },
  {
    id: 'research_resource_growth', slots: 3, title: '추상화의 결실',
    description: '구매한 추상화 연구의 개수에 따라 SP와 CP 획득량을 배율합니다. 비활성화된 연구도 포함합니다.'
  },
  {
    id: 'diverger_black_hole', slots: 3, title: '발산하는 사건의 지평선',
    description: '보유한 발산력에 따라 숫자 블랙홀의 시간 가속을 배율합니다. 투여 속도와 반지름은 바뀌지 않습니다.'
  },
  {
    id: 'achievement_percent_growth', slots: 3, title: '업적의 무게',
    description: '달성한 업적의 개수에 따라 퍼센트로 얻는 수와 소프트캡을 배율합니다.'
  },
  {
    id: 'second_branch_expansion', slots: 64, title: '선택의 확장',
    description: '추상화 두 번째 분기에서 두 길을 선택할 수 있습니다. 해제하면 먼저 구매한 길만 활성화되고, 재장착하면 두 번째 길도 복구됩니다.'
  }
];

const KNUTH_CHALLENGES = [
  {
    id: 'kc1',
    title: 'KC1',
    restriction: '다이슨 스웜 효과와 구매가 비활성화됩니다. 진입 당시 다이슨 스웜 최대치의 4배만큼 오버클럭, 2배만큼 병목 추적기를 추가 구매할 수 있습니다.',
    goalResource: 'sp',
    goal: 500000,
    reward: '커누스 장착 업그레이드를 자유롭게 해제할 수 있습니다.'
  },
  {
    id: 'kc2',
    title: 'KC2',
    restriction: '제곱 차원과 발산자가 비활성화됩니다.',
    goalResource: 'cp',
    goal: 1000,
    reward: '수렴에 도달해도 제곱 차원이 초기화되지 않습니다.'
  },
  {
    id: 'kc3',
    title: 'KC3',
    restriction: '일반화 연구를 할 수 없습니다.',
    goalResource: 'cp',
    goal: 1000000000,
    reward: '이론 획득량이 2배가 됩니다.'
  },
  {
    id: 'kc4',
    title: 'KC4',
    restriction: '실행 중인 현실 시간이 지날수록 게임 시간이 지수함수적으로 느려집니다. 수렴 시 감속 시간이 초기화됩니다.',
    goalResource: 'cp',
    goal: '1e20',
    reward: '숫자 블랙홀 자동 강화와 투여 설정 자동 최대화 및 N 명령을 해금합니다.'
  },
  {
    id: 'kc5',
    title: 'KC5',
    restriction: '기본 커누스 업그레이드의 효과와 구매 및 숫자 블랙홀이 비활성화됩니다. 장착 슬롯은 1/3로 줄어들며 소수점은 반올림합니다.',
    goalResource: 'cp',
    goal: '1e170',
    reward: '기본 커누스 업그레이드 자동구매 및 N 구매·조회를 해금하고, 4·5·6그룹을 해금합니다.'
  },
  {
    id: 'kc6',
    title: 'KC6',
    restriction: '퍼센트로 얻는 최종 수가 1e-10제곱됩니다. SP·CP 획득량을 배율하는 효과는 1배가 됩니다.',
    goalResource: 'cp',
    goal: '1e1000',
    reward: '연산 강화의 300회 제한을 해제합니다. 301번째부터 기본 가격이 1e10배씩 증가하며, 1e200·1e300·1e400… KP 구간마다 가격 상승 배율을 제곱합니다. 29-1 연구 시 상승 기준 가격을 따로 계산합니다.'
  }
];

function syncKc4RealTime() {
  const now = gameTimelineNowMs();
  if (isKnuthChallengeActive('kc4') && kc4LastRealClockAt !== null) {
    kc4ElapsedRealSeconds += Math.max(0, now - kc4LastRealClockAt) / 1000;
  }
  kc4LastRealClockAt = now;
  return kc4ElapsedRealSeconds;
}

function resetKc4Time() {
  kc4ElapsedRealSeconds = 0;
  kc4LastRealClockAt = gameTimelineNowMs();
}

function kc4TimeMultiplier() {
  if (!isKnuthChallengeActive('kc4')) return 1;
  const seconds = syncKc4RealTime();
  return Math.max(Number.MIN_VALUE, 2 ** (-seconds / KC4_TIME_BALANCE.halfLifeSeconds));
}

function knuthChallenge(id) {
  return KNUTH_CHALLENGES.find(challenge => challenge.id === id) ?? null;
}

function hasCompletedKnuthChallenge(id) {
  return completedKnuthChallengeIds.has(id);
}

function isKnuthChallengeActive(id) {
  return activeKnuthChallengeId === id;
}

function knuthSlotCapacity(level = knuthOperationLevel) {
  // Split into quotient/remainder to preserve .5 rounding near the safe-integer boundary.
  const purchasedCapacity = hasAbstractionResearch('16-2')
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(level / 4) * 5 + Math.round((level % 4) * 1.25)) : level;
  const capacity = Math.min(Number.MAX_SAFE_INTEGER, purchasedCapacity + spaceExpansionHiggsSlotBonus());
  return isKnuthChallengeActive('kc5') ? Math.round(capacity / 3) : capacity;
}

function knuthSlotsUsed() {
  return KNUTH_SLOT_UPGRADES.reduce(
    (total, upgrade) => total + (knuthEquippedUpgradeIds.has(upgrade.id) ? upgrade.slots : 0),
    0
  ) + KNUTH_ADVANCED_UPGRADES.reduce((total, upgrade) => total + knuthAdvancedEquipped[upgrade.id] * upgrade.slots, 0);
}

function knuthAdvancedUnlocked() {
  return knuthUnlocked && hasClaimedKnuthPoint && knuthBaseUpgradeLevel('advanced_equipment') > 0;
}

function knuthAdvancedEffect(id) {
  const upgrade = KNUTH_ADVANCED_UPGRADES.find(item => item.id === id);
  if (!upgrade || knuthAdvancedEquipped[id] <= 0 || !knuthAdvancedUnlocked()) return 1;
  const count = knuthAdvancedEquipped[id];
  if (!upgrade.diminishingPower || count <= KNUTH_ADVANCED_POWER_DECAY.fullCopies) {
    return NumberMath.power(upgrade.effect, count);
  }
  const tuning = KNUTH_ADVANCED_POWER_DECAY;
  let bonus = upgrade.effect - 1;
  let tailLog = 0;
  // The tail decays doubly exponentially; stop below floating-point relevance, independent of count.
  for (let i = 0; i < Math.min(count - tuning.fullCopies, 64); i++) {
    bonus = Math.pow(bonus, tuning.bonusPower);
    if (bonus < Number.EPSILON / 16) break;
    tailLog += Math.log1p(bonus);
  }
  return multiplyNumberValue(NumberMath.power(upgrade.effect, tuning.fullCopies), Math.exp(tailLog));
}

function knuthAdvancedEffectPerCopy(upgrade, copyIndex = 1) {
  const tuning = KNUTH_ADVANCED_POWER_DECAY;
  return upgrade.diminishingPower && copyIndex > tuning.fullCopies
    ? 1 + Math.pow(upgrade.effect - 1, Math.pow(tuning.bonusPower, copyIndex - tuning.fullCopies))
    : upgrade.effect;
}

function applyKnuthAdvancedPower(id, value) {
  return knuthAdvancedUnlocked() && knuthAdvancedEquipped[id] > 0 ? NumberMath.power(value, knuthAdvancedEffect(id)) : value;
}

function knuthAdvancedPercentPower() {
  // Bulk integration requires a finite native exponent even with Higgs bonus slots.
  if (!knuthAdvancedUnlocked() || knuthAdvancedEquipped.percent_power === 0) return 1;
  return percentBatchInvariant('advanced-percent-power', () =>
    Math.min(Number.MAX_VALUE / 16, Math.pow(1.05, knuthAdvancedEquipped.percent_power)));
}

function knuthAdvancedUpgradeCost(id) {
  const upgrade = KNUTH_ADVANCED_UPGRADES.find(item => item.id === id);
  return upgrade ? NumberMath.powerOfTen(addBaseNumbers(upgrade.startExponent,
    multiplyNumberValue(knuthAdvancedOwned[id], upgrade.growthExponent))) : null;
}

function canBuyKnuthAdvancedUpgrade(id) {
  return knuthAdvancedUnlocked() && KNUTH_ADVANCED_UPGRADES.some(upgrade => upgrade.id === id)
    && knuthAdvancedOwned[id] < Number.MAX_SAFE_INTEGER
    && compareUpgradeCost(knuthPoints, knuthAdvancedUpgradeCost(id)) >= 0;
}

function buyKnuthAdvancedUpgrade(id) {
  if (!canBuyKnuthAdvancedUpgrade(id)) return false;
  knuthPoints = NumberMath.floor(NumberMath.divideApproximate(knuthPoints, knuthAdvancedUpgradeCost(id)));
  knuthAdvancedOwned[id]++;
  render();
  return true;
}

function normalizedKnuthEquipmentOrder(source = knuthEquipmentOrder) {
  const remaining = new Map(KNUTH_SLOT_UPGRADES.filter(upgrade => knuthEquippedUpgradeIds.has(upgrade.id))
    .map(upgrade => [`normal:${upgrade.id}`, 1]));
  for (const upgrade of KNUTH_ADVANCED_UPGRADES) remaining.set(`advanced:${upgrade.id}`, knuthAdvancedEquipped[upgrade.id]);
  const result = [];
  for (const entry of Array.isArray(source) ? source : []) {
    if (!entry || !['normal', 'advanced'].includes(entry.kind) || typeof entry.id !== 'string'
      || !Number.isSafeInteger(entry.count) || entry.count <= 0) continue;
    const key = `${entry.kind}:${entry.id}`, available = remaining.get(key) ?? 0;
    const count = Math.min(entry.count, available);
    if (count <= 0) continue;
    result.push({ kind: entry.kind, id: entry.id, count });
    remaining.set(key, available - count);
  }
  for (const id of knuthEquippedUpgradeIds) {
    if (remaining.get(`normal:${id}`)) result.push({ kind: 'normal', id, count: 1 });
  }
  for (const upgrade of KNUTH_ADVANCED_UPGRADES) {
    const count = remaining.get(`advanced:${upgrade.id}`);
    if (count > 0) result.push({ kind: 'advanced', id: upgrade.id, count });
  }
  return result;
}

function appendKnuthEquipmentOrder(kind, id, count = 1) {
  const last = knuthEquipmentOrder[knuthEquipmentOrder.length - 1];
  if (last?.kind === kind && last.id === id) last.count += count;
  else knuthEquipmentOrder.push({ kind, id, count });
}

function removeKnuthEquipmentOrder(kind, id, count = Infinity) {
  for (let index = knuthEquipmentOrder.length - 1; index >= 0 && count > 0; index--) {
    const entry = knuthEquipmentOrder[index];
    if (entry.kind !== kind || entry.id !== id) continue;
    const removed = Math.min(count, entry.count);
    entry.count -= removed;
    count -= removed;
    if (entry.count === 0) knuthEquipmentOrder.splice(index, 1);
  }
}

function refreshKnuthAdvancedDerivedState(id) {
  if (id === 'group_effect' && divergerAvailable()) divergerPower = divergerProductionValue();
}

function changeKnuthAdvancedEquipment(id, equip, all = false) {
  const upgrade = KNUTH_ADVANCED_UPGRADES.find(item => item.id === id);
  if (!upgrade || (equip && !knuthAdvancedUnlocked())) return false;
  const available = equip ? Math.min(knuthAdvancedOwned[id] - knuthAdvancedEquipped[id],
    Math.max(0, Math.floor((knuthSlotCapacity() - knuthSlotsUsed()) / upgrade.slots))) : knuthAdvancedEquipped[id];
  const count = all ? available : Math.min(1, available);
  if (count <= 0) return false;
  knuthEquipmentOrder = normalizedKnuthEquipmentOrder();
  knuthAdvancedEquipped[id] += equip ? count : -count;
  if (equip) appendKnuthEquipmentOrder('advanced', id, count);
  else removeKnuthEquipmentOrder('advanced', id, count);
  refreshKnuthAdvancedDerivedState(id);
  render();
  return true;
}

function loadKnuthAdvancedEquipmentState(saved) {
  for (const upgrade of KNUTH_ADVANCED_UPGRADES) {
    const owned = saved.knuthAdvancedOwned?.[upgrade.id], equipped = saved.knuthAdvancedEquipped?.[upgrade.id];
    knuthAdvancedOwned[upgrade.id] = Number.isSafeInteger(owned) && owned >= 0 ? owned : 0;
    knuthAdvancedEquipped[upgrade.id] = Number.isSafeInteger(equipped) && equipped >= 0
      ? Math.min(equipped, knuthAdvancedOwned[upgrade.id], Math.floor(Number.MAX_SAFE_INTEGER / upgrade.slots)) : 0;
  }
  knuthEquipmentOrder = Array.isArray(saved.knuthEquipmentOrder) ? saved.knuthEquipmentOrder : [];
}

function clearKnuthEquipment() {
  knuthEquippedUpgradeIds.clear();
  for (const upgrade of KNUTH_ADVANCED_UPGRADES) knuthAdvancedEquipped[upgrade.id] = 0;
  knuthEquipmentOrder = [];
}

function trimKnuthEquipmentToCapacity({ refresh = true } = {}) {
  knuthEquipmentOrder = normalizedKnuthEquipmentOrder();
  let excess = Math.max(0, knuthSlotsUsed() - knuthSlotCapacity()), removed = 0;
  for (let index = knuthEquipmentOrder.length - 1; index >= 0 && excess > 0; index--) {
    const entry = knuthEquipmentOrder[index];
    const upgrade = (entry.kind === 'normal' ? KNUTH_SLOT_UPGRADES : KNUTH_ADVANCED_UPGRADES).find(item => item.id === entry.id);
    const count = Math.min(entry.count, Math.ceil(excess / upgrade.slots));
    if (entry.kind === 'normal') {
      knuthEquippedUpgradeIds.delete(entry.id);
      if (refresh) refreshKnuthEquipmentDerivedState(entry.id);
    } else {
      knuthAdvancedEquipped[entry.id] -= count;
      if (refresh) refreshKnuthAdvancedDerivedState(entry.id);
    }
    excess = Math.max(0, excess - count * upgrade.slots);
    removed += count;
    entry.count -= count;
    if (entry.count === 0) knuthEquipmentOrder.splice(index, 1);
  }
  return removed;
}

function hasKnuthUpgrade(id) {
  return knuthEquippedUpgradeIds.has(id);
}

function knuthEquipmentCurve(value, balance) {
  const ratio = NumberMath.divideApproximate(NumberMath.max(value, 0), balance.scale);
  const scaled = multiplyNumberValue(NumberMath.power(ratio, balance.curve), balance.strength);
  return balance.exponential ? NumberMath.powerOfTen(scaled) : addBaseNumbers(1, scaled);
}

function knuthFirstGroupPurchaseCount() {
  return KNUTH_BASE_UPGRADES.filter(upgrade => upgrade.group === 1)
    .reduce((total, upgrade) => addBaseNumbers(total, knuthBaseUpgradeLevel(upgrade.id)), 0);
}

function knuthPurchasedAbstractionCount() {
  return ABSTRACTION_RESEARCHES.filter(research => hasPurchasedAbstractionResearch(research.id)).length;
}

function knuthAchievementCount() {
  if (typeof ACHIEVEMENTS === 'undefined' || typeof achievementState === 'undefined') return 0;
  return ACHIEVEMENTS.filter(achievement => achievementState[achievement.id] === true
    && (KNUTH_EQUIPMENT_BALANCE.includeSecretAchievements || achievement.category !== 'secret')).length;
}

function knuthGroupPercentMultiplier() {
  return hasKnuthUpgrade('group_percent_growth')
    ? knuthEquipmentCurve(knuthFirstGroupPurchaseCount(), KNUTH_EQUIPMENT_BALANCE.groupPercent) : 1;
}

function knuthAchievementPercentMultiplier() {
  return hasKnuthUpgrade('achievement_percent_growth')
    ? knuthEquipmentCurve(knuthAchievementCount(), KNUTH_EQUIPMENT_BALANCE.achievementPercent) : 1;
}

function knuthEquipmentPercentMultiplier() {
  if (!hasKnuthUpgrade('group_percent_growth') && !hasKnuthUpgrade('achievement_percent_growth')) return 1;
  return percentBatchInvariant('knuth-equipment-percent', () => multiplyNumberValue(
    knuthGroupPercentMultiplier(), knuthAchievementPercentMultiplier()
  ));
}

function knuthResearchResourceMultiplier() {
  return hasKnuthUpgrade('research_resource_growth')
    ? knuthEquipmentCurve(knuthPurchasedAbstractionCount(), KNUTH_EQUIPMENT_BALANCE.researchResources) : 1;
}

function knuthAccumulatedTimeSpMultiplier() {
  return hasKnuthUpgrade('accumulated_time_sp')
    ? knuthEquipmentCurve(numberBlackHoleAccumulatedGameSeconds, KNUTH_EQUIPMENT_BALANCE.accumulatedTimeSp) : 1;
}

function knuthDysonDivergerMultiplier(basePower) {
  if (!hasKnuthUpgrade('dyson_diverger')) return 1;
  const { logStrength, scale } = KNUTH_EQUIPMENT_BALANCE.dysonDiverger;
  const logarithm = NumberMath.max(1, NumberMath.log10(NumberMath.max(basePower, 1)));
  return NumberMath.powerOfTen(NumberMath.divideApproximate(
    logStrength * effectiveDysonSwarmLevel() / scale, logarithm
  ));
}

function knuthDivergerBlackHoleMultiplier() {
  return hasKnuthUpgrade('diverger_black_hole')
    ? knuthEquipmentCurve(NumberMath.log10(addBaseNumbers(1, divergerPower)), KNUTH_EQUIPMENT_BALANCE.divergerBlackHole) : 1;
}

function singularityHoldingLimit() {
  const base = addBaseNumbers(KNUTH_LATE_BASE_BALANCE.singularityBaseLimit, knuthBaseUpgradeEffectLevel('singularity_limit'));
  return NumberMath.floor(multiplyNumberValue(base, abstractionMassSingularityLimitMultiplier()));
}

function singularityRadiusGrowth() {
  return Math.max(KNUTH_LATE_BASE_BALANCE.singularityMinimumGrowth,
    SINGULARITY_BALANCE.radiusGrowth - knuthBaseUpgradeEffectLevel('singularity_growth'));
}

function singularityRadiusRequirement() {
  // Discount the exponent directly; subtracting two layered prices can lose their difference.
  const exponentScale = hasAbstractionResearch('18-1')
    ? Math.max(0, 1 - ABSTRACTION_MINI_BRANCH_BALANCE.requirementLogDiscountPerSingularity) : 1;
  const growth = NumberMath.powerOfTen(multiplyNumberValue(singularityPoints,
    Math.log10(singularityRadiusGrowth()) * exponentScale));
  const base = multiplyNumberValue(SINGULARITY_BALANCE.radiusStart, growth);
  const divisor = typeof singularitySpRequirementDivisor === 'function' ? singularitySpRequirementDivisor() : 1;
  if (compareNumberValues(divisor, 1) <= 0) return base;
  // At layered exponents a small discount may be below precision; never turn it into a price increase.
  return NumberMath.min(base, NumberMath.max(
    NumberMath.divideApproximate(base, SINGULARITY_BALANCE.spRequirementMaxDivisor),
    NumberMath.divideApproximate(base, divisor)
  ));
}

function singularityLinearMultiplier(strength) {
  const base = addBaseNumbers(1, multiplyNumberValue(singularityPoints, strength));
  return hasAbstractionResearch('18-2') ? NumberMath.power(base, abstractionRadiusSingularityPower()) : base;
}

function singularityBlackHoleMultiplier() {
  const base = multiplyNumberValue(
    singularityLinearMultiplier(SINGULARITY_BALANCE.blackHoleStrength),
    NumberMath.power(2, singularityUpgradeLevels.black_hole)
  );
  return hasAbstractionResearch('18-5') || hasAbstractionResearch('18-8')
    ? NumberMath.power(base, abstractionBlackHoleSingularityPower()) : base;
}

function singularityRadiusMultiplier() {
  return singularityLinearMultiplier(SINGULARITY_BALANCE.radiusStrength);
}

function singularityPercentMultiplier() {
  return percentBatchInvariant('singularity-percent', () => singularityLinearMultiplier(SINGULARITY_BALANCE.percentStrength));
}

function singularitySoftcapMultiplier() {
  return singularityLinearMultiplier(SINGULARITY_BALANCE.softcapStrength);
}

function singularityKpMultiplier() {
  return addBaseNumbers(1, multiplyNumberValue(
    multiplyNumberValue(SINGULARITY_BALANCE.kpStrength, singularityUpgradeLevels.kp_gain),
    NumberMath.power(singularityPoints, SINGULARITY_BALANCE.kpPower)
  ));
}

function singularityUpgradeCost(id) {
  const upgrade = SINGULARITY_UPGRADES.find(item => item.id === id);
  return upgrade ? multiplyNumberValue(upgrade.baseCost, NumberMath.power(upgrade.growth, singularityUpgradeLevels[id])) : null;
}

function loadSingularityState(saved) {
  abstractionPermanentSingularities = NumberMath.floor(numberValueFromSave(saved.abstractionPermanentSingularities));
  setSingularityPoints(NumberMath.floor(numberValueFromSave(saved.singularityPoints)));
  totalSingularitiesPurchased = NumberMath.max(
    singularityPoints, NumberMath.floor(numberValueFromSave(saved.totalSingularitiesPurchased))
  );
  for (const upgrade of SINGULARITY_UPGRADES) {
    singularityUpgradeLevels[upgrade.id] = NumberMath.floor(numberValueFromSave(saved.singularityUpgradeLevels?.[upgrade.id]));
  }
}

function setSingularityPoints(value) {
  singularityPoints = abstractionPermanentStorageActive('26-2')
    ? NumberMath.max(value, abstractionPermanentSingularities) : value;
  return singularityPoints;
}

function abstractionSingularityStorageCapacity() {
  if (!abstractionPermanentStorageActive('26-2') || typeof numberBlackHoleAvailable !== 'function'
    || !numberBlackHoleAvailable()) return 0;
  const tuning = ABSTRACTION_PRODUCTION_BRANCH_BALANCE;
  const scaledRadius = NumberMath.divideApproximate(numberBlackHoleSchwarzschildRadius(), tuning.reserveRadiusScale);
  return NumberMath.floor(multiplyNumberValue(tuning.reservePerRadiusDecade,
    NumberMath.log10(addBaseNumbers(1, scaledRadius))));
}

function abstractionSingularityBonus(radius) {
  if (!abstractionPermanentStorageActive('26-2') || !isPositiveNumberValue(radius)) return 0;
  const tuning = ABSTRACTION_PRODUCTION_BRANCH_BALANCE;
  const logarithm = NumberMath.log10(addBaseNumbers(1,
    NumberMath.divideApproximate(radius, tuning.singularityBonusRadiusScale)));
  return addBaseNumbers(1, NumberMath.floor(multiplyNumberValue(tuning.singularityBonusStrength,
    NumberMath.power(logarithm, tuning.singularityBonusCurve))));
}

function recordAbstractionPermanentSingularities() {
  if (!abstractionPermanentStorageActive('26-2')) return;
  const candidate = NumberMath.min(singularityPoints, abstractionSingularityStorageCapacity());
  abstractionPermanentSingularities = NumberMath.max(abstractionPermanentSingularities, candidate);
}

function restoreAbstractionPermanentSingularities() {
  setSingularityPoints(singularityPoints);
  recordAbstractionPermanentSingularities();
}

function refreshKnuthEquipmentDerivedState(id) {
  if (['dyson_diverger', 'second_branch_expansion'].includes(id) && divergerAvailable()) {
    divergerPower = divergerProductionValue();
  }
}

function knuthPercentOverflowMultiplier(overflow = knuthPercentOverflow) {
  const { strength, scale } = KNUTH_PERCENT_OVERFLOW_BALANCE;
  const ratio = NumberMath.divideApproximate(NumberMath.max(overflow, 0), scale);
  const logarithm = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, ratio)), Math.log10(2));
  return addBaseNumbers(1, multiplyNumberValue(logarithm, strength));
}

function knuthSpCpGainMultiplier(resource = 'sp') {
  if (isKnuthChallengeActive('kc6')) return 1;
  let multiplier = 1;
  if (hasKnuthUpgrade('knuth_time_gain')) {
    multiplier = addBaseNumbers(multiplier, NumberMath.power(abstractionEffectiveTime(), 0.5));
  }
  if (hasKnuthUpgrade('percent_overflow')) {
    multiplier = multiplyNumberValue(multiplier, knuthPercentOverflowMultiplier());
  }
  multiplier = multiplyNumberValue(multiplier, knuthResearchResourceMultiplier());
  if (resource === 'sp') multiplier = multiplyNumberValue(multiplier, knuthAccumulatedTimeSpMultiplier());
  multiplier = multiplyNumberValue(multiplier, abstractionSecondBranchResourceMultiplier(resource));
  return resource === 'sp' && hasAbstractionResearch('18-3')
    ? multiplyNumberValue(multiplier, NumberMath.power(NumberMath.max(1, squareConvergenceGainMultiplier()),
      ABSTRACTION_MINI_BRANCH_BALANCE.spFromCpPower)) : multiplier;
}

function divergerPercentPriceShiftMilestones() {
  if (compareNumberValues(divergerPower, '1e10') < 0) return 0;

  const logarithmicDistance = subtractNumberValues(NumberMath.log10(divergerPower), 10);
  const milestoneIndex = NumberMath.divideApproximate(logarithmicDistance, Math.log10(1.5));
  const numericIndex = NumberMath.toNumber(milestoneIndex);
  if (!Number.isFinite(numericIndex)) return Number.MAX_SAFE_INTEGER;

  return Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(1, Math.floor(numericIndex + 1e-10) + 1)
  );
}

function divergerPercentPriceShiftAmount() {
  return numberValueFromReal(divergerPercentPriceShiftMilestones() * 1e10);
}

function knuthOperationLegacyCost(level) {
  // L purchases quote purchase L+1; the first purchase has no growth factor.
  const doubles = Math.min(level, 99);
  const quadruples = Math.min(Math.max(0, level - 99), 100);
  const octuples = Math.max(0, level - 199);
  return multiplyNumberValue(NumberMath.power(2, doubles), multiplyNumberValue(
    NumberMath.power(4, quadruples), NumberMath.power(8, octuples)
  ));
}

function knuthOperationMaxLevel() {
  return hasCompletedKnuthChallenge('kc6') ? Number.MAX_SAFE_INTEGER : KNUTH_OPERATION_MAX_LEVEL;
}

function knuthOperationRewardCostAfterPurchases(cost, purchases, referenceCost = cost) {
  if (cost === null || purchases <= 0) return cost;
  if (!independentUpgradePriceReferenceActive()) {
    const threshold = NumberMath.powerOfTen(KC6_BALANCE.kpBandStartExponent);
    if (compareUpgradeCost(cost, threshold) < 0) {
      const toBoundary = Math.max(1, Math.ceil((KC6_BALANCE.kpBandStartExponent - numberLog10(cost))
        / KC6_BALANCE.operationGrowthExponent));
      const count = Math.min(purchases, toBoundary);
      cost = multiplyNumberValue(cost, NumberMath.powerOfTen(KC6_BALANCE.operationGrowthExponent * count));
      purchases -= count;
    }
    if (purchases <= 0) return cost;
    const logarithm = NumberMath.isScientific(cost.exponent) && NumberMath.isScientific(cost.exponent.exponent)
      ? cost.exponent : NumberMath.log10(cost);
    return upgradePriceFromExponent(feedbackBandedUpgradePriceExponent(logarithm,
      KC6_BALANCE.operationGrowthExponent, purchases, KC6_BALANCE));
  }
  const increment = referenceBandedGrowthExponent(referenceCost, KC6_BALANCE.operationGrowthExponent,
    KC6_BALANCE.operationGrowthExponent, purchases, KC6_BALANCE);
  return increment === null ? null : multiplyNumberValue(cost, NumberMath.powerOfTen(increment));
}

let knuthOperationRewardCostCache = null;
function knuthOperationUpgradeCost() {
  if (!hasCompletedKnuthChallenge('kc6') || knuthOperationLevel < KNUTH_OPERATION_MAX_LEVEL) {
    return knuthOperationLegacyCost(knuthOperationLevel);
  }
  const rule = `${JSON.stringify(KC6_BALANCE)}:${independentUpgradePriceReferenceActive()}`;
  const cached = knuthOperationRewardCostCache;
  if (cached && cached.rule === rule && cached.level === knuthOperationLevel) return cached.cost;
  const startCost = multiplyNumberValue(
    knuthOperationLegacyCost(KNUTH_OPERATION_MAX_LEVEL - 1), NumberMath.powerOfTen(KC6_BALANCE.operationGrowthExponent));
  const cost = knuthOperationRewardCostAfterPurchases(startCost, knuthOperationLevel - KNUTH_OPERATION_MAX_LEVEL);
  knuthOperationRewardCostCache = { level: knuthOperationLevel, rule, cost };
  return cost;
}

function knuthOperationReferenceCost() {
  if (!independentUpgradePriceReferenceActive()) return knuthOperationUpgradeCost();
  if (!hasCompletedKnuthChallenge('kc6') || knuthOperationLevel < KNUTH_OPERATION_MAX_LEVEL) {
    return knuthOperationLegacyCost(knuthOperationLevel);
  }
  return multiplyNumberValue(knuthOperationLegacyCost(KNUTH_OPERATION_MAX_LEVEL - 1),
    NumberMath.powerOfTen(KC6_BALANCE.operationGrowthExponent * (knuthOperationLevel - KNUTH_OPERATION_MAX_LEVEL + 1)));
}

function canBuyKnuthOperationUpgrade() {
  return !isKnuthChallengeActive('kc5') && knuthOperationLevel < knuthOperationMaxLevel()
    && compareUpgradeCost(knuthPoints, knuthOperationUpgradeCost()) >= 0;
}

function buyKnuthOperationUpgrade({ renderAfter = true } = {}) {
  if (!canBuyKnuthOperationUpgrade()) return false;
  const cost = knuthOperationUpgradeCost();

  knuthPoints = compareUpgradeCost(knuthPoints, cost) === 0 ? 0 : subtractNumberValues(knuthPoints, cost);
  knuthOperationLevel += 1;
  if (renderAfter) render();
  return true;
}

function toggleKnuthUpgrade(id) {
  const upgrade = KNUTH_SLOT_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;

  knuthEquipmentOrder = normalizedKnuthEquipmentOrder();
  if (knuthEquippedUpgradeIds.has(id)) {
    if (!hasCompletedKnuthChallenge('kc1')) return false;
    knuthEquippedUpgradeIds.delete(id);
    removeKnuthEquipmentOrder('normal', id);
    refreshKnuthEquipmentDerivedState(id);
    render();
    return true;
  }
  if (knuthSlotsUsed() + upgrade.slots > knuthSlotCapacity()) return false;

  knuthEquippedUpgradeIds.add(id);
  appendKnuthEquipmentOrder('normal', id);
  refreshKnuthEquipmentDerivedState(id);
  if (typeof observeAchievementProductionUnlocks === 'function') observeAchievementProductionUnlocks();
  render();
  return true;
}

function toggleKnuthEquipmentReset() {
  knuthResetEquipmentOnNextPrestige = !knuthResetEquipmentOnNextPrestige;
  render();
  return knuthResetEquipmentOnNextPrestige;
}

const SQUARE_BREAKTHROUGH_UPGRADES = [
  { id: 'black_hole', title: '블랙홀', description: '게임시간이 2배 빨라집니다.', baseCost: 8, max: 1, affectedByDyson: true },
  { id: 'extra_investment', title: '추가투자', description: 'SP 획득량이 2배 증가합니다.', baseCost: 8, costMultiplier: [4, 1], max: 8, affectedByDyson: true },
  { id: 'tas', title: 'TAS', description: '일반 오토 클릭커 속도 하한선을 10ms로 설정합니다.', baseCost: 4, max: 1 },
  { id: 'invisible_hand', title: '보이지 않는 손', description: '자동 업그레이드 속도가 1.5배 빨라집니다.', baseCost: 2, costMultiplier: [6, 5], max: 8, affectedByDyson: true },
  { id: 'overclock', title: '오버클럭', description: '퍼센트 파워 소프트캡을 4단계 확장합니다.', baseCost: 8, costMultiplier: [7, 4], max: 8, affectedByDyson: true },
  { id: 'deflation', title: '디플레이션', description: '모든 베이스 챕터 비용이 0.1배가 됩니다.', baseCost: 16, max: 1 },
  { id: 'doctor_octopus', title: '닥터옥토퍼스', description: '모든 클릭 획득량이 8배 증가합니다.', baseCost: 16, costMultiplier: [2, 1], max: 8, affectedByDyson: true },
  { id: 'solid_start', title: '탄탄한 시작', description: '퍼센트 시스템을 해금하고 시작수가 200만이 됩니다.', baseCost: 32, max: 1 },
  { id: 'overcharge', title: '과충전', description: '퍼센트 요구량이 항상 1로 고정됩니다.', baseCost: 16, max: 1 },
  { id: 'gregtech', title: '그렉텍', description: '오토클릭커 병렬화 상한이 2배 증가합니다.', baseCost: 8, costMultiplier: [3, 2], max: 8, affectedByDyson: true },
  { id: 'bottleneck_tracker', title: '병목 추적기', description: '퍼센트 가격 상승을 늦추고 퍼센트 효율을 높입니다.', baseCost: 64, costMultiplier: [10, 1], max: 8, affectedByDyson: true },
  { id: 'percent_expansion', title: '퍼센트 확장', description: '퍼센트 라인을 1개 추가합니다.', baseCost: 4, costMultiplier: [2, 1], max: 8 },
  { id: 'dyson_swarm', title: '다이슨 스웜', description: '별표가 붙은 제곱돌파 업그레이드 효과가 2배가 됩니다.', baseCost: 1000, costMultiplier: [20, 1], max: 8 }
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
    cost: 1
  },
  {
    id: 'percent_power_8',
    column: 0,
    row: 1,
    title: '퍼센트 효율 개선',
    description: '소프트캡 이후 퍼센트 증가량의 감쇠가 완화됩니다.',
    cost: 2
  },
  {
    id: 'percent_auto_125',
    column: 0,
    row: 2,
    title: '% 오토 10ms',
    description: '% 오토클리커의 하한 속도가 10ms로 내려갑니다.',
    cost: 1
  },
  {
    id: 'percent_charge_minus_16',
    column: 0,
    row: 3,
    title: '% 요구량 -16',
    description: '퍼센트 충전 요구량 감소 업그레이드가 -4 대신 -16 감소합니다.',
    cost: 1
  },
  {
    id: 'all_cost_half',
    column: 0,
    row: 4,
    title: '모든 비용 0.5배',
    description: '기본 게임에서 쓰는 숫자 비용이 절반이 됩니다.',
    cost: 2
  },
  {
    id: 'auto_parallel_64',
    column: 0,
    row: 5,
    title: '오토 병렬 64배',
    description: '오토 클릭커 병렬화 제한이 64배로 증가합니다.',
    cost: 1
  },
  {
    id: 'game_speed_1_5',
    column: 1,
    row: 0,
    title: '게임 속도 1.5배',
    description: '오토 클릭커와 자동 % 사용 타이머가 1.5배 빠르게 흐릅니다.',
    cost: 1
  },
  {
    id: 'sp_gain_double',
    column: 1,
    row: 1,
    title: 'SP 획득량 2배',
    description: '제곱 프레스티지의 SP 획득량이 2배가 됩니다.',
    cost: 4
  },
  {
    id: 'auto_upgrade_top_down',
    column: 1,
    row: 2,
    title: '자동 업그레이드',
    description: '살 수 있는 기본 게임 업그레이드 중 하나를 골라 자동 구매합니다.',
    cost: 1
  },
  {
    id: 'skip_cutscene',
    column: 2,
    row: 0,
    title: '컷신 스킵',
    description: '기본 게임 목표수에 도달하면 컷신 없이 바로 제곱 프레스티지합니다.',
    cost: 1
  },
  {
    id: 'restart_percent_unlock',
    column: 2,
    row: 1,
    title: '재시작 % 해금',
    description: '제곱 프레스티지 후 재시작할 때 % 시스템이 자동 해금됩니다.',
    cost: 2
  },
  {
    id: 'restart_auto_4x',
    column: 2,
    row: 2,
    title: '재시작 오토 4배',
    description: '재시작할 때 오토 클릭커와 4배 병렬화가 자동 해금됩니다.',
    cost: 1
  },
  {
    id: 'restart_auto_percent_fill',
    column: 2,
    row: 3,
    title: '재시작 % 채우기',
    description: '재시작할 때 오토 클릭커 퍼센트 채우기가 자동 해금됩니다.',
    cost: 1
  },
  {
    id: 'restart_start_100k',
    column: 2,
    row: 4,
    title: '재시작 시작수 10만',
    description: '제곱 프레스티지 후 재시작할 때 숫자 100,000부터 시작합니다.',
    cost: 4
  },
  {
    id: 'restart_percent_lane2',
    column: 2,
    row: 5,
    title: '재시작 2라인',
    description: '제곱 프레스티지 후 재시작할 때 퍼센트 라인 2가 자동 해금됩니다.',
    cost: 2
  }
];

const squareUpgradeState = {};
for (const upgrade of SQUARE_UPGRADES) {
  squareUpgradeState[upgrade.id] = false;
}

function hasSquareUpgrade(id) {
  return squareUpgradeState[id] === true;
}

function hasSquareConvergenceUpgrade(id) {
  return squareConvergenceUpgradeState[id] === true;
}

function squareConvergenceUpgradeLevel(id) {
  return squareConvergenceUpgradeLevels[id] ?? (hasSquareConvergenceUpgrade(id) ? 1 : 0);
}

function squareConvergenceUpgradeCost(upgrade) {
  const level = squareConvergenceUpgradeLevel(upgrade.id);
  if (upgrade.id === 'cp_gain_5x') {
    // 첫 8회 구매 뒤에는 다음 가격이 25배, 32회 구매 뒤에는 125배씩 오른다.
    const earlyIncreases = Math.min(level, 7);
    const middleIncreases = Math.max(0, Math.min(level, 31) - 7);
    const lateIncreases = Math.max(0, level - 31);
    return multiplyNumberValue(
      multiplyNumberValue(
        multiplyNumberValue(upgrade.cost, NumberMath.power(5, earlyIncreases)),
        NumberMath.power(25, middleIncreases)
      ),
      NumberMath.power(125, lateIncreases)
    );
  }
  if (!upgrade.costMultiplier) return upgrade.cost;
  return multiplyNumberValue(
    upgrade.cost,
    NumberMath.power(upgrade.costMultiplier, level)
  );
}

function hasGeneralizationResearch(id) {
  if (generalizationResearchState[id] === true) return true;
  return (id === '3-1' || id === '3-2')
    && typeof hasKnuthUpgrade === 'function'
    && hasKnuthUpgrade('permanent_production');
}

function hasPurchasedGeneralizationResearch(id) {
  return generalizationResearchState[id] === true;
}

function squareBreakthroughLevel(id) {
  return squareBreakthroughLevels[id] ?? 0;
}

function hasSquareBreakthrough(id) {
  return squareBreakthroughLevel(id) > 0;
}

function canOpenSquareBreakthrough() {
  return squareUnlocked && allSquareUpgradesBought();
}

function canOpenSquareConvergence() {
  return squareConvergenceUnlocked || compareNumberValues(squarePoints, INT_MAX) >= 0;
}

function canOpenGeneralizationResearch() {
  return hasEverEarnedSquareConvergencePoint && !isKnuthChallengeActive('kc3');
}

function canOpenAbstraction() {
  return knuthUnlocked;
}

function ceilDiv(numerator, denominator) {
  const exactIntegerOperands = [numerator, denominator].every(value => {
    if (typeof value === 'number') return Number.isSafeInteger(value);
    return typeof value === 'string'
      && /^\d+$/.test(value.trim())
      && value.trim().length <= 33;
  });
  if (exactIntegerOperands) {
    const quotient = NumberMath.divide(numerator, denominator);
    const remainder = NumberMath.modulo(numerator, denominator);
    return NumberMath.isPositive(remainder)
      ? NumberMath.add(quotient, 1)
      : quotient;
  }
  return NumberMath.ceil(NumberMath.divideApproximate(numerator, denominator));
}

function abstractionSquarePowerDysonMultiplier() {
  if (!hasAbstractionResearch('16-1') || !squareDimensionAvailable()) return 1;
  const { dysonStrength, squarePowerLogScale } = ABSTRACTION_TIER16_BALANCE;
  return 1 + dysonStrength * abstractionLogRatio(squareDimensionTotalPower(), squarePowerLogScale);
}

function dysonEffectMultiplier() {
  const level = effectiveDysonSwarmLevel();
  const base = NumberMath.power(2, level);
  const existing = level > 0 && hasAbstractionResearch('16-1')
    ? multiplyNumberValue(base, abstractionSquarePowerDysonMultiplier()) : base;
  const current = hasAbstractionResearch('18-6')
    ? NumberMath.power(existing, ABSTRACTION_MINI_BRANCH_BALANCE.dysonEffectPower) : existing;
  return level > 0 ? multiplyNumberValue(current, knuthBaseMultiplier('dyson_effect', 1.25)) : current;
}

function dysonEffectNumber() {
  return NumberMath.toNumber(dysonEffectMultiplier());
}

function effectiveDysonSwarmLevel() {
  if (isKnuthChallengeActive('kc1')) return 0;
  return squareBreakthroughLevel('dyson_swarm') + abstractionDivergerDysonBonus();
}

function abstractionDivergerDysonBonus() {
  if (!hasAbstractionResearch('19-2') || !divergerAvailable() || isKnuthChallengeActive('kc1')) return 0;
  return percentBatchInvariant('diverger-dyson-bonus', () => {
    // Excluding Dyson's own boost prevents the bonus from feeding itself.
    const logarithm = NumberMath.log10(addBaseNumbers(1, divergerProductionBeforeDyson()));
    const { divergerDysonMaxBonus, divergerDysonLogScale } = ABSTRACTION_TIER19_BALANCE;
    const ratio = NumberMath.divideApproximate(logarithm, addBaseNumbers(logarithm, divergerDysonLogScale));
    return NumberMath.toNumber(NumberMath.floor(multiplyNumberValue(divergerDysonMaxBonus, ratio)));
  });
}

function affectedNumberMultiplierValue(base, level) {
  return NumberMath.power(
    multiplyNumberValue(numberValueFromReal(base), dysonEffectMultiplier()),
    level
  );
}

function affectedNumberMultiplier(base, level) {
  return Math.pow(base * dysonEffectNumber(), level);
}

function squareBreakthroughCost(upgrade) {
  const level = squareBreakthroughLevel(upgrade.id);
  if (level >= squareBreakthroughMax(upgrade)) return null;
  const [numerator, denominator] = upgrade.costMultiplier ?? [1, 1];
  const ordinaryMax = squareBreakthroughOrdinaryMax(upgrade);
  if (level >= ordinaryMax && ['dyson_swarm', 'overclock'].includes(upgrade.id)) {
    const q = upgrade.id === 'dyson_swarm' ? 1.01 : 1.005;
    let cost = ceilDiv(
      multiplyNumberValue(upgrade.baseCost, NumberMath.power(numerator, ordinaryMax - 1)),
      NumberMath.power(denominator, ordinaryMax - 1)
    );
    let remaining = level - ordinaryMax + 1;
    const growth = numerator / denominator;
    // Preserve integer rounding while it matters; solve the large-number tail directly.
    while (remaining > 0 && compareNumberValues(cost, '1e33') < 0) {
      cost = NumberMath.ceil(NumberMath.power(multiplyNumberValue(cost, growth), q));
      remaining--;
    }
    if (remaining === 0) return cost;
    const factor = NumberMath.power(q, remaining);
    const logCost = NumberMath.add(
      NumberMath.multiply(factor, NumberMath.log10(cost)),
      NumberMath.multiply(NumberMath.subtract(factor, 1), Math.log10(growth) * q / (q - 1))
    );
    return NumberMath.ceil(NumberMath.power(10, logCost));
  }
  return ceilDiv(
    multiplyNumberValue(upgrade.baseCost, NumberMath.power(numerator, level)),
    NumberMath.power(denominator, level)
  );
}

function squareBreakthroughOrdinaryMax(upgrade) {
  if (upgrade.id === 'dyson_swarm' && hasGeneralizationResearch('2-3')) return 12;
  let max = upgrade.id === 'bottleneck_tracker' && hasGeneralizationResearch('2-4')
    ? 16
    : upgrade.max;
  if (isKnuthChallengeActive('kc1')) {
    if (upgrade.id === 'overclock') max += knuthChallengeDysonSwarmMaxAtEntry * 4;
    if (upgrade.id === 'bottleneck_tracker') max += knuthChallengeDysonSwarmMaxAtEntry * 2;
  }
  return max;
}

function squareBreakthroughMax(upgrade) {
  const dysonExtra = knuthBaseUpgradeEffectLevel('dyson_limit') * (hasAbstractionResearch('17-3') ? 2 : 1);
  const extra = upgrade.id === 'dyson_swarm' ? hasSpaceExpansionOneTimeUpgrade('group_boost')
    ? NumberMath.toNumber(NumberMath.min(Number.MAX_SAFE_INTEGER,
      NumberMath.floor(multiplyNumberValue(dysonExtra, spaceExpansionGroupMultiplier())))) : dysonExtra
    : upgrade.id === 'overclock' ? knuthBaseUpgradeEffectLevel('overclock_limit') * 4 : 0;
  return Math.min(Number.MAX_SAFE_INTEGER, squareBreakthroughOrdinaryMax(upgrade) + extra);
}

function squareBreakthroughEffectSuffix(upgrade) {
  return upgrade.affectedByDyson ? ' *' : '';
}

function numberGainMultiplier() {
  return hasSquareConvergenceUpgrade('galaxium') ? 2048 : 1;
}

function squareDimensionAvailable() {
  if (isKnuthChallengeActive('kc2')) return false;
  return hasGeneralizationResearch('3-1') || (
    typeof hasKnuthUpgrade === 'function' &&
    hasKnuthUpgrade('permanent_production')
  );
}

function squareDimensionCount() {
  return hasGeneralizationResearch('4-2') ? 2 : 1;
}

function numberValueFromReal(value) {
  return NumberMath.fromNumber(value);
}

function numberLog10(value) {
  return NumberMath.toNumber(NumberMath.log10(value));
}

function numberValueFromLog10(logarithm) {
  if (NumberMath.isScientific(logarithm)) return NumberMath.powerOfTen(logarithm);
  if (logarithm === Infinity) return NumberMath.powerOfTen(Number.MAX_VALUE);
  if (!Number.isFinite(logarithm)) return 0;
  return NumberMath.powerOfTen(logarithm);
}

function realNumberFromValue(value) {
  const result = NumberMath.toNumber(value);
  return Number.isFinite(result) ? result : result > 0 ? Number.MAX_VALUE : 0;
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
        return numberValueFromReal((x * y) / Number(realNumberFromValue(NumberMath.power(SQUARE_DIMENSION_SCALE, 2))));
      }
    }
    return divideNumberValue(
      multiplyNumberValue(dimension.x, dimension.y),
      NumberMath.power(SQUARE_DIMENSION_SCALE, 2)
    );
  }

  if (!isApproximateNumber(dimension.x) && !isApproximateNumber(dimension.y) && !isApproximateNumber(dimension.z)) {
    const x = Number(dimension.x);
    const y = Number(dimension.y);
    const z = Number(dimension.z);
    if (Number.isSafeInteger(x) && Number.isSafeInteger(y) && Number.isSafeInteger(z)) {
      return numberValueFromReal((x * y * z) / Number(realNumberFromValue(NumberMath.power(SQUARE_DIMENSION_SCALE, 3))));
    }
  }

  return divideNumberValue(
    multiplyNumberValue(multiplyNumberValue(dimension.x, dimension.y), dimension.z),
    NumberMath.power(SQUARE_DIMENSION_SCALE, 3)
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
  if (!squareDimensionIsAvailable(index)) return 1;
  const basePower = NumberMath.powerApproximate(
    squareDimensionVolume(index),
    squareDimensionPowerExponent(index)
  );
  return multiplyNumberValue(basePower, spaceExpansionMultiplier(
    multiplyNumberValue(divergerSquareDimensionMultiplier(), knuthBaseMultiplier('dimension_gain', 4))));
}

function setSquareDimensionPowerForDev(value, index = 0) {
  if (!squareDimensionIsAvailable(index)) return false;

  const dimension = squareDimensionState(index);
  if (compareNumberValues(value, 0) === 0) {
    dimension.x = 0;
    return true;
  }

  const exponent = squareDimensionPowerExponent(index);
  const basePower = divideNumberValue(value, spaceExpansionMultiplier(
    multiplyNumberValue(divergerSquareDimensionMultiplier(), knuthBaseMultiplier('dimension_gain', 4))));
  const targetVolume = NumberMath.powerApproximate(basePower, 1 / exponent);
  const scalePower = NumberMath.power(
    SQUARE_DIMENSION_SCALE,
    hasGeneralizationResearch('5-1') ? 3 : 2
  );
  const otherSides = hasGeneralizationResearch('5-1')
    ? multiplyNumberValue(dimension.y, dimension.z)
    : dimension.y;

  if (compareNumberValues(otherSides, 0) <= 0) return false;
  dimension.x = divideNumberValue(
    multiplyNumberValue(targetVolume, scalePower),
    otherSides
  );
  return true;
}

function squareDimensionNumberMultiplier(index = null) {
  if (index !== null) {
    if (!squareDimensionIsAvailable(index)) return 1;
    let multiplier = NumberMath.powerApproximate(
      squareDimensionPower(index),
      hasGeneralizationResearch('5-1') ? 3 : 2
    );
    if (hasGeneralizationResearch('6-1')) {
      multiplier = NumberMath.powerApproximate(multiplier, 2);
    }
    return multiplier;
  }

  if (!squareDimensionAvailable()) return 1;
  let multiplier = 1;
  for (let dimensionIndex = 0; dimensionIndex < squareDimensionCount(); dimensionIndex++) {
    multiplier = multiplyNumberValue(
      multiplier,
      squareDimensionNumberMultiplier(dimensionIndex)
    );
  }
  return multiplyNumberValue(multiplier, divergerSquareDimensionMultiplier());
}

function squareDimensionTotalPower() {
  if (!squareDimensionAvailable()) return 1;

  let totalPower = 1;
  for (let dimensionIndex = 0; dimensionIndex < squareDimensionCount(); dimensionIndex++) {
    totalPower = multiplyNumberValue(
      totalPower,
      squareDimensionPower(dimensionIndex)
    );
  }
  return totalPower;
}

function squareDimensionPercentSoftcapExponent() {
  // 제곱 차원은 현재 퍼센트 소프트캡을 직접 강화하지 않는다.
  return 0;
}

function squareDimensionPercentSoftcapMultiplier() {
  return NumberMath.powerApproximate(10, squareDimensionPercentSoftcapExponent());
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
  return numberValueFromReal(Math.max(0, Math.round(logarithm * Number(realNumberFromValue(SQUARE_DIMENSION_SCALE)))));
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
    Object.assign(squareDimensionStates[index], makeSquareDimensionState(index === 0 ? 1 : 2));
  }
}

function buySquareDimensionSide(side, index = 0, renderAfter = true) {
  if (!squareDimensionIsAvailable(index)) return false;
  if (side === 'z' && !hasGeneralizationResearch('5-1')) return false;
  const dimension = squareDimensionState(index);
  const cost = squareDimensionSideCost(side, index);
  if (compareNumberValues(squarePoints, cost) < 0) return false;

  setSquarePoints(subtractNumberValues(squarePoints, cost));
  if (side === 'z') {
    dimension.zGrowthLevel = addBaseNumbers(dimension.zGrowthLevel, 1);
    dimension.zCost = multiplyNumberValue(dimension.zCost, 2);
  } else if (side === 'y') {
    dimension.yGrowthLevel = addBaseNumbers(dimension.yGrowthLevel, 1);
    dimension.yCost = multiplyNumberValue(dimension.yCost, 2);
  } else {
    dimension.xGrowthLevel = addBaseNumbers(dimension.xGrowthLevel, 1);
    dimension.xCost = multiplyNumberValue(dimension.xCost, 2);
  }
  if (renderAfter) render();
  return true;
}

function squareDimensionSideBulkCost(cost, purchases) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0) return 0;
  const doubling = NumberMath.power(2, purchases);
  return multiplyNumberValue(cost, subtractNumberValues(doubling, 1));
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
  const nextCost = multiplyNumberValue(cost, NumberMath.power(2, purchases));

  setSquarePoints(subtractNumberValues(squarePoints, totalCost));
  if (side === 'z') {
    dimension.zGrowthLevel = addBaseNumbers(dimension.zGrowthLevel, numberValueFromReal(purchases));
    dimension.zCost = nextCost;
  } else if (side === 'y') {
    dimension.yGrowthLevel = addBaseNumbers(dimension.yGrowthLevel, numberValueFromReal(purchases));
    dimension.yCost = nextCost;
  } else {
    dimension.xGrowthLevel = addBaseNumbers(dimension.xGrowthLevel, numberValueFromReal(purchases));
    dimension.xCost = nextCost;
  }
  render();
  return true;
}

function buySquareDimensionPowerTimeUpgrade(index = 0, renderAfter = true) {
  const dimension = squareDimensionState(index);
  if (!squareDimensionIsAvailable(index) || dimension.powerInterval <= SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL) {
    return false;
  }
  if (compareNumberValues(squarePoints, dimension.powerIntervalCost) < 0) return false;

  setSquarePoints(subtractNumberValues(squarePoints, dimension.powerIntervalCost));
  dimension.powerInterval = Math.max(
    SQUARE_DIMENSION_MIN_PRODUCTION_INTERVAL,
    Math.ceil(dimension.powerInterval / 2)
  );
  dimension.powerIntervalCost = multiplyNumberValue(dimension.powerIntervalCost, 10);
  if (renderAfter) render();
  return true;
}

function buySquareDimensionPowerStrength(index = 0, renderAfter = true) {
  const dimension = squareDimensionState(index);
  if (!squareDimensionIsAvailable(index) || dimension.powerStrengthUnlocked || hasGeneralizationResearch('6-2')) return false;
  const cost = multiplyNumberValue(SQUARE_DIMENSION_POWER_STRENGTH_COST, index === 0 ? 1 : 2);
  if (compareNumberValues(squarePoints, cost) < 0) return false;

  setSquarePoints(subtractNumberValues(squarePoints, cost));
  dimension.powerStrengthUnlocked = true;
  log(
    hasGeneralizationResearch('5-1')
      ? '제곱력 생산 강화가 적용되었습니다. 제곱력 공식 지수가 1/6에서 1/3으로 변경되었습니다.'
      : '제곱력 생산 강화가 적용되었습니다. 제곱력 공식 지수가 1/4에서 1/2로 변경되었습니다.',
    true
  );
  if (renderAfter) render();
  return true;
}

function squareDimensionAutoUpgradeAvailable() {
  return hasGeneralizationResearch('7-2');
}

function toggleSquareDimensionAutoUpgrade() {
  if (!squareDimensionAutoUpgradeAvailable()) return false;
  squareDimensionAutoUpgradeEnabled = !squareDimensionAutoUpgradeEnabled;
  squareDimensionAutoUpgradeTimer = 0;
  render();
  return true;
}

function automaticSquareDimensionUpgradeChoices() {
  const choices = [];
  for (let index = 0; index < squareDimensionCount(); index++) {
    for (const side of ['x', 'y', 'z']) {
      choices.push(() => buySquareDimensionSide(side, index, false));
    }
    choices.push(() => buySquareDimensionPowerTimeUpgrade(index, false));
    choices.push(() => buySquareDimensionPowerStrength(index, false));
  }
  return choices;
}

function tryAutomaticSquareDimensionUpgrade() {
  if (!squareDimensionAutoUpgradeAvailable() || !squareDimensionAutoUpgradeEnabled) return false;

  const choices = automaticSquareDimensionUpgradeChoices();
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

function tryAutomaticSquareDimensionUpgradeBatch(maxPurchasesPerUpgrade) {
  if (!squareDimensionAutoUpgradeAvailable() || !squareDimensionAutoUpgradeEnabled) return 0;

  const operationLimit = SQUARE_DIMENSION_AUTO_UPGRADE_BATCH_LIMIT;
  const purchaseLimit = Math.max(1, Math.min(operationLimit, Math.floor(maxPurchasesPerUpgrade)));
  let totalPurchased = 0;
  for (const upgrade of automaticSquareDimensionUpgradeChoices()) {
    let purchased = 0;
    while (purchased < purchaseLimit && totalPurchased < operationLimit && upgrade()) {
      purchased++;
      totalPurchased++;
    }
    if (totalPurchased >= operationLimit) break;
  }
  return totalPurchased;
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

  squareDimensionAutoUpgradeTimer += autoUpgradeElapsedTime(elapsedMs);
  const operationLimit = SQUARE_DIMENSION_AUTO_UPGRADE_BATCH_LIMIT;
  if (!Number.isFinite(squareDimensionAutoUpgradeTimer)) {
    squareDimensionAutoUpgradeTimer = Number.MAX_VALUE;
  }

  let attempts = Math.floor(squareDimensionAutoUpgradeTimer / 250);
  if (attempts <= 0) return false;

  if (hasGeneralizationResearch('3-4')) {
    const processedAttempts = Math.min(operationLimit, attempts);
    const purchased = tryAutomaticSquareDimensionUpgradeBatch(processedAttempts);
    squareDimensionAutoUpgradeTimer = Math.max(0, squareDimensionAutoUpgradeTimer - purchased * 250);
    return purchased > 0;
  }

  attempts = Math.min(16, attempts);
  let changed = false;
  for (let index = 0; index < attempts; index++) {
    if (!tryAutomaticSquareDimensionUpgrade()) break;
    squareDimensionAutoUpgradeTimer -= 250;
    changed = true;
  }
  return changed;
}

function addSquareDimensionGrowth(dimension, side, rate, elapsedSeconds) {
  const growth = multiplyNumberValue(rate, elapsedSeconds);
  if (!NumberMath.isPositive(growth)) return false;

  const carryKey = `${side}GrowthCarry`;
  if (typeof growth === 'number' && growth < Number.MAX_SAFE_INTEGER) {
    dimension[carryKey] += growth;
    const wholeGrowth = Math.floor(dimension[carryKey]);
    dimension[carryKey] -= wholeGrowth;
    if (wholeGrowth <= 0) return false;
    dimension[side] = addBaseNumbers(dimension[side], numberValueFromReal(wholeGrowth));
    return true;
  }

  dimension[carryKey] = 0;
  dimension[side] = addBaseNumbers(dimension[side], growth);
  return true;
}

function advanceSquareDimensionState(dimension, index, elapsedMs) {
  const productionSpeed = SQUARE_DIMENSION_BASE_PRODUCTION_INTERVAL / squareDimensionEffectiveInterval(dimension);
  const elapsedSeconds = (elapsedMs / 1000) * productionSpeed;
  let changed = addSquareDimensionGrowth(
    dimension,
    'x',
    squareDimensionSideGrowthRate('x', index),
    elapsedSeconds
  );
  changed = addSquareDimensionGrowth(
    dimension,
    'y',
    squareDimensionSideGrowthRate('y', index),
    elapsedSeconds
  ) || changed;
  if (hasGeneralizationResearch('5-1')) {
    changed = addSquareDimensionGrowth(
      dimension,
      'z',
      squareDimensionSideGrowthRate('z', index),
      elapsedSeconds
    ) || changed;
  }
  return changed;
}

function advanceSquareDimensions(elapsedMs) {
  if (!squareDimensionAvailable() || overflowed || elapsedMs <= 0) {
    squareDimensionAutoUpgradeTimer = 0;
    return false;
  }

  const gameElapsedMs = gameTick(elapsedMs);

  let changed = false;
  for (let index = 0; index < squareDimensionCount(); index++) {
    if (advanceSquareDimensionState(squareDimensionState(index), index, gameElapsedMs)) {
      changed = true;
    }
  }
  if (advanceSquareDimensionAutoUpgrade(gameElapsedMs)) changed = true;
  return changed;
}

function squarePointBaseGain() {
  if (isKnuthChallengeActive('kc6')) return 1;
  let gain = hasSquareUpgrade('sp_gain_double') ? 2 : 1;
  gain = multiplyNumberValue(gain, affectedNumberMultiplierValue(2, squareBreakthroughLevel('extra_investment')));
  return multiplyNumberValue(gain, knuthBaseMultiplier('sp_gain', 10000));
}

function squarePointGain() {
  return spaceExpansionMultiplier(multiplyNumberValue(
    squarePointBaseGain(),
    knuthSpCpGainMultiplier()
  ));
}

function knuthChallengeTheoryRewardMultiplier() {
  return hasCompletedKnuthChallenge('kc3') ? 2 : 1;
}

function squarePointGainForValue(value) {
  const requirement = squarePointExchangeRequirement();
  if (compareNumberValues(value, requirement) < 0) return 0;

  const gain = hasGeneralizationResearch('5-2')
    ? NumberMath.max(
      divideNumberValue(NumberMath.power(value, 1 / 2400), gameEndValue()),
      1
    )
    : NumberMath.max(
      NumberMath.log10(divideNumberValue(value, requirement)),
      1
    );
  return spaceExpansionFinalSpGain(multiplyNumberValue(gain, squarePointGain()));
}

function abstractionSpGainPerGameSecond() {
  if (!hasAbstractionResearch('1-1')) return 0;
  return multiplyNumberValue(squarePointGainForValue(getBaseNumber()), 0.01);
}

function abstractionSpGainPerRealSecond() {
  return multiplyNumberValue(abstractionSpGainPerGameSecond(), gameTick(1000) / 1000);
}

function abstractionCpGainPerRealSecond() {
  return hasAbstractionResearch('23-1')
    ? multiplyNumberValue(squareConvergencePointGain(), ABSTRACTION_TIER23_BALANCE.passiveCpFraction) : 0;
}

function abstractionRandomPowerKpMultiplier() {
  if (!hasAbstractionResearch('23-2') || !isPositiveNumberValue(randomPower)) return 1;
  const tuning = ABSTRACTION_TIER23_BALANCE;
  const scaledLog = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, randomPower)),
    tuning.randomPowerKpLogScale);
  return NumberMath.powerOfTen(multiplyNumberValue(tuning.randomPowerKpExponent,
    NumberMath.power(scaledLog, tuning.randomPowerKpCurve)));
}

function abstractionRandomPowerPercentMultiplier() {
  if (!hasAbstractionResearch('24-1') || !isPositiveNumberValue(randomPower)) return 1;
  const tuning = ABSTRACTION_TIER24_BALANCE;
  const scaledLog = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, randomPower)),
    tuning.randomPowerLogScale);
  return NumberMath.powerOfTen(multiplyNumberValue(tuning.percentLogStrength,
    NumberMath.power(scaledLog, tuning.percentCurve)));
}

function setSquarePoints(value, restorePermanent = true) {
  const hasReserve = restorePermanent && abstractionPermanentStorageActive('23-3') && isPositiveNumberValue(abstractionPermanentSp);
  squarePoints = hasReserve ? NumberMath.max(value, abstractionPermanentSp) : value;
  if (hasReserve) squareUnlocked = true;
  return squarePoints;
}

function recordAbstractionPermanentSp() {
  if (!abstractionPermanentStorageActive('23-3')) return;
  abstractionPermanentSp = NumberMath.max(abstractionPermanentSp,
    multiplyNumberValue(squarePoints, ABSTRACTION_TIER23_BALANCE.permanentSpFraction));
}

function advanceAbstraction(elapsedRealMs) {
  const elapsed = Number(elapsedRealMs);
  if (!Number.isFinite(elapsed) || elapsed <= 0) return false;
  if (!hasAbstractionResearch('1-1') && !hasAbstractionResearch('23-1')) return false;
  const gainedCp = multiplyNumberValue(abstractionCpGainPerRealSecond(), elapsed / 1000);
  let changed = false;
  if (isPositiveNumberValue(gainedCp)) {
    squareConvergencePoints = addBaseNumbers(squareConvergencePoints, gainedCp);
    hasEverEarnedSquareConvergencePoint = true;
    squareConvergenceUnlocked = true;
    changed = true;
  }
  if (hasAbstractionResearch('1-1')) {
    const gainedSp = multiplyNumberValue(squarePointGainForValue(getBaseNumber()), gameTick(elapsed) / 100000);
    if (isPositiveNumberValue(gainedSp)) {
      setSquarePoints(addBaseNumbers(squarePoints, gainedSp));
      changed = true;
    }
  }
  return changed;
}

function squarePointExchangeRequirement() {
  return hasGeneralizationResearch('2-1') ? 8000000000000000000 : LONG_MAX;
}

function squarePrestigeTargetPointReward(pointReward) {
  if (!squareBreakthroughEntered) return 1;
  return compareNumberValues(pointReward, 0) > 0 ? pointReward : 1;
}

function squarePrestigeNumberForPointReward(pointReward) {
  return multiplyNumberValue(gameEndValue(), squarePrestigeTargetPointReward(pointReward));
}

function squarePrestigeConversionRequest() {
  return squareUnlocked ? null : { requiredValue: gameEndValue(), pointReward: null };
}

function squarePrestigeTriggerValue() {
  return squarePrestigeConversionRequest()?.requiredValue ?? null;
}

function effectivePerClick() {
  return multiplyNumberValue(perClick, effectivePerClickMultiplier());
}

function effectivePerClickMultiplier() {
  let multiplier = hasSquareUpgrade('click_double') ? 2 : 1;
  multiplier = multiplyNumberValue(multiplier, numberGainMultiplier());
  multiplier = multiplyNumberValue(
    multiplier,
    affectedNumberMultiplierValue(8, squareBreakthroughLevel('doctor_octopus'))
  );
  return spaceExpansionMultiplier(multiplyNumberValue(multiplier, squareDimensionNumberMultiplier()));
}

function maybeUnlockPercent() {
  if (percentUnlocked || compareBaseNumber(1000) < 0) return false;

  percentUnlocked = true;
  log('1000 도달 — % 시스템이 해금되었습니다.');
  return true;
}

function autoClickerParallelCap() {
  const baseCap = hasSquareUpgrade('auto_parallel_64')
    ? UPGRADED_AUTO_CLICKER_PARALLEL_CAP
    : BASE_AUTO_CLICKER_PARALLEL_CAP;
  return multiplyNumberValue(baseCap, affectedNumberMultiplierValue(2, squareBreakthroughLevel('gregtech')));
}

function percentPowerStateNumber(value) {
  const numeric = NumberMath.isScientific(value)
    ? NumberMath.toNumber(value)
    : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizedPercentPower(power) {
  const value = percentPowerStateNumber(power);
  return Number.isFinite(value) && value >= 1 ? value : 1;
}

function normalizePercentPowerPurchaseCount(value, power) {
  const count = percentPowerStateNumber(value);
  if (Number.isSafeInteger(count) && count >= 0) return count;
  return Math.min(
    Number.MAX_SAFE_INTEGER,
    Math.max(0, Math.floor(normalizedPercentPower(power) - 1))
  );
}

function reconcilePercentPowerProgress(power, purchaseCount) {
  let reconciledPower = normalizedPercentPower(power);
  let reconciledCount = normalizePercentPowerPurchaseCount(purchaseCount, reconciledPower);

  if (reconciledCount < Number.MAX_SAFE_INTEGER) {
    reconciledPower = Math.max(reconciledPower, reconciledCount + 1);
  }
  if (Number.isSafeInteger(reconciledPower)) {
    reconciledCount = Math.max(reconciledCount, reconciledPower - 1);
  }

  return { power: reconciledPower, purchaseCount: reconciledCount };
}

function percentPowerEffectiveLimit() {
  return hasKnuthUpgrade('percent_cap_200') ? 200 : 100;
}

function normalizedPercentPowerBonus(bonus) {
  const value = percentPowerStateNumber(bonus);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function percentEffectivePower(power, purchaseBonus = 0) {
  return Math.min(percentPowerEffectiveLimit(), normalizedPercentPower(power))
    + normalizedPercentPowerBonus(purchaseBonus);
}

function percentPowerBonusForPurchase(purchaseNumber) {
  const purchases = Math.max(0, Number(purchaseNumber) || 0);
  if (!Number.isFinite(purchases)) return purchases > 0 ? 20 : 0;
  return 20 * purchases / (purchases + 1000);
}

function grantPercentPower(currentPower, currentBonus, purchaseNumber) {
  const before = normalizedPercentPower(currentPower);
  const after = before + 1;
  const purchaseBonus = hasKnuthUpgrade('percent_purchase_bonus')
    ? percentPowerBonusForPurchase(purchaseNumber)
    : normalizedPercentPowerBonus(currentBonus);
  if (hasKnuthUpgrade('percent_overflow')) {
    const limit = percentPowerEffectiveLimit();
    const gainedOverflow = Math.max(0, after - limit) - Math.max(0, before - limit);
    if (gainedOverflow > 0) {
      knuthPercentOverflow = addBaseNumbers(knuthPercentOverflow, numberValueFromReal(gainedOverflow));
    }
  }
  return {
    power: after,
    purchaseBonus
  };
}

function percentPowerSoftcapBonusLevels() {
  return multiplyNumberValue(4 * squareBreakthroughLevel('overclock'), dysonEffectMultiplier());
}

function percentPowerPriceAccelerationBonusLevels() {
  return multiplyNumberValue(2 * squareBreakthroughLevel('bottleneck_tracker'), dysonEffectMultiplier());
}

function percentPowerPriceAccelerationStart() {
  if (percentPriceValidationCache?.start !== undefined) return percentPriceValidationCache.start;
  const baseStart = addBaseNumbers(8, percentPowerPriceAccelerationBonusLevels());
  const start = hasKnuthUpgrade('diverger_percent_price_delay')
    ? addBaseNumbers(baseStart, multiplyNumberValue(divergerPercentPriceShiftMilestones(), 1e10)) : baseStart;
  if (percentPriceValidationCache) percentPriceValidationCache.start = start;
  return start;
}

let percentPriceValidationCache = null;

function withPercentPriceValidationCache(operation) {
  if (percentPriceValidationCache !== null) return operation();
  percentPriceValidationCache = {};
  try {
    return operation();
  } finally {
    percentPriceValidationCache = null;
  }
}

function percentPowerSoftcapDecayPower() {
  // 소프트 캡 이후 생산량 감쇠의 기본 강도 K=2.
  // 기존 효율 개선 업그레이드는 감쇠를 한 단계 완화한다.
  return hasSquareUpgrade('percent_power_8') ? 1 : 2;
}

function percentEfficiencyMultiplierNumerator() {
  const bottleneckEfficiencyMultiplier = hasGeneralizationResearch('1-1') ? 2 : 1;
  return addBaseNumbers(4, multiplyNumberValue(
    bottleneckEfficiencyMultiplier * squareBreakthroughLevel('bottleneck_tracker'), dysonEffectMultiplier()
  ));
}

function percentEfficiencyMultiplier() {
  return NumberMath.divideApproximate(percentEfficiencyMultiplierNumerator(), 4);
}

function applyPercentEfficiency(gain) {
  return divideNumberValue(
    multiplyNumberValue(gain, percentBatchInvariant('efficiency', percentEfficiencyMultiplierNumerator)),
    4
  );
}

function percentPowerUpgradeCostForNextLevel(currentPower, baseCost = 40000) {
  const nextPower = normalizedPercentPower(currentPower) + 1;
  const standardExponent = nextPower - 2;
  const acceleratedLevels = subtractNumberValues(nextPower, percentPowerPriceAccelerationStart());
  const acceleratedExponent = NumberMath.divideApproximate(
    multiplyNumberValue(acceleratedLevels, addBaseNumbers(acceleratedLevels, 1)), 2
  );
  return multiplyNumberValue(baseCost, powerOfTenValue(addBaseNumbers(standardExponent, acceleratedExponent)));
}

function percentPowerSoftcap(power, purchaseBonus = 0) {
  const powerLevel = normalizedPercentPower(power) + normalizedPercentPowerBonus(purchaseBonus);
  return percentBatchInvariant(`softcap:${powerLevel}`, () => calculatePercentPowerSoftcap(powerLevel));
}

function calculatePercentPowerSoftcap(powerLevel) {
  const powerExponent = hasGeneralizationResearch('5-4')
    ? Math.pow(powerLevel, 1.5)
    : powerLevel;
  const bonusLevels = percentPowerSoftcapBonusLevels();
  const exponent = typeof bonusLevels === 'number' && Number.isFinite(powerExponent)
    ? powerExponent + bonusLevels - 1
    : subtractNumberValues(addBaseNumbers(powerExponent, bonusLevels), 1);
  const scale = hasGeneralizationResearch('5-4') || !Number.isSafeInteger(exponent)
    ? NumberMath.powerApproximate(10, exponent)
    : powerOfTenValue(exponent);
  const baseSoftcap = multiplyNumberValue(PERCENT_POWER_SOFTCAP_START, scale);
  let softcap = multiplyNumberValue(baseSoftcap, squareDimensionPercentSoftcapMultiplier());
  if (hasAbstractionResearch('6-2')) {
    const strength = 1 + 1.5 * abstractionLogRatio(squareDimensionTotalPower(), 100);
    softcap = NumberMath.powerApproximate(softcap, strength);
  }
  if (hasAbstractionResearch('5-3')) {
    const strength = 1 + 0.5 * abstractionLogRatio(squarePoints, 500, true);
    softcap = NumberMath.powerApproximate(softcap, strength);
  }
  softcap = multiplyNumberValue(softcap, knuthEquipmentPercentMultiplier());
  if (hasKnuthUpgrade('percent_softcap_square')) softcap = NumberMath.power(softcap, 2);
  if (isPositiveNumberValue(singularityPoints)) {
    softcap = multiplyNumberValue(softcap, singularitySoftcapMultiplier());
    if (hasAbstractionResearch('19-1')) {
      const { softcapPowerStrength, singularityScale } = ABSTRACTION_TIER19_BALANCE;
      const ratio = NumberMath.divideApproximate(singularityPoints, addBaseNumbers(singularityPoints, singularityScale));
      const power = addBaseNumbers(1, multiplyNumberValue(softcapPowerStrength, ratio));
      softcap = NumberMath.powerApproximate(softcap, power);
    }
  }
  return softcap;
}

function percentPowerGrowthLimit(power, purchaseBonus = 0) {
  // 기존 저장 데이터와 호출부 호환을 위해 이름은 유지하지만,
  // 현재 퍼센트 시스템의 실제 상한은 소프트캡 하나만 사용한다.
  return percentPowerSoftcap(power, purchaseBonus);
}

function applyPercentSoftcapToProduction(
  gain,
  currentValue = getBaseNumber(),
  softcapPower = percentPower,
  purchaseBonus = percentPowerPurchaseBonus
) {
  if (!percentUnlocked || compareNumberValues(gain, 0) <= 0) return gain;

  const softcap = percentPowerSoftcap(softcapPower, purchaseBonus);
  if (compareNumberValues(currentValue, softcap) <= 0) return gain;

  const currentLogarithm = numberLog10(currentValue);
  const softcapLogarithm = numberLog10(softcap);
  const gainLogarithm = numberLog10(gain);
  const strength = percentPowerSoftcapDecayPower();
  if (![currentLogarithm, softcapLogarithm, gainLogarithm].every(Number.isFinite)) {
    const multiplier = NumberMath.power(
      NumberMath.divideApproximate(softcap, currentValue),
      strength
    );
    return multiplyNumberValue(gain, multiplier);
  }

  const multiplierLogarithm = (softcapLogarithm - currentLogarithm) * strength;
  return numberValueFromLog10(gainLogarithm + multiplierLogarithm);
}

function finalNumberProductionGain(
  baseGain,
  finalMultiplier = 1,
  currentValue = getBaseNumber(),
  softcapPower = percentPower,
  purchaseBonus = percentPowerPurchaseBonus,
  finalExponent = 1,
  finalGainExponent = 1
) {
  const softenedGain = applyPercentSoftcapToProduction(
    baseGain,
    currentValue,
    softcapPower,
    purchaseBonus
  );
  const gain = multiplyNumberValue(softenedGain, finalMultiplier);
  const poweredGain = finalExponent === 1 ? gain : NumberMath.power(gain, finalExponent);
  return finalGainExponent === 1 ? poweredGain : NumberMath.power(poweredGain, finalGainExponent);
}

function percentChallengeProductionExponent() {
  return isKnuthChallengeActive('kc6') ? KC6_BALANCE.percentGainExponent : 1;
}

function percentProductionExponent() {
  return (hasAbstractionResearch('8-2') ? 4 : 1) * (hasKnuthUpgrade('percent_gain_square') ? 2 : 1)
    * knuthAdvancedPercentPower();
}

function percentPreExponentMultiplier(value) {
  const multiplier = multiplyNumberValue(abstractionNumberPercentMultiplier(value), knuthEquipmentPercentMultiplier());
  const researchExponent = hasAbstractionResearch('8-2') ? 4 : 1;
  const existing = researchExponent === 1
    ? multiplier
    : NumberMath.power(multiplier, 1 / researchExponent);
  // A singularity scales the final gain linearly, not once per production power.
  const withSingularities = isPositiveNumberValue(singularityPoints)
    ? multiplyNumberValue(existing, NumberMath.power(singularityPercentMultiplier(),
      1 / ((hasAbstractionResearch('8-2') ? 4 : 1) * (hasKnuthUpgrade('percent_gain_square') ? 2 : 1))))
    : existing;
  const randomMultiplier = percentBatchInvariant('final-extra-percent', percentFinalExtraMultiplier);
  // Cancel the later production exponent so this research multiplies the final gain exactly once.
  return compareNumberValues(randomMultiplier, 1) === 0 ? withSingularities
    : multiplyNumberValue(withSingularities, NumberMath.power(randomMultiplier, 1 / percentProductionExponent()));
}

function percentGain(value, power, purchaseBonus = 0) {
  let gain = divideNumberValue(
    multiplyNumberValue(value, numberValueFromReal(percentEffectivePower(power, purchaseBonus))),
    100
  );
  gain = multiplyNumberValue(applyPercentEfficiency(gain), percentBatchInvariant('dimensions', squareDimensionNumberMultiplier));
  return multiplyNumberValue(
    gain,
    percentBatchInvariant('abstraction', abstractionPercentGainMultiplier)
  );
}

function percentUseGain(value, power, purchaseBonus = 0) {
  return percentGain(value, power, purchaseBonus);
}

function applyPercentUse(value, power, source, purchaseBonus = 0) {
  const gain = percentProductionBaseGain(value, power, purchaseBonus);
  if (!isPositiveNumberValue(gain)) return 0;
  if (typeof recordAchievementPercentUse === 'function') recordAchievementPercentUse();
  addToBaseNumber(gain, source, power, purchaseBonus, percentExpansionFinalMultiplier(value),
    percentProductionExponent(), percentChallengeProductionExponent());
  return gain;
}

function percentProductionBaseGain(value, power, purchaseBonus = 0) {
  return spaceExpansionActive
    ? divideNumberValue(multiplyNumberValue(value, numberValueFromReal(percentEffectivePower(power, purchaseBonus))), 100)
    : percentUseGain(value, power, purchaseBonus);
}

function percentExpansionFinalMultiplier(value) {
  const multiplier = percentPreExponentMultiplier(value);
  if (!spaceExpansionActive) return multiplier;
  // Build the aggregate directly: cancelling enormous old/new boosts can lose the new exponent.
  const baseMultiplier = multiplyNumberValue(percentEfficiencyMultiplier(), multiplyNumberValue(
    percentBatchInvariant('dimensions', squareDimensionNumberMultiplier),
    percentBatchInvariant('abstraction', abstractionPercentGainMultiplier)));
  return spaceExpansionMultiplier(multiplyNumberValue(baseMultiplier, multiplier));
}

const PERCENT_USE_BULK_EXACT_LIMIT = 64;
const PERCENT_USE_BULK_SAMPLE_COUNT = 32;

let percentBatchCalculationCache = null;

function percentBatchInvariant(key, calculate) {
  if (percentBatchCalculationCache === null) return calculate();
  if (!percentBatchCalculationCache.has(key)) percentBatchCalculationCache.set(key, calculate());
  return percentBatchCalculationCache.get(key);
}

// Only synchronous production shares this snapshot; no state survives a tick.
function withPercentProductionCache(operation) {
  if (percentBatchCalculationCache !== null) return operation();
  percentBatchCalculationCache = new Map();
  try {
    return operation();
  } finally {
    percentBatchCalculationCache = null;
  }
}

function percentFinalUseGain(value, power, purchaseBonus = 0) {
  const exponent = percentProductionExponent();
  const softcap = percentPowerSoftcap(power, purchaseBonus);
  if (!spaceExpansionActive && percentPowerSoftcapDecayPower() === 1
    && isApproximateNumber(value) && isApproximateNumber(softcap)
    && typeof value.exponent === 'number' && value.exponent <= 1e9
    && typeof softcap.exponent === 'number'
    && compareNumberValues(value, softcap) >= 0) {
    // At K=1, (Number * rate) * (softcap / Number) = softcap * rate.
    // Keep the legacy path beyond the scalar range verified for cancellation error.
    // Cache only this constant; the 9-2 reward still follows the current Number.
    const constantGain = percentBatchInvariant(`final-gain:${normalizedPercentPower(power)}:${normalizedPercentPowerBonus(purchaseBonus)}:${exponent}`, () => {
      const gain = percentUseGain(softcap, power, purchaseBonus);
      return exponent === 1 ? gain : NumberMath.power(gain, exponent);
    });
    const multiplier = multiplyNumberValue(abstractionNumberPercentMultiplier(value), knuthEquipmentPercentMultiplier());
    const multiplierPower = (hasKnuthUpgrade('percent_gain_square') ? 2 : 1) * knuthAdvancedPercentPower();
    const finalGain = multiplyNumberValue(constantGain,
      multiplierPower === 1 ? multiplier : NumberMath.power(multiplier, multiplierPower));
    const advancedPower = knuthAdvancedPercentPower();
    const withSingularities = isPositiveNumberValue(singularityPoints)
      ? multiplyNumberValue(finalGain, advancedPower === 1 ? singularityPercentMultiplier()
        : NumberMath.power(singularityPercentMultiplier(), advancedPower)) : finalGain;
    const finalProduction = multiplyNumberValue(withSingularities,
      percentBatchInvariant('final-extra-percent', percentFinalExtraMultiplier));
    const challengeExponent = percentChallengeProductionExponent();
    return challengeExponent === 1 ? finalProduction : NumberMath.power(finalProduction, challengeExponent);
  }
  const gain = percentProductionBaseGain(value, power, purchaseBonus);
  return finalNumberProductionGain(
    gain,
    percentExpansionFinalMultiplier(value),
    value,
    power,
    purchaseBonus,
    exponent,
    percentChallengeProductionExponent()
  );
}

function percentUseValueAfterOne(value, power, purchaseBonus = 0) {
  const gain = percentFinalUseGain(value, power, purchaseBonus);
  return isPositiveNumberValue(gain) ? addBaseNumbers(value, gain) : value;
}

function percentUseValueFromLog10(logarithm) {
  if (NumberMath.isScientific(logarithm)) return NumberMath.powerOfTen(logarithm);
  if (Number.isNaN(logarithm)) return 0;
  if (logarithm === Infinity) return NumberMath.normalizeValue(1, Number.MAX_VALUE);
  return numberValueFromLog10(Math.min(Number.MAX_VALUE, logarithm));
}

function percentUseGainRatio(power, purchaseBonus = 0) {
  const ratio = NumberMath.divideApproximate(multiplyNumberValue(
    percentEffectivePower(power, purchaseBonus), percentBatchInvariant('efficiency', percentEfficiencyMultiplierNumerator)
  ), 400);
  const existing = multiplyNumberValue(
    multiplyNumberValue(
      ratio,
      percentBatchInvariant('dimensions', squareDimensionNumberMultiplier)
    ),
    multiplyNumberValue(percentBatchInvariant('abstraction', abstractionPercentGainMultiplier), knuthEquipmentPercentMultiplier())
  );
  const withSingularities = isPositiveNumberValue(singularityPoints)
    ? multiplyNumberValue(existing, singularityPercentMultiplier()) : existing;
  const total = multiplyNumberValue(withSingularities,
    percentBatchInvariant('final-extra-percent', percentFinalExtraMultiplier));
  if (!spaceExpansionActive) return total;
  const baseRatio = numberValueFromReal(percentEffectivePower(power, purchaseBonus) / 100);
  return multiplyNumberValue(baseRatio, spaceExpansionMultiplier(NumberMath.divideApproximate(total, baseRatio)));
}

function percentUsesWithPoweredGain(value, power, uses, purchaseBonus) {
  if (!hasAbstractionResearch('9-2')) {
    return percentUsesWithPoweredGainSegment(value, power, uses, purchaseBonus);
  }
  // Re-evaluate the slowly growing number multiplier within huge accelerated batches.
  const segments = Math.min(PERCENT_USE_BULK_SAMPLE_COUNT, Math.ceil(uses));
  const segmentUses = NumberMath.divideApproximate(uses, segments);
  for (let index = 0; index < segments; index++) {
    const next = percentUsesWithPoweredGainSegment(value, power, segmentUses, purchaseBonus);
    if (compareNumberValues(next, value) === 0) return value;
    value = next;
  }
  return value;
}

function percentUsesWithPoweredGainSegment(value, power, uses, purchaseBonus) {
  const exponent = percentProductionExponent() * percentChallengeProductionExponent();
  const softcap = percentPowerSoftcap(power, purchaseBonus);
  const gainAt = current => percentFinalUseGain(current, power, purchaseBonus);

  // Integrate the same powered per-use gain after the exact batch warmup.
  if (compareNumberValues(value, softcap) < 0) {
    const gain = gainAt(value);
    if (!isPositiveNumberValue(gain)) return value;
    if (exponent === 1) {
      const ratio = NumberMath.divideApproximate(gain, value);
      const growthLog = compareNumberValues(ratio, 1e-8) < 0
        ? multiplyNumberValue(ratio, Math.LOG10E)
        : NumberMath.log10(addBaseNumbers(1, ratio));
      const usesToSoftcap = NumberMath.divideApproximate(
        NumberMath.log10(NumberMath.divideApproximate(softcap, value)), growthLog
      );
      if (compareNumberValues(uses, usesToSoftcap) < 0) {
        return multiplyNumberValue(value, NumberMath.powerOfTen(multiplyNumberValue(growthLog, uses)));
      }
      uses = subtractNumberValues(uses, usesToSoftcap);
      value = softcap;
    } else if (exponent < 1) {
      // A fractional final power grows sublinearly; integrate without negative operands.
      const integrationPower = 1 - exponent;
      const distance = subtractNumberValues(NumberMath.power(
        NumberMath.divideApproximate(softcap, value), integrationPower
      ), 1);
      const scale = NumberMath.divideApproximate(value, multiplyNumberValue(gain, integrationPower));
      const usesToSoftcap = multiplyNumberValue(scale, distance);
      if (compareNumberValues(uses, usesToSoftcap) < 0) {
        const growth = NumberMath.divideApproximate(uses, scale);
        return multiplyNumberValue(value, NumberMath.power(addBaseNumbers(1, growth), 1 / integrationPower));
      }
      uses = subtractNumberValues(uses, usesToSoftcap);
      value = softcap;
    } else {
      const timeScale = NumberMath.divideApproximate(value, multiplyNumberValue(gain, exponent - 1));
      const distance = subtractNumberValues(1, NumberMath.power(
        NumberMath.divideApproximate(value, softcap), exponent - 1
      ));
      const usesToSoftcap = multiplyNumberValue(timeScale, distance);
      if (compareNumberValues(uses, usesToSoftcap) < 0) {
        const remainder = NumberMath.max(Number.MIN_VALUE, subtractNumberValues(
          1, NumberMath.divideApproximate(uses, timeScale)
        ));
        return multiplyNumberValue(value, NumberMath.power(remainder, -1 / (exponent - 1)));
      }
      uses = subtractNumberValues(uses, usesToSoftcap);
      value = softcap;
    }
  }

  const gain = gainAt(value);
  if (percentPowerSoftcapDecayPower() === 1) {
    return addBaseNumbers(value, multiplyNumberValue(gain, uses));
  }
  const integrationPower = exponent + 1;
  const growth = multiplyNumberValue(
    NumberMath.divideApproximate(gain, value),
    multiplyNumberValue(integrationPower, uses)
  );
  return multiplyNumberValue(value, NumberMath.power(addBaseNumbers(1, growth), 1 / integrationPower));
}

function percentUsesWithoutExponentiation(value, power, uses, purchaseBonus = 0) {
  if (percentProductionExponent() * percentChallengeProductionExponent() !== 1 || hasAbstractionResearch('9-2')) {
    return percentUsesWithPoweredGain(value, power, uses, purchaseBonus);
  }
  let remaining = uses;
  const ratio = percentUseGainRatio(power, purchaseBonus);
  if (!isPositiveNumberValue(ratio)) return value;

  const softcap = percentPowerSoftcap(power, purchaseBonus);
  if (compareNumberValues(value, softcap) < 0) {
    const base = addBaseNumbers(1, ratio);
    const growthLog = numberLog10(base);
    const currentLog = numberLog10(value);
    const softcapLog = numberLog10(softcap);
    if (growthLog > 0 && currentLog > 0 && softcapLog > currentLog) {
      const usesToSoftcap = growthLog === Infinity
        ? 1
        : Math.ceil((softcapLog - currentLog) / growthLog);
      if (!Number.isFinite(usesToSoftcap) || remaining < usesToSoftcap) {
        return multiplyNumberValue(value, NumberMath.power(base, remaining));
      }
      value = multiplyNumberValue(value, NumberMath.power(base, usesToSoftcap));
      remaining = Math.max(0, remaining - usesToSoftcap);
    } else if (!Number.isFinite(currentLog) || !Number.isFinite(softcapLog)) {
      const currentLogValue = NumberMath.log10(value);
      const softcapLogValue = NumberMath.log10(softcap);
      const logGrowth = NumberMath.log10(base);
      if (compareNumberValues(currentLogValue, 0) > 0
        && compareNumberValues(softcapLogValue, currentLogValue) > 0
        && isPositiveNumberValue(logGrowth)) {
        const logDistance = NumberMath.divideApproximate(softcapLogValue, currentLogValue);
        const useCountValue = NumberMath.divideApproximate(
          NumberMath.log10(logDistance),
          logGrowth
        );
        const usesToSoftcap = Math.max(1, Math.ceil(NumberMath.toNumber(useCountValue)));
        if (!Number.isFinite(usesToSoftcap) || remaining < usesToSoftcap) {
          return multiplyNumberValue(value, NumberMath.power(base, remaining));
        }
        value = multiplyNumberValue(value, NumberMath.power(base, usesToSoftcap));
        remaining = Math.max(0, remaining - usesToSoftcap);
      }
    }
  }

  if (remaining <= 0) return value;
  if (percentPowerSoftcapDecayPower() === 1) {
    return addBaseNumbers(
      value,
      multiplyNumberValue(multiplyNumberValue(softcap, ratio), numberValueFromReal(remaining))
    );
  }

  const warmup = Math.min(PERCENT_USE_BULK_EXACT_LIMIT, remaining);
  for (let index = 0; index < warmup; index++) {
    const next = percentUseValueAfterOne(value, power, purchaseBonus);
    if (compareNumberValues(next, value) <= 0) return value;
    value = next;
  }
  remaining -= warmup;
  if (remaining <= 0) return value;

  const valueLog = numberLog10(value);
  const softcapLog = numberLog10(softcap);
  const normalizedValue = Number.isFinite(valueLog) && Number.isFinite(softcapLog)
    ? NumberMath.powerApproximate(10, valueLog - softcapLog)
    : NumberMath.divideApproximate(value, softcap);
  const normalizedSquared = NumberMath.power(normalizedValue, 2);
  const squaredGrowth = multiplyNumberValue(
    multiplyNumberValue(ratio, 2),
    numberValueFromReal(remaining)
  );
  const nextNormalized = NumberMath.power(
    addBaseNumbers(normalizedSquared, squaredGrowth),
    0.5
  );
  return multiplyNumberValue(softcap, nextNormalized);
}

function applyPercentUsesBatch(power, uses, source, purchaseBonus = 0) {
  return withPercentProductionCache(() => calculatePercentUsesBatch(power, uses, source, purchaseBonus));
}

function calculatePercentUsesBatch(power, uses, source, purchaseBonus = 0) {
  const count = Number.isFinite(uses) ? Math.max(0, Math.floor(uses)) : Number.MAX_VALUE;
  if (count <= 0) return false;

  const before = getBaseNumber();
  if (!isPositiveNumberValue(percentUseGain(before, power, purchaseBonus))) return false;
  if (typeof recordAchievementPercentUse === 'function') recordAchievementPercentUse();

  let value = before;
  const exactSteps = Math.min(count, PERCENT_USE_BULK_EXACT_LIMIT);
  for (let index = 0; index < exactSteps; index++) {
    const next = percentUseValueAfterOne(value, power, purchaseBonus);
    if (compareNumberValues(next, value) <= 0) break;
    value = next;
  }

  const remaining = Math.max(0, count - exactSteps);
  if (remaining > 0) {
    value = percentUsesWithoutExponentiation(value, power, remaining, purchaseBonus);
  }

  if (compareNumberValues(value, before) > 0) {
    setBaseNumber(value);
  }
  if (numberTraceEnabled) {
    if (compareNumberValues(value, before) > 0) {
      traceNumberEvent('number-change', {
        source: `${source}-bulk`,
        before: numberTraceValue(before),
        gain: numberTraceValue(subtractNumberValues(value, before)),
        after: numberTraceValue(value)
      });
    }
    traceNumberEvent('percent-use-batch-complete', {
      source,
      uses: String(count),
      number: numberTraceValue(value)
    });
  }
  return true;
}

function percentPowerSoftcapStatus(power, purchaseBonus, value = getBaseNumber()) {
  if (purchaseBonus === undefined) {
    purchaseBonus = power === percentPower ? percentPowerPurchaseBonus : 0;
  }
  const softcap = percentPowerSoftcap(power, purchaseBonus);
  const state = compareNumberValues(value, softcap) >= 0
    ? '감쇠 중'
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
  const hasSpeedUpgrade = hasSquareUpgrade('game_speed_1_5');
  let tick = hasSpeedUpgrade ? Math.floor(ms * 1.5) : ms;
  const initialTick = tick;
  let dysonTimeFactor = null;
  let squareBlackHoleFactor = 1;
  if (hasSquareBreakthrough('black_hole')) {
    dysonTimeFactor = dysonEffectMultiplier();
    squareBlackHoleFactor = abstractionBlackHoleTimeMultiplier();
    tick = Math.floor(tick * 2 * NumberMath.toNumber(dysonTimeFactor) * squareBlackHoleFactor);
  }
  const hasTimium = hasSquareConvergenceUpgrade('timium');
  if (hasTimium) tick *= 2048;
  if (numberBlackHoleSystemEnabled && knuthUnlocked && !isKnuthChallengeActive('kc5') && ms > 0) {
    const limit = numberBlackHoleTimeLimit();
    const blackHoleFactor = numberBlackHoleTimeMultiplier();
    const existingMultiplier = tick / ms;
    const allowedMultiplier = limit
      / Math.max(existingMultiplier, Number.MIN_VALUE);
    const acceleratedTick = tick * Math.min(blackHoleFactor, allowedMultiplier);
    if (Number.isFinite(acceleratedTick)) {
      tick = Math.floor(acceleratedTick);
    } else {
      // Cap in big-number space before conversion: Infinity * 0 would erase the clock.
      let exactTick = Number.isFinite(initialTick) ? numberValueFromReal(initialTick)
        : NumberMath.floor(multiplyNumberValue(numberValueFromReal(ms), hasSpeedUpgrade ? 1.5 : 1));
      if (dysonTimeFactor !== null) exactTick = NumberMath.floor(multiplyNumberValue(
        multiplyNumberValue(multiplyNumberValue(exactTick, 2), dysonTimeFactor), squareBlackHoleFactor));
      if (hasTimium) exactTick = multiplyNumberValue(exactTick, 2048);
      const boundedTick = NumberMath.min(multiplyNumberValue(exactTick, blackHoleFactor),
        multiplyNumberValue(numberValueFromReal(ms), limit));
      tick = NumberMath.toNumber(NumberMath.min(Number.MAX_VALUE, NumberMath.floor(boundedTick)));
    }
  }
  return isKnuthChallengeActive('kc4') && tick > 0
    ? Math.max(Number.MIN_VALUE, tick * kc4TimeMultiplier())
    : tick;
}

function advanceSquareRunTime(elapsedRealMs) {
  const squareProgressAvailable = squareUnlocked || hasKnuthUpgrade('permanent_production');
  if (!squareProgressAvailable || !Number.isFinite(elapsedRealMs) || elapsedRealMs <= 0) return false;
  const elapsedGameSeconds = gameTick(elapsedRealMs) / 1000;
  if (!(elapsedGameSeconds > 0)) return false;
  const elapsed = numberValueFromReal(elapsedGameSeconds);
  const extraRate = 1 + abstractionTimeRecoveryRate();
  squareRunGameSeconds = addBaseNumbers(squareRunGameSeconds, multiplyNumberValue(elapsed, extraRate));
  return true;
}

function advanceSquarePrestigeCycleTime(elapsedRealMs) {
  const squareProgressAvailable = squareUnlocked || hasKnuthUpgrade('permanent_production');
  if (!squareProgressAvailable || !Number.isFinite(elapsedRealMs) || elapsedRealMs <= 0) return false;
  const elapsedGameSeconds = gameTick(elapsedRealMs) / 1000;
  if (!(elapsedGameSeconds > 0)) return false;
  squareSincePrestigeGameSeconds = addBaseNumbers(
    squareSincePrestigeGameSeconds,
    numberValueFromReal(elapsedGameSeconds)
  );
  return true;
}

function resetSquarePrestigeCycleTime() {
  squareSincePrestigeGameSeconds = 0;
}

function gameEndValue() {
  return LONG_MAX;
}

function discountedCost(cost) {
  let discounted = cost;
  if (hasSquareBreakthrough('deflation')) {
    discounted = compareNumberValues(discounted, 1) <= 0
      ? discounted
      : ceilDiv(discounted, 10);
  }
  if (hasSquareUpgrade('all_cost_half')) {
    discounted = compareNumberValues(discounted, 1) <= 0
      ? discounted
      : ceilDiv(discounted, 2);
  }
  return discounted;
}

const PERCENT_PRICE_DISCOUNT_MAX = 0.9;
const PERCENT_COUNT_DISCOUNT_MAX = 0.5;
const PERCENT_TOTAL_PRICE_DISCOUNT_MAX = 0.9;
const PERCENT_TOTAL_PRICE_GROWTH_RETENTION_MIN = 0.1;
const PERCENT_COUNT_DISCOUNT_TARGET = 2000;
const PERCENT_TIME_DISCOUNT_TARGET_SECONDS = 300;

function percentDiscountSaturation(progress) {
  const normalized = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  return 1 - Math.pow(20, -normalized);
}

function percentPowerPriceDiscountRate(purchaseCount = percentPowerPurchaseCount) {
  let countDiscount = 0;
  if (hasKnuthUpgrade('percent_count_discount')) {
    countDiscount = PERCENT_COUNT_DISCOUNT_MAX * percentDiscountSaturation(
      Math.max(0, Number(purchaseCount)) / PERCENT_COUNT_DISCOUNT_TARGET
    );
  }

  let timeDiscount = 0;
  if (hasKnuthUpgrade('percent_time_discount')) {
    const target = PERCENT_TIME_DISCOUNT_TARGET_SECONDS;
    const effectiveTime = abstractionEffectiveTime();
    const timeProgress = compareNumberValues(effectiveTime, target) >= 0
      ? 1
      : Math.max(0, realNumberFromValue(effectiveTime)) / target;
    timeDiscount = PERCENT_PRICE_DISCOUNT_MAX * percentDiscountSaturation(timeProgress);
  }

  return Math.min(
    PERCENT_TOTAL_PRICE_DISCOUNT_MAX,
    1 - ((1 - countDiscount) * (1 - timeDiscount) * (1 - abstractionCurrencyPriceDiscountRate()))
  );
}

function percentPowerPriceGrowthRetention(purchaseCount = percentPowerPurchaseCount) {
  return Math.max(
    PERCENT_TOTAL_PRICE_GROWTH_RETENTION_MIN,
    1 - percentPowerPriceDiscountRate(purchaseCount)
  );
}

function applyPercentPowerPriceDiscount(cost, purchaseCount) {
  const discountRate = percentPowerPriceDiscountRate(purchaseCount);
  if (discountRate <= 0) return cost;
  if (compareNumberValues(cost, 1) <= 0) return cost;
  const discountedExponent = multiplyNumberValue(
    NumberMath.log10(cost),
    percentPowerPriceGrowthRetention(purchaseCount)
  );
  return NumberMath.powerOfTen(discountedExponent);
}

function percentPowerCostStep(currentCost, purchaseCount = percentPowerPurchaseCount) {
  const growthRetention = percentPowerPriceGrowthRetention(purchaseCount);
  return hasGeneralizationResearch('3-3')
    ? multiplyNumberValue(currentCost, powerOfTenValue(1000 * growthRetention))
    : NumberMath.power(currentCost, 1 + (0.5 * growthRetention));
}

function percentPowerCostStateIsValid(cost, compounding) {
  if (!isPositiveNumberValue(cost) || compareNumberValues(cost, 1) <= 0) return false;
  return !compounding || compareNumberValues(cost, powerOfTenValue(500)) >= 0;
}

const percentPowerCompoundingStartCache = new Map();
const PERCENT_COMPOUNDING_CACHE_LIMIT = MAX_PERCENT_LANES * 4;

function firstPercentPowerCompoundingPurchase(purchaseCount, baseCost) {
  const threshold = powerOfTenValue(500);
  const maximumCount = Math.max(0, Math.floor(Number(purchaseCount) || 0));
  const cacheKey = [
    NumberMath.serialize(baseCost),
    NumberMath.serialize(percentPowerPriceAccelerationStart()),
    hasSquareBreakthrough('deflation'),
    hasSquareUpgrade('all_cost_half')
  ].join('|');
  const cachedStart = percentPowerCompoundingStartCache.get(cacheKey);
  if (cachedStart !== undefined) return cachedStart <= maximumCount ? cachedStart : null;

  const maximumCost = discountedCost(
    percentPowerUpgradeCostForNextLevel(1 + maximumCount, baseCost)
  );
  if (compareNumberValues(maximumCost, threshold) < 0) return null;

  let low = 0;
  let high = maximumCount;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    const candidateCost = discountedCost(
      percentPowerUpgradeCostForNextLevel(1 + middle, baseCost)
    );
    if (compareNumberValues(candidateCost, threshold) >= 0) high = middle;
    else low = middle + 1;
  }
  percentPowerCompoundingStartCache.set(cacheKey, low);
  if (percentPowerCompoundingStartCache.size > PERCENT_COMPOUNDING_CACHE_LIMIT) {
    percentPowerCompoundingStartCache.delete(percentPowerCompoundingStartCache.keys().next().value);
  }
  return low;
}

function minimumPercentPowerCompoundingCost(purchaseCount, baseCost = 40000) {
  const count = Number.isSafeInteger(Number(purchaseCount)) && Number(purchaseCount) >= 0
    ? Number(purchaseCount)
    : 0;
  const firstCompoundingPurchase = firstPercentPowerCompoundingPurchase(count, baseCost);
  if (firstCompoundingPurchase === null) return null;

  const compoundingSteps = count - firstCompoundingPurchase + 1;
  return powerOfTenValue(percentPowerCompoundingLogarithm(compoundingSteps, hasGeneralizationResearch('3-3')));
}

function percentPowerCompoundingLogarithm(compoundingSteps, additiveGrowth) {
  if (additiveGrowth) {
    // A quadratic log-price floor eventually outgrows the P^1.5 softcap,
    // even with 90% discounts. Anchor it after the existing surge threshold.
    return addBaseNumbers(500, multiplyNumberValue(
      compoundingSteps,
      addBaseNumbers(999, compoundingSteps)
    ));
  }

  return multiplyNumberValue(
    500,
    NumberMath.power(1.005, compoundingSteps)
  );
}

function normalizePercentPowerCostState(cost, compounding, purchaseCount, baseCost = 40000) {
  if (percentPowerCostStateIsValid(cost, compounding)) {
    if (compounding) {
      const minimumCost = minimumPercentPowerCompoundingCost(purchaseCount, baseCost);
      if (minimumCost !== null) {
        return {
          cost: compareNumberValues(cost, minimumCost) >= 0 ? cost : minimumCost,
          compounding: true
        };
      }
    } else {
      const count = Number.isSafeInteger(Number(purchaseCount)) && Number(purchaseCount) >= 0
        ? Number(purchaseCount)
        : 0;
      const expectedUncompoundedCost = percentPowerUpgradeCostForNextLevel(1 + count, baseCost);
      if (compareNumberValues(cost, expectedUncompoundedCost) >= 0) {
        return { cost, compounding };
      }
    }
  }
  return restoredPercentPowerCost(cost, compounding, purchaseCount, baseCost);
}

function repairPercentPowerCostState() {
  const progress = reconcilePercentPowerProgress(percentPower, percentPowerPurchaseCount);
  percentPower = progress.power;
  percentPowerPurchaseCount = progress.purchaseCount;

  const repaired = normalizePercentPowerCostState(
    percentPowerUpgradeCost,
    percentPowerCostCompounding,
    percentPowerPurchaseCount,
    40000
  );
  percentPowerUpgradeCost = repaired.cost;
  percentPowerCostCompounding = repaired.compounding;
  return repaired;
}

function percentPowerBaseCost(
  cost,
  compounding = false,
  purchaseCount = percentPowerPurchaseCount,
  baseCost = 40000
) {
  const normalized = normalizePercentPowerCostState(cost, compounding, purchaseCount, baseCost);
  if (normalized.compounding) return normalized.cost;
  const adjustedCost = discountedCost(normalized.cost);
  const threshold = powerOfTenValue(500);
  return compareNumberValues(adjustedCost, threshold) >= 0
    ? percentPowerCostStep(adjustedCost, purchaseCount)
    : adjustedCost;
}

function percentPowerCost(
  cost,
  compounding = false,
  purchaseCount = percentPowerPurchaseCount,
  baseCost = 40000
) {
  const effectiveBaseCost = percentPowerBaseCost(cost, compounding, purchaseCount, baseCost);
  return applyPercentPowerPriceDiscount(effectiveBaseCost, purchaseCount + 1);
}

function percentPowerCostAvailable(cost) {
  return isPositiveNumberValue(cost);
}

function nextCompoundingPercentPowerCost(currentCost, purchaseCount = percentPowerPurchaseCount) {
  return percentPowerCostStep(currentCost, purchaseCount);
}

function restoredPercentPowerCost(savedCost, savedCompounding, purchaseCount, baseCost) {
  if (savedCompounding
    && isPositiveNumberValue(savedCost)
    && compareNumberValues(savedCost, powerOfTenValue(500)) >= 0) {
    const minimumCost = minimumPercentPowerCompoundingCost(purchaseCount, baseCost);
    if (minimumCost !== null) {
      return {
        cost: compareNumberValues(savedCost, minimumCost) >= 0 ? savedCost : minimumCost,
        compounding: true
      };
    }
  }

  const rawCost = percentPowerUpgradeCostForNextLevel(1 + purchaseCount, baseCost);
  const adjustedCost = discountedCost(rawCost);
  const compounding = compareNumberValues(adjustedCost, powerOfTenValue(500)) >= 0;
  let cost = compounding
    ? nextCompoundingPercentPowerCost(adjustedCost, purchaseCount)
    : rawCost;
  if (compounding) {
    const minimumCost = minimumPercentPowerCompoundingCost(purchaseCount, baseCost);
    if (minimumCost !== null) cost = minimumCost;
  }
  return {
    cost,
    compounding
  };
}

function updatePercentPowerCostAfterPurchase() {
  repairPercentPowerCostState();
  const currentCost = percentPowerBaseCost(
    percentPowerUpgradeCost,
    percentPowerCostCompounding,
    percentPowerPurchaseCount
  );
  const purchaseNumber = percentPowerPurchaseCount + 1;
  const purchase = grantPercentPower(percentPower, percentPowerPurchaseBonus, purchaseNumber);
  percentPower = purchase.power;
  percentPowerPurchaseBonus = purchase.purchaseBonus;
  percentPowerPurchaseCount = purchaseNumber;

  if (percentPowerCostCompounding || compareNumberValues(currentCost, powerOfTenValue(500)) >= 0) {
    percentPowerCostCompounding = true;
    percentPowerUpgradeCost = nextCompoundingPercentPowerCost(currentCost, purchaseNumber);
    return;
  }

  const nextRawCost = percentPowerUpgradeCostForNextLevel(1 + percentPowerPurchaseCount);
  const nextAdjustedCost = discountedCost(nextRawCost);
  if (compareNumberValues(nextAdjustedCost, powerOfTenValue(500)) >= 0) {
    percentPowerCostCompounding = true;
    percentPowerUpgradeCost = nextCompoundingPercentPowerCost(nextAdjustedCost, purchaseNumber);
  } else {
    percentPowerUpgradeCost = nextRawCost;
  }
}

function percentPowerBulkPriceModel(cost, compounding, purchaseCount, baseCost) {
  const normalized = normalizePercentPowerCostState(cost, compounding, purchaseCount, baseCost);
  if (!normalized.compounding) return null;

  const retention = percentPowerPriceGrowthRetention(purchaseCount + 1);
  const constantRetention = !hasKnuthUpgrade('percent_count_discount')
    || retention === percentPowerPriceGrowthRetention(Number.MAX_SAFE_INTEGER);
  const additiveGrowth = hasGeneralizationResearch('3-3');
  const floor = minimumPercentPowerCompoundingCost(purchaseCount, baseCost);
  if (floor === null) return null;
  const onFloor = floor !== null && compareNumberValues(normalized.cost, floor) === 0;
  if (!constantRetention && !(additiveGrowth && onFloor)) return null;

  const initialLog = NumberMath.log10(normalized.cost);
  const firstCompoundingPurchase = firstPercentPowerCompoundingPurchase(purchaseCount, baseCost);
  const floorAt = offset => powerOfTenValue(percentPowerCompoundingLogarithm(
    purchaseCount + offset - firstCompoundingPurchase + 1, additiveGrowth
  ));
  const rawCostAt = offset => {
    if (offset === 0) return normalized.cost;
    if (additiveGrowth && onFloor) {
      return floorAt(offset);
    }
    const logarithm = additiveGrowth
      ? addBaseNumbers(initialLog, multiplyNumberValue(1000 * retention, offset))
      : multiplyNumberValue(initialLog, NumberMath.power(1 + 0.5 * retention, offset));
    const projected = powerOfTenValue(logarithm);
    return additiveGrowth
      ? NumberMath.max(projected, floorAt(offset))
      : projected;
  };
  const prices = new Map();

  // The quadratic floor grows faster than the additive recurrence, even as
  // the count discount saturates. Other histories require constant retention.
  return {
    priceAt: offset => {
      if (!prices.has(offset)) {
        prices.set(offset, applyPercentPowerPriceDiscount(rawCostAt(offset), purchaseCount + offset + 1));
      }
      return prices.get(offset);
    },
    nextCost: purchases => nextCompoundingPercentPowerCost(
      rawCostAt(purchases - 1), purchaseCount + purchases
    )
  };
}

function percentPowerBulkBalanceAfter(model, purchases, balance, deadline) {
  const lastPrice = model.priceAt(purchases - 1);
  if (!percentPowerCostAvailable(lastPrice)) return null;
  if (compareNumberValues(balance, lastPrice) < 0) return { affordable: false };

  const tail = [];
  // Skip only costs that the existing per-purchase subtraction would ignore.
  // Keep the significant tail in chronological order, including boundary costs.
  for (let offset = purchases - 1; offset >= 0; offset--) {
    if (gameClockNowMs() >= deadline) return null;
    const price = offset === purchases - 1 ? lastPrice : model.priceAt(offset);
    const after = NumberMath.subtract(balance, price, { ignoreGap: APPROXIMATE_COST_IGNORE_EXPONENT_GAP });
    if (compareNumberValues(after, balance) === 0) break;
    tail.push(price);
    if (offset > 0 && tail.length >= 16) return null;
  }
  let remaining = balance;
  for (let index = tail.length - 1; index >= 0; index--) {
    if (compareNumberValues(remaining, tail[index]) < 0) return { affordable: false };
    remaining = NumberMath.subtract(remaining, tail[index], { ignoreGap: APPROXIMATE_COST_IGNORE_EXPONENT_GAP });
  }
  return { affordable: true, balance: remaining };
}

function planPercentPowerBulkPurchase(model, limit, deadline, balance = getBaseNumber()) {
  let low = 0;
  let high = 1;
  let remaining = balance;
  while (gameClockNowMs() < deadline) {
    const quote = percentPowerBulkBalanceAfter(model, high, balance, deadline);
    if (quote === null) return low > 0 ? { purchased: low, balance: remaining } : null;
    if (!quote.affordable) break;
    low = high;
    remaining = quote.balance;
    if (high === limit) return { purchased: low, balance: remaining };
    high = Math.min(limit, high * 2);
  }
  while (low + 1 < high && gameClockNowMs() < deadline) {
    const middle = low + Math.floor((high - low) / 2);
    const quote = percentPowerBulkBalanceAfter(model, middle, balance, deadline);
    if (quote === null) break;
    if (quote.affordable) {
      low = middle;
      remaining = quote.balance;
    } else high = middle;
  }
  return { purchased: low, balance: remaining };
}

function grantPercentPowerBatch(currentPower, currentBonus, purchaseCount, purchases) {
  const before = normalizedPercentPower(currentPower);
  const after = before + purchases;
  if (hasKnuthUpgrade('percent_overflow')) {
    const limit = percentPowerEffectiveLimit();
    const overflow = Math.max(0, after - limit) - Math.max(0, before - limit);
    knuthPercentOverflow = addBaseNumbers(knuthPercentOverflow, numberValueFromReal(overflow));
  }
  return {
    power: after,
    purchaseBonus: hasKnuthUpgrade('percent_purchase_bonus')
      ? percentPowerBonusForPurchase(purchaseCount + purchases)
      : normalizedPercentPowerBonus(currentBonus)
  };
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
  let cost = 200000;
  for (let index = 1; index < count; index++) {
    cost = multiplyNumberValue(cost, 2);
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
  return affectedNumberMultiplierValue(1.5, squareBreakthroughLevel('invisible_hand'));
}

function autoUpgradeElapsedTime(elapsedGameMs, maximum = Number.MAX_VALUE) {
  if (!(elapsedGameMs > 0)) return 0;
  if (!Number.isFinite(elapsedGameMs)) return maximum;
  // Only the scheduler's bounded work budget is converted back to a JS number.
  return NumberMath.toNumber(NumberMath.min(maximum,
    multiplyNumberValue(elapsedGameMs, autoUpgradeSpeedMultiplier())));
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
  divergerInterval = Math.max(DIVERGER_MIN_INTERVAL, divergerInterval);
  squareDimensionAutoUpgradeEnabled = false;
  squareDimensionAutoUpgradeTimer = 0;
}

function loadGeneralizationResearchState(savedState) {
  resetGeneralizationResearchState();
  for (const research of GENERALIZATION_RESEARCHES) {
    const legacyResearchId = research.id === '7-2' ? '7-3' : null;
    generalizationResearchState[research.id] =
      savedState?.[research.id] === true || savedState?.[legacyResearchId] === true;
  }
}

function loadSquareConvergenceUpgradeState(savedState, savedLevels) {
  resetSquareConvergenceUpgradeState();
  for (const upgrade of SQUARE_CONVERGENCE_UPGRADES) {
    if (upgrade.max || upgrade.repeatable) {
      const rawLevel = Number(savedLevels?.[upgrade.id] ?? (savedState?.[upgrade.id] === true ? 1 : 0));
      const level = Number.isFinite(rawLevel)
        ? Math.max(0, upgrade.max ? Math.min(upgrade.max, Math.floor(rawLevel)) : Math.floor(rawLevel))
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

function allSquareUpgradesBought() {
  return SQUARE_UPGRADES.every(upgrade => hasSquareUpgrade(upgrade.id));
}

function abstractionSingularityCpMultiplier() {
  if (!hasAbstractionResearch('17-1') || !isPositiveNumberValue(singularityPoints)) return 1;
  const { singularityCpLogStrength, singularityReference, singularityCpCurve } = ABSTRACTION_TIER17_BALANCE;
  const exponent = multiplyNumberValue(singularityCpLogStrength, NumberMath.power(
    NumberMath.divideApproximate(singularityPoints, singularityReference), singularityCpCurve));
  return NumberMath.powerOfTen(exponent);
}

function squareConvergencePointGain() {
  const requirement = squareConvergenceExchangeRequirement();
  if (compareNumberValues(squarePoints, requirement) < 0) return 0;

  const ratio = divideNumberValue(squarePoints, requirement);
  let gain = NumberMath.max(NumberMath.log10(ratio), 1);
  if (hasAbstractionResearch('17-2')) gain = NumberMath.power(gain, ABSTRACTION_TIER17_BALANCE.cpBasePower);
  return applyKnuthAdvancedPower('cp_power', multiplyNumberValue(gain, squareConvergenceGainMultiplier()));
}

function squareConvergenceGainMultiplier() {
  if (isKnuthChallengeActive('kc6')) return 1;
  let gain = 1;
  const upgradeLevel = squareConvergenceUpgradeLevel('cp_gain_5x');
  if (upgradeLevel > 0) {
    gain = multiplyNumberValue(gain, NumberMath.power(5, upgradeLevel));
  }
  return spaceExpansionMultiplier(multiplyNumberValue(
    multiplyNumberValue(gain, knuthSpCpGainMultiplier('cp')),
    multiplyNumberValue(
      multiplyNumberValue(abstractionCpGainMultiplier(), abstractionKpCpGainMultiplier()),
      multiplyNumberValue(knuthBaseMultiplier('cp_gain', 25),
        multiplyNumberValue(multiplyNumberValue(abstractionSingularityCpMultiplier(), abstractionRadiusCpMultiplier()),
          multiplyNumberValue(abstractionProbabilizerCpMultiplier(), abstractionBlackHoleCpMultiplier())))
    )
  ));
}

function squareConvergenceExchangeRequirement() {
  return hasGeneralizationResearch('2-2')
    ? SQUARE_CONVERGENCE_IMPROVED_EXCHANGE_REQUIREMENT
    : SQUARE_CONVERGENCE_EXCHANGE_REQUIREMENT;
}

function collectSquareConvergenceIfReady() {
  const gainedConvergencePoints = squareConvergencePointGain();
  if (!isPositiveNumberValue(gainedConvergencePoints)) return 0;

  setSquarePoints(0);
  squareConvergencePoints = addBaseNumbers(squareConvergencePoints, gainedConvergencePoints);
  if (isKnuthChallengeActive('kc4')) resetKc4Time();
  if (typeof recordAchievementConvergence === 'function') recordAchievementConvergence();
  hasEverEarnedSquareConvergencePoint = true;
  if (hasGeneralizationResearch('4-4')) {
    setSquarePoints(addBaseNumbers(squarePoints, GENERALIZATION_CONVERGENCE_SP_REWARD));
  }
  squareConvergenceUnlocked = true;
  squareUnlocked = true;
  if (!hasCompletedKnuthChallenge('kc2')) resetSquareDimensionState();
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

function theoryCostGrowthForResource(resourceIndex) {
  return resourceIndex === 0 ? THEORY_SQUARE_POINT_COST_GROWTH : THEORY_CONVERGENCE_POINT_COST_GROWTH;
}

function theoryCostAfterPurchases(currentCost, growth, purchases, resourceIndex = null) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0) return currentCost;
  if (resourceIndex !== 0) return multiplyNumberValue(currentCost, NumberMath.power(growth, purchases));

  let cost = currentCost;
  let remaining = purchases;
  while (remaining > 0 && compareNumberValues(cost, THEORY_SQUARE_POINT_COST_ACCELERATION_THRESHOLD) < 0) {
    cost = multiplyNumberValue(cost, growth);
    remaining--;
  }
  if (remaining > 0) {
    cost = multiplyNumberValue(
      cost,
      NumberMath.power(THEORY_SQUARE_POINT_COST_ACCELERATED_GROWTH, remaining)
    );
  }
  return cost;
}

function theoryBulkCost(currentCost, growth, purchases, resourceIndex = null) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0) return 0;
  if (resourceIndex !== 0) {
    if (compareNumberValues(growth, 1) === 0) {
      return multiplyNumberValue(currentCost, numberValueFromReal(purchases));
    }

    const growthPower = NumberMath.power(growth, purchases);
    const numerator = subtractNumberValues(growthPower, 1);
    return divideNumberValue(
      multiplyNumberValue(currentCost, numerator),
      subtractNumberValues(growth, 1)
    );
  }

  let total = 0;
  let cost = currentCost;
  let remaining = purchases;
  let acceleratedPurchases = 0;
  while (remaining > 0 && compareNumberValues(cost, THEORY_SQUARE_POINT_COST_ACCELERATION_THRESHOLD) < 0) {
    total = addBaseNumbers(total, cost);
    cost = multiplyNumberValue(cost, growth);
    remaining--;
  }
  if (remaining > 0) {
    acceleratedPurchases = remaining;
    const growthPower = NumberMath.power(THEORY_SQUARE_POINT_COST_ACCELERATED_GROWTH, remaining);
    const numerator = subtractNumberValues(growthPower, 1);
    total = addBaseNumbers(
      total,
      divideNumberValue(
        multiplyNumberValue(cost, numerator),
        subtractNumberValues(THEORY_SQUARE_POINT_COST_ACCELERATED_GROWTH, 1)
      )
    );
  }
  if (acceleratedPurchases > 0 && purchases > 1 && isApproximateNumber(total)) {
    const scientific = NumberMath.toScientific(total);
    if (scientific) {
      return NumberMath.normalize(
        scientific.mantissa * (1 + (10 ** -APPROXIMATE_COST_IGNORE_EXPONENT_GAP)),
        scientific.exponent
      ) ?? total;
    }
  }
  return total;
}

function theoryMaximumPurchases() {
  if (!canOpenSquareConvergence()) return 0;

  const selectedResource = theoryCostResourceIndex;
  const available = selectedResource === 0 ? squarePoints : squareConvergencePoints;
  const currentCost = theoryCostForResource(selectedResource);
  const growth = theoryCostGrowthForResource(selectedResource);
  if (compareNumberValues(available, currentCost) < 0) return 0;

  let affordable = 1;
  let unaffordable = 2;
  while (compareNumberValues(available, theoryBulkCost(currentCost, growth, unaffordable, selectedResource)) >= 0) {
    affordable = unaffordable;
    if (unaffordable > Math.floor(Number.MAX_SAFE_INTEGER / 2)) return affordable;
    unaffordable *= 2;
  }

  while (unaffordable - affordable > 1) {
    const middle = affordable + Math.floor((unaffordable - affordable) / 2);
    if (compareNumberValues(available, theoryBulkCost(currentCost, growth, middle, selectedResource)) >= 0) {
      affordable = middle;
    } else {
      unaffordable = middle;
    }
  }
  return affordable;
}

function setTheoryCostResource(resourceIndex) {
  const nextIndex = Number(resourceIndex);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex > 1) return false;
  theoryCostResourceIndex = nextIndex;
  render();
  return true;
}

function purchaseTheory(purchases) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0 || theoryMaximumPurchases() < purchases) return false;

  const selectedResource = theoryCostResourceIndex;
  const currentCost = theoryCostForResource(selectedResource);
  const growth = theoryCostGrowthForResource(selectedResource);
  const totalCost = theoryBulkCost(currentCost, growth, purchases, selectedResource);
  const paidResourceLabel = theoryCostResourceLabel(selectedResource);
  if (selectedResource === 0) {
    setSquarePoints(subtractNumberValues(squarePoints, totalCost));
    theorySquarePointCost = theoryCostAfterPurchases(currentCost, growth, purchases, selectedResource);
  } else {
    squareConvergencePoints = subtractNumberValues(squareConvergencePoints, totalCost);
    theoryConvergencePointCost = theoryCostAfterPurchases(currentCost, growth, purchases, selectedResource);
  }

  const purchasedTheory = numberValueFromReal(purchases);
  const gainedTheory = multiplyNumberValue(purchasedTheory, knuthChallengeTheoryRewardMultiplier());
  theory = addBaseNumbers(theory, gainedTheory);
  totalTheoryPurchased = addBaseNumbers(totalTheoryPurchased, gainedTheory);
  log(`${paidResourceLabel}로 이론 ${purchases}개를 연구했습니다. 현재 ${fmt(theory)} 이론`, true);
  render();
  return true;
}

function researchTheory() {
  return purchaseTheory(1);
}

function researchTheoryMaximum() {
  return purchaseTheory(theoryMaximumPurchases());
}

function greatTheoryCostForResource(resourceIndex) {
  if (resourceIndex === 0) return greatTheoryCpCost;
  if (resourceIndex === 1) return greatTheoryKpCost;
  if (resourceIndex === 3) return greatTheoryTheoryCost;
  return greatTheorySpCost;
}

function greatTheoryPurchasesFromCosts() {
  // Older saves recorded next prices, which retain purchase history even after spending/refunds.
  const bases = [ABSTRACTION_CP_BASE_COST, ABSTRACTION_KP_BASE_COST, ABSTRACTION_SP_BASE_COST, 4];
  return bases.reduce((total, base, index) => {
    const costLog = NumberMath.log10(NumberMath.max(base, greatTheoryCostForResource(index)));
    const baseLog = NumberMath.log10(base);
    let count;
    if (index === 2 && compareNumberValues(greatTheorySpCost, ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD) >= 0) {
      const thresholdLog = NumberMath.log10(ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD);
      const normal = NumberMath.divideApproximate(subtractNumberValues(thresholdLog, baseLog), NumberMath.log10(ABSTRACTION_SP_COST_GROWTH));
      const accelerated = NumberMath.divideApproximate(subtractNumberValues(costLog, thresholdLog), NumberMath.log10(ABSTRACTION_SP_COST_ACCELERATED_GROWTH));
      count = addBaseNumbers(normal, accelerated);
    } else {
      count = NumberMath.divideApproximate(subtractNumberValues(costLog, baseLog),
        NumberMath.log10(greatTheoryCostGrowthForResource(index, base)));
    }
    const numeric = NumberMath.toNumber(count);
    const rounded = Number.isFinite(numeric) && numeric <= Number.MAX_SAFE_INTEGER
      ? Math.round(numeric) : NumberMath.floor(count);
    return addBaseNumbers(total, rounded);
  }, 0);
}

function greatTheoryResourceLabel(resourceIndex) {
  return ['CP', 'KP', 'SP', '이론'][resourceIndex] ?? 'CP';
}

function greatTheoryCostGrowthForResource(resourceIndex, currentCost = greatTheoryCostForResource(resourceIndex)) {
  if (resourceIndex === 0) return ABSTRACTION_CP_COST_GROWTH;
  if (resourceIndex === 1) return ABSTRACTION_KP_COST_GROWTH;
  if (resourceIndex === 3) return 4;
  return compareNumberValues(currentCost, ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD) >= 0
    ? ABSTRACTION_SP_COST_ACCELERATED_GROWTH : ABSTRACTION_SP_COST_GROWTH;
}

function greatTheoryNormalSpPurchases(currentCost, purchases) {
  if (compareNumberValues(currentCost, ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD) >= 0) return 0;
  const logarithm = NumberMath.toNumber(NumberMath.log10(currentCost));
  const thresholdLog = NumberMath.toNumber(NumberMath.log10(ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD));
  const growthLog = NumberMath.toNumber(NumberMath.log10(ABSTRACTION_SP_COST_GROWTH));
  let normal = Math.max(0, Math.ceil((thresholdLog - logarithm) / growthLog));
  // Correct a logarithm rounding error at the boundary using the actual NumberMath price.
  const boundaryCost = multiplyNumberValue(currentCost, NumberMath.power(ABSTRACTION_SP_COST_GROWTH, normal));
  if (compareNumberValues(boundaryCost, ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD) < 0) normal++;
  else if (normal > 0 && compareNumberValues(
    multiplyNumberValue(currentCost, NumberMath.power(ABSTRACTION_SP_COST_GROWTH, normal - 1)),
    ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD
  ) >= 0) normal--;
  return Math.min(purchases, normal);
}

function greatTheoryCostAfterPurchases(resourceIndex, purchases, currentCost = greatTheoryCostForResource(resourceIndex)) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0) return currentCost;
  if (resourceIndex !== 2) {
    return theoryCostAfterPurchases(currentCost, greatTheoryCostGrowthForResource(resourceIndex, currentCost), purchases, 1);
  }
  const normal = greatTheoryNormalSpPurchases(currentCost, purchases);
  const boundaryCost = multiplyNumberValue(currentCost, NumberMath.power(ABSTRACTION_SP_COST_GROWTH, normal));
  return purchases === normal ? boundaryCost : multiplyNumberValue(boundaryCost,
    NumberMath.power(ABSTRACTION_SP_COST_ACCELERATED_GROWTH, purchases - normal));
}

function greatTheoryBulkCost(resourceIndex, purchases, currentCost = greatTheoryCostForResource(resourceIndex)) {
  if (resourceIndex !== 2) {
    return theoryBulkCost(currentCost, greatTheoryCostGrowthForResource(resourceIndex, currentCost), purchases, 1);
  }
  if (!Number.isSafeInteger(purchases) || purchases <= 0) return 0;
  const normal = greatTheoryNormalSpPurchases(currentCost, purchases);
  const normalCost = theoryBulkCost(currentCost, ABSTRACTION_SP_COST_GROWTH, normal, 1);
  if (purchases === normal) return normalCost;
  const boundaryCost = multiplyNumberValue(currentCost, NumberMath.power(ABSTRACTION_SP_COST_GROWTH, normal));
  return addBaseNumbers(normalCost,
    theoryBulkCost(boundaryCost, ABSTRACTION_SP_COST_ACCELERATED_GROWTH, purchases - normal, 1));
}

function greatTheoryCanAffordPurchases(resourceIndex, available, purchases, currentCost) {
  if (resourceIndex === 2) {
    const lastCost = purchases > 1 ? greatTheoryCostAfterPurchases(resourceIndex, purchases - 1, currentCost) : currentCost;
    if (compareNumberValues(lastCost, ABSTRACTION_SP_PURCHASE_COST_LIMIT) >= 0) return false;
    if (purchases > 1 && compareNumberValues(available, lastCost) === 0) return false;
  }
  const totalCost = greatTheoryBulkCost(resourceIndex, purchases, currentCost);
  if (compareNumberValues(available, totalCost) < 0) return false;
  return true;
}

function greatTheoryMaximumPurchases() {
  if (!canOpenAbstraction()) return 0;
  const resourceIndex = abstractionCostResourceIndex;
  if (resourceIndex === 3 && !knuthBaseUpgradeEffectLevel('theory_exchange')) return 0;
  const available = [squareConvergencePoints, knuthPoints, squarePoints, theory][resourceIndex] ?? 0;
  const currentCost = greatTheoryCostForResource(resourceIndex);
  if (resourceIndex === 2 && compareNumberValues(currentCost, ABSTRACTION_SP_PURCHASE_COST_LIMIT) >= 0) return 0;
  if (compareNumberValues(available, currentCost) < 0) return 0;

  let affordable = 1;
  let unaffordable = 2;
  while (greatTheoryCanAffordPurchases(resourceIndex, available, unaffordable, currentCost)) {
    affordable = unaffordable;
    if (unaffordable > Math.floor(Number.MAX_SAFE_INTEGER / 2)) return affordable;
    unaffordable *= 2;
  }

  while (unaffordable - affordable > 1) {
    const middle = affordable + Math.floor((unaffordable - affordable) / 2);
    if (greatTheoryCanAffordPurchases(resourceIndex, available, middle, currentCost)) {
      affordable = middle;
    } else {
      unaffordable = middle;
    }
  }
  return affordable;
}

function setAbstractionCostResource(resourceIndex) {
  const nextIndex = Number(resourceIndex);
  if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex > 3) return false;
  if (nextIndex === 3 && !knuthBaseUpgradeEffectLevel('theory_exchange')) return false;
  abstractionCostResourceIndex = nextIndex;
  render();
  return true;
}

function purchaseGreatTheory(purchases) {
  if (!Number.isSafeInteger(purchases) || purchases <= 0 || greatTheoryMaximumPurchases() < purchases) {
    return false;
  }

  const resourceIndex = abstractionCostResourceIndex;
  const currentCost = greatTheoryCostForResource(resourceIndex);
  const totalCost = greatTheoryBulkCost(resourceIndex, purchases, currentCost);
  const nextCost = greatTheoryCostAfterPurchases(resourceIndex, purchases, currentCost);
  if (resourceIndex === 0) {
    squareConvergencePoints = subtractNumberValues(squareConvergencePoints, totalCost);
    greatTheoryCpCost = nextCost;
  } else if (resourceIndex === 1) {
    knuthPoints = subtractNumberValues(knuthPoints, totalCost);
    greatTheoryKpCost = nextCost;
  } else if (resourceIndex === 3) {
    theory = subtractNumberValues(theory, totalCost);
    greatTheoryTheoryCost = nextCost;
  } else {
    setSquarePoints(subtractNumberValues(squarePoints, totalCost));
    greatTheorySpCost = nextCost;
  }
  greatTheory = addBaseNumbers(greatTheory, numberValueFromReal(purchases));
  totalGreatTheoryPurchased = addBaseNumbers(totalGreatTheoryPurchased, numberValueFromReal(purchases));
  render();
  return true;
}

function hasPurchasedAbstractionResearch(id) {
  return abstractionResearchState[id] === true;
}

function abstractionBranchLimit(group, owns = hasAbstractionResearch) {
  if (group === 1) return Math.min(3, 1 + (knuthBaseUpgradeEffectLevel('extra_branch') > 0 ? 1 : 0)
    + (owns('22-1') ? 1 : 0));
  return group === 2 && hasKnuthUpgrade('second_branch_expansion') ? 2 : 1;
}

function abstractionSecondBranchIsActive(branch) {
  return hasKnuthUpgrade('second_branch_expansion')
    || abstractionSecondBranchPurchaseOrder.indexOf(branch) <= 0;
}

function abstractionPermanentStorageActive(id) {
  return !spaceExpansionActive && hasAbstractionResearch(id);
}

function hasAbstractionResearch(id) {
  if (!hasPurchasedAbstractionResearch(id)) return false;
  if (abstractionSecondBranchPurchaseOrder.length < 2 || hasKnuthUpgrade('second_branch_expansion')) return true;
  const research = abstractionResearchDefinitions.get(id) ?? ABSTRACTION_RESEARCHES.find(item => item.id === id);
  return !research?.branch || research.branchGroup !== 2 || abstractionSecondBranchIsActive(research.branch);
}

function loadAbstractionSecondBranchOrder(savedOrder) {
  const owned = [...new Set(ABSTRACTION_RESEARCHES.filter(research => research.branchGroup === 2
    && hasPurchasedAbstractionResearch(research.id)).map(research => research.branch))];
  const saved = Array.isArray(savedOrder) ? savedOrder : [];
  abstractionSecondBranchPurchaseOrder = [...new Set([...saved.filter(branch => owned.includes(branch)), ...owned])];
}

function recordAbstractionBranchPurchase(research) {
  if (research.branchGroup !== 2 || !research.branch) return;
  loadAbstractionSecondBranchOrder(abstractionSecondBranchPurchaseOrder);
  if (!abstractionSecondBranchPurchaseOrder.includes(research.branch)) {
    abstractionSecondBranchPurchaseOrder.push(research.branch);
  }
}

function abstractionResearchParentsReady(research) {
  const branchParents = [];
  for (const parentId of research.parents) {
    const parent = ABSTRACTION_RESEARCHES.find(item => item.id === parentId);
    if (parent?.branch) branchParents.push(parentId);
    else if (!hasAbstractionResearch(parentId)) return false;
  }
  return branchParents.length === 0 || branchParents.some(hasAbstractionResearch);
}

function abstractionResearchBranchLocked(research) {
  if (!research.branch) return false;
  const group = research.branchGroup ?? 1;
  const selected = new Set(ABSTRACTION_RESEARCHES.filter(item => item.branch
    && (item.branchGroup ?? 1) === group && hasPurchasedAbstractionResearch(item.id)).map(item => item.branch));
  return (group === 2 && selected.has(research.branch) && !abstractionSecondBranchIsActive(research.branch))
    || (!selected.has(research.branch) && selected.size >= abstractionBranchLimit(group));
}

function canResearchAbstraction(id) {
  const research = ABSTRACTION_RESEARCHES.find(item => item.id === id);
  if (!research || hasPurchasedAbstractionResearch(id) || !canOpenAbstraction()) return false;
  return abstractionResearchTierUnlocked(research) && abstractionResearchConditionReady(research)
    && !abstractionResearchBranchLocked(research)
    && abstractionResearchParentsReady(research)
    && compareNumberValues(greatTheory, research.greatTheoryCost) >= 0;
}

function abstractionResearchConditionReady(research) {
  return research.randomPowerRequirement === undefined
    || compareNumberValues(randomPower, research.randomPowerRequirement) >= 0;
}

function abstractionResearchTierUnlocked(research) {
  const tier = Number(String(research.id).split('-')[0]);
  return !(tier >= 19) || knuthBaseUpgradeEffectLevel('late_abstraction') > 0;
}

function researchAbstraction(id, { renderAfter = true } = {}) {
  const research = ABSTRACTION_RESEARCHES.find(item => item.id === id);
  if (!research || !canResearchAbstraction(id)) return false;
  if (id === '21-1') initializeProbabilizerRangeProgress();
  greatTheory = subtractNumberValues(greatTheory, research.greatTheoryCost);
  recordAbstractionBranchPurchase(research);
  abstractionResearchState[id] = true;
  abstractionResearchPaidCosts[id] = research.greatTheoryCost;
  if (id === '23-3') setSquarePoints(squarePoints);
  if (id === '26-2') restoreAbstractionPermanentSingularities();
  if (id === '3-1') automatiumPrestigeRetentionUnlocked = true;
  if (['14-1', '14-2', '14-3', '18-7', '19-2', '20-1', '22-2'].includes(id) && divergerAvailable()) {
    divergerPower = divergerProductionValue();
  }
  if (renderAfter) render();
  return true;
}

const ABSTRACTION_BRANCH_OPTIONS = {
  1: [{ id: 'time', label: '시간' }, { id: 'expansion', label: '확장' }, { id: 'percent', label: '퍼센트' }],
  2: [{ id: 'active', label: '액티브' }, { id: 'passive', label: '패시브' }, { id: 'idle', label: '아이들' }]
};

function loadAbstractionBranchPriorities(saved) {
  for (const group of [1, 2]) {
    const allowed = ABSTRACTION_BRANCH_OPTIONS[group].map(option => option.id);
    const values = Array.isArray(saved?.[group]) ? saved[group] : [];
    abstractionBranchPriorities[group] = [...new Set([...values.filter(value => allowed.includes(value)), ...allowed])];
  }
}

function setAbstractionBranchPriority(group, rank, branch) {
  if (![1, 2].includes(group) || !Number.isInteger(rank) || rank < 0 || rank >= (group === 1 ? 3 : 2)) return false;
  const priorities = abstractionBranchPriorities[group];
  const previousRank = priorities.indexOf(branch);
  if (previousRank < 0) return false;
  [priorities[rank], priorities[previousRank]] = [priorities[previousRank], priorities[rank]];
  return true;
}

function researchPurchasePlan(kind, id) {
  const abstraction = kind === 'abstraction';
  if (kind !== 'generalization' && !abstraction) return null;
  if (!(abstraction ? canOpenAbstraction() : canOpenGeneralizationResearch())) return null;
  const researches = abstraction ? ABSTRACTION_RESEARCHES : GENERALIZATION_RESEARCHES;
  const hasResearch = abstraction ? hasAbstractionResearch : hasGeneralizationResearch;
  const byId = new Map(researches.map(research => [research.id, research]));
  if (!byId.has(id) || (abstraction ? hasPurchasedAbstractionResearch(id) : hasResearch(id))) return null;
  const planned = new Set();
  const visiting = new Set();
  const selectedBranches = new Map();
  for (const research of researches) {
    if (!research.branch || !(abstraction ? hasPurchasedAbstractionResearch(research.id) : hasResearch(research.id))) continue;
    const group = research.branchGroup ?? 1;
    if (!selectedBranches.has(group)) selectedBranches.set(group, new Set());
    selectedBranches.get(group).add(research.branch);
  }
  const branchLimit = abstractionBranchLimit;
  let cost = 0;
  function visit(researchId) {
    if (hasResearch(researchId) || planned.has(researchId)) return true;
    if (abstraction && hasPurchasedAbstractionResearch(researchId)) return false;
    const research = byId.get(researchId);
    if (!research || visiting.has(researchId)) return false;
    if (abstraction && (!abstractionResearchTierUnlocked(research) || !abstractionResearchConditionReady(research))) return false;
    visiting.add(researchId);
    if (research.branch) {
      const group = research.branchGroup ?? 1;
      if (!selectedBranches.has(group)) selectedBranches.set(group, new Set());
      const selected = selectedBranches.get(group);
      if (!selected.has(research.branch) && selected.size >= branchLimit(group)) return false;
      selected.add(research.branch);
    }
    const branchParents = [];
    for (const parentId of research.parents) {
      const parent = byId.get(parentId);
      if (abstraction && parent?.branch) branchParents.push(parent);
      else if (!visit(parentId)) return false;
    }
    if (branchParents.length > 0) {
      // Existing choices come first; empty branch slots follow the saved priorities.
      const groups = [...new Set(branchParents.map(parent => parent.branchGroup ?? 1))];
      let selectedParent = false;
      for (const group of groups) {
        const selected = selectedBranches.get(group) ?? new Set();
        const priorities = abstractionBranchPriorities[group] ?? [];
        const candidates = branchParents.filter(parent => (parent.branchGroup ?? 1) === group
          && (group !== 2 || abstractionSecondBranchIsActive(parent.branch)))
          .sort((a, b) => priorities.indexOf(a.branch) - priorities.indexOf(b.branch));
        const parents = candidates.filter(parent => selected.has(parent.branch));
        parents.push(...candidates.filter(parent => !selected.has(parent.branch))
          .slice(0, Math.max(0, branchLimit(group) - selected.size)));
        for (const parent of parents) {
          if (!visit(parent.id)) return false;
          selectedParent = true;
        }
      }
      if (!selectedParent) return false;
    }
    visiting.delete(researchId);
    planned.add(researchId);
    cost = addBaseNumbers(cost, abstraction ? research.greatTheoryCost : research.theoryCost);
    return true;
  }
  return visit(id) ? { ids: [...planned], cost } : null;
}

function purchaseResearchWithParents(kind, id) {
  const plan = researchPurchasePlan(kind, id);
  const abstraction = kind === 'abstraction';
  if (!plan || compareNumberValues(abstraction ? greatTheory : theory, plan.cost) < 0) return false;
  const purchase = abstraction ? researchAbstraction : researchGeneralization;
  for (const researchId of plan.ids) {
    if (!purchase(researchId, { renderAfter: false })) return false;
  }
  render();
  return true;
}

function loadAbstractionResearchState(savedState) {
  for (const research of ABSTRACTION_RESEARCHES) {
    abstractionResearchState[research.id] = savedState?.[research.id] === true;
  }
}

function loadAbstractionResearchPresets(savedPresets) {
  const source = Array.isArray(savedPresets) ? savedPresets : [];
  const knownIds = new Set(ABSTRACTION_RESEARCHES.map(research => research.id));
  abstractionResearchPresets = Array.from({ length: Math.max(ABSTRACTION_PRESET_FREE_SLOTS, source.length) }, (_, index) => {
    const saved = source[index];
    const name = typeof saved?.name === 'string'
      ? Array.from(saved.name).slice(0, ABSTRACTION_PRESET_NAME_MAX_LENGTH).join('') : '';
    const ids = Array.isArray(saved?.ids)
      ? [...new Set(saved.ids.filter(id => typeof id === 'string' && knownIds.has(id)))] : [];
    return { name, ids };
  });
}

function abstractionPresetSlotCost() {
  return multiplyNumberValue(ABSTRACTION_PRESET_EXTRA_BASE_COST,
    NumberMath.power(2, abstractionResearchPresets.length - ABSTRACTION_PRESET_FREE_SLOTS));
}

function buyAbstractionPresetSlot() {
  if (!canOpenAbstraction() || abstractionResearchPresets.length >= Number.MAX_SAFE_INTEGER) return false;
  const cost = abstractionPresetSlotCost();
  if (compareNumberValues(knuthPoints, cost) < 0) return false;
  knuthPoints = subtractNumberValues(knuthPoints, cost);
  abstractionResearchPresets.push({ name: '', ids: [] });
  render();
  return true;
}

function abstractionPresetIdsFromText(text) {
  if (typeof text !== 'string') return null;
  if (!text.trim()) return [];
  const knownIds = new Set(ABSTRACTION_RESEARCHES.map(research => research.id));
  const ids = text.split(',').map(id => id.trim());
  if (ids.some(id => !knownIds.has(id))) return null;
  return [...new Set(ids)];
}

function saveAbstractionResearchPreset(index) {
  const preset = abstractionResearchPresets[index];
  if (!preset) return false;
  preset.ids = ABSTRACTION_RESEARCHES.filter(research => hasPurchasedAbstractionResearch(research.id))
    .map(research => research.id);
  render();
  return true;
}

function editAbstractionResearchPreset(index, text) {
  const preset = abstractionResearchPresets[index];
  const ids = abstractionPresetIdsFromText(text);
  if (!preset || ids === null) return false;
  preset.ids = ids;
  render();
  return true;
}

function renameAbstractionResearchPreset(index, name) {
  const preset = abstractionResearchPresets[index];
  if (!preset || typeof name !== 'string' || Array.from(name).length > ABSTRACTION_PRESET_NAME_MAX_LENGTH) return false;
  preset.name = name.trim();
  render();
  return true;
}

function clearAbstractionResearchPreset(index) {
  const preset = abstractionResearchPresets[index];
  if (!preset) return false;
  preset.name = '';
  preset.ids = [];
  render();
  return true;
}

function abstractionPresetPurchasePlan(index) {
  const preset = abstractionResearchPresets[index];
  if (!preset?.ids.length) return { error: '저장된 연구가 없습니다.' };
  if (!canOpenAbstraction()) return { error: '추상화가 잠겨 있습니다.' };
  if (ABSTRACTION_RESEARCHES.some(research => hasPurchasedAbstractionResearch(research.id))) {
    return { error: '현재 추상화 연구가 비어 있어야 합니다.' };
  }

  const selected = new Set(preset.ids);
  const definitions = new Map(ABSTRACTION_RESEARCHES.map(research => [research.id, research]));
  if (selected.size !== preset.ids.length || [...selected].some(id => !definitions.has(id))) {
    return { error: '알 수 없는 연구 ID가 있습니다.' };
  }
  if (preset.ids.some(id => !abstractionResearchTierUnlocked(definitions.get(id)))) {
    return { error: '19행 이후 연구에는 추상화 심화 업그레이드가 필요합니다.' };
  }
  if (preset.ids.some(id => !abstractionResearchConditionReady(definitions.get(id)))) {
    return { error: '무작위력이 연구 조건을 충족하지 않습니다.' };
  }
  for (const group of new Set(ABSTRACTION_RESEARCHES.filter(research => research.branch)
    .map(research => research.branchGroup ?? 1))) {
    const branches = new Set(preset.ids.map(id => definitions.get(id))
      .filter(research => research.branch && (research.branchGroup ?? 1) === group)
      .map(research => research.branch));
    if (branches.size > abstractionBranchLimit(group, id => selected.has(id))) return { error: '현재 허용된 분기 수를 초과합니다.' };
  }

  const ordered = [];
  const remaining = new Set(selected);
  const ready = new Set();
  let cost = 0;
  while (remaining.size > 0) {
    let next = null;
    for (const research of ABSTRACTION_RESEARCHES) {
      if (!remaining.has(research.id)) continue;
      if (research.branch) {
        const group = research.branchGroup ?? 1;
        const chosen = new Set([...ready].map(id => definitions.get(id))
          .filter(item => item.branch && (item.branchGroup ?? 1) === group).map(item => item.branch));
        if (!chosen.has(research.branch) && chosen.size >= abstractionBranchLimit(group, id => ready.has(id))) continue;
      }
      const normalParents = research.parents.filter(id => !definitions.get(id)?.branch);
      const branchParents = research.parents.filter(id => definitions.get(id)?.branch);
      if (normalParents.every(id => ready.has(id))
        && (branchParents.length === 0 || branchParents.some(id => ready.has(id)))) {
        next = research;
        break;
      }
    }
    if (!next) return { error: '선행 연구가 빠졌거나 연구 경로가 충돌합니다.' };
    ordered.push(next.id);
    ready.add(next.id);
    remaining.delete(next.id);
    cost = addBaseNumbers(cost, next.greatTheoryCost);
  }
  return { ids: ordered, cost };
}

function loadAbstractionResearchPreset(index) {
  const plan = abstractionPresetPurchasePlan(index);
  if (plan.error || compareNumberValues(greatTheory, plan.cost) < 0) return false;

  const previous = {
    greatTheory,
    research: { ...abstractionResearchState },
    paid: { ...abstractionResearchPaidCosts },
    order: [...abstractionSecondBranchPurchaseOrder],
    retention: automatiumPrestigeRetentionUnlocked,
    probabilizerRangeProgress: probabilizerRangeProgress ? { ...probabilizerRangeProgress } : null,
    divergerPower,
    squarePoints,
    singularityPoints,
    abstractionPermanentSingularities
  };
  for (const id of plan.ids) {
    if (researchAbstraction(id, { renderAfter: false })) continue;
    greatTheory = previous.greatTheory;
    Object.assign(abstractionResearchState, previous.research);
    for (const key of Object.keys(abstractionResearchPaidCosts)) delete abstractionResearchPaidCosts[key];
    Object.assign(abstractionResearchPaidCosts, previous.paid);
    abstractionSecondBranchPurchaseOrder = previous.order;
    automatiumPrestigeRetentionUnlocked = previous.retention;
    probabilizerRangeProgress = previous.probabilizerRangeProgress;
    divergerPower = previous.divergerPower;
    squarePoints = previous.squarePoints;
    singularityPoints = previous.singularityPoints;
    abstractionPermanentSingularities = previous.abstractionPermanentSingularities;
    return false;
  }
  render();
  return true;
}

function loadAbstractionResetState(savedCosts, savedToggle, { legacyLatePrices = false } = {}) {
  abstractionResetOnNextKnuthPoint = savedToggle === true;
  const reducedPriceIds = new Set(['22-1', '22-2', '22-3', '23-1', '23-2', '23-3']);
  let priceRefund = 0;
  for (const research of ABSTRACTION_RESEARCHES) {
    delete abstractionResearchPaidCosts[research.id];
    if (!hasPurchasedAbstractionResearch(research.id)) continue;
    const paid = savedCosts?.[research.id];
    // Older saves have research flags, but no record of historical prices.
    let paidCost = Number.isSafeInteger(paid) && paid >= 0
      ? paid : legacyLatePrices && reducedPriceIds.has(research.id) ? 4500 : research.greatTheoryCost;
    if (reducedPriceIds.has(research.id) && paidCost > research.greatTheoryCost) {
      priceRefund += paidCost - research.greatTheoryCost;
      paidCost = research.greatTheoryCost;
    }
    abstractionResearchPaidCosts[research.id] = paidCost;
  }
  return priceRefund;
}

function abstractionResearchRefund() {
  let refund = 0;
  for (const research of ABSTRACTION_RESEARCHES) {
    if (!hasPurchasedAbstractionResearch(research.id)) continue;
    refund += abstractionResearchPaidCosts[research.id] ?? research.greatTheoryCost;
  }
  return refund;
}

function toggleAbstractionReset() {
  abstractionResetOnNextKnuthPoint = !abstractionResetOnNextKnuthPoint;
  render();
  return abstractionResetOnNextKnuthPoint;
}

function applyAbstractionResetOnKnuthPoint() {
  if (!abstractionResetOnNextKnuthPoint) return;
  recordAbstractionPermanentSingularities();
  const hadSlotExpansion = hasAbstractionResearch('16-2');
  greatTheory = addBaseNumbers(greatTheory, abstractionResearchRefund());
  for (const research of ABSTRACTION_RESEARCHES) {
    abstractionResearchState[research.id] = false;
    delete abstractionResearchPaidCosts[research.id];
  }
  abstractionSecondBranchPurchaseOrder = [];
  abstractionResetOnNextKnuthPoint = false;
  if (hadSlotExpansion) trimKnuthEquipmentToCapacity();
}

function loadAbstractionPermanentEffects(savedRetention, savedResearchState) {
  automatiumPrestigeRetentionUnlocked = savedRetention === true
    || savedResearchState?.['3-1'] === true;
}

function abstractionLogRatio(value, scale, includeOne = false) {
  const source = includeOne ? addBaseNumbers(1, value) : NumberMath.max(value, 1);
  const logarithm = NumberMath.log10(source);
  if (compareNumberValues(logarithm, 0) <= 0) return 0;
  const ratio = NumberMath.toNumber(NumberMath.divideApproximate(
    logarithm,
    addBaseNumbers(logarithm, scale)
  ));
  return Math.max(0, Math.min(1, ratio));
}

function abstractionEffectiveTime() {
  return hasAbstractionResearch('4-1')
    ? NumberMath.power(squareRunGameSeconds, 1.5)
    : squareRunGameSeconds;
}

function abstractionTimeRecoveryRate() {
  const U = squareRunGameSeconds;
  return hasAbstractionResearch('6-1') ? 48 / (1 + NumberMath.toNumber(U) / 300) : 0;
}

function abstractionBlackHoleTimeMultiplier() {
  return hasAbstractionResearch('5-1')
    ? 1 + 99 * abstractionLogRatio(squareDimensionTotalPower(), 50)
    : 1;
}

function abstractionEffectiveDivergerB() {
  const base = hasAbstractionResearch('4-2')
    ? divergerB * (1 + 50 * abstractionLogRatio(knuthPoints, 50, true))
    : divergerB;
  const effective = base * abstractionSecondBranchParameterMultiplier('b');
  const multiplier = probabilizerDivergerParameterMultiplier();
  if (compareNumberValues(multiplier, 1) === 0) return effective;
  // b remains a native exponent; retain headroom for the formula's c/2 addition.
  return NumberMath.toNumber(NumberMath.min(Number.MAX_VALUE / 1024,
    multiplyNumberValue(effective, multiplier)));
}

function knuthRunRealSeconds(now = gameUtcNowMs()) {
  return Math.max(0, (now - knuthRunStartedAtMs) / 1000);
}

function normalizedKnuthDuration(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function loadKnuthRealTimeState(saved = {}, now = gameUtcNowMs()) {
  const start = normalizedKnuthDuration(saved.knuthRunStartedAtMs);
  knuthRunStartedAtMs = start !== null && start <= now ? start : now;
  shortestKnuthRealSeconds = normalizedKnuthDuration(saved.shortestKnuthRealSeconds);
  longestKnuthRealSeconds = normalizedKnuthDuration(saved.longestKnuthRealSeconds);
  pendingKnuthCompletionSeconds = normalizedKnuthDuration(saved.pendingKnuthCompletionSeconds);
}

function recordKnuthCompletion(seconds) {
  if (normalizedKnuthDuration(seconds) === null) return;
  shortestKnuthRealSeconds = shortestKnuthRealSeconds === null ? seconds : Math.min(shortestKnuthRealSeconds, seconds);
  longestKnuthRealSeconds = longestKnuthRealSeconds === null ? seconds : Math.max(longestKnuthRealSeconds, seconds);
}

function abstractionActiveTimeBonus(U, strength) {
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  return 1 + strength / Math.pow(1 + U / tuning.timeScale, tuning.activeDecayPower);
}

function abstractionIdleTimeBonus(seconds, strength) {
  const logarithm = Math.log1p(Math.max(0, seconds) / ABSTRACTION_SECOND_BRANCH_BALANCE.timeScale) / Math.LN2;
  return 1 + strength * (1 - 1 / (1 + logarithm));
}

function abstractionSecondBranchResourceMultiplier(resource = 'sp') {
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  const U = knuthRunRealSeconds();
  let multiplier = 1;
  if (hasAbstractionResearch('12-1')) multiplier *= abstractionActiveTimeBonus(U,
    resource === 'cp' ? tuning.activeCpStrength : tuning.activeSpStrength);
  if (hasAbstractionResearch('12-2')) multiplier *= resource === 'cp' ? tuning.passiveCp : tuning.passiveSp;
  if (hasAbstractionResearch('12-3')) multiplier *= abstractionIdleTimeBonus(knuthRunRealSeconds(),
    resource === 'cp' ? tuning.idleCpStrength : tuning.idleSpStrength);
  return multiplier;
}

function abstractionKpTimeRecord(kind) {
  const candidate = hasClaimedKnuthPoint && !activeKnuthChallengeId ? knuthRunRealSeconds() : null;
  const record = kind === 'shortest' ? shortestKnuthRealSeconds : longestKnuthRealSeconds;
  if (candidate === null) return record;
  if (record === null) return candidate;
  return kind === 'shortest' ? Math.min(record, candidate) : Math.max(record, candidate);
}

function abstractionSecondBranchKpMultiplier() {
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  const shortest = abstractionKpTimeRecord('shortest');
  const longest = abstractionKpTimeRecord('longest');
  let multiplier = 1;
  if (hasAbstractionResearch('13-1') && shortest !== null) multiplier *= abstractionActiveTimeBonus(shortest, tuning.activeKpStrength);
  if (hasAbstractionResearch('13-2')) multiplier *= tuning.passiveKp;
  if (hasAbstractionResearch('13-3') && longest !== null) multiplier *= abstractionIdleTimeBonus(longest, tuning.idleKpStrength);
  return multiplier;
}

function abstractionSecondBranchDivergerSpeed() {
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  return (hasAbstractionResearch('14-2') ? tuning.passiveSpeed : 1)
    * (hasAbstractionResearch('14-3') ? tuning.idleSpeed : 1);
}

function abstractionSecondBranchParameterMultiplier(parameter) {
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  const U = knuthRunRealSeconds();
  let multiplier = 1;
  if (hasAbstractionResearch('14-1')) multiplier *= abstractionActiveTimeBonus(U, tuning.activeParameterStrength);
  if (hasAbstractionResearch('14-2') && parameter !== 'b') multiplier *= tuning.passiveParameters;
  if (hasAbstractionResearch('14-3')) multiplier *= tuning.idleParameters;
  return multiplier;
}

function abstractionEffectiveDivergerA() {
  const base = multiplyNumberValue(isPositiveNumberValue(divergerA) ? divergerA : 1, abstractionSecondBranchParameterMultiplier('a'));
  if (!hasAbstractionResearch('18-7')) return multiplyNumberValue(base, probabilizerDivergerParameterMultiplier());
  const { aFromBStrength, bReference } = ABSTRACTION_MINI_BRANCH_BALANCE;
  return multiplyNumberValue(NumberMath.power(base, addBaseNumbers(1, multiplyNumberValue(aFromBStrength,
    abstractionMiniLog2(addBaseNumbers(1, NumberMath.divideApproximate(abstractionEffectiveDivergerB(), bReference)))))),
    probabilizerDivergerParameterMultiplier());
}

function abstractionMiniLog2(value) {
  return NumberMath.divideApproximate(NumberMath.log10(value), Math.log10(2));
}

function abstractionRadiusSingularityPower() {
  // The unboosted radius breaks the radius -> singularity bonus -> radius cycle.
  const radius = typeof numberBlackHoleUnboostedRadius === 'function' ? numberBlackHoleUnboostedRadius() : 0;
  const { radiusEffectStrength, radiusReference } = ABSTRACTION_MINI_BRANCH_BALANCE;
  const logarithm = NumberMath.log10(addBaseNumbers(1, radius));
  return addBaseNumbers(1, multiplyNumberValue(radiusEffectStrength, NumberMath.divideApproximate(
    logarithm, addBaseNumbers(logarithm, Math.log10(1 + radiusReference)))));
}

function abstractionBlackHoleSingularityPower() {
  const tuning = ABSTRACTION_MINI_BRANCH_BALANCE;
  let power = 1;
  if (hasAbstractionResearch('18-5')) {
    power = addBaseNumbers(power, multiplyNumberValue(tuning.dysonSingularityStrength,
      abstractionMiniLog2(1 + effectiveDysonSwarmLevel() / tuning.dysonReference)));
  }
  if (hasAbstractionResearch('18-8')) {
    power = addBaseNumbers(power, multiplyNumberValue(tuning.nSingularityStrength, abstractionMiniLog2(addBaseNumbers(1,
      NumberMath.divideApproximate(NumberMath.log10(NumberMath.max(1, divergerN)), tuning.nLogReference)))));
  }
  return power;
}

function abstractionRadiusCpMultiplier() {
  if (!hasAbstractionResearch('18-4') || typeof numberBlackHoleSchwarzschildRadius !== 'function'
    || !numberBlackHoleAvailable()) return 1;
  const { cpRadiusLogStrength, radiusReference } = ABSTRACTION_MINI_BRANCH_BALANCE;
  return NumberMath.powerOfTen(multiplyNumberValue(cpRadiusLogStrength, abstractionMiniLog2(addBaseNumbers(1,
    NumberMath.divideApproximate(numberBlackHoleSchwarzschildRadius(), radiusReference)))));
}

function abstractionEffectiveDivergerC() {
  return divergerC * abstractionSecondBranchParameterMultiplier('c');
}

function abstractionTier9Multiplier(value, tuning) {
  const normalized = NumberMath.divideApproximate(NumberMath.max(0, value), tuning.scale);
  const logarithm = NumberMath.log10(addBaseNumbers(1, NumberMath.power(normalized, tuning.curve)));
  return addBaseNumbers(1, multiplyNumberValue(
    NumberMath.divideApproximate(logarithm, Math.log10(2)), tuning.strength
  ));
}

function abstractionKpCpGainMultiplier() {
  return hasAbstractionResearch('9-1')
    ? abstractionTier9Multiplier(knuthPoints, ABSTRACTION_TIER9_BALANCE.cpFromKp)
    : 1;
}

function abstractionNumberPercentMultiplier(value = getBaseNumber()) {
  return hasAbstractionResearch('9-2')
    ? abstractionTier9Multiplier(
      NumberMath.log10(addBaseNumbers(1, value)), ABSTRACTION_TIER9_BALANCE.percentFromNumber
    )
    : 1;
}

function abstractionCpGainMultiplier() {
  if (!hasAbstractionResearch('5-2') || !divergerAvailable() || !isPositiveNumberValue(divergerPower)) return 1;
  const logarithm = NumberMath.log10(addBaseNumbers(1, divergerPower));
  return NumberMath.powerOfTen(NumberMath.divideApproximate(NumberMath.power(logarithm, 0.25), 2));
}

function abstractionPercentGainMultiplier() {
  if (!hasAbstractionResearch('4-3') || !divergerAvailable() || !isPositiveNumberValue(divergerPower)) return 1;
  const divergerLog = NumberMath.log10(addBaseNumbers(1, divergerPower));
  const squareLog = NumberMath.log10(NumberMath.max(1, squareDimensionTotalPower()));
  if (compareNumberValues(squareLog, 0) <= 0) return 1;
  const exponent = NumberMath.divideApproximate(
    NumberMath.power(multiplyNumberValue(divergerLog, squareLog), 0.5),
    2
  );
  return NumberMath.powerOfTen(exponent);
}

function abstractionCurrencyPriceDiscountRate() {
  if (!hasAbstractionResearch('6-3')) return 0;
  let totalLog = 0;
  for (const value of [squarePoints, squareConvergencePoints, knuthPoints, theory, greatTheory]) {
    totalLog = addBaseNumbers(totalLog, NumberMath.log10(addBaseNumbers(1, value)));
  }
  if (compareNumberValues(totalLog, 0) <= 0) return 0;
  const ratio = NumberMath.toNumber(NumberMath.divideApproximate(
    totalLog,
    addBaseNumbers(totalLog, 20)
  ));
  return 0.95 * Math.max(0, Math.min(1, ratio));
}

function canResearchGeneralization(id) {
  const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
  if (!research || hasGeneralizationResearch(id)) return false;
  return canOpenGeneralizationResearch() &&
    research.parents.every(parentId => hasGeneralizationResearch(parentId)) &&
    compareNumberValues(theory, research.theoryCost) >= 0;
}

function researchGeneralization(id, { renderAfter = true } = {}) {
  const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
  if (!research || !canResearchGeneralization(id)) return false;

  theory = subtractNumberValues(theory, research.theoryCost);
  generalizationResearchState[id] = true;
  if (typeof observeAchievementProductionUnlocks === 'function') observeAchievementProductionUnlocks();
  if (id === '7-2') {
    squareDimensionAutoUpgradeEnabled = true;
    squareDimensionAutoUpgradeTimer = 0;
  }
  if (id === '8-1') {
    if (!hasClaimedKnuthPoint) {
      beginKnuthPrestige();
      return true;
    }
  }
  log(`${research.id} ${research.title} 연구를 완료했습니다.`, true);
  if (renderAfter) render();
  return true;
}

function hasAnyGeneralizationResearch() {
  return GENERALIZATION_RESEARCHES.some(research => hasPurchasedGeneralizationResearch(research.id));
}

function canResetGeneralizationResearch() {
  return canOpenGeneralizationResearch()
    && hasAnyGeneralizationResearch()
    && compareNumberValues(squareConvergencePoints, generalizationResetCost) >= 0;
}

function resetGeneralizationResearch() {
  if (!canResetGeneralizationResearch()) return false;

  let refundedTheory = 0;
  for (const research of GENERALIZATION_RESEARCHES) {
    if (hasPurchasedGeneralizationResearch(research.id)) {
      refundedTheory = addBaseNumbers(refundedTheory, research.theoryCost);
    }
  }
  squareConvergencePoints = subtractNumberValues(squareConvergencePoints, generalizationResetCost);
  theory = addBaseNumbers(theory, refundedTheory);
  resetGeneralizationResearchState();
  generalizationResetCount += 1;
  generalizationResetCost = multiplyNumberValue(generalizationResetCost, 2);
  log(`일반화 연구를 초기화했습니다. ${fmt(refundedTheory)} 이론을 반환했습니다. 다음 초기화 비용: ${fmt(generalizationResetCost)} CP`, true);
  render();
  return true;
}

function resetRunStateAfterSquarePrestige() {
  if (typeof cancelMaximumPurchases === 'function') cancelMaximumPurchases();
  pendingSquarePrestigeValue = null;
  pendingSquarePrestigePoints = null;
  pendingSquarePrestigeRequirement = null;
  setBaseNumber(hasSquareBreakthrough('solid_start')
    ? 2000000
    : hasSquareUpgrade('restart_start_100k') ? 100000 : 0);
  perClick = 1;
  perClickUpgradeCost = 10;

  percentUnlocked = hasSquareUpgrade('restart_percent_unlock');
  percentCharge = 0;
  pendingPercentUses = 0;
  percentChargeNeeded = hasSquareBreakthrough('overcharge') ? 1 : 100;
  percentChargeLevel = 0;
  percentChargeUpgradeCost = 250;
  percentPower = 1;
  percentPowerPurchaseCount = 0;
  percentPowerPurchaseBonus = 0;
  percentPowerUpgradeCost = 40000;
  percentPowerCostCompounding = false;

  overflowed = false;
  squareMode = false;

  autoClickerUnlocked = hasSquareUpgrade('restart_auto_4x');
  autoClickerPrice = 100;
  autoClickerSpeed = 1000;
  autoClickerSpeedPrice = 200;
  autoClickerTimer = 0;
  autoUpgradeTimer = 0;
  autoClickerParallel = hasSquareUpgrade('restart_auto_4x') ? 4 : 1;
  autoClickerParallelPrice = hasSquareUpgrade('restart_auto_4x') ? 4000 : 1000;
  autoClickerPercentFillUnlocked = hasSquareUpgrade('restart_auto_percent_fill');

  percentAutoUnlocked = false;
  percentAutoPrice = 150;
  percentAutoSpeedLevel = 0;
  percentAutoSpeed = percentAutoSpeedLevels[percentAutoSpeedLevel];
  percentAutoSpeedPrice = 250;
  percentAutoTimer = 0;

  percentLaneCount = Math.max(
    hasSquareUpgrade('restart_percent_lane2') ? 2 : 1,
    targetPermanentPercentLaneCount()
  );
  nextPercentLaneUnlockCost = nextPercentLaneCostForCount(percentLaneCount);
  extraPercentLanes.length = 0;
  extraPercentLanesEl.innerHTML = '';
  for (let laneNumber = 2; laneNumber <= percentLaneCount; laneNumber++) {
    extraPercentLanes.push(makePercentLane(laneNumber));
  }
  maybeUnlockPercent();
}

function resetDivergerProgress() {
  divergerSpeedIntervalHistory = [];
  divergerN = 1;
  divergerPower = 0;
  divergerA = 1;
  divergerB = divergerBAtLevel(0);
  divergerC = 0;
  divergerInterval = DIVERGER_BASE_INTERVAL;
  divergerACpCost = 20;
  divergerBCpCost = 32;
  divergerCCpCost = 48;
  divergerSpeedCpCost = 10000;
  divergerALevel = 0;
  divergerBLevel = 0;
  divergerCLevel = 0;
  divergerSpeedLevel = 0;
  divergerTimer = 0;
  divergerAutoUpgradeTimer = 0;
  divergerAutoUpgradeCursor = 0;
  for (const history of Object.values(divergerUpgradeHistory)) history.length = 0;
  divergerGraphSamples.length = 0;
  divergerGraphScaleMinimum = null;
  divergerGraphScaleMaximum = null;
}

function loadDefinitionStoryState(saved) {
  definitionFragments = NumberMath.floor(numberValueFromSave(saved.definitionFragments));
  definitionStoryCompleted = saved.definitionStoryCompleted === true || isPositiveNumberValue(definitionFragments);
  const step = Number(saved.definitionStoryStep);
  definitionStoryStep = hasSpaceExpansionOneTimeUpgrade('definition_space') && !definitionStoryCompleted
    ? Number.isInteger(step) && step >= 1 && step <= DEFINITION_STORY_LINES.length ? step : 1 : 0;
}

function completeDefinitionStory() {
  if (definitionStoryCompleted || definitionStoryStep !== DEFINITION_STORY_LINES.length) return false;
  definitionStoryCompleted = true;
  definitionStoryStep = 0;
  definitionFragments = addBaseNumbers(definitionFragments, 1);
  // Clear the Knuth layer before the lower reset so starting upgrades and reserves cannot restore it.
  knuthPoints = 0;
  knuthUnlocked = false;
  hasClaimedKnuthPoint = false;
  pendingKnuthPointClaim = false;
  knuthOperationLevel = 0;
  loadKnuthBaseUpgradeLevels(null);
  loadKnuthBaseAutomation(null);
  clearKnuthEquipment();
  loadKnuthAdvancedEquipmentState({});
  knuthResetEquipmentOnNextPrestige = false;
  activeKnuthChallengeId = null;
  completedKnuthChallengeIds.clear();
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  shortestKnuthRealSeconds = null;
  longestKnuthRealSeconds = null;
  loadAbstractionResearchState(null);
  for (const id of Object.keys(abstractionResearchPaidCosts)) delete abstractionResearchPaidCosts[id];
  abstractionResetOnNextKnuthPoint = false;
  abstractionSecondBranchPurchaseOrder = [];
  automatiumPrestigeRetentionUnlocked = false;
  abstractionPermanentSp = 0;
  abstractionPermanentSingularities = 0;
  greatTheory = 0;
  totalGreatTheoryPurchased = 0;
  greatTheoryCpCost = ABSTRACTION_CP_BASE_COST;
  greatTheoryKpCost = ABSTRACTION_KP_BASE_COST;
  greatTheorySpCost = ABSTRACTION_SP_BASE_COST;
  greatTheoryTheoryCost = 4;
  abstractionCostResourceIndex = 0;
  spaceExpansionActive = false;
  loadSpaceExpansionResources({ spaceExpansionOneTimeUpgradeState: { definition_space: true } });
  loadSingularityState({});
  loadProbabilizerState({});
  numberBlackHoleSystemEnabled = false;
  numberBlackHoleAutoUpgradeEnabled = false;
  numberBlackHoleAutoMaxEnabled = false;
  numberBlackHoleAutoAmountLimit = null;
  numberBlackHoleAutoSpeedLimit = null;
  numberBlackHoleDonationPercent = NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT;
  numberBlackHoleDonationRate = NUMBER_BLACK_HOLE_BASE_DONATION_RATE;
  numberBlackHoleDonationAmountLevel = 0;
  numberBlackHoleDonationSpeedLevel = 0;
  numberBlackHoleDonationAmountCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
  numberBlackHoleDonationSpeedCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
  numberBlackHoleDonationResource = 'number';
  numberBlackHoleTotalInvested = 0;
  numberBlackHoleTotalSpInvested = 0;
  numberBlackHoleSpDonationCount = 0;
  numberBlackHoleAccumulatedGameSeconds = 0;
  numberBlackHolePassiveRadius = 0;
  if (typeof resetNumberBlackHoleTimers === 'function') resetNumberBlackHoleTimers();
  if (typeof resetSpaceExpansionClock === 'function') resetSpaceExpansionClock();
  if (typeof stopAutomatiumForDefinition === 'function') stopAutomatiumForDefinition();
  autoUpgradeEnabled = false;
  squareDimensionAutoUpgradeEnabled = false;
  resetProgressForNewKnuthRun({ restorePermanent: false });
  setChapter('multiplication');
  render();
  return true;
}

function resetProgressForNewKnuthRun({ preserveProduction = false, restorePermanent = true } = {}) {
  if (typeof cancelMaximumPurchases === 'function') cancelMaximumPurchases();
  resetKc4Time();
  const retainAutomatium = automatiumPrestigeRetentionUnlocked
    && hasSquareConvergenceUpgrade('automatium');
  squareRunGameSeconds = 0;
  knuthRunStartedAtMs = gameUtcNowMs();
  pendingKnuthCompletionSeconds = null;
  achievementRunProgress = makeAchievementRunProgress();
  pendingAchievementKnuthRun = null;
  resetSquarePrestigeCycleTime();
  knuthPercentOverflow = 0;
  resetSquareUpgradeState();
  resetSquareBreakthroughState();
  resetSquareConvergenceUpgradeState();
  if (retainAutomatium) {
    squareConvergenceUpgradeState.automatium = true;
    squareConvergenceUpgradeLevels.automatium = 1;
  }
  const dimensionAutoTimer = squareDimensionAutoUpgradeTimer;
  const productionInterval = divergerInterval;
  resetGeneralizationResearchState();
  if (preserveProduction) {
    squareDimensionAutoUpgradeTimer = dimensionAutoTimer;
    divergerInterval = productionInterval;
  }
  else {
    resetSquareDimensionState();
    resetDivergerProgress();
  }
  setSquarePoints(0, false);
  squareConvergencePoints = 0;
  hasEverEarnedSquareConvergencePoint = false;
  theory = 0;
  totalTheoryPurchased = 0;
  generalizationResetCount = 0;
  generalizationResetCost = GENERALIZATION_RESET_BASE_COST;
  theorySquarePointCost = THEORY_SQUARE_POINT_BASE_COST;
  theoryConvergencePointCost = THEORY_CONVERGENCE_POINT_BASE_COST;
  theoryCostResourceIndex = 0;
  squareUnlocked = false;
  squareConvergenceUnlocked = false;
  squareBreakthroughEntered = false;
  applyKnuthStartingUpgrades();
  resetRunStateAfterSquarePrestige();
  if (retainAutomatium) applyAutomatiumSquareUpgradeUnlocks();
  if (knuthResetEquipmentOnNextPrestige) {
    clearKnuthEquipment();
    knuthResetEquipmentOnNextPrestige = false;
  }
  if (knuthBaseUpgradeEffectLevel('starting_resources') > 0) {
    setBaseNumber(1e14);
    setSquarePoints(1e10, false);
    squareConvergencePoints = 1000;
    squareUnlocked = true;
    squareConvergenceUnlocked = true;
    hasEverEarnedSquareConvergencePoint = true;
  }
  if (restorePermanent) setSquarePoints(squarePoints);
}

function applyKnuthStartingUpgrades() {
  if (knuthBaseUpgradeEffectLevel('starting_upgrades') <= 0) return false;
  squareUnlocked = true;
  squareBreakthroughEntered = true;
  for (const upgrade of SQUARE_UPGRADES) squareUpgradeState[upgrade.id] = true;
  // Assign ownership without purchasing 8-1 or triggering another prestige.
  if (!isKnuthChallengeActive('kc3')) {
    for (const research of GENERALIZATION_RESEARCHES) generalizationResearchState[research.id] = true;
    squareDimensionAutoUpgradeEnabled = true;
  }
  for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) {
    squareBreakthroughLevels[upgrade.id] = isKnuthChallengeActive('kc1') && upgrade.id === 'dyson_swarm'
      ? 0 : squareBreakthroughMax(upgrade);
  }
  return true;
}

function startKnuthChallenge(id) {
  const challenge = knuthChallenge(id);
  if (!knuthUnlocked || !hasClaimedKnuthPoint || !challenge || activeKnuthChallengeId || spaceExpansionActive || hasCompletedKnuthChallenge(id)) return false;
  const dysonUpgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(upgrade => upgrade.id === 'dyson_swarm');
  knuthChallengeDysonSwarmMaxAtEntry = id === 'kc1'
    ? squareBreakthroughMax(dysonUpgrade)
    : 8;
  activeKnuthChallengeId = id;
  pendingKnuthPointClaim = false;
  resetProgressForNewKnuthRun();
  if (id === 'kc5') {
    trimKnuthEquipmentToCapacity();
    if (typeof resetNumberBlackHoleTimers === 'function') resetNumberBlackHoleTimers();
  }
  setChapter('multiplication');
  render();
  return true;
}

function resetKnuthChallengeForDev(id) {
  const challenge = knuthChallenge(id);
  if (!challenge) return false;
  const wasActive = activeKnuthChallengeId === id;
  const wasCompleted = hasCompletedKnuthChallenge(id);
  if (!wasActive && !wasCompleted) return false;

  activeKnuthChallengeId = null;
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  completedKnuthChallengeIds.delete(id);
  pendingKnuthPointClaim = false;
  if (wasActive) resetProgressForNewKnuthRun();
  setChapter('multiplication');
  render();
  return true;
}

function abandonKnuthChallenge() {
  if (!activeKnuthChallengeId) return false;
  activeKnuthChallengeId = null;
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  pendingKnuthPointClaim = false;
  resetProgressForNewKnuthRun();
  setChapter('multiplication');
  render();
  return true;
}

function canCompleteKnuthChallenge() {
  const challenge = knuthChallenge(activeKnuthChallengeId);
  if (!challenge) return false;
  const current = challenge.goalResource === 'cp' ? squareConvergencePoints : squarePoints;
  return compareNumberValues(current, challenge.goal) >= 0;
}

function completeKnuthChallenge() {
  const challenge = knuthChallenge(activeKnuthChallengeId);
  if (!challenge || !canCompleteKnuthChallenge()) return false;
  completedKnuthChallengeIds.add(challenge.id);
  activeKnuthChallengeId = null;
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  pendingKnuthPointClaim = false;
  resetProgressForNewKnuthRun();
  setChapter('multiplication');
  render();
  return true;
}

function forceCompleteKnuthChallengeForDev(id) {
  const challenge = knuthChallenge(id);
  if (!challenge || hasCompletedKnuthChallenge(id)) return false;
  knuthUnlocked = true;
  hasClaimedKnuthPoint = true;
  activeKnuthChallengeId = null;
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  pendingKnuthPointClaim = false;
  completedKnuthChallengeIds.add(id);
  resetProgressForNewKnuthRun();
  setChapter('multiplication');
  render();
  return true;
}

function claimKnuthPoint() {
  if (!pendingKnuthPointClaim) return false;
  if (typeof recordAchievementKnuthReward === 'function') {
    recordAchievementKnuthReward(1, pendingKnuthCompletionSeconds, pendingAchievementKnuthRun);
  }
  pendingAchievementKnuthRun = null;
  knuthPoints = addBaseNumbers(knuthPoints, 1);
  hasClaimedKnuthPoint = true;
  recordKnuthCompletion(pendingKnuthCompletionSeconds);
  pendingKnuthCompletionSeconds = null;
  pendingKnuthPointClaim = false;
  applyAbstractionResetOnKnuthPoint();
  render();
  return true;
}

function knuthPointGain() {
  if (!hasClaimedKnuthPoint) return 1;
  const cpLog10 = NumberMath.log10(squareConvergencePoints);
  const baseGain = hasAbstractionResearch('8-1')
    ? NumberMath.powerOfTen(NumberMath.divideApproximate(NumberMath.subtract(cpLog10, 15), 15))
    : NumberMath.divide(cpLog10, 15);
  let multiplier = multiplyNumberValue(abstractionSecondBranchKpMultiplier(), abstractionRandomPowerKpMultiplier());
  if (isPositiveNumberValue(singularityPoints) && isPositiveNumberValue(singularityUpgradeLevels.kp_gain)) {
    multiplier = multiplyNumberValue(multiplier, singularityKpMultiplier());
  }
  const totalMultiplier = spaceExpansionMultiplier(multiplyNumberValue(knuthBaseMultiplier('kp_gain', 5), multiplier));
  return NumberMath.floor(applyKnuthAdvancedPower('kp_power', multiplyNumberValue(
    NumberMath.floor(NumberMath.max(baseGain, 1)), totalMultiplier)));
}

function canManuallyExchangeKnuthPoints() {
  const unlockResearch = GENERALIZATION_RESEARCHES.find(research => research.id === '8-1');
  return knuthUnlocked
    && hasClaimedKnuthPoint
    && !activeKnuthChallengeId
    && hasGeneralizationResearch('8-1')
    && unlockResearch.parents.every(hasGeneralizationResearch);
}

function exchangeKnuthPointsManually() {
  if (!canManuallyExchangeKnuthPoints()) return false;
  beginKnuthPrestige();
  return true;
}

function beginKnuthPrestige({ spaceExpansionAfterPrestige = spaceExpansionActive } = {}) {
  const completionSeconds = knuthRunRealSeconds();
  if (typeof updateAchievements === 'function') updateAchievements();
  const claimedBefore = hasClaimedKnuthPoint;
  if (claimedBefore && !activeKnuthChallengeId) recordKnuthCompletion(completionSeconds);
  const gainedKnuthPoints = knuthPointGain();
  const preserveProduction = claimedBefore && hasAbstractionResearch('22-3');
  if (claimedBefore) recordAbstractionPermanentSp();
  const achievementRun = typeof snapshotAchievementKnuthRun === 'function'
    ? snapshotAchievementKnuthRun()
    : null;
  if (claimedBefore && typeof recordAchievementKnuthReward === 'function') {
    recordAchievementKnuthReward(gainedKnuthPoints, completionSeconds, achievementRun);
  }
  spaceExpansionActive = spaceExpansionAfterPrestige;
  activeKnuthChallengeId = null;
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  resetProgressForNewKnuthRun({ preserveProduction, restorePermanent: false });
  knuthUnlocked = true;
  pendingKnuthPointClaim = !claimedBefore;
  if (!claimedBefore) pendingKnuthCompletionSeconds = completionSeconds;
  if (!claimedBefore) pendingAchievementKnuthRun = achievementRun;
  if (claimedBefore) {
    knuthPoints = addBaseNumbers(knuthPoints, gainedKnuthPoints);
    applyAbstractionResetOnKnuthPoint();
  }
  setSquarePoints(squarePoints);
  if (!claimedBefore) setChapter('multiplication');
  render();
}
