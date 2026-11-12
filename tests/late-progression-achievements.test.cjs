const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function setup() {
  const context = game();
  context.loadSource("function condition(id) { return ACHIEVEMENTS.find(item => item.id === id).condition(); }");
  return context;
}

test('googolplex, singularity and effective slot achievements include their exact thresholds', () => {
  assert.deepEqual(run(setup(), `
    const checks=[];
    setBaseNumber(NumberMath.powerOfTen(9.99e99));checks.push(!condition('googolplex'));
    setBaseNumber('1e1e100');checks.push(condition('googolplex'));
    singularityPoints=15;checks.push(!condition('already_sixteen'));
    singularityPoints=16;checks.push(condition('already_sixteen'));
    knuthOperationLevel=300;checks.push(!condition('operation_master'));
    abstractionResearchState['16-2']=true;
    knuthOperationLevel=299;checks.push(knuthSlotCapacity()===374&&!condition('operation_master'));
    knuthOperationLevel=300;checks.push(knuthSlotCapacity()===375&&condition('operation_master'));
    activeKnuthChallengeId='kc5';checks.push(!condition('operation_master'));
    return checks;
  `), Array(8).fill(true));
});

test('maximum black hole speed and one percent achievements use the actual current multiplier and setting', () => {
  assert.deepEqual(run(setup(), `
    const checks=[];
    numberBlackHoleSchwarzschildRadius=()=>1e90;
    checks.push(!condition('no_further'),!condition('one_percent_power'));
    numberBlackHoleSchwarzschildRadius=()=>1e100;
    numberBlackHoleDonationPercent=2;
    checks.push(condition('no_further'),!condition('one_percent_power'));
    numberBlackHoleDonationPercent=1;checks.push(condition('one_percent_power'));
    numberBlackHoleSystemEnabled=false;checks.push(!condition('no_further'),!condition('one_percent_power'));
    numberBlackHoleSystemEnabled=true;activeKnuthChallengeId='kc5';checks.push(!condition('no_further'));
    return checks;
  `), Array(8).fill(true));
});

test('Knuth master follows all registered basic upgrades and requires the operation upgrade', () => {
  assert.deepEqual(run(setup(), `
    const checks=[!condition('knuth_master')];
    KNUTH_BASE_UPGRADES.forEach(upgrade=>knuthBaseUpgradeLevels[upgrade.id]=1);
    checks.push(!condition('knuth_master'));
    knuthOperationLevel=1;checks.push(condition('knuth_master'));
    KNUTH_BASE_UPGRADES.push({id:'future-upgrade',group:7});checks.push(!condition('knuth_master'));
    knuthBaseUpgradeLevels['future-upgrade']=1;checks.push(condition('knuth_master'));
    activeKnuthChallengeId='kc5';checks.push(condition('knuth_master'));
    return checks;
  `), Array(6).fill(true));
});

test('group one purchases, probabilizer and expansion use purchase history, not disabled effects', () => {
  assert.deepEqual(run(setup(), `
    const checks=[!condition('contains_random_items'),!condition('principle_of_expansion')];
    KNUTH_BASE_UPGRADES.filter(upgrade=>upgrade.group===1).forEach(upgrade=>knuthBaseUpgradeLevels[upgrade.id]=400);
    knuthBaseUpgradeLevels.cp_gain=399;knuthBaseUpgradeLevels.dyson_limit=10000;
    checks.push(!condition('high_amplification_knuth'));
    knuthBaseUpgradeLevels.cp_gain=400;checks.push(condition('high_amplification_knuth'));
    knuthBaseUpgradeLevels.probabilizer=1;knuthBaseUpgradeLevels.space_expansion=1;
    activeKnuthChallengeId='kc5';
    checks.push(condition('contains_random_items'),condition('principle_of_expansion'),condition('high_amplification_knuth'));
    return checks;
  `), Array(7).fill(true));
});

test('grand theory counts successful bulk purchases across resources, not holdings or refunds', () => {
  assert.deepEqual(run(setup(), `
    const checks=[];
    greatTheory=5000;checks.push(!condition('grand_grand_theory'));greatTheory=0;
    for(const [index,count] of [[0,2000],[1,2000],[2,999]]) {
      abstractionCostResourceIndex=index;
      const cost=multiplyNumberValue(greatTheoryBulkCost(index,count),2);
      if(index===0)squareConvergencePoints=cost;
      else if(index===1)knuthPoints=cost;
      else squarePoints=cost;
      checks.push(purchaseGreatTheory(count));
    }
    checks.push(compareNumberValues(totalGreatTheoryPurchased,4999)===0,!condition('grand_grand_theory'));
    squarePoints=greatTheorySpCost;checks.push(purchaseGreatTheory(1));
    greatTheory=0;checks.push(condition('grand_grand_theory'));
    squarePoints=0;checks.push(!purchaseGreatTheory(1),compareNumberValues(totalGreatTheoryPurchased,5000)===0);
    return checks;
  `), Array(10).fill(true));
});

test('grand theory purchase count survives save/load and a new Knuth run; achievement stays unlocked', () => {
  assert.deepEqual(run(setup(), `
    totalGreatTheoryPurchased=5000;greatTheory=0;
    updateAchievements();const saved=JSON.stringify(captureGameSaveData());
    totalGreatTheoryPurchased=0;achievementState.grand_grand_theory=false;
    const loaded=loadGame(saved,{persistOverride:false,countAsLoad:false});
    resetProgressForNewKnuthRun();
    return {loaded,count:plain(totalGreatTheoryPurchased),unlocked:achievementState.grand_grand_theory,errors};
  `), { loaded:true,count:5000,unlocked:true,errors:[] });
});

test('legacy saves reconstruct grand theory purchases from all four prices, including accelerated SP prices', () => {
  for(const counts of [[0,0,0,0],[2000,2000,1000,0],[100,200,1100,3599],[100,200,1100,3600]]) {
    const context=setup();
    context.loadSource(`const purchaseCounts=${JSON.stringify(counts)};`);
    assert.deepEqual(run(context, `
      greatTheoryCpCost=greatTheoryCostAfterPurchases(0,purchaseCounts[0]);
      greatTheoryKpCost=greatTheoryCostAfterPurchases(1,purchaseCounts[1]);
      greatTheorySpCost=greatTheoryCostAfterPurchases(2,purchaseCounts[2]);
      greatTheoryTheoryCost=greatTheoryCostAfterPurchases(3,purchaseCounts[3]);
      greatTheory=0;
      const saved=captureGameSaveData();delete saved.totalGreatTheoryPurchased;
      totalGreatTheoryPurchased=999999;
      const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
      return {loaded,count:plain(totalGreatTheoryPurchased),achieved:condition('grand_grand_theory'),errors};
    `), {loaded:true,count:counts.reduce((a,b)=>a+b,0),achieved:counts.reduce((a,b)=>a+b,0)>=5000,errors:[]});
  }
});
