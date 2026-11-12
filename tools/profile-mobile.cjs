const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const { game, run } = require('../tests/helpers/kc4-game.cjs');

const context = game(true);
const file = process.argv[2];
let input;
if (file) {
  input = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
} else {
  input = JSON.stringify(run(context, `
    const data=captureGameSaveData();data.divergerALevel=417430;data.divergerBLevel=184716;
    data.divergerA=NumberMath.serialize(NumberMath.power(2,data.divergerALevel));
    data.divergerB=1+data.divergerBLevel*.2;
    data.divergerACpCost=NumberMath.serialize(divergerACpCostAtLevel(data.divergerALevel));
    data.divergerBCpCost=NumberMath.serialize(divergerBCpCostAtLevel(data.divergerBLevel));
    data.divergerUpgradeHistory={a:Array(data.divergerALevel).fill(true),b:Array(data.divergerBLevel).fill(true)};
    return data;
  `));
}

context.input = input;
const start = performance.now();
if (!run(context, 'return loadGame(input,{persistOverride:false,countAsLoad:false});')) {
  throw new Error(`Load failed: ${context.errors.join(', ')}`);
}
const loadMs = performance.now() - start;
const compact = run(context, 'return captureGameSaveData();');
const rawData = JSON.parse(input);
const old = { ...compact, divergerUpgradeHistory: rawData.divergerUpgradeHistory };
function average(operation) {
  operation();
  const start = performance.now();
  for (let index = 0; index < 10; index++) operation();
  return (performance.now() - start) / 10;
}
const report = {
  environment: 'isolated VM, frozen game clocks and stub DOM; not a phone or cloud test',
  source: file ? 'provided save' : 'synthetic legacy save',
  legacyBytes: Buffer.byteLength(JSON.stringify(rawData)),
  compactBytes: Buffer.byteLength(JSON.stringify(compact)),
  loadMs,
  legacySerializeMs: average(() => JSON.stringify(old)),
  compactSerializeMs: average(() => JSON.stringify(compact)),
  captureAndSerializeMs: average(() => context.loadSource('JSON.stringify(captureGameSaveData())')),
  history: run(context, 'return Object.fromEntries(Object.entries(divergerUpgradeHistory).map(([kind,h])=>[kind,{entries:h.length,runs:h.runs.length}]));'),
  errors: context.errors
};
report.reductionPercent = 100 * (1 - report.compactBytes / report.legacyBytes);
console.log(JSON.stringify(report, null, 2));
