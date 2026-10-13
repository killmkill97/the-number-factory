const AUTOMATIUM_STORAGE_KEY = 'numberTycoonAutomatiumPrograms_v1';
const AUTOMATIUM_COMMAND_BUDGET = 256;
const AUTOMATIUM_TICK_MS = 50;
const AUTOMATIUM_BULK_TICK_BUDGET_MS = 12;
const AUTOMATIUM_BULK_MAX_PER_TICK = 2048;
const AUTOMATIUM_BULK_MAX_PER_COMMAND = 512;
let automatiumBulkRemaining = 0;
let automatiumBulkDeadline = 0;
let automatiumBudgetYieldRequested = false;
const AUTOMATIUM_MAX_PROGRAMS = 32;
const AUTOMATIUM_CLICK_COOLDOWN_MS = 1000;

const N_BASE_UPGRADE_GUIDE = [
  { id: 'click', title: '클릭당 값', aliases: [] },
  { id: 'auto_clicker', title: '오토 클릭커', aliases: ['auto', 'auto_click'] },
  { id: 'auto_speed', title: '오토 클릭커 속도', aliases: [] },
  { id: 'auto_parallel', title: '오토 클릭커 병렬화', aliases: [] },
  { id: 'auto_percent', title: '오토 클릭커 퍼센트 채우기', aliases: ['auto_percent_fill'] },
  { id: 'percent_charge', title: '퍼센트 충전 요구량', aliases: [] },
  { id: 'percent_power', title: '퍼센트 파워', aliases: [], indexed: true },
  { id: 'percent_auto', title: '퍼센트 오토클리커', aliases: [], indexed: true },
  { id: 'percent_auto_speed', title: '퍼센트 오토클리커 속도', aliases: [], indexed: true },
  {
    id: 'percent_line',
    title: '퍼센트 사용 병렬화',
    aliases: ['percent_parallel', 'percent_parallelization', 'percent_lane']
  }
];

const N_BREAKTHROUGH_UPGRADE_ALIASES = {
  doctor_octopus: ['dr_octopus'],
  dyson_swarm: ['dyson'],
  percent_expansion: ['percent_line']
};

const automatiumWorkspace = document.getElementById('automatiumWorkspace');
const automatiumQuickPanel = document.getElementById('automatiumQuickPanel');
const automatiumQuickProgramList = document.getElementById('automatiumQuickProgramList');
const automatiumQuickCollapseBtn = document.getElementById('automatiumQuickCollapseBtn');
const automatiumQuickEditorBtn = document.getElementById('automatiumQuickEditorBtn');
const automatiumCloseBtn = document.getElementById('automatiumCloseBtn');
const automatiumNewBtn = document.getElementById('automatiumNewBtn');
const automatiumProgramList = document.getElementById('automatiumProgramList');
const automatiumProgramName = document.getElementById('automatiumProgramName');
const automatiumRenameBtn = document.getElementById('automatiumRenameBtn');
const automatiumSource = document.getElementById('automatiumSource');
const automatiumSourceWrap = document.getElementById('automatiumSourceWrap');
const automatiumCaretMirror = document.getElementById('automatiumCaretMirror');
const automatiumSaveBtn = document.getElementById('automatiumSaveBtn');
const automatiumDeleteBtn = document.getElementById('automatiumDeleteBtn');
const automatiumEditorStatus = document.getElementById('automatiumEditorStatus');
const automatiumEditorTabBtn = document.getElementById('automatiumEditorTabBtn');
const automatiumDocsTabBtn = document.getElementById('automatiumDocsTabBtn');
const automatiumIdsTabBtn = document.getElementById('automatiumIdsTabBtn');
const automatiumExamplesTabBtn = document.getElementById('automatiumExamplesTabBtn');
const automatiumEditorPanel = document.getElementById('automatiumEditorPanel');
const automatiumDocsPanel = document.getElementById('automatiumDocsPanel');
const automatiumIdsPanel = document.getElementById('automatiumIdsPanel');
const automatiumExamplesPanel = document.getElementById('automatiumExamplesPanel');
const automatiumDocs = document.getElementById('automatiumDocs');
const automatiumIdFilter = document.getElementById('automatiumIdFilter');
const automatiumIdCount = document.getElementById('automatiumIdCount');
const automatiumIdTableBody = document.getElementById('automatiumIdTableBody');
const automatiumExamples = document.getElementById('automatiumExamples');
const automatiumAutocomplete = document.getElementById('automatiumAutocomplete');

let automatiumPrograms = loadAutomatiumPrograms();
let selectedAutomatiumProgramId = automatiumPrograms[0]?.id ?? null;
let automatiumEditorDirty = false;
let automatiumNameDirty = false;
let automatiumUiDirty = true;
let activeAutomatiumTab = 'editor';
let automatiumAutocompleteItems = [];
let automatiumAutocompleteIndex = 0;
const automatiumExecutions = new Map();
const automatiumProgramUi = new Map();
const automatiumQuickProgramUi = new Map();
let automatiumEmptyListElement = null;
let automatiumQuickEmptyListElement = null;
let automatiumLastNumberClickAt = Number.NEGATIVE_INFINITY;
let automatiumLastTickAt = gameClockNowMs();

function automatiumId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `n-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultAutomatiumSource() {
  return `// 새 N 프로그램\nwhile true {\n    click\n}\n`;
}

function makeAutomatiumProgram(index = automatiumPrograms.length + 1) {
  return {
    id: automatiumId(),
    name: `프로그램 ${index}`,
    source: defaultAutomatiumSource(),
    enabled: false,
    updatedAt: Date.now()
  };
}

function loadAutomatiumPrograms() {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTOMATIUM_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, AUTOMATIUM_MAX_PROGRAMS).map((program, index) => ({
      id: typeof program?.id === 'string' && program.id ? program.id : automatiumId(),
      name: typeof program?.name === 'string' && program.name.trim() ? program.name.trim().slice(0, 40) : `프로그램 ${index + 1}`,
      source: typeof program?.source === 'string' ? program.source : '',
      enabled: program?.enabled === true,
      updatedAt: Number(program?.updatedAt) || Date.now()
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}

function saveAutomatiumPrograms() {
  try {
    localStorage.setItem(AUTOMATIUM_STORAGE_KEY, JSON.stringify(automatiumPrograms));
  } catch (error) {
    console.error(error);
    log('[automatium] 프로그램을 로컬 저장소에 저장하지 못했습니다.', true);
  }
}

function selectedAutomatiumProgram() {
  return automatiumPrograms.find(program => program.id === selectedAutomatiumProgramId) ?? null;
}

function normalizeNName(value) {
  return String(value ?? '').trim().toLowerCase().replace(/-/g, '_');
}

function nLanguageError(message, node) {
  throw new NLexer.NLanguageError(message, { line: node?.line ?? 1, column: 1 });
}

function nValueType(value) {
  if (
    (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' && /^\d+$/.test(value)) ||
    (typeof isApproximateNumber === 'function' && isApproximateNumber(value))
  ) return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'unknown';
}

function nLog2(value) {
  return NumberMath.floor(
    NumberMath.divideApproximate(NumberMath.log10(value), Math.log10(2))
  );
}

function nPercentLaneNumber(rawIndex, node) {
  if (rawIndex === null || rawIndex === undefined) return null;
  if (nValueType(rawIndex) !== 'number') {
    nLanguageError('퍼센트 레인 번호는 number여야 합니다.', node);
  }
  const numericIndex = realNumberFromValue(rawIndex);
  const laneNumber = Math.floor(numericIndex);
  if (!Number.isSafeInteger(numericIndex) || numericIndex !== laneNumber) {
    nLanguageError('퍼센트 레인 번호는 정수여야 합니다.', node);
  }
  if (laneNumber < 1 || laneNumber > MAX_PERCENT_LANES) {
    nLanguageError(`퍼센트 레인 번호는 1부터 ${MAX_PERCENT_LANES}까지 사용할 수 있습니다.`, node);
  }
  return laneNumber;
}

function nPercentLaneUpgradeSnapshot(id, laneNumber, node) {
  const laneExists = laneNumber <= percentLaneCount;
  const lane = laneNumber === 1
    ? null
    : extraPercentLanes.find(item => item.laneNumber === laneNumber) ?? null;

  if (id === 'percent_power') {
    const power = laneNumber === 1 ? percentPower : lane?.power ?? 1;
    const purchaseBonus = laneNumber === 1 ? percentPowerPurchaseBonus : lane?.powerPurchaseBonus ?? 0;
    const rawCost = laneNumber === 1 ? percentPowerUpgradeCost : lane?.powerCost ?? scaleByLane(40000, laneNumber);
    const purchaseCount = laneNumber === 1 ? percentPowerPurchaseCount : lane?.powerPurchaseCount ?? 0;
    const cost = percentPowerCost(
      rawCost,
      laneNumber === 1 ? percentPowerCostCompounding : lane?.powerCostCompounding ?? false,
      purchaseCount,
      scaleByLane(40000, laneNumber)
    );
    return {
      upgraded: numberValueFromReal(purchaseCount),
      amount: numberValueFromReal(percentEffectivePower(power, purchaseBonus)),
      cost,
      max: 0,
      available: laneExists && !overflowed && percentUnlocked && percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE && percentPowerCostAvailable(cost) && canAffordBaseCost(cost),
      buy: () => laneNumber === 1 ? upgradePercentPower() : lane ? buyExtraLanePower(lane) : false
    };
  }

  if (id === 'percent_auto') {
    const unlocked = laneNumber === 1 ? percentAutoUnlocked : lane?.autoUnlocked ?? false;
    const rawCost = laneNumber === 1 ? percentAutoPrice : lane?.autoPrice ?? scaleByLane(150, laneNumber);
    const cost = discountedCost(rawCost);
    return {
      upgraded: unlocked ? 1 : 0,
      amount: unlocked ? 1 : 0,
      cost: unlocked ? 0 : cost,
      max: 1,
      available: laneExists && !overflowed && percentUnlocked && !unlocked && canAffordBaseCost(cost),
      buy: () => laneNumber === 1 ? buyPercentAuto() : lane ? buyExtraLaneAuto(lane) : false
    };
  }

  if (id === 'percent_auto_speed') {
    const speedLevel = laneNumber === 1 ? percentAutoSpeedLevel : lane?.autoSpeedLevel ?? 0;
    const speed = laneNumber === 1 ? percentAutoSpeed : lane?.autoSpeed ?? 1000;
    const unlocked = laneNumber === 1 ? percentAutoUnlocked : lane?.autoUnlocked ?? false;
    const rawCost = laneNumber === 1 ? percentAutoSpeedPrice : lane?.autoSpeedPrice ?? scaleByLane(250, laneNumber);
    const cost = discountedCost(rawCost);
    const maxed = speed <= percentAutoMinSpeed();
    return {
      upgraded: numberValueFromReal(speedLevel),
      amount: numberValueFromReal(speed),
      cost: maxed ? 0 : cost,
      max: percentAutoMinSpeed() < 200 ? 5 : 4,
      available: laneExists && !overflowed && percentUnlocked && unlocked && !maxed && canAffordBaseCost(cost),
      buy: () => laneNumber === 1 ? upgradePercentAutoSpeed() : lane ? upgradeExtraLaneAutoSpeed(lane) : false
    };
  }

  nLanguageError(`'${id}' 업그레이드는 퍼센트 레인 번호를 사용할 수 없습니다.`, node);
}

function nBaseUpgradeSnapshot(rawUpgrade, node, rawLaneIndex = null) {
  const aliases = {
    click: 'click',
    auto: 'auto_clicker',
    auto_click: 'auto_clicker',
    auto_clicker: 'auto_clicker',
    auto_speed: 'auto_speed',
    auto_parallel: 'auto_parallel',
    auto_percent: 'auto_percent',
    auto_percent_fill: 'auto_percent',
    percent_charge: 'percent_charge',
    percent_power: 'percent_power',
    percent_auto: 'percent_auto',
    percent_auto_speed: 'percent_auto_speed',
    percent_line: 'percent_line',
    percent_parallel: 'percent_line',
    percent_parallelization: 'percent_line',
    percent_lane: 'percent_line'
  };
  const id = aliases[normalizeNName(rawUpgrade)];
  if (!id) nLanguageError(`알 수 없는 base 업그레이드 '${rawUpgrade}'`, node);
  const laneNumber = nPercentLaneNumber(rawLaneIndex, node);
  if (laneNumber !== null) return nPercentLaneUpgradeSnapshot(id, laneNumber, node);

  const definitions = {
    click: () => {
      const cost = discountedCost(perClickUpgradeCost);
      return {
        upgraded: subtractNumberValues(perClick, 1),
        amount: effectivePerClick(),
        cost,
        max: subtractNumberValues(BASE_PER_CLICK_CAP, 1),
        available: !overflowed && perClick < BASE_PER_CLICK_CAP && canAffordBaseCost(cost),
        buy: upgradePerClick
      };
    },
    auto_clicker: () => {
      const cost = discountedCost(autoClickerPrice);
      return {
        upgraded: autoClickerUnlocked ? 1 : 0,
        amount: autoClickerUnlocked ? 1 : 0,
        cost: autoClickerUnlocked ? 0 : cost,
        max: 1,
        available: !overflowed && !autoClickerUnlocked && canAffordBaseCost(cost),
        buy: buyAutoClicker
      };
    },
    auto_speed: () => {
      const cost = discountedCost(autoClickerSpeedPrice);
      return {
        upgraded: nLog2(divideNumberValue(autoClickerSpeedPrice, 200)),
        amount: numberValueFromReal(autoClickerSpeed),
        cost: autoClickerSpeed <= autoClickerMinSpeed() ? 0 : cost,
        max: autoClickerMinSpeed() < 25 ? 8 : 7,
        available: !overflowed && autoClickerUnlocked && autoClickerSpeed > autoClickerMinSpeed() && canAffordBaseCost(cost),
        buy: upgradeAutoClickerSpeed
      };
    },
    auto_parallel: () => {
      const cost = discountedCost(autoClickerParallelPrice);
      return {
        upgraded: nLog2(autoClickerParallel),
        amount: autoClickerParallel,
        cost: autoClickerParallel >= autoClickerParallelCap() ? 0 : cost,
        max: nLog2(autoClickerParallelCap()),
        available: !overflowed && autoClickerUnlocked && autoClickerParallel < autoClickerParallelCap() && canAffordBaseCost(cost),
        buy: upgradeAutoClickerParallel
      };
    },
    auto_percent: () => {
      const cost = discountedCost(autoClickerPercentFillPrice);
      return {
        upgraded: autoClickerPercentFillUnlocked ? 1 : 0,
        amount: autoClickerPercentFillUnlocked ? 1 : 0,
        cost: autoClickerPercentFillUnlocked ? 0 : cost,
        max: 1,
        available: !overflowed && autoClickerUnlocked && percentUnlocked && !autoClickerPercentFillUnlocked && canAffordBaseCost(cost),
        buy: buyAutoClickerPercentFill
      };
    },
    percent_charge: () => {
      const cost = discountedCost(percentChargeUpgradeCost);
      return {
        upgraded: numberValueFromReal(percentChargeLevel),
        amount: numberValueFromReal(percentChargeNeeded),
        cost: percentChargeNeeded <= minimumPercentChargeNeeded() ? 0 : cost,
        max: numberValueFromReal(percentChargeLevel + Math.ceil((percentChargeNeeded - minimumPercentChargeNeeded()) / percentChargeReduction())),
        available: !overflowed && percentUnlocked && percentChargeNeeded > minimumPercentChargeNeeded() && canAffordBaseCost(cost),
        buy: upgradePercentCharge
      };
    },
    percent_power: () => {
      const cost = percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
      return {
        upgraded: numberValueFromReal(percentPowerPurchaseCount),
        amount: numberValueFromReal(percentEffectivePower(percentPower, percentPowerPurchaseBonus)),
        cost,
        max: 0,
        available: !overflowed && percentUnlocked && percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE && percentPowerCostAvailable(cost) && canAffordBaseCost(cost),
        buy: upgradePercentPower
      };
    },
    percent_auto: () => {
      const cost = discountedCost(percentAutoPrice);
      return {
        upgraded: percentAutoUnlocked ? 1 : 0,
        amount: percentAutoUnlocked ? 1 : 0,
        cost: percentAutoUnlocked ? 0 : cost,
        max: 1,
        available: !overflowed && percentUnlocked && !percentAutoUnlocked && canAffordBaseCost(cost),
        buy: buyPercentAuto
      };
    },
    percent_auto_speed: () => {
      const cost = discountedCost(percentAutoSpeedPrice);
      return {
        upgraded: nLog2(divideNumberValue(percentAutoSpeedPrice, 250)),
        amount: numberValueFromReal(percentAutoSpeed),
        cost: percentAutoSpeed <= percentAutoMinSpeed() ? 0 : cost,
        max: percentAutoMinSpeed() < 200 ? 5 : 4,
        available: !overflowed && percentUnlocked && percentAutoUnlocked && percentAutoSpeed > percentAutoMinSpeed() && canAffordBaseCost(cost),
        buy: upgradePercentAutoSpeed
      };
    },
    percent_line: () => {
      const cost = discountedCost(nextPercentLaneUnlockCost);
      return {
        upgraded: numberValueFromReal(percentLaneCount - 1),
        amount: numberValueFromReal(percentLaneCount),
        cost: percentLaneCount >= percentLaneLimit() ? 0 : cost,
        max: numberValueFromReal(percentLaneLimit() - 1),
        available: !overflowed && percentUnlocked && percentLaneCount < percentLaneLimit() && canAffordBaseCost(cost),
        buy: unlockNextPercentLane
      };
    }
  };
  return definitions[id]();
}

function nSquareUpgradeAmount(id) {
  const bought = hasSquareUpgrade(id);
  const amounts = {
    click_double: () => bought ? 2 : 1,
    percent_power_8: () => numberValueFromReal(percentPowerSoftcapDecayPower()),
    percent_auto_125: () => numberValueFromReal(percentAutoMinSpeed()),
    percent_charge_minus_16: () => numberValueFromReal(percentChargeReduction()),
    all_cost_half: () => bought ? 0.5 : 1,
    auto_parallel_64: () => autoClickerParallelCap(),
    game_speed_1_5: () => bought ? 1.5 : 1,
    sp_gain_double: () => bought ? 2 : 1,
    auto_upgrade_top_down: () => autoUpgradeEnabled,
    skip_cutscene: () => bought,
    restart_percent_unlock: () => bought,
    restart_auto_4x: () => bought ? 4 : 0,
    restart_auto_percent_fill: () => bought,
    restart_start_100k: () => numberValueFromReal(bought ? 100000 : 0),
    restart_percent_lane2: () => numberValueFromReal(bought ? 2 : 1)
  };
  return (amounts[id] ?? (() => bought ? 1 : 0))();
}

function nSquareUpgradeSnapshot(rawUpgrade, node) {
  const id = normalizeNName(rawUpgrade);
  const upgrade = SQUARE_UPGRADES.find(item => item.id === id);
  if (!upgrade) nLanguageError(`알 수 없는 square 업그레이드 '${rawUpgrade}'`, node);
  const bought = hasSquareUpgrade(id);
  return {
    upgraded: numberValueFromReal(bought ? 1 : 0),
    amount: nSquareUpgradeAmount(id),
    cost: bought ? 0 : upgrade.cost,
    max: 1,
    available: squareUnlocked && !bought && compareNumberValues(squarePoints, upgrade.cost) >= 0,
    buy: () => buySquareUpgrade(id)
  };
}

function nBreakthroughUpgradeAmount(id, level) {
  if (id === 'black_hole') return level > 0 ? 2 * dysonEffectNumber() : 1;
  if (id === 'extra_investment') return affectedNumberMultiplierValue(2, level);
  if (id === 'tas') return numberValueFromReal(autoClickerMinSpeed());
  if (id === 'invisible_hand') return autoUpgradeSpeedMultiplier();
  if (id === 'overclock') return numberValueFromReal(4 * dysonEffectNumber() * level);
  if (id === 'deflation') return level > 0 ? 0.1 : 1;
  if (id === 'doctor_octopus') return affectedNumberMultiplierValue(8, level);
  if (id === 'solid_start') return level > 0 ? 2000000 : 0;
  if (id === 'overcharge') return numberValueFromReal(minimumPercentChargeNeeded());
  if (id === 'gregtech') return affectedNumberMultiplierValue(2, level);
  if (id === 'bottleneck_tracker') return percentEfficiencyMultiplier();
  if (id === 'percent_expansion') return numberValueFromReal(percentLaneLimit());
  if (id === 'dyson_swarm') return dysonEffectMultiplier();
  return numberValueFromReal(level);
}

function nBreakthroughUpgradeSnapshot(rawUpgrade, node) {
  const aliases = {
    dr_octopus: 'doctor_octopus',
    doctor_octopus: 'doctor_octopus',
    dyson: 'dyson_swarm',
    percent_line: 'percent_expansion'
  };
  const normalized = normalizeNName(rawUpgrade);
  const id = aliases[normalized] ?? normalized;
  const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === id);
  if (!upgrade) nLanguageError(`알 수 없는 square_break 업그레이드 '${rawUpgrade}'`, node);
  const level = squareBreakthroughLevel(id);
  const max = squareBreakthroughMax(upgrade);
  const cost = squareBreakthroughCost(upgrade);
  return {
    upgraded: numberValueFromReal(level),
    amount: nBreakthroughUpgradeAmount(id, level),
    cost: cost ?? 0,
    max: numberValueFromReal(max),
    available: canOpenSquareBreakthrough()
      && !(id === 'dyson_swarm' && isKnuthChallengeActive('kc1'))
      && cost !== null
      && compareNumberValues(squarePoints, cost) >= 0,
    buy: () => buySquareBreakthroughUpgrade(id)
  };
}

function nConvergenceUpgradeSnapshot(rawUpgrade, node) {
  const id = normalizeNName(rawUpgrade);
  const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
  if (!upgrade) nLanguageError(`알 수 없는 square_convergence 업그레이드 '${rawUpgrade}'`, node);
  const bought = hasSquareConvergenceUpgrade(id);
  const level = squareConvergenceUpgradeLevel(id);
  const max = upgrade.max ?? (upgrade.repeatable ? 0 : 1);
  const finished = max > 0 && (upgrade.max ? level >= max : bought);
  const cost = finished ? 0 : squareConvergenceUpgradeCost(upgrade);
  const amounts = {
    timium: () => bought ? 2048 : 1,
    galaxium: () => bought ? 2048 : 1,
    automatium: () => bought,
    cp_gain_5x: () => NumberMath.power(5, level)
  };
  return {
    upgraded: numberValueFromReal(level),
    amount: (amounts[id] ?? (() => bought))(),
    cost,
    max,
    available: canOpenSquareConvergence() && !finished && compareNumberValues(squareConvergencePoints, cost) >= 0,
    buy: () => buySquareConvergenceUpgrade(id)
  };
}

function nGeneralizationResearchSnapshot(rawResearch, node) {
  const id = String(rawResearch ?? '').trim().toLowerCase().replace(/_/g, '-');
  const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
  if (!research) nLanguageError(`알 수 없는 일반화 연구 '${rawResearch}'`, node);
  const bought = hasGeneralizationResearch(id);
  return {
    upgraded: bought ? 1 : 0,
    amount: bought ? 1 : 0,
    cost: bought ? 0 : research.theoryCost,
    max: 1,
    available: canResearchGeneralization(id),
    buy: () => researchGeneralization(id)
  };
}

function nTheoryPurchaseSnapshot(rawResource, node) {
  const resource = normalizeNName(rawResource);
  const resourceIndex = resource === 'sp' ? 0 : resource === 'cp' ? 1 : -1;
  if (resourceIndex < 0) nLanguageError(`이론 구매 화폐는 sp 또는 cp여야 합니다: '${rawResource}'`, node);
  const cost = theoryCostForResource(resourceIndex);
  return {
    upgraded: totalTheoryPurchased,
    amount: theory,
    cost,
    max: 0,
    available: canOpenSquareConvergence() && canAffordTheoryResource(resourceIndex),
    buy: () => {
      theoryCostResourceIndex = resourceIndex;
      return researchTheory();
    }
  };
}

function nDivergerUpgradeSnapshot(rawUpgrade, node) {
  const id = normalizeNName(rawUpgrade);
  const upgrades = {
    a: { level: divergerALevel, amount: divergerA, cost: divergerACpCost, max: 0, buy: buyDivergerAUpgrade },
    b: { level: divergerBLevel, amount: divergerB, cost: divergerBCpCost, max: 0, buy: buyDivergerBUpgrade },
    c: { level: divergerCLevel, amount: divergerC, cost: divergerCCpCost, max: DIVERGER_C_MAX, buy: buyDivergerCUpgrade },
    speed: { level: divergerSpeedLevel, amount: divergerInterval, cost: divergerSpeedCpCost,
      max: 0, buy: buyDivergerSpeedUpgrade }
  };
  const upgrade = upgrades[id];
  if (!upgrade) nLanguageError(`알 수 없는 diverger 업그레이드 '${rawUpgrade}'`, node);
  const atMaximum = id === 'c' ? divergerC >= DIVERGER_C_MAX
    : id === 'speed' ? divergerInterval <= divergerMinInterval() : false;
  return {
    upgraded: numberValueFromReal(upgrade.level),
    amount: upgrade.amount,
    cost: atMaximum ? 0 : upgrade.cost,
    max: numberValueFromReal(id === 'speed' ? divergerSpeedLevelFromInterval(divergerMinInterval()) : upgrade.max),
    available: divergerAutoUpgradeAvailable() && !atMaximum && divergerCanAfford(upgrade.cost),
    buy: () => divergerAutoUpgradeAvailable() && upgrade.buy()
  };
}

function nUpgradeSnapshot(rawKind, rawUpgrade, node, rawUpgradeIndex = null) {
  const aliases = {
    base: 'base',
    square: 'square',
    square_break: 'square_break',
    squarebreak: 'square_break',
    square_breakthrough: 'square_break',
    convergence: 'square_convergence',
    square_convergence: 'square_convergence',
    cp: 'square_convergence',
    generalization: 'generalization',
    gz: 'generalization',
    theory: 'theory',
    diverger: 'diverger'
  };
  const kind = aliases[normalizeNName(rawKind)];
  if (!kind) nLanguageError(`알 수 없는 업그레이드 종류 '${rawKind}'`, node);
  if (kind === 'base') return nBaseUpgradeSnapshot(rawUpgrade, node, rawUpgradeIndex);
  if (rawUpgradeIndex !== null) {
    nLanguageError(`'${kind}' 업그레이드는 레인 번호를 사용할 수 없습니다.`, node);
  }
  if (kind === 'square') return nSquareUpgradeSnapshot(rawUpgrade, node);
  if (kind === 'square_break') return nBreakthroughUpgradeSnapshot(rawUpgrade, node);
  if (kind === 'generalization') return nGeneralizationResearchSnapshot(rawUpgrade, node);
  if (kind === 'theory') return nTheoryPurchaseSnapshot(rawUpgrade, node);
  if (kind === 'diverger') return nDivergerUpgradeSnapshot(rawUpgrade, node);
  return nConvergenceUpgradeSnapshot(rawUpgrade, node);
}

const automatiumGameAdapter = {
  click() {
    const now = Date.now();
    if (now - automatiumLastNumberClickAt < AUTOMATIUM_CLICK_COOLDOWN_MS) return false;
    if (!performManualNumberClick()) return false;
    automatiumLastNumberClickAt = now;
    return true;
  },

  get(path, node) {
    const names = path.map(segment => segment.name);
    if (path.length === 1) {
      if (names[0] === 'number') return getBaseNumber();
      if (names[0] === 'sp') return squarePoints;
      if (names[0] === 'cp') return squareConvergencePoints;
      nLanguageError(`알 수 없는 게임 값 'get.${names.join('.')}'`, node);
    }
    if (path.length !== 3) {
      nLanguageError(`업그레이드 값은 get.<종류>.<업그레이드>.<내용> 형식이어야 합니다.`, node);
    }
    const propertyName = normalizeNName(names[2]);
    const property = propertyName === 'amout' ? 'amount' : propertyName;
    if (!['upgraded', 'amount', 'cost', 'max', 'available'].includes(property)) {
      nLanguageError(`알 수 없는 업그레이드 내용 '${names[2]}'`, node);
    }
    if (path[0].index !== null || path[1].index !== null) {
      nLanguageError('조회할 레인 번호는 맨 뒤에 붙여야 합니다. 예: get.base.percent_auto.amount[2]', node);
    }
    return nUpgradeSnapshot(names[0], names[1], node, path[2].index)[property];
  },

  buy(kind, upgrade, upgradeIndex, node) {
    const bulkEnabled = hasGeneralizationResearch('3-4');
    automatiumBudgetYieldRequested = false;
    if (bulkEnabled && (automatiumBulkRemaining <= 0 || gameClockNowMs() >= automatiumBulkDeadline)) {
      automatiumBudgetYieldRequested = true;
      return false;
    }
    let snapshot = nUpgradeSnapshot(kind, upgrade, node, upgradeIndex);
    if (!snapshot.available) return false;
    if (!bulkEnabled) return snapshot.buy() === true;

    const reusablePercentPower = normalizeNName(kind) === 'base'
      && normalizeNName(upgrade) === 'percent_power';
    const limit = Math.min(AUTOMATIUM_BULK_MAX_PER_COMMAND, automatiumBulkRemaining);
    let purchased = 0;
    let resourceBefore = reusablePercentPower ? getBaseNumber() : null;
    while (purchased < limit && snapshot.available) {
      if (snapshot.buy() !== true) break;
      purchased++;
      if (reusablePercentPower) {
        if (purchased % 16 === 0) {
          const nextSnapshot = nUpgradeSnapshot(kind, upgrade, node, upgradeIndex);
          if (compareNumberValues(nextSnapshot.cost, snapshot.cost) <= 0
            && compareNumberValues(getBaseNumber(), resourceBefore) >= 0) break;
          snapshot = nextSnapshot;
          resourceBefore = getBaseNumber();
        }
      } else {
        snapshot = nUpgradeSnapshot(kind, upgrade, node, upgradeIndex);
      }
      if (purchased % 4 === 0 && gameClockNowMs() >= automatiumBulkDeadline) break;
    }
    automatiumBulkRemaining -= purchased;
    return purchased > 0;
  },

  consumeBudgetYield() {
    const requested = automatiumBudgetYieldRequested;
    automatiumBudgetYieldRequested = false;
    return requested;
  },

  square(statement, requestedSp = null, programId = null) {
    if (squareUnlocked) {
      const gain = squarePointGainForValue(getBaseNumber());
      if (!isPositiveNumberValue(gain)) return false;
      if (requestedSp !== null && compareNumberValues(gain, requestedSp) < 0) return false;
      return exchangeSquarePointsManually();
    }

    const explicitTarget = requestedSp !== null;
    const reward = explicitTarget ? squarePrestigeTargetPointReward(requestedSp) : null;
    const requiredValue = explicitTarget
      ? squarePrestigeNumberForPointReward(reward)
      : gameEndValue();

    if (compareBaseNumber(requiredValue) < 0) return false;
    return completeSquarePrestige({
      skippedCutscene: true,
      keepCurrentChapter: false,
      prestigeValue: explicitTarget ? requiredValue : getBaseNumber(),
      squarePointReward: explicitTarget ? reward : null,
      requiredValue
    });
  },

  cp(statement, requestedCp = null) {
    if (!squareUnlocked) return false;
    const gain = squareConvergencePointGain();
    if (!isPositiveNumberValue(gain)) return false;
    if (requestedCp !== null && compareNumberValues(gain, requestedCp) < 0) return false;
    return exchangeSquareConvergencePointsManually();
  }
};

function automatiumGameAdapterFor(programId) {
  return {
    click: (...args) => automatiumGameAdapter.click(...args),
    get: (...args) => automatiumGameAdapter.get(...args),
    buy: (...args) => automatiumGameAdapter.buy(...args),
    consumeBudgetYield: (...args) => automatiumGameAdapter.consumeBudgetYield(...args),
    square: (statement, target) => automatiumGameAdapter.square(statement, target, programId),
    cp: (...args) => automatiumGameAdapter.cp(...args)
  };
}

function setAutomatiumRuntimeStatus(programId, status, message) {
  const execution = automatiumExecutions.get(programId);
  if (!execution) return;
  if (execution.status === status && execution.message === message) return;
  execution.status = status;
  execution.message = message;
  automatiumUiDirty = true;
}

function runAutomatiumSecretCommand(program) {
  if (program.source.trim() !== 'killmkill97') return false;

  program.enabled = false;
  const achievementUnlocked = typeof unlockAchievement === 'function'
    && unlockAchievement('killmkill97_program');
  if (achievementUnlocked && typeof render === 'function') render();

  const youtubeWindow = window.open(
    'https://www.youtube.com/@killMkill97',
    '_blank',
    'noopener,noreferrer'
  );
  const message = youtubeWindow
    ? '비밀 명령 실행 완료 · 유튜브를 열었습니다'
    : '비밀 명령 실행 완료 · 팝업이 차단되었을 수 있습니다';
  automatiumExecutions.set(program.id, {
    iterator: null,
    status: 'done',
    message,
    waitTicks: 0
  });
  automatiumUiDirty = true;
  saveAutomatiumPrograms();
  return true;
}

function startAutomatiumProgram(program) {
  if (runAutomatiumSecretCommand(program)) return true;
  try {
    const ast = NRuntime.compile(program.source);
    const execution = NRuntime.createExecution(ast, automatiumGameAdapterFor(program.id));
    automatiumExecutions.set(program.id, {
      ...execution,
      status: 'running',
      message: '실행 중',
      waitTicks: 0,
      waitUntil: 0
    });
    return true;
  } catch (error) {
    automatiumExecutions.set(program.id, {
      iterator: null,
      status: 'error',
      message: error.message,
      waitTicks: 0
    });
    program.enabled = false;
    return false;
  } finally {
    automatiumUiDirty = true;
  }
}

function stopAutomatiumProgram(program, message = '꺼짐') {
  program.enabled = false;
  automatiumExecutions.delete(program.id);
  automatiumExecutions.set(program.id, {
    iterator: null,
    status: 'off',
    message,
    waitTicks: 0
  });
  automatiumUiDirty = true;
}

function failAutomatiumProgram(program, error) {
  program.enabled = false;
  automatiumExecutions.set(program.id, {
    iterator: null,
    status: 'error',
    message: error?.message ?? String(error),
    waitTicks: 0
  });
  saveAutomatiumPrograms();
  automatiumUiDirty = true;
  log(`[N:${program.name}] ${error?.message ?? error}`, true);
}

function toggleAutomatiumProgram(programId) {
  const program = automatiumPrograms.find(item => item.id === programId);
  if (!program || !hasSquareConvergenceUpgrade('automatium')) return false;
  if (program.enabled) {
    stopAutomatiumProgram(program);
  } else {
    program.enabled = true;
    startAutomatiumProgram(program);
  }
  program.updatedAt = Date.now();
  saveAutomatiumPrograms();
  renderAutomatiumUi();
  return program.enabled;
}

function automatiumStatus(program) {
  if (!hasSquareConvergenceUpgrade('automatium')) return { label: '잠김', tone: 'off' };
  const execution = automatiumExecutions.get(program.id);
  if (!program.enabled) {
    if (execution?.status === 'error') return { label: '오류', tone: 'error' };
    return { label: 'OFF', tone: 'off' };
  }
  if (!execution) return { label: '준비', tone: 'waiting' };
  if (execution.status === 'blocked') return { label: '대기', tone: 'waiting' };
  if (execution.status === 'waiting') return { label: '틱 대기', tone: 'waiting' };
  return { label: 'ON', tone: 'running' };
}

function setAutomatiumTab(tabName) {
  const tabs = {
    editor: { button: automatiumEditorTabBtn, panel: automatiumEditorPanel },
    docs: { button: automatiumDocsTabBtn, panel: automatiumDocsPanel },
    ids: { button: automatiumIdsTabBtn, panel: automatiumIdsPanel },
    examples: { button: automatiumExamplesTabBtn, panel: automatiumExamplesPanel }
  };
  if (!tabs[tabName]) return false;

  activeAutomatiumTab = tabName;
  for (const [name, tab] of Object.entries(tabs)) {
    const active = name === tabName;
    tab.button.classList.toggle('active', active);
    tab.button.setAttribute('aria-selected', String(active));
    tab.panel.classList.toggle('hidden', !active);
  }
  if (tabName === 'ids') renderAutomatiumUpgradeIds();
  if (tabName !== 'editor') hideAutomatiumAutocomplete();
  return true;
}

function renderAutomatiumDocs() {
  automatiumDocs.innerHTML = `
    <h3>N 언어 설명서</h3>
    <p>N은 automatium 프로그램을 위한 미니 언어입니다. 프로그램을 저장한 뒤 왼쪽 목록의 ON 버튼으로 실행합니다. 모든 프로그램은 자동화 틱마다 합계 256개 명령까지만 실행됩니다.</p>

    <h4>변수와 자료형</h4>
    <p>변수는 먼저 <code>number</code> 또는 <code>boolean</code>으로 선언한 뒤 값을 대입해야 합니다.</p>
    <pre><code>x = number
flag = boolean

x = (get.sp + 10) * 2
flag = get.cp == 0</code></pre>

    <h4>게임 값 읽기</h4>
    <table>
      <thead><tr><th>코드</th><th>값</th></tr></thead>
      <tbody>
        <tr><td><code>get.number</code></td><td>현재 베이스 숫자</td></tr>
        <tr><td><code>get.sp</code></td><td>현재 SP</td></tr>
        <tr><td><code>get.cp</code></td><td>현재 CP</td></tr>
      </tbody>
    </table>
    <p>업그레이드는 <code>get.&lt;종류&gt;.&lt;ID&gt;.&lt;내용&gt;</code>으로 읽습니다. 정확한 종류와 ID는 <strong>업그레이드 ID</strong> 탭에서 확인할 수 있습니다.</p>
    <table>
      <thead><tr><th>내용</th><th>반환값</th></tr></thead>
      <tbody>
        <tr><td><code>upgraded</code></td><td>현재 구매 횟수</td></tr>
        <tr><td><code>amount</code></td><td>현재 실제 효과값</td></tr>
        <tr><td><code>cost</code></td><td>다음 구매 가격. 최대 단계에서는 0</td></tr>
        <tr><td><code>max</code></td><td>현재 최대 구매 횟수 (0이면 제한 없음)</td></tr>
        <tr><td><code>available</code></td><td>지금 구매할 수 있으면 true</td></tr>
      </tbody>
    </table>
    <pre><code>get.base.click.available
get.square.click_double.upgraded
get.square_break.doctor_octopus.cost
get.square_convergence.timium.amount</code></pre>

    <h4>퍼센트 레인 지정</h4>
    <p>퍼센트 파워, 퍼센트 오토클리커, 퍼센트 오토 속도는 맨 뒤에 <code>[레인 번호]</code>를 붙여 구분합니다. 1번은 기본 퍼센트 레인이며 최대 16번까지 지정할 수 있습니다. 아직 열리지 않은 레인의 <code>available</code>은 <code>false</code>입니다.</p>
    <pre><code>get.base.percent_auto.amount[2]
get.base.percent_power.cost[3]
get.base.percent_auto_speed.available[8]

lane = number
lane = 2
get.base.percent_auto.upgraded[lane]</code></pre>

    <h4>업그레이드 구매</h4>
    <pre><code>buy base click
buy square_break doctor_octopus
buy square_break doctor_octopus s
buy base percent_auto[2]
buy generalization 2-2
buy gz 3-1 s
buy theory sp
buy theory cp s
buy diverger a
buy diverger b
buy diverger c
buy diverger speed s</code></pre>
    <p><code>generalization</code>은 <code>gz</code>로 줄여 쓸 수 있습니다. <code>buy theory sp</code>와 <code>buy theory cp</code>는 지정한 화폐로 이론을 구매합니다. <code>buy</code>는 구매할 수 없으면 다음 줄로 넘어가며, 끝에 <code>s</code>를 붙이면 구매 가능할 때까지 현재 프로그램만 대기합니다. 일반화 연구 3-4가 있으면 자동 구매 가속량만큼 한 틱에 여러 번 구매할 수 있습니다.</p>
    <p>추상화 연구 7-1 이후 <code>buy diverger a/b/c/speed</code>로 발산자를 CP로 강화합니다. 실제 명령에는 하나의 ID만 적습니다. <code>get.diverger.a.cost</code>, <code>get.diverger.b.amount</code> 등 기존 조회 문법도 지원합니다. 속도의 <code>amount</code>는 현재 간격(ms), <code>max</code>는 현재 하한 기준 최대 구매 횟수입니다. a와 b의 <code>max</code>는 제한 없음을 뜻하는 0입니다. 발산자 자동 강화 토글과 N 프로그램은 별도로 작동합니다.</p>

    <h4>숫자 클릭</h4>
    <pre><code>click

while true {
    click
}</code></pre>
    <p><code>click</code>은 베이스의 숫자 추가 버튼을 직접 한 번 누른 것과 같은 효과를 냅니다. 모든 N 프로그램을 합쳐 실제 1초에 최대 한 번만 작동합니다. 쿨다운 중에 실행된 <code>click</code>은 기다리거나 쌓이지 않고 즉시 다음 줄로 넘어갑니다.</p>

    <h4>시간 대기</h4>
    <pre><code>wait 500ms
wait 2s
wait 3m
wait 1h</code></pre>
    <p><code>wait</code>는 현재 프로그램만 지정한 실제 시간 동안 멈춥니다. 단위는 밀리초(<code>ms</code>), 초(<code>s</code>), 분(<code>m</code>), 시간(<code>h</code>)을 지원합니다.</p>

    <h4>SP·CP 획득</h4>
    <pre><code>square
sp
sp 10
square 10 s
cp
cp 5 s

target = number
target = 20
sp target s</code></pre>
    <p><code>square</code>와 <code>sp</code>는 현재 가능한 제곱 포인트 수동 교환을 실행합니다. <code>cp</code>는 현재 가능한 수렴 포인트 수동 교환을 실행합니다. 숫자를 붙이면 업그레이드 배율을 포함한 실제 획득량이 그 목표 이상일 때 교환합니다. 교환할 수 없으면 다음 줄로 넘어가며, 끝에 <code>s</code>를 붙인 명령만 조건을 만족할 때까지 현재 프로그램을 대기시킵니다.</p>

    <h4>조건문</h4>
    <pre><code>if get.sp &gt;= 1000 and get.cp == 0 {
    buy square_break dyson_swarm
}
elif get.sp &gt;= 16 {
    buy square_break doctor_octopus
}
else {
    square s
}</code></pre>

    <h4>반복문</h4>
    <pre><code>while true {
    square s
}

whiletick 20 get.sp &lt; 1000 {
    buy square_break doctor_octopus
}

for 10 {
    square
}</code></pre>
    <p><code>whiletick 20</code>은 조건이 참인 동안 20 자동화 틱마다 본문을 한 번 실행합니다. <code>break</code>는 가장 가까운 <code>while</code>, <code>whiletick</code>, <code>for</code>를 빠져나옵니다. SP와 CP 교환은 각각 <code>sp</code>, <code>cp</code> 명령으로 자동화할 수 있습니다.</p>

    <h4>연산자</h4>
    <p>산술: <code>+ - * / % ^</code> · 비교: <code>== != &gt; &gt;= &lt; &lt;=</code> · 논리: <code>and or not</code>. 괄호도 사용할 수 있습니다. 정수끼리 나누면 소수점 이하는 버립니다. <code>1e1000</code>처럼 큰 과학적 표기법도 변수, 계산, 비교, SP/CP 목표값에 사용할 수 있습니다.</p>
    <pre><code>x = number
x = (2 ^ 10 + 100) * 2

if x &gt;= 2000 and not false {
    square
}</code></pre>

    <h4>주석과 저장</h4>
    <pre><code>// 한 줄 주석

/*
여러 줄 주석
*/</code></pre>
    <p><code>Ctrl+S</code>로 현재 이름과 코드를 저장할 수 있습니다. 저장할 때 문법을 검사하며, 오류가 있으면 프로그램이 꺼지고 편집기 아래에 줄 번호와 오류가 표시됩니다.</p>

    <h4>자동완성</h4>
    <p>코드를 입력하면 현재 위치에 맞는 명령, 게임 값, 업그레이드 ID와 변수가 표시됩니다. <code>↑</code>/<code>↓</code>로 항목을 고르고 <code>Tab</code>으로 입력합니다. 제안이 없을 때 <code>Tab</code>은 공백 4칸을 넣습니다.</p>
  `;
}

function automatiumUpgradeIdRows() {
  const rows = N_BASE_UPGRADE_GUIDE.map(upgrade => ({
    kind: 'base',
    kindLabel: '베이스',
    title: upgrade.title,
    id: upgrade.id,
    rawId: upgrade.id,
    indexed: upgrade.indexed === true,
    aliases: upgrade.aliases,
    indexNote: upgrade.indexed ? '조회: 내용[n] · 구매: ID[n]' : '-'
  }));

  rows.push(...SQUARE_UPGRADES.map(upgrade => ({
    kind: 'square',
    kindLabel: '제곱',
    title: upgrade.title,
    id: upgrade.id,
    rawId: upgrade.id,
    indexed: false,
    aliases: [],
    indexNote: '-'
  })));

  rows.push(...SQUARE_BREAKTHROUGH_UPGRADES.map(upgrade => ({
    kind: 'square_break',
    kindLabel: '제곱돌파',
    title: upgrade.title,
    id: upgrade.id,
    rawId: upgrade.id,
    indexed: false,
    aliases: N_BREAKTHROUGH_UPGRADE_ALIASES[upgrade.id] ?? [],
    indexNote: '-'
  })));

  rows.push(...SQUARE_CONVERGENCE_UPGRADES.map(upgrade => ({
    kind: 'square_convergence',
    kindLabel: '제곱 수렴',
    title: upgrade.title,
    id: upgrade.id,
    rawId: upgrade.id,
    indexed: false,
    aliases: [],
    indexNote: '-'
  })));

  rows.push(...GENERALIZATION_RESEARCHES.map(research => ({
    kind: 'generalization',
    kindLabel: '일반화 연구',
    title: research.title,
    id: research.id,
    rawId: research.id,
    indexed: false,
    aliases: ['gz'],
    indexNote: '구매: buy generalization ID 또는 buy gz ID'
  })));

  rows.push(...['a', 'b', 'c', 'speed'].map(id => ({
    kind: 'diverger', kindLabel: '발산자',
    title: id === 'speed' ? '발산자 속도 강화' : `발산자 ${id} 강화`,
    id, rawId: id, indexed: false, aliases: [],
    indexNote: '추상화 7-1 필요 · CP 구매'
  })));

  rows.push(
    {
      kind: 'theory',
      kindLabel: '이론',
      title: 'SP로 이론 구매',
      id: 'sp',
      rawId: 'sp',
      indexed: false,
      aliases: [],
      indexNote: '구매 전용'
    },
    {
      kind: 'theory',
      kindLabel: '이론',
      title: 'CP로 이론 구매',
      id: 'cp',
      rawId: 'cp',
      indexed: false,
      aliases: [],
      indexNote: '구매 전용'
    }
  );
  return rows;
}

function renderAutomatiumUpgradeIds() {
  const query = normalizeNName(automatiumIdFilter.value);
  const rows = automatiumUpgradeIdRows().filter(row => {
    if (!query) return true;
    const searchable = [row.kind, row.kindLabel, row.title, row.id, row.indexNote, ...row.aliases]
      .join(' ')
      .toLowerCase();
    return searchable.includes(query);
  });

  automatiumIdTableBody.innerHTML = '';
  for (const row of rows) {
    const tableRow = document.createElement('tr');
    const values = [row.kind, row.title, row.id, row.aliases.join(', ') || '-', row.indexNote];
    for (const [index, value] of values.entries()) {
      const cell = document.createElement('td');
      if (index === 0 || index >= 2) {
        const code = document.createElement('code');
        code.textContent = value;
        cell.appendChild(code);
      } else {
        cell.textContent = value;
      }
      tableRow.appendChild(cell);
    }
    automatiumIdTableBody.appendChild(tableRow);
  }
  automatiumIdCount.textContent = `${rows.length}개`;
}

function automatiumProgramExamplesList() {
  const baseSingleIds = N_BASE_UPGRADE_GUIDE
    .filter(upgrade => !upgrade.indexed)
    .map(upgrade => `    buy base ${upgrade.id}`)
    .join('\n');
  const baseIndexedIds = Array.from({ length: MAX_PERCENT_LANES }, (_, index) => {
    const laneNumber = index + 1;
    return N_BASE_UPGRADE_GUIDE
      .filter(upgrade => upgrade.indexed)
      .map(upgrade => `    buy base ${upgrade.id}[${laneNumber}]`)
      .join('\n');
  }).join('\n');
  const squareCommands = SQUARE_UPGRADES
    .map(upgrade => `    buy square ${upgrade.id}`)
    .join('\n');
  const breakthroughCommands = SQUARE_BREAKTHROUGH_UPGRADES
    .map(upgrade => `    buy square_break ${upgrade.id}`)
    .join('\n');
  const convergenceCommands = SQUARE_CONVERGENCE_UPGRADES
    .map(upgrade => `    buy square_convergence ${upgrade.id}`)
    .join('\n');

  return [
    {
      id: 'all_base',
      title: '모든 기본 업글 자동 구매',
      description: `구매 가능한 베이스 업그레이드와 1~${MAX_PERCENT_LANES}번 퍼센트 레인의 업그레이드를 반복해서 확인합니다. SP 교환은 하지 않습니다.`,
      source: `// 모든 기본 업그레이드 자동 구매
while true {
${baseSingleIds}
${baseIndexedIds}
}`
    },
    {
      id: 'all_square',
      title: '모든 제곱 업글 자동 구매',
      description: 'SP가 생길 때마다 구매 가능한 제곱 업그레이드를 전부 확인합니다.',
      source: `// 모든 제곱 업그레이드 자동 구매
while true {
${squareCommands}
    square s
}`
    },
    {
      id: 'all_breakthrough',
      title: '모든 제곱돌파 업글 자동 구매',
      description: '중첩 업그레이드를 포함해 제곱돌파 업그레이드를 최대 단계까지 반복 구매합니다.',
      source: `// 모든 제곱돌파 업그레이드 자동 구매
while true {
${breakthroughCommands}
    square s
}`
    },
    {
      id: 'all_convergence',
      title: '모든 제곱 수렴 업글 자동 구매',
      description: 'CP가 생길 때마다 구매하지 않은 제곱 수렴 업그레이드를 확인합니다.',
      source: `// 모든 제곱 수렴 업그레이드 자동 구매
while true {
${convergenceCommands}
    cp s
}`
    },
    {
      id: 'all_diverger',
      title: '모든 발산자 업글 자동 구매',
      description: '추상화 7-1 이후 a, b, c, 속도 강화를 CP로 반복 구매합니다.',
      source: `// 추상화 7-1 필요
while true {
    buy diverger a
    buy diverger b
    buy diverger c
    buy diverger speed
}`
    },
    {
      id: 'generalization_to_knuth',
      title: '이론 구매와 일반화 8-1 자동 연구',
      description: 'CP를 한 번 이상 얻은 뒤 사용합니다. 보유 SP·CP로 이론과 8-1의 필수 선행 연구를 구매합니다. SP·CP 교환은 하지 않으며, 8-1 구매 후 종료합니다.',
      source: `// CP 획득 후 실행. 다른 프로그램에서 재화를 생산해도 됩니다.
// 불필요한 선택 연구는 건너뛰고, 연구에 먼저 이론을 사용합니다.
while true {
    buy gz 1-1
    buy gz 2-1
    buy gz 2-2
    buy gz 2-4
    buy gz 3-1
    buy gz 3-2
    buy gz 3-4
    buy gz 4-1
    buy gz 4-2
    buy gz 4-3
    buy gz 4-4
    buy gz 5-1
    buy gz 5-3
    buy gz 5-4
    buy gz 6-1
    buy gz 6-2
    buy gz 7-1
    buy gz 7-2

    // 선행 연구를 구매하고도 이론 160개가 남으면 마지막 연구로 이동
    if get.theory.sp.amount >= 160 {
        break
    }
    buy theory sp
    buy theory cp
    wait 100ms
}
buy gz 8-1 s`
    },
    {
      id: 'target_sp',
      title: '목표 SP 획득',
      description: '10 SP를 정확히 얻을 수 있는 숫자까지 기다린 뒤 변환합니다.',
      source: `// 이 명령만의 임시 목표 SP
sp 10`
    }
  ];
}

function addAutomatiumExample(exampleId) {
  const example = automatiumProgramExamplesList().find(item => item.id === exampleId);
  if (!example) return false;
  if (automatiumPrograms.length >= AUTOMATIUM_MAX_PROGRAMS) {
    automatiumEditorStatus.textContent = `프로그램은 최대 ${AUTOMATIUM_MAX_PROGRAMS}개까지 만들 수 있습니다.`;
    automatiumEditorStatus.classList.add('error');
    setAutomatiumTab('editor');
    return false;
  }

  const program = makeAutomatiumProgram();
  program.name = example.title;
  program.source = example.source;
  automatiumPrograms.push(program);
  selectedAutomatiumProgramId = program.id;
  saveAutomatiumPrograms();
  setAutomatiumTab('editor');
  renderAutomatiumUi({ syncEditor: true });
  automatiumSource.focus();
  return true;
}

function renderAutomatiumExamples() {
  automatiumExamples.innerHTML = '';
  for (const example of automatiumProgramExamplesList()) {
    const article = document.createElement('article');
    article.className = 'automatium-example';

    const header = document.createElement('div');
    header.className = 'automatium-example-header';
    const text = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = example.title;
    const description = document.createElement('p');
    description.textContent = example.description;
    text.append(title, description);

    const useButton = document.createElement('button');
    useButton.type = 'button';
    useButton.textContent = '새 프로그램에 복사';
    useButton.addEventListener('click', () => addAutomatiumExample(example.id));
    header.append(text, useButton);

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = example.source;
    pre.appendChild(code);
    article.append(header, pre);
    automatiumExamples.appendChild(article);
  }
}

function nAutocompleteUpgradeRows(kind) {
  const normalizedKind = normalizeNName(kind);
  if (normalizedKind === 'generalization' || normalizedKind === 'gz') {
    return GENERALIZATION_RESEARCHES.map(research => ({
      rawId: research.id,
      title: research.title,
      indexed: false
    }));
  }
  if (normalizedKind === 'theory') {
    return [
      { rawId: 'sp', title: 'SP로 이론 구매', indexed: false },
      { rawId: 'cp', title: 'CP로 이론 구매', indexed: false }
    ];
  }
  return automatiumUpgradeIdRows()
    .filter(row => row.kind === kind)
    .flatMap(row => [
      row,
      ...(kind === 'base'
        ? row.aliases.map(alias => ({ ...row, id: alias, rawId: alias }))
        : [])
    ]);
}

function nAutocompleteVariables(source) {
  const names = [];
  const pattern = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:number|boolean)\s*$/gm;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    if (!names.includes(match[1])) names.push(match[1]);
  }
  return names;
}

function nAutocompleteMatches(candidates, prefix) {
  const normalizedPrefix = normalizeNName(prefix);
  return candidates
    .filter(candidate => !normalizedPrefix || normalizeNName(candidate.label).startsWith(normalizedPrefix))
    .slice(0, 8);
}

function nAutocompleteContext() {
  const cursor = automatiumSource.selectionStart;
  const before = automatiumSource.value.slice(0, cursor);
  const lineStart = before.lastIndexOf('\n') + 1;
  const line = before.slice(lineStart);
  const indent = line.match(/^\s*/)?.[0] ?? '';

  const waitUnitMatch = line.match(/^\s*wait\s+[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?([A-Za-z]*)$/);
  if (waitUnitMatch) {
    const prefix = waitUnitMatch[1] ?? '';
    const units = [
      { label: 'ms', insert: 'ms', detail: '밀리초 대기' },
      { label: 's', insert: 's', detail: '초 대기' },
      { label: 'm', insert: 'm', detail: '분 대기' },
      { label: 'h', insert: 'h', detail: '시간 대기' }
    ];
    return {
      start: cursor - prefix.length,
      end: cursor,
      items: nAutocompleteMatches(units, prefix)
    };
  }

  const spTargetMatch = line.match(/^\s*(square|sp|cp)\s+([A-Za-z_][A-Za-z0-9_]*)?$/);
  if (spTargetMatch) {
    const currency = spTargetMatch[1] === 'cp' ? 'CP' : 'SP';
    const prefix = spTargetMatch[2] ?? '';
    const variables = nAutocompleteVariables(automatiumSource.value).map(name => ({
      label: name,
      insert: name,
      detail: `목표 ${currency} 변수`
    }));
    const candidates = [
      { label: '1', insert: '1', detail: `목표 ${currency}` },
      ...variables,
      { label: 's', insert: 's', detail: '획득 가능할 때까지 대기' }
    ];
    return {
      start: cursor - prefix.length,
      end: cursor,
      items: nAutocompleteMatches(candidates, prefix)
    };
  }

  const getMatch = line.match(/get(?:\.[A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]*\]?)?){0,3}$/);
  if (getMatch) {
    const expression = getMatch[0];
    const expressionStart = cursor - expression.length;
    const parts = expression.split('.');
    const prefix = parts.at(-1) ?? '';
    const replaceStart = cursor - prefix.length;

    if (parts.length === 1) {
      return {
        start: expressionStart,
        end: cursor,
        items: [{ label: 'get.', insert: 'get.', detail: '게임 값 읽기' }]
      };
    }

    if (parts.length === 2) {
      const candidates = [
        { label: 'number', insert: 'number', detail: '현재 베이스 숫자' },
        { label: 'sp', insert: 'sp', detail: '현재 SP' },
        { label: 'cp', insert: 'cp', detail: '현재 CP' },
        { label: 'base', insert: 'base.', detail: '베이스 업그레이드' },
        { label: 'square', insert: 'square.', detail: '제곱 업그레이드' },
        { label: 'square_break', insert: 'square_break.', detail: '제곱돌파 업그레이드' },
        { label: 'square_convergence', insert: 'square_convergence.', detail: '제곱 수렴 업그레이드' },
        { label: 'diverger', insert: 'diverger.', detail: '발산자 강화 · 추상화 7-1' }
      ];
      return { start: replaceStart, end: cursor, items: nAutocompleteMatches(candidates, prefix) };
    }

    if (parts.length === 3) {
      const kind = normalizeNName(parts[1]);
      const candidates = nAutocompleteUpgradeRows(kind).map(row => ({
        label: row.rawId,
        insert: `${row.rawId}.`,
        detail: row.title
      }));
      return { start: replaceStart, end: cursor, items: nAutocompleteMatches(candidates, prefix) };
    }

    if (parts.length === 4) {
      const kind = normalizeNName(parts[1]);
      const upgradeId = normalizeNName(parts[2]);
      const guide = nAutocompleteUpgradeRows(kind).find(row => row.rawId === upgradeId);
      const laneMatch = prefix.match(/^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]*)$/);
      if (laneMatch && kind === 'base' && guide?.indexed) {
        const property = laneMatch[1];
        const lanePrefix = laneMatch[2];
        const candidates = Array.from({ length: MAX_PERCENT_LANES }, (_, index) => ({
          label: `${property}[${index + 1}]`,
          insert: `${property}[${index + 1}]`,
          detail: `${index + 1}번 퍼센트 레인`
        }));
        return { start: replaceStart, end: cursor, items: nAutocompleteMatches(candidates, `${property}[${lanePrefix}`) };
      }

      const properties = ['upgraded', 'amount', 'cost', 'max', 'available'];
      const candidates = [];
      for (const property of properties) {
        candidates.push({ label: property, insert: property, detail: '업그레이드 상태' });
        if (kind === 'base' && guide?.indexed) {
          candidates.push({ label: `${property}[1]`, insert: `${property}[1]`, detail: '퍼센트 레인 지정' });
        }
      }
      return { start: replaceStart, end: cursor, items: nAutocompleteMatches(candidates, prefix) };
    }
  }

  const buyMatch = line.match(/^\s*buy(?:\s+([A-Za-z_][A-Za-z0-9_]*))?(?:\s+((?:[A-Za-z_][A-Za-z0-9_]*|[0-9]+-[0-9]+)(?:\[[^\]]*\]?)?))?\s*$/);
  if (buyMatch) {
    const kindPrefix = buyMatch[1] ?? '';
    const upgradePrefix = buyMatch[2];
    const hasSpaceAfterBuy = /^\s*buy\s+/.test(line);
    const waitingForUpgrade = kindPrefix && upgradePrefix === undefined && /\s$/.test(line);
    if (!hasSpaceAfterBuy) {
      return {
        start: cursor - 3,
        end: cursor,
        items: [{ label: 'buy', insert: 'buy ', detail: '업그레이드 구매' }]
      };
    }
    if (upgradePrefix === undefined && !waitingForUpgrade) {
      const start = cursor - kindPrefix.length;
      const kinds = [
        { label: 'base', insert: 'base ', detail: '베이스 업그레이드' },
        { label: 'square', insert: 'square ', detail: '제곱 업그레이드' },
        { label: 'square_break', insert: 'square_break ', detail: '제곱돌파 업그레이드' },
        { label: 'square_convergence', insert: 'square_convergence ', detail: '제곱 수렴 업그레이드' },
        { label: 'generalization', insert: 'generalization ', detail: '일반화 연구' },
        { label: 'gz', insert: 'gz ', detail: '일반화 연구 단축어' },
        { label: 'theory', insert: 'theory ', detail: '이론 구매 화폐 선택' },
        { label: 'diverger', insert: 'diverger ', detail: '발산자 강화 · 추상화 7-1' }
      ];
      return { start, end: cursor, items: nAutocompleteMatches(kinds, kindPrefix) };
    }

    const kind = normalizeNName(kindPrefix);
    const effectiveUpgradePrefix = upgradePrefix ?? '';
    const start = cursor - effectiveUpgradePrefix.length;
    const bracketMatch = effectiveUpgradePrefix.match(/^([A-Za-z_][A-Za-z0-9_]*)\[([^\]]*)$/);
    if (bracketMatch && kind === 'base') {
      const guide = N_BASE_UPGRADE_GUIDE.find(item => item.id === bracketMatch[1] && item.indexed);
      if (guide) {
        const candidates = Array.from({ length: MAX_PERCENT_LANES }, (_, index) => ({
          label: `${guide.id}[${index + 1}]`,
          insert: `${guide.id}[${index + 1}]`,
          detail: `${index + 1}번 퍼센트 레인`
        }));
        return { start, end: cursor, items: nAutocompleteMatches(candidates, effectiveUpgradePrefix) };
      }
    }

    const candidates = nAutocompleteUpgradeRows(kind).flatMap(row => {
      const items = [{ label: row.rawId, insert: row.rawId, detail: row.title }];
      if (kind === 'base' && row.indexed) {
        items.push({ label: `${row.rawId}[1]`, insert: `${row.rawId}[1]`, detail: `${row.title} · 레인 지정` });
      }
      return items;
    });
    return { start, end: cursor, items: nAutocompleteMatches(candidates, effectiveUpgradePrefix) };
  }

  const wordMatch = line.match(/[A-Za-z_][A-Za-z0-9_]*$/);
  const prefix = wordMatch?.[0] ?? '';
  if (!prefix && line.trim()) return null;
  const start = cursor - prefix.length;
  const variables = nAutocompleteVariables(automatiumSource.value).map(name => ({
    label: name,
    insert: name,
    detail: '선언된 변수'
  }));
  const keywords = [
    { label: 'buy', insert: 'buy ', detail: '업그레이드 구매' },
    { label: 'get', insert: 'get.', detail: '게임 값 읽기' },
    { label: 'click', insert: 'click', detail: '숫자 추가 · 1초 쿨다운' },
    { label: 'wait', insert: 'wait 1s', detail: '지정한 실제 시간 동안 대기' },
    { label: 'square', insert: 'square ', detail: '목표 SP 지정 가능' },
    { label: 'sp', insert: 'sp ', detail: '목표 SP 지정 가능' },
    { label: 'cp', insert: 'cp ', detail: '목표 CP 지정 가능' },
    { label: 'if', insert: `if true {\n${indent}    \n${indent}}`, cursorBack: indent.length + 2, detail: '조건문' },
    { label: 'elif', insert: `elif true {\n${indent}    \n${indent}}`, cursorBack: indent.length + 2, detail: '추가 조건' },
    { label: 'else', insert: `else {\n${indent}    \n${indent}}`, cursorBack: indent.length + 2, detail: '그 외 조건' },
    { label: 'while', insert: `while true {\n${indent}    \n${indent}}`, cursorBack: indent.length + 2, detail: '조건 반복' },
    { label: 'whiletick', insert: `whiletick 20 true {\n${indent}    \n${indent}}`, cursorBack: indent.length + 2, detail: '틱 간격 반복' },
    { label: 'for', insert: `for 10 {\n${indent}    \n${indent}}`, cursorBack: indent.length + 2, detail: '횟수 반복' },
    { label: 'break', insert: 'break', detail: '반복문 탈출' },
    { label: 'true', insert: 'true', detail: 'boolean' },
    { label: 'false', insert: 'false', detail: 'boolean' },
    { label: 'number', insert: 'number', detail: 'number 자료형' },
    { label: 'boolean', insert: 'boolean', detail: 'boolean 자료형' },
    ...variables
  ];
  return { start, end: cursor, items: nAutocompleteMatches(keywords, prefix) };
}

function hideAutomatiumAutocomplete() {
  automatiumAutocompleteItems = [];
  automatiumAutocompleteIndex = 0;
  automatiumAutocomplete.classList.add('hidden');
  automatiumAutocomplete.innerHTML = '';
}

function positionAutomatiumAutocomplete() {
  if (!automatiumSourceWrap || !automatiumCaretMirror || automatiumAutocomplete.classList.contains('hidden')) return;

  const sourceStyle = window.getComputedStyle(automatiumSource);
  const sourceRect = automatiumSource.getBoundingClientRect();
  const wrapRect = automatiumSourceWrap.getBoundingClientRect();
  automatiumCaretMirror.style.width = `${automatiumSource.clientWidth}px`;
  automatiumCaretMirror.style.height = `${automatiumSource.clientHeight}px`;
  automatiumCaretMirror.style.padding = sourceStyle.padding;
  automatiumCaretMirror.style.fontFamily = sourceStyle.fontFamily;
  automatiumCaretMirror.style.fontSize = sourceStyle.fontSize;
  automatiumCaretMirror.style.fontWeight = sourceStyle.fontWeight;
  automatiumCaretMirror.style.fontStyle = sourceStyle.fontStyle;
  automatiumCaretMirror.style.lineHeight = sourceStyle.lineHeight;
  automatiumCaretMirror.style.letterSpacing = sourceStyle.letterSpacing;
  automatiumCaretMirror.style.wordSpacing = sourceStyle.wordSpacing;
  automatiumCaretMirror.style.tabSize = sourceStyle.tabSize;
  automatiumCaretMirror.textContent = automatiumSource.value.slice(0, automatiumSource.selectionStart);

  const marker = document.createElement('span');
  marker.textContent = '\u200b';
  automatiumCaretMirror.appendChild(marker);
  const markerRect = marker.getBoundingClientRect();
  const caretTop = markerRect.top - sourceRect.top - automatiumSource.scrollTop;
  const caretLeft = markerRect.left - sourceRect.left - automatiumSource.scrollLeft;
  const popupWidth = Math.min(280, Math.max(0, wrapRect.width - 12));
  const left = Math.max(4, Math.min(caretLeft, wrapRect.width - popupWidth - 4));
  automatiumAutocomplete.style.width = `${popupWidth}px`;
  automatiumAutocomplete.style.left = `${left}px`;
  automatiumAutocomplete.style.right = 'auto';

  const popupHeight = automatiumAutocomplete.offsetHeight;
  const lineHeight = Number.parseFloat(sourceStyle.lineHeight) || 22;
  let top = caretTop - popupHeight - 6;
  if (top < 4) top = caretTop + lineHeight + 4;
  top = Math.min(top, Math.max(4, wrapRect.height - popupHeight - 4));
  automatiumAutocomplete.style.top = `${Math.max(4, top)}px`;
  automatiumAutocomplete.style.bottom = 'auto';
}

function renderAutomatiumAutocomplete() {
  const context = nAutocompleteContext();
  if (!context || context.items.length === 0 || activeAutomatiumTab !== 'editor') {
    hideAutomatiumAutocomplete();
    return;
  }

  automatiumAutocompleteItems = context.items.map(item => ({ ...item, start: context.start, end: context.end }));
  automatiumAutocompleteIndex = Math.min(automatiumAutocompleteIndex, automatiumAutocompleteItems.length - 1);
  automatiumAutocomplete.innerHTML = '';
  for (const [index, item] of automatiumAutocompleteItems.entries()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'automatium-autocomplete-item';
    button.classList.toggle('selected', index === automatiumAutocompleteIndex);
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(index === automatiumAutocompleteIndex));
    const code = document.createElement('code');
    code.textContent = item.label;
    const detail = document.createElement('span');
    detail.textContent = item.detail;
    button.append(code, detail);
    button.addEventListener('mousedown', event => {
      event.preventDefault();
      applyAutomatiumAutocomplete(index);
    });
    automatiumAutocomplete.appendChild(button);
  }
  automatiumAutocomplete.classList.remove('hidden');
  positionAutomatiumAutocomplete();
}

function applyAutomatiumAutocomplete(index = automatiumAutocompleteIndex) {
  const item = automatiumAutocompleteItems[index];
  if (!item) return false;
  automatiumSource.setRangeText(item.insert, item.start, item.end, 'end');
  if (item.cursorBack) {
    const cursor = automatiumSource.selectionStart - item.cursorBack;
    automatiumSource.setSelectionRange(cursor, cursor);
  }
  automatiumEditorDirty = true;
  hideAutomatiumAutocomplete();
  renderAutomatiumEditorStatus();
  automatiumSource.focus();
  renderAutomatiumAutocomplete();
  return true;
}

function insertAutomatiumIndent() {
  automatiumSource.setRangeText('    ', automatiumSource.selectionStart, automatiumSource.selectionEnd, 'end');
  automatiumEditorDirty = true;
  renderAutomatiumEditorStatus();
}

function createAutomatiumProgramRow(program) {
    const row = document.createElement('div');
    row.className = 'automatium-program-row';

    const selectButton = document.createElement('button');
    selectButton.className = 'automatium-program-select';
    selectButton.type = 'button';
    selectButton.addEventListener('click', () => selectAutomatiumProgram(program.id));

    const name = document.createElement('span');
    name.className = 'automatium-program-list-name';
    const state = document.createElement('span');
    state.className = 'automatium-program-state';
    selectButton.append(name, state);

    const toggle = document.createElement('button');
    toggle.className = 'automatium-program-toggle';
    toggle.type = 'button';
    toggle.addEventListener('click', () => toggleAutomatiumProgram(program.id));

    row.append(selectButton, toggle);
    const ui = { row, name, state, toggle };
    automatiumProgramUi.set(program.id, ui);
    return ui;
}

function renderAutomatiumProgramList() {
  const currentIds = new Set(automatiumPrograms.map(program => program.id));
  for (const [programId, ui] of automatiumProgramUi) {
    if (currentIds.has(programId)) continue;
    ui.row.remove();
    automatiumProgramUi.delete(programId);
  }

  for (const [index, program] of automatiumPrograms.entries()) {
    const ui = automatiumProgramUi.get(program.id) ?? createAutomatiumProgramRow(program);
    const expectedNode = automatiumProgramList.children[index] ?? null;
    if (expectedNode !== ui.row) automatiumProgramList.insertBefore(ui.row, expectedNode);

    const status = automatiumStatus(program);
    ui.row.classList.toggle('selected', program.id === selectedAutomatiumProgramId);
    ui.name.textContent = program.name;
    ui.state.className = `automatium-program-state ${status.tone}`;
    ui.state.textContent = status.label;
    ui.toggle.className = `automatium-program-toggle ${program.enabled ? 'on' : 'off'}`;
    ui.toggle.textContent = program.enabled ? 'ON' : 'OFF';
    ui.toggle.title = `${program.name} ${program.enabled ? '끄기' : '켜기'}`;
    ui.toggle.disabled = !hasSquareConvergenceUpgrade('automatium');
  }

  if (automatiumPrograms.length === 0) {
    if (!automatiumEmptyListElement) {
      automatiumEmptyListElement = document.createElement('div');
      automatiumEmptyListElement.className = 'automatium-empty';
      automatiumEmptyListElement.textContent = '저장된 프로그램 없음';
    }
    if (automatiumEmptyListElement.parentElement !== automatiumProgramList) {
      automatiumProgramList.appendChild(automatiumEmptyListElement);
    }
  } else if (automatiumEmptyListElement?.parentElement === automatiumProgramList) {
    automatiumEmptyListElement.remove();
  }
}

function createAutomatiumQuickProgramRow(program) {
  const row = document.createElement('div');
  row.className = 'automatium-quick-row';

  const selectButton = document.createElement('button');
  selectButton.className = 'automatium-quick-select';
  selectButton.type = 'button';
  selectButton.addEventListener('click', () => {
    selectedAutomatiumProgramId = program.id;
    if (automatiumWorkspace.classList.contains('hidden')) openAutomatiumEditor();
    else renderAutomatiumUi({ syncEditor: true });
  });

  const name = document.createElement('span');
  name.className = 'automatium-quick-name';
  const state = document.createElement('span');
  state.className = 'automatium-quick-state';
  selectButton.append(name, state);

  const toggle = document.createElement('button');
  toggle.className = 'automatium-quick-toggle';
  toggle.type = 'button';
  toggle.addEventListener('click', () => toggleAutomatiumProgram(program.id));

  row.append(selectButton, toggle);
  const ui = { row, selectButton, name, state, toggle };
  automatiumQuickProgramUi.set(program.id, ui);
  return ui;
}

function renderAutomatiumQuickProgramList() {
  if (!automatiumQuickProgramList) return;

  const currentIds = new Set(automatiumPrograms.map(program => program.id));
  for (const [programId, ui] of automatiumQuickProgramUi) {
    if (currentIds.has(programId)) continue;
    ui.row.remove();
    automatiumQuickProgramUi.delete(programId);
  }

  for (const [index, program] of automatiumPrograms.entries()) {
    const ui = automatiumQuickProgramUi.get(program.id) ?? createAutomatiumQuickProgramRow(program);
    const expectedNode = automatiumQuickProgramList.children[index] ?? null;
    if (expectedNode !== ui.row) automatiumQuickProgramList.insertBefore(ui.row, expectedNode);

    const status = automatiumStatus(program);
    ui.row.classList.toggle('selected', program.id === selectedAutomatiumProgramId);
    ui.name.textContent = program.name;
    ui.state.className = `automatium-quick-state ${status.tone}`;
    ui.state.textContent = status.label;
    ui.selectButton.title = `${program.name} 편집`;
    ui.toggle.className = `automatium-quick-toggle ${program.enabled ? 'on' : 'off'}`;
    ui.toggle.textContent = program.enabled ? 'ON' : 'OFF';
    ui.toggle.title = `${program.name} ${program.enabled ? '끄기' : '켜기'}`;
    ui.toggle.setAttribute('aria-label', `${program.name} ${program.enabled ? '끄기' : '켜기'}`);
    ui.toggle.setAttribute('aria-pressed', String(program.enabled));
    ui.toggle.disabled = !hasSquareConvergenceUpgrade('automatium');
  }

  if (automatiumPrograms.length === 0) {
    if (!automatiumQuickEmptyListElement) {
      automatiumQuickEmptyListElement = document.createElement('div');
      automatiumQuickEmptyListElement.className = 'automatium-quick-empty';
      automatiumQuickEmptyListElement.textContent = '저장된 프로그램 없음';
    }
    if (automatiumQuickEmptyListElement.parentElement !== automatiumQuickProgramList) {
      automatiumQuickProgramList.appendChild(automatiumQuickEmptyListElement);
    }
  } else if (automatiumQuickEmptyListElement?.parentElement === automatiumQuickProgramList) {
    automatiumQuickEmptyListElement.remove();
  }
}

function renderAutomatiumEditorStatus() {
  const program = selectedAutomatiumProgram();
  if (!program) {
    automatiumEditorStatus.textContent = '프로그램을 만들거나 선택하세요.';
    return;
  }
  const execution = automatiumExecutions.get(program.id);
  const prefix = automatiumEditorDirty || automatiumNameDirty ? '수정됨 · ' : '';
  automatiumEditorStatus.textContent = `${prefix}${execution?.message ?? (program.enabled ? '준비 중' : '꺼짐')}`;
  automatiumEditorStatus.classList.toggle('error', execution?.status === 'error');
}

function syncAutomatiumEditor() {
  const program = selectedAutomatiumProgram();
  const disabled = !program;
  automatiumProgramName.disabled = disabled;
  automatiumRenameBtn.disabled = disabled;
  automatiumSource.disabled = disabled;
  automatiumSaveBtn.disabled = disabled;
  automatiumDeleteBtn.disabled = disabled;
  automatiumProgramName.value = program?.name ?? '';
  automatiumSource.value = program?.source ?? '';
  automatiumEditorDirty = false;
  automatiumNameDirty = false;
  hideAutomatiumAutocomplete();
  renderAutomatiumEditorStatus();
}

function renderAutomatiumUi({ syncEditor = false } = {}) {
  renderAutomatiumQuickProgramList();
  if (!automatiumWorkspace || automatiumWorkspace.classList.contains('hidden')) {
    automatiumUiDirty = false;
    return;
  }
  renderAutomatiumProgramList();
  if (syncEditor) syncAutomatiumEditor();
  else renderAutomatiumEditorStatus();
  automatiumUiDirty = false;
}

function selectAutomatiumProgram(programId) {
  if (programId === selectedAutomatiumProgramId) return;
  selectedAutomatiumProgramId = programId;
  renderAutomatiumUi({ syncEditor: true });
}

function createAutomatiumProgram() {
  if (automatiumPrograms.length >= AUTOMATIUM_MAX_PROGRAMS) {
    automatiumEditorStatus.textContent = `프로그램은 최대 ${AUTOMATIUM_MAX_PROGRAMS}개까지 만들 수 있습니다.`;
    automatiumEditorStatus.classList.add('error');
    return;
  }
  const program = makeAutomatiumProgram();
  automatiumPrograms.push(program);
  selectedAutomatiumProgramId = program.id;
  saveAutomatiumPrograms();
  renderAutomatiumUi({ syncEditor: true });
  automatiumProgramName.focus();
  automatiumProgramName.select();
}

function renameSelectedAutomatiumProgram() {
  const program = selectedAutomatiumProgram();
  if (!program) return false;
  const name = automatiumProgramName.value.trim();
  if (!name) {
    automatiumEditorStatus.textContent = '프로그램 이름을 입력하세요.';
    automatiumEditorStatus.classList.add('error');
    automatiumProgramName.focus();
    return false;
  }

  program.name = name.slice(0, 40);
  program.updatedAt = Date.now();
  automatiumProgramName.value = program.name;
  automatiumNameDirty = false;
  const execution = automatiumExecutions.get(program.id);
  if (!program.enabled) {
    automatiumExecutions.set(program.id, {
      iterator: execution?.iterator ?? null,
      status: execution?.status === 'error' ? 'error' : 'off',
      message: execution?.status === 'error' ? execution.message : '이름 변경됨',
      waitTicks: execution?.waitTicks ?? 0
    });
  }
  saveAutomatiumPrograms();
  renderAutomatiumUi();
  return true;
}

function saveSelectedAutomatiumProgram() {
  const program = selectedAutomatiumProgram();
  if (!program) return false;
  const name = automatiumProgramName.value.trim();
  program.name = (name || '이름 없는 프로그램').slice(0, 40);
  program.source = automatiumSource.value;
  program.updatedAt = Date.now();
  automatiumEditorDirty = false;
  automatiumNameDirty = false;

  try {
    NRuntime.compile(program.source);
    automatiumExecutions.delete(program.id);
    if (program.enabled) startAutomatiumProgram(program);
    else {
      automatiumExecutions.set(program.id, {
        iterator: null,
        status: 'off',
        message: '저장됨',
        waitTicks: 0
      });
    }
  } catch (error) {
    program.enabled = false;
    automatiumExecutions.set(program.id, {
      iterator: null,
      status: 'error',
      message: error.message,
      waitTicks: 0
    });
  }

  saveAutomatiumPrograms();
  renderAutomatiumUi();
  return true;
}

function deleteSelectedAutomatiumProgram() {
  const program = selectedAutomatiumProgram();
  if (!program || !window.confirm(`'${program.name}' 프로그램을 삭제하시겠습니까?`)) return;
  const index = automatiumPrograms.indexOf(program);
  automatiumExecutions.delete(program.id);
  automatiumPrograms.splice(index, 1);
  selectedAutomatiumProgramId = automatiumPrograms[index]?.id ?? automatiumPrograms[index - 1]?.id ?? null;
  saveAutomatiumPrograms();
  renderAutomatiumUi({ syncEditor: true });
}

function openAutomatiumEditor() {
  if (!hasSquareConvergenceUpgrade('automatium')) return false;
  applyAutomatiumSquareUpgradeUnlocks();
  if (automatiumPrograms.length === 0) {
    const program = makeAutomatiumProgram(1);
    automatiumPrograms.push(program);
    selectedAutomatiumProgramId = program.id;
    saveAutomatiumPrograms();
  }
  if (!selectedAutomatiumProgram()) selectedAutomatiumProgramId = automatiumPrograms[0].id;
  automatiumWorkspace.classList.remove('hidden');
  document.body.classList.add('automatium-open');
  setAutomatiumTab('editor');
  renderAutomatiumUi({ syncEditor: true });
  automatiumSource.focus();
  return true;
}

function closeAutomatiumEditor() {
  automatiumWorkspace.classList.add('hidden');
  document.body.classList.remove('automatium-open');
}

function renderAutomatiumAccess() {
  const unlocked = hasSquareConvergenceUpgrade('automatium');
  automatiumQuickPanel?.classList.toggle('hidden', !unlocked);
  if (automatiumUiDirty) renderAutomatiumQuickProgramList();
  if (!unlocked) {
    if (!automatiumWorkspace.classList.contains('hidden')) closeAutomatiumEditor();
  }
}

function runAutomatiumTick() {
  const { now: tickAt } = elapsedRealTimeSince(automatiumLastTickAt);
  automatiumLastTickAt = tickAt;
  automatiumBulkRemaining = AUTOMATIUM_BULK_MAX_PER_TICK;
  automatiumBulkDeadline = tickAt + AUTOMATIUM_BULK_TICK_BUDGET_MS;
  if (!hasSquareConvergenceUpgrade('automatium')) return;
  const enabledPrograms = automatiumPrograms.filter(program => program.enabled);
  if (enabledPrograms.length === 0) return;

  const blockedThisTick = new Set();
  const now = Date.now();
  for (const program of enabledPrograms) {
    let execution = automatiumExecutions.get(program.id);
    if (!execution || !execution.iterator) {
      if (!startAutomatiumProgram(program)) {
        saveAutomatiumPrograms();
        continue;
      }
      execution = automatiumExecutions.get(program.id);
    }
    if (execution.waitUntil > now) {
      const remainingMs = Math.max(1, Math.ceil(execution.waitUntil - now));
      setAutomatiumRuntimeStatus(program.id, 'waiting', `${remainingMs}ms 대기`);
      blockedThisTick.add(program.id);
    } else if (execution.waitUntil) {
      execution.waitUntil = 0;
    }
    if (!blockedThisTick.has(program.id) && execution.waitTicks > 0) {
      execution.waitTicks--;
      setAutomatiumRuntimeStatus(program.id, 'waiting', `${execution.waitTicks}틱 대기`);
      blockedThisTick.add(program.id);
    }
  }

  let budget = AUTOMATIUM_COMMAND_BUDGET;
  while (budget > 0) {
    let madeProgress = false;
    for (const program of enabledPrograms) {
      if (budget <= 0 || !program.enabled || blockedThisTick.has(program.id)) continue;
      const execution = automatiumExecutions.get(program.id);
      if (!execution?.iterator) continue;

      try {
        const result = execution.iterator.next();
        budget--;
        madeProgress = true;
        if (result.done) {
          stopAutomatiumProgram(program, '완료');
          saveAutomatiumPrograms();
          blockedThisTick.add(program.id);
          continue;
        }

        const event = result.value ?? {};
        if (event.kind === 'blocked') {
          setAutomatiumRuntimeStatus(program.id, 'blocked', event.message);
          blockedThisTick.add(program.id);
        } else if (event.kind === 'budget') {
          setAutomatiumRuntimeStatus(program.id, 'waiting', event.message);
          blockedThisTick.add(program.id);
        } else if (event.kind === 'wait-ticks') {
          execution.waitTicks = event.ticks;
          setAutomatiumRuntimeStatus(program.id, 'waiting', `${event.ticks}틱 대기`);
          blockedThisTick.add(program.id);
        } else if (event.kind === 'wait-time') {
          execution.waitUntil = Date.now() + event.durationMs;
          setAutomatiumRuntimeStatus(program.id, 'waiting', event.message);
          blockedThisTick.add(program.id);
        } else {
          setAutomatiumRuntimeStatus(program.id, 'running', `실행 중 · ${event.line ?? 1}줄`);
        }
      } catch (error) {
        failAutomatiumProgram(program, error);
        blockedThisTick.add(program.id);
      }
    }
    if (!madeProgress || blockedThisTick.size >= enabledPrograms.length) break;
  }
}

for (const program of automatiumPrograms) {
  if (program.enabled) startAutomatiumProgram(program);
}

automatiumQuickEditorBtn.addEventListener('click', openAutomatiumEditor);
automatiumQuickCollapseBtn.addEventListener('click', () => {
  const collapsed = automatiumQuickPanel.classList.toggle('collapsed');
  automatiumQuickCollapseBtn.textContent = collapsed ? '+' : '−';
  automatiumQuickCollapseBtn.title = collapsed ? '목록 펼치기' : '목록 접기';
  automatiumQuickCollapseBtn.setAttribute('aria-expanded', String(!collapsed));
});
automatiumCloseBtn.addEventListener('click', closeAutomatiumEditor);
automatiumNewBtn.addEventListener('click', createAutomatiumProgram);
automatiumRenameBtn.addEventListener('click', renameSelectedAutomatiumProgram);
automatiumSaveBtn.addEventListener('click', saveSelectedAutomatiumProgram);
automatiumDeleteBtn.addEventListener('click', deleteSelectedAutomatiumProgram);
automatiumProgramName.addEventListener('input', () => {
  automatiumNameDirty = true;
  renderAutomatiumEditorStatus();
});
automatiumProgramName.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  renameSelectedAutomatiumProgram();
});
automatiumSource.addEventListener('input', () => {
  automatiumEditorDirty = true;
  renderAutomatiumEditorStatus();
  automatiumAutocompleteIndex = 0;
  renderAutomatiumAutocomplete();
});
automatiumSource.addEventListener('click', renderAutomatiumAutocomplete);
automatiumSource.addEventListener('scroll', positionAutomatiumAutocomplete);
window.addEventListener('resize', positionAutomatiumAutocomplete);
automatiumSource.addEventListener('keydown', event => {
  const autocompleteVisible = !automatiumAutocomplete.classList.contains('hidden') && automatiumAutocompleteItems.length > 0;
  if (autocompleteVisible && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
    event.preventDefault();
    event.stopPropagation();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    automatiumAutocompleteIndex = (automatiumAutocompleteIndex + direction + automatiumAutocompleteItems.length) % automatiumAutocompleteItems.length;
    renderAutomatiumAutocomplete();
    return;
  }
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    event.stopPropagation();
    if (!applyAutomatiumAutocomplete()) insertAutomatiumIndent();
    return;
  }
  if (event.key === 'Tab' && event.shiftKey) {
    event.stopPropagation();
    return;
  }
  if (event.key === 'Escape' && autocompleteVisible) {
    event.preventDefault();
    event.stopPropagation();
    hideAutomatiumAutocomplete();
  }
});
automatiumSource.addEventListener('keyup', event => {
  if (['ArrowDown', 'ArrowUp', 'Tab', 'Escape'].includes(event.key)) return;
  renderAutomatiumAutocomplete();
});
automatiumSource.addEventListener('blur', () => {
  setTimeout(hideAutomatiumAutocomplete, 0);
});
automatiumEditorTabBtn.addEventListener('click', () => setAutomatiumTab('editor'));
automatiumDocsTabBtn.addEventListener('click', () => setAutomatiumTab('docs'));
automatiumIdsTabBtn.addEventListener('click', () => setAutomatiumTab('ids'));
automatiumExamplesTabBtn.addEventListener('click', () => setAutomatiumTab('examples'));
automatiumIdFilter.addEventListener('input', renderAutomatiumUpgradeIds);
automatiumWorkspace.addEventListener('click', event => {
  if (event.target === automatiumWorkspace) closeAutomatiumEditor();
});
document.addEventListener('keydown', event => {
  if (automatiumWorkspace.classList.contains('hidden')) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    saveSelectedAutomatiumProgram();
  } else if (event.key === 'Escape') {
    closeAutomatiumEditor();
  }
});

setInterval(runAutomatiumTick, AUTOMATIUM_TICK_MS);
setInterval(() => {
  if (automatiumUiDirty) renderAutomatiumUi();
}, 100);

renderAutomatiumDocs();
renderAutomatiumUpgradeIds();
renderAutomatiumExamples();
renderAutomatiumQuickProgramList();
setAutomatiumTab(activeAutomatiumTab);
