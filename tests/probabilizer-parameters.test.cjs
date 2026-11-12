const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const { seedObservedProbabilizerGame, observedProbabilizerSnapshot, projectObservedSpCycle } = require('./helpers/probabilizer-balance.cjs');

function observed() {
  const ctx = game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  ctx.loadSource(`${seedObservedProbabilizerGame};${observedProbabilizerSnapshot};${projectObservedSpCycle};seedObservedProbabilizerGame();`);
  return ctx;
}

test('effective a/b follow the tuned multiplier while raw CP upgrades, c, n and black-hole cap remain unchanged', () => {
  const row = run(observed(), `
    randomPower=0;const a=abstractionEffectiveDivergerA(),b=abstractionEffectiveDivergerB(),c=abstractionEffectiveDivergerC();
    const raw=[NumberMath.serialize(divergerA),divergerB,NumberMath.serialize(divergerN),divergerACpCost,divergerBCpCost];
    randomPower=530000;renderProbabilizerBoard();renderDivergerView();
    return {aRatio:plain(divideNumberValue(abstractionEffectiveDivergerA(),a)),bRatio:abstractionEffectiveDivergerB()/b,
      expected:4*(1+0.15*Math.log10(1+530000/50)),cUnchanged:c===abstractionEffectiveDivergerC(),
      rawUnchanged:JSON.stringify(raw)===JSON.stringify([NumberMath.serialize(divergerA),divergerB,NumberMath.serialize(divergerN),divergerACpCost,divergerBCpCost]),
      label:probabilizerDivergerEffect.textContent,formula:divergerPowerSubValue.textContent,
      cap:numberBlackHoleTimeLimit()};
  `);
  assert.ok(Math.abs(row.aRatio/row.expected-1)<1e-9);assert.ok(Math.abs(row.bRatio/row.expected-1)<1e-9);
  assert.equal(row.cUnchanged,true);assert.equal(row.rawUnchanged,true);
  assert.match(row.label,/각각 ×6\.42/);assert.match(row.formula,/a효과\^2.*b효과/);
  assert.ok(Math.abs(row.cap/(1e100*(1+6*Math.log2(1+530000/50)))-1)<1e-9);
});

test('zero power, locked probabilizer and KC5 are neutral for both parameters, with no hidden permanent parameter mutation', () => {
  const row = run(observed(), `
    randomPower=0;const baseline=[NumberMath.serialize(abstractionEffectiveDivergerA()),abstractionEffectiveDivergerB()];
    randomPower=530000;const boosted=abstractionEffectiveDivergerB()>baseline[1];
    knuthBaseUpgradeLevels.probabilizer=0;const locked=[NumberMath.serialize(abstractionEffectiveDivergerA()),abstractionEffectiveDivergerB()];
    knuthBaseUpgradeLevels.probabilizer=1;activeKnuthChallengeId='kc5';
    const multiplier=plain(probabilizerDivergerParameterMultiplier());activeKnuthChallengeId=null;
    randomPower=0;const reset=[NumberMath.serialize(abstractionEffectiveDivergerA()),abstractionEffectiveDivergerB()];
    return {boosted,locked:JSON.stringify(locked)===JSON.stringify(baseline),reset:JSON.stringify(reset)===JSON.stringify(baseline),multiplier};
  `);
  assert.deepEqual(row,{boosted:true,locked:true,reset:true,multiplier:1});
});

test('weakened observed fixture still grows monotonically through actual CP and KP exchanges, without a KP grant', () => {
  const rows = run(observed(), `const saved=JSON.stringify(captureGameSaveData());
  return [50000,200000,530000,1000000].map(power=>{
    loadGame(saved,{persistOverride:false,countAsLoad:false});randomPower=power;divergerPower=divergerProductionValue();
    const cp=collectSquareConvergenceIfReady(),gain=knuthPointGain();
    const exchanged=exchangeKnuthPointsManually();
    return {power,exchanged,cpLog:logValue(cp),kpLog:logValue(gain),heldLog:logValue(knuthPoints),
      keptPower:plain(randomPower)===power};
  });`);
  for (const [index,row] of rows.entries()) {
    assert.equal(row.exchanged,true);assert.equal(row.keptPower,true);
    assert.ok(Number.isFinite(row.cpLog)&&Number.isFinite(row.kpLog));
    assert.ok(row.heldLog>=row.kpLog);
    if(index>0)assert.ok(row.kpLog>rows[index-1].kpLog);
  }
  assert.ok(rows.every(row=>row.kpLog>320&&row.kpLog<330));
});

test('saved power and purchased parameters rehydrate the same effective values, with no compounding on repeated reads', () => {
  assert.deepEqual(run(observed(), `
    divergerPower=divergerProductionValue();
    const values=()=>[NumberMath.serialize(abstractionEffectiveDivergerA()),abstractionEffectiveDivergerB(),
      NumberMath.serialize(divergerProductionValue()),NumberMath.serialize(divergerPower),NumberMath.serialize(abstractionCpGainMultiplier())];
    const before=values(),saved=captureGameSaveData();
    randomPower=0;divergerA=1;divergerB=1;knuthEquippedUpgradeIds.clear();knuthPoints=0;knuthUnlocked=false;hasClaimedKnuthPoint=false;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const after=values();for(let i=0;i<20;i++){abstractionEffectiveDivergerA();abstractionEffectiveDivergerB();divergerProductionValue();}
    return {loaded,restored:JSON.stringify(before)===JSON.stringify(after),stable:JSON.stringify(after)===JSON.stringify(values()),
      rawA:compareNumberValues(divergerA,'5.04e4270')===0,rawB:divergerB,power:plain(randomPower),errors};
  `),{loaded:true,restored:true,stable:true,rawA:true,rawB:3922.8125,power:530000,errors:[]});
});

test('load reconciles stored D and immediate CP with restored dependencies, zero power, old saves and KC5', () => {
  const rows=run(observed(), `
    const original=captureGameSaveData();
    return ['boosted','zero','legacy-random','kc5','unlock-repair'].map(kind=>{
      const save=JSON.parse(JSON.stringify(original));save.divergerPower='1';
      if(kind==='zero')save.randomPower=0;
      if(kind==='legacy-random')delete save.randomPower;
      if(kind==='kc5'){save.activeKnuthChallengeId='kc5';save.completedKnuthChallengeIds=[];}
      if(kind==='unlock-repair'){save.knuthUnlocked=false;save.hasClaimedKnuthPoint=false;}
      randomPower=1e12;knuthUnlocked=false;hasClaimedKnuthPoint=false;activeKnuthChallengeId=null;
      knuthEquippedUpgradeIds.clear();divergerPower=0;
      const loaded=loadGame(JSON.stringify(save),{persistOverride:false,countAsLoad:false});
      const immediately=divergerPower,cp=abstractionCpGainMultiplier();
      divergerPower=divergerProductionValue();
      return {kind,loaded,consistent:compareNumberValues(immediately,divergerPower)===0,
        cpConsistent:compareNumberValues(cp,abstractionCpGainMultiplier())===0,errors};
    });
  `);
  for(const row of rows){assert.equal(row.loaded,true,row.kind);assert.equal(row.consistent,true,row.kind);
    assert.equal(row.cpConsistent,true,row.kind);assert.deepEqual(row.errors,[]);}
});

test('nested random power cannot overflow the native b exponent or zero out a/D', () => {
  const rows = run(observed(), `return ['1e100','1e1e100','1e1e1000'].map(value=>{
    randomPower=NumberMath.fromString(value);divergerN=NumberMath.fromString('1e1e100');
    const a=abstractionEffectiveDivergerA(),b=abstractionEffectiveDivergerB(),d=divergerProductionValue();
    return {aPositive:compareNumberValues(a,1)>0,bFinite:Number.isFinite(b)&&b>0,
      dPositive:compareNumberValues(d,1)>0,bounded:b<=Number.MAX_VALUE/1024,
      clean:![a,d].some(n=>/NaN|undefined|Infinity/.test(NumberMath.serialize(n)))};
  });`);
  for(const row of rows)assert.deepEqual(row,{aPositive:true,bFinite:true,dPositive:true,bounded:true,clean:true});
});

test('b-to-a resonance and a-driven n speed use boosted parameters without output-to-parameter recursion', () => {
  const row = run(observed(), `
    abstractionResearchState['18-7']=true;randomPower=0;
    const a=abstractionEffectiveDivergerA(),speed=abstractionDivergerNSpeedMultiplier();
    randomPower=530000;const boosted=abstractionEffectiveDivergerA(),boostedSpeed=abstractionDivergerNSpeedMultiplier();
    const first=NumberMath.serialize(divergerProductionValue());
    for(let i=0;i<20;i++)divergerPower=divergerProductionValue();
    return {aBoosted:compareNumberValues(boosted,a)>0,speedBoosted:compareNumberValues(boostedSpeed,speed)>0,
      stable:first===NumberMath.serialize(divergerProductionValue()),rawB:divergerB};
  `);
  assert.deepEqual(row,{aBoosted:true,speedBoosted:true,stable:true,rawB:3922.8125});
});

test('logarithmic a/b sharply reduce old SP growth but still improve real SP over no parameter bonus', () => {
  const old = run(observed(), `return projectObservedSpCycle(1.20,1000000,true);`);
  const neutral = run(observed(), `return projectObservedSpCycle(0,1000000,false,1);`);
  const previous = run(observed(), `return projectObservedSpCycle(0.15,1000000,false,1);`);
  const tuned = run(observed(), `return projectObservedSpCycle(PROBABILIZER_BALANCE.divergerParameterLogStrength);`);
  assert.ok(old.spLogLog>138&&old.spLogLog<139);
  assert.ok(tuned.spLogLog>128&&tuned.spLogLog<129);
  assert.ok(old.spLogLog-tuned.spLogLog>10);
  assert.ok(tuned.spLogLog-neutral.spLogLog>1);
  assert.ok(tuned.spLogLog-previous.spLogLog>5&&tuned.spLogLog-previous.spLogLog<6);
  assert.equal(tuned.dysonLimit,143);assert.equal(tuned.dyson,298);
  assert.ok(tuned.purchases>0&&tuned.purchases<4096);
  assert.doesNotMatch(tuned.sp,/NaN|Infinity|undefined/);
});

test('the SP anchor is not a hard cap and remains close when the observed random balance varies five percent', () => {
  const low = run(observed(), `return projectObservedSpCycle(PROBABILIZER_BALANCE.divergerParameterLogStrength,950000);`);
  const high = run(observed(), `return projectObservedSpCycle(PROBABILIZER_BALANCE.divergerParameterLogStrength,1050000);`);
  assert.ok(low.spLogLog>128&&low.spLogLog<129);
  assert.ok(high.spLogLog>128&&high.spLogLog<129);
  assert.ok(high.spLogLog>=low.spLogLog);
});

test('logarithmic growth remains meaningful but gentle from early random power to very large balances', () => {
  const rows=run(observed(), `return [0,50,1000000,'1e100'].map(value=>{
    randomPower=numberValueFromSave(value);const multiplier=plain(probabilizerDivergerParameterMultiplier());
    return {multiplier,log:logValue(addBaseNumbers(1,divideNumberValue(randomPower,50)))};
  });`);
  for(const [index,row] of rows.entries())assert.ok(Math.abs(row.multiplier-(index===0?1:4*(1+0.15*row.log)))<1e-9);
  assert.equal(rows[0].multiplier,1);
  assert.ok(rows[1].multiplier>4&&rows[1].multiplier<4.4);
  assert.ok(rows[2].multiplier>6.5&&rows[2].multiplier<6.6);
  assert.ok(rows[3].multiplier>62&&rows[3].multiplier<64);
});

test('tier-six tuning moderately increases parameters and the observed real CP award over the weak log curve', () => {
  const row=run(observed(), `
    PROBABILIZER_BALANCE.divergerParameterScale=1;
    randomPower=1000000;
    PROBABILIZER_BALANCE.divergerParameterLogStrength=0.1;divergerPower=divergerProductionValue();
    const previousCp=squareConvergencePointGain(),previousMultiplier=probabilizerDivergerParameterMultiplier();
    PROBABILIZER_BALANCE.divergerParameterLogStrength=0.15;divergerPower=divergerProductionValue();
    return {cpRatio:plain(divideNumberValue(squareConvergencePointGain(),previousCp)),
      parameterRatio:plain(divideNumberValue(probabilizerDivergerParameterMultiplier(),previousMultiplier))};
  `);
  assert.ok(row.cpRatio>20&&row.cpRatio<30);
  assert.ok(row.parameterRatio>1.1&&row.parameterRatio<1.2);
});
