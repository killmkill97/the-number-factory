const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const {buildPreview:buildIsolatedPreview}=require('./preview-stagnant-singularities.cjs');
function buildPreview(){
  const html=buildIsolatedPreview();
  const start=html.lastIndexOf('<script>');
  return html.slice(0,start)+`<script>
definitionFragments=1;setChapter('definition');render();
const holdLabel=document.createElement('label');holdLabel.textContent='검사용: 사진 잠시 유지 ';
const hold=document.createElement('input');hold.type='checkbox';hold.id='qaHoldPicture';
holdLabel.append(hold);document.getElementById('definitionPanel').append(holdLabel);
const originalTimeout=window.setTimeout.bind(window);let held=null;
window.setTimeout=(fn,delay,...args)=>originalTimeout(()=>{
  if(delay===2300&&hold.checked)held=()=>fn(...args);else fn(...args);
},delay);
hold.onchange=()=>{if(!hold.checked&&held){const finish=held;held=null;finish();}};
const freezeStyle=document.createElement('style');
freezeStyle.textContent='body.qa-freeze-egg #definitionEasterEggOverlay {opacity:0.8!important;transition:none!important}';
document.head.append(freezeStyle);
hold.addEventListener('change',()=>document.body.classList.toggle('qa-freeze-egg',hold.checked));
const motionStats=document.createElement('output');motionStats.id='qaEggMotionStats';
document.getElementById('definitionPanel').append(motionStats);
let burstStarted=null,frameCount=0,hashes=[];
document.getElementById('definitionContentCard').addEventListener('click',()=>{
  burstStarted=performance.now();frameCount=0;hashes=[];
});
window.requestAnimationFrame=fn=>window.setTimeout(()=>{
  const now=performance.now();fn(hold.checked&&burstStarted!==null?Math.min(now,burstStarted+450):now);
  if(document.getElementById('definitionContentCard').dataset.easterEggState==='visual'){
    frameCount++;
    if(hashes.length<2&&now-burstStarted>[200,800][hashes.length]){
      const canvas=document.getElementById('definitionEasterEggFlames');
      const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
      let hash=2166136261;for(let i=0;i<pixels.length;i+=101)hash=Math.imul(hash^pixels[i],16777619);
      hashes.push(hash>>>0);
    }
    motionStats.textContent=JSON.stringify({frames:frameCount,pixelHashes:hashes});
  }
},16);
window.cancelAnimationFrame=window.clearTimeout.bind(window);
</script></body></html>`;
}
module.exports={buildPreview};
if(require.main===module){
  fs.writeFileSync(path.join(root,'tests/definition-easter-egg-preview.html'),buildPreview());
  console.log('http://localhost:8765/tests/definition-easter-egg-preview.html');
}
