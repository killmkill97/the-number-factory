const fs=require('node:fs');
const path=require('node:path');
const {buildPreview:isolated}=require('./preview-stagnant-singularities.cjs');
function buildPreview(){
  const html=isolated();
  const start=html.lastIndexOf('<script>');
  return html.slice(0,start).replace('<head>', '<head><base href="/">')+`<script>
knuthUnlocked=true;hasClaimedKnuthPoint=true;squareUnlocked=true;squareConvergenceUnlocked=true;
hasEverEarnedSquareConvergencePoint=true;theory=30;greatTheory=10000;
knuthPoints=NumberMath.fromString('1e1400');squareConvergencePoints=NumberMath.fromString('1e100');
squarePoints=NumberMath.fromString('1e10000');setBaseNumber('1e1500');percentUnlocked=true;
knuthOperationLevel=80;knuthBaseUpgradeLevels.number_black_hole=1;knuthBaseUpgradeLevels.probabilizer=1;
knuthBaseUpgradeLevels.space_expansion=1;numberBlackHoleSystemEnabled=true;
for(const r of GENERALIZATION_RESEARCHES)generalizationResearchState[r.id]=true;
for(const u of SQUARE_UPGRADES)squareUpgradeState[u.id]=true;
squareConvergenceUpgradeState.automatium=true;squareConvergenceUpgradeLevels.automatium=1;
setChapter('multiplication');render();
const qa=document.createElement('button');qa.id='qaClickableNews';qa.textContent='QA: clickable news';
qa.onclick=()=>startNewsTickerMessage(HUMAN_NEWS_TICKER_MESSAGES[0]);document.querySelector('.save-toolbar').append(qa);
const late=document.createElement('button');late.id='qaLateGame';late.textContent='QA: late game';
late.onclick=()=>{
  for(const u of KNUTH_BASE_UPGRADES)knuthBaseUpgradeLevels[u.id]=1;
  for(const r of ABSTRACTION_RESEARCHES)abstractionResearchState[r.id]=true;
  for(const c of KNUTH_CHALLENGES)completedKnuthChallengeIds.add(c.id);
  render();setChapter('knuth');setKnuthView('abstraction');
};document.querySelector('.save-toolbar').append(late);
</script></body></html>`;
}
module.exports={buildPreview};
if(require.main===module){fs.writeFileSync(path.join(__dirname,'../tests/localization-preview.html'),buildPreview());console.log('http://localhost:8765/tests/localization-preview.html');}
