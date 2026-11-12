const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function buildPreview(){
  const setup=`<script>
const memory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
window.setInterval=()=>0;window.fetch=()=>Promise.resolve({ok:false,json:async()=>({})});
window.requestAnimationFrame=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):setTimeout(fn,0);
</script>`;
  const fixture=`<script>
knuthUnlocked=true;hasClaimedKnuthPoint=true;knuthBaseUpgradeLevels.space_expansion=1;
stagnantMassMg=64000;recordStagnantSingularities();
setChapter('knuth');setKnuthView('production');setKnuthProductionView('space_expansion');render();
const advance=document.createElement('button');advance.id='qaAdvanceMass';advance.textContent='테스트: 질량 1e12mg 생산';
advance.onclick=()=>{higgsParticles=1e12;advanceSpaceExpansion(1000);renderSpaceExpansionBoard();};
document.getElementById('knuthSpaceExpansionPanel').prepend(advance);
</script>`;
  return fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head>'+setup)
    .replace(/<script[^>]*src="\.\/scripts\/(?:main|core\/session|config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g,'')
    .replace(/(["'])\.\/(scripts|styles|assets)\//g,'$1/$2/').replace('</body>',fixture+'</body>');
}
module.exports={buildPreview};
if(require.main===module){fs.writeFileSync(path.join(root,'tests/stagnant-singularities-preview.html'),buildPreview());console.log('http://localhost:8765/tests/stagnant-singularities-preview.html');}
