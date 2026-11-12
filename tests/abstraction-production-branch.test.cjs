const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready(sessionOptions=null) {
  const ctx=game(true,sessionOptions);
  ctx.loadSource(`knuthBaseUpgradeLevels.late_abstraction=1;knuthBaseUpgradeLevels.probabilizer=1;
    abstractionResearchState['24-1']=true;greatTheory=100000;`);
  return ctx;
}
const close=(actual,expected,tolerance=1e-8)=>assert.ok(Math.abs(actual-expected)<=tolerance*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);

test('two independent exclusive paths start at 24-1 and cost 400, 1200 and 2500',()=>{
  for(const lane of [1,2]){
    const rows=run(ready(),`
      knuthBaseUpgradeLevels.extra_branch=1;abstractionResearchState['22-1']=true;
      knuthEquippedUpgradeIds.add('second_branch_expansion');const rows=[];
      for(let tier=25;tier<=27;tier++){
        const id=tier+'-${lane}',r=abstractionResearchDefinitions.get(id);
        greatTheory=r.greatTheoryCost-1;const poor=!researchAbstraction(id);greatTheory=r.greatTheoryCost;
        rows.push({id,parent:r.parents,group:r.branchGroup,cost:r.greatTheoryCost,poor,bought:researchAbstraction(id),
          blocked:!researchAbstraction(tier+'-${3-lane}'),left:plain(greatTheory)});
      }return rows;
    `);
    rows.forEach((r,i)=>assert.deepEqual(r,{id:`${25+i}-${lane}`,parent:[i?`${24+i}-${lane}`:'24-1'],group:8,
      cost:[400,1200,2500][i],poor:true,bought:true,blocked:true,left:0}));
  }
});

test('late unlock and missing normal parent prevent purchases, and ancestor transactions are atomic',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['24-1']=false;const noParent=!researchAbstraction('25-1');
    abstractionResearchState['24-1']=true;knuthBaseUpgradeLevels.late_abstraction=0;
    const locked=!researchAbstraction('25-1');knuthBaseUpgradeLevels.late_abstraction=1;
    const plan=researchPurchasePlan('abstraction','27-2');greatTheory=plan.cost-1;
    const poor=!purchaseResearchWithParents('abstraction','27-2'),empty=!hasAbstractionResearch('25-2');
    greatTheory=plan.cost;const bought=purchaseResearchWithParents('abstraction','27-2');
    return {noParent,locked,ids:plan.ids,cost:plan.cost,poor,empty,bought,left:plain(greatTheory),other:researchPurchasePlan('abstraction','27-1')};
  `),{noParent:true,locked:true,ids:['25-2','26-2','27-2'],cost:4100,poor:true,empty:true,bought:true,left:0,other:null});
});

test('preset validation rejects both paths and every preset ID remains serializable',()=>{
  assert.deepEqual(run(ready(),`
    const allowed=new Set(['time','expansion','passive','singularity_discount','cp_sp_link','dyson_singularity','b_to_a','singularity_softcap']);
    randomPower=1e50;loadAbstractionResearchState({});
    const ids=ABSTRACTION_RESEARCHES.filter(r=>r.column<=24&&(!r.branch||allowed.has(r.branch))).map(r=>r.id);
    ids.push('25-2','26-2','27-2');editAbstractionResearchPreset(0,ids.join(','));
    const plan=abstractionPresetPurchasePlan(0);greatTheory=plan.cost;const bought=loadAbstractionResearchPreset(0);
    const saved=abstractionResearchPresets[0].ids.join(',');editAbstractionResearchPreset(0,ids.concat('25-1').join(','));
    const conflict=Boolean(abstractionPresetPurchasePlan(0).error);
    return {valid:!plan.error,bought,complete:['25-2','26-2','27-2'].every(hasAbstractionResearch),saved:saved.includes('27-2'),conflict};
  `),{valid:true,bought:true,complete:true,saved:true,conflict:true});
});

test('25-1 multiplies actual and passive CP and retains existing advanced CP ordering',()=>{
  const r=run(ready(),`
    randomPower=1e50;squarePoints=NumberMath.fromString('1e100');const base=squareConvergencePointGain();
    researchAbstraction('25-1');const m=abstractionProbabilizerCpMultiplier(),boost=squareConvergencePointGain();
    abstractionResearchState['23-1']=true;advanceAbstraction(1000);const passive=squareConvergencePoints;
    squareConvergencePoints=0;const collected=collectSquareConvergenceIfReady();
    squarePoints=NumberMath.fromString('1e100');knuthBaseUpgradeLevels.advanced_equipment=1;knuthAdvancedEquipped.cp_power=2;
    abstractionResearchState['25-1']=false;const before=squareConvergencePointGain();abstractionResearchState['25-1']=true;
    const advanced=squareConvergencePointGain();activeKnuthChallengeId='kc5';const disabled=plain(abstractionProbabilizerCpMultiplier());
    return {log:logValue(m),ratio:logValue(NumberMath.divideApproximate(boost,base)),
      passive:plain(NumberMath.divideApproximate(passive,boost)),collected:compareNumberValues(collected,boost)===0,
      advancedLog:logValue(NumberMath.divideApproximate(advanced,before)),disabled,w:logValue(randomPower)};
  `);
  close(r.log,3885);close(r.ratio,3885);close(r.passive,.01);assert.ok(r.collected);close(r.advancedLog,3885*1.03**2);assert.equal(r.disabled,1);close(r.w,50);
});

test('26-1 scales the draw range and triangular peak without changing purchased upgrade counts',()=>{
  const r=run(ready(),`
    const original=probabilizerParameters();abstractionResearchState['26-1']=true;
    const modes=['0','1e10','1e50','1e200','1e1e100'].map(text=>{randomPower=NumberMath.fromString(text);return probabilizerParameters().mode;});
    randomPower=1e50;const p=probabilizerParameters(),draw=rollProbabilizer(()=>.5);
    let mean=0;for(let i=0;i<10000;i++)mean+=rollProbabilizer(()=>(i+.5)/10000,p)/10000;
    probabilizerUpgradeLevels.shift=10;const shifted=probabilizerParameters();
    abstractionResearchState['21-1']=true;probabilizerRangeProgress={a:1,b:1e308,aLevel:0,bLevel:0};
    const huge=probabilizerParameters(),roll=rollProbabilizer(()=>.99,huge);
    return {original,modes,p,draw,mean,shifted,level:probabilizerUpgradeLevels.shift,huge:Number.isFinite(huge.mode)&&Number.isFinite(roll)&&roll>=huge.a&&roll<=huge.b};
  `);
  close(r.original.mode,50.5);assert.equal(r.modes[0],r.original.mode);
  r.modes.forEach((m,i)=>{assert.ok(m<=Number.MAX_SAFE_INTEGER);if(i)assert.ok(m>r.modes[i-1]);});
  close(r.p.a,1e6);close(r.p.b,1e8);close(r.p.mode,75.25e6);assert.ok(r.draw>50e6);close(r.mean,(1e6+1e8+75.25e6)/3,.001);
  close(r.shifted.mode,80.25e6);assert.equal(r.level,10);assert.ok(r.huge);
});

test('27-1 uses only black-hole time, preserves the base interval and uses bounded bulk sampling',()=>{
  const r=run(ready(),`
    numberBlackHoleTimeMultiplier=()=>1e100;gameTick=()=>1e200;const baseInterval=probabilizerParameters().intervalMs;
    const normal=advanceProbabilizer(1000,()=>.5);randomPower=0;probabilizerTimerMs=0;
    abstractionResearchState['27-1']=true;const speed=abstractionProbabilizerTimeMultiplier();let calls=0;
    const count=advanceProbabilizer(1000,()=>{calls++;return .5;});const gain=randomPower;
    const same=probabilizerParameters().intervalMs===baseInterval;
    probabilizerPowerUpgradeLevels.interval_floor=1074;probabilizerUpgradeLevels.speed=100000;
    probabilizerTimerMs=0;calls=0;const huge=advanceProbabilizer(Number.MAX_VALUE,()=>{calls++;return .5;});
    return {normal,speed,count,gain:plain(gain),same,calls,valid:isPositiveNumberValue(huge)&&isPositiveNumberValue(randomPower),timer:Number.isFinite(probabilizerTimerMs)};
  `);
  assert.equal(r.normal,1);close(r.speed,100);assert.equal(r.count,100);close(r.gain,5100);assert.ok(r.same&&r.valid&&r.timer);assert.ok(r.calls<=14);
});

test('27-1 is neutral when the real black hole is disabled and cannot accelerate its donation clock',()=>{
  const r=run(ready(),`
    abstractionResearchState['27-1']=true;numberBlackHoleSystemEnabled=false;
    const off=abstractionProbabilizerTimeMultiplier();numberBlackHoleSystemEnabled=true;
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1e100');setBaseNumber(1000);
    const on=abstractionProbabilizerTimeMultiplier();advanceProbabilizer(1000,()=>.5);advanceNumberBlackHole(1000);
    return {off,on,remaining:plain(getBaseNumber()),donated:plain(numberBlackHoleTotalInvested)>0};
  `);
  assert.equal(r.off,1);assert.ok(r.on>1);close(r.remaining,990);assert.ok(r.donated);
});

test('25-2 bulk and sequential number/SP donations retain the exact source balance and count every cycle',()=>{
  for(const resource of ['number','sp'])for(const percent of [1,50,100]){
    const r=run(ready(),`
      abstractionResearchState['25-2']=true;abstractionResearchState['15-1']=true;
      numberBlackHoleDonationResource='${resource}';numberBlackHoleDonationPercent=${percent};squarePoints=1000;setBaseNumber(1000);
      applyNumberBlackHoleDonations(1000);const bulk=numberBlackHoleTotalInvested,sp=numberBlackHoleTotalSpInvested,count=numberBlackHoleSpDonationCount;
      numberBlackHoleTotalInvested=0;numberBlackHoleTotalSpInvested=0;numberBlackHoleSpDonationCount=0;
      for(let i=0;i<1000;i++)applyNumberBlackHoleDonations(1);
      const serial='${resource}'==='sp'?numberBlackHoleTotalSpInvested:numberBlackHoleTotalInvested;
      const total='${resource}'==='sp'?sp:bulk;applyNumberBlackHoleDonations(1e12);
      return {amount:plain(total),same:compareNumberValues(serial,total)===0,count:plain(count),n:plain(getBaseNumber()),sp:plain(squarePoints),large:isPositiveNumberValue(serial)};
    `);
    close(r.amount,1000*percent/100*1000);assert.ok(r.same&&r.large);assert.equal(r.count,resource==='sp'?1000:0);assert.equal(r.n,1000);assert.equal(r.sp,1000);
  }
});

test('no-consumption still needs a positive source, respects SP unlock/KC5 and restores legacy consumption when removed',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['25-2']=true;setBaseNumber(0);const empty=!applyNumberBlackHoleDonations(10);
    numberBlackHoleDonationResource='sp';squarePoints=1000;const locked=numberBlackHoleActiveResource()==='number';
    setBaseNumber(1000);activeKnuthChallengeId='kc5';const disabled=!applyNumberBlackHoleDonations(10);
    activeKnuthChallengeId=null;abstractionResearchState['25-2']=false;applyNumberBlackHoleDonations(1);
    return {empty,locked,disabled,n:plain(getBaseNumber()),sp:plain(squarePoints),invested:plain(numberBlackHoleTotalInvested)};
  `),{empty:true,locked:true,disabled:true,n:990,sp:1000,invested:10});
});

test('26-2 records only held singularities, never shrinks records and protects spendable holdings at the floor',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['25-2']=true;singularityPoints=4;let radius=180;numberBlackHoleSchwarzschildRadius=()=>radius;
    researchAbstraction('26-2');const initial=plain(abstractionPermanentSingularities),capacity=plain(abstractionSingularityStorageCapacity());
    const one=buySingularityUpgrade('black_hole'),four=buySingularityUpgrade('black_hole'),blocked=!buySingularityUpgrade('black_hole');
    radius=1980;recordAbstractionPermanentSingularities();const noCreation=plain(abstractionPermanentSingularities);
    singularityPoints=10;advanceNumberBlackHole(1);const raised=plain(abstractionPermanentSingularities);
    radius=0;setSingularityPoints(0);recordAbstractionPermanentSingularities();
    return {initial,capacity,one,four,blocked,noCreation,raised,held:plain(singularityPoints),record:plain(abstractionPermanentSingularities)};
  `),{initial:4,capacity:4,one:true,four:true,blocked:true,noCreation:4,raised:8,held:8,record:8});
});

test('singularity purchase records the pre-collapse radius and preserves the reserve while resetting all black-hole progression',()=>{
  const r=run(ready(),`
    abstractionResearchState['26-2']=true;singularityPoints=3;numberBlackHoleTotalInvested=1e100;
    numberBlackHoleSchwarzschildRadius=()=>1e10;const bought=purchaseSingularity();
    const bank=abstractionPermanentSingularities;setSingularityPoints(0);
    return {bought,bank:plain(bank),held:plain(singularityPoints),mass:plain(numberBlackHoleTotalInvested),timer:numberBlackHoleDonationTimerMs};
  `);
  assert.deepEqual(r,{bought:true,bank:7,held:7,mass:0,timer:0});
});

test('reserve persists through all Knuth challenge resets, research refund, inactive spending and re-research',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['25-2']=true;singularityPoints=4;numberBlackHoleSchwarzschildRadius=()=>180;researchAbstraction('26-2');
    beginKnuthPrestige();const prestige=plain(abstractionPermanentSingularities);
    startKnuthChallenge('kc1');abandonKnuthChallenge();const challenge=plain(abstractionPermanentSingularities);
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    setSingularityPoints(4);buySingularityUpgrade('black_hole');const off=plain(singularityPoints),saved=plain(abstractionPermanentSingularities);
    abstractionResearchState['25-2']=true;greatTheory=1200;const bought=researchAbstraction('26-2');
    return {prestige,challenge,off,saved,bought,restored:plain(singularityPoints)};
  `),{prestige:4,challenge:4,off:3,saved:4,bought:true,restored:4});
});

test('save/load retains hidden reserve while inactive, restores only when owned and sanitizes old or malformed fields',()=>{
  assert.deepEqual(run(ready(),`
    abstractionResearchState['26-2']=true;abstractionPermanentSingularities=4;singularityPoints=0;numberBlackHoleTotalInvested=0;
    const saved=captureGameSaveData();const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=plain(singularityPoints);saved.abstractionResearchState['26-2']=false;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});const inactive=plain(singularityPoints),bank=plain(abstractionPermanentSingularities);
    delete saved.abstractionPermanentSingularities;loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const old=plain(abstractionPermanentSingularities);saved.abstractionPermanentSingularities='-100';
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,restored,inactive,bank,old,invalid:plain(abstractionPermanentSingularities),errors};
  `),{loaded:true,restored:4,inactive:0,bank:4,old:0,invalid:0,errors:[]});
});

test('27-2 expands the existing cap, including without a probabilizer, but retains technical headroom and KC5',()=>{
  const r=run(ready(),`
    randomPower=1e50;const before=numberBlackHoleTimeLimit();abstractionResearchState['27-2']=true;
    const after=numberBlackHoleTimeLimit();knuthBaseUpgradeLevels.probabilizer=0;const alone=numberBlackHoleTimeLimit();
    knuthBaseUpgradeLevels.probabilizer=1;randomPower=NumberMath.fromString('1e1e1e100');
    const huge=numberBlackHoleTimeLimit();activeKnuthChallengeId='kc5';return {ratio:after/before,alone,
      finite:Number.isFinite(huge)&&huge<=Number.MAX_VALUE/1e12,disabled:numberBlackHoleTimeMultiplier()};
  `);
  close(r.ratio,1000);close(r.alone,1e103);assert.ok(r.finite);assert.equal(r.disabled,1);
});

test('console force buy/cancel restores or disables protection and live cards expose current effects',()=>{
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8'));
  assert.deepEqual(run(ctx,`
    abstractionPermanentSingularities=4;singularityPoints=0;
    const bought=forceUnlockDevUpgrade('abstraction','26-2'),held=plain(singularityPoints);
    const info=abstractionTimeResearchInfo('26-2');renderSingularityBoard();const board=singularityReserveStatus.textContent;
    removeDevUpgrade('abstraction','26-2');setSingularityPoints(0);renderSingularityBoard();
    return {bought,held,info:info.includes('4'),board:board.includes('보호 중'),off:plain(singularityPoints),bank:plain(abstractionPermanentSingularities),hidden:abstractionTimeResearchInfo('26-2')===''};
  `),{bought:true,held:4,info:true,board:true,off:0,bank:4,hidden:true});
});

test('probabilizer board plots the actual shifted mode and previews the same next mode as a real upgrade',()=>{
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
  const r=run(ctx,`
    abstractionResearchState['26-1']=true;abstractionResearchState['27-1']=true;randomPower=1e50;knuthPoints=NumberMath.fromString('1e1000');
    numberBlackHoleTimeMultiplier=()=>1e100;renderProbabilizerBoard();
    const control=probabilizerUpgradeControls.find(c=>c.id==='shift'),text=control.label.textContent;
    const next=probabilizerParameters({...probabilizerUpgradeLevels,shift:1}).mode;
    buyProbabilizerUpgrade('shift');renderProbabilizerBoard();
    return {text,next,actual:probabilizerParameters().mode,shown:probabilizerModeValue.textContent,time:probabilizerIntervalValue.textContent};
  `);
  assert.match(r.text,/75\.3m → 75\.8m/);close(r.next,r.actual);close(r.actual,75.75e6);assert.equal(r.shown,'75.8m');assert.match(r.time,/생산 시간 ×100/);
});

test('coarse and precise offline replay include accelerated draws and non-consuming donations without duplicate rewards',async()=>{
  for(const accuracy of [1,1000])for(const lane of [1,2]){
    const ctx=ready({storage:[['numberTycoonSessionPreferences_v1',JSON.stringify({offlineAccuracy:accuracy})]]});
    ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/probabilizer.js'),'utf8'));
    ctx.loadSource(`
      abstractionResearchState['${lane===1?'27-1':'25-2'}']=true;
      probabilizerRangeProgress={a:100,b:100,aLevel:0,bLevel:0};
      numberBlackHoleTimeMultiplier=()=>1e100;setBaseNumber(1000);
      render=()=>window.numberTycoonSession.requestMaintenance();window.numberTycoonSession.initialize();
      window.numberTycoonSession.enter();`);
    ctx.advance(2000);assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),true);
    const r=run(ctx,'return {w:plain(randomPower),n:plain(getBaseNumber()),mass:plain(numberBlackHoleTotalInvested),errors};');
    close(r.w,lane===1?20000:200);close(r.n,lane===2?1000:980.1);close(r.mass,lane===2?20:19.9);
    assert.deepEqual(r.errors,[]);assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),false);
    close(run(ctx,'return plain(randomPower);'),r.w);
  }
});

test('failed preset purchases roll back restored singularities and new permanent records along with research and currency',()=>{
  assert.deepEqual(run(ready(),`
    const allowed=new Set(['time','expansion','passive','singularity_discount','cp_sp_link','dyson_singularity','b_to_a','singularity_softcap']);
    loadAbstractionResearchState({});randomPower=1e50;singularityPoints=0;abstractionPermanentSingularities=4;
    const ids=ABSTRACTION_RESEARCHES.filter(r=>r.column<=24&&(!r.branch||allowed.has(r.branch))).map(r=>r.id);
    ids.push('25-2','26-2','27-2');editAbstractionResearchPreset(0,ids.join(','));
    const plan=abstractionPresetPurchasePlan(0);greatTheory=plan.cost;
    const purchase=researchAbstraction;researchAbstraction=(id,options)=>id==='27-2'?false:purchase(id,options);
    const blocked=!loadAbstractionResearchPreset(0);
    return {blocked,left:plain(greatTheory)===plan.cost,held:plain(singularityPoints),bank:plain(abstractionPermanentSingularities),empty:ABSTRACTION_RESEARCHES.every(r=>!hasAbstractionResearch(r.id))};
  `),{blocked:true,left:true,held:0,bank:4,empty:true});
});
