const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const uiSource = fs.readFileSync(path.join(__dirname, '../scripts/systems/square-convergence.js'), 'utf8');

function run(source) {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context);
  }
  vm.runInContext(`let testNow=1000000;Date.now=()=>testNow;knuthRunStartedAtMs=testNow;
    fmt=value=>String(NumberMath.toNumber(value));`, context);
  vm.runInContext(uiSource.slice(uiSource.indexOf('function abstractionLiveValueText'),
    uiSource.indexOf('function updateAbstractionTimeResearchUi')), context);
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${source}})()`, context)));
}

test('T power-1.5 research never raises inverse U or changes active multipliers', () => {
  const data=run(`
    squareRunGameSeconds=10;testNow+=300000;
    abstractionResearchState['12-1']=true;abstractionResearchState['14-1']=true;
    abstractionResearchState['6-1']=true;
    const before=[abstractionSecondBranchResourceMultiplier(),abstractionSecondBranchParameterMultiplier('a'),abstractionTimeRecoveryRate()];
    abstractionResearchState['4-1']=true;
    return {before,after:[abstractionSecondBranchResourceMultiplier(),abstractionSecondBranchParameterMultiplier('a'),abstractionTimeRecoveryRate()],
      T:NumberMath.toNumber(abstractionEffectiveTime()),U:knuthRunRealSeconds(),info:abstractionTimeResearchInfo('14-1')};
  `);
  assert.deepEqual(data.after,data.before);assert.ok(Math.abs(data.T - 10 ** 1.5) < 1e-12);assert.equal(data.U,300);
  assert.match(data.info,/U 300초/);assert.doesNotMatch(data.info,/T 300초/);
});

test('only completed time-dependent research cards expose live values', () => {
  const data=run(`
    const ids=['4-1','6-1','12-1','13-1','14-1','12-3','13-3'];
    const before=ids.map(abstractionTimeResearchInfo);
    for(const id of ids)abstractionResearchState[id]=true;
    const after=ids.map(abstractionTimeResearchInfo);
    return {before,after,other:abstractionTimeResearchInfo('12-2')};
  `);
  assert.deepEqual(data.before,Array(7).fill(''));assert.ok(data.after.every(Boolean));assert.equal(data.other,'');
});

test('card readouts distinguish transformed game T, raw game U and wall-clock time', () => {
  const data=run(`
    for(const id of ['4-1','6-1','12-1','12-3'])abstractionResearchState[id]=true;
    squareRunGameSeconds=4;testNow+=120000;
    return ['4-1','6-1','12-1','12-3'].map(abstractionTimeResearchInfo);
  `);
  assert.match(data[0],/T 기본 4초/);assert.match(data[0],/적용 T 8초/);assert.match(data[0],/×2/);
  assert.match(data[1],/U 4초 \(제곱 게임 시간\)/);assert.match(data[1],/추가 T/);
  assert.match(data[2],/U 120초 \(커누스 현실 시간\)/);assert.match(data[2],/SP·CP ×/);
  assert.match(data[3],/T 120초 \(커누스 현실 시간\)/);
});

test('record cards show saved record and prospective exchange time without recording a completion', () => {
  const data=run(`
    hasClaimedKnuthPoint=true;testNow+=120000;
    shortestKnuthRealSeconds=300;longestKnuthRealSeconds=60;
    abstractionResearchState['13-1']=true;abstractionResearchState['13-3']=true;
    return {active:abstractionTimeResearchInfo('13-1'),idle:abstractionTimeResearchInfo('13-3'),
      records:[shortestKnuthRealSeconds,longestKnuthRealSeconds]};
  `);
  assert.match(data.active,/최단 U 300초/);assert.match(data.active,/교환 적용 U 120초/);
  assert.match(data.idle,/최장 T 60초/);assert.match(data.idle,/교환 적용 T 120초/);
  assert.deepEqual(data.records,[300,60]);
});

test('live time readouts update with elapsed real time and hide again after research cancellation', () => {
  const data=run(`
    abstractionResearchState['12-1']=true;
    const first=abstractionTimeResearchInfo('12-1');testNow+=300000;
    const next=abstractionTimeResearchInfo('12-1');abstractionResearchState['12-1']=false;
    return {first,next,cancelled:abstractionTimeResearchInfo('12-1')};
  `);
  assert.match(data.first,/U 0초/);assert.match(data.first,/×8/);
  assert.match(data.next,/U 300초/);assert.notEqual(data.first,data.next);assert.equal(data.cancelled,'');
  assert.match(uiSource,/setInterval\(\(\) => \{\s*if \(activeChapter !== 'knuth'/);
});
