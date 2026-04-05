# Signal Stack Tetris

React + Vite 기반 테트리스 게임이며, Supabase 프로젝트 vtest-tetris에 맞춰 인증, 점수 저장, 사용자 통계, 리더보드를 연결하는 구조로 정리되어 있습니다.

## 현재 구조

- 게임 엔진: src/game
- 인증 상태 및 로그인 UI: src/features/auth
- 리더보드 조회 및 실시간 구독: src/features/leaderboard
- Supabase 클라이언트 및 API 호출: src/lib
- Supabase SQL 마이그레이션: supabase/migrations/001_init.sql
- SQL 복사용 텍스트 파일: query.txt

## Supabase 연결 방식

이 프로젝트는 프런트에서 직접 scores와 user_stats를 조작하지 않습니다.

- 점수 저장은 public.submit_score RPC 함수로 처리합니다.
- 리더보드는 public.leaderboard 뷰를 조회합니다.
- 실시간 갱신은 public.user_stats 테이블의 Realtime publication을 사용합니다.

즉, vtest-tetris Supabase 프로젝트에는 SQL 스키마를 먼저 적용해야 앱이 정상 동작합니다.

## 설정 순서

1. Supabase Dashboard에서 vtest-tetris 프로젝트를 엽니다.
2. SQL Editor에 supabase/migrations/001_init.sql 내용을 실행합니다.
3. Project Settings > API에서 Project URL과 anon public key를 확인합니다.
4. 루트에 .env.local 파일을 만들고 아래 값을 넣습니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. 로컬 실행:

```bash
npm install
npm run dev
```

6. 배포 시 Vercel Environment Variables에도 같은 두 값을 넣습니다.

## SQL이 하는 일

- profiles: auth.users와 1:1 연결되는 사용자 프로필
- scores: 게임 한 판 단위의 원본 점수 기록
- user_stats: 최고 점수, 마지막 점수, 총 게임 수, 총 라인 수, 평균 점수
- handle_new_user: 가입 시 profiles와 user_stats 초기 행 생성
- submit_score: 점수 저장과 통계 갱신을 DB 내부에서 한 번에 처리
- leaderboard: 리더보드 조회용 뷰

## 검증 포인트

1. 회원가입 또는 로그인 후 세션이 유지되는지 확인합니다.
2. 게임 오버 후 점수 저장 메시지가 정상 출력되는지 확인합니다.
3. Supabase에서 scores에 행이 생성되는지 확인합니다.
4. user_stats의 highest_score와 total_games가 갱신되는지 확인합니다.
5. 다른 계정에서 점수를 넣었을 때 리더보드가 실시간 반영되는지 확인합니다.

## 빌드

```bash
npm run build
```

현재 기준으로 프로덕션 빌드는 정상 통과합니다.
