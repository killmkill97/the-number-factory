const AUTO_UPGRADE_INTERVAL_MS = 250;
const AUTO_UPGRADE_POLL_MS = 50;
const AUTO_UPGRADE_BATCH_OPERATION_LIMIT = 100000;

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
    upgradePercentPower,
    buyPercentAuto,
    upgradePercentAutoSpeed,
    unlockNextPercentLane
  ];

  for (const lane of extraPercentLanes) {
    upgradeChoices.push(
      () => buyExtraLanePower(lane),
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

  const purchaseLimit = Math.max(1, Math.floor(maxPurchasesPerUpgrade));
  let totalPurchased = 0;

  // 3-4는 한 업그레이드가 누적 횟수를 독점하지 않는다. 현재 구매 가능한
  // 모든 업그레이드가 각각 같은 수의 자동 구매 기회를 병렬로 받는다.
  for (const upgrade of automaticUpgradeChoices()) {
    let purchased = 0;
    while (
      purchased < purchaseLimit
      && totalPurchased < AUTO_UPGRADE_BATCH_OPERATION_LIMIT
      && upgrade()
    ) {
      purchased++;
      totalPurchased++;
    }

    if (totalPurchased >= AUTO_UPGRADE_BATCH_OPERATION_LIMIT) break;
  }

  return totalPurchased;
}

setInterval(() => {
  if (!automaticUpgradeCanRun()) {
    autoUpgradeTimer = 0;
    return;
  }

  autoUpgradeTimer += gameTick(AUTO_UPGRADE_POLL_MS) * autoUpgradeSpeedMultiplier();
  if (!Number.isFinite(autoUpgradeTimer)) {
    autoUpgradeTimer = AUTO_UPGRADE_INTERVAL_MS * AUTO_UPGRADE_BATCH_OPERATION_LIMIT;
  }

  let attempts = Math.floor(autoUpgradeTimer / AUTO_UPGRADE_INTERVAL_MS);
  if (attempts <= 0) return;

  if (hasGeneralizationResearch('3-4')) {
    tryAutomaticUpgradeBatch(attempts);
    // 실패한 구매 시도도 이미 시간이 지난 시도다. 남은 250ms 미만만 보존해
    // 구매 불가 상태에서 거대한 배치 시간이 쌓이지 않도록 한다.
    autoUpgradeTimer %= AUTO_UPGRADE_INTERVAL_MS;
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
