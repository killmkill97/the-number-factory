const assert=require('node:assert/strict');
const test=require('node:test');
const {game,run}=require('./helpers/kc4-game.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('mass milestones square in mg, award inclusively, and bulk count jumps have exact boundary checks',()=>{
  const rows=run(game(true),`return [0,1,2,3,4,8,20].map(s=>{
    const requirement=stagnantSingularityRequirement(s);
    return {s,log:plain(NumberMath.log10(requirement)),at:plain(stagnantSingularityCountForMass(requirement)),
      below:plain(stagnantSingularityCountForMass(multiplyNumberValue(requirement,.999))),
      after:plain(stagnantSingularityCountForMass(multiplyNumberValue(requirement,1.001)))};});`);
  for(const r of rows){close(r.log,3*2**r.s);assert.equal(r.at,r.s+1);assert.equal(r.below,r.s);assert.equal(r.after,r.s+1);}
  assert.equal(run(game(true),'return stagnantSingularityCountForMass(999);'),0);
});

test('production grants all passed milestones without spending mass; spending mass cannot erase bonuses',()=>{
  const r=run(game(true),`knuthBaseUpgradeLevels.space_expansion=1;higgsParticles=1e24;advanceSpaceExpansion(1000);
    const count=plain(stagnantSingularities),mass=NumberMath.serialize(stagnantMassMg);
    const before=NumberMath.serialize(stagnantMassRandomMultiplier());stagnantMassMg=0;
    const kept=NumberMath.serialize(stagnantMassRandomMultiplier())===before;
    return {count,mass,kept};`);
  assert.deepEqual(r,{count:4,mass:'1000000000000000000000000',kept:true});
  const paid=run(game(true),`knuthBaseUpgradeLevels.space_expansion=1;stagnantMassMg=64000;higgsParticles=0;
    const bought=buySpaceExpansionUpgrade('mass_effect');return {bought,mass:plain(stagnantMassMg),s:plain(stagnantSingularities),effect:plain(stagnantMassEffectMultiplier())};`);
  assert.deepEqual(paid,{bought:true,mass:0,s:1,effect:2});
});

test('all seven old mass-driven boosts depend solely on acquired count and upgrade/research ownership',()=>{
  const r=run(game(true),`abstractionResearchState['28-1']=true;abstractionResearchState['25-2']=true;
    for(const id of ['mass_percent','overfeed','group_boost'])spaceExpansionOneTimeUpgradeState[id]=true;
    const read=()=>[stagnantMassRadiusMultiplier(),stagnantMassRandomMultiplier(),spaceExpansionMassPercentMultiplier(),
      spaceExpansionOverfeedMultiplier(),spaceExpansionGroupMultiplier(),abstractionMassSingularityLimitMultiplier(),abstractionMassTimeLimitMultiplier()].map(serializeNumberValue);
    const neutral=read();stagnantMassMg=1e6;recordStagnantSingularities();const first=read();
    stagnantMassMg=1e11;recordStagnantSingularities();const within=read();stagnantMassMg=0;const spent=read();
    return {neutral,first,within,spent};`);
  assert.deepEqual(r.neutral,Array(7).fill('1'));assert.deepEqual(r.within,r.first);assert.deepEqual(r.spent,r.first);
  assert.ok(r.first.every(v=>v!=='1'));
});

test('new and old saves restore maximum acquired count before effects, normal prestiges retain it, definition resets it',()=>{
  const r=run(game(true),`stagnantMassMg=1e12;recordStagnantSingularities();stagnantMassMg=0;
    const saved=captureGameSaveData();loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});const restored=plain(stagnantSingularities);
    resetProgressForNewKnuthRun();const retained=plain(stagnantSingularities);
    const legacy={...saved,stagnantMassMg:'1e24'};delete legacy.stagnantSingularities;
    loadGame(JSON.stringify(legacy),{persistOverride:false,countAsLoad:false});const migrated=plain(stagnantSingularities);
    definitionStoryStep=DEFINITION_STORY_LINES.length;completeDefinitionStory();const cleared=plain(stagnantSingularities);
    return {restored,retained,migrated,cleared};`);
  assert.deepEqual(r,{restored:3,retained:3,migrated:4,cleared:0});
});

test('layered mass/count calculations stay positive, monotone, and serializable without per-milestone iteration',()=>{
  const rows=run(game(true),`return ['1e1000','1e1e100','1e1e1000','1e1e1e100'].map(m=>{
    stagnantMassMg=NumberMath.fromString(m);recordStagnantSingularities();
    return {count:serializeNumberValue(stagnantSingularities),next:serializeNumberValue(stagnantSingularityRequirement()),
      valid:compareNumberValues(stagnantMassRandomMultiplier(),1)>0&&compareNumberValues(stagnantSingularityRequirement(),stagnantMassMg)>0};});`);
  for(const r of rows){assert.ok(r.valid);assert.doesNotMatch(JSON.stringify(r),/NaN|Infinity|undefined/);}
});

test('production UI shows banked count and the next mass requirement after spending the entire mass balance',()=>{
  const r=run(game(true),`knuthBaseUpgradeLevels.space_expansion=1;stagnantMassMg=64000;
    buySpaceExpansionUpgrade('mass_effect');renderSpaceExpansionBoard();
    return {count:document.getElementById('stagnantSingularityValue').textContent,
      next:document.getElementById('stagnantSingularityNextValue').textContent,
      mass:document.getElementById('stagnantMassValue').textContent,
      formula:document.getElementById('spaceExpansionFormulaText').textContent};`);
  assert.equal(r.count,'1');assert.equal(r.next,'1 kg');assert.equal(r.mass,'0 mg');
  assert.match(r.formula,/질량을 소비해도 S는 유지/);assert.match(r.formula,/1000\^\(2\^S\)/);
});
