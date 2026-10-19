const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

test('15-1 costs 900 grand theory and accepts one active terminal branch parent', () => {
  for (const parent of ['14-1', '14-2', '14-3']) {
    assert.deepEqual(run(game(), `
      greatTheory=900;const locked=canResearchAbstraction('15-1');
      abstractionResearchState['${parent}']=true;
      greatTheory=899;const poor=researchAbstraction('15-1');greatTheory=900;
      const bought=researchAbstraction('15-1');
      return {locked,poor,bought,balance:plain(greatTheory),paid:abstractionResearchPaidCosts['15-1'],unlocked:numberBlackHoleSpUnlocked()};
    `), { locked: false, poor: false, bought: true, balance: 0, paid: 900, unlocked: true });
  }
  assert.equal(run(game(), `
    greatTheory=900;abstractionResearchState['14-2']=true;abstractionResearchState['14-1']=true;
    abstractionSecondBranchPurchaseOrder=['active','passive'];abstractionResearchState['14-1']=false;
    return canResearchAbstraction('15-1');
  `), false);
});

test('number donations and old radius formula are unchanged with no SP investment', () => {
  const row = run(game(), `
    setBaseNumber(1000000);squarePoints=1234;numberBlackHoleDonationPercent=10;
    const selected=setNumberBlackHoleResource('sp');applyNumberBlackHoleDonations(3);
    return {selected,number:plain(getBaseNumber()),sp:plain(squarePoints),mass:plain(numberBlackHoleTotalInvested),
      count:plain(numberBlackHoleSpDonationCount),radius:plain(numberBlackHoleSchwarzschildRadius())};
  `);
  assert.equal(row.selected, false); close(row.number, 729000); assert.equal(row.sp, 1234);
  close(row.mass, 271000); assert.equal(row.count, 0);
  close(row.radius, Math.log10(1 + Math.log10(271001) ** (1 + Math.log10(11))));
});

test('SP selection spends only SP; mass contribution is fourfold with gentle counted growth', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;setBaseNumber(12345);squarePoints=1000000;
    numberBlackHoleDonationPercent=10;setNumberBlackHoleResource('sp');
    applyNumberBlackHoleDonations(3);
    const base=numberBlackHoleRadiusFromMass(numberBlackHoleTotalSpInvested);
    return {number:plain(getBaseNumber()),sp:plain(squarePoints),numberMass:plain(numberBlackHoleTotalInvested),
      spMass:plain(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount),
      ratio:plain(divideNumberValue(numberBlackHoleSchwarzschildRadius(),base))};
  `);
  assert.equal(row.number, 12345); close(row.sp, 729000); assert.equal(row.numberMass, 0);
  close(row.spMass, 271000); assert.equal(row.count, 3); close(row.ratio, 4 * (1 + 0.01 * Math.log10(4)));
});

test('SP batching matches individual donations and counts no unfunded or exhausted 100% attempts', () => {
  const ctx = game();
  const row = run(ctx, `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';squarePoints=1e20;
    applyNumberBlackHoleDonations(10);
    const batch=[plain(squarePoints),plain(numberBlackHoleTotalSpInvested),plain(numberBlackHoleSpDonationCount),plain(numberBlackHoleSchwarzschildRadius())];
    squarePoints=1e20;numberBlackHoleTotalSpInvested=0;numberBlackHoleSpDonationCount=0;
    for(let i=0;i<10;i++)applyNumberBlackHoleDonations(1);
    const single=[plain(squarePoints),plain(numberBlackHoleTotalSpInvested),plain(numberBlackHoleSpDonationCount),plain(numberBlackHoleSchwarzschildRadius())];
    numberBlackHoleDonationPercent=100;numberBlackHoleSpDonationCount=0;applyNumberBlackHoleDonations(100);
    const exhausted=applyNumberBlackHoleDonations(100);
    return {batch,single,exhausted,count:plain(numberBlackHoleSpDonationCount),balance:plain(squarePoints)};
  `);
  row.batch.forEach((value, i) => close(value, row.single[i]));
  assert.equal(row.exhausted, false); assert.equal(row.count, 1); assert.equal(row.balance, 0);
});

test('switching resources preserves separate mass and only resets the donation clock on changes', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['15-1']=true;setBaseNumber(1000);squarePoints=2000;
    numberBlackHoleDonationPercent=100;applyNumberBlackHoleDonations(1);
    numberBlackHoleDonationTimerMs=777;setNumberBlackHoleResource('sp');const reset=numberBlackHoleDonationTimerMs;
    numberBlackHoleDonationTimerMs=333;setNumberBlackHoleResource('sp');const retained=numberBlackHoleDonationTimerMs;
    applyNumberBlackHoleDonations(1);setNumberBlackHoleResource('number');
    return {reset,retained,numberMass:plain(numberBlackHoleTotalInvested),spMass:plain(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount)};
  `), { reset: 0, retained: 333, numberMass: 1000, spMass: 2000, count: 1 });
});

test('SP to number switching uses only the selected mass and immediately updates radius, time and singularity eligibility', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;setBaseNumber(1000);squarePoints=NumberMath.fromString('1e900000');
    numberBlackHoleTotalInvested=1000;numberBlackHoleDonationResource='sp';
    applyNumberBlackHoleDonations(1);renderNumberBlackHoleBoard();
    const spRadius=plain(numberBlackHoleSchwarzschildRadius()),spTime=numberBlackHoleTimeMultiplier(),spEligible=canPurchaseSingularity();
    const expectedNumber=plain(numberBlackHoleRadiusFromMass(1000));
    const mass=NumberMath.serialize(numberBlackHoleTotalSpInvested),count=plain(numberBlackHoleSpDonationCount);
    setNumberBlackHoleResource('number');
    const numberRadius=plain(numberBlackHoleSchwarzschildRadius()),numberTime=numberBlackHoleTimeMultiplier(),numberEligible=canPurchaseSingularity();
    const label=numberBlackHoleRadiusValue.textContent;
    applyNumberBlackHoleDonations(1);
    const afterDonation=plain(numberBlackHoleSchwarzschildRadius()),expectedAfter=plain(numberBlackHoleRadiusFromMass(1010));
    setNumberBlackHoleResource('sp');
    return {spRadius,spTime,spEligible,expectedNumber,numberRadius,numberTime,numberEligible,label,
      afterDonation,expectedAfter,restored:plain(numberBlackHoleSchwarzschildRadius()),
      spMassPreserved:NumberMath.serialize(numberBlackHoleTotalSpInvested)===mass,countPreserved:plain(numberBlackHoleSpDonationCount)===count};
  `);
  close(row.numberRadius, row.expectedNumber); close(row.afterDonation, row.expectedAfter);
  assert.ok(row.spRadius > row.numberRadius); assert.ok(row.spTime > row.numberTime);
  assert.equal(row.spEligible, true); assert.equal(row.numberEligible, false);
  assert.equal(row.label, String(Math.floor(row.numberRadius)));
  close(row.restored, row.spRadius); assert.equal(row.spMassPreserved, true); assert.equal(row.countPreserved, true);
});

test('inactive SP mass cannot strengthen number mode after save/load or when SP research is locked', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleTotalInvested=1000;
    numberBlackHoleTotalSpInvested=NumberMath.fromString('1e1e20');numberBlackHoleSpDonationCount=1000000;
    numberBlackHoleDonationResource='number';saveGame();const saved=localStorage.getItem(SAVE_KEY);
    numberBlackHoleDonationResource='sp';loadGame(saved,{countAsLoad:false});
    const loaded=plain(numberBlackHoleSchwarzschildRadius()),expected=plain(numberBlackHoleRadiusFromMass(1000));
    setNumberBlackHoleResource('sp');const boosted=plain(numberBlackHoleSchwarzschildRadius());
    abstractionResearchState['15-1']=false;
    return {loaded,expected,boosted,locked:plain(numberBlackHoleSchwarzschildRadius()),
      mass:logValue(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount),errors};
  `);
  close(row.loaded, row.expected); close(row.locked, row.expected); assert.ok(row.boosted > row.expected);
  assert.equal(row.mass, 1e20); assert.equal(row.count, 1000000); assert.deepEqual(row.errors, []);
});

test('SP donations stay on real time regardless of time acceleration; selector follows research', () => {
  const row = run(game(), `
    renderNumberBlackHoleBoard();const hidden=numberBlackHoleResourceControl.classList.contains('hidden');
    abstractionResearchState['15-1']=true;setNumberBlackHoleResource('sp');squarePoints=1000;
    numberBlackHoleDonationRate=1;gameTick=ms=>ms*1e10;advanceNumberBlackHole(999);
    const before=plain(squarePoints);advanceNumberBlackHole(1);renderNumberBlackHoleBoard();
    return {hidden,visible:!numberBlackHoleResourceControl.classList.contains('hidden'),
      selected:numberBlackHoleResourceSelect.value,before,after:plain(squarePoints),count:plain(numberBlackHoleSpDonationCount)};
  `);
  assert.deepEqual(row, { hidden: true, visible: true, selected: 'sp', before: 1000, after: 990, count: 1 });
});

test('SP investment, selection, counts and research roundtrip; old saves default to number without losing mass', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';
    numberBlackHoleTotalInvested=123;numberBlackHoleTotalSpInvested=NumberMath.fromString('1e904000');numberBlackHoleSpDonationCount=1e20;
    saveGame();const raw=localStorage.getItem(SAVE_KEY);
    numberBlackHoleDonationResource='number';numberBlackHoleTotalSpInvested=0;numberBlackHoleSpDonationCount=0;
    loadGame(raw,{countAsLoad:false});
    const restored={resource:numberBlackHoleActiveResource(),spLog:logValue(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount),numberMass:plain(numberBlackHoleTotalInvested)};
    const old=JSON.parse(raw);delete old.numberBlackHoleDonationResource;delete old.numberBlackHoleTotalSpInvested;delete old.numberBlackHoleSpDonationCount;
    loadGame(JSON.stringify(old),{countAsLoad:false});
    return {restored,old:{resource:numberBlackHoleActiveResource(),sp:plain(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount),numberMass:plain(numberBlackHoleTotalInvested)},errors};
  `), { restored: { resource: 'sp', spLog: 904000, count: 1e20, numberMass: 123 },
    old: { resource: 'number', sp: 0, count: 0, numberMass: 123 }, errors: [] });
});

test('giant SP inputs remain finite and singularity resets investment/count while preserving resource selection', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';
    squarePoints=NumberMath.fromString('1e1e20');applyNumberBlackHoleDonations(Number.MAX_SAFE_INTEGER);
    const radius=NumberMath.serialize(numberBlackHoleSchwarzschildRadius());
    const available=canPurchaseSingularity();const purchased=purchaseSingularity();
    return {radius,available,purchased,resource:numberBlackHoleDonationResource,mass:plain(numberBlackHoleTotalSpInvested),
      count:plain(numberBlackHoleSpDonationCount),research:hasAbstractionResearch('15-1')};
  `);
  assert.ok(!/NaN|Infinity|undefined/.test(String(row.radius))); assert.equal(row.available, true);
  assert.equal(row.purchased, true); assert.equal(row.resource, 'sp'); assert.equal(row.mass, 0);
  assert.equal(row.count, 0); assert.equal(row.research, true);
});

test('singularity preserves each selected resource and subsequent donations continue from that resource with reset progression', () => {
  for(const resource of ['number','sp']){
    const row=run(game(), `
      abstractionResearchState['15-1']=true;setNumberBlackHoleResource('${resource}');
      numberBlackHoleDonationAmountLevel=99;numberBlackHoleDonationPercent=100;
      numberBlackHoleDonationSpeedLevel=9;numberBlackHoleDonationRate=91;
      setBaseNumber('1e1e20');squarePoints=NumberMath.fromString('1e1e20');applyNumberBlackHoleDonations(1);
      const purchased=purchaseSingularity();renderNumberBlackHoleBoard();
      const reset=[numberBlackHoleDonationPercent,numberBlackHoleDonationRate,numberBlackHoleDonationAmountLevel,
        numberBlackHoleDonationSpeedLevel,plain(numberBlackHoleTotalInvested),plain(numberBlackHoleTotalSpInvested),plain(numberBlackHoleSpDonationCount)];
      const displayed=numberBlackHoleResourceSelect.value;
      saveGame();numberBlackHoleDonationResource='number';loadGame(localStorage.getItem(SAVE_KEY),{countAsLoad:false});
      const restored=numberBlackHoleActiveResource();setBaseNumber(1000);squarePoints=1000;
      advanceNumberBlackHole(1000);
      return {purchased,reset,displayed,restored,number:plain(getBaseNumber()),sp:plain(squarePoints),
        numberMass:plain(numberBlackHoleTotalInvested),spMass:plain(numberBlackHoleTotalSpInvested)};
    `);
    assert.deepEqual(row,{purchased:true,reset:[1,1,0,0,0,0,0],displayed:resource,restored:resource,
      number:resource==='number'?990:1000,sp:resource==='sp'?990:1000,
      numberMass:resource==='number'?10:0,spMass:resource==='sp'?10:0});
  }
});

test('preserving an SP preference through singularity does not bypass its research gate', () => {
  assert.deepEqual(run(game(), `
    numberBlackHoleDonationResource='sp';numberBlackHoleTotalInvested=NumberMath.fromString('1e1e20');
    const purchased=purchaseSingularity();const gated=numberBlackHoleActiveResource();
    abstractionResearchState['15-1']=true;return {purchased,gated,selected:numberBlackHoleDonationResource,
      restored:numberBlackHoleActiveResource(),mass:plain(numberBlackHoleTotalSpInvested)};
  `),{purchased:true,gated:'number',selected:'sp',restored:'sp',mass:0});
});

test('Knuth preserves SP black-hole progression; optional research reset refunds 900 and gates new SP use', () => {
  assert.deepEqual(run(game(), `
    abstractionResearchState['15-1']=true;abstractionResearchPaidCosts['15-1']=900;greatTheory=0;
    numberBlackHoleDonationResource='sp';numberBlackHoleTotalSpInvested=12345;numberBlackHoleSpDonationCount=777;
    resetProgressForNewKnuthRun();
    const before={mass:plain(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount),resource:numberBlackHoleActiveResource()};
    abstractionResetOnNextKnuthPoint=true;applyAbstractionResetOnKnuthPoint();
    return {before,refund:plain(greatTheory),selected:numberBlackHoleDonationResource,active:numberBlackHoleActiveResource(),
      mass:plain(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount)};
  `), { before: { mass: 12345, count: 777, resource: 'sp' }, refund: 900, selected: 'sp', active: 'number', mass: 12345, count: 777 });
});
