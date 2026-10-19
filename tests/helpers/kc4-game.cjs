const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function game(withProduction = false, sessionOptions = null) {
  let now = 0;
  const elements = new Map(), storage = new Map(sessionOptions?.storage ?? []), intervals = [];
  const windowEvents = {};
  function element(id = '') {
    const classes = new Set(), events = {};
    return { id, dataset: {}, style: {}, children: [], events, innerHTML: '', textContent: '', disabled: false,
      classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)),
        contains: x => classes.has(x), toggle(x, force) { const on = force ?? !classes.has(x); on ? classes.add(x) : classes.delete(x); return on; } },
      addEventListener(type, fn) { events[type] = fn; }, setAttribute() {}, remove() {}, append() {},
      appendChild(child) { this.children.push(child); }, replaceChildren(...children) { this.children = children; }, querySelectorAll() { return []; },
      showModal() { this.open = true; }, close() { this.open = false; },
      focus() {}, contains() { return false; },
      getBoundingClientRect() { return { x: 0, y: 0, width: 1000, height: 600 }; } };
  }
  const document = { body: element(), addEventListener() {}, querySelector: () => element(), querySelectorAll: () => [],
    createElement: () => element(), createElementNS: () => element(),
    getElementById(id) { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); } };
  const errors = [];
  const clock = { now: () => now, advance(ms) { now += ms; } };
  class ClockDate extends Date { static now() { return 1800000000000 + now; } }
  const context = vm.createContext({ document, errors, clock, Date: ClockDate, performance: { now: () => now }, URLSearchParams,
    console: { error: e => errors.push(String(e)) }, setInterval(fn, delay) { intervals.push({ fn, delay, next: now + delay }); },
    setTimeout: sessionOptions ? (fn => queueMicrotask(fn)) : (() => {}), clearTimeout() {},
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    window: { location: { pathname: '/', search: '' }, addEventListener(type, fn) { windowEvents[type]=fn; }, setTimeout() {}, clearTimeout() {} },
    fetch: () => ({ then() { return this; }, catch() { return this; } }) });
  function load(file) { vm.runInContext(fs.readFileSync(path.join(__dirname, '../../scripts', file), 'utf8'), context, { filename: file }); }
  if (sessionOptions) load('core/session.js');
  for (const file of ['core/constants.js', 'core/number-math.js', 'core/state.js', 'core/dom.js']) load(file);
  vm.runInContext("render=()=>{};log=()=>{};setChapter=()=>{};ensureFormulaHelpButton=()=>{};", context);
  if (!withProduction) vm.runInContext("let activeSquareView='upgrades';", context);
  for (const file of ['systems/percent-lanes.js', 'systems/square-breakthrough.js', 'systems/square-upgrades.js',
    'systems/square-convergence.js', 'systems/achievements.js', 'systems/number-black-hole.js', 'core/save.js']) load(file);
  if (withProduction) {
    for (const file of ['systems/clickers.js', 'systems/percent-system.js', 'systems/auto-upgrades.js',
      'systems/square-dimensions.js', 'systems/diverger.js', 'chapters/square.js']) load(file);
  }
  for (const file of ['automatium/n-lexer.js', 'automatium/n-parser.js', 'automatium/n-runtime.js']) load(file);
  const n = fs.readFileSync(path.join(__dirname, '../../scripts/systems/automatium.js'), 'utf8');
  vm.runInContext(n.slice(0, n.indexOf('\n};\n\nfunction automatiumGameAdapterFor') + 4), context);
  vm.runInContext(`knuthUnlocked=true;hasClaimedKnuthPoint=true;numberBlackHoleSystemEnabled=true;
    automatiumBulkRemaining=4096;automatiumBulkDeadline=Infinity;
    function plain(v){return NumberMath.toNumber(v);}
    function logValue(v){return plain(NumberMath.log10(v));}
    function executeN(source){
      const execution=NRuntime.createExecution(NRuntime.compile(source),automatiumGameAdapter);
      for(let i=0;i<1000;i++){const result=execution.iterator.next();if(result.done)return true;if(result.value?.kind==='blocked')return false;}
      throw Error('unexpected unbounded N program');
    }`, context);
  context.advance = ms => clock.advance(ms);
  context.intervals = intervals;
  context.windowEvents = windowEvents;
  context.storage = storage;
  context.loadSource = source => vm.runInContext(source, context);
  return context;
}
function run(context, source) {
  const result = vm.runInContext(`(()=>{${source}})()`, context);
  return result === undefined ? undefined : JSON.parse(JSON.stringify(result));
}

function referenceRun(halfLifeSeconds, { exchangeEveryMs = 100, durationMs = 10000 } = {}) {
  const ctx = game(true);
  ctx.loadSource(`
    KC4_TIME_BALANCE.halfLifeSeconds=${halfLifeSeconds};knuthPoints=1390000000;knuthOperationLevel=31;
    Object.assign(knuthBaseUpgradeLevels,{cp_gain:7,sp_gain:9,kp_gain:5,diverger_gain:4,dimension_gain:9,
      dyson_limit:4,number_black_hole:1,extra_branch:1,diverger_b_strength:1,starting_resources:1,overclock_limit:13,theory_exchange:1});
    for(const research of ABSTRACTION_RESEARCHES){
      if(research.column<=14&&(!research.branch||['time','expansion','passive'].includes(research.branch)))abstractionResearchState[research.id]=true;
    }
    abstractionSecondBranchPurchaseOrder=['passive'];
    KNUTH_SLOT_UPGRADES.filter(u=>u.slots<16).forEach(u=>knuthEquippedUpgradeIds.add(u.id));
    ACHIEVEMENTS.slice(0,50).forEach(a=>achievementState[a.id]=true);
    numberBlackHoleTotalInvested=NumberMath.fromString('1e890000000');numberBlackHoleAccumulatedGameSeconds=5.39e18;
    singularityUpgradeLevels.black_hole=1;completedKnuthChallengeIds.add('kc1');completedKnuthChallengeIds.add('kc2');completedKnuthChallengeIds.add('kc3');
    automatiumPrestigeRetentionUnlocked=true;squareConvergenceUpgradeState.automatium=true;startKnuthChallenge('kc4');
    function referenceBuy(){
      automatiumBulkRemaining=4096;automatiumBulkDeadline=Infinity;
      SQUARE_UPGRADES.forEach(u=>{if(!hasSquareUpgrade(u.id))buySquareUpgrade(u.id);});
      SQUARE_BREAKTHROUGH_UPGRADES.forEach(u=>automatiumGameAdapter.buy('square_break',u.id,null,null));
      for(const id of N_BASE_UPGRADE_GUIDE.map(u=>u.id))automatiumGameAdapter.buy('base',id,null,null);
      SQUARE_CONVERGENCE_UPGRADES.forEach(u=>automatiumGameAdapter.buy('square_convergence',u.id,null,null));
      for(const id of ['1-1','2-1','2-2','2-4','3-1','3-2','3-4','4-1','4-2','4-3','4-4','5-1','5-3','5-4','6-1','6-2','7-1','7-2'])researchGeneralization(id);
      if(canOpenSquareConvergence())for(const index of [0,1]){theoryCostResourceIndex=index;researchTheory();}
      if(squareUnlocked)exchangeSquarePointsManually();
      advanceSquareRunTime(50);advanceSquarePrestigeCycleTime(50);
    }
    let referenceCpResets=0;
  `);
  let successAt = null;
  for (let elapsed = 10; elapsed <= durationMs; elapsed += 10) {
    ctx.advance(10);
    for (const timer of ctx.intervals) {
      if (ctx.clock.now() < timer.next) continue;
      timer.next += timer.delay;
      timer.fn();
    }
    if (elapsed % 50 === 0) run(ctx, 'referenceBuy();');
    if (elapsed % exchangeEveryMs === 0) {
      run(ctx, 'if(isPositiveNumberValue(collectSquareConvergenceIfReady()))referenceCpResets++;');
      if (run(ctx, 'return canCompleteKnuthChallenge();')) { successAt = elapsed; break; }
    }
  }
  return { halfLifeSeconds, exchangeEveryMs, successAt, ...run(ctx, `return {cp:logValue(squareConvergencePoints),
    number:logValue(getBaseNumber()),resets:referenceCpResets,elapsed:syncKc4RealTime(),
    research:knuthPurchasedAbstractionCount(),power:percentPower,cpUpgrade:squareConvergenceUpgradeLevel('cp_gain_5x'),errors};`) };
}

module.exports = { game, run, referenceRun };
