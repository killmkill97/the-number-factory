const NUMBER_BLACK_HOLE_REAL_TICK_MS = 50;
let numberBlackHoleDonationTimerMs = 0;
let numberBlackHoleLastTickAt = typeof performance === 'undefined' ? Date.now() : performance.now();
let numberBlackHoleLastRenderAt = -Infinity;

function numberBlackHoleDonationPercentLimit() {
  return Math.min(
    NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT,
    NUMBER_BLACK_HOLE_BASE_DONATION_PERCENT + numberBlackHoleDonationAmountLevel
  );
}

function numberBlackHoleDonationRateLimit() {
  return Math.min(
    NUMBER_BLACK_HOLE_MAX_DONATION_RATE,
    NUMBER_BLACK_HOLE_BASE_DONATION_RATE
      + (numberBlackHoleDonationSpeedLevel * NUMBER_BLACK_HOLE_DONATION_RATE_PER_UPGRADE)
  );
}

function numberBlackHoleSchwarzschildRadius() {
  const logarithmicMass = NumberMath.log10(addBaseNumbers(numberBlackHoleTotalInvested, 1));
  const donationPower = addBaseNumbers(
    1,
    NumberMath.log10(addBaseNumbers(numberBlackHoleDonationPercent, 1))
  );
  const rawRadius = NumberMath.power(logarithmicMass, donationPower);
  return NumberMath.log10(addBaseNumbers(1, rawRadius));
}

function numberBlackHoleTimeMultiplier() {
  if (!numberBlackHoleSystemEnabled || !knuthUnlocked) return 1;

  const radius = numberBlackHoleSchwarzschildRadius();
  const { radiusReference, timeScale, timeExponent } = NUMBER_BLACK_HOLE_BALANCE;
  const radiusComparison = compareNumberValues(radius, 1);
  let multiplierLog10;
  if (radiusComparison < 0) {
    const radiusNumber = realNumberFromValue(radius);
    const directMultiplier = timeScale * ((radiusNumber / radiusReference) ** timeExponent);
    if (!Number.isFinite(directMultiplier)) return NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER;
    return Math.min(NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER, Math.max(1, directMultiplier));
  }

  const radiusLog10 = NumberMath.toNumber(NumberMath.log10(radius));
  if (!Number.isFinite(radiusLog10)) {
    return NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER;
  }

  multiplierLog10 = Math.log10(timeScale) + timeExponent * (radiusLog10 - Math.log10(radiusReference));
  if (
    !Number.isFinite(multiplierLog10)
    || multiplierLog10 >= Math.log10(NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER)
  ) {
    return NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER;
  }

  return Math.max(1, 10 ** multiplierLog10);
}

function resetNumberBlackHoleTimers() {
  numberBlackHoleDonationTimerMs = 0;
  numberBlackHoleLastTickAt = typeof performance === 'undefined' ? Date.now() : performance.now();
}

function toggleNumberBlackHoleSystem() {
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

function buyNumberBlackHoleUpgrade(kind) {
  if (!numberBlackHoleSystemEnabled || !knuthUnlocked) return false;

  const isAmountUpgrade = kind === 'amount';
  const level = isAmountUpgrade
    ? numberBlackHoleDonationAmountLevel
    : numberBlackHoleDonationSpeedLevel;
  const cost = isAmountUpgrade
    ? numberBlackHoleDonationAmountCost
    : numberBlackHoleDonationSpeedCost;
  const atLimit = isAmountUpgrade
    ? numberBlackHoleDonationPercentLimit() >= NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT
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

  log(`숫자 블랙홀 ${isAmountUpgrade ? '투여량' : '투여 빠르기'} 업그레이드를 구매했습니다.`, true);
  render();
  return true;
}

function setNumberBlackHoleSetting(kind, value) {
  const limit = kind === 'amount'
    ? numberBlackHoleDonationPercentLimit()
    : numberBlackHoleDonationRateLimit();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return false;
  const nextValue = Math.max(1, Math.min(limit, parsed));

  if (kind === 'amount') {
    numberBlackHoleDonationPercent = nextValue;
  } else {
    numberBlackHoleDonationRate = nextValue;
    numberBlackHoleDonationTimerMs = 0;
  }
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
  if (!Number.isFinite(cycles) || cycles <= 0) return false;
  const startingNumber = getBaseNumber();
  if (!isPositiveNumberValue(startingNumber)) return false;

  const retainedFraction = Math.pow(
    1 - numberBlackHoleDonationPercent / 100,
    Math.min(Number.MAX_SAFE_INTEGER, cycles)
  );
  const remainingNumber = multiplyNumberValue(startingNumber, retainedFraction);
  const investedNumber = subtractNumberValues(startingNumber, remainingNumber);
  if (!isPositiveNumberValue(investedNumber)) return false;

  setBaseNumber(remainingNumber);
  numberBlackHoleTotalInvested = addBaseNumbers(numberBlackHoleTotalInvested, investedNumber);
  return true;
}

function advanceNumberBlackHole(elapsedRealMs) {
  const elapsed = Number(elapsedRealMs);
  if (
    !numberBlackHoleSystemEnabled
    || !knuthUnlocked
    || !Number.isFinite(elapsed)
    || elapsed <= 0
  ) return false;

  const acceleratedSeconds = gameTick(elapsed) / 1000;
  if (Number.isFinite(acceleratedSeconds) && acceleratedSeconds > 0) {
    numberBlackHoleAccumulatedGameSeconds = addBaseNumbers(
      numberBlackHoleAccumulatedGameSeconds,
      numberValueFromReal(acceleratedSeconds)
    );
  }

  const periodMs = 1000 / numberBlackHoleDonationRate;
  numberBlackHoleDonationTimerMs += elapsed;
  const cycles = Math.floor(numberBlackHoleDonationTimerMs / periodMs);
  numberBlackHoleDonationTimerMs %= periodMs;
  return cycles > 0 && applyNumberBlackHoleDonations(cycles);
}

function renderNumberBlackHoleBoard() {
  if (!numberBlackHoleStatus || !numberBlackHoleAmountInput || !numberBlackHoleSpeedInput) return;

  const enabled = numberBlackHoleSystemEnabled && knuthUnlocked;
  const amountLimit = numberBlackHoleDonationPercentLimit();
  const speedLimit = numberBlackHoleDonationRateLimit();
  const amountAtLimit = amountLimit >= NUMBER_BLACK_HOLE_MAX_DONATION_PERCENT;
  const speedAtLimit = speedLimit >= NUMBER_BLACK_HOLE_MAX_DONATION_RATE;
  const canBuyAmount = compareNumberValues(knuthPoints, numberBlackHoleDonationAmountCost) >= 0;
  const canBuySpeed = compareNumberValues(knuthPoints, numberBlackHoleDonationSpeedCost) >= 0;

  numberBlackHoleStatus.textContent = enabled ? '작동 중' : '비활성';
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
  numberBlackHoleAccumulatedTimeValue.textContent = `${fmtPowerBase(numberBlackHoleAccumulatedGameSeconds)}초`;
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

numberBlackHoleAmountUpgradeBtn.addEventListener('click', () => buyNumberBlackHoleUpgrade('amount'));
numberBlackHoleSpeedUpgradeBtn.addEventListener('click', () => buyNumberBlackHoleUpgrade('speed'));
numberBlackHoleAmountMinusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('amount', -1));
numberBlackHoleAmountPlusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('amount', 1));
numberBlackHoleSpeedMinusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('speed', -1));
numberBlackHoleSpeedPlusBtn.addEventListener('click', () => adjustNumberBlackHoleSetting('speed', 1));
connectNumberBlackHoleInput(numberBlackHoleAmountInput, 'amount');
connectNumberBlackHoleInput(numberBlackHoleSpeedInput, 'speed');

setInterval(() => {
  const now = typeof performance === 'undefined' ? Date.now() : performance.now();
  const elapsed = Math.max(0, now - numberBlackHoleLastTickAt);
  numberBlackHoleLastTickAt = now;
  if (advanceNumberBlackHole(elapsed)) render();

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
