const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function game() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context);
  }
  const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/number-black-hole.js'), 'utf8');
  vm.runInContext(source.slice(0, source.indexOf('numberBlackHoleAmountUpgradeBtn.addEventListener')), context);
  vm.runInContext('knuthUnlocked=true;numberBlackHoleSystemEnabled=true;', context);
  return context;
}
function run(source) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, game())));
}

test('linear acceleration equals max one or 200 times radius divided by 0.5', () => {
  const data = run(`
    return [0,0.001,0.5,1,10,100].map(radius=>{
      numberBlackHoleSchwarzschildRadius=()=>numberValueFromReal(radius);
      return numberBlackHoleTimeMultiplier();
    });
  `);
  for (const [index, expected] of [1,1,200,400,4000,40000].entries()) {
    assert.ok(Math.abs(data[index]/expected-1)<1e-10);
  }
});

test('zero investment and disabled or locked systems still give neutral acceleration', () => {
  assert.deepEqual(run(`
    const zero={radius:NumberMath.toNumber(numberBlackHoleSchwarzschildRadius()),time:numberBlackHoleTimeMultiplier()};
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    numberBlackHoleSystemEnabled=false;const disabled=numberBlackHoleTimeMultiplier();
    numberBlackHoleSystemEnabled=true;knuthUnlocked=false;const locked=numberBlackHoleTimeMultiplier();
    return {zero,disabled,locked};
  `), {zero:{radius:0,time:1},disabled:1,locked:1});
});

test('radius and acceleration follow the new equations for small and giant investments', () => {
  for (const p of [1,10,100]) {
    const rows=run(`
      numberBlackHoleDonationPercent=${p};
      return ['0.001','1','1000','1e100','1e2000000'].map(text=>{
        numberBlackHoleTotalInvested=NumberMath.fromString(text);
        return {text,radius:NumberMath.toNumber(numberBlackHoleSchwarzschildRadius()),time:numberBlackHoleTimeMultiplier()};
      });
    `);
    let previous=0;
    for(const row of rows) {
      const L=row.text.includes('e')?Number(row.text.split('e')[1]):Math.log10(1+Number(row.text));
      const expectedRadius=Math.log10(1+L**(1+Math.log10(1+p)));
      const expectedTime=Math.max(1,200*(expectedRadius/0.5));
      assert.ok(Math.abs(row.radius-expectedRadius)<1e-9,JSON.stringify({p,...row}));
      assert.ok(Math.abs(row.time/expectedTime-1)<1e-9,JSON.stringify({p,...row}));
      assert.ok(row.time>=previous);
      previous=row.time;
    }
  }
});

test('layered investments never overflow or erase the radius and respect the existing acceleration cap', () => {
  const rows=run(`
    numberBlackHoleDonationPercent=100;
    return ['1e1e100','1e1e1000','1e1e1e1000'].map(text=>{
      numberBlackHoleTotalInvested=NumberMath.fromString(text);
      const radius=numberBlackHoleSchwarzschildRadius();
      const time=numberBlackHoleTimeMultiplier();
      return {positive:isPositiveNumberValue(radius),time,finite:Number.isFinite(time),radius:NumberMath.serialize(radius)};
    });
  `);
  for(const row of rows) {
    assert.equal(row.positive,true);
    assert.equal(row.finite,true);
    assert.ok(row.time>=1&&row.time<=1e100);
    assert.doesNotMatch(row.radius,/NaN|undefined|Infinity/);
  }
  assert.equal(rows.at(-1).time,1e100);
});

test('donation frequency stays on real time while game time and accumulated time use the new boost', () => {
  const result=run(`
    numberBlackHoleDonationPercent=1;numberBlackHoleDonationRate=1;
    numberBlackHoleTotalInvested=10 ** ((10 ** 0.5-1) ** (1/(1+Math.log10(2))))-1;
    const before=numberBlackHoleTotalInvested;
    const gameMs=gameTick(1000);
    setBaseNumber(1000);
    const changed=advanceNumberBlackHole(1000);
    return {changed,gameMs,number:NumberMath.toNumber(getBaseNumber()),
      spent:NumberMath.toNumber(subtractNumberValues(numberBlackHoleTotalInvested,before)),
      accumulated:NumberMath.toNumber(numberBlackHoleAccumulatedGameSeconds)};
  `);
  assert.equal(result.changed,true);
  assert.ok(Math.abs(result.gameMs/200000-1)<1e-5);
  assert.ok(Math.abs(result.accumulated/200-1)<1e-5);
  assert.ok(Math.abs(result.number-990)<1e-10);
  assert.ok(Math.abs(result.spent-10)<1e-10);
});
