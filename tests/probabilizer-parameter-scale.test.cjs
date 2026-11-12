const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  ctx.loadSource(`knuthBaseUpgradeLevels.probabilizer=1;randomPower=1000000;percentUnlocked=true;
    divergerA=8;divergerB=2;divergerC=5;divergerN=20;`);
  return ctx;
}

test('the previous logarithmic multiplier and both effective diverger parameters are fourfold, not the raw upgrades', () => {
  const row=run(ready(), `
    const raw=JSON.stringify([divergerA,divergerB,divergerC,divergerN,divergerACpCost,divergerBCpCost]);
    PROBABILIZER_BALANCE.divergerParameterScale=1;
    const a=abstractionEffectiveDivergerA(),b=abstractionEffectiveDivergerB(),m=probabilizerDivergerParameterMultiplier();
    const d=divergerProductionValue();PROBABILIZER_BALANCE.divergerParameterScale=4;
    return {a:plain(NumberMath.divideApproximate(abstractionEffectiveDivergerA(),a)),
      b:abstractionEffectiveDivergerB()/b,m:plain(NumberMath.divideApproximate(probabilizerDivergerParameterMultiplier(),m)),
      stronger:compareNumberValues(divergerProductionValue(),d)>0,
      rawUnchanged:raw===JSON.stringify([divergerA,divergerB,divergerC,divergerN,divergerACpCost,divergerBCpCost])};
  `);
  for(const key of ['a','b','m'])assert.ok(Math.abs(row[key]-4)<1e-10);
  assert.equal(row.stronger,true);assert.equal(row.rawUnchanged,true);
});

test('no direct fourfold final-number bonus survives in the shared, cached or bulk percent paths', () => {
  const rows=run(ready(), `const rows=[];
    for(const q of [1,4])for(const decay of [1,2]){
      abstractionResearchState['8-2']=q===4;squareUpgradeState.percent_power_8=decay===1;
      const start=multiplyNumberValue(percentPowerSoftcap(10),2);
      const snapshot=()=>{
        const common=finalNumberProductionGain(1000,3,'1e13',1,0,q);
        const cached=withPercentProductionCache(()=>percentFinalUseGain(start,10));
        setBaseNumber(start);applyPercentUsesBatch(10,1000,'test');
        return [NumberMath.serialize(common),NumberMath.serialize(cached),NumberMath.serialize(getBaseNumber())];
      };
      randomPower=0;const baseline=snapshot();randomPower=1000000;const active=snapshot();
      rows.push({same:JSON.stringify(baseline)===JSON.stringify(active),
        commonCorrect:compareNumberValues(finalNumberProductionGain(1000,3,'1e13',1,0,q),NumberMath.power(decay===1?300:30,q))===0});
    }return rows;
  `);
  for(const row of rows){assert.equal(row.same,true);assert.equal(row.commonCorrect,true);}
});

test('inactive, empty and KC5 states remain neutral and the previous logarithmic curve is retained', () => {
  const row=run(ready(), `
    const positive=plain(probabilizerDivergerParameterMultiplier());
    const values=[];randomPower=0;values.push(plain(probabilizerDivergerParameterMultiplier()));
    randomPower=1000000;activeKnuthChallengeId='kc5';values.push(plain(probabilizerDivergerParameterMultiplier()));
    activeKnuthChallengeId=null;knuthBaseUpgradeLevels.probabilizer=0;values.push(plain(probabilizerDivergerParameterMultiplier()));
    return {positive,values,strength:PROBABILIZER_BALANCE.divergerParameterLogStrength};
  `);
  assert.ok(Math.abs(row.positive-4*(1+0.15*Math.log10(1+1000000/50)))<1e-10);
  assert.deepEqual(row.values,[1,1,1]);assert.equal(row.strength,0.15);
});

test('save/load restores the corrected multiplier and UI shows a/b without a final number boost row', () => {
  const row=run(ready(), `
    const expected=probabilizerDivergerParameterMultiplier(),saved=captureGameSaveData();
    randomPower=0;const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    renderProbabilizerBoard();
    return {loaded,equal:compareNumberValues(expected,probabilizerDivergerParameterMultiplier())===0,
      label:probabilizerDivergerEffect.textContent,errors};
  `);
  assert.deepEqual(row,{loaded:true,equal:true,label:'각각 ×6.58',errors:[]});
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/probabilizerNumberEffect/);
});
