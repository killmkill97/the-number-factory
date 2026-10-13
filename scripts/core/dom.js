const mainValue = document.getElementById('mainValue');
const subValue = document.getElementById('subValue');
const gameTitle = document.getElementById('gameTitle');
const displayBox = document.getElementById('displayBox');
const addBtn = document.getElementById('addBtn');
const chapterTabs = document.getElementById('chapterTabs');
const multiplicationTabBtn = document.getElementById('multiplicationTabBtn');
const squareTabBtn = document.getElementById('squareTabBtn');
const knuthTabBtn = document.getElementById('knuthTabBtn');
const multiplicationPanel = document.getElementById('multiplicationPanel');
const multiplicationNumberViewBtn = document.getElementById('multiplicationNumberViewBtn');
const achievementsViewBtn = document.getElementById('achievementsViewBtn');
const multiplicationNumberViewPanel = document.getElementById('multiplicationNumberViewPanel');
const achievementsViewPanel = document.getElementById('achievementsViewPanel');
const achievementList = document.getElementById('achievementList');
const generalAchievementsTabBtn = document.getElementById('generalAchievementsTabBtn');
const secretAchievementsTabBtn = document.getElementById('secretAchievementsTabBtn');
const secretAchievementList = document.getElementById('secretAchievementList');
const squarePanel = document.getElementById('squarePanel');
const squareBreakthroughPanel = document.getElementById('squareBreakthroughPanel');
const squareConvergencePanel = document.getElementById('squareConvergencePanel');
const knuthPanel = document.getElementById('knuthPanel');
const squarePointValue = document.getElementById('squarePointValue');
const squarePointSubValue = document.getElementById('squarePointSubValue');
const squareUpgradesViewBtn = document.getElementById('squareUpgradesViewBtn');
const squareBreakthroughViewBtn = document.getElementById('squareBreakthroughViewBtn');
const squareConvergenceChapterViewBtn = document.getElementById('squareConvergenceChapterViewBtn');
const squareDimensionsViewBtn = document.getElementById('squareDimensionsViewBtn');
const squareUpgradesViewPanel = document.getElementById('squareUpgradesViewPanel');
const squareDimensionsViewPanel = document.getElementById('squareDimensionsViewPanel');
const squareDimensionProductionTabBtn = document.getElementById('squareDimensionProductionTabBtn');
const divergerProductionTabBtn = document.getElementById('divergerProductionTabBtn');
const squareDimensionProductionPanel = document.getElementById('squareDimensionProductionPanel');
const divergerProductionPanel = document.getElementById('divergerProductionPanel');
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
const divergerPowerValue = document.getElementById('divergerPowerValue');
const divergerPowerSubValue = document.getElementById('divergerPowerSubValue');
const divergerSoftcapValue = document.getElementById('divergerSoftcapValue');
const divergerGraphLine = document.getElementById('divergerGraphLine');
const divergerGraphScreen = document.querySelector('.diverger-graph-screen');
const divergerNValue = document.getElementById('divergerNValue');
const divergerAValue = document.getElementById('divergerAValue');
const divergerBValue = document.getElementById('divergerBValue');
const divergerCValue = document.getElementById('divergerCValue');
const divergerIntervalValue = document.getElementById('divergerIntervalValue');
const divergerAutoUpgradeBtn = document.getElementById('divergerAutoUpgradeBtn');
const divergerAUpgradeBtn = document.getElementById('divergerAUpgradeBtn');
const divergerAUpgradeLabel = document.getElementById('divergerAUpgradeLabel');
const divergerAUpgradeCost = document.getElementById('divergerAUpgradeCost');
const divergerBUpgradeBtn = document.getElementById('divergerBUpgradeBtn');
const divergerBUpgradeLabel = document.getElementById('divergerBUpgradeLabel');
const divergerBUpgradeCost = document.getElementById('divergerBUpgradeCost');
const divergerCUpgradeBtn = document.getElementById('divergerCUpgradeBtn');
const divergerCUpgradeLabel = document.getElementById('divergerCUpgradeLabel');
const divergerCUpgradeCost = document.getElementById('divergerCUpgradeCost');
const divergerSpeedUpgradeBtn = document.getElementById('divergerSpeedUpgradeBtn');
const divergerSpeedUpgradeLabel = document.getElementById('divergerSpeedUpgradeLabel');
const divergerSpeedUpgradeCost = document.getElementById('divergerSpeedUpgradeCost');
const squareUpgradeGrid = document.getElementById('squareUpgradeGrid');
const squareBreakthroughGrid = document.getElementById('squareBreakthroughGrid');
const squareConvergencePointValue = document.getElementById('squareConvergencePointValue');
const squareConvergenceSubValue = document.getElementById('squareConvergenceSubValue');
const squareConvergenceGrid = document.getElementById('squareConvergenceGrid');
const squareConvergenceUpgradePanel = document.getElementById('squareConvergenceUpgradePanel');
const squareConvergenceViewBtn = document.getElementById('squareConvergenceViewBtn');
const generalizationViewBtn = document.getElementById('generalizationViewBtn');
const generalizationPanel = document.getElementById('generalizationPanel');
const abstractionPanel = document.getElementById('abstractionPanel');
const theoryValue = document.getElementById('theoryValue');
const theorySubValue = document.getElementById('theorySubValue');
const theorySquarePointResourceBtn = document.getElementById('theorySquarePointResourceBtn');
const theorySquarePointResourceCost = document.getElementById('theorySquarePointResourceCost');
const theoryConvergencePointResourceBtn = document.getElementById('theoryConvergencePointResourceBtn');
const theoryConvergencePointResourceCost = document.getElementById('theoryConvergencePointResourceCost');
const researchTheoryBtn = document.getElementById('researchTheoryBtn');
const researchTheoryMaxBtn = document.getElementById('researchTheoryMaxBtn');
const researchTheoryCost = document.getElementById('researchTheoryCost');
const generalizationResetBtn = document.getElementById('generalizationResetBtn');
const generalizationResetCostEl = document.getElementById('generalizationResetCost');
const greatTheoryValue = document.getElementById('greatTheoryValue');
const abstractionSpRate = document.getElementById('abstractionSpRate');
const abstractionResetToggle = document.getElementById('abstractionResetToggle');
const abstractionResetLabel = document.getElementById('abstractionResetLabel');
const abstractionResetRefund = document.getElementById('abstractionResetRefund');
const greatTheoryCpResourceBtn = document.getElementById('greatTheoryCpResourceBtn');
const greatTheoryCpResourceCost = document.getElementById('greatTheoryCpResourceCost');
const greatTheoryKpResourceBtn = document.getElementById('greatTheoryKpResourceBtn');
const greatTheoryKpResourceCost = document.getElementById('greatTheoryKpResourceCost');
const greatTheorySpResourceBtn = document.getElementById('greatTheorySpResourceBtn');
const greatTheorySpResourceCost = document.getElementById('greatTheorySpResourceCost');
const greatTheoryTheoryResourceBtn = document.getElementById('greatTheoryTheoryResourceBtn');
const greatTheoryTheoryResourceCost = document.getElementById('greatTheoryTheoryResourceCost');
const buyGreatTheoryBtn = document.getElementById('buyGreatTheoryBtn');
const buyGreatTheoryMaxBtn = document.getElementById('buyGreatTheoryMaxBtn');
const buyGreatTheoryCost = document.getElementById('buyGreatTheoryCost');
const abstractionTree = document.getElementById('abstractionTree');
const abstractionTreeCanvas = document.getElementById('abstractionTreeCanvas');
const abstractionConnections = document.getElementById('abstractionConnections');
const abstractionZoomOutBtn = document.getElementById('abstractionZoomOutBtn');
const abstractionZoomResetBtn = document.getElementById('abstractionZoomResetBtn');
const abstractionZoomInBtn = document.getElementById('abstractionZoomInBtn');
const abstractionZoomValue = document.getElementById('abstractionZoomValue');
const generalizationTree = document.getElementById('generalizationTree');
const generalizationTreeCanvas = document.getElementById('generalizationTreeCanvas');
const generalizationConnections = document.getElementById('generalizationConnections');
const generalizationZoomOutBtn = document.getElementById('generalizationZoomOutBtn');
const generalizationZoomResetBtn = document.getElementById('generalizationZoomResetBtn');
const generalizationZoomInBtn = document.getElementById('generalizationZoomInBtn');
const generalizationZoomValue = document.getElementById('generalizationZoomValue');
const manualExchangeDock = document.getElementById('manualExchangeDock');
const knuthChallengeCompleteBtn = document.getElementById('knuthChallengeCompleteBtn');
const manualSquareExchangeBtn = document.getElementById('manualSquareExchangeBtn');
const manualSquareExchangeCost = document.getElementById('manualSquareExchangeCost');
const manualConvergenceExchangeBtn = document.getElementById('manualConvergenceExchangeBtn');
const manualConvergenceExchangeCost = document.getElementById('manualConvergenceExchangeCost');
const manualKnuthExchangeBtn = document.getElementById('manualKnuthExchangeBtn');
const manualKnuthExchangeCost = document.getElementById('manualKnuthExchangeCost');
const currencyKnuthValue = document.getElementById('currencyKnuthValue');
const knuthPointValue = document.getElementById('knuthPointValue');
const knuthSlotDisplay = document.getElementById('knuthSlotDisplay');
const knuthBaseUpgradeViewBtn = document.getElementById('knuthBaseUpgradeViewBtn');
const knuthProductionViewBtn = document.getElementById('knuthProductionViewBtn');
const knuthEquipUpgradeViewBtn = document.getElementById('knuthEquipUpgradeViewBtn');
const knuthChallengeViewBtn = document.getElementById('knuthChallengeViewBtn');
const knuthAbstractionViewBtn = document.getElementById('knuthAbstractionViewBtn');
const knuthBaseUpgradePanel = document.getElementById('knuthBaseUpgradePanel');
const knuthBaseUpgradeGroups = document.getElementById('knuthBaseUpgradeGroups');
const knuthProductionPanel = document.getElementById('knuthProductionPanel');
const knuthEquipUpgradePanel = document.getElementById('knuthEquipUpgradePanel');
const knuthChallengePanel = document.getElementById('knuthChallengePanel');
const numberBlackHoleStatus = document.getElementById('numberBlackHoleStatus');
const numberBlackHoleAmountUpgradeBtn = document.getElementById('numberBlackHoleAmountUpgradeBtn');
const numberBlackHoleAmountUpgradeCost = document.getElementById('numberBlackHoleAmountUpgradeCost');
const numberBlackHoleAmountMinusBtn = document.getElementById('numberBlackHoleAmountMinusBtn');
const numberBlackHoleAmountInput = document.getElementById('numberBlackHoleAmountInput');
const numberBlackHoleAmountPlusBtn = document.getElementById('numberBlackHoleAmountPlusBtn');
const numberBlackHoleAmountLimit = document.getElementById('numberBlackHoleAmountLimit');
const numberBlackHoleSpeedUpgradeBtn = document.getElementById('numberBlackHoleSpeedUpgradeBtn');
const numberBlackHoleSpeedUpgradeCost = document.getElementById('numberBlackHoleSpeedUpgradeCost');
const numberBlackHoleSpeedMinusBtn = document.getElementById('numberBlackHoleSpeedMinusBtn');
const numberBlackHoleSpeedInput = document.getElementById('numberBlackHoleSpeedInput');
const numberBlackHoleSpeedPlusBtn = document.getElementById('numberBlackHoleSpeedPlusBtn');
const numberBlackHoleSpeedLimit = document.getElementById('numberBlackHoleSpeedLimit');
const numberBlackHoleRadiusValue = document.getElementById('numberBlackHoleRadiusValue');
const numberBlackHoleTimeMultiplierValue = document.getElementById('numberBlackHoleTimeMultiplierValue');
const numberBlackHoleAccumulatedTimeValue = document.getElementById('numberBlackHoleAccumulatedTimeValue');
const knuthChallengeKc1 = document.getElementById('knuthChallengeKc1');
const knuthChallengeKc1Status = document.getElementById('knuthChallengeKc1Status');
const knuthChallengeKc1Progress = document.getElementById('knuthChallengeKc1Progress');
const knuthChallengeKc1Btn = document.getElementById('knuthChallengeKc1Btn');
const knuthChallengeKc2 = document.getElementById('knuthChallengeKc2');
const knuthChallengeKc2Status = document.getElementById('knuthChallengeKc2Status');
const knuthChallengeKc2Progress = document.getElementById('knuthChallengeKc2Progress');
const knuthChallengeKc2Btn = document.getElementById('knuthChallengeKc2Btn');
const knuthChallengeKc3 = document.getElementById('knuthChallengeKc3');
const knuthChallengeKc3Status = document.getElementById('knuthChallengeKc3Status');
const knuthChallengeKc3Progress = document.getElementById('knuthChallengeKc3Progress');
const knuthChallengeKc3Btn = document.getElementById('knuthChallengeKc3Btn');
const knuthResetEquipmentToggle = document.getElementById('knuthResetEquipmentToggle');
const knuthOperationUpgradeBtn = document.getElementById('knuthOperationUpgradeBtn');
const knuthOperationUpgradeCostText = document.getElementById('knuthOperationUpgradeCost');
const knuthUpgradeGroups = document.getElementById('knuthUpgradeGroups');
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
const achievementToast = document.getElementById('achievementToast');
const achievementToastText = document.getElementById('achievementToastText');
const currencyStatusScaleInput = document.getElementById('currencyStatusScaleInput');
const currencyStatusScaleValue = document.getElementById('currencyStatusScaleValue');
const currencyStatus = document.getElementById('currencyStatus');
const activeChallengeStatus = document.getElementById('activeChallengeStatus');
const currencyNumberValue = document.getElementById('currencyNumberValue');
const currencySpValue = document.getElementById('currencySpValue');
const currencyCpValue = document.getElementById('currencyCpValue');
const currencyTheoryValue = document.getElementById('currencyTheoryValue');
const currencyGreatTheoryValue = document.getElementById('currencyGreatTheoryValue');
const authSignedOutPanel = document.getElementById('authSignedOutPanel');
const authSignedInPanel = document.getElementById('authSignedInPanel');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const googleSignOutBtn = document.getElementById('googleSignOutBtn');
const authProfilePhoto = document.getElementById('authProfilePhoto');
const authProfileName = document.getElementById('authProfileName');
const authProfileEmail = document.getElementById('authProfileEmail');
const authDebugAccessStatus = document.getElementById('authDebugAccessStatus');
const authStatus = document.getElementById('authStatus');

function log() {}

const NUMBER_SUFFIXES = ['k', 'm', 'b', 't', 'qd', 'qi', 'sx', 'sp', 'oc', 'no'];

function compactMantissa(value) {
  return Number(value.toPrecision(3)).toString();
}

function formatExponent(exponent) {
  if (exponent?.negativeExponent === true) {
    return `-${formatExponent(exponent.value)}`;
  }
  if (NumberMath.isScientific(exponent)) {
    return formatScientificParts(exponent.mantissa, exponent.exponent);
  }

  const numericExponent = Number(exponent);
  if (!Number.isFinite(numericExponent)) return String(numericExponent);

  const integerExponent = Math.floor(numericExponent);
  if (integerExponent < 1000) return String(integerExponent);

  const magnitude = Math.floor(Math.log10(integerExponent));
  const mantissa = integerExponent / (10 ** magnitude);
  if (magnitude >= 33) {
    return `${compactMantissa(mantissa)}e${magnitude}`;
  }

  return formatWithExponent(mantissa, magnitude);
}

function formatScientificParts(mantissa, exponent, sign = '') {
  return `${sign}${compactMantissa(mantissa)}e${formatExponent(exponent)}`;
}

function formatWithExponent(mantissa, exponent, sign = '') {
  if (NumberMath.isScientific(exponent) || exponent?.negativeExponent === true) {
    return formatScientificParts(mantissa, exponent, sign);
  }

  if (exponent >= 33) return formatScientificParts(mantissa, exponent, sign);
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
  const scientific = NumberMath.toScientific(n);
  if (!scientific) return '0';
  return formatWithExponent(scientific.mantissa, scientific.exponent);
}

function fmt(n) {
  return fmtPowerBase(n);
}

function fmtScientific(n) {
  const scientific = NumberMath.toScientific(n);
  if (!scientific) return '0';
  return formatScientificParts(scientific.mantissa, scientific.exponent);
}
