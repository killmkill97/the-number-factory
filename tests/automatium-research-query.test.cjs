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
    render=()=>{};log=()=>{};
    function readyResearch() {
      hasEverEarnedSquareConvergencePoint=true;hasClaimedKnuthPoint=true;theory=160;
      for(const id of ['7-1','7-2','5-3','5-4'])generalizationResearchState[id]=true;
    }
    function execute(code) {
      const execution=NRuntime.createExecution(NRuntime.compile(code),automatiumGameAdapter);
      for(let i=0;i<500;i++) {
        const result=execution.iterator.next();
        if(result.value?.kind==='blocked')throw Error('Unexpected wait');
        if(result.done)return Object.fromEntries([...execution.context.variables].map(([name,v])=>[name,v.value]));
      }
      throw Error('Test program exceeded its execution budget');
    }
    function query(expression) {
      const type=expression.endsWith('.available')?'boolean':'number';
      const execution=NRuntime.createExecution(NRuntime.compile('value = '+type+'\\nvalue = '+expression),automatiumGameAdapter);
      for(let i=0;i<10;i++) {
        const result=execution.iterator.next();
        if(result.done)return execution.context.variables.get('value').value;
      }
      throw Error('Query did not finish');
    }
  `, context);
  return context;
}

function run(context, code) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${code}})()`, context)));
}

test('all registered research IDs parse as a single get path segment for both aliases', () => {
  const context = game();
  assert.equal(vm.runInContext(`GENERALIZATION_RESEARCHES.every(research =>
    ['gz','generalization'].every(kind => {
      const program=NRuntime.compile('if get.'+kind+'.'+research.id+'.available == false {\\nwait 1ms\\n}');
      const condition=program.statements[0].branches[0].condition;
      return condition.type==='Binary' && condition.operator==='==' && condition.right.value===false
        && condition.left.path.map(segment=>segment.name).join('.')===kind+'.'+research.id+'.available';
    }))`, context), true);
});

test('the reported if condition executes its false-availability branch and changes when research is available', () => {
  for (const ready of [false, true]) {
    const context = game();
    if (ready) vm.runInContext('readyResearch()', context);
    assert.deepEqual(run(context, String.raw`
      return execute('result = number\nif get.gz.8-1.available == false {\nresult = 1\n}\nelse {\nresult = 2\n}');
    `), { result: ready ? 2 : 1 });
  }
});

test('available uses the existing CP-history, prerequisites, Theory, completion and KC3 gates', () => {
  assert.deepEqual(run(game(), `
    readyResearch();
    const getAvailable=()=>query('get.gz.8-1.available');
    const ready=getAvailable();
    theory=159;const poor=getAvailable();
    theory=160;hasEverEarnedSquareConvergencePoint=false;const noCp=getAvailable();
    hasEverEarnedSquareConvergencePoint=true;generalizationResearchState['5-4']=false;const noParent=getAvailable();
    generalizationResearchState['5-4']=true;activeKnuthChallengeId='kc3';const challenge=getAvailable();
    activeKnuthChallengeId=null;generalizationResearchState['8-1']=true;const complete=getAvailable();
    return {ready,poor,noCp,noParent,challenge,complete};
  `), {ready:true,poor:false,noCp:false,noParent:false,challenge:false,complete:false});
});

test('research properties are read-only, report Theory cost, and update after an existing buy command', () => {
  assert.deepEqual(run(game(), String.raw`
    readyResearch();
    function properties() {
      return Object.fromEntries(['upgraded','amount','cost','max','available'].map(property=>
        [property,query('get.generalization.8-1.'+property)]));
    }
    const before=properties();const unchanged=theory===160&&!generalizationResearchState['8-1'];
    execute('if get.gz.8-1.available {\nbuy gz 8-1\n}');
    return {before,unchanged,after:properties(),theory};
  `), {before:{upgraded:0,amount:0,cost:160,max:1,available:true},unchanged:true,
    after:{upgraded:1,amount:1,cost:0,max:1,available:false},theory:0});
});

test('queries retain effective unlock semantics for permanently unlocked production research', () => {
  assert.deepEqual(run(game(), `
    knuthEquippedUpgradeIds.add('permanent_production');
    return {purchased:generalizationResearchState['3-1'],
      upgraded:query('get.gz.3-1.upgraded'),amount:query('get.gz.3-2.amount'),
      cost:query('get.gz.3-1.cost'),available:query('get.gz.3-2.available')};
  `), {purchased:false,upgraded:1,amount:1,cost:0,available:false});
});

test('research paths coexist with arithmetic, logical operators, existing get paths and buy syntax', () => {
  assert.deepEqual(run(game(), String.raw`
    readyResearch();squarePoints=100;
    return execute('result = number\nflag = boolean\nresult = get.gz.8-1.cost - 1\n'
      +'flag = not get.gz.8-1.available or get.generalization.8-1.max == 1 and get.sp >= 100');
  `), {result:159,flag:true});
  const ast = vm.runInContext(`NRuntime.compile('value = number\\nvalue = get.base.percent_power.amount[2]\\nbuy generalization 2-2')`, game());
  assert.equal(ast.statements[1].expression.path[2].index.value, 2);
  assert.equal(ast.statements[2].upgrade, '2-2');
});

test('unknown research, unsupported properties, lane indices and malformed IDs still fail clearly', () => {
  for (const [expression, message] of [
    ['get.gz.99-99.available', /알 수 없는 일반화 연구/],
    ['get.gz.8-1.missing', /알 수 없는 업그레이드 내용/],
    ['get.gz.8-1.cost[2]', /레인 번호를 사용할 수 없습니다/],
    ['get.gz.8-1[2].cost', /맨 뒤에 붙여야/],
    ['get.gz.8-.available', /get 뒤에 값 이름/],
    ['get.gz.8-1.5.available', /get 뒤에 값 이름/],
    ['get.base.8-1.available', /get 뒤에 값 이름/]
  ]) {
    const context = game();
    assert.throws(() => vm.runInContext(`query(${JSON.stringify(expression)})`, context), message);
  }
  assert.throws(() => vm.runInContext("NRuntime.compile('if get.gz.8-1.available == false')", game()), /'\{'가 필요/);
});

test('completion recognizes research kinds, partial numeric IDs and properties inside conditions', () => {
  const context = game();
  vm.runInContext(source.slice(source.indexOf('function nAutocompleteUpgradeRows('),
    source.indexOf('function hideAutomatiumAutocomplete(')), context);
  for (const [input, expected] of [
    ['get.g',['generalization','gz']],
    ['get.gz.8',['8-1']],
    ['get.generalization.8-',['8-1']],
    ['get.gz.8-1.',['upgraded','amount','cost','max','available']],
    ['if get.gz.8-1.av',['available']],
    ['if get.generalization.8-1.up',['upgraded']]
  ]) {
    assert.deepEqual(run(context, `
      automatiumSource.value=${JSON.stringify(input)};automatiumSource.selectionStart=automatiumSource.value.length;
      return nAutocompleteContext().items.map(item=>item.label);
    `), expected);
  }
  assert.match(source, /get\.gz\.8-1\.available == false \{/);
  assert.match(source, /조회: get\.gz\.ID\.내용/);
});
