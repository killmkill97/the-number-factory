const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const setup=`<script>
window.setInterval=()=>0;
const qaFrame=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=fn=>{if(document.readyState==='loading'){window.addEventListener('DOMContentLoaded',()=>qaFrame(fn),{once:true});return 0;}return qaFrame(fn);};
</script>`;
const fixture=`<script>
knuthUnlocked=true;hasClaimedKnuthPoint=true;squareUnlocked=true;squareConvergenceUnlocked=true;hasEverEarnedSquareConvergencePoint=true;
for(const a of ACHIEVEMENTS)achievementState[a.id]=true;
const bar=document.createElement('div');
bar.style='position:fixed;z-index:99999;top:0;left:0;right:0;padding:8px;background:#142319;display:flex;gap:8px;';
bar.innerHTML='<button id="qa-abstraction">추상화 검사</button><button id="qa-generalization">일반화 검사</button><button id="qa-down">아래로 5000px</button>';
document.body.append(bar);
document.getElementById('qa-abstraction').onclick=()=>{setChapter('knuth');setKnuthView('abstraction');render();};
document.getElementById('qa-generalization').onclick=()=>{setChapter('square');setSquareView('convergence');setConvergenceView('generalization');render();};
document.getElementById('qa-down').onclick=()=>window.scrollBy(0,5000);
document.getElementById('qa-abstraction').click();
</script>`;
const types={'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);res.setHeader('Cache-Control','no-store');
  if(name==='/'){
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head>'+setup)
      .replace(/<script[^>]*src="\.\/scripts\/(?:config\/firebase-config|systems\/firebase-auth)\.js[^>]*><\/script>/g,'')
      .replace('</body>',fixture+'</body>');
    res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html);
  }
  if(!/^\/(scripts|styles|assets)\//.test(name)){res.writeHead(404);return res.end();}
  const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
server.listen(0,'127.0.0.1',()=>process.stdout.write('PAN_QA_URL=http://127.0.0.1:'+server.address().port+'/\n'));
