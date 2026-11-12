const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');
const close = (a,b) => assert.ok(Math.abs(a-b) <= 1e-8*Math.max(1,Math.abs(b)), `${a} != ${b}`);

function ready() {
  const ctx = game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.late_abstraction=1;knuthBaseUpgradeLevels.probabilizer=1;greatTheory=50000;`);
  return ctx;
}

test('28-1 costs 50k and accepts either exclusive path, while retaining unlock and affordability checks', () => {
  for (const lane of [1,2]) {
    assert.deepEqual(run(ready(), `
      const definition=abstractionResearchDefinitions.get('28-1');
      const noParent=!researchAbstraction('28-1');abstractionResearchState['27-${lane}']=true;
      knuthBaseUpgradeLevels.late_abstraction=0;const locked=!researchAbstraction('28-1');
      knuthBaseUpgradeLevels.late_abstraction=1;greatTheory=49999;const poor=!researchAbstraction('28-1');
      greatTheory=50000;const bought=researchAbstraction('28-1');
      return {parents:definition.parents,cost:definition.greatTheoryCost,column:definition.column,
        noParent,locked,poor,bought,left:plain(greatTheory),paid:abstractionResearchPaidCosts['28-1'],
        twice:researchAbstraction('28-1'),other:hasAbstractionResearch('27-${3-lane}')};
    `), {parents:['27-1','27-2'],cost:50000,column:28,noParent:true,locked:true,poor:true,
      bought:true,left:0,paid:50000,twice:false,other:false});
  }
});

test('parent-inclusive purchase follows the selected path atomically instead of buying both exclusive branches', () => {
  for (const lane of [1,2]) {
    assert.deepEqual(run(ready(), `
      abstractionResearchState['24-1']=true;abstractionResearchState['25-${lane}']=true;
      const plan=researchPurchasePlan('abstraction','28-1');greatTheory=plan.cost-1;
      const poor=!purchaseResearchWithParents('abstraction','28-1');
      const empty=!hasAbstractionResearch('26-${lane}')&&!hasAbstractionResearch('28-1');
      greatTheory=plan.cost;const bought=purchaseResearchWithParents('abstraction','28-1');
      return {ids:plan.ids,cost:plan.cost,poor,empty,bought,left:plain(greatTheory),
        other:hasAbstractionResearch('25-${3-lane}')};
    `), {ids:[`26-${lane}`,`27-${lane}`,'28-1'],cost:53700,poor:true,empty:true,bought:true,left:0,other:false});
  }
});

test('mass strengthens integer singularity capacity but never grants or removes held singularities', () => {
  const r=run(ready(), `
    stagnantMassMg=60000;recordStagnantSingularities();knuthBaseUpgradeLevels.singularity_limit=2;singularityPoints=17;
    const off=plain(singularityHoldingLimit());abstractionResearchState['28-1']=true;
    const boosted=plain(singularityHoldingLimit()),factor=plain(abstractionMassSingularityLimitMultiplier());
    stagnantMassMg=0;stagnantSingularities=0;const zero=plain(singularityHoldingLimit());stagnantMassMg=1;recordStagnantSingularities();
    const fractional=singularityHoldingLimit(),integer=compareNumberValues(fractional,NumberMath.floor(fractional))===0;
    abstractionResearchState['28-1']=false;
    return {off,boosted,factor,zero,integer,held:plain(singularityPoints)};
  `);
  const factor=1+4*(3/Math.log10(60001))**.75;
  close(r.factor,factor);assert.deepEqual({...r,factor:undefined},{off:18,boosted:Math.floor(18*factor),factor:undefined,zero:18,integer:true,held:17});
});

test('the expanded capacity reaches actual singularity purchasing and shrinking it never deletes holdings', () => {
  assert.deepEqual(run(ready(), `
    singularityPoints=16;stagnantMassMg=60000;recordStagnantSingularities();numberBlackHoleSchwarzschildRadius=()=>NumberMath.fromString('1e100');
    const before=!canPurchaseSingularity();abstractionResearchState['28-1']=true;
    const gain=plain(singularityPointGain()),bought=purchaseSingularity();
    const mass=plain(stagnantMassMg);abstractionResearchState['28-1']=false;
    return {before,gain,bought,mass,held:plain(singularityPoints),blocked:!canPurchaseSingularity()};
  `),{before:true,gain:1,bought:true,mass:60000,held:17,blocked:true});
});

test('only the probabilizer additional cap lift is amplified, including 20-1 and 27-2, with no lift at zero power', () => {
  const r=run(ready(), `
    randomPower=1e50;stagnantMassMg=60000;recordStagnantSingularities();abstractionResearchState['20-1']=true;abstractionResearchState['27-2']=true;
    const before=numberBlackHoleTimeLimit();abstractionResearchState['28-1']=true;
    const after=numberBlackHoleTimeLimit(),effect=logValue(abstractionMassTimeLimitMultiplier());
    const lift=multiplyNumberValue(multiplyNumberValue(PROBABILIZER_BALANCE.timeLimitStrength,probabilizerGrowth()),
      NumberMath.power(abstractionProbabilizerMultiplier(),ABSTRACTION_TIER20_BALANCE.timeLimitPower));
    const expected=NumberMath.toNumber(multiplyNumberValue(1e103,
      addBaseNumbers(1,multiplyNumberValue(lift,abstractionMassTimeLimitMultiplier()))));
    randomPower=0;const zero=numberBlackHoleTimeLimit();randomPower=1e50;
    knuthBaseUpgradeLevels.probabilizer=0;const locked=numberBlackHoleTimeLimit();
    knuthBaseUpgradeLevels.probabilizer=1;activeKnuthChallengeId='kc5';
    return {before,after,expected,effect,zero,locked,kc5:numberBlackHoleTimeMultiplier(),mass:plain(stagnantMassMg)};
  `);
  const logBoost=40*(3/Math.log10(60001))**.75;
  close(r.after,r.expected);close(Math.log10(r.after/r.before),logBoost);close(r.effect,logBoost);
  close(r.zero,1e103);close(r.locked,1e103);assert.equal(r.kc5,1);assert.equal(r.mass,60000);
});

test('the real black-hole timer respects the expanded cap, while ordinary unsaturated acceleration is unchanged', () => {
  const r=run(ready(), `
    randomPower=1e50;stagnantMassMg=60000;recordStagnantSingularities();numberBlackHoleSchwarzschildRadius=()=>1;
    const small=numberBlackHoleTimeMultiplier();abstractionResearchState['28-1']=true;
    const same=numberBlackHoleTimeMultiplier()===small;
    numberBlackHoleSchwarzschildRadius=()=>NumberMath.fromString('1e300');
    const limited=numberBlackHoleTimeMultiplier()===numberBlackHoleTimeLimit();
    return {same,limited,limit:numberBlackHoleTimeLimit()};
  `);
  assert.ok(r.same&&r.limited&&Number.isFinite(r.limit));
});

test('effects grow monotonically into layered masses without overflowing timer arithmetic or allocating per singularity', () => {
  const rows=run(ready(), `
    abstractionResearchState['28-1']=true;randomPower=1e50;
    let previousCap=0,previousBoost=0;
    return [0,1,60000,'1e20','1e1000','1e1e100','1e1e1000'].map(m=>{
      stagnantMassMg=NumberMath.fromValue(m);recordStagnantSingularities();const cap=singularityHoldingLimit(),limit=numberBlackHoleTimeLimit();
      const boost=abstractionMassTimeLimitMultiplier();
      const monotonic=compareNumberValues(cap,previousCap)>=0&&compareNumberValues(boost,previousBoost)>=0;
      previousCap=cap;previousBoost=boost;
      return {monotonic,limit,
        valid:isPositiveNumberValue(cap)&&Number.isFinite(limit)&&limit<=Number.MAX_VALUE/1e12,
        serialized:serializeNumberValue(cap)};
    });
  `);
  assert.ok(rows.every((r,i)=>r.valid&&r.monotonic&&!/NaN|Infinity/.test(JSON.stringify(r.serialized))
    && (i===0||r.limit>=rows[i-1].limit)));
});

test('save/load and refund preserve mass and existing holdings; older saves default the new research to false', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['27-1']=true;researchAbstraction('28-1');
    stagnantMassMg=60000;recordStagnantSingularities();singularityPoints=60;const saved=captureGameSaveData();
    abstractionResearchState['28-1']=false;stagnantMassMg=0;stagnantSingularities=0;
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=hasAbstractionResearch('28-1')&&plain(singularityHoldingLimit())===61;
    abstractionResearchState['27-1']=false;abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    const refund=plain(greatTheory),held=plain(singularityPoints),mass=plain(stagnantMassMg);
    delete saved.abstractionResearchState['28-1'];loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {restored,refund,held,mass,old:hasAbstractionResearch('28-1'),errors};
  `),{restored:true,refund:50000,held:60,mass:60000,old:false,errors:[]});
});

test('live card, help graph and tree expose the mass effects and merged prerequisites', () => {
  const ctx=ready();
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/formula-help.js'),'utf8'));
  const r=run(ctx, `
    abstractionResearchState['28-1']=true;stagnantMassMg=60000;recordStagnantSingularities();
    ensureAbstractionResearchUi(abstractionResearchDefinitions.get('28-1'));
    const text=abstractionTimeResearchInfo('28-1'),help=FORMULA_HELP_DEFINITIONS['abstraction:28-1'];
    const chart=FORMULA_HELP_CHARTS['abstraction:28-1'];
    return {text,formula:help.formula,lines:chart.lines.map(line=>line.evaluate(1)),
      asset:help.graphs[0].src,node:!!abstractionResearchUi['28-1']};
  `);
  assert.match(r.text,/정체된 특이점 1개/);assert.match(r.text,/61개/);assert.match(r.formula,/floor/);
  const f=(3/Math.log10(60001))**.75;
  close(r.lines[0],Math.log10(1+4*f));close(r.lines[1],40*f);assert.ok(r.node);
  const asset=path.join(__dirname,'..',r.asset.split('?')[0]);assert.ok(fs.existsSync(asset));
});
