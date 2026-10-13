const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const saveSource = fs.readFileSync(path.join(__dirname, '../scripts/core/save.js'), 'utf8');

test('abstraction research flags survive the save-data JSON round trip', () => {
  assert.match(saveSource, /abstractionResearchState:\s*\{\s*\.\.\.abstractionResearchState\s*\}/);
  assert.match(saveSource, /automatiumPrestigeRetentionUnlocked,/);
  assert.match(saveSource, /loadAbstractionPermanentEffects\(/);
  assert.match(saveSource, /loadAbstractionResearchState\(d\.abstractionResearchState\)/);

  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  const restored = vm.runInContext(`(() => {
    abstractionResearchState['1-1'] = true;
    abstractionResearchState['2-1'] = true;
    const serialized = JSON.stringify({ abstractionResearchState: { ...abstractionResearchState } });
    loadAbstractionResearchState(null);
    loadAbstractionResearchState(JSON.parse(serialized).abstractionResearchState);
    return ['1-1', '2-1'].map(hasAbstractionResearch);
  })()`, context);

  assert.deepEqual(Array.from(restored), [true, true]);
});

test('Great Theory can be purchased with SP at a 1e1000x cost multiplier', () => {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    render = () => {};
    knuthUnlocked = true;
    const selected = setAbstractionCostResource(2);
    squarePoints = NumberMath.fromString('1e1000');
    const firstCostCorrect = compareNumberValues(greatTheoryCostForResource(2), '1e1000') === 0;
    const firstPurchase = purchaseGreatTheory(1);
    const secondCostCorrect = compareNumberValues(greatTheorySpCost, '1e2000') === 0;
    squarePoints = NumberMath.fromString('1e2000');
    const secondPurchase = purchaseGreatTheory(1);
    const thirdCostCorrect = compareNumberValues(greatTheorySpCost, '1e3000') === 0;

    greatTheory = 0;
    greatTheorySpCost = ABSTRACTION_SP_BASE_COST;
    squarePoints = NumberMath.fromString('1e3000');
    const maximum = greatTheoryMaximumPurchases();
    const maximumPurchase = purchaseGreatTheory(maximum);
    return {
      selected,
      firstCostCorrect,
      firstPurchase,
      secondCostCorrect,
      secondPurchase,
      thirdCostCorrect,
      maximum,
      maximumPurchase,
      maxCostAfterPurchaseCorrect: compareNumberValues(greatTheorySpCost, '1e3000') === 0
    };
  })()`, context)));

  assert.deepEqual(result, {
    selected: true,
    firstCostCorrect: true,
    firstPurchase: true,
    secondCostCorrect: true,
    secondPurchase: true,
    thirdCostCorrect: true,
    maximum: 2,
    maximumPurchase: true,
    maxCostAfterPurchaseCorrect: true
  });
  assert.match(saveSource, /greatTheorySpCost:\s*serializeNumberValue\(greatTheorySpCost\)/);
  assert.match(saveSource, /greatTheorySpCost\s*=\s*numberValueFromSave\(d\.greatTheorySpCost, ABSTRACTION_SP_BASE_COST\)/);
  assert.match(saveSource, /savedAbstractionResourceIndex\s*<=\s*3/);
});

test('abstraction progression persists across Knuth and challenge resets', () => {
  const context = vm.createContext({ performance: { now: () => 0 } });
  for (const file of ['constants.js', 'number-math.js', 'state.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../scripts/core', file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  const result = JSON.parse(JSON.stringify(vm.runInContext(`(() => {
    extraPercentLanesEl = { innerHTML: '' };
    render = () => {};
    knuthUnlocked = true;
    abstractionResearchState['1-1'] = true;
    abstractionResearchState['2-1'] = true;
    greatTheory = 1;
    const researchAdded = ABSTRACTION_RESEARCHES.some(item =>
      item.id === '3-1' && item.parents.includes('2-1') && item.greatTheoryCost === 1
    );
    const boughtResearch = researchAbstraction('3-1');
    greatTheory = 17;
    greatTheoryCpCost = NumberMath.fromString('1e30');
    greatTheoryKpCost = 128;
    abstractionCostResourceIndex = 1;
    resetProgressForNewKnuthRun();
    const retainedWithoutPurchase = hasSquareConvergenceUpgrade('automatium');
    const abstractionAfterFirstReset = {
      research: ['1-1', '2-1', '3-1'].map(hasAbstractionResearch),
      greatTheory: NumberMath.serialize(greatTheory),
      cpCost: NumberMath.serialize(greatTheoryCpCost),
      kpCost: NumberMath.serialize(greatTheoryKpCost),
      resourceIndex: abstractionCostResourceIndex
    };

    squareConvergenceUpgradeState.automatium = true;
    squareConvergenceUpgradeLevels.automatium = 1;
    resetProgressForNewKnuthRun();
    return {
      researchAdded,
      boughtResearch,
      abstractionAfterFirstReset,
      researchRetained: hasAbstractionResearch('3-1'),
      permanentFlag: automatiumPrestigeRetentionUnlocked,
      retainedWithoutPurchase,
      automatiumRetained: hasSquareConvergenceUpgrade('automatium'),
      skipCutsceneUnlocked: squareUpgradeState.skip_cutscene,
      autoUpgradeUnlocked: squareUpgradeState.auto_upgrade_top_down
    };
  })()`, context)));

  assert.deepEqual(result, {
    researchAdded: true,
    boughtResearch: true,
    abstractionAfterFirstReset: {
      research: [true, true, true],
      greatTheory: '17',
      cpCost: '1000000000000000000000000000000',
      kpCost: '128',
      resourceIndex: 1
    },
    researchRetained: true,
    permanentFlag: true,
    retainedWithoutPurchase: false,
    automatiumRetained: true,
    skipCutsceneUnlocked: true,
    autoUpgradeUnlocked: true
  });
});
