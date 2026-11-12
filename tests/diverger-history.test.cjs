const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('run histories merge equal entries, preserve paid/free/legacy order and truncate whole ranges', () => {
  const r=run(game(),`
    const history=new DivergerUpgradeHistory();history.append(true,500000);history.push(false,false,'legacy-theory');
    const size=history.length,runs=history.runs.length,popped=[history.pop(),history.pop(),history.pop(),history.pop()];
    history.length=10;const tail=history.pop();history.length=0;
    return {size,runs,popped,tail,empty:history.length,remaining:history.runs.length};
  `);
  assert.deepEqual(r,{size:500003,runs:3,popped:['legacy-theory',false,false,true],tail:true,empty:0,remaining:0});
});

test('serialization is adaptive and never expands alternating flags beyond their old representation', () => {
  for(const pattern of [[true],[false],['legacy-theory'],[true,false],[true,false,'legacy-theory']]){
    const ctx=game();ctx.pattern=pattern;
    const r=run(ctx,`
      const history=new DivergerUpgradeHistory(),reference=[];
      for(let i=0;i<1000;i++){const value=pattern[i%pattern.length];history.push(value);reference.push(value);}
      const saved=history.toJSON();loadDivergerUpgradeHistory({a:saved},{a:1000});
      const restored=[];while(divergerUpgradeHistory.a.length)restored.push(divergerUpgradeHistory.a.pop());
      return {bytes:JSON.stringify(saved).length,oldBytes:JSON.stringify(reference).length,
        same:JSON.stringify(restored)===JSON.stringify(reference.reverse())};
    `);
    assert.ok(r.bytes<=r.oldBytes);assert.ok(r.same);
  }
});

test('legacy arrays compress in memory and future loads operate on runs rather than every purchase', () => {
  const ctx=game();
  assert.deepEqual(run(ctx,`
    loadDivergerUpgradeHistory({a:Array(417430).fill(true),b:Array(184716).fill(true),c:Array(99).fill(true),speed:Array(43).fill(true)},
      {a:417430,b:184716,c:99,speed:43});
    const saved=captureDivergerUpgradeHistory();let pushes=0;
    const original=DivergerUpgradeHistory.prototype.push;
    DivergerUpgradeHistory.prototype.push=function(...args){pushes++;return original.apply(this,args);};
    loadDivergerUpgradeHistory(saved,{a:417430,b:184716,c:99,speed:43});
    return {lengths:Object.values(divergerUpgradeHistory).map(h=>h.length),runs:Object.values(divergerUpgradeHistory).map(h=>h.runs.length),
      bytes:JSON.stringify(saved).length<500,pushes};
  `),{lengths:[417430,184716,99,43],runs:[1,1,1,1],bytes:true,pushes:0});
});

test('missing histories retain the old defaults and legacy theory-paid status without per-level allocation', () => {
  const ctx=game();
  assert.deepEqual(run(ctx,`
    loadDivergerUpgradeHistory(null,{a:1e12,b:1,c:2,speed:100},true);
    return {a:divergerUpgradeHistory.a.length,runs:divergerUpgradeHistory.a.runs.length,
      paid:divergerUpgradeHistory.a.pop(),speed:divergerUpgradeHistory.speed.pop()};
  `),{a:1e12,runs:1,paid:'legacy-theory',speed:false});
  assert.deepEqual(run(ctx,`
    loadDivergerUpgradeHistory({a:[true,false,'legacy-theory']},{a:5},true);
    return Array.from({length:5},()=>divergerUpgradeHistory.a.pop());
  `),['legacy-theory','legacy-theory','legacy-theory',false,'legacy-theory']);
});

test('invalid and excess runs cannot add history beyond the real level or allocate huge arrays', () => {
  assert.deepEqual(run(game(),`
    loadDivergerUpgradeHistory({a:{format:'runs-v1',length:1e15,runs:[null,{count:-1,value:false},
      {count:1.5,value:false},{count:Infinity,value:false},{count:2,value:false},{count:1e12,value:true}]}},{a:5});
    return {length:divergerUpgradeHistory.a.length,runs:divergerUpgradeHistory.a.runs.length,
      values:Array.from({length:5},()=>divergerUpgradeHistory.a.pop())};
  `),{length:5,runs:2,values:[true,true,true,false,false]});
});

test('new save data is detached, Firestore-compatible and falls back to encoded logical length without level fields', () => {
  const ctx=game(true);
  assert.deepEqual(run(ctx,`
    generalizationResearchState['3-2']=true;divergerALevel=1000;divergerA=NumberMath.power(2,1000);
    divergerACpCost=divergerACpCostAtLevel(1000);divergerUpgradeHistory.a.append(true,1000);
    const saved=captureGameSaveData(),before=JSON.stringify(saved.divergerUpgradeHistory);divergerUpgradeHistory.a.push(false);
    const detached=before===JSON.stringify(saved.divergerUpgradeHistory);delete saved.divergerALevel;
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const nested=value=>Array.isArray(value)?value.some(item=>Array.isArray(item)||nested(item)):
      value&&typeof value==='object'?Object.values(value).some(nested):false;
    return {detached,loaded,level:divergerALevel,history:divergerUpgradeHistory.a.length,
      nested:nested(saved.divergerUpgradeHistory),errors};
  `),{detached:true,loaded:true,level:1000,history:1000,nested:false,errors:[]});
});

test('paid and free console undo still refund exactly the original small costs across a JSON round trip', () => {
  const ctx=game(true);
  assert.deepEqual(run(ctx,`
    generalizationResearchState['3-2']=true;squareConvergencePoints=100;
    buyDivergerAUpgrade(false);applyDivergerAUpgrade(false);buyDivergerAUpgrade(false);
    saveGame();loadGame(null,{countAsLoad:false});const refunds=[];
    for(let i=0;i<3;i++){const before=squareConvergencePoints;removeDivergerUpgrade('a');
      refunds.push(plain(subtractNumberValues(squareConvergencePoints,before)));}
    return {refunds,balance:plain(squareConvergencePoints),level:divergerALevel,history:divergerUpgradeHistory.a.length};
  `),{refunds:[45,0,20],balance:100,level:0,history:0});
});

test('all four cost recurrences preserve their exact integer-floor prefix and stay within approximate precision thereafter', () => {
  const r=run(game(),`
    const rows=[];
    for(const [kind,base,numerator,denominator] of [['a',20,3,2],['b',32,5,2],['c',48,2,1],['speed',10000,3,2]]){
      let reference=base;
      for(let level=0;level<=1000;level++){
        const actual=divergerCpCostAtLevel(kind,level);
        if(!NumberMath.isScientific(reference)&&compareNumberValues(reference,actual)!==0)throw Error('integer prefix changed');
        if([0,3,80,181,1000].includes(level))rows.push(Math.abs(logValue(reference)-logValue(actual)));
        reference=scaleDivergerCpCost(reference,numerator,denominator);
      }
    }
    return rows;
  `);
  assert.ok(r.every(error=>error<1e-10));
});

test('large cost reconstruction uses a bounded prefix and validates stored rounding without trusting obsolete prices', () => {
  const r=run(game(),`
    let calls=0;const original=scaleDivergerCpCost;
    scaleDivergerCpCost=(...args)=>{calls++;return original(...args);};
    const a=divergerACpCostAtLevel(417430),b=divergerBCpCostAtLevel(184716),huge=divergerACpCostAtLevel(1e12);
    const saved=NumberMath.normalize(1.00000000001*a.mantissa,a.exponent);
    const kept=NumberMath.serialize(restoredDivergerCpCost('a',417430,saved))===NumberMath.serialize(saved);
    const repaired=compareNumberValues(restoredDivergerCpCost('a',417430,1),a)===0;
    for(let i=1;i<300;i++)divergerACpCostAtLevel(1000+i);
    return {calls,kept,repaired,positive:isPositiveNumberValue(a)&&isPositiveNumberValue(b)&&isPositiveNumberValue(huge),
      cache:divergerCpCostModels.a.cache.size};
  `);
  assert.ok(r.calls<300);assert.ok(r.kept&&r.repaired&&r.positive);assert.ok(r.cache<=128);
});

test('a high-progress legacy save shrinks by over 99 percent while currencies, levels and valid next costs survive', () => {
  const ctx=game(true);
  const r=run(ctx,`
    const saved=captureGameSaveData();saved.knuthPoints='1e5000';saved.squareConvergencePoints='1e70000';
    saved.divergerALevel=417430;saved.divergerBLevel=184716;
    saved.divergerACpCost=NumberMath.serialize(divergerACpCostAtLevel(saved.divergerALevel));
    saved.divergerBCpCost=NumberMath.serialize(divergerBCpCostAtLevel(saved.divergerBLevel));
    saved.divergerUpgradeHistory={a:Array(saved.divergerALevel).fill(true),b:Array(saved.divergerBLevel).fill(true)};
    const legacy=JSON.stringify(saved);loadGame(legacy,{persistOverride:false,countAsLoad:false});
    saveGame();const compact=localStorage.getItem(SAVE_KEY);loadGame(compact,{countAsLoad:false});
    return {ratio:compact.length/legacy.length,kp:logValue(knuthPoints),cp:logValue(squareConvergencePoints),
      a:divergerALevel,b:divergerBLevel,costs:[NumberMath.serialize(divergerACpCost)===saved.divergerACpCost,
        NumberMath.serialize(divergerBCpCost)===saved.divergerBCpCost],errors};
  `);
  assert.ok(r.ratio<.01);assert.equal(r.kp,5000);assert.equal(r.cp,70000);
  assert.equal(r.a,417430);assert.equal(r.b,184716);assert.deepEqual(r.costs,[true,true]);assert.deepEqual(r.errors,[]);
});
