const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('SP grand theory price switches inclusively at 1e1m and preserves non-aligned legacy prices', () => {
  const rows = run(game(), `
    return ['1e1000','1e999000','1e1000000','1e1100000','2e999000'].map(cost=>{
      const price=NumberMath.fromString(cost);
      return {cost,growthLog:logValue(greatTheoryCostGrowthForResource(2,price)),
        nextLog:logValue(greatTheoryCostAfterPurchases(2,1,price))};
    });
  `);
  assert.deepEqual(rows.slice(0,4), [
    {cost:'1e1000',growthLog:1000,nextLog:2000},
    {cost:'1e999000',growthLog:1000,nextLog:1000000},
    {cost:'1e1000000',growthLog:500000,nextLog:1500000},
    {cost:'1e1100000',growthLog:500000,nextLog:1600000}
  ]);
  assert.equal(rows[4].growthLog,1000);
  assert.ok(Math.abs(rows[4].nextLog-(1000000+Math.log10(2)))<1e-9);
});

test('bulk cost and next price match sequential purchases below, across and above the new boundary', () => {
  const rows = run(game(), `
    return [['1e1000',3],['1e999000',4],['2e999000',4],['1e1000000',3],['1e1100000',3]].map(([raw,count])=>{
      const initial=NumberMath.fromString(raw);let cost=initial,total=0;
      for(let i=0;i<count;i++){
        total=addBaseNumbers(total,cost);
        cost=multiplyNumberValue(cost,compareNumberValues(cost,ABSTRACTION_SP_COST_ACCELERATION_THRESHOLD)>=0
          ? ABSTRACTION_SP_COST_ACCELERATED_GROWTH : ABSTRACTION_SP_COST_GROWTH);
      }
      return {raw,priceSame:compareNumberValues(cost,greatTheoryCostAfterPurchases(2,count,initial))===0,
        totalSame:compareNumberValues(total,greatTheoryBulkCost(2,count,initial))===0};
    });
  `);
  rows.forEach(row=>{assert.equal(row.priceSame,true,JSON.stringify(row));assert.equal(row.totalSame,true,JSON.stringify(row));});
});

test('maximum and actual SP purchase share the boundary and the existing last-price affordability guard', () => {
  assert.deepEqual(run(game(), `
    abstractionCostResourceIndex=2;greatTheorySpCost=NumberMath.fromString('1e999000');squarePoints=NumberMath.fromString('1e2000000');
    const max=greatTheoryMaximumPurchases(),bought=purchaseGreatTheory(max);
    const after={owned:plain(greatTheory),cost:logValue(greatTheorySpCost),cp:plain(greatTheoryCpCost),kp:plain(greatTheoryKpCost)};
    greatTheorySpCost=NumberMath.fromString('1e1000000');squarePoints=NumberMath.fromString('1e1500000');
    const guarded=greatTheoryMaximumPurchases();squarePoints=NumberMath.fromString('2e1500000');
    const enough=greatTheoryMaximumPurchases();
    return {max,bought,after,guarded,enough};
  `), {max:3,bought:true,after:{owned:3,cost:2000000,cp:1e15,kp:1},guarded:1,enough:2});
});

test('large maximum calculations use bounded arithmetic instead of iterating over every purchase', () => {
  const row = run(game(), `
    const original=multiplyNumberValue;let calls=0;multiplyNumberValue=(...args)=>{calls++;return original(...args);};
    const price=greatTheoryCostAfterPurchases(2,1000000,ABSTRACTION_SP_BASE_COST);
    const total=greatTheoryBulkCost(2,1000000,ABSTRACTION_SP_BASE_COST);
    return {calls,next:logValue(price),last:logValue(total),positive:isPositiveNumberValue(total)};
  `);
  assert.ok(row.calls<20,JSON.stringify(row));assert.equal(row.next,1000000+(1000000-999)*500000);
  assert.equal(row.last,row.next-500000);assert.equal(row.positive,true);
});

test('saved high SP price is retained and its next purchase uses the new growth; other currencies keep their growth', () => {
  const row = run(game(), `
    abstractionCostResourceIndex=2;greatTheorySpCost=NumberMath.fromString('1e1100000');saveGame();const saved=localStorage.getItem(SAVE_KEY);
    greatTheorySpCost=ABSTRACTION_SP_BASE_COST;loadGame(saved,{countAsLoad:false});const loaded=logValue(greatTheorySpCost);
    squarePoints=NumberMath.fromString('1e1100000');const bought=purchaseGreatTheory(1);
    return {loaded,bought,next:logValue(greatTheorySpCost),balance:plain(squarePoints),
      other:[0,1,3].map(index=>plain(greatTheoryCostGrowthForResource(index))),errors};
  `);
  assert.deepEqual(row,{loaded:1100000,bought:true,next:1600000,balance:0,other:[10,2,4],errors:[]});
});

test('purchase card explains both SP growth stages only when SP is selected', () => {
  const ctx = game();
  const source=fs.readFileSync(path.join(__dirname,'../scripts/systems/square-convergence.js'),'utf8');
  ctx.loadSource(source.slice(source.indexOf('function renderGreatTheoryResourceSelector()'),source.indexOf('function abstractionResearchAncestry(')));
  const rows=run(ctx,`
    return [0,2,1,3].map(index=>{abstractionCostResourceIndex=index;renderGreatTheoryResourceSelector();
      return {index,text:greatTheoryPurchaseDescription.textContent};});
  `);
  assert.match(rows[1].text,/1e1m/);assert.match(rows[1].text,/1e500k/);assert.match(rows[1].text,/1e1000/);
  for(const index of [0,2,3])assert.doesNotMatch(rows[index].text,/1e500k/);
});

test('SP price at or above 1e100m blocks single, bulk and direct affordability checks without changing progress', () => {
  for(const raw of ['1e100000000','1e100500000','1e1e20']) {
    assert.deepEqual(run(game(), `
      abstractionCostResourceIndex=2;greatTheory=123;greatTheorySpCost=NumberMath.fromString('${raw}');squarePoints=NumberMath.fromString('1e1e30');
      const before=JSON.stringify([NumberMath.serialize(squarePoints),NumberMath.serialize(greatTheorySpCost),greatTheory]);
      const max=greatTheoryMaximumPurchases(),single=purchaseGreatTheory(1),bulk=purchaseGreatTheory(1000);
      const direct=greatTheoryCanAffordPurchases(2,squarePoints,1,greatTheorySpCost);
      return {max,single,bulk,direct,same:before===JSON.stringify([NumberMath.serialize(squarePoints),NumberMath.serialize(greatTheorySpCost),greatTheory])};
    `),{max:0,single:false,bulk:false,direct:false,same:true});
  }
});

test('last below-limit purchase is allowed and its new price can reach or cross the stop boundary', () => {
  for(const exponent of [99500000,99999999]) {
    const row=run(game(), `
      abstractionCostResourceIndex=2;greatTheorySpCost=NumberMath.powerOfTen(${exponent});squarePoints=NumberMath.fromString('1e200000000');
      const max=greatTheoryMaximumPurchases(),tooMany=purchaseGreatTheory(2),before=plain(greatTheory);
      const bought=purchaseGreatTheory(1);
      return {max,tooMany,before,bought,next:logValue(greatTheorySpCost),after:plain(greatTheory),afterMax:greatTheoryMaximumPurchases()};
    `);
    assert.deepEqual(row,{max:1,tooMany:false,before:0,bought:true,next:exponent+500000,after:1,afterMax:0});
  }
});

test('maximum purchase from the base price stops before the capped unit even with overwhelmingly large SP', () => {
  assert.deepEqual(run(game(), `
    abstractionCostResourceIndex=2;squarePoints=NumberMath.fromString('1e1e20');
    const max=greatTheoryMaximumPurchases(),bought=purchaseGreatTheory(max);
    return {max,bought,owned:plain(greatTheory),price:logValue(greatTheorySpCost),nextMax:greatTheoryMaximumPurchases(),again:purchaseGreatTheory(1)};
  `),{max:1197,bought:true,owned:1197,price:100000000,nextMax:0,again:false});
});

test('existing capped save keeps its price and grand theory; the new limit never applies to CP KP or Theory', () => {
  const row=run(game(), `
    abstractionCostResourceIndex=2;greatTheory=123;greatTheorySpCost=NumberMath.fromString('1e150000000');
    squarePoints=NumberMath.fromString('1e200000000');saveGame();const saved=localStorage.getItem(SAVE_KEY);
    greatTheorySpCost=ABSTRACTION_SP_BASE_COST;greatTheory=0;loadGame(saved,{countAsLoad:false});
    const restored={owned:plain(greatTheory),price:logValue(greatTheorySpCost),max:greatTheoryMaximumPurchases()};
    knuthBaseUpgradeLevels.theory_exchange=1;
    const others=[0,1,3].map(index=>{
      abstractionCostResourceIndex=index;greatTheoryCpCost=NumberMath.fromString('1e200000000');
      greatTheoryKpCost=greatTheoryCpCost;greatTheoryTheoryCost=greatTheoryCpCost;
      squareConvergencePoints=greatTheoryCpCost;knuthPoints=greatTheoryCpCost;theory=greatTheoryCpCost;
      return purchaseGreatTheory(1);
    });
    return {restored,others,errors};
  `);
  assert.deepEqual(row,{restored:{owned:123,price:150000000,max:0},others:[true,true,true],errors:[]});
});

test('SP cap disables both purchase buttons with an explanation but still permits switching to another currency', () => {
  const ctx=game();
  const source=fs.readFileSync(path.join(__dirname,'../scripts/systems/square-convergence.js'),'utf8');
  ctx.loadSource(source.slice(source.indexOf('function renderGreatTheoryResourceSelector()'),source.indexOf('function abstractionResearchAncestry(')));
  const row=run(ctx, `
    abstractionCostResourceIndex=2;greatTheorySpCost=NumberMath.fromString('1e100000000');squarePoints=NumberMath.fromString('1e200000000');
    renderGreatTheoryResourceSelector();
    const capped={single:buyGreatTheoryBtn.disabled,max:buyGreatTheoryMaxBtn.disabled,label:buyGreatTheoryCost.textContent,
      description:greatTheoryPurchaseDescription.textContent,selectable:!greatTheorySpResourceBtn.disabled};
    squareConvergencePoints=greatTheoryCpCost;setAbstractionCostResource(0);renderGreatTheoryResourceSelector();
    return {capped,cp:{single:buyGreatTheoryBtn.disabled,max:buyGreatTheoryMaxBtn.disabled,description:greatTheoryPurchaseDescription.textContent}};
  `);
  assert.equal(row.capped.single,true);assert.equal(row.capped.max,true);assert.equal(row.capped.selectable,true);
  assert.match(row.capped.label,/SP 구매 한도 도달/);assert.match(row.capped.description,/1e100m/);
  assert.equal(row.cp.single,false);assert.equal(row.cp.max,false);assert.doesNotMatch(row.cp.description,/1e100m/);
});
