const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('19-1 keeps its price, tier unlock, and paid research/refund state', () => {
  const result = run(game(), `
    greatTheory=500;abstractionResearchState['18-1']=true;abstractionResearchPaidCosts['18-1']=0;
    const locked=!canResearchAbstraction('19-1');
    knuthBaseUpgradeLevels.late_abstraction=1;
    const bought=researchAbstraction('19-1');
    const definition=ABSTRACTION_RESEARCHES.find(r=>r.id==='19-1');
    const spent=plain(greatTheory),paid=abstractionResearchPaidCosts['19-1'];
    saveGame();loadAbstractionResearchState({});loadGame();
    const restored=hasAbstractionResearch('19-1');
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {locked,bought,spent,paid,restored,refund:plain(greatTheory),
      parents:definition.parents,cost:definition.greatTheoryCost};
  `);
  assert.deepEqual(result,{locked:true,bought:true,spent:0,paid:500,restored:true,refund:500,
    parents:['18-1','18-2','18-3','18-4'],cost:500});
});

test('missing research and zero singularities keep the original cap and decay', () => {
  assert.deepEqual(run(game(), `
    const initial=percentPowerSoftcap(100);
    abstractionResearchState['19-1']=true;
    const zero=NumberMath.compare(initial,percentPowerSoftcap(100))===0;
    const k=percentPowerSoftcapDecayPower();
    squareUpgradeState.percent_power_8=true;
    const upgradedK=percentPowerSoftcapDecayPower();
    abstractionResearchState['19-1']=false;singularityPoints=11;
    const noResearch=percentPowerSoftcap(100);
    abstractionResearchState['19-1']=true;
    const strengthened=NumberMath.compare(percentPowerSoftcap(100),noResearch)>0;
    abstractionResearchState['19-1']=false;
    return {zero,k,upgradedK,strengthened,cancelled:NumberMath.compare(percentPowerSoftcap(100),noResearch)===0};
  `),{zero:true,k:2,upgradedK:1,strengthened:true,cancelled:true});
});

test('held singularities give a finite monotonic cap with a bounded strengthening exponent', () => {
  const result=run(game(), `
    const rows=[];
    for(const s of [0,1,11,16,NumberMath.fromString('1e1e100')]){
      singularityPoints=s;abstractionResearchState['19-1']=false;
      const original=percentPowerSoftcap(100);
      abstractionResearchState['19-1']=true;
      const cap=percentPowerSoftcap(100);
      rows.push({ratio:plain(NumberMath.divideApproximate(NumberMath.log10(cap),NumberMath.log10(original))),
        cap:NumberMath.serialize(cap),k:percentPowerSoftcapDecayPower()});
    }
    return {rows,errors};
  `);
  assert.equal(result.rows[0].ratio,1);
  assert.ok(Math.abs(result.rows[2].ratio/1.95e35-1)<1e-10);
  assert.ok(Math.abs(result.rows[4].ratio/3.9e35-1)<1e-10);
  for(let i=1;i<result.rows.length;i++) assert.ok(result.rows[i].ratio>result.rows[i-1].ratio);
  assert.ok(result.rows.every(r=>r.k===2));
  assert.doesNotMatch(JSON.stringify(result),/NaN|Infinity|undefined/);
  assert.deepEqual(result.errors,[]);
});

test('powered percent gains stop feeding on Number above the strengthened cap', () => {
  const result=run(game(), `
    percentUnlocked=true;percentPower=100;singularityPoints=11;
    abstractionResearchState['19-1']=true;squareUpgradeState.percent_power_8=true;
    const rows=[];
    for(const powered of [false,true]){
      abstractionResearchState['8-2']=powered;
      for(const equipped of [false,true]){
        equipped?knuthEquippedUpgradeIds.add('percent_gain_square'):knuthEquippedUpgradeIds.delete('percent_gain_square');
        const cap=percentPowerSoftcap(percentPower),value=NumberMath.power(cap,16);
        const gain=percentFinalUseGain(value,percentPower);
        const farGain=percentFinalUseGain(NumberMath.power(value,2),percentPower);
        const next=percentUsesWithPoweredGain(value,percentPower,1e100,0);
        rows.push({q:percentProductionExponent(),same:Math.abs(plain(NumberMath.divideApproximate(NumberMath.log10(gain),NumberMath.log10(farGain)))-1)<1e-12,
          noRunaway:NumberMath.compare(next,value)===0,positive:isPositiveNumberValue(gain)});
      }
    }
    return rows;
  `);
  assert.deepEqual(result.map(r=>r.q),[1,2,4,8]);
  assert.ok(result.every(r=>r.same&&r.noRunaway&&r.positive),JSON.stringify(result));
});

test('19-1 and 19-2 are exclusive in either purchase order, including ancestor plans and presets', () => {
  for (const chosen of ['19-1','19-2']) {
    const result=run(game(), `
      const chosen=${JSON.stringify(chosen)},other=chosen==='19-1'?'19-2':'19-1';
      knuthBaseUpgradeLevels.late_abstraction=1;knuthBaseUpgradeLevels.extra_branch=1;
      knuthEquippedUpgradeIds.add('second_branch_expansion');
      abstractionResearchState['18-4']=true;abstractionResearchPaidCosts['18-4']=0;greatTheory=1000;
      const bought=researchAbstraction(chosen),before=greatTheory;
      const blocked=!canResearchAbstraction(other)&&!researchAbstraction(other)
        &&researchPurchasePlan('abstraction',other)===null;
      const noSpend=NumberMath.compare(before,greatTheory)===0;
      saveGame();loadAbstractionResearchState({});loadGame();
      const restored=hasAbstractionResearch(chosen)&&abstractionResearchBranchLocked(ABSTRACTION_RESEARCHES.find(r=>r.id===other));
      abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
      const refunded=plain(greatTheory);
      abstractionResearchPresets[0]={name:'conflict',ids:['19-1','19-2']};
      const invalid=Boolean(abstractionPresetPurchasePlan(0).error),rejected=!loadAbstractionResearchPreset(0);
      return {bought,blocked,noSpend,restored,refunded,invalid,rejected,limit:abstractionBranchLimit(7)};
    `);
    assert.deepEqual(result,{bought:true,blocked:true,noSpend:true,restored:true,refunded:1000,invalid:true,rejected:true,limit:1});
  }
});

test('19-2 uses the listed prerequisites, charges 500, and adds integer Dyson effects without changing purchases', () => {
  const r=run(game(), `
    const upgrade=SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm');
    squareBreakthroughLevels.dyson_swarm=10;generalizationResearchState['3-2']=true;
    divergerA=NumberMath.powerOfTen(ABSTRACTION_TIER19_BALANCE.divergerDysonLogScale);divergerN=1;divergerB=1;divergerC=99;
    const before={level:squareBreakthroughLevel('dyson_swarm'),max:squareBreakthroughMax(upgrade),cost:NumberMath.serialize(squareBreakthroughCost(upgrade)),effect:dysonEffectMultiplier()};
    knuthBaseUpgradeLevels.late_abstraction=1;abstractionResearchState['18-4']=true;greatTheory=500;
    const bought=researchAbstraction('19-2'),bonus=abstractionDivergerDysonBonus();
    const definition=ABSTRACTION_RESEARCHES.find(r=>r.id==='19-2');
    return {bought,bonus,total:effectiveDysonSwarmLevel(),left:plain(greatTheory),parents:definition.parents,
      unchanged:before.level===squareBreakthroughLevel('dyson_swarm')&&before.max===squareBreakthroughMax(upgrade)
        &&JSON.stringify(before.cost)===JSON.stringify(NumberMath.serialize(squareBreakthroughCost(upgrade))),
      effectLog:logValue(NumberMath.divideApproximate(dysonEffectMultiplier(),before.effect)),
      visible:squareBreakthroughEffectText(upgrade).includes('연구 보너스 +64기 (총 74기)')};
  `);
  assert.deepEqual({...r,effectLog:undefined},{bought:true,bonus:64,total:74,left:0,
    parents:['18-4','18-5','18-6','18-7','18-8'],unchanged:true,effectLog:undefined,visible:true});
  assert.ok(Math.abs(r.effectLog-64*Math.log10(2))<1e-10);
});

test('Dyson bonuses use pre-Dyson production and cannot amplify their own source', () => {
  assert.deepEqual(run(game(), `
    generalizationResearchState['3-2']=true;abstractionResearchState['19-2']=true;
    divergerA=NumberMath.fromString('1e1000000');divergerN=1;divergerB=1;divergerC=99;
    squareBreakthroughLevels.dyson_swarm=10;
    const before=abstractionDivergerDysonBonus(),source=NumberMath.serialize(divergerProductionBeforeDyson());
    knuthEquippedUpgradeIds.add('dyson_diverger');
    const bonuses=[];
    for(let i=0;i<20;i++){divergerPower=divergerProductionValue();bonuses.push(abstractionDivergerDysonBonus());}
    const stable=bonuses.every(v=>v===before);
    const sameSource=JSON.stringify(source)===JSON.stringify(NumberMath.serialize(divergerProductionBeforeDyson()));
    divergerPower=NumberMath.fromString('1e1e100');
    return {stable,sameSource,storedPowerIgnored:abstractionDivergerDysonBonus()===before,errors};
  `),{stable:true,sameSource:true,storedPowerIgnored:true,errors:[]});
});

test('bonus count saturates safely for layered production and respects disabled production and KC1', () => {
  const r=run(game(), `
    abstractionResearchState['19-2']=true;generalizationResearchState['3-2']=true;
    divergerN=1;divergerB=1;divergerC=99;squareBreakthroughLevels.dyson_swarm=10;
    const rows=[];
    for(const raw of ['0','1e1000','1e10800','1e23800','1e1e100']){
      divergerA=NumberMath.fromString(raw);rows.push(abstractionDivergerDysonBonus());
    }
    activeKnuthChallengeId='kc1';const kc1={bonus:abstractionDivergerDysonBonus(),total:effectiveDysonSwarmLevel()};
    activeKnuthChallengeId='kc2';const kc2=abstractionDivergerDysonBonus();
    activeKnuthChallengeId=null;generalizationResearchState['3-2']=false;
    return {rows,kc1,kc2,locked:abstractionDivergerDysonBonus(),errors};
  `);
  assert.deepEqual(r.rows,[0,10,64,88,128]);
  assert.deepEqual(r.kc1,{bonus:0,total:0});assert.equal(r.kc2,0);assert.equal(r.locked,0);assert.deepEqual(r.errors,[]);
});
