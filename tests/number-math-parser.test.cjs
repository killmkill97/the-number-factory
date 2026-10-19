const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = vm.createContext({ performance: { now: () => 0 } });
for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js',
  'automatium/n-lexer.js', 'automatium/n-parser.js', 'automatium/n-runtime.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context, { filename: file });
}
const math = vm.runInContext('NumberMath', context);

test('nested exponents accept every exact-digit-string exponent size up to the scientific boundary', () => {
  for (let exponent = 0; exponent <= 35; exponent++) {
    const input = `1e1e${exponent}`;
    const actual = math.fromString(input, null);
    assert.notEqual(actual, null, input);
    assert.equal(math.isZero(actual), false, input);
    assert.equal(math.compare(actual, math.powerOfTen(math.fromString(`1e${exponent}`))), 0, input);
  }
});

test('nested fractional mantissas and explicit positive signs preserve the parsed exponent value', () => {
  for (const exponent of ['3.25e20', '+1e20', '1.23456789012345e32', '.25e18', '1e0', '0e20']) {
    for (const mantissa of ['1', '2.5']) {
      const actual = math.fromString(`${mantissa}e${exponent}`, null);
      const expected = math.multiply(math.fromString(mantissa), math.powerOfTen(math.fromString(exponent)));
      assert.notEqual(actual, null, `${mantissa}e${exponent}`);
      assert.equal(math.compare(actual, expected), 0, `${mantissa}e${exponent}`);
    }
  }
});

test('multiple nested levels and negative exponents remain ordered and nonzero', () => {
  for (const input of ['1e1e1e16', '1e3.25e1e20', '1e-1e20', '1e-1e1e20', '1e1e-20']) {
    const parsed = math.fromString(input, null);
    assert.notEqual(parsed, null, input);
    assert.equal(math.isPositive(parsed), true, input);
    const restored = math.fromString(math.serialize(parsed), null);
    assert.equal(math.compare(parsed, restored), 0, input);
  }
  assert.equal(math.compare(math.fromString('1e1e1e16'), math.fromString('1e1e16')), 1);
  assert.equal(math.compare(math.fromString('1e-1e20'), math.fromString('1e-1e16')), -1);
});

test('generic save fields and canonical serialization accept the same nested magnitude', () => {
  for (const input of ['1e1e15', '1e1e20', '2.5e3.25e32', '1e1e1000']) {
    const expected = math.fromString(input, null);
    const restored = vm.runInContext(`numberValueFromSave(${JSON.stringify(input)}, null)`, context);
    assert.notEqual(restored, null, input);
    assert.equal(math.compare(restored, expected), 0, input);
    const json = JSON.parse(JSON.stringify(restored));
    assert.equal(math.compare(math.fromValue(json), expected), 0, input);
    vm.runInContext(`setBaseNumberFromSave(${JSON.stringify(input)})`, context);
    assert.equal(math.compare(vm.runInContext('getBaseNumber()', context), expected), 0, input);
    assert.equal(math.compare(math.fromString(math.serialize(expected)), expected), 0, input);
  }
  assert.equal(math.compare(math.fromString('1e1e20'), math.fromString('1e100000000000000000000')), 0);
});

test('N executes nested literals in assignments, arithmetic, comparisons and SP targets', () => {
  const result = vm.runInContext(`(() => {
    const targets = [];
    const adapter = {
      square: (_statement, amount) => { targets.push(amount); return true; }
    };
    const source = 'value = number\\nvalue = 1e1e20\\n'
      + 'same = boolean\\nsame = value == 1e100000000000000000000\\n'
      + 'scaled = number\\nscaled = value ^ 2\\n'
      + 'larger = boolean\\nlarger = scaled > value\\n'
      + 'sp 1e1e20';
    const execution = NRuntime.createExecution(NRuntime.compile(source), adapter);
    let done = false;
    for (let index = 0; index < 100; index++) {
      if (execution.iterator.next().done) { done = true; break; }
    }
    const values = execution.context.variables;
    return {done, positive: NumberMath.isPositive(values.get('value').value),
      same: values.get('same').value, larger: values.get('larger').value,
      targetCount: targets.length, targetEqual: NumberMath.compare(targets[0], values.get('value').value) === 0};
  })()`, context);
  assert.deepEqual({ ...result }, { done: true, positive: true, same: true, larger: true, targetCount: 1, targetEqual: true });
});

test('invalid nested input still returns the supplied fallback and cannot become a neutral exponent', () => {
  for (const input of ['1efoo', '1e1e', '1e1efoo', '1e+1efoo', '1e-1efoo', '1ee20', '1e1eNaN', '1e1eInfinity']) {
    assert.equal(math.fromString(input, null), null, input);
    assert.equal(math.fromString(input, 123), 123, input);
  }
  assert.equal(math.serialize(math.fromString('1e0e20')), '1');
});

test('input length and recursion limits remain bounded after accepting digit-string exponents', () => {
  const tooDeep = `1e${'1e'.repeat(70)}20`;
  const tooLong = `1e${'1'.repeat(5000)}`;
  assert.equal(math.fromString(tooDeep, null), null);
  assert.equal(math.fromString(tooLong, null), null);
  assert.doesNotThrow(() => math.fromString(tooDeep));
  assert.doesNotThrow(() => math.fromString(tooLong));
});
