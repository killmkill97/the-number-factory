const NumberMath = (() => {
  const SCIENTIFIC_EXPONENT_THRESHOLD = 33;
  const SCIENTIFIC_SIGNIFICANCE_GAP = 12;
  const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
  const MAX_PARSE_DEPTH = 64;
  const MAX_LAYER_DEPTH = 48;
  const MAX_INPUT_LENGTH = 4096;

  function isScientific(value) {
    return Boolean(value && typeof value === 'object' && value.approximate === true);
  }

  function isNegativeExponent(value) {
    return Boolean(value && typeof value === 'object' && value.negativeExponent === true);
  }

  function stripLeadingZeros(digits) {
    return String(digits).replace(/^0+(?=\d)/, '') || '0';
  }

  function validExponentShape(value, depth = 0) {
    if (depth > MAX_LAYER_DEPTH + 2) return false;
    if (typeof value === 'number') return Number.isFinite(value);
    if (isNegativeExponent(value)) return validExponentShape(value.value, depth + 1);
    return isScientific(value)
      && Number.isFinite(value.mantissa)
      && value.mantissa > 0
      && validExponentShape(value.exponent, depth + 1);
  }

  function compareDigits(left, right) {
    const a = stripLeadingZeros(left);
    const b = stripLeadingZeros(right);
    if (a.length !== b.length) return a.length > b.length ? 1 : -1;
    return a === b ? 0 : a > b ? 1 : -1;
  }

  function addDigits(left, right) {
    let carry = 0;
    let result = '';
    let i = left.length - 1;
    let j = right.length - 1;
    while (i >= 0 || j >= 0 || carry) {
      const sum = (i >= 0 ? left.charCodeAt(i--) - 48 : 0)
        + (j >= 0 ? right.charCodeAt(j--) - 48 : 0)
        + carry;
      result = `${sum % 10}${result}`;
      carry = Math.floor(sum / 10);
    }
    return stripLeadingZeros(result);
  }

  function subtractDigits(left, right) {
    let borrow = 0;
    let result = '';
    let i = left.length - 1;
    let j = right.length - 1;
    while (i >= 0) {
      let digit = left.charCodeAt(i--) - 48 - borrow;
      const other = j >= 0 ? right.charCodeAt(j--) - 48 : 0;
      if (digit < other) {
        digit += 10;
        borrow = 1;
      } else {
        borrow = 0;
      }
      result = `${digit - other}${result}`;
    }
    return stripLeadingZeros(result);
  }

  function multiplyDigits(left, right) {
    if (left === '0' || right === '0') return '0';
    const digits = Array(left.length + right.length).fill(0);
    for (let i = left.length - 1; i >= 0; i--) {
      for (let j = right.length - 1; j >= 0; j--) {
        digits[i + j + 1] += (left.charCodeAt(i) - 48) * (right.charCodeAt(j) - 48);
      }
    }
    for (let index = digits.length - 1; index > 0; index--) {
      digits[index - 1] += Math.floor(digits[index] / 10);
      digits[index] %= 10;
    }
    return stripLeadingZeros(digits.join(''));
  }

  function divideDigits(dividend, divisor) {
    let remainder = '0';
    let quotient = '';
    for (const digit of dividend) {
      remainder = stripLeadingZeros(`${remainder}${digit}`);
      let quotientDigit = 0;
      while (compareDigits(remainder, divisor) >= 0) {
        remainder = subtractDigits(remainder, divisor);
        quotientDigit++;
      }
      quotient += String(quotientDigit);
    }
    return stripLeadingZeros(quotient);
  }

  function moduloDigits(dividend, divisor) {
    let remainder = '0';
    for (const digit of dividend) {
      remainder = stripLeadingZeros(`${remainder}${digit}`);
      while (compareDigits(remainder, divisor) >= 0) {
        remainder = subtractDigits(remainder, divisor);
      }
    }
    return remainder;
  }

  function fromDigits(rawDigits) {
    const digits = stripLeadingZeros(rawDigits);
    if (digits === '0') return 0;
    if (digits.length <= 15) return Number(digits);
    if (digits.length <= SCIENTIFIC_EXPONENT_THRESHOLD) return digits;

    const significantDigits = digits.slice(0, 16);
    const mantissa = Number(significantDigits) / (10 ** (significantDigits.length - 1));
    return normalize(mantissa, digits.length - 1);
  }

  function fromDecimalText(text) {
    const match = String(text).match(/^\+?(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
    if (!match) return null;

    const integerPart = match[1] ?? '';
    const rawDigits = `${integerPart}${match[2] ?? match[3] ?? ''}`;
    const firstNonZero = rawDigits.search(/[1-9]/);
    if (firstNonZero < 0) return 0;

    const significantDigits = rawDigits.slice(firstNonZero, firstNonZero + 16);
    const mantissa = Number(significantDigits) / (10 ** (significantDigits.length - 1));
    const exponent = integerPart.length - firstNonZero - 1;
    return normalizeValue(mantissa, exponent);
  }

  function exponentField(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (isScientific(value)) {
      return Number.isFinite(value.mantissa) && value.mantissa > 0
        && validExponentShape(value.exponent)
        ? value
        : null;
    }
    if (isNegativeExponent(value)) {
      const magnitude = exponentField(value.value);
      return magnitude === null ? null : makeSignedExponent(magnitude, -1);
    }
    return null;
  }

  function exponentAsValue(value) {
    if (isScientific(value)) return value;
    if (isNegativeExponent(value)) return value.value;
    return fromNumber(value);
  }

  function exponentSign(value) {
    if (isNegativeExponent(value)) return -1;
    if (typeof value === 'number') return value < 0 ? -1 : value > 0 ? 1 : 0;
    if (isScientific(value)) return isZero(value) ? 0 : 1;
    return 0;
  }

  function exponentMagnitude(value) {
    if (isNegativeExponent(value)) return value.value;
    if (typeof value === 'number') return Math.abs(value);
    return value;
  }

  function makeSignedExponent(magnitude, sign) {
    if (sign === 0 || isZero(magnitude)) return 0;
    if (typeof magnitude === 'number') return sign < 0 ? -magnitude : magnitude;
    if (typeof magnitude === 'string') {
      const converted = toScientific(magnitude) ?? Number(magnitude);
      return makeSignedExponent(converted, sign);
    }
    return sign < 0 ? { negativeExponent: true, value: magnitude } : magnitude;
  }

  function limitExponentDepth(value, depth = 0) {
    if (depth >= MAX_LAYER_DEPTH) return Number.MAX_VALUE;
    if (isNegativeExponent(value)) {
      return {
        negativeExponent: true,
        value: limitExponentDepth(value.value, depth + 1)
      };
    }
    if (!isScientific(value)) return value;
    return {
      approximate: true,
      mantissa: value.mantissa,
      exponent: limitExponentDepth(value.exponent, depth + 1)
    };
  }

  function compareExponents(left, right) {
    const a = exponentField(left);
    const b = exponentField(right);
    if (a === null || b === null) return 0;
    if (typeof a === 'number' && typeof b === 'number') {
      return a === b ? 0 : a > b ? 1 : -1;
    }
    const aSign = exponentSign(a);
    const bSign = exponentSign(b);
    if (aSign !== bSign) return aSign > bSign ? 1 : -1;
    if (aSign === 0) return 0;
    const magnitudeComparison = compare(
      exponentAsValue(exponentMagnitude(a)),
      exponentAsValue(exponentMagnitude(b))
    );
    return aSign < 0 ? -magnitudeComparison : magnitudeComparison;
  }

  function addSignedExponents(left, right) {
    const a = exponentField(left);
    const b = exponentField(right);
    if (a === null || b === null) return null;
    if (typeof a === 'number' && typeof b === 'number') {
      const sum = a + b;
      if (Number.isFinite(sum)) return sum;
    }
    const aSign = exponentSign(a);
    const bSign = exponentSign(b);
    if (aSign === 0) return b;
    if (bSign === 0) return a;
    const aMagnitude = exponentAsValue(exponentMagnitude(a));
    const bMagnitude = exponentAsValue(exponentMagnitude(b));
    if (aSign === bSign) {
      return makeSignedExponent(add(aMagnitude, bMagnitude), aSign);
    }
    const magnitudeComparison = compare(aMagnitude, bMagnitude);
    if (magnitudeComparison === 0) return 0;
    const larger = magnitudeComparison > 0 ? aMagnitude : bMagnitude;
    const smaller = magnitudeComparison > 0 ? bMagnitude : aMagnitude;
    return makeSignedExponent(subtract(larger, smaller), magnitudeComparison > 0 ? aSign : bSign);
  }

  function addExponentShift(exponent, shift) {
    return addSignedExponents(exponent, shift);
  }

  function addExponents(left, right) {
    const a = exponentField(left);
    const b = exponentField(right);
    if (a === null || b === null) return null;
    return addSignedExponents(a, b);
  }

  function subtractExponents(larger, smaller) {
    const a = exponentField(larger);
    const b = exponentField(smaller);
    if (a === null || b === null) return null;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    const negatedB = makeSignedExponent(exponentMagnitude(b), -exponentSign(b));
    return addSignedExponents(a, negatedB);
  }

  function normalize(mantissa, exponent) {
    if (typeof exponent === 'number' && Number.isFinite(exponent)
      && Number.isFinite(mantissa) && mantissa > 0) {
      const shift = Math.floor(Math.log10(mantissa));
      const adjustedExponent = exponent + shift;
      if (Number.isFinite(adjustedExponent)) {
        const normalizedMantissa = shift < -308
          ? (mantissa * (10 ** (-shift - 308))) * 1e308
          : mantissa / (10 ** shift);
        return { approximate: true, mantissa: normalizedMantissa, exponent: adjustedExponent };
      }
    }
    const normalizedExponent = exponentField(exponent);
    if (!Number.isFinite(mantissa) || mantissa <= 0 || normalizedExponent === null) return null;

    const shift = Math.floor(Math.log10(mantissa));
    const normalizedMantissa = shift < -308
      ? (mantissa * (10 ** (-shift - 308))) * 1e308
      : mantissa / (10 ** shift);
    const adjustedExponent = addExponentShift(normalizedExponent, shift);
    if (adjustedExponent === null || (typeof adjustedExponent === 'number' && !Number.isFinite(adjustedExponent))) {
      return null;
    }

    return {
      approximate: true,
      mantissa: normalizedMantissa,
      exponent: limitExponentDepth(adjustedExponent)
    };
  }

  function normalizeValue(mantissa, exponent) {
    const normalized = normalize(mantissa, exponent);
    if (!normalized) return 0;
    if (typeof normalized.exponent !== 'number'
      || normalized.exponent < 0
      || normalized.exponent >= SCIENTIFIC_EXPONENT_THRESHOLD) {
      return normalized;
    }

    const [whole, rawFraction = ''] = normalized.mantissa.toPrecision(15).split('.');
    const fraction = rawFraction.replace(/0+$/, '');
    const digits = stripLeadingZeros(`${whole}${fraction}`);
    const power = normalized.exponent - fraction.length;
    if (power < 0) return normalized;
    return fromDigits(`${digits}${'0'.repeat(power)}`);
  }

  function fromNumber(value) {
    const number = Number(value);
    if (number === Infinity) return normalize(1, Number.MAX_VALUE);
    if (!Number.isFinite(number) || number <= 0) return 0;
    if (Number.isInteger(number) && number <= MAX_SAFE_INTEGER) return number;
    return normalize(number, 0);
  }

  function fromValue(value, fallback = 0) {
    if (isScientific(value)) return normalize(value.mantissa, value.exponent) ?? fallback;
    if (typeof value === 'number') return fromNumber(value);
    if (typeof value === 'string') return fromString(value, fallback);
    return fallback;
  }

  function fromPlainDigits(rawDigits) {
    return fromDigits(rawDigits);
  }

  function parseText(rawValue, fallback, depth) {
    if (depth > MAX_PARSE_DEPTH) return fallback;
    const text = String(rawValue ?? '').trim().replace(/[,_\s]/g, '');
    if (!text || text.length > MAX_INPUT_LENGTH) return fallback;
    if (/^\+?\d+$/.test(text)) return fromPlainDigits(text.replace(/^\+/, ''));
    if (!/[eE]/.test(text)) {
      const decimal = fromDecimalText(text);
      if (decimal !== null) return decimal;
    }

    const scientific = text.match(/^\+?((?:\d+(?:\.\d*)?)|(?:\.\d+))[eE](.+)$/);
    if (!scientific) return fallback;

    const mantissa = Number(scientific[1]);
    const exponentText = scientific[2];
    let exponent;
    if (/^[+-]?\d+$/.test(exponentText)) {
      exponent = Number(exponentText);
      if (!Number.isFinite(exponent)) return fallback;
    } else if (exponentText.startsWith('-')) {
      const magnitude = parseText(exponentText.slice(1), null, depth + 1);
      if (magnitude === null || !isPositive(magnitude)) return fallback;
      exponent = makeSignedExponent(magnitude, -1);
    } else {
      const magnitude = parseText(exponentText, null, depth + 1);
      if (magnitude === null) return fallback;
      // Exact digit strings must use the same scalar exponent as plain notation.
      exponent = typeof magnitude === 'string' ? toNumber(magnitude) : magnitude;
      if (!isScientific(exponent) && !(typeof exponent === 'number' && Number.isFinite(exponent))) {
        return fallback;
      }
    }
    return normalizeValue(mantissa, exponent);
  }

  function fromString(rawValue, fallback = 0) {
    return parseText(rawValue, fallback, 0);
  }

  function toScientific(value) {
    if (isScientific(value)) return normalize(value.mantissa, value.exponent);
    if (typeof value === 'string') {
      if (/[eE]/.test(value)) {
        const parsed = fromString(value, null);
        return parsed === null ? null : toScientific(parsed);
      }
      const digits = stripLeadingZeros(value);
      if (/^\d+$/.test(digits) && digits !== '0') {
        if (digits.length <= 15) return normalize(Number(digits), 0);
        const significant = digits.slice(0, 16);
        return normalize(Number(significant) / (10 ** (significant.length - 1)), digits.length - 1);
      }
      const decimal = fromDecimalText(value);
      return decimal === null || isZero(decimal) ? null : toScientific(decimal);
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return null;
    const exponent = Math.floor(Math.log10(number));
    return normalize(number / (10 ** exponent), exponent);
  }

  function compare(left, right) {
    const aIsScientific = isScientific(left);
    const bIsScientific = isScientific(right);
    const hasScientificText = typeof left === 'string' && /[eE]/.test(left)
      || typeof right === 'string' && /[eE]/.test(right);
    if (!aIsScientific && !bIsScientific && !hasScientificText) {
      const a = String(left ?? 0);
      const b = String(right ?? 0);
      if (/^\d+$/.test(a) && /^\d+$/.test(b)) return compareDigits(a, b);
      const numericA = Number(a);
      const numericB = Number(b);
      if (Number.isNaN(numericA) || Number.isNaN(numericB)) {
        if (Number.isNaN(numericA) && Number.isNaN(numericB)) return 0;
        return Number.isNaN(numericA) ? -1 : 1;
      }
      return numericA === numericB ? 0 : numericA > numericB ? 1 : -1;
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return a ? 1 : b ? -1 : 0;

    const aHasNonIntegerExponent = typeof a.exponent !== 'number'
      || !Number.isInteger(a.exponent);
    const bHasNonIntegerExponent = typeof b.exponent !== 'number'
      || !Number.isInteger(b.exponent);
    if (aHasNonIntegerExponent || bHasNonIntegerExponent) {
      const numericA = toNumber(a);
      const numericB = toNumber(b);
      if (numericA !== numericB && !(numericA === 0 && numericB === 0)) {
        if (Number.isFinite(numericA) || Number.isFinite(numericB)) {
          return numericA > numericB ? 1 : -1;
        }
      } else if (numericA === numericB && Number.isFinite(numericA) && numericA !== 0) {
        return 0;
      }
    }

    const exponentComparison = compareExponents(a.exponent, b.exponent);
    if (exponentComparison !== 0) return exponentComparison;
    return a.mantissa === b.mantissa ? 0 : a.mantissa > b.mantissa ? 1 : -1;
  }

  function add(left, right) {
    if (!isScientific(left) && !isScientific(right)) {
      const a = String(left ?? 0);
      const b = String(right ?? 0);
      if (/^\d+$/.test(a) && /^\d+$/.test(b)
        && a.length <= SCIENTIFIC_EXPONENT_THRESHOLD
        && b.length <= SCIENTIFIC_EXPONENT_THRESHOLD) {
        return fromDigits(addDigits(a, b));
      }
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a) return fromValue(right);
    if (!b) return fromValue(left);
    const comparison = compareExponents(a.exponent, b.exponent);
    const high = comparison >= 0 ? a : b;
    const low = comparison >= 0 ? b : a;
    const exponentGap = subtractExponents(high.exponent, low.exponent);
    if (exponentGap === null || compare(exponentGap, SCIENTIFIC_SIGNIFICANCE_GAP) >= 0) return high;
    const numericGap = toNumber(exponentGap);
    return normalizeValue(
      high.mantissa + low.mantissa * (10 ** -numericGap),
      high.exponent
    );
  }

  function subtract(left, right, { ignoreGap = SCIENTIFIC_SIGNIFICANCE_GAP } = {}) {
    if (compare(left, right) <= 0) return 0;
    if (!isScientific(left) && !isScientific(right)) {
      const a = String(left ?? 0);
      const b = String(right ?? 0);
      if (/^\d+$/.test(a) && /^\d+$/.test(b)
        && a.length <= SCIENTIFIC_EXPONENT_THRESHOLD
        && b.length <= SCIENTIFIC_EXPONENT_THRESHOLD) {
        return fromDigits(subtractDigits(a, b));
      }
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a) return 0;
    if (!b) return fromValue(left);
    const exponentComparison = compareExponents(a.exponent, b.exponent);
    if (exponentComparison < 0) return 0;
    if (exponentComparison > 0) {
      const exponentGap = subtractExponents(a.exponent, b.exponent);
      if (exponentGap === null || compare(exponentGap, ignoreGap) >= 0) return a;
      const numericGap = toNumber(exponentGap);
      return normalizeValue(a.mantissa - b.mantissa * (10 ** -numericGap), a.exponent);
    }
    return normalizeValue(a.mantissa - b.mantissa, a.exponent);
  }

  function multiply(left, right) {
    if (!isScientific(left) && !isScientific(right)) {
      const a = String(left ?? 0);
      const b = String(right ?? 0);
      if (/^\d+$/.test(a) && /^\d+$/.test(b)
        && a.length <= SCIENTIFIC_EXPONENT_THRESHOLD
        && b.length <= SCIENTIFIC_EXPONENT_THRESHOLD) {
        return fromDigits(multiplyDigits(a, b));
      }
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return 0;
    const exponent = addExponents(a.exponent, b.exponent);
    if (exponent === null) return 0;
    return normalizeValue(a.mantissa * b.mantissa, exponent);
  }

  function divide(left, right) {
    if (!isPositive(right)) return 0;
    if (!isScientific(left) && !isScientific(right)) {
      const a = String(left ?? 0);
      const b = String(right ?? 0);
      if (/^\d+$/.test(a) && /^\d+$/.test(b)
        && a.length <= SCIENTIFIC_EXPONENT_THRESHOLD
        && b.length <= SCIENTIFIC_EXPONENT_THRESHOLD) {
        return fromDigits(divideDigits(a, b));
      }
    }

    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return 0;
    const exponent = subtractExponents(a.exponent, b.exponent);
    if (exponent === null) return 0;
    return normalizeValue(a.mantissa / b.mantissa, exponent);
  }

  function divideApproximate(left, right) {
    if (!isPositive(right)) return 0;
    const a = toScientific(left);
    const b = toScientific(right);
    if (!a || !b) return 0;
    const exponent = subtractExponents(a.exponent, b.exponent);
    if (exponent === null) return 0;
    return normalizeValue(a.mantissa / b.mantissa, exponent);
  }

  function modulo(left, right) {
    if (!isPositive(right)) return 0;
    if (!isScientific(left) && !isScientific(right)) {
      const a = String(left ?? 0);
      const b = String(right ?? 0);
      if (/^\d+$/.test(a) && /^\d+$/.test(b)
        && a.length <= SCIENTIFIC_EXPONENT_THRESHOLD
        && b.length <= SCIENTIFIC_EXPONENT_THRESHOLD) {
        return fromDigits(moduloDigits(a, b));
      }
      const numericA = Number(a);
      const numericB = Number(b);
      if (Number.isFinite(numericA) && Number.isFinite(numericB) && numericB > 0) {
        return fromNumber(numericA % numericB);
      }
    }
    return 0;
  }

  function reciprocal(value) {
    const scientific = toScientific(value);
    if (!scientific) return 0;
    const exponent = makeSignedExponent(exponentMagnitude(scientific.exponent), -exponentSign(scientific.exponent));
    return normalizeValue(1 / scientific.mantissa, exponent);
  }

  function min(left, right) {
    return compare(left, right) <= 0 ? left : right;
  }

  function max(left, right) {
    return compare(left, right) >= 0 ? left : right;
  }

  function isPositive(value) {
    return compare(value, 0) > 0;
  }

  function isZero(value) {
    return compare(value, 0) === 0;
  }

  function powerOfTen(exponent) {
    if (typeof exponent === 'number' && Number.isNaN(exponent)) return 0;
    if (typeof exponent === 'number' && Number.isFinite(exponent)) {
      const wholeExponent = Math.floor(exponent);
      const fractionalExponent = exponent - wholeExponent;
      if (wholeExponent >= 0 && wholeExponent <= 15 && Number.isInteger(exponent)) {
        return 10 ** wholeExponent;
      }
      return normalizeValue(10 ** fractionalExponent, wholeExponent);
    }
    if (exponent === Infinity) return normalize(1, Number.MAX_VALUE);
    if (exponent === -Infinity) return 0;
    const value = fromValue(exponent, null);
    if (value === null) return 0;
    const numericExponent = toNumber(value);
    if (Number.isFinite(numericExponent)) {
      const wholeExponent = Math.floor(numericExponent);
      return normalizeValue(10 ** (numericExponent - wholeExponent), wholeExponent);
    }
    return normalize(1, value);
  }

  function power(value, exponent) {
    const numericExponent = typeof exponent === 'number' ? exponent : null;
    if (numericExponent === Infinity) return compare(value, 1) > 0
      ? normalize(1, Number.MAX_VALUE)
      : 0;
    if (numericExponent === -Infinity) return compare(value, 1) > 0 ? 0 : 1;
    if (numericExponent !== null && Number.isNaN(numericExponent)) return 0;
    if (numericExponent === 0) return 1;
    if (numericExponent !== null && numericExponent < 0) {
      return reciprocal(power(value, -numericExponent));
    }
    if (numericExponent !== null && Number.isSafeInteger(numericExponent)) {
      const exact = exactIntegerPower(value, numericExponent);
      if (exact !== null) return exact;
    }
    const baseScientific = toScientific(value);
    if (!baseScientific) return 0;
    if (compare(value, 1) < 0) {
      const poweredReciprocal = power(reciprocal(value), exponent);
      return reciprocal(poweredReciprocal);
    }
    if (numericExponent === null && compare(value, 10) === 0) return powerOfTen(exponent);

    const logarithm = log10(value);
    if (!isPositive(logarithm)) return 1;
    const poweredLogarithm = multiply(logarithm, exponent);
    return powerOfTen(poweredLogarithm);
  }

  function exactIntegerPower(value, exponent) {
    if (exponent < 0 || !Number.isSafeInteger(exponent)) return null;
    const text = typeof value === 'string'
      ? value.trim()
      : typeof value === 'number' && Number.isSafeInteger(value)
        ? String(value)
        : '';
    if (!/^\+?\d+$/.test(text)) return null;

    let remaining = exponent;
    let factor = fromPlainDigits(text.replace(/^\+/, ''));
    let result = 1;
    while (remaining > 0) {
      if (remaining % 2 === 1) result = multiply(result, factor);
      remaining = Math.floor(remaining / 2);
      if (remaining > 0) factor = multiply(factor, factor);
    }
    return result;
  }

  function powerApproximate(value, exponent) {
    const result = power(value, exponent);
    return isScientific(result) ? result : toScientific(result) ?? fromValue(result);
  }

  function log10(value) {
    const scientific = toScientific(value);
    if (!scientific) return 0;
    const logarithm = addSignedExponents(
      scientific.exponent,
      Math.log10(scientific.mantissa)
    );
    if (typeof logarithm === 'number') return logarithm > 0 ? fromNumber(logarithm) : 0;
    if (isNegativeExponent(logarithm)) return 0;
    return fromValue(logarithm);
  }

  function log10Abs(value) {
    const scientific = toScientific(value);
    if (!scientific) return 0;
    const logarithm = addSignedExponents(
      scientific.exponent,
      Math.log10(scientific.mantissa)
    );
    if (typeof logarithm === 'number') return fromNumber(Math.abs(logarithm));
    return isNegativeExponent(logarithm) ? logarithm.value : fromValue(logarithm);
  }

  function toNumber(value) {
    if (!isScientific(value)) {
      const number = Number(value);
      return Number.isFinite(number) ? number : number > 0 ? Infinity : 0;
    }
    const exponent = value.exponent;
    const numericExponent = isNegativeExponent(exponent)
      ? -toNumber(exponent.value)
      : typeof exponent === 'number'
        ? exponent
        : isScientific(exponent)
          ? toNumber(exponent)
          : NaN;
    if (numericExponent > 308) return Infinity;
    if (numericExponent < -324) return 0;
    if (!Number.isFinite(numericExponent)) return numericExponent > 0 ? Infinity : 0;
    if (numericExponent < -308) {
      return (value.mantissa * (10 ** (numericExponent + 308))) * 1e-308;
    }
    return value.mantissa * (10 ** numericExponent);
  }

  function ceil(value) {
    if (!isScientific(value)) {
      const text = String(value ?? 0);
      if (/^\d+$/.test(text)) return fromValue(text);
      return fromNumber(Math.ceil(Number(value)));
    }
    const scientific = toScientific(value);
    if (!scientific) return 0;
    const numericValue = toNumber(scientific);
    if (numericValue === 0) return 1;
    const exponent = isNegativeExponent(scientific.exponent)
      ? -toNumber(scientific.exponent.value)
      : typeof scientific.exponent === 'number'
        ? scientific.exponent
        : toNumber(scientific.exponent);
    if (Number.isFinite(numericValue) && exponent < 15) {
      return fromNumber(Math.ceil(numericValue));
    }
    return scientific;
  }

  function floor(value) {
    if (!isScientific(value)) {
      const text = String(value ?? 0);
      if (/^\d+$/.test(text)) return fromValue(text);
      return fromNumber(Math.floor(Number(value)));
    }
    const scientific = toScientific(value);
    if (!scientific) return 0;
    const numericValue = toNumber(scientific);
    if (numericValue === 0) return 0;
    const exponent = isNegativeExponent(scientific.exponent)
      ? -toNumber(scientific.exponent.value)
      : typeof scientific.exponent === 'number'
        ? scientific.exponent
        : toNumber(scientific.exponent);
    if (Number.isFinite(numericValue) && exponent < 15) {
      return fromNumber(Math.floor(numericValue));
    }
    return scientific;
  }

  function serialize(value) {
    if (typeof value === 'string' && /[eE]/.test(value)) {
      return serialize(fromString(value, 0));
    }
    if (!isScientific(value)) {
      const text = String(value ?? 0);
      return /^\d+$/.test(text) ? stripLeadingZeros(text) : String(Math.max(0, Number(value) || 0));
    }
    const exponent = isNegativeExponent(value.exponent)
      ? `-${serialize(value.exponent.value)}`
      : typeof value.exponent === 'number'
        ? String(value.exponent)
        : serialize(value.exponent);
    return `${value.mantissa}e${exponent}`;
  }

  return {
    isScientific,
    normalize,
    normalizeValue,
    fromNumber,
    fromValue,
    fromString,
    toScientific,
    toNumber,
    compare,
    add,
    subtract,
    multiply,
    divide,
    divideApproximate,
    modulo,
    min,
    max,
    isPositive,
    isZero,
    powerOfTen,
    power,
    powerApproximate,
    log10,
    log10Abs,
    floor,
    ceil,
    serialize
  };
})();
