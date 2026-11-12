const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const {game,run}=require('./helpers/kc4-game.cjs');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-11*Math.max(1,Math.abs(b)),`${a} != ${b}`);
function ready(){const c=game(true);c.loadSource('knuthBaseUpgradeLevels.advanced_equipment=1;knuthOperationLevel=1000;');return c;}
function expected(base,count){let result=base**Math.min(30,count),bonus=base-1;for(let i=30;i<count&&i<94;i++){bonus=bonus**1.2;result*=1+bonus;}return result;}

test('first thirty retain their effect; subsequent CP/KP copies compound decaying excess, not a weaker total',()=>{
  const rows=run(ready(),`return ['cp_power','kp_power'].flatMap(id=>{
    const u=KNUTH_ADVANCED_UPGRADES.find(u=>u.id===id);
    return [0,1,29,30,31,32,33,60].map(n=>{knuthAdvancedEquipped[id]=n;
      return {id,n,base:u.effect,effect:plain(knuthAdvancedEffect(id)),next:knuthAdvancedEffectPerCopy(u,n+1)};});});`);
  for(const r of rows){close(r.effect,expected(r.base,r.n));close(r.next,r.n<30?r.base:1+(r.base-1)**(1.2**(r.n+1-30)));}
  const cp=rows.filter(r=>r.id==='cp_power');
  close(cp.find(r=>r.n===30).next,1.0148780325892386);
  close(cp.find(r=>r.n===31).next,1.0064129020529125);
  for(let i=1;i<cp.length;i++)assert.ok(cp[i].effect>=cp[i-1].effect);
});

test('enormous equipped counts remain bounded; three other equipment types are unchanged',()=>{
  const rows=run(ready(),`return KNUTH_ADVANCED_UPGRADES.map(u=>{
    knuthAdvancedEquipped[u.id]=60;const at60=knuthAdvancedEffect(u.id);
    knuthAdvancedEquipped[u.id]=Number.MAX_SAFE_INTEGER;const huge=knuthAdvancedEffect(u.id);
    return {id:u.id,base:u.effect,at60:plain(at60),huge:NumberMath.serialize(huge),
      same:compareNumberValues(huge,at60)===0,ordinary:compareNumberValues(huge,NumberMath.power(u.effect,Number.MAX_SAFE_INTEGER))===0};});`);
  for(const r of rows){assert.doesNotMatch(r.huge,/NaN|Infinity/);if(['cp_power','kp_power'].includes(r.id)){assert.ok(r.same);close(r.at60,expected(r.base,60));}else assert.ok(r.ordinary);}
});

test('real CP and KP quotes use the diminishing product and KP retains its final floor',()=>{
  const rows=run(ready(),`squarePoints=NumberMath.fromString('1e1000');squareConvergencePoints=NumberMath.fromString('1e6000');
    abstractionResearchState['8-1']=true;
    return ['cp_power','kp_power'].map(id=>{
      const quote=()=>id==='cp_power'?squareConvergencePointGain():knuthPointGain();
      const before=quote();knuthAdvancedEquipped[id]=32;const effect=knuthAdvancedEffect(id);
      const actual=quote(),power=NumberMath.power(before,effect),expect=id==='kp_power'?NumberMath.floor(power):power;
      knuthAdvancedEquipped[id]=0;
      return {id,effect:plain(effect),ratio:plain(NumberMath.divideApproximate(actual,expect))};});`);
  for(const r of rows){close(r.effect,expected(r.id==='cp_power'?1.03:1.05,32));close(r.ratio,1);}
});

test('old saves retain paid counts, slots and prices while recalculating only the derived effect',()=>{
  const r=run(ready(),`knuthAdvancedOwned.cp_power=50;knuthAdvancedEquipped.cp_power=40;
    const price=NumberMath.serialize(knuthAdvancedUpgradeCost('cp_power')),slots=knuthSlotsUsed(),saved=captureGameSaveData();
    const loaded=loadGame(JSON.stringify(saved),{persistOverride:false,countAsLoad:false});
    return {loaded,owned:knuthAdvancedOwned.cp_power,equipped:knuthAdvancedEquipped.cp_power,effect:plain(knuthAdvancedEffect('cp_power')),
      priceSame:price===NumberMath.serialize(knuthAdvancedUpgradeCost('cp_power')),slotsSame:slots===knuthSlotsUsed()};`);
  assert.deepEqual({...r,effect:undefined},{loaded:true,owned:50,equipped:40,effect:undefined,priceSame:true,slotsSame:true});close(r.effect,expected(1.03,40));
});

test('both cards state the threshold and show the next marginal exponent',()=>{
  const c=ready();c.loadSource(fs.readFileSync(path.join(__dirname,'../scripts/chapters/knuth.js'),'utf8'));
  const rows=run(c,`knuthAdvancedEquipped.cp_power=30;knuthAdvancedEquipped.kp_power=31;renderKnuthAdvancedEquipment();
    return ['cp_power','kp_power'].map(id=>{const ui=knuthAdvancedUpgradeUi.get(id);return {id,text:ui.inventory.description.textContent,purchase:ui.purchase.description.textContent};});`);
  for(const r of rows){assert.match(r.text,/30개.*31개째.*1.2제곱/);assert.match(r.text,/다음 장착 효과/);assert.equal(r.text,r.purchase);}
  assert.match(rows[0].text,/1.014878/);assert.match(rows[1].text,/1.013382/);
});
