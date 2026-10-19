const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const OFFLINE = 'numberTycoonOfflineCheckpoint_v1';
const PREFS = 'numberTycoonSessionPreferences_v1';
const SAVE = 'numberTycoonSave_v1';
const read = file => fs.readFileSync(path.join(__dirname,'../scripts',file),'utf8').replace(/\r\n/g,'\n');

function session({storage=[],initialize=true,accuracy=1000}={}) {
  if (accuracy != null) {
    const values = new Map(storage);
    const preferences = JSON.parse(values.get(PREFS) || '{}');
    values.set(PREFS, JSON.stringify({...preferences,offlineAccuracy:accuracy}));
    storage = [...values];
  }
  const ctx=game(true,{storage});
  ctx.loadSource(read('systems/abstraction.js'));
  ctx.loadSource(read('chapters/knuth.js'));
  const n=read('systems/automatium.js');
  ctx.loadSource(n.slice(n.indexOf('function automatiumGameAdapterFor('),n.indexOf('function toggleAutomatiumProgram(')));
  ctx.loadSource(n.slice(n.indexOf('function runAutomatiumTick('),n.indexOf('\nfor (const program of automatiumPrograms)')));
  ctx.loadSource('setGameInterval(runAutomatiumTick,AUTOMATIUM_TICK_MS);');
  const render=read('core/render.js');
  ctx.loadSource(render.slice(render.indexOf('function updateGameRenderState('),render.indexOf('function renderNow(')));
  ctx.loadSource(`render=()=>window.numberTycoonSession.requestMaintenance();Math.random=()=>0.5;
    function seedOffline(){
      autoClickerUnlocked=true;autoClickerSpeed=1000;autoClickerParallel=1;perClick=10;
      numberBlackHoleSystemEnabled=false;setBaseNumber(100);
    }
    function program(source){const p=makeAutomatiumProgram();p.source=source;p.enabled=true;automatiumPrograms.push(p);startAutomatiumProgram(p);return p;}`);
  if(initialize)ctx.loadSource('window.numberTycoonSession.initialize();');
  return ctx;
}
function online(ctx,ms) {
  for(let elapsed=0;elapsed<ms;elapsed+=10) {
    ctx.advance(10);
    for(const timer of ctx.intervals)if(ctx.clock.now()>=timer.next){timer.next+=timer.delay;timer.fn();}
  }
}
async function leave(ctx) { return await vm.runInContext('window.numberTycoonSession.leave()',ctx); }
function summary(ctx) {
  return run(ctx,`return document.getElementById('offlineSummaryChanges').children.map(row=>({
    name:row.children[0].textContent,value:row.children[1].textContent,direction:row.children[1].className
  }));`);
}

test('offline completion opens a frozen before/after summary and closing it does not change gameplay',async()=>{
  const ctx=session();run(ctx,'seedOffline();window.numberTycoonSession.enter();');ctx.advance(2000);
  assert.equal(await leave(ctx),true);
  assert.deepEqual(summary(ctx),[{name:'숫자:',value:'100 → 120',direction:'increased'}]);
  assert.deepEqual(run(ctx,`return [document.getElementById('offlineSummaryDialog').open,
    document.getElementById('offlineSummaryEmpty').hidden,document.getElementById('offlineSummaryElapsed').textContent];`),
    [true,true,'2초 · 정확도 1000']);
  online(ctx,1000);
  assert.equal(run(ctx,'return plain(getBaseNumber());'),130);
  assert.deepEqual(summary(ctx),[{name:'숫자:',value:'100 → 120',direction:'increased'}]);
  run(ctx,"document.getElementById('offlineSummaryCloseBtn').events.click();");
  assert.equal(run(ctx,"return document.getElementById('offlineSummaryDialog').open;"),false);
  assert.equal(await leave(ctx),false);
});

test('summary formats nested enormous values with the game formatter and includes spending and all listed resources',async()=>{
  const ctx=session();
  run(ctx,`numberBlackHoleSystemEnabled=false;
    squarePoints=NumberMath.fromString('1e2e35');squareConvergencePoints=1000;theory=10;
    setGameInterval(()=>{
      squarePoints=NumberMath.fromString('1e2.5e36');squareConvergencePoints=10;knuthPoints=20;
      greatTheory=5;singularityPoints=3;divergerPower=100;
    },10);window.numberTycoonSession.enter();`);
  ctx.advance(10);assert.equal(await leave(ctx),true);
  const rows=summary(ctx);
  const expected=run(ctx,`return fmtPowerBase(NumberMath.fromString('1e2e35'))+' → '+fmtPowerBase(NumberMath.fromString('1e2.5e36'));`);
  assert.equal(rows.find(row=>row.name==='SP:').value,expected);
  assert.notEqual(expected,'0 → 0');
  assert.deepEqual(rows.find(row=>row.name==='CP:'),{name:'CP:',value:'1k → 10',direction:'decreased'});
  assert.deepEqual(rows.map(row=>row.name),['SP:','CP:','KP:','대이론:','특이점:','발산력:']);
});

test('summary compares the actual offline checkpoint after reload, not the ordinary saved game',async()=>{
  const first=session({accuracy:1});
  run(first,'seedOffline();saveGame();setBaseNumber(500);window.numberTycoonSession.enter();');
  const ctx=session({storage:[...first.storage],accuracy:null});ctx.advance(2000);await leave(ctx);
  assert.deepEqual(summary(ctx).find(row=>row.name==='숫자:'),{name:'숫자:',value:'500 → 520',direction:'increased'});
  assert.ok(summary(ctx).every(row=>row.value!=='0 → 0'));
});

test('zero-duration and unchanged resources display an empty result instead of invented gains',async()=>{
  const ctx=session();run(ctx,'numberBlackHoleSystemEnabled=false;window.numberTycoonSession.enter();');
  assert.equal(await leave(ctx),true);
  assert.deepEqual(summary(ctx),[]);
  assert.equal(run(ctx,"return document.getElementById('offlineSummaryEmpty').hidden;"),false);
});

test('failed replay never opens a successful result or deletes its recovery copy',async()=>{
  const ctx=session();run(ctx,"setGameInterval(()=>{throw new Error('summary failure test');},10);window.numberTycoonSession.enter();");
  ctx.advance(100);assert.equal(await leave(ctx),false);
  assert.equal(run(ctx,"return Boolean(document.getElementById('offlineSummaryDialog').open);"),false);
  assert.ok(ctx.storage.has(OFFLINE));
});

test('accuracy defaults to 100, synchronizes controls, persists and preserves auto load preference',()=>{
  const ctx=session({accuracy:null});
  assert.equal(run(ctx,'return window.numberTycoonSession.offlineAccuracy;'),100);
  run(ctx,`const range=document.getElementById('offlineAccuracyRange');range.value='25';range.events.input();
    const toggle=document.getElementById('autoLoadSaveToggle');toggle.checked=false;toggle.events.change();
    const input=document.getElementById('offlineAccuracyInput');input.value='50';input.events.change();`);
  assert.deepEqual(JSON.parse(ctx.storage.get(PREFS)),{autoLoad:false,offlineAccuracy:50});
  assert.deepEqual(run(ctx,`return [document.getElementById('offlineAccuracyRange').value,
    document.getElementById('offlineAccuracyInput').value];`),['50','50']);
  const restored=session({storage:[...ctx.storage],accuracy:null});
  assert.deepEqual(run(restored,'return [window.numberTycoonSession.autoLoadEnabled,window.numberTycoonSession.offlineAccuracy];'),[false,50]);
});

test('accuracy clamps and rounds integers, ignores invalid values and rolls back failed persistence',()=>{
  const ctx=session({accuracy:null});
  assert.deepEqual(run(ctx,`const input=document.getElementById('offlineAccuracyInput');
    return ['0','1001','12.7','','bad','Infinity'].map(value=>{
      input.value=value;input.events.change();return window.numberTycoonSession.offlineAccuracy;
    });`),[1,1000,13,13,13,13]);
  run(ctx,`localStorage.setItem=()=>{throw new Error('full');};
    const input=document.getElementById('offlineAccuracyInput');input.value='500';
    input.events.keydown({key:'Enter',preventDefault(){}});`);
  assert.deepEqual(run(ctx,`return [window.numberTycoonSession.offlineAccuracy,
    document.getElementById('offlineAccuracyInput').value,document.getElementById('offlineAccuracyRange').value];`),[13,'13','13']);
});

test('legacy and invalid accuracy preferences use safe defaults without disabling auto load',()=>{
  for(const raw of ['null','{bad','{}','{"autoLoad":false}','{"offlineAccuracy":"NaN"}']) {
    const ctx=session({accuracy:null,storage:[[PREFS,raw]]});
    assert.equal(run(ctx,'return window.numberTycoonSession.offlineAccuracy;'),100);
    assert.equal(run(ctx,'return window.numberTycoonSession.autoLoadEnabled;'),raw!=='{"autoLoad":false}');
  }
  for(const [value,expected] of [[-9,1],[2000,1000],[55.8,56]]) {
    const ctx=session({accuracy:null,storage:[[PREFS,JSON.stringify({offlineAccuracy:value})]]});
    assert.equal(run(ctx,'return window.numberTycoonSession.offlineAccuracy;'),expected);
  }
});

test('low accuracy coalesces callbacks across the entire duration; 1000 retains exact ticks',async()=>{
  const counts=[];
  for(const accuracy of [1,10,100,1000]) {
    const ctx=session({accuracy});
    ctx.loadSource(`let accuracyCalls=0,accuracyElapsed=0,accuracyLast=gameTimelineNowMs();
      setGameInterval(()=>{accuracyCalls++;const now=gameTimelineNowMs();accuracyElapsed+=now-accuracyLast;accuracyLast=now;},10);
      seedOffline();window.numberTycoonSession.enter();`);
    ctx.advance(60000);
    assert.equal(await leave(ctx),true);
    const result=run(ctx,'return {calls:accuracyCalls,elapsed:accuracyElapsed,n:plain(getBaseNumber())};');
    assert.equal(result.elapsed,60000);
    assert.equal(result.n,700);
    counts.push(result.calls);
    assert.equal(await leave(ctx),false);
    online(ctx,1000);
    assert.equal(run(ctx,'return plain(getBaseNumber());'),710);
  }
  assert.deepEqual(counts,[10,100,1000,6000]);
});

test('coarse replay handles partial final samples, short periods and timers longer than the duration',async()=>{
  for(const duration of [0,5,73,10003]) {
    const ctx=session({accuracy:1});
    ctx.loadSource(`let shortCalls=0,longCalls=0,lastShort=0;
      setGameInterval(()=>{shortCalls++;lastShort=gameTimelineNowMs();},10);
      setGameInterval(()=>{longCalls++;},20000);
      window.numberTycoonSession.enter();`);
    ctx.advance(duration);assert.equal(await leave(ctx),true);
    assert.deepEqual(run(ctx,'return [longCalls,gameTimelineNowMs()];'),[0,duration]);
    const calls=run(ctx,'return shortCalls;');
    assert.ok(calls<=10);
    assert.equal(run(ctx,'return lastShort;'),duration<100?Math.floor(duration/10)*10:duration);
  }
});

test('accuracy does not change online cadence and survives offline recovery',async()=>{
  const first=session({accuracy:1});
  first.loadSource(`let onlineCalls=0;setGameInterval(()=>onlineCalls++,10);`);
  online(first,1000);assert.equal(run(first,'return onlineCalls;'),100);
  run(first,'seedOffline();window.numberTycoonSession.enter();');
  const restored=session({storage:[...first.storage],accuracy:null});restored.advance(61000);
  assert.equal(await leave(restored),true);
  assert.deepEqual(run(restored,'return [plain(getBaseNumber()),window.numberTycoonSession.offlineAccuracy];'),[700,1]);
});

test('coarse replay still runs N automation and game production instead of dropping the elapsed time',async()=>{
  const ctx=session({accuracy:1});
  run(ctx,String.raw`seedOffline();squareConvergenceUpgradeState.automatium=true;
    program('while true {\nclick\nwait 1s\n}');window.numberTycoonSession.enter();`);
  ctx.advance(60000);assert.equal(await leave(ctx),true);
  assert.ok(run(ctx,'return plain(getBaseNumber());')>700);
  assert.equal(run(ctx,'return window.numberTycoonSession.phase;'),'online');
});

test('a day at minimum accuracy needs only ten samples, while preserving elapsed production and UTC',async()=>{
  const ctx=session({accuracy:1});
  ctx.loadSource(`let dayCalls=0;setGameInterval(()=>dayCalls++,10);
    seedOffline();window.numberTycoonSession.enter();`);
  ctx.advance(86400000);assert.equal(await leave(ctx),true);
  assert.deepEqual(run(ctx,'return [dayCalls,plain(getBaseNumber()),gameUtcNowMs(),gameTimelineNowMs()];'),
    [10,864100,1800086400000,86400000]);
});

test('settings default to auto load, existing saves load once without farming load statistics',()=>{
  const seed=session();run(seed,'setBaseNumber(12345);saveGame();');
  const ctx=session({storage:[...seed.storage]});
  assert.deepEqual(run(ctx,`const n=plain(getBaseNumber());window.numberTycoonSession.initialize();return {
    n,again:plain(getBaseNumber()),loads:loadCount,on:document.getElementById('autoLoadSaveToggle').checked,
    warn:window.numberTycoonSession.shouldWarnBeforeExit(),phase:window.numberTycoonSession.phase};`),
    {n:12345,again:12345,loads:0,on:true,warn:true,phase:'online'});
});

test('auto load OFF persists separately and never replaces the stored game with a new game',()=>{
  const seed=session();run(seed,`setBaseNumber(12345);saveGame();
    const input=document.getElementById('autoLoadSaveToggle');input.checked=false;input.events.change();`);
  const raw=seed.storage.get(SAVE),ctx=session({storage:[...seed.storage]});
  assert.deepEqual(run(ctx,`return {n:plain(getBaseNumber()),on:window.numberTycoonSession.autoLoadEnabled,warn:window.numberTycoonSession.shouldWarnBeforeExit()};`),
    {n:0,on:false,warn:false});
  assert.equal(ctx.storage.get(SAVE),raw);
});

test('first successful load arms the exit warning; a save clears it and actual progress re-arms it',()=>{
  const ctx=session();
  assert.deepEqual(run(ctx,`const before=window.numberTycoonSession.shouldWarnBeforeExit();saveGame();
    loadGame();const loaded=window.numberTycoonSession.shouldWarnBeforeExit();saveGame();
    const saved=window.numberTycoonSession.shouldWarnBeforeExit();setBaseNumber(1);
    return [before,loaded,saved,window.numberTycoonSession.shouldWarnBeforeExit()];`),[false,true,false,true]);
  let prevented=false;const event={preventDefault(){prevented=true;}};
  ctx.windowEvents.beforeunload(event);assert.equal(prevented,true);assert.equal(event.returnValue,'');
});

test('offline entry writes a distinct frozen checkpoint, pauses live ticks and keeps the main save untouched',()=>{
  const ctx=session();run(ctx,'seedOffline();saveGame();setBaseNumber(500);window.numberTycoonSession.enter();');
  const saved=ctx.storage.get(SAVE),backup=JSON.parse(ctx.storage.get(OFFLINE));
  assert.equal(Number(backup.game.num),500);assert.equal(JSON.parse(saved).num,'100');
  online(ctx,5000);
  assert.deepEqual(run(ctx,`return [plain(getBaseNumber()),window.numberTycoonSession.phase,
    document.body.classList.contains('session-offline'),document.getElementById('offlineModeScreen').hidden,saveCount];`),
    [500,'offline',true,false,1]);
  assert.equal(ctx.storage.get(SAVE),saved);assert.equal(JSON.parse(ctx.storage.get(OFFLINE)).game.num,'500');
});

test('offline replay matches online auto clicks and a second exit cannot grant the same duration again',async()=>{
  const a=session(),b=session();run(a,'seedOffline();');run(b,'seedOffline();window.numberTycoonSession.enter();');
  online(a,5000);online(b,5000);assert.equal(await leave(b),true);
  assert.equal(run(b,'return plain(getBaseNumber());'),run(a,'return plain(getBaseNumber());'));
  const number=run(b,'return plain(getBaseNumber());');assert.equal(await leave(b),false);
  assert.equal(run(b,'return plain(getBaseNumber());'),number);assert.equal(b.storage.has(OFFLINE),false);
  online(b,1000);assert.equal(run(b,'return plain(getBaseNumber());'),number+10);
});

test('reloading offline restores the entry snapshot without overwriting the ordinary save or duplicating elapsed time',async()=>{
  const first=session();run(first,'seedOffline();saveGame();setBaseNumber(500);window.numberTycoonSession.enter();');
  const raw=first.storage.get(SAVE),stored=[...first.storage];
  const next=session({storage:stored});next.advance(2000);
  assert.deepEqual(run(next,`return [plain(getBaseNumber()),window.numberTycoonSession.phase,saveCount,loadCount];`),[500,'offline',1,0]);
  assert.equal(next.storage.get(SAVE),raw);assert.equal(await leave(next),true);
  assert.equal(run(next,'return plain(getBaseNumber());'),520);assert.equal(next.storage.get(SAVE),raw);
});

test('auto load OFF defers offline snapshot application until the user explicitly exits offline mode',async()=>{
  const first=session();run(first,'seedOffline();setBaseNumber(500);window.numberTycoonSession.enter();');
  first.storage.set(PREFS,JSON.stringify({autoLoad:false}));
  const ctx=session({storage:[...first.storage]});ctx.advance(2000);
  assert.equal(run(ctx,'return plain(getBaseNumber());'),0);assert.equal(await leave(ctx),true);
  assert.equal(run(ctx,'return plain(getBaseNumber());'),520);
});

test('UTC epoch is used regardless of timezone and a backward clock never creates negative production',async()=>{
  const ctx=session();run(ctx,`seedOffline();window.numberTycoonSession.enter();`);
  ctx.advance(-2000);assert.equal(await leave(ctx),true);
  assert.equal(run(ctx,'return plain(getBaseNumber());'),100);
  const source=read('core/session.js');assert.ok(source.includes('Date.now() - startedAt'));
  assert.ok(!/geolocation|getCurrentPosition/.test(source));
});

test('offline production includes dimensions, diverger, percent use, passive SP and time-dependent research',async()=>{
  const a=session(),b=session();
  const setup=`numberBlackHoleSystemEnabled=false;squareUnlocked=true;setBaseNumber('1e100');
    generalizationResearchState['3-1']=true;generalizationResearchState['3-2']=true;
    abstractionResearchState['1-1']=true;percentUnlocked=true;percentAutoUnlocked=true;percentAutoSpeed=1000;
    autoClickerUnlocked=true;autoClickerSpeed=100;autoClickerParallel=1;autoClickerPercentFillUnlocked=true;percentChargeNeeded=2;`;
  run(a,setup);run(b,setup+'window.numberTycoonSession.enter();');online(a,2000);online(b,2000);await leave(b);
  const state=`return {number:NumberMath.serialize(getBaseNumber()),d:NumberMath.serialize(divergerPower),n:NumberMath.serialize(divergerN),
    dimension:NumberMath.serialize(squareDimensionTotalPower()),sp:NumberMath.serialize(squarePoints),
    run:NumberMath.serialize(squareRunGameSeconds),percent:percentCharge,pending:pendingPercentUses};`;
  assert.deepEqual(run(b,state),run(a,state));
  assert.ok(run(b,'return compareNumberValues(divergerPower,0)>0&&compareNumberValues(squarePoints,0)>0;'),JSON.stringify(run(b,state)));
});

test('black-hole donations and passive radius use replayed real time, not accelerated game time',async()=>{
  const a=session(),b=session();const setup=`setBaseNumber('1e100');knuthBaseUpgradeLevels.passive_radius=1;
    numberBlackHoleSystemEnabled=true;numberBlackHoleDonationRate=1;numberBlackHoleDonationPercent=1;`;
  run(a,setup);run(b,setup+'window.numberTycoonSession.enter();');online(a,3000);online(b,3000);await leave(b);
  const state=`return [NumberMath.serialize(getBaseNumber()),NumberMath.serialize(numberBlackHoleTotalInvested),
    NumberMath.serialize(numberBlackHolePassiveRadius),NumberMath.serialize(numberBlackHoleAccumulatedGameSeconds)];`;
  assert.deepEqual(run(b,state),run(a,state));
  assert.ok(Math.abs(run(b,'return plain(numberBlackHolePassiveRadius);')-3)<1e-9);
});

test('N wait and click cooldown advance on the simulated UTC clock, not catch-up CPU time',async()=>{
  const a=session(),b=session();const setup=String.raw`numberBlackHoleSystemEnabled=false;squareConvergenceUpgradeState.automatium=true;
    program('while true {\nclick\nwait 1s\n}');`;
  run(a,setup);run(b,setup+'window.numberTycoonSession.enter();');online(a,5000);online(b,5000);await leave(b);
  assert.equal(run(b,'return plain(getBaseNumber());'),run(a,'return plain(getBaseNumber());'));
  assert.ok(run(b,'return plain(getBaseNumber());')>=4);
});

test('N automates SP, CP and KP exchanges during replay, including resets and program retention',async()=>{
  const ctx=session();
  run(ctx,String.raw`numberBlackHoleSystemEnabled=false;squareUnlocked=true;
    squareConvergenceUpgradeState.automatium=true;automatiumPrestigeRetentionUnlocked=true;
    abstractionResearchState['2-2']=true;
    for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
    setBaseNumber('1e100');squarePoints=NumberMath.fromString('1e30');squareConvergencePoints=NumberMath.fromString('1e45');
    program('sp\ncp\nkp');window.numberTycoonSession.enter();`);
  ctx.advance(1000);assert.equal(await leave(ctx),true);
  assert.ok(run(ctx,'return compareNumberValues(knuthPoints,1)>0;'));
  assert.equal(run(ctx,'return automatiumPrograms[0].enabled;'),false);
});

test('built-in automatic purchases and enabled N programs are both replayed',async()=>{
  const ctx=session();run(ctx,String.raw`numberBlackHoleSystemEnabled=false;setBaseNumber('1e100');
    squareUpgradeState.auto_upgrade_top_down=true;autoUpgradeEnabled=true;
    squareConvergenceUpgradeState.automatium=true;
    program('buy base auto_clicker\nwait 100ms\nbuy base auto_speed');window.numberTycoonSession.enter();`);
  ctx.advance(500);assert.equal(await leave(ctx),true);
  assert.ok(run(ctx,'return autoClickerUnlocked&&autoClickerSpeed<1000;'));
  assert.equal(run(ctx,'return automatiumPrograms[0].enabled;'),false);
});

test('checkpoint failure leaves the game online; calculation failure preserves the original recovery copy',async()=>{
  const ctx=session();run(ctx,`const setItem=localStorage.setItem;localStorage.setItem=()=>{throw Error('full');};
    globalThis.cannotEnter=window.numberTycoonSession.enter();localStorage.setItem=setItem;`);
  assert.deepEqual(run(ctx,'return [cannotEnter,window.numberTycoonSession.phase];'),[false,'online']);
  run(ctx,`setGameInterval(()=>{throw Error('calculation');},10);window.numberTycoonSession.enter();`);
  const before=ctx.storage.get(OFFLINE);ctx.advance(100);assert.equal(await leave(ctx),false);
  assert.equal(ctx.storage.get(OFFLINE),before);assert.equal(run(ctx,'return window.numberTycoonSession.phase;'),'error');
});

test('long simulation yields in bounded chunks and keeps physical budget clocks separate',async()=>{
  const ctx=session();run(ctx,'seedOffline();window.numberTycoonSession.enter();');ctx.advance(60000);
  let yielded=0;ctx.setTimeout=fn=>{yielded++;queueMicrotask(fn);};
  assert.equal(await leave(ctx),true);assert.ok(yielded>0);
  assert.equal(run(ctx,'return plain(getBaseNumber());'),700);
  assert.ok(run(ctx,'return Math.abs(gameTimelineNowMs()-gameClockNowMs())<1;'));
});

test('cloud auto application respects OFF and paused mode, without silently bypassing confirmation',()=>{
  const source=read('systems/firebase-auth.js');
  assert.match(source,/autoLoadEnabled === false \|\| window\.numberTycoonSession\?\.isPaused\(\)/);
  assert.match(source,/if \(window\.numberTycoonSession\?\.isPaused\(\)\) return false/);
  assert.match(source,/const useCloud = window\.confirm/);
});

test('KC4 accumulates the explicitly replayed real duration, with no acceleration or duplicate accounting',async()=>{
  const ctx=session();run(ctx,`numberBlackHoleSystemEnabled=false;activeKnuthChallengeId='kc4';resetKc4Time();window.numberTycoonSession.enter();`);
  ctx.advance(2000);assert.equal(await leave(ctx),true);
  assert.ok(Math.abs(run(ctx,'return syncKc4RealTime();')-2)<1e-9);
  assert.equal(await leave(ctx),false);assert.ok(Math.abs(run(ctx,'return syncKc4RealTime();')-2)<1e-9);
});

test('recovery restores the entry program set and runs enabled programs using existing reconnect semantics',async()=>{
  const seed=session();run(seed,String.raw`numberBlackHoleSystemEnabled=false;squareConvergenceUpgradeState.automatium=true;
    program('while true {\nclick\nwait 1s\n}');window.numberTycoonSession.enter();`);
  const ctx=session({storage:[...seed.storage]});ctx.advance(3000);assert.equal(await leave(ctx),true);
  assert.equal(run(ctx,'return automatiumPrograms.length;'),1);
  assert.equal(run(ctx,'return automatiumPrograms[0].enabled;'),true);
  assert.ok(run(ctx,'return plain(getBaseNumber());')>=3);
});

test('a simulated timeline offset never becomes extra CPU purchase budget after reconnect',async()=>{
  const seed=session();run(seed,'window.numberTycoonSession.enter();');
  const checkpoint=JSON.parse(seed.storage.get(OFFLINE));checkpoint.startedAtUtcMs-=2000;
  seed.storage.set(OFFLINE,JSON.stringify(checkpoint));
  const ctx=session({storage:[...seed.storage]});assert.equal(await leave(ctx),true);
  assert.deepEqual(run(ctx,`runAutomatiumTick();return [gameClockNowMs(),gameTimelineNowMs(),automatiumBulkDeadline];`),[0,2000,12]);
});

test('corrupt normal and offline saves never trigger an automatic overwrite or a false successful load',()=>{
  const ctx=session({storage:[[SAVE,'{broken'],[OFFLINE,'{broken']]});
  assert.equal(ctx.storage.get(SAVE),'{broken');assert.equal(ctx.storage.get(OFFLINE),'{broken');
  assert.deepEqual(run(ctx,`return [window.numberTycoonSession.phase,window.numberTycoonSession.shouldWarnBeforeExit(),plain(getBaseNumber())];`),['online',false,0]);
});
