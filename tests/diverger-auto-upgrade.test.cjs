const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const automatium = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');
function context(withN = false) {
  const game = vm.createContext({ performance: { now: () => 0 }, document: { getElementById: () => ({}) } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), game);
  }
  vm.runInContext('render = () => {}; knuthUnlocked = true; generalizationResearchState["3-2"] = true;', game);
  if (withN) {
    for (const file of ['n-lexer.js', 'n-parser.js', 'n-runtime.js']) {
      vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/automatium', file), 'utf8'), game);
    }
    const end = automatium.indexOf('\n};\n\nfunction automatiumGameAdapterFor');
    vm.runInContext(automatium.slice(0, end + 4), game);
    vm.runInContext('automatiumBulkRemaining = 4096; automatiumBulkDeadline = 1000;', game);
  }
  return game;
}
function run(source, withN = false) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, context(withN))));
}

test('abstraction 7-1 costs one Great Theory and accepts any completed branch', () => {
  for (const parent of ['6-1', '6-2', '6-3']) {
    assert.deepEqual(run(`
      greatTheory=1;
      const locked=canResearchAbstraction('7-1');
      abstractionResearchState['${parent}']=true;
      const ready=canResearchAbstraction('7-1');
      const bought=researchAbstraction('7-1');
      return [locked,ready,bought,NumberMath.toNumber(greatTheory),canResearchAbstraction('7-1')];
    `), [false,true,true,0,false]);
  }
});

test('auto upgrades cycle fairly through a, b, c and speed using their existing CP prices', () => {
  assert.deepEqual(run(`
    squareConvergencePoints=20000;
    const locked=advanceDivergerAutoUpgrade(1000);
    abstractionResearchState['7-1']=true;
    const changed=advanceDivergerAutoUpgrade(1000);
    return {locked,changed,levels:[divergerALevel,divergerBLevel,divergerCLevel,divergerSpeedLevel],
      cp:NumberMath.toNumber(squareConvergencePoints),a:NumberMath.toNumber(divergerA),b:divergerB,c:divergerC,t:divergerInterval};
  `),{locked:false,changed:true,levels:[1,1,1,1],cp:9900,a:2,b:1.2,c:1,t:997});
});

test('auto toggle, KC2, insufficient CP and production pauses do not purchase upgrades', () => {
  assert.deepEqual(run(`
    abstractionResearchState['7-1']=true;squareConvergencePoints=100000;
    toggleDivergerAutoUpgrade();const off=advanceDivergerAutoUpgrade(1000);
    toggleDivergerAutoUpgrade();activeKnuthChallengeId='kc2';const kc=advanceDivergerAutoUpgrade(1000);
    activeKnuthChallengeId=null;overflowed=true;const overflow=advanceDivergerAutoUpgrade(1000);
    overflowed=false;squareMode=true;const cutscene=advanceDivergerAutoUpgrade(1000);
    squareMode=false;squareConvergencePoints=19;const poor=advanceDivergerAutoUpgrade(1000);
    return [off,kc,overflow,cutscene,poor,divergerALevel,divergerBLevel,divergerCLevel,divergerSpeedLevel];
  `),[false,false,false,false,false,0,0,0,0]);
});

test('time acceleration and automatic upgrade speed apply with a bounded 3-4 batch', () => {
  const result = run(`
    abstractionResearchState['7-1']=true; squareConvergencePoints=NumberMath.fromString('1e1000');
    gameTick = ms => ms*25; autoUpgradeSpeedMultiplier=()=>10;
    advanceDivergerAutoUpgrade(1);
    const acceleratedFirst=divergerALevel;
    generalizationResearchState['3-4']=true;
    gameTick=()=>Infinity;
    advanceDivergerAutoUpgrade(1);
    return {acceleratedFirst,total:divergerALevel+divergerBLevel+divergerCLevel+divergerSpeedLevel,
      levels:[divergerALevel,divergerBLevel,divergerCLevel,divergerSpeedLevel]};
  `);
  assert.equal(result.acceleratedFirst,1);
  assert.equal(result.total,257);
  assert.ok(result.levels.every(n=>n>0));
});

test('auto purchases respect c and speed caps and research survives Knuth reset', () => {
  const result=run(`
    abstractionResearchState['7-1']=true;
    divergerC=99;divergerCLevel=99;divergerInterval=divergerMinInterval();
    squareConvergencePoints=NumberMath.fromString('1e50');
    advanceDivergerAutoUpgrade(1000);
    const capped=[divergerC,divergerCLevel,divergerInterval,divergerSpeedLevel];
    divergerAutoUpgradeEnabled=false;extraPercentLanesEl={innerHTML:''};
    resetProgressForNewKnuthRun();
    return {capped,retained:hasAbstractionResearch('7-1'),enabled:divergerAutoUpgradeEnabled,timer:divergerAutoUpgradeTimer};
  `);
  assert.deepEqual(result,{capped:[99,99,500,0],retained:true,enabled:false,timer:0});
  const save=fs.readFileSync(path.join(__dirname,'../scripts/core/save.js'),'utf8');
  assert.match(save,/divergerAutoUpgradeEnabled\s*\n/);
  assert.match(save,/divergerAutoUpgradeEnabled = d.divergerAutoUpgradeEnabled !== false/);
});

test('N diverger commands require 7-1 but work independently of the auto toggle', () => {
  assert.deepEqual(run(`
    squareConvergencePoints=20000;
    const locked=nUpgradeSnapshot('diverger','a',null).available;
    abstractionResearchState['7-1']=true;divergerAutoUpgradeEnabled=false;
    const result=['a','b','c','speed'].map(id=>automatiumGameAdapter.buy('diverger',id,null,null));
    return {locked,result,levels:['a','b','c','speed'].map(id=>NumberMath.toNumber(nUpgradeSnapshot('diverger',id,null).upgraded)),cp:NumberMath.toNumber(squareConvergencePoints)};
  `,true),{locked:false,result:[true,true,true,true],levels:[1,1,1,1],cp:9900});
});

test('N get reads diverger state, prices, availability and finite caps', () => {
  const result=run(`
    abstractionResearchState['7-1']=true;squareConvergencePoints=100;
    const execution=NRuntime.createExecution(NRuntime.compile('value = number\\nvalue = get.diverger.a.cost'),automatiumGameAdapter);
    for(let i=0;i<10;i++){if(execution.iterator.next().done)break;}
    divergerC=99;divergerCLevel=99;divergerInterval=divergerMinInterval();
    return {value:NumberMath.toNumber(execution.context.variables.get('value').value),
      amax:NumberMath.toNumber(nUpgradeSnapshot('diverger','a',null).max),
      c:nUpgradeSnapshot('diverger','c',null).available,
      speed:nUpgradeSnapshot('diverger','speed',null).available,
      speedMax:NumberMath.toNumber(nUpgradeSnapshot('diverger','speed',null).max)};
  `,true);
  assert.equal(result.value,20);
  assert.equal(result.amax,0);
  assert.equal(result.c,false);
  assert.equal(result.speed,false);
  assert.ok(result.speedMax>0);
});

test('N buy without s skips unaffordable purchases while s blocks and resumes', () => {
  assert.deepEqual(run(`
    abstractionResearchState['7-1']=true;
    const skip=NRuntime.createExecution(NRuntime.compile('buy diverger a'),automatiumGameAdapter);
    let skipped=false;
    for(let i=0;i<5;i++){if(skip.iterator.next().done){skipped=true;break;}}
    const wait=NRuntime.createExecution(NRuntime.compile('buy diverger b s'),automatiumGameAdapter);
    let blocked=false;
    for(let i=0;i<5;i++){const next=wait.iterator.next();if(next.value?.kind==='blocked'){blocked=true;break;}}
    squareConvergencePoints=32;
    let resumed=false;
    for(let i=0;i<5;i++){if(wait.iterator.next().done){resumed=true;break;}}
    return [skipped,blocked,resumed,divergerBLevel,NumberMath.toNumber(squareConvergencePoints)];
  `,true),[true,true,true,1,0]);
});

test('N 3-4 bulk purchases diverger upgrades but still stops at c cap and budget', () => {
  const result=run(`
    abstractionResearchState['7-1']=true;generalizationResearchState['3-4']=true;
    squareConvergencePoints=NumberMath.fromString('1e1000');
    automatiumGameAdapter.buy('diverger','c',null,null);
    const c=divergerCLevel;
    automatiumGameAdapter.buy('diverger','a',null,null);
    return {c,a:divergerALevel,max:AUTOMATIUM_BULK_MAX_PER_COMMAND};
  `,true);
  assert.equal(result.c,99);
  assert.ok(result.a>1 && result.a<=result.max);
});

test('N reference IDs, example and autocomplete include the four diverger upgrades', () => {
  const game=context(true);
  for(const [start,end] of [
    ['function automatiumUpgradeIdRows()', '\nfunction renderAutomatiumUpgradeIds'],
    ['function nAutocompleteUpgradeRows(kind)', '\nfunction nAutocompleteVariables'],
    ['function automatiumProgramExamplesList()', '\nfunction addAutomatiumExample']
  ]) vm.runInContext(automatium.slice(automatium.indexOf(start),automatium.indexOf(end,automatium.indexOf(start))),game);
  const rows=vm.runInContext('nAutocompleteUpgradeRows("diverger").map(row=>row.rawId)',game);
  assert.deepEqual(Array.from(rows),['a','b','c','speed']);
  const example=vm.runInContext('automatiumProgramExamplesList().find(item=>item.id==="all_diverger").source',game);
  assert.doesNotThrow(()=>vm.runInContext(`NRuntime.compile(${JSON.stringify(example)})`,game));
});
