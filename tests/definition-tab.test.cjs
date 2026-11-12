const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { game, run } = require('./helpers/kc4-game.cjs');

function chapterGame() {
  const ctx = game(true);
  for (const file of ['data/chapter-roadmap.js', 'core/chapter-ui.js']) {
    ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts', file), 'utf8'));
  }
  return ctx;
}

test('definition is a top-level placeholder and switching preserves progression', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(html, /id="knuthTabBtn"[^>]*>커누스<\/button>\s*<button id="definitionTabBtn" class="hidden">정의<\/button>/);
  assert.match(html, /id="definitionPanel">\s*<button id="definitionContentCard"[^>]*>이후 컨텐츠 개발 준비중<\/button>/);
  const r = run(chapterGame(), `
    knuthUnlocked=false;squareUnlocked=false;knuthPoints=123;definitionFragments=1;
    const before=JSON.stringify(captureGameSaveData());
    definitionTabBtn.events.click();
    const selected={chapter:activeChapter,label:chapterLabel.textContent,
      visible:!definitionPanel.classList.contains('hidden'),active:definitionTabBtn.classList.contains('active'),
      otherHidden:[multiplicationPanel,squarePanel,knuthPanel].every(p=>p.classList.contains('hidden')),
      theme:document.body.classList.contains('definition-mode'),
      squareLocked:squareTabBtn.disabled,knuthLocked:knuthTabBtn.disabled};
    setChapter('multiplication');
    return {selected,hidden:definitionPanel.classList.contains('hidden'),
      inactive:!definitionTabBtn.classList.contains('active'),
      noTheme:!document.body.classList.contains('definition-mode'),
      unchanged:before===JSON.stringify(captureGameSaveData())};`);
  assert.deepEqual(r, {selected:{chapter:'definition',label:'정의',visible:true,active:true,
    otherHidden:true,theme:true,squareLocked:true,knuthLocked:true},hidden:true,inactive:true,
    noTheme:true,unchanged:true});
});

test('definition selection survives save/load without changing existing chapter gates', () => {
  const r = run(chapterGame(), `
    definitionFragments=1;setChapter('definition');const saved=captureGameSaveData();setChapter('multiplication');
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const restored=activeChapter==='definition'&&!definitionPanel.classList.contains('hidden');
    squareUnlocked=false;knuthUnlocked=false;setChapter('square');const square=activeChapter;
    setChapter('knuth');return {loaded,restored,square,knuth:activeChapter};`);
  assert.deepEqual(r,{loaded:true,restored:true,square:'multiplication',knuth:'multiplication'});
});

test('definition render updates shared currency without rendering hidden base controls', () => {
  const ctx = chapterGame();
  ctx.loadSource(fs.readFileSync(path.join(__dirname, '../scripts/core/render.js'), 'utf8'));
  const r = run(ctx, `
    updateGameRenderState=()=>{};
    let dock=0,programs=0;
    renderManualExchangeDock=()=>dock++;renderAutomatiumAccess=()=>programs++;
    definitionFragments=1;activeChapter='definition';knuthPoints=123;mainValue.textContent='unchanged';
    renderNow();return {dock,programs,base:mainValue.textContent,kp:currencyKnuthValue.textContent};`);
  assert.deepEqual(r,{dock:1,programs:1,base:'unchanged',kp:'123'});
});

test('definition is hidden and inaccessible without a fragment, including saved selection', () => {
  const r = run(chapterGame(), `
    definitionFragments=0;refreshChapterTabs();
    const initiallyHidden=definitionTabBtn.classList.contains('hidden');
    definitionTabBtn.events.click();const blocked=activeChapter==='multiplication';
    const saved=captureGameSaveData();saved.activeChapter='definition';
    loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    const loadBlocked=activeChapter==='multiplication'&&definitionPanel.classList.contains('hidden');
    definitionFragments=NumberMath.fromString('1');refreshChapterTabs();
    const revealed=!definitionTabBtn.classList.contains('hidden');
    setChapter('definition');definitionFragments=0;refreshChapterTabs();
    return {initiallyHidden,blocked,loadBlocked,revealed,
      removed:activeChapter==='multiplication'&&definitionTabBtn.classList.contains('hidden')
        &&definitionPanel.classList.contains('hidden')};`);
  assert.deepEqual(r,{initiallyHidden:true,blocked:true,loadBlocked:true,revealed:true,removed:true});
});
