const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
function ready() {
  const ctx=game(true);
  ctx.loadSource('knuthBaseUpgradeLevels.space_expansion=1;spaceExpansionActive=true;numberBlackHoleSystemEnabled=false;');
  return ctx;
}

test('rollback removes the final number logarithm while retaining production powers and click counts', () => {
  assert.deepEqual(run(ready(), `
    const powered=plain(finalNumberProductionGain(100,100,0,1,0,2));
    perClick=1000;autoClickerParallel=4;setBaseNumber(0);applyAutoClickerGain(5);
    return {powered,clicks:plain(getBaseNumber())};
  `),{powered:1e8,clicks:20000});
});

test('rollback restores full CP and integer KP awards rather than their logarithms', () => {
  assert.deepEqual(run(ready(), `
    squarePoints=NumberMath.fromString('1e1e1e100');
    const quote=squareConvergencePointGain(),paid=collectSquareConvergenceIfReady();
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    abstractionResearchState['8-1']=true;abstractionResearchState['2-2']=true;
    squareConvergencePoints=NumberMath.fromString('1e150');knuthPoints=0;
    const kp=knuthPointGain(),done=executeN('kp 1e9');
    return {cp:fmtPowerBase(quote),paid:compareNumberValues(quote,paid)===0,
      kp:plain(kp),done,heldKp:plain(knuthPoints)};
  `),{cp:'1e1e100',paid:true,kp:1e9,done:true,heldKp:1e9});
});

test('rollback restores random-power roll amounts and the previous coarse batch result', () => {
  assert.deepEqual(run(ready(), `
    knuthBaseUpgradeLevels.probabilizer=1;
    probabilizerParameters=()=>({a:1000,b:1000,mode:1000,intervalMs:1000});
    advanceProbabilizer(1000,()=>.5);const single=plain(randomPower);
    randomPower=0;advanceProbabilizer(1000000,()=>.5);
    return {single,batch:plain(randomPower)};
  `),{single:1000,batch:1000000});
});

test('rollback restores formula-based diverger and dimension outputs and their developer inverse', () => {
  const row=run(ready(), `
    generalizationResearchState['3-1']=true;generalizationResearchState['3-2']=true;
    divergerN=NumberMath.fromString('1e100');
    const diverger=compareNumberValues(divergerProductionValue(),divergerProductionBeforeDyson())===0;
    const raw=NumberMath.powerApproximate(squareDimensionVolume(),squareDimensionPowerExponent());
    const dimension=compareNumberValues(squareDimensionPower(),raw)===0;
    const set=setSquareDimensionPowerForDev(100);
    return {diverger,dimension,set,power:plain(squareDimensionPower())};
  `);
  assert.ok(row.diverger&&row.dimension&&row.set);assert.ok(Math.abs(row.power-100)<1e-6);
});

test('rollback keeps the earlier aggregate weakening, SP-only final logarithm, held balances and Higgs production', () => {
  const row=run(ready(), `
    const multiplier=compareNumberValues(spaceExpansionMultiplier(NumberMath.fromString('1e1e100')),
      NumberMath.fromString('1e1e25'))===0;
    generalizationResearchState['5-2']=true;
    const sp=squarePointGainForValue(NumberMath.fromString('1e2.28e158'));
    squarePoints=NumberMath.fromString('1e1e100');higgsParticles=5;stagnantMassMg=60000;
    advanceSpaceExpansion(1000);
    return {multiplier,sp:fmtPowerBase(sp),heldSp:fmtPowerBase(squarePoints),h:plain(higgsParticles),mass:plain(stagnantMassMg)};
  `);
  assert.deepEqual(row,{multiplier:true,sp:'9.5e154',heldSp:'1e1e100',h:5,mass:60005});
});
