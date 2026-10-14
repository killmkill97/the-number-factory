const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/automatium.js'), 'utf8');

function editor(saved = ['a','b','c'].map(id => ({id,name:id,source:'wait 1s',enabled:id==='a'}))) {
  const elements = new Map(), storage = new Map([['numberTycoonAutomatiumPrograms_v1', JSON.stringify(saved)]]);
  const timers = new Map(), frames = new Map();
  let now=0,nextId=0,writes=0;
  function element() {
    let className='';
    const classes=new Set(),listeners=new Map(),captures=new Set();
    const node={children:[],dataset:{},style:{},attributes:{},scrollTop:0,clientWidth:260,
      value:'',selectionStart:0,selectionEnd:0,
      get className(){return className;},
      set className(value){className=value;classes.clear();value.split(/\s+/).filter(Boolean).forEach(v=>classes.add(v));},
      classList:{add:(...values)=>values.forEach(v=>classes.add(v)),remove:(...values)=>values.forEach(v=>classes.delete(v)),
        contains:v=>classes.has(v),toggle(v,on){if(on)classes.add(v);else classes.delete(v);}},
      getBoundingClientRect(){return this.bounds??{left:0,top:0,right:260,bottom:200,width:260,height:200};},
      addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,[]);listeners.get(name).push(fn);},
      dispatch(name,props={}){const e={button:0,pointerId:1,clientX:20,clientY:20,detail:1,preventDefault(){},...props};
        for(const fn of listeners.get(name)??[])fn(e);},
      append(...nodes){nodes.forEach(child=>this.insertBefore(child,null));},
      appendChild(child){this.insertBefore(child,null);},
      insertBefore(child,before){child.remove();const i=before===null?this.children.length:this.children.indexOf(before);
        this.children.splice(i,0,child);child.parentElement=this;},
      remove(){if(this.parentElement){const children=this.parentElement.children;children.splice(children.indexOf(this),1);this.parentElement=null;}},
      setAttribute(name,value){this.attributes[name]=value;},
      cloneNode(){const clone=element();clone.className=[...classes].join(' ');clone.bounds=this.bounds;return clone;},
      setPointerCapture(id){captures.add(id);},hasPointerCapture:id=>captures.has(id),
      releasePointerCapture(id){captures.delete(id);this.dispatch('lostpointercapture',{pointerId:id});}
    };
    return node;
  }
  const document={body:element(),createElement:element,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);}};
  const context=vm.createContext({document,performance:{now:()=>now},
    localStorage:{getItem:key=>storage.get(key)??null,setItem(key,value){storage.set(key,value);writes++;}},
    setTimeout(fn,ms){const id=++nextId;timers.set(id,{fn,at:now+ms});return id;},clearTimeout:id=>timers.delete(id),
    requestAnimationFrame(fn){const id=++nextId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
  for(const file of ['constants.js','number-math.js','state.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/core',file),'utf8'),context);
  vm.runInContext(source.slice(0,source.indexOf('function setAutomatiumRuntimeStatus(')),context);
  vm.runInContext(source.slice(source.indexOf('function reorderAutomatiumProgram('),source.indexOf('function renderAutomatiumEditorStatus(')),context);
  vm.runInContext(`
    let renderCount=0;automatiumStatus=program=>({tone:'',label:program.enabled?'실행 중':'OFF'});
    renderAutomatiumUi=()=>{renderCount++;renderAutomatiumProgramList();renderAutomatiumQuickProgramList();};
    automatiumSource.value='unsaved draft';automatiumEditorDirty=true;
    automatiumExecutions.set('a',{iterator:{marker:'running'}});
    renderAutomatiumUi();
    automatiumPrograms.forEach((program,i)=>{
      automatiumProgramUi.get(program.id).row.bounds={left:10,top:10+i*54,right:250,bottom:58+i*54,width:240,height:48};
    });
  `,context);
  return {context,document,storage,frames,timers,get writes(){return writes;},
    advance(ms){now+=ms;for(const [id,timer]of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}},
    frame(){for(const [id,fn]of [...frames]){frames.delete(id);fn();}},
    handle(id){return vm.runInContext(`automatiumProgramUi.get(${JSON.stringify(id)}).handle`,context);},
    run(code){return JSON.parse(JSON.stringify(vm.runInContext(`(()=>{${code}})()`,context)));}
  };
}

test('legacy programs keep their order and hidden is restored only from boolean true',()=>{
  const e=editor([{id:'b',hidden:true},{id:'a',hidden:'true'},{id:'c'}]);
  assert.deepEqual(e.run('return automatiumPrograms.map(p=>({id:p.id,hidden:p.hidden}));'),
    [{id:'b',hidden:true},{id:'a',hidden:false},{id:'c',hidden:false}]);
  assert.equal(e.run('return makeAutomatiumProgram().hidden;'),false);
});

test('reordering stores the new order while preserving editor drafts, selected ID and running executions',()=>{
  const e=editor();
  assert.deepEqual(e.run(`
    const program=automatiumPrograms[0],iterator=automatiumExecutions.get('a').iterator;
    const moved=reorderAutomatiumProgram('a','c');
    return {moved,ids:automatiumPrograms.map(p=>p.id),same:automatiumPrograms[1]===program,
      selected:selectedAutomatiumProgramId,draft:automatiumSource.value,dirty:automatiumEditorDirty,
      running:automatiumExecutions.get('a').iterator===iterator};
  `),{moved:true,ids:['b','a','c'],same:true,selected:'a',draft:'unsaved draft',dirty:true,running:true});
  assert.deepEqual(JSON.parse(e.storage.get('numberTycoonAutomatiumPrograms_v1')).map(p=>p.id),['b','a','c']);
});

test('end insertion works and invalid or unchanged reorders do not write to storage',()=>{
  const e=editor();
  assert.deepEqual(e.run(`return [reorderAutomatiumProgram('a','b'),reorderAutomatiumProgram('a','a'),
    reorderAutomatiumProgram('missing','b'),reorderAutomatiumProgram('a','missing')];`),[false,false,false,false]);
  assert.equal(e.writes,0);
  assert.equal(e.run("return reorderAutomatiumProgram('a');"),true);
  assert.deepEqual(e.run('return automatiumPrograms.map(p=>p.id);'),['b','c','a']);
});

test('hiding removes only the quick row, dims the editor row and preserves execution state',()=>{
  const e=editor();
  assert.deepEqual(e.run(`
    const hidden=toggleAutomatiumProgramHidden('a');
    return {hidden,enabled:automatiumPrograms[0].enabled,running:automatiumExecutions.has('a'),
      dim:automatiumProgramUi.get('a').row.classList.contains('program-hidden'),
      editor:automatiumProgramUi.has('a'),quick:automatiumQuickProgramUi.has('a'),draft:automatiumSource.value};
  `),{hidden:true,enabled:true,running:true,dim:true,editor:true,quick:false,draft:'unsaved draft'});
  assert.equal(JSON.parse(e.storage.get('numberTycoonAutomatiumPrograms_v1'))[0].hidden,true);
  e.handle('a').dispatch('click',{detail:0});
  assert.equal(e.run("return automatiumQuickProgramUi.has('a');"),true);
});

test('hiding every program leaves recoverable editor rows and a quick-list empty state',()=>{
  const e=editor();
  assert.deepEqual(e.run(`
    automatiumPrograms.forEach(p=>toggleAutomatiumProgramHidden(p.id));
    return {editor:automatiumProgramList.children.length,quick:automatiumQuickProgramList.children.length,
      message:automatiumQuickEmptyListElement.textContent,unknown:toggleAutomatiumProgramHidden('missing')};
  `),{editor:3,quick:1,message:'표시할 프로그램 없음',unknown:false});
});

test('a short click toggles visibility without creating a drag preview',()=>{
  const e=editor(),handle=e.handle('a');
  handle.dispatch('pointerdown');e.advance(250);handle.dispatch('pointerup');handle.dispatch('click');
  assert.equal(e.run('return automatiumPrograms[0].hidden;'),true);
  assert.equal(e.document.body.children.length,0);
  assert.equal(e.timers.size,0);
});

test('drag activates only after 500ms and a long stationary release never toggles hiding',()=>{
  const e=editor(),handle=e.handle('a');
  handle.dispatch('pointerdown');e.advance(499);
  assert.equal(e.document.body.children.length,0);
  e.advance(1);
  assert.equal(e.document.body.children.length,2);
  assert.equal(handle.attributes['aria-grabbed'],'true');
  handle.dispatch('pointerup');handle.dispatch('click');
  assert.deepEqual(e.run('return automatiumPrograms.map(p=>({id:p.id,hidden:p.hidden}));'),
    [{id:'a',hidden:false},{id:'b',hidden:false},{id:'c',hidden:false}]);
  assert.equal(e.document.body.children.length,0);
  assert.equal(e.frames.size,0);
});

test('held dragging follows the pointer, shows an insertion line and commits only on release',()=>{
  const e=editor(),handle=e.handle('a');
  handle.dispatch('pointerdown');e.advance(500);
  handle.dispatch('pointermove',{clientX:30,clientY:170});e.frame();
  assert.match(e.document.body.children[1].style.transform,/translate\(20px, 160px\)/);
  assert.equal(e.document.body.children[0].classList.contains('hidden'),false);
  assert.deepEqual(e.run('return automatiumPrograms.map(p=>p.id);'),['a','b','c']);
  handle.dispatch('pointerup',{clientX:30,clientY:170});handle.dispatch('click');
  assert.deepEqual(e.run('return automatiumPrograms.map(p=>p.id);'),['b','c','a']);
  assert.equal(e.run("return automatiumPrograms.find(p=>p.id==='a').hidden;"),false);
});

test('moving before the hold threshold cancels the gesture instead of accidentally hiding',()=>{
  const e=editor(),handle=e.handle('a');
  handle.dispatch('pointerdown');handle.dispatch('pointermove',{clientY:40});e.advance(1500);
  handle.dispatch('pointerup',{clientY:40});handle.dispatch('click');
  assert.equal(e.run('return automatiumPrograms[0].hidden;'),false);
  assert.equal(e.document.body.children.length,0);
});

test('releasing outside the list or cancelling a pointer cleans up without reordering',()=>{
  for(const cancel of [false,true]){
    const e=editor(),handle=e.handle('a');
    handle.dispatch('pointerdown');e.advance(500);
    handle.dispatch(cancel?'pointercancel':'pointerup',{clientX:400,clientY:170});
    assert.deepEqual(e.run('return automatiumPrograms.map(p=>p.id);'),['a','b','c']);
    assert.equal(e.document.body.children.length,0);assert.equal(e.frames.size,0);
    assert.equal(handle.hasPointerCapture(1),false);
  }
});

test('a different pointer cannot hijack or release an active gesture',()=>{
  const e=editor(),handle=e.handle('a');
  handle.dispatch('pointerdown');e.advance(500);
  e.handle('b').dispatch('pointerdown',{pointerId:2});
  handle.dispatch('pointerup',{pointerId:2});
  assert.equal(e.document.body.children.length,2);
  handle.dispatch('pointerup');
  assert.equal(e.document.body.children.length,0);
});

test('a one-program drag produces a finite marker and cancellation clears the animation',()=>{
  const e=editor([{id:'a'}]);
  e.handle('a').dispatch('pointerdown');e.advance(500);
  assert.equal(e.document.body.children[0].style.top,'8px');
  e.run('finishAutomatiumProgramDrag();return true;');
  assert.equal(e.document.body.children.length,0);assert.equal(e.frames.size,0);assert.equal(e.writes,0);
});

test('quick rows follow saved ordering after hidden programs are moved and restored',()=>{
  const e=editor();
  assert.deepEqual(e.run(`
    toggleAutomatiumProgramHidden('b');reorderAutomatiumProgram('c','a');toggleAutomatiumProgramHidden('b');
    return automatiumQuickProgramList.children.map(row=>row.children[0].children[0].textContent);
  `),['c','a','b']);
  assert.deepEqual(e.run('return loadAutomatiumPrograms().map(p=>p.id);'),['c','a','b']);
});

test('removing the dragged program cancels its preview without breaking the remaining list',()=>{
  const e=editor();e.handle('a').dispatch('pointerdown');e.advance(500);
  assert.deepEqual(e.run(`
    automatiumPrograms=automatiumPrograms.filter(p=>p.id!=='a');renderAutomatiumProgramList();
    return automatiumProgramList.children.map(row=>row.dataset.programId);
  `),['b','c']);
  assert.equal(e.document.body.children.length,0);assert.equal(e.frames.size,0);
});
