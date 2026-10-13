const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function run(source) {
  const game = vm.createContext({ performance: { now: () => 0 }, document: {getElementById: () => ({})} });
  for (const file of ['core/constants.js','core/number-math.js','core/state.js',
    'automatium/n-lexer.js','automatium/n-parser.js','automatium/n-runtime.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts',file),'utf8'),game);
  }
  const adapter = fs.readFileSync(path.join(__dirname,'../scripts/systems/automatium.js'),'utf8');
  vm.runInContext(adapter.slice(0,adapter.indexOf('\n};\n\nfunction automatiumGameAdapterFor')+4),game);
  const convergence = fs.readFileSync(path.join(__dirname,'../scripts/systems/square-convergence.js'),'utf8');
  vm.runInContext(convergence.slice(convergence.indexOf('function buySquareConvergenceUpgrade('),
    convergence.indexOf('\nfunction squareConvergenceCostText(')),game);
  vm.runInContext('render=()=>{};squareConvergenceUnlocked=true;automatiumBulkRemaining=2048;automatiumBulkDeadline=1000;',game);
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${source}})()`,game)));
}

test('N repeatedly buys cp_gain_5x using the actual price and skips when CP is insufficient', () => {
  assert.deepEqual(run(`
    squareConvergencePoints=155;
    const results=[];
    for(let i=0;i<4;i++) results.push(automatiumGameAdapter.buy('square_convergence','cp_gain_5x',null,null));
    const snapshot=nConvergenceUpgradeSnapshot('cp_gain_5x',null);
    return {results,level:NumberMath.toNumber(snapshot.upgraded),amount:NumberMath.toNumber(snapshot.amount),
      cost:NumberMath.toNumber(snapshot.cost),max:snapshot.max,available:snapshot.available,cp:NumberMath.toNumber(squareConvergencePoints)};
  `),{results:[true,true,true,false],level:3,amount:125,cost:625,max:0,available:false,cp:0});
});

test('N snapshots follow price changes at levels 8 and 32 without marking the upgrade complete', () => {
  assert.deepEqual(run(`
    const upgrade=SQUARE_CONVERGENCE_UPGRADES.find(item=>item.id==='cp_gain_5x');
    squareConvergenceUpgradeState.cp_gain_5x=true;
    return [1,8,32,40].map(level=>{
      squareConvergenceUpgradeLevels.cp_gain_5x=level;
      const cost=squareConvergenceUpgradeCost(upgrade);
      squareConvergencePoints=cost;
      const snapshot=nConvergenceUpgradeSnapshot('cp_gain_5x',null);
      return [snapshot.available,snapshot.max,compareNumberValues(snapshot.cost,cost),
        compareNumberValues(snapshot.amount,NumberMath.power(5,level))];
    });
  `),Array.from({length:4},()=>[true,0,0,0]));
});

test('3-4 bulk buys multiple CP gain levels and stops at the affordable level', () => {
  assert.deepEqual(run(`
    generalizationResearchState['3-4']=true;squareConvergencePoints=155;
    const bought=automatiumGameAdapter.buy('square_convergence','cp_gain_5x',null,null);
    return [bought,squareConvergenceUpgradeLevel('cp_gain_5x'),NumberMath.toNumber(squareConvergencePoints)];
  `),[true,3,0]);
});

test('N s waits after the first level and resumes once the next actual price is affordable', () => {
  assert.deepEqual(run(`
    squareConvergencePoints=5;
    automatiumGameAdapter.buy('square_convergence','cp_gain_5x',null,null);
    const program=NRuntime.createExecution(NRuntime.compile('buy square_convergence cp_gain_5x s'),automatiumGameAdapter);
    let blocked=false;
    for(let i=0;i<5;i++){if(program.iterator.next().value?.kind==='blocked'){blocked=true;break;}}
    squareConvergencePoints=25;
    let done=false;
    for(let i=0;i<5;i++){if(program.iterator.next().done){done=true;break;}}
    return [blocked,done,squareConvergenceUpgradeLevel('cp_gain_5x'),NumberMath.toNumber(squareConvergencePoints)];
  `),[true,true,2,0]);
});

test('one-time convergence upgrades remain unavailable after purchase', () => {
  assert.deepEqual(run(`
    squareConvergencePoints=10;
    const first=automatiumGameAdapter.buy('square_convergence','timium',null,null);
    const second=automatiumGameAdapter.buy('square_convergence','timium',null,null);
    const snapshot=nConvergenceUpgradeSnapshot('timium',null);
    return [first,second,NumberMath.toNumber(snapshot.upgraded),snapshot.amount,snapshot.cost,snapshot.max,snapshot.available];
  `),[true,false,1,2048,0,1,false]);
});
