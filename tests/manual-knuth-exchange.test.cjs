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

test('repeat KP exchanges preserve every current chapter without bypassing the progression reset', () => {
  for (const chapter of ['multiplication', 'square', 'knuth']) {
    const context = gameContext();
    const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
      render=()=>{};extraPercentLanesEl={innerHTML:''};
      const chapterCalls=[];setChapter=id=>{chapterCalls.push(id);activeChapter=id;};
      knuthUnlocked=true;hasClaimedKnuthPoint=true;knuthPoints=2;
      squareUnlocked=true;squarePoints=100;setBaseNumber(12345);
      squareConvergencePoints=NumberMath.fromString('1e60');
      for(const id of ['8-1','7-1','7-2','5-3','5-4']) generalizationResearchState[id]=true;
      activeChapter=${JSON.stringify(chapter)};
      const exchanged=exchangeKnuthPointsManually();
      return {exchanged,chapter:activeChapter,chapterCalls,kp:NumberMath.serialize(knuthPoints),
        sp:NumberMath.serialize(squarePoints),cp:NumberMath.serialize(squareConvergencePoints),
        number:NumberMath.serialize(getBaseNumber()),squareUnlocked,pending:pendingKnuthPointClaim};
    })()`, context)));
    assert.deepEqual(result, {exchanged:true,chapter,chapterCalls:[],kp:'6',sp:'0',cp:'0',number:'0',squareUnlocked:false,pending:false});
  }
});

test('first Knuth still forces the base chapter and waits for the first-KP claim', () => {
  const context=gameContext();
  const result=JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    render=()=>{};extraPercentLanesEl={innerHTML:''};
    const chapterCalls=[];setChapter=id=>{chapterCalls.push(id);activeChapter=id;};
    activeChapter='square';beginKnuthPrestige();
    const before={chapter:activeChapter,pending:pendingKnuthPointClaim,kp:NumberMath.serialize(knuthPoints)};
    const claimed=claimKnuthPoint();
    return {before,claimed,chapterCalls,chapter:activeChapter,kp:NumberMath.serialize(knuthPoints)};
  })()`,context)));
  assert.deepEqual(result,{before:{chapter:'multiplication',pending:true,kp:'0'},claimed:true,
    chapterCalls:['multiplication'],chapter:'multiplication',kp:'1'});
});

test('challenge start, abandon and completion retain their original forced-base navigation', () => {
  const context=gameContext();
  const result=JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    render=()=>{};extraPercentLanesEl={innerHTML:''};
    const chapterCalls=[];setChapter=id=>{chapterCalls.push(id);activeChapter=id;};
    knuthUnlocked=true;hasClaimedKnuthPoint=true;activeChapter='knuth';
    const started=startKnuthChallenge('kc1');activeChapter='knuth';
    const abandoned=abandonKnuthChallenge();activeChapter='knuth';startKnuthChallenge('kc1');
    activeChapter='knuth';squarePoints=500000;const completed=completeKnuthChallenge();
    return {started,abandoned,completed,chapterCalls,chapter:activeChapter};
  })()`,context)));
  assert.deepEqual(result,{started:true,abandoned:true,completed:true,
    chapterCalls:['multiplication','multiplication','multiplication','multiplication'],chapter:'multiplication'});
});
