const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function buildPreview(){
  const setup=`<script>
const qaMemory=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>qaMemory.get(k)??null,setItem:(k,v)=>qaMemory.set(k,String(v)),removeItem:k=>qaMemory.delete(k)}});
window.setInterval=()=>0;window.fetch=()=>Promise.resolve({ok:false,json:async()=>({})});
window.requestAnimationFrame=fn=>document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn,{once:true}):setTimeout(fn,0);
window.NUMBER_TYCOON_FIREBASE_CONFIG={apiKey:''};
</script>`;
  const auth=fs.readFileSync(path.join(root,'scripts/systems/firebase-auth.js'),'utf8');
  const fixture=`<script>
knuthUnlocked=true;hasClaimedKnuthPoint=true;higgsParticles=42;saveGame();
let qaServer={...captureGameSaveData(),cloudUpdatedAt:100};let qaFail=false;
higgsParticles=526000;saveGame();higgsParticles=777777;render();
const qaInfo=document.createElement('p');qaInfo.textContent='독립 모의 클라우드 · 실제 저장/계정/서버와 연결 없음';qaInfo.style='color:#7ee787';document.querySelector('.save-toolbar').after(qaInfo);
const qaToggle=document.createElement('button');qaToggle.id='qaCloudFailure';qaToggle.textContent='서버 저장 실패 모의';qaToggle.onclick=()=>{qaFail=true;higgsParticles=999999;render();};qaInfo.after(qaToggle);
{const doc=()=>({});const getDocFromServer=async()=>({exists:()=>true,data:()=>qaServer});
const setDoc=async(ref,data)=>{if(qaFail)throw Object.assign(Error('test rules'),{code:'permission-denied'});qaServer=structuredClone(data);};
${auth.slice(auth.indexOf('const AUTHORIZED_DEBUG_EMAIL'))}
authState.user={uid:'test-only',email:'test@example.invalid'};firestore={};renderAuthUi();}
</script>`;
  return fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head>'+setup)
    .replace(/<script[^>]*src="\.\/scripts\/(?:main|core\/session|config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g,'')
    .replace(/(["'])\.\/(scripts|styles|assets)\//g,'$1/$2/').replace('</body>',fixture+'</body>');
}
module.exports={buildPreview};
if(require.main===module){fs.writeFileSync(path.join(root,'tests/cloud-save-preview.html'),buildPreview());console.log('http://localhost:8765/tests/cloud-save-preview.html');}
