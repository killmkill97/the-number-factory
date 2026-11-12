const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');
const close = (a,b) => assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

function ready(options=null) {
  const ctx=game(true,options);
  ctx.loadSource('knuthBaseUpgradeLevels.space_expansion=1;');
  return ctx;
}

test('SM prices start at 64g/32g/64g, compound independently and spend mass rather than other currencies', () => {
  const rows=run(ready(), `
    stagnantMassMg=1e9;recordStagnantSingularities();knuthPoints=123;squarePoints=456;squareConvergencePoints=789;
    const rows=SPACE_EXPANSION_UPGRADES.map(u=>{
      const initial=plain(spaceExpansionUpgradeCost(u.id)),before=plain(stagnantMassMg);
      const bought=buySpaceExpansionUpgrade(u.id),after=plain(stagnantMassMg);
      return {id:u.id,initial,bought,spent:before-after,next:plain(spaceExpansionUpgradeCost(u.id)),
        effect:plain(spaceExpansionUpgradeMultiplier(u.id)),level:plain(spaceExpansionUpgradeLevels[u.id])};
    });return {rows,kp:plain(knuthPoints),sp:plain(squarePoints),cp:plain(squareConvergencePoints),h:plain(higgsParticles)};
  `);
  assert.deepEqual(rows,{rows:[
    {id:'higgs_gain',initial:64000,bought:true,spent:64000,next:576000,effect:3,level:1},
    {id:'mass_gain',initial:32000,bought:true,spent:32000,next:800000,effect:5,level:1},
    {id:'mass_effect',initial:64000,bought:true,spent:64000,next:2048000,effect:2,level:1}
  ],kp:123,sp:456,cp:789,h:0});
});

test('locked, invalid and unaffordable purchases are rejected and an exact balance can be spent to zero', () => {
  assert.deepEqual(run(ready(), `
    stagnantMassMg=64000;recordStagnantSingularities();knuthBaseUpgradeLevels.space_expansion=0;
    const locked=!buySpaceExpansionUpgrade('higgs_gain');knuthBaseUpgradeLevels.space_expansion=1;
    const invalid=!buySpaceExpansionUpgrade('no-such-upgrade');stagnantMassMg=63999;recordStagnantSingularities();
    const poor=!buySpaceExpansionUpgrade('higgs_gain');stagnantMassMg=64000;recordStagnantSingularities();
    const exact=buySpaceExpansionUpgrade('higgs_gain');
    return {locked,invalid,poor,exact,mass:plain(stagnantMassMg),level:plain(spaceExpansionUpgradeLevels.higgs_gain)};
  `),{locked:true,invalid:true,poor:true,exact:true,mass:0,level:1});
});

test('repeated Higgs upgrades boost only future integer exit rewards and retain maximum-record semantics', () => {
  assert.deepEqual(run(ready(), `
    higgsParticles=5;stagnantMassMg=1e9;recordStagnantSingularities();buySpaceExpansionUpgrade('higgs_gain');buySpaceExpansionUpgrade('higgs_gain');
    const old=plain(higgsParticles),small=plain(spaceExpansionHiggsReward(NumberMath.fromString('1e9')));
    const rows=[];for(const cp of ['1e100','1e100','1e10']){
      toggleSpaceExpansion();squareConvergencePoints=NumberMath.fromString(cp);toggleSpaceExpansion();
      rows.push(plain(higgsParticles));
    }return {old,small,rows,level:plain(spaceExpansionUpgradeLevels.higgs_gain)};
  `),{old:5,small:6,rows:[9000,9000,9000],level:2});
});

test('mass purchase settles elapsed production at the old rate and applies x5 only from the purchase forward', () => {
  const ctx=ready();ctx.loadSource('higgsParticles=10;stagnantMassMg=32000;recordStagnantSingularities();resetSpaceExpansionClock();');
  ctx.advance(1000);
  assert.deepEqual(run(ctx, `const bought=buySpaceExpansionUpgrade('mass_gain');
    return {bought,mass:plain(stagnantMassMg),rate:plain(stagnantMassGainPerRealSecond())};`),{bought:true,mass:10,rate:50});
  ctx.advance(1000);
  assert.equal(run(ctx,'tickSpaceExpansion();return plain(stagnantMassMg);'),60);
  ctx.loadSource('gameTick=()=>1e100;spaceExpansionUpgradeLevels.mass_gain=2;');
  ctx.advance(2000);
  assert.equal(run(ctx,'tickSpaceExpansion();return plain(stagnantMassMg);'),560);
});

test('mass effects multiply final radius/random/28-1 factors, not their exponents or production rewards', () => {
  const r=run(ready(), `
    stagnantMassMg=60000;recordStagnantSingularities();higgsParticles=5;abstractionResearchState['28-1']=true;
    knuthBaseUpgradeLevels.stagnant_mass_gain=2;
    const values=()=>[stagnantMassRadiusMultiplier(),stagnantMassRandomMultiplier(),
      abstractionMassSingularityLimitMultiplier(),abstractionMassTimeLimitMultiplier()];
    const before=values();spaceExpansionUpgradeLevels.mass_effect=3;const after=values();
    const ratios=after.map((v,i)=>plain(NumberMath.divideApproximate(v,before[i])));
    const cap=plain(singularityHoldingLimit()),rate=plain(stagnantMassGainPerRealSecond());
    const reward=plain(spaceExpansionHiggsReward(NumberMath.fromString('1e100')));
    spaceExpansionActive=true;const same=values().every((v,i)=>compareNumberValues(v,after[i])===0);
    activeKnuthChallengeId='kc5';const kc5=plain(stagnantMassRadiusMultiplier());activeKnuthChallengeId=null;
    abstractionResearchState['28-1']=false;const unresearched=[abstractionMassSingularityLimitMultiplier(),abstractionMassTimeLimitMultiplier()].map(plain);
    stagnantMassMg=0;stagnantSingularities=0;abstractionResearchState['28-1']=true;const zero=values().map(plain);
    return {ratios,cap,rate,reward,same,kc5,unresearched,zero};
  `);
  const cap=Math.floor(16*(1+4*(3/Math.log10(60001))**.75)*8);
  r.ratios.forEach(n=>close(n,8));assert.equal(r.cap,cap);
  assert.deepEqual({...r,ratios:undefined},{ratios:undefined,cap,rate:5,reward:1000,same:true,kc5:1,unresearched:[1,1],zero:[1,1,1,1]});
});

test('new levels survive save/load, Knuth/KC/singularity resets and sanitize legacy or invalid input', () => {
  assert.deepEqual(run(ready(), `
    Object.assign(spaceExpansionUpgradeLevels,{higgs_gain:2,mass_gain:3,mass_effect:4});
    const saved=captureGameSaveData();for(const key in spaceExpansionUpgradeLevels)spaceExpansionUpgradeLevels[key]=0;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    resetProgressForNewKnuthRun();startKnuthChallenge('kc1');abandonKnuthChallenge();
    numberBlackHoleSystemEnabled=true;numberBlackHoleSchwarzschildRadius=()=>1e8;purchaseSingularity();
    const kept=Object.values(spaceExpansionUpgradeLevels).map(plain);
    saved.spaceExpansionUpgradeLevels={higgs_gain:-1,mass_gain:'invalid',mass_effect:2.9};
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});const invalid=Object.values(spaceExpansionUpgradeLevels).map(plain);
    delete saved.spaceExpansionUpgradeLevels;loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {kept,invalid,old:Object.values(spaceExpansionUpgradeLevels).map(plain),errors};
  `),{kept:[2,3,4],invalid:[0,0,2],old:[0,0,0],errors:[]});
});

test('layered prices, reward boosts and mass production remain valid without native integer counters or per-level loops', () => {
  assert.deepEqual(run(ready(), `
    for(const key in spaceExpansionUpgradeLevels)spaceExpansionUpgradeLevels[key]=NumberMath.fromString('1e100');
    const cost=spaceExpansionUpgradeCost('mass_gain');stagnantMassMg=cost;recordStagnantSingularities();
    const bought=buySpaceExpansionUpgrade('mass_gain');higgsParticles=NumberMath.fromString('1e1e100');
    advanceSpaceExpansion(1e20);
    const values=[spaceExpansionUpgradeCost('mass_gain'),spaceExpansionHiggsReward(NumberMath.fromString('1e1e100')),
      stagnantMassMg,stagnantMassRandomMultiplier()].map(serializeNumberValue);
    return {bought,valid:values.every(v=>!(/NaN|Infinity|undefined/.test(JSON.stringify(v))))};
  `),{bought:true,valid:true});
});

test('buttons display current costs/rates and one stable click buys one level', () => {
  const ctx=ready();
  assert.deepEqual(run(ctx, `
    higgsParticles=2;stagnantMassMg=100000;recordStagnantSingularities();renderSpaceExpansionBoard();
    const control=spaceExpansionUpgradeControls.find(u=>u.id==='mass_gain'),button=control.button;
    const initial=control.cost.textContent;control.button.events.click();renderSpaceExpansionBoard();
    return {initial,next:control.cost.textContent,label:control.label.textContent,rate:document.getElementById('stagnantMassRateValue').textContent,
      same:button===control.button,level:plain(spaceExpansionUpgradeLevels.mass_gain),disabled:control.button.disabled};
  `),{initial:'비용: 32 g SM · 다음 가격 ×25',next:'비용: 800 g SM · 다음 가격 ×25',
    label:'정체된 질량 생산 강화 · 1회 · ×5',rate:'10 mg / 초',same:true,level:1,disabled:true});
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/정체된 질량 \(SM\)/);
  assert.match(html,/spaceExpansionMassEffectUpgradeBtn/);
});

test('offline replay includes the upgraded mass rate once and cannot purchase while simulation is paused', async () => {
  const ctx=ready({storage:[]});
  ctx.loadSource(`window.numberTycoonSession.initialize();higgsParticles=5;stagnantMassMg=64000;recordStagnantSingularities();
    spaceExpansionUpgradeLevels.mass_gain=2;resetSpaceExpansionClock();window.numberTycoonSession.enter();`);
  assert.equal(run(ctx,"return buySpaceExpansionUpgrade('higgs_gain');"),false);
  ctx.advance(2000);
  assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),true);
  close(run(ctx,'return plain(stagnantMassMg);'),64250);
  assert.equal(await vm.runInContext('window.numberTycoonSession.leave()',ctx),false);
  close(run(ctx,'return plain(stagnantMassMg);'),64250);
});
