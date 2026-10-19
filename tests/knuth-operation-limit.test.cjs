const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');
const { operationPriceLog } = require('./helpers/knuth-prices.cjs');

test('all 300 operation prices follow exact purchase-index tiers and retain one base slot per buy', () => {
  const rows=run(game(), `
    return Array.from({length:300},(_,level)=>{
      knuthOperationLevel=level;const cost=knuthOperationUpgradeCost();knuthPoints=cost;
      const bought=buyKnuthOperationUpgrade();
      return {level,log:logValue(cost),bought,slots:knuthSlotCapacity(),kp:plain(knuthPoints)};
    });
  `);
  for(const row of rows){
    assert.ok(Math.abs(row.log-operationPriceLog(row.level))<1e-9,JSON.stringify(row));
    assert.equal(row.bought,true);
    assert.equal(row.slots,row.level+1);
    assert.equal(row.kp,0);
  }
});

test('manual purchases stop at 300 without spending KP or changing equipment', () => {
  assert.deepEqual(run(game(), `
    knuthOperationLevel=300;knuthPoints=NumberMath.fromString('1e1000');knuthEquippedUpgradeIds.add('percent_cap_200');
    const before=NumberMath.serialize(knuthPoints);
    return {canBuy:canBuyKnuthOperationUpgrade(),bought:buyKnuthOperationUpgrade(),level:knuthOperationLevel,
      kpSame:before===NumberMath.serialize(knuthPoints),equipped:hasKnuthUpgrade('percent_cap_200')};
  `),{canBuy:false,bought:false,level:300,kpSame:true,equipped:true});
});

test('automatic and N bulk purchases can buy number 300 but never number 301', () => {
  for(const kind of ['automatic','N']){
    assert.deepEqual(run(game(), `
      completedKnuthChallengeIds.add('kc5');generalizationResearchState['3-4']=true;knuthOperationLevel=299;
      knuthPoints=NumberMath.fromString('1e1000');const cost=knuthOperationUpgradeCost();
      const expected=NumberMath.serialize(subtractNumberValues(knuthPoints,cost));
      knuthBaseAutoEnabled.operation=true;gameTick=()=>1e100;
      const bought=${kind==='automatic' ? 'advanceKnuthBaseAutomation(1000)' : "executeN('buy knuth operation')"};
      const paid=expected===NumberMath.serialize(knuthPoints);
      advanceKnuthBaseAutomation(1000);executeN('buy knuth operation');
      const get=key=>automatiumGameAdapter.get([{name:'knuth',index:null},{name:'operation',index:null},{name:key,index:null}],{});
      return {bought,paid,stillSame:expected===NumberMath.serialize(knuthPoints),level:knuthOperationLevel,
        max:plain(get('max')),cost:plain(get('cost')),available:get('available')};
    `),{bought:true,paid:true,stillSame:true,level:300,max:300,cost:0,available:false},kind);
  }
});

test('16-2 capacity and KC5 reduction remain separate from the purchase-count cap', () => {
  assert.deepEqual(run(game(), `
    knuthOperationLevel=300;const basic=knuthSlotCapacity();abstractionResearchState['16-2']=true;
    const boosted=knuthSlotCapacity();activeKnuthChallengeId='kc5';
    return {basic,boosted,kc5:knuthSlotCapacity(),level:knuthOperationLevel,canBuy:canBuyKnuthOperationUpgrade()};
  `),{basic:300,boosted:375,kc5:125,level:300,canBuy:false});
});

test('older over-cap saves keep their existing count, KP and equipment but cannot buy more', () => {
  assert.deepEqual(run(game(), `
    knuthOperationLevel=1000;knuthPoints=123;knuthEquippedUpgradeIds.add('second_branch_expansion');
    saveGame();const saved=localStorage.getItem(SAVE_KEY);knuthOperationLevel=0;knuthPoints=0;knuthEquippedUpgradeIds.clear();
    loadGame(saved,{countAsLoad:false});
    return {level:knuthOperationLevel,slots:knuthSlotCapacity(),kp:plain(knuthPoints),
      equipped:hasKnuthUpgrade('second_branch_expansion'),bought:buyKnuthOperationUpgrade(),errors};
  `),{level:1000,slots:1000,kp:123,equipped:true,bought:false,errors:[]});
});

test('UI shows purchase count at cap rather than a price or the boosted slot count', () => {
  const ctx=game();ctx.loadSource('document.createDocumentFragment=()=>document.createElement("div");createFormulaHelpButton=()=>null;');
  ctx.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  assert.deepEqual(run(ctx, `
    knuthOperationLevel=300;knuthPoints=NumberMath.fromString('1e1000');abstractionResearchState['16-2']=true;
    renderKnuthBoard();return {label:knuthOperationUpgradeCostText.textContent,disabled:knuthOperationUpgradeBtn.disabled,slots:knuthSlotCapacity()};
  `),{label:'최대 강화 (300/300회)',disabled:true,slots:375});
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/id="knuthOperationPriceRule">[^<]*100번째[^<]*×2[^<]*200번째[^<]*×4[^<]*300번째[^<]*×8[^<]*최대 300회/);
});
