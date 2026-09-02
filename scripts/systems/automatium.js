const AUTOMATIUM_STORAGE_KEY = 'numberTycoonAutomatiumPrograms_v1';
const AUTOMATIUM_COMMAND_BUDGET = 256;
const AUTOMATIUM_TICK_MS = 50;
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
  { id: 'percent_line', title: '퍼센트 라인', aliases: [] }
];

const N_BREAKTHROUGH_UPGRADE_ALIASES = {
  doctor_octopus: ['dr_octopus'],
  dyson_swarm: ['dyson'],
  percent_expansion: ['percent_line']
};

const automatiumWorkspace = document.getElementById('automatiumWorkspace');
const automatiumCloseBtn = document.getElementById('automatiumCloseBtn');
const automatiumNewBtn = document.getElementById('automatiumNewBtn');
const automatiumProgramList = document.getElementById('automatiumProgramList');
const automatiumProgramName = document.getElementById('automatiumProgramName');
const automatiumRenameBtn = document.getElementById('automatiumRenameBtn');
const automatiumSource = document.getElementById('automatiumSource');
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
let automatiumLastNumberClickAt = Number.NEGATIVE_INFINITY;

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

function nLog2(value) {
  let count = 0n;
  let current = BigInt(value);
  while (current > 1n) {
    current /= 2n;
    count++;
  }
  return count;
}

function nPercentLaneNumber(rawIndex, node) {
  if (rawIndex === null || rawIndex === undefined) return null;
  if (typeof rawIndex !== 'bigint' && typeof rawIndex !== 'number') {
    nLanguageError('퍼센트 레인 번호는 number여야 합니다.', node);
  }
  const laneNumber = typeof rawIndex === 'bigint' ? rawIndex : BigInt(Math.floor(rawIndex));
  if (typeof rawIndex === 'number' && rawIndex !== Math.floor(rawIndex)) {
    nLanguageError('퍼센트 레인 번호는 정수여야 합니다.', node);
  }
  if (laneNumber < 1n || laneNumber > BigInt(MAX_PERCENT_LANES)) {
    nLanguageError(`퍼센트 레인 번호는 1부터 ${MAX_PERCENT_LANES}까지 사용할 수 있습니다.`, node);
  }
  return Number(laneNumber);
}

function nPercentLaneUpgradeSnapshot(id, laneNumber, node) {
  const laneExists = laneNumber <= percentLaneCount;
  const lane = laneNumber === 1
    ? null
    : extraPercentLanes.find(item => item.laneNumber === laneNumber) ?? null;

  if (id === 'percent_power') {
    const power = laneNumber === 1 ? percentPower : lane?.power ?? 1;
    const rawCost = laneNumber === 1 ? percentPowerUpgradeCost : lane?.powerCost ?? scaleByLane(40000n, laneNumber);
    const cost = discountedCost(rawCost);
    return {
      upgraded: BigInt(Math.max(0, power - 1)),
      amount: BigInt(power),
      cost,
      max: 0n,
      available: laneExists && !overflowed && percentUnlocked && percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE && canAffordBaseCost(cost),
      buy: () => laneNumber === 1 ? upgradePercentPower() : lane ? buyExtraLanePower(lane) : false
    };
  }

  if (id === 'percent_auto') {
    const unlocked = laneNumber === 1 ? percentAutoUnlocked : lane?.autoUnlocked ?? false;
    const rawCost = laneNumber === 1 ? percentAutoPrice : lane?.autoPrice ?? scaleByLane(150n, laneNumber);
    const cost = discountedCost(rawCost);
    return {
      upgraded: unlocked ? 1n : 0n,
      amount: unlocked ? 1n : 0n,
      cost: unlocked ? 0n : cost,
      max: 1n,
      available: laneExists && !overflowed && percentUnlocked && !unlocked && canAffordBaseCost(cost),
      buy: () => laneNumber === 1 ? buyPercentAuto() : lane ? buyExtraLaneAuto(lane) : false
    };
  }

  if (id === 'percent_auto_speed') {
    const speedLevel = laneNumber === 1 ? percentAutoSpeedLevel : lane?.autoSpeedLevel ?? 0;
    const speed = laneNumber === 1 ? percentAutoSpeed : lane?.autoSpeed ?? 1000;
    const unlocked = laneNumber === 1 ? percentAutoUnlocked : lane?.autoUnlocked ?? false;
    const rawCost = laneNumber === 1 ? percentAutoSpeedPrice : lane?.autoSpeedPrice ?? scaleByLane(250n, laneNumber);
    const cost = discountedCost(rawCost);
    const maxed = laneNumber === 1
      ? speed <= percentAutoMinSpeed()
      : speedLevel >= (lane?.autoSpeedLevels.length ?? percentAutoSpeedLevels.length) - 1;
    return {
      upgraded: BigInt(speedLevel),
      amount: BigInt(speed),
      cost: maxed ? 0n : cost,
      max: laneNumber === 1 && percentAutoMinSpeed() < 200 ? 5n : 4n,
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
    percent_line: 'percent_line'
  };
  const id = aliases[normalizeNName(rawUpgrade)];
  if (!id) nLanguageError(`알 수 없는 base 업그레이드 '${rawUpgrade}'`, node);
  const laneNumber = nPercentLaneNumber(rawLaneIndex, node);
  if (laneNumber !== null) return nPercentLaneUpgradeSnapshot(id, laneNumber, node);

  const definitions = {
    click: () => {
      const cost = discountedCost(perClickUpgradeCost);
      return {
        upgraded: perClick - 1n,
        amount: effectivePerClick(),
        cost,
        max: BASE_PER_CLICK_CAP - 1n,
        available: !overflowed && perClick < BASE_PER_CLICK_CAP && canAffordBaseCost(cost),
        buy: upgradePerClick
      };
    },
    auto_clicker: () => {
      const cost = discountedCost(autoClickerPrice);
      return {
        upgraded: autoClickerUnlocked ? 1n : 0n,
        amount: autoClickerUnlocked ? 1n : 0n,
        cost: autoClickerUnlocked ? 0n : cost,
        max: 1n,
        available: !overflowed && !autoClickerUnlocked && canAffordBaseCost(cost),
        buy: buyAutoClicker
      };
    },
    auto_speed: () => {
      const cost = discountedCost(autoClickerSpeedPrice);
      return {
        upgraded: nLog2(autoClickerSpeedPrice / 200n),
        amount: BigInt(autoClickerSpeed),
        cost: autoClickerSpeed <= autoClickerMinSpeed() ? 0n : cost,
        max: autoClickerMinSpeed() < 25 ? 8n : 7n,
        available: !overflowed && autoClickerUnlocked && autoClickerSpeed > autoClickerMinSpeed() && canAffordBaseCost(cost),
        buy: upgradeAutoClickerSpeed
      };
    },
    auto_parallel: () => {
      const cost = discountedCost(autoClickerParallelPrice);
      return {
        upgraded: nLog2(autoClickerParallel),
        amount: autoClickerParallel,
        cost: autoClickerParallel >= autoClickerParallelCap() ? 0n : cost,
        max: nLog2(autoClickerParallelCap()),
        available: !overflowed && autoClickerUnlocked && autoClickerParallel < autoClickerParallelCap() && canAffordBaseCost(cost),
        buy: upgradeAutoClickerParallel
      };
    },
    auto_percent: () => {
      const cost = discountedCost(autoClickerPercentFillPrice);
      return {
        upgraded: autoClickerPercentFillUnlocked ? 1n : 0n,
        amount: autoClickerPercentFillUnlocked ? 1n : 0n,
        cost: autoClickerPercentFillUnlocked ? 0n : cost,
        max: 1n,
        available: !overflowed && autoClickerUnlocked && percentUnlocked && !autoClickerPercentFillUnlocked && canAffordBaseCost(cost),
        buy: buyAutoClickerPercentFill
      };
    },
    percent_charge: () => {
      const cost = discountedCost(percentChargeUpgradeCost);
      return {
        upgraded: BigInt(percentChargeLevel),
        amount: BigInt(percentChargeNeeded),
        cost: percentChargeNeeded <= minimumPercentChargeNeeded() ? 0n : cost,
        max: BigInt(percentChargeLevel + Math.ceil((percentChargeNeeded - minimumPercentChargeNeeded()) / percentChargeReduction())),
        available: !overflowed && percentUnlocked && percentChargeNeeded > minimumPercentChargeNeeded() && canAffordBaseCost(cost),
        buy: upgradePercentCharge
      };
    },
    percent_power: () => {
      const cost = discountedCost(percentPowerUpgradeCost);
      return {
        upgraded: BigInt(Math.max(0, percentPower - 1)),
        amount: BigInt(percentPower),
        cost,
        max: 0n,
        available: !overflowed && percentUnlocked && percentChargeNeeded <= PERCENT_POWER_UNLOCK_CHARGE && canAffordBaseCost(cost),
        buy: upgradePercentPower
      };
    },
    percent_auto: () => {
      const cost = discountedCost(percentAutoPrice);
      return {
        upgraded: percentAutoUnlocked ? 1n : 0n,
        amount: percentAutoUnlocked ? 1n : 0n,
        cost: percentAutoUnlocked ? 0n : cost,
        max: 1n,
        available: !overflowed && percentUnlocked && !percentAutoUnlocked && canAffordBaseCost(cost),
        buy: buyPercentAuto
      };
    },
    percent_auto_speed: () => {
      const cost = discountedCost(percentAutoSpeedPrice);
      return {
        upgraded: nLog2(percentAutoSpeedPrice / 250n),
        amount: BigInt(percentAutoSpeed),
        cost: percentAutoSpeed <= percentAutoMinSpeed() ? 0n : cost,
        max: percentAutoMinSpeed() < 200 ? 5n : 4n,
        available: !overflowed && percentUnlocked && percentAutoUnlocked && percentAutoSpeed > percentAutoMinSpeed() && canAffordBaseCost(cost),
        buy: upgradePercentAutoSpeed
      };
    },
    percent_line: () => {
      const cost = discountedCost(nextPercentLaneUnlockCost);
      return {
        upgraded: BigInt(percentLaneCount - 1),
        amount: BigInt(percentLaneCount),
        cost: percentLaneCount >= percentLaneLimit() ? 0n : cost,
        max: BigInt(percentLaneLimit() - 1),
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
    click_double: () => bought ? 2n : 1n,
    percent_power_8: () => BigInt(percentPowerSoftcapDecayPower()),
    percent_auto_125: () => BigInt(percentAutoMinSpeed()),
    percent_charge_minus_16: () => BigInt(percentChargeReduction()),
    all_cost_half: () => bought ? 0.5 : 1,
    auto_parallel_64: () => autoClickerParallelCap(),
    game_speed_1_5: () => bought ? 1.5 : 1,
    sp_gain_double: () => bought ? 2n : 1n,
    auto_upgrade_top_down: () => autoUpgradeEnabled,
    skip_cutscene: () => bought,
    restart_percent_unlock: () => bought,
    restart_auto_4x: () => bought ? 4n : 0n,
    restart_auto_percent_fill: () => bought,
    restart_start_100k: () => bought ? 100000n : 0n,
    restart_percent_lane2: () => bought ? 2n : 1n
  };
  return (amounts[id] ?? (() => bought ? 1n : 0n))();
}

function nSquareUpgradeSnapshot(rawUpgrade, node) {
  const id = normalizeNName(rawUpgrade);
  const upgrade = SQUARE_UPGRADES.find(item => item.id === id);
  if (!upgrade) nLanguageError(`알 수 없는 square 업그레이드 '${rawUpgrade}'`, node);
  const bought = hasSquareUpgrade(id);
  return {
    upgraded: bought ? 1n : 0n,
    amount: nSquareUpgradeAmount(id),
    cost: bought ? 0n : upgrade.cost,
    max: 1n,
    available: squareUnlocked && !bought && compareNumberValues(squarePoints, upgrade.cost) >= 0,
    buy: () => buySquareUpgrade(id)
  };
}

function nBreakthroughUpgradeAmount(id, level) {
  if (id === 'black_hole') return level > 0 ? 2 * dysonEffectNumber() : 1;
  if (id === 'extra_investment') return affectedBigIntMultiplier(2, level);
  if (id === 'tas') return BigInt(autoClickerMinSpeed());
  if (id === 'invisible_hand') return autoUpgradeSpeedMultiplier();
  if (id === 'overclock') return BigInt(4 * dysonEffectNumber() * level);
  if (id === 'deflation') return level > 0 ? 0.1 : 1;
  if (id === 'doctor_octopus') return affectedBigIntMultiplier(8, level);
  if (id === 'solid_start') return level > 0 ? 2000000n : 0n;
  if (id === 'overcharge') return BigInt(minimumPercentChargeNeeded());
  if (id === 'gregtech') return affectedBigIntMultiplier(2, level);
  if (id === 'bottleneck_tracker') return percentEfficiencyMultiplier();
  if (id === 'percent_expansion') return BigInt(percentLaneLimit());
  if (id === 'dyson_swarm') return dysonEffectMultiplier();
  return BigInt(level);
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
    upgraded: BigInt(level),
    amount: nBreakthroughUpgradeAmount(id, level),
    cost: cost ?? 0n,
    max: BigInt(max),
    available: canOpenSquareBreakthrough() && cost !== null && compareNumberValues(squarePoints, cost) >= 0,
    buy: () => buySquareBreakthroughUpgrade(id)
  };
}

function nConvergenceUpgradeSnapshot(rawUpgrade, node) {
  const id = normalizeNName(rawUpgrade);
  const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
  if (!upgrade) nLanguageError(`알 수 없는 square_convergence 업그레이드 '${rawUpgrade}'`, node);
  const bought = hasSquareConvergenceUpgrade(id);
  const amounts = {
    timium: () => bought ? 2048n : 1n,
    galaxium: () => bought ? 2048n : 1n,
    automatium: () => bought
  };
  return {
    upgraded: bought ? 1n : 0n,
    amount: (amounts[id] ?? (() => bought))(),
    cost: bought ? 0n : upgrade.cost,
    max: 1n,
    available: canOpenSquareConvergence() && !bought && compareNumberValues(squareConvergencePoints, upgrade.cost) >= 0,
    buy: () => buySquareConvergenceUpgrade(id)
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
    cp: 'square_convergence'
  };
  const kind = aliases[normalizeNName(rawKind)];
  if (!kind) nLanguageError(`알 수 없는 업그레이드 종류 '${rawKind}'`, node);
  if (kind === 'base') return nBaseUpgradeSnapshot(rawUpgrade, node, rawUpgradeIndex);
  if (rawUpgradeIndex !== null) {
    nLanguageError(`'${kind}' 업그레이드는 레인 번호를 사용할 수 없습니다.`, node);
  }
  if (kind === 'square') return nSquareUpgradeSnapshot(rawUpgrade, node);
  if (kind === 'square_break') return nBreakthroughUpgradeSnapshot(rawUpgrade, node);
  return nConvergenceUpgradeSnapshot(rawUpgrade, node);
}

const automatiumGameAdapter = {
  normalizeSquareTarget(target) {
    return squarePrestigeTargetPointReward(target);
  },

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
    const snapshot = nUpgradeSnapshot(kind, upgrade, node, upgradeIndex);
    if (!snapshot.available) return false;
    return snapshot.buy() === true;
  },

  square(statement, requestedSp = null, programId = null) {
    if (squareUnlocked) return true;

    const explicitTarget = requestedSp !== null;
    const targetedConversion = explicitTarget;
    const reward = targetedConversion ? squarePrestigeTargetPointReward(requestedSp) : null;
    const requiredValue = targetedConversion
      ? squarePrestigeNumberForPointReward(reward)
      : gameEndValue();

    if (compareBaseNumber(requiredValue) < 0) return false;
    return completeSquarePrestige({
      skippedCutscene: true,
      keepCurrentChapter: false,
      prestigeValue: targetedConversion ? requiredValue : getBaseNumber(),
      squarePointReward: targetedConversion ? reward : null,
      requiredValue
    });
  }
};

function automatiumGameAdapterFor(programId) {
  return {
    normalizeSquareTarget: (...args) => automatiumGameAdapter.normalizeSquareTarget(...args),
    click: (...args) => automatiumGameAdapter.click(...args),
    get: (...args) => automatiumGameAdapter.get(...args),
    buy: (...args) => automatiumGameAdapter.buy(...args),
    square: (statement, target) => automatiumGameAdapter.square(statement, target, programId)
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

function startAutomatiumProgram(program) {
  try {
    const ast = NRuntime.compile(program.source);
    const execution = NRuntime.createExecution(ast, automatiumGameAdapterFor(program.id));
    automatiumExecutions.set(program.id, {
      ...execution,
      status: 'running',
      message: '실행 중',
      waitTicks: 0
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
buy base percent_auto[2]</code></pre>
    <p><code>buy</code>는 구매할 수 없으면 다음 줄로 넘어갑니다. 끝에 <code>s</code>를 붙이면 구매 가능할 때까지 현재 프로그램만 대기하고, 구매한 뒤 다음 줄을 실행합니다.</p>

    <h4>숫자 클릭</h4>
    <pre><code>click

while true {
    click
}</code></pre>
    <p><code>click</code>은 베이스의 숫자 추가 버튼을 직접 한 번 누른 것과 같은 효과를 냅니다. 모든 N 프로그램을 합쳐 실제 1초에 최대 한 번만 작동합니다. 쿨다운 중에 실행된 <code>click</code>은 기다리거나 쌓이지 않고 즉시 다음 줄로 넘어갑니다.</p>

    <h4>SP 획득</h4>
    <pre><code>square
sp
sp 10
square 10 s

target = number
target = 20
sp target s</code></pre>
    <p><code>square</code>와 <code>sp</code>는 같은 명령입니다. 이 명령은 일반수에서 제곱으로 처음 넘어갈 때만 자동화되며, 이때 보상은 항상 1 SP입니다. 제곱 포인트, 수렴 포인트, tetraP 교환과 다음 챕터 진입은 자동화하지 않으므로 화면 왼쪽 아래의 수동 교환 버튼을 사용해야 합니다. 뒤의 목표 숫자와 <code>s</code> 표기는 이전 프로그램과의 호환을 위해 남아 있지만, 제곱에 진입한 뒤에는 아무 교환도 실행하지 않습니다.</p>

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
    <p><code>whiletick 20</code>은 조건이 참인 동안 20 자동화 틱마다 본문을 한 번 실행합니다. <code>break</code>는 가장 가까운 <code>while</code>, <code>whiletick</code>, <code>for</code>를 빠져나옵니다. 챕터 교환은 수동으로 진행해야 하므로 자동 구매 프로그램은 해당 챕터 탭을 열어 둔 상태에서 사용하세요.</p>

    <h4>연산자</h4>
    <p>산술: <code>+ - * / % ^</code> · 비교: <code>== != &gt; &gt;= &lt; &lt;=</code> · 논리: <code>and or not</code>. 괄호도 사용할 수 있습니다. 정수끼리 나누면 소수점 이하는 버립니다.</p>
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
  const baseIndexedIds = N_BASE_UPGRADE_GUIDE
    .filter(upgrade => upgrade.indexed)
    .map(upgrade => `        buy base ${upgrade.id}[lane]`)
    .join('\n');
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
      description: '구매 가능한 베이스 업그레이드와 1~16번 퍼센트 레인의 업그레이드를 반복해서 확인합니다.',
      source: `// 모든 기본 업그레이드 자동 구매
lane = number
lane = 1

while true {
${baseSingleIds}

    lane = 1
    for ${MAX_PERCENT_LANES} {
${baseIndexedIds}
        lane = lane + 1
    }

    square
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
    square s
}`
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
  return automatiumUpgradeIdRows().filter(row => row.kind === kind);
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

  const spTargetMatch = line.match(/^\s*(?:square|sp)\s+([A-Za-z_][A-Za-z0-9_]*)?$/);
  if (spTargetMatch) {
    const prefix = spTargetMatch[1] ?? '';
    const variables = nAutocompleteVariables(automatiumSource.value).map(name => ({
      label: name,
      insert: name,
      detail: '목표 SP 변수'
    }));
    const candidates = [
      { label: '1', insert: '1', detail: '목표 SP' },
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
        { label: 'square_convergence', insert: 'square_convergence.', detail: '제곱 수렴 업그레이드' }
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

  const buyMatch = line.match(/^\s*buy(?:\s+([A-Za-z_][A-Za-z0-9_]*))?(?:\s+([A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]*\]?)?))?\s*$/);
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
        { label: 'square_convergence', insert: 'square_convergence ', detail: '제곱 수렴 업그레이드' }
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
    { label: 'square', insert: 'square ', detail: '목표 SP 지정 가능' },
    { label: 'sp', insert: 'sp ', detail: '목표 SP 지정 가능' },
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

function renderAutomatiumProgramList() {
  automatiumProgramList.innerHTML = '';
  for (const program of automatiumPrograms) {
    const row = document.createElement('div');
    row.className = 'automatium-program-row';
    row.classList.toggle('selected', program.id === selectedAutomatiumProgramId);

    const selectButton = document.createElement('button');
    selectButton.className = 'automatium-program-select';
    selectButton.type = 'button';
    selectButton.addEventListener('click', () => selectAutomatiumProgram(program.id));

    const name = document.createElement('span');
    name.className = 'automatium-program-list-name';
    name.textContent = program.name;
    const status = automatiumStatus(program);
    const state = document.createElement('span');
    state.className = `automatium-program-state ${status.tone}`;
    state.textContent = status.label;
    selectButton.append(name, state);

    const toggle = document.createElement('button');
    toggle.className = `automatium-program-toggle ${program.enabled ? 'on' : 'off'}`;
    toggle.type = 'button';
    toggle.textContent = program.enabled ? 'ON' : 'OFF';
    toggle.title = `${program.name} ${program.enabled ? '끄기' : '켜기'}`;
    toggle.disabled = !hasSquareConvergenceUpgrade('automatium');
    toggle.addEventListener('click', () => toggleAutomatiumProgram(program.id));

    row.append(selectButton, toggle);
    automatiumProgramList.appendChild(row);
  }

  if (automatiumPrograms.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'automatium-empty';
    empty.textContent = '저장된 프로그램 없음';
    automatiumProgramList.appendChild(empty);
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
  if (!automatiumWorkspace || automatiumWorkspace.classList.contains('hidden')) return;
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
  if (!hasSquareConvergenceUpgrade('automatium')) {
    if (!automatiumWorkspace.classList.contains('hidden')) closeAutomatiumEditor();
  }
}

function runAutomatiumTick() {
  if (!hasSquareConvergenceUpgrade('automatium')) return;
  const enabledPrograms = automatiumPrograms.filter(program => program.enabled);
  if (enabledPrograms.length === 0) return;

  const blockedThisTick = new Set();
  for (const program of enabledPrograms) {
    let execution = automatiumExecutions.get(program.id);
    if (!execution || !execution.iterator) {
      if (!startAutomatiumProgram(program)) {
        saveAutomatiumPrograms();
        continue;
      }
      execution = automatiumExecutions.get(program.id);
    }
    if (execution.waitTicks > 0) {
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
        } else if (event.kind === 'wait-ticks') {
          execution.waitTicks = event.ticks;
          setAutomatiumRuntimeStatus(program.id, 'waiting', `${event.ticks}틱 대기`);
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
setAutomatiumTab(activeAutomatiumTab);
