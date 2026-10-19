const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

test('four independent mini pairs cost 400 and remain exclusive despite both expansion upgrades', () => {
  const result = run(game(), `
    greatTheory=1600;knuthBaseUpgradeLevels.extra_branch=1;knuthEquippedUpgradeIds.add('second_branch_expansion');
    const rows=[];
    for(let i=0;i<4;i++){
      const a='18-'+(2*i+1),b='18-'+(2*i+2),parent='17-'+(i+1);
      const locked=!canResearchAbstraction(a)&&!canResearchAbstraction(b);
      abstractionResearchState[parent]=true;
      const available=canResearchAbstraction(a)&&canResearchAbstraction(b);
      const bought=researchAbstraction(a),blocked=!researchAbstraction(b);
      rows.push({locked,available,bought,blocked,cost:abstractionResearchPaidCosts[a]});
    }
    return {rows,left:plain(greatTheory)};
  `);
  assert.equal(result.left, 0);
  result.rows.forEach(row => assert.deepEqual(row, {locked:true, available:true, bought:true, blocked:true, cost:400}));
});

test('ancestor purchases and presets are atomic, and conflicting mini paths never spend currency', () => {
  assert.deepEqual(run(game(), `
    const plan=researchPurchasePlan('abstraction','18-8');greatTheory=subtractNumberValues(plan.cost,1);
    const poor=purchaseResearchWithParents('abstraction','18-8');
    const empty=ABSTRACTION_RESEARCHES.every(r=>!hasPurchasedAbstractionResearch(r.id));
    greatTheory=plan.cost;const bought=purchaseResearchWithParents('abstraction','18-8');
    const conflict=researchPurchasePlan('abstraction','18-7');
    saveAbstractionResearchPreset(0);const saved=abstractionResearchPresets[0].ids.slice();
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    const bad=editAbstractionResearchPreset(0,saved.concat('18-7').join(','));
    const invalid=Boolean(abstractionPresetPurchasePlan(0).error);
    const rejected=loadAbstractionResearchPreset(0);
    editAbstractionResearchPreset(0,saved.join(','));const loaded=loadAbstractionResearchPreset(0);
    return {poor,empty,bought,conflict,bad,invalid,rejected,loaded,left:plain(greatTheory),active:hasAbstractionResearch('18-8')};
  `), {poor:false,empty:true,bought:true,conflict:null,bad:true,invalid:true,rejected:false,loaded:true,left:0,active:true});
});

test('saved mini flags and paid costs survive actual save/load and Knuth, optional reset refunds all', () => {
  assert.deepEqual(run(game(), `
    greatTheory=1600;
    for(let i=1;i<=4;i++){abstractionResearchState['17-'+i]=true;researchAbstraction('18-'+(2*i));}
    saveGame();loadAbstractionResearchState({});loadGame();
    const restored=[2,4,6,8].every(i=>hasAbstractionResearch('18-'+i));
    const blocked=[1,3,5,7].every(i=>!canResearchAbstraction('18-'+i));
    const refund=abstractionResearchRefund();resetProgressForNewKnuthRun();
    const retained=[2,4,6,8].every(i=>hasAbstractionResearch('18-'+i));
    abstractionResetOnNextKnuthPoint=true;const before=greatTheory;applyAbstractionResetOnKnuthPoint();
    const returned=plain(subtractNumberValues(greatTheory,before));
    loadAbstractionResearchState({'17-1':true});
    return {restored,blocked,retained,refund,returned,legacy:[1,2,3,4,5,6,7,8].every(i=>!hasPurchasedAbstractionResearch('18-'+i))};
  `), {restored:true,blocked:true,retained:true,refund:2000,returned:2000,legacy:true});
});

test('held-count discount is continuous and immediate, and requirements still grow without accumulating discounts', () => {
  const r = run(game(), `
    abstractionResearchState['18-1']=true;const rows=[0,1,2,10].map(s=>{
      singularityPoints=s;return logValue(singularityRadiusRequirement());});
    singularityPoints=2;const first=NumberMath.serialize(singularityRadiusRequirement());
    for(let i=0;i<100;i++)singularityRadiusRequirement();
    const stable=NumberMath.compare(singularityRadiusRequirement(),first)===0;
    singularityPoints=1;const spent=logValue(singularityRadiusRequirement());
    singularityPoints=NumberMath.fromString('1e1e20');const huge=singularityRadiusRequirement();
    return {rows,stable,spent,huge:JSON.stringify(NumberMath.serialize(huge))};
  `);
  [0,1,2,10].forEach((s,i)=>close(r.rows[i],Math.log10(20)+.25*s));
  close(r.spent,r.rows[1]);assert.equal(r.stable,true);assert.doesNotMatch(r.huge,/NaN|Infinity|undefined/);
});

test('radius resonance strengthens exactly four basic singularity effects, excludes KP, and never recursively grows radius', () => {
  const r = run(game(), `
    singularityPoints=2;singularityUpgradeLevels.kp_gain=2;singularityUpgradeLevels.black_hole=1;
    numberBlackHoleUnboostedRadius=()=>50;
    const kp=NumberMath.serialize(singularityKpMultiplier());abstractionResearchState['18-2']=true;
    const rows=Array.from({length:100},()=>plain(numberBlackHoleSchwarzschildRadius()));
    return {power:plain(abstractionRadiusSingularityPower()),radius:rows[0],stable:rows.every(v=>v===rows[0]),
      time:plain(singularityBlackHoleMultiplier()),percent:plain(singularityPercentMultiplier()),
      cap:plain(singularitySoftcapMultiplier()),sameKp:NumberMath.compare(kp,singularityKpMultiplier())===0};
  `);
  close(r.power,1.075);close(r.radius,50*1.1**1.075);close(r.time,199**1.075*2);close(r.percent,199**1.075);
  close(r.cap,r.percent);assert.equal(r.stable,true);assert.equal(r.sameKp,true);
});

test('CP-linked SP uses all additional CP multipliers but not base CP, current SP, or the CP eligibility gate', () => {
  const r = run(game(), `
    knuthBaseUpgradeLevels.cp_gain=2;squareConvergenceUpgradeLevels.cp_gain_5x=3;
    squareConvergenceUpgradeState.cp_gain_5x=true;abstractionResearchState['12-2']=true;
    abstractionResearchState['18-3']=true;
    const before=knuthSpCpGainMultiplier(),cp=squareConvergenceGainMultiplier();
    squarePoints=NumberMath.fromString('1e1000000');abstractionResearchState['17-2']=true;
    const after=knuthSpCpGainMultiplier();
    abstractionResearchState['18-3']=false;const original=knuthSpCpGainMultiplier();
    return {cp:logValue(cp),sp:logValue(before)-logValue(original),same:NumberMath.compare(before,after)===0};
  `);
  close(r.cp,Math.log10(625*125*50));close(r.sp,r.cp*.5);assert.equal(r.same,true);
});

test('radius to CP affects actual awards, is neutral at empty/disabled black hole, and is monotonic', () => {
  const r = run(game(), `
    generalizationResearchState['2-2']=true;squarePoints=NumberMath.fromString('1e10000');
    const off=squareConvergencePointGain();abstractionResearchState['18-4']=true;
    numberBlackHoleSchwarzschildRadius=()=>50;
    const boosted=squareConvergencePointGain();const awarded=collectSquareConvergenceIfReady();
    numberBlackHoleSchwarzschildRadius=()=>0;const zero=plain(abstractionRadiusCpMultiplier());
    numberBlackHoleSchwarzschildRadius=()=>100;const high=logValue(abstractionRadiusCpMultiplier());
    activeKnuthChallengeId='kc5';const kc5=plain(abstractionRadiusCpMultiplier());
    return {boost:logValue(boosted)-logValue(off),paid:NumberMath.compare(awarded,boosted)===0,zero,high,kc5};
  `);
  close(r.boost,30);assert.equal(r.paid,true);assert.equal(r.zero,1);assert.ok(r.high>30);assert.equal(r.kc5,1);
});

test('Dyson and n resonance affect only the singularity time component, retain its safety cap, and keep KP untouched', () => {
  for(const id of ['18-5','18-8']){
    const r=run(game(), `
      singularityPoints=2;singularityUpgradeLevels.kp_gain=2;
      squareBreakthroughLevels.dyson_swarm=16;divergerN=NumberMath.fromString('1e26');
      numberBlackHoleTotalInvested=NumberMath.fromString('1e100000');
      const before=[singularityRadiusMultiplier(),singularityPercentMultiplier(),singularitySoftcapMultiplier(),singularityKpMultiplier()].map(NumberMath.serialize);
      const off=numberBlackHoleTimeMultiplier();abstractionResearchState['${id}']=true;
      const after=[singularityRadiusMultiplier(),singularityPercentMultiplier(),singularitySoftcapMultiplier(),singularityKpMultiplier()].map(NumberMath.serialize);
      const power=plain(abstractionBlackHoleSingularityPower()),boosted=numberBlackHoleTimeMultiplier();
      singularityPoints=NumberMath.fromString('1e1e20');
      return {same:JSON.stringify(before)===JSON.stringify(after),power,ratio:boosted/off,cap:numberBlackHoleTimeMultiplier()};
    `);
    assert.equal(r.same,true);close(r.power,1.075);close(r.ratio,199**.075);assert.equal(r.cap,1e100);
  }
});

test('Dyson power applies after existing effect and remains neutral at no swarms and in KC1', () => {
  const r=run(game(), `
    squareBreakthroughLevels.dyson_swarm=16;const before=dysonEffectMultiplier();
    abstractionResearchState['18-6']=true;const after=dysonEffectMultiplier();
    activeKnuthChallengeId='kc1';const kc1=plain(dysonEffectMultiplier());
    activeKnuthChallengeId=null;squareBreakthroughLevels.dyson_swarm=0;
    return {before:logValue(before),after:logValue(after),kc1,empty:plain(dysonEffectMultiplier())};
  `);
  close(r.after,r.before*1.005);assert.equal(r.kc1,1);assert.equal(r.empty,1);
});

test('b resonance strengthens a and current D immediately, without modifying saved a/b/n or changing n timing', () => {
  const r=run(game(), `
    generalizationResearchState['3-2']=true;generalizationResearchState['5-3']=true;
    divergerA=NumberMath.fromString('1e153');divergerB=800;divergerC=2;
    divergerN=2;divergerPower=divergerProductionValue();const off=logValue(divergerPower);
    abstractionResearchState['17-4']=true;greatTheory=400;
    const bought=researchAbstraction('18-7');const after=logValue(divergerPower);
    return {bought,after,off,effective:logValue(abstractionEffectiveDivergerA()),
      a:logValue(divergerA),b:divergerB,n:plain(divergerN),current:NumberMath.compare(divergerPower,divergerProductionValue())===0};
  `);
  assert.equal(r.bought,true);close(r.effective,153*1.125);close(r.after-r.off,2*153*.125);
  assert.equal(r.a,153);assert.equal(r.b,800);assert.equal(r.n,2);assert.equal(r.current,true);
});

test('large mini-branch inputs remain finite serialized layered values with no zero wraparound', () => {
  const r=run(game(), `
    for(let i=1;i<=8;i++)abstractionResearchState['18-'+i]=true;
    singularityPoints=NumberMath.fromString('1e1e20');divergerA=NumberMath.fromString('1e1e20');
    divergerB=1e200;divergerN=NumberMath.fromString('1e1e20');numberBlackHoleTotalInvested=NumberMath.fromString('1e1e20');
    squareBreakthroughLevels.dyson_swarm=100;knuthBaseUpgradeLevels.cp_gain=10000;
    const values=[singularityRadiusRequirement(),numberBlackHoleSchwarzschildRadius(),singularityBlackHoleMultiplier(),
      singularityPercentMultiplier(),singularitySoftcapMultiplier(),abstractionEffectiveDivergerA(),knuthSpCpGainMultiplier()];
    return {positive:values.every(isPositiveNumberValue),text:JSON.stringify(values.map(NumberMath.serialize)),errors};
  `);
  assert.equal(r.positive,true);assert.doesNotMatch(r.text,/NaN|Infinity|undefined/);assert.deepEqual(r.errors,[]);
});

test('production and time choices have comparable final gains in the representative five-second fixture', () => {
  function sample(id){return run(game(), `
    percentUnlocked=true;for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    for(const u of SQUARE_UPGRADES)squareUpgradeState[u.id]=true;
    for(const id of ['4-2','6-2','8-2','10-1','14-2','16-1','17-1','17-2','17-3','17-4'])abstractionResearchState[id]=true;
    singularityPoints=2;knuthPoints=1.83e9;divergerA=NumberMath.fromString('8.38e152');divergerB=90.6;divergerC=99;
    divergerN=NumberMath.fromString('2.75e26');divergerInterval=100;
    squareBreakthroughLevels.dyson_swarm=16;squareBreakthroughLevels.overclock=60;squareBreakthroughLevels.bottleneck_tracker=16;
    numberBlackHoleUnboostedRadius=()=>50;const oldTime=numberBlackHoleTimeMultiplier();
    knuthEquippedUpgradeIds.add('percent_softcap_square');gameTick=ms=>ms*1.9e21*numberBlackHoleTimeMultiplier()/oldTime;
    if('${id}')abstractionResearchState['${id}']=true;
    divergerPower=divergerProductionValue();advanceDiverger(5000);
    const gain=percentFinalUseGain(NumberMath.fromString('1e5940000000'),147000);
    return {number:logValue(gain),sp:logValue(squarePointGainForValue(gain))};
  `);}
  const before=sample(''), deltas=[];
  for(const id of ['18-2','18-5','18-6','18-7','18-8']){
    const after=sample(id),delta=after.sp-before.sp;deltas.push(delta);
    assert.ok(delta>5000&&delta<20000,JSON.stringify({id,before,after}));
    assert.ok(after.number-before.number>10e6);
  }
  assert.ok(Math.max(...deltas)/Math.min(...deltas)<1.4);
});

test('late tree rows form the requested symmetric 1-2-4-8 fan and do not overlap', () => {
  const r=run(game(), `
    const groups=[['15-1'],['16-1','16-2'],['17-1','17-2','17-3','17-4'],Array.from({length:8},(_,i)=>'18-'+(i+1))];
    return groups.map(ids=>ids.map(id=>{const r=ABSTRACTION_RESEARCHES.find(r=>r.id===id);return {id,column:r.column,row:r.row,parents:r.parents};}));
  `);
  for(let g=0;g<3;g++)for(let i=0;i<r[g].length;i++){
    close(r[g][i].row,(r[g+1][2*i].row+r[g+1][2*i+1].row)/2);
    assert.equal(r[g+1][2*i].parents.includes(r[g][i].id),true);
    assert.equal(r[g+1][2*i+1].parents.includes(r[g][i].id),true);
  }
  for(const group of r)for(let i=1;i<group.length;i++)assert.ok(group[i].row-group[i-1].row>=1);
});

test('console force purchase/cancel works on every new ID and force a-resonance updates current D', () => {
  const ctx=game();const source=fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8');
  ctx.loadSource(source.slice(0,source.indexOf('function handleDivergerDevUndo')));
  const r=run(ctx, `
    generalizationResearchState['3-2']=true;divergerA=NumberMath.fromString('1e153');divergerB=800;
    const off=divergerProductionValue();let refreshed=false,restored=false;
    const rows=Array.from({length:8},(_,i)=>{
      const id='18-'+(i+1),bought=forceUnlockDevUpgrade('abstraction',id);
      if(id==='18-7')refreshed=compareNumberValues(divergerPower,off)>0;
      const removed=removeDevUpgrade('abstraction',id);
      if(id==='18-7')restored=NumberMath.compare(divergerPower,off)===0;
      return bought&&removed&&!hasPurchasedAbstractionResearch(id);
    });return {rows,refreshed,restored};
  `);
  assert.ok(r.rows.every(Boolean));assert.equal(r.refreshed,true);assert.equal(r.restored,true);
});
