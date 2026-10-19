const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const saveSource = fs.readFileSync(path.join(root, 'scripts/core/save.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(root, 'scripts/systems/square-convergence.js'), 'utf8');

function game() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'scripts/core', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext('render=()=>{};knuthUnlocked=true;hasClaimedKnuthPoint=true;', context);
  return context;
}

function run(context, source) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => {${source}})()`, context)));
}

test('eight free slots and paid slots grow from 1m KP by doubling', () => {
  assert.deepEqual(run(game(), `
    const start=abstractionResearchPresets.length;
    const first=abstractionPresetSlotCost();
    knuthPoints=1000000;
    const boughtFirst=buyAbstractionPresetSlot();
    const afterFirst=abstractionPresetSlotCost();
    const failedWithoutKp=buyAbstractionPresetSlot();
    knuthPoints=2000000;
    const boughtSecond=buyAbstractionPresetSlot();
    return {start,first:NumberMath.toNumber(first),boughtFirst,afterFirst:NumberMath.toNumber(afterFirst),
      failedWithoutKp,boughtSecond,left:NumberMath.toNumber(knuthPoints),slots:abstractionResearchPresets.length,
      third:NumberMath.toNumber(abstractionPresetSlotCost())};
  `), { start: 8, first: 1000000, boughtFirst: true, afterFirst: 2000000,
    failedWithoutKp: false, boughtSecond: true, left: 0, slots: 10, third: 4000000 });
});

test('preset save, edit, copy text and name remain independent of purchased research', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['1-1']=true;abstractionResearchState['2-1']=true;
    const saved=saveAbstractionResearchPreset(0);
    const before=abstractionResearchPresets[0].ids.join(', ');
    const edited=editAbstractionResearchPreset(0,'3-1, 1-1, 2-1, 2-1');
    const rejected=editAbstractionResearchPreset(0,'1-1, nope');
    const named=renameAbstractionResearchPreset(0,'연구 경로');
    const overlong=renameAbstractionResearchPreset(0,'a'.repeat(301));
    return {saved,before,edited,rejected,named,overlong,name:abstractionResearchPresets[0].name,
      ids:abstractionResearchPresets[0].ids,active:hasPurchasedAbstractionResearch('3-1')};
  `), { saved: true, before: '1-1, 2-1', edited: true, rejected: false, named: true,
    overlong: false, name: '연구 경로', ids: ['3-1', '1-1', '2-1'], active: false });
});

test('preset loading pays the exact whole cost in prerequisite order', () => {
  assert.deepEqual(run(game(), `
    editAbstractionResearchPreset(0,'7-1, 6-3, 5-3, 4-3, 3-1, 2-1, 1-1');
    const plan=abstractionPresetPurchasePlan(0);
    greatTheory=plan.cost;
    const bought=loadAbstractionResearchPreset(0);
    return {ids:plan.ids,cost:plan.cost,bought,left:greatTheory,
      researched:plan.ids.every(hasPurchasedAbstractionResearch),refund:abstractionResearchRefund()};
  `), { ids: ['1-1','2-1','3-1','4-3','5-3','6-3','7-1'],
    cost: 20, bought: true, left: 0, researched: true, refund: 20 });
});

test('insufficient theory, existing research, missing parents and branch conflicts never partially load', () => {
  assert.deepEqual(run(game(), `
    editAbstractionResearchPreset(0,'1-1, 2-1, 3-1, 4-1, 5-1, 6-1');
    greatTheory=17;
    const insufficient=loadAbstractionResearchPreset(0);
    const unchanged=greatTheory===17&&ABSTRACTION_RESEARCHES.every(r=>!hasPurchasedAbstractionResearch(r.id));
    editAbstractionResearchPreset(1,'1-1, 3-1');
    const missing=abstractionPresetPurchasePlan(1).error;
    editAbstractionResearchPreset(2,'1-1, 2-1, 3-1, 4-1, 4-2');
    const conflict=abstractionPresetPurchasePlan(2).error;
    abstractionResearchState['1-1']=true;
    const already=abstractionPresetPurchasePlan(0).error;
    const after=loadAbstractionResearchPreset(0);
    return {insufficient,unchanged,missing:Boolean(missing),conflict:Boolean(conflict),already:Boolean(already),after,
      stillOnlyOne:ABSTRACTION_RESEARCHES.filter(r=>hasPurchasedAbstractionResearch(r.id)).length===1};
  `), { insufficient: false, unchanged: true, missing: true, conflict: true,
    already: true, after: false, stillOnlyOne: true });
});

test('two first branches and two second branches load only after their unlocks', () => {
  assert.deepEqual(run(game(), `
    editAbstractionResearchPreset(0,ABSTRACTION_RESEARCHES.map(r=>r.id).join(', '));
    const allError=Boolean(abstractionPresetPurchasePlan(0).error);
    const ids=['1-1','2-1','3-1','4-1','5-1','6-1','4-2','5-2','6-2','7-1',
      '8-1','8-2','9-1','9-2','10-1','11-1','12-1','13-1','14-1','12-3','13-3','14-3'];
    editAbstractionResearchPreset(1,ids.join(', '));
    const locked=Boolean(abstractionPresetPurchasePlan(1).error);
    knuthBaseUpgradeLevels.extra_branch=1;
    knuthEquippedUpgradeIds.add('second_branch_expansion');
    const plan=abstractionPresetPurchasePlan(1);greatTheory=plan.cost;
    const loaded=loadAbstractionResearchPreset(1);
    return {allError,locked,loaded,spent:plan.cost,left:greatTheory,
      first:hasAbstractionResearch('6-1')&&hasAbstractionResearch('6-2'),
      second:hasAbstractionResearch('14-1')&&hasAbstractionResearch('14-3')};
  `), { allError: true, locked: true, loaded: true, spent: 97, left: 0, first: true, second: true });
});

test('preset slots and names survive save round trip and old saves get eight empty slots', () => {
  assert.match(saveSource, /abstractionResearchPresets:\s*abstractionResearchPresets\.map/);
  assert.match(saveSource, /loadAbstractionResearchPresets\(d\.abstractionResearchPresets\)/);
  assert.deepEqual(run(game(), `
    knuthPoints=1000000;buyAbstractionPresetSlot();
    renameAbstractionResearchPreset(8,'shared');
    editAbstractionResearchPreset(8,'1-1, 2-1');
    const saved=JSON.parse(JSON.stringify(abstractionResearchPresets));
    loadAbstractionResearchPresets(null);
    const old=[abstractionResearchPresets.length,abstractionResearchPresets.every(p=>p.ids.length===0)];
    loadAbstractionResearchPresets(saved);
    const restored=[abstractionResearchPresets.length,abstractionResearchPresets[8].name,
      abstractionResearchPresets[8].ids.join(', '),NumberMath.toNumber(abstractionPresetSlotCost())];
    clearAbstractionResearchPreset(8);
    return {old,restored,cleared:abstractionResearchPresets[8]};
  `), { old: [8,true], restored: [9,'shared','1-1, 2-1',2000000], cleared: {name:'',ids:[]} });
});

test('first research card of each branch receives the configured yellow label', () => {
  assert.match(uiSource, /research\.branch && !ABSTRACTION_RESEARCHES\.some/);
  assert.match(uiSource, /ABSTRACTION_BRANCH_OPTIONS\[research\.branchGroup \?\? 1\]/);
  const css=fs.readFileSync(path.join(root,'styles/number-tycoon.css'),'utf8');
  assert.match(css,/\.abstraction-tree-theme \.abstraction-branch-label\s*\{/);
  assert.match(css,/\.abstraction-branch-label\s*\{[^}]*color: #e0b83f/s);
});
