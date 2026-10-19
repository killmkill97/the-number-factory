const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} != ${expected}`);
}

test('SP requirement discount is neutral unless unlocked, enabled and funded in selected SP mode', () => {
  assert.deepEqual(run(game(), `
    singularityPoints=1;numberBlackHoleDonationRate=100;
    numberBlackHoleTotalSpInvested=NumberMath.fromString('1e900000');
    const numberMode=plain(singularityRadiusRequirement());numberBlackHoleDonationResource='sp';
    const locked=plain(singularityRadiusRequirement());abstractionResearchState['15-1']=true;
    const active=plain(singularityRadiusRequirement());numberBlackHoleSystemEnabled=false;
    const disabled=plain(singularityRadiusRequirement());numberBlackHoleSystemEnabled=true;knuthUnlocked=false;
    const noKnuth=plain(singularityRadiusRequirement());knuthUnlocked=true;numberBlackHoleTotalSpInvested=0;
    const empty=plain(singularityRadiusRequirement());
    return {numberMode,locked,active:active<200,disabled,noKnuth,empty};
  `), { numberMode: 200, locked: 200, active: true, disabled: 200, noKnuth: 200, empty: 200 });
});

test('both real donation speed and current radius smoothly increase a discount bounded by one threshold', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';numberBlackHoleTotalSpInvested=1;
    let sampleRadius=0;numberBlackHoleSchwarzschildRadius=()=>sampleRadius;
    sampleRadius=50;
    const speed=[1,10,100,1000,Number.MAX_SAFE_INTEGER].map(v=>{numberBlackHoleDonationRate=v;return plain(singularitySpRequirementDivisor());});
    numberBlackHoleDonationRate=100;
    const radius=[0,1,20,50,500,NumberMath.fromString('1e1e20')].map(r=>{sampleRadius=r;return plain(singularitySpRequirementDivisor());});
    sampleRadius=50;const before=plain(singularitySpRequirementDivisor());sampleRadius=50.001;
    const after=plain(singularitySpRequirementDivisor());
    return {speed,radius,before,after};
  `);
  for (const values of [row.speed, row.radius]) {
    values.forEach(value => assert.ok(Number.isFinite(value) && value >= 1 && value <= 10));
    for (let i = 1; i < values.length; i++) assert.ok(values[i] > values[i - 1]);
  }
  assert.equal(row.radius[0], 1); assert.ok(row.after > row.before && row.after - row.before < 0.0001);
  close(row.before, 1 + 9 * Math.log10(101) / (1 + Math.log10(101)) * Math.log10(51) / (1 + Math.log10(51)));
});

test('a representative SP black hole can buy about one additional singularity, not a free chain', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';
    numberBlackHoleTotalSpInvested=NumberMath.fromString('1e1e10');numberBlackHoleDonationRate=100;
    singularityPoints=1;
    const radius=plain(numberBlackHoleSchwarzschildRadius()),requirement=plain(singularityRadiusRequirement()),eligible=canPurchaseSingularity();
    singularityPoints=2;const next=plain(singularityRadiusRequirement()),nextEligible=canPurchaseSingularity();
    singularityPoints=1;const bought=purchaseSingularity(),again=purchaseSingularity();
    return {radius,requirement,eligible,next,nextEligible,bought,again,held:plain(singularityPoints),
      postRequirement:plain(singularityRadiusRequirement()),mass:plain(numberBlackHoleTotalSpInvested),rate:numberBlackHoleDonationRate};
  `);
  assert.ok(row.radius < 200 && row.radius >= row.requirement); assert.equal(row.eligible, true);
  assert.ok(row.next > row.radius); assert.equal(row.nextEligible, false);
  assert.equal(row.bought, true); assert.equal(row.again, false); assert.equal(row.held, 2);
  assert.equal(row.postRequirement, 2000); assert.equal(row.mass, 0); assert.equal(row.rate, 1);
});

test('selected-resource changes update actual threshold and UI together without touching investment history', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';singularityPoints=1;
    numberBlackHoleDonationRate=100;numberBlackHoleTotalSpInvested=NumberMath.fromString('1e900000');numberBlackHoleSpDonationCount=123;
    renderNumberBlackHoleBoard();
    const active={requirement:plain(singularityRadiusRequirement()),label:singularityRadiusRequirementValue.textContent,
      progress:numberBlackHoleSpProgress.textContent};
    setNumberBlackHoleResource('number');
    const inactive={requirement:plain(singularityRadiusRequirement()),label:singularityRadiusRequirementValue.textContent,
      progress:numberBlackHoleSpProgress.textContent};
    setNumberBlackHoleResource('sp');
    return {active,inactive,restored:plain(singularityRadiusRequirement()),mass:logValue(numberBlackHoleTotalSpInvested),count:plain(numberBlackHoleSpDonationCount)};
  `);
  assert.ok(row.active.requirement < 200); assert.match(row.active.label, /\./);
  assert.equal(Number(row.active.label), Number(row.active.requirement.toPrecision(4)));
  assert.match(row.active.progress, /특이점 요구 ÷/); assert.equal(row.inactive.requirement, 200);
  assert.equal(row.inactive.label, '200'); assert.match(row.inactive.progress, /특이점 요구 ÷1$/);
  close(row.restored, row.active.requirement); assert.equal(row.mass, 900000); assert.equal(row.count, 123);
});

test('discount survives save/load as a derived value and no old progress or new saved field is required', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';singularityPoints=1;
    numberBlackHoleDonationSpeedLevel=10;numberBlackHoleDonationRate=101;
    numberBlackHoleTotalSpInvested=NumberMath.fromString('1e900000');
    const before=plain(singularityRadiusRequirement());saveGame();const saved=localStorage.getItem(SAVE_KEY);
    numberBlackHoleDonationResource='number';numberBlackHoleDonationRate=1;
    loadGame(saved,{countAsLoad:false});
    return {before,after:plain(singularityRadiusRequirement()),rate:numberBlackHoleDonationRate,errors};
  `);
  close(row.before, row.after); assert.equal(row.rate, 101); assert.deepEqual(row.errors, []);
});

test('layered radius and holdings stay positive and discounted no more than tenfold', () => {
  const row = run(game(), `
    abstractionResearchState['15-1']=true;numberBlackHoleDonationResource='sp';
    numberBlackHoleDonationRate=Number.MAX_SAFE_INTEGER;
    numberBlackHoleTotalSpInvested=NumberMath.fromString('1e1e1e20');singularityPoints=NumberMath.fromString('1e20');
    const divisor=plain(singularitySpRequirementDivisor()),discounted=singularityRadiusRequirement();
    numberBlackHoleDonationResource='number';const base=singularityRadiusRequirement();
    return {divisor,positive:isPositiveNumberValue(discounted),less:compareNumberValues(discounted,base)<=0,
      bounded:compareNumberValues(discounted,NumberMath.divideApproximate(base,10))>=0,
      text:JSON.stringify(NumberMath.serialize(discounted))};
  `);
  assert.ok(row.divisor >= 1 && row.divisor <= 10); assert.equal(row.positive, true);
  assert.equal(row.less, true); assert.equal(row.bounded, true); assert.doesNotMatch(row.text, /NaN|Infinity|undefined/);
});
