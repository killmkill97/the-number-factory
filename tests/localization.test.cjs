const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const {loadCatalog,inventory,hangul,root} = require('../tools/localization-catalog.cjs');

function environment(savedLanguage, storageBlocked = false) {
  const storage=new Map(savedLanguage ? [['numberTycoonLanguage_v1',savedLanguage]] : []);
  const listeners={},mutations=[];
  class Element {
    constructor(tag,id=''){this.nodeType=1;this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.attrs=new Map();this.value='';this.isConnected=true;this.events={};}
    addEventListener(type,fn){this.events[type]=fn;}
    append(...nodes){for(const n of nodes){n.parentElement=this;this.children.push(n);}}
    getAttribute(name){return this.attrs.has(name)?this.attrs.get(name):null;}
    setAttribute(name,value){this.attrs.set(name,String(value));}
    matches(selector){return selector.split(',').some(rule=>{
      if(rule==='pre code')return this.tagName==='CODE'&&this.parentElement?.tagName==='PRE';
      if(rule[0]==='#')return this.id===rule.slice(1);
      if(rule[0]==='.')return (this.attrs.get('class')||'').split(' ').includes(rule.slice(1));
      if(rule==='[contenteditable="true"]')return this.attrs.get('contenteditable')==='true';
      if(rule==='[data-i18n-skip]')return this.attrs.has('data-i18n-skip');
      return this.tagName===rule.toUpperCase();});}
    closest(selector){return this.matches(selector)?this:this.parentElement?.closest(selector)??null;}
  }
  const text=value=>({nodeType:3,nodeValue:value,isConnected:true});
  const html=new Element('html'),body=new Element('body');html.append(body);
  const flatten=node=>node.children?.flatMap(n=>[n,...flatten(n)])??[];
  const document={documentElement:html,body,readyState:'loading',
    addEventListener(type,fn){listeners[type]=fn;},
    getElementById:id=>[html,...flatten(html)].find(n=>n.id===id)??null,
    createTreeWalker(node){const nodes=flatten(node);let i=0;return {nextNode:()=>nodes[i++]??null};}};
  const selector=new Element('select','languageSelect');body.append(selector);
  const window={events:[],addEventListener(type,fn){listeners[type]=fn;},
    dispatchEvent(event){this.events.push(event);listeners[event.type]?.(event);},
    confirm(message){this.lastDialog=message;return true;}};
  const context=vm.createContext({window,document,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
    localStorage:{getItem:key=>{if(storageBlocked)throw Error('blocked');return storage.get(key)??null;},
      setItem:(key,value)=>{if(storageBlocked)throw Error('blocked');storage.set(key,value);}},
    MutationObserver:class{constructor(fn){mutations.push(fn);}observe(){}}});
  for(const file of ['runtime.js','catalog-en.js'])vm.runInContext(fs.readFileSync(path.join(root,'scripts/i18n',file),'utf8'),context);
  return {api:window.NumberTycoonI18n,window,document,body,Element,text,storage,selector,listeners,mutations,
    initialize:()=>listeners.DOMContentLoaded()};
}

test('English is the default and an explicit Korean preference survives reload',()=>{
  const e=environment();e.initialize();assert.equal(e.api.getLanguage(),'en');assert.equal(e.selector.value,'en');
  e.api.setLanguage('ko');assert.equal(e.storage.get('numberTycoonLanguage_v1'),'ko');
  const next=environment(e.storage.get('numberTycoonLanguage_v1'));next.initialize();
  assert.equal(next.api.getLanguage(),'ko');assert.equal(next.document.documentElement.lang,'ko');
  const blocked=environment(null,true);blocked.initialize();assert.doesNotThrow(()=>blocked.api.setLanguage('ko'));
});

test('live text and input hints localize and restore without touching user content',()=>{
  const e=environment(),label=new e.Element('button'),input=new e.Element('input'),name=new e.Element('span');
  const visible=e.text('설정'),personal=e.text('설정');label.append(visible);name.append(personal);
  name.setAttribute('class','automatium-program-list-name');input.value='내 프로그램';input.setAttribute('placeholder','프로그램 이름');
  e.body.append(label,input,name);e.initialize();
  assert.equal(visible.nodeValue,'Settings');assert.equal(input.getAttribute('placeholder'),'Program name');
  assert.equal(input.value,'내 프로그램');assert.equal(personal.nodeValue,'설정');
  e.api.setLanguage('ko');assert.equal(visible.nodeValue,'설정');assert.equal(input.getAttribute('placeholder'),'프로그램 이름');
  visible.nodeValue='비용: 10 CP';e.api.setLanguage('en');assert.equal(visible.nodeValue,'Cost: 10 CP');
  e.api.setLanguage('ko');assert.equal(visible.nodeValue,'비용: 10 CP');
});

test('mutation updates are idempotent and graph images switch language in both directions',()=>{
  const e=environment(),label=new e.Element('button'),image=new e.Element('img');
  label.append(e.text('저장'));image.setAttribute('src','./assets/formula-graphs/percent-softcap.svg?v=1');e.body.append(label,image);
  e.initialize();assert.equal(image.getAttribute('src'),'./assets/formula-graphs/en/percent-softcap.svg?v=1');
  const node=e.text('불러오기');label.append(node);e.mutations[0]([{type:'childList',addedNodes:[node]}]);
  assert.equal(node.nodeValue,'Load');e.mutations[0]([{type:'characterData',target:node}]);assert.equal(node.nodeValue,'Load');
  e.api.setLanguage('ko');assert.equal(node.nodeValue,'불러오기');
  assert.equal(image.getAttribute('src'),'./assets/formula-graphs/percent-softcap.svg?v=1');
});

test('nested status templates translate their values and quoted custom names stay intact',()=>{
  const e=loadCatalog();
  assert.equal(e.text('비용: 10 CP'),'Cost: 10 CP');
  assert.equal(e.text('현재 KC1중'),'Currently in KC1');
  const rendered=e.text('% 사용 (0 / 1) · 파워 +10% · 소프트캡 1t 감쇠 중');
  assert.ok(!hangul.test(rendered),rendered);
  assert.ok(e.text("'설정' 프로그램을 삭제하시겠습니까?").includes("'설정'"));
  assert.ok(!hangul.test(e.text('정체된 특이점이 주는 최종 배율을 구매마다 2배로 만듭니다. 현재 기여 배율 강화: ×1')));
  assert.ok(!hangul.test(e.text('공간 팽창 중 생산·교환 배율의 지수의 지수가 0.25배가 됩니다. SP 최종 획득량은 max(1, log10(G))로 압축합니다. 소프트캡 확장, 블랙홀 반지름과 시간 가속 배율은 유지됩니다.')));
  assert.ok(!hangul.test(e.text('H = floor((log10(max(1, CP)) / 10)^3 × 3^Lh), 보유 H = max(기존 H, 종료 H). SM 생산 = 보유 H × 5^Lm mg/현실초. Lh/Lm/Le는 각 공간 팽창 업그레이드 구매 횟수입니다.')));
  assert.ok(!hangul.test(e.text('현재 결제 가격이 1e500 KP부터 기존 지수 ×2에 더해, 1e100배 구간마다 가격 상승폭의 지수가 추가로 4배 됩니다. 29-1 연구 시 결제 가격과 상승 기준을 분리합니다.')));
  assert.ok(!hangul.test(e.text('U 0.634초 (커누스 현실 시간)\nSP ×799k · CP ×199.8')));
  assert.ok(!hangul.test(e.text('U 0.634초 (커누스 현실 시간)\na·b·c ×3.997\n속도 구매 감소량 ×8')));
  assert.ok(!hangul.test(e.text('그룹 반복 구매 가격 상승률: 현재 비용이 1e50 KP 이상이면 기존 상승 배율 ×2, 1.8e308 KP 이상이면 추가 ×4 (기존 대비 ×8). 1e400 KP부터 1e100배 구간마다 상승 배율의 지수에 ×4를 추가합니다. 현재 결제 가격으로 구간을 판정합니다. 29-1 연구 시 상승 기준을 분리합니다. 연산 강화는 별도 가격 규칙을 사용합니다.')));
});

test('built-in N comments are translated without flattening executable line breaks',()=>{
  const e=loadCatalog();const source='// 새 N 프로그램\nwhile true {\n    click\n}\n';
  const result=e.code(source);assert.ok(!hangul.test(result));
  assert.equal(result.split('\n').slice(1).join('\n'),source.split('\n').slice(1).join('\n'));
});

test('every localized built-in N example keeps the original executable tokens',()=>{
  const catalog=loadCatalog(),context=vm.createContext({performance:{now:()=>0}});
  for(const file of ['scripts/core/constants.js','scripts/core/number-math.js','scripts/core/state.js','scripts/automatium/n-lexer.js','scripts/automatium/n-parser.js']) {
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  }
  const source=fs.readFileSync(path.join(root,'scripts/systems/automatium.js'),'utf8');
  vm.runInContext(source.slice(source.indexOf('const N_BASE_UPGRADE_GUIDE'),source.indexOf('const N_BREAKTHROUGH_UPGRADE_ALIASES')),context);
  vm.runInContext(source.slice(source.indexOf('function automatiumProgramExamplesList('),source.indexOf('function addAutomatiumExample(')),context);
  const examples=vm.runInContext('automatiumProgramExamplesList()',context);
  for(const example of examples) {
    context.original=example.source;context.localized=catalog.code(example.source);
    assert.ok(!hangul.test(context.localized),example.id);
    assert.doesNotThrow(()=>vm.runInContext('NParser.parse(localized)',context),example.id);
    const tokens=value=>vm.runInContext(`JSON.stringify(NLexer.tokenize(${value}).map(({type,value})=>({type,value})))`,context);
    assert.equal(tokens('original'),tokens('localized'),example.id);
  }
});

test('translated clickable news keeps its original achievement identity when switching languages',()=>{
  const e=environment();e.initialize();const callbacks={},unlocked=[];
  const ticker=new e.Element('span');ticker.style={setProperty(){}};ticker.classList={remove(){},toggle(){},add(){}};
  ticker.addEventListener=(type,fn)=>{callbacks[type]=fn;};ticker.getBoundingClientRect=()=>({width:300});
  Object.defineProperty(ticker,'textContent',{get(){return this.children.map(n=>n.nodeValue).join('');},
    set(value){this.children=[];this.append(e.text(value));}});
  const track=new e.Element('div');track.getBoundingClientRect=()=>({width:800});track.append(ticker);e.body.append(track);
  const context=vm.createContext({window:e.window,newsTickerText:ticker,newsModeSelect:null,
    unlockAchievement:id=>unlocked.push(id)});
  const source=fs.readFileSync(path.join(root,'scripts/systems/news-ticker.js'),'utf8');
  vm.runInContext(`const CLICKABLE_ACHIEVEMENT_NEWS=new Set(['이 뉴스를 클릭해 새로운 업적 달성']);
    const NEWS_TICKER_SIDE_PADDING=24,NEWS_TICKER_SPEED_PX_PER_SECOND=450;let currentNewsTickerMessage='';
    function setRandomNewsTickerMessage(){};`,context);
  vm.runInContext(source.slice(source.indexOf('function startNewsTickerMessage('),source.indexOf('function setRandomNewsTickerMessage(')),context);
  vm.runInContext(source.slice(source.indexOf('if (newsTickerText) {'),source.indexOf('if (newsSettingsBtn &&')),context);
  vm.runInContext("startNewsTickerMessage('이 뉴스를 클릭해 새로운 업적 달성')",context);
  assert.ok(!hangul.test(ticker.textContent));callbacks.click();assert.deepEqual(unlocked,['real_one']);
  e.api.setLanguage('ko');assert.equal(ticker.textContent,'이 뉴스를 클릭해 새로운 업적 달성');
  callbacks.click();assert.deepEqual(unlocked,['real_one','real_one']);
  assert.equal(vm.runInContext('currentNewsTickerMessage',context),'이 뉴스를 클릭해 새로운 업적 달성');
});

test('all active source text is covered, with only the Korean language self-name intentionally retained',()=>{
  const e=loadCatalog();const missing=inventory().filter(entry=>entry.source!=='한국어'&&hangul.test(e.text(entry.source)));
  assert.deepEqual(missing.map(e=>e.source),[]);
});

test('English graph variants retain numerical geometry and contain no Korean labels',()=>{
  const dir=path.join(root,'assets/formula-graphs');
  for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.svg'))){
    const ko=fs.readFileSync(path.join(dir,file),'utf8'),en=fs.readFileSync(path.join(dir,'en',file),'utf8');
    assert.deepEqual([...en.matchAll(/\bd="([^"]*)"/g)].map(m=>m[1]),[...ko.matchAll(/\bd="([^"]*)"/g)].map(m=>m[1]),file);
    assert.ok(!hangul.test(en),file);
  }
});
