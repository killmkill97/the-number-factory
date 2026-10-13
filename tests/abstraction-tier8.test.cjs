const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function context() {
  const game = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), game);
  }
  vm.runInContext('render = () => {}; knuthUnlocked = true;', game);
  return game;
}

function run(source) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, context())));
}

test('tier 8 researches require 7-1, charge 4/5 Great Theory, and are independent of branch choice', () => {
  assert.deepEqual(run(`
    greatTheory = 9;
    const locked = ['8-1','8-2'].map(canResearchAbstraction);
    abstractionResearchState['7-1'] = true;
    abstractionResearchState['4-1'] = true;
    const bought = ['8-1','8-2'].map(researchAbstraction);
    return {locked,bought,balance:NumberMath.toNumber(greatTheory),
      repeated:['8-1','8-2'].map(researchAbstraction)};
  `), {locked:[false,false],bought:[true,true],balance:0,repeated:[false,false]});
  assert.deepEqual(run(`
    abstractionResearchState['7-1'] = true; greatTheory = 3;
    return ['8-1','8-2'].map(researchAbstraction);
  `), [false,false]);
});

test('improved KP formula preserves first claim, minimum one, flooring, and existing multiplier order', () => {
  assert.deepEqual(run(`
    abstractionResearchState['8-1'] = true;
    squareConvergencePoints = NumberMath.fromString('1e150');
    const first = NumberMath.toNumber(knuthPointGain());
    hasClaimedKnuthPoint = true;
    const values = ['0','1','1e15','1e20','1e30','1e45','1e150'].map(cp => {
      squareConvergencePoints = NumberMath.fromString(cp);
      return NumberMath.toNumber(knuthPointGain());
    });
    squareConvergencePoints = NumberMath.fromString('1e20');
    knuthBaseUpgradeLevels.kp_gain = 2;
    const boosted = NumberMath.toNumber(knuthPointGain());
    abstractionResearchState['8-1'] = false;
    squareConvergencePoints = NumberMath.fromString('1e45');
    const old = NumberMath.toNumber(knuthPointGain());
    return {first,values,boosted,old};
  `), {first:1,values:[1,1,1,2,10,100,1000000000],boosted:50,old:75});
});

test('improved KP formula handles CP beyond native number range', () => {
  const result = run(`
    hasClaimedKnuthPoint = true; abstractionResearchState['8-1'] = true;
    squareConvergencePoints = NumberMath.fromString('1e6000');
    return {positive:isPositiveNumberValue(knuthPointGain()),log:NumberMath.toNumber(NumberMath.log10(knuthPointGain()))};
  `);
  assert.equal(result.positive, true);
  assert.ok(Math.abs(result.log - 399) < 1e-10);
});

test('8-2 raises the final softened percent gain to power 4 without changing other production', () => {
  const data = run(`
    percentUnlocked = true;
    const results = [];
    for (const value of ['10000','1e13']) {
      setBaseNumber(NumberMath.fromString(value));
      const before = getBaseNumber();
      const raw = percentUseGain(before, 1);
      const softened = finalNumberProductionGain(raw, 1, before, 1, 0);
      abstractionResearchState['8-2'] = true;
      const expected = addBaseNumbers(before, NumberMath.power(softened,4));
      const one = percentUseValueAfterOne(before,1,0);
      applyPercentUse(before,1,'test-percent',0);
      results.push([compareNumberValues(one,expected),compareNumberValues(getBaseNumber(),expected)]);
      abstractionResearchState['8-2'] = false;
    }
    abstractionResearchState['8-2'] = true;
    return {results,otherGain:NumberMath.toNumber(finalNumberProductionGain(1000,1,NumberMath.fromString('1e13'),1,0))};
  `);
  assert.deepEqual(data, {results:[[0,0],[0,0]],otherGain:10});
});

test('powered bulk processing matches sequential production across the softcap and both decay strengths', () => {
  for (const strength of [1,2]) {
    for (const start of [90,100,120]) {
      const data = run(`
        percentUnlocked = true; abstractionResearchState['8-2'] = true;
        percentPowerSoftcap = () => 100;
        percentPowerSoftcapDecayPower = () => ${strength};
        percentUseGain = value => multiplyNumberValue(value,0.01);
        let sequential = ${start};
        for (let i=0;i<1000;i++) sequential = percentUseValueAfterOne(sequential,1,0);
        setBaseNumber(${start});
        applyPercentUsesBatch(1,1000,'bulk-test',0);
        return {sequential:NumberMath.toNumber(sequential),bulk:NumberMath.toNumber(getBaseNumber())};
      `);
      assert.ok(Math.abs(data.bulk / data.sequential - 1) < 0.01, JSON.stringify({strength,start,...data}));
    }
  }
});

test('huge powered batches stay bounded and do not use the old linear-gain approximation', () => {
  const result = run(`
    percentUnlocked = true; abstractionResearchState['8-2'] = true;
    percentPowerSoftcap = () => 100;
    let calls = 0;
    percentUseGain = value => {calls++; return multiplyNumberValue(value,0.01);};
    setBaseNumber(100);
    applyPercentUsesBatch(1,1e100,'huge-bulk',0);
    return {calls,log:NumberMath.toNumber(NumberMath.log10(getBaseNumber()))};
  `);
  assert.ok(result.calls < 100);
  assert.ok(result.log > 21 && result.log < 23);
});

test('new research flags round-trip, survive Knuth reset, and default to false in old saves', () => {
  assert.deepEqual(run(`
    abstractionResearchState['8-1'] = true; abstractionResearchState['8-2'] = true;
    const saved = JSON.parse(JSON.stringify({...abstractionResearchState}));
    loadAbstractionResearchState(saved);
    const restored = ['8-1','8-2'].map(hasAbstractionResearch);
    extraPercentLanesEl = {innerHTML:''};
    resetProgressForNewKnuthRun();
    const retained = ['8-1','8-2'].map(hasAbstractionResearch);
    loadAbstractionResearchState({'7-1':true});
    return {restored,retained,legacy:['8-1','8-2'].map(hasAbstractionResearch)};
  `), {restored:[true,true],retained:[true,true],legacy:[false,false]});
});
