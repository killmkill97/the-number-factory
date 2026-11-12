const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const source = file => fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8');

test('reusing graph production preserves n, power, timer, sample values and scale at every cycle boundary', () => {
  for (const mode of ['plain','n-speed','dyson','expansion']) for (const cycles of [0,1,2,511,512,513,1e9]) {
    const snapshots=[];
    for (const reference of [true,false]) {
      const ctx=game(true);
      snapshots.push(run(ctx,`
        generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
        divergerA=2;divergerB=1.2;divergerC=2;divergerInterval=1000;divergerN=1;divergerTimer=0;
        gameTick=elapsed=>elapsed;
        if('${mode}'==='n-speed')abstractionResearchState['17-4']=true;
        if('${mode}'==='dyson'){knuthEquippedUpgradeIds.add('dyson_diverger');squareBreakthroughLevels.dyson_swarm=3;}
        if('${mode}'==='expansion'){spaceExpansionActive=true;knuthBaseUpgradeLevels.space_expansion=1;knuthBaseUpgradeLevels.diverger_gain=2;}
        const interval=divergerEffectiveInterval();let calls=0;const production=divergerProductionValue,graph=divergerProductionForGraph;
        divergerProductionValue=(...args)=>{calls++;return production(...args);};
        if(${reference})divergerProductionForGraph=n=>graph(n);
        const changed=advanceDiverger(${cycles}*interval);
        return {changed,n:NumberMath.serialize(divergerN),power:NumberMath.serialize(divergerPower),timer:divergerTimer,
          samples:divergerGraphSamples,min:divergerGraphScaleMinimum,max:divergerGraphScaleMaximum,calls};
      `));
    }
    const [before,after]=snapshots;
    assert.deepEqual({...after,calls:undefined},{...before,calls:undefined},`${mode}:${cycles}`);
    assert.equal(after.calls*2,before.calls,`${mode}:${cycles} duplicated production`);
  }
});

test('graph conversion also reuses sub-unit production without changing its negative logarithm', () => {
  const r=run(game(),`
    const value=NumberMath.normalize(2,-12);const before=divergerProductionForGraph;
    divergerProductionValue=()=>value;
    return [before(1),before(1,value)];
  `);
  assert.equal(r[0],r[1]);assert.ok(r[0]<0);
});

test('Diverger input snapshots match uncached production with n-dependent Dyson feedback and expire after each pass', () => {
  const rows=[];
  for(const reference of [true,false]){
    const ctx=game(true);
    rows.push(run(ctx,`
      generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
      abstractionResearchState['4-2']=true;abstractionResearchState['17-4']=true;abstractionResearchState['18-7']=true;
      abstractionResearchState['19-2']=true;abstractionResearchState['14-1']=true;knuthPoints=1e100;
      knuthBaseUpgradeLevels.probabilizer=1;randomPower=1e30;divergerA=1e20;divergerB=2;divergerC=20;
      knuthEquippedUpgradeIds.add('dyson_diverger');gameTick=elapsed=>elapsed;
      let inputs=0;const original=abstractionEffectiveDivergerA;
      abstractionEffectiveDivergerA=()=>{inputs++;return original();};
      if(${reference})withDivergerProductionInputs=operation=>operation();
      advanceDiverger(divergerEffectiveInterval()*1e9);
      const first={n:NumberMath.serialize(divergerN),power:NumberMath.serialize(divergerPower),samples:[...divergerGraphSamples]};
      const firstCalls=inputs;divergerA=multiplyNumberValue(divergerA,2);advanceDiverger(divergerEffectiveInterval()*10);
      return {first,n:NumberMath.serialize(divergerN),power:NumberMath.serialize(divergerPower),samples:divergerGraphSamples,
        firstCalls,cleared:divergerProductionInputCache===null};
    `));
  }
  assert.deepEqual({...rows[1],firstCalls:undefined},{...rows[0],firstCalls:undefined});
  assert.ok(rows[1].firstCalls<=2);assert.ok(rows[0].firstCalls>33);
});

test('Diverger input snapshots clear on errors and do not cache n, Dyson bonuses or subsequent upgrades', () => {
  assert.deepEqual(run(game(true),`
    generalizationResearchState['3-2']=true;
    const before=divergerProductionBeforeDyson(10);let nested;
    withDivergerProductionInputs(()=>{nested=withDivergerProductionInputs(()=>divergerProductionBeforeDyson(20));});
    try{withDivergerProductionInputs(()=>{divergerProductionBeforeDyson(30);throw Error('test');});}catch{}
    const cleared=divergerProductionInputCache===null;applyDivergerAUpgrade(false);
    const after=divergerProductionBeforeDyson(10);
    return {grew:compareNumberValues(nested,before)>0,cleared,upgrade:compareNumberValues(after,multiplyNumberValue(before,2))===0};
  `),{grew:true,cleared:true,upgrade:true});
});

function priceContext() {
  const ctx=game(true);
  ctx.loadSource(`percentUnlocked=true;percentPower=1001;percentPowerPurchaseCount=1000;percentPowerUpgradeCost=0;
    percentPowerCostCompounding=true;percentChargeNeeded=1;
    generalizationResearchState['3-3']=true;percentLaneCount=16;
    for(let i=2;i<=16;i++){const lane=makePercentLane(i);lane.power=1001;lane.powerPurchaseCount=1000;
      lane.powerCost=0;lane.powerCostCompounding=true;extraPercentLanes.push(lane);}
    let dysonCalls=0;const oldDyson=dysonEffectMultiplier;
    dysonEffectMultiplier=()=>{dysonCalls++;return oldDyson();};
    function prices(){return JSON.stringify([percentPowerUpgradeCost,percentPowerCostCompounding,
      ...extraPercentLanes.map(lane=>[lane.powerCost,lane.powerCostCompounding])]);}`);
  return ctx;
}

test('one validation snapshot repairs all 16 lanes identically with only one acceleration calculation', () => {
  const actual=priceContext(), reference=priceContext();
  const optimized=run(actual,`withPercentPriceValidationCache(()=>{repairPercentPowerCostState();repairExtraPercentLanePowerCosts();});
    return {prices:prices(),calls:dysonCalls,cleared:percentPriceValidationCache===null};`);
  const ordinary=run(reference,`withPercentPriceValidationCache=operation=>operation();
    repairPercentPowerCostState();repairExtraPercentLanePowerCosts();return {prices:prices(),calls:dysonCalls};`);
  assert.equal(optimized.prices,ordinary.prices);assert.equal(optimized.calls,1);assert.ok(ordinary.calls>=16);assert.ok(optimized.cleared);
});

test('price snapshots are synchronous, nested and exception-safe and never retain outdated effects', () => {
  assert.deepEqual(run(priceContext(),`
    let first,second;
    withPercentPriceValidationCache(()=>{first=percentPowerPriceAccelerationStart();
      withPercentPriceValidationCache(()=>percentPowerPriceAccelerationStart());});
    const firstCalls=dysonCalls;squareBreakthroughLevels.bottleneck_tracker=3;
    withPercentPriceValidationCache(()=>{second=percentPowerPriceAccelerationStart();});
    try{withPercentPriceValidationCache(()=>{percentPowerPriceAccelerationStart();throw Error('test');});}catch{}
    const after=percentPowerPriceAccelerationStart();
    return {firstCalls,changed:second>first,after:after===second,cleared:percentPriceValidationCache===null};
  `),{firstCalls:1,changed:true,after:true,cleared:true});
});

test('all static lane bases retain the original floor recurrence and warm lookups do no arithmetic', () => {
  const r=run(game(true),`
    const rows=[];
    for(const base of [40000,150,250,789]){
      let expected=base;
      for(let lane=1;lane<=16;lane++){
        rows.push(compareNumberValues(scaleByLane(base,lane),expected)===0);
        expected=divideNumberValue(addBaseNumbers(multiplyNumberValue(expected,3),1),2);
      }
    }
    let calls=0;const original=divideNumberValue;
    divideNumberValue=(...args)=>{calls++;return original(...args);};
    for(const base of [40000,150,250])for(let lane=1;lane<=16;lane++)scaleByLane(base,lane);
    return {same:rows.every(Boolean),calls,entries:percentLaneBaseCostCache.size};
  `);
  assert.deepEqual(r,{same:true,calls:0,entries:3});
});

test('render maintenance scopes the shared validation snapshot without changing achievement updates', () => {
  const ctx=priceContext();
  const render=source('core/render.js');
  ctx.loadSource(render.slice(render.indexOf('function updateGameRenderState('),render.indexOf('function renderNow(')));
  assert.deepEqual(run(ctx,`
    let achievements=0;updateAchievements=()=>achievements++;rebasePercentPowerPricesForDiverger=()=>false;
    updateGameRenderState();return {calls:dysonCalls,achievements,cleared:percentPriceValidationCache===null};
  `),{calls:1,achievements:1,cleared:true});
});

test('Knuth renders only the selected panel while keeping shared headers current', () => {
  const ctx=game(true);ctx.loadSource(source('chapters/knuth.js'));
  ctx.loadSource(`let calls=[];renderKnuthSlotDisplay=()=>calls.push('header');
    renderKnuthBaseUpgrades=()=>calls.push('base');renderKnuthUpgradeGroups=()=>calls.push('equipment');
    renderKnuthAdvancedEquipment=()=>calls.push('advanced');renderKnuthChallenges=()=>calls.push('challenges');
    renderAbstractionBoard=()=>calls.push('abstraction');globalThis.renderKnuthProduction=()=>calls.push('production');`);
  for(const [view,expected] of [['base',['base']],['equipment',['equipment','advanced']],['challenges',['challenges']],
    ['production',['production']],['abstraction',['abstraction']]]){
    assert.deepEqual(run(ctx,`activeKnuthView='${view}';calls=[];renderKnuthBoard();return calls;`),['header',...expected]);
    assert.deepEqual(run(ctx,`calls=[];setKnuthView('${view}');return calls;`),expected);
  }
});

test('returning to a previously hidden purchase panel immediately refreshes affordability without game mutations', () => {
  const ctx=game(true);ctx.loadSource(source('chapters/knuth.js'));
  assert.deepEqual(run(ctx,`
    knuthPoints=1;setKnuthView('base');const blocked=knuthBaseUpgradeUi.get('cp_gain').button.disabled;
    renderKnuthChallenges=()=>{};setKnuthView('challenges');knuthPoints=100;
    const before=JSON.stringify(captureGameSaveData());setKnuthView('base');
    const fresh=!knuthBaseUpgradeUi.get('cp_gain').button.disabled;renderKnuthBoard();
    return {blocked,fresh,same:before===JSON.stringify(captureGameSaveData())};
  `),{blocked:true,fresh:true,same:true});
});
