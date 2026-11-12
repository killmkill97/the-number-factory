const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game: baseGame, run } = require('./helpers/kc4-game.cjs');
function game(...args) {
  const ctx=baseGame(...args);ctx.loadSource("abstractionResearchState['29-1']=true;");return ctx;
}
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('payment e1000 with reference e600 cannot trigger higher growth from its own accelerated payment',()=>{
  const r=run(game(),`
    const cost=NumberMath.fromString('1e1000'),reference=NumberMath.fromString('1e600');
    const next=knuthRepeatableCostAfterPurchases(cost,2,1,reference);
    const second=knuthRepeatableCostAfterPurchases(next,2,1,multiplyNumberValue(reference,2));
    const bulk=knuthRepeatableCostAfterPurchases(cost,2,100,reference);
    return {first:logValue(NumberMath.divideApproximate(next,cost)),
      second:logValue(NumberMath.divideApproximate(second,next)),bulk:logValue(bulk)};
  `);
  const increment=Math.log10(16)*64;
  close(r.first,increment);close(r.second,increment);close(r.bulk,1000+100*increment);
});

test('KC6 payment and reference prices advance independently without affecting the first 300 prices',()=>{
  const r=run(game(),`
    const cost=NumberMath.fromString('1e1000'),reference=NumberMath.fromString('1e600');
    const result=knuthOperationRewardCostAfterPurchases(cost,2,reference);
    completedKnuthChallengeIds.add('kc6');knuthOperationLevel=310;
    return {result:logValue(result),reference:logValue(knuthOperationReferenceCost()),
      payment:logValue(knuthOperationUpgradeCost()),level:knuthOperationLevel};
  `);
  close(r.result,1640);close(r.reference,599*Math.log10(2)+110);
  close(r.payment,599*Math.log10(2)+200);assert.equal(r.level,310);
});

test('all three systems agree with an independent sequential two-price model over many boundaries',()=>{
  const rows=run(game(),`
    const rows=[];
    for(const [base,growth] of [[4,20],['1e400',1e50],['1e1200',1e200]])for(const n of [0,1,3,50,350,1000]){
      const actual=knuthRepeatableCostAfterPurchases(base,growth,n);
      rows.push({kind:'base',start:logValue(base),step:Math.log10(growth),n,actual:logValue(actual)});
    }
    for(const u of PROBABILIZER_UPGRADES)for(const n of [0,1,20,41,201,450,1000]){
      probabilizerUpgradeLevels[u.id]=n;
      rows.push({kind:'random',start:300,step:u.priceExponent,n,actual:logValue(probabilizerUpgradeCost(u.id))});
    }
    completedKnuthChallengeIds.add('kc6');for(const n of [0,1,2,10,20,100,700]){
      knuthOperationLevel=300+n;
      rows.push({kind:'operation',start:599*Math.log10(2)+10,step:10,n,actual:logValue(knuthOperationUpgradeCost())});
    }return rows;
  `);
  for(const row of rows){
    let actual=row.start;
    for(let i=0;i<row.n;i++){
      const reference=row.start+row.step*i;
      const threshold=row.kind==='base'?400:row.kind==='random'?500:200;
      const band=Math.max(0,1+Math.floor((reference-threshold)/100));
      let increment=row.step;
      if(row.kind==='base')increment+=(reference>=308+Math.log10(1.8)?Math.log10(8):reference>=50?Math.log10(2):0);
      if(row.kind==='random'&&reference>=500)increment*=2;
      actual+=increment*(row.kind==='operation'?2:4)**band;
    }
    close(row.actual,actual);
  }
});

test('inclusive reference boundaries retain the mantissa below a threshold, even when payment is far higher',()=>{
  const rows=run(game(),`return ['9.99999999999999e399','1e400','9.99999999999999e499','1e500'].map(r=>{
    const next=knuthRepeatableCostAfterPurchases('1e1000',2,1,NumberMath.fromString(r));
    return logValue(NumberMath.divideApproximate(next,'1e1000'));
  });`);
  rows.forEach((r,i)=>close(r,Math.log10(16)*[1,4,4,16][i]));
});

test('saved counts recalculate prices without changing paid currencies, effects, completions or automation',()=>{
  const r=run(game(),`
    completedKnuthChallengeIds.add('kc6');completedKnuthChallengeIds.add('kc5');
    knuthOperationLevel=330;knuthBaseUpgradeLevels.cp_gain=600;probabilizerUpgradeLevels.b=350;
    knuthPoints=12345;knuthBaseAutoEnabled.operation=true;randomPower=678;
    const effects=serializeNumberValue(knuthBaseMultiplier('cp_gain',25)),saved=captureGameSaveData();
    const quotes=()=>[knuthOperationUpgradeCost(),knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0]),probabilizerUpgradeCost('b')].map(serializeNumberValue);
    const before=quotes();loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {same:JSON.stringify(before)===JSON.stringify(quotes()),effect:effects===serializeNumberValue(knuthBaseMultiplier('cp_gain',25)),
      levels:[knuthOperationLevel,knuthBaseUpgradeLevels.cp_gain,probabilizerUpgradeLevels.b],kp:plain(knuthPoints),
      random:plain(randomPower),complete:hasCompletedKnuthChallenge('kc6'),auto:knuthBaseAutoEnabled.operation,errors};
  `);
  assert.deepEqual(r,{same:true,effect:true,levels:[330,600,350],kp:12345,random:678,complete:true,auto:true,errors:[]});
});

test('large levels use bounded band summation and a quote cache, not one iteration per purchase or price tower',()=>{
  const r=run(game(),`
    completedKnuthChallengeIds.add('kc6');let calls=0;const original=upgradeReferenceBoundaryIndex;
    upgradeReferenceBoundaryIndex=(...args)=>{calls++;return original(...args);};
    knuthOperationLevel=Number.MAX_SAFE_INTEGER;const op=knuthOperationUpgradeCost();
    knuthBaseUpgradeLevels.cp_gain=Number.MAX_SAFE_INTEGER;const base=knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0]);
    probabilizerUpgradeLevels.b=Number.MAX_SAFE_INTEGER;const random=probabilizerUpgradeCost('b');
    const firstCalls=calls;for(let i=0;i<100;i++){
      knuthOperationUpgradeCost();knuthBaseUpgradeCost(KNUTH_BASE_UPGRADES[0]);probabilizerUpgradeCost('b');
    }return {firstCalls,cached:calls===firstCalls,valid:[op,base,random].every(p=>p!==null&&isPositiveNumberValue(p)
      &&!(/NaN|Infinity|undefined/.test(JSON.stringify(serializeNumberValue(p)))))};
  `);
  assert.ok(r.valid&&r.cached&&r.firstCalls<600,JSON.stringify(r));
});

test('price cards expose independent references while N and manual purchases use the payment quote',()=>{
  const ctx=game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  ctx.loadSource('renderKnuthUpgradeGroups=()=>{};');
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  const r=run(ctx,`
    completedKnuthChallengeIds.add('kc6');completedKnuthChallengeIds.add('kc5');knuthOperationLevel=310;renderKnuthBoard();
    const slot=knuthOperationUpgradeCostText.textContent;
    knuthBaseUpgradeLevels.probabilizer=1;abstractionResearchState['21-1']=true;
    probabilizerUpgradeLevels.b=350;initializeProbabilizerRangeProgress();renderProbabilizerBoard();
    const random=document.getElementById('probabilizerBUpgradeCost').textContent;
    const quote=knuthOperationUpgradeCost();knuthPoints=knuthOperationReferenceCost();
    const blocked=!canBuyKnuthOperationUpgrade();knuthPoints=quote;
    const same=compareNumberValues(nKnuthUpgradeSnapshot('operation',{}).cost,quote)===0;
    const bought=executeN('buy knuth operation');return {slot,random,blocked,same,bought,kp:plain(knuthPoints),level:knuthOperationLevel};
  `);
  assert.match(r.slot,/상승 기준/);assert.match(r.random,/상승 기준/);
  assert.ok(r.blocked&&r.same&&r.bought);assert.equal(r.kp,0);assert.equal(r.level,311);
});
