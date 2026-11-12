const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
function ready(active=true) {
  const ctx=game(true);
  ctx.loadSource(`spaceExpansionActive=${active};knuthBaseUpgradeLevels.space_expansion=1;
    abstractionResearchState['23-3']=true;abstractionResearchState['26-2']=true;
    abstractionPermanentSp=NumberMath.fromString('1e100');abstractionPermanentSingularities=4;`);
  return ctx;
}

test('expansion disables storage effects but keeps ownership, costs and prerequisite satisfaction', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['23-1']=true;abstractionResearchState['23-2']=true;
    return {owned:['23-3','26-2'].every(hasPurchasedAbstractionResearch),
      researched:['23-3','26-2'].every(hasAbstractionResearch),
      off:['23-3','26-2'].every(id=>!abstractionPermanentStorageActive(id)),
      parents:['24-1','27-2'].every(id=>abstractionResearchParentsReady(ABSTRACTION_RESEARCHES.find(r=>r.id===id)))};
  `),{owned:true,researched:true,off:true,parents:true});
});

test('SP may be spent below its reserve and no new SP or singularity record is written during expansion', () => {
  assert.deepEqual(run(ready(), `
    setSquarePoints(7);setSingularityPoints(1);
    squarePoints=NumberMath.fromString('1e200');singularityPoints=10;
    numberBlackHoleSchwarzschildRadius=()=>1e10;
    recordAbstractionPermanentSp();recordAbstractionPermanentSingularities();
    setSquarePoints(7);setSingularityPoints(1);
    return {sp:plain(squarePoints),singularities:plain(singularityPoints),
      bankSp:fmtPowerBase(abstractionPermanentSp),bankSingularities:plain(abstractionPermanentSingularities),
      capacity:plain(abstractionSingularityStorageCapacity()),bonus:plain(abstractionSingularityBonus(1e10))};
  `),{sp:7,singularities:1,bankSp:'1e100',bankSingularities:4,capacity:0,bonus:0});
});

test('rewardless entry resets SP without importing its reserve and exit restores both active floors', () => {
  assert.deepEqual(run(ready(false), `
    knuthBaseUpgradeLevels.starting_resources=1;
    setSquarePoints(0);setSingularityPoints(0);
    const entered=toggleSpaceExpansion(),entrySp=fmtPowerBase(squarePoints);
    setSquarePoints(7);setSingularityPoints(1);
    const spent=[plain(squarePoints),plain(singularityPoints)];
    const exited=toggleSpaceExpansion();
    return {entered,entrySp,spent,exited,active:spaceExpansionActive,
      sp:fmtPowerBase(squarePoints),singularities:plain(singularityPoints),bank:fmtPowerBase(abstractionPermanentSp)};
  `),{entered:true,entrySp:'10b',spent:[7,1],exited:true,active:false,sp:'1e100',singularities:4,bank:'1e100'});
});

test('eligible entry pays the pre-expansion KP quote but suppresses reserve restoration during prestige', () => {
  const row=run(ready(false), `
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    knuthBaseUpgradeLevels.starting_resources=1;knuthBaseUpgradeLevels.starting_upgrades=1;
    knuthBaseUpgradeLevels.kp_gain=4;knuthPoints=100;squareConvergencePoints=NumberMath.fromString('1e300');
    setSquarePoints(0);const expected=addBaseNumbers(knuthPoints,knuthPointGain());
    const entered=toggleSpaceExpansion();
    return {entered,paid:compareNumberValues(knuthPoints,expected)===0,sp:fmtPowerBase(squarePoints),
      active:spaceExpansionActive,bank:fmtPowerBase(abstractionPermanentSp)};
  `);
  assert.deepEqual(row,{entered:true,paid:true,sp:'10b',active:true,bank:'1e100'});
});

test('KP earned inside expansion never grows the SP reserve; an eligible exit restores the original bank', () => {
  const row=run(ready(), `
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    squarePoints=NumberMath.fromString('1e200');squareConvergencePoints=NumberMath.fromString('1e300');
    const expected=addBaseNumbers(knuthPoints,knuthPointGain());beginKnuthPrestige();
    const paid=compareNumberValues(knuthPoints,expected)===0;
    const inside=[spaceExpansionActive,plain(squarePoints),fmtPowerBase(abstractionPermanentSp)];
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    squareConvergencePoints=NumberMath.fromString('1e300');squarePoints=NumberMath.fromString('1e200');
    toggleSpaceExpansion();
    return {paid,inside,active:spaceExpansionActive,sp:fmtPowerBase(squarePoints),bank:fmtPowerBase(abstractionPermanentSp)};
  `);
  assert.deepEqual(row,{paid:true,inside:[true,0,'1e100'],active:false,sp:'1e100',bank:'1e100'});
});

test('buying singularity upgrades really spends below the bank and expansion removes the 26-2 extra reward', () => {
  assert.deepEqual(run(ready(), `
    singularityPoints=4;const bought=buySingularityUpgrade('black_hole'),remaining=plain(singularityPoints);
    setSingularityPoints(0);numberBlackHoleSchwarzschildRadius=()=>1e10;
    const quote=singularityPointGain(),collapsed=purchaseSingularity();
    return {bought,remaining,quote:plain(quote),collapsed,held:plain(singularityPoints),bank:plain(abstractionPermanentSingularities)};
  `),{bought:true,remaining:3,quote:1,collapsed:true,held:1,bank:4});
});

test('SP black-hole donation batching never replenishes or donates an inactive permanent reserve', () => {
  assert.deepEqual(run(ready(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';
    numberBlackHoleDonationPercent=100;setSquarePoints(7);applyNumberBlackHoleDonations(100);
    return {sp:plain(squarePoints),invested:plain(numberBlackHoleTotalSpInvested),
      count:plain(numberBlackHoleSpDonationCount),bank:fmtPowerBase(abstractionPermanentSp)};
  `),{sp:0,invested:7,count:1,bank:'1e100'});
});

test('loading an active save from either mode preserves spent balances rather than restoring reserves early', () => {
  const row=run(ready(), `
    setSquarePoints(7);setSingularityPoints(1);const saved=captureGameSaveData();
    const rows=[];
    for(const previous of [false,true]){
      spaceExpansionActive=previous;setSquarePoints(0);setSingularityPoints(0);
      const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
      rows.push([loaded,spaceExpansionActive,plain(squarePoints),plain(singularityPoints),
        fmtPowerBase(abstractionPermanentSp),plain(abstractionPermanentSingularities)]);
    }
    saved.spaceExpansionActive=false;loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {rows,normal:[spaceExpansionActive,fmtPowerBase(squarePoints),plain(singularityPoints)],errors};
  `);
  assert.deepEqual(row,{rows:[[true,true,7,1,'1e100',4],[true,true,7,1,'1e100',4]],normal:[false,'1e100',4],errors:[]});
});

test('buying storage research or resetting it inside expansion never restores or deletes its hidden records', () => {
  const row=run(ready(), `
    abstractionResearchState['23-3']=false;abstractionResearchState['26-2']=false;
    abstractionResearchState['22-3']=true;abstractionResearchState['25-2']=true;
    knuthBaseUpgradeLevels.late_abstraction=1;greatTheory=2400;setSquarePoints(7);setSingularityPoints(1);
    const purchased=[researchAbstraction('23-3'),researchAbstraction('26-2')];
    const balances=[plain(squarePoints),plain(singularityPoints)];
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {purchased,balances,records:[fmtPowerBase(abstractionPermanentSp),plain(abstractionPermanentSingularities)],
      owned:hasPurchasedAbstractionResearch('23-3')||hasPurchasedAbstractionResearch('26-2')};
  `);
  assert.deepEqual(row,{purchased:[true,true],balances:[7,1],records:['1e100',4],owned:false});
});

test('ordinary research ownership and effects resume on exit only if the research is still purchased', () => {
  const row=run(ready(), `
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    setSquarePoints(7);setSingularityPoints(1);squareConvergencePoints=NumberMath.fromString('1e300');
    abstractionResetOnNextKnuthPoint=true;toggleSpaceExpansion();
    return {active:spaceExpansionActive,sp:plain(squarePoints),singularities:plain(singularityPoints),
      records:[fmtPowerBase(abstractionPermanentSp),plain(abstractionPermanentSingularities)],
      activeResearch:abstractionPermanentStorageActive('23-3')||abstractionPermanentStorageActive('26-2')};
  `);
  assert.deepEqual(row,{active:false,sp:0,singularities:1,records:['1e100',4],activeResearch:false});
});

test('cards, live research info, singularity status and formula text disclose the disabled effects', () => {
  const ctx=ready();ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/systems/formula-help.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    renderSingularityBoard();
    return {descriptions:['23-3','26-2'].every(id=>ABSTRACTION_RESEARCHES.find(r=>r.id===id).description.includes('공간 팽창')),
      live:['23-3','26-2'].every(id=>abstractionTimeResearchInfo(id).includes('공간 팽창 중 비활성')),
      help:['23-3','26-2'].every(id=>FORMULA_HELP_DEFINITIONS['abstraction:'+id].formula.includes('공간 팽창')),
      status:singularityReserveStatus.textContent.includes('공간 팽창 중 비활성')};
  `),{descriptions:true,live:true,help:true,status:true});
});
