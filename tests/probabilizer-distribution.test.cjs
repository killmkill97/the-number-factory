const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function graphGame() {
  const ctx = game(true);
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/systems/probabilizer.js'), 'utf8'));
  ctx.loadSource(`const graphWrites=[];
    probabilizerDistribution.setAttribute=(name,value)=>graphWrites.push({name,value});
    knuthBaseUpgradeLevels.probabilizer=1;`);
  return ctx;
}

test('distribution follows the same triangular peak as the shifted sampler, without consuming randomness', () => {
  const rows=run(graphGame(), `
    Math.random=()=>{throw Error('visualization must not draw random numbers');};
    return [0,25,50].map(shift=>{
      probabilizerUpgradeLevels.shift=shift;renderProbabilizerBoard();
      const {a,b,mode}=probabilizerParameters();
      return {a,b,mode,path:graphWrites.at(-1).value};
    });
  `);
  for(const row of rows){
    const peak=100*(row.mode-row.a)/(row.b-row.a);
    assert.equal(row.path,`M 0 100 L ${peak} 8 L 100 100 Z`);
    assert.ok(peak>=50&&peak<=100);
  }
  assert.equal(rows[2].mode,100);
});

test('graph is cached by range and peak, not by power, interval or timer ticks; it cannot change game state', () => {
  assert.deepEqual(run(graphGame(), `
    randomPower=100;probabilizerTimerMs=123;probabilizerLastRoll=55;
    const before=JSON.stringify(captureGameSaveData());
    renderProbabilizerBoard();for(let i=0;i<100;i++)renderProbabilizerBoard();
    const unchanged=before===JSON.stringify(captureGameSaveData()),writes=graphWrites.length;
    randomPower=1000;probabilizerUpgradeLevels.speed=1;renderProbabilizerBoard();
    const unrelated=graphWrites.length===writes;
    probabilizerUpgradeLevels.b=1;renderProbabilizerBoard();
    return {unchanged,writes,unrelated,rangeUpdated:graphWrites.length===writes+1};
  `),{unchanged:true,writes:1,unrelated:true,rangeUpdated:true});
});

test('collapsed, fractional and maximum ranges have finite paths, with only one label at a single outcome', () => {
  const rows=run(graphGame(), `return [
    {a:0,b:0,speed:0,shift:0}, {a:3,b:5,speed:0,shift:30},
    {a:10000,b:10000,speed:0,shift:10000}, {a:0,b:10000,speed:0,shift:0}
  ].map(levels=>{
    probabilizerUpgradeLevels=levels;renderProbabilizerBoard();
    return {...probabilizerParameters(),path:graphWrites.at(-1).value,
      labels:probabilizerTicks.map(tick=>tick.style.visibility)};
  });`);
  for(const row of rows){
    assert.doesNotMatch(row.path,/NaN|Infinity|undefined/);
    if(row.a===row.b){assert.equal(row.path,'M 50 100 L 50 8');
      assert.deepEqual(row.labels,['hidden','hidden','visible','hidden','hidden']);}
    else assert.ok(row.labels.every(label=>label==='visible'));
  }
});

test('shifted rolls have the probability trend shown by the graph', () => {
  const row=run(graphGame(), `
    probabilizerUpgradeLevels.shift=25;renderProbabilizerBoard();
    let seed=1234;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const bins=[0,0,0,0];
    for(let i=0;i<50000;i++){const value=rollProbabilizer(random);bins[Math.min(3,Math.floor((value-1)/25))]++;}
    return {bins,path:graphWrites.at(-1).value};
  `);
  assert.ok(row.bins[1]>row.bins[0]);
  assert.ok(row.bins[2]>row.bins[1]);
  assert.ok(row.bins[2]>row.bins[3]);
});
