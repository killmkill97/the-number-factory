const assert = require('node:assert/strict');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

test('15-1 is directly right of 14-2 and all descendants move upward by the same amount', () => {
  const rows = run(game(), `
    const get=id=>ABSTRACTION_RESEARCHES.find(r=>r.id===id);
    const before={'15-1':4.5,'16-1':2.5,'16-2':6.5,'17-1':1.5,'17-2':3.5,'17-3':5.5,'17-4':7.5};
    for(let i=1;i<=8;i++)before['18-'+i]=i;
    const left=abstractionResearchNodePosition(get('14-2')),right=abstractionResearchNodePosition(get('15-1'));
    return {aligned:left.top===right.top,gap:right.left-left.left,expectedGap:RESEARCH_NODE_WIDTH+RESEARCH_COLUMN_GAP,
      moved:Object.entries(before).every(([id,row])=>get(id).row===row-2.5),
      prices:ABSTRACTION_RESEARCHES.filter(r=>r.column>=18).every(r=>r.greatTheoryCost===400)};
  `);
  assert.equal(rows.aligned,true);assert.equal(rows.gap,rows.expectedGap);
  assert.equal(rows.moved,true);assert.equal(rows.prices,true);
});

test('normalized cards and actual connection curves all stay inside the abstraction SVG', () => {
  const rows=run(game(), `
    updateAbstractionTreeViewportExtent=()=>{};
    abstractionTreeCanvas.querySelector=()=>null;
    const attrs={};abstractionConnections.setAttribute=(k,v)=>{attrs[k]=v;};
    document.createElementNS=()=>({dataset:{},classList:{add(){}},setAttribute(k,v){this[k]=v;}});
    renderAbstractionTreeLayout();renderAbstractionTreeLayout();
    const width=Number(attrs.width),height=Number(attrs.height);
    const nodes=Object.values(abstractionResearchUi).map(ui=>({left:parseFloat(ui.node.style.left),top:parseFloat(ui.node.style.top)}));
    const paths=abstractionConnections.children.map(p=>(p.d.match(/-?\\d+(?:\\.\\d+)?/g)||[]).map(Number));
    return {nodes:nodes.length,edges:paths.length,
      expectedEdges:ABSTRACTION_RESEARCHES.reduce((n,r)=>n+r.parents.length,0),
      nodeBounds:nodes.every(p=>p.left>=RESEARCH_TREE_PADDING&&p.top>=RESEARCH_TREE_PADDING
        &&p.left+RESEARCH_NODE_WIDTH<=width&&p.top+RESEARCH_NODE_HEIGHT<=height),
      pathBounds:paths.every(values=>values.every((n,i)=>n>=0&&n<=(i%2?height:width)))};
  `);
  assert.equal(rows.nodes,44);assert.equal(rows.edges,rows.expectedEdges);
  assert.equal(rows.nodeBounds,true);assert.equal(rows.pathBounds,true);
});

test('initial early-tree screen position and the generalization tree coordinates stay unchanged', () => {
  assert.deepEqual(run(game(), `
    const root=ABSTRACTION_RESEARCHES.find(r=>r.id==='1-1');
    const top=abstractionResearchNodePosition(root).top+abstractionTreePanY;
    const general=GENERALIZATION_RESEARCHES.map(r=>researchNodePosition(r).top
      ===RESEARCH_TREE_PADDING+((r.row??1)-1)*(RESEARCH_NODE_HEIGHT+RESEARCH_ROW_GAP));
    return {top,padding:RESEARCH_TREE_PADDING,general:general.every(Boolean),offset:ABSTRACTION_TREE_ROW_OFFSET};
  `),{top:24,padding:24,general:true,offset:2.5});
});
