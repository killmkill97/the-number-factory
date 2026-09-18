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
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const AUTHORIZED_DEBUG_EMAIL = 'killmkill97@gmail.com';
const CLOUD_SAVE_KEY = 'numberTycoonSave_v1';
const CLOUD_SYNC_META_KEY = 'numberTycoonCloudSync_v1';
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

function rememberCloudSync(user, updatedAt) {
  localStorage.setItem(CLOUD_SYNC_META_KEY, JSON.stringify({
    uid: user.uid,
    updatedAt
  }));
}

function localSaveData() {
  const raw = localStorage.getItem(CLOUD_SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readCloudSave(user = authState.user) {
  const reference = cloudSaveReference(user);
  if (!reference) return null;

  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) return null;

  const savedData = snapshot.data();
  const { cloudUpdatedAt, ...data } = savedData;
  return {
    data,
    updatedAt: Number(cloudUpdatedAt) || 0
  };
}

async function writeCloudSave(user = authState.user) {
  const reference = cloudSaveReference(user);
  if (!reference) return false;

  let data = localSaveData();
  if (!data && typeof window.saveGame === 'function') {
    window.saveGame();
    data = localSaveData();
  }
  if (!data) {
    setAuthMessage('저장할 게임 데이터가 없습니다.');
    return false;
  }

  const updatedAt = Date.now();
  await setDoc(reference, {
    ...data,
    cloudUpdatedAt: updatedAt
  });
  rememberCloudSync(user, updatedAt);
  return true;
}

async function applyCloudSave(cloudSave, user = authState.user, options = {}) {
  if (!cloudSave || typeof window.loadGame !== 'function') return false;

  window.loadGame(JSON.stringify(cloudSave.data), {
    countAsLoad: options.countAsLoad !== false
  });
  rememberCloudSync(user, cloudSave.updatedAt);
  return true;
}

async function synchronizeSignedInUser(user) {
  const generation = ++cloudSyncGeneration;
  try {
    const cloudSave = await readCloudSave(user);
    if (generation !== cloudSyncGeneration || authState.user?.uid !== user.uid) return;

    const localData = localSaveData();
    if (!cloudSave) {
      if (localData) {
        await writeCloudSave(user);
        setAuthMessage('현재 저장 데이터를 클라우드에 처음 연결했습니다.');
      }
      return;
    }

    const meta = cloudSyncMeta();
    if (meta?.uid === user.uid && meta.updatedAt === cloudSave.updatedAt) return;

    if (!localData) {
      await applyCloudSave(cloudSave, user, { countAsLoad: false });
      setAuthMessage('클라우드 저장 데이터를 불러왔습니다.');
      return;
    }

    const useCloud = window.confirm(
      '클라우드 저장 데이터가 있습니다. 현재 브라우저 저장 데이터를 덮어쓰고 불러오시겠습니까?\n\n취소하면 현재 브라우저 저장 데이터를 클라우드에 저장합니다.'
    );
    if (useCloud) {
      await applyCloudSave(cloudSave, user);
      setAuthMessage('클라우드 저장 데이터를 불러왔습니다.');
    } else {
      await writeCloudSave(user);
      setAuthMessage('현재 브라우저 저장 데이터를 클라우드에 저장했습니다.');
    }
  } catch (error) {
    console.error('Cloud save sync failed', error);
    setAuthMessage('클라우드 저장 데이터 동기화에 실패했습니다. Firebase 설정과 보안 규칙을 확인하세요.');
  }
}

async function saveCurrentToCloud() {
  if (!authState.user || !firestore) return false;
  try {
    const saved = await writeCloudSave(authState.user);
    setAuthMessage(saved ? '클라우드에 저장했습니다.' : '클라우드에 저장하지 못했습니다.');
    return saved;
  } catch (error) {
    console.error('Cloud save failed', error);
    setAuthMessage('클라우드 저장에 실패했습니다. Firestore 보안 규칙을 확인하세요.');
    return false;
  }
}

async function loadCurrentFromCloud() {
  if (!authState.user || !firestore) {
    window.loadGame?.();
    return false;
  }
  try {
    const cloudSave = await readCloudSave(authState.user);
    if (!cloudSave) {
      window.loadGame?.();
      setAuthMessage('클라우드 저장 데이터가 없어 브라우저 저장 데이터를 불러왔습니다.');
      return false;
    }
    await applyCloudSave(cloudSave, authState.user);
    setAuthMessage('클라우드 저장 데이터를 불러왔습니다.');
    return true;
  } catch (error) {
    console.error('Cloud load failed', error);
    setAuthMessage('클라우드 불러오기에 실패했습니다. Firestore 보안 규칙을 확인하세요.');
    return false;
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
