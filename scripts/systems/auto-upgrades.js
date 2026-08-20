function tryAutomaticUpgrade() {
  if (!hasSquareUpgrade('auto_upgrade_top_down')) return false;
  if (!autoUpgradeEnabled) return false;
  if (overflowed || squareMode) return false;

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

  for (const upgrade of upgradeChoices) {
    if (upgrade()) return true;
  }

  return false;
}

setInterval(() => {
  if (!hasSquareUpgrade('auto_upgrade_top_down') || !autoUpgradeEnabled || overflowed || squareMode) {
    autoUpgradeTimer = 0;
    return;
  }

  autoUpgradeTimer += gameTick(50) * autoUpgradeSpeedMultiplier();
  if (!Number.isFinite(autoUpgradeTimer)) autoUpgradeTimer = 250 * 64;

  let attempts = Math.floor(autoUpgradeTimer / 250);
  if (attempts <= 0) return;
  attempts = Math.min(64, attempts);

  let spentTime = 0;
  for (let index = 0; index < attempts; index++) {
    spentTime += 250;
    if (!tryAutomaticUpgrade()) break;
  }

  autoUpgradeTimer = Math.max(0, autoUpgradeTimer - spentTime);
  if (autoUpgradeTimer > 250) autoUpgradeTimer = 250;
}, 50);
