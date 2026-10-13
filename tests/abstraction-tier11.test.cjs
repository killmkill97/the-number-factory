const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function run(source) {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context);
  }
  vm.runInContext('render=()=>{};knuthUnlocked=true;extraPercentLanesEl={innerHTML:""};', context);
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${source}})()`, context)));
}

test('10-1 requires both parents, costs two Great Theory, and 11-1 costs four', () => {
  assert.deepEqual(run(`
    greatTheory=10;
    abstractionResearchState['9-1']=true;
    const locked=canResearchAbstraction('10-1');
    abstractionResearchState['9-2']=true;
    const bought=researchAbstraction('10-1');
    const remaining=NumberMath.toNumber(greatTheory);
    const next=researchAbstraction('11-1');
    return {locked,bought,remaining,next,end:NumberMath.toNumber(greatTheory)};
  `), {locked:false,bought:true,remaining:8,next:true,end:4});
});

test('10-1 quadruples actual diverger cycles without mutating its stored interval', () => {
  assert.deepEqual(run(`
    generalizationResearchState['3-2']=true;gameTick=ms=>ms;
    advanceDiverger(1000);
    const old=NumberMath.toNumber(divergerN);
    divergerN=1;divergerTimer=0;abstractionResearchState['10-1']=true;
    advanceDiverger(1000);
    return {old,next:NumberMath.toNumber(divergerN),stored:divergerInterval,effective:divergerEffectiveInterval()};
  `), {old:2,next:5,stored:1000,effective:250});
});

test('10-1 quadruples every dimension side growth including z and preserves speed levels', () => {
  assert.deepEqual(run(`
    squareDimensionSideGrowthRate=()=>1;generalizationResearchState['5-1']=true;
    const first=makeSquareDimensionState();
    const second=makeSquareDimensionState();
    first.x=first.y=first.z=10;second.x=second.y=second.z=10;
    advanceSquareDimensionState(first,0,1000);
    abstractionResearchState['10-1']=true;
    advanceSquareDimensionState(second,1,1000);
    return {before:['x','y','z'].map(k=>NumberMath.toNumber(first[k])),
      after:['x','y','z'].map(k=>NumberMath.toNumber(second[k])),
      stored:second.powerInterval,effective:squareDimensionEffectiveInterval(second)};
  `), {before:[11,11,11],after:[14,14,14],stored:1000,effective:250});
});

test('11-1 changes each first-group per-purchase base retroactively, not its final total or price', () => {
  const data=run(`
    const entries=[['cp_gain',25],['sp_gain',10000],['kp_gain',5],['diverger_gain',2],['dimension_gain',4]];
    for(const [id] of entries)knuthBaseUpgradeLevels[id]=2;
    const prices=KNUTH_BASE_UPGRADES.map(u=>NumberMath.serialize(knuthBaseUpgradeCost(u)));
    abstractionResearchState['11-1']=true;
    return {effects:entries.map(([id,base])=>NumberMath.toNumber(knuthBaseMultiplier(id,base))),
      unchanged:JSON.stringify(prices)===JSON.stringify(KNUTH_BASE_UPGRADES.map(u=>NumberMath.serialize(knuthBaseUpgradeCost(u)))),
      untouched:knuthBaseEffectPerPurchase('dyson_limit',20),
      zero:knuthBaseMultiplier('cp_gain',25)};
  `);
  [31.25**2,12500**2,6.25**2,2.5**2,5**2].forEach((expected,index)=>
    assert.ok(Math.abs(data.effects[index]/expected-1)<1e-12));
  assert.equal(data.unchanged,true);assert.equal(data.untouched,20);
});

test('11-1 keeps KP rewards integer despite the new fractional purchase multiplier', () => {
  assert.deepEqual(run(`
    hasClaimedKnuthPoint=true;squareConvergencePoints=1e30;
    knuthBaseUpgradeLevels.kp_gain=1;
    const before=NumberMath.toNumber(knuthPointGain());
    abstractionResearchState['11-1']=true;
    return [before,NumberMath.toNumber(knuthPointGain())];
  `), [10,12]);
});

test('new researches persist through loading and Knuth resets and default to false in old saves', () => {
  assert.deepEqual(run(`
    loadAbstractionResearchState({'10-1':true,'11-1':true});
    resetProgressForNewKnuthRun();
    const restored=['10-1','11-1'].map(hasAbstractionResearch);
    loadAbstractionResearchState({});
    return {restored,legacy:['10-1','11-1'].map(hasAbstractionResearch)};
  `), {restored:[true,true],legacy:[false,false]});
});
