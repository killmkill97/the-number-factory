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

test('formula help includes the narrated research and equipment, without restoring obsolete challenge rewards', () => {
  const context = makeContext();
  const expected = [
    'percent:softcap',
    'generalization:5-2',
    'knuth:knuth_time_gain',
    'knuth:percent_purchase_bonus',
    'knuth:percent_count_discount',
    'knuth:percent_overflow',
    'knuth:percent_time_discount',
    ...['5-3','5-4','6-2','7-1','8-1'].map(id=>`generalization:${id}`),
    ...['4-1','5-1','6-1','4-2','5-2','6-2','4-3','5-3','6-3','8-1','9-1','9-2',
      '12-1','13-1','14-1','12-3','13-3','15-1','16-1','17-1','17-2','17-4',
      '18-1','18-2','18-3','18-4','18-5','18-6','18-7','18-8','19-1','19-2','20-1','21-1','23-1','23-2','23-3','24-1',
      '25-1','26-1','27-1','26-2','27-2','28-1'].map(id=>`abstraction:${id}`),
    ...['dyson_diverger','accumulated_time_sp','group_percent_growth','research_resource_growth',
      'diverger_black_hole','achievement_percent_growth'].map(id=>`knuth:${id}`),
    'knuth-base:dyson_limit','knuth-base:overclock_limit',
    ...['penalty_relief','mass_percent','overfeed','group_boost','higgs_slots'].map(id=>`space-expansion:${id}`),
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

test('research and equipment cards use sentences, while radius-CP help retains the exact formula and graph', () => {
  const context=makeContext();
  const row=vm.runInContext(`({
    description:ABSTRACTION_RESEARCHES.find(item=>item.id==='18-4').description,
    researchPlain:ABSTRACTION_RESEARCHES.every(item=>!/[=^]|log10|log2|sqrt/.test(item.description)),
    equipmentPlain:KNUTH_SLOT_UPGRADES.every(item=>!/[=^]|log10|log2|sqrt/.test(item.description)),
    help:FORMULA_HELP_DEFINITIONS['abstraction:18-4']
  })`,context);
  assert.equal(row.description,'슈바르츠실트 반지름 R에 따라 CP 획득량을 배율합니다.');
  assert.equal(row.researchPlain,true);assert.equal(row.equipmentPlain,true);
  assert.match(row.help.formula,/10\^\(30 × log2\(1\+R\/50\)\)/);
  assert.equal(row.help.graphs.length,1);assert.match(row.help.graphs[0].src,/abstraction-18-4\.svg/);
});

test('every new pre-rendered chart matches its current formula specification with finite, bounded samples', async () => {
  const {renderChart}=await import('../tools/generate-formula-graphs.mjs');
  const {completeChartSpec}=await import('../tools/generate-research-formula-graphs.mjs');
  const context=makeContext();
  const specs=vm.runInContext('Object.values(FORMULA_HELP_CHARTS)',context);
  for(const spec of specs){
    const complete=completeChartSpec(spec);
    for(const line of spec.lines)for(let i=0;i<=1200;i++){
      const y=line.evaluate(spec.min+(spec.max-spec.min)*i/1200);
      assert.ok(Number.isFinite(y)&&y>=complete.yMin&&y<=complete.yMax,spec.file);
    }
    const svg=fs.readFileSync(path.join(projectRoot,'assets/formula-graphs',spec.file),'utf8');
    assert.equal(svg,renderChart(complete),`stale graph ${spec.file}`);
    assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
  }
  assert.equal(specs.length,62);
});

test('radius-CP graph agrees with the real multiplier at the plotted inputs without modifying game progress', () => {
  const context=makeContext();
  const rows=vm.runInContext(`(()=>{
    numberBlackHoleAvailable=()=>true;abstractionResearchState['18-4']=true;
    return [0,1,50,100,500].map(radius=>{
      numberBlackHoleSchwarzschildRadius=()=>radius;
      return {expected:FORMULA_HELP_CHARTS['abstraction:18-4'].lines[0].evaluate(radius),
        actual:NumberMath.toNumber(NumberMath.log10(abstractionRadiusCpMultiplier()))};
    });
  })()`,context);
  for(const row of rows)assert.ok(Math.abs(row.actual-row.expected)<1e-9);
});

test('abstraction help opens in green and clicking its help button cannot buy or drag the research', () => {
  const context=makeContext();
  const before=vm.runInContext('JSON.stringify(abstractionResearchState)',context);
  const button=vm.runInContext("createFormulaHelpButton('abstraction','18-4')",context);
  let stopped=0,prevented=0;
  button.dispatch('pointerdown',{stopPropagation(){stopped++;}});
  button.dispatch('click',{stopPropagation(){stopped++;},preventDefault(){prevented++;}});
  const dialog=vm.runInContext('formulaHelpDialog',context);
  assert.equal(dialog.open,true);assert.equal(dialog.dataset.theme,'green');
  assert.equal(dialog.querySelector('#formulaHelpTitle').textContent,'18-4 지평선 수렴');
  assert.equal(dialog.querySelector('.formula-help-graphs').children.length,1);
  assert.equal(stopped,2);assert.equal(prevented,1);
  assert.equal(vm.runInContext('JSON.stringify(abstractionResearchState)',context),before);
});
