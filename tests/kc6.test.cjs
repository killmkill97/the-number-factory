const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const { operationPriceLog } = require('./helpers/knuth-prices.cjs');

function uiGame(debug = false) {
  const ctx = game();
  ctx.loadSource('document.createDocumentFragment=()=>document.createElement("div");createFormulaHelpButton=()=>null;');
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/chapters/knuth.js'), 'utf8'));
  if (debug) ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/systems/dev-console.js'), 'utf8'));
  return ctx;
}

function resourceGame(withProduction = false) {
  const ctx = game(withProduction);
  ctx.loadSource(`
    squareUnlocked=true;squareConvergenceUnlocked=true;hasEverEarnedSquareConvergencePoint=true;
    knuthOperationLevel=300;knuthPoints=NumberMath.fromString('1e100');
    squareUpgradeState.sp_gain_double=true;squareBreakthroughLevels.extra_investment=5;
    knuthBaseUpgradeLevels.sp_gain=3;knuthBaseUpgradeLevels.cp_gain=3;
    squareConvergenceUpgradeState.cp_gain_5x=true;squareConvergenceUpgradeLevels.cp_gain_5x=10;
    for(const id of ['knuth_time_gain','percent_overflow','research_resource_growth','accumulated_time_sp'])knuthEquippedUpgradeIds.add(id);
    squareRunGameSeconds=10000;knuthPercentOverflow=NumberMath.fromString('1e100');
    numberBlackHoleAccumulatedGameSeconds=1e20;singularityPoints=3;randomPower=NumberMath.fromString('1e50');
    generalizationResearchState['3-2']=true;divergerPower=NumberMath.fromString('1e1000');
    for(const id of ['1-1','5-2','9-1','12-2','13-2','17-1','18-3','23-1','25-1'])abstractionResearchState[id]=true;
    abstractionSecondBranchPurchaseOrder=['passive'];
    setBaseNumber(NumberMath.fromString('1e4800000'));setSquarePoints(NumberMath.fromString('1e4000'));
  `);
  return ctx;
}

test('KC6 goal is e1000 CP, completion is inclusive and manual, and all-KC achievement includes it', () => {
  assert.deepEqual(run(game(), `
    const all=()=>ACHIEVEMENTS.find(a=>a.id==='praise_sticker').condition();
    KNUTH_CHALLENGES.filter(c=>c.id!=='kc6').forEach(c=>completedKnuthChallengeIds.add(c.id));
    const before=all();const started=startKnuthChallenge('kc6');
    squareConvergencePoints=NumberMath.fromString('9e999');const short=canCompleteKnuthChallenge();
    squareConvergencePoints=NumberMath.fromString('1e1000');const ready=canCompleteKnuthChallenge();
    const active=activeKnuthChallengeId,auto=hasCompletedKnuthChallenge('kc6');
    const done=completeKnuthChallenge();
    return {before,started,short,ready,active,auto,done,all:all(),goal:knuthChallenge('kc6').goal,
      unlimited:knuthOperationMaxLevel()===Number.MAX_SAFE_INTEGER};
  `), {before:false,started:true,short:false,ready:true,active:'kc6',auto:false,done:true,all:true,
    goal:'1e1000',unlimited:true});
});

test('KC6 no longer shifts any lane softcap or changes power, bonuses or decay strength', () => {
  const row=run(game(), `
    percentUnlocked=true;
    const lanes=[[1,0],[500,200],[10000000000010,1]];
    const normal=lanes.map(([p,b])=>percentPowerSoftcap(p,b));activeKnuthChallengeId='kc6';
    return {exponent:percentChallengeProductionExponent(),
      same:lanes.every(([p,b],i)=>compareNumberValues(normal[i],percentPowerSoftcap(p,b))===0),
      strength:percentPowerSoftcapDecayPower(),power:percentPower,bonus:percentPowerPurchaseBonus};
  `);
  assert.deepEqual(row,{exponent:1e-10,same:true,strength:2,power:1,bonus:0});
});

test('KC6 keeps existing 5-4 growth and cap powers unchanged', () => {
  const row=run(game(), `
    percentUnlocked=true;activeKnuthChallengeId='kc6';generalizationResearchState['5-4']=true;
    knuthEquippedUpgradeIds.add('percent_softcap_square');
    const cap=percentPowerSoftcap(100,20);
    const expected=NumberMath.power(multiplyNumberValue(PERCENT_POWER_SOFTCAP_START,
      NumberMath.powerOfTen(Math.pow(120,1.5)-1)),2);
    return {same:compareNumberValues(cap,expected)===0,positive:isPositiveNumberValue(cap),
      strength:percentPowerSoftcapDecayPower()};
  `);
  assert.deepEqual(row,{same:true,positive:true,strength:2});
});

test('KC6 roots the whole final percent gain after K1/K2, research, equipment, singularity and random bonuses', () => {
  const rows=run(game(), `
    percentUnlocked=true;knuthBaseUpgradeLevels.advanced_equipment=1;knuthAdvancedOwned.percent_power=2;
    knuthAdvancedEquipped.percent_power=2;singularityPoints=3;
    abstractionRandomPowerPercentMultiplier=()=>NumberMath.fromString('1e100');
    const value=NumberMath.fromString('1e1000');
    return [1,2].flatMap(k=>{
      squareUpgradeState.percent_power_8=k===1;
      return [1,2,4,8].map(q=>{
        abstractionResearchState['8-2']=q>=4;
        if(q===2||q===8)knuthEquippedUpgradeIds.add('percent_gain_square');
        else knuthEquippedUpgradeIds.delete('percent_gain_square');
        activeKnuthChallengeId=null;const normal=percentFinalUseGain(value,10);
        activeKnuthChallengeId='kc6';const actual=percentFinalUseGain(value,10);
        const expected=NumberMath.power(normal,1e-10);
        return {k,q,positive:isPositiveNumberValue(actual),ratio:plain(NumberMath.divideApproximate(actual,expected))};
      });
    });
  `);
  rows.forEach(row=>{assert.equal(row.positive,true,JSON.stringify(row));assert.ok(Math.abs(row.ratio-1)<1e-9,JSON.stringify(row));});
});

test('fractional KC6 bulk matches sequential use below, across and above caps for K1/K2 and q1/q8', () => {
  const rows=run(game(), `
    percentUnlocked=true;activeKnuthChallengeId='kc6';
    return [1,2].flatMap(k=>{
      squareUpgradeState.percent_power_8=k===1;
      return [false,true].flatMap(powered=>[90,1000,1e6].map(start=>{
        abstractionResearchState['8-2']=powered;
        if(powered)knuthEquippedUpgradeIds.add('percent_gain_square');else knuthEquippedUpgradeIds.clear();
        percentPowerSoftcap=()=>100;percentUseGain=value=>multiplyNumberValue(value,0.01);
        let repeated=start;for(let i=0;i<1000;i++)repeated=percentUseValueAfterOne(repeated,1);
        setBaseNumber(start);applyPercentUsesBatch(1,1000,'test');const bulk=getBaseNumber();
        return {k,powered,start,positive:compareNumberValues(bulk,start)>0,
          relative:plain(NumberMath.divideApproximate(bulk,repeated))};
      }));
    });
  `);
  rows.forEach(row=>{
    assert.equal(row.positive,true,JSON.stringify(row));
    assert.ok(Math.abs(row.relative-1)<0.002,JSON.stringify(row));
  });
});

test('KC6 manual and single-batch gains agree while ordinary number production is unchanged', () => {
  const row=run(game(), `
    percentUnlocked=true;activeKnuthChallengeId='kc6';
    const start=NumberMath.fromString('1e1000');
    const expected=percentFinalUseGain(start,1000);
    let final;numberTraceEnabled=true;traceNumberEvent=(kind,event)=>{if(kind==='number-change')final=event.gain;};
    setBaseNumber(start);applyPercentUse(start,1000,'test');
    const traced=final===numberTraceValue(expected);
    setBaseNumber(start);const single=percentUseValueAfterOne(start,1000);applyPercentUsesBatch(1000,1,'test');
    const same=compareNumberValues(single,getBaseNumber())===0;
    const direct=finalNumberProductionGain(100,1,10,1000,0,1);
    return {traced,same,direct:plain(direct),rootLog:logValue(expected),status:percentPowerSoftcapStatus(1,0,10)};
  `);
  assert.equal(row.traced,true);assert.equal(row.same,true);assert.equal(row.direct,100);
  assert.ok(Math.abs(row.rootLog-1e-7)<1e-14,JSON.stringify(row));assert.equal(row.status,'소프트캡 1t 부터 감쇠');
});

test('astronomical KC6 batches keep bounded work and never use a negative time scale', () => {
  const row=run(game(), `
    percentUnlocked=true;activeKnuthChallengeId='kc6';let calls=0;const original=percentFinalUseGain;
    percentFinalUseGain=(...args)=>{calls++;return original(...args);};
    setBaseNumber(1000);applyPercentUsesBatch(1,1e100,'test');
    return {calls,grown:compareNumberValues(getBaseNumber(),1000)>0,positive:isPositiveNumberValue(getBaseNumber())};
  `);
  assert.ok(row.calls<150,JSON.stringify(row));assert.equal(row.grown,true);assert.equal(row.positive,true);
});

test('abandoning KC6 removes only its active restriction and never grants its reward', () => {
  assert.deepEqual(run(game(), `
    startKnuthChallenge('kc6');const restricted=percentChallengeProductionExponent()===1e-10;
    const abandoned=abandonKnuthChallenge();
    return {restricted,abandoned,cap:plain(percentPowerSoftcap(1)),completed:hasCompletedKnuthChallenge('kc6'),
      max:knuthOperationMaxLevel(),active:activeKnuthChallengeId,exponent:percentChallengeProductionExponent()};
  `),{restricted:true,abandoned:true,cap:1e12,completed:false,max:300,active:null,exponent:1});
});

test('KC6 neutralizes SP and CP multiplier aggregates without deleting any purchased state', () => {
  assert.deepEqual(run(resourceGame(), `
    const factors=()=>[squarePointBaseGain(),knuthSpCpGainMultiplier('sp'),knuthSpCpGainMultiplier('cp'),squareConvergenceGainMultiplier()];
    const snapshot=()=>JSON.stringify([squareUpgradeState,squareBreakthroughLevels,squareConvergenceUpgradeLevels,
      knuthBaseUpgradeLevels,abstractionResearchState,[...knuthEquippedUpgradeIds],knuthPoints]);
    const before=snapshot(),normal=factors();activeKnuthChallengeId='kc6';
    const during=factors().map(plain),same=before===snapshot();
    activeKnuthChallengeId='kc2';const restored=factors();
    return {normallyBoosted:normal.every(v=>compareNumberValues(v,1)>0),during,same,
      restored:restored.every(v=>compareNumberValues(v,1)>0),
      kpBoosted:compareNumberValues(abstractionSecondBranchKpMultiplier(),1)>0};
  `),{normallyBoosted:true,during:[1,1,1,1],same:true,restored:true,kpBoosted:true});
});

test('every current CP multiplier source is ignored at the shared payout boundary in KC6', () => {
  const row=run(resourceGame(), `
    activeKnuthChallengeId='kc6';const sources=[
      'knuthSpCpGainMultiplier','abstractionCpGainMultiplier','abstractionKpCpGainMultiplier',
      'knuthBaseMultiplier','abstractionSingularityCpMultiplier','abstractionRadiusCpMultiplier',
      'abstractionProbabilizerCpMultiplier','abstractionBlackHoleCpMultiplier'];
    for(const name of sources)globalThis[name]=()=>{throw Error('suppressed multiplier evaluated: '+name);};
    return {multiplier:plain(squareConvergenceGainMultiplier()),gain:plain(squareConvergencePointGain())};
  `);
  assert.deepEqual(row,{multiplier:1,gain:3984});
});

test('KC6 preserves resource exchange formulas, thresholds and exponent effects while removing only multiplicative bonuses', () => {
  const row=run(resourceGame(), `
    activeKnuthChallengeId='kc6';
    const values=[squarePointExchangeRequirement(),NumberMath.fromString('1e4800000')];
    const sp=values.map(value=>({actual:NumberMath.serialize(squarePointGainForValue(value)),
      expected:NumberMath.serialize(NumberMath.max(NumberMath.log10(divideNumberValue(value,squarePointExchangeRequirement())),1))}));
    generalizationResearchState['5-2']=true;
    const value=values[1];const improved=NumberMath.max(divideNumberValue(NumberMath.power(value,1/2400),gameEndValue()),1);
    const same=compareNumberValues(squarePointGainForValue(value),improved)===0;
    generalizationResearchState['2-2']=true;abstractionResearchState['17-2']=true;
    knuthBaseUpgradeLevels.advanced_equipment=1;knuthAdvancedOwned.cp_power=2;knuthAdvancedEquipped.cp_power=2;
    const base=NumberMath.max(NumberMath.log10(divideNumberValue(squarePoints,squareConvergenceExchangeRequirement())),1);
    const expected=applyKnuthAdvancedPower('cp_power',NumberMath.power(base,ABSTRACTION_TIER17_BALANCE.cpBasePower));
    const cpSame=compareNumberValues(squareConvergencePointGain(),expected)===0;
    setSquarePoints(NumberMath.fromString('1e14'));const cpBelow=plain(squareConvergencePointGain());
    return {sp,same,cpSame,cpBelow,spBelow:plain(squarePointGainForValue(1)),baseline:plain(squarePointGain())};
  `);
  row.sp.forEach(entry=>assert.equal(entry.actual,entry.expected));
  assert.equal(row.same,true);assert.equal(row.cpSame,true);assert.equal(row.cpBelow,0);assert.equal(row.spBelow,0);assert.equal(row.baseline,1);
});

test('KC6 passive SP/CP production uses unmultiplied exchange rewards while retaining one-percent rates and game time', () => {
  const row=run(resourceGame(), `
    activeKnuthChallengeId='kc6';gameTick=ms=>ms*200;
    const spReward=squarePointGainForValue(getBaseNumber()),cpReward=squareConvergencePointGain();
    const perGame=abstractionSpGainPerGameSecond(),perReal=abstractionSpGainPerRealSecond(),cpReal=abstractionCpGainPerRealSecond();
    const oldSp=squarePoints,oldCp=squareConvergencePoints;const changed=advanceAbstraction(1000);
    return {changed,game:plain(NumberMath.divideApproximate(perGame,spReward)),
      real:plain(NumberMath.divideApproximate(perReal,spReward)),cp:plain(NumberMath.divideApproximate(cpReal,cpReward)),
      spSame:compareNumberValues(squarePoints,addBaseNumbers(oldSp,perReal))===0,
      cpSame:compareNumberValues(squareConvergencePoints,addBaseNumbers(oldCp,cpReal))===0};
  `);
  assert.equal(row.changed,true);assert.ok(Math.abs(row.game-0.01)<1e-12);assert.ok(Math.abs(row.real-2)<1e-12);
  assert.ok(Math.abs(row.cp-0.01)<1e-12);assert.equal(row.spSame,true);assert.equal(row.cpSame,true);
});

test('manual and N exchanges both award unmultiplied SP and CP in KC6', () => {
  for(const mode of ['manual','N']){
    assert.deepEqual(run(resourceGame(true), `
      activeKnuthChallengeId='kc6';setSquarePoints(0);
      const expectedSp=squarePointGainForValue(getBaseNumber());
      const sp=${mode==='manual'?'exchangeSquarePointsManually()':"automatiumGameAdapter.square({},null)"};
      const spSame=compareNumberValues(squarePoints,expectedSp)===0;
      setSquarePoints(NumberMath.fromString('1e4000'));const oldCp=squareConvergencePoints;
      const expectedCp=squareConvergencePointGain();
      const tooMuch=automatiumGameAdapter.cp({},addBaseNumbers(expectedCp,1));
      const cp=${mode==='manual'?'exchangeSquareConvergencePointsManually()':"automatiumGameAdapter.cp({},null)"};
      return {sp,spSame,tooMuch,cp,cpSame:compareNumberValues(squareConvergencePoints,addBaseNumbers(oldCp,expectedCp))===0,
        active:activeKnuthChallengeId,exponent:percentChallengeProductionExponent()};
    `),{sp:true,spSame:true,tooMuch:false,cp:true,cpSame:true,active:'kc6',exponent:1e-10},mode);
  }
});

test('loading active KC6 restores suppressed multipliers without wiping levels and completion restores effects', () => {
  const row=run(resourceGame(), `
    activeKnuthChallengeId='kc6';saveGame();const saved=localStorage.getItem(SAVE_KEY);
    activeKnuthChallengeId=null;const boost=compareNumberValues(squareConvergenceGainMultiplier(),1)>0;
    loadGame(saved,{countAsLoad:false});
    const restored=activeKnuthChallengeId==='kc6'&&squarePointBaseGain()===1&&knuthSpCpGainMultiplier()===1&&squareConvergenceGainMultiplier()===1;
    const retained=knuthBaseUpgradeLevel('sp_gain')===3&&squareConvergenceUpgradeLevel('cp_gain_5x')===10
      &&hasAbstractionResearch('12-2')&&hasKnuthUpgrade('percent_overflow');
    squareConvergencePoints=NumberMath.fromString('1e1000');const completed=completeKnuthChallenge();
    return {boost,restored,retained,completed,after:compareNumberValues(squareConvergenceGainMultiplier(),1)>0,errors};
  `);
  assert.deepEqual(row,{boost:true,restored:true,retained:true,completed:true,after:true,errors:[]});
});

test('reward preserves all first-300 prices and then uses the 300th price times e10', () => {
  const rows=run(game(), `
    completedKnuthChallengeIds.add('kc6');
    return Array.from({length:304},(_,level)=>{knuthOperationLevel=level;return {level,price:logValue(knuthOperationUpgradeCost())};});
  `);
  for(const row of rows.slice(0,300)) assert.ok(Math.abs(row.price-operationPriceLog(row.level))<1e-9,JSON.stringify(row));
  assert.ok(Math.abs(rows[300].price-rows[299].price-10)<1e-9);
  assert.ok(Math.abs(rows[301].price-rows[300].price-10)<1e-9);
  assert.ok(Math.abs(rows[302].price-rows[301].price-20)<1e-9);
});

test('each price band squares the growth rate, including boundaries and skipped bands', () => {
  const rows=run(game(), `
    abstractionResearchState['29-1']=true;
    return [190,199,200,299,300,399,400,800].flatMap(exponent=>[1,2,3].map(count=>({exponent,count,
      log:logValue(knuthOperationRewardCostAfterPurchases(NumberMath.powerOfTen(exponent),count)),
      huge:NumberMath.isScientific(NumberMath.log10(knuthOperationRewardCostAfterPurchases(NumberMath.powerOfTen(exponent),count)))})));
  `);
  for(const row of rows){
    let expected=row.exponent;
    for(let i=0;i<row.count;i++) expected+=10*2**Math.max(0,1+Math.floor((row.exponent+i*10-200)/100));
    if(Number.isFinite(expected))assert.ok(Math.abs(row.log-expected)<Math.max(1e-8,expected*1e-12),JSON.stringify(row));
    else assert.equal(row.huge,true,JSON.stringify(row));
  }
});

test('derived reward prices agree between incremental and cold calculation, invalidate on rewind or tuning', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['29-1']=true;
    completedKnuthChallengeIds.add('kc6');
    const equal=[];
    for(let level=300;level<350;level++){
      knuthOperationLevel=level;const warm=knuthOperationUpgradeCost();const reused=knuthOperationUpgradeCost()===warm;
      knuthOperationRewardCostCache=null;const cold=knuthOperationUpgradeCost();
      equal.push(reused&&(cold===null?warm===null:
        Math.abs(plain(NumberMath.divideApproximate(warm,cold))-1)<1e-10));
    }
    knuthOperationLevel=300;const rewound=logValue(knuthOperationUpgradeCost());
    KC6_BALANCE.operationGrowthExponent=12;const tuned=logValue(knuthOperationUpgradeCost());
    return {equal:equal.every(Boolean),rewound:Math.abs(rewound-logValue(knuthOperationLegacyCost(299))-10)<1e-9,
      tuned:Math.abs(tuned-rewound-2)<1e-9};
  `),{equal:true,rewound:true,tuned:true});
});

test('manual, auto and N purchases pass 300 and preserve shared capacity and prices', () => {
  for(const kind of ['manual','auto','N']){
    const row=run(game(), `
      completedKnuthChallengeIds.add('kc6');completedKnuthChallengeIds.add('kc5');
      knuthOperationLevel=300;knuthPoints=knuthOperationUpgradeCost();abstractionResearchState['16-2']=true;
      knuthBaseAutoEnabled.operation=true;gameTick=()=>1e100;
      const bought=${kind==='manual'?'buyKnuthOperationUpgrade()':kind==='auto'?'advanceKnuthBaseAutomation(1000)':"executeN('buy knuth operation')"};
      const snapshot=nKnuthUpgradeSnapshot('operation',{});
      return {bought,level:knuthOperationLevel,kp:plain(knuthPoints),capacity:knuthSlotCapacity(),
        max:snapshot.max,available:snapshot.available};
    `);
    assert.deepEqual(row,{bought:true,level:301,kp:0,capacity:376,max:0,available:false},kind);
  }
});

test('large rewarded slot prices stay positive and unaffordable purchases leave progress unchanged', () => {
  assert.deepEqual(run(uiGame(), `
    abstractionResearchState['29-1']=true;
    completedKnuthChallengeIds.add('kc5');completedKnuthChallengeIds.add('kc6');
    knuthOperationLevel=1000;knuthPoints=123;
    const cost=knuthOperationUpgradeCost();const before=NumberMath.serialize(knuthPoints);
    knuthBaseAutoEnabled.operation=true;gameTick=()=>1e100;generalizationResearchState['3-4']=true;
    const manual=buyKnuthOperationUpgrade(),auto=advanceKnuthBaseAutomation(1000);executeN('buy knuth operation');
    let throws=false;try{automatiumGameAdapter.get([{name:'knuth',index:null},{name:'operation',index:null},{name:'cost',index:null}],{});}catch{throws=true;}
    renderKnuthBoard();
    return {valid:cost!==null&&isPositiveNumberValue(cost),manual,auto,level:knuthOperationLevel,same:before===NumberMath.serialize(knuthPoints),throws,
      disabled:knuthOperationUpgradeBtn.disabled,reference:knuthOperationUpgradeCostText.textContent.includes('상승 기준')};
  `),{valid:true,manual:false,auto:false,level:1000,same:true,throws:false,disabled:true,reference:true});
});

test('KC5 still blocks rewarded slot purchases and uses its separate rounded capacity reduction', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc6');knuthOperationLevel=301;knuthPoints=NumberMath.fromString('1e1000');
    abstractionResearchState['16-2']=true;activeKnuthChallengeId='kc5';
    return {bought:buyKnuthOperationUpgrade(),slots:knuthSlotCapacity(),cap:plain(percentPowerSoftcap(1))};
  `),{bought:false,slots:125,cap:1e12});
});

test('KC6 active restriction and completed reward restore independently through existing saves', () => {
  assert.deepEqual(run(game(), `
    startKnuthChallenge('kc6');saveGame();const active=localStorage.getItem(SAVE_KEY);
    abandonKnuthChallenge();loadGame(active,{countAsLoad:false});const restored=activeKnuthChallengeId;
    const restricted=percentChallengeProductionExponent()===1e-10&&plain(percentPowerSoftcap(1))===1e12;
    activeKnuthChallengeId=null;completedKnuthChallengeIds.add('kc6');knuthOperationLevel=301;knuthPoints=knuthOperationUpgradeCost();
    saveGame();const completed=localStorage.getItem(SAVE_KEY);
    completedKnuthChallengeIds.clear();knuthOperationLevel=0;loadGame(completed,{countAsLoad:false});
    const rewarded=hasCompletedKnuthChallenge('kc6')&&buyKnuthOperationUpgrade();
    const old=JSON.parse(completed);delete old.completedKnuthChallengeIds;delete old.activeKnuthChallengeId;
    loadGame(JSON.stringify(old),{countAsLoad:false});
    return {restored,restricted,rewarded,oldLevel:knuthOperationLevel,oldLimited:!buyKnuthOperationUpgrade(),errors};
  `),{restored:'kc6',restricted:true,rewarded:true,oldLevel:301,oldLimited:true,errors:[]});
});

test('KC6 card starts and abandons normally and explains the reward after completion', () => {
  const row=run(uiGame(), `
    renderKnuthChallenges();knuthChallengeKc6Btn.events.click();const started=activeKnuthChallengeId;
    renderKnuthChallenges();const activeLabel=knuthChallengeKc6Btn.textContent;
    knuthChallengeKc6Btn.events.click();const abandoned=activeKnuthChallengeId===null;
    completedKnuthChallengeIds.add('kc6');knuthOperationLevel=300;knuthPoints=knuthOperationUpgradeCost();
    setKnuthView('challenges');const completed=knuthChallengeKc6Status.textContent;
    setKnuthView('base');renderKnuthBoard();
    return {started,activeLabel,abandoned,completed,
      enabled:!knuthOperationUpgradeBtn.disabled,rule:knuthOperationPriceRule.textContent};
  `);
  assert.equal(row.started,'kc6');assert.equal(row.abandoned,true);assert.equal(row.enabled,true);
  assert.match(row.activeLabel,/포기/);assert.equal(row.completed,'완료');assert.match(row.rule,/301번째/);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/id="knuthChallengeKc6"/);assert.match(html,/1e-10제곱/);assert.doesNotMatch(html,/10t단계/);assert.match(html,/목표: 1e1000 CP/);
});

test('debug shift completion/removal changes the reward without erasing slots and stays debug-only', () => {
  assert.deepEqual(run(uiGame(true), `
    knuthOperationLevel=301;renderKnuthChallenges();
    const event={type:'click',shiftKey:true,target:{closest:()=>knuthChallengeKc6Btn},preventDefault(){},stopImmediatePropagation(){}};
    handleDevChallengePointer(event);const closed=hasCompletedKnuthChallenge('kc6');
    devConsole.visible=true;document.body.classList.add('dev-console-open');renderKnuthChallenges();
    handleDevChallengePointer(event);renderKnuthChallenges();
    const complete=hasCompletedKnuthChallenge('kc6'),enabled=!knuthChallengeKc6Btn.disabled;
    event.type='contextmenu';handleDevChallengePointer(event);
    return {closed,complete,enabled,removed:!hasCompletedKnuthChallenge('kc6'),level:knuthOperationLevel,max:knuthOperationMaxLevel()};
  `),{closed:false,complete:true,enabled:true,removed:true,level:301,max:300});
});
