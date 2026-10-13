const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const context = vm.createContext({ performance: { now: () => 0 } });
for (const file of ['constants.js', 'number-math.js', 'state.js']) {
  const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
  vm.runInContext(source, context, { filename: file });
}
vm.runInContext(`percentUnlocked = true; globalThis.probe = {
  finalGain: finalNumberProductionGain,
  fromString: NumberMath.fromString,
  serialize: NumberMath.serialize,
  compare: NumberMath.compare,
  multiply: NumberMath.multiply
};`, context);

function serializedGain(baseGain, multiplier, currentValue) {
  return context.probe.finalGain(
    baseGain,
    multiplier,
    context.probe.fromString(currentValue),
    1,
    0
  );
}

test('number multiplier applies to final production below the softcap', () => {
  const base = serializedGain(1000, 1, '1e11');
  const doubled = serializedGain(1000, 2, '1e11');

  assert.equal(context.probe.serialize(base), '1000');
  assert.equal(context.probe.serialize(doubled), '2000');
});

test('number multiplier preserves its exact ratio after softcap attenuation', () => {
  const base = serializedGain(1000, 1, '1e13');
  const doubled = serializedGain(1000, 2, '1e13');

  assert.equal(context.probe.serialize(base), '10');
  assert.equal(context.probe.serialize(doubled), '20');
  assert.equal(context.probe.compare(doubled, context.probe.multiply(base, 2)), 0);
});
