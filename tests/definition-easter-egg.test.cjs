const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function fixture({ reducedMotion = false } = {}) {
  const timers = new Map(), elements = new Map(), events = {}, windowEvents = {};
  const frames = new Map(), draws = [], positions = [], textures = [];
  let timerId = 0, frameId = 0, now = 0;
  const brush = {createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(data){textures.push(data);},clearRect(){},
    save(){},restore(){},rotate(){},translate(x,y){positions.push([x,y]);},
    drawImage(...args){draws.push(args);},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  function element() {
    const classes = new Set(['hidden']);
    return {dataset:{},attributes:{},events:{},children:[],style:{setProperty(){}},
      setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.events[k]=fn;},
      classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},
      appendChild(child){this.children.push(child);},getContext:()=>brush,
      getBoundingClientRect:()=>({width:800,height:600})};
  }
  for(const id of ['definitionContentCard','definitionEasterEggAudio','definitionEasterEggOverlay','definitionEasterEggFlames']) elements.set(id,element());
  const audio = elements.get('definitionEasterEggAudio');
  audio.currentTime=0;audio.plays=0;audio.pauses=0;
  audio.play=()=>{audio.plays++;return Promise.resolve();};audio.pause=()=>{audio.pauses++;};
  const document = {hidden:false,getElementById:id=>elements.get(id),createElement:element,
    addEventListener:(k,fn)=>{events[k]=fn;}};
  const state={chapter:'definition',fragments:1};
  const ctx = vm.createContext({document,window:{addEventListener:(k,fn)=>{windowEvents[k]=fn;},
    matchMedia:()=>({matches:reducedMotion})},performance:{now:()=>now},
    requestAnimationFrame(fn){const id=++frameId;frames.set(id,fn);return id;},
    cancelAnimationFrame:id=>frames.delete(id),
    get activeChapter(){return state.chapter;},definitionChapterAvailable:()=>state.fragments>=1,
    setTimeout(fn,delay){const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/systems/definition-easter-egg.js'),'utf8'),ctx);
  return {audio,state,document,events,windowEvents,timers,frames,draws,positions,textures,card:elements.get('definitionContentCard'),
    overlay:elements.get('definitionEasterEggOverlay'),flames:elements.get('definitionEasterEggFlames'),
    frame(elapsed){now=elapsed;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);},
    fireTimer(delay){for(const [id,timer] of timers){if(timer.delay===delay){timers.delete(id);timer.fn();return;}}throw Error('Missing timer');}};
}

test('sound and picture start together, repeated clicks do not overlap, and the visual fades away', () => {
  const f=fixture(),before=JSON.stringify(f.state);
  f.card.events.click();f.card.events.click();
  assert.equal(f.audio.plays,1);assert.equal(f.card.dataset.easterEggState,'visual');
  assert.ok(!f.overlay.classList.contains('hidden'));
  f.card.events.click();assert.equal(f.audio.plays,1);
  assert.ok(f.overlay.classList.contains('is-fading'));
  assert.deepEqual([...f.timers.values()].map(timer=>timer.delay),[2300]);
  f.fireTimer(2300);assert.ok(f.overlay.classList.contains('hidden'));
  assert.equal(f.card.dataset.easterEggState,'idle');assert.equal(f.card.attributes['aria-busy'],'false');
  f.card.events.click();assert.equal(f.audio.plays,2);
  assert.equal(f.textures.length,1);
  f.overlay.events.transitionend({target:f.overlay,propertyName:'opacity'});assert.equal(f.timers.size,0);
  assert.equal(JSON.stringify(f.state),before);
});

test('only an unlocked definition chapter can trigger the egg', () => {
  const f=fixture();f.state.fragments=0;f.card.events.click();
  f.state.fragments=1;f.state.chapter='multiplication';f.card.events.click();
  assert.equal(f.audio.plays,0);assert.equal(f.timers.size,0);
});

test('Escape, tab hiding and leaving the page stop sound and release the card', () => {
  for(const reason of ['escape','visibility','pagehide']) {
    const f=fixture();f.card.events.click();
    if(reason==='escape')f.events.keydown({key:'Escape'});
    else if(reason==='visibility'){f.document.hidden=true;f.events.visibilitychange();}
    else f.windowEvents.pagehide();
    assert.ok(f.overlay.classList.contains('hidden'));assert.equal(f.timers.size,0);
    assert.equal(f.frames.size,0);
    assert.equal(f.card.dataset.easterEggState,'idle');assert.equal(f.audio.currentTime,0);
  }
});

test('failed, blocked and stalled audio still show the picture and clean up', async () => {
  for(const failure of ['error','reject','throw','stall']) {
    const f=fixture();
    if(failure==='reject')f.audio.play=()=>Promise.reject(Error('blocked'));
    if(failure==='throw')f.audio.play=()=>{throw Error('blocked');};
    if(failure==='stall')f.audio.play=()=>new Promise(()=>{});
    f.card.events.click();
    await Promise.resolve();
    assert.equal(f.card.dataset.easterEggState,'visual');
    f.fireTimer(2300);assert.equal(f.card.dataset.easterEggState,'idle');
  }
});

test('an old play rejection cannot restart or hide a newly started visual', async () => {
  const f=fixture();let reject;
  f.audio.play=()=>new Promise((_,fn)=>{reject=fn;});
  f.card.events.click();f.events.keydown({key:'Escape'});
  f.audio.play=()=>Promise.resolve();f.card.events.click();reject(Error('old abort'));
  await Promise.resolve();assert.equal(f.card.dataset.easterEggState,'visual');
  assert.ok(!f.overlay.classList.contains('hidden'));assert.equal(f.timers.size,1);
});

test('local media, stretch layout, blue theme and reduced-motion flames are wired into the page', () => {
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const css=fs.readFileSync(path.join(__dirname,'../styles/number-tycoon.css'),'utf8');
  for(const file of ['definition-jumpscare.mp3','definition-employment.png']) {
    assert.ok(html.includes('./assets/easter-eggs/'+file));
    assert.ok(fs.statSync(path.join(__dirname,'../assets/easter-eggs',file)).size>1000);
  }
  assert.match(css,/body\.definition-mode\s*\{\s*background: #0a1020;/);
  assert.match(css,/\.definition-easter-egg > img\s*\{[^}]*width: 100%;[^}]*height: 100%;[^}]*object-fit: fill;/);
  assert.match(html,/<canvas id="definitionEasterEggFlames"/);
  assert.match(css,/transition: opacity 2300ms linear;/);
  assert.ok(html.includes('definition-easter-egg.js?v=20261112-definition-easter-egg-v4'));
});

test('fire begins at the center, expands radially and stops after bounded frames', () => {
  const f=fixture();f.card.events.click();
  const cx=f.flames.width/2,cy=f.flames.height/2;
  assert.ok(f.textures[0].data.some((value,index)=>index%4===3&&value>0));
  assert.equal(f.draws.length,64);assert.ok(f.positions.every(([x,y])=>x===cx&&y===cy));
  f.frame(550);assert.equal(f.draws.length,128);
  const moved=f.positions.slice(64);
  assert.ok(moved.some(([x])=>x<cx)&&moved.some(([x])=>x>cx));
  assert.ok(moved.some(([,y])=>y<cy)&&moved.some(([,y])=>y>cy));
  f.frame(1500);assert.equal(f.draws.length,192);assert.equal(f.frames.size,1);
  assert.notDeepEqual(f.positions.slice(64,128),f.positions.slice(128,192));
  f.frame(2300);assert.equal(f.frames.size,0);
});

test('reduced motion still animates gently and ends without leaving a frame loop', () => {
  const f=fixture({reducedMotion:true});f.card.events.click();
  assert.equal(f.draws.length,64);assert.equal(f.frames.size,1);
  const initial=f.positions.slice();
  f.frame(800);assert.equal(f.draws.length,128);assert.equal(f.frames.size,1);
  assert.notDeepEqual(initial,f.positions.slice(64,128));
  f.frame(2300);assert.equal(f.frames.size,0);
  f.fireTimer(2300);assert.equal(f.card.dataset.easterEggState,'idle');
});
