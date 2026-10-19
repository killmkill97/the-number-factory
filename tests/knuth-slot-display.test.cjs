const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function game() {
  let created = 0;
  function element() {
    return { className: '', textContent: '', style: {}, children: [], attributes: {},
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; },
      setAttribute(name, value) { this.attributes[name] = value; }
    };
  }
  const context = vm.createContext({
    knuthSlotDisplay: element(),
    document: { createElement() { created++; return element(); } }
  });
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context);
  }
  const source = fs.readFileSync(path.join(__dirname, '../scripts/chapters/knuth.js'), 'utf8');
  const start = source.indexOf('function renderKnuthSlotDisplay()');
  const end = source.indexOf('\nfunction renderKnuthUpgradeGroups()', start);
  vm.runInContext(`let knuthSlotDisplaySignature = '';\n${source.slice(start, end)}`, context);
  context.created = () => created;
  return context;
}

test('zero to nineteen slots retain individual arrows and equipped highlighting', () => {
  const context = game();
  for (const capacity of [0, 1, 19]) {
    vm.runInContext(`knuthOperationLevel = ${capacity}; knuthEquippedUpgradeIds.clear();
      if (${capacity} > 0) knuthEquippedUpgradeIds.add('permanent_production'); renderKnuthSlotDisplay();`, context);
    const [label, arrows] = context.knuthSlotDisplay.children;
    assert.equal(label.textContent, `↑ 슬롯 ${capacity ? 1 : 0} / ${capacity}`);
    assert.equal(arrows.className, 'knuth-slot-arrows');
    assert.equal(arrows.children.length, capacity);
    assert.equal(arrows.children.filter(arrow => arrow.className.includes(' active')).length, capacity ? 1 : 0);
  }
});

test('twenty slots switch to one accessible meter whose fill follows used capacity', () => {
  const context = game();
  vm.runInContext("knuthOperationLevel = 20; knuthEquippedUpgradeIds.add('percent_gain_square'); renderKnuthSlotDisplay();", context);
  const [label, bar] = context.knuthSlotDisplay.children;
  assert.equal(label.textContent, '↑ 슬롯 16 / 20');
  assert.equal(bar.className, 'knuth-slot-bar');
  assert.equal(bar.attributes.role, 'meter');
  assert.equal(bar.attributes['aria-valuemax'], '20');
  assert.equal(bar.attributes['aria-valuenow'], '16');
  assert.equal(bar.attributes['aria-valuetext'], '16 / 20 슬롯 사용');
  assert.equal(bar.children.length, 1);
  assert.equal(bar.children[0].style.width, '80%');
});

test('a billion slots still create only the label, track and fill', () => {
  const context = game();
  vm.runInContext("knuthOperationLevel = 1e9; knuthEquippedUpgradeIds.add('second_branch_expansion'); renderKnuthSlotDisplay();", context);
  assert.equal(context.created(), 3);
  const bar = context.knuthSlotDisplay.children[1];
  assert.equal(bar.attributes['aria-valuenow'], '64');
  assert.equal(bar.attributes['aria-valuemax'], '1000000000');
  assert.ok(Math.abs(Number.parseFloat(bar.children[0].style.width) - 0.0000064) < 1e-12);
});

test('equip changes and crossing either side of twenty refresh the display without changing progression', () => {
  const context = game();
  vm.runInContext("knuthOperationLevel = 20; renderKnuthSlotDisplay();", context);
  assert.equal(context.knuthSlotDisplay.children[1].children[0].style.width, '0%');
  vm.runInContext("knuthEquippedUpgradeIds.add('percent_gain_square'); renderKnuthSlotDisplay();", context);
  assert.equal(context.knuthSlotDisplay.children[1].children[0].style.width, '80%');
  vm.runInContext('knuthOperationLevel = 19; renderKnuthSlotDisplay();', context);
  assert.equal(context.knuthSlotDisplay.children[1].className, 'knuth-slot-arrows');
  assert.equal(context.knuthSlotDisplay.children[1].children.length, 19);
  vm.runInContext('knuthOperationLevel = 20; renderKnuthSlotDisplay();', context);
  assert.equal(context.knuthSlotDisplay.children[1].className, 'knuth-slot-bar');
  assert.equal(vm.runInContext('knuthOperationLevel', context), 20);
  assert.equal(vm.runInContext("knuthEquippedUpgradeIds.has('percent_gain_square')", context), true);
});

test('unchanged counts reuse the existing display and a forced over-cap state cannot overflow the bar', () => {
  const context = game();
  vm.runInContext("knuthOperationLevel = 20; knuthEquippedUpgradeIds.add('second_branch_expansion'); renderKnuthSlotDisplay();", context);
  const bar = context.knuthSlotDisplay.children[1];
  assert.equal(bar.children[0].style.width, '100%');
  assert.equal(bar.attributes['aria-valuenow'], '20');
  const before = context.created();
  vm.runInContext('renderKnuthSlotDisplay();', context);
  assert.equal(context.created(), before);
  assert.equal(context.knuthSlotDisplay.children[1], bar);
});
