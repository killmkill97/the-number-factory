const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const setup = `<script>
window.setInterval=()=>0;
const qaNativeFrame=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=fn=>{if(document.readyState==='loading'){window.addEventListener('DOMContentLoaded',()=>qaNativeFrame(fn),{once:true});return 0;}return qaNativeFrame(fn);};
window.__qaErrors=[];
window.addEventListener('error',e=>{window.__qaErrors.push(e.message);const field=document.getElementById('qa-errors');if(field)field.textContent=window.__qaErrors.join(' | ');});
</script>`;
const fixture = `<script>
const qaBar=document.createElement('div');
qaBar.style='position:fixed;z-index:99999;top:0;left:0;right:0;background:#142319;padding:8px;display:flex;gap:8px;flex-wrap:wrap;';
qaBar.innerHTML='<button id="qa-reward">KC5 보상 시험</button><button id="qa-challenge">KC5 진입 시험</button><button id="qa-tick">자동구매 1초 진행</button><span id="qa-state"></span><span id="qa-errors"></span>';
document.body.append(qaBar);document.body.style.paddingTop='70px';
function qaReward(){activeKnuthChallengeId=null;completedKnuthChallengeIds.add('kc5');knuthUnlocked=true;hasClaimedKnuthPoint=true;knuthOperationLevel=9;knuthPoints=1e12;setChapter('knuth');setKnuthView('base');render();}
document.getElementById('qa-reward').onclick=qaReward;
document.getElementById('qa-challenge').onclick=()=>{completedKnuthChallengeIds.delete('kc5');startKnuthChallenge('kc5');setChapter('knuth');setKnuthView('challenges');render();};
document.getElementById('qa-tick').onclick=()=>{const bought=advanceKnuthBaseAutomation(1000);render();document.getElementById('qa-state').textContent=JSON.stringify({bought,enabled:knuthBaseAutoEnabled.cp_gain,available:knuthBaseAutomationAvailable(),overflowed,squareMode,timer:knuthBaseAutoTimerMs,tick:gameTick(1000),speed:autoUpgradeSpeedMultiplier(),count:knuthBaseUpgradeLevel('cp_gain')});};
qaReward();
</script>`;
const types = {'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server = http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  res.setHeader('Cache-Control','no-store');
  if(name==='/'){
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
      .replace('<head>','<head>'+setup)
      .replace(/<script[^>]*src="\.\/scripts\/(?:config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g,'')
      .replace('</body>',fixture+'</body>');
    res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);
  }
  if(!/^\/(scripts|styles|assets)\//.test(name)){res.writeHead(404);return res.end();}
  const file=path.resolve(root,'.'+name);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>process.stdout.write('KC5_QA_URL=http://127.0.0.1:'+server.address().port+'/\n'));
