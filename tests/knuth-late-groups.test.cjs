const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function ready() {
  const ctx = game();
  ctx.loadSource(`completedKnuthChallengeIds.add('kc5');
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(u=>[u.id,1])));
    knuthPoints=NumberMath.fromString('1e5000');`);
  return ctx;
}
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

test('late definitions contain exactly the requested groups, costs and repeatable growth', () => {
  const rows = run(game(), `return KNUTH_BASE_UPGRADES.filter(u=>u.group>=4)
    .map(u=>[u.id,u.group,logValue(u.baseCost),u.growth ? Math.log10(u.growth) : null,knuthBaseUpgradeMax(u)]);`);
  assert.deepEqual(rows.map(r=>r.slice(0,4)), [
    ['late_abstraction',4,200,null],['diverger_b_bonus',4,200,100],['starting_upgrades',4,30,null],
    ['dyson_effect',4,350,50],['advanced_equipment',4,400,null],
    ['passive_radius',5,500,null],['black_hole_upgrades',5,420,null],['singularity_limit',5,400,50],
    ['probabilizer',5,500,null],['singularity_growth',5,500,100],
    ['space_expansion',6,1000,null],['stagnant_mass_gain',6,1200,200]
  ]);
  assert.equal(rows.find(r=>r[0]==='singularity_growth')[4],6);
});

test('KC5 and every prior purchase gate the new groups; purchasing a late unlock is not a prestige', () => {
  assert.deepEqual(run(game(), `
    knuthPoints=NumberMath.fromString('1e5000');
    loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.filter(u=>u.group<4).map(u=>[u.id,1])));
    const locked=buyKnuthBaseUpgrade('late_abstraction');completedKnuthChallengeIds.add('kc5');
    const before=[4,5,6].map(knuthBaseGroupUnlocked);
    const fourth=KNUTH_BASE_UPGRADES.filter(u=>u.group===4).map(u=>buyKnuthBaseUpgrade(u.id));
    const middle=[4,5,6].map(knuthBaseGroupUnlocked);
    const fifth=KNUTH_BASE_UPGRADES.filter(u=>u.group===5).map(u=>buyKnuthBaseUpgrade(u.id));
    return {locked,before,fourth,middle,fifth,after:[4,5,6].map(knuthBaseGroupUnlocked),
      generalization:hasAnyGeneralizationResearch(),claimed:hasClaimedKnuthPoint};
  `), {locked:false,before:[true,false,false],fourth:Array(5).fill(true),middle:[true,true,false],
    fifth:Array(5).fill(true),after:[true,true,true],generalization:false,claimed:true});
});

test('late repeatables spend the exact quote and retain the existing high-price growth tiers', () => {
  const rows = run(ready(), `return KNUTH_BASE_UPGRADES.filter(u=>u.group>=4&&u.growth).map(u=>{
    knuthBaseUpgradeLevels[u.id]=0;const cost=knuthBaseUpgradeCost(u);knuthPoints=cost;
    const bought=buyKnuthBaseUpgrade(u.id);
    return {id:u.id,bought,left:plain(knuthPoints),next:logValue(knuthBaseUpgradeCost(u)),
      expected:logValue(cost)+Math.log10(u.growth*(logValue(cost)>=Math.log10(1.8)+308 ? 8 : 2))};
  });`);
  for (const row of rows) { assert.equal(row.bought,true,row.id); assert.equal(row.left,0,row.id); close(row.next,row.expected); }
});

test('b bonus counts as current-strength b upgrades without charging CP or changing CP levels/prices', () => {
  const result = run(ready(), `
    knuthBaseUpgradeLevels.diverger_b_bonus=0;
    divergerBLevel=5;divergerB=divergerBAtLevel(5);generalizationResearchState['3-2']=true;divergerN=10;
    const before=divergerProductionValue(),cost=NumberMath.serialize(divergerBCpCost);
    const bought=buyKnuthBaseUpgrade('diverger_b_bonus');
    const b=divergerB,gain=divergerBUpgradeGain(),boosted=compareNumberValues(divergerPower,before)>0;
    resetDivergerProgress();return {bought,b,gain,boosted,costSame:cost===NumberMath.serialize(divergerBCpCost),
      resetB:divergerB,resetLevel:divergerBLevel};
  `);
  assert.equal(result.bought,true);close(result.b,3.4);close(result.gain,.4);
  assert.equal(result.boosted,true);assert.equal(result.costSame,true);close(result.resetB,1.4);assert.equal(result.resetLevel,0);
});

test('Dyson effect is multiplied at the end, including 18-6, and remains neutral without swarms or in KC1', () => {
  const rows = run(ready(), `
    squareBreakthroughLevels.dyson_swarm=12;abstractionResearchState['18-6']=true;
    knuthBaseUpgradeLevels.dyson_effect=0;const before=dysonEffectMultiplier();
    knuthBaseUpgradeLevels.dyson_effect=3;
    const ratio=plain(divideNumberValue(dysonEffectMultiplier(),before));
    activeKnuthChallengeId='kc1';const kc1=plain(dysonEffectMultiplier());activeKnuthChallengeId=null;
    squareBreakthroughLevels.dyson_swarm=0;return [ratio,kc1,plain(dysonEffectMultiplier())];`);
  close(rows[0],1.25**3);assert.deepEqual(rows.slice(1),[1,1]);
});

test('new Knuth grants all requested upgrades up to dynamic caps without buying 8-1 or spending extra KP', () => {
  const result = run(ready(), `
    knuthBaseUpgradeLevels.dyson_limit=3;knuthBaseUpgradeLevels.overclock_limit=4;
    const kp=NumberMath.serialize(knuthPoints);resetProgressForNewKnuthRun();
    return {square:SQUARE_UPGRADES.every(u=>hasSquareUpgrade(u.id)),
      gz:GENERALIZATION_RESEARCHES.every(r=>hasPurchasedGeneralizationResearch(r.id)),
      bt:SQUARE_BREAKTHROUGH_UPGRADES.every(u=>squareBreakthroughLevel(u.id)===squareBreakthroughMax(u)),
      opened:[squareUnlocked,squareBreakthroughEntered,hasClaimedKnuthPoint],pending:pendingKnuthPointClaim,
      sameKp:kp===NumberMath.serialize(knuthPoints),n:plain(getBaseNumber()),sp:plain(squarePoints),cp:plain(squareConvergencePoints),
      percent:percentUnlocked,lanes:percentLaneCount,autoDimension:squareDimensionAutoUpgradeEnabled};`);
  assert.equal(result.square,true);assert.equal(result.gz,true);assert.equal(result.bt,true);
  assert.deepEqual(result.opened,[true,true,true]);assert.equal(result.pending,false);assert.equal(result.sameKp,true);
  assert.deepEqual([result.n,result.sp,result.cp],[1e14,1e10,1000]);assert.equal(result.percent,true);
  assert.ok(result.lanes>=2);assert.equal(result.autoDimension,true);
});

test('startup grants respect KC1, KC2, KC3 and KC5 restrictions', () => {
  const rows = run(ready(), `return ['kc1','kc2','kc3','kc5'].map(id=>{
    activeKnuthChallengeId=id;resetProgressForNewKnuthRun();
    return {id,dyson:squareBreakthroughLevel('dyson_swarm'),research:hasAnyGeneralizationResearch(),
      square:allSquareUpgradesBought(),dimension:squareDimensionAvailable(),diverger:divergerAvailable(),
      cp:plain(squareConvergencePoints),canBuy:canBuyKnuthBaseUpgrade('diverger_b_bonus')};
  });`);
  assert.equal(rows[0].dyson,0);assert.equal(rows[1].dimension,false);assert.equal(rows[1].diverger,false);
  assert.equal(rows[2].research,false);assert.equal(rows[2].square,true);
  assert.equal(rows[3].square,false);assert.equal(rows[3].research,false);assert.equal(rows[3].cp,0);assert.equal(rows[3].canBuy,false);
});

test('passive radius uses real seconds, composes with donations and never receives game time acceleration', () => {
  const row = run(ready(), `
    singularityPoints=2;numberBlackHoleTotalInvested=0;setBaseNumber(0);
    numberBlackHolePassiveRadius=0;const changed=advanceNumberBlackHole(1000);
    const first=plain(numberBlackHoleSchwarzschildRadius());advanceNumberBlackHole(49000);
    const total=plain(numberBlackHolePassiveRadius),radius=plain(numberBlackHoleSchwarzschildRadius());
    numberBlackHoleSystemEnabled=false;advanceNumberBlackHole(5000);const off=plain(numberBlackHolePassiveRadius);
    numberBlackHoleSystemEnabled=true;activeKnuthChallengeId='kc5';advanceNumberBlackHole(5000);
    return {changed,first,total,radius,off,kc5:plain(numberBlackHolePassiveRadius)};`);
  assert.equal(row.changed,true);close(row.first,1.1);assert.equal(row.total,50);close(row.radius,55);
  assert.equal(row.off,50);assert.equal(row.kc5,50);
});

test('passive radius resets on singularity, preserves resource selection, and is saved without offline accrual', () => {
  const row = run(ready(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';
    singularityPoints=0;numberBlackHolePassiveRadius=60;saveGame();const saved=localStorage.getItem(SAVE_KEY);
    numberBlackHolePassiveRadius=0;clock.advance(600000);loadGame(saved,{countAsLoad:false});
    const restored=plain(numberBlackHolePassiveRadius),bought=purchaseSingularity();
    return {restored,bought,reset:plain(numberBlackHolePassiveRadius),resource:numberBlackHoleDonationResource,
      kept:knuthBaseUpgradeLevel('passive_radius'),errors};`);
  assert.deepEqual(row,{restored:60,bought:true,reset:0,resource:'sp',kept:1,errors:[]});
});

test('held singularity cap is inclusive, spending reopens it, and extra cap applies immediately', () => {
  const row = run(ready(), `
    knuthBaseUpgradeLevels.singularity_limit=0;singularityPoints=16;numberBlackHolePassiveRadius=NumberMath.fromString('1e100');
    const blocked=canPurchaseSingularity();const expanded=buyKnuthBaseUpgrade('singularity_limit');
    const allowed=canPurchaseSingularity(),collapse=purchaseSingularity(),held=plain(singularityPoints);
    numberBlackHolePassiveRadius=NumberMath.fromString('1e100');const atNewCap=canPurchaseSingularity();
    const spent=buySingularityUpgrade('black_hole');return {blocked,expanded,allowed,collapse,held,atNewCap,spent,
      afterSpend:canPurchaseSingularity(),limit:plain(singularityHoldingLimit())};`);
  assert.deepEqual(row,{blocked:false,expanded:true,allowed:true,collapse:true,held:17,atNewCap:false,spent:true,afterSpend:true,limit:17});
});

test('requirement growth drops 10 to 4, stops at six purchases, and 18-1 preserves a positive exponent', () => {
  const rows = run(ready(), `
    return [false,true].flatMap(discount=>[0,1,5,6].map(level=>{
      abstractionResearchState['18-1']=discount;knuthBaseUpgradeLevels.singularity_growth=level;
      singularityPoints=2;const first=singularityRadiusRequirement();singularityPoints=3;
      return {discount,level,growth:singularityRadiusGrowth(),first:plain(first),
        ratio:plain(divideNumberValue(singularityRadiusRequirement(),first))};
    }));`);
  for (const row of rows) {
    assert.equal(row.growth,10-row.level);
    close(row.first,20*(10-row.level)**(2*(row.discount ? 0.25 : 1)));
    close(row.ratio,(10-row.level)**(row.discount ? 0.25 : 1));assert.ok(row.ratio>1);
  }
  assert.deepEqual(run(ready(), `
    knuthBaseUpgradeLevels.singularity_growth=5;const bought=buyKnuthBaseUpgrade('singularity_growth');
    const again=buyKnuthBaseUpgrade('singularity_growth');
    const info=nKnuthUpgradeSnapshot('singularity_growth',{});
    return [bought,again,knuthBaseUpgradeLevel('singularity_growth'),info.max,info.cost,info.available];
  `),[true,false,6,6,0,false]);
});

test('new counts, auto toggles, radius and unlock records round-trip; old saves default to no new purchases', () => {
  const row = run(ready(), `
    knuthBaseUpgradeLevels.diverger_b_bonus=7;knuthBaseUpgradeLevels.stagnant_mass_gain=3;
    knuthBaseAutoEnabled.diverger_b_bonus=true;numberBlackHolePassiveRadius=12;saveGame();
    const saved=localStorage.getItem(SAVE_KEY);loadKnuthBaseUpgradeLevels(null);numberBlackHolePassiveRadius=0;
    loadGame(saved,{countAsLoad:false});
    const restored=[knuthBaseUpgradeLevel('diverger_b_bonus'),divergerB,plain(stagnantMassBlackHoleMultiplier()),
      numberBlackHolePassiveRadius,knuthBaseAutoEnabled.diverger_b_bonus,
      ...['advanced_equipment','black_hole_upgrades','probabilizer','space_expansion'].map(knuthBaseUpgradeEffectLevel)];
    const legacy=JSON.parse(saved);delete legacy.numberBlackHolePassiveRadius;
    for(const u of KNUTH_BASE_UPGRADES.filter(u=>u.group>=4))delete legacy.knuthBaseUpgradeLevels[u.id];
    loadGame(JSON.stringify(legacy),{countAsLoad:false});
    return {restored,old:KNUTH_BASE_UPGRADES.filter(u=>u.group>=4).every(u=>knuthBaseUpgradeLevel(u.id)===0),
      radius:numberBlackHolePassiveRadius,errors};`);
  assert.equal(row.restored[0],7);close(row.restored[1],3.8);
  assert.deepEqual(row.restored.slice(2),[64,12,true,1,1,1,1]);assert.equal(row.old,true);
  assert.equal(row.radius,0);assert.deepEqual(row.errors,[]);
});

test('legacy holdings above the cap are not truncated on load and still cannot buy more', () => {
  const row = run(game(), `
    singularityPoints=40;saveGame();const saved=localStorage.getItem(SAVE_KEY);
    singularityPoints=0;loadGame(saved,{countAsLoad:false});return {held:plain(singularityPoints),can:canPurchaseSingularity()};`);
  assert.deepEqual(row,{held:40,can:false});
});

test('b bonus follows the loaded challenge rather than the previously open save', () => {
  const row = run(ready(), `
    divergerBLevel=5;saveGame();const normal=localStorage.getItem(SAVE_KEY);
    const challenged=JSON.parse(normal);challenged.activeKnuthChallengeId='kc5';
    challenged.completedKnuthChallengeIds=challenged.completedKnuthChallengeIds.filter(id=>id!=='kc5');
    loadGame(JSON.stringify(challenged),{countAsLoad:false});const during=divergerB;
    loadGame(normal,{countAsLoad:false});return {during,after:divergerB,errors};`);
  close(row.during,2);close(row.after,3.4);assert.deepEqual(row.errors,[]);
});

test('late costs and held-count requirements stay positive with bounded work for enormous counts', () => {
  const row = run(ready(), `
    const original=NumberMath.power;let calls=0;NumberMath.power=(...args)=>{calls++;return original(...args);};
    const prices=KNUTH_BASE_UPGRADES.filter(u=>u.group>=4&&u.growth).map(u=>{
      knuthBaseUpgradeLevels[u.id]=knuthBaseUpgradeMax(u);return knuthBaseUpgradeCost(u);
    });
    abstractionResearchState['18-1']=true;singularityPoints=NumberMath.fromString('1e1e20');
    const requirement=singularityRadiusRequirement();NumberMath.power=original;
    return {calls,positive:prices.every(v=>compareNumberValues(v,1)>0),requirement:compareNumberValues(requirement,20)>0,
      serializable:!JSON.stringify(prices.map(NumberMath.serialize)).includes('NaN')};`);
  assert.equal(row.positive,true);assert.equal(row.requirement,true);assert.equal(row.serializable,true);
  assert.ok(row.calls<=20,JSON.stringify(row));
});

test('N can buy new upgrades and get quotes, while the built-in buyer stops at finite limits', () => {
  const row = run(ready(), `
    knuthBaseUpgradeLevels.diverger_b_bonus=0;const source='buy knuth diverger_b_bonus';
    const executed=executeN(source),snapshot=nKnuthUpgradeSnapshot('diverger_b_bonus',{});
    knuthBaseUpgradeLevels.singularity_growth=5;knuthBaseAutoEnabled.singularity_growth=true;
    generalizationResearchState['3-4']=true;advanceKnuthBaseAutomation(100000);
    return {executed,level:snapshot.upgraded,available:snapshot.available,max:snapshot.max,
      capped:knuthBaseUpgradeLevel('singularity_growth'),active:knuthBaseAutoEnabled.singularity_growth};`);
  assert.deepEqual(row,{executed:true,level:1,available:true,max:0,capped:6,active:true});
});

test('row-19 gate applies to direct purchase, parent plans and presets without charging currency', () => {
  assert.deepEqual(run(game(), `
    const future={id:'19-1',column:19,row:0,parents:[],greatTheoryCost:1};ABSTRACTION_RESEARCHES.push(future);
    greatTheory=10;abstractionResearchPresets[0]={name:'future',ids:['19-1']};
    const before=[canResearchAbstraction('19-1'),researchPurchasePlan('abstraction','19-1')===null,
      Boolean(abstractionPresetPurchasePlan(0).error),researchAbstraction('19-1')];
    knuthBaseUpgradeLevels.late_abstraction=1;const after=researchAbstraction('19-1');
    return {before,after,left:plain(greatTheory)};`),{before:[false,true,true,false],after:true,left:9});
});

test('new group cards display locks, b bonus, finite completion and inert-system descriptions', () => {
  const ctx=ready();
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    knuthBaseUpgradeLevels.singularity_growth=6;renderKnuthBaseUpgrades();
    const b=knuthBaseUpgradeUi.get('diverger_b_bonus'),done=knuthBaseUpgradeUi.get('singularity_growth');
    return {count:knuthBaseUpgradeUi.size,status:[4,5,6].map(g=>knuthBaseGroupUi.get(g).textContent),
      b:b.description.textContent.includes('+0.4'),done:done.cost.textContent,disabled:done.button.disabled,
      placeholder:knuthBaseUpgradeUi.get('advanced_equipment').description.textContent.includes('기록만')};
  `),{count:24,status:['해금됨','해금됨','해금됨'],b:true,done:'구매 완료',disabled:true,placeholder:true});
});
