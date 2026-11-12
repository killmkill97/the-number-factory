const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx = game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/systems/probabilizer.js'), 'utf8'));
  ctx.loadSource(`abstractionResearchState['29-1']=true;knuthBaseUpgradeLevels.probabilizer=1;
    abstractionResearchState['21-1']=true;initializeProbabilizerRangeProgress();`);
  return ctx;
}
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);

test('all four KP prices preserve 1e500, then stack the doubled exponent with the first fourfold band', () => {
  const rows=run(ready(), `return PROBABILIZER_UPGRADES.map(({id,priceExponent:p})=>{
    const threshold=200/p;
    const values=[0,threshold-1,threshold,threshold+1,threshold+2].map(level=>{
      probabilizerUpgradeLevels[id]=level;return logValue(probabilizerUpgradeCost(id));
    });return {p,values};
  });`);
  for(const {p,values} of rows)values.forEach((value,i)=>close(value,[300,500-p,500,500+8*p,500+16*p][i]));
});

test('actual KP purchases use the higher next quote and reject insufficient KP without spending', () => {
  const rows=run(ready(), `return PROBABILIZER_UPGRADES.map(({id,priceExponent:p})=>{
    probabilizerUpgradeLevels={a:0,b:400,speed:0,shift:0};probabilizerPowerUpgradeLevels.interval_floor=20;
    probabilizerUpgradeLevels[id]=200/p;const cost=probabilizerUpgradeCost(id);
    knuthPoints=NumberMath.divideApproximate(cost,2);const before=NumberMath.serialize(knuthPoints);
    const blocked=!buyProbabilizerUpgrade(id),same=before===NumberMath.serialize(knuthPoints);
    knuthPoints=cost;const bought=buyProbabilizerUpgrade(id);
    return {p,blocked,same,bought,left:plain(knuthPoints),next:logValue(probabilizerUpgradeCost(id))};
  });`);
  for(const r of rows){assert.ok(r.blocked&&r.same&&r.bought);assert.equal(r.left,0);close(r.next,500+8*r.p);}
});

test('diverger power prices change from 50x to 2000x only after reaching 1e40', () => {
  const values=run(ready(), `return [0,17,18,19,20].map(level=>{
    probabilizerPowerUpgradeLevels.diverger=level;return logValue(probabilizerPowerUpgradeCost('diverger'));
  });`);
  const crossing=Math.log10(5e9)+18*Math.log10(50);
  [Math.log10(5e9),Math.log10(5e9)+17*Math.log10(50),crossing,crossing+Math.log10(2000),
    crossing+2*Math.log10(2000)].forEach((expected,i)=>close(values[i],expected));
  assert.ok(values[1]<40&&values[2]>=40);
});

test('diverger power purchase spends the quoted random power, not KP, and still grants 1.5x effect', () => {
  const r=run(ready(), `
    probabilizerPowerUpgradeLevels.diverger=18;knuthPoints=123;
    const cost=probabilizerPowerUpgradeCost('diverger');randomPower=NumberMath.divideApproximate(cost,2);
    const before=NumberMath.serialize(randomPower),blocked=!buyProbabilizerPowerUpgrade('diverger');
    const same=before===NumberMath.serialize(randomPower);randomPower=cost;
    const bought=buyProbabilizerPowerUpgrade('diverger'),left=plain(randomPower);
    randomPower=100;const boosted=probabilizerDivergerParameterMultiplier();probabilizerPowerUpgradeLevels.diverger=18;
    return {blocked,same,bought,left,kp:knuthPoints,
      ratio:plain(NumberMath.divideApproximate(boosted,probabilizerDivergerParameterMultiplier()))};
  `);
  assert.deepEqual({...r,ratio:undefined},{blocked:true,same:true,bought:true,left:0,kp:123,ratio:undefined});close(r.ratio,1.5);
});

test('other random-power upgrades keep their existing growth even beyond 1e40', () => {
  const rows=run(ready(), `return ['gain','interval_floor'].map(id=>{
    const definition=PROBABILIZER_POWER_UPGRADES.find(u=>u.id===id),levels=[0,40,1000];
    return {base:definition.baseCost,growth:definition.growth,values:levels.map(level=>{
      probabilizerPowerUpgradeLevels[id]=level;return logValue(probabilizerPowerUpgradeCost(id));
    })};
  });`);
  rows.forEach(r=>[0,40,1000].forEach((level,i)=>close(r.values[i],Math.log10(r.base)+level*Math.log10(r.growth))));
});

test('large saved counts derive monotonic positive prices without feedback towers', () => {
  const rows=run(ready(), `return ['a','b','speed','shift','diverger'].map(id=>{
    const quote=level=>{
      if(id==='diverger'){probabilizerPowerUpgradeLevels[id]=level;return probabilizerPowerUpgradeCost(id);}
      probabilizerUpgradeLevels[id]=level;return probabilizerUpgradeCost(id);
    };
    let last=0;return [1e9,1e12,Number.MAX_SAFE_INTEGER-1000,Number.MAX_SAFE_INTEGER].every(level=>{
      const cost=quote(level);
      const valid=isPositiveNumberValue(cost)&&compareNumberValues(cost,last)>0
        &&!NumberMath.serialize(cost).match(/NaN|Infinity|undefined/);last=cost;return valid;
    });
  });`);
  assert.deepEqual(rows,[true,true,true,true,true]);
});

test('old save counts derive the new quotes after load without changing progress or currencies', () => {
  const r=run(ready(), `
    probabilizerPowerUpgradeLevels={gain:3,diverger:20,interval_floor:20};
    probabilizerUpgradeLevels={a:101,b:201,speed:41,shift:21};randomPower=123;knuthPoints=456;
    const saved=captureGameSaveData(),levels=JSON.stringify([probabilizerUpgradeLevels,probabilizerPowerUpgradeLevels]);
    const quote=()=>['a','b','speed','shift'].map(id=>logValue(probabilizerUpgradeCost(id)))
      .concat(logValue(probabilizerPowerUpgradeCost('diverger')));
    const before=quote();probabilizerUpgradeLevels.a=0;probabilizerPowerUpgradeLevels.diverger=0;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,same:JSON.stringify(before)===JSON.stringify(quote()),
      levels:levels===JSON.stringify([probabilizerUpgradeLevels,probabilizerPowerUpgradeLevels]),
      kp:plain(knuthPoints),power:plain(randomPower),errors};
  `);
  assert.deepEqual(r,{loaded:true,same:true,levels:true,kp:456,power:123,errors:[]});
});

test('live range and speed descriptions and static cards explain both price thresholds', () => {
  const values=run(ready(), `knuthPoints=NumberMath.fromString('1e1000');renderProbabilizerBoard();
    return ['A','B','Speed'].map(id=>document.getElementById('probabilizer'+id+'UpgradeDescription').textContent);`);
  values.forEach(text=>assert.match(text,/1e500 KP부터/));
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/가격은 ×1e10, 1e500 KP부터 ×1e20/);
  assert.match(html,/1e40 이상부터 ×2000/);
});
