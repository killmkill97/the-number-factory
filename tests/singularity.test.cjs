const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function game() {
  const elements = new Map(), storage = new Map();
  const element = (id = '') => ({ id, dataset: {}, style: {}, children: [], innerHTML: '', textContent: '', disabled: false,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, setAttribute() {}, remove() {}, append() {}, appendChild() {}, replaceChildren() {} });
  const document = { body: element(), addEventListener() {}, querySelector: () => element(), createElement: () => element(),
    getElementById(id) { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); } };
  const errors = [];
  const context = vm.createContext({ document, errors, performance: { now: () => 100 },
    console: { error: error => errors.push(String(error)) }, URLSearchParams,
    setInterval() {}, setTimeout() {}, clearTimeout() {},
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    window: { location: { pathname: '/', search: '' }, addEventListener() {}, setTimeout() {}, clearTimeout() {} },
    fetch: () => ({ then() { return this; }, catch() { return this; } }) });
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js', 'core/dom.js',
    'systems/percent-lanes.js', 'systems/achievements.js', 'systems/number-black-hole.js', 'core/save.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext(`
    render=()=>{};log=()=>{};setChapter=()=>{};let activeSquareView='upgrades';
    knuthUnlocked=true;hasClaimedKnuthPoint=true;numberBlackHoleSystemEnabled=true;
    function logValue(value){return NumberMath.toNumber(NumberMath.log10(value));}
    function plain(value){return NumberMath.toNumber(value);}
    function singularitySnapshot(){return [singularityPoints,totalSingularitiesPurchased,
      singularityUpgradeLevels.black_hole,singularityUpgradeLevels.kp_gain].map(NumberMath.serialize);}
  `, context);
  return context;
}
function run(context, source) { return JSON.parse(JSON.stringify(vm.runInContext(`(()=>{${source}})()`, context))); }
function close(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), JSON.stringify({ actual, expected }));
}

test('singularity requirement starts at 20 and grows tenfold by held balance, not lifetime purchases', () => {
  const row = run(game(), `
    totalSingularitiesPurchased=999;
    const requirements=[0,1,2,3].map(count=>{singularityPoints=count;return plain(singularityRadiusRequirement());});
    singularityPoints=20;totalSingularitiesPurchased=20;buySingularityUpgrade('black_hole');
    return {requirements,next:logValue(singularityRadiusRequirement()),held:plain(singularityPoints)};
  `);
  row.requirements.forEach((value, i) => close(value, 20 * 10 ** i));
  close(row.next, Math.log10(20) + 19); assert.equal(row.held, 19);
});

test('spending either upgrade lowers the requirement immediately and enables another collapse at radius 20', () => {
  for (const id of ['black_hole', 'kp_gain']) {
    const row = run(game(), `
      singularityPoints=singularityUpgradeCost('${id}');totalSingularitiesPurchased=100;
      numberBlackHoleSchwarzschildRadius=()=>20;
      const before=canPurchaseSingularity(),bought=buySingularityUpgrade('${id}');
      renderSingularityBoard();
      const after={held:plain(singularityPoints),radius:plain(singularityRadiusRequirement()),
        available:canPurchaseSingularity(),label:singularityRadiusRequirementValue.textContent,disabled:singularityPurchaseBtn.disabled};
      const collapsed=purchaseSingularity();
      return {before,bought,after,collapsed,held:plain(singularityPoints),radius:plain(singularityRadiusRequirement()),lifetime:plain(totalSingularitiesPurchased)};
    `);
    assert.deepEqual(row, { before: false, bought: true,
      after: { held: 0, radius: 20, available: true, label: '20', disabled: false },
      collapsed: true, held: 1, radius: 200, lifetime: 101 });
  }
});

test('existing saves with zero held singularities and prior purchases load with radius requirement 20', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=0;totalSingularitiesPurchased=1;singularityUpgradeLevels.black_hole=1;
    saveGame();const saved=localStorage.getItem(SAVE_KEY);
    singularityPoints=5;totalSingularitiesPurchased=50;
    loadGame(saved,{countAsLoad:false});renderSingularityBoard();
    return {held:singularityPoints,lifetime:totalSingularitiesPurchased,level:singularityUpgradeLevels.black_hole,
      radius:plain(singularityRadiusRequirement()),label:singularityRadiusRequirementValue.textContent,errors};
  `), { held: 0, lifetime: 1, level: 1, radius: 20, label: '20', errors: [] });
});

test('radius threshold is inclusive, cannot purchase below it or before Knuth, and does not require running donations', () => {
  assert.deepEqual(run(game(), `
    numberBlackHoleSchwarzschildRadius=()=>19.999;const below=canPurchaseSingularity();
    const refused=purchaseSingularity();numberBlackHoleSchwarzschildRadius=()=>20;
    const inclusive=canPurchaseSingularity();numberBlackHoleSystemEnabled=false;const inactive=canPurchaseSingularity();
    knuthUnlocked=false;return {below,refused,inclusive,inactive,locked:canPurchaseSingularity(),held:singularityPoints};
  `), { below: false, refused: false, inclusive: true, inactive: true, locked: false, held: 0 });
});

test('manual collapse resets every black-hole progression item without changing unrelated resources, equipment or achievements', () => {
  assert.deepEqual(run(game(), `
    setBaseNumber(12345);squarePoints=567;squareConvergencePoints=89;knuthPoints=10;theory=11;greatTheory=12;
    knuthEquippedUpgradeIds.add('percent_gain_square');achievementState.first_step=true;
    generalizationResearchState['1-1']=true;abstractionResearchState['1-1']=true;
    singularityUpgradeLevels.black_hole=2;singularityUpgradeLevels.kp_gain=3;
    numberBlackHoleDonationPercent=100;numberBlackHoleDonationRate=101;
    numberBlackHoleDonationAmountLevel=99;numberBlackHoleDonationSpeedLevel=10;
    numberBlackHoleDonationAmountCost=1234;numberBlackHoleDonationSpeedCost=5678;
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1e20');numberBlackHoleAccumulatedGameSeconds=999;
    numberBlackHoleDonationTimerMs=777;numberBlackHoleLastTickAt=-100;numberBlackHoleLastRenderAt=0;
    const bought=purchaseSingularity(),again=purchaseSingularity();
    return {bought,again,held:plain(singularityPoints),lifetime:plain(totalSingularitiesPurchased),
      reset:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate,numberBlackHoleDonationAmountLevel,
        numberBlackHoleDonationSpeedLevel,numberBlackHoleDonationAmountCost,numberBlackHoleDonationSpeedCost,
        numberBlackHoleTotalInvested,numberBlackHoleAccumulatedGameSeconds,numberBlackHoleDonationTimerMs],
      timer:numberBlackHoleLastTickAt,lastRender:numberBlackHoleLastRenderAt===-Infinity,enabled:numberBlackHoleSystemEnabled,
      resources:[plain(getBaseNumber()),squarePoints,squareConvergencePoints,knuthPoints,theory,greatTheory],
      other:[hasKnuthUpgrade('percent_gain_square'),achievementState.first_step,hasGeneralizationResearch('1-1'),
        hasAbstractionResearch('1-1')],levels:[singularityUpgradeLevels.black_hole,singularityUpgradeLevels.kp_gain]};
  `), { bought: true, again: false, held: 1, lifetime: 1, reset: [1, 1, 0, 0, 2, 2, 0, 0, 0], timer: 100,
    lastRender: true, enabled: true, resources: [12345, 567, 89, 10, 11, 12], other: [true, true, true, true], levels: [2, 3] });
});

test('repeatable upgrade costs follow 1*4^L and 2*8^L and spend only singularities', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=1000;totalSingularitiesPurchased=1000;knuthPoints=789;
    const costs=SINGULARITY_UPGRADES.map(u=>[0,1,2].map(level=>{
      singularityUpgradeLevels[u.id]=level;return plain(singularityUpgradeCost(u.id));}));
    singularityUpgradeLevels.black_hole=0;singularityUpgradeLevels.kp_gain=0;
    const purchases=['black_hole','black_hole','kp_gain','kp_gain'].map(buySingularityUpgrade);
    return {costs,purchases,held:plain(singularityPoints),levels:[singularityUpgradeLevels.black_hole,singularityUpgradeLevels.kp_gain],
      lifetime:totalSingularitiesPurchased,kp:knuthPoints};
  `), { costs: [[1, 4, 16], [2, 16, 128]], purchases: [true, true, true, true], held: 977,
    levels: [2, 2], lifetime: 1000, kp: 789 });
});

test('invalid, unaffordable and pre-Knuth upgrades leave balance and levels unchanged', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=1;const invalid=buySingularityUpgrade('unknown'),expensive=buySingularityUpgrade('kp_gain');
    knuthUnlocked=false;const locked=buySingularityUpgrade('black_hole');
    return {invalid,expensive,locked,held:singularityPoints,levels:singularityUpgradeLevels};
  `), { invalid: false, expensive: false, locked: false, held: 1, levels: { black_hole: 0, kp_gain: 0 } });
});

test('base effects are neutral at zero and linear in currently held singularities', () => {
  const rows = run(game(), `return [0,1,2,10].map(s=>{singularityPoints=s;return {
    bh:plain(singularityBlackHoleMultiplier()),percent:plain(singularityPercentMultiplier()),cap:plain(singularitySoftcapMultiplier()),kp:plain(singularityKpMultiplier())};});`);
  for (const [index, s] of [0, 1, 2, 10].entries()) {
    const expected = 1 + 99 * s; assert.deepEqual(rows[index], { bh: expected, percent: expected, cap: expected, kp: 1 });
  }
});

test('black-hole upgrade doubles its final multiplier; spent holdings adjust radius only through the mild bonus', () => {
  const row = run(game(), `
    singularityPoints=5;numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    const radius=numberBlackHoleSchwarzschildRadius(),base=numberBlackHoleBaseTimeMultiplier();
    buySingularityUpgrade('black_hole');
    const multiplier=plain(singularityBlackHoleMultiplier()),time=numberBlackHoleTimeMultiplier();
    numberBlackHoleSystemEnabled=false;const disabled=numberBlackHoleTimeMultiplier();
    numberBlackHoleSystemEnabled=true;divergerPower=NumberMath.fromString('1e1000');knuthEquippedUpgradeIds.add('diverger_black_hole');
    const combined=numberBlackHoleTimeMultiplier();
    return {held:plain(singularityPoints),multiplier,ratio:time/base,disabled,combined:combined/time,
      radiusRatio:plain(NumberMath.divideApproximate(numberBlackHoleSchwarzschildRadius(),radius))};
  `);
  assert.equal(row.held, 4); close(row.multiplier, 794); close(row.ratio, 794*1.2/1.25); assert.equal(row.disabled, 1);
  close(row.combined, 101); close(row.radiusRatio,1.2/1.25);
});

test('black-hole doubling persists when the last singularity is spent while held-quantity boosts fall to neutral', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=1;buySingularityUpgrade('black_hole');
    return {held:plain(singularityPoints),bh:plain(singularityBlackHoleMultiplier()),
      percent:plain(singularityPercentMultiplier()),cap:plain(singularitySoftcapMultiplier())};
  `), { held: 0, bh: 2, percent: 1, cap: 1 });
});

test('final time acceleration retains its existing safety cap and donation rate stays on real time', () => {
  const row = run(game(), `
    singularityPoints=1;setBaseNumber(1000);numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    const time=numberBlackHoleTimeMultiplier();advanceNumberBlackHole(1000);
    const remaining=plain(getBaseNumber()),accumulated=plain(numberBlackHoleAccumulatedGameSeconds);
    singularityUpgradeLevels.black_hole=NumberMath.fromString('1e100');
    return {time,remaining,accumulated,huge:numberBlackHoleTimeMultiplier()};
  `);
  close(row.remaining, 990); close(row.accumulated, row.time, 1e-8); assert.equal(row.huge, 1e100);
});

test('singularity softcap multiplier is applied once after all existing cap powers', () => {
  for (const squared of [false, true]) {
    const row = run(game(), `
      if(${squared})knuthEquippedUpgradeIds.add('percent_softcap_square');
      const before=percentPowerSoftcap(1);singularityPoints=1;const one=percentPowerSoftcap(1);
      singularityPoints=2;return {one:plain(NumberMath.divideApproximate(one,before)),
        two:plain(NumberMath.divideApproximate(percentPowerSoftcap(1),before))};
    `);
    close(row.one, 100); close(row.two, 199);
  }
});

test('single-use and manual percent production receive the same final linear multiplier at q1/q2/q4/q8', () => {
  for (const q of [1, 2, 4, 8]) for (const k of [1, 2]) {
    const rows = run(game(), `
      percentUnlocked=true;abstractionResearchState['8-2']=${q >= 4};
      if(${q === 2 || q === 8})knuthEquippedUpgradeIds.add('percent_gain_square');
      percentPowerSoftcapDecayPower=()=>${k};singularitySoftcapMultiplier=()=>1;
      return ['10000','1e2000'].map(start=>{
        const value=NumberMath.fromString(start);singularityPoints=0;const before=percentFinalUseGain(value,10);
        singularityPoints=1;const final=percentFinalUseGain(value,10);setBaseNumber(value);
        applyPercentUse(value,10,'test');
        return {q:percentProductionExponent(),ratio:plain(NumberMath.divideApproximate(final,before)),
          difference:logValue(getBaseNumber())-logValue(addBaseNumbers(value,final))};
      });
    `);
    for (const row of rows) { assert.equal(row.q, q); close(row.ratio, 100, 1e-6); close(row.difference, 0, 1e-7); }
  }
});

test('bulk percent production retains bounded processing and matches sequential production with singularities', () => {
  for (const q of [1, 2, 4, 8]) for (const k of [1, 2]) {
    const row = run(game(), `
      percentUnlocked=true;singularityPoints=1;percentPowerSoftcap=()=>100;
      percentPowerSoftcapDecayPower=()=>${k};abstractionResearchState['8-2']=${q >= 4};
      if(${q === 2 || q === 8})knuthEquippedUpgradeIds.add('percent_gain_square');
      let sequential=90;for(let i=0;i<1000;i++)sequential=percentUseValueAfterOne(sequential,1);
      setBaseNumber(90);applyPercentUsesBatch(1,1000,'bulk');
      const bulk=getBaseNumber();let calls=0;const original=percentFinalUseGain;
      percentFinalUseGain=(...args)=>{calls++;return original(...args);};
      applyPercentUsesBatch(1,1e100,'bulk');
      return {sequential:plain(sequential),bulk:plain(bulk),calls,huge:isPositiveNumberValue(getBaseNumber())};
    `);
    assert.ok(Math.abs(row.bulk / row.sequential - 1) < 0.01, JSON.stringify({ q, k, ...row }));
    assert.ok(row.calls < 150); assert.equal(row.huge, true);
  }
});

test('singularity KP upgrade uses current quantity squared and affects preview and actual repeat prestige payout', () => {
  const row = run(game(), `
    singularityPoints=4;totalSingularitiesPurchased=10;singularityUpgradeLevels.kp_gain=2;
    squareConvergencePoints=NumberMath.fromString('1e45');knuthPoints=7;
    const before=plain(knuthPointGain()),multiplier=plain(singularityKpMultiplier());
    beginKnuthPrestige();const actual=plain(knuthPoints);
    singularityPoints=3;squareConvergencePoints=NumberMath.fromString('1e45');
    const after=plain(knuthPointGain());hasClaimedKnuthPoint=false;
    return {before,multiplier,actual,after,first:knuthPointGain(),held:singularityPoints,lifetime:totalSingularitiesPurchased};
  `);
  assert.deepEqual(row, { before: 387, multiplier: 129, actual: 394, after: 219, first: 1, held: 3, lifetime: 10 });
});

test('SG currency, lifetime purchase counter and levels survive Knuth, challenge entry and challenge abandonment', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=9;totalSingularitiesPurchased=12;singularityUpgradeLevels.black_hole=2;singularityUpgradeLevels.kp_gain=3;
    const before=singularitySnapshot();resetProgressForNewKnuthRun();
    const knuth=JSON.stringify(before)===JSON.stringify(singularitySnapshot());
    const started=startKnuthChallenge('kc1'),entry=JSON.stringify(before)===JSON.stringify(singularitySnapshot());
    abandonKnuthChallenge();return {knuth,started,entry,abandoned:JSON.stringify(before)===JSON.stringify(singularitySnapshot())};
  `), { knuth: true, started: true, entry: true, abandoned: true });
});

test('ordinary square and convergence resets preserve singularities and do not award extra singularities', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=4;totalSingularitiesPurchased=7;singularityUpgradeLevels.black_hole=1;singularityUpgradeLevels.kp_gain=2;
    const before=singularitySnapshot();resetRunStateAfterSquarePrestige();
    const square=JSON.stringify(before)===JSON.stringify(singularitySnapshot());
    squarePoints=NumberMath.fromString('1e100');const cp=collectSquareConvergenceIfReady();
    return {square,cp:isPositiveNumberValue(cp),convergence:JSON.stringify(before)===JSON.stringify(singularitySnapshot())};
  `), { square: true, cp: true, convergence: true });
});

test('save/load roundtrips singularity currency, lifetime and both levels alongside reset black-hole data', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=6;totalSingularitiesPurchased=15;singularityUpgradeLevels.black_hole=2;singularityUpgradeLevels.kp_gain=1;
    const before=singularitySnapshot();saveGame();const saved=localStorage.getItem(SAVE_KEY);
    singularityPoints=0;totalSingularitiesPurchased=0;singularityUpgradeLevels.black_hole=0;singularityUpgradeLevels.kp_gain=0;
    loadGame(saved,{countAsLoad:false});return {same:JSON.stringify(before)===JSON.stringify(singularitySnapshot()),errors};
  `), { same: true, errors: [] });
});

test('old saves default all singularity state to zero and cannot retain values from a previously loaded save', () => {
  assert.deepEqual(run(game(), `
    saveGame();const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    delete saved.singularityPoints;delete saved.totalSingularitiesPurchased;delete saved.singularityUpgradeLevels;
    singularityPoints=100;totalSingularitiesPurchased=999;singularityUpgradeLevels.black_hole=30;singularityUpgradeLevels.kp_gain=20;
    loadGame(JSON.stringify(saved),{countAsLoad:false});
    return {zero:singularitySnapshot().every(value=>NumberMath.compare(NumberMath.fromString(value),0)===0),errors};
  `), { zero: true, errors: [] });
});

test('layered singularity values and costs roundtrip without native overflow, free upgrades or zero requirements', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=NumberMath.fromString('1e1e100');totalSingularitiesPurchased=singularityPoints;
    singularityUpgradeLevels.black_hole=NumberMath.fromString('1e20');singularityUpgradeLevels.kp_gain=NumberMath.fromString('1e10');
    const before=singularitySnapshot();saveGame();loadSingularityState({});loadGame(localStorage.getItem(SAVE_KEY),{countAsLoad:false});
    const values=[singularityRadiusRequirement(),singularityBlackHoleMultiplier(),singularityPercentMultiplier(),
      singularitySoftcapMultiplier(),singularityKpMultiplier(),...SINGULARITY_UPGRADES.map(u=>singularityUpgradeCost(u.id))];
    return {same:JSON.stringify(before)===JSON.stringify(singularitySnapshot()),positive:values.every(isPositiveNumberValue),
      sane:values.every(value=>!(/NaN|undefined|Infinity/.test(NumberMath.serialize(value)))),errors};
  `), { same: true, positive: true, sane: true, errors: [] });
});

test('load sanitation floors fractional counts, rejects negative values and ignores unknown upgrade keys', () => {
  assert.deepEqual(run(game(), `
    loadSingularityState({singularityPoints:2.9,totalSingularitiesPurchased:1.1,singularityUpgradeLevels:{black_hole:-1,kp_gain:3.9,unknown:100}});
    return {held:singularityPoints,lifetime:totalSingularitiesPurchased,levels:singularityUpgradeLevels};
  `), { held: 2, lifetime: 2, levels: { black_hole: 0, kp_gain: 3 } });
});

test('singularity board shows current holding, next radius, live effects and updated repeatable prices', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=2;totalSingularitiesPurchased=3;renderSingularityBoard();
    const before={held:singularityPointValue.textContent,next:singularityRadiusRequirementValue.textContent,
      percent:singularityPercentEffect.textContent,radius:singularityRadiusEffect.textContent,buy:singularityPurchaseBtn.disabled,
      bh:singularityBlackHoleUpgradeBtn.disabled,kp:singularityKpUpgradeBtn.disabled};
    buySingularityUpgrade('kp_gain');renderSingularityBoard();
    return {before,after:{held:singularityPointValue.textContent,next:singularityRadiusRequirementValue.textContent,kp:singularityKpUpgradeBtn.disabled,
      cost:singularityKpUpgradeCost.textContent,percent:singularityPercentEffect.textContent,radius:singularityRadiusEffect.textContent}};
  `), { before: { held: '2 / 16', next: '2k', percent: '×199', radius:'×1.1',buy: true, bh: false, kp: false },
    after: { held: '0 / 16', next: '20', kp: true, cost: '1회 구매 · 비용: 16 특이점', percent: '×1',radius:'×1' } });
});

test('held singularities mildly multiply radius and derived time without changing invested mass or donation settings', () => {
  const rows=run(game(), `
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    const mass=NumberMath.serialize(numberBlackHoleTotalInvested),radius=numberBlackHoleSchwarzschildRadius(),time=numberBlackHoleBaseTimeMultiplier();
    return [0,1,2,10].map(s=>{singularityPoints=s;return {
      factor:plain(singularityRadiusMultiplier()),radius:plain(NumberMath.divideApproximate(numberBlackHoleSchwarzschildRadius(),radius)),
      time:numberBlackHoleBaseTimeMultiplier()/time,mass:mass===NumberMath.serialize(numberBlackHoleTotalInvested),
      settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate]};});
  `);
  for(const [i,s] of [0,1,2,10].entries()){
    close(rows[i].factor,1+0.05*s);close(rows[i].radius,1+0.05*s);close(rows[i].time,1+0.05*s);
    assert.equal(rows[i].mass,true);assert.deepEqual(rows[i].settings,[1,1]);
  }
});

test('radius bonus counts held balance not lifetime or upgrade levels, and cannot grow an empty black hole', () => {
  assert.deepEqual(run(game(), `
    totalSingularitiesPurchased=100;singularityUpgradeLevels.black_hole=10;
    const zero=plain(singularityRadiusMultiplier());singularityPoints=10;
    return {zero,boost:plain(singularityRadiusMultiplier()),radius:plain(numberBlackHoleSchwarzschildRadius())};
  `),{zero:1,boost:1.5,radius:0});
});

test('boosted radius drives collapse eligibility while keeping the same requirement formula', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=1;
    const baseRadius=195;
    const massLog=NumberMath.power(NumberMath.subtract(NumberMath.powerOfTen(baseRadius),1),
      NumberMath.divideApproximate(1,addBaseNumbers(1,NumberMath.log10(2))));
    numberBlackHoleTotalInvested=NumberMath.subtract(NumberMath.powerOfTen(massLog),1);
    const before=canPurchaseSingularity(),requirement=plain(singularityRadiusRequirement());
    singularityPoints=0;const originalRadius=plain(numberBlackHoleSchwarzschildRadius());
    singularityPoints=1;const boostedRadius=plain(numberBlackHoleSchwarzschildRadius());
    return {before,requirement,originalRadius,boostedRadius};
  `),{before:true,requirement:200,originalRadius:195,boostedRadius:204.75});
});

test('layered held singularities keep radius positive and stable across save/load without a new saved field', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=NumberMath.fromString('1e1e1000');numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');
    const before=NumberMath.serialize(numberBlackHoleSchwarzschildRadius());saveGame();
    loadGame(localStorage.getItem(SAVE_KEY),{countAsLoad:false});
    const radius=numberBlackHoleSchwarzschildRadius();return {same:before===NumberMath.serialize(radius),
      positive:isPositiveNumberValue(radius),sane:!(/NaN|undefined|Infinity/.test(NumberMath.serialize(radius))),
      time:numberBlackHoleTimeMultiplier(),errors};
  `),{same:true,positive:true,sane:true,time:1e100,errors:[]});
});
