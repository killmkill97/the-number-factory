const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run, referenceRun } = require('./helpers/kc4-game.cjs');
function close(a, b) { assert.ok(Math.abs(a-b) <= 1e-9*Math.max(1, Math.abs(b)), JSON.stringify({a,b})); }

test('KC4 uses unaccelerated exponential decay, never affecting other challenges', () => {
  const ctx = game();
  const baseline = run(ctx, 'return gameTick(100);');
  run(ctx, "activeKnuthChallengeId='kc4';resetKc4Time();");
  ctx.advance(1000);
  close(run(ctx, 'return gameTick(100);'), baseline / 2);
  ctx.advance(1000);
  close(run(ctx, 'return gameTick(100);'), baseline / 4);
  assert.equal(run(ctx, "activeKnuthChallengeId='kc3';return gameTick(100);"), baseline);
  ctx.advance(1e8);
  assert.equal(run(ctx, "activeKnuthChallengeId='kc4';return kc4TimeMultiplier()>0;"), true);
});

test('only successful convergence resets KC4 decay; square prestige and failed CP do not', () => {
  const ctx = game();
  run(ctx, "activeKnuthChallengeId='kc4';resetKc4Time();");ctx.advance(1000);
  assert.deepEqual(run(ctx, `
    squarePoints=0;const failed=collectSquareConvergenceIfReady();
    const before=syncKc4RealTime();resetSquarePrestigeCycleTime();const same=syncKc4RealTime();
    squarePoints=NumberMath.fromString('1e40');const reward=collectSquareConvergenceIfReady();
    return {failed,before,same,success:isPositiveNumberValue(reward),time:kc4ElapsedRealSeconds,m:kc4TimeMultiplier()};
  `), {failed:0,before:1,same:1,success:true,time:0,m:1});
});

test('KC4 cannot complete early, keeps existing manual completion and preserves its reward', () => {
  assert.deepEqual(run(game(), `
    startKnuthChallenge('kc4');const before=canCompleteKnuthChallenge();
    squareConvergencePoints=NumberMath.fromString('9.99e19');const short=completeKnuthChallenge();
    squareConvergencePoints=NumberMath.fromString('1e20');const ready=canCompleteKnuthChallenge();
    const stillActive=activeKnuthChallengeId;const completed=completeKnuthChallenge();
    return {before,short,ready,stillActive,completed,reward:numberBlackHoleAutomationUnlocked(),active:activeKnuthChallengeId};
  `),{before:false,short:false,ready:true,stillActive:'kc4',completed:true,reward:true,active:null});
});

test('save/load preserves elapsed KC4 time and automation preferences without counting offline time', () => {
  const ctx = game();run(ctx, "activeKnuthChallengeId='kc4';resetKc4Time();numberBlackHoleAutoUpgradeEnabled=true;numberBlackHoleAutoMaxEnabled=true;");
  ctx.advance(750);run(ctx, 'saveGame();');ctx.advance(86400000);
  assert.deepEqual(run(ctx, `loadGame(localStorage.getItem(SAVE_KEY),{countAsLoad:false});
    return {active:activeKnuthChallengeId,time:syncKc4RealTime(),buy:numberBlackHoleAutoUpgradeEnabled,max:numberBlackHoleAutoMaxEnabled,errors};
  `),{active:'kc4',time:0.75,buy:true,max:true,errors:[]});
  assert.deepEqual(run(ctx, `const old=JSON.parse(localStorage.getItem(SAVE_KEY));delete old.kc4ElapsedRealSeconds;
    delete old.numberBlackHoleAutoUpgradeEnabled;delete old.numberBlackHoleAutoMaxEnabled;
    loadGame(JSON.stringify(old),{countAsLoad:false});return [kc4ElapsedRealSeconds,numberBlackHoleAutoUpgradeEnabled,numberBlackHoleAutoMaxEnabled];
  `),[0,false,false]);
});

test('black-hole automatic purchase and max toggles are separate and locked until KC4 completion', () => {
  assert.deepEqual(run(game(), `
    knuthPoints=4;numberBlackHoleAutoUpgradeEnabled=true;numberBlackHoleAutoMaxEnabled=true;
    const locked=advanceNumberBlackHoleAutomation(1000);completedKnuthChallengeIds.add('kc4');
    generalizationResearchState['3-4']=true;const bought=advanceNumberBlackHoleAutomation(1000);
    return {locked,bought,kp:plain(knuthPoints),levels:[numberBlackHoleDonationAmountLevel,numberBlackHoleDonationSpeedLevel],
      settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate]};
  `),{locked:false,bought:true,kp:0,levels:[1,1],settings:[2,11]});
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');knuthPoints=100;numberBlackHoleAutoUpgradeEnabled=true;
    advanceNumberBlackHoleAutomation(1000);const manual=[numberBlackHoleDonationPercent,numberBlackHoleDonationRate];
    numberBlackHoleAutoUpgradeEnabled=false;numberBlackHoleAutoMaxEnabled=true;const kp=NumberMath.serialize(knuthPoints);
    advanceNumberBlackHoleAutomation(1000);return {manual,spends:kp!==NumberMath.serialize(knuthPoints),
      settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate]};
  `),{manual:[1,1],spends:false,settings:[2,1]});
});

test('automatic max never resets an unchanged donation timer or accelerates donations', () => {
  assert.deepEqual(run(game(), `
    completedKnuthChallengeIds.add('kc4');numberBlackHoleAutoMaxEnabled=true;setBaseNumber(1000);
    const before=NumberMath.serialize(numberBlackHoleTotalInvested);
    for(let i=0;i<20;i++){advanceNumberBlackHoleAutomation(50);advanceNumberBlackHole(50);}
    return {number:plain(getBaseNumber()),mass:plain(numberBlackHoleTotalInvested),timer:numberBlackHoleDonationTimerMs};
  `),{number:990,mass:10,timer:0});
});

test('N black-hole upgrades skip or wait like existing buy commands and use KP', () => {
  assert.deepEqual(run(game(), `
    knuthPoints=100;const locked=executeN('buy black_hole amount');
    const unchanged=numberBlackHoleDonationAmountLevel;completedKnuthChallengeIds.add('kc4');
    executeN('buy black_hole amount\\nbuy black_hole speed\\nblack_hole amount max\\nblack_hole speed max');
    const result={locked,unchanged,levels:[numberBlackHoleDonationAmountLevel,numberBlackHoleDonationSpeedLevel],
      settings:[numberBlackHoleDonationPercent,numberBlackHoleDonationRate],kp:plain(knuthPoints),
      cost:plain(nUpgradeSnapshot('black_hole','speed',null).cost)};
    knuthPoints=0;result.waits=!executeN('buy black_hole amount s');return result;
  `),{locked:true,unchanged:0,levels:[1,1],settings:[2,11],kp:96,cost:3,waits:true});
});

test('N setting expressions are integer-only, clamp at the current limit and do not spend KP', () => {
  const ctx = game();
  assert.deepEqual(run(ctx, `completedKnuthChallengeIds.add('kc4');knuthPoints=10;
    numberBlackHoleDonationAmountLevel=20;numberBlackHoleDonationSpeedLevel=2;
    executeN('x = number\\nx = 5\\nblack_hole amount x + 2\\nblack_hole speed 500');
    return [numberBlackHoleDonationPercent,numberBlackHoleDonationRate,plain(knuthPoints)];`),[7,21,10]);
  assert.throws(()=>run(ctx,"executeN('black_hole amount 1.5');"),/정수/);
  assert.throws(()=>run(ctx,"executeN('black_hole amount 0');"),/정수/);
  assert.throws(()=>run(ctx,"executeN('black_hole amount true');"),/number/);
  assert.throws(()=>run(ctx,"executeN('black_hole invalid max');"),/amount/);
});

test('accelerated automatic and N bulk black-hole upgrades stay bounded and respect amount cap', () => {
  const ctx = game();
  const row=run(ctx, `completedKnuthChallengeIds.add('kc4');generalizationResearchState['3-4']=true;
    knuthPoints=NumberMath.fromString('1e10000');numberBlackHoleAutoUpgradeEnabled=true;gameTick=()=>1e100;
    advanceNumberBlackHoleAutomation(1);const total=numberBlackHoleDonationAmountLevel+numberBlackHoleDonationSpeedLevel;
    automatiumGameAdapter.buy('black_hole','amount',null,null);const capped=numberBlackHoleDonationAmountLevel;
    const before=numberBlackHoleDonationSpeedLevel;automatiumGameAdapter.buy('black_hole','speed',null,null);
    return {total,capped,batch:numberBlackHoleDonationSpeedLevel-before,limit:AUTOMATIUM_BULK_MAX_PER_COMMAND};`);
  assert.equal(row.total,256);assert.equal(row.capped,99);assert.ok(row.batch>0&&row.batch<=row.limit);
});

test('automation toggles and completed KC4 survive Knuth, convergence and singularity resets', () => {
  assert.deepEqual(run(game(), `completedKnuthChallengeIds.add('kc4');numberBlackHoleAutoUpgradeEnabled=true;numberBlackHoleAutoMaxEnabled=true;
    resetProgressForNewKnuthRun();squarePoints=NumberMath.fromString('1e50');collectSquareConvergenceIfReady();
    numberBlackHoleSchwarzschildRadius=()=>20;purchaseSingularity();
    return [numberBlackHoleAutomationUnlocked(),numberBlackHoleAutoUpgradeEnabled,numberBlackHoleAutoMaxEnabled];`),[true,true,true]);
});

test('KC4 joins data-driven all-challenge achievement detection', () => {
  const ctx=game();
  assert.deepEqual(run(ctx, `KNUTH_CHALLENGES.filter(c=>c.id!=='kc4').forEach(c=>completedKnuthChallengeIds.add(c.id));
    const all=()=>ACHIEVEMENTS.find(a=>a.id==='praise_sticker').condition();const before=all();
    completedKnuthChallengeIds.add('kc4');return {before,after:all(),goal:knuthChallenge('kc4').goal};
  `),{before:false,after:true,goal:'1e20'});
});

test('KC4 keeps fractional game time and applies once after existing acceleration', () => {
  const ctx=game();
  const baseline=run(ctx, `squareUpgradeState.game_speed_1_5=true;squareConvergenceUpgradeState.timium=true;
    numberBlackHoleTotalInvested=NumberMath.fromString('1e1000');return gameTick(100);`);
  run(ctx,"activeKnuthChallengeId='kc4';resetKc4Time();");ctx.advance(1000);
  close(run(ctx,'return gameTick(100);'),baseline/2);
  close(run(ctx,'return gameTick(100);'),baseline/2);
  ctx.advance(100000);
  const tiny=run(ctx,'return gameTick(1);');assert.ok(tiny>0&&tiny<0.001);
});

test('KC4 supports existing console-only shift completion and undo with an enabled dev button', () => {
  const ctx=game();
  const chapter=fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8');
  const dev=fs.readFileSync(path.join(__dirname,'../scripts/systems/dev-console.js'),'utf8');
  ctx.loadSource(chapter.slice(chapter.indexOf('function renderKnuthChallengeCard('),chapter.indexOf('\nfunction renderKnuthChallenges()')));
  ctx.loadSource('devConsoleIsOpen=()=>true;'+dev.slice(dev.indexOf('function handleDevChallengePointer('),dev.indexOf("\ndocument.addEventListener('click', handleDevChallengePointer")));
  assert.deepEqual(run(ctx, `
    renderKnuthChallengeCard('kc4',knuthChallengeKc4,knuthChallengeKc4Status,knuthChallengeKc4Progress,knuthChallengeKc4Btn);
    const enabled=!knuthChallengeKc4Btn.disabled,id=knuthChallengeKc4Btn.dataset.devChallengeId;
    const event={shiftKey:true,type:'click',target:{closest:()=>knuthChallengeKc4Btn},preventDefault(){},stopImmediatePropagation(){}};
    handleDevChallengePointer(event);const completed=hasCompletedKnuthChallenge('kc4');
    event.type='contextmenu';handleDevChallengePointer(event);
    return {enabled,id,completed,removed:!hasCompletedKnuthChallenge('kc4')};
  `),{enabled:true,id:'kc4',completed:true,removed:true});
});

test('N help, upgrade reference, example and completion include black-hole automation', () => {
  const ctx=game(),source=fs.readFileSync(path.join(__dirname,'../scripts/systems/automatium.js'),'utf8');
  for(const [start,end] of [['function automatiumUpgradeIdRows()','\nfunction renderAutomatiumUpgradeIds'],
    ['function nAutocompleteUpgradeRows(kind)','\nfunction nAutocompleteVariables'],
    ['function automatiumProgramExamplesList()','\nfunction addAutomatiumExample']]) {
    ctx.loadSource(source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start))));
  }
  assert.deepEqual(run(ctx,"return nAutocompleteUpgradeRows('black_hole').map(r=>r.rawId);"),['amount','speed']);
  assert.equal(run(ctx,"return !!NRuntime.compile(automatiumProgramExamplesList().find(e=>e.id==='number_black_hole').source);"),true);
  assert.match(source,/black_hole amount max/);
});

test('reference progression remains achievable with the chosen fair slowdown instead of a millisecond cliff', () => {
  const fair=referenceRun(1,{durationMs:300}),cliff=referenceRun(0.001,{durationMs:1000});
  assert.equal(fair.research,20);assert.ok(fair.successAt!==null&&fair.cp>=20);assert.deepEqual(fair.errors,[]);
  assert.equal(cliff.successAt,null);assert.equal(cliff.resets,0);assert.ok(cliff.cp<20);assert.deepEqual(cliff.errors,[]);
});
