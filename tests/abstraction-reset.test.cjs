const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gameContext() {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext(`
    render = () => {};
    setChapter = () => {};
    extraPercentLanesEl = { innerHTML: '' };
    knuthUnlocked = true;
    hasClaimedKnuthPoint = true;
    greatTheory = 100;
    for (const id of ['1-1', '2-1', '3-1', '4-1']) {
      if (!researchAbstraction(id)) throw new Error('Research setup failed: ' + id);
    }
  `, context);
  return context;
}

function run(context, source) {
  return JSON.parse(JSON.stringify(vm.runInContext(`(() => { ${source} })()`, context)));
}

test('reset toggle only arms or cancels the next KP refund', () => {
  assert.deepEqual(run(gameContext(), `
    const on = toggleAbstractionReset();
    const unchanged = greatTheory === 94 && hasAbstractionResearch('4-1');
    const off = toggleAbstractionReset();
    return { on, off, unchanged, refund: abstractionResearchRefund() };
  `), { on: true, off: false, unchanged: true, refund: 6 });
});

test('KP prestige refunds once, clears both branches, and preserves currency price progression and permanent effects', () => {
  assert.deepEqual(run(gameContext(), `
    greatTheoryCpCost = NumberMath.fromString('1e40');
    greatTheoryKpCost = 128;
    greatTheorySpCost = NumberMath.fromString('1e6000');
    greatTheoryTheoryCost = 256;
    abstractionCostResourceIndex = 1;
    squareConvergenceUpgradeState.automatium = true;
    squareConvergenceUpgradeLevels.automatium = 1;
    toggleAbstractionReset();
    beginKnuthPrestige();
    const refunded = compareNumberValues(greatTheory, 100) === 0;
    const cleared = ABSTRACTION_RESEARCHES.every(r => !hasAbstractionResearch(r.id));
    const otherBranchReady = ['1-1', '2-1', '3-1'].every(researchAbstraction)
      && canResearchAbstraction('4-2') && canResearchAbstraction('4-3');
    const beforeSecond = NumberMath.serialize(greatTheory);
    beginKnuthPrestige();
    return {
      refunded, cleared, otherBranchReady,
      toggle: abstractionResetOnNextKnuthPoint,
      noSecondRefund: NumberMath.serialize(greatTheory) === beforeSecond,
      permanent: automatiumPrestigeRetentionUnlocked,
      automatium: hasSquareConvergenceUpgrade('automatium'),
      cpCost: compareNumberValues(greatTheoryCpCost, '1e40') === 0,
      kpCost: greatTheoryKpCost, spCost: compareNumberValues(greatTheorySpCost, '1e6000') === 0,
      theoryCost: greatTheoryTheoryCost, selected: abstractionCostResourceIndex
    };
  `), {
    refunded: true, cleared: true, otherBranchReady: true, toggle: false,
    noSecondRefund: true, permanent: true, automatium: true,
    cpCost: true, kpCost: 128, spCost: true, theoryCost: 256, selected: 1
  });
});

test('KP gain uses pre-reset research effects before clearing abstraction', () => {
  assert.deepEqual(run(gameContext(), `
    abstractionResearchState['8-1'] = true;
    abstractionResearchPaidCosts['8-1'] = 4;
    abstractionResearchState['13-2'] = true;
    abstractionResearchPaidCosts['13-2'] = 6;
    squareConvergencePoints = NumberMath.fromString('1e45');
    knuthPoints = 2;
    for (const id of ['8-1', '7-1', '7-2', '5-3', '5-4']) generalizationResearchState[id] = true;
    toggleAbstractionReset();
    const expected = addBaseNumbers(knuthPoints, knuthPointGain());
    const exchanged = exchangeKnuthPointsManually();
    return { exchanged, correct: compareNumberValues(knuthPoints, expected) === 0,
      kp: NumberMath.serialize(knuthPoints), cleared: !hasAbstractionResearch('8-1'),
      gt: NumberMath.serialize(greatTheory) };
  `), { exchanged: true, correct: true, kp: '552', cleared: true, gt: '110' });
});

test('first Knuth resets abstraction only after clicking to claim the first KP', () => {
  assert.deepEqual(run(gameContext(), `
    hasClaimedKnuthPoint = false;
    knuthPoints = 0;
    toggleAbstractionReset();
    beginKnuthPrestige();
    const beforeClaim = pendingKnuthPointClaim && abstractionResetOnNextKnuthPoint
      && hasAbstractionResearch('4-1') && compareNumberValues(greatTheory, 94) === 0;
    const claimed = claimKnuthPoint();
    const duplicateClaim = claimKnuthPoint();
    return { beforeClaim, claimed, duplicateClaim, kp: NumberMath.serialize(knuthPoints),
      gt: NumberMath.serialize(greatTheory), cleared: !hasAbstractionResearch('4-1'),
      toggle: abstractionResetOnNextKnuthPoint };
  `), { beforeClaim: true, claimed: true, duplicateClaim: false, kp: '1', gt: '100', cleared: true, toggle: false });
});

test('challenge start, abandon, completion and developer actions never consume the reset reservation', () => {
  const result = run(gameContext(), `
    toggleAbstractionReset();
    function preserved() {
      return abstractionResetOnNextKnuthPoint && hasAbstractionResearch('4-1')
        && abstractionResearchRefund() === 6 && compareNumberValues(greatTheory, 94) === 0;
    }
    const checks = [];
    checks.push(startKnuthChallenge('kc1') && preserved());
    checks.push(abandonKnuthChallenge() && preserved());
    checks.push(startKnuthChallenge('kc1') && preserved());
    squarePoints = 500000;
    checks.push(completeKnuthChallenge() && preserved());
    checks.push(forceCompleteKnuthChallengeForDev('kc2') && preserved());
    checks.push(resetKnuthChallengeForDev('kc2') && preserved());
    checks.push(startKnuthChallenge('kc2') && preserved());
    checks.push(resetKnuthChallengeForDev('kc2') && preserved());
    resetProgressForNewKnuthRun();
    checks.push(preserved());
    return checks;
  `);
  assert.deepEqual(result, Array(9).fill(true));
});

test('KP prestige with the toggle off preserves abstraction and spends no refund', () => {
  assert.deepEqual(run(gameContext(), `
    beginKnuthPrestige();
    return { research: hasAbstractionResearch('4-1'), gt: NumberMath.serialize(greatTheory),
      refund: abstractionResearchRefund(), toggle: abstractionResetOnNextKnuthPoint };
  `), { research: true, gt: '94', refund: 6, toggle: false });
});

test('save round trip preserves the reservation and actual paid costs, including a historical price', () => {
  const saveSource = fs.readFileSync(path.join(__dirname, '../scripts/core/save.js'), 'utf8');
  assert.match(saveSource, /abstractionResearchPaidCosts:\s*\{\s*\.\.\.abstractionResearchPaidCosts\s*\}/);
  assert.match(saveSource, /abstractionResetOnNextKnuthPoint,/);
  assert.match(saveSource, /loadAbstractionResetState\(d\.abstractionResearchPaidCosts, d\.abstractionResetOnNextKnuthPoint\)/);
  assert.deepEqual(run(gameContext(), `
    abstractionResearchState['11-1'] = true;
    abstractionResearchPaidCosts['11-1'] = 8;
    toggleAbstractionReset();
    const saved = JSON.parse(JSON.stringify({
      research: abstractionResearchState, costs: abstractionResearchPaidCosts, toggle: abstractionResetOnNextKnuthPoint
    }));
    loadAbstractionResearchState(null);
    loadAbstractionResetState(null, false);
    loadAbstractionResearchState(saved.research);
    loadAbstractionResetState(saved.costs, saved.toggle);
    const refund = abstractionResearchRefund();
    beginKnuthPrestige();
    return { refund, gt: NumberMath.serialize(greatTheory), remaining: Object.keys(abstractionResearchPaidCosts).length };
  `), { refund: 14, gt: '108', remaining: 0 });
});

test('older saves default the reservation off and infer only owned research costs', () => {
  assert.deepEqual(run(gameContext(), `
    toggleAbstractionReset();
    loadAbstractionResetState(undefined, undefined);
    const defaultOff = !abstractionResetOnNextKnuthPoint;
    loadAbstractionResetState({ '1-1': 0, '2-1': -1, '3-1': '1', '4-1': null, '4-2': 999 }, true);
    const refund = abstractionResearchRefund();
    beginKnuthPrestige();
    return { defaultOff, refund, gt: NumberMath.serialize(greatTheory), permanent: automatiumPrestigeRetentionUnlocked };
  `), { defaultOff: true, refund: 5, gt: '99', permanent: true });
});

test('developer free research has no refund and cancel/rebuy records only the new purchase', () => {
  const context = gameContext();
  const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/dev-console.js'), 'utf8');
  vm.runInContext(source.slice(source.indexOf('function forceUnlockDevUpgrade('), source.indexOf('function handleDivergerDevUndo(')), context);
  assert.deepEqual(run(context, `
    forceUnlockDevUpgrade('abstraction', '4-2');
    forceUnlockDevUpgrade('abstraction', '4-1');
    const unchangedRefund = abstractionResearchRefund();
    removeDevUpgrade('abstraction', '4-2');
    removeDevUpgrade('abstraction', '4-1');
    const repurchased = researchAbstraction('4-2');
    toggleAbstractionReset();
    beginKnuthPrestige();
    return { unchangedRefund, repurchased, gt: NumberMath.serialize(greatTheory) };
  `), { unchangedRefund: 6, repurchased: true, gt: '97' });
});
