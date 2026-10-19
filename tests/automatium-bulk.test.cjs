const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');
const adapterEnd = source.indexOf('\n};\n\nfunction automatiumGameAdapterFor');
assert.ok(adapterEnd > 0, 'N game adapter should be present');

function makeContext() {
  const context = vm.createContext({
    document: { getElementById: () => ({}) },
    localStorage: { getItem: () => '[]' },
    clock: 0,
    gameClockNowMs: () => context.clock,
    gameTimelineNowMs: () => context.clock,
    hasGeneralizationResearch: () => true,
    compareNumberValues: (left, right) => left === right ? 0 : left > right ? 1 : -1,
    getBaseNumber: () => 1000000,
    squarePoints: 1000000,
    squareConvergencePoints: 1000000,
    theory: 1000000
  });
  vm.runInContext(`${source.slice(0, adapterEnd + 4)}\n;globalThis.adapter = automatiumGameAdapter;`, context);
  vm.runInContext('automatiumBulkRemaining = AUTOMATIUM_BULK_MAX_PER_TICK; automatiumBulkDeadline = 12;', context);
  return context;
}

test('N buys in bounded commands and continues until upgrades become unaffordable', () => {
  const context = makeContext();
  vm.runInContext('globalThis.purchases = 0; globalThis.snapshots = 0; '
    + 'nUpgradeSnapshot = () => { snapshots++; return { '
    + 'available: purchases < 1500, upgraded: purchases, cost: purchases + 1, max: 0, '
    + 'buy: () => { if (purchases >= 1500) return false; purchases++; return true; } }; };', context);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), true);
  assert.equal(context.purchases, 512);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), true);
  assert.equal(context.purchases, 1024);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), true);
  assert.equal(context.purchases, 1500);
  assert.ok(context.snapshots < 1500);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), false);
});

test('N yields bulk buying at the time budget and resumes on the next tick', () => {
  const context = makeContext();
  vm.runInContext('globalThis.purchases = 0; nUpgradeSnapshot = () => ({ '
    + 'available: true, upgraded: purchases, cost: purchases + 1, max: 0, '
    + 'buy: () => { purchases++; clock += 0.1; return true; } });', context);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), true);
  assert.ok(context.purchases >= 120 && context.purchases <= 124);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), false);
  vm.runInContext('automatiumBulkRemaining = AUTOMATIUM_BULK_MAX_PER_TICK; automatiumBulkDeadline = clock + 12;', context);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), true);
  assert.ok(context.purchases >= 240 && context.purchases <= 248);
});

test('N rechecks one-time upgrades after a purchase', () => {
  const context = makeContext();
  vm.runInContext('globalThis.purchases = 0; globalThis.snapshots = 0; '
    + 'nUpgradeSnapshot = () => { snapshots++; return { '
    + 'available: purchases === 0, upgraded: purchases, cost: 1, max: 1, '
    + 'buy: () => { purchases++; return true; } }; };', context);
  assert.equal(context.adapter.buy('square_convergence', 'automatium', null, null), true);
  assert.equal(context.purchases, 1);
  assert.equal(context.snapshots, 2);
});

test('N stops if an unlimited price and its currency both stop changing', () => {
  const context = makeContext();
  vm.runInContext('globalThis.purchases = 0; '
    + 'nUpgradeSnapshot = () => ({ available: true, upgraded: purchases, cost: 1, max: 0, '
    + 'buy: () => { purchases++; return true; } });', context);
  assert.equal(context.adapter.buy('base', 'percent_power', null, null), true);
  assert.equal(context.purchases, 16);
});

test('N resolves percent parallelization aliases to the percent lane unlock', () => {
  const context = makeContext();
  vm.runInContext(`
    globalThis.percentUnlocked = true;
    globalThis.percentLaneCount = 1;
    globalThis.nextPercentLaneUnlockCost = 200000;
    globalThis.overflowed = false;
    globalThis.discountedCost = value => value;
    globalThis.percentLaneLimit = () => 8;
    globalThis.canAffordBaseCost = () => true;
    globalThis.numberValueFromReal = value => value;
    globalThis.unlockCalls = 0;
    globalThis.unlockNextPercentLane = () => { unlockCalls++; return true; };
  `, context);

  for (const alias of ['percent_line', 'percent_parallel', 'percent_parallelization', 'percent_lane']) {
    const snapshot = context.nBaseUpgradeSnapshot(alias, null);
    assert.equal(snapshot.available, true, `${alias} should be available`);
    assert.equal(snapshot.cost, 200000);
    assert.equal(snapshot.buy(), true, `${alias} should invoke the lane purchase`);
  }
  assert.equal(context.unlockCalls, 4);
});

test('the all-base example keeps lane purchases from being immediately reset by SP exchange', () => {
  const context = makeContext();
  const exampleStart = source.indexOf('function automatiumProgramExamplesList()');
  const exampleEnd = source.indexOf('\nfunction addAutomatiumExample', exampleStart);
  assert.ok(exampleStart >= 0 && exampleEnd > exampleStart, 'all-base example generator should be present');
  vm.runInContext(source.slice(exampleStart, exampleEnd), context);
  context.MAX_PERCENT_LANES = 1;
  context.SQUARE_UPGRADES = [];
  context.SQUARE_BREAKTHROUGH_UPGRADES = [];
  context.SQUARE_CONVERGENCE_UPGRADES = [];
  const example = context.automatiumProgramExamplesList().find(item => item.id === 'all_base');

  assert.match(example.source, /buy base percent_line/);
  assert.doesNotMatch(example.source, /^\s*square\s*$/m);
});
