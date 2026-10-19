const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const { operationPriceLog } = require('./helpers/knuth-prices.cjs');

function consoleGame() {
  const context = game();
  context.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/systems/dev-console.js'), 'utf8'));
  return context;
}

test('knuth_slot command updates capacity and rendered derived price without spending KP', () => {
  const rows = run(consoleGame(), `
    knuthPoints = 123;
    let renderedCapacity, renderedPrice;
    render = () => { renderedCapacity = knuthSlotCapacity(); renderedPrice = knuthOperationUpgradeCost(); };
    return ['0', '19', '20', '21', '64', '1,000', '1e6'].map(input => {
      runDevCommand('set knuth_slot ' + input);
      return { slots: knuthSlotCapacity(), renderedCapacity,
        priceLog: numberLog10(renderedPrice), kp: NumberMath.toNumber(knuthPoints) };
    });
  `);
  assert.deepEqual(rows.map(row => row.slots), [0, 19, 20, 21, 64, 1000, 1000000]);
  for (const row of rows) {
    assert.equal(row.renderedCapacity, row.slots);
    assert.equal(row.kp, 123);
    const expected = operationPriceLog(row.slots);
    assert.ok(Math.abs(row.priceLog - expected) < 1e-8, JSON.stringify(row));
  }
});

test('normal purchases after setting slots use the correct price around the growth boundary', () => {
  for (const slots of [18, 19, 20, 64, 99, 100, 199, 200, 299]) {
    const result = run(consoleGame(), `
      runDevCommand('set knuth_slot ${slots}');
      const cost = knuthOperationUpgradeCost();
      knuthPoints = cost;
      const bought = buyKnuthOperationUpgrade();
      return { bought, slots: knuthSlotCapacity(), kp: NumberMath.toNumber(knuthPoints),
        nextRatio: NumberMath.toNumber(NumberMath.divideApproximate(knuthOperationUpgradeCost(), cost)) };
    `);
    assert.deepEqual(result, { bought: true, slots: slots + 1, kp: 0, nextRatio: slots < 99 ? 2 : slots < 199 ? 4 : 8 });
  }
});

test('invalid slot counts leave capacity, equipment, currency and unlocks unchanged', () => {
  const result = run(consoleGame(), `
    knuthOperationLevel = 20;
    knuthPoints = 123;
    knuthEquippedUpgradeIds.add('knuth_time_gain');
    const snapshot = () => JSON.stringify([knuthOperationLevel, knuthPoints, [...knuthEquippedUpgradeIds],
      knuthUnlocked, hasClaimedKnuthPoint, pendingKnuthPointClaim]);
    const before = snapshot();
    const rejected = ['-1', '1.5', 'NaN', 'Infinity', '1e20', '1e10000', '9007199254740992'].map(input => {
      try { runDevCommand('set knuth_slot ' + input); return false; }
      catch { return snapshot() === before; }
    });
    return rejected;
  `);
  assert.deepEqual(result, Array(7).fill(true));
});

test('lowering capacity removes only the most recently equipped upgrades needed to fit', () => {
  const result = run(consoleGame(), `
    knuthPoints = 123;
    for (const id of ['knuth_time_gain', 'percent_softcap_square', 'percent_gain_square']) {
      knuthEquippedUpgradeIds.add(id);
    }
    runDevCommand('set knuth_slot 3');
    const kept = [...knuthEquippedUpgradeIds];
    runDevCommand('set knuth_slot 0');
    return { kept, remaining: [...knuthEquippedUpgradeIds], used: knuthSlotsUsed(),
      slots: knuthSlotCapacity(), price: NumberMath.toNumber(knuthOperationUpgradeCost()),
      kp: NumberMath.toNumber(knuthPoints), unlocked: knuthUnlocked };
  `);
  assert.deepEqual(result, { kept: ['knuth_time_gain', 'percent_softcap_square'], remaining: [],
    used: 0, slots: 0, price: 1, kp: 123, unlocked: true });
});

test('console-set slots and their price survive the existing save/load path', () => {
  const result = run(consoleGame(), `
    knuthPoints = 123;
    runDevCommand('set knuth_slot 64');
    knuthEquippedUpgradeIds.add('percent_gain_square');
    const price = NumberMath.serialize(knuthOperationUpgradeCost());
    saveGame();
    const saved = localStorage.getItem(SAVE_KEY);
    runDevCommand('set knuth_slot 0');
    loadGame(saved, { countAsLoad: false });
    return { slots: knuthSlotCapacity(), kp: NumberMath.toNumber(knuthPoints),
      equipped: hasKnuthUpgrade('percent_gain_square'),
      priceRestored: NumberMath.serialize(knuthOperationUpgradeCost()) === price, errors };
  `);
  assert.deepEqual(result, { slots: 64, kp: 123, equipped: true, priceRestored: true, errors: [] });
});
