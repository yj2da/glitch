# 🌀 GLITCH: Routine Error Injection

내 캘린더를 읽고, 익숙한 루틴에서 한 발짝 벗어나는 작은 활동("Glitch")을 AI가 제안하는
Next.js 앱입니다. 마음에 드는 제안을 고르면 애플 캘린더에 `[GLITCH]` 일정으로 바로 추가됩니다.

<p>
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/CalDAV-iCloud-999999?style=flat-square&logo=apple&logoColor=white" />
</p>

---

## 무엇을 하는 앱인가

1. **iCloud 캘린더 연결 (CalDAV)** — Apple ID와 앱 전용 비밀번호로 로그인하면 `caldav.icloud.com`의 모든 캘린더에서 일정을 읽어옵니다(`tsdav` + `ical.js`). 종일 일정 여부, 캘린더 이름까지 함께 가져옵니다.
2. **일정 카테고리 분류** — 일정 제목의 키워드로 `과제/공부`, `수업/강의`, `식사/약속`, `취미/운동`, `기타` 5가지로 분류합니다.
3. **AI Glitch 제안** — 이번 달 일정 통계, 사용자가 입력한 목표, Glitch 정도, 선호 카테고리를 프롬프트에 넣어 활동 3가지를 제안받습니다. 사용자가 실제로 쓰는 일정 제목의 말투·길이를 모방하도록 지시하고, 캘린더에서 특정 일정을 골라 "이 일정과 연관된 Glitch"를 요청할 수도 있습니다.
4. **챌린지 수락 → 캘린더에 추가** — 제안을 고르고 날짜를 선택하면 표준 iCalendar(ICS) 형식으로 새 이벤트를 만들어 CalDAV 서버에 업로드합니다. 일정 제목은 `[GLITCH] ...`로 저장됩니다.
5. **카테고리 추천** — 최근 60일 일정 제목에서 2회 이상 등장한 단어를 찾아 카테고리를 제안하고, 사용자가 수락한 매핑은 브라우저 `localStorage`에 저장해 다음 분류에 재사용합니다. (화면 우측 상단 `카테고리 추천 ON/OFF`로 끌 수 있습니다.)

## 기술 스택

| 구분 | 사용 기술 |
| :--- | :--- |
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript |
| 스타일·UI | Tailwind CSS 4, `lucide-react`, `clsx` + `tailwind-merge`, `react-big-calendar` |
| 캘린더 연동 | `tsdav`(CalDAV), `ical.js`(ICS 파싱), `node-ical`, `date-fns` / `date-fns-tz` |
| AI | `@google/generative-ai` (Gemini), `openai` (선택) |
| 기타 | `uuid` (iCalendar UID 생성) |

## 프로젝트 구조

```
app/
├── page.tsx               # 로그인 화면 ↔ 대시보드 전환, 이벤트/카테고리 상태 관리
├── layout.tsx
└── api/
    ├── calendar/route.ts  # 캘린더 일정 조회
    ├── glitch/route.ts    # AI Glitch 제안 생성
    └── glitch/add/route.ts# 제안을 캘린더 일정으로 추가
components/
├── LoginScreen.tsx        # Apple ID + 앱 전용 비밀번호 입력
├── CalendarView.tsx       # 월간 캘린더, 카테고리별 표시, 일정 선택
└── GlitchDashboard.tsx    # 목표·Glitch 정도·카테고리 설정, 제안 카드, 날짜 선택 모달
lib/
├── caldav.ts              # CalDAV 로그인, 전체 캘린더에서 이벤트 수집, 키워드 분류
├── calendar-write.ts      # ICS 생성 후 캘린더에 이벤트 업로드
├── glitch.ts              # Gemini/OpenAI 기반 Glitch 제안 프롬프트
└── openai.ts              # Gemini 기반 카테고리 분류 (현재 라우트에서 호출하지 않음)
```

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Node.js 20 이상이 필요합니다(Next.js 16 기준).

### 환경변수 (`.env.local`)

```env
# 캘린더 연결: 화면에서 직접 입력하지 않을 때만 사용됩니다.
APPLE_ID=your_apple_id@example.com
APPLE_APP_SPECIFIC_PASSWORD=your_app_specific_password

# AI 제안 생성 (Gemini → OpenAI 순서로 시도, Gemini만 있어도 동작)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

- Apple ID는 **2단계 인증을 켠 뒤 발급하는 앱 전용 비밀번호**가 필요합니다(일반 로그인 비밀번호로는 CalDAV 로그인이 되지 않습니다).
- AI 키가 없으면 앱은 기본 제안 2개(명상·산책)를 보여주고, 캘린더 연결은 그대로 동작합니다. Gemini 호출이 실패하면 다른 Gemini 모델로 재시도한 뒤 OpenAI(`gpt-4o-mini`)로 넘어갑니다.
- 비밀번호는 브라우저 메모리에만 보관되며 서버에 저장하지 않습니다.

## 참고

- 이 저장소에는 현재 배포된 데모 주소가 없습니다. 로컬 실행 또는 Vercel 등에 직접 배포해 사용하세요.
- `.gemini/agents/`의 서브 에이전트 정의와 `AGENTS.md`는 개발 보조용 문서입니다.
