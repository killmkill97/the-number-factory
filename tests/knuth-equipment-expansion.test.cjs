const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');

function game() {
  const elements=new Map(),storage=new Map();
  const element=(id='')=>({id,dataset:{},style:{},children:[],innerHTML:'',textContent:'',disabled:false,
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    addEventListener(){},setAttribute(){},remove(){},append(){},appendChild(){},replaceChildren(){}});
  const document={body:element(),addEventListener(){},querySelector:()=>element(),createElement:()=>element(),
    getElementById(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id);}};
  const errors=[];
  const context=vm.createContext({document,errors,console:{error:error=>errors.push(String(error))},
    performance:{now:()=>0},URLSearchParams,setInterval(){},setTimeout(){},clearTimeout(){},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
    window:{location:{pathname:'/',search:''},addEventListener(){},setTimeout(){return 1;},clearTimeout(){}},
    fetch:()=>({then(){return this;},catch(){return this;}})});
  for(const file of ['core/constants.js','core/number-math.js','core/state.js','core/dom.js',
    'systems/percent-lanes.js','systems/square-breakthrough.js','systems/achievements.js',
    'systems/number-black-hole.js','core/save.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts',file),'utf8'),context,{filename:file});
  }
  const dev=fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8');
  vm.runInContext(dev.slice(0,dev.indexOf('function handleDivergerDevUndo(')),context);
  vm.runInContext(`
    render=()=>{};log=()=>{};setChapter=()=>{};let activeSquareView='upgrades';
    knuthUnlocked=true;hasClaimedKnuthPoint=true;
    function equip(id){knuthEquippedUpgradeIds.add(id);}
    function secondReady(){
      for(const research of ABSTRACTION_RESEARCHES)if(!research.branch)abstractionResearchState[research.id]=true;
      greatTheory=1000;knuthOperationLevel=100;completedKnuthChallengeIds.add('kc1');
    }
    function buyPath(branch){
      return ABSTRACTION_RESEARCHES.filter(research=>research.branchGroup===2&&research.branch===branch)
        .map(research=>researchAbstraction(research.id));
    }
    function logValue(value){return NumberMath.toNumber(NumberMath.log10(value));}
  `,context);
  return context;
}
function run(context,source){return JSON.parse(JSON.stringify(vm.runInContext(`(()=>{${source}})()`,context)));}
function close(actual,expected,tolerance=1e-9){assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),JSON.stringify({actual,expected}));}

test('operation prices use the hundredth and two-hundredth purchase boundaries',()=>{
  const rows=run(game(),`
    return [0,1,18,19,20,21,22,99,100,199,200,299,300,1000,1000000].map(level=>{
      knuthOperationLevel=level;
      return {level,log:logValue(knuthOperationUpgradeCost())};
    });
  `);
  for(const {level,log} of rows){
    close(log,require('./helpers/knuth-prices.cjs').operationPriceLog(level));
  }
});

test('operation purchases retain exact early KP spending with the new price progression',()=>{
  for(const level of [18,19,20,21]){
    const row=run(game(),`
      knuthOperationLevel=${level};const cost=knuthOperationUpgradeCost();
      knuthPoints=subtractNumberValues(cost,1);const rejected=buyKnuthOperationUpgrade();
      const unchanged=knuthOperationLevel===${level}&&compareNumberValues(knuthPoints,subtractNumberValues(cost,1))===0;
      knuthPoints=cost;const bought=buyKnuthOperationUpgrade();
      return {rejected,unchanged,bought,level:knuthOperationLevel,kp:NumberMath.toNumber(knuthPoints),
        ratio:NumberMath.toNumber(NumberMath.divideApproximate(knuthOperationUpgradeCost(),cost))};
    `);
    assert.deepEqual(row,{rejected:false,unchanged:true,bought:true,level:level+1,kp:0,ratio:2});
  }
});

test('saved operation capacity and equipment survive with the new derived price',()=>{
  assert.deepEqual(run(game(),`
    knuthOperationLevel=31;knuthPoints=123;equip('percent_gain_square');saveGame();
    const saved=localStorage.getItem(SAVE_KEY);knuthOperationLevel=0;knuthPoints=0;knuthEquippedUpgradeIds.clear();
    loadGame(saved,{countAsLoad:false});
    return {level:knuthOperationLevel,kp:NumberMath.toNumber(knuthPoints),equipped:hasKnuthUpgrade('percent_gain_square'),
      priceMatches:compareNumberValues(knuthOperationUpgradeCost(),NumberMath.power(2,31))===0,errors};
  `),{level:31,kp:123,equipped:true,priceMatches:true,errors:[]});
});

test('nine new equipment entries require exact 2/3/16/64 slots and retain existing equip rules',()=>{
  assert.deepEqual(run(game(),`
    const two=['dyson_diverger','percent_softcap_square','accumulated_time_sp'];
    const three=['group_percent_growth','research_resource_growth','diverger_black_hole','achievement_percent_growth'];
    const valid=two.every(id=>KNUTH_SLOT_UPGRADES.find(u=>u.id===id)?.slots===2)
      &&three.every(id=>KNUTH_SLOT_UPGRADES.find(u=>u.id===id)?.slots===3)
      &&KNUTH_SLOT_UPGRADES.find(u=>u.id==='percent_gain_square')?.slots===16;
    knuthOperationLevel=63;const locked=toggleKnuthUpgrade('second_branch_expansion');
    knuthOperationLevel=64;const equipped=toggleKnuthUpgrade('second_branch_expansion');
    const used=knuthSlotsUsed();const over=toggleKnuthUpgrade('permanent_production');
    const cannotRemove=toggleKnuthUpgrade('second_branch_expansion');
    completedKnuthChallengeIds.add('kc1');const removed=toggleKnuthUpgrade('second_branch_expansion');
    return {valid,count:KNUTH_SLOT_UPGRADES.length,locked,equipped,used,over,cannotRemove,removed};
  `),{valid:true,count:17,locked:false,equipped:true,used:64,over:false,cannotRemove:false,removed:true});
});

test('percent square needs sixteen free slots without changing its production exponent',()=>{
  assert.deepEqual(run(game(),`
    knuthOperationLevel=15;const locked=toggleKnuthUpgrade('percent_gain_square');
    knuthOperationLevel=16;const bought=toggleKnuthUpgrade('percent_gain_square');
    const used=knuthSlotsUsed(),q=percentProductionExponent();
    abstractionResearchState['8-2']=true;const combined=percentProductionExponent();
    knuthOperationLevel=18;const insufficient=toggleKnuthUpgrade('group_percent_growth');
    knuthOperationLevel=19;const enough=toggleKnuthUpgrade('group_percent_growth');
    return {locked,bought,used,q,combined,insufficient,enough,total:knuthSlotsUsed()};
  `),{locked:false,bought:true,used:16,q:2,combined:8,insufficient:false,enough:true,total:19});
});

test('old percent-square saves keep the same ID and follow existing over-capacity load rules',()=>{
  for(const capacity of [2,16,20]) {
    assert.deepEqual(run(game(),`
      knuthOperationLevel=${capacity};knuthPoints=100;equip('percent_gain_square');saveGame();
      const saved=localStorage.getItem(SAVE_KEY);knuthEquippedUpgradeIds.clear();loadGame(saved,{countAsLoad:false});
      return {equipped:hasKnuthUpgrade('percent_gain_square'),used:knuthSlotsUsed(),kp:knuthPoints,capacity:knuthSlotCapacity(),errors};
    `),{equipped:capacity>=16,used:capacity>=16?16:0,kp:100,capacity,errors:[]});
  }
});

test('all new numeric multipliers are neutral with nothing equipped or at zero input',()=>{
  assert.deepEqual(run(game(),`
    const functions=[knuthGroupPercentMultiplier,knuthAchievementPercentMultiplier,knuthResearchResourceMultiplier,
      knuthAccumulatedTimeSpMultiplier,knuthDivergerBlackHoleMultiplier];
    const before=functions.map(fn=>NumberMath.toNumber(fn()));
    KNUTH_SLOT_UPGRADES.filter(u=>u.slots>1).forEach(u=>equip(u.id));
    return {before,zero: functions.map(fn=>NumberMath.toNumber(fn())),dyson:NumberMath.toNumber(knuthDysonDivergerMultiplier(1))};
  `),{before:[1,1,1,1,1],zero:[1,1,1,1,1],dyson:1});
});

test('percent square squares the full final gain including 8-2, 9-2 and final equipment multipliers',()=>{
  for(const researchExponent of [false,true])for(const numberReward of [false,true]) {
    const rows=run(game(),`
      percentUnlocked=true;abstractionResearchState['8-2']=${researchExponent};abstractionResearchState['9-2']=${numberReward};
      equip('group_percent_growth');knuthBaseUpgradeLevels.cp_gain=100;
      return ['10000','1e2000'].map(start=>{
        knuthEquippedUpgradeIds.delete('percent_gain_square');setBaseNumber(NumberMath.fromString(start));
        const before=getBaseNumber(),gain=percentFinalUseGain(before,1000);
        equip('percent_gain_square');const squared=percentFinalUseGain(before,1000);
        const expected=NumberMath.power(gain,2);applyPercentUse(before,1000,'test');
        return {q:percentProductionExponent(),difference:logValue(squared)-logValue(expected),
          actual:logValue(getBaseNumber())-logValue(addBaseNumbers(before,expected))};
      });
    `);
    for(const row of rows){assert.equal(row.q,researchExponent?8:2);close(row.difference,0,1e-7);close(row.actual,0,1e-7);}
  }
});

test('squared percent uses the powered bulk path at q=2 and q=8 for both softcap strengths',()=>{
  for(const q of [2,8])for(const k of [1,2]) {
    const row=run(game(),`
      equip('percent_gain_square');abstractionResearchState['8-2']=${q===8};percentUnlocked=true;
      percentPowerSoftcap=()=>100;percentPowerSoftcapDecayPower=()=>${k};
      percentUseGain=value=>multiplyNumberValue(value,0.01);
      let sequential=90;for(let index=0;index<1000;index++)sequential=percentUseValueAfterOne(sequential,1);
      setBaseNumber(90);applyPercentUsesBatch(1,1000,'bulk');
      return {sequential:NumberMath.toNumber(sequential),bulk:NumberMath.toNumber(getBaseNumber())};
    `);
    assert.ok(Math.abs(row.bulk/row.sequential-1)<0.01,JSON.stringify({q,k,...row}));
  }
});

test('squared huge percent batches keep the original bounded calculation budget',()=>{
  const row=run(game(),`
    equip('percent_gain_square');percentUnlocked=true;percentPowerSoftcap=()=>100;
    let calls=0;percentUseGain=value=>{calls++;return multiplyNumberValue(value,0.01);};
    setBaseNumber(100);applyPercentUsesBatch(1,1e100,'bulk');return {calls,log:logValue(getBaseNumber())};
  `);
  assert.ok(row.calls<150);assert.ok(Number.isFinite(row.log)&&row.log>0);
});

test('softcap square applies after the existing research and new equipment expansions',()=>{
  assert.deepEqual(run(game(),`
    abstractionResearchState['6-2']=true;squareDimensionTotalPower=()=>NumberMath.fromString('1e100');
    const original=percentPowerSoftcap(10);
    equip('group_percent_growth');knuthBaseUpgradeLevels.cp_gain=100;
    const expanded=percentPowerSoftcap(10);equip('percent_softcap_square');
    return {expanded:logValue(expanded)-logValue(multiplyNumberValue(original,knuthGroupPercentMultiplier())),
      squared:logValue(percentPowerSoftcap(10))-logValue(NumberMath.power(expanded,2))};
  `),{expanded:0,squared:0});
});

test('first-group and achievement curves accelerate smoothly and count definitions rather than fixed IDs',()=>{
  const row=run(game(),`
    equip('group_percent_growth');equip('achievement_percent_growth');
    knuthBaseUpgradeLevels.cp_gain=100;knuthBaseUpgradeLevels.dimension_gain=10;
    knuthBaseUpgradeLevels.dyson_limit=999;KNUTH_BASE_UPGRADES.push({id:'future-first',group:1});knuthBaseUpgradeLevels['future-first']=5;
    const total=NumberMath.toNumber(knuthFirstGroupPurchaseCount());
    ACHIEVEMENTS.slice(0,40).forEach(a=>achievementState[a.id]=true);
    const achievement=logValue(knuthAchievementPercentMultiplier());
    const series=[0,50,100,150,200].map(value=>logValue(knuthEquipmentCurve(value,KNUTH_EQUIPMENT_BALANCE.groupPercent)));
    return {total,achievement,series};
  `);
  assert.equal(row.total,115);close(row.achievement,400*(40/49)**1.5);
  for(let i=2;i<row.series.length;i++)assert.ok(row.series[i]-row.series[i-1]>row.series[i-1]-row.series[i-2]);
});

test('achievement counter includes both categories by default and ignores unknown saved IDs',()=>{
  assert.deepEqual(run(game(),`
    ACHIEVEMENTS.filter(a=>a.category!=='secret').slice(0,4).forEach(a=>achievementState[a.id]=true);
    ACHIEVEMENTS.filter(a=>a.category==='secret').slice(0,3).forEach(a=>achievementState[a.id]=true);
    achievementState['unknown-old-id']=true;const all=knuthAchievementCount();
    KNUTH_EQUIPMENT_BALANCE.includeSecretAchievements=false;
    return {all,general:knuthAchievementCount()};
  `),{all:7,general:4});
});

test('combined gain and softcap gear retains its q4 K1 production order with the stronger curves',()=>{
  const rows=run(game(),`
    percentUnlocked=true;squareUpgradeState.percent_power_8=true;abstractionResearchState['8-2']=true;
    const value=NumberMath.fromString('1e1000000000'),baseline=percentFinalUseGain(value,1000);
    equip('group_percent_growth');knuthBaseUpgradeLevels.cp_gain=100;
    const group=logValue(NumberMath.divideApproximate(percentFinalUseGain(value,1000),baseline));
    knuthEquippedUpgradeIds.delete('group_percent_growth');equip('achievement_percent_growth');
    ACHIEVEMENTS.slice(0,40).forEach(a=>achievementState[a.id]=true);
    const achievement=logValue(NumberMath.divideApproximate(percentFinalUseGain(value,1000),baseline));
    return {group,achievement};
  `);
  close(rows.group,5*400*(100/34)**1.1,1e-7);close(rows.achievement,5*400*(40/49)**1.5,1e-7);
});

test('accumulated time SP is linear, affects actual SP payout, and does not boost CP',()=>{
  const row=run(game(),`
    const sp=squarePointGainForValue(NumberMath.fromString('1e100'));
    squarePoints=NumberMath.fromString('1e100');const cp=squareConvergencePointGain();equip('accumulated_time_sp');
    const values=[0,1e6,2e6].map(time=>{numberBlackHoleAccumulatedGameSeconds=time;return NumberMath.toNumber(knuthAccumulatedTimeSpMultiplier());});
    numberBlackHoleAccumulatedGameSeconds=1e6;
    return {values,sp:NumberMath.toNumber(NumberMath.divideApproximate(squarePointGainForValue(NumberMath.fromString('1e100')),sp)),
      cp:NumberMath.toNumber(NumberMath.divideApproximate(squareConvergencePointGain(),cp))};
  `);
  assert.deepEqual(row.values,[1,8,15]);close(row.sp,8);close(row.cp,1);
});

test('purchased-research gear scales both actual rewards and keeps inactive purchases in its count',()=>{
  const row=run(game(),`
    const sp=squarePointGainForValue(NumberMath.fromString('1e100'));
    squarePoints=NumberMath.fromString('1e100');const cp=squareConvergencePointGain();
    const selected=ABSTRACTION_RESEARCHES.filter(r=>!r.branch).slice(0,10);
    selected.forEach(r=>abstractionResearchState[r.id]=true);
    abstractionResearchState['12-1']=true;abstractionResearchState['12-2']=true;
    abstractionSecondBranchPurchaseOrder=['active','passive'];
    knuthRunRealSeconds=()=>300;
    const count=knuthPurchasedAbstractionCount();
    const beforeSp=squarePointGainForValue(NumberMath.fromString('1e100')),beforeCp=squareConvergencePointGain();
    equip('research_resource_growth');const multiplier=knuthResearchResourceMultiplier();
    return {count,inactive:!hasAbstractionResearch('12-2'),m:NumberMath.toNumber(multiplier),
      sp:NumberMath.toNumber(NumberMath.divideApproximate(squarePointGainForValue(NumberMath.fromString('1e100')),beforeSp)),
      cp:NumberMath.toNumber(NumberMath.divideApproximate(squareConvergencePointGain(),beforeCp))};
  `);
  assert.equal(row.count,12);assert.equal(row.inactive,true);close(row.sp,row.m);close(row.cp,row.m);
});

test('Dyson divergence uses current effective Dyson count and is neutral in KC1',()=>{
  const row=run(game(),`
    divergerN=NumberMath.fromString('1e143');const base=divergerProductionValue();equip('dyson_diverger');
    squareBreakthroughLevels.dyson_swarm=12;const boosted=divergerProductionValue();
    activeKnuthChallengeId='kc1';const challenge=divergerProductionValue();
    return {increase:compareNumberValues(boosted,base)>0,challenge:compareNumberValues(challenge,base),
      logIncrease:logValue(boosted)-logValue(base)};
  `);
  assert.equal(row.increase,true);assert.equal(row.challenge,0);close(row.logIncrease,0.045/141,1e-9);
});

test('Dyson amplification aims at a modest final-number gain in the current q4 two-dimension reference chain',()=>{
  const row=run(game(),`
    percentUnlocked=true;squareUpgradeState.percent_power_8=true;abstractionResearchState['8-2']=true;
    for(const id of ['3-1','3-2','4-2','5-1','6-1'])generalizationResearchState[id]=true;
    divergerN=NumberMath.fromString('1e143');squareBreakthroughLevels.dyson_swarm=12;
    divergerPower=divergerProductionValue();const value=NumberMath.fromString('1e2000000');
    const before=percentFinalUseGain(value,1000);equip('dyson_diverger');divergerPower=divergerProductionValue();
    return {ratio:NumberMath.toNumber(NumberMath.divideApproximate(percentFinalUseGain(value,1000),before))};
  `);
  assert.ok(row.ratio>7&&row.ratio<12,JSON.stringify(row));
});

test('black-hole gear boosts final time only while keeping radius, mass, donation speed and existing cap',()=>{
  const row=run(game(),`
    numberBlackHoleSystemEnabled=true;numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    numberBlackHoleDonationRate=11;const radius=NumberMath.serialize(numberBlackHoleSchwarzschildRadius());
    const before=numberBlackHoleTimeMultiplier();divergerPower=NumberMath.fromString('1e1000');equip('diverger_black_hole');
    const ratio=numberBlackHoleTimeMultiplier()/before;
    const same=radius===NumberMath.serialize(numberBlackHoleSchwarzschildRadius())&&numberBlackHoleDonationRate===11;
    const tick=gameTick(1000)/1000;numberBlackHoleSystemEnabled=false;const disabled=numberBlackHoleTimeMultiplier();
    numberBlackHoleSystemEnabled=true;divergerPower=NumberMath.fromString('1e1e1000');const huge=numberBlackHoleTimeMultiplier();
    return {ratio,same,tick,disabled,huge,cap:NUMBER_BLACK_HOLE_MAX_TIME_MULTIPLIER};
  `);
  close(row.ratio,101);assert.equal(row.same,true);assert.ok(row.tick>1);assert.equal(row.disabled,1);assert.equal(row.huge,row.cap);
});

test('tier-4.5 curves match reference 34 purchases, 20 researches, e173 power and 49 achievements',()=>{
  const row=run(game(),`
    for(const id of ['group_percent_growth','research_resource_growth','diverger_black_hole','achievement_percent_growth'])equip(id);
    Object.assign(knuthBaseUpgradeLevels,{cp_gain:7,sp_gain:9,kp_gain:5,diverger_gain:4,dimension_gain:9});
    ABSTRACTION_RESEARCHES.slice(0,20).forEach(r=>abstractionResearchState[r.id]=true);
    ACHIEVEMENTS.slice(0,49).forEach(a=>achievementState[a.id]=true);
    divergerPower=NumberMath.fromString('1.9e173');
    return {count:knuthFirstGroupPurchaseCount(),research:knuthPurchasedAbstractionCount(),achievements:knuthAchievementCount(),
      logarithms:[knuthGroupPercentMultiplier(),knuthResearchResourceMultiplier(),knuthDivergerBlackHoleMultiplier(),knuthAchievementPercentMultiplier()].map(logValue)};
  `);
  assert.equal(Number(row.count),34);assert.equal(row.research,20);assert.equal(row.achievements,49);
  const expected=[400,1.5,Math.log10(1+100*((173+Math.log10(1.9))/1000)**1.1),400];
  row.logarithms.forEach((value,i)=>close(value,expected[i],1e-6));
});

test('each percent/cap upgrade adds 1.5 SP exponents through the actual q4 K1 root-2400 chain',()=>{
  for(const [id,key] of [
    ['group_percent_growth','groupPercent'],
    ['achievement_percent_growth','achievementPercent']
  ]) {
    const row=run(game(),`
      squareUpgradeState.percent_power_8=true;abstractionResearchState['8-2']=true;
      generalizationResearchState['5-2']=true;equip('percent_softcap_square');equip('${id}');
      Object.assign(knuthBaseUpgradeLevels,{cp_gain:7,sp_gain:9,kp_gain:5,diverger_gain:4,dimension_gain:9});
      ACHIEVEMENTS.slice(0,49).forEach(a=>achievementState[a.id]=true);
      const value=NumberMath.fromString('1e891000000'),power=111499989;
      const balance=KNUTH_EQUIPMENT_BALANCE.${key},updated={...balance};
      const measure=()=>{const after=percentUseValueAfterOne(value,power);return {
        number:logValue(after),sp:logValue(squarePointGainForValue(after)),gain:logValue(percentFinalUseGain(value,power))};};
      balance.strength=0;
      const before=measure(),oldMultiplier=logValue(knuthEquipmentPercentMultiplier());
      Object.assign(balance,updated);const after=measure();
      return {number:after.number-before.number,sp:after.sp-before.sp,gain:after.gain-before.gain,oldMultiplier};
    `);
    close(row.gain,9*(400-row.oldMultiplier),1e-7);
    close(row.number,row.gain,1e-7);
    close(row.sp,1.5,1e-6);
  }
});

test('twenty researched nodes give actual SP and CP rewards a roughly 31.6 multiplier',()=>{
  const row=run(game(),`
    ABSTRACTION_RESEARCHES.slice(0,20).forEach(r=>abstractionResearchState[r.id]=true);
    const value=NumberMath.fromString('1e891000000');squarePoints=NumberMath.fromString('1e371000');
    const beforeSp=squarePointGainForValue(value),beforeCp=squareConvergencePointGain();
    equip('research_resource_growth');
    return {sp:logValue(NumberMath.divideApproximate(squarePointGainForValue(value),beforeSp)),
      cp:logValue(NumberMath.divideApproximate(squareConvergencePointGain(),beforeCp))};
  `);
  close(row.sp,1.5,1e-6);close(row.cp,1.5,1e-6);
});

test('black-hole gear gives moderate reference speed and still grows at later divergence levels',()=>{
  const rows=run(game(),`
    numberBlackHoleSystemEnabled=true;numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');equip('diverger_black_hole');
    return ['1.9e173','1.19e8270'].map(value=>{
      divergerPower=NumberMath.fromString(value);const balance=KNUTH_EQUIPMENT_BALANCE.divergerBlackHole;
      const strength=balance.strength;balance.strength=0;const before=numberBlackHoleTimeMultiplier();
      balance.strength=strength;return numberBlackHoleTimeMultiplier()/before;
    });
  `);
  close(rows[0],1+100*((173+Math.log10(1.9))/1000)**1.1);
  close(rows[1],1+100*((8270+Math.log10(1.19))/1000)**1.1);
  assert.ok(rows[0]>15&&rows[0]<16);assert.ok(rows[1]>rows[0]);
});

test('all four three-slot curves are weaker than their previous tier-6.5 versions',()=>{
  const rows=run(game(),`
    return [['groupPercent',34,8000000],['researchResources',20,30],
      ['divergerBlackHole',173+Math.log10(1.9),5900],['achievementPercent',49,8000000]]
      .map(([key,input,oldStrength])=>{
        const balance=KNUTH_EQUIPMENT_BALANCE[key];
        const current=knuthEquipmentCurve(input,balance),previous=knuthEquipmentCurve(input,{...balance,strength:oldStrength});
        return {weaker:compareNumberValues(current,previous)<0,meaningful:compareNumberValues(current,10)>0};
      });
  `);
  for(const row of rows)assert.deepEqual(row,{weaker:true,meaningful:true});
});

test('stellar divergence modestly improves actual final gain without changing its neutral rules',()=>{
  const row=run(game(),`
    percentUnlocked=true;squareUpgradeState.percent_power_8=true;abstractionResearchState['8-2']=true;
    for(const id of ['3-1','3-2','4-2','5-1','6-1'])generalizationResearchState[id]=true;
    divergerN=NumberMath.fromString('1e143');squareBreakthroughLevels.dyson_swarm=12;equip('dyson_diverger');
    const balance=KNUTH_EQUIPMENT_BALANCE.dysonDiverger,current=balance.logStrength;
    balance.logStrength=0.03;divergerPower=divergerProductionValue();const before=percentFinalUseGain('1e2000000',1000);
    balance.logStrength=current;divergerPower=divergerProductionValue();const after=percentFinalUseGain('1e2000000',1000);
    squareBreakthroughLevels.dyson_swarm=0;const noDyson=NumberMath.toNumber(knuthDysonDivergerMultiplier('1e141'));
    return {ratio:NumberMath.toNumber(NumberMath.divideApproximate(after,before)),noDyson,
      coefficient:balance.logStrength,description:KNUTH_SLOT_UPGRADES.find(u=>u.id==='dyson_diverger').description};
  `);
  assert.ok(row.ratio>2&&row.ratio<3,JSON.stringify(row));
  assert.equal(row.noDyson,1);assert.equal(row.coefficient,0.045);assert.ok(row.description.includes('0.045'));
});

test('tier-4.5 exponent curves are neutral at zero and remain ordered for layered inputs',()=>{
  assert.deepEqual(run(game(),`
    const valid=Object.values(KNUTH_EQUIPMENT_BALANCE).filter(balance=>balance?.exponential).every(balance=>{
      let previous=0;
      return [0,1,'1e1000','1e1e1000'].every(input=>{
        const value=knuthEquipmentCurve(input,balance);
        const ok=compareNumberValues(value,previous)>0&&isPositiveNumberValue(value)
          &&!(/NaN|undefined|Infinity/.test(NumberMath.serialize(value)))
          &&(input!==0||compareNumberValues(value,1)===0);
        previous=value;return ok;
      });
    });return {valid};
  `),{valid:true});
});

test('both percent curves keep giant q4/q8 use batches bounded across the billion-exponent fast-path boundary',()=>{
  for(const squared of [false,true]) {
    const row=run(game(),`
      percentUnlocked=true;squareUpgradeState.percent_power_8=true;abstractionResearchState['8-2']=true;
      for(const id of ['group_percent_growth','achievement_percent_growth','percent_softcap_square'])equip(id);
      if(${squared})equip('percent_gain_square');
      Object.assign(knuthBaseUpgradeLevels,{cp_gain:7,sp_gain:9,kp_gain:5,diverger_gain:4,dimension_gain:9});
      ACHIEVEMENTS.slice(0,49).forEach(a=>achievementState[a.id]=true);
      let calls=0;const original=percentFinalUseGain;
      percentFinalUseGain=(...args)=>{calls++;return original(...args);};
      setBaseNumber(NumberMath.fromString('1e999999900'));applyPercentUsesBatch(124999977,1e100,'bulk');
      return {calls,log:logValue(getBaseNumber()),sane:!(/NaN|undefined|Infinity/.test(NumberMath.serialize(getBaseNumber())))};
    `);
    assert.ok(row.calls<150);assert.ok(row.log>1e9);assert.equal(row.sane,true);
  }
});

test('giant input currencies stay positive and ordered without native overflow or zero prices',()=>{
  assert.deepEqual(run(game(),`
    equip('accumulated_time_sp');numberBlackHoleAccumulatedGameSeconds=NumberMath.fromString('1e1e1000');
    const time=knuthAccumulatedTimeSpMultiplier();
    return {positive:compareNumberValues(time,1)>0,finite:!NumberMath.serialize(time).includes('NaN'),
      monotonic:compareNumberValues(knuthEquipmentCurve('1e1001',KNUTH_EQUIPMENT_BALANCE.groupPercent),
        knuthEquipmentCurve('1e1000',KNUTH_EQUIPMENT_BALANCE.groupPercent))>0};
  `),{positive:true,finite:true,monotonic:true});
});

test('64-operation second path deactivates on removal, restores without rebuying, and never refunds on removal',()=>{
  assert.deepEqual(run(game(),`
    secondReady();toggleKnuthUpgrade('second_branch_expansion');
    const first=buyPath('passive'),second=buyPath('idle');const spent=greatTheory,refund=abstractionResearchRefund();
    const order=[...abstractionSecondBranchPurchaseOrder];toggleKnuthUpgrade('second_branch_expansion');
    const inactive=hasPurchasedAbstractionResearch('14-3')&&!hasAbstractionResearch('14-3');
    const retained=hasAbstractionResearch('14-2');const rebuy=researchAbstraction('14-3');
    const noRefund=greatTheory===spent&&abstractionResearchRefund()===refund;
    toggleKnuthUpgrade('second_branch_expansion');
    return {first,second,order,inactive,retained,rebuy,noRefund,restored:hasAbstractionResearch('14-3'),samePaid:greatTheory===spent};
  `),{first:[true,true,true],second:[true,true,true],order:['passive','idle'],inactive:true,retained:true,rebuy:false,noRefund:true,restored:true,samePaid:true});
});

test('deactivated second path contributes no resource, KP, parameter or speed effects',()=>{
  const row=run(game(),`
    secondReady();toggleKnuthUpgrade('second_branch_expansion');buyPath('passive');buyPath('idle');
    knuthRunStartedAtMs=Date.now()-300000;shortestKnuthRealSeconds=300;longestKnuthRealSeconds=300;
    const both={cp:abstractionSecondBranchResourceMultiplier('cp'),kp:abstractionSecondBranchKpMultiplier(),
      parameter:abstractionSecondBranchParameterMultiplier('a'),speed:abstractionSecondBranchDivergerSpeed()};
    toggleKnuthUpgrade('second_branch_expansion');
    return {both,single:{cp:abstractionSecondBranchResourceMultiplier('cp'),kp:abstractionSecondBranchKpMultiplier(),
      parameter:abstractionSecondBranchParameterMultiplier('a'),speed:abstractionSecondBranchDivergerSpeed()}};
  `);
  close(row.both.cp,6275,1e-4);close(row.both.kp,78.375,1e-4);close(row.both.parameter,7.5);close(row.both.speed,0.15);
  assert.deepEqual(row.single,{cp:50,kp:5.5,parameter:1.5,speed:1.5});
});

test('64-operation selection caps at two, prioritizes both requested parents and preserves atomic affordability',()=>{
  assert.deepEqual(run(game(),`
    secondReady();equip('second_branch_expansion');
    setAbstractionBranchPriority(2,0,'passive');setAbstractionBranchPriority(2,1,'active');
    ABSTRACTION_RESEARCHES.push({id:'future-join',parents:['14-1','14-2','14-3'],greatTheoryCost:2});
    const plan=researchPurchasePlan('abstraction','future-join');greatTheory=plan.cost-1;
    const insufficient=purchaseResearchWithParents('abstraction','future-join');
    const untouched=['12-1','12-2','12-3'].every(id=>!hasPurchasedAbstractionResearch(id));
    greatTheory=plan.cost;const bought=purchaseResearchWithParents('abstraction','future-join');
    return {insufficient,untouched,bought,balance:greatTheory,order:abstractionSecondBranchPurchaseOrder,
      paths:['14-1','14-2','14-3'].map(hasAbstractionResearch),third:canResearchAbstraction('12-3')};
  `),{insufficient:false,untouched:true,bought:true,balance:0,order:['passive','active'],paths:[true,true,false],third:false});
});

test('save/load preserves purchase order, inactive ownership, paid costs, priorities and new equipment',()=>{
  assert.deepEqual(run(game(),`
    secondReady();equip('second_branch_expansion');buyPath('idle');buyPath('passive');
    setAbstractionBranchPriority(2,1,'active');toggleKnuthUpgrade('second_branch_expansion');
    equip('research_resource_growth');saveGame();const saved=localStorage.getItem(SAVE_KEY),refund=abstractionResearchRefund();
    abstractionSecondBranchPurchaseOrder=[];knuthEquippedUpgradeIds.clear();loadGame(saved,{countAsLoad:false});
    return {order:abstractionSecondBranchPurchaseOrder,active:hasAbstractionResearch('14-3'),
      inactive:!hasAbstractionResearch('14-2')&&hasPurchasedAbstractionResearch('14-2'),
      refund:abstractionResearchRefund()===refund,gear:hasKnuthUpgrade('research_resource_growth'),
      priority:abstractionBranchPriorities[2][1],errors};
  `),{order:['idle','passive'],active:true,inactive:true,refund:true,gear:true,priority:'active',errors:[]});
});

test('KP reservation refunds inactive research too and clears order only when abstraction really resets',()=>{
  assert.deepEqual(run(game(),`
    secondReady();equip('second_branch_expansion');buyPath('active');buyPath('passive');
    toggleKnuthUpgrade('second_branch_expansion');const refund=abstractionResearchRefund(),before=greatTheory;
    resetProgressForNewKnuthRun();const preserved=abstractionSecondBranchPurchaseOrder.join(',')==='active,passive';
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {preserved,refunded:greatTheory===before+refund,order:abstractionSecondBranchPurchaseOrder,
      cleared:ABSTRACTION_RESEARCHES.every(r=>!hasPurchasedAbstractionResearch(r.id))};
  `),{preserved:true,refunded:true,order:[],cleared:true});
});

test('developer tools can remove inactive research without overwriting paid-cost records and toggle all new gear',()=>{
  assert.deepEqual(run(game(),`
    secondReady();forceUnlockDevUpgrade('knuth','second_branch_expansion');buyPath('passive');buyPath('active');
    removeDevUpgrade('knuth','second_branch_expansion');const paid=abstractionResearchPaidCosts['14-1'];
    forceUnlockDevUpgrade('abstraction','14-1');const retained=abstractionResearchPaidCosts['14-1']===paid;
    const removed=removeDevUpgrade('abstraction','14-1');
    const all=KNUTH_SLOT_UPGRADES.filter(u=>u.slots>1).every(u=>forceUnlockDevUpgrade('knuth',u.id)&&removeDevUpgrade('knuth',u.id));
    return {retained,removed,all};
  `),{retained:true,removed:true,all:true});
});

test('older one-path saves infer their existing choice and leave every new equipment effect off',()=>{
  assert.deepEqual(run(game(),`
    abstractionResearchState['12-3']=true;loadAbstractionSecondBranchOrder(undefined);
    const inferred=[...abstractionSecondBranchPurchaseOrder];saveGame();const data=JSON.parse(localStorage.getItem(SAVE_KEY));
    delete data.abstractionSecondBranchPurchaseOrder;equip('percent_gain_square');equip('second_branch_expansion');
    loadGame(JSON.stringify(data),{countAsLoad:false});
    return {inferred,order:abstractionSecondBranchPurchaseOrder,active:hasAbstractionResearch('12-3'),
      newOff:KNUTH_SLOT_UPGRADES.filter(u=>u.slots>1).every(u=>!hasKnuthUpgrade(u.id)),errors};
  `),{inferred:['idle'],order:['idle'],active:true,newOff:true,errors:[]});
});

test('normal Dyson purchases and equip changes refresh divergence immediately without changing the stored base formula',()=>{
  assert.deepEqual(run(game(),`
    generalizationResearchState['3-2']=true;knuthOperationLevel=100;completedKnuthChallengeIds.add('kc1');
    divergerN=NumberMath.fromString('1e143');divergerPower=divergerProductionValue();
    const base=divergerPower;toggleKnuthUpgrade('dyson_diverger');squarePoints=NumberMath.fromString('1e20');
    const bought=buySquareBreakthroughUpgrade('dyson_swarm');const changed=compareNumberValues(divergerPower,base)>0;
    toggleKnuthUpgrade('dyson_diverger');
    return {bought,changed,restored:compareNumberValues(divergerPower,base)===0,n:NumberMath.serialize(divergerN)};
  `),{bought:true,changed:true,restored:true,n:'1e143'});
});

test('cancelling every research in the first purchased path promotes the remaining path',()=>{
  assert.deepEqual(run(game(),`
    secondReady();equip('second_branch_expansion');buyPath('passive');buyPath('active');toggleKnuthUpgrade('second_branch_expansion');
    const before=hasAbstractionResearch('14-1');
    for(const research of ABSTRACTION_RESEARCHES.filter(r=>r.branchGroup===2&&r.branch==='passive')) {
      removeDevUpgrade('abstraction',research.id);
    }
    return {before,after:hasAbstractionResearch('14-1'),order:abstractionSecondBranchPurchaseOrder};
  `),{before:false,after:true,order:['active']});
});
