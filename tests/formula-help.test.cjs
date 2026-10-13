const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const projectRoot = path.join(__dirname, '..');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
    this.classList = {
      toggle: (name, force) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        if (force) classes.add(name);
        else classes.delete(name);
        this.className = [...classes].join(' ');
      }
    };
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'class') this.className = String(value);
  }

  addEventListener(name, callback) {
    (this.listeners[name] ??= []).push(callback);
  }

  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }

  append(...children) {
    for (const child of children) this.appendChild(child);
  }

  replaceChildren(...children) {
    this.children = [];
    this.append(...children);
  }

  querySelector(selector) {
    const matches = element => selector[0] === '#'
      ? element.id === selector.slice(1)
      : element.className.split(/\s+/).includes(selector.slice(1));
    const visit = element => {
      for (const child of element.children) {
        if (matches(child)) return child;
        const match = visit(child);
        if (match) return match;
      }
      return null;
    };
    return visit(this);
  }

  dispatch(name, event = {}) {
    const prepared = {
      target: this,
      preventDefault() {},
      stopPropagation() {},
      ...event
    };
    for (const listener of this.listeners[name] ?? []) listener(prepared);
  }

  showModal() {
    this.open = true;
  }
}

function makeContext() {
  const context = vm.createContext({
    document: {
      body: new FakeElement('body'),
      getElementById: () => null,
      createElement: tagName => new FakeElement(tagName),
      createElementNS: (_namespace, tagName) => new FakeElement(tagName)
    },
    performance: { now: () => 0 }
  });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(projectRoot, 'scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  const source = fs.readFileSync(path.join(projectRoot, 'scripts/systems/formula-help.js'), 'utf8');
  vm.runInContext(source, context, { filename: 'formula-help.js' });
  return context;
}

test('formula help is limited to the requested research, equipment, and percent graphs', () => {
  const context = makeContext();
  const expected = [
    'percent:softcap',
    'generalization:5-2',
    'knuth:knuth_time_gain',
    'knuth:percent_purchase_bonus',
    'knuth:percent_count_discount',
    'knuth:percent_overflow',
    'knuth:percent_time_discount',
  ];
  const actual = Array.from(vm.runInContext('Object.keys(FORMULA_HELP_DEFINITIONS)', context));
  assert.deepEqual(actual.sort(), expected.sort());
  const repeatDiscountHelp = vm.runInContext(
    "FORMULA_HELP_DEFINITIONS['knuth:percent_count_discount']",
    context
  );
  assert.match(repeatDiscountHelp.formula, /D_total = min\(0\.9,/);
  assert.match(repeatDiscountHelp.formula, /max\(0\.1,/);

  for (const key of expected) {
    const definition = vm.runInContext(`FORMULA_HELP_DEFINITIONS['${key}']`, context);
    assert.ok(definition.formula.trim(), `missing formula for ${key}`);
    assert.equal(definition.graphs.length, 1, `expected one graph for ${key}`);
    const imageUrl = new URL(definition.graphs[0].src, 'https://number-tycoon.test/');
    const imagePath = path.join(projectRoot, imageUrl.pathname.slice(1));
    const image = fs.readFileSync(imagePath, 'utf8');
    assert.match(image, /<svg\b/);
    assert.match(image, /class="curve"/);
    assert.ok((image.match(/\bL[0-9]/g) ?? []).length > 1000, `${key} graph should be pre-rendered at high resolution`);
  }
});

test('unrequested upgrade and research cards do not receive formula buttons', () => {
  const context = makeContext();
  const result = vm.runInContext(`({
    allowed: createFormulaHelpButton('knuth', 'percent_overflow') !== null
      && createFormulaHelpButton('generalization', '5-2') !== null
      && createFormulaHelpButton('percent', 'softcap') !== null
      && createFormulaHelpButton('challenge', 'kc3') === null,
    excluded: createFormulaHelpButton('base', 'click_power') === null
      && createFormulaHelpButton('square', 'percent_power_8') === null
      && createFormulaHelpButton('diverger', 'a') === null
      && createFormulaHelpButton('abstraction', '1-1') === null
      && createFormulaHelpButton('knuth', 'diverger_percent_price_delay') === null
  })`, context);
  assert.deepEqual({ ...result }, { allowed: true, excluded: true });
});

test('obsolete KC reward formula graphs are no longer available', () => {
  const context = makeContext();
  const available = vm.runInContext(`[
    createFormulaHelpButton('challenge', 'kc1'),
    createFormulaHelpButton('challenge', 'kc2'),
    createFormulaHelpButton('challenge', 'kc3')
  ]`, context);
  assert.deepEqual(Array.from(available), [null, null, null]);
});
