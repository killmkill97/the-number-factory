const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gameContext() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext("render=()=>{};extraPercentLanesEl={innerHTML:''};", context);
  return context;
}

function run(source, context = gameContext()) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, context)));
}

test('overflow uses the fixed logarithmic balance, with one at zero and four at 100k', () => {
  const result = run(`
    return [0, 1, 100, 10000, 100000, 1000000, 10000000].map(O => ({
      O, M: NumberMath.toNumber(knuthPercentOverflowMultiplier(O))
    }));
  `);
  for (const { O, M } of result) {
    assert.ok(Math.abs(M - (1 + 3 * Math.log2(1 + O / 100000))) < 1e-12);
  }
  assert.equal(result[0].M, 1);
  assert.ok(Math.abs(result[4].M - 4) < 1e-12);
});

test('equal overflow increments give diminishing gains, without a cliff or a hard cap', () => {
  const values = run(`return [0,100000,200000,300000,400000].map(O => NumberMath.toNumber(knuthPercentOverflowMultiplier(O)));`);
  const increments = values.slice(1).map((value, index) => value - values[index]);
  assert.ok(increments.every(increment => increment > 0));
  assert.ok(increments.slice(1).every((increment, index) => increment < increments[index]));
  assert.ok(values[4] > 4);
});

test('overflow multiplies actual SP and CP rewards once and only while equipped', () => {
  const result = run(`
    setBaseNumber(NumberMath.fromString('1e60000'));
    generalizationResearchState['5-2'] = true;
    squarePoints = NumberMath.fromString('1e50');
    squareRunGameSeconds = 100;
    knuthEquippedUpgradeIds.add('knuth_time_gain');
    abstractionResearchState['12-2'] = true;
    knuthPercentOverflow = 100000;
    const beforeSp = squarePointGain();
    const beforeCp = squareConvergencePointGain();
    const number = NumberMath.serialize(getBaseNumber());
    knuthEquippedUpgradeIds.add('percent_overflow');
    const spRatio = NumberMath.toNumber(NumberMath.divideApproximate(squarePointGain(), beforeSp));
    const cpRatio = NumberMath.toNumber(NumberMath.divideApproximate(squareConvergencePointGain(), beforeCp));
    knuthEquippedUpgradeIds.delete('percent_overflow');
    return { spRatio, cpRatio, amount: knuthPercentOverflow,
      unchangedNumber: NumberMath.serialize(getBaseNumber()) === number,
      unequippedSp: compareNumberValues(squarePointGain(), beforeSp) === 0,
      unequippedCp: compareNumberValues(squareConvergencePointGain(), beforeCp) === 0 };
  `);
  assert.ok(Math.abs(result.spRatio - 4) < 1e-10);
  assert.ok(Math.abs(result.cpRatio - 4) < 1e-10);
  assert.deepEqual({ ...result, spRatio: 4, cpRatio: 4 }, {
    spRatio: 4, cpRatio: 4, amount: 100000, unchangedNumber: true, unequippedSp: true, unequippedCp: true
  });
});

test('overflow accumulation still counts only new purchases above the cap and resets only on a new Knuth run', () => {
  assert.deepEqual(run(`
    grantPercentPower(1000, 0, 1000);
    const beforeEquip = knuthPercentOverflow;
    knuthEquippedUpgradeIds.add('percent_overflow');
    knuthEquippedUpgradeIds.add('percent_cap_200');
    grantPercentPower(199, 0, 199);
    const atCap = knuthPercentOverflow;
    grantPercentPower(200, 0, 200);
    grantPercentPower(500, 0, 500);
    const afterPurchases = knuthPercentOverflow;
    resetRunStateAfterSquarePrestige();
    const afterSquare = knuthPercentOverflow;
    resetProgressForNewKnuthRun();
    return { beforeEquip, atCap, afterPurchases, afterSquare, afterKnuth: knuthPercentOverflow };
  `), { beforeEquip: 0, atCap: 0, afterPurchases: 2, afterSquare: 2, afterKnuth: 0 });
});

test('layered overflow values stay positive and the existing save representation round-trips unchanged', () => {
  const context = gameContext();
  const source = fs.readFileSync(path.join(__dirname, '../scripts/core/save.js'), 'utf8');
  vm.runInContext(source.slice(source.indexOf('function serializeKnuthContinuousValue('), source.indexOf('function loadPersistedSaveStats(')), context);
  const result = run(`
    return ['0','100000','1e1000','1e1e1000'].map(text => {
      knuthPercentOverflow = NumberMath.fromString(text);
      const before = knuthPercentOverflowMultiplier();
      const encoded = JSON.parse(JSON.stringify(serializeKnuthContinuousValue(knuthPercentOverflow)));
      knuthPercentOverflow = loadKnuthContinuousValue(encoded);
      return { same: compareNumberValues(knuthPercentOverflow, NumberMath.fromString(text)) === 0,
        sameBonus: compareNumberValues(before, knuthPercentOverflowMultiplier()) === 0,
        valid: compareNumberValues(before, 1) >= 0, serialized: NumberMath.serialize(before) };
    });
  `, context);
  for (const entry of result) {
    assert.equal(entry.same, true);
    assert.equal(entry.sameBonus, true);
    assert.equal(entry.valid, true);
    assert.doesNotMatch(entry.serialized, /NaN|undefined|Infinity/);
  }
});

test('card, help and graph describe the same overflow multiplier', () => {
  const chapter = fs.readFileSync(path.join(__dirname, '../scripts/chapters/knuth.js'), 'utf8');
  const help = fs.readFileSync(path.join(__dirname, '../scripts/systems/formula-help.js'), 'utf8');
  const generator = fs.readFileSync(path.join(__dirname, '../tools/generate-formula-graphs.mjs'), 'utf8');
  assert.match(chapter, /const multiplier = knuthPercentOverflowMultiplier\(\)/);
  assert.match(help, /SP \/ CP 배율 = 1 \+ A × log₂\(1 \+ O \/ B\)/);
  assert.match(help, /A = 3, B = 100000/);
  assert.match(generator, /evaluate: overflow => 1 \+ 3 \* Math\.log2\(1 \+ overflow \/ 100000\)/);
});
