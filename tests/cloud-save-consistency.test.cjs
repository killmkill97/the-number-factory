const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const { game, run } = require('./helpers/kc4-game.cjs');

const SAVE = 'numberTycoonSave_v1';
const META = 'numberTycoonCloudSync_v1';
const BACKUP = 'numberTycoonSaveBeforeCloudLoad_v1';
const source = fs.readFileSync(path.join(__dirname, '../scripts/systems/firebase-auth.js'), 'utf8');
const evaluate = (ctx, code) => vm.runInContext(code, ctx);
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function setup({ remote = null, meta = null } = {}) {
  const ctx = game(true);
  // Keep the reported 579/393 regression independent of later slot balance patches.
  ctx.loadSource('SPACE_EXPANSION_EXTRA_BALANCE.slotStrength=64;');
  ctx.remote = remote;
  ctx.readCount = 0;
  ctx.writes = [];
  ctx.confirms = [];
  ctx.accept = false;
  ctx.getDoc = async () => {
    ctx.readCount++;
    if (ctx.readHook) return ctx.readHook();
    const data = ctx.remote;
    return { exists: () => data !== null, data: () => data };
  };
  ctx.getDocFromServer = ctx.getDoc;
  ctx.setDoc = async (ref, data) => {
    const copy = JSON.parse(JSON.stringify(data));
    ctx.writes.push({ ref, data: copy });
    if (ctx.writeHook) await ctx.writeHook(copy);
    ctx.remote = copy;
  };
  ctx.doc = (_db, ...parts) => parts.join('/');
  ctx.loadSource(`window.confirm=message=>{confirms.push(message);return accept;};
    window.NUMBER_TYCOON_FIREBASE_CONFIG={apiKey:''};`);
  // Run the actual module body; replace only the imported SDK/network boundary.
  ctx.loadSource(`{${source.slice(source.indexOf('const AUTHORIZED_DEBUG_EMAIL'))}
    authState.user={uid:'owner',email:'owner@example.com'};firestore={};
    globalThis.authState=authState;globalThis.synchronizeSignedInUser=synchronizeSignedInUser;
  }`);
  if (meta) ctx.storage.set(META, JSON.stringify(meta));
  return ctx;
}
function seed(ctx, modern = true) {
  run(ctx, `knuthOperationLevel=${modern ? 414 : 314};abstractionResearchState['16-2']=true;
    spaceExpansionOneTimeUpgradeState.higgs_slots=${modern};higgsParticles=${modern ? 526000 : 42};
    saveGame();`);
  return JSON.parse(ctx.storage.get(SAVE));
}
function snapshot(ctx) {
  return run(ctx, 'return {slots:knuthSlotCapacity(),higgs:NumberMath.serialize(higgsParticles)};');
}

test('failed cloud upload followed by the actual load button preserves 579 slots and 526k Higgs, not old 393/42', async () => {
  const ctx = setup();
  const old = seed(ctx, false);
  ctx.remote = { ...old, cloudUpdatedAt: 100 };
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: old.saveRevision }));
  ctx.advance(1000);
  const latest = seed(ctx);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  ctx.writeHook = async () => { throw Error('permission denied'); };
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()'), false);
  ctx.accept = true; // Only the ordinary load confirmation should be needed.
  assert.equal(await evaluate(ctx, 'requestLoadGame()'), true);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
  assert.equal(ctx.remote.higgsParticles, '42');
  assert.equal(ctx.confirms.length, 1);
});

test('legacy saves without revision metadata retain locally saved progress against the same old cloud timestamp', async () => {
  const ctx = setup({ meta: { uid: 'owner', updatedAt: 100 } });
  const old = seed(ctx, false);
  delete old.saveRevision; delete old.savedAtUtcMs;
  ctx.remote = { ...old, cloudUpdatedAt: 100 };
  const latest = seed(ctx); delete latest.saveRevision; delete latest.savedAtUtcMs;
  const raw = JSON.stringify(latest); ctx.storage.set(SAVE, raw);
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(ctx.storage.get(SAVE), raw);
  assert.equal(ctx.confirms.length, 0);
});

test('login no longer skips a dirty local save merely because cloudUpdatedAt matches old sync metadata', async () => {
  const ctx = setup();
  const old = seed(ctx, false);
  ctx.remote = { ...old, cloudUpdatedAt: 100 };
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: old.saveRevision }));
  const latest = seed(ctx);
  await evaluate(ctx, 'synchronizeSignedInUser(authState.user)');
  assert.equal(ctx.writes.length, 1);
  assert.equal(ctx.remote.higgsParticles, '526000');
  assert.equal(JSON.parse(ctx.storage.get(META)).localRevision, latest.saveRevision);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
});

test('a save made while signed out is uploaded on login instead of overwritten by the old remote snapshot', async () => {
  const ctx = setup();
  const old = seed(ctx, false); ctx.remote = { ...old, cloudUpdatedAt: 100 };
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: old.saveRevision }));
  ctx.loadSource('authState.user=null;'); seed(ctx);
  ctx.loadSource("authState.user={uid:'owner'};");
  await evaluate(ctx, 'window.numberTycoonCloud.onUserChanged(authState.user)');
  assert.equal(ctx.remote.higgsParticles, '526000');
  assert.equal(ctx.confirms.length, 0);
});

test('saving metadata is unique and monotonic even in one millisecond or after the wall clock moves backwards', () => {
  const ctx = setup(); const first = seed(ctx); const second = seed(ctx);
  assert.ok(second.savedAtUtcMs > first.savedAtUtcMs);
  assert.notEqual(second.saveRevision, first.saveRevision);
  ctx.advance(-100000); const third = seed(ctx);
  assert.ok(third.savedAtUtcMs > second.savedAtUtcMs);
  assert.notEqual(third.saveRevision, second.saveRevision);
});

test('a pending upload cannot cause Load to use the old cloud snapshot or wait indefinitely', async () => {
  const ctx = setup(); const old = seed(ctx, false); ctx.remote = { ...old, cloudUpdatedAt: 100 };
  const latest = seed(ctx); const gate = deferred(); ctx.writeHook = () => gate.promise;
  const saving = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()');
  await Promise.resolve();
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.equal(ctx.readCount, 0);
  assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  gate.resolve(); assert.equal(await saving, true);
});

test('cloud uploads are serialized immutable snapshots and the final remote revision is the newest one', async () => {
  const ctx = setup(); const first = seed(ctx, false); const gate = deferred();
  ctx.writeHook = async data => { if (data.saveRevision === first.saveRevision) await gate.promise; };
  const a = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()'); await Promise.resolve();
  const latest = seed(ctx); const b = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()');
  await Promise.resolve(); assert.equal(ctx.writes.length, 1);
  assert.equal(ctx.writes[0].data.higgsParticles, '42');
  gate.resolve(); await a; assert.equal(await b, true);
  assert.equal(ctx.remote.saveRevision, latest.saveRevision);
  assert.equal(ctx.remote.higgsParticles, '526000');
  assert.equal(JSON.parse(ctx.storage.get(META)).localRevision, latest.saveRevision);
});

test('a superseded upload not started yet is skipped instead of writing an old snapshot', async () => {
  const ctx = setup(); seed(ctx, false);
  const a = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()');
  const latest = seed(ctx); const b = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()');
  assert.equal(await a, false); assert.equal(await b, true);
  assert.equal(ctx.writes.length, 1);
  assert.equal(ctx.remote.saveRevision, latest.saveRevision);
});

test('a rejected upload does not poison the write queue and a retry syncs the latest local data', async () => {
  const ctx = setup(); seed(ctx); ctx.writeHook = async () => { throw Error('offline'); };
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()'), false);
  ctx.writeHook = null;
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()'), true);
  assert.equal(ctx.remote.higgsParticles, '526000');
});

test('an old cloud read returning after a new save cannot overwrite either runtime or local storage', async () => {
  for (const automatic of [false, true]) {
    const ctx = setup(); const old = seed(ctx, false); const gate = deferred();
    ctx.readHook = () => gate.promise;
    const loading = evaluate(ctx, automatic ? 'synchronizeSignedInUser(authState.user)' : 'window.numberTycoonCloud.loadCurrent()');
    const latest = seed(ctx);
    gate.resolve({ exists: () => true, data: () => ({ ...old, cloudUpdatedAt: 100 }) });
    await loading;
    assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
    assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
    assert.equal(ctx.writes.length, 0);
  }
});

test('a new manual save invalidates an already pending login read even when local contents match that read', async () => {
  const ctx = setup(); const latest = seed(ctx); const gate = deferred(); ctx.readHook = () => gate.promise;
  const login = evaluate(ctx, 'synchronizeSignedInUser(authState.user)');
  await evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()');
  gate.resolve({ exists: () => true, data: () => ({ ...latest, higgsParticles: '42', cloudUpdatedAt: 100 }) });
  await login;
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(ctx.confirms.length, 0);
});

test('a cloud read for a signed-out or different account never applies to the current game', async () => {
  for (const user of [null, { uid: 'other' }]) {
    const ctx = setup(); const latest = seed(ctx); const gate = deferred(); ctx.readHook = () => gate.promise;
    const loading = evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()');
    ctx.nextUser = user; ctx.loadSource('authState.user=nextUser;');
    gate.resolve({ exists: () => true, data: () => ({ ...latest, higgsParticles: '42', cloudUpdatedAt: 100 }) });
    assert.equal(await loading, false);
    assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  }
});

test('same saves compare independently of Firestore object key order and do not cause unnecessary conflicts', async () => {
  const ctx = setup(); const latest = seed(ctx);
  const reverse = value => Array.isArray(value) ? value.map(reverse) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).reverse().map(([key, child]) => [key, reverse(child)])) : value;
  ctx.remote = { ...reverse(latest), cloudUpdatedAt: 100 };
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.equal(ctx.confirms.length, 0);
  assert.equal(ctx.writes.length, 0);
});

test('a genuinely newer cloud snapshot restores all Higgs/slot progression and backs up the previous local save', async () => {
  const ctx = setup(); const old = seed(ctx, false);
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: old.saveRevision }));
  const latest = seed(ctx); ctx.remote = { ...latest, cloudUpdatedAt: 200 };
  ctx.storage.set(SAVE, JSON.stringify(old)); run(ctx, 'loadGame();');
  assert.deepEqual(snapshot(ctx), { slots: 393, higgs: '42' });
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(JSON.parse(ctx.storage.get(BACKUP)).raw, JSON.stringify(old));
  assert.equal(ctx.confirms.length, 0);
});

test('unknown legacy or cross-account conflicts require consent and cancel keeps the local game', async () => {
  for (const meta of [null, { uid: 'another-account', updatedAt: 100 }]) {
    const ctx = setup({ meta }); const old = seed(ctx, false); const latest = seed(ctx);
    ctx.remote = { ...old, cloudUpdatedAt: 100 }; ctx.accept = false;
    assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
    assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
    assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
    assert.equal(ctx.confirms.length, 1); assert.equal(ctx.writes.length, 0);
  }
});

test('an explicitly chosen conflicting cloud save still preserves a recoverable previous local snapshot', async () => {
  const ctx = setup(); const old = seed(ctx, false); const latest = seed(ctx);
  ctx.remote = { ...old, cloudUpdatedAt: 100 }; ctx.accept = true;
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.deepEqual(snapshot(ctx), { slots: 393, higgs: '42' });
  assert.equal(JSON.parse(ctx.storage.get(BACKUP)).raw, JSON.stringify(latest));
});

test('cloud read failures or a missing remote document fall back to local without destroying it', async () => {
  for (const failure of [false, true]) {
    const ctx = setup(); const latest = seed(ctx);
    if (failure) ctx.readHook = async () => { throw Error('network down'); };
    assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
    assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
    assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
  }
});

test('failure to write a pre-cloud backup aborts replacement and keeps the original local snapshot', async () => {
  const ctx = setup(); const old = seed(ctx, false); const latest = seed(ctx);
  ctx.remote = { ...old, cloudUpdatedAt: 100 }; ctx.accept = true;
  ctx.loadSource(`const set=localStorage.setItem;localStorage.setItem=(key,value)=>{
    if(key==='${BACKUP}')throw Error('quota');return set(key,value);
  };`);
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
});

test('local storage failure prevents an upload of the previous snapshot and reports the failure', async () => {
  const ctx = setup(); const old = seed(ctx, false); ctx.accept = true;
  ctx.loadSource(`higgsParticles=526000;localStorage.setItem=()=>{throw Error('quota');};`);
  assert.equal(await evaluate(ctx, 'requestSaveGame()'), false);
  assert.equal(ctx.writes.length, 0); assert.equal(ctx.storage.get(SAVE), JSON.stringify(old));
  assert.match(evaluate(ctx, 'authState.message'), /브라우저 저장에 실패/);
});

test('a malformed imported save does not replace a valid local save before restoration succeeds', () => {
  const ctx = setup(); const latest = seed(ctx);
  assert.equal(run(ctx, `return loadGame(JSON.stringify({...captureGameSaveData(),knuthEquippedUpgradeIds:4}));`), false);
  assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
});

test('a paused session never accepts a delayed remote snapshot', async () => {
  const ctx = setup(); const latest = seed(ctx); const gate = deferred(); ctx.readHook = () => gate.promise;
  const loading = evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()');
  ctx.loadSource('window.numberTycoonSession={isPaused:()=>true};');
  gate.resolve({ exists: () => true, data: () => ({ ...latest, higgsParticles: '42', cloudUpdatedAt: 100 }) });
  assert.equal(await loading, false);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
});

test('an auth-not-ready save remains local and is synchronized once its account connects', async () => {
  const ctx = setup(); const old = seed(ctx, false); ctx.remote = { ...old, cloudUpdatedAt: 100 };
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: old.saveRevision }));
  ctx.accept = true; ctx.loadSource("authState.user=null;higgsParticles=526000;knuthOperationLevel=414;spaceExpansionOneTimeUpgradeState.higgs_slots=true;");
  assert.equal(await evaluate(ctx, 'requestSaveGame()'), true);
  assert.equal(ctx.writes.length, 0);
  ctx.loadSource("authState.user={uid:'owner'};");
  await evaluate(ctx, 'synchronizeSignedInUser(authState.user)');
  assert.equal(ctx.remote.higgsParticles, '526000');
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
});

test('manual Save reports cloud completion rather than reporting success before its upload finishes', async () => {
  const ctx = setup(); seed(ctx); ctx.accept = true;
  const gate = deferred(); ctx.writeHook = () => gate.promise;
  const saving = evaluate(ctx, 'requestSaveGame()'); await Promise.resolve();
  assert.match(evaluate(ctx, 'authState.message'), /동기화하는 중/);
  gate.resolve(); assert.equal(await saving, true);
  assert.match(evaluate(ctx, 'authState.message'), /브라우저와 클라우드에 저장/);
});

test('unmodified local save can load a newer cloud record even if currencies were legitimately spent', async () => {
  const ctx = setup(); const previous = seed(ctx);
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: previous.saveRevision }));
  const next = { ...previous, higgsParticles: '42', savedAtUtcMs: previous.savedAtUtcMs + 1, saveRevision: 'newer-on-another-device' };
  ctx.remote = { ...next, cloudUpdatedAt: 200 };
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.equal(snapshot(ctx).higgs, '42');
  assert.equal(JSON.parse(ctx.storage.get(BACKUP)).raw, JSON.stringify(previous));
});

test('automatic login keeps the conflict confirmation before replacing an existing browser game', async () => {
  const ctx = setup(); const old = seed(ctx, false);
  ctx.storage.set(META, JSON.stringify({ uid: 'owner', updatedAt: 100, localRevision: old.saveRevision }));
  const latest = seed(ctx); ctx.remote = { ...latest, cloudUpdatedAt: 200 };
  ctx.storage.set(SAVE, JSON.stringify(old)); run(ctx, 'loadGame();'); ctx.accept = true;
  await evaluate(ctx, 'synchronizeSignedInUser(authState.user)');
  assert.equal(ctx.confirms.length, 1);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(JSON.parse(ctx.storage.get(BACKUP)).raw, JSON.stringify(old));
});

test('auto-load OFF and offline mode defer login reads without loading or uploading either snapshot', async () => {
  for (const paused of [true, false]) {
    const ctx = setup(); const latest = seed(ctx); ctx.remote = { ...latest, higgsParticles: '42', cloudUpdatedAt: 100 };
    ctx.loadSource(`window.numberTycoonSession={isPaused:()=>${paused},autoLoadEnabled:${paused}};`);
    await evaluate(ctx, 'synchronizeSignedInUser(authState.user)');
    assert.equal(ctx.writes.length, 0); assert.equal(ctx.confirms.length, 0);
    assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
    assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  }
});

test('a queued write for a now signed-out account is skipped and a completed old write cannot update another account metadata', async () => {
  const ctx = setup(); seed(ctx);
  const skipped = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()'); ctx.loadSource('authState.user=null;');
  assert.equal(await skipped, false); assert.equal(ctx.writes.length, 0);
  ctx.loadSource("authState.user={uid:'owner'};"); const gate = deferred(); ctx.writeHook = () => gate.promise;
  const pending = evaluate(ctx, 'window.numberTycoonCloud.saveCurrent()'); await Promise.resolve();
  ctx.storage.set(META, JSON.stringify({ uid: 'other', updatedAt: 456 })); ctx.loadSource("authState.user={uid:'other'};");
  gate.resolve(); await pending;
  assert.deepEqual(JSON.parse(ctx.storage.get(META)), { uid: 'other', updatedAt: 456 });
});

test('a new account with no remote document does not silently inherit another account browser data', async () => {
  const ctx = setup({ meta: { uid: 'other', updatedAt: 100 } }); const latest = seed(ctx);
  await evaluate(ctx, 'synchronizeSignedInUser(authState.user)');
  assert.equal(ctx.confirms.length, 1); assert.equal(ctx.writes.length, 0);
  assert.equal(ctx.storage.get(SAVE), JSON.stringify(latest));
});

test('no local save still restores a cloud-only account without requiring a fabricated local snapshot', async () => {
  const ctx = setup(); const latest = seed(ctx); ctx.remote = { ...latest, cloudUpdatedAt: 100 };
  ctx.storage.delete(SAVE);
  assert.equal(await evaluate(ctx, 'window.numberTycoonCloud.loadCurrent()'), true);
  assert.deepEqual(snapshot(ctx), { slots: 579, higgs: '526000' });
  assert.equal(ctx.confirms.length, 0); assert.equal(ctx.writes.length, 0);
});

test('explicit cloud selection restores even an older server save without uploading and backs up newer local data', async () => {
  const ctx=setup();const old=seed(ctx,false);ctx.remote={...old,cloudUpdatedAt:100};
  ctx.storage.set(META,JSON.stringify({uid:'owner',updatedAt:100,localRevision:old.saveRevision}));
  const latest=seed(ctx);ctx.accept=true;
  ctx.getDoc=()=>{throw Error('cached reads must not be used');};
  assert.equal(await evaluate(ctx,'requestExplicitCloudLoad()'),true);
  assert.equal(ctx.readCount,1);assert.equal(ctx.writes.length,0);
  assert.deepEqual(snapshot(ctx),{slots:393,higgs:'42'});
  assert.equal(JSON.parse(ctx.storage.get(BACKUP)).raw,JSON.stringify(latest));
  assert.match(evaluate(ctx,"document.getElementById('saveTransferStatus').textContent"),/서버의 클라우드/);
});

test('explicit cloud cancellation never substitutes a local load or changes either save',async()=>{
  const ctx=setup();const old=seed(ctx,false);ctx.remote={...old,cloudUpdatedAt:100};const latest=seed(ctx);
  assert.equal(await evaluate(ctx,'requestExplicitCloudLoad()'),false);
  assert.equal(ctx.storage.get(SAVE),JSON.stringify(latest));assert.equal(ctx.writes.length,0);
  assert.equal(ctx.storage.has(BACKUP),false);
  assert.match(evaluate(ctx,'authState.message'),/취소/);
});

test('explicit cloud read errors and missing documents report failure rather than fake local success',async()=>{
  for(const fail of [false,true]){
    const ctx=setup();const latest=seed(ctx);
    if(fail)ctx.readHook=async()=>{throw Object.assign(Error('rules'),{code:'permission-denied'});};
    assert.equal(await evaluate(ctx,'requestExplicitCloudLoad()'),false);
    assert.equal(ctx.storage.get(SAVE),JSON.stringify(latest));assert.equal(ctx.writes.length,0);
    assert.match(evaluate(ctx,"document.getElementById('saveTransferStatus').textContent"),fail?/permission-denied/:/없습니다/);
  }
});

test('explicit server loading refuses while uploads are pending and cannot discard unsent progress',async()=>{
  const ctx=setup();seed(ctx);const gate=deferred();ctx.writeHook=()=>gate.promise;
  const saving=evaluate(ctx,'window.numberTycoonCloud.saveCurrent()');await Promise.resolve();
  assert.equal(await evaluate(ctx,'requestExplicitCloudLoad()'),false);assert.equal(ctx.readCount,0);
  assert.match(evaluate(ctx,'authState.message'),/전송 중/);gate.resolve();await saving;
});

test('manual Save uploads the actual current snapshot and exposes cloud completion or rejection beside the buttons',async()=>{
  const ctx=setup();seed(ctx,false);ctx.accept=true;
  run(ctx,'higgsParticles=526000;');
  assert.equal(await evaluate(ctx,'requestSaveGame()'),true);assert.equal(ctx.remote.higgsParticles,'526000');
  assert.equal(ctx.remote.saveRevision,JSON.parse(ctx.storage.get(SAVE)).saveRevision);
  assert.match(evaluate(ctx,"document.getElementById('saveTransferStatus').textContent"),/브라우저와 클라우드/);
  ctx.writeHook=async()=>{throw Object.assign(Error('rules'),{code:'permission-denied'});};
  run(ctx,'higgsParticles=999999;');
  assert.equal(await evaluate(ctx,'requestSaveGame()'),false);
  assert.equal(JSON.parse(ctx.storage.get(SAVE)).higgsParticles,'999999');assert.equal(ctx.remote.higgsParticles,'526000');
  assert.match(evaluate(ctx,"document.getElementById('saveTransferStatus').textContent"),/permission-denied/);
});

test('explicit cloud button without an authenticated connection does not silently load local',async()=>{
  const ctx=setup();seed(ctx);ctx.loadSource('authState.user=null;');
  assert.equal(await evaluate(ctx,'requestExplicitCloudLoad()'),false);assert.equal(ctx.readCount,0);
  assert.match(evaluate(ctx,"document.getElementById('saveTransferStatus').textContent"),/로그인/);
});
