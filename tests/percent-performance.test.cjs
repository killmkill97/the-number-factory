const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function game() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'scripts/core', file), 'utf8'), context);
  }
  vm.runInContext(`
    render=()=>{};extraPercentLanesEl={innerHTML:''};percentUnlocked=true;squareUnlocked=true;
    generalizationResearchState['3-1']=true;generalizationResearchState['4-2']=true;
    generalizationResearchState['5-1']=true;generalizationResearchState['5-4']=true;
    abstractionResearchState['6-2']=true;abstractionResearchState['5-3']=true;
    squarePoints=NumberMath.fromString('1e1000');divergerPower=NumberMath.fromString('1e1000');
  `, context);
  return context;
}
function run(context, source) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, context)));
}

test('production snapshot preserves exact outputs for both decay strengths, powered research and enormous batches', () => {
  const context = game();
  const results = run(context, `
    const results=[];
    for(const strength of [1,2])for(const tier of [0,8,9])for(const start of ['10000','1e2000000','1e1e1000']) {
      squareUpgradeState.percent_power_8=strength===1;
      abstractionResearchState['8-2']=tier>=8;abstractionResearchState['9-2']=tier>=9;
      const original=percentBatchInvariant;
      percentBatchInvariant=(_key,calculate)=>calculate();
      setBaseNumber(NumberMath.fromString(start));applyPercentUsesBatch(10000,1e12,'reference',20);
      const expected=NumberMath.serialize(getBaseNumber());
      percentBatchInvariant=original;
      setBaseNumber(NumberMath.fromString(start));applyPercentUsesBatch(10000,1e12,'optimized',20);
      results.push({strength,tier,start,equal:expected===NumberMath.serialize(getBaseNumber())});
    }
    return results;
  `);
  assert.ok(results.every(result => result.equal), JSON.stringify(results.filter(result => !result.equal)));
});

test('one synchronous production pass computes dimension and softcap inputs once but keeps number-dependent rewards live', () => {
  const result = run(game(), `
    abstractionResearchState['8-2']=true;abstractionResearchState['9-2']=true;
    const dimension=squareDimensionNumberMultiplier,total=squareDimensionTotalPower,reward=abstractionNumberPercentMultiplier;
    let dimensionCalls=0,softcapInputs=0,rewardCalls=0;
    squareDimensionNumberMultiplier=index=>{dimensionCalls++;return dimension(index);};
    squareDimensionTotalPower=()=>{softcapInputs++;return total();};
    abstractionNumberPercentMultiplier=value=>{rewardCalls++;return reward(value);};
    setBaseNumber(NumberMath.fromString('1e2000000'));
    withPercentProductionCache(()=>{
      applyPercentUsesBatch(10000,1e12,'lane-1',20);
      applyPercentUsesBatch(10001,1e12,'lane-2',20);
    });
    return {dimensionCalls,softcapInputs,rewardCalls,cleared:percentBatchCalculationCache===null};
  `);
  assert.equal(result.dimensionCalls, 3); // Combined multiplier plus two dimensions.
  assert.equal(result.softcapInputs, 2); // One distinct softcap per lane.
  assert.ok(result.rewardCalls > 2);
  assert.equal(result.cleared, true);
});

test('unchanged powered segments skip identical work without dropping later growth', () => {
  const context = game();
  const result = run(context, `
    abstractionResearchState['8-2']=true;abstractionResearchState['9-2']=true;
    const original=percentUsesWithPoweredGainSegment;
    const results=[];
    for(const start of ['10000','1e2000000','1e1e1000']) {
      let reference=NumberMath.fromString(start);
      for(let i=0;i<32;i++) reference=original(reference,10000,1e12/32,20);
      const optimized=percentUsesWithPoweredGain(NumberMath.fromString(start),10000,1e12,20);
      results.push(NumberMath.serialize(reference)===NumberMath.serialize(optimized));
    }
    let calls=0;percentUsesWithPoweredGainSegment=value=>{calls++;return value;};
    percentUsesWithPoweredGain(100,1,1000,0);const idleCalls=calls;
    calls=0;percentUsesWithPoweredGainSegment=value=>{calls++;return addBaseNumbers(value,1);};
    const growing=percentUsesWithPoweredGain(100,1,1000,0);
    return {results,idleCalls,growingCalls:calls,growing:NumberMath.toNumber(growing)};
  `);
  assert.deepEqual(result, {results:[true,true,true],idleCalls:1,growingCalls:32,growing:132});
});

test('cache never survives state changes, failed production, load or prestige', () => {
  const context = game();
  assert.deepEqual(run(context, `
    const snapshots=[];
    for(const sp of ['1','1e1000']) {
      squarePoints=NumberMath.fromString(sp);
      snapshots.push(NumberMath.serialize(withPercentProductionCache(()=>percentPowerSoftcap(100,0))));
    }
    try{withPercentProductionCache(()=>{percentPowerSoftcap(100,0);throw new Error('test');});}catch{}
    const clearedAfterThrow=percentBatchCalculationCache===null;
    loadAbstractionResearchState({});
    const afterLoad=withPercentProductionCache(()=>percentPowerSoftcap(100,0));
    resetProgressForNewKnuthRun();
    const afterReset=withPercentProductionCache(()=>percentPowerSoftcap(100,0));
    return {changed:snapshots[0]!==snapshots[1],clearedAfterThrow,
      freshLoad:compareNumberValues(afterLoad,afterReset)!==0,cleared:percentBatchCalculationCache===null};
  `), { changed: true, clearedAfterThrow: true, freshLoad: true, cleared: true });
});

test('disabled traces do not serialize production values, while enabled traces retain events and the same production', () => {
  assert.deepEqual(run(game(), `
    let serialized=0;const original=numberTraceValue;
    numberTraceValue=value=>{serialized++;return original(value);};
    setBaseNumber(100000);applyPercentUsesBatch(5,1000,'trace-test',0);
    const value=NumberMath.serialize(getBaseNumber());const offSerializations=serialized;
    numberTraceEnabled=true;setBaseNumber(100000);applyPercentUsesBatch(5,1000,'trace-test',0);
    return {offSerializations,onSerializations:serialized>0,
      same:value===NumberMath.serialize(getBaseNumber()),
      event:numberTraceEvents.some(event=>event.type==='percent-use-batch-complete')};
  `), { offSerializations: 0, onSerializations: true, same: true, event: true });
});

test('charging without traces skips diagnostic snapshots but produces the same charges and queues', () => {
  const context = game();
  const source = fs.readFileSync(path.join(root, 'scripts/systems/percent-lanes.js'), 'utf8');
  vm.runInContext(source.slice(source.indexOf('function chargeAllPercentLanes('), source.indexOf('function createExtraPercentLaneUI(')), context);
  assert.deepEqual(run(context, `
    percentChargeNeeded=3;extraPercentLanes.push({laneNumber:2,charge:0,pendingUses:0});
    const original=Array.prototype.map;let snapshots=0;
    extraPercentLanes.map=function(...args){snapshots++;return original.apply(this,args);};
    chargeAllPercentLanes(100);const off=[percentCharge,pendingPercentUses,extraPercentLanes[0].charge,extraPercentLanes[0].pendingUses];
    const offSnapshots=snapshots;
    percentCharge=0;pendingPercentUses=0;extraPercentLanes[0].charge=0;extraPercentLanes[0].pendingUses=0;
    numberTraceEnabled=true;chargeAllPercentLanes(100);
    return {off,offSnapshots,on:[percentCharge,pendingPercentUses,extraPercentLanes[0].charge,extraPercentLanes[0].pendingUses],
      traced:numberTraceEvents.some(event=>event.type==='percent-ready')};
  `), { off: [1,33,1,33], offSnapshots: 0, on: [1,33,1,33], traced: true });
});

test('changing price acceleration no longer grows the compounding cache without bound', () => {
  const result = run(game(), `
    let acceleration=8;percentPowerPriceAccelerationStart=()=>acceleration;
    let largest=0;
    for(let i=0;i<300;i++) {
      acceleration=i+8;
      firstPercentPowerCompoundingPurchase(10000,40000);
      largest=Math.max(largest,percentPowerCompoundingStartCache.size);
    }
    acceleration=8;
    const recomputed=firstPercentPowerCompoundingPurchase(10000,40000);
    return {largest,recomputed,limit:PERCENT_COMPOUNDING_CACHE_LIMIT};
  `);
  assert.ok(result.largest <= result.limit);
  assert.ok(result.recomputed > 0);
});

test('normalized scalar-exponent fast path agrees with the original normalization for boundary and fractional inputs', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/core/number-math.js'), 'utf8');
  const shortcut = `    if (typeof exponent === 'number' && Number.isFinite(exponent)
      && Number.isFinite(mantissa) && mantissa > 0) {
      const shift = Math.floor(Math.log10(mantissa));
      const adjustedExponent = exponent + shift;
      if (Number.isFinite(adjustedExponent)) {
        const normalizedMantissa = shift < -308
          ? (mantissa * (10 ** (-shift - 308))) * 1e308
          : mantissa / (10 ** shift);
        return { approximate: true, mantissa: normalizedMantissa, exponent: adjustedExponent };
      }
    }`;
  const legacySource = source.replace(shortcut.replaceAll('\n', '\r\n'), '').replace(shortcut, '');
  assert.notEqual(source, legacySource);
  const optimized = vm.createContext({});
  const legacy = vm.createContext({});
  vm.runInContext(`${source};globalThis.math=NumberMath;`, optimized);
  vm.runInContext(`${legacySource};globalThis.math=NumberMath;`, legacy);
  for (const m of [0, -1, Number.MIN_VALUE, 0.9999999999999999, 1, 1.0000000000000002, 1.2345, 9.999999999999998, 10, 1e300, Infinity, NaN]) {
    for (const e of [-1000, -0, 0, 0.5, 32, 33, 2000000, Number.MAX_VALUE, Infinity, NaN]) {
      const actual = optimized.math.normalize(m,e);
      const expected = legacy.math.normalize(m,e);
      assert.equal(JSON.stringify(actual), JSON.stringify(expected), `mantissa=${m}, exponent=${e}`);
    }
  }
});
