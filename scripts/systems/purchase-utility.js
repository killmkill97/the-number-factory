const MAXIMUM_PURCHASE_SLICE_MS = 12;
const MAXIMUM_PURCHASE_SLICE_OPERATIONS = 128;
const maximumPurchaseButtons = new WeakMap();
let activeMaximumPurchase = null;

function registerMaximumPurchase(button, action) {
  if (button) maximumPurchaseButtons.set(button, action);
}

function purchaseResourceBalance(resource) {
  switch (resource) {
    case 'number': return getBaseNumber();
    case 'sp': return squarePoints;
    case 'cp': return squareConvergencePoints;
    case 'kp': return knuthPoints;
    case 'random': return randomPower;
    case 'singularity': return singularityPoints;
    case 'mass': return stagnantMassMg;
    default: return 0;
  }
}

function purchaseResourceReserve(resource) {
  if (resource === 'sp' && abstractionPermanentStorageActive('23-3')) return abstractionPermanentSp;
  if (resource === 'singularity' && abstractionPermanentStorageActive('26-2')) return abstractionPermanentSingularities;
  return 0;
}

function maximumPurchaseAction(resource, cost, buy, options = {}) {
  return { resource, cost, buy, ...options };
}

function percentMaximumPurchaseAction(lane = null) {
  return maximumPurchaseAction('number', () => {
    if (lane) repairPercentLanePowerCost(lane);
    else repairPercentPowerCostState();
    return lane
      ? percentPowerCost(lane.powerCost, lane.powerCostCompounding, lane.powerPurchaseCount, scaleByLane(40000, lane.laneNumber))
      : percentPowerCost(percentPowerUpgradeCost, percentPowerCostCompounding);
  }, () => lane ? buyExtraLanePower(lane) : upgradePercentPower(), {
    batch: (job, deadline) => buyPercentPowerBatch(Number.MAX_SAFE_INTEGER, lane, deadline, job),
    valid: () => !lane || extraPercentLanes.includes(lane)
  });
}

const fixedMaximumPurchaseActions = new Map([
  ['upgradeClickBtn', () => maximumPurchaseAction('number', () => discountedCost(perClickUpgradeCost), upgradePerClick)],
  ['autoClickerSpeedBtn', () => maximumPurchaseAction('number', () => discountedCost(autoClickerSpeedPrice), upgradeAutoClickerSpeed)],
  ['autoClickerParallelBtn', () => maximumPurchaseAction('number', () => discountedCost(autoClickerParallelPrice), upgradeAutoClickerParallel)],
  ['upgradeChargeBtn', () => maximumPurchaseAction('number', () => discountedCost(percentChargeUpgradeCost), upgradePercentCharge)],
  ['percentPowerBtn', () => percentMaximumPurchaseAction()],
  ['percentAutoSpeedBtn', () => maximumPurchaseAction('number', () => discountedCost(percentAutoSpeedPrice), upgradePercentAutoSpeed)],
  ['percentParallelUnlockBtn', () => maximumPurchaseAction('number', () => discountedCost(nextPercentLaneUnlockCost), unlockNextPercentLane)],
  ['researchTheoryBtn', () => ({ maximum: researchTheoryMaximum })],
  ['buyGreatTheoryBtn', () => ({ maximum: () => purchaseGreatTheory(greatTheoryMaximumPurchases()) })],
  ['knuthOperationUpgradeBtn', () => maximumPurchaseAction('kp', knuthOperationUpgradeCost, () => buyKnuthOperationUpgrade({ renderAfter: false }))],
  ['abstractionBuyPresetSlotBtn', () => maximumPurchaseAction('kp', abstractionPresetSlotCost, buyAbstractionPresetSlot)],
  ['numberBlackHoleAmountUpgradeBtn', () => maximumPurchaseAction('kp', () => numberBlackHoleDonationAmountCost, () => buyNumberBlackHoleUpgrade('amount', false))],
  ['numberBlackHoleSpeedUpgradeBtn', () => maximumPurchaseAction('kp', () => numberBlackHoleDonationSpeedCost, () => buyNumberBlackHoleUpgrade('speed', false))],
  ['singularityBlackHoleUpgradeBtn', () => maximumPurchaseAction('singularity', () => singularityUpgradeCost('black_hole'), () => buySingularityUpgrade('black_hole'))],
  ['singularityKpUpgradeBtn', () => maximumPurchaseAction('singularity', () => singularityUpgradeCost('kp_gain'), () => buySingularityUpgrade('kp_gain'))]
]);

for (const [id, cost, buy] of [
  ['A', () => divergerACpCost, () => buyDivergerAUpgrade(false)],
  ['B', () => divergerBCpCost, () => buyDivergerBUpgrade(false)],
  ['C', () => divergerCCpCost, () => buyDivergerCUpgrade(false)],
  ['Speed', () => divergerSpeedCpCost, () => buyDivergerSpeedUpgrade(false)]
]) fixedMaximumPurchaseActions.set(`diverger${id}UpgradeBtn`, () => maximumPurchaseAction('cp', cost, buy));

for (const upgrade of PROBABILIZER_UPGRADES) {
  const suffix = upgrade.id[0].toUpperCase() + upgrade.id.slice(1);
  fixedMaximumPurchaseActions.set(`probabilizer${suffix}UpgradeBtn`, () =>
    maximumPurchaseAction('kp', () => probabilizerUpgradeCost(upgrade.id), () => buyProbabilizerUpgrade(upgrade.id)));
}
for (const upgrade of PROBABILIZER_POWER_UPGRADES) {
  const suffix = upgrade.id.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('');
  fixedMaximumPurchaseActions.set(`probabilizerPower${suffix}UpgradeBtn`, () =>
    maximumPurchaseAction('random', () => probabilizerPowerUpgradeCost(upgrade.id), () => buyProbabilizerPowerUpgrade(upgrade.id)));
}
for (const upgrade of SPACE_EXPANSION_UPGRADES) {
  const suffix = upgrade.id.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('');
  fixedMaximumPurchaseActions.set(`spaceExpansion${suffix}UpgradeBtn`, () =>
    maximumPurchaseAction('mass', () => spaceExpansionUpgradeCost(upgrade.id), () => buySpaceExpansionUpgrade(upgrade.id)));
}

function dimensionMaximumPurchaseAction(role, index) {
  const side = /^([xyz])-btn$/.exec(role)?.[1];
  if (side) return { maximum: () => buySquareDimensionSideMaximum(side, index) };
  if (role === 'power-time-btn') return maximumPurchaseAction('sp',
    () => squareDimensionState(index).powerIntervalCost, () => buySquareDimensionPowerTimeUpgrade(index, false));
  return null;
}

function resolveMaximumPurchase(button) {
  const registered = maximumPurchaseButtons.get(button);
  if (registered) return typeof registered === 'function' ? registered() : registered;
  const fixed = fixedMaximumPurchaseActions.get(button.id);
  if (fixed) return fixed();

  const dimension = /^squareDimension([XYZ]|PowerTime)Btn$/.exec(button.id);
  if (dimension) return dimensionMaximumPurchaseAction(dimension[1] === 'PowerTime'
    ? 'power-time-btn' : `${dimension[1].toLowerCase()}-btn`, 0);
  if (squareDimensionAdditional?.contains(button)) return dimensionMaximumPurchaseAction(button.dataset.role, 1);

  const baseId = button.dataset.knuthBaseUpgrade;
  const base = KNUTH_BASE_UPGRADES.find(upgrade => upgrade.id === baseId);
  if (base) return maximumPurchaseAction('kp', () => knuthBaseUpgradeCost(base), () => buyKnuthBaseUpgrade(base.id, { renderAfter: false }));

  if (typeof knuthAdvancedUpgradeUi !== 'undefined') {
    for (const [id, ui] of knuthAdvancedUpgradeUi) {
      if (ui.purchase.button === button) return maximumPurchaseAction('kp',
        () => knuthAdvancedUpgradeCost(id), () => buyKnuthAdvancedUpgrade(id), { division: true });
    }
  }
  for (const lane of extraPercentLanes) {
    if (lane.ui?.powerBtn === button) return percentMaximumPurchaseAction(lane);
    if (lane.ui?.speedBtn === button) return maximumPurchaseAction('number',
      () => discountedCost(lane.autoSpeedPrice), () => upgradeExtraLaneAutoSpeed(lane),
      { valid: () => extraPercentLanes.includes(lane) });
  }
  const { devUpgradeKind: kind, devUpgradeId: id } = button.dataset;
  if (kind === 'square_breakthrough') {
    const upgrade = SQUARE_BREAKTHROUGH_UPGRADES.find(item => item.id === id);
    if (upgrade) return maximumPurchaseAction('sp', () => squareBreakthroughCost(upgrade), () => buySquareBreakthroughUpgrade(id));
  }
  if (kind === 'square_convergence') {
    const upgrade = SQUARE_CONVERGENCE_UPGRADES.find(item => item.id === id);
    if (upgrade && (upgrade.repeatable || upgrade.max > 1)) return maximumPurchaseAction('cp',
      () => squareConvergenceUpgradeCost(upgrade), () => buySquareConvergenceUpgrade(id));
  }
  // Single-purchase unlocks/research and equipment retain their existing handlers.
  return null;
}

function finishMaximumPurchase(job) {
  if (job.timer !== null) clearTimeout(job.timer);
  job.done = true;
  job.button?.removeAttribute?.('aria-busy');
  if (activeMaximumPurchase === job) activeMaximumPurchase = null;
  if (job.purchased > 0) render();
}

function cancelMaximumPurchases() {
  if (activeMaximumPurchase) finishMaximumPurchase(activeMaximumPurchase);
}

function buyMaximumPurchaseStep(job, cost) {
  if (cost === null || compareNumberValues(cost, 0) < 0 || compareUpgradeCost(job.remaining, cost) < 0 || !job.action.buy()) return false;
  job.purchased++;
  job.remaining = job.action.division
    ? NumberMath.floor(NumberMath.divideApproximate(job.remaining, cost))
    : NumberMath.max(job.reserve, subtractNumberValues(job.remaining, cost));
  return true;
}

function runMaximumPurchaseSlice(job) {
  if (job !== activeMaximumPurchase || job.done) return;
  if (gameSessionPaused() || job.button?.isConnected === false || job.action.valid?.() === false) {
    finishMaximumPurchase(job);
    return;
  }
  const deadline = gameClockNowMs() + MAXIMUM_PURCHASE_SLICE_MS;
  try {
    for (let operations = 0; operations < MAXIMUM_PURCHASE_SLICE_OPERATIONS; operations++) {
      const cost = job.action.cost();
      if (cost === null || compareNumberValues(cost, 0) < 0 || compareUpgradeCost(job.remaining, cost) < 0) {
        finishMaximumPurchase(job);
        return;
      }
      if (job.action.batch) {
        const result = job.action.batch(job, deadline);
        job.purchased += result.purchased;
        if (result.purchased === 0) {
          // A costly quote must not repeatedly exhaust the budget without progress.
          if (gameClockNowMs() < deadline || !buyMaximumPurchaseStep(job, job.action.cost())) {
            finishMaximumPurchase(job);
            return;
          }
        }
        break;
      }
      if (!buyMaximumPurchaseStep(job, cost)) {
        finishMaximumPurchase(job);
        return;
      }
      if (gameClockNowMs() >= deadline) break;
    }
    render();
    job.timer = setTimeout(() => runMaximumPurchaseSlice(job), 0);
  } catch (error) {
    finishMaximumPurchase(job);
    throw error;
  }
}

function startMaximumPurchase(action, button = null) {
  cancelMaximumPurchases();
  if (action.maximum) return action.maximum();
  const remaining = purchaseResourceBalance(action.resource);
  const job = { action, button, remaining, reserve: NumberMath.min(remaining, purchaseResourceReserve(action.resource)),
    purchased: 0, done: false, timer: null };
  activeMaximumPurchase = job;
  button?.setAttribute('aria-busy', 'true');
  runMaximumPurchaseSlice(job);
  return job;
}

function handleMaximumPurchaseClick(event) {
  const button = event.target?.closest?.('button');
  cancelMaximumPurchases();
  if (!button || button.disabled || !event.shiftKey || event.defaultPrevented || (event.button != null && event.button !== 0)) return;
  const action = resolveMaximumPurchase(button);
  if (!action) return;
  if (gameSessionPaused()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.isTrusted) achievementRunProgress.manualGameplay = true;
  startMaximumPurchase(action, button);
}

// Registered after developer capture handlers so their Shift shortcuts win.
document.addEventListener('click', handleMaximumPurchaseClick, true);
