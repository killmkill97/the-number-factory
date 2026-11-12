const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { seedObservedProbabilizerGame, observedProbabilizerSnapshot, projectObservedSpCycle } = require('./probabilizer-balance.cjs');
const root = path.resolve(__dirname, '../..');
const setup = `<script>
const qaNativeInterval=window.setInterval.bind(window),qaTimers=[];
window.setInterval=(fn,ms)=>{qaTimers.push({fn,ms});return qaTimers.length;};
const qaFrame=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=fn=>{if(document.readyState==='loading'){window.addEventListener('DOMContentLoaded',()=>qaFrame(fn),{once:true});return 0;}return qaFrame(fn);};
window.addEventListener('error',e=>{const field=document.getElementById('qa-errors');if(field)field.textContent+=e.message+' | ';});
</script>`;
const fixture = String.raw`<script>
${seedObservedProbabilizerGame.toString()}
${observedProbabilizerSnapshot.toString()}
${projectObservedSpCycle.toString()}
const qaCleanSave=JSON.stringify(captureGameSaveData());
const qaBar=document.createElement('div');
qaBar.style='position:fixed;top:60px;left:12px;max-width:520px;z-index:9999;background:#142319;padding:8px;display:flex;gap:8px;flex-wrap:wrap;';
qaBar.innerHTML='<button id="qa-reset">관측 상태</button><button id="qa-compare">구식/신식 교환 비교</button><button id="qa-minute">1분 생산 비교</button><button id="qa-sp">SP 밸런스 비교</button><button id="qa-claim">실제 KP 교환</button><button id="qa-lock">해금 전환</button><output id="qa-result" style="white-space:pre-line;flex-basis:100%"></output><span id="qa-errors"></span>';
document.body.prepend(qaBar);
for(const [id,label] of [['qa-distribution','분포 이동 보기'],['qa-reload','복원 검증']]){
  const button=document.createElement('button');button.id=id;button.textContent=label;qaBar.append(button);
}
for(const button of qaBar.querySelectorAll('button'))button.style='width:auto;flex:none;';
if(new URLSearchParams(location.search).has('clean'))qaBar.style.display='none';
function qaSeed(){
  loadGame(qaCleanSave,{persistOverride:false,countAsLoad:false});
  seedObservedProbabilizerGame();resetProbabilizerRuntime();
  setChapter('knuth');setKnuthView('production');setKnuthProductionView('probabilizer');render();
}
function qaCompare(seconds=0){
  const utc=gameUtcNowMs,fixed=utc();gameUtcNowMs=()=>fixed;
  const currentProduction=divergerProductionBeforeDyson,currentParameters=probabilizerDivergerParameterMultiplier;
  const rows=[];
  try { for(const legacy of [true,false]){
    probabilizerDivergerParameterMultiplier=legacy?()=>1:currentParameters;
    divergerProductionBeforeDyson=legacy?(n=divergerN)=>multiplyNumberValue(currentProduction(n),
      NumberMath.powerOfTen(multiplyNumberValue(900000,probabilizerGrowth()))):currentProduction;
    qaSeed();
    for(let i=0;i<seconds;i++){
      advanceProbabilizer(1000,()=>0.5);advanceDiverger(1000);
      advanceSquareRunTime(1000);advanceAbstraction(1000);
    }
    divergerPower=divergerProductionValue();const row={legacy,seconds,...observedProbabilizerSnapshot()};
    row.cp=NumberMath.serialize(collectSquareConvergenceIfReady());row.kp=NumberMath.serialize(knuthPointGain());
    row.claimed=exchangeKnuthPointsManually();row.held=NumberMath.serialize(knuthPoints);rows.push(row);
  } } finally { gameUtcNowMs=utc;divergerProductionBeforeDyson=currentProduction;probabilizerDivergerParameterMultiplier=currentParameters; }
  qaSeed();
  document.getElementById('qa-result').textContent=seconds+'초 비교 (실제 CP→KP 교환)\n'+rows.map(row=>
    (row.legacy?'구식':'신식')+' CP '+fmtPowerBase(row.cp)+' → KP '+fmtPowerBase(row.kp)+' · 교환 '+row.claimed).join('\n');
  document.getElementById('qa-result').dataset.report=JSON.stringify(rows);
  render();return rows;
}
document.getElementById('qa-reset').onclick=qaSeed;
document.getElementById('qa-compare').onclick=()=>qaCompare();
document.getElementById('qa-minute').onclick=()=>qaCompare(60);
document.getElementById('qa-sp').onclick=()=>{
  const originalRender=render,utc=gameUtcNowMs,fixed=utc();
  const rows=[];render=()=>{};gameUtcNowMs=()=>fixed;
  try {
    for(const [strength,legacyPower] of [[1.2,true],[PROBABILIZER_BALANCE.divergerParameterLogStrength,false]]){
      loadGame(qaCleanSave,{persistOverride:false,countAsLoad:false});
      rows.push(projectObservedSpCycle(strength,1000000,legacyPower));
    }
  } finally {render=originalRender;gameUtcNowMs=utc;resetProbabilizerRuntime();}
  document.getElementById('qa-result').textContent='무작위력 100만 · KP 1회 교환+자동구매 후 SP\n'+rows.map(row=>
    (row.curve==='power'?'기존 거듭제곱':'로그 강화')+' '+row.parameterStrength+' → '+fmtPowerBase(row.sp)+' SP · 다이슨 '+row.dyson+'기').join('\n');
  document.getElementById('qa-result').dataset.report=JSON.stringify(rows);
  setChapter('knuth');setKnuthView('production');setKnuthProductionView('probabilizer');render();
};
document.getElementById('qa-claim').onclick=()=>{collectSquareConvergenceIfReady();exchangeKnuthPointsManually();render();};
document.getElementById('qa-lock').onclick=()=>{knuthBaseUpgradeLevels.probabilizer=knuthBaseUpgradeLevel('probabilizer')?0:1;render();};
let qaDistributionCase=0;
document.getElementById('qa-distribution').onclick=()=>{
  const profiles=[{a:0,b:0,speed:0,shift:25},{a:0,b:0,speed:0,shift:50},
    {a:10000,b:10000,speed:0,shift:0},{a:0,b:0,speed:0,shift:0}];
  probabilizerUpgradeLevels=profiles[qaDistributionCase++%profiles.length];
  resetProbabilizerRuntime();render();
};
document.getElementById('qa-reload').onclick=()=>{
  const utc=gameUtcNowMs,fixed=utc();gameUtcNowMs=()=>fixed;
  try{
    qaSeed();divergerPower=divergerProductionValue();
    const before=[NumberMath.serialize(divergerPower),NumberMath.serialize(abstractionCpGainMultiplier())];
    const saved=JSON.stringify(captureGameSaveData());randomPower=0;divergerA=1;divergerB=1;
    knuthEquippedUpgradeIds.clear();knuthPoints=0;knuthUnlocked=false;hasClaimedKnuthPoint=false;
    const loaded=loadGame(saved,{persistOverride:false,countAsLoad:false});
    const after=[NumberMath.serialize(divergerPower),NumberMath.serialize(abstractionCpGainMultiplier())];
    const result={loaded,before,after,same:JSON.stringify(before)===JSON.stringify(after)};
    document.getElementById('qa-result').textContent='불러오기 즉시 D·CP 배율 일치: '+result.same;
    document.getElementById('qa-result').dataset.report=JSON.stringify(result);
  }finally{gameUtcNowMs=utc;resetProbabilizerRuntime();render();}
};
qaSeed();
if(new URLSearchParams(location.search).has('advanced')){
  loadKnuthAdvancedEquipmentState({});
  knuthBaseUpgradeLevels.advanced_equipment=1;knuthPoints=NumberMath.fromString('1e20000');
  setKnuthView('equipment');render();
}
if(new URLSearchParams(location.search).has('power_upgrades')){
  randomPower=NumberMath.fromString('1e16');knuthPoints=NumberMath.fromString('1e1000');
  probabilizerUpgradeLevels.speed=31;divergerPower=divergerProductionValue();render();
}
if(new URLSearchParams(location.search).has('cost_tiers')||new URLSearchParams(location.search).has('high_bands')){
  abstractionResearchState['21-1']=true;initializeProbabilizerRangeProgress();
  probabilizerUpgradeLevels={a:100,b:200,speed:40,shift:20};
  probabilizerPowerUpgradeLevels={gain:0,diverger:18,interval_floor:20};
  randomPower=NumberMath.fromString('1e50');knuthPoints=NumberMath.fromString('1e1000');render();
}
if(new URLSearchParams(location.search).has('high_bands')){
  const start=PROBABILIZER_COST_BALANCE.kpBandStartExponent;
  for(const {id,priceExponent:p}of PROBABILIZER_UPGRADES){
    probabilizerUpgradeLevels[id]=200/p+Math.ceil((start-500)/(2*p));
  }
  probabilizerPowerUpgradeLevels.interval_floor=80;knuthPoints=NumberMath.fromString('1e100000000');render();
}
if(new URLSearchParams(location.search).has('price_bands')){
  completedKnuthChallengeIds.add('kc5');
  loadKnuthBaseUpgradeLevels(Object.fromEntries(KNUTH_BASE_UPGRADES.map(upgrade=>[upgrade.id,1])));
  knuthBaseUpgradeLevels.singularity_limit=0;knuthPoints=NumberMath.fromString('1e1000');
  setKnuthView('base');render();
}
const qaResearchId=new URLSearchParams(location.search).get('research');
if(['25-1','25-2'].includes(qaResearchId)){
  for(const id of ['21-1','22-1','22-2','22-3','23-1','23-2','23-3','24-1'])abstractionResearchState[id]=true;
  for(const tier of [25,26,27])for(const lane of [1,2])abstractionResearchState[tier+'-'+lane]=false;
  greatTheory=4100;randomPower=NumberMath.fromString('1e50');
  abstractionPermanentSingularities=0;singularityPoints=4;singularityUpgradeLevels.black_hole=0;singularityUpgradeLevels.kp_gain=0;
}
if(qaResearchId==='24-1'){
  for(const id of ['21-1','22-1','22-2','22-3','23-1','23-2','23-3'])abstractionResearchState[id]=true;
  abstractionResearchState['24-1']=false;greatTheory=2500;randomPower=NumberMath.fromString('1e50');
}
if(qaResearchId==='22-1'){
  abstractionResearchState['21-1']=true;greatTheory=7200;
  randomPower=NumberMath.fromString('1e50');abstractionPermanentSp=NumberMath.fromString('1e100');
}
if(qaResearchId==='21-1'){
  abstractionResearchState['20-1']=true;greatTheory=2400;
  knuthPoints=NumberMath.fromString('1e1000');
  probabilizerUpgradeLevels.a=100;probabilizerUpgradeLevels.b=100;
}
if(new URLSearchParams(location.search).has('range_large')){
  abstractionResearchState['20-1']=true;greatTheory=2400;researchAbstraction('21-1');
  probabilizerRangeProgress={a:1,b:1e308,aLevel:0,bLevel:0};
  probabilizerUpgradeLevels.a=0;probabilizerUpgradeLevels.b=0;probabilizerUpgradeLevels.speed=31;
  knuthPoints=NumberMath.fromString('1e1000');render();
}
if(['18-4','20-1','21-1','22-1','24-1','25-1','25-2'].includes(qaResearchId)){
  if(qaResearchId==='20-1'){
    randomPower=ABSTRACTION_TIER20_BALANCE.requiredRandomPower;
    divergerPower=divergerProductionValue();
  }
  setKnuthView('abstraction');render();
  const position=abstractionResearchNodePosition(ABSTRACTION_RESEARCHES.find(item=>item.id===qaResearchId));
  abstractionTreeZoom=1;abstractionTreePanX=24-position.left;abstractionTreePanY=24-position.top;
  applyAbstractionTreeTransform();
}
if(new URLSearchParams(location.search).has('fast')){
  knuthPoints=NumberMath.fromString('1e10000');
  for(let i=0;i<31;i++)buyProbabilizerUpgrade('speed');
  render();
}
const probabilizerTimer=qaGameTimers.find(timer=>timer.fn.toString().includes('tickProbabilizer()'));
if(probabilizerTimer)qaNativeInterval(probabilizerTimer.fn,100);
</script>`;
const types = { '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2' };
module.exports = { fixture };
if (require.main === module) http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  res.setHeader('Cache-Control','no-store');
  if(name==='/mobile'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    const id=new URL(req.url,'http://localhost').searchParams.get('research');
    const research=['18-4','20-1','21-1','22-1','24-1','25-1','25-2'].includes(id)?'&amp;research='+id:'';
    const power=new URL(req.url,'http://localhost').searchParams.has('power_upgrades')?'&amp;power_upgrades=1':'';
    const range=new URL(req.url,'http://localhost').searchParams.has('range_large')?'&amp;range_large=1':'';
    const costs=new URL(req.url,'http://localhost').searchParams.has('cost_tiers')?'&amp;cost_tiers=1':'';
    const advanced=new URL(req.url,'http://localhost').searchParams.has('advanced')?'&amp;advanced=1':'';
    return res.end('<!doctype html><meta charset="utf-8"><title>확률자 모바일 검증</title><style>body{margin:0;background:#15191c}iframe{display:block;width:390px;height:844px;border:0;margin:16px auto}</style><iframe src="/?clean=1'+research+power+range+costs+advanced+'" title="390px 모바일 게임"></iframe>');
  }
  if(name==='/'){
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head>'+setup)
      .replace(/(<script[^>]*src="\.\/scripts\/core\/state\.js[^>]*><\/script>)/,
        '$1<script>const qaGameTimers=[],qaRegister=setGameInterval;setGameInterval=(fn,ms)=>{qaGameTimers.push({fn,ms});return qaRegister(fn,ms);};</script>')
      .replace(/<script[^>]*src="\.\/scripts\/(?:config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g,'')
      .replace('</body>',fixture+'</body>');
    res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);
  }
  if(!/^\/(scripts|styles|assets)\//.test(name)){res.writeHead(404);return res.end();}
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
}).listen(0,'127.0.0.1',function(){process.stdout.write('PROBABILIZER_QA_URL=http://127.0.0.1:'+this.address().port+'/\n');});
