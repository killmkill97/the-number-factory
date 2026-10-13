const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const root = path.join(__dirname, '..');
const context = vm.createContext({ performance });
for (const file of ['constants.js', 'number-math.js', 'state.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'scripts/core', file), 'utf8'), context, { filename: file });
}
vm.runInContext(`
  render = () => {};
  extraPercentLanesEl = { innerHTML: '' };
  percentUnlocked = true;
  squareUnlocked = true;
  for (const id of ['1-1','3-1','4-2','5-2','6-2','8-2','9-2']) abstractionResearchState[id] = true;
  for (const id of ['1-1','3-1','3-3','4-2','5-1','5-3','5-4','6-1','6-2','7-1']) generalizationResearchState[id] = true;
  for (const upgrade of SQUARE_UPGRADES) squareUpgradeState[upgrade.id] = true;
  for (const upgrade of SQUARE_BREAKTHROUGH_UPGRADES) squareBreakthroughLevels[upgrade.id] = upgrade.max;
  for (const dimension of squareDimensionStates) {
    dimension.x = NumberMath.fromString('1e1000');
    dimension.y = NumberMath.fromString('1e900');
    dimension.z = NumberMath.fromString('1e800');
  }
  divergerPower = NumberMath.fromString('1e1000');
  squarePoints = NumberMath.fromString('1e1000');
  const profileCalls = {};
  for (const name of ['squareDimensionNumberMultiplier','squareDimensionTotalPower','percentPowerSoftcap','percentUseGain']) {
    const original = globalThis[name];
    globalThis[name] = (...args) => { profileCalls[name] = (profileCalls[name] ?? 0) + 1; return original(...args); };
  }
  function workload() {
    setBaseNumber(NumberMath.fromString('1e2000000'));
    const process = () => {
      for (let lane = 0; lane < 16; lane++) applyPercentUsesBatch(10000 + lane, 1e12, 'benchmark', 20);
    };
    if (typeof withPercentProductionCache === 'function') withPercentProductionCache(process);
    else process();
    return NumberMath.serialize(getBaseNumber());
  }
`, context);

for (let i = 0; i < 3; i++) vm.runInContext('workload()', context);
vm.runInContext('for (const key of Object.keys(profileCalls)) profileCalls[key] = 0;', context);
const times = [];
let value;
for (let index = 0; index < 12; index++) {
  const start = performance.now();
  value = vm.runInContext('workload()', context);
  times.push(performance.now() - start);
}
times.sort((a, b) => a - b);
const calls = JSON.parse(vm.runInContext('JSON.stringify(profileCalls)', context));
const result = { medianMs: times[Math.floor(times.length / 2)], minMs: times[0], maxMs: times.at(-1), calls, value };
console.log(JSON.stringify(result, null, 2));
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2));
