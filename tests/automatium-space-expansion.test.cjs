const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const source=fs.readFileSync(path.join(__dirname,'../scripts/systems/automatium.js'),'utf8');
function ready(unlocked=true) {
  const ctx=game(true);
  ctx.loadSource(`knuthBaseUpgradeLevels.space_expansion=1;spaceExpansionOneTimeUpgradeState.n_automation=${unlocked};
    function query(...names){return automatiumGameAdapter.get(names.map(name=>({name,index:null})),{});}`);
  return ctx;
}

test('start/end compile as dedicated N statements, rejecting ambiguous toggles and malformed arguments',()=>{
  assert.deepEqual(run(ready(),String.raw`
    const valid=executeN('space_expansion start\nspace_expansion end');
    let invalid=0;for(const text of ['space_expansion','space_expansion toggle','space_expansion start s']){
      try{NRuntime.compile(text);}catch{invalid++;}
    }return {valid,invalid,active:spaceExpansionActive};
  `),{valid:true,invalid:3,active:false});
});

test('automation ownership gates all new values and commands without spending or resetting anything when locked',()=>{
  assert.deepEqual(run(ready(false),`
    let denied=0;for(const names of [['higgs'],['sm'],['space_expansion','active'],['space_expansion','higgs_gain']]){
      try{query(...names);}catch(e){if(e.message.includes('자동화'))denied++;}
    }squareConvergencePoints=123;executeN('space_expansion start');
    return {denied,active:spaceExpansionActive,cp:plain(squareConvergencePoints)};
  `),{denied:4,active:false,cp:123});
});

test('get.higgs and get.sm expose NumberMath balances in mg and support scientific expressions',()=>{
  assert.deepEqual(run(ready(),String.raw`
    higgsParticles=NumberMath.fromString('1e1000');stagnantMassMg=NumberMath.fromString('1e1e100');
    const same=compareNumberValues(query('higgs'),higgsParticles)===0&&compareNumberValues(query('sm'),stagnantMassMg)===0;
    const program=executeN('if get.higgs >= 1e1000 {\n    if get.sm >= 1e1e100 {\n        space_expansion start\n    }\n}');
    return {same,program,active:query('space_expansion','active')};
  `),{same:true,program:true,active:true});
});

test('start/end are idempotent, compute pre-reset rewards once and keep ordinary prestige restrictions',()=>{
  assert.deepEqual(run(ready(),String.raw`
    higgsParticles=15;
    squareConvergencePoints=NumberMath.fromString('1e1000');executeN('space_expansion start\nspace_expansion start');
    const cleared=plain(squareConvergencePoints),notAwarded=plain(higgsParticles);
    squareConvergencePoints=NumberMath.fromString('1e100');const quote=plain(query('space_expansion','higgs_gain'));
    executeN('space_expansion end\nspace_expansion end');
    return {cleared,notAwarded,quote,h:plain(higgsParticles),active:spaceExpansionActive,cp:plain(squareConvergencePoints)};
  `),{cleared:0,notAwarded:15,quote:985,h:1000,active:false,cp:0});
});

test('higgs_gain means the record increase even if a removed legacy flag is present',()=>{
  assert.deepEqual(run(ready(),`
    higgsParticles=2000;const off=plain(query('space_expansion','higgs_gain'));spaceExpansionActive=true;
    squareConvergencePoints=NumberMath.fromString('1e100');const capped=plain(query('space_expansion','higgs_gain'));
    spaceExpansionOneTimeUpgradeState.higgs_addition=true;const additive=plain(query('space_expansion','higgs_gain'));
    return {off,capped,additive};
  `),{off:0,capped:0,additive:0});
});

test('commands cannot enter during KC, first-KP claim or without the space expansion system',()=>{
  assert.deepEqual(run(ready(),`
    startKnuthChallenge('kc1');executeN('space_expansion start');const kc=!spaceExpansionActive;
    abandonKnuthChallenge();pendingKnuthPointClaim=true;executeN('space_expansion start');const pending=!spaceExpansionActive;
    pendingKnuthPointClaim=false;knuthBaseUpgradeLevels.space_expansion=0;executeN('space_expansion start');
    return {kc,pending,locked:!spaceExpansionActive,h:plain(higgsParticles)};
  `),{kc:true,pending:true,locked:true,h:0});
});

test('program-specific adapters include the new command while ownership survives research reset',()=>{
  const ctx=ready();ctx.loadSource(source.slice(source.indexOf('function automatiumGameAdapterFor('),source.indexOf('function setAutomatiumRuntimeStatus(')));
  assert.deepEqual(run(ctx,`
    abstractionResearchState['30-1']=true;abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    const adapter=automatiumGameAdapterFor('test');const started=adapter.spaceExpansion('start',{});
    return {started,active:spaceExpansionActive,research:hasAbstractionResearch('30-1'),owned:spaceExpansionNUnlocked()};
  `),{started:true,active:true,research:false,owned:true});
});

test('autocomplete offers only unlocked expansion values/actions and documentation states the mass unit',()=>{
  const ctx=ready(false);
  ctx.loadSource(source.slice(source.indexOf('function nAutocompleteUpgradeRows('),source.indexOf('function createAutomatiumProgramRow(')));
  assert.deepEqual(run(ctx,`
    function labels(text){automatiumSource.value=text;automatiumSource.selectionStart=text.length;automatiumSource.selectionEnd=text.length;
      return nAutocompleteContext()?.items.map(item=>item.label)??[];}
    const locked=labels('get.h').includes('higgs');spaceExpansionOneTimeUpgradeState.n_automation=true;
    return {locked,values:[...labels('get.h'),...labels('get.sm'),...labels('get.space_')].filter(v=>['higgs','sm','space_expansion'].includes(v)),
      queries:labels('get.space_expansion.'),commands:labels('space_expansion ')};
  `),{locked:false,values:['higgs','sm','space_expansion'],queries:['active','higgs_gain'],commands:['start','end']});
  assert.match(source,/get\.sm.*정체된 질량.*mg/);assert.match(source,/space_expansion start/);
});
