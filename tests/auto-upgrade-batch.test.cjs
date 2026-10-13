const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/auto-upgrades.js'), 'utf8');
const context = vm.createContext({
  gameClockNowMs: () => 0,
  gameTick: elapsedMs => elapsedMs * 10000,
  autoUpgradeSpeedMultiplier: () => 1,
  setInterval: () => 0
});
vm.runInContext(`${source}\n;globalThis.batchSize = automaticUpgradeBatchSizeForElapsed;`, context);

test('keeps the normal automatic upgrade batch capped at 256', () => {
  assert.equal(context.batchSize(50), 256);
});

test('keeps the regular batch tied to elapsed game time', () => {
  context.gameTick = elapsedMs => elapsedMs;
  assert.equal(context.batchSize(50), 1);
});
