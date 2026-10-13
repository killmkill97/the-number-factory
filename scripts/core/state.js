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
let numberBlackHoleSystemEnabled = false;
let numberBlackHoleDonationPercent = NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT;
let numberBlackHoleDonationRate = NUMBER_BLACK_HOLE_BASE_DONATION_RATE;
let numberBlackHoleDonationAmountLevel = 0;
let numberBlackHoleDonationSpeedLevel = 0;
let numberBlackHoleDonationAmountCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
let numberBlackHoleDonationSpeedCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
let numberBlackHoleTotalInvested = 0;
let numberBlackHoleAccumulatedGameSeconds = 0;
let hasClaimedKnuthPoint = false;
let pendingKnuthPointClaim = false;
let knuthOperationLevel = 0;
const knuthBaseUpgradeLevels = {};
let knuthResetEquipmentOnNextPrestige = false;
const knuthEquippedUpgradeIds = new Set();
let squareRunGameSeconds = 0;
let knuthRunStartedAtMs = Date.now();
let shortestKnuthRealSeconds = null;
let longestKnuthRealSeconds = null;
let pendingKnuthCompletionSeconds = null;
let squareSincePrestigeGameSeconds = 0;
let knuthPercentOverflow = 0;
let activeKnuthChallengeId = null;
let knuthChallengeDysonSwarmMaxAtEntry = 8;
const completedKnuthChallengeIds = new Set();
let activeChapter = 'multiplication';
let squarePoints = 0;
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
const divergerUpgradeHistory = {
  a: [],
  b: [],
  c: [],
  speed: []
};
const divergerGraphSamples = [];
let divergerGraphScaleMinimum = null;
let divergerGraphScaleMaximum = null;
let theory = 0;
let totalTheoryPurchased = 0;
let greatTheory = 0;
let greatTheoryCpCost = ABSTRACTION_CP_BASE_COST;
let greatTheoryKpCost = ABSTRACTION_KP_BASE_COST;
let greatTheorySpCost = ABSTRACTION_SP_BASE_COST;
let greatTheoryTheoryCost = 4;
let abstractionCostResourceIndex = 0;
let automatiumPrestigeRetentionUnlocked = false;
const abstractionResearchState = {};
const abstractionResearchPaidCosts = {};
let abstractionResetOnNextKnuthPoint = false;
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

function elapsedRealTimeSince(lastAt) {
  const now = gameClockNowMs();
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
  finalExponent = 1
) {
  if (compareNumberValues(value, 0) <= 0) return;
  const before = getBaseNumber();
  const finalGain = finalNumberProductionGain(
    value,
    finalMultiplier,
    before,
    softcapPower,
    purchaseBonus,
    finalExponent
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

function divergerDenominator() {
  return Math.max(1, 100 - abstractionEffectiveDivergerC());
}

function divergerLog10(value) {
  return NumberMath.log10Abs(value);
}

function divergerProductionValue(n = divergerN) {
  const a = abstractionEffectiveDivergerA();
  const aPower = hasGeneralizationResearch('5-3')
    ? NumberMath.power(a, 2)
    : a;
  const nPower = NumberMath.power(
    n,
    hasGeneralizationResearch('5-3')
      ? abstractionEffectiveDivergerB() + (abstractionEffectiveDivergerC() / 2)
      : abstractionEffectiveDivergerB()
  );
  return multiplyNumberValue(NumberMath.divideApproximate(
    multiplyNumberValue(aPower, nPower),
    divergerDenominator()
  ), knuthBaseMultiplier('diverger_gain', 2));
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

function divergerProductionForGraph(n = divergerN) {
  const production = divergerProductionValue(n);
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
  return knuthBaseUpgradeLevel('diverger_b_strength') > 0 ? 0.4 : 0.2;
}

function divergerBAtLevel(level) {
  return 1 + (Math.max(0, Math.floor(Number(level) || 0)) * divergerBUpgradeGain());
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
  const accelerated = gameTick(elapsedMs) * autoUpgradeSpeedMultiplier();
  const maximumTime = DIVERGER_AUTO_UPGRADE_INTERVAL * DIVERGER_AUTO_UPGRADE_BATCH_LIMIT;
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

function divergerACpCostAtLevel(level) {
  let cost = 20;
  for (let index = 0; index < level; index++) cost = scaleDivergerCpCost(cost, 3, 2);
  return cost;
}

function divergerBCpCostAtLevel(level) {
  let cost = 32;
  for (let index = 0; index < level; index++) cost = scaleDivergerCpCost(cost, 5, 2);
  return cost;
}

function divergerCCpCostAtLevel(level) {
  let cost = 48;
  for (let index = 0; index < level; index++) cost = multiplyNumberValue(cost, 2);
  return cost;
}

function divergerSpeedCpCostAtLevel(level) {
  let cost = 10000;
  for (let index = 0; index < level; index++) cost = scaleDivergerCpCost(cost, 3, 2);
  return cost;
}

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
    const saved = Array.isArray(savedHistory?.[key]) ? savedHistory[key] : [];
    for (let index = 0; index < level; index++) {
      if (saved[index] === undefined) {
        target.push(defaults[key]);
      } else if (legacyTheoryPaid && saved[index] === true) {
        target.push('legacy-theory');
      } else if (saved[index] === 'legacy-theory') {
        target.push('legacy-theory');
      } else {
        target.push(saved[index] === true);
      }
    }
  }
}

function advanceDiverger(elapsedMs) {
  if (!divergerAvailable() || overflowed || elapsedMs <= 0) return false;

  divergerTimer += gameTick(elapsedMs);
  const interval = divergerEffectiveInterval();
  const cycles = Math.floor(divergerTimer / interval);
  if (cycles <= 0) return false;
  divergerTimer = Math.max(0, divergerTimer - cycles * interval);

  const sampleProduction = n => {
    const production = divergerProductionValue(n);
    const productionLogarithm = divergerProductionForGraph(n);
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
      divergerN = addBaseNumbers(divergerN, 1);
      divergerPower = sampleProduction(divergerN);
    }
  } else {
    // Large accelerated spans use midpoint samples of the unchanged D(n)
    // formula instead of trying to execute an impractical number of cycles.
    const startingN = divergerN;
    const sampleCount = 32;
    for (let index = 0; index < sampleCount; index++) {
      const offset = cycles * ((index + 0.5) / sampleCount);
      const sampleN = addBaseNumbers(startingN, numberValueFromReal(offset));
      sampleProduction(sampleN);
    }
    divergerN = addBaseNumbers(startingN, numberValueFromReal(cycles));
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
    description: 'SP 획득량을 [수^(1/2400) / 종료수] 공식으로 계산합니다. 최소 획득량은 1 SP입니다.',
    parents: ['4-2'],
    theoryCost: 6
  },
  {
    id: '5-3',
    column: 5,
    row: 3,
    title: '발산자 공식 개선',
    description: '발산력 생산 공식이 D(n) = a^2 × n^(b+c/2) / (100 - c)로 변경됩니다.',
    parents: ['4-3', '4-2'],
    theoryCost: 6
  },
  {
    id: '5-4',
    column: 5,
    row: 4,
    title: '소프트캡 공식 개선',
    description: '소프트캡 공식이 1e12 × 10^(P^1.5 - 1 + O)로 변경됩니다.',
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
    description: '제곱력 생산 공식을 (xyz)^1까지 강화합니다.',
    parents: ['5-1'],
    theoryCost: 4
  },
  {
    id: '7-1',
    column: 7,
    row: 1,
    title: '제곱력 생산 공식 개선',
    description: '제곱력 생산 공식이 (xyz)^3이 됩니다.',
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
    description: '커누스를 해금합니다. 첫 커누스는 1 KP를 얻고, 이후에는 이 연구를 구매한 뒤 수동 교환으로 log10(CP) / 15 KP를 얻으며 업적을 제외한 모든 게임 진행을 초기화합니다.',
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
    description: '현재 수에서 획득 가능한 SP의 초당 1%를 지속적으로 생산합니다. 게임 시간 가속의 영향을 받습니다.',
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
    id: '3-1',
    column: 3,
    row: 1,
    title: 'automatium 영구 보존',
    description: 'automatium을 보유한 채 프레스티지를 하면 이후 진행에서도 구매 상태를 유지합니다. 한 번 연구하면 이 효과는 연구가 초기화되어도 남습니다.',
    parents: ['2-1'],
    greatTheoryCost: 1
  },
  {
    id: '4-1', column: 4, row: 1, branch: 'time', title: '시간의 거듭제곱',
    description: '시간 효과에 쓰는 T를 T^1.5로 계산합니다.',
    parents: ['3-1'], greatTheoryCost: 3
  },
  {
    id: '5-1', column: 5, row: 1, branch: 'time', title: '블랙홀 공명',
    description: '제곱력의 로그 L에 따라 블랙홀 시간 배율이 1+99L/(L+50)배 됩니다.',
    parents: ['4-1'], greatTheoryCost: 5
  },
  {
    id: '6-1', column: 6, row: 1, branch: 'time', title: '시간 회수',
    description: '경과 시간 U에 반비례해 매초 48/(1+U/300)초의 T를 추가로 얻습니다. U는 T^1.5 적용 전 제곱 게임 시간입니다.',
    parents: ['5-1'], greatTheoryCost: 8
  },
  {
    id: '4-2', column: 4, row: 2, branch: 'expansion', title: '지수 확장',
    description: '보유 KP의 로그 L에 따라 발산자의 b가 1+50L/(L+50)배 됩니다.',
    parents: ['3-1'], greatTheoryCost: 3
  },
  {
    id: '5-2', column: 5, row: 2, branch: 'expansion', title: '발산 수렴',
    description: '발산력 D에 따라 CP 획득량이 10^((log10(1+D))^(1/4)/2)배 됩니다.',
    parents: ['4-2'], greatTheoryCost: 5
  },
  {
    id: '6-2', column: 6, row: 2, branch: 'expansion', title: '차원 경계 확장',
    description: '제곱력의 로그 L에 따라 퍼센트 소프트캡을 ^[1+1.5L/(L+100)] 강화합니다.',
    parents: ['5-2'], greatTheoryCost: 8
  },
  {
    id: '4-3', column: 4, row: 3, branch: 'percent', title: '퍼센트 공진',
    description: '발산력과 제곱력의 로그 Ld, Lp에 따라 퍼센트 획득량이 10^(√(LdLp)/2)배 됩니다.',
    parents: ['3-1'], greatTheoryCost: 3
  },
  {
    id: '5-3', column: 5, row: 3, branch: 'percent', title: 'SP 경계 확장',
    description: '보유 SP의 로그 L에 따라 퍼센트 소프트캡을 ^[1+0.25L/(L+500)] 강화합니다. 강화 지수는 최대 1.25입니다.',
    parents: ['4-3'], greatTheoryCost: 5
  },
  {
    id: '6-3', column: 6, row: 3, branch: 'percent', title: '화폐 압축',
    description: 'SP·CP·KP·이론·대이론의 로그 합 L에 따라 퍼센트 파워 로그 가격을 최대 95% 할인합니다.',
    parents: ['5-3'], greatTheoryCost: 8
  },
  {
    id: '7-1', column: 7, row: 2, title: '발산자 자동 강화',
    description: '발산자의 a, b, c, 속도 강화를 자동 구매합니다. N의 buy diverger 명령도 해금합니다.',
    parents: ['6-1', '6-2', '6-3'], greatTheoryCost: 1
  },
  {
    id: '8-1', column: 8, row: 1, title: '커누스 포인트 공식 개선',
    description: '첫 커누스 이후 기본 KP 획득량을 floor(max(1, 10^((log10(CP)-15)/15)))로 개선합니다. 기존 KP 획득 배율은 유지됩니다.',
    parents: ['7-1'], greatTheoryCost: 4
  },
  {
    id: '8-2', column: 8, row: 3, title: '퍼센트 획득 제곱 강화',
    description: '소프트캡 감쇠와 배율을 적용한 최종 퍼센트 숫자 획득량을 4제곱합니다.',
    parents: ['7-1'], greatTheoryCost: 5
  },
  {
    id: '9-1', column: 9, row: 1, title: '커누스 수렴 공명',
    description: `보유 KP에 따라 최종 CP 획득량이 1+A×log2(1+(KP/B)^C)배 됩니다. A=${ABSTRACTION_TIER9_BALANCE.cpFromKp.strength}, B=${ABSTRACTION_TIER9_BALANCE.cpFromKp.scale}, C=${ABSTRACTION_TIER9_BALANCE.cpFromKp.curve}.`,
    parents: ['8-1'], greatTheoryCost: 4
  },
  {
    id: '9-2', column: 9, row: 3, title: '숫자 퍼센트 공명',
    description: `L=log10(1+수)에 따라 최종 퍼센트 숫자 획득량이 1+A×log2(1+(L/B)^C)배 됩니다. A=${ABSTRACTION_TIER9_BALANCE.percentFromNumber.strength}, B=${ABSTRACTION_TIER9_BALANCE.percentFromNumber.scale}, C=${ABSTRACTION_TIER9_BALANCE.percentFromNumber.curve}. 4제곱 적용 후의 배율입니다.`,
    parents: ['8-2'], greatTheoryCost: 4
  },
  {
    id: '10-1', column: 10, row: 2, title: '생산 시간 가속',
    description: '발산자와 모든 제곱 차원의 생산 속도가 4배 빨라집니다.',
    parents: ['9-1', '9-2'], greatTheoryCost: 2
  },
  {
    id: '11-1', column: 11, row: 2, title: '커누스 기본 증폭 강화',
    description: '기본 커누스 1그룹의 구매당 효과 배율이 1.25배 됩니다. CP 31.25배, SP 12500배, KP 6.25배, 발산력 2.5배, 제곱력 5배. 기존 구매분에도 적용됩니다.',
    parents: ['10-1'], greatTheoryCost: 4
  },
  {
    id: '12-1', column: 12, row: 1, branch: 'active', branchGroup: 2, title: '신속한 수렴',
    description: '커누스 현실 시간 U(초)에 따라 SP/CP ×[1+7/√(1+U/300)]. U는 T^1.5 영향을 받지 않습니다.',
    parents: ['11-1'], greatTheoryCost: 5
  },
  {
    id: '13-1', column: 13, row: 1, branch: 'active', branchGroup: 2, title: '최단 기록 공명',
    description: '최단 커누스 현실 초 U에 따라 KP ×[1+3/√(1+U/300)]. 현재 교환 기록도 포함.',
    parents: ['12-1'], greatTheoryCost: 6
  },
  {
    id: '14-1', column: 14, row: 1, branch: 'active', branchGroup: 2, title: '순간 발산',
    description: '속도 구매 감소량 ×8. a·b·c ×[1+2/√(1+U/300)]. U=커누스 현실 초. 분모≥1.',
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
    description: '현재 커누스 현실 시간이 길수록 SP와 CP 획득량이 증가합니다. M=1+5×log2(1+T/300).',
    parents: ['11-1'], greatTheoryCost: 5
  },
  {
    id: '13-3', column: 13, row: 3, branch: 'idle', branchGroup: 2, title: '최장 기록 공명',
    description: '최장 커누스 현실 초 t에 따라 KP ×[1+3×log2(1+t/300)]. 현재 교환 기록도 포함.',
    parents: ['12-3'], greatTheoryCost: 6
  },
  {
    id: '14-3', column: 14, row: 3, branch: 'idle', branchGroup: 2, title: '느리고 거대한 발산',
    description: '발산자 생산 속도가 1/10이 되는 대신 a, b, c의 효과값이 5배 됩니다. 분모는 최소 1입니다.',
    parents: ['13-3'], greatTheoryCost: 8
  }
];

for (const research of ABSTRACTION_RESEARCHES) {
  abstractionResearchState[research.id] = false;
}

const KNUTH_BASE_UPGRADES = [
  { id: 'cp_gain', group: 1, title: '수렴 증폭', description: 'CP 획득량이 구매마다 25배 증가합니다.', baseCost: 4, growth: 20 },
  { id: 'sp_gain', group: 1, title: '제곱 증폭', description: 'SP 획득량이 구매마다 10k배 증가합니다.', baseCost: 2, growth: 12 },
  { id: 'kp_gain', group: 1, title: '커누스 증폭', description: 'KP 획득량이 구매마다 5배 증가합니다.', baseCost: 500, growth: 25 },
  { id: 'diverger_gain', group: 1, title: '발산 증폭', description: '발산력이 구매마다 2배 증가합니다.', baseCost: 1500, growth: 50 },
  { id: 'dimension_gain', group: 1, title: '차원 증폭', description: '각 제곱 차원의 제곱력이 구매마다 4배 증가합니다.', baseCost: 10, growth: 10 },
  { id: 'dyson_limit', group: 2, title: '다이슨 스웜 확장', description: '다이슨 스웜 구매 한도 +1. 추가 구매분의 다음 가격은 (직전 가격 ×20)^1.01로 증가합니다.', baseCost: 50, growth: 100 },
  { id: 'number_black_hole', group: 2, title: '숫자 블랙홀', description: '숫자 블랙홀을 해금합니다.', baseCost: 20000 },
  { id: 'extra_branch', group: 2, title: '분기 확장', description: '추상화의 첫 번째 분기에서 두 가지 길을 선택할 수 있습니다.', baseCost: 5000000 },
  { id: 'diverger_b_strength', group: 2, title: '발산자 b 강화', description: 'b 강화의 증가량을 +0.2에서 +0.4로 늘립니다. 기존 구매분에도 적용됩니다.', baseCost: 10000000 },
  { id: 'starting_resources', group: 2, title: '커누스 출발 지원', description: '새 커누스 시작 시 수 100t, SP 10b, CP 1k를 지급합니다.', baseCost: 1000 },
  { id: 'overclock_limit', group: 3, title: '오버클럭 확장', description: '오버클럭 구매 한도 +4. 추가 구매분의 다음 가격은 (직전 가격 ×기존 상승률)^1.005로 증가합니다.', baseCost: 100, growth: 4 },
  { id: 'theory_exchange', group: 3, title: '대이론 교환', description: '이론으로 대이론을 구매합니다. 4이론부터 시작하며 구매마다 비용이 4배 증가합니다.', baseCost: 20000 }
];

function knuthBaseUpgradeLevel(id) {
  return knuthBaseUpgradeLevels[id] ?? 0;
}

function loadKnuthBaseUpgradeLevels(saved) {
  for (const upgrade of KNUTH_BASE_UPGRADES) {
    const value = Number(saved?.[upgrade.id] ?? 0);
    knuthBaseUpgradeLevels[upgrade.id] = Number.isSafeInteger(value) && value >= 0
      ? Math.min(upgrade.growth ? Number.MAX_SAFE_INTEGER : 1, value)
      : 0;
  }
}

function knuthBaseEffectPerPurchase(id, base) {
  const isFirstGroup = KNUTH_BASE_UPGRADES.some(upgrade => upgrade.id === id && upgrade.group === 1);
  return hasAbstractionResearch('11-1') && isFirstGroup ? base * 1.25 : base;
}

function knuthBaseMultiplier(id, base) {
  return NumberMath.power(knuthBaseEffectPerPurchase(id, base), knuthBaseUpgradeLevel(id));
}

function knuthBaseGroupUnlocked(group) {
  return KNUTH_BASE_UPGRADES.every(upgrade => upgrade.group >= group || knuthBaseUpgradeLevel(upgrade.id) > 0);
}

function knuthBaseUpgradeCost(upgrade) {
  return multiplyNumberValue(upgrade.baseCost, NumberMath.power(upgrade.growth ?? 1, knuthBaseUpgradeLevel(upgrade.id)));
}

function canBuyKnuthBaseUpgrade(id) {
  const upgrade = KNUTH_BASE_UPGRADES.find(item => item.id === id);
  if (!upgrade || !knuthUnlocked || !hasClaimedKnuthPoint || !knuthBaseGroupUnlocked(upgrade.group)) return false;
  const level = knuthBaseUpgradeLevel(id);
  return level < (upgrade.growth ? Number.MAX_SAFE_INTEGER : 1)
    && compareNumberValues(knuthPoints, knuthBaseUpgradeCost(upgrade)) >= 0;
}

function buyKnuthBaseUpgrade(id) {
  if (!canBuyKnuthBaseUpgrade(id)) return false;
  const upgrade = KNUTH_BASE_UPGRADES.find(item => item.id === id);
  knuthPoints = subtractNumberValues(knuthPoints, knuthBaseUpgradeCost(upgrade));
  knuthBaseUpgradeLevels[id] = knuthBaseUpgradeLevel(id) + 1;
  if (id === 'number_black_hole') {
    numberBlackHoleSystemEnabled = true;
    if (typeof resetNumberBlackHoleTimers === 'function') resetNumberBlackHoleTimers();
  }
  if (id === 'diverger_b_strength') divergerB = divergerBAtLevel(divergerBLevel);
  if ((id === 'diverger_gain' || id === 'diverger_b_strength') && divergerAvailable()) {
    divergerPower = divergerProductionValue();
  }
  render();
  return true;
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
    description: '현재 제곱 진행의 가속 게임 시간 T(초)에 따라 SP와 CP 획득량이 1+√T배가 됩니다.'
  },
  {
    id: 'percent_purchase_bonus',
    slots: 1,
    title: '연속 강화',
    description: '각 레인의 누적 추가 퍼센트 파워가 구매 횟수 x에 따라 20x/(x+1000)%로 증가합니다. 기본 상한을 넘어서도 적용됩니다.'
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
    description: '각 레인의 구매 횟수에 따라 퍼센트 파워의 로그 가격과 가격 상승을 줄입니다. 약 100회에서 최대 효과의 95%에 도달합니다.'
  },
  {
    id: 'percent_overflow',
    slots: 2,
    title: '퍼센트 오버플로우',
    description: '상한을 넘어 얻은 퍼센트 파워를 O로 누적합니다. SP와 CP 획득량이 1+3×log2(1+O/100000)배가 됩니다.'
  },
  {
    id: 'percent_time_discount',
    slots: 2,
    title: '시간의 할인',
    description: '현재 제곱 진행의 가속 게임 시간에 따라 퍼센트 파워의 로그 가격과 가격 상승을 줄입니다. 약 300초에서 최대 효과의 95%에 도달합니다.'
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
  }
];

function knuthChallenge(id) {
  return KNUTH_CHALLENGES.find(challenge => challenge.id === id) ?? null;
}

function hasCompletedKnuthChallenge(id) {
  return completedKnuthChallengeIds.has(id);
}

function isKnuthChallengeActive(id) {
  return activeKnuthChallengeId === id;
}

function knuthSlotCapacity() {
  return knuthOperationLevel;
}

function knuthSlotsUsed() {
  return KNUTH_SLOT_UPGRADES.reduce(
    (total, upgrade) => total + (knuthEquippedUpgradeIds.has(upgrade.id) ? upgrade.slots : 0),
    0
  );
}

function hasKnuthUpgrade(id) {
  return knuthEquippedUpgradeIds.has(id);
}

function knuthPercentOverflowMultiplier(overflow = knuthPercentOverflow) {
  const { strength, scale } = KNUTH_PERCENT_OVERFLOW_BALANCE;
  const ratio = NumberMath.divideApproximate(NumberMath.max(overflow, 0), scale);
  const logarithm = NumberMath.divideApproximate(NumberMath.log10(addBaseNumbers(1, ratio)), Math.log10(2));
  return addBaseNumbers(1, multiplyNumberValue(logarithm, strength));
}

function knuthSpCpGainMultiplier(resource = 'sp') {
  let multiplier = 1;
  if (hasKnuthUpgrade('knuth_time_gain')) {
    multiplier = addBaseNumbers(multiplier, NumberMath.power(abstractionEffectiveTime(), 0.5));
  }
  if (hasKnuthUpgrade('percent_overflow')) {
    multiplier = multiplyNumberValue(multiplier, knuthPercentOverflowMultiplier());
  }
  return multiplyNumberValue(multiplier, abstractionSecondBranchResourceMultiplier(resource));
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

function knuthOperationUpgradeCost() {
  return NumberMath.power(2, knuthOperationLevel);
}

function buyKnuthOperationUpgrade() {
  const cost = knuthOperationUpgradeCost();
  if (compareNumberValues(knuthPoints, cost) < 0) return false;

  knuthPoints = subtractNumberValues(knuthPoints, cost);
  knuthOperationLevel += 1;
  render();
  return true;
}

function toggleKnuthUpgrade(id) {
  const upgrade = KNUTH_SLOT_UPGRADES.find(item => item.id === id);
  if (!upgrade) return false;

  if (knuthEquippedUpgradeIds.has(id)) {
    if (!hasCompletedKnuthChallenge('kc1')) return false;
    knuthEquippedUpgradeIds.delete(id);
    render();
    return true;
  }
  if (knuthSlotsUsed() + upgrade.slots > knuthSlotCapacity()) return false;

  knuthEquippedUpgradeIds.add(id);
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

function dysonEffectMultiplier() {
  return NumberMath.power(2, effectiveDysonSwarmLevel());
}

function dysonEffectNumber() {
  return NumberMath.toNumber(dysonEffectMultiplier());
}

function effectiveDysonSwarmLevel() {
  if (isKnuthChallengeActive('kc1')) return 0;
  return squareBreakthroughLevel('dyson_swarm');
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
  const extra = upgrade.id === 'dyson_swarm' ? knuthBaseUpgradeLevel('dyson_limit')
    : upgrade.id === 'overclock' ? knuthBaseUpgradeLevel('overclock_limit') * 4 : 0;
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
  return multiplyNumberValue(multiplyNumberValue(basePower, divergerSquareDimensionMultiplier()), knuthBaseMultiplier('dimension_gain', 4));
}

function setSquareDimensionPowerForDev(value, index = 0) {
  if (!squareDimensionIsAvailable(index)) return false;

  const dimension = squareDimensionState(index);
  if (compareNumberValues(value, 0) === 0) {
    dimension.x = 0;
    return true;
  }

  const exponent = squareDimensionPowerExponent(index);
  const basePower = divideNumberValue(value, multiplyNumberValue(divergerSquareDimensionMultiplier(), knuthBaseMultiplier('dimension_gain', 4)));
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

  squarePoints = subtractNumberValues(squarePoints, cost);
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

  squarePoints = subtractNumberValues(squarePoints, totalCost);
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

  squarePoints = subtractNumberValues(squarePoints, dimension.powerIntervalCost);
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

  squarePoints = subtractNumberValues(squarePoints, cost);
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

  squareDimensionAutoUpgradeTimer += elapsedMs * autoUpgradeSpeedMultiplier();
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
  let gain = hasSquareUpgrade('sp_gain_double') ? 2 : 1;
  gain = multiplyNumberValue(gain, affectedNumberMultiplierValue(2, squareBreakthroughLevel('extra_investment')));
  return multiplyNumberValue(gain, knuthBaseMultiplier('sp_gain', 10000));
}

function squarePointGain() {
  return multiplyNumberValue(
    squarePointBaseGain(),
    knuthSpCpGainMultiplier()
  );
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
  return multiplyNumberValue(
    multiplyNumberValue(squarePointBaseGain(), gain),
    knuthSpCpGainMultiplier()
  );
}

function abstractionSpGainPerGameSecond() {
  if (!hasAbstractionResearch('1-1')) return 0;
  return multiplyNumberValue(squarePointGainForValue(getBaseNumber()), 0.01);
}

function abstractionSpGainPerRealSecond() {
  return multiplyNumberValue(abstractionSpGainPerGameSecond(), gameTick(1000) / 1000);
}

function advanceAbstraction(elapsedRealMs) {
  const elapsed = Number(elapsedRealMs);
  if (!hasAbstractionResearch('1-1') || !Number.isFinite(elapsed) || elapsed <= 0) return false;

  const possibleSp = squarePointGainForValue(getBaseNumber());
  if (compareNumberValues(possibleSp, 0) <= 0) return false;
  const gameElapsedMs = gameTick(elapsed);
  const gainedSp = multiplyNumberValue(possibleSp, gameElapsedMs / 100000);
  if (compareNumberValues(gainedSp, 0) <= 0) return false;

  squarePoints = addBaseNumbers(squarePoints, gainedSp);
  return true;
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
  return multiplyNumberValue(multiplier, squareDimensionNumberMultiplier());
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
  return 4 * dysonEffectNumber() * squareBreakthroughLevel('overclock');
}

function percentPowerPriceAccelerationStart() {
  const baseStart = 8 + (2 * dysonEffectNumber() * squareBreakthroughLevel('bottleneck_tracker'));
  if (!hasKnuthUpgrade('diverger_percent_price_delay')) return baseStart;

  return baseStart + divergerPercentPriceShiftMilestones() * 1e10;
}

function percentPowerSoftcapDecayPower() {
  // 소프트 캡 이후 생산량 감쇠의 기본 강도 K=2.
  // 기존 효율 개선 업그레이드는 감쇠를 한 단계 완화한다.
  return hasSquareUpgrade('percent_power_8') ? 1 : 2;
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
    multiplyNumberValue(gain, numberValueFromReal(percentBatchInvariant('efficiency', percentEfficiencyMultiplierNumerator))),
    4
  );
}

function percentPowerUpgradeCostForNextLevel(currentPower, baseCost = 40000) {
  const nextPower = normalizedPercentPower(currentPower) + 1;
  const standardExponent = nextPower - 2;
  const acceleratedLevels = Math.max(0, nextPower - percentPowerPriceAccelerationStart());
  const acceleratedExponent = (acceleratedLevels * (acceleratedLevels + 1)) / 2;
  return multiplyNumberValue(baseCost, powerOfTenValue(standardExponent + acceleratedExponent));
}

function percentPowerSoftcap(power, purchaseBonus = 0) {
  const powerLevel = normalizedPercentPower(power) + normalizedPercentPowerBonus(purchaseBonus);
  return percentBatchInvariant(`softcap:${powerLevel}`, () => calculatePercentPowerSoftcap(powerLevel));
}

function calculatePercentPowerSoftcap(powerLevel) {
  const powerExponent = hasGeneralizationResearch('5-4')
    ? Math.pow(powerLevel, 1.5)
    : powerLevel;
  const exponent = powerExponent + percentPowerSoftcapBonusLevels() - 1;
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
    const strength = 1 + 0.25 * abstractionLogRatio(squarePoints, 500, true);
    softcap = NumberMath.powerApproximate(softcap, strength);
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
  finalExponent = 1
) {
  const softenedGain = applyPercentSoftcapToProduction(
    baseGain,
    currentValue,
    softcapPower,
    purchaseBonus
  );
  const gain = multiplyNumberValue(softenedGain, finalMultiplier);
  return finalExponent === 1 ? gain : NumberMath.power(gain, finalExponent);
}

function percentProductionExponent() {
  return hasAbstractionResearch('8-2') ? 4 : 1;
}

function percentPreExponentMultiplier(value) {
  const multiplier = abstractionNumberPercentMultiplier(value);
  return percentProductionExponent() === 1
    ? multiplier
    : NumberMath.power(multiplier, 1 / percentProductionExponent());
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
  const gain = percentUseGain(value, power, purchaseBonus);
  if (!isPositiveNumberValue(gain)) return 0;
  addToBaseNumber(gain, source, power, purchaseBonus, percentPreExponentMultiplier(value), percentProductionExponent());
  return gain;
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
  if (percentPowerSoftcapDecayPower() === 1
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
    return multiplyNumberValue(constantGain, abstractionNumberPercentMultiplier(value));
  }
  return finalNumberProductionGain(
    percentUseGain(value, power, purchaseBonus),
    percentPreExponentMultiplier(value),
    value,
    power,
    purchaseBonus,
    exponent
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
  const ratio = (percentEffectivePower(power, purchaseBonus) * percentBatchInvariant('efficiency', percentEfficiencyMultiplierNumerator)) / 400;
  return multiplyNumberValue(
    multiplyNumberValue(
      numberValueFromReal(ratio),
      percentBatchInvariant('dimensions', squareDimensionNumberMultiplier)
    ),
    percentBatchInvariant('abstraction', abstractionPercentGainMultiplier)
  );
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
  const exponent = percentProductionExponent();
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
  if (hasAbstractionResearch('8-2') || hasAbstractionResearch('9-2')) {
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
  let tick = hasSquareUpgrade('game_speed_1_5') ? Math.floor(ms * 1.5) : ms;
  if (hasSquareBreakthrough('black_hole')) {
    tick = Math.floor(tick * 2 * dysonEffectNumber() * abstractionBlackHoleTimeMultiplier());
  }
  if (hasSquareConvergenceUpgrade('timium')) tick *= 2048;
  if (numberBlackHoleSystemEnabled && knuthUnlocked && ms > 0) {
    const existingMultiplier = tick / ms;
    const allowedMultiplier = NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER
      / Math.max(existingMultiplier, Number.MIN_VALUE);
    tick = Math.floor(tick * Math.min(numberBlackHoleTimeMultiplier(), allowedMultiplier));
  }
  return tick;
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
    percentPowerPriceAccelerationStart(),
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
  if (hasGeneralizationResearch('3-3')) {
    // A quadratic log-price floor eventually outgrows the P^1.5 softcap,
    // even with 90% discounts. Anchor it after the existing surge threshold.
    const researchLogarithm = addBaseNumbers(500, multiplyNumberValue(
      compoundingSteps,
      addBaseNumbers(999, compoundingSteps)
    ));
    return powerOfTenValue(researchLogarithm);
  }

  const minimumLogarithm = multiplyNumberValue(
    500,
    NumberMath.power(1.005, compoundingSteps)
  );
  return powerOfTenValue(minimumLogarithm);
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

function squareConvergencePointGain() {
  const requirement = squareConvergenceExchangeRequirement();
  if (compareNumberValues(squarePoints, requirement) < 0) return 0;

  const ratio = divideNumberValue(squarePoints, requirement);
  let gain = NumberMath.max(NumberMath.log10(ratio), 1);
  const upgradeLevel = squareConvergenceUpgradeLevel('cp_gain_5x');
  if (upgradeLevel > 0) {
    gain = multiplyNumberValue(gain, NumberMath.power(5, upgradeLevel));
  }
  return multiplyNumberValue(
    multiplyNumberValue(gain, knuthSpCpGainMultiplier('cp')),
    multiplyNumberValue(
      multiplyNumberValue(abstractionCpGainMultiplier(), abstractionKpCpGainMultiplier()),
      knuthBaseMultiplier('cp_gain', 25)
    )
  );
}

function squareConvergenceExchangeRequirement() {
  return hasGeneralizationResearch('2-2')
    ? SQUARE_CONVERGENCE_IMPROVED_EXCHANGE_REQUIREMENT
    : SQUARE_CONVERGENCE_EXCHANGE_REQUIREMENT;
}

function collectSquareConvergenceIfReady() {
  const gainedConvergencePoints = squareConvergencePointGain();
  if (!isPositiveNumberValue(gainedConvergencePoints)) return 0;

  squarePoints = 0;
  squareConvergencePoints = addBaseNumbers(squareConvergencePoints, gainedConvergencePoints);
  hasEverEarnedSquareConvergencePoint = true;
  if (hasGeneralizationResearch('4-4')) {
    squarePoints = addBaseNumbers(squarePoints, GENERALIZATION_CONVERGENCE_SP_REWARD);
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
    squarePoints = subtractNumberValues(squarePoints, totalCost);
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

function greatTheoryResourceLabel(resourceIndex) {
  return ['CP', 'KP', 'SP', '이론'][resourceIndex] ?? 'CP';
}

function greatTheoryCostGrowthForResource(resourceIndex) {
  if (resourceIndex === 0) return ABSTRACTION_CP_COST_GROWTH;
  if (resourceIndex === 1) return ABSTRACTION_KP_COST_GROWTH;
  if (resourceIndex === 3) return 4;
  return ABSTRACTION_SP_COST_GROWTH;
}

function greatTheoryBulkCost(resourceIndex, purchases, currentCost = greatTheoryCostForResource(resourceIndex)) {
  return theoryBulkCost(
    currentCost,
    greatTheoryCostGrowthForResource(resourceIndex),
    purchases,
    1
  );
}

function greatTheoryCanAffordPurchases(resourceIndex, available, purchases, currentCost) {
  const totalCost = greatTheoryBulkCost(resourceIndex, purchases, currentCost);
  if (compareNumberValues(available, totalCost) < 0) return false;

  if (resourceIndex === 2 && purchases > 1) {
    const growth = greatTheoryCostGrowthForResource(resourceIndex);
    const lastCost = theoryCostAfterPurchases(currentCost, growth, purchases - 1, 1);
    if (compareNumberValues(available, lastCost) === 0) return false;
  }
  return true;
}

function greatTheoryMaximumPurchases() {
  if (!canOpenAbstraction()) return 0;
  const resourceIndex = abstractionCostResourceIndex;
  if (resourceIndex === 3 && !knuthBaseUpgradeLevel('theory_exchange')) return 0;
  const available = [squareConvergencePoints, knuthPoints, squarePoints, theory][resourceIndex] ?? 0;
  const currentCost = greatTheoryCostForResource(resourceIndex);
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
  if (nextIndex === 3 && !knuthBaseUpgradeLevel('theory_exchange')) return false;
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
  const growth = greatTheoryCostGrowthForResource(resourceIndex);
  const totalCost = greatTheoryBulkCost(resourceIndex, purchases, currentCost);
  const nextCost = theoryCostAfterPurchases(currentCost, growth, purchases, 1);
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
    squarePoints = subtractNumberValues(squarePoints, totalCost);
    greatTheorySpCost = nextCost;
  }
  greatTheory = addBaseNumbers(greatTheory, numberValueFromReal(purchases));
  render();
  return true;
}

function hasAbstractionResearch(id) {
  return abstractionResearchState[id] === true;
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
    && (item.branchGroup ?? 1) === group && hasAbstractionResearch(item.id)).map(item => item.branch));
  const limit = group === 1 && knuthBaseUpgradeLevel('extra_branch') > 0 ? 2 : 1;
  return !selected.has(research.branch) && selected.size >= limit;
}

function canResearchAbstraction(id) {
  const research = ABSTRACTION_RESEARCHES.find(item => item.id === id);
  if (!research || hasAbstractionResearch(id) || !canOpenAbstraction()) return false;
  return !abstractionResearchBranchLocked(research)
    && abstractionResearchParentsReady(research)
    && compareNumberValues(greatTheory, research.greatTheoryCost) >= 0;
}

function researchAbstraction(id) {
  const research = ABSTRACTION_RESEARCHES.find(item => item.id === id);
  if (!research || !canResearchAbstraction(id)) return false;
  greatTheory = subtractNumberValues(greatTheory, research.greatTheoryCost);
  abstractionResearchState[id] = true;
  abstractionResearchPaidCosts[id] = research.greatTheoryCost;
  if (id === '3-1') automatiumPrestigeRetentionUnlocked = true;
  if (['14-1', '14-2', '14-3'].includes(id) && divergerAvailable()) {
    divergerPower = divergerProductionValue();
  }
  render();
  return true;
}

function loadAbstractionResearchState(savedState) {
  for (const research of ABSTRACTION_RESEARCHES) {
    abstractionResearchState[research.id] = savedState?.[research.id] === true;
  }
}

function loadAbstractionResetState(savedCosts, savedToggle) {
  abstractionResetOnNextKnuthPoint = savedToggle === true;
  for (const research of ABSTRACTION_RESEARCHES) {
    delete abstractionResearchPaidCosts[research.id];
    if (!hasAbstractionResearch(research.id)) continue;
    const paid = savedCosts?.[research.id];
    // Older saves have research flags, but no record of historical prices.
    abstractionResearchPaidCosts[research.id] = Number.isSafeInteger(paid) && paid >= 0
      ? paid : research.greatTheoryCost;
  }
}

function abstractionResearchRefund() {
  let refund = 0;
  for (const research of ABSTRACTION_RESEARCHES) {
    if (!hasAbstractionResearch(research.id)) continue;
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
  greatTheory = addBaseNumbers(greatTheory, abstractionResearchRefund());
  for (const research of ABSTRACTION_RESEARCHES) {
    abstractionResearchState[research.id] = false;
    delete abstractionResearchPaidCosts[research.id];
  }
  abstractionResetOnNextKnuthPoint = false;
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
  return base * abstractionSecondBranchParameterMultiplier('b');
}

function knuthRunRealSeconds(now = Date.now()) {
  return Math.max(0, (now - knuthRunStartedAtMs) / 1000);
}

function normalizedKnuthDuration(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function loadKnuthRealTimeState(saved = {}, now = Date.now()) {
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
  return 1 + strength * Math.log2(1 + seconds / ABSTRACTION_SECOND_BRANCH_BALANCE.timeScale);
}

function abstractionSecondBranchResourceMultiplier(resource = 'sp') {
  const tuning = ABSTRACTION_SECOND_BRANCH_BALANCE;
  const U = knuthRunRealSeconds();
  let multiplier = 1;
  if (hasAbstractionResearch('12-1')) multiplier *= abstractionActiveTimeBonus(U, tuning.activeResourceStrength);
  if (hasAbstractionResearch('12-2')) multiplier *= resource === 'cp' ? tuning.passiveCp : tuning.passiveSp;
  if (hasAbstractionResearch('12-3')) multiplier *= abstractionIdleTimeBonus(knuthRunRealSeconds(), tuning.idleResourceStrength);
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
  return multiplyNumberValue(isPositiveNumberValue(divergerA) ? divergerA : 1, abstractionSecondBranchParameterMultiplier('a'));
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

function researchGeneralization(id) {
  const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
  if (!research || !canResearchGeneralization(id)) return false;

  theory = subtractNumberValues(theory, research.theoryCost);
  generalizationResearchState[id] = true;
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
  render();
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
  divergerB = 1;
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

function resetProgressForNewKnuthRun() {
  const retainAutomatium = automatiumPrestigeRetentionUnlocked
    && hasSquareConvergenceUpgrade('automatium');
  squareRunGameSeconds = 0;
  knuthRunStartedAtMs = Date.now();
  pendingKnuthCompletionSeconds = null;
  resetSquarePrestigeCycleTime();
  knuthPercentOverflow = 0;
  resetSquareUpgradeState();
  resetSquareBreakthroughState();
  resetSquareConvergenceUpgradeState();
  if (retainAutomatium) {
    squareConvergenceUpgradeState.automatium = true;
    squareConvergenceUpgradeLevels.automatium = 1;
  }
  resetGeneralizationResearchState();
  resetSquareDimensionState();
  resetDivergerProgress();
  squarePoints = 0;
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
  resetRunStateAfterSquarePrestige();
  if (retainAutomatium) applyAutomatiumSquareUpgradeUnlocks();
  if (knuthResetEquipmentOnNextPrestige) {
    knuthEquippedUpgradeIds.clear();
    knuthResetEquipmentOnNextPrestige = false;
  }
  if (knuthBaseUpgradeLevel('starting_resources') > 0) {
    setBaseNumber(1e14);
    squarePoints = 1e10;
    squareConvergencePoints = 1000;
    squareUnlocked = true;
    squareConvergenceUnlocked = true;
    hasEverEarnedSquareConvergencePoint = true;
  }
}

function startKnuthChallenge(id) {
  const challenge = knuthChallenge(id);
  if (!knuthUnlocked || !hasClaimedKnuthPoint || !challenge || activeKnuthChallengeId || hasCompletedKnuthChallenge(id)) return false;
  const dysonUpgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(upgrade => upgrade.id === 'dyson_swarm');
  knuthChallengeDysonSwarmMaxAtEntry = id === 'kc1'
    ? squareBreakthroughMax(dysonUpgrade)
    : 8;
  activeKnuthChallengeId = id;
  pendingKnuthPointClaim = false;
  resetProgressForNewKnuthRun();
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
  return NumberMath.floor(multiplyNumberValue(
    multiplyNumberValue(NumberMath.floor(NumberMath.max(baseGain, 1)), knuthBaseMultiplier('kp_gain', 5)),
    abstractionSecondBranchKpMultiplier()
  ));
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

function beginKnuthPrestige() {
  const claimedBefore = hasClaimedKnuthPoint;
  const completionSeconds = knuthRunRealSeconds();
  if (claimedBefore && !activeKnuthChallengeId) recordKnuthCompletion(completionSeconds);
  const gainedKnuthPoints = knuthPointGain();
  activeKnuthChallengeId = null;
  knuthChallengeDysonSwarmMaxAtEntry = 8;
  resetProgressForNewKnuthRun();
  knuthUnlocked = true;
  pendingKnuthPointClaim = !claimedBefore;
  if (!claimedBefore) pendingKnuthCompletionSeconds = completionSeconds;
  if (claimedBefore) {
    knuthPoints = addBaseNumbers(knuthPoints, gainedKnuthPoints);
    applyAbstractionResetOnKnuthPoint();
  }
  setChapter('multiplication');
  render();
}
