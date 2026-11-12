const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const setup = `<script>
const qaSourceSave=localStorage.getItem('numberTycoonSave_v1');
const qaMemory=new Map(qaSourceSave?[['numberTycoonSave_v1',qaSourceSave]]:[]);
Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:key=>qaMemory.get(key)??null,setItem:(key,value)=>qaMemory.set(key,String(value)),removeItem:key=>qaMemory.delete(key)}});
window.setInterval=()=>0;window.setTimeout=()=>0;
window.fetch=()=>Promise.resolve({ok:false,json:async()=>({})});
window.addEventListener('error',event=>{const output=document.getElementById('qa-output');if(output)output.textContent+='\\nERROR: '+event.message;});
</script>`;

const fixture = `<script>
const qaRequestedUtc=Number(new URLSearchParams(location.search).get('at'));
const qaUtc=Number.isSafeInteger(qaRequestedUtc)&&qaRequestedUtc>0?qaRequestedUtc:gameUtcNowMs();gameUtcNowMs=()=>qaUtc;
const qaPanel=document.createElement('section');qaPanel.style='position:relative;z-index:20000;background:#101b14;color:#cfffda;padding:16px;max-width:1200px;margin:12px auto;';
qaPanel.innerHTML='<h2>생산 분기 저장 복사본 비교</h2><p>로컬 저장 읽기 전용 · 클라우드 연결 없음 · 자동화/주기 타이머 정지</p><button id="qa-compare">현재 계수 비교</button><button id="qa-tune">CP 지수 25000 기준 계수 탐색</button><table id="qa-summary" style="width:100%;margin:16px 0;border-collapse:collapse;font:14px sans-serif"></table><details><summary>상세 계산 기록</summary><pre id="qa-output" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></details>';
document.body.prepend(qaPanel);
const qaReport=document.getElementById('qa-output');
const qaLoaded=qaSourceSave&&loadGame(qaSourceSave,{persistOverride:false,countAsLoad:false});
const qaBaseline=JSON.stringify(captureGameSaveData());
const qaOriginalTuning={...ABSTRACTION_PRODUCTION_BRANCH_BALANCE};
function qaSnapshot(){return {
 cp:fmtPowerBase(squareConvergencePointGain()),cpLog:numberLog10(squareConvergencePointGain()),
 heldCp:fmtPowerBase(squareConvergencePoints),sp:fmtPowerBase(squarePoints),kp:fmtPowerBase(knuthPoints),
 randomPower:fmtPowerBase(randomPower),radius:fmtPowerBase(numberBlackHoleSchwarzschildRadius()),
 randomLog:numberLog10(randomPower),radiusLog:numberLog10(numberBlackHoleSchwarzschildRadius()),
 cpPower:knuthAdvancedEffect('cp_power'),singularities:fmtPowerBase(singularityPoints),
 timeLimit:fmtPowerBase(numberBlackHoleTimeLimit()),activeChallenge:activeKnuthChallengeId,
 branch:[25,26,27].flatMap(tier=>[1,2].filter(lane=>hasAbstractionResearch(tier+'-'+lane)).map(lane=>tier+'-'+lane))
};}
const qaOriginalSnapshot=qaSnapshot();
function qaBranch(lane){
 const renderOriginal=render;render=()=>{};
 try{
  loadGame(qaBaseline,{persistOverride:false,countAsLoad:false});
  for(const tier of [25,26,27])for(const side of [1,2])abstractionResearchState[tier+'-'+side]=side===lane;
  divergerPower=divergerProductionValue();
 }finally{render=renderOriginal;}
}
function qaRun(tune){
 const rows=[];const renderOriginal=render;render=()=>{};
 try{
  Object.assign(ABSTRACTION_PRODUCTION_BRANCH_BALANCE,qaOriginalTuning);
  for(const lane of [1,2]){
   qaBranch(lane);
   const field=lane===1?'cpLogStrength':'blackHoleCpLogStrength';
   const configured=ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field];
   ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]=lane===1?60:0;
   const before=qaSnapshot();ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]=configured;
   if(tune){
    let low=0,high=Math.max(1,ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]);
    ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]=high;
    while(numberLog10(squareConvergencePointGain())<25000&&high<1e9){high*=2;ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]=high;}
    for(let i=0;i<36;i++){
     const mid=(low+high)/2;ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]=mid;
     if(numberLog10(squareConvergencePointGain())<25000)low=mid;else high=mid;
    }
    ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field]=Math.round((low+high)/2);
   }
   const after=qaSnapshot(),balanceValue=ABSTRACTION_PRODUCTION_BRANCH_BALANCE[field];
   for(let i=0;i<10;i++){
    advanceProbabilizer(500,()=>0.5);advanceNumberBlackHole(500);
    advanceSquareRunTime(500);advanceSquareDimensions(500);advanceDiverger(500);advanceAbstraction(500);
   }
   const fiveSeconds=qaSnapshot(),expected=squareConvergencePointGain(),oldHeld=squareConvergencePoints;
   const paid=collectSquareConvergenceIfReady();
   const credited={cp:fmtPowerBase(paid),cpLog:numberLog10(paid),held:fmtPowerBase(squareConvergencePoints),
     correct:compareNumberValues(squareConvergencePoints,addBaseNumbers(oldHeld,expected))===0&&compareNumberValues(paid,expected)===0};
   rows.push({lane:lane===1?'확률자':'숫자 블랙홀',field,balanceValue,before,after,fiveSeconds,credited});
  }
 }finally{
  Object.assign(ABSTRACTION_PRODUCTION_BRANCH_BALANCE,qaOriginalTuning);
  loadGame(qaBaseline,{persistOverride:false,countAsLoad:false});render=renderOriginal;
 }
 qaReport.textContent=JSON.stringify({loaded:!!qaLoaded,capturedAtUtc:qaUtc,source:qaOriginalSnapshot,rows},null,2);
 const table=document.getElementById('qa-summary');table.replaceChildren();
 for(const values of [['경로','변경 전 CP 지수','변경 후 CP 지수','5초 후 CP 지수','실제 교환'],
   ...rows.map(row=>[row.lane,row.before.cpLog.toFixed(2),row.after.cpLog.toFixed(2),row.fiveSeconds.cpLog.toFixed(2),row.credited.correct?'지급 일치':'불일치'])]){
  const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=value;td.style='padding:10px 6px;border-bottom:1px solid #365b42';tr.append(td);}table.append(tr);
 }
 render();return rows;
}
document.getElementById('qa-compare').onclick=()=>qaRun(false);
document.getElementById('qa-tune').onclick=()=>qaRun(true);
qaReport.textContent=JSON.stringify({savePresent:!!qaSourceSave,loaded:!!qaLoaded,capturedAtUtc:qaUtc,source:qaOriginalSnapshot},null,2);
setChapter('knuth');setKnuthView('abstraction');render();
</script>`;

function buildPreview() {
  return fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace('<head>', '<head>' + setup)
    .replace(/<script[^>]*src="\.\/scripts\/(?:main|core\/session|config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g, '')
    .replace(/(["'])\.\/(scripts|styles|assets)\//g, '$1/$2/')
    .replace(/(<script[^>]*src="[^"?]+)(?:\?[^\"]*)?("[^>]*><\/script>)/g, '$1?qa=' + Date.now() + '$2')
    .replace('</body>', fixture + '</body>');
}

module.exports = { buildPreview };
if (require.main === module) {
  const output=path.join(root, 'tests/production-balance-preview.html');
  fs.writeFileSync(output, buildPreview());
  process.stdout.write('http://localhost:8765/tests/production-balance-preview.html\n');
}
