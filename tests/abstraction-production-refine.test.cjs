const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.probabilizer=1;knuthBaseUpgradeLevels.late_abstraction=1;
    knuthPoints=NumberMath.fromString('1e10000');greatTheory=100000;`);
  return ctx;
}
const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);

test('26-1 has a neutral origin and smoothly scales both actual endpoints by the same NumberMath multiplier',()=>{
  const r=run(ready(),`
    randomPower=1e50;const off=probabilizerParameters();abstractionResearchState['26-1']=true;
    const rows=['0','1','1e10','1e50','1e100'].map(text=>{
      randomPower=NumberMath.fromString(text);const m=abstractionProbabilizerRangeMultiplier(),p=probabilizerParameters();
      return {log:logValue(m),a:p.a,b:p.b,mode:p.mode,m:plain(m)};
    });return {off,rows,base:probabilizerBaseParameters()};
  `);
  assert.equal(r.off.a,1);assert.equal(r.off.b,100);assert.equal(r.rows[0].m,1);close(r.rows[3].m,1e6);
  r.rows.forEach((row,i)=>{close(row.a,row.m);close(row.b,100*row.m);assert.ok(row.mode>=row.a&&row.mode<=row.b);if(i)assert.ok(row.log>r.rows[i-1].log);});
  assert.equal(r.base.a,1);assert.equal(r.base.b,100);
});

test('a/b purchases and the 21-1 checkpoint store only raw values, never the active range boost',()=>{
  const r=run(ready(),`
    randomPower=1e50;abstractionResearchState['26-1']=true;abstractionResearchState['20-1']=true;
    const researched=researchAbstraction('21-1');const initial={...probabilizerRangeProgress};
    for(let i=0;i<4;i++){buyProbabilizerUpgrade('a');buyProbabilizerUpgrade('b');}
    const checkpoint={...probabilizerRangeProgress},raw=probabilizerBaseParameters(),boosted=probabilizerParameters();
    const prices=['a','b','speed','shift'].map(id=>NumberMath.serialize(probabilizerUpgradeCost(id)));
    abstractionResearchState['26-1']=false;const unboosted=probabilizerParameters();
    const samePrices=prices.every((p,i)=>p===NumberMath.serialize(probabilizerUpgradeCost(['a','b','speed','shift'][i])));
    abstractionResearchState['26-1']=true;return {researched,initial,checkpoint,raw,boosted,unboosted,samePrices,levels:probabilizerUpgradeLevels};
  `);
  assert.ok(r.researched&&r.samePrices);assert.equal(r.initial.a,1);assert.equal(r.initial.b,100);
  close(r.checkpoint.a,1.1**4);close(r.checkpoint.b,100*1.1**4);assert.equal(r.checkpoint.aLevel,4);assert.equal(r.checkpoint.bLevel,4);
  close(r.boosted.a/r.raw.a,1e6);close(r.boosted.b/r.raw.b,1e6);assert.deepEqual(r.raw,r.unboosted);assert.equal(r.levels.a,4);assert.equal(r.levels.b,4);
});

test('save/load roundtrips boosted research and range purchases without multiplying the checkpoint again',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['26-1']=true;abstractionResearchState['21-1']=true;randomPower=1e50;
    initializeProbabilizerRangeProgress();buyProbabilizerUpgrade('b');
    const raw=JSON.stringify(probabilizerRangeProgress),range=JSON.stringify(probabilizerParameters());
    for(let i=0;i<10;i++)loadGame(JSON.stringify(captureGameSaveData()),{persistOverride:false,countAsLoad:false});
    const sameRaw=raw===JSON.stringify(probabilizerRangeProgress),sameRange=range===JSON.stringify(probabilizerParameters());
    const saved=captureGameSaveData();saved.abstractionResearchState['26-1']=false;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const inactive=probabilizerParameters().b===probabilizerBaseParameters().b;
    return {sameRaw,sameRange,inactive,level:probabilizerUpgradeLevels.b,errors};
  `),{sameRaw:true,sameRange:true,inactive:true,level:1,errors:[]});
});

test('clipped effective ranges stay finite at 1e308 but never prematurely mark raw purchases as maximum',()=>{
  const r=run(ready(),`
    abstractionResearchState['26-1']=true;abstractionResearchState['21-1']=true;randomPower=NumberMath.fromString('1e1e1e100');
    initializeProbabilizerRangeProgress();const before=probabilizerParameters();
    const available=!probabilizerUpgradeAtMaximum('a')&&!probabilizerUpgradeAtMaximum('b');
    const boughtA=buyProbabilizerUpgrade('a'),boughtB=buyProbabilizerUpgrade('b');
    const raw=probabilizerBaseParameters(),after=probabilizerParameters();advanceProbabilizer(1e10,()=>.5);
    return {before,available,boughtA,boughtB,raw,after,positive:isPositiveNumberValue(randomPower),roll:probabilizerLastRoll};
  `);
  assert.ok(r.available&&r.boughtA&&r.boughtB&&r.positive);close(r.raw.a,1.1);close(r.raw.b,110);
  for(const p of [r.before,r.after]){assert.equal(p.a,1e308);assert.equal(p.b,1e308);assert.equal(p.mode,1e308);}
  assert.equal(r.roll,1e308);
});

test('a five-second synthetic production anchor is materially stronger while all raw levels and timing stay fixed',()=>{
  const r=run(ready(),`
    abstractionResearchState['21-1']=true;abstractionResearchState['26-1']=true;abstractionResearchState['25-1']=true;
    probabilizerRangeProgress={a:1e46,b:1e46,aLevel:0,bLevel:0};
    const effect=abstractionProbabilizerRangeMultiplier,rows=[];
    for(const enabled of [false,true]){
      abstractionProbabilizerRangeMultiplier=enabled?effect:()=>1;randomPower=1e50;probabilizerTimerMs=0;
      for(let i=0;i<5;i++)advanceProbabilizer(1000,()=>.5);
      rows.push({w:logValue(randomPower),cp:logValue(abstractionProbabilizerCpMultiplier())});
    }
    return {rows,raw:probabilizerBaseParameters(),checkpoint:probabilizerRangeProgress,levels:probabilizerUpgradeLevels};
  `);
  assert.ok(r.rows[1].w-r.rows[0].w>2);assert.ok(r.rows[1].cp-r.rows[0].cp>1);
  assert.equal(r.raw.a,1e46);assert.equal(r.raw.b,1e46);assert.equal(r.raw.intervalMs,1000);assert.equal(r.levels.b,0);
});

test('26-2 bonuses grow with pre-purchase radius and awards remain integer, manual and holding-limit bounded',()=>{
  const rows=run(ready(),`
    abstractionResearchState['26-2']=true;return [20,180,1980,1e10,1e100].map(radius=>{
      singularityPoints=0;abstractionPermanentSingularities=0;totalSingularitiesPurchased=0;numberBlackHoleSchwarzschildRadius=()=>radius;
      const preview=singularityPointGain(),bonus=abstractionSingularityBonus(radius);const bought=purchaseSingularity();
      return {radius,preview:plain(preview),bonus:plain(bonus),bought,held:plain(singularityPoints),total:plain(totalSingularitiesPurchased)};
    });
  `);
  rows.forEach((r,i)=>{assert.ok(r.bought);assert.equal(r.preview,1+r.bonus);assert.equal(r.held,r.preview);assert.equal(r.total,r.preview);assert.ok(Number.isInteger(r.preview));if(i)assert.ok(r.preview>=rows[i-1].preview);});
  assert.equal(rows[0].preview,2);assert.equal(rows[3].preview,4);
});

test('near the holding limit only the actual awarded amount enters balance, lifetime total and permanent reserve',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['26-2']=true;singularityPoints=15;numberBlackHoleSchwarzschildRadius=()=>NumberMath.fromString('1e1000');
    const quote=plain(singularityPointGain());const bought=purchaseSingularity();
    return {quote,bought,held:plain(singularityPoints),bank:plain(abstractionPermanentSingularities),total:plain(totalSingularitiesPurchased),
      capped:plain(singularityPointGain()),again:purchaseSingularity()};
  `),{quote:1,bought:true,held:16,bank:16,total:1,capped:0,again:false});
});

test('no extra singularities are granted on research, ticks, save/load or failed purchases; inactive and KC5 preserve old rules',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['25-2']=true;singularityPoints=0;numberBlackHoleSchwarzschildRadius=()=>19;researchAbstraction('26-2');
    advanceNumberBlackHole(1000);const before=JSON.stringify(captureGameSaveData());
    const failed=!purchaseSingularity(),unchanged=before===JSON.stringify(captureGameSaveData());
    loadGame(before,{persistOverride:false,countAsLoad:false});const noGrant=plain(singularityPoints)===0;
    numberBlackHoleSchwarzschildRadius=()=>1e100;abstractionResearchState['26-2']=false;
    const oldQuote=plain(singularityPointGain());purchaseSingularity();
    abstractionResearchState['26-2']=true;activeKnuthChallengeId='kc5';
    return {failed,unchanged,noGrant,oldQuote,oldHeld:plain(singularityPoints),kc:plain(singularityPointGain()),blocked:!purchaseSingularity()};
  `),{failed:true,unchanged:true,noGrant:true,oldQuote:1,oldHeld:1,kc:0,blocked:true});
});

test('derived readouts, next-purchase previews and graph dots follow scaled endpoints without changing game state',()=>{
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  const r=run(ctx,`
    abstractionResearchState['26-1']=true;randomPower=1e50;
    const dot={title:'50000000',style:{}};probabilizerVisualDots.push(dot);
    const state=JSON.stringify(captureGameSaveData());renderProbabilizerBoard();
    const unchanged=state===JSON.stringify(captureGameSaveData()),left=parseFloat(dot.style.left);
    const aInfo=abstractionTimeResearchInfo('26-1');
    abstractionResearchState['26-2']=true;numberBlackHoleSchwarzschildRadius=()=>180;renderSingularityBoard();
    return {unchanged,left,aInfo,label:singularityPurchaseLabel.textContent,sInfo:abstractionTimeResearchInfo('26-2')};
  `);
  assert.ok(r.unchanged);close(r.left,(50e6-1e6)/(1e8-1e6)*100);assert.match(r.aInfo,/a·b ×1m/);
  assert.equal(r.label,'특이점 +3');assert.match(r.sInfo,/구매 시 \+3개/);
});
