const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createGameContext() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context);
  }
  return context;
}

test('recovers nonzero diverger parameters saved as zero scientific notation', () => {
  const context = createGameContext();
  vm.runInContext(
    'globalThis.values = { '
      + 'a: NumberMath.serialize(divergerNumberValueFromSave("0e0", 1)), '
      + 'n: NumberMath.serialize(divergerNumberValueFromSave("0e0", 1)), '
      + 'power: NumberMath.serialize(divergerNumberValueFromSave("0e0", 0)) };',
    context
  );

  assert.equal(context.values.a, '1');
  assert.equal(context.values.n, '1');
  assert.equal(context.values.power, '0');
});

test('diverger accumulates its first production ticks from zero power', () => {
  const context = createGameContext();
  vm.runInContext(
    'generalizationResearchState["3-2"] = true; '
      + 'divergerA = divergerNumberValueFromSave("0e0", 1); '
      + 'divergerN = divergerNumberValueFromSave("0e0", 1); '
      + 'divergerPower = divergerNumberValueFromSave("0e0", 0); '
      + 'overflowed = false; divergerTimer = 0; '
      + 'advanceDiverger(1000); '
      + 'globalThis.result = NumberMath.serialize(divergerPower);',
    context
  );

  assert.equal(context.result, '2e-2');

  vm.runInContext(
    'divergerA = 0; globalThis.zeroAProduction = NumberMath.serialize(divergerProductionValue(2));',
    context
  );
  assert.equal(context.zeroAProduction, '2e-2');
});
