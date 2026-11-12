const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function buildPreview() {
  const setup = `<script>
const qaMemory=new Map();
Object.defineProperty(window,'localStorage',{value:{getItem:k=>qaMemory.get(k)??null,setItem:(k,v)=>qaMemory.set(k,String(v)),removeItem:k=>qaMemory.delete(k)}});
window.setInterval=()=>0;
window.fetch=()=>Promise.resolve({ok:false,json:async()=>({})});
const qaErrors=[];window.addEventListener('error',e=>qaErrors.push(e.message));
window.requestAnimationFrame=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):setTimeout(fn,0);
</script>`;
  const fixture = `<script>
knuthUnlocked=true;hasClaimedKnuthPoint=true;knuthPoints=1e100;
knuthBaseUpgradeLevels.space_expansion=1;abstractionResearchState['30-1']=true;
squareConvergenceUpgradeState.automatium=true;squareConvergenceUpgradeLevels.automatium=1;
stagnantMassMg=1e32;setChapter('knuth');setKnuthView('production');setKnuthProductionView('space_expansion');
buySpaceExpansionOneTimeUpgrade('definition_space');render();
</script>`;
  return fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head>'+setup)
    .replace(/<script[^>]*src="\.\/scripts\/(?:main|core\/session|config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g,'')
    .replace(/(["'])\.\/(scripts|styles|assets)\//g,'$1/$2/')
    .replace('</body>',fixture+'</body>');
}
module.exports={buildPreview};
if(require.main===module){
  fs.writeFileSync(path.join(root,'tests/definition-story-preview.html'),buildPreview());
  console.log('http://localhost:8765/tests/definition-story-preview.html');
}
