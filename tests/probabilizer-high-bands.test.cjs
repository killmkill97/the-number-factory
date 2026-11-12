const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  ctx.loadSource(`abstractionResearchState['29-1']=true;knuthBaseUpgradeLevels.probabilizer=1;
    abstractionResearchState['21-1']=true;initializeProbabilizerRangeProgress();`);
  return ctx;
}
const close=(a,b)=>assert.ok(Math.abs(a/b-1)<1e-9,`${a} != ${b}`);

test('1e500 is preserved and every 100-exponent band multiplies the already-doubled growth exponent by another four',()=>{
  const rows=run(ready(),`return PROBABILIZER_UPGRADES.map(({id,priceExponent:p})=>{
    const start=200/p,values=[];
    for(let n=-1;n<=7;n++){probabilizerUpgradeLevels[id]=start+n;values.push(logValue(probabilizerUpgradeCost(id)));}
    return {p,values};
  });`);
  rows.forEach(({p,values})=>{
    close(values[0],500-p);let exponent=500;close(values[1],exponent);
    for(let i=2;i<values.length;i++){
      const reference=500+(i-2)*p;
      exponent+=2*p*4**(Math.floor((reference-500)/100)+1);
      if(Number.isFinite(exponent))close(values[i],exponent);
    }
  });
});

test('accelerated prices do not skip reference bands on the following purchase',()=>{
  const rows=run(ready(),`const rows=[];probabilizerUpgradeLevels.shift=23;
    for(let i=0;i<4;i++){rows.push(logValue(probabilizerUpgradeCost('shift')));probabilizerUpgradeLevels.shift++;}
    return rows;`);
  assert.deepEqual(rows,[740,820,900,980]);
});

test('band summation agrees with an independent reference-price recurrence',()=>{
  const r=run(ready(),`
    let expected=1000,reference=500;
    for(let i=0;i<35;i++){
      expected+=10*4**(1+Math.floor((reference-500)/100));reference+=10;
    }
    return {actual:plain(bandedUpgradePriceExponent(1000,10,35,PROBABILIZER_COST_BALANCE,500)),expected};
  `);
  close(r.actual,r.expected);
});

test('real KP payment uses the same accelerated quote and does not change the upgrade effect',()=>{
  assert.deepEqual(run(ready(),`
    probabilizerUpgradeLevels.shift=20;const cost=probabilizerUpgradeCost('shift');knuthPoints=cost;
    const before=probabilizerParameters().mode,bought=buyProbabilizerUpgrade('shift');
    const next=logValue(probabilizerUpgradeCost('shift')),saved=captureGameSaveData();
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {bought,left:plain(knuthPoints),modeDelta:probabilizerParameters().mode-before,
      next,loaded,restored:logValue(probabilizerUpgradeCost('shift'))===next};
  `),{bought:true,left:0,modeDelta:1,next:580,loaded:true,restored:true});
});

test('deep prices use bounded construction, cache repeated quotes and correctly compare representable funds',()=>{
  assert.deepEqual(run(ready(),`
    probabilizerUpgradeLevels.shift=1000000;const cost=probabilizerUpgradeCost('shift');
    const same=cost===probabilizerUpgradeCost('shift');
    const smaller=NumberMath.power(cost,.5),larger=NumberMath.power(cost,2);
    return {same,deep:probabilizerPriceLayers(cost)>=2,smallBlocked:!probabilizerCanAffordCost('1e100000',cost),
      equal:probabilizerCanAffordCost(cost,cost),lowerBlocked:!probabilizerCanAffordCost(smaller,cost),
      higher:probabilizerCanAffordCost(larger,cost),finite:!NumberMath.serialize(cost).match(/NaN|Infinity/)};
  `),{same:true,deep:true,smallBlocked:true,equal:true,lowerBlocked:true,higher:true,finite:true});
});

test('large saved counts recover positive prices without becoming free or erasing progress',()=>{
  const r=run(ready(),`
    probabilizerUpgradeLevels.shift=1000000;knuthPoints=NumberMath.fromString('1e1e140');
    const before=NumberMath.serialize(knuthPoints),quote=probabilizerUpgradeCost('shift');
    const blocked=!buyProbabilizerUpgrade('shift');renderProbabilizerBoard();const saved=captureGameSaveData();
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {valid:quote!==null&&isPositiveNumberValue(quote),blocked,same:before===NumberMath.serialize(knuthPoints),level:probabilizerUpgradeLevels.shift,
      disabled:document.getElementById('probabilizerShiftUpgradeBtn').disabled,
      description:document.getElementById('probabilizerShiftUpgradeCost').textContent,errors};
  `);
  assert.deepEqual(r,{valid:true,blocked:true,same:true,level:1000000,disabled:true,
    description:'분포 중심이 b에 도달',errors:[]});
});


test('the quote cache follows lower levels and balance changes instead of retaining stale prices',()=>{
  const r=run(ready(),`
    probabilizerUpgradeLevels.speed=41;const first=logValue(probabilizerUpgradeCost('speed'));
    probabilizerUpgradeLevels.speed=40;const lower=logValue(probabilizerUpgradeCost('speed'));
    PROBABILIZER_COST_BALANCE.kpBandGrowth=2;probabilizerUpgradeLevels.speed=41;
    const changed=logValue(probabilizerUpgradeCost('speed'));
    return {first,lower,changed};
  `);
  assert.deepEqual(r,{first:540,lower:500,changed:520});
});

test('random-power purchases are unaffected and the KP cards explain the extra band escalation',()=>{
  const r=run(ready(),`
    probabilizerPowerUpgradeLevels={gain:50,diverger:20,interval_floor:50};
    return ['gain','diverger','interval_floor'].map(id=>logValue(probabilizerPowerUpgradeCost(id)));
  `);
  close(r[0],59);close(r[1],Math.log10(5e9)+18*Math.log10(50)+2*Math.log10(2000));
  close(r[2],Math.log10(5e9)+50*Math.log10(25));
  assert.match(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),/1e500 KP부터 기존 지수 ×2에 더해, 1e100배 구간마다 가격 상승폭의 지수가 추가로 4배/);
});
