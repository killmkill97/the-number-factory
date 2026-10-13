const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/core/number-math.js'), 'utf8');
const context = vm.createContext({});
vm.runInContext(`${source}\n;globalThis.NumberMath = NumberMath;`, context);
const NumberMath = context.NumberMath;

test('keeps legacy integer saves exact without BigInt', () => {
  const saved = '123456789012345678901234567890123';
  const parsed = NumberMath.fromString(saved, null);
  assert.equal(NumberMath.serialize(parsed), saved);
  assert.equal(NumberMath.serialize(NumberMath.add(saved, '1')), '123456789012345678901234567890124');
  assert.equal(NumberMath.serialize(NumberMath.subtract(saved, '123')), '123456789012345678901234567890000');
  assert.equal(NumberMath.serialize(NumberMath.multiply('123456789', '987654321')), '121932631112635269');
  assert.equal(NumberMath.serialize(NumberMath.divide('100000000000000000000', '3')), '33333333333333333333');
  const dividend = '123456789012345678901234567890123';
  const divisor = '987654321';
  const remainder = NumberMath.modulo(dividend, divisor);
  assert.ok(NumberMath.compare(remainder, divisor) < 0);
  assert.equal(
    NumberMath.serialize(NumberMath.add(NumberMath.multiply(NumberMath.divide(dividend, divisor), divisor), remainder)),
    dividend
  );
});

test('round-trips legacy and nested scientific notation', () => {
  for (const saved of ['1.234e500', '1e3.25e34', '1e-1.2e300', '1e1e1000']) {
    const parsed = NumberMath.fromString(saved, null);
    assert.ok(parsed, `expected ${saved} to parse`);
    const restored = NumberMath.fromString(NumberMath.serialize(parsed), null);
    assert.equal(NumberMath.compare(parsed, restored), 0);
  }
  assert.equal(NumberMath.compare(NumberMath.fromString('1e3.25e34'), NumberMath.fromString('1e34')), 1);
});

test('exports numeric conversion required by existing game systems', () => {
  assert.equal(typeof NumberMath.toNumber, 'function');
  assert.equal(NumberMath.toNumber(NumberMath.fromString('125')), 125);
  assert.equal(NumberMath.toNumber(NumberMath.fromString('1e1000')), Infinity);
});

test('accepts layered scientific input in the N lexer', () => {
  const lexerSource = fs.readFileSync(path.join(__dirname, '../scripts/automatium/n-lexer.js'), 'utf8');
  const lexerContext = vm.createContext({});
  vm.runInContext(`${lexerSource}\n;globalThis.NLexer = NLexer;`, lexerContext);
  const tokens = lexerContext.NLexer.tokenize('x = 1e3.25e34');
  assert.equal(tokens[2].type, 'number_literal');
  assert.equal(NumberMath.serialize(NumberMath.fromString(tokens[2].value)), '1e3.25e34');
});

test('promotes exponent overflow instead of returning zero', () => {
  let value = NumberMath.fromString('1e500');
  for (let index = 0; index < 2200; index++) value = NumberMath.power(value, 1.5);
  assert.equal(NumberMath.isZero(value), false);
  assert.match(NumberMath.serialize(value), /e.*e/);
  const restored = NumberMath.fromString(NumberMath.serialize(value), null);
  assert.equal(NumberMath.compare(value, restored), 0);
});

test('retains tiny factors that become significant when multiplied by a large value', () => {
  const tinyRatio = NumberMath.divideApproximate(
    NumberMath.fromString('1e100'),
    NumberMath.fromString('1e1000')
  );
  const multiplier = NumberMath.power(tinyRatio, 2);
  const recoveredScale = NumberMath.multiply(multiplier, NumberMath.fromString('1e3000'));
  assert.equal(NumberMath.serialize(multiplier), '1e-1800');
  assert.equal(NumberMath.serialize(recoveredScale), '1e1200');
});

test('keeps the logarithm magnitude for sub-unit values', () => {
  assert.equal(NumberMath.serialize(NumberMath.log10(0.5)), '0');
  assert.ok(Math.abs(NumberMath.toNumber(NumberMath.log10Abs(0.5)) - Math.log10(2)) < 1e-14);
});

test('parses decimal strings and preserves fractional powers', () => {
  assert.equal(NumberMath.serialize(NumberMath.fromString('0.5', null)), '5e-1');
  assert.equal(NumberMath.serialize(NumberMath.fromString('.000001', null)), '1e-6');
  assert.equal(NumberMath.serialize(NumberMath.fromString('123.45', null)), '1.2345e2');
  assert.equal(NumberMath.serialize(NumberMath.power('0.5', 2)), '2.5e-1');
  assert.equal(NumberMath.serialize(NumberMath.power('2', -3)), '1.25e-1');
});

test('keeps logarithmic price discounts and diverger scaling layered', () => {
  const layeredPrice = NumberMath.powerOfTen(NumberMath.fromString('1e1000'));
  const layeredLog = NumberMath.log10(layeredPrice);
  assert.equal(NumberMath.toNumber(layeredLog), Infinity);

  const discountedPrice = NumberMath.powerOfTen(NumberMath.multiply(layeredLog, 0.1));
  assert.equal(NumberMath.isZero(discountedPrice), false);
  assert.equal(NumberMath.compare(discountedPrice, layeredPrice), -1);

  const divergerPower = NumberMath.fromString('1.46e141');
  const divergerLog = NumberMath.log10Abs(divergerPower);
  const divergerExponent = NumberMath.divideApproximate(NumberMath.power(divergerLog, 2), 3);
  const multiplier = NumberMath.power(4, divergerExponent);
  assert.equal(NumberMath.compare(multiplier, NumberMath.fromString('1e3000')), 1);
});

test('rejects pathological nesting without throwing', () => {
  const hostile = `1e${'1e'.repeat(70)}1`;
  assert.equal(NumberMath.fromString(hostile, null), null);
  assert.equal(NumberMath.fromString('1'.repeat(5000), null), null);
});

test('bounds generated layer depth and keeps it saveable', () => {
  let value = NumberMath.fromString('1000');
  for (let index = 0; index < 100; index++) value = NumberMath.powerOfTen(value);
  const saved = NumberMath.serialize(value);
  assert.ok(saved.length < 4096);
  assert.ok(NumberMath.fromString(saved, null));
});
