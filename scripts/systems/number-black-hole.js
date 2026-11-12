const NUMBER_BLACK_HOLE_REAL_TICK_MS = 50;
let numberBlackHoleDonationTimerMs = 0;
let numberBlackHoleLastTickAt = gameTimelineNowMs();
let numberBlackHoleLastRenderAt = -Infinity;
let numberBlackHoleAutoTimerMs = 0;
let numberBlackHoleAutoCursor = 0;

function numberBlackHoleAvailable() {
  return numberBlackHoleSystemEnabled && knuthUnlocked && !isKnuthChallengeActive('kc5');
}

function numberBlackHoleAutomationUnlocked() {
  return hasCompletedKnuthChallenge('kc4');
}

function numberBlackHoleAutomationAvailable() {
  return numberBlackHoleAutomationUnlocked() && numberBlackHoleAvailable();
}

function maximizeNumberBlackHoleSettings(kind = null, { useAutoLimits = false } = {}) {
  if (!numberBlackHoleAutomationAvailable() || (kind !== null && !['amount', 'speed'].includes(kind))) return false;
  const amount = Math.min(numberBlackHoleDonationPercentLimit(),
    useAutoLimits ? numberBlackHoleAutoAmountLimit ?? Infinity : Infinity);
  const speed = Math.min(numberBlackHoleDonationRateLimit(),
    useAutoLimits ? numberBlackHoleAutoSpeedLimit ?? Infinity : Infinity);
  let changed = false;
  if (kind !== 'speed' && numberBlackHoleDonationPercent !== amount) {
    numberBlackHoleDonationPercent = amount;
    changed = true;
  }
  if (kind !== 'amount' && numberBlackHoleDonationRate !== speed) {
    numberBlackHoleDonationRate = speed;
    numberBlackHoleDonationTimerMs = 0;
    changed = true;
  }
  return changed;
}

function setNumberBlackHoleAutoLimit(kind, value) {
  if (!numberBlackHoleAutomationAvailable() || !['amount', 'speed'].includes(kind)) return false;
  const text = String(value).trim();
  const limit = /^(inf|∞)$/i.test(text) ? null : Number(text);
  if (limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) return false;
  if (kind === 'amount') numberBlackHoleAutoAmountLimit = limit;
  else numberBlackHoleAutoSpeedLimit = limit;
  if (numberBlackHoleAutoMaxEnabled) maximizeNumberBlackHoleSettings(null, { useAutoLimits: true });
  return true;
}

function advanceNumberBlackHoleAutomation(elapsedRealMs) {
  if (!numberBlackHoleAutomationAvailable() || overflowed || squareMode || !(elapsedRealMs > 0)) {
    numberBlackHoleAutoTimerMs = 0;
    return false;
  }
  let changed = false;
  if (numberBlackHoleAutoUpgradeEnabled) {
    const maximum = NUMBER_BLACK_HOLE_AUTO_INTERVAL_MS * NUMBER_BLACK_HOLE_AUTO_BATCH_LIMIT;
    const elapsed = autoUpgradeElapsedTime(gameTick(elapsedRealMs), maximum);
    numberBlackHoleAutoTimerMs = Math.min(maximum, numberBlackHoleAutoTimerMs + (Number.isFinite(elapsed) ? elapsed : maximum));
    const attempts = Math.min(hasGeneralizationResearch('3-4') ? NUMBER_BLACK_HOLE_AUTO_BATCH_LIMIT : 1,
      Math.floor(numberBlackHoleAutoTimerMs / NUMBER_BLACK_HOLE_AUTO_INTERVAL_MS));
    for (let index = 0; index < attempts; index++) {
      numberBlackHoleAutoTimerMs -= NUMBER_BLACK_HOLE_AUTO_INTERVAL_MS;
      let bought = false;
      for (let offset = 0; offset < 2; offset++) {
        const choice = (numberBlackHoleAutoCursor + offset) % 2;
        if (!buyNumberBlackHoleUpgrade(choice === 0 ? 'amount' : 'speed', false)) continue;
        numberBlackHoleAutoCursor = (choice + 1) % 2;
        bought = true;
        changed = true;
        break;
      }
      if (!bought) { numberBlackHoleAutoTimerMs %= NUMBER_BLACK_HOLE_AUTO_INTERVAL_MS; break; }
    }
  } else numberBlackHoleAutoTimerMs = 0;
  if (numberBlackHoleAutoMaxEnabled) changed = maximizeNumberBlackHoleSettings(null, { useAutoLimits: true }) || changed;
  return changed;
}

function numberBlackHoleDonationRateLimit() {
  return Math.min(
    NUMBER_BLACK_HOLE_MAX_DONATION_RATE,
    NUMBER_BLACK_HOLE_BASE_DONATION_RATE
      + (numberBlackHoleDonationSpeedLevel * NUMBER_BLACK_HOLE_DONATION_RATE_PER_UPGRADE)
  );
}

function numberBlackHoleSpUnlocked() {
  return hasAbstractionResearch('15-1');
}

function numberBlackHoleActiveResource() {
  return numberBlackHoleDonationResource === 'sp' && numberBlackHoleSpUnlocked() ? 'sp' : 'number';
}

function setNumberBlackHoleResource(resource) {
  if (isKnuthChallengeActive('kc5')) return false;
  if (!['number', 'sp'].includes(resource) || (resource === 'sp' && !numberBlackHoleSpUnlocked())) return false;
  if (numberBlackHoleDonationResource !== resource) {
    recordAbstractionPermanentSingularities();
    numberBlackHoleDonationResource = resource;
    numberBlackHoleDonationTimerMs = 0;
    recordAbstractionPermanentSingularities();
  }
  renderNumberBlackHoleBoard();
  return true;
}

function numberBlackHoleSpCountMultiplier() {
  return addBaseNumbers(1, multiplyNumberValue(
    NumberMath.log10(addBaseNumbers(1, numberBlackHoleSpDonationCount)),
    NUMBER_BLACK_HOLE_BALANCE.spDonationCountStrength
  ));
}

function numberBlackHoleRadiusFromMass(mass) {
  const logarithmicMass = NumberMath.log10(addBaseNumbers(mass, 1));
  const donationPower = addBaseNumbers(
    1,
    NumberMath.log10(addBaseNumbers(numberBlackHoleDonationPercent, 1))
  );
  const rawRadius = NumberMath.power(logarithmicMass, donationPower);
  return NumberMath.log10(addBaseNumbers(1, rawRadius));
}

function numberBlackHoleUnboostedRadius() {
  const usesSp = numberBlackHoleActiveResource() === 'sp';
  let radius = numberBlackHoleRadiusFromMass(usesSp ? numberBlackHoleTotalSpInvested : numberBlackHoleTotalInvested);
  if (usesSp) {
    radius = multiplyNumberValue(radius,
      multiplyNumberValue(NUMBER_BLACK_HOLE_BALANCE.spRadiusMultiplier, numberBlackHoleSpCountMultiplier()));
  }
  return knuthBaseUpgradeEffectLevel('passive_radius') > 0
    ? addBaseNumbers(radius, numberBlackHolePassiveRadius) : radius;
}

function numberBlackHoleSchwarzschildRadius() {
  const radius = numberBlackHoleUnboostedRadius();
  const boosted = isPositiveNumberValue(singularityPoints)
    ? multiplyNumberValue(radius, singularityRadiusMultiplier()) : radius;
  return multiplyNumberValue(boosted, stagnantMassRadiusMultiplier());
}

function numberBlackHoleTimeMultiplier() {
  if (isKnuthChallengeActive('kc5')) return 1;
  const base = numberBlackHoleBaseTimeMultiplier();
  if (!numberBlackHoleSystemEnabled || !knuthUnlocked) return base;
  const hasSingularityEffect = isPositiveNumberValue(singularityPoints) || isPositiveNumberValue(singularityUpgradeLevels.black_hole);
  if (!hasKnuthUpgrade('diverger_black_hole') && !hasSingularityEffect) return base;
  let boosted = hasKnuthUpgrade('diverger_black_hole')
    ? multiplyNumberValue(base, knuthDivergerBlackHoleMultiplier()) : base;
  if (hasSingularityEffect) boosted = multiplyNumberValue(boosted, singularityBlackHoleMultiplier());
  const limit = numberBlackHoleTimeLimit();
  return compareNumberValues(boosted, limit) >= 0
    ? limit
    : NumberMath.toNumber(boosted);
}

function singularitySpRequirementDivisor() {
  if (isKnuthChallengeActive('kc5')) return 1;
  if (!knuthUnlocked || !numberBlackHoleSystemEnabled || numberBlackHoleActiveResource() !== 'sp'
    || !isPositiveNumberValue(numberBlackHoleTotalSpInvested)) return 1;
  const { spRequirementMaxDivisor, spRequirementSpeedLogScale, spRequirementRadiusLogScale } = SINGULARITY_BALANCE;
  const speedLog = NumberMath.log10(addBaseNumbers(1, numberBlackHoleDonationRate));
  const radiusLog = NumberMath.log10(addBaseNumbers(1, numberBlackHoleSchwarzschildRadius()));
  const speedFactor = NumberMath.divideApproximate(speedLog, addBaseNumbers(speedLog, spRequirementSpeedLogScale));
  const radiusFactor = NumberMath.divideApproximate(radiusLog, addBaseNumbers(radiusLog, spRequirementRadiusLogScale));
  // One tenfold threshold at most; no accumulated discount or radius/requirement feedback.
  return NumberMath.min(spRequirementMaxDivisor, addBaseNumbers(1,
    multiplyNumberValue(spRequirementMaxDivisor - 1, multiplyNumberValue(speedFactor, radiusFactor))));
}

function numberBlackHoleBaseTimeMultiplier() {
  if (isKnuthChallengeActive('kc5')) return 1;
  if (!numberBlackHoleSystemEnabled || !knuthUnlocked) return 1;
  const limit = numberBlackHoleTimeLimit();

  const radius = numberBlackHoleSchwarzschildRadius();
  const { radiusReference, timeScale, timeExponent } = NUMBER_BLACK_HOLE_BALANCE;
  const radiusComparison = compareNumberValues(radius, 1);
  let multiplierLog10;
  if (radiusComparison < 0) {
    const radiusNumber = realNumberFromValue(radius);
    const directMultiplier = timeScale * ((radiusNumber / radiusReference) ** timeExponent);
    if (!Number.isFinite(directMultiplier)) return limit;
    return Math.min(limit, Math.max(1, directMultiplier));
  }

  const radiusLog10 = NumberMath.toNumber(NumberMath.log10(radius));
  if (!Number.isFinite(radiusLog10)) {
    return limit;
  }

  multiplierLog10 = Math.log10(timeScale) + timeExponent * (radiusLog10 - Math.log10(radiusReference));
  if (
    !Number.isFinite(multiplierLog10)
    || multiplierLog10 >= Math.log10(limit)
  ) {
    return limit;
  }

  return Math.max(1, 10 ** multiplierLog10);
}

function resetNumberBlackHoleTimers() {
  numberBlackHoleAutoTimerMs = 0;
  numberBlackHoleAutoCursor = 0;
  numberBlackHoleDonationTimerMs = 0;
  numberBlackHoleLastTickAt = gameTimelineNowMs();
}

function canPurchaseSingularity() {
  return knuthUnlocked
    && !isKnuthChallengeActive('kc5')
    && isPositiveNumberValue(singularityPointGain())
    && compareNumberValues(numberBlackHoleSchwarzschildRadius(), singularityRadiusRequirement()) >= 0;
}

function singularityPointGain() {
  if (!knuthUnlocked || isKnuthChallengeActive('kc5')) return 0;
  const room = NumberMath.floor(NumberMath.max(0, subtractNumberValues(singularityHoldingLimit(), singularityPoints)));
  if (!isPositiveNumberValue(room)) return 0;
  const bonus = abstractionPermanentStorageActive('26-2') ? abstractionSingularityBonus(numberBlackHoleSchwarzschildRadius()) : 0;
  return NumberMath.min(room, addBaseNumbers(1, bonus));
}

function purchaseSingularity() {
  if (!canPurchaseSingularity()) return false;
  const gain = singularityPointGain();
  recordAbstractionPermanentSingularities();
  setSingularityPoints(addBaseNumbers(singularityPoints, gain));
  recordAbstractionPermanentSingularities();
  totalSingularitiesPurchased = addBaseNumbers(totalSingularitiesPurchased, gain);
  numberBlackHoleDonationPercent = NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT;
  numberBlackHoleDonationRate = NUMBER_BLACK_HOLE_BASE_DONATION_RATE;
  numberBlackHoleDonationAmountLevel = 0;
  numberBlackHoleDonationSpeedLevel = 0;
  numberBlackHoleDonationAmountCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
  numberBlackHoleDonationSpeedCost = NUMBER_BLACK_HOLE_BASE_UPGRADE_COST;
  numberBlackHoleTotalInvested = 0;
  numberBlackHoleTotalSpInvested = 0;
  numberBlackHoleSpDonationCount = 0;
  numberBlackHoleAccumulatedGameSeconds = 0;
  numberBlackHolePassiveRadius = 0;
  resetNumberBlackHoleTimers();
  numberBlackHoleLastRenderAt = -Infinity;
  render();
  return true;
}

function buySingularityUpgrade(id) {
  if (!knuthUnlocked || isKnuthChallengeActive('kc5')) return false;
  const cost = singularityUpgradeCost(id);
  if (cost === null || !isPositiveNumberValue(cost) || compareNumberValues(singularityPoints, cost) < 0) return false;
  recordAbstractionPermanentSingularities();
  setSingularityPoints(subtractNumberValues(singularityPoints, cost));
  singularityUpgradeLevels[id] = addBaseNumbers(singularityUpgradeLevels[id], 1);
  render();
  return true;
}

function renderSingularityBoard() {
  if (typeof singularityPointValue === 'undefined' || !singularityPointValue) return;
  singularityPointValue.textContent = `${fmtPowerBase(singularityPoints)} / ${fmtPowerBase(singularityHoldingLimit())}`;
  if (typeof singularityReserveStatus !== 'undefined' && singularityReserveStatus) {
    const active = abstractionPermanentStorageActive('26-2');
    singularityReserveStatus.classList.toggle('hidden', !active && !isPositiveNumberValue(abstractionPermanentSingularities));
    const inactiveReason = spaceExpansionActive && hasAbstractionResearch('26-2')
      ? '공간 팽창 중 비활성 · 기록 보존' : '연구 비활성 · 기록 보존';
    singularityReserveStatus.textContent = `영구 특이점 ${fmtPowerBase(abstractionPermanentSingularities)}개 · ${active ? '최소 보유량 보호 중' : inactiveReason}`;
  }
  const requirement = singularityRadiusRequirement();
  singularityRadiusRequirementValue.textContent = compareNumberValues(requirement, 1000) < 0
    ? Number(NumberMath.toNumber(requirement).toPrecision(4)).toString() : fmtPowerBase(requirement);
  singularityPurchaseBtn.disabled = !canPurchaseSingularity();
  if (typeof singularityPurchaseLabel !== 'undefined' && singularityPurchaseLabel) {
    singularityPurchaseLabel.textContent = `특이점 +${fmtPowerBase(singularityPointGain())}`;
  }
  singularityBlackHoleEffect.textContent = `×${fmtPowerBase(singularityBlackHoleMultiplier())}`;
  const radiusMultiplier = singularityRadiusMultiplier();
  const radiusText = compareNumberValues(radiusMultiplier, 1000) < 0
    ? Number(realNumberFromValue(radiusMultiplier).toPrecision(4)).toString()
    : fmtPowerBase(radiusMultiplier);
  singularityRadiusEffect.textContent = `×${radiusText}`;
  singularityPercentEffect.textContent = `×${fmtPowerBase(singularityPercentMultiplier())}`;
  singularitySoftcapEffect.textContent = `×${fmtPowerBase(singularitySoftcapMultiplier())}`;
  singularityKpEffect.textContent = `×${fmtPowerBase(singularityKpMultiplier())}`;
  for (const upgrade of SINGULARITY_UPGRADES) {
    const button = upgrade.id === 'black_hole' ? singularityBlackHoleUpgradeBtn : singularityKpUpgradeBtn;
    const label = upgrade.id === 'black_hole' ? singularityBlackHoleUpgradeCost : singularityKpUpgradeCost;
    const cost = singularityUpgradeCost(upgrade.id);
    label.textContent = `${fmtPowerBase(singularityUpgradeLevels[upgrade.id])}회 구매 · 비용: ${fmtPowerBase(cost)} 특이점`;
    button.disabled = !knuthUnlocked || isKnuthChallengeActive('kc5') || compareNumberValues(singularityPoints, cost) < 0;
  }
}

function toggleNumberBlackHoleSystem() {
  if (isKnuthChallengeActive('kc5')) return false;
  if (!knuthUnlocked) {
    log('숫자 블랙홀은 커누스 해금 후 사용할 수 있습니다.', true);
    return false;
  }
  numberBlackHoleSystemEnabled = !numberBlackHoleSystemEnabled;
  resetNumberBlackHoleTimers();
  log(`숫자 블랙홀 시스템을 ${numberBlackHoleSystemEnabled ? '켰습니다' : '껐습니다'}.`, true);
  render();
  return numberBlackHoleSystemEnabled;
}

function buyNumberBlackHoleUpgrade(kind, renderAfter = true) {
  if (!numberBlackHoleAvailable()) return false;

  const isAmountUpgrade = kind === 'amount';
  const level = isAmountUpgrade
    ? numberBlackHoleDonationAmountLevel
    : numberBlackHoleDonationSpeedLevel;
  const cost = isAmountUpgrade
    ? numberBlackHoleDonationAmountCost
    : numberBlackHoleDonationSpeedCost;
  const atLimit = isAmountUpgrade
    ? numberBlackHoleBaseDonationPercentLimit() >= NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT
    : numberBlackHoleDonationRateLimit() >= NUMBER_BLACK_HOLE_MAX_DONATION_RATE;
  if (atLimit || compareNumberValues(knuthPoints, cost) < 0) return false;

  knuthPoints = subtractNumberValues(knuthPoints, cost);
  if (isAmountUpgrade) {
    numberBlackHoleDonationAmountLevel = Math.min(
      NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT - NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT,
      level + 1
    );
    numberBlackHoleDonationAmountCost = multiplyNumberValue(
      cost,
      NUMBER_BLACK_HOLE_DONATION_COST_GROWTH
    );
  } else {
    numberBlackHoleDonationSpeedLevel = Math.min(
      Math.ceil(
        (NUMBER_BLACK_HOLE_MAX_DONATION_RATE - NUMBER_BLACK_HOLE_BASE_DONATION_RATE)
        / NUMBER_BLACK_HOLE_DONATION_RATE_PER_UPGRADE
      ),
      level + 1
    );
    numberBlackHoleDonationSpeedCost = NumberMath.ceil(
      multiplyNumberValue(cost, NUMBER_BLACK_HOLE_SPEED_COST_GROWTH)
    );
  }

  if (renderAfter) {
    log(`숫자 블랙홀 ${isAmountUpgrade ? '투여량' : '투여 빠르기'} 업그레이드를 구매했습니다.`, true);
    render();
  }
  return true;
}

function setNumberBlackHoleSetting(kind, value) {
  if (isKnuthChallengeActive('kc5')) return false;
  const limit = kind === 'amount'
    ? numberBlackHoleDonationPercentLimit()
    : numberBlackHoleDonationRateLimit();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return false;
  const nextValue = Math.max(1, Math.min(limit, parsed));

  recordAbstractionPermanentSingularities();
  if (kind === 'amount') {
    numberBlackHoleDonationPercent = nextValue;
  } else {
    numberBlackHoleDonationRate = nextValue;
    numberBlackHoleDonationTimerMs = 0;
  }
  recordAbstractionPermanentSingularities();
  renderNumberBlackHoleBoard();
  return true;
}

function adjustNumberBlackHoleSetting(kind, change) {
  const current = kind === 'amount'
    ? numberBlackHoleDonationPercent
    : numberBlackHoleDonationRate;
  setNumberBlackHoleSetting(kind, current + change);
}

function applyNumberBlackHoleDonations(cycles) {
  if (isKnuthChallengeActive('kc5')) return false;
  if (!Number.isFinite(cycles) || cycles <= 0) return false;
  cycles = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(cycles));
  if (cycles <= 0) return false;
  if (numberBlackHoleDonationPercent > NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT) {
    numberBlackHoleDonationPercent = Math.min(numberBlackHoleDonationPercent, numberBlackHoleDonationPercentLimit());
  }
  const usesSp = numberBlackHoleActiveResource() === 'sp';
  const startingNumber = usesSp ? squarePoints : getBaseNumber();
  if (!isPositiveNumberValue(startingNumber)) return false;

  if (hasAbstractionResearch('25-2')) {
    // Every cycle draws the same fraction from the unchanged balance; no per-cycle loop.
    const invested = multiplyNumberValue(multiplyNumberValue(startingNumber, numberBlackHoleDonationPercent / 100), cycles);
    if (!isPositiveNumberValue(invested)) return false;
    if (usesSp) {
      numberBlackHoleTotalSpInvested = addBaseNumbers(numberBlackHoleTotalSpInvested, invested);
      numberBlackHoleSpDonationCount = addBaseNumbers(numberBlackHoleSpDonationCount, cycles);
    } else numberBlackHoleTotalInvested = addBaseNumbers(numberBlackHoleTotalInvested, invested);
    recordAbstractionPermanentSingularities();
    return true;
  }

  const retainedPerCycle = 1 - numberBlackHoleDonationPercent / 100;
  const retainedFraction = Math.pow(retainedPerCycle, cycles);
  const remainingNumber = multiplyNumberValue(startingNumber, retainedFraction);
  let investedNumber = subtractNumberValues(startingNumber, remainingNumber);
  const hasSpReserve = usesSp && abstractionPermanentStorageActive('23-3') && isPositiveNumberValue(abstractionPermanentSp);
  if (hasSpReserve) {
    // Split at the first floor hit; all later donations draw from the replenished reserve.
    const toFloor = retainedPerCycle === 0 ? 1 : Math.max(0, Math.ceil(NumberMath.toNumber(
      NumberMath.divideApproximate(NumberMath.subtract(NumberMath.log10(abstractionPermanentSp),
        NumberMath.log10(startingNumber)), Math.log10(retainedPerCycle)))));
    const beforeFloor = Math.min(cycles, toFloor);
    investedNumber = addBaseNumbers(
      subtractNumberValues(startingNumber, multiplyNumberValue(startingNumber, Math.pow(retainedPerCycle, beforeFloor))),
      multiplyNumberValue(abstractionPermanentSp, (1 - retainedPerCycle) * (cycles - beforeFloor)));
  }
  if (!isPositiveNumberValue(investedNumber)) return false;

  if (usesSp) {
    setSquarePoints(remainingNumber);
    numberBlackHoleTotalSpInvested = addBaseNumbers(numberBlackHoleTotalSpInvested, investedNumber);
    // Without a reserve, a 100% donation exhausts the balance on the first cycle.
    numberBlackHoleSpDonationCount = addBaseNumbers(numberBlackHoleSpDonationCount,
      numberBlackHoleDonationPercent === 100 && !hasSpReserve ? 1 : cycles);
  } else {
    setBaseNumber(remainingNumber);
    numberBlackHoleTotalInvested = addBaseNumbers(numberBlackHoleTotalInvested, investedNumber);
  }
  recordAbstractionPermanentSingularities();
  return true;
}

function advanceNumberBlackHole(elapsedRealMs) {
  if (isKnuthChallengeActive('kc5')) { numberBlackHoleDonationTimerMs = 0; return false; }
  const elapsed = Number(elapsedRealMs);
  if (
    !numberBlackHoleSystemEnabled
    || !knuthUnlocked
    || !Number.isFinite(elapsed)
    || elapsed <= 0
  ) return false;

  recordAbstractionPermanentSingularities();
  const acceleratedSeconds = gameTick(elapsed) / 1000;
  if (Number.isFinite(acceleratedSeconds) && acceleratedSeconds > 0) {
    numberBlackHoleAccumulatedGameSeconds = addBaseNumbers(
      numberBlackHoleAccumulatedGameSeconds,
      numberValueFromReal(acceleratedSeconds)
    );
  }

  const growsRadius = knuthBaseUpgradeEffectLevel('passive_radius') > 0;
  if (growsRadius) {
    numberBlackHolePassiveRadius = addBaseNumbers(numberBlackHolePassiveRadius,
      multiplyNumberValue(elapsed / 1000, KNUTH_LATE_BASE_BALANCE.passiveRadiusPerRealSecond));
  }

  const periodMs = 1000 / numberBlackHoleDonationRate;
  numberBlackHoleDonationTimerMs += elapsed;
  const cycles = Math.floor(numberBlackHoleDonationTimerMs / periodMs);
  numberBlackHoleDonationTimerMs %= periodMs;
  const donated = cycles > 0 && applyNumberBlackHoleDonations(cycles);
  if (growsRadius) recordAbstractionPermanentSingularities();
  return donated || growsRadius;
}

function renderNumberBlackHoleBoard() {
  if (!numberBlackHoleStatus || !numberBlackHoleAmountInput || !numberBlackHoleSpeedInput) return;

  const enabled = numberBlackHoleAvailable();
  if (numberBlackHoleDonationPercent > NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT) {
    numberBlackHoleDonationPercent = Math.min(numberBlackHoleDonationPercent, numberBlackHoleDonationPercentLimit());
  }
  const spUnlocked = numberBlackHoleSpUnlocked();
  numberBlackHoleResourceControl.classList.toggle('hidden', !spUnlocked);
  numberBlackHoleResourceSelect.value = numberBlackHoleActiveResource();
  numberBlackHoleResourceSelect.disabled = !enabled;
  const countMultiplier = numberBlackHoleSpCountMultiplier();
  const countMultiplierText = compareNumberValues(countMultiplier, 1000) < 0
    ? Number(NumberMath.toNumber(countMultiplier).toPrecision(4)).toString() : fmtPowerBase(countMultiplier);
  const divisorText = Number(NumberMath.toNumber(singularitySpRequirementDivisor()).toPrecision(4)).toString();
  numberBlackHoleSpProgress.textContent = `SP 투여 ${fmtPowerBase(numberBlackHoleSpDonationCount)}회 · 횟수 보너스 ×${countMultiplierText} · 특이점 요구 ÷${divisorText}`;
  numberBlackHoleAutomation.classList.toggle('hidden', !numberBlackHoleAutomationUnlocked());
  numberBlackHoleAutoUpgradeToggle.checked = numberBlackHoleAutoUpgradeEnabled;
  numberBlackHoleAutoMaxToggle.checked = numberBlackHoleAutoMaxEnabled;
  numberBlackHoleAutoUpgradeToggle.disabled = !enabled || !numberBlackHoleAutomationUnlocked();
  numberBlackHoleAutoMaxToggle.disabled = !enabled || !numberBlackHoleAutomationUnlocked();
  for (const [input, limit] of [
    [numberBlackHoleAutoAmountLimitInput, numberBlackHoleAutoAmountLimit],
    [numberBlackHoleAutoSpeedLimitInput, numberBlackHoleAutoSpeedLimit]
  ]) {
    if (!input) continue;
    input.disabled = !numberBlackHoleAutomationAvailable();
    if (document.activeElement !== input) input.value = limit === null ? '∞' : String(limit);
  }
  const amountLimit = numberBlackHoleDonationPercentLimit();
  const speedLimit = numberBlackHoleDonationRateLimit();
  const amountAtLimit = numberBlackHoleBaseDonationPercentLimit() >= NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT;
  const speedAtLimit = speedLimit >= NUMBER_BLACK_HOLE_MAX_DONATION_RATE;
  const canBuyAmount = compareNumberValues(knuthPoints, numberBlackHoleDonationAmountCost) >= 0;
  const canBuySpeed = compareNumberValues(knuthPoints, numberBlackHoleDonationSpeedCost) >= 0;

  numberBlackHoleStatus.textContent = isKnuthChallengeActive('kc5') ? 'KC5 · 비활성' : enabled ? '작동 중' : '비활성';
  numberBlackHoleStatus.classList.toggle('active', enabled);
  numberBlackHoleAmountUpgradeCost.textContent = amountAtLimit
    ? '최대'
    : `비용: ${fmtPowerBase(numberBlackHoleDonationAmountCost)} KP · 상한 ${amountLimit}%`;
  numberBlackHoleSpeedUpgradeCost.textContent = speedAtLimit
    ? '최대'
    : `비용: ${fmtPowerBase(numberBlackHoleDonationSpeedCost)} KP · 상한 초당 ${fmtPowerBase(speedLimit)}회`;
  numberBlackHoleAmountUpgradeBtn.disabled = !enabled || amountAtLimit || !canBuyAmount;
  numberBlackHoleSpeedUpgradeBtn.disabled = !enabled || speedAtLimit || !canBuySpeed;
  numberBlackHoleAmountLimit.textContent = `설정 상한 ${amountLimit}%`;
  numberBlackHoleSpeedLimit.textContent = `설정 상한 초당 ${fmtPowerBase(speedLimit)}회`;

  numberBlackHoleAmountInput.min = String(NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT);
  numberBlackHoleAmountInput.max = String(amountLimit);
  numberBlackHoleSpeedInput.min = String(NUMBER_BLACK_HOLE_BASE_DONATION_RATE);
  numberBlackHoleSpeedInput.max = String(speedLimit);
  if (!enabled || document.activeElement !== numberBlackHoleAmountInput) {
    numberBlackHoleAmountInput.value = String(numberBlackHoleDonationPercent);
  }
  if (!enabled || document.activeElement !== numberBlackHoleSpeedInput) {
    numberBlackHoleSpeedInput.value = String(numberBlackHoleDonationRate);
  }

  numberBlackHoleAmountInput.disabled = !enabled;
  numberBlackHoleSpeedInput.disabled = !enabled;
  numberBlackHoleAmountMinusBtn.disabled = !enabled || numberBlackHoleDonationPercent <= 1;
  numberBlackHoleAmountPlusBtn.disabled = !enabled || numberBlackHoleDonationPercent >= amountLimit;
  numberBlackHoleSpeedMinusBtn.disabled = !enabled || numberBlackHoleDonationRate <= 1;
  numberBlackHoleSpeedPlusBtn.disabled = !enabled || numberBlackHoleDonationRate >= speedLimit;

  numberBlackHoleRadiusValue.textContent = fmtPowerBase(numberBlackHoleSchwarzschildRadius());
  numberBlackHoleTimeMultiplierValue.textContent = `×${fmtPowerBase(
    numberValueFromReal(gameTick(1000) / 1000)
  )}`;
  numberBlackHoleTimeLimitValue.textContent = `×${fmtPowerBase(numberBlackHoleTimeLimit())}`;
  numberBlackHoleAccumulatedTimeValue.textContent = `${fmtPowerBase(numberBlackHoleAccumulatedGameSeconds)}초`;
  renderSingularityBoard();
}

function connectNumberBlackHoleInput(input, kind) {
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!setNumberBlackHoleSetting(kind, input.value)) renderNumberBlackHoleBoard();
    input.blur();
  });
  input.addEventListener('blur', renderNumberBlackHoleBoard);
}

function connectNumberBlackHoleAutoLimitInput(input, kind) {
  if (!input) return;
  const commit = () => {
    setNumberBlackHoleAutoLimit(kind, input.value);
    const limit = kind === 'amount' ? numberBlackHoleAutoAmountLimit : numberBlackHoleAutoSpeedLimit;
    input.value = limit === null ? '∞' : String(limit);
    renderNumberBlackHoleBoard();
  };
  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    commit();
    input.blur();
  });
  input.addEventListener('change', commit);
}

numberBlackHoleAmountUpgradeBtn.addEventListener('click', () => buyNumberBlackHoleUpgrade('amount'));
numberBlackHoleSpeedUpgradeBtn.addEventListener('click', () => buyNumberBlackHoleUpgrade('speed'));
numberBlackHoleResourceSelect.addEventListener('change', () => {
  if (!numberBlackHoleSystemEnabled || !knuthUnlocked || !setNumberBlackHoleResource(numberBlackHoleResourceSelect.value)) {
    renderNumberBlackHoleBoard();
  }
});
numberBlackHoleAutoUpgradeToggle.addEventListener('change', () => {
  if (!numberBlackHoleAutomationAvailable()) return;
  numberBlackHoleAutoUpgradeEnabled = numberBlackHoleAutoUpgradeToggle.checked;
  numberBlackHoleAutoTimerMs = 0;
  render();
});
numberBlackHoleAutoMaxToggle.addEventListener('change', () => {
  if (!numberBlackHoleAutomationAvailable()) return;
  numberBlackHoleAutoMaxEnabled = numberBlackHoleAutoMaxToggle.checked;
  if (numberBlackHoleAutoMaxEnabled) maximizeNumberBlackHoleSettings(null, { useAutoLimits: true });
  render();
});
numberBlackHoleAmountMinusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('amount', -1));
numberBlackHoleAmountPlusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('amount', 1));
numberBlackHoleSpeedMinusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('speed', -1));
numberBlackHoleSpeedPlusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('speed', 1));
singularityPurchaseBtn.addEventListener('click', purchaseSingularity);
singularityBlackHoleUpgradeBtn.addEventListener('click', () => buySingularityUpgrade('black_hole'));
singularityKpUpgradeBtn.addEventListener('click', () => buySingularityUpgrade('kp_gain'));
connectNumberBlackHoleInput(numberBlackHoleAmountInput, 'amount');
connectNumberBlackHoleInput(numberBlackHoleSpeedInput, 'speed');
connectNumberBlackHoleAutoLimitInput(numberBlackHoleAutoAmountLimitInput, 'amount');
connectNumberBlackHoleAutoLimitInput(numberBlackHoleAutoSpeedLimitInput, 'speed');

setGameInterval(() => {
  const now = gameTimelineNowMs();
  const elapsed = Math.max(0, now - numberBlackHoleLastTickAt);
  numberBlackHoleLastTickAt = now;
  const upgraded = advanceNumberBlackHoleAutomation(elapsed);
  if (advanceNumberBlackHole(elapsed) || upgraded) render();

  if (
    numberBlackHoleSystemEnabled
    && knuthUnlocked
    && activeChapter === 'knuth'
    && activeKnuthView === 'production'
    && now - numberBlackHoleLastRenderAt >= 250
  ) {
    numberBlackHoleLastRenderAt = now;
    render();
  }
}, NUMBER_BLACK_HOLE_REAL_TICK_MS);
