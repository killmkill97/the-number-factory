const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function close(actual, expected, tolerance=1e-8) {
  assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
}

test('four nonexclusive researches cost 100 each and use the requested split parents', () => {
  assert.deepEqual(run(game(), `
    greatTheory=400;const ids=['17-1','17-2','17-3','17-4'];const locked=ids.map(canResearchAbstraction);
    abstractionResearchState['16-1']=true;const first=ids.map(canResearchAbstraction);
    abstractionResearchState['16-2']=true;greatTheory=99;const poor=ids.map(researchAbstraction);
    greatTheory=400;const bought=ids.map(researchAbstraction);
    return {locked,first,poor,bought,left:plain(greatTheory),paid:ids.map(id=>abstractionResearchPaidCosts[id])};
  `), {locked:[false,false,false,false],first:[true,true,false,false],poor:[false,false,false,false],
    bought:[true,true,true,true],left:0,paid:[100,100,100,100]});
});

test('held singularities accelerate CP in log space; zero, unresearched and spent holdings remain correct', () => {
  const row=run(game(), `
    singularityPoints=2;const off=plain(abstractionSingularityCpMultiplier());abstractionResearchState['17-1']=true;
    const logs=[0,1,2,3,4].map(s=>{singularityPoints=s;return logValue(abstractionSingularityCpMultiplier());});
    singularityPoints=2;singularityUpgradeLevels.black_hole=0;buySingularityUpgrade('black_hole');
    return {off,logs,spent:logValue(abstractionSingularityCpMultiplier()),held:plain(singularityPoints)};
  `);
  assert.equal(row.off,1);assert.equal(row.logs[0],0);close(row.logs[2],30);
  for(let i=2;i<row.logs.length;i++)assert.ok(row.logs[i]-row.logs[i-1]>row.logs[i-1]-row.logs[i-2]);
  assert.equal(row.held,1);close(row.spent,row.logs[1]);
});

test('CP formula improvement raises only the logarithmic base, preserving thresholds and other multipliers', () => {
  const row=run(game(), `
    generalizationResearchState['2-2']=true;squarePoints=NumberMath.fromString('1e2480000');
    squareConvergenceUpgradeState.cp_gain_5x=true;squareConvergenceUpgradeLevels.cp_gain_5x=3;
    knuthBaseUpgradeLevels.cp_gain=2;abstractionResearchState['12-2']=true;singularityPoints=2;
    const original=squareConvergencePointGain(),base=2480000-15;
    abstractionResearchState['17-2']=true;const formula=squareConvergencePointGain();
    abstractionResearchState['17-1']=true;const combined=squareConvergencePointGain();
    const awarded=collectSquareConvergenceIfReady();
    squarePoints=NumberMath.fromString('1e15');const exact=squareConvergencePointGain();
    squarePoints=NumberMath.fromString('1e14');const below=squareConvergencePointGain();
    return {base,formulaRatio:logValue(formula)-logValue(original),singularityRatio:logValue(combined)-logValue(formula),
      awardedSame:compareNumberValues(awarded,combined)===0,creditedSame:compareNumberValues(squareConvergencePoints,combined)===0,
      exactPositive:isPositiveNumberValue(exact),below:plain(below)};
  `);
  close(row.formulaRatio,5*Math.log10(row.base));close(row.singularityRatio,30);
  assert.equal(row.awardedSame,true);assert.equal(row.creditedSame,true);assert.equal(row.exactPositive,true);assert.equal(row.below,0);
});

test('Dyson expansion grants two limits per old purchase without changing KP price or Dyson price rules', () => {
  const row=run(game(), `
    generalizationResearchState['2-3']=true;knuthBaseUpgradeLevels.dyson_limit=4;
    const upgrade=SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='dyson_swarm');
    squareBreakthroughLevels.dyson_swarm=15;
    const before={max:squareBreakthroughMax(upgrade),cost:NumberMath.serialize(squareBreakthroughCost(upgrade)),kp:NumberMath.serialize(knuthBaseUpgradeCost('dyson_limit'))};
    abstractionResearchState['17-3']=true;
    const after={max:squareBreakthroughMax(upgrade),cost:NumberMath.serialize(squareBreakthroughCost(upgrade)),kp:NumberMath.serialize(knuthBaseUpgradeCost('dyson_limit'))};
    squareBreakthroughLevels.dyson_swarm=16;squarePoints=NumberMath.fromString('1e1000');
    const bought=buySquareBreakthroughUpgrade('dyson_swarm');
    return {before,after,bought,level:squareBreakthroughLevel('dyson_swarm'),stored:knuthBaseUpgradeLevel('dyson_limit')};
  `);
  assert.equal(row.before.max,16);assert.equal(row.after.max,20);assert.equal(row.before.cost,row.after.cost);
  assert.equal(row.before.kp,row.after.kp);assert.equal(row.bought,true);assert.equal(row.level,17);assert.equal(row.stored,4);
});

test('KC1 snapshots include doubled Dyson expansion while KC2 still forbids diverger production', () => {
  const row=run(game(), `
    generalizationResearchState['2-3']=true;knuthBaseUpgradeLevels.dyson_limit=4;abstractionResearchState['17-3']=true;
    startKnuthChallenge('kc1');const entry=knuthChallengeDysonSwarmMaxAtEntry;
    const overclock=squareBreakthroughMax(SQUARE_BREAKTHROUGH_UPGRADES.find(u=>u.id==='overclock'));
    activeKnuthChallengeId='kc2';abstractionResearchState['17-4']=true;generalizationResearchState['3-2']=true;
    const before=NumberMath.serialize(divergerN),advanced=advanceDiverger(1000);
    return {entry,overclock,advanced,same:before===NumberMath.serialize(divergerN)};
  `);
  assert.deepEqual(row,{entry:20,overclock:88,advanced:false,same:true});
});

test('a-driven n speed is neutral at one, monotonic, diminishing and unbounded without native overflow', () => {
  const row=run(game(), `
    divergerA=NumberMath.fromString('1e153');const off=plain(abstractionDivergerNSpeedMultiplier());
    abstractionResearchState['17-4']=true;
    const values=['1','1e100','1e200','1e300','1e1e20','1e1e1e20'].map(a=>{
      divergerA=NumberMath.fromString(a);const m=abstractionDivergerNSpeedMultiplier();
      return {log:logValue(m),value:plain(m),text:JSON.stringify(NumberMath.serialize(m))};
    });
    return {off,values};
  `);
  assert.equal(row.off,1);assert.equal(row.values[0].value,1);close(row.values[1].value,171);
  assert.ok(row.values[2].value-row.values[1].value>row.values[3].value-row.values[2].value);
  for(let i=1;i<row.values.length;i++)assert.ok(row.values[i].log>row.values[i-1].log);
  row.values.forEach(v=>assert.doesNotMatch(v.text,/NaN|Infinity|undefined/));
});

test('single and bounded bulk diverger updates use the same n multiplier and leave D(n) as current value', () => {
  function sample(split){return run(game(), `
    generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
    abstractionResearchState['17-4']=true;divergerA=NumberMath.fromString('1e153');divergerB=2;divergerC=2;
    gameTick=ms=>ms;const m=plain(abstractionDivergerNSpeedMultiplier());
    let samples=0;const original=divergerProductionForGraph;divergerProductionForGraph=(...args)=>{samples++;return original(...args);};
    if(${split})for(let i=0;i<1000;i++)advanceDiverger(1000);else advanceDiverger(1000000);
    return {m,n:plain(divergerN),powerLog:logValue(divergerPower),currentLog:logValue(divergerProductionValue()),samples};
  `);}
  const single=sample(true),bulk=sample(false);
  close(bulk.n,1+1000*bulk.m);close(single.n,bulk.n);close(single.powerLog,bulk.powerLog);
  close(bulk.currentLog,bulk.powerLog);assert.equal(bulk.samples,33);assert.equal(single.samples,1000);
});

test('large n speed never adds a per-speed loop, and the observed a anchor yields hundreds-fold n growth', () => {
  const row=run(game(), `
    generalizationResearchState['3-2']=true;abstractionResearchState['17-4']=true;
    divergerA=NumberMath.fromString('1.26e153');const anchor=plain(abstractionDivergerNSpeedMultiplier());
    divergerA=NumberMath.fromString('1e1e1e20');gameTick=ms=>ms;
    let samples=0;divergerProductionForGraph=()=>{samples++;return 1;};advanceDiverger(1000000);
    return {anchor,samples,n:JSON.stringify(NumberMath.serialize(divergerN)),power:JSON.stringify(NumberMath.serialize(divergerPower))};
  `);
  assert.ok(row.anchor>200&&row.anchor<260);assert.equal(row.samples,33);
  assert.doesNotMatch(row.n+row.power,/NaN|Infinity|undefined/);
});

test('observed-scale five-second n acceleration materially raises actual final Number and SP production', () => {
  function sample(boost){return run(game(), `
    percentUnlocked=true;for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    for(const u of SQUARE_UPGRADES)squareUpgradeState[u.id]=true;
    for(const id of ['4-2','6-2','8-2','10-1','14-2','16-1'])abstractionResearchState[id]=true;
    singularityPoints=2;knuthPoints=1.83e9;divergerA=NumberMath.fromString('8.38e152');divergerB=90.6;divergerC=99;
    divergerN=NumberMath.fromString('2.75e26');divergerInterval=100;divergerPower=divergerProductionValue();
    squareBreakthroughLevels.dyson_swarm=16;squareBreakthroughLevels.overclock=60;squareBreakthroughLevels.bottleneck_tracker=16;
    knuthEquippedUpgradeIds.add('percent_softcap_square');gameTick=ms=>ms*1.9e21;
    abstractionResearchState['17-4']=${boost};advanceDiverger(5000);
    const gain=percentFinalUseGain(NumberMath.fromString('1e5940000000'),147000);
    return {number:logValue(gain),sp:logValue(squarePointGainForValue(gain))};
  `);}
  const before=sample(false),after=sample(true);
  assert.ok(after.sp-before.sp>20000&&after.sp-before.sp<50000,JSON.stringify({before,after}));
  assert.ok(after.number-before.number>50e6);
});

test('Dyson base card and diverger n readout expose the active effects and restore after cancellation', () => {
  const ctx=game();
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/diverger.js'),'utf8'));
  const row=run(ctx, `
    abstractionResearchState['17-3']=true;renderKnuthBaseUpgrades();
    const description=knuthBaseUpgradeUi.get('dyson_limit').description.textContent;
    generalizationResearchState['3-2']=true;abstractionResearchState['17-4']=true;divergerA=NumberMath.fromString('1e153');
    renderDivergerView();const active=divergerNValue.textContent;
    abstractionResearchState['17-3']=false;abstractionResearchState['17-4']=false;renderKnuthBaseUpgrades();renderDivergerView();
    return {description,active,base:knuthBaseUpgradeUi.get('dyson_limit').description.textContent,normal:divergerNValue.textContent};
  `);
  assert.match(row.description,/한도 \+2/);assert.match(row.description,/17-3/);
  assert.match(row.active,/n 증가 속도/);assert.match(row.base,/한도 \+1/);assert.doesNotMatch(row.normal,/n 증가 속도/);
});

test('all research flags and real paid costs survive saves and Knuth, and optional reset refunds all four', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['16-1']=true;abstractionResearchState['16-2']=true;greatTheory=400;
    const ids=['17-1','17-2','17-3','17-4'];ids.forEach(id=>researchAbstraction(id));
    abstractionResearchPaidCosts['16-1']=0;abstractionResearchPaidCosts['16-2']=0;
    saveGame();const saved=localStorage.getItem(SAVE_KEY);ids.forEach(id=>abstractionResearchState[id]=false);
    loadGame(saved,{countAsLoad:false});resetProgressForNewKnuthRun();
    const kept=ids.map(hasAbstractionResearch);greatTheory=0;abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {kept,cleared:ids.map(hasAbstractionResearch),refund:plain(greatTheory),errors};
  `),{kept:[true,true,true,true],cleared:[false,false,false,false],refund:400,errors:[]});
});
