const mainValue = document.getElementById('mainValue');
const subValue = document.getElementById('subValue');
const displayBox = document.getElementById('displayBox');
const addBtn = document.getElementById('addBtn');
const chapterTabs = document.getElementById('chapterTabs');
const multiplicationTabBtn = document.getElementById('multiplicationTabBtn');
const squareTabBtn = document.getElementById('squareTabBtn');
const squareBreakthroughTabBtn = document.getElementById('squareBreakthroughTabBtn');
const squareConvergenceTabBtn = document.getElementById('squareConvergenceTabBtn');
const tetrationTabBtn = document.getElementById('tetrationTabBtn');
const multiplicationPanel = document.getElementById('multiplicationPanel');
const squarePanel = document.getElementById('squarePanel');
const squareBreakthroughPanel = document.getElementById('squareBreakthroughPanel');
const squareConvergencePanel = document.getElementById('squareConvergencePanel');
const tetrationPanel = document.getElementById('tetrationPanel');
const squarePointValue = document.getElementById('squarePointValue');
const squarePointSubValue = document.getElementById('squarePointSubValue');
const squareUpgradeGrid = document.getElementById('squareUpgradeGrid');
const squareBreakthroughGrid = document.getElementById('squareBreakthroughGrid');
const squareConvergencePointValue = document.getElementById('squareConvergencePointValue');
const squareConvergenceSubValue = document.getElementById('squareConvergenceSubValue');
const squareConvergenceGrid = document.getElementById('squareConvergenceGrid');
const autoSpConverterToggleBtn = document.getElementById('autoSpConverterToggleBtn');
const autoSpConverterToggleLabel = document.getElementById('autoSpConverterToggleLabel');
const autoSpConverterToggleCost = document.getElementById('autoSpConverterToggleCost');
const autoSpConverterTargetInput = document.getElementById('autoSpConverterTargetInput');
const autoSpConverterTargetBtn = document.getElementById('autoSpConverterTargetBtn');
const autoSpConverterStatus = document.getElementById('autoSpConverterStatus');
const unlockTetrationBtn = document.getElementById('unlockTetrationBtn');
const unlockTetrationCost = document.getElementById('unlockTetrationCost');
const lspValue = document.getElementById('lspValue');
const lspSubValue = document.getElementById('lspSubValue');
const tetraPointValue = document.getElementById('tetraPointValue');
const convertLspBtn = document.getElementById('convertLspBtn');
const convertLspCost = document.getElementById('convertLspCost');
const autoLspConverterBtn = document.getElementById('autoLspConverterBtn');
const autoLspConverterLabel = document.getElementById('autoLspConverterLabel');
const autoLspConverterCost = document.getElementById('autoLspConverterCost');
const tetrationUpgradeGrid = document.getElementById('tetrationUpgradeGrid');
const tetrationDimensionMeta = document.getElementById('tetrationDimensionMeta');
const tetrationDimensionsEl = document.getElementById('tetrationDimensions');
const upgradeClickBtn = document.getElementById('upgradeClickBtn');
const upgradeClickCost = document.getElementById('upgradeClickCost');
const autoClickerBtn = document.getElementById('autoClickerBtn');
const autoClickerCostText = document.getElementById('autoClickerCost');
const autoClickerSpeedBtn = document.getElementById('autoClickerSpeedBtn');
const autoClickerSpeedCostText = document.getElementById('autoClickerSpeedCost');
const autoClickerParallelBtn = document.getElementById('autoClickerParallelBtn');
const autoClickerParallelCostText = document.getElementById('autoClickerParallelCost');
const autoClickerPercentFillBtn = document.getElementById('autoClickerPercentFillBtn');
const autoClickerPercentFillCostText = document.getElementById('autoClickerPercentFillCost');
const percentSection = document.getElementById('percentSection');
const percentTitle = document.getElementById('percentTitle');
const percentBtn = document.getElementById('percentBtn');
const chargeFill = document.getElementById('chargeFill');
const upgradeChargeBtn = document.getElementById('upgradeChargeBtn');
const upgradeChargeLabel = document.getElementById('upgradeChargeLabel');
const upgradeChargeCost = document.getElementById('upgradeChargeCost');
const percentPowerRow = document.getElementById('percentPowerRow');
const percentPowerBtn = document.getElementById('percentPowerBtn');
const percentPowerLabel = document.getElementById('percentPowerLabel');
const percentPowerCostText = document.getElementById('percentPowerCost');
const percentAutoBtn = document.getElementById('percentAutoBtn');
const percentAutoCostText = document.getElementById('percentAutoCost');
const percentAutoSpeedBtn = document.getElementById('percentAutoSpeedBtn');
const percentAutoSpeedCostText = document.getElementById('percentAutoSpeedCost');
const percentParallelUnlockBtn = document.getElementById('percentParallelUnlockBtn');
const percentParallelUnlockCostText = document.getElementById('percentParallelUnlockCost');
const extraPercentLanesEl = document.getElementById('extraPercentLanes');
const dialogueBox = document.getElementById('dialogueBox');
const prestigeBtn = document.getElementById('prestigeBtn');
const logEl = document.getElementById('log');
const chapterLabel = document.getElementById('chapterLabel');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const newsTickerText = document.getElementById('newsTickerText');
const newsSettingsBtn = document.getElementById('newsSettingsBtn');
const newsModeSelect = document.getElementById('newsModeSelect');

function log(msg, system=false) {
  const p = document.createElement('p');
  if (system) p.className = 'system';
  p.textContent = msg;
  logEl.prepend(p);
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function fmtPowerBase(n) {
  const digits = n.toString();
  if (digits.length <= 9) return fmt(n);

  const significant = digits.slice(0, 3);
  const decimal = significant.slice(1).replace(/0+$/, '');
  const mantissa = decimal ? `${significant[0]}.${decimal}` : significant[0];
  return `${mantissa}e${digits.length - 1}`;
}
