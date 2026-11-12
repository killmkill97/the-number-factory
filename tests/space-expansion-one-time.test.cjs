const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');
const close=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function ready() {
  const ctx=game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.space_expansion=1;knuthBaseUpgradeLevels.late_abstraction=1;
    abstractionResearchState['30-1']=true;`);
  return ctx;
}

test('30-1 requires 29-1 and exactly 1m grand theory without granting one-time purchases',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['30-1']=false;greatTheory=1000000;
    const parent=!researchAbstraction('30-1');abstractionResearchState['29-1']=true;greatTheory=999999;
    const poor=!researchAbstraction('30-1');greatTheory=1000000;const bought=researchAbstraction('30-1');
    const r=abstractionResearchDefinitions.get('30-1');
    return {parent,poor,bought,left:plain(greatTheory),cost:r.greatTheoryCost,parents:r.parents,
      empty:Object.values(spaceExpansionOneTimeUpgradeState).every(v=>!v)};
  `),{parent:true,poor:true,bought:true,left:0,cost:1000000,parents:['29-1'],empty:true});
});

test('all seven SM purchases have exact costs, pay once and reject insufficient mass or missing research',()=>{
  const expected=[5e6,15e6,5e6,1e8,5e8,2e9,5.9722e30];
  const rows=run(ready(),`return SPACE_EXPANSION_ONE_TIME_UPGRADES.map(u=>{
    abstractionResearchState['30-1']=false;stagnantMassMg=multiplyNumberValue(u.costMg,3);recordStagnantSingularities();
    const locked=!buySpaceExpansionOneTimeUpgrade(u.id);abstractionResearchState['30-1']=true;
    stagnantMassMg=NumberMath.divideApproximate(u.costMg,2);recordStagnantSingularities();const poor=!buySpaceExpansionOneTimeUpgrade(u.id);
    stagnantMassMg=multiplyNumberValue(u.costMg,3);recordStagnantSingularities();const bought=buySpaceExpansionOneTimeUpgrade(u.id);
    const correct=compareNumberValues(stagnantMassMg,multiplyNumberValue(u.costMg,2))===0;
    const before=serializeNumberValue(stagnantMassMg),twice=!buySpaceExpansionOneTimeUpgrade(u.id);
    return {cost:u.costMg,locked,poor,bought,correct,twice,same:before===serializeNumberValue(stagnantMassMg)};
  });`);
  assert.deepEqual(rows.map(r=>r.cost),expected);
  assert.ok(rows.every(r=>r.locked&&r.poor&&r.bought&&r.correct&&r.twice&&r.same));
});

test('penalty relief affects both aggregate compression and SP log without changing ordinary mode or small rewards',()=>{
  const r=run(ready(),`
    spaceExpansionActive=true;const m=NumberMath.fromString('1e1e100'),sp=NumberMath.fromString('1e10000');
    const before=[logValue(NumberMath.log10(spaceExpansionMultiplier(m))),plain(spaceExpansionFinalSpGain(sp))];
    spaceExpansionOneTimeUpgradeState.penalty_relief=true;
    const after=[logValue(NumberMath.log10(spaceExpansionMultiplier(m))),plain(spaceExpansionFinalSpGain(sp))];
    const small=[0,1,2,10].map(v=>plain(spaceExpansionMultiplier(v)));
    spaceExpansionActive=false;
    return {before,after,small,identity:compareNumberValues(spaceExpansionFinalSpGain(sp),sp)===0
      &&compareNumberValues(spaceExpansionMultiplier(m),m)===0};
  `);
  close(r.before[0],25);close(r.after[0],30);close(r.before[1],10000);close(r.after[1],1000000);
  assert.deepEqual(r.small,[0,1,2,10]);assert.ok(r.identity);
});

test('removed Higgs addition cannot return from legacy saves or accumulate repeated exit rewards',()=>{
  assert.deepEqual(run(ready(),`
    higgsParticles=2000;const saved=captureGameSaveData();saved.spaceExpansionOneTimeUpgradeState.higgs_addition=true;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const removed=!hasSpaceExpansionOneTimeUpgrade('higgs_addition')&&!buySpaceExpansionOneTimeUpgrade('higgs_addition')
      &&!Object.hasOwn(captureGameSaveData().spaceExpansionOneTimeUpgradeState,'higgs_addition')
      &&!spaceExpansionOneTimeControls.some(c=>c.id==='higgs_addition');
    spaceExpansionActive=true;squareConvergencePoints=NumberMath.fromString('1e100');
    const gain=plain(spaceExpansionHiggsGainOnExit());toggleSpaceExpansion();const first=plain(higgsParticles);
    toggleSpaceExpansion();squareConvergencePoints=NumberMath.fromString('1e100');toggleSpaceExpansion();
    const second=plain(higgsParticles);toggleSpaceExpansion();squareConvergencePoints=NumberMath.fromString('1e200');
    const increase=plain(spaceExpansionHiggsGainOnExit());toggleSpaceExpansion();
    return {removed,gain,first,second,increase,record:plain(higgsParticles),inactive:plain(spaceExpansionHiggsGainOnExit())};
  `),{removed:true,gain:0,first:2000,second:2000,increase:6000,record:8000,inactive:0});
});

test('adding Higgs settles mass production at the old balance before starting its new production rate',()=>{
  const ctx=ready();ctx.loadSource(`higgsParticles=5;spaceExpansionActive=true;
    squareConvergencePoints=NumberMath.fromString('1e100');resetSpaceExpansionClock();`);
  ctx.advance(1000);
  assert.deepEqual(run(ctx,'toggleSpaceExpansion();return [plain(higgsParticles),plain(stagnantMassMg)];'),[1000,5]);
  ctx.advance(1000);assert.equal(run(ctx,'tickSpaceExpansion();return plain(stagnantMassMg);'),1005);
});

test('mass percent is a final multiplier once across K1/K2, production powers, direct clicks and exact bulk',()=>{
  for(const strength of [1,2])for(const powered of [false,true]){
    const ctx=ready();ctx.loadSource(`
      percentUnlocked=true;percentPower=100;stagnantMassMg=15000000;recordStagnantSingularities();
      squareDimensionNumberMultiplier=()=>1;abstractionPercentGainMultiplier=()=>1;
      percentPowerSoftcap=()=>NumberMath.fromString('1e30');percentPowerSoftcapDecayPower=()=>${strength};
      if(${powered}){abstractionResearchState['8-2']=true;knuthEquippedUpgradeIds.add('percent_gain_square');}
    `);
    const r=run(ctx,`
      const n=NumberMath.fromString('1e31');const before=percentFinalUseGain(n,100);
      spaceExpansionOneTimeUpgradeState.mass_percent=true;const after=percentFinalUseGain(n,100);
      const ratio=logValue(NumberMath.divideApproximate(after,before));
      setBaseNumber(n);applyPercentUse(n,100,'test');const direct=compareNumberValues(getBaseNumber(),addBaseNumbers(n,after))===0;
      setBaseNumber(100);applyPercentUsesBatch(100,8,'test');const bulk=serializeNumberValue(getBaseNumber());
      setBaseNumber(100);for(let i=0;i<8;i++)applyPercentUse(getBaseNumber(),100,'test');
      return {ratio,direct,same:bulk===serializeNumberValue(getBaseNumber())};
    `);
    close(r.ratio,24*(6/Math.log10(15000001))**.75);assert.ok(r.direct&&r.same);
  }
});

test('Higgs slots add after purchase-based 16-2 rounding and before KC5 reduction without affecting price',()=>{
  assert.deepEqual(run(ready(),`
    knuthOperationLevel=300;higgsParticles=1000000;abstractionResearchState['16-2']=true;
    const price=serializeNumberValue(knuthOperationUpgradeCost());spaceExpansionOneTimeUpgradeState.higgs_slots=true;
    const capacity=knuthSlotCapacity(),bonus=spaceExpansionHiggsSlotBonus();activeKnuthChallengeId='kc5';
    const reduced=knuthSlotCapacity();activeKnuthChallengeId=null;
    higgsParticles=NumberMath.fromString('1e1e100');const huge=knuthSlotCapacity();
    return {capacity,bonus,reduced,huge,priceSame:price===serializeNumberValue(knuthOperationUpgradeCost()),level:knuthOperationLevel};
  `),{capacity:391,bonus:16,reduced:130,huge:Number.MAX_SAFE_INTEGER,priceSame:true,level:300});
});

test('100%+ donations require active 25-2, preserve resources and safely clamp when it is removed',()=>{
  for(const resource of ['number','sp']){
    const r=run(ready(),`
      spaceExpansionOneTimeUpgradeState.overfeed=true;stagnantMassMg=500000000;recordStagnantSingularities();numberBlackHoleDonationAmountLevel=99;
      const locked=numberBlackHoleDonationPercentLimit();abstractionResearchState['25-2']=true;abstractionResearchState['15-1']=true;
      numberBlackHoleDonationResource='${resource}';setBaseNumber(1000);setSquarePoints(1000);
      const limit=numberBlackHoleDonationPercentLimit();setNumberBlackHoleSetting('amount',limit);applyNumberBlackHoleDonations(3);
      const invested='${resource}'==='sp'?numberBlackHoleTotalSpInvested:numberBlackHoleTotalInvested;
      const kept=plain('${resource}'==='sp'?squarePoints:getBaseNumber());
      abstractionResearchState['25-2']=false;applyNumberBlackHoleDonations(3);
      return {locked,limit,invested:plain(invested),kept,percent:numberBlackHoleDonationPercent,
        remaining:plain('${resource}'==='sp'?squarePoints:getBaseNumber())};
    `);
    assert.deepEqual(r,{locked:100,limit:75709,invested:2271270,kept:1000,percent:100,remaining:0});
  }
});

test('mass-enhanced amount settings do not prematurely block the base amount upgrade or its N buyer',()=>{
  assert.deepEqual(run(ready(),`
    spaceExpansionOneTimeUpgradeState.overfeed=true;stagnantMassMg=500000000;recordStagnantSingularities();abstractionResearchState['25-2']=true;
    completedKnuthChallengeIds.add('kc4');knuthPoints=1000;
    const limit=numberBlackHoleDonationPercentLimit(),snapshot=nBlackHoleUpgradeSnapshot('amount',{});
    const bought=executeN('buy black_hole amount');return {limit,available:snapshot.available,cost:plain(snapshot.cost),
      bought,level:numberBlackHoleDonationAmountLevel};
  `),{limit:757,available:true,cost:2,bought:true,level:1});
});

test('mass group boost affects purchase factors and dyson expansion counts, not prices or raw purchases',()=>{
  const r=run(ready(),`
    stagnantMassMg=2000000000;recordStagnantSingularities();knuthBaseUpgradeLevels.cp_gain=2;knuthBaseUpgradeLevels.dyson_limit=10;
    abstractionResearchState['17-3']=true;abstractionResearchState['22-2']=true;
    const upgrade=SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm'),ordinary=squareBreakthroughOrdinaryMax(upgrade);
    const quote=serializeNumberValue(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0]));spaceExpansionOneTimeUpgradeState.group_boost=true;
    return {factor:plain(knuthBaseEffectPerPurchase('cp_gain',25)),multiplier:plain(spaceExpansionGroupMultiplier()),
      extra:squareBreakthroughMax(upgrade)-ordinary,same:quote===serializeNumberValue(knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0])),
      cpLevel:knuthBaseUpgradeLevels.cp_gain,dysonLevel:knuthBaseUpgradeLevels.dyson_limit};
  `);
  const multiplier=1+.15*(6/Math.log10(2000000001))**.75;
  close(r.factor,(25*multiplier)**2);close(r.multiplier,multiplier);assert.equal(r.extra,Math.floor(20*multiplier));
  assert.ok(r.same);assert.equal(r.cpLevel,2);assert.equal(r.dysonLevel,10);
});

test('advanced equipment keeps its base effects without the removed mass upgrade',()=>{
  const r=run(ready(),`
    stagnantMassMg=5000000000;recordStagnantSingularities();knuthBaseUpgradeLevels.advanced_equipment=1;
    for(const u of KNUTH_ADVANCED_UPGRADES){knuthAdvancedOwned[u.id]=2;knuthAdvancedEquipped[u.id]=2;}
    const costs=KNUTH_ADVANCED_UPGRADES.map(u=>serializeNumberValue(knuthAdvancedUpgradeCost(u.id)));
    const values=KNUTH_ADVANCED_UPGRADES.map(u=>plain(knuthAdvancedEffect(u.id)));
    return {values,exponent:knuthAdvancedPercentPower(),
      same:JSON.stringify(costs)===JSON.stringify(KNUTH_ADVANCED_UPGRADES.map(u=>serializeNumberValue(knuthAdvancedUpgradeCost(u.id))))};
  `);
  [1.03,1.05,1.05,1.05,1.04].forEach((base,i)=>close(r.values[i],base**2));
  close(r.exponent,1.05**2);assert.ok(r.same);
});

test('remaining mass effect upgrades stay independent of advanced equipment',()=>{
  const r=run(ready(),`
    for(const id of ['mass_percent','group_boost','overfeed'])spaceExpansionOneTimeUpgradeState[id]=true;
    abstractionResearchState['25-2']=true;stagnantMassMg=5000000000;recordStagnantSingularities();
    const read=()=>[spaceExpansionMassPercentMultiplier(),spaceExpansionGroupMultiplier(),spaceExpansionOverfeedMultiplier()];
    const before=read();spaceExpansionUpgradeLevels.mass_effect=2;const after=read();
    const ratios=after.map((v,i)=>plain(NumberMath.divideApproximate(v,before[i])));stagnantMassMg=0;stagnantSingularities=0;
    return {ratios,zero:read().map(plain)};
  `);
  r.ratios.forEach(n=>close(n,4));
  assert.deepEqual(r.zero,[1,1,1]);
});

test('one-time records survive Knuth, KC, singularity and research reset while unowned purchases relock',()=>{
  assert.deepEqual(run(ready(),`
    for(const u of SPACE_EXPANSION_ONE_TIME_UPGRADES)spaceExpansionOneTimeUpgradeState[u.id]=true;
    spaceExpansionOneTimeUpgradeState.definition_space=false;higgsParticles=100;stagnantMassMg=1e12;recordStagnantSingularities();
    resetProgressForNewKnuthRun();startKnuthChallenge('kc1');abandonKnuthChallenge();
    numberBlackHoleSystemEnabled=true;numberBlackHoleSchwarzschildRadius=()=>1e10;purchaseSingularity();
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {kept:SPACE_EXPANSION_ONE_TIME_UPGRADES.filter(u=>u.id!=='definition_space').every(u=>hasSpaceExpansionOneTimeUpgrade(u.id)),
      research:hasAbstractionResearch('30-1'),locked:!buySpaceExpansionOneTimeUpgrade('definition_space'),
      effect:compareNumberValues(spaceExpansionMassPercentMultiplier(),1)>0,h:plain(higgsParticles),mass:plain(stagnantMassMg)};
  `),{kept:true,research:false,locked:true,effect:true,h:100,mass:1e12});
});

test('save resources load before slot trimming and overfeed settings; old saves default every flag to false',()=>{
  assert.deepEqual(run(ready(),`
    for(const id of ['higgs_slots','overfeed'])spaceExpansionOneTimeUpgradeState[id]=true;
    abstractionResearchState['16-2']=true;abstractionResearchState['25-2']=true;
    higgsParticles=1000000;stagnantMassMg=500000000;recordStagnantSingularities();knuthOperationLevel=300;knuthBaseUpgradeLevels.advanced_equipment=1;
    knuthAdvancedOwned.cp_power=39;knuthAdvancedEquipped.cp_power=39;knuthEquipmentOrder=[{kind:'advanced',id:'cp_power',count:39}];
    numberBlackHoleDonationAmountLevel=99;numberBlackHoleDonationPercent=100000;
    const saved=captureGameSaveData();higgsParticles=0;stagnantMassMg=0;stagnantSingularities=0;spaceExpansionOneTimeUpgradeState.higgs_slots=false;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=[knuthAdvancedEquipped.cp_power,knuthSlotCapacity(),numberBlackHoleDonationPercent];
    delete saved.spaceExpansionOneTimeUpgradeState;loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {restored,old:Object.values(spaceExpansionOneTimeUpgradeState).every(v=>!v),amount:numberBlackHoleDonationPercent,errors};
  `),{restored:[39,391,75709],old:true,amount:100,errors:[]});
});

test('Higgs slots are about one quarter of the old bonus without reducing Higgs, purchases or unrelated mass effects',()=>{
  const result=run(ready(),`
    spaceExpansionOneTimeUpgradeState.higgs_slots=true;knuthOperationLevel=314;
    const price=serializeNumberValue(knuthOperationUpgradeCost());const rows=[];
    for(const h of [0,42,1000,526000,1000000,'1e60','1e1000']){
      higgsParticles=NumberMath.fromValue(h);const after=spaceExpansionHiggsSlotBonus();
      SPACE_EXPANSION_EXTRA_BALANCE.slotStrength=64;const before=spaceExpansionHiggsSlotBonus();
      SPACE_EXPANSION_EXTRA_BALANCE.slotStrength=16;
      rows.push({h:String(h),before,after,kept:compareNumberValues(higgsParticles,NumberMath.fromValue(h))===0});
    }
    return {rows,level:knuthOperationLevel,priceSame:price===serializeNumberValue(knuthOperationUpgradeCost()),
      massPower:SPACE_EXPANSION_EXTRA_BALANCE.percentLogStrength};
  `);
  for(const row of result.rows){assert.equal(row.after,Math.floor(row.before/4));assert.equal(row.kept,true);}
  assert.equal(result.rows.find(row=>row.h==='526000').after,15);
  assert.equal(result.rows.find(row=>row.h==='1000000').after,16);
  assert.equal(result.level,314);assert.equal(result.priceSame,true);assert.equal(result.massPower,24);
});

test('one-Earth-mass story purchase only spends SM and preserves its flag',()=>{
  assert.deepEqual(run(ready(),`
    stagnantMassMg=5.9722e30;recordStagnantSingularities();knuthPoints=12;squarePoints=34;squareConvergencePoints=56;higgsParticles=78;
    const before=[plain(knuthPoints),plain(squarePoints),plain(squareConvergencePoints),plain(higgsParticles),knuthOperationLevel];
    const bought=buySpaceExpansionOneTimeUpgrade('definition_space');const saved=captureGameSaveData();
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {bought,held:hasSpaceExpansionOneTimeUpgrade('definition_space'),mass:plain(stagnantMassMg),
      same:JSON.stringify(before)===JSON.stringify([plain(knuthPoints),plain(squarePoints),plain(squareConvergencePoints),plain(higgsParticles),knuthOperationLevel])};
  `),{bought:true,held:true,mass:0,same:true});
});

test('one-time buttons remain stable, show live effects and cannot be purchased twice',()=>{
  assert.deepEqual(run(ready(),`
    stagnantMassMg=20000000;recordStagnantSingularities();renderSpaceExpansionBoard();
    const control=spaceExpansionOneTimeControls.find(u=>u.id==='penalty_relief'),button=control.button;
    const cost=control.info.textContent;control.button.events.click();const mass=plain(stagnantMassMg);
    control.button.events.click();renderSpaceExpansionBoard();
    return {cost,disabled:control.button.disabled,same:control.button===button,
      paidOnce:plain(stagnantMassMg)===mass,owned:control.info.textContent.includes('구매 완료'),
      penalty:document.getElementById('spaceExpansionPenaltyRule').textContent.includes('0.3')};
  `),{cost:'비용: 5 kg SM',disabled:true,same:true,paidOnce:true,owned:true,penalty:true});
});

test('huge mass/Higgs keep effects positive and native slot/donation/exponent limits finite',()=>{
  const r=run(ready(),`
    for(const u of SPACE_EXPANSION_ONE_TIME_UPGRADES)spaceExpansionOneTimeUpgradeState[u.id]=true;
    abstractionResearchState['25-2']=true;knuthBaseUpgradeLevels.advanced_equipment=1;knuthAdvancedEquipped.percent_power=100;
    stagnantMassMg=NumberMath.fromString('1e1e1000');recordStagnantSingularities();higgsParticles=NumberMath.fromString('1e1e1000');
    spaceExpansionUpgradeLevels.mass_effect=1000;
    const values=[spaceExpansionMassPercentMultiplier(),spaceExpansionGroupMultiplier()];
    return {valid:values.every(v=>isPositiveNumberValue(v)&&!(/NaN|Infinity/.test(JSON.stringify(serializeNumberValue(v))))),
      slots:knuthSlotCapacity(),percent:numberBlackHoleDonationPercentLimit(),exponent:knuthAdvancedPercentPower()};
  `);
  assert.ok(r.valid);assert.equal(r.slots,Number.MAX_SAFE_INTEGER);assert.equal(r.percent,Number.MAX_SAFE_INTEGER);
  assert.ok(Number.isFinite(r.exponent)&&r.exponent>1);
});
