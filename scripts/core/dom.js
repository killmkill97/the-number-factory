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
const squareUpgradesViewBtn = document.getElementById('squareUpgradesViewBtn');
const squareDimensionsViewBtn = document.getElementById('squareDimensionsViewBtn');
const squareUpgradesViewPanel = document.getElementById('squareUpgradesViewPanel');
const squareDimensionsViewPanel = document.getElementById('squareDimensionsViewPanel');
const squareDimensionAdditional = document.getElementById('squareDimensionAdditional');
const squareDimensionPowerValue = document.getElementById('squareDimensionPowerValue');
const squareDimensionPowerSubValue = document.getElementById('squareDimensionPowerSubValue');
const squareDimensionMultiplierValue = document.getElementById('squareDimensionMultiplierValue');
const squareDimensionSoftcapValue = document.getElementById('squareDimensionSoftcapValue');
const squareDimensionShapeLabel = document.getElementById('squareDimensionShapeLabel');
const squareDimensionXValue = document.getElementById('squareDimensionXValue');
const squareDimensionYValue = document.getElementById('squareDimensionYValue');
const squareDimensionZValue = document.getElementById('squareDimensionZValue');
const squareDimensionXRate = document.getElementById('squareDimensionXRate');
const squareDimensionYRate = document.getElementById('squareDimensionYRate');
const squareDimensionZRate = document.getElementById('squareDimensionZRate');
const squareDimensionPowerTimeBtn = document.getElementById('squareDimensionPowerTimeBtn');
const squareDimensionPowerTimeLabel = document.getElementById('squareDimensionPowerTimeLabel');
const squareDimensionPowerTimeCost = document.getElementById('squareDimensionPowerTimeCost');
const squareDimensionPowerStrengthBtn = document.getElementById('squareDimensionPowerStrengthBtn');
const squareDimensionPowerStrengthLabel = document.getElementById('squareDimensionPowerStrengthLabel');
const squareDimensionPowerStrengthCost = document.getElementById('squareDimensionPowerStrengthCost');
const squareDimensionAutoUpgradeBtn = document.getElementById('squareDimensionAutoUpgradeBtn');
const squareDimensionAutoUpgradeLabel = document.getElementById('squareDimensionAutoUpgradeLabel');
const squareDimensionAutoUpgradeStatus = document.getElementById('squareDimensionAutoUpgradeStatus');
const squareDimensionXBtn = document.getElementById('squareDimensionXBtn');
const squareDimensionYBtn = document.getElementById('squareDimensionYBtn');
const squareDimensionZBtn = document.getElementById('squareDimensionZBtn');
const squareDimensionXMaxBtn = document.getElementById('squareDimensionXMaxBtn');
const squareDimensionYMaxBtn = document.getElementById('squareDimensionYMaxBtn');
const squareDimensionZMaxBtn = document.getElementById('squareDimensionZMaxBtn');
const squareDimensionXLabel = document.getElementById('squareDimensionXLabel');
const squareDimensionYLabel = document.getElementById('squareDimensionYLabel');
const squareDimensionZLabel = document.getElementById('squareDimensionZLabel');
const squareDimensionXCostEl = document.getElementById('squareDimensionXCost');
const squareDimensionYCostEl = document.getElementById('squareDimensionYCost');
const squareDimensionZCostEl = document.getElementById('squareDimensionZCost');
const squareUpgradeGrid = document.getElementById('squareUpgradeGrid');
const squareBreakthroughGrid = document.getElementById('squareBreakthroughGrid');
const squareConvergencePointValue = document.getElementById('squareConvergencePointValue');
const squareConvergenceSubValue = document.getElementById('squareConvergenceSubValue');
const squareConvergenceGrid = document.getElementById('squareConvergenceGrid');
const squareConvergenceUpgradePanel = document.getElementById('squareConvergenceUpgradePanel');
const squareConvergenceViewBtn = document.getElementById('squareConvergenceViewBtn');
const generalizationViewBtn = document.getElementById('generalizationViewBtn');
const generalizationPanel = document.getElementById('generalizationPanel');
const theoryValue = document.getElementById('theoryValue');
const theorySubValue = document.getElementById('theorySubValue');
const theorySquarePointResourceBtn = document.getElementById('theorySquarePointResourceBtn');
const theorySquarePointResourceCost = document.getElementById('theorySquarePointResourceCost');
const theoryConvergencePointResourceBtn = document.getElementById('theoryConvergencePointResourceBtn');
const theoryConvergencePointResourceCost = document.getElementById('theoryConvergencePointResourceCost');
const researchTheoryBtn = document.getElementById('researchTheoryBtn');
const researchTheoryCost = document.getElementById('researchTheoryCost');
const generalizationTree = document.getElementById('generalizationTree');
const generalizationTreeCanvas = document.getElementById('generalizationTreeCanvas');
const generalizationConnections = document.getElementById('generalizationConnections');
const manualExchangeDock = document.getElementById('manualExchangeDock');
const manualSquareExchangeBtn = document.getElementById('manualSquareExchangeBtn');
const manualSquareExchangeCost = document.getElementById('manualSquareExchangeCost');
const manualConvergenceExchangeBtn = document.getElementById('manualConvergenceExchangeBtn');
const manualConvergenceExchangeCost = document.getElementById('manualConvergenceExchangeCost');
const manualTetrationExchangeBtn = document.getElementById('manualTetrationExchangeBtn');
const manualTetrationExchangeCost = document.getElementById('manualTetrationExchangeCost');
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
const logEl = document.getElementById('devConsoleHost');
const chapterLabel = document.getElementById('chapterLabel');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const newsTickerText = document.getElementById('newsTickerText');
const newsSettingsBtn = document.getElementById('newsSettingsBtn');
const newsSettingsPanel = document.getElementById('newsSettingsPanel');
const newsModeSelect = document.getElementById('newsModeSelect');
const currencyStatusScaleInput = document.getElementById('currencyStatusScaleInput');
const currencyStatusScaleValue = document.getElementById('currencyStatusScaleValue');
const currencyStatus = document.getElementById('currencyStatus');
const currencyNumberValue = document.getElementById('currencyNumberValue');
const currencySpValue = document.getElementById('currencySpValue');
const currencyCpValue = document.getElementById('currencyCpValue');
const currencyLspValue = document.getElementById('currencyLspValue');
const currencyTetraPValue = document.getElementById('currencyTetraPValue');
const currencyTheoryValue = document.getElementById('currencyTheoryValue');

function log() {}

const NUMBER_SUFFIXES = ['k', 'm', 'b', 't', 'qd', 'qi', 'sx', 'sp', 'oc', 'no'];

function compactMantissa(value) {
  return Number(value.toPrecision(3)).toString();
}

function formatWithExponent(mantissa, exponent, sign = '') {
  if (exponent >= 33) return `${sign}${compactMantissa(mantissa)}e${exponent}`;
  if (exponent < 3) {
    const ordinary = mantissa * (10 ** exponent);
    return `${sign}${Math.floor(ordinary).toLocaleString('en-US')}`;
  }

  let suffixIndex = Math.floor(exponent / 3) - 1;
  let abbreviated = mantissa * (10 ** (exponent % 3));
  let rounded = Number(abbreviated.toPrecision(3));

  if (rounded >= 1000 && suffixIndex < NUMBER_SUFFIXES.length - 1) {
    rounded /= 1000;
    suffixIndex++;
  }

  return `${sign}${compactMantissa(rounded)}${NUMBER_SUFFIXES[suffixIndex]}`;
}

function fmtPowerBase(n) {
  if (isApproximateNumber(n)) {
    return formatWithExponent(n.mantissa, n.exponent);
  }

  const value = BigInt(n);
  if (value === 0n) return '0';
  const sign = value < 0n ? '-' : '';
  const digits = (value < 0n ? -value : value).toString();
  if (digits.length <= 3) return `${sign}${digits}`;

  const significantDigits = digits.slice(0, 16);
  const mantissa = Number(significantDigits) / (10 ** (significantDigits.length - 1));
  return formatWithExponent(mantissa, digits.length - 1, sign);
}

function fmt(n) {
  return fmtPowerBase(n);
}

function fmtScientific(n) {
  return fmtPowerBase(n);
}
