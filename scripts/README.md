# 숫자의 끝을 보는 타이쿤 스크립트 구조

이 프로젝트는 번들러 없이 `number-tycoon.html`에서 일반 `<script>`를 순서대로 불러옵니다.
새 챕터를 붙일 때는 아래 순서를 유지하세요.

- `data/chapter-roadmap.js`: 제곱, 테트레이션, TREE, BB, 라요수처럼 큰 진행 단위의 목록
- `core/constants.js`: 전역 상수와 저장 키
- `core/state.js`: 현재 저장/복구되어야 하는 게임 상태
- `core/dom.js`: HTML 요소 참조와 `log`, `fmt` 같은 작은 공통 함수
- `core/chapter-ui.js`: 현재 챕터 라벨과 `body[data-chapter]` 전환
- `systems/`: 여러 챕터에서 재사용할 수 있는 성장 장치
- `systems/square-upgrades.js`: 제곱 포인트 영구 업그레이드 보드
- `automatium/n-lexer.js`: N 소스 코드를 토큰으로 분리
- `automatium/n-parser.js`: N 토큰을 실행 가능한 구문 트리로 변환
- `automatium/n-runtime.js`: N 계산식과 제어문을 중단 가능한 실행기로 처리
- `systems/automatium.js`: 프로그램 로컬 저장, 편집기, 게임 API, 실행 스케줄러
- `archive/square-dimensions.legacy.js`: 이전 제곱수/차원 생산 실험 코드 보관본
- `chapters/`: 특정 챕터의 프레스티지, 전환, 챕터 전용 UI
- `core/save.js`: 저장 데이터 직렬화와 복구
- `main.js`: 초기 라벨 설정과 첫 렌더

다음 단계를 추가할 때의 기본 흐름:

1. `data/chapter-roadmap.js`에 이미 있는 챕터 id를 사용하거나 새 id를 추가합니다.
2. 챕터 전용 상태가 저장되어야 하면 `core/state.js`와 `core/save.js`에 필드를 추가합니다.
3. 전용 UI와 전환 로직은 `chapters/<chapter-id>.js`에 둡니다.
4. 재사용 가능한 자동화나 성장 시스템은 `systems/`에 둡니다.
5. `number-tycoon.html`에서 새 파일을 `core/save.js`보다 앞에 로드합니다.
