const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function run(source) {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext('render = () => {}; extraPercentLanesEl = { innerHTML: "" }; knuthUnlocked = true; hasClaimedKnuthPoint = true;', context);
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, context)));
}

test('groups require all earlier upgrades, not repetitions or operation slots', () => {
  const result = run(`
    knuthPoints = NumberMath.fromString('1e100');
    const before = [1,2,3].map(knuthBaseGroupUnlocked);
    const blocked = buyKnuthBaseUpgrade('dyson_limit');
    const bought = KNUTH_BASE_UPGRADES.filter(u => u.group === 1).map(u => buyKnuthBaseUpgrade(u.id));
    const afterFirst = [1,2,3].map(knuthBaseGroupUnlocked);
    const second = KNUTH_BASE_UPGRADES.filter(u => u.group === 2).map(u => buyKnuthBaseUpgrade(u.id));
    const afterSecond = [1,2,3].map(knuthBaseGroupUnlocked);
    return { before, blocked, bought, afterFirst, second, afterSecond,
      repeat: buyKnuthBaseUpgrade('sp_gain'), single: buyKnuthBaseUpgrade('extra_branch'), slots: knuthOperationLevel };
  `);
  assert.deepEqual(result, { before: [true,false,false], blocked: false, bought: Array(5).fill(true),
    afterFirst: [true,true,false], second: Array(5).fill(true), afterSecond: [true,true,true], repeat: true, single: false, slots: 0 });
});

test('original group 1-3 repeatable upgrades retain their independent KP cost progression', () => {
  const rows = run(`
    knuthPoints = NumberMath.fromString('1e100');
    return KNUTH_BASE_UPGRADES.filter(u => u.growth && u.group <= 3).map(u => {
      loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(item => [item.id,1])));
      knuthBaseUpgradeLevels[u.id] = 0;
      const first = NumberMath.toNumber(knuthBaseUpgradeCost(u));
      const success = buyKnuthBaseUpgrade(u.id);
      return { id:u.id, first, success, next:NumberMath.toNumber(knuthBaseUpgradeCost(u)), expected:u.baseCost*u.growth };
    });
  `);
  for (const row of rows) {
    assert.equal(row.success, true, row.id);
    assert.ok(Math.abs(row.next / row.expected - 1) < 1e-12, row.id);
  }
  assert.deepEqual(rows.map(r => r.first), [4,2,500,1500,10,50,100]);
  assert.deepEqual(run(`knuthPoints = 4; const ok=buyKnuthBaseUpgrade('cp_gain'); return [ok, NumberMath.toNumber(knuthPoints), buyKnuthBaseUpgrade('cp_gain')];`), [true,0,false]);
});

test('SP and CP rewards gain their exact multipliers; KP retains integer rewards', () => {
  const result = run(`
    squarePoints = NumberMath.fromString('1e30');
    squareConvergencePoints = NumberMath.fromString('1e45');
    const sp = squarePointGain(), cp = squareConvergencePointGain(), kp = knuthPointGain();
    knuthBaseUpgradeLevels.sp_gain = 2; knuthBaseUpgradeLevels.cp_gain = 2; knuthBaseUpgradeLevels.kp_gain = 2;
    const ratios = [divideNumberValue(squarePointGain(),sp), divideNumberValue(squareConvergencePointGain(),cp), divideNumberValue(knuthPointGain(),kp)].map(NumberMath.toNumber);
    hasClaimedKnuthPoint = false;
    return { ratios, first:knuthPointGain() };
  `);
  assert.deepEqual(result, { ratios:[1e8,625,25], first:1 });
});

test('dimension and diverger multipliers apply once; b strength is retroactive', () => {
  const result = run(`
    generalizationResearchState['3-1'] = true; generalizationResearchState['3-2'] = true;
    divergerN = 10; divergerBLevel = 5; divergerB = divergerBAtLevel(5);
    const oldB = divergerB, oldD = divergerProductionValue();
    knuthBaseUpgradeLevels.diverger_gain = 3;
    const dRatio = NumberMath.toNumber(divideNumberValue(divergerProductionValue(),oldD));
    const power = squareDimensionPower();
    knuthBaseUpgradeLevels.dimension_gain = 2;
    const dimensionRatio = NumberMath.toNumber(divideNumberValue(squareDimensionPower(),power));
    setSquareDimensionPowerForDev(1e50);
    const setPower = NumberMath.toNumber(squareDimensionPower());
    for (const u of KNUTH_BASE_UPGRADES.filter(u=>u.group===1)) knuthBaseUpgradeLevels[u.id] = 1;
    knuthPoints = 10000000;
    const bought = buyKnuthBaseUpgrade('diverger_b_strength');
    return { oldB, dRatio, dimensionRatio, setPower, bought, newB:divergerB, nextGain:divergerBUpgradeGain() };
  `);
  assert.equal(result.oldB,2);
  assert.equal(result.dRatio,8);
  assert.equal(result.dimensionRatio,16);
  assert.ok(Math.abs(result.setPower/1e50-1)<1e-10);
  assert.equal(result.bought,true);
  assert.equal(result.newB,3);
  assert.equal(result.nextGain,0.4);
});

test('extra Dyson and Overclock prices compound only beyond their ordinary caps', () => {
  const result = run(`
    return ['dyson_swarm','overclock'].map(id => {
      const u = SQUARE_BREAKTHROUGH_UPGRADES.find(item=>item.id===id);
      const normal = squareBreakthroughMax(u);
      squareBreakthroughLevels[id] = normal-1;
      const before = squareBreakthroughCost(u);
      knuthBaseUpgradeLevels[id==='dyson_swarm'?'dyson_limit':'overclock_limit'] = 2;
      const unchanged = compareNumberValues(before,squareBreakthroughCost(u))===0;
      const q = id==='dyson_swarm'?1.01:1.005;
      const growth = u.costMultiplier[0]/u.costMultiplier[1];
      squareBreakthroughLevels[id] = normal;
      const first = squareBreakthroughCost(u);
      const expectedFirst = NumberMath.ceil(NumberMath.power(multiplyNumberValue(before,growth),q));
      squareBreakthroughLevels[id]++;
      const second = squareBreakthroughCost(u);
      const expectedSecond = NumberMath.ceil(NumberMath.power(multiplyNumberValue(first,growth),q));
      return {id, unchanged, extra:squareBreakthroughMax(u)-normal,
        firstRatio:NumberMath.toNumber(divideNumberValue(first,expectedFirst)),
        secondRatio:NumberMath.toNumber(divideNumberValue(second,expectedSecond))};
    });
  `);
  for (const row of result) {
    assert.equal(row.unchanged,true);
    assert.equal(row.extra,row.id==='dyson_swarm'?2:8);
    assert.ok(Math.abs(row.firstRatio-1)<1e-10);
    assert.ok(Math.abs(row.secondRatio-1)<1e-8);
  }
});

test('extended caps retain KC1 bonuses and enormous extra prices stay positive', () => {
  const result = run(`
    knuthBaseUpgradeLevels.dyson_limit = 3;
    generalizationResearchState['2-3'] = true;
    const dyson = SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm');
    const snapshot = squareBreakthroughMax(dyson);
    activeKnuthChallengeId='kc1'; knuthChallengeDysonSwarmMaxAtEntry=snapshot;
    knuthBaseUpgradeLevels.overclock_limit=2;
    const overclock = SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='overclock');
    const ordinary = squareBreakthroughOrdinaryMax(overclock);
    const cap = squareBreakthroughMax(overclock);
    activeKnuthChallengeId=null;
    knuthBaseUpgradeLevels.dyson_limit=10000000;
    squareBreakthroughLevels.dyson_swarm=1000000;
    return {snapshot, bonus:ordinary-overclock.max, extra:cap-ordinary, positive:compareNumberValues(squareBreakthroughCost(dyson),0)>0};
  `);
  assert.deepEqual(result,{snapshot:15,bonus:60,extra:8,positive:true});
});

test('branch upgrade allows exactly two branches while keeping predecessor checks', () => {
  assert.deepEqual(run(`
    greatTheory=100;
    for(const id of ['1-1','2-1','3-1']) abstractionResearchState[id]=true;
    const a=researchAbstraction('4-1');
    const lockedBefore=canResearchAbstraction('4-2');
    knuthBaseUpgradeLevels.extra_branch=1;
    const b=researchAbstraction('4-2');
    return [a,lockedBefore,b,canResearchAbstraction('4-3'),canResearchAbstraction('5-1'),canResearchAbstraction('6-2')];
  `),[true,false,true,false,true,false]);
});

test('Theory purchases unlock separately, support max, and do not affect other costs', () => {
  assert.deepEqual(run(`
    const locked=setAbstractionCostResource(3);
    abstractionCostResourceIndex=3; theory=84;
    const blocked=purchaseGreatTheory(1);
    knuthBaseUpgradeLevels.theory_exchange=1;
    const selected=setAbstractionCostResource(3);
    const max=greatTheoryMaximumPurchases();
    const bought=purchaseGreatTheory(max);
    return {locked,blocked,selected,max,bought,left:NumberMath.toNumber(theory),gt:NumberMath.toNumber(greatTheory),next:NumberMath.toNumber(greatTheoryTheoryCost),cpCost:NumberMath.toNumber(greatTheoryCpCost)};
  `),{locked:false,blocked:false,selected:true,max:3,bought:true,left:0,gt:3,next:256,cpCost:1e15});
});

test('Knuth reset retains purchases and grants starter resources only when owned', () => {
  assert.deepEqual(run(`
    setBaseNumber(NumberMath.fromString('1e1000'));
    resetProgressForNewKnuthRun();
    const defaultNumber=NumberMath.toNumber(getBaseNumber());
    knuthBaseUpgradeLevels.starting_resources=1;knuthBaseUpgradeLevels.cp_gain=3;
    greatTheoryTheoryCost=256;
    resetProgressForNewKnuthRun();
    return {defaultNumber,n:NumberMath.toNumber(getBaseNumber()),sp:NumberMath.toNumber(squarePoints),cp:NumberMath.toNumber(squareConvergencePoints),levels:knuthBaseUpgradeLevel('cp_gain'),cost:greatTheoryTheoryCost,unlocked:[squareUnlocked,squareConvergenceUnlocked,hasEverEarnedSquareConvergencePoint],breakthrough:squareBreakthroughEntered};
  `),{defaultNumber:0,n:1e14,sp:1e10,cp:1000,levels:3,cost:256,unlocked:[true,true,true],breakthrough:false});
});

test('new save fields restore optional legacy defaults and validated purchase levels', () => {
  assert.deepEqual(run(`
    loadKnuthBaseUpgradeLevels({cp_gain:3,extra_branch:5,sp_gain:-1,kp_gain:1.5,dyson_limit:'2'});
    const saved=JSON.parse(JSON.stringify({knuthBaseUpgradeLevels:{...knuthBaseUpgradeLevels},greatTheoryTheoryCost:serializeNumberValue(256)}));
    loadKnuthBaseUpgradeLevels(null);
    const empty=KNUTH_BASE_UPGRADES.every(u=>knuthBaseUpgradeLevel(u.id)===0);
    loadKnuthBaseUpgradeLevels(saved.knuthBaseUpgradeLevels);
    return [empty,knuthBaseUpgradeLevel('cp_gain'),knuthBaseUpgradeLevel('extra_branch'),knuthBaseUpgradeLevel('sp_gain'),knuthBaseUpgradeLevel('kp_gain'),knuthBaseUpgradeLevel('dyson_limit'),NumberMath.toNumber(numberValueFromSave(saved.greatTheoryTheoryCost,4))];
  `),[true,3,1,0,0,2,256]);
  const save = fs.readFileSync(path.join(__dirname,'../scripts/core/save.js'),'utf8');
  assert.match(save,/knuthBaseUpgradeLevels: \{ \.\.\.knuthBaseUpgradeLevels \}/);
  assert.match(save,/loadKnuthBaseUpgradeLevels\(isLegacySave \? null : d.knuthBaseUpgradeLevels\)/);
  assert.match(save,/greatTheoryTheoryCost = numberValueFromSave\(d.greatTheoryTheoryCost, 4\)/);
});
