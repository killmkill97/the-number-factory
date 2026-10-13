const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
function game(withClock = false) {
  const clock = { now: 0 };
  const context = vm.createContext({ performance: { now: () => clock.now }, setInterval: () => 0 });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'scripts/core', file), 'utf8'), context);
  }
  vm.runInContext(`
    render=()=>{};checkOverflow=()=>{};percentUnlocked=true;
    function legacyFinalUseGain(value,power,bonus=0) {
      return finalNumberProductionGain(percentUseGain(value,power,bonus),
        percentPreExponentMultiplier(value),value,power,bonus,percentProductionExponent());
    }
  `, context);
  if (withClock) {
    const lanes = fs.readFileSync(path.join(root, 'scripts/systems/percent-lanes.js'), 'utf8');
    vm.runInContext(lanes.slice(lanes.indexOf('function chargeAllPercentLanes('), lanes.indexOf('function createExtraPercentLaneUI(')), context);
    const system = fs.readFileSync(path.join(root, 'scripts/systems/percent-system.js'), 'utf8');
    vm.runInContext(system.slice(system.indexOf('let lastPercentTraceHeartbeatAt'), system.indexOf('function upgradePercentCharge(')), context);
    vm.runInContext(`
      const consumed=[];
      applyPercentUsesBatch=(power,uses,source)=>{consumed.push({uses,source});return true;};
      percentChargeNeeded=1;percentAutoUnlocked=true;percentAutoSpeed=200;
    `, context);
  }
  return { context, clock };
}
function run(context, source) {
  const result = vm.runInContext(`(() => {${source}})()`, context);
  return result === undefined ? null : JSON.parse(JSON.stringify(result));
}

test('a charged lane consumes ready cooldowns immediately without waiting for its timer callback', () => {
  const { context, clock } = game(true);
  clock.now = 200;
  assert.deepEqual(run(context, `
    flushAutomaticPercentUses();
    const before=consumed.length;
    chargeAllPercentLanes(1);
    return {before,consumed,pending:pendingPercentUses,timer:percentAutoTimer};
  `), { before: 0, consumed: [{ uses: 1, source: 'percent-lane-1' }], pending: 0, timer: 0 });
});

test('charging and polling share elapsed time, do not skip cooldowns, and never double count', () => {
  const { context, clock } = game(true);
  clock.now = 100;
  run(context, 'flushAutomaticPercentUses();');
  clock.now = 150;
  assert.deepEqual(run(context, `
    chargeAllPercentLanes(1);return {count:consumed.length,timer:percentAutoTimer,pending:pendingPercentUses};
  `), { count: 0, timer: 150, pending: 1 });
  clock.now = 200;
  assert.deepEqual(run(context, `
    flushAutomaticPercentUses();flushAutomaticPercentUses();chargeAllPercentLanes(1);
    return {consumed,timer:percentAutoTimer,pending:pendingPercentUses};
  `), { consumed: [{ uses: 1, source: 'percent-lane-1' }], timer: 0, pending: 1 });
  clock.now = 400;
  assert.deepEqual(run(context, `
    flushAutomaticPercentUses();return {count:consumed.length,pending:pendingPercentUses,timer:percentAutoTimer};
  `), { count: 2, pending: 0, timer: 0 });
});

test('extra lanes run independently and locked automatic lanes retain their queued manual uses', () => {
  const { context, clock } = game(true);
  run(context, `
    percentAutoUnlocked=false;
    extraPercentLanes.push({laneNumber:2,charge:0,pendingUses:0,power:2,powerPurchaseBonus:0,autoUnlocked:true,autoTimer:0,autoSpeed:200});
    extraPercentLanes.push({laneNumber:3,charge:0,pendingUses:0,power:3,powerPurchaseBonus:0,autoUnlocked:false,autoTimer:0,autoSpeed:200});
  `);
  clock.now = 200;
  assert.deepEqual(run(context, `
    chargeAllPercentLanes(5);
    return {consumed,main:pendingPercentUses,others:extraPercentLanes.map(lane=>lane.pendingUses)};
  `), { consumed: [{ uses: 1, source: 'percent-lane-2' }], main: 5, others: [4, 5] });
});

test('enormous ready queues use one bulk call per lane and preserve unconsumed uses', () => {
  const { context, clock } = game(true);
  run(context, `
    gameTick=ms=>ms*1e60;
    for(let lane=2;lane<=16;lane++) extraPercentLanes.push({laneNumber:lane,charge:0,pendingUses:0,power:lane,
      powerPurchaseBonus:0,autoUnlocked:true,autoTimer:0,autoSpeed:200});
  `);
  clock.now = 10;
  const result = run(context, `
    chargeAllPercentLanes(1e100);
    return {calls:consumed.length,uses:consumed[0].uses,main:pendingPercentUses,
      others:extraPercentLanes.every(lane=>lane.pendingUses===pendingPercentUses)};
  `);
  assert.equal(result.calls, 16);
  assert.ok(Math.abs(result.uses / 5e58 - 1) < 1e-12);
  assert.ok(result.main > 0);
  assert.equal(result.others, true);
});

test('idle time is bounded to one ready cooldown and paused production does not consume queues', () => {
  const { context, clock } = game(true);
  clock.now = 10000;
  run(context, 'flushAutomaticPercentUses();');
  assert.deepEqual(run(context, `
    chargeAllPercentLanes(50);
    squareMode=true;chargeAllPercentLanes(10);flushAutomaticPercentUses();
    return {consumed,pending:pendingPercentUses,timer:percentAutoTimer};
  `), { consumed: [{ uses: 1, source: 'percent-lane-1' }], pending: 59, timer: 0 });
});

function highProgress(context) {
  vm.runInContext(`
    squareUnlocked=true;
    for(const id of ['1-1','3-1','3-2','4-2','5-1','5-4','6-1','7-1'])generalizationResearchState[id]=true;
    abstractionResearchState['6-2']=true;
    squareBreakthroughLevels.dyson_swarm=14;squareBreakthroughLevels.overclock=8;squareBreakthroughLevels.bottleneck_tracker=16;
    divergerPower=NumberMath.fromString('2.26e2700');
    for(const dimension of squareDimensionStates){
      dimension.x=NumberMath.fromString('5e20');dimension.y=NumberMath.fromString('4e20');dimension.z=NumberMath.fromString('3e20');
    }
  `, context);
}

test('cached post-softcap gains preserve the original formula for both exponents and changing Number rewards', () => {
  const { context } = game();
  highProgress(context);
  const result = run(context, `
    const rows=[];
    for(const q of [1,4])for(const strength of [1,2])for(const tier9 of [false,true]) {
      abstractionResearchState['8-2']=q===4;abstractionResearchState['9-2']=tier9;
      squareUpgradeState.percent_power_8=strength===1;
      for(const start of ['10000','1e13','1e164000000','1e1000000000','1e2000000000','1e1e1000']) {
        const n=NumberMath.fromString(start),expected=legacyFinalUseGain(n,40500,19.518);
        const actual=withPercentProductionCache(()=>percentFinalUseGain(n,40500,19.518));
        rows.push({q,strength,tier9,start,ratio:NumberMath.toNumber(NumberMath.divideApproximate(actual,expected)),
          equal:compareNumberValues(actual,expected)===0});
      }
    }
    return rows;
  `);
  for (const row of result) {
    assert.ok(row.equal || Math.abs(row.ratio - 1) < 1e-6, JSON.stringify(row));
  }
});

test('optimized 16-lane batches retain the old result within huge-number precision without caching 9-2', () => {
  const { context } = game();
  highProgress(context);
  const result = run(context, `
    abstractionResearchState['8-2']=true;abstractionResearchState['9-2']=true;squareUpgradeState.percent_power_8=true;
    const optimized=percentFinalUseGain;
    const batch=()=>withPercentProductionCache(()=>{
      for(let lane=0;lane<16;lane++)applyPercentUsesBatch(40500+lane,1e41,'test',19.518);
    });
    setBaseNumber(NumberMath.fromString('1e150000000'));percentFinalUseGain=legacyFinalUseGain;batch();
    const expected=getBaseNumber();
    let gainCalls=0,rewardCalls=0;
    const gain=percentUseGain,reward=abstractionNumberPercentMultiplier;
    percentUseGain=(...args)=>{gainCalls++;return gain(...args);};
    abstractionNumberPercentMultiplier=value=>{rewardCalls++;return reward(value);};
    percentFinalUseGain=optimized;setBaseNumber(NumberMath.fromString('1e150000000'));batch();
    return {ratio:NumberMath.toNumber(NumberMath.divideApproximate(getBaseNumber(),expected)),gainCalls,rewardCalls,
      cacheCleared:percentBatchCalculationCache===null};
  `);
  assert.ok(Math.abs(result.ratio - 1) < 1e-6, JSON.stringify(result));
  assert.equal(result.gainCalls, 32); // One guard and one constant per distinct lane power.
  assert.ok(result.rewardCalls > 1000);
  assert.equal(result.cacheCleared, true);
});

test('a purchase, changed diverger and prestige cannot leave a stale constant gain cache', () => {
  const { context } = game();
  highProgress(context);
  assert.deepEqual(run(context, `
    squareUpgradeState.percent_power_8=true;abstractionResearchState['8-2']=true;
    const n=NumberMath.fromString('1e164000000');
    const gain=p=>withPercentProductionCache(()=>percentFinalUseGain(n,p,19));
    const first=gain(40500),purchased=gain(40501);
    divergerPower=NumberMath.fromString('1e3000');const advanced=gain(40501);
    extraPercentLanesEl={innerHTML:''};resetProgressForNewKnuthRun();
    const reset=gain(40501),expected=legacyFinalUseGain(n,40501,19);
    return {purchase:compareNumberValues(purchased,first)>0,diverger:compareNumberValues(advanced,purchased)>0,
      reset:compareNumberValues(reset,expected)===0,cleared:percentBatchCalculationCache===null};
  `), { purchase: true, diverger: true, reset: true, cleared: true });
});
