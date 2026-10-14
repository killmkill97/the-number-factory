const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');
function game() {
  const context = vm.createContext({
    performance: { now: () => 0 },
    document: { getElementById: () => ({}) },
    localStorage: { getItem: () => '[]' }
  });
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js',
    'automatium/n-lexer.js', 'automatium/n-parser.js', 'automatium/n-runtime.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context);
  }
  vm.runInContext(source.slice(0, source.indexOf('function setAutomatiumRuntimeStatus(')), context);
  vm.runInContext(`
    render=()=>{};setChapter=()=>{};log=()=>{};extraPercentLanesEl={innerHTML:''};
    knuthUnlocked=true;hasClaimedKnuthPoint=true;knuthPoints=2;
    function readyKnuth() {
      abstractionResearchState['2-2']=true;
      for(const id of ['8-1','7-1','7-2','5-3','5-4'])generalizationResearchState[id]=true;
    }
    function executeUntilPause(execution) {
      const events=[];
      for(let i=0;i<40;i++) {
        const result=execution.iterator.next();
        if(result.done)return {done:true,events};
        events.push(result.value);
        if(result.value?.kind==='blocked')return {done:false,events};
      }
      throw new Error('Execution did not pause within its bounded test budget');
    }
  `, context);
  return context;
}
function run(context, code) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${code}})()`, context)));
}

test('abstraction 2-2 requires only 1-1, costs one Great Theory, and does not change the 3-1 parent', () => {
  assert.deepEqual(run(game(), `
    greatTheory=2;
    const locked=canResearchAbstraction('2-2');
    const parent=researchAbstraction('1-1');
    const bought=researchAbstraction('2-2');
    const research=ABSTRACTION_RESEARCHES.find(r=>r.id==='2-2');
    return {locked,parent,bought,repeat:researchAbstraction('2-2'),balance:NumberMath.toNumber(greatTheory),
      column:research.column,row:research.row,cost:research.greatTheoryCost,parents:research.parents,
      oldParent:ABSTRACTION_RESEARCHES.find(r=>r.id==='3-1').parents};
  `), { locked:false,parent:true,bought:true,repeat:false,balance:0,column:2,row:2,cost:1,
    parents:['1-1'],oldParent:['2-1'] });
});

test('N parses bare, target, parenthesized, waiting and scientific KP commands without changing SP/CP', () => {
  const result = run(game(), String.raw`
    return NRuntime.compile('kp\nkp 5\nkp (5) s\nkp s\nkp 1e100 s\nsp 5\ncp 5 s\nsquare').statements
      .map(s=>({type:s.type,currency:s.currency,wait:s.wait,target:s.amount!==null}));
  `);
  assert.deepEqual(result, [
    ['kp',false,false],['kp',false,true],['kp',true,true],['kp',true,false],['kp',true,true],
    ['sp',false,true],['cp',true,true],['sp',false,false]
  ].map(([currency,wait,target]) => ({type:'PointExchange',currency,wait,target})));
});

test('the adapter respects research, the first-claim cutscene, manual prerequisites and active challenges', () => {
  assert.deepEqual(run(game(), `
    squareConvergencePoints=NumberMath.fromString('1e150');
    const locked=automatiumGameAdapter.kp(null);
    abstractionResearchState['2-2']=true;
    const missing=automatiumGameAdapter.kp(null);
    readyKnuth();hasClaimedKnuthPoint=false;
    const firstClaim=automatiumGameAdapter.kp(null);
    hasClaimedKnuthPoint=true;activeKnuthChallengeId='kc1';
    const challenge=automatiumGameAdapter.kp(null);
    activeKnuthChallengeId=null;generalizationResearchState['5-4']=false;
    const missingParent=automatiumGameAdapter.kp(null);
    return {locked,missing,firstClaim,challenge,missingParent,kp:knuthPoints,cp:NumberMath.serialize(squareConvergencePoints)};
  `), {locked:false,missing:false,firstClaim:false,challenge:false,missingParent:false,kp:2,cp:'1e150'});
});

test('bare kp uses the real exchange, awards the existing integer reward and resets ordinary progress', () => {
  assert.deepEqual(run(game(), `
    readyKnuth();squareUnlocked=true;squarePoints=100;squareConvergencePoints=NumberMath.fromString('1e60');
    setBaseNumber(12345);
    const execution=NRuntime.createExecution(NRuntime.compile('kp'),automatiumGameAdapterFor('test'));
    const result=executeUntilPause(execution);
    return {done:result.done,kp:NumberMath.serialize(knuthPoints),sp:squarePoints,cp:squareConvergencePoints,
      number:NumberMath.toNumber(getBaseNumber()),ready:canManuallyExchangeKnuthPoints(),retained:hasAbstractionResearch('2-2')};
  `), {done:true,kp:'6',sp:0,cp:0,number:0,ready:false,retained:true});
});

test('a target uses reward rather than owned KP, and no-s failures skip to the next statement', () => {
  assert.deepEqual(run(game(), String.raw`
    readyKnuth();knuthPoints=1000;squareConvergencePoints=NumberMath.fromString('1e60');
    const execution=NRuntime.createExecution(NRuntime.compile('kp 5\nx = number\nx = 7'),automatiumGameAdapter);
    const result=executeUntilPause(execution);
    return {done:result.done,blocked:result.events.some(e=>e.kind==='blocked'),x:execution.context.variables.get('x').value,
      kp:knuthPoints,cp:NumberMath.serialize(squareConvergencePoints)};
  `), {done:true,blocked:false,x:7,kp:1000,cp:'1e60'});
});

test('kp target s blocks only this execution and resumes once the actual reward meets its target', () => {
  assert.deepEqual(run(game(), String.raw`
    readyKnuth();squareConvergencePoints=NumberMath.fromString('1e60');
    const execution=NRuntime.createExecution(NRuntime.compile('target = number\ntarget = 5\nkp (target) s\nx = number\nx = 9'),automatiumGameAdapterFor('test'));
    const blocked=executeUntilPause(execution);
    const untouched=knuthPoints===2;
    squareConvergencePoints=NumberMath.fromString('1e75');
    const resumed=executeUntilPause(execution);
    return {blocked:!blocked.done,message:blocked.events.at(-1).message,untouched,done:resumed.done,
      kp:NumberMath.toNumber(knuthPoints),x:execution.context.variables.get('x').value};
  `), {blocked:true,message:'5 KP 획득 대기',untouched:true,done:true,kp:7,x:9});
});

test('kp s can wait for the new research and manual unlock instead of bypassing either condition', () => {
  assert.deepEqual(run(game(), `
    squareConvergencePoints=NumberMath.fromString('1e60');
    const execution=NRuntime.createExecution(NRuntime.compile('kp s'),automatiumGameAdapter);
    const locked=executeUntilPause(execution);
    abstractionResearchState['2-2']=true;
    const missing=executeUntilPause(execution);
    readyKnuth();
    const done=executeUntilPause(execution);
    return {locked:!locked.done,missing:!missing.done,done:done.done,kp:NumberMath.toNumber(knuthPoints)};
  `), {locked:true,missing:true,done:true,kp:6});
});

test('large scientific KP targets include all current KP reward upgrades', () => {
  assert.deepEqual(run(game(), `
    readyKnuth();abstractionResearchState['8-1']=true;
    squareConvergencePoints=NumberMath.fromString('1e1515');
    const skipped=NRuntime.createExecution(NRuntime.compile('kp 1e101'),automatiumGameAdapter);
    executeUntilPause(skipped);
    const untouched=knuthPoints===2;
    const execution=NRuntime.createExecution(NRuntime.compile('kp 1e100 s'),automatiumGameAdapter);
    const result=executeUntilPause(execution);
    return {untouched,done:result.done,correct:compareNumberValues(knuthPoints,'1e100')===0};
  `), {untouched:true,done:true,correct:true});
  assert.deepEqual(run(game(), `
    readyKnuth();squareConvergencePoints=NumberMath.fromString('1e60');
    knuthBaseUpgradeLevels.kp_gain=1;abstractionResearchState['13-2']=true;
    const expected=knuthPointGain();
    const targetTooHigh=automatiumGameAdapter.kp(null,111);
    const bought=automatiumGameAdapter.kp(null,110);
    return {expected:NumberMath.toNumber(expected),targetTooHigh,bought,kp:NumberMath.toNumber(knuthPoints)};
  `), {expected:110,targetTooHigh:false,bought:true,kp:112});
});

test('the new flag round-trips, defaults off for old saves, and participates in the existing KP reset refund', () => {
  assert.deepEqual(run(game(), `
    greatTheory=2;researchAbstraction('1-1');researchAbstraction('2-2');
    const saved=JSON.parse(JSON.stringify({...abstractionResearchState}));
    loadAbstractionResearchState(saved);const restored=hasAbstractionResearch('2-2');
    loadAbstractionResearchState({'1-1':true});const legacy=hasAbstractionResearch('2-2');
    loadAbstractionResearchState(saved);readyKnuth();squareConvergencePoints=NumberMath.fromString('1e60');
    abstractionResetOnNextKnuthPoint=true;
    const bought=automatiumGameAdapter.kp(null);
    return {restored,legacy,bought,refunded:NumberMath.toNumber(greatTheory),cleared:!hasAbstractionResearch('2-2'),
      toggle:abstractionResetOnNextKnuthPoint};
  `), {restored:true,legacy:false,bought:true,refunded:2,cleared:true,toggle:false});
});

test('KP target validation, syntax help and completion all expose the new command consistently', () => {
  for (const command of ['kp 0','kp (-1)','kp 1.5','kp true']) {
    const context = game();
    assert.throws(() => vm.runInContext(`
      const execution=NRuntime.createExecution(NRuntime.compile(${JSON.stringify(command)}),automatiumGameAdapter);
      executeUntilPause(execution);
    `, context), /KP 목표|number/);
  }
  assert.match(source, /<h4>SP·CP·KP 획득<\/h4>/);
  assert.match(source, /kp \(5\) s/);
  assert.match(source, /label: 'kp', insert: 'kp ', detail: '목표 KP 지정 가능 · 추상화 2-2'/);
  const context = game();
  vm.runInContext(source.slice(source.indexOf('function nAutocompleteVariables('),
    source.indexOf('function hideAutomatiumAutocomplete(')), context);
  assert.deepEqual(run(context, String.raw`
    automatiumSource.value='k';automatiumSource.selectionStart=1;
    const keyword=nAutocompleteContext().items.map(item=>item.label);
    automatiumSource.value='target = number\nkp ';
    automatiumSource.selectionStart=automatiumSource.value.length;
    const targets=nAutocompleteContext().items.map(item=>({label:item.label,detail:item.detail}));
    return {keyword,targets};
  `), {keyword:['kp'],targets:[
    {label:'1',detail:'목표 KP'},
    {label:'target',detail:'목표 KP 변수'},
    {label:'s',detail:'획득 가능할 때까지 대기'}
  ]});
});
