const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {game, run} = require('./helpers/kc4-game.cjs');

test('abstraction height uses its own viewport offset on desktop and mobile, overriding the shared class', () => {
  const css=fs.readFileSync(path.join(__dirname,'../styles/number-tycoon.css'),'utf8');
  const rules=[...css.matchAll(/\.generalization-tree\.abstraction-tree-theme\s*\{\s*height:\s*([^;]+);/g)];
  assert.equal(rules.length,2);
  assert.match(rules[0][1],/max\(620px, calc\(200dvh - var\(--abstraction-tree-top, 0px\)\)\)/);
  assert.match(rules[1][1],/max\(560px, calc\(200dvh - var\(--abstraction-tree-top, 0px\)\)\)/);
});

for (const type of ['generalization', 'abstraction']) {
  test(`${type} background and hit area grow below the original viewport without a fixed lower limit`, () => {
    const r=run(game(), `
      window.visualViewport={height:800};window.innerHeight=900;
      const tree=${type}Tree,updates=[];
      tree.style.setProperty=(name,value)=>updates.push({name,value});
      const positions=[500,0,-500,-10000,-1000000];
      for(const top of positions){tree.getBoundingClientRect=()=>({top});update${type==='generalization'?'Generalization':'Abstraction'}TreeViewportExtent();}
      return {updates,positions};
    `);
    assert.deepEqual(r.updates.map(u=>u.name),r.positions.map(()=>`--${type}-tree-top`));
    assert.deepEqual(r.updates.map(u=>u.value),r.positions.map(top=>`${top}px`));
    for(let i=0;i<r.positions.length;i++){
      const top=r.positions[i],height=Math.max(620,1600-parseFloat(r.updates[i].value));
      assert.ok(top+height>=1600);
      if(top<0)assert.ok(height>800);
    }
  });
}

test('hidden views are skipped and offscreen or resized trees keep bounded initial heights', () => {
  assert.deepEqual(run(game(), `
    window.innerHeight=900;const updates={};
    generalizationTree.style.setProperty=(k,v)=>updates[k]=v;
    abstractionTree.style.setProperty=(k,v)=>updates[k]=v;
    generalizationPanel.classList.add('hidden');abstractionPanel.classList.add('hidden');
    updateGeneralizationTreeViewportExtent();updateAbstractionTreeViewportExtent();
    const hidden=Object.keys(updates).length===0;
    generalizationPanel.classList.remove('hidden');abstractionPanel.classList.remove('hidden');
    generalizationTree.getBoundingClientRect=()=>({top:5000});abstractionTree.getBoundingClientRect=()=>({top:5000});
    updateGeneralizationTreeViewportExtent();updateAbstractionTreeViewportExtent();
    const offscreen={...updates};window.innerHeight=600;
    generalizationTree.getBoundingClientRect=()=>({top:-4000});abstractionTree.getBoundingClientRect=()=>({top:-4000});
    updateGeneralizationTreeViewportExtent();updateAbstractionTreeViewportExtent();
    return {hidden,offscreen,resized:updates};
  `),{hidden:true,offscreen:{'--generalization-tree-top':'900px','--abstraction-tree-top':'900px'},
    resized:{'--generalization-tree-top':'-4000px','--abstraction-tree-top':'-4000px'}});
});
