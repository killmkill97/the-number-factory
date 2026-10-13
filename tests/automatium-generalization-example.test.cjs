const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function context() {
  const game = vm.createContext({
    performance: { now: () => 0 },
    document: { getElementById: () => ({}) }
  });
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js',
    'automatium/n-lexer.js', 'automatium/n-parser.js', 'automatium/n-runtime.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), game);
  }
  const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');
  const adapterEnd = source.indexOf('\n};\n\nfunction automatiumGameAdapterFor');
  vm.runInContext(source.slice(0, adapterEnd + 4), game);
  vm.runInContext(source.slice(source.indexOf('function automatiumProgramExamplesList()'),
    source.indexOf('\nfunction addAutomatiumExample')), game);
  vm.runInContext(`
    render = () => {};
    log = () => {};
    fmt = value => String(value);
    hasEverEarnedSquareConvergencePoint = true;
    squareConvergenceUnlocked = true;
    let prestigeCalls = 0;
    beginKnuthPrestige = () => { prestigeCalls++; };
    const example = automatiumProgramExamplesList().find(item => item.id === 'generalization_to_knuth');
    const execution = NRuntime.createExecution(NRuntime.compile(example.source), automatiumGameAdapter);
    function step() {
      automatiumBulkRemaining = 2048;
      automatiumBulkDeadline = 1000;
      return execution.iterator.next();
    }
    function finish() {
      for (let i = 0; i < 10000; i++) {
        const result = step();
        if (result.value?.kind === 'blocked') throw Error('Unexpected blocking purchase');
        if (result.done) return true;
      }
      return false;
    }
  `, game);
  return game;
}

test('generalization example buys exactly the 8-1 prerequisite closure and stops', () => {
  const game = context();
  const result = vm.runInContext(`(() => {
    squarePoints = NumberMath.fromString('1e1000');
    squareConvergencePoints = NumberMath.fromString('1e80');
    const done = finish();
    const required = new Set();
    function visit(id) {
      const research = GENERALIZATION_RESEARCHES.find(item => item.id === id);
      research.parents.forEach(visit);
      required.add(id);
    }
    visit('8-1');
    return JSON.stringify({done,prestigeCalls,theoryPurchased:totalTheoryPurchased,
      actual:GENERALIZATION_RESEARCHES.filter(item => generalizationResearchState[item.id]).map(item=>item.id).sort(),
      required:[...required].sort()});
  })()`, game);
  const data = JSON.parse(result);
  assert.equal(data.done, true);
  assert.equal(data.prestigeCalls, 1);
  assert.ok(data.theoryPurchased > 0);
  assert.deepEqual(data.actual, data.required);
});

test('insufficient currencies do not block theory purchases and either SP or CP can resume progress', () => {
  for (const currency of ['squarePoints', 'squareConvergencePoints']) {
    const game = context();
    assert.equal(vm.runInContext(`(() => {
      for (let i=0;i<50;i++) {
        const result=step();
        if (result.done || result.value?.kind === 'blocked') return false;
      }
      return totalTheoryPurchased === 0;
    })()`, game), true);
    vm.runInContext(`${currency}=NumberMath.fromString('${currency === 'squarePoints' ? '1e1000' : '1e80'}');`, game);
    assert.equal(vm.runInContext('finish()', game), true);
    assert.equal(vm.runInContext("generalizationResearchState['8-1']", game), true);
  }
});

test('existing theory and partial research are reused without extra purchases or automatic prestige after the first Knuth', () => {
  const game = context();
  vm.runInContext(`
    hasClaimedKnuthPoint = true;
    theory = 1000;
    generalizationResearchState['1-1'] = true;
    generalizationResearchState['2-1'] = true;
  `, game);
  assert.equal(vm.runInContext('finish()', game), true);
  assert.equal(vm.runInContext('totalTheoryPurchased', game), 0);
  assert.equal(vm.runInContext('prestigeCalls', game), 0);
  assert.equal(vm.runInContext("generalizationResearchState['8-1']", game), true);
});
