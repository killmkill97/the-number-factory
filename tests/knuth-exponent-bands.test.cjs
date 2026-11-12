const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const { operationPriceLog } = require('./helpers/knuth-prices.cjs');

function ready(withUi=false) {
  const ctx=game();
  ctx.loadSource(`abstractionResearchState['29-1']=true;completedKnuthChallengeIds.add('kc5');
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,1])));`);
  if(withUi)ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  return ctx;
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('formerly unrepresentable costs recover while manual, N and auto still reject insufficient funds',()=>{
  const ctx=ready(true);
  const r=run(ctx,`
    knuthBaseUpgradeLevels.cp_gain=1000000;knuthBaseAutoEnabled.cp_gain=true;knuthPoints=123;
    const u=KNUTH_BASE_UPGRADES.find(u=>u.id==='cp_gain'),quote=knuthBaseUpgradeCost(u);
    const blocked=!buyKnuthBaseUpgrade(u.id),nBlocked=!automatiumGameAdapter.buy('knuth',u.id,null,{});
    const finished=executeN('buy knuth cp_gain');
    let message='';try{automatiumGameAdapter.get([{name:'knuth',index:null},{name:u.id,index:null},{name:'cost',index:null}],{});}
    catch(error){message=error.message;}
    const available=nKnuthUpgradeSnapshot(u.id,{}).available;
    advanceKnuthBaseAutomation(10000);renderKnuthBaseUpgrades();
    const label=knuthBaseUpgradeUi.get(u.id).cost.textContent;
    const loaded=loadGame(JSON.stringify(captureGameSaveData()),{persistOverride:false,countAsLoad:false});
    return {quoteValid:quote!==null&&isPositiveNumberValue(quote),blocked,nBlocked,finished,available,label,message,loaded,kp:plain(knuthPoints),
      level:knuthBaseUpgradeLevel(u.id),enabled:knuthBaseAutoEnabled.cp_gain,errors};
  `);
  assert.ok(r.quoteValid&&r.blocked&&r.nBlocked&&r.finished&&!r.available&&r.loaded&&r.enabled,JSON.stringify(r));
  assert.match(r.label,/상승 기준/);assert.equal(r.message,'');
  assert.equal(r.kp,123);assert.equal(r.level,1000000);assert.deepEqual(r.errors,[]);
});

test('representable deep prices render and can be paid exactly without resetting effects or other upgrades',()=>{
  const r=run(ready(true),`
    const u=KNUTH_BASE_UPGRADES.find(u=>u.id==='stagnant_mass_gain');knuthBaseUpgradeLevels[u.id]=5;
    const cost=knuthBaseUpgradeCost(u);knuthPoints=cost;renderKnuthBaseUpgrades();
    const label=knuthBaseUpgradeUi.get(u.id).cost.textContent,before=knuthBaseUpgradeLevel('cp_gain');
    const depth=probabilizerPriceLayers(cost),bought=buyKnuthBaseUpgrade(u.id);
    return {depth,label,bought,left:plain(knuthPoints),level:knuthBaseUpgradeLevel(u.id),
      same:before===knuthBaseUpgradeLevel('cp_gain'),effect:plain(stagnantMassBlackHoleMultiplier()),errors};
  `);
  assert.ok(r.depth>=1&&r.bought&&r.same);assert.doesNotMatch(r.label,/비용: 0|NaN|Infinity/);
  assert.equal(r.left,0);assert.equal(r.level,6);assert.equal(r.effect,4**6);assert.deepEqual(r.errors,[]);
});

test('cached prices recover after lower saved levels or a price-rule change',()=>{
  assert.deepEqual(run(ready(),`
    const u=KNUTH_BASE_UPGRADES[0];knuthBaseUpgradeLevels[u.id]=1000;
    const valid=knuthBaseUpgradeCost(u)!==null;
    knuthBaseUpgradeLevels[u.id]=350;const original=knuthBaseUpgradeCost(u);
    const cached=original===knuthBaseUpgradeCost(u);
    KNUTH_REPEATABLE_COST_BALANCE.kpBandGrowth=2;
    const changed=knuthBaseUpgradeCost(u);
    return {valid,cached,recovered:original!==null,changed:compareNumberValues(changed,original)<0};
  `),{valid:true,cached:true,recovered:true,changed:true});
});

test('operation-slot prices and probabilizer price bands retain their independent rules',()=>{
  const r=run(ready(),`
    knuthOperationLevel=250;probabilizerUpgradeLevels.speed=41;
    return {operation:logValue(knuthOperationUpgradeCost()),probabilizer:logValue(probabilizerUpgradeCost('speed'))};
  `);
  close(r.operation,operationPriceLog(250));assert.equal(r.probabilizer,540);
});

test('native high-price exponents match an independent recurrence over multiple skipped bands',()=>{
  const rows=run(ready(),`return [2,20,1e50].flatMap(growth=>[400,499,599].flatMap(start=>
    [1,2,3,5].map(count=>{
      const cost=knuthRepeatableCostAfterPurchases(NumberMath.powerOfTen(start),growth,count);
      return {growth,start,count,depth:cost===null?null:probabilizerPriceLayers(cost),
        logarithm:cost!==null&&typeof cost.exponent==='number'?cost.exponent+Math.log10(cost.mantissa):null};
    })));`);
  rows.forEach(row=>{
    let expected=row.start;
    for(let i=0;i<row.count;i++)expected+=Math.log10(row.growth*8)*4**(Math.floor((row.start+i*Math.log10(row.growth)-400)/100)+1);
    if(Number.isFinite(expected))close(row.logarithm,expected);
    else assert.ok(row.depth===null||row.depth>=2);
  });
});
