const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('loading six old purchases refunds 19800 once and lowers the later research reset refund to 7200', () => {
  assert.deepEqual(run(game(), `
    const ids=['22-1','22-2','22-3','23-1','23-2','23-3'];
    const saved=captureGameSaveData();delete saved.abstractionLateResearchPriceVersion;
    saved.greatTheory='50';saved.abstractionResetOnNextKnuthPoint=true;
    for(const id of ids){saved.abstractionResearchState[id]=true;saved.abstractionResearchPaidCosts[id]=4500;}
    const raw=JSON.stringify(saved);const loaded=loadGame(raw,{persistOverride:false,countAsLoad:false});
    const returned=plain(greatTheory),refund=abstractionResearchRefund(),costs=ids.map(id=>abstractionResearchPaidCosts[id]);
    greatTheory=999999;loadGame(raw,{persistOverride:false,countAsLoad:false});const sameOld=plain(greatTheory)===returned;
    const migrated=captureGameSaveData();loadGame(JSON.stringify(migrated),{persistOverride:false,countAsLoad:false});
    const repeated=plain(greatTheory)===returned,version=migrated.abstractionLateResearchPriceVersion;
    const owned=ids.every(hasPurchasedAbstractionResearch);applyAbstractionResetOnKnuthPoint();
    return {loaded,returned,refund,costs,sameOld,repeated,version,owned,afterReset:plain(greatTheory),errors};
  `), {loaded:true,returned:19850,refund:7200,costs:[1200,1200,1200,1200,1200,1200],
    sameOld:true,repeated:true,version:1,owned:true,afterReset:27050,errors:[]});
});

test('mixed old, new, free and unowned entries refund only the actual owned excess and preserve other research costs', () => {
  assert.deepEqual(run(game(), `
    const saved=captureGameSaveData();delete saved.abstractionLateResearchPriceVersion;saved.greatTheory='100';
    Object.assign(saved.abstractionResearchState,{'22-1':true,'22-2':true,'22-3':true,'23-2':true,'11-1':true});
    Object.assign(saved.abstractionResearchPaidCosts,{'22-1':4500,'22-2':1200,'22-3':0,'23-1':4500,'23-2':4500,'11-1':8});
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {gt:plain(greatTheory),paid:{...abstractionResearchPaidCosts},refund:abstractionResearchRefund(),errors};
  `), {gt:6700,paid:{'11-1':8,'22-1':1200,'22-2':1200,'22-3':0,'23-2':1200},refund:3608,errors:[]});
});

test('legacy owned research without paid history infers 4500; new-format missing history infers only 1200', () => {
  for(const modern of [false,true]) {
    assert.deepEqual(run(game(), `
      const saved=captureGameSaveData();${modern ? '' : 'delete saved.abstractionLateResearchPriceVersion;'}
      saved.greatTheory='20';saved.abstractionResearchState['22-1']=true;saved.abstractionResearchState['23-1']=true;
      delete saved.abstractionResearchPaidCosts;
      loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
      const first=plain(greatTheory),roundtrip=captureGameSaveData();
      loadGame(JSON.stringify(roundtrip),{persistOverride:false,countAsLoad:false});
      return {first,reloaded:plain(greatTheory),refund:abstractionResearchRefund(),errors};
    `), {first:modern?20:6620,reloaded:modern?20:6620,refund:2400,errors:[]});
  }
});

test('new single and prerequisite purchases cost 1200 each and cannot create a migration refund after save/load', () => {
  assert.deepEqual(run(game(), `
    knuthBaseUpgradeLevels.late_abstraction=1;abstractionResearchState['21-1']=true;greatTheory=2399;
    const blocked=!purchaseResearchWithParents('abstraction','23-2')&&!hasPurchasedAbstractionResearch('22-2');
    greatTheory=2400;const bought=purchaseResearchWithParents('abstraction','23-2');
    const before=plain(greatTheory),saved=captureGameSaveData();
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {blocked,bought,before,after:plain(greatTheory),costs:[abstractionResearchPaidCosts['22-2'],abstractionResearchPaidCosts['23-2']],errors};
  `), {blocked:true,bought:true,before:0,after:0,costs:[1200,1200],errors:[]});
});

test('migrated savings do not change currencies, permanent SP, production progress, presets or the reset reservation', () => {
  assert.deepEqual(run(game(), `
    const saved=captureGameSaveData();delete saved.abstractionLateResearchPriceVersion;
    saved.greatTheory='200';saved.squarePoints='1e100';saved.squareConvergencePoints='1e50';saved.knuthPoints='1e20';
    saved.abstractionPermanentSp='1e70';saved.divergerN='25';saved.abstractionResetOnNextKnuthPoint=true;
    saved.abstractionResearchState['23-3']=true;saved.abstractionResearchPaidCosts['23-3']=4500;
    saved.abstractionResearchPresets[0]={name:'kept',ids:['22-3','23-3']};
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {gt:plain(greatTheory),sp:logValue(squarePoints),cp:logValue(squareConvergencePoints),kp:logValue(knuthPoints),
      permanent:logValue(abstractionPermanentSp),n:plain(divergerN),toggle:abstractionResetOnNextKnuthPoint,
      preset:abstractionResearchPresets[0],errors};
  `), {gt:3500,sp:100,cp:50,kp:20,permanent:70,n:25,toggle:true,preset:{name:'kept',ids:['22-3','23-3']},errors:[]});
});
