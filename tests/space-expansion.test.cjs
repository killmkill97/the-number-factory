const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const read = file => fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8');
const close = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) <= tolerance * Math.max(1, Math.abs(b)), `${a} != ${b}`);
function ready() {
  const ctx = game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.space_expansion=1;numberBlackHoleSystemEnabled=false;`);
  return ctx;
}

test('expansion unlock, challenge gates and rewardless entry cannot carry old CP into a run', () => {
  const ctx = ready();
  assert.deepEqual(run(ctx, `
    knuthBaseUpgradeLevels.space_expansion=0;const locked=toggleSpaceExpansion();
    knuthBaseUpgradeLevels.space_expansion=1;activeKnuthChallengeId='kc1';const challenge=toggleSpaceExpansion();
    activeKnuthChallengeId=null;squareConvergencePoints=NumberMath.fromString('1e5000');
    const entered=toggleSpaceExpansion(),cp=plain(squareConvergencePoints);
    const startChallenge=startKnuthChallenge('kc1');
    const exited=toggleSpaceExpansion();
    return {locked,challenge,entered,cp,startChallenge,exited,h:plain(higgsParticles),kp:plain(knuthPoints),active:spaceExpansionActive};
  `), { locked:false,challenge:false,entered:true,cp:0,startChallenge:false,exited:true,h:0,kp:0,active:false });
});

test('entry awards the normal eligible KP, respects paid-reset toggles and only then applies expansion', () => {
  const ctx = ready();
  const row = run(ctx, `
    for(const research of GENERALIZATION_RESEARCHES)generalizationResearchState[research.id]=true;
    abstractionResearchState['8-1']=true;squareConvergencePoints=NumberMath.fromString('1e3000');
    knuthPoints=10;knuthBaseUpgradeLevels.kp_gain=2;
    const expected=addBaseNumbers(knuthPoints,knuthPointGain());
    const entered=toggleSpaceExpansion();
    return {entered,correct:compareNumberValues(knuthPoints,expected)===0,active:spaceExpansionActive,
      cp:plain(squareConvergencePoints),h:plain(higgsParticles),errors};
  `);
  assert.deepEqual(row, {entered:true,correct:true,active:true,cp:0,h:0,errors:[]});
});

test('exit records pre-reset CP as a maximum, not an additive currency, and resets again', () => {
  assert.deepEqual(run(ready(), `
    const records=[];
    for(const cp of ['1e2300','1e2300','1e2500','1e1000']){
      toggleSpaceExpansion();squareConvergencePoints=NumberMath.fromString(cp);toggleSpaceExpansion();
      records.push(plain(higgsParticles));
    }
    return {records,cp:plain(squareConvergencePoints),active:spaceExpansionActive};
  `), {records:[12167000,12167000,15625000,15625000],cp:0,active:false});
});

test('Higgs reward is integer, monotonic and supports layered CP without native overflow', () => {
  const row=run(ready(), `return ['0','1','1e9','1e10','1e100','1e1000','1e32600','1e1e100','1e1e1000'].map(cp=>{
    const reward=spaceExpansionHiggsReward(NumberMath.fromString(cp));
    return {text:serializeNumberValue(reward),value:plain(reward),log:logValue(reward),integer:compareNumberValues(reward,NumberMath.floor(reward))===0};
  });`);
  assert.deepEqual(row.slice(0,7).map(r=>r.value),[0,0,0,1,1000,1000000,34645976000]);
  assert.ok(row.every((r,i)=>r.integer&&!/NaN|Infinity/.test(JSON.stringify(r.text))&&(i===0||r.log>=row[i-1].log)));
  close(row[7].log,297);close(row[8].log,2997);
});

test('Higgs preview and formula use the increased reward without retroactively changing saved holdings', () => {
  const row=run(ready(), `
    spaceExpansionActive=true;squareConvergencePoints=NumberMath.fromString('1e1000');
    higgsParticles=1;stagnantMassMg=17;recordStagnantSingularities();const saved=captureGameSaveData();
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    renderSpaceExpansionBoard();
    return {held:plain(higgsParticles),mass:plain(stagnantMassMg),
      preview:document.getElementById('spaceExpansionHiggsPreview').textContent,
      expected:fmtPowerBase(spaceExpansionHiggsReward()),
      formula:document.getElementById('spaceExpansionFormulaText').textContent};
  `);
  assert.equal(row.held,1);assert.equal(row.mass,17);
  assert.ok(row.preview.startsWith(`${row.expected} → 보유 ${row.expected}`));
  assert.match(row.formula,/H = floor\(\(log10\(max\(1, CP\)\) \/ 10\)\^3 × 3\^Lh\)/);
});

test('exit pays its weakened KP quote and snapshots CP before resetting it', () => {
  assert.deepEqual(run(ready(), `
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    spaceExpansionActive=true;squareConvergencePoints=NumberMath.fromString('1e2500');
    knuthBaseUpgradeLevels.kp_gain=8;knuthPoints=100;
    const expected=addBaseNumbers(knuthPoints,knuthPointGain());
    const exited=toggleSpaceExpansion();
    return {exited,correct:compareNumberValues(knuthPoints,expected)===0,h:plain(higgsParticles),
      cp:plain(squareConvergencePoints),active:spaceExpansionActive};
  `),{exited:true,correct:true,h:15625000,cp:0,active:false});
});

test('new Higgs never retroactively produce mass for the time before their award', () => {
  const ctx=ready();
  ctx.loadSource('higgsParticles=5;spaceExpansionActive=true;squareConvergencePoints=NumberMath.fromString("1e4000");');
  ctx.advance(1000);
  assert.deepEqual(run(ctx,'toggleSpaceExpansion();return [plain(higgsParticles),plain(stagnantMassMg)];'),[64000000,5]);
  ctx.advance(1000);
  assert.equal(run(ctx,'tickSpaceExpansion();return plain(stagnantMassMg);'),64000005);
});

test('SP, CP and KP transform the exponent of their aggregate multipliers exactly once', () => {
  const row=run(ready(), `
    Object.assign(knuthBaseUpgradeLevels,{sp_gain:4,cp_gain:4,kp_gain:4});
    squarePoints=NumberMath.fromString('1e100');squareConvergencePoints=NumberMath.fromString('1e300');
    const before={sp:logValue(squarePointGain()),cp:logValue(squareConvergenceGainMultiplier()),
      kp:logValue(knuthPointGain()),spGain:logValue(squarePointGainForValue(NumberMath.fromString('1e200')))};
    spaceExpansionActive=true;
    return {before,after:{sp:logValue(squarePointGain()),cp:logValue(squareConvergenceGainMultiplier()),
      kp:logValue(knuthPointGain()),spGain:logValue(squarePointGainForValue(NumberMath.fromString('1e200')))}};
  `);
  close(row.after.sp,row.before.sp**.25);close(row.after.cp,row.before.cp**.25);
  // KP floors its aggregate reward, but its unboosted base CP/15 remains unchanged.
  close(10**row.after.kp,Math.floor(20*10**(Math.log10(5**4)**.25)));
  close(row.after.spGain,Math.log10(row.before.spGain-row.before.sp+row.before.sp**.25));
});

test('real CP collection and passive SP/CP use the weakened quotes; N KP retains expansion state', () => {
  const row=run(ready(), `
    spaceExpansionActive=true;knuthBaseUpgradeLevels.cp_gain=5;knuthBaseUpgradeLevels.sp_gain=5;
    squarePoints=NumberMath.fromString('1e100');const expected=squareConvergencePointGain();
    const paid=collectSquareConvergenceIfReady();
    setBaseNumber(NumberMath.fromString('1e100'));abstractionResearchState['1-1']=true;
    abstractionResearchState['23-1']=true;squarePoints=NumberMath.fromString('1e100');
    const sp=squarePoints,cp=squareConvergencePoints,spRate=squarePointGainForValue(getBaseNumber()),cpRate=squareConvergencePointGain();
    advanceAbstraction(1000);
    const passive=compareNumberValues(squarePoints,addBaseNumbers(sp,multiplyNumberValue(spRate,.01)))===0
      &&compareNumberValues(squareConvergencePoints,addBaseNumbers(cp,multiplyNumberValue(cpRate,.01)))===0;
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    abstractionResearchState['2-2']=true;higgsParticles=5;stagnantMassMg=10;recordStagnantSingularities();
    const executed=executeN('kp');
    return {paid:compareNumberValues(expected,paid)===0,passive,executed,active:spaceExpansionActive,
      h:plain(higgsParticles),mass:plain(stagnantMassMg)};
  `);
  assert.deepEqual(row,{paid:true,passive:true,executed:true,active:true,h:5,mass:10});
});

test('click, dimension and diverger transform the exponent of their own production boosts', () => {
  const row=run(ready(), `
    generalizationResearchState['3-1']=true;generalizationResearchState['3-2']=true;divergerN=100;
    knuthBaseUpgradeLevels.dimension_gain=8;knuthBaseUpgradeLevels.diverger_gain=8;
    const dimBase=NumberMath.powerApproximate(squareDimensionVolume(),squareDimensionPowerExponent());
    const d=divergerProductionValue(),baseD=NumberMath.divideApproximate(d,knuthBaseMultiplier('diverger_gain',2));
    const click=effectivePerClickMultiplier(),dim=squareDimensionPower();
    spaceExpansionActive=true;
    return {click:logValue(click),newClick:logValue(effectivePerClickMultiplier()),baseDimLog:logValue(dimBase),baseDLog:logValue(baseD),
      dim:logValue(dim)-logValue(dimBase),newDim:logValue(squareDimensionPower())-logValue(dimBase),
      d:logValue(d)-logValue(baseD),newD:logValue(divergerProductionValue())-logValue(baseD)};
  `);
  close(row.newDim,row.dim**.25);close(row.newD,row.d**.25);
  // Dimension production also weakens, so its dependent click factor can be smaller still.
  assert.ok(row.newClick<=row.click**.25+1e-8);
});

test('percent weakening agrees in actual use, preview and large batches without reducing the softcap', () => {
  for(const powered of [false,true]) {
    const ctx=ready();
    ctx.loadSource(`percentUnlocked=true;percentPower=100;knuthEquippedUpgradeIds.clear();
      if(${powered})knuthEquippedUpgradeIds.add('percent_gain_square');
      squareDimensionNumberMultiplier=()=>1e8;abstractionPercentGainMultiplier=()=>1e4;
      percentPowerSoftcap=()=>NumberMath.fromString('1e12');
      percentPreExponentMultiplier=()=>1;
      percentEfficiencyMultiplierNumerator=()=>4;`);
    const row=run(ctx, `
      const n=NumberMath.fromString('1e15');setBaseNumber(n);
      const normal=percentFinalUseGain(n,100),softcap=serializeNumberValue(percentPowerSoftcap(100));
      spaceExpansionActive=true;const expanded=percentFinalUseGain(n,100);
      applyPercentUse(n,100,'test');const expected=addBaseNumbers(n,expanded);
      const same=compareNumberValues(getBaseNumber(),expected)===0;
      const expandedSoftcap=serializeNumberValue(percentPowerSoftcap(100));
      return {normal:logValue(normal),expanded:logValue(expanded),same,softcap,expandedSoftcap};
    `);
    close(row.normal-row.expanded,(12-12**.25)*(powered?2:1));
    assert.equal(row.same,true);assert.deepEqual(row.softcap,row.expandedSoftcap);
  }
  const row=run(ready(), `
    percentUnlocked=true;percentPower=100;spaceExpansionActive=true;
    squareDimensionNumberMultiplier=()=>1;abstractionPercentGainMultiplier=()=>1;
    percentPreExponentMultiplier=()=>1;percentEfficiencyMultiplierNumerator=()=>4;
    percentPowerSoftcap=()=>NumberMath.fromString('1e12');
    squareUpgradeState.percent_power_8=true;
    const before=NumberMath.fromString('1e15'),gain=percentFinalUseGain(before,100);
    setBaseNumber(before);applyPercentUsesBatch(100,1e20,'test');
    return {actual:logValue(getBaseNumber()),expected:logValue(addBaseNumbers(before,multiplyNumberValue(gain,1e20)))};
  `);
  close(row.actual,row.expected);
});

test('double-log weakening maps 1e1e100 to 1e1e25, is monotonic and never boosts small multipliers', () => {
  const row=run(ready(), `
    spaceExpansionActive=true;
    const values=[0,.01,1,2,10,'1e16','1e100','1e1e100','1e1e200','1e1e1e100'].map(NumberMath.fromValue);
    const results=values.map(spaceExpansionMultiplier);
    const example=compareNumberValues(results[7],NumberMath.fromString('1e1e25'));
    spaceExpansionActive=false;
    return {example,small:results.slice(0,5).map(plain),exponent:logValue(results[5]),
      monotonic:results.every((v,i)=>i===0||compareNumberValues(v,results[i-1])>=0),
      positive:results.slice(1).every(isPositiveNumberValue),
      unchanged:values.every(v=>compareNumberValues(spaceExpansionMultiplier(v),v)===0),
      serialized:results.map(serializeNumberValue)};
  `);
  assert.equal(row.example,0);assert.deepEqual(row.small,[0,.01,1,2,10]);close(row.exponent,2);
  assert.ok(row.monotonic&&row.positive&&row.unchanged);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(row.serialized)));
});

test('layered percent multipliers survive preview, direct and bulk production without cancellation', () => {
  const ctx=ready();
  ctx.loadSource(`percentUnlocked=true;spaceExpansionActive=true;squareUpgradeState.percent_power_8=true;
    squareDimensionNumberMultiplier=()=>NumberMath.fromString('1e1e100');
    abstractionPercentGainMultiplier=()=>1;percentPreExponentMultiplier=()=>1;
    percentEfficiencyMultiplierNumerator=()=>4;percentPowerSoftcap=()=>NumberMath.fromString('1e1e200');`);
  const row=run(ctx, `
    setBaseNumber(100);const gain=percentFinalUseGain(100,100);
    const expected=multiplyNumberValue(100,NumberMath.fromString('1e1e25'));
    const correct=compareNumberValues(gain,expected)===0;
    applyPercentUse(100,100,'test');const direct=compareNumberValues(getBaseNumber(),addBaseNumbers(100,expected))===0;
    setBaseNumber(100);applyPercentUsesBatch(100,1e100,'test');
    return {correct,direct,positive:isPositiveNumberValue(getBaseNumber()),bulkLogLog:logValue(NumberMath.log10(getBaseNumber())),
      value:serializeNumberValue(getBaseNumber())};
  `);
  assert.ok(row.correct&&row.direct&&row.positive);
  close(row.bulkLogLog,125);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(row.value)));
});

test('softcap, radius and time boosts are not weakened by expansion', () => {
  const row=run(ready(), `
    percentUnlocked=true;numberBlackHoleSystemEnabled=true;numberBlackHoleTotalInvested=NumberMath.fromString('1e10000');
    squareUpgradeState.percent_power_8=true;
    const before=[percentPowerSoftcap(1000),numberBlackHoleSchwarzschildRadius(),numberBlackHoleTimeMultiplier()];
    spaceExpansionActive=true;
    const after=[percentPowerSoftcap(1000),numberBlackHoleSchwarzschildRadius(),numberBlackHoleTimeMultiplier()];
    return before.map((v,i)=>compareNumberValues(v,after[i])===0);
  `);
  assert.deepEqual(row,[true,true,true]);
});

test('SP final compression removes one exponent layer from the observed huge-number fixture', () => {
  const row=run(ready(), `
    generalizationResearchState['5-2']=true;const n=NumberMath.fromString('1e2.28e158');
    const normal=squarePointGainForValue(n),normalText=fmtPowerBase(normal);
    spaceExpansionActive=true;const expanded=squarePointGainForValue(n);
    return {normalText,expandedText:fmtPowerBase(expanded),
      expected:compareNumberValues(expanded,NumberMath.log10(normal))===0,
      exponent:logValue(expanded),normalUnchanged:compareNumberValues(spaceExpansionFinalSpGain(0),0)===0};
  `);
  assert.match(row.normalText,/e.*e/);assert.equal(row.expandedText,'9.5e154');
  assert.equal((row.expandedText.match(/e/g)||[]).length,1);close(row.exponent,154+Math.log10(9.5));
  assert.ok(row.expected&&row.normalUnchanged);
});

test('SP compression follows every multiplier and applies once, without compressing CP', () => {
  const row=run(ready(), `
    generalizationResearchState['5-2']=true;spaceExpansionActive=true;
    knuthSpCpGainMultiplier=resource=>resource==='cp'?1:NumberMath.fromString('1e1e100');
    const n=NumberMath.fromString('1e240000');const actual=squarePointGainForValue(n);
    squarePoints=NumberMath.fromString('1e100');const before=squareConvergencePointGain();
    spaceExpansionFinalSpGain(NumberMath.fromString('1e1e100'));
    return {exponent:logValue(actual),quote:fmtPowerBase(actual),
      cpUnchanged:compareNumberValues(before,squareConvergencePointGain())===0};
  `);
  close(row.exponent,25);assert.equal(row.quote,'10sp');assert.equal(row.cpUnchanged,true);
});

test('manual, N and passive SP gains all use the same final compressed reward', () => {
  const outcomes=[];
  for(const kind of ['manual','n','passive']) {
    const ctx=ready();
    outcomes.push(run(ctx, `
      spaceExpansionActive=true;generalizationResearchState['5-2']=true;squareUnlocked=true;
      setBaseNumber(NumberMath.fromString('1e2.28e158'));squarePoints=0;
      const quote=squarePointGainForValue(getBaseNumber());let done=true;
      if('${kind}'==='manual')done=exchangeSquarePointsManually();
      else if('${kind}'==='n')done=executeN('sp 1e154');
      else{abstractionResearchState['1-1']=true;advanceAbstraction(1000);}
      const expected='${kind}'==='passive'?multiplyNumberValue(quote,.01):quote;
      return {done,same:compareNumberValues(squarePoints,expected)===0,text:fmtPowerBase(squarePoints)};
    `));
  }
  assert.ok(outcomes.every(row=>row.done&&row.same));
  assert.deepEqual(outcomes.map(row=>row.text),['9.5e154','9.5e154','9.5e152']);
});

test('targeted SP conversion also compresses its final reward and preserves ordinary conversion outside expansion', () => {
  for(const active of [false,true]) {
    const row=run(ready(), `
      spaceExpansionActive=${active};setBaseNumber(100);squarePoints=0;
      const done=completeSquarePrestige({skippedCutscene:true,keepCurrentChapter:true,requiredValue:1,
        squarePointReward:NumberMath.fromString('1e1e100')});
      return {done,value:fmtPowerBase(squarePoints)};
    `);
    assert.deepEqual(row,{done:true,value:active?'1e100':'1e1e100'});
  }
});

test('SP compression preserves small values and permanent records without an active expansion floor', () => {
  const row=run(ready(), `
    spaceExpansionActive=true;
    const boundaries=[0,.1,1,2,10,100].map(spaceExpansionFinalSpGain).map(plain);
    const held=NumberMath.fromString('1e1e100');squarePoints=held;
    abstractionResearchState['23-3']=true;abstractionPermanentSp=held;
    const reward=spaceExpansionFinalSpGain(held);setSquarePoints(0);
    return {boundaries,reward:fmtPowerBase(reward),spent:plain(squarePoints),recordPreserved:compareNumberValues(abstractionPermanentSp,held)===0};
  `);
  assert.deepEqual(row.boundaries,[0,.1,1,1,1,2]);assert.equal(row.reward,'1e100');assert.equal(row.spent,0);assert.equal(row.recordPreserved,true);
});

test('SP final log supports layered values and is an identity outside expansion', () => {
  const row=run(ready(), `
    const raw=NumberMath.fromString('1e1e1e100');const ordinary=spaceExpansionFinalSpGain(raw);
    spaceExpansionActive=true;const reduced=spaceExpansionFinalSpGain(raw);
    return {unchanged:compareNumberValues(ordinary,raw)===0,
      correct:compareNumberValues(reduced,NumberMath.fromString('1e1e100'))===0,
      value:serializeNumberValue(reduced)};
  `);
  assert.ok(row.unchanged&&row.correct);assert.ok(!/NaN|Infinity/.test(JSON.stringify(row.value)));
});

test('mass uses real elapsed seconds only, and production is O(1) over enormous intervals', () => {
  assert.deepEqual(run(ready(), `
    higgsParticles=5;numberBlackHoleTimeMultiplier=()=>1e100;
    advanceSpaceExpansion(1000);const first=plain(stagnantMassMg);
    spaceExpansionActive=true;advanceSpaceExpansion(500);const second=plain(stagnantMassMg);
    const bad=[advanceSpaceExpansion(0),advanceSpaceExpansion(-1),advanceSpaceExpansion(Infinity)];
    advanceSpaceExpansion(1e12);
    return {first,second,bad,final:plain(stagnantMassMg)};
  `),{first:5,second:7.5,bad:[false,false,false],final:5000000007.5});
});

test('mass grows both effects smoothly and connects the old mass upgrade only to radius', () => {
  const row=run(ready(), `
    knuthBaseUpgradeLevels.probabilizer=1;numberBlackHoleSystemEnabled=true;
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    const radius=numberBlackHoleSchwarzschildRadius(),random=probabilizerPowerMultiplier();
    stagnantMassMg=60000;recordStagnantSingularities();
    const radiusFactor=NumberMath.divideApproximate(numberBlackHoleSchwarzschildRadius(),radius);
    const randomFactor=NumberMath.divideApproximate(probabilizerPowerMultiplier(),random);
    knuthBaseUpgradeLevels.stagnant_mass_gain=2;
    const upgraded=stagnantMassRadiusMultiplier(),unchangedRandom=stagnantMassRandomMultiplier();
    stagnantMassMg=0;stagnantSingularities=0;
    return {radius:plain(radiusFactor),random:logValue(randomFactor),upgraded:plain(upgraded),
      unchangedRandom:logValue(unchangedRandom),zero:plain(stagnantMassRadiusMultiplier())};
  `);
  const f=(3/Math.log10(60001))**.75;
  close(row.radius,1+99*f);close(row.random,12*f);close(row.upgraded,(1+99*f)*16);close(row.unchangedRandom,12*f);assert.equal(row.zero,1);
});

test('large mass and Higgs serialize without infinity; unit conversion reaches Earth and solar masses', () => {
  const row=run(ready(), `
    const units=[1,1000,1e6,1e9,5.9722e30,1.98847e36].map(formatStagnantMass);
    stagnantMassMg=NumberMath.fromString('1e1e100');recordStagnantSingularities();higgsParticles=NumberMath.fromString('1e1e50');
    advanceSpaceExpansion(1e20);
    return {units,values:[stagnantMassMg,stagnantMassRadiusMultiplier(),stagnantMassRandomMultiplier()].map(serializeNumberValue)};
  `);
  assert.deepEqual(row.units,['1 mg','1 g','1 kg','1 t','1 M⊕','1 M⊙']);
  assert.ok(!/NaN|Infinity/.test(JSON.stringify(row.values)));
});

test('save/load preserves expansion and permanent balances; old and invalid saves clear stale state', () => {
  const ctx=ready();
  assert.deepEqual(run(ctx, `
    spaceExpansionActive=true;higgsParticles=6;stagnantMassMg=12;recordStagnantSingularities();
    const saved=captureGameSaveData();spaceExpansionActive=false;higgsParticles=0;stagnantMassMg=0;stagnantSingularities=0;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=[spaceExpansionActive,plain(higgsParticles),plain(stagnantMassMg)];
    clock.advance(100000);const same=plain(stagnantMassMg);resetSpaceExpansionClock();tickSpaceExpansion();
    const noOffline=plain(stagnantMassMg)===same;
    delete saved.spaceExpansionActive;delete saved.higgsParticles;delete saved.stagnantMassMg;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,restored,noOffline,old:[spaceExpansionActive,plain(higgsParticles),plain(stagnantMassMg)],errors};
  `),{loaded:true,restored:[true,6,12],noOffline:true,old:[false,0,0],errors:[]});
});

test('mass and Higgs survive Knuth, challenges and singularities without generating extra Higgs', () => {
  assert.deepEqual(run(ready(), `
    higgsParticles=6;stagnantMassMg=12;recordStagnantSingularities();resetProgressForNewKnuthRun();
    const started=startKnuthChallenge('kc1');abandonKnuthChallenge();
    numberBlackHoleSystemEnabled=true;numberBlackHolePassiveRadius=1e8;knuthBaseUpgradeLevels.passive_radius=1;
    const collapsed=purchaseSingularity();
    return {started,collapsed,h:plain(higgsParticles),mass:plain(stagnantMassMg)};
  `),{started:true,collapsed:true,h:6,mass:12});
});

test('production subtab is hidden before purchase and displays highest-record, mass and live effects after unlock', () => {
  const ctx=ready();ctx.loadSource(read('systems/probabilizer.js'));
  assert.deepEqual(run(ctx, `
    knuthBaseUpgradeLevels.space_expansion=0;renderKnuthProduction();const hidden=knuthSpaceExpansionTabBtn.classList.contains('hidden');
    knuthBaseUpgradeLevels.space_expansion=1;higgsParticles=5;stagnantMassMg=1000;recordStagnantSingularities();
    setKnuthProductionView('space_expansion');
    return {hidden,view:activeKnuthProductionView,visible:!knuthSpaceExpansionPanel.classList.contains('hidden'),
      h:document.getElementById('higgsParticleValue').textContent,mass:document.getElementById('stagnantMassValue').textContent,
      button:document.getElementById('spaceExpansionToggleBtn').textContent};
  `),{hidden:true,view:'space_expansion',visible:true,h:'5',mass:'1 g',button:'공간 팽창 시작'});
});

test('explicit offline mode replays mass production once, without time acceleration or hidden closed-tab accrual', async () => {
  const ctx=game(true,{storage:[]});
  ctx.loadSource('window.numberTycoonSession.initialize();higgsParticles=5;resetSpaceExpansionClock();');
  assert.equal(run(ctx,'return window.numberTycoonSession.enter();'),true);
  ctx.advance(2000);
  assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),true);
  close(run(ctx,'return plain(stagnantMassMg);'),10);
  assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),false);
  close(run(ctx,'return plain(stagnantMassMg);'),10);
});
