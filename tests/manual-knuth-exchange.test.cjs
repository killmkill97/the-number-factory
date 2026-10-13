const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gameContext() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }
  return context;
}

test('manual KP exchange remains locked until 8-1 and all of its prerequisites are researched', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext([
    'knuthUnlocked = true;',
    'hasClaimedKnuthPoint = true;',
    'generalizationResearchState["8-1"] = true;',
    'for (const id of ["7-1", "7-2", "5-3", "5-4"]) generalizationResearchState[id] = true;',
    'const ready = canManuallyExchangeKnuthPoints();',
    'generalizationResearchState["5-4"] = false;',
    'const missingParent = canManuallyExchangeKnuthPoints();',
    'generalizationResearchState["5-4"] = true;',
    'generalizationResearchState["8-1"] = false;',
    'const missingUnlock = canManuallyExchangeKnuthPoints();',
    'generalizationResearchState["8-1"] = true;',
    'activeKnuthChallengeId = "kc1";',
    'const duringChallenge = canManuallyExchangeKnuthPoints();',
    '({ ready, missingParent, missingUnlock, duringChallenge })'
  ].join('\n'), context)));

  assert.deepEqual(result, {
    ready: true,
    missingParent: false,
    missingUnlock: false,
    duringChallenge: false
  });
});

test('after the first Knuth, researching 8-1 arms manual exchange instead of immediately resetting', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext([
    'render = () => {};',
    'log = () => {};',
    'let prestigeCalls = 0;',
    'beginKnuthPrestige = () => { prestigeCalls++; };',
    'knuthUnlocked = true;',
    'hasClaimedKnuthPoint = true;',
    'hasEverEarnedSquareConvergencePoint = true;',
    'theory = 160;',
    'for (const id of ["7-1", "7-2", "5-3", "5-4"]) generalizationResearchState[id] = true;',
    'const purchased = researchGeneralization("8-1");',
    '({ purchased, ready: canManuallyExchangeKnuthPoints(), prestigeCalls, theory: NumberMath.serialize(theory) })'
  ].join('\n'), context)));

  assert.deepEqual(result, {
    purchased: true,
    ready: true,
    prestigeCalls: 0,
    theory: '0'
  });
});

test('manual KP exchange grants the existing integer formula and resets the run', () => {
  const context = gameContext();
  const result = JSON.parse(JSON.stringify(vm.runInContext([
    'render = () => {};',
    'setChapter = () => {};',
    'let resetCalls = 0;',
    'resetProgressForNewKnuthRun = () => { resetCalls++; resetGeneralizationResearchState(); };',
    'knuthUnlocked = true;',
    'hasClaimedKnuthPoint = true;',
    'knuthPoints = 2;',
    'squareConvergencePoints = NumberMath.fromString("1e60");',
    'generalizationResearchState["8-1"] = true;',
    'for (const id of ["7-1", "7-2", "5-3", "5-4"]) generalizationResearchState[id] = true;',
    'const exchanged = exchangeKnuthPointsManually();',
    '({ exchanged, kp: NumberMath.serialize(knuthPoints), resetCalls, readyAfterReset: canManuallyExchangeKnuthPoints() })'
  ].join('\n'), context)));

  assert.deepEqual(result, {
    exchanged: true,
    kp: '6',
    resetCalls: 1,
    readyAfterReset: false
  });
});
