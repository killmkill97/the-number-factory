const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');

function editor() {
  const elements = new Map();
  const document = { activeElement: null, createElement: () => element(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    }
  };
  function element() {
    const classes = new Set(['hidden']);
    const listeners = new Map();
    return {
      value: '', selectionStart: 0, selectionEnd: 0, innerHTML: '', children: [], style: {},
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name),
        toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }
      },
      addEventListener(name, listener) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(listener);
      },
      dispatch(name, properties = {}) {
        const event = { preventDefault() { this.defaultPrevented = true; }, stopPropagation() {}, ...properties };
        for (const listener of listeners.get(name) ?? []) listener(event);
        return event;
      },
      setAttribute() {}, append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      focus() {
        if (document.activeElement === this) return;
        document.activeElement?.blur();
        document.activeElement = this;
        this.dispatch('focus');
      },
      blur() { document.activeElement = null; this.dispatch('blur'); },
      setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
      setRangeText(text, start, end) {
        this.value = this.value.slice(0, start) + text + this.value.slice(end);
        this.setSelectionRange(start + text.length, start + text.length);
      }
    };
  }
  const context = vm.createContext({ document, window: { addEventListener() {} },
    performance: { now: () => 0 }, localStorage: { getItem: () => '[]' } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context);
  }
  vm.runInContext(source.slice(0, source.indexOf('function setAutomatiumRuntimeStatus(')), context);
  vm.runInContext(source.slice(source.indexOf('function nAutocompleteUpgradeRows('),
    source.indexOf('function createAutomatiumProgramRow(')), context);
  vm.runInContext('positionAutomatiumAutocomplete=()=>{};renderAutomatiumEditorStatus=()=>{};', context);
  vm.runInContext(source.slice(source.indexOf("automatiumSource.addEventListener('input'"),
    source.indexOf("automatiumEditorTabBtn.addEventListener('click'")), context);
  const input = document.getElementById('automatiumSource');
  const popup = document.getElementById('automatiumAutocomplete');
  const labels = () => JSON.parse(vm.runInContext('JSON.stringify(automatiumAutocompleteItems.map(item=>item.label))', context));
  function set(text, notify = true) {
    input.value = text;
    input.setSelectionRange(text.length, text.length);
    if (notify) input.dispatch('input');
  }
  return { context, input, popup, labels, set };
}

test('empty input, indentation, and a new empty line never suggest commands', () => {
  const e = editor();
  e.input.focus();
  for (const value of ['', '    ', '\t', 'buy base click\n', 'buy base click\n    ']) {
    e.set(value);
    assert.equal(vm.runInContext('nAutocompleteContext()', e.context), null);
    assert.deepEqual(e.labels(), []);
    assert.equal(e.popup.classList.contains('hidden'), true);
  }
});

test('prefilled text does not suggest on initial focus, click, or a non-input keyup', () => {
  const e = editor();
  e.set('bu', false);
  e.input.focus();
  e.input.dispatch('click');
  e.input.dispatch('keyup', { key: 'ArrowLeft' });
  assert.deepEqual(e.labels(), []);
  assert.equal(e.popup.classList.contains('hidden'), true);
});

test('typing opens matching suggestions and a visible suggestion still completes with Tab', () => {
  const e = editor();
  e.input.focus();
  e.set('bu');
  assert.deepEqual(e.labels(), ['buy']);
  assert.equal(e.popup.classList.contains('hidden'), false);
  const event = e.input.dispatch('keydown', { key: 'Tab', shiftKey: false });
  assert.equal(event.defaultPrevented, true);
  assert.equal(e.input.value, 'buy ');
  assert.ok(e.labels().includes('base'));
});

test('blur clears suggestions immediately and refocus stays quiet until new input', () => {
  const e = editor();
  e.input.focus();e.set('bu');
  e.input.blur();
  assert.deepEqual(e.labels(), []);
  e.input.focus();e.input.dispatch('click');
  e.input.dispatch('keyup', { key: 'Control' });
  assert.deepEqual(e.labels(), []);
  e.set('buy g');
  assert.deepEqual(e.labels(), ['generalization','gz']);
});

test('Tab with no suggestions inserts exactly four spaces at the current cursor', () => {
  for (const value of ['', 'unrecognized_word']) {
    const e = editor();
    e.input.focus();e.set(value);
    e.input.dispatch('keydown', { key: 'Tab', shiftKey: false });
    e.input.dispatch('keyup', { key: 'Tab' });
    assert.equal(e.input.value, value + '    ');
    assert.equal(e.input.selectionStart, value.length + 4);
    assert.deepEqual(e.labels(), []);
  }
});

test('hidden stale items cannot intercept Tab as an invisible completion', () => {
  const e = editor();
  e.input.focus();e.set('bu');
  e.popup.classList.add('hidden');
  e.input.dispatch('keydown', { key: 'Tab', shiftKey: false });
  assert.equal(e.input.value, 'bu    ');
  assert.deepEqual(e.labels(), []);
});

test('an indented new line stays quiet through repeated Tabs and suggests again after a letter', () => {
  const e = editor();
  e.input.focus();e.set('while true {\n');
  e.input.dispatch('keydown', { key: 'Tab' });
  e.input.dispatch('keydown', { key: 'Tab' });
  assert.equal(e.input.value, 'while true {\n        ');
  assert.deepEqual(e.labels(), []);
  e.set(e.input.value + 'bu');
  assert.deepEqual(e.labels(), ['buy']);
});

test('Escape dismisses suggestions without keyup reopening them and new input restores them', () => {
  const e = editor();
  e.input.focus();e.set('b');
  e.input.dispatch('keydown', { key: 'Escape' });
  e.input.dispatch('keyup', { key: 'Escape' });
  e.input.dispatch('keyup', { key: 'Shift' });
  assert.deepEqual(e.labels(), []);
  e.set('bu');
  assert.deepEqual(e.labels(), ['buy']);
});

test('selected text is indented instead of completed and unfocused renders stay hidden', () => {
  const e = editor();
  e.input.focus();e.set('bu');
  e.input.setSelectionRange(0, 2);e.input.dispatch('click');
  assert.deepEqual(e.labels(), []);
  e.input.dispatch('keydown', { key: 'Tab' });
  assert.equal(e.input.value, '    ');
  e.input.blur();e.set('bu');
  assert.deepEqual(e.labels(), []);
});

test('visible research suggestions keep arrow navigation and chained property completion', () => {
  const e = editor();
  e.input.focus();e.set('get.gz.8-1.');
  assert.deepEqual(e.labels(), ['upgraded','amount','cost','max','available']);
  e.input.dispatch('keydown', { key: 'ArrowUp' });
  e.input.dispatch('keydown', { key: 'Tab' });
  assert.equal(e.input.value, 'get.gz.8-1.available');
  e.input.blur();e.input.focus();e.input.dispatch('click');
  e.input.dispatch('keydown', { key: 'Tab' });
  assert.equal(e.input.value, 'get.gz.8-1.available    ');
});
