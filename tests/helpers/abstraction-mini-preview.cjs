const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const setup = `<script>
window.setInterval=()=>0;
const qaFrame=window.requestAnimationFrame.bind(window);
window.requestAnimationFrame=fn=>{if(document.readyState==='loading'){window.addEventListener('DOMContentLoaded',()=>qaFrame(fn),{once:true});return 0;}return qaFrame(fn);};
window.addEventListener('error',e=>{const field=document.getElementById('qa-errors');if(field)field.textContent+=e.message+' | ';});
</script>`;
const fixture = `<script>
const bar=document.createElement('div');
bar.style='position:relative;z-index:99999;background:#142319;padding:8px;display:flex;gap:8px;flex-wrap:wrap;';
bar.innerHTML='<button id="qa-reset">독립 테스트 상태 복원</button><span id="qa-errors"></span>';
document.body.prepend(bar);document.body.style.paddingTop='0';
function resetMiniFixture(){
  knuthUnlocked=true;hasClaimedKnuthPoint=true;greatTheory=1600;knuthPoints=1e10;
  for(const achievement of ACHIEVEMENTS)achievementState[achievement.id]=true;
  for(const r of ABSTRACTION_RESEARCHES){abstractionResearchState[r.id]=r.column<18&&(!r.branch||['time','passive'].includes(r.branch));delete abstractionResearchPaidCosts[r.id];}
  setChapter('knuth');setKnuthView('abstraction');render();
  abstractionTreeZoom=.5;abstractionTreePanX=-14*(RESEARCH_NODE_WIDTH+RESEARCH_COLUMN_GAP)*.5+30;
  abstractionTreePanY=0;applyAbstractionTreeTransform();
}
document.getElementById('qa-reset').onclick=resetMiniFixture;
resetMiniFixture();
</script>`;
const types={'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  res.setHeader('Cache-Control','no-store');
  if(name==='/'){
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<head>','<head>'+setup)
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
server.listen(0,'127.0.0.1',()=>process.stdout.write('MINI_QA_URL=http://127.0.0.1:'+server.address().port+'/\n'));
