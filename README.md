# AI 작업실 MVP

Claude, GPT, Gemini, Cursor, Figma, Make, Zapier 같은 AI 도구로 작업하는 사람들이 함께 머무는 온라인 작업실 MVP입니다.

## 포함된 기능

- Supabase Auth 기반 로그인 게이트
- GitHub/Google OAuth 버튼
- 작업방 목록과 방별 8명/12명 인원 제한
- 내 작업 상태, 오늘의 목표, 사용 도구 저장
- 방 입장/퇴장에 가까운 방 전환 경험
- 방 안 도움 요청 카드
- 작업 채팅
- 카테고리별 Q&A
- 결과물 쇼케이스
- 커피챗 후보 매칭
- 브라우저 `localStorage` 기반 데모 데이터 저장

## 실행

서버 없이 바로 열 수 있습니다.

```text
/Users/sangwan/projects/ai-builder-room/index.html
```

브라우저에서 위 파일을 열면 됩니다.

## 로그인 설정

실제 로그인을 활성화하려면 Supabase 프로젝트를 만들고 [config.js](./config.js)에 값을 넣습니다.

```js
window.AI_BUILDER_CONFIG = {
  supabaseUrl: "https://YOUR_PROJECT.supabase.co",
  supabaseAnonKey: "YOUR_SUPABASE_ANON_KEY",
  redirectTo: "https://ai-builder-room.pages.dev"
};
```

Supabase Dashboard에서 GitHub 또는 Google OAuth provider를 켜고, redirect URL에 배포 주소를 추가해야 합니다.

```text
https://ai-builder-room.pages.dev
```

## 다음 버전 후보

- Supabase DB 기반 실시간 동기화
- 도움 요청 응답/해결 처리
- 커피챗 수락과 10분 타이머
- 방 자동 추천
- 이미지/링크 첨부
- 유저 프로필과 평판
