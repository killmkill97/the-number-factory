const NumberMath = (() => {
  const SCIENTIFIC_EXPONENT_THRESHOLD = 33;
  const SCIENTIFIC_SIGNIFICANCE_GAP = 12;

  function isScientific(value) {
    return Boolean(value && typeof value === 'object' && value.approximate === true);
  }

  function normalize(mantissa, exponent) {
    if (!Number.isFinite(mantissa) || mantissa <= 0 || !Number.isFinite(exponent)) return null;

    let normalizedMantissa = mantissa;
    let normalizedExponent = Math.floor(exponent);
    while (normalizedMantissa >= 10) {
      normalizedMantissa /= 10;
      normalizedExponent++;
    }
    while (normalizedMantissa < 1) {
      normalizedMantissa *= 10;
      normalizedExponent--;
    }

    return {
      approximate: true,
      mantissa: normalizedMantissa,
      exponent: normalizedExponent
    };
  }

  function normalizeValue(mantissa, exponent) {
    const normalized = normalize(mantissa, exponent);
    if (!normalized || normalized.exponent < 0 || normalized.exponent >= SCIENTIFIC_EXPONENT_THRESHOLD) {
      return normalized ?? 0n;
    }

    const text = normalized.mantissa.toPrecision(15);
    const [whole, fraction = ''] = text.split('.');
    const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
    const power = normalized.exponent - fraction.length;
    const integer = power >= 0
      ? BigInt(digits) * (10n ** BigInt(power))
      : BigInt(digits) / (10n ** BigInt(-power));
    return fromBigInt(integer);
  }

  function fromBigInt(value) {
    const integer = BigInt(value);
    if (integer < APPROXIMATE_NUMBER_THRESHOLD) return integer < 0n ? 0n : integer;
    if (integer <= 0n) return 0n;

    const digits = integer.toString();
    const significant = digits.slice(0, 16);
    return normalize(
      Number(significant) / (10 ** (significant.length - 1)),
      digits.length - 1
    );
  }

  function fromPlainDigits(digits) {
    const normalizedDigits = String(digits).replace(/^0+(?=\d)/, '') || '0';
    if (normalizedDigits === '0') return 0n;
    if (normalizedDigits.length <= SCIENTIFIC_EXPONENT_THRESHOLD) return BigInt(normalizedDigits);

    const significant = normalizedDigits.slice(0, 16);
    return normalize(
      Number(significant) / (10 ** (significant.length - 1)),
      normalizedDigits.length - 1
    );
  }

  function fromString(rawValue, fallback = 0n) {
    const text = String(rawValue ?? '').trim().replace(/[,_\s]/g, '');
    if (!text) return fallback;
    if (/^\+?\d+$/.test(text)) return fromPlainDigits(text.replace(/^\+/, ''));

    const scientific = text.match(/^\+?(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
    if (!scientific) return fallback;

    const whole = scientific[1];
    const fraction = scientific[2] ?? '';
    const exponent = Number(scientific[3]);
    if (!Number.isSafeInteger(exponent)) return fallback;

    const mantissa = Number(`${whole}.${fraction || '0'}`);
    const normalized = normalize(mantissa, exponent);
    if (!normalized) return 0n;
    if (normalized.exponent >= SCIENTIFIC_EXPONENT_THRESHOLD) return normalized;

    const digits = `${whole}${fraction}`.replace(/^0+(?=\d)/, '') || '0';
    const power = exponent - fraction.length;
    if (power < 0) return 0n;
    return BigInt(digits) * (10n ** BigInt(power));
  }

  function toScientific(value) {
    if (isScientific(value)) return normalize(value.mantissa, value.exponent);
    const integer = BigInt(value);
    if (integer <= 0n) return null;

    const digits = integer.toString();
    const significant = digits.slice(0, 16);
    return normalize(
      Number(significant) / (10 ** (significant.length - 1)),
      digits.length - 1
    );
  }

  function compare(left, right) {
    const leftScientific = isScientific(left);
    const rightScientific = isScientific(right);
    if (!leftScientific && !rightScientific) {
      const leftInteger = BigInt(left);
      const rightInteger = BigInt(right);
      return leftInteger === rightInteger ? 0 : leftInteger > rightInteger ? 1 : -1;
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return a ? 1 : b ? -1 : 0;
    if (a.exponent !== b.exponent) return a.exponent > b.exponent ? 1 : -1;
    if (a.mantissa === b.mantissa) return 0;
    return a.mantissa > b.mantissa ? 1 : -1;
  }

  function add(left, right) {
    if (!isScientific(left) && !isScientific(right)) {
      return fromBigInt(BigInt(left) + BigInt(right));
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a) return b ?? 0n;
    if (!b) return a;
    const high = a.exponent >= b.exponent ? a : b;
    const low = high === a ? b : a;
    const exponentGap = high.exponent - low.exponent;
    if (exponentGap >= SCIENTIFIC_SIGNIFICANCE_GAP) return high;
    return normalizeValue(high.mantissa + low.mantissa * (10 ** -exponentGap), high.exponent);
  }

  function subtract(left, right, { ignoreGap = SCIENTIFIC_SIGNIFICANCE_GAP } = {}) {
    if (compare(left, right) <= 0) return 0n;
    if (!isScientific(left) && !isScientific(right)) {
      return BigInt(left) - BigInt(right);
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a) return 0n;
    if (!b) return a;
    const exponentGap = a.exponent - b.exponent;
    if (exponentGap >= ignoreGap) return a;
    return normalizeValue(a.mantissa - b.mantissa * (10 ** -exponentGap), a.exponent);
  }

  function multiply(left, right) {
    if (!isScientific(left) && !isScientific(right)) {
      return fromBigInt(BigInt(left) * BigInt(right));
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return 0n;
    return normalizeValue(a.mantissa * b.mantissa, a.exponent + b.exponent);
  }

  function divide(left, right) {
    if (compare(right, 0n) <= 0) return 0n;
    if (!isScientific(left) && !isScientific(right)) {
      return BigInt(left) / BigInt(right);
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return 0n;
    return normalizeValue(a.mantissa / b.mantissa, a.exponent - b.exponent);
  }

  function min(left, right) {
    return compare(left, right) <= 0 ? left : right;
  }

  function max(left, right) {
    return compare(left, right) >= 0 ? left : right;
  }

  function isPositive(value) {
    return compare(value, 0n) > 0;
  }

  function isZero(value) {
    return compare(value, 0n) === 0;
  }

  function powerOfTen(exponent) {
    const numericExponent = Number(exponent);
    if (!Number.isSafeInteger(numericExponent) || numericExponent < 0) return 0n;
    if (numericExponent >= SCIENTIFIC_EXPONENT_THRESHOLD) return normalize(1, numericExponent);
    return 10n ** BigInt(numericExponent);
  }

  function power(value, exponent) {
    const numericExponent = typeof exponent === 'bigint' ? Number(exponent) : Number(exponent);
    if (!Number.isFinite(numericExponent)) return 0n;
    if (numericExponent === 0) return 1n;

    const scientific = toScientific(value);
    if (!scientific) return 0n;
    const logarithm = (Math.log10(scientific.mantissa) + scientific.exponent) * numericExponent;
    if (!Number.isFinite(logarithm)) return 0n;
    const resultExponent = Math.floor(logarithm);
    return normalizeValue(10 ** (logarithm - resultExponent), resultExponent);
  }

  function powerApproximate(value, exponent) {
    const numericExponent = typeof exponent === 'bigint' ? Number(exponent) : Number(exponent);
    if (!Number.isFinite(numericExponent)) return 0n;

    const scientific = toScientific(value);
    if (!scientific) return 0n;
    const logarithm = (Math.log10(scientific.mantissa) + scientific.exponent) * numericExponent;
    if (!Number.isFinite(logarithm)) return 0n;

    const resultExponent = Math.floor(logarithm);
    return normalize(10 ** (logarithm - resultExponent), resultExponent);
  }

  function log10(value) {
    const scientific = toScientific(value);
    if (!scientific) return 0n;

    const logarithm = Math.log10(scientific.mantissa) + scientific.exponent;
    if (!Number.isFinite(logarithm) || logarithm <= 0) return 0n;
    if (Number.isSafeInteger(logarithm)) return BigInt(logarithm);

    const resultExponent = Math.floor(Math.log10(logarithm));
    return normalize(logarithm / (10 ** resultExponent), resultExponent);
  }

  function serialize(value) {
    if (!isScientific(value)) return BigInt(value).toString();
    return `${value.mantissa.toPrecision(15)}e${value.exponent}`;
  }

  return {
    isScientific,
    normalize,
    normalizeValue,
    fromBigInt,
    fromString,
    toScientific,
    compare,
    add,
    subtract,
    multiply,
    divide,
    min,
    max,
    isPositive,
    isZero,
    powerOfTen,
    power,
    powerApproximate,
    log10,
    serialize
  };
})();
