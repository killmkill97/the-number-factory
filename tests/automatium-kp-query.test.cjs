const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('get.kp reads currently owned KP and works in if, comparisons and calculations at every magnitude', () => {
  for (const value of ['0', '1', '100', '1e100', '1e1e20']) {
    const row = run(game(), String.raw`
      knuthPoints=NumberMath.fromString('${value}');
      const code=['copy = number','copy = get.kp','result = boolean','result = false',
        'if get.kp >= 1 {','result = true','}', 'same = boolean','same = copy == get.kp',
        'larger = boolean','larger = get.kp * 2 >= get.kp'].join('\n');
      const execution=NRuntime.createExecution(NRuntime.compile(code),automatiumGameAdapter);
      while(!execution.iterator.next().done){}
      return {copy:NumberMath.serialize(execution.context.variables.get('copy').value),
        owned:NumberMath.serialize(knuthPoints),result:execution.context.variables.get('result').value,
        same:execution.context.variables.get('same').value,larger:execution.context.variables.get('larger').value};
    `);
    assert.equal(row.copy, row.owned); assert.equal(row.result, value !== '0');
    assert.equal(row.same, true); assert.equal(row.larger, true);
  }
});

test('KP query is read-only, independent of KP exchange unlock, and observes changes between N steps', () => {
  assert.deepEqual(run(game(), String.raw`
    abstractionResearchState['2-2']=false;knuthUnlocked=false;knuthPoints=5;
    const execution=NRuntime.createExecution(NRuntime.compile('a = number\na = get.kp\nb = number\nb = get.kp'),automatiumGameAdapter);
    for(let i=0;i<100;i++){
      const result=execution.iterator.next();
      if(execution.context.variables.get('a')?.value===5)knuthPoints=7;
      if(result.done)break;
    }
    return {a:plain(execution.context.variables.get('a').value),b:plain(execution.context.variables.get('b').value),
      kp:plain(knuthPoints),unlocked:knuthUnlocked,research:hasAbstractionResearch('2-2')};
  `), { a: 5, b: 7, kp: 7, unlocked: false, research: false });
});

test('bare numeric if retains the existing boolean requirement and existing currency queries are unchanged', () => {
  const ctx = game();
  assert.throws(() => run(ctx, `knuthPoints=1;executeN('if get.kp {}');`), /boolean/);
  assert.deepEqual(run(ctx, `
    setBaseNumber(11);squarePoints=22;squareConvergencePoints=33;knuthPoints=44;
    return ['number','sp','cp','kp'].map(name=>plain(automatiumGameAdapter.get([{name,index:null}],{line:1})));
  `), [11,22,33,44]);
});

test('KP query is present in get autocomplete and help without changing the kp exchange command', () => {
  const ctx = game();
  const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');
  ctx.loadSource(source.slice(source.indexOf('function nAutocompleteVariables('), source.indexOf('function hideAutomatiumAutocomplete(')));
  assert.deepEqual(run(ctx, `
    automatiumSource.value='if get.k';automatiumSource.selectionStart=automatiumSource.value.length;
    return nAutocompleteContext().items.map(item=>({label:item.label,insert:item.insert,detail:item.detail}));
  `), [{ label: 'kp', insert: 'kp', detail: '현재 보유 KP' },
    { label: 'knuth', insert: 'knuth.', detail: '기본 커누스 · KC5 완료' }]);
  assert.match(source, /<code>get\.kp<\/code>/);
  assert.match(source, /if get\.kp &gt;= 100/);
  assert.match(source, /kp \(5\) s/);
});
