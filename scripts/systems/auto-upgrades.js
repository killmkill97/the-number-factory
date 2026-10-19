const AUTO_UPGRADE_INTERVAL_MS = 250;
const AUTO_UPGRADE_POLL_MS = 50;
// A single browser task must stay short enough for input and rendering to run.
// Power levels can be solved in bulk; other purchases remain bounded work.
const AUTO_UPGRADE_BATCH_OPERATION_LIMIT = 256;
const AUTO_UPGRADE_BATCH_BUDGET_MS = 12;
let autoUpgradeLastTickAt = gameTimelineNowMs();

function automaticUpgradeBatchSizeForElapsed(elapsedMs) {
  const acceleratedTime = gameTick(elapsedMs) * autoUpgradeSpeedMultiplier();
  if (!Number.isFinite(acceleratedTime)) return AUTO_UPGRADE_BATCH_OPERATION_LIMIT;
  return Math.max(
    1,
    Math.min(AUTO_UPGRADE_BATCH_OPERATION_LIMIT, Math.floor(acceleratedTime / AUTO_UPGRADE_INTERVAL_MS))
  );
}

function automaticUpgradeChoices() {
  const upgradeChoices = [
    upgradePerClick,
    buyAutoClicker,
    upgradeAutoClickerSpeed,
    upgradeAutoClickerParallel,
    buyAutoClickerPercentFill,
    upgradePercentCharge,
    Object.assign(() => upgradePercentPower(), {
      buyBulk: (limit, deadline) => buyPercentPowerBatch(limit, null, deadline)
    }),
    buyPercentAuto,
    upgradePercentAutoSpeed,
    unlockNextPercentLane
  ];

  for (const lane of extraPercentLanes) {
    upgradeChoices.push(
      Object.assign(() => buyExtraLanePower(lane), {
        buyBulk: (limit, deadline) => buyPercentPowerBatch(limit, lane, deadline)
      }),
      () => buyExtraLaneAuto(lane),
      () => upgradeExtraLaneAutoSpeed(lane)
    );
  }

  for (let i = upgradeChoices.length - 1; i > 0; i--) {
    const swapIndex = Math.floor(Math.random() * (i + 1));
    [upgradeChoices[i], upgradeChoices[swapIndex]] = [upgradeChoices[swapIndex], upgradeChoices[i]];
  }

  return upgradeChoices;
}

function automaticUpgradeCanRun() {
  return hasSquareUpgrade('auto_upgrade_top_down')
    && autoUpgradeEnabled
    && !overflowed
    && !squareMode;
}

function tryAutomaticUpgrade() {
  if (!automaticUpgradeCanRun()) return false;

  for (const upgrade of automaticUpgradeChoices()) {
    if (upgrade()) return true;
  }

  return false;
}

function tryAutomaticUpgradeBatch(maxPurchasesPerUpgrade) {
  if (!automaticUpgradeCanRun()) return 0;

  const purchaseLimit = Math.max(
    1,
    Math.min(AUTO_UPGRADE_BATCH_OPERATION_LIMIT, Math.floor(maxPurchasesPerUpgrade))
  );
  let totalPurchased = 0;
  let operations = 0;
  const deadline = gameClockNowMs() + AUTO_UPGRADE_BATCH_BUDGET_MS;

  // Solve power batches before a different repeatable upgrade can consume the
  // whole sequential-work budget. Keep the shuffled order within both groups.
  const choices = automaticUpgradeChoices();
  const ordered = [...choices.filter(upgrade => upgrade.buyBulk), ...choices.filter(upgrade => !upgrade.buyBulk)];
  for (const upgrade of ordered) {
    if (operations >= AUTO_UPGRADE_BATCH_OPERATION_LIMIT || gameClockNowMs() >= deadline) break;
    if (upgrade.buyBulk) {
      const result = upgrade.buyBulk(maxPurchasesPerUpgrade, deadline);
      totalPurchased += result.purchased;
      operations += Math.max(1, result.operations);
      continue;
    }
    let purchased = 0;
    while (
      purchased < purchaseLimit
      && operations < AUTO_UPGRADE_BATCH_OPERATION_LIMIT
      && gameClockNowMs() < deadline
      && upgrade()
    ) {
      purchased++;
      totalPurchased++;
      operations++;
    }

    if (operations >= AUTO_UPGRADE_BATCH_OPERATION_LIMIT) break;
  }

  return totalPurchased;
}

setGameInterval(() => {
  const { now, elapsedMs } = elapsedRealTimeSince(autoUpgradeLastTickAt);
  autoUpgradeLastTickAt = now;
  if (!automaticUpgradeCanRun()) {
    autoUpgradeTimer = 0;
    return;
  }

  const bulkEnabled = hasGeneralizationResearch('3-4');
  const maximumTimer = AUTO_UPGRADE_INTERVAL_MS
    * (bulkEnabled ? Number.MAX_SAFE_INTEGER : AUTO_UPGRADE_BATCH_OPERATION_LIMIT);
  autoUpgradeTimer += gameTick(elapsedMs) * autoUpgradeSpeedMultiplier();
  if (!Number.isFinite(autoUpgradeTimer)) {
    autoUpgradeTimer = maximumTimer;
  }
  autoUpgradeTimer = Math.min(
    autoUpgradeTimer,
    maximumTimer
  );

  let attempts = Math.floor(autoUpgradeTimer / AUTO_UPGRADE_INTERVAL_MS);
  if (attempts <= 0) return;

  if (bulkEnabled) {
    tryAutomaticUpgradeBatch(attempts);
    // 초과 가속 시간은 기존처럼 무한 대기열로 남기지 않는다.
    // 실제 계산 작업은 횟수/시간 예산을 유지하며 다음 폴에서도 재개한다.
    autoUpgradeTimer = Math.max(0, autoUpgradeTimer - attempts * AUTO_UPGRADE_INTERVAL_MS);
    return;
  }

  attempts = Math.min(64, attempts);
  let spentTime = 0;
  for (let index = 0; index < attempts; index++) {
    spentTime += AUTO_UPGRADE_INTERVAL_MS;
    if (!tryAutomaticUpgrade()) break;
  }
  autoUpgradeTimer = Math.max(0, autoUpgradeTimer - spentTime);
  if (autoUpgradeTimer > AUTO_UPGRADE_INTERVAL_MS) autoUpgradeTimer = AUTO_UPGRADE_INTERVAL_MS;
}, AUTO_UPGRADE_POLL_MS);
