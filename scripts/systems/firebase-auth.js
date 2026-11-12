import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const AUTHORIZED_DEBUG_EMAIL = 'killmkill97@gmail.com';
const CLOUD_SAVE_KEY = 'numberTycoonSave_v1';
const CLOUD_SYNC_META_KEY = 'numberTycoonCloudSync_v1';
const CLOUD_LOAD_BACKUP_KEY = 'numberTycoonSaveBeforeCloudLoad_v1';
const firebaseConfig = window.NUMBER_TYCOON_FIREBASE_CONFIG ?? {};
const authSignedOutPanel = document.getElementById('authSignedOutPanel');
const authSignedInPanel = document.getElementById('authSignedInPanel');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const googleSignOutBtn = document.getElementById('googleSignOutBtn');
const authProfilePhoto = document.getElementById('authProfilePhoto');
const authProfileName = document.getElementById('authProfileName');
const authProfileEmail = document.getElementById('authProfileEmail');
const authDebugAccessStatus = document.getElementById('authDebugAccessStatus');
const authStatus = document.getElementById('authStatus');
const authState = {
  configured: Object.values(firebaseConfig).every(value => typeof value === 'string' && value.trim()),
  initialized: false,
  loading: false,
  user: null,
  message: ''
};

let auth = null;
let googleProvider = null;
let firestore = null;
let cloudSyncGeneration = 0;
let cloudWriteQueue = Promise.resolve();
let pendingCloudWrites = 0;

function normalizedEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function isAuthorizedDebugUser(user = authState.user) {
  return normalizedEmail(user?.email) === AUTHORIZED_DEBUG_EMAIL;
}

function setAuthMessage(message) {
  authState.message = message;
  renderAuthUi();
}

function authErrorMessage(error) {
  if (error?.code === 'auth/popup-closed-by-user') return '';
  if (error?.code === 'auth/popup-blocked') return '로그인 팝업이 차단되었습니다. 팝업을 허용한 뒤 다시 시도하세요.';
  if (error?.code === 'auth/unauthorized-domain') return '이 사이트 주소가 Firebase 승인 도메인에 등록되지 않았습니다.';
  return 'Google 로그인에 실패했습니다. Firebase 설정을 확인하세요.';
}

function cloudErrorDetail(error) {
  const code = String(error?.code ?? 'unknown').replace(/^firestore\//, '');
  const messages = {
    'permission-denied': 'Firestore 보안 규칙 또는 계정 권한을 확인하세요.',
    unauthenticated: '계정 인증이 만료되었습니다. 다시 로그인하세요.',
    unavailable: '서버에 연결할 수 없습니다. 네트워크를 확인하세요.',
    'resource-exhausted': 'Firestore 사용 한도에 도달했습니다.',
    'invalid-argument': '서버에서 저장 데이터 형식을 거부했습니다.'
  };
  return `${messages[code] ?? '설정의 계정 상태와 브라우저 콘솔을 확인하세요.'} (${code})`;
}

function cloudSaveReference(user = authState.user) {
  if (!firestore || !user) return null;
  return doc(firestore, 'users', user.uid, 'save', 'main');
}

function cloudSyncMeta() {
  try {
    return JSON.parse(localStorage.getItem(CLOUD_SYNC_META_KEY) || 'null');
  } catch {
    return null;
  }
}

function rememberCloudSync(user, updatedAt, data) {
  try {
    localStorage.setItem(CLOUD_SYNC_META_KEY, JSON.stringify({
      uid: user.uid,
      updatedAt,
      localRevision: data?.saveRevision ?? null
    }));
  } catch (error) {
    console.error('Cloud sync metadata failed', error);
  }
}

function localSaveData() {
  try {
    const raw = localStorage.getItem(CLOUD_SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === 'object' && !Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function comparableSave(data) {
  const { cloudUpdatedAt, savedAtUtcMs, saveRevision, ...content } = data;
  const ordered = value => {
    if (Array.isArray(value)) return value.map(ordered);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])]));
  };
  return JSON.stringify(ordered(content));
}

function preferredSaveSource(localData, cloudSave, user) {
  if (!localData) return 'cloud';
  const meta = cloudSyncMeta();
  if (meta?.uid && meta.uid !== user.uid) return 'conflict';
  if (comparableSave(localData) === comparableSave(cloudSave.data)) return 'same';
  // Matching remote timestamps alone do not mean that the local save is unchanged.
  if (meta?.uid === user.uid && meta.updatedAt === cloudSave.updatedAt
    && (!meta.localRevision || meta.localRevision !== localData.saveRevision)) return 'local';
  const localTime = Number(localData.savedAtUtcMs) || 0;
  const cloudTime = Number(cloudSave.data.savedAtUtcMs) || 0;
  if (meta?.uid === user.uid && localTime > cloudTime) return 'local';
  if (meta?.uid === user.uid && meta.localRevision
    && meta.localRevision === localData.saveRevision && cloudTime > localTime) return 'cloud';
  return 'conflict';
}

function cloudRequestIsCurrent(user, generation, localRaw) {
  return authState.user?.uid === user.uid && generation === cloudSyncGeneration
    && localStorage.getItem(CLOUD_SAVE_KEY) === localRaw && !window.numberTycoonSession?.isPaused();
}

async function readCloudSave(user = authState.user) {
  const reference = cloudSaveReference(user);
  if (!reference) return null;

  const snapshot = await getDocFromServer(reference);
  if (!snapshot.exists()) return null;

  const savedData = snapshot.data();
  if (!savedData || typeof savedData !== 'object' || Array.isArray(savedData)) throw new Error('Invalid cloud save');
  const { cloudUpdatedAt, ...data } = savedData;
  return {
    data,
    updatedAt: Number(cloudUpdatedAt) || 0
  };
}

function writeCloudSave(user = authState.user) {
  const reference = cloudSaveReference(user);
  if (!reference) return Promise.resolve(false);

  let data = localSaveData();
  if (!data && typeof window.saveGame === 'function') {
    window.saveGame();
    data = localSaveData();
  }
  if (!data) {
    setAuthMessage('저장할 게임 데이터가 없습니다.');
    return Promise.resolve(false);
  }

  const raw = localStorage.getItem(CLOUD_SAVE_KEY);
  pendingCloudWrites++;
  // Capture this snapshot now; serialize writes so an older upload cannot finish last.
  const write = cloudWriteQueue.then(async () => {
    if (authState.user?.uid !== user.uid || localStorage.getItem(CLOUD_SAVE_KEY) !== raw) return false;
    const updatedAt = Math.max(Date.now(), (Number(cloudSyncMeta()?.updatedAt) || 0) + 1);
    await setDoc(reference, { ...data, cloudUpdatedAt: updatedAt });
    if (authState.user?.uid === user.uid) rememberCloudSync(user, updatedAt, data);
    return true;
  });
  cloudWriteQueue = write.then(() => {}, () => {});
  return write.finally(() => { pendingCloudWrites--; });
}

async function applyCloudSave(cloudSave, user = authState.user, options = {}) {
  if (!cloudSave || typeof window.loadGame !== 'function') return false;
  if (window.numberTycoonSession?.isPaused()) return false;
  if (authState.user?.uid !== user?.uid) return false;

  const previous = localStorage.getItem(CLOUD_SAVE_KEY);
  const incoming = JSON.stringify(cloudSave.data);
  if (previous && previous !== incoming) {
    localStorage.setItem(CLOUD_LOAD_BACKUP_KEY, JSON.stringify({
      uid: user.uid, backedUpAtUtcMs: Date.now(), raw: previous
    }));
  }

  const loaded = window.loadGame(incoming, {
    countAsLoad: options.countAsLoad !== false
  });
  if (loaded === false) return false;
  rememberCloudSync(user, cloudSave.updatedAt, cloudSave.data);
  return true;
}

async function synchronizeSignedInUser(user) {
  const generation = ++cloudSyncGeneration;
  const localRaw = localStorage.getItem(CLOUD_SAVE_KEY);
  try {
    const cloudSave = await readCloudSave(user);
    if (generation !== cloudSyncGeneration || authState.user?.uid !== user.uid) return;

    if (window.numberTycoonSession?.autoLoadEnabled === false || window.numberTycoonSession?.isPaused()) {
      setAuthMessage('계정이 연결되었습니다. 불러오기 버튼으로 클라우드 저장을 적용할 수 있습니다.');
      return;
    }
    if (!cloudRequestIsCurrent(user, generation, localRaw) || pendingCloudWrites) return;

    const localData = localSaveData();
    if (!cloudSave) {
      if (localData) {
        if (cloudSyncMeta()?.uid && cloudSyncMeta().uid !== user.uid && !window.confirm(
          '이 브라우저에는 다른 계정에서 사용한 저장이 있습니다. 현재 계정의 새 클라우드 저장으로 연결하시겠습니까?'
        )) return;
        const saved = await writeCloudSave(user);
        if (generation === cloudSyncGeneration && authState.user?.uid === user.uid) setAuthMessage(saved
          ? '현재 저장 데이터를 클라우드에 처음 연결했습니다.' : '브라우저 저장은 유지됩니다. 클라우드 동기화를 다시 시도하세요.');
      }
      return;
    }

    if (!localData) {
      const loaded = await applyCloudSave(cloudSave, user, { countAsLoad: false });
      if (loaded) setAuthMessage('클라우드 저장 데이터를 불러왔습니다.');
      return;
    }

    const source = preferredSaveSource(localData, cloudSave, user);
    if (source === 'same') {
      rememberCloudSync(user, cloudSave.updatedAt, localData);
      return;
    }
    if (source === 'local') {
      const saved = await writeCloudSave(user);
      if (generation === cloudSyncGeneration && authState.user?.uid === user.uid) {
        setAuthMessage(saved ? '최신 브라우저 저장 데이터를 클라우드에 동기화했습니다.'
          : '브라우저 저장은 유지됩니다. 클라우드 동기화를 다시 시도하세요.');
      }
      return;
    }

    const useCloud = window.confirm(
      '클라우드 저장 데이터가 있습니다. 현재 브라우저 저장 데이터를 덮어쓰고 불러오시겠습니까?\n\n기존 브라우저 저장은 별도 백업합니다. 취소하면 현재 브라우저 저장 데이터를 클라우드에 저장합니다.'
    );
    if (useCloud) {
      if (await applyCloudSave(cloudSave, user)) setAuthMessage('클라우드 저장 데이터를 불러왔습니다.');
    } else {
      const saved = await writeCloudSave(user);
      if (generation === cloudSyncGeneration && authState.user?.uid === user.uid) setAuthMessage(saved
        ? '현재 브라우저 저장 데이터를 클라우드에 저장했습니다.' : '브라우저 저장은 유지됩니다. 클라우드 동기화를 다시 시도하세요.');
    }
  } catch (error) {
    console.error('Cloud save sync failed', error);
    if (generation === cloudSyncGeneration && authState.user?.uid === user.uid) {
      setAuthMessage(`클라우드 동기화에 실패했습니다. 브라우저 저장은 유지됩니다. ${cloudErrorDetail(error)}`);
    }
  }
}

async function saveCurrentToCloud() {
  if (!authState.user || !firestore) return false;
  const user = authState.user;
  ++cloudSyncGeneration;
  setAuthMessage('이 브라우저에 저장했습니다. 클라우드에 동기화하는 중입니다.');
  try {
    const saved = await writeCloudSave(user);
    if (authState.user?.uid === user.uid) setAuthMessage(saved
      ? '브라우저와 클라우드에 저장했습니다.' : '브라우저 저장은 유지됩니다. 최신 저장의 동기화 상태를 확인하세요.');
    return saved;
  } catch (error) {
    console.error('Cloud save failed', error);
    if (authState.user?.uid === user.uid) setAuthMessage(`클라우드 저장에 실패했습니다. 최신 브라우저 저장은 안전하게 유지됩니다. ${cloudErrorDetail(error)}`);
    return false;
  }
}

async function loadCurrentFromCloud({ source = 'auto' } = {}) {
  const explicitCloud = source === 'cloud';
  if (!authState.user || !firestore) {
    if (explicitCloud) {
      setAuthMessage('클라우드 불러오기는 로그인과 Firebase 연결이 필요합니다.');
      return false;
    }
    return window.loadGame?.() === true;
  }
  const user = authState.user;
  const generation = ++cloudSyncGeneration;
  const localRaw = localStorage.getItem(CLOUD_SAVE_KEY);
  if (pendingCloudWrites && localSaveData()) {
    if (explicitCloud) {
      setAuthMessage('클라우드 저장 전송 중입니다. 저장 완료 후 클라우드 불러오기를 다시 시도하세요.');
      return false;
    }
    const loaded = window.loadGame?.() === true;
    setAuthMessage('클라우드 전송 중이므로 최신 브라우저 저장을 불러왔습니다.');
    return loaded;
  }
  try {
    const cloudSave = await readCloudSave(user);
    if (authState.user?.uid !== user.uid || generation !== cloudSyncGeneration) return false;
    if (window.numberTycoonSession?.isPaused()) {
      if (explicitCloud) setAuthMessage('오프라인 모드를 종료한 뒤 클라우드 불러오기를 다시 시도하세요.');
      return false;
    }
    if (localStorage.getItem(CLOUD_SAVE_KEY) !== localRaw) {
      if (explicitCloud) {
        setAuthMessage('서버 확인 중 새 브라우저 저장이 생겨 불러오기를 취소했습니다. 다시 시도하세요.');
        return false;
      }
      const loaded = window.loadGame?.() === true;
      setAuthMessage('확인 중 새 저장이 생겨 최신 브라우저 저장을 불러왔습니다.');
      return loaded;
    }
    if (!cloudSave) {
      if (explicitCloud) {
        setAuthMessage('이 계정에는 클라우드 저장 데이터가 없습니다. 브라우저 저장은 유지됩니다.');
        return false;
      }
      const loaded = window.loadGame?.() === true;
      setAuthMessage('클라우드 저장 데이터가 없어 브라우저 저장 데이터를 불러왔습니다.');
      return loaded;
    }
    const localData = localSaveData();
    if (explicitCloud) {
      if (!window.confirm('서버의 클라우드 저장을 불러오시겠습니까?\n현재 진행을 교체합니다. 브라우저 저장은 별도 백업하며 클라우드에는 쓰지 않습니다.')) {
        setAuthMessage('클라우드 불러오기를 취소했습니다. 현재 진행은 유지됩니다.');
        return false;
      }
      if (!cloudRequestIsCurrent(user, generation, localRaw)) {
        if (authState.user?.uid === user.uid) setAuthMessage('계정 또는 저장 상태가 바뀌어 클라우드 불러오기를 취소했습니다.');
        return false;
      }
      if (!await applyCloudSave(cloudSave, user)) {
        setAuthMessage('클라우드 저장 적용에 실패했습니다. 브라우저 저장은 유지됩니다.');
        return false;
      }
      setAuthMessage('서버의 클라우드 저장 데이터를 불러왔습니다. 기존 브라우저 저장은 별도 백업했습니다.');
      return true;
    }
    const source = preferredSaveSource(localData, cloudSave, user);
    if (source === 'local' || source === 'same') {
      const loaded = window.loadGame?.() === true;
      if (source === 'same') rememberCloudSync(user, cloudSave.updatedAt, localData);
      setAuthMessage(source === 'local'
        ? '클라우드보다 최신인 브라우저 저장을 불러왔습니다. 서버 저장을 직접 선택하려면 클라우드 불러오기 버튼을 사용하세요.'
        : '최신 저장 데이터를 불러왔습니다.');
      return loaded;
    }
    if (source === 'conflict' && !window.confirm(
      '브라우저와 클라우드 저장 내용이 다릅니다. 클라우드 저장으로 바꾸시겠습니까?\n\n취소하면 브라우저 저장을 불러옵니다. 클라우드를 선택해도 기존 브라우저 저장은 별도 백업합니다.'
    )) {
      return window.loadGame?.() === true;
    }
    if (!await applyCloudSave(cloudSave, user)) {
      setAuthMessage('현재는 클라우드 불러오기를 적용할 수 없습니다. 오프라인 모드를 종료한 뒤 다시 시도하세요.');
      return false;
    }
    setAuthMessage('클라우드 저장 데이터를 불러왔습니다.');
    return true;
  } catch (error) {
    console.error('Cloud load failed', error);
    if (authState.user?.uid !== user.uid || generation !== cloudSyncGeneration) return false;
    if (explicitCloud) {
      setAuthMessage(`클라우드 불러오기에 실패했습니다. 브라우저 저장은 유지됩니다. ${cloudErrorDetail(error)}`);
      return false;
    }
    const loaded = !window.numberTycoonSession?.isPaused() && localSaveData() && window.loadGame?.() === true;
    setAuthMessage(loaded
      ? `클라우드 확인에 실패해 브라우저 저장을 불러왔습니다. ${cloudErrorDetail(error)}`
      : `클라우드 불러오기에 실패했습니다. 브라우저 저장은 유지됩니다. ${cloudErrorDetail(error)}`);
    return Boolean(loaded);
  }
}

function renderAuthUi() {
  const user = authState.user;
  const signedIn = Boolean(user);
  const authorized = isAuthorizedDebugUser(user);

  authSignedOutPanel?.classList.toggle('hidden', signedIn);
  authSignedInPanel?.classList.toggle('hidden', !signedIn);
  if (googleSignInBtn) googleSignInBtn.disabled = !authState.configured || authState.loading;
  if (googleSignOutBtn) googleSignOutBtn.disabled = authState.loading;

  if (authProfileName) authProfileName.textContent = user?.displayName || 'Google 사용자';
  if (authProfileEmail) authProfileEmail.textContent = user?.email || '';
  if (authProfilePhoto) {
    authProfilePhoto.src = user?.photoURL || '';
    authProfilePhoto.alt = user?.displayName ? `${user.displayName} 프로필 사진` : '프로필 사진';
    authProfilePhoto.classList.toggle('hidden', !user?.photoURL);
  }
  if (authDebugAccessStatus) {
    authDebugAccessStatus.textContent = authorized
      ? '디버그 모드 사용 가능'
      : '이 계정은 디버그 모드 사용 권한이 없습니다.';
  }

  if (authState.message) {
    if (authStatus) authStatus.textContent = authState.message;
  } else if (!authState.configured) {
    if (authStatus) authStatus.textContent = 'Firebase 설정이 필요합니다.';
  } else if (!authState.initialized) {
    if (authStatus) authStatus.textContent = '인증 서비스를 준비하는 중입니다.';
  } else if (!signedIn) {
    if (authStatus) authStatus.textContent = '로그인하면 프로필이 표시됩니다.';
  } else if (!authorized) {
    if (authStatus) authStatus.textContent = '로그인은 완료됐지만 디버그 모드 권한은 없습니다.';
  } else if (authStatus) {
    authStatus.textContent = '';
  }
}

async function signInWithGoogle() {
  if (!authState.configured || !auth) {
    setAuthMessage('Firebase 설정을 먼저 완료하세요.');
    return;
  }

  authState.loading = true;
  authState.message = '';
  renderAuthUi();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    const message = authErrorMessage(error);
    if (message) setAuthMessage(message);
  } finally {
    authState.loading = false;
    renderAuthUi();
  }
}

async function signOutGoogle() {
  if (!auth) return;

  authState.loading = true;
  authState.message = '';
  renderAuthUi();
  try {
    await signOut(auth);
    const previousCount = Number(localStorage.getItem(AUTH_SIGN_OUT_COUNT_KEY));
    const nextCount = Number.isSafeInteger(previousCount) && previousCount >= 0
      ? previousCount + 1
      : 1;
    localStorage.setItem(AUTH_SIGN_OUT_COUNT_KEY, String(nextCount));
    window.dispatchEvent(new CustomEvent('numberTycoonAuthChanged', {
      detail: { signOutCount: nextCount }
    }));
  } catch {
    setAuthMessage('로그아웃에 실패했습니다. 다시 시도하세요.');
  } finally {
    authState.loading = false;
    renderAuthUi();
  }
}

window.numberTycoonAuth = {
  isConfigured: () => authState.configured,
  isAuthorized: () => isAuthorizedDebugUser(),
  getUser: () => authState.user,
  notify: setAuthMessage,
  statusMessage: () => authState.message,
  signInWithGoogle,
  signOutGoogle
};

window.numberTycoonCloud = {
  isReady: () => Boolean(authState.user && firestore),
  saveCurrent: saveCurrentToCloud,
  loadCurrent: loadCurrentFromCloud,
  onUserChanged: user => user && synchronizeSignedInUser(user)
};

googleSignInBtn?.addEventListener('click', signInWithGoogle);
googleSignOutBtn?.addEventListener('click', signOutGoogle);
renderAuthUi();

if (authState.configured) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    auth.languageCode = 'ko';
    onAuthStateChanged(auth, user => {
      ++cloudSyncGeneration;
      authState.user = user;
      authState.initialized = true;
      authState.message = '';
      window.dispatchEvent(new CustomEvent('numberTycoonAuthChanged', { detail: user }));
      if (!isAuthorizedDebugUser(user)
        && typeof window.devConsoleIsOpen === 'function'
        && window.devConsoleIsOpen()) {
        window.stopDevDebugMode?.();
      }
      renderAuthUi();
      if (user) synchronizeSignedInUser(user);
    });
  } catch {
    authState.initialized = true;
    setAuthMessage('Firebase를 초기화하지 못했습니다. 설정값을 확인하세요.');
  }
}
