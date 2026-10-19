const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

test('tier 16 researches each require 15-1, cost ten grand theory and do not lock each other', () => {
  assert.deepEqual(run(game(), `
    greatTheory=20;const locked=['16-1','16-2'].map(canResearchAbstraction);
    abstractionResearchState['15-1']=true;greatTheory=9;const poor=['16-1','16-2'].map(researchAbstraction);
    greatTheory=20;const bought=['16-1','16-2'].map(researchAbstraction);
    return {locked,poor,bought,left:plain(greatTheory),paid:abstractionResearchRefund()};
  `), { locked: [false,false], poor: [false,false], bought: [true,true], left: 0, paid: 920 });
});

test('16-2 derives rounded slots from total purchases without altering counts or prices', () => {
  const rows = run(game(), `
    return Array.from({length:101},(_,level)=>{
      knuthOperationLevel=level;abstractionResearchState['16-2']=false;const cost=NumberMath.serialize(knuthOperationUpgradeCost());
      abstractionResearchState['16-2']=true;
      return {level:knuthOperationLevel,slots:knuthSlotCapacity(),samePrice:cost===NumberMath.serialize(knuthOperationUpgradeCost())};
    });
  `);
  rows.forEach((row, level) => assert.deepEqual(row, { level, slots: Math.round(level*1.25), samePrice: true }));
  assert.deepEqual(rows.slice(0,9).map(row => row.slots), [0,1,3,4,5,6,8,9,10]);
  assert.equal(run(game(), `abstractionResearchState['16-2']=true;knuthOperationLevel=Number.MAX_SAFE_INTEGER;return knuthSlotCapacity();`), Number.MAX_SAFE_INTEGER);
});

test('operation purchase grants the rounded difference, pays the old price and displays the actual gain', () => {
  const ctx = game();
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/chapters/knuth.js'), 'utf8'));
  const row = run(ctx, `
    renderKnuthBaseUpgrades=()=>{};renderKnuthUpgradeGroups=()=>{};renderKnuthChallenges=()=>{};
    abstractionResearchState['16-2']=true;knuthOperationLevel=1;knuthPoints=2;renderKnuthBoard();
    const label=knuthOperationUpgradeCostText.textContent;const bought=buyKnuthOperationUpgrade();renderKnuthBoard();
    return {label,bought,level:knuthOperationLevel,slots:knuthSlotCapacity(),kp:plain(knuthPoints),next:plain(knuthOperationUpgradeCost()),nextLabel:knuthOperationUpgradeCostText.textContent};
  `);
  assert.match(row.label, /슬롯 \+2$/); assert.match(row.nextLabel, /슬롯 \+1$/);
  assert.equal(row.bought, true); assert.equal(row.level, 2); assert.equal(row.slots, 3); assert.equal(row.kp, 0); assert.equal(row.next, 4);
});

test('new capacity is usable and loss of 16-2 removes only excess most-recent equipment', () => {
  assert.deepEqual(run(game(), `
    knuthOperationLevel=2;knuthEquippedUpgradeIds.add('percent_softcap_square');
    const before=toggleKnuthUpgrade('permanent_production');abstractionResearchState['16-2']=true;
    abstractionResearchPaidCosts['16-2']=10;const after=toggleKnuthUpgrade('permanent_production');
    greatTheory=0;abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {before,after,slots:knuthSlotCapacity(),level:knuthOperationLevel,kept:[...knuthEquippedUpgradeIds],refund:plain(greatTheory)};
  `), { before: false, after: true, slots: 2, level: 2, kept: ['percent_softcap_square'], refund: 10 });
});

test('console research cancellation and base-count setting follow the same rounded capacity and price', () => {
  const ctx = game();
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/systems/dev-console.js'), 'utf8'));
  assert.deepEqual(run(ctx, `
    forceUnlockDevUpgrade('abstraction','16-2');runDevCommand('set knuth_slot 2');
    knuthEquippedUpgradeIds.add('percent_softcap_square');knuthEquippedUpgradeIds.add('permanent_production');
    const before=knuthSlotCapacity();removeDevUpgrade('abstraction','16-2');
    return {before,after:knuthSlotCapacity(),kept:[...knuthEquippedUpgradeIds],level:knuthOperationLevel,price:plain(knuthOperationUpgradeCost())};
  `), { before: 3, after: 2, kept: ['percent_softcap_square'], level: 2, price: 4 });
});

test('save restores research before capacity validation and legacy saves retain ordinary purchased slots', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['16-1']=true;abstractionResearchState['16-2']=true;knuthOperationLevel=20;
    knuthEquippedUpgradeIds.add('percent_gain_square');knuthEquippedUpgradeIds.add('group_percent_growth');
    knuthEquippedUpgradeIds.add('achievement_percent_growth');
    saveGame();const saved=localStorage.getItem(SAVE_KEY);
    abstractionResearchState['16-2']=false;knuthEquippedUpgradeIds.clear();loadGame(saved,{countAsLoad:false});
    const restored={slots:knuthSlotCapacity(),used:knuthSlotsUsed(),count:knuthOperationLevel,first:hasAbstractionResearch('16-1')};
    const old=JSON.parse(saved);delete old.abstractionResearchState['16-1'];delete old.abstractionResearchState['16-2'];
    loadGame(JSON.stringify(old),{countAsLoad:false});
    return {restored,old:{slots:knuthSlotCapacity(),used:knuthSlotsUsed(),count:knuthOperationLevel,first:hasAbstractionResearch('16-1')},errors};
  `), { restored: { slots: 25, used: 22, count: 20, first: true }, old: { slots: 20, used: 19, count: 20, first: false }, errors: [] });
});

test('square-power Dyson growth is smooth and bounded, with no boost to zero swarms or disabled dimensions', () => {
  const row = run(game(), `
    generalizationResearchState['3-1']=true;abstractionResearchState['16-1']=true;squareBreakthroughLevels.dyson_swarm=16;
    setSquareDimensionPowerForDev(1);
    const neutral=plain(dysonEffectMultiplier());
    const multipliers=['1','1e10','1e1000','1e80000','1e1e20'].map(power=>{
      setSquareDimensionPowerForDev(NumberMath.fromString(power));return abstractionSquarePowerDysonMultiplier();
    });
    squareBreakthroughLevels.dyson_swarm=0;const zero=plain(dysonEffectMultiplier());
    squareBreakthroughLevels.dyson_swarm=16;activeKnuthChallengeId='kc1';const kc1=plain(dysonEffectMultiplier());
    activeKnuthChallengeId='kc2';const kc2=plain(dysonEffectMultiplier());
    return {neutral,multipliers,zero,kc1,kc2};
  `);
  assert.equal(row.neutral, 65536); assert.equal(row.zero, 1); assert.equal(row.kc1, 1); assert.equal(row.kc2, 65536);
  row.multipliers.forEach(value => assert.ok(value >= 1 && value <= 1.160000001));
  for (let i=1;i<row.multipliers.length;i++) assert.ok(row.multipliers[i] > row.multipliers[i-1]);
});

test('16-1 strengthens all existing Dyson consumers without adding swarms or changing their price', () => {
  const row = run(game(), `
    generalizationResearchState['3-1']=true;squareBreakthroughLevels.dyson_swarm=16;
    squareBreakthroughLevels.overclock=8;squareBreakthroughLevels.bottleneck_tracker=8;
    squareBreakthroughLevels.black_hole=1;squareBreakthroughLevels.extra_investment=3;
    setSquareDimensionPowerForDev(NumberMath.fromString('1e80000'));
    const before={cap:percentPowerSoftcapBonusLevels(),price:percentPowerPriceAccelerationStart(),
      efficiency:percentEfficiencyMultiplierNumerator()-4,ticks:gameTick(1000000),sp:affectedNumberMultiplierValue(2,3)};
    const cost=NumberMath.serialize(squareBreakthroughCost(SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm')));
    abstractionResearchState['16-1']=true;const m=abstractionSquarePowerDysonMultiplier();
    return {m,cap:percentPowerSoftcapBonusLevels()/before.cap,
      price:(percentPowerPriceAccelerationStart()-8)/(before.price-8),
      efficiency:(percentEfficiencyMultiplierNumerator()-4)/before.efficiency,ticks:gameTick(1000000)/before.ticks,
      sp:plain(NumberMath.divideApproximate(affectedNumberMultiplierValue(2,3),before.sp)),count:effectiveDysonSwarmLevel(),
      sameCost:cost===NumberMath.serialize(squareBreakthroughCost(SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm')))};
  `);
  for (const key of ['cap','price','efficiency']) close(row[key],row.m);
  close(row.ticks,row.m); close(row.sp,row.m**3); assert.equal(row.count,16); assert.equal(row.sameCost,true);
});

test('high-progress anchor produces a visible tier-6.5 sized final Number and SP gain, not merely a card multiplier', () => {
  const row = run(game(), `
    percentUnlocked=true;
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    for(const u of SQUARE_UPGRADES)squareUpgradeState[u.id]=true;
    for(const id of ['6-2','5-3','8-2'])abstractionResearchState[id]=true;
    setSquareDimensionPowerForDev(NumberMath.fromString('1e40000'),0);setSquareDimensionPowerForDev(NumberMath.fromString('1e40000'),1);
    squareBreakthroughLevels.dyson_swarm=16;squareBreakthroughLevels.overclock=60;squareBreakthroughLevels.bottleneck_tracker=16;
    knuthEquippedUpgradeIds.add('percent_softcap_square');squarePoints=NumberMath.fromString('1e904000');
    const value=NumberMath.fromString('1e2170000000'),power=147000;
    const before=percentFinalUseGain(value,power),beforeSp=squarePointGainForValue(before);
    abstractionResearchState['16-1']=true;const after=percentFinalUseGain(value,power);
    return {numberDelta:logValue(after)-logValue(before),spDelta:logValue(squarePointGainForValue(after))-logValue(beforeSp),
      multiplier:abstractionSquarePowerDysonMultiplier(),squarePower:logValue(squareDimensionTotalPower())};
  `);
  close(row.squarePower,80000); close(row.multiplier,1+0.16*80000/81000);
  assert.ok(row.spDelta>20000&&row.spDelta<50000,JSON.stringify(row));
  assert.ok(row.numberDelta>50e6,JSON.stringify(row));
});
