const assert = require('node:assert/strict');
const test = require('node:test');
const { game: baseGame, run } = require('./helpers/kc4-game.cjs');
function game(...args) {
  const ctx=baseGame(...args);ctx.loadSource("abstractionResearchState['29-1']=true;");return ctx;
}

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);

test('each inclusive hundred-exponent band multiplies the exponent of the existing growth by another four', () => {
  const rows=run(game(), `return ['1e399','9.99999999999999e399','1e400','1e499',
    '9.99999999999999e499','1e500','1e600','1e1200'].map(raw=>{
      const cost=NumberMath.fromString(raw),next=knuthRepeatableCostAfterPurchases(cost,2,1);
      return logValue(NumberMath.divideApproximate(next,cost));
    });`);
  rows.forEach((value,i)=>close(value,Math.log10(16)*[1,1,4,4,4,16,64,262144][i]));
});

test('bulk and split prices use a separately advancing reference, never the accelerated price', () => {
  const rows=run(game(), `return [['5e399',2],['1e499',10],['1e499',1e200],['3.7e1200',1e200]].map(([start,growth])=>{
    let sequential=start,reference=start;
    for(let i=0;i<20;i++){
      sequential=knuthRepeatableCostAfterPurchases(sequential,growth,1,reference);
      reference=multiplyNumberValue(reference,growth);
    }
    const bulk=knuthRepeatableCostAfterPurchases(start,growth,20);
    const left=knuthRepeatableCostAfterPurchases(start,growth,7);
    const split=knuthRepeatableCostAfterPurchases(left,growth,13,multiplyNumberValue(start,NumberMath.power(growth,7)));
    return {seq:logValue(NumberMath.log10(sequential)),bulk:logValue(NumberMath.log10(bulk)),split:logValue(NumberMath.log10(split))};
  });`);
  rows.forEach(row=>{close(row.bulk,row.seq);close(row.split,row.seq);});
  assert.deepEqual(run(game(), `
    const first=knuthRepeatableCostAfterPurchases('1e499',10,1);
    const second=knuthRepeatableCostAfterPurchases('1e499',10,2);
    return [logValue(first),logValue(second)];
  `).map(x=>Number(x.toFixed(10))),[506.612359948,537.0617997398]);
});

test('cached quotes avoid repeated work, advance once, and invalidate after level decreases or definition changes', () => {
  const r=run(game(), `
    const u=KNUTH_BASE_UPGRADES[0];knuthBaseUpgradeLevels[u.id]=250;knuthBaseUpgradeCost(u);
    const original=NumberMath.power;let calls=0;NumberMath.power=(...args)=>{calls++;return original(...args);};
    for(let i=0;i<100;i++)knuthBaseUpgradeCost(u);const unchangedCalls=calls;
    knuthBaseUpgradeLevels[u.id]++;const next=knuthBaseUpgradeCost(u),incrementCalls=calls;
    knuthBaseUpgradeLevels[u.id]=10;const lower=knuthBaseUpgradeCost(u);
    const expected=knuthRepeatableCostAfterPurchases(u.baseCost,u.growth,10);
    const edited={...u,growth:30},changed=knuthBaseUpgradeCost(edited);
    const expectedEdited=knuthRepeatableCostAfterPurchases(u.baseCost,30,10);
    NumberMath.power=original;
    return {unchangedCalls,incrementCalls,positive:compareNumberValues(next,0)>0,
      lower:compareNumberValues(lower,expected)===0,changed:compareNumberValues(changed,expectedEdited)===0};
  `);
  assert.equal(r.unchangedCalls,0);assert.ok(r.incrementCalls<=12);
  assert.ok(r.positive&&r.lower&&r.changed);
});

test('large batched prices stay representable with bounded work instead of lifting a tower per purchase', () => {
  const rows=run(game(), `return [1000,1000000,Number.MAX_SAFE_INTEGER-10].map(count=>{
    const first=knuthRepeatableCostAfterPurchases('1e1000',20,count);
    const direct=knuthRepeatableCostAfterPurchases('1e1000',20,count+10);
    const split=knuthRepeatableCostAfterPurchases(first,20,10,multiplyNumberValue('1e1000',NumberMath.power(20,count)));
    return {direct,split,first,
      valid:!JSON.stringify([first,direct,split]).match(/NaN|Infinity|undefined/)};
  });`);
  rows.forEach(row=>{assert.ok(row.first&&row.direct&&row.split&&row.valid);});
});

test('manual, N quotes and the built-in autobuyer share the new cost for late group upgrades', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc5');
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,1])));
    knuthBaseUpgradeLevels.singularity_limit=0;
    const u=KNUTH_BASE_UPGRADES.find(u=>u.id==='singularity_limit'),first=knuthBaseUpgradeCost(u);
    const getCost=()=>automatiumGameAdapter.get([{name:'knuth',index:null},{name:u.id,index:null},{name:'cost',index:null}],{});
    const same=compareNumberValues(getCost(),first)===0;
    knuthPoints=first;const executed=executeN('buy knuth singularity_limit');
    const paid=compareNumberValues(knuthPoints,0)===0&&knuthBaseUpgradeLevel(u.id)===1;
    const next=knuthBaseUpgradeCost(u),ratio=logValue(NumberMath.divideApproximate(next,first));
    knuthPoints=next;knuthBaseAutoEnabled.singularity_limit=true;advanceKnuthBaseAutomation(250);
    return {same,executed,paid,ratio:Number(ratio.toFixed(10)),level:knuthBaseUpgradeLevel(u.id),
      left:plain(knuthPoints),effect:singularityHoldingLimit()};
  `),{same:true,executed:true,paid:true,ratio:203.612359948,level:2,left:0,effect:18});
});
