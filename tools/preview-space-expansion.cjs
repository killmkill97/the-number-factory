const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function buildPreview() {
  const setup = `<script>
const qaSourceSave=localStorage.getItem('numberTycoonSave_v1');
const qaMemory=new Map(qaSourceSave?[['numberTycoonSave_v1',qaSourceSave]]:[]);
Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>qaMemory.get(k)??null,
setItem:(k,v)=>qaMemory.set(k,String(v)),removeItem:k=>qaMemory.delete(k)}});
window.setInterval=()=>0;window.setTimeout=()=>0;
window.fetch=()=>Promise.resolve({ok:false,json:async()=>({})});
window.addEventListener('error',e=>{const el=document.getElementById('qa-space-output');if(el)el.textContent+='\\nERROR: '+e.message;});
</script>`;
  const fixture = `<script>
const qaUtc=gameUtcNowMs(),qaTimeline=gameTimelineNowMs();gameUtcNowMs=()=>qaUtc;gameTimelineNowMs=()=>qaTimeline;
const qaLoaded=Boolean(qaSourceSave&&loadGame(qaSourceSave,{persistOverride:false,countAsLoad:false}));
const qaBaseline=JSON.stringify(captureGameSaveData());
const qaBar=document.createElement('section');qaBar.style='position:fixed;top:60px;left:12px;z-index:20000;background:#102018;color:#b9ffce;padding:12px;width:300px;font:12px monospace';
qaBar.className='qa-space-tools';const qaStyle=document.createElement('style');qaStyle.textContent='@media(max-width:700px){.qa-space-tools{display:none}}';document.head.appendChild(qaStyle);
qaBar.innerHTML='<strong>공간 팽창 · 저장 복사본 검증</strong><p>클라우드 연결 없음 · 저장소 쓰기 없음 · 시간 정지</p><button id="qa-space-run">시작·종료·질량 검증</button><details><summary>검증 결과</summary><pre id="qa-space-output" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></details>';
document.body.prepend(qaBar);
function qaSpaceSnapshot(){return {loaded:qaLoaded,cp:fmtPowerBase(squareConvergencePoints),kp:fmtPowerBase(knuthPoints),
radius:fmtPowerBase(numberBlackHoleSchwarzschildRadius()),random:fmtPowerBase(randomPower),active:spaceExpansionActive,
higgs:fmtPowerBase(higgsParticles),mass:formatStagnantMass(stagnantMassMg),radiusMultiplier:fmtPowerBase(stagnantMassRadiusMultiplier()),
randomMultiplier:fmtPowerBase(stagnantMassRandomMultiplier())};}
const qaSourceSnapshot=qaSpaceSnapshot();
function qaRunSpace(){
 loadGame(qaBaseline,{persistOverride:false,countAsLoad:false});
 knuthUnlocked=true;hasClaimedKnuthPoint=true;activeKnuthChallengeId=null;knuthBaseUpgradeLevels.space_expansion=1;
 spaceExpansionActive=false;higgsParticles=0;stagnantMassMg=0;
 const cpOriginal=squareConvergencePoints;const exampleReward=spaceExpansionHiggsReward(cpOriginal);
 const beforeRadius=numberBlackHoleSchwarzschildRadius(),beforeRandom=probabilizerPowerMultiplier();
 const normalCp=squareConvergenceGainMultiplier(),normalSp=squarePointGain();
 const normalSpGain=squarePointGainForValue(getBaseNumber());
 const normalCpGain=squareConvergencePointGain();
 spaceExpansionActive=true;
 const cpRoot=numberLog10(squareConvergenceGainMultiplier()),spRoot=numberLog10(squarePointGain());
 const expandedSpGain=squarePointGainForValue(getBaseNumber());
 const expandedCpGain=squareConvergencePointGain();
 const excluded=compareNumberValues(numberBlackHoleSchwarzschildRadius(),beforeRadius)===0;
 spaceExpansionActive=false;
 const kpBefore=knuthPoints,eligible=canManuallyExchangeKnuthPoints(),kpQuote=knuthPointGain();
 const entered=toggleSpaceExpansion();
 const entryPaid=compareNumberValues(knuthPoints,eligible?addBaseNumbers(kpBefore,kpQuote):kpBefore)===0;
 squareConvergencePoints=NumberMath.fromString('1e2300');toggleSpaceExpansion();const first=higgsParticles;
 toggleSpaceExpansion();squareConvergencePoints=NumberMath.fromString('1e2300');toggleSpaceExpansion();
 const noAddition=compareNumberValues(first,higgsParticles)===0;
 advanceSpaceExpansion(12000000);
 const after=qaSpaceSnapshot();
 const report={source:qaSourceSnapshot,referenceHiggs:fmtPowerBase(exampleReward),entered,entryPaid,noAddition,
 cpLog:{normal:numberLog10(normalCp),expected:numberLog10(normalCp)<=1?numberLog10(normalCp):Math.pow(numberLog10(normalCp),SPACE_EXPANSION_BALANCE.multiplierPower),expanded:cpRoot},
 spLog:{normal:numberLog10(normalSp),expected:numberLog10(normalSp)<=1?numberLog10(normalSp):Math.pow(numberLog10(normalSp),SPACE_EXPANSION_BALANCE.multiplierPower),expanded:spRoot},
 spGain:{normal:fmtPowerBase(normalSpGain),expanded:fmtPowerBase(expandedSpGain)},
 cpGain:{normal:fmtPowerBase(normalCpGain),expanded:fmtPowerBase(expandedCpGain)},
 excludedRadiusUnchanged:excluded,after};
 document.getElementById('qa-space-output').textContent=JSON.stringify(report,null,2);
 setChapter('knuth');setKnuthView('production');setKnuthProductionView('space_expansion');render();
}
document.getElementById('qa-space-run').onclick=qaRunSpace;
document.getElementById('qa-space-output').textContent=JSON.stringify(qaSourceSnapshot,null,2);
setChapter('knuth');setKnuthView('production');render();
</script>`;
  return fs.readFileSync(path.join(root, 'index.html'), 'utf8')
    .replace('<head>', '<head>' + setup)
    .replace(/<script[^>]*src="\.\/scripts\/(?:main|core\/session|config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g, '')
    .replace(/(["'])\.\/(scripts|styles|assets)\//g, '$1/$2/')
    .replace(/(<script[^>]*src="[^"?]+)(?:\?[^\"]*)?("[^>]*><\/script>)/g, '$1?qa=' + Date.now() + '$2')
    .replace('</body>', fixture + '</body>');
}
module.exports = { buildPreview };
if (require.main === module) {
  fs.writeFileSync(path.join(root, 'tests/space-expansion-preview.html'), buildPreview());
  process.stdout.write('http://localhost:8765/tests/space-expansion-preview.html\n');
}
