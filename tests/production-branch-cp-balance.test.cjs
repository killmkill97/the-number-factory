const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx=game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.probabilizer=1;knuthBaseUpgradeLevels.number_black_hole=1;
    numberBlackHoleSystemEnabled=true;`);
  return ctx;
}
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance*Math.max(1,Math.abs(b)),a+' != '+b);

test('production CP curves use the calibrated constants, remain neutral at zero and grow beyond the reference',()=>{
  const r=run(ready(),`
    const rows=[];let radius=0;numberBlackHoleSchwarzschildRadius=()=>radius;
    abstractionResearchState['25-1']=true;abstractionResearchState['27-2']=true;
    for(const log of [0,3,6,12,50,100,1000]){
      randomPower=log?NumberMath.powerOfTen(log):0;radius=log?NumberMath.powerOfTen(log):0;
      rows.push({log,w:logValue(abstractionProbabilizerCpMultiplier()),r:logValue(abstractionBlackHoleCpMultiplier())});
    }
    return {rows,prob:ABSTRACTION_PRODUCTION_BRANCH_BALANCE.cpLogStrength,bh:ABSTRACTION_PRODUCTION_BRANCH_BALANCE.blackHoleCpLogStrength};
  `);
  assert.equal(r.prob,3885);assert.equal(r.bh,6177);assert.equal(r.rows[0].w,0);assert.equal(r.rows[0].r,0);
  r.rows.slice(1).forEach((row,index)=>{assert.ok(row.w>r.rows[index].w);assert.ok(row.r>r.rows[index].r);});
  close(r.rows.find(row=>row.log===50).w,3885);close(r.rows.find(row=>row.log===6).r,6177,1e-6);
});

test('black-hole CP is neutral when unresearched, stopped, locked, zero-radius or in KC5',()=>{
  assert.deepEqual(run(ready(),`
    numberBlackHoleSchwarzschildRadius=()=>1e6;
    const noResearch=plain(abstractionBlackHoleCpMultiplier());abstractionResearchState['27-2']=true;
    const boosted=compareNumberValues(abstractionBlackHoleCpMultiplier(),1)>0;
    numberBlackHoleSystemEnabled=false;const stopped=plain(abstractionBlackHoleCpMultiplier());
    numberBlackHoleSystemEnabled=true;knuthUnlocked=false;const locked=plain(abstractionBlackHoleCpMultiplier());
    knuthUnlocked=true;activeKnuthChallengeId='kc5';const challenged=plain(abstractionBlackHoleCpMultiplier());
    activeKnuthChallengeId=null;numberBlackHoleSchwarzschildRadius=()=>0;
    return {noResearch,boosted,stopped,locked,challenged,zero:plain(abstractionBlackHoleCpMultiplier())};
  `),{noResearch:1,boosted:true,stopped:1,locked:1,challenged:1,zero:1});
});

test('27-2 multiplies real CP before advanced powers and feeds passive CP and the existing CP-to-SP link',()=>{
  const r=run(ready(),`
    squarePoints=NumberMath.fromString('1e100');numberBlackHoleSchwarzschildRadius=()=>1e6;
    const before=squareConvergencePointGain();abstractionResearchState['27-2']=true;
    const boosted=squareConvergencePointGain(),factor=abstractionBlackHoleCpMultiplier();
    abstractionResearchState['23-1']=true;advanceAbstraction(1000);
    const passive=compareNumberValues(squareConvergencePoints,multiplyNumberValue(boosted,.01))===0;
    squareConvergencePoints=0;const paid=collectSquareConvergenceIfReady();
    squarePoints=NumberMath.fromString('1e100');knuthBaseUpgradeLevels.advanced_equipment=1;
    knuthAdvancedOwned.cp_power=2;knuthAdvancedEquipped.cp_power=2;
    abstractionResearchState['27-2']=false;const oldAdvanced=squareConvergencePointGain();
    abstractionResearchState['27-2']=true;const advanced=squareConvergencePointGain();
    abstractionResearchState['18-3']=true;const sp=knuthSpCpGainMultiplier('sp');
    const linked=compareNumberValues(sp,NumberMath.power(squareConvergenceGainMultiplier(),ABSTRACTION_MINI_BRANCH_BALANCE.spFromCpPower))===0;
    activeKnuthChallengeId='kc6';const neutral=squareConvergenceGainMultiplier()===1&&knuthSpCpGainMultiplier()===1;
    return {ratio:logValue(NumberMath.divideApproximate(boosted,before)),factor:logValue(factor),passive,
      paid:compareNumberValues(paid,boosted)===0,advanced:logValue(NumberMath.divideApproximate(advanced,oldAdvanced)),linked,neutral};
  `);
  close(r.ratio,r.factor);close(r.advanced,r.factor*1.03**2);
  assert.ok(r.passive&&r.paid&&r.linked&&r.neutral);
});

test('observed payout sensitivity reaches roughly e25k for either full path without a runtime target cap',()=>{
  const r=run(ready(),`
    // Rounded resource observations and the unmodified aggregate payout from the browser copy.
    const q=Math.pow(1.03,4),wLog=58.590909159497585,rLog=3.7884289474717474;
    const priorLog=20151.631086344292-q*60*Math.pow(wLog/50,.75);
    randomPower=NumberMath.powerOfTen(wLog);let radius=NumberMath.powerOfTen(rLog);
    numberBlackHoleSchwarzschildRadius=()=>radius;
    squarePoints=NumberMath.fromString('4.56e9.5e154');abstractionResearchState['17-2']=true;
    knuthBaseUpgradeLevels.advanced_equipment=1;knuthAdvancedOwned.cp_power=4;knuthAdvancedEquipped.cp_power=4;
    const plainBaseLog=logValue(squareConvergencePointGain())/q;
    const observedAggregate=NumberMath.powerOfTen(priorLog/q-plainBaseLog);
    abstractionCpGainMultiplier=()=>observedAggregate;
    const rows=[];
    for(const lane of [1,2]){
      for(const tier of [25,26,27])for(const side of [1,2])abstractionResearchState[tier+'-'+side]=side===lane;
      const reference=logValue(squareConvergencePointGain());
      if(lane===1)randomPower=NumberMath.powerOfTen(wLog+10);else radius=NumberMath.powerOfTen(rLog+1);
      const later=logValue(squareConvergencePointGain());
      randomPower=NumberMath.powerOfTen(wLog);radius=NumberMath.powerOfTen(rLog);
      rows.push({lane,reference,later});
    }
    return rows;
  `);
  for(const row of r){assert.ok(Math.abs(row.reference-25000)<2,JSON.stringify(row));assert.ok(row.later>row.reference+100,JSON.stringify(row));}
});

test('nested huge resources remain positive and ordered and never change resources merely by reading effects',()=>{
  const rows=run(ready(),`
    abstractionResearchState['25-1']=true;abstractionResearchState['27-2']=true;
    let radius=0;numberBlackHoleSchwarzschildRadius=()=>radius;
    return ['1e50','1e1e100','1e1e1e100'].map(text=>{
      randomPower=NumberMath.fromString(text);radius=NumberMath.fromString(text);
      const before=NumberMath.serialize(randomPower);const w=abstractionProbabilizerCpMultiplier(),r=abstractionBlackHoleCpMultiplier();
      return {positive:isPositiveNumberValue(w)&&isPositiveNumberValue(r),
        same:before===NumberMath.serialize(randomPower),valid:!/(NaN|Infinity|undefined)/.test(JSON.stringify([w,r]))};
    });
  `);
  rows.forEach(row=>assert.deepEqual(row,{positive:true,same:true,valid:true}));
});

test('both production paths retain their purchased records and derive the same CP after save/load',()=>{
  for(const lane of [1,2])assert.deepEqual(run(ready(),`
    for(const tier of [25,26,27])abstractionResearchState[tier+'-${lane}']=true;
    randomPower=NumberMath.fromString('1e58');squarePoints=NumberMath.fromString('1e1000');numberBlackHoleTotalInvested=NumberMath.fromString('1e10000');
    const before=NumberMath.serialize(squareConvergencePointGain());saveGame();const saved=localStorage.getItem(SAVE_KEY);
    loadAbstractionResearchState({});randomPower=0;numberBlackHoleTotalInvested=0;loadGame(saved,{countAsLoad:false});
    return {same:before===NumberMath.serialize(squareConvergencePointGain()),
      owned:[25,26,27].every(tier=>hasAbstractionResearch(tier+'-${lane}')),errors};
  `),{same:true,owned:true,errors:[]});
});

test('27-2 live card and formula graph expose radius CP without removing its original speed cap',()=>{
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/formula-help.js'),'utf8'));
  assert.deepEqual(run(ctx,`
    abstractionResearchState['27-2']=true;numberBlackHoleSchwarzschildRadius=()=>1e6;
    const text=abstractionTimeResearchInfo('27-2'),entry=FORMULA_HELP_DEFINITIONS['abstraction:27-2'];
    const chart=FORMULA_HELP_CHARTS['abstraction:27-2'];
    return {card:text.includes('CP ×')&&text.includes('상한 확장'),formula:entry.formula.includes('6177'),
      chart:chart.lines[0].evaluate(6),sameLimit:numberBlackHoleTimeLimit()===1e103};
  `),{card:true,formula:true,chart:6177,sameLimit:true});
});
