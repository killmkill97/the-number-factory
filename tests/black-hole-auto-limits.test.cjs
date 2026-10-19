const assert = require('node:assert/strict');
const test = require('node:test');
const {game,run} = require('./helpers/kc4-game.cjs');

test('new limit inputs are gated with KC4 and disabled when black-hole automation is unavailable', () => {
  assert.deepEqual(run(game(), `
    renderNumberBlackHoleBoard();const locked=numberBlackHoleAutomation.classList.contains('hidden')
      &&numberBlackHoleAutoAmountLimitInput.disabled&&numberBlackHoleAutoSpeedLimitInput.disabled;
    const rejected=!setNumberBlackHoleAutoLimit('amount',50);completedKnuthChallengeIds.add('kc4');
    renderNumberBlackHoleBoard();const unlocked=!numberBlackHoleAutomation.classList.contains('hidden')
      &&!numberBlackHoleAutoAmountLimitInput.disabled&&!numberBlackHoleAutoSpeedLimitInput.disabled;
    numberBlackHoleSystemEnabled=false;renderNumberBlackHoleBoard();
    return {locked,rejected,unlocked,disabled:numberBlackHoleAutoAmountLimitInput.disabled,
      defaults:[numberBlackHoleAutoAmountLimitInput.value,numberBlackHoleAutoSpeedLimitInput.value]};
  `),{locked:true,rejected:true,unlocked:true,disabled:true,defaults:['∞','∞']});
});

test('auto maximum sets the smaller of the desired cap and unlocked amount/rate, including lowering an existing setting', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');numberBlackHoleAutoMaxEnabled=true;
    numberBlackHoleDonationAmountLevel=99;numberBlackHoleDonationSpeedLevel=10;
    numberBlackHoleDonationPercent=100;numberBlackHoleDonationRate=101;
    const amount=setNumberBlackHoleAutoLimit('amount','50'),speed=setNumberBlackHoleAutoLimit('speed','25');
    advanceNumberBlackHoleAutomation(50);return {amount,speed,settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate],
      unlocked:[numberBlackHoleDonationPercentLimit(),numberBlackHoleDonationRateLimit()]};
  `),{amount:true,speed:true,settings:[50,25],unlocked:[100,101]});
});

test('future targets are not clamped away, auto-off does not change manual settings, and toggling auto applies both caps', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');setNumberBlackHoleAutoLimit('amount',50);setNumberBlackHoleAutoLimit('speed',25);
    const off=[numberBlackHoleDonationPercent,numberBlackHoleDonationRate];
    numberBlackHoleAutoMaxToggle.checked=true;numberBlackHoleAutoMaxToggle.events.change();
    const low=[numberBlackHoleDonationPercent,numberBlackHoleDonationRate];
    numberBlackHoleDonationAmountLevel=59;numberBlackHoleDonationSpeedLevel=10;
    advanceNumberBlackHoleAutomation(50);
    return {off,low,later:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate],targets:[numberBlackHoleAutoAmountLimit,numberBlackHoleAutoSpeedLimit]};
  `),{off:[1,1],low:[1,1],later:[50,25],targets:[50,25]});
});

test('inf and the infinity symbol remove the automatic cap and follow future unlocked maximums', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');numberBlackHoleAutoMaxEnabled=true;
    numberBlackHoleDonationAmountLevel=99;numberBlackHoleDonationSpeedLevel=10;
    setNumberBlackHoleAutoLimit('amount',50);setNumberBlackHoleAutoLimit('speed',25);
    const a=setNumberBlackHoleAutoLimit('amount',' INF '),b=setNumberBlackHoleAutoLimit('speed','∞');
    numberBlackHoleDonationSpeedLevel=11;advanceNumberBlackHoleAutomation(50);renderNumberBlackHoleBoard();
    return {a,b,targets:[numberBlackHoleAutoAmountLimit,numberBlackHoleAutoSpeedLimit],
      settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate],
      text:[numberBlackHoleAutoAmountLimitInput.value,numberBlackHoleAutoSpeedLimitInput.value]};
  `),{a:true,b:true,targets:[null,null],settings:[100,111],text:['∞','∞']});
});

test('input editing survives periodic renders, Enter or change commits, and invalid values restore the prior cap', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');const input=numberBlackHoleAutoAmountLimitInput;
    input.blur=()=>{document.activeElement=null;};document.activeElement=input;input.value='in';
    renderNumberBlackHoleBoard();const draft=input.value;
    input.value='50';input.events.keydown({key:'Enter',preventDefault(){}});
    const committed=[numberBlackHoleAutoAmountLimit,input.value];
    input.value='inf';input.events.change();const infinity=input.value;
    setNumberBlackHoleAutoLimit('amount',50);input.value='bad';input.events.change();
    return {draft,committed,infinity,invalid:[numberBlackHoleAutoAmountLimit,input.value]};
  `),{draft:'in',committed:[50,'50'],infinity:'∞',invalid:[50,'50']});
});

test('zero, fractions, negative, invalid and unsafe numeric caps cannot enter the saved configuration', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');setNumberBlackHoleAutoLimit('amount',50);
    const rejected=['',0,-1,1.5,'NaN','Infinity','1e999','9007199254740992',null,undefined]
      .every(value=>!setNumberBlackHoleAutoLimit('amount',value));
    return {rejected,kind:!setNumberBlackHoleAutoLimit('other',1),amount:numberBlackHoleAutoAmountLimit,
      maxSafe:setNumberBlackHoleAutoLimit('speed',String(Number.MAX_SAFE_INTEGER)),speed:numberBlackHoleAutoSpeedLimit};
  `),{rejected:true,kind:true,amount:50,maxSafe:true,speed:Number.MAX_SAFE_INTEGER});
});

test('numeric/null caps survive real save/load while missing or malformed old fields restore infinity', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');setNumberBlackHoleAutoLimit('amount',50);setNumberBlackHoleAutoLimit('speed','inf');
    numberBlackHoleAutoMaxEnabled=true;saveGame();const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
    const stored=[saved.numberBlackHoleAutoAmountLimit,saved.numberBlackHoleAutoSpeedLimit];
    numberBlackHoleAutoAmountLimit=1;numberBlackHoleAutoSpeedLimit=1;
    loadGame(JSON.stringify(saved),{countAsLoad:false});const restored=[numberBlackHoleAutoAmountLimit,numberBlackHoleAutoSpeedLimit,numberBlackHoleAutoMaxEnabled];
    delete saved.numberBlackHoleAutoAmountLimit;delete saved.numberBlackHoleAutoSpeedLimit;
    loadGame(JSON.stringify(saved),{countAsLoad:false});const legacy=[numberBlackHoleAutoAmountLimit,numberBlackHoleAutoSpeedLimit];
    saved.numberBlackHoleAutoAmountLimit=-1;saved.numberBlackHoleAutoSpeedLimit={bad:true};
    loadGame(JSON.stringify(saved),{countAsLoad:false});
    return {stored,restored,legacy,malformed:[numberBlackHoleAutoAmountLimit,numberBlackHoleAutoSpeedLimit],errors};
  `),{stored:[50,null],restored:[50,null,true],legacy:[null,null],malformed:[null,null],errors:[]});
});

test('automatic caps persist with automation preferences across Knuth, convergence and singularity', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');setNumberBlackHoleAutoLimit('amount',50);setNumberBlackHoleAutoLimit('speed',25);
    numberBlackHoleAutoMaxEnabled=true;resetProgressForNewKnuthRun();squarePoints=NumberMath.fromString('1e50');collectSquareConvergenceIfReady();
    numberBlackHoleSystemEnabled=true;numberBlackHoleSchwarzschildRadius=()=>20;purchaseSingularity();
    advanceNumberBlackHoleAutomation(50);
    return {targets:[numberBlackHoleAutoAmountLimit,numberBlackHoleAutoSpeedLimit],settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate]};
  `),{targets:[50,25],settings:[1,1]});
});

test('repeated auto setting does not restart an unchanged rate timer or accelerate real-time donations', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');numberBlackHoleDonationAmountLevel=99;numberBlackHoleDonationSpeedLevel=1;
    setNumberBlackHoleAutoLimit('amount',50);setNumberBlackHoleAutoLimit('speed',2);numberBlackHoleAutoMaxEnabled=true;
    advanceNumberBlackHoleAutomation(50);setBaseNumber(1000);
    for(let i=0;i<20;i++){advanceNumberBlackHoleAutomation(50);advanceNumberBlackHole(50);}
    return {number:plain(getBaseNumber()),mass:plain(numberBlackHoleTotalInvested),timer:numberBlackHoleDonationTimerMs};
  `),{number:250,mass:750,timer:0});
});

test('caps do not limit automatic purchases, alter explicit N max, bypass KC5, or remove the bulk purchase budget', () => {
  const r=run(game(), `
    completedKnuthChallengeIds.add('kc4');generalizationResearchState['3-4']=true;
    knuthPoints=NumberMath.fromString('1e10000');setNumberBlackHoleAutoLimit('amount',50);setNumberBlackHoleAutoLimit('speed',2);
    numberBlackHoleAutoUpgradeEnabled=true;numberBlackHoleAutoMaxEnabled=true;gameTick=()=>1e100;
    advanceNumberBlackHoleAutomation(1);const batch=numberBlackHoleDonationAmountLevel+numberBlackHoleDonationSpeedLevel;
    const auto=[numberBlackHoleDonationPercent,numberBlackHoleDonationRate];
    executeN('black_hole amount max');const nMax=numberBlackHoleDonationPercent;
    activeKnuthChallengeId='kc5';const blocked=!setNumberBlackHoleAutoLimit('amount',25)&&!advanceNumberBlackHoleAutomation(1000);
    return {batch,auto,nMax,blocked,target:numberBlackHoleAutoAmountLimit};
  `);
  assert.equal(r.batch,256);assert.deepEqual(r.auto,[50,2]);assert.equal(r.nMax,100);assert.equal(r.blocked,true);assert.equal(r.target,50);
});
