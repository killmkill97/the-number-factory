# Firebase Google 로그인 설정

이 게임은 Google 로그인 상태를 확인해 디버그 모드 사용자를 제한합니다.

## 1. Firebase 프로젝트 만들기

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트를 만들거나 선택합니다.
2. 프로젝트 설정에서 웹 앱을 추가합니다.
3. 웹 앱 등록 후 표시되는 Firebase 설정 객체를 복사합니다.

## 2. Google 로그인 켜기

Firebase Console의 `Authentication` > `Sign-in method`에서 `Google` 제공업체를 활성화합니다.

## 3. 승인 도메인 등록

`Authentication` > `Settings` > `Authorized domains`에 아래 주소를 추가합니다.

- `killmkill97.github.io`
- 로컬 테스트를 한다면 `localhost`

GitHub Pages의 실제 게임 주소는 다음과 같습니다.

`https://killmkill97.github.io/the-number-factory/`

## 4. 게임 설정에 값 넣기

`scripts/config/firebase-config.js`의 빈 값을 Firebase 웹 앱 설정으로 채웁니다.

```js
window.NUMBER_TYCOON_FIREBASE_CONFIG = Object.freeze({
  apiKey: '여기에 apiKey',
  authDomain: '여기에 authDomain',
  projectId: '여기에 projectId',
  storageBucket: '여기에 storageBucket',
  messagingSenderId: '여기에 messagingSenderId',
  appId: '여기에 appId'
});
```

이 설정 객체는 웹 클라이언트에 공개되는 값입니다. 서비스 계정 비밀키나 개인 키는 절대 넣지 않습니다.

## 5. 권한 규칙

- 로그인하지 않은 상태: 디버그 모드가 열리지 않고 비밀 업적만 달성됩니다.
- 다른 Google 계정: 프로필은 보이지만 디버그 모드가 열리지 않고 비밀 업적만 달성됩니다.
- `killmkill97@gmail.com`: 디버그 모드를 사용할 수 있습니다.

## 6. 저장 데이터 동기화

Firebase Console에서 `Build` > `Firestore Database`를 열고 데이터베이스를 만든 뒤, `Rules` 탭에 아래 규칙을 게시합니다.

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }
  }
}
```

게임은 로그인한 Google 계정의 UID별로 `users/{uid}/save/main` 문서를 사용합니다. 저장 버튼은 현재 저장 데이터를 클라우드에 올리고, 불러오기 버튼은 로그인 상태에서 클라우드 데이터를 우선 불러옵니다. 로그인 전 브라우저 저장 데이터가 있으면 첫 연결 때 클라우드로 복사할 수 있습니다.

Google 로그인 구현은 Firebase의 공식 웹 설정 및 Google 로그인 방식을 사용합니다.

- [Firebase 웹 앱 설정](https://firebase.google.com/docs/web/setup)
- [Firebase 웹 Google 로그인](https://firebase.google.com/docs/auth/web/google-signin)
