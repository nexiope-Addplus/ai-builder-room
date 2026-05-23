const categories = ["Vibe Coding", "App Building", "Design", "Automation", "Prompt / Workflow", "Showcase"];
const statuses = ["집중 중", "질문 가능", "도움 필요", "커피챗 가능", "쉬는 중", "데모 준비 중"];
const goalOptions = [
  "새 앱 MVP 만들기",
  "기존 코드 디버깅하기",
  "UI/UX 디자인 개선하기",
  "자동화 워크플로우 만들기",
  "프롬프트/작업 지시서 정리하기",
  "배포/연동 문제 해결하기",
  "쇼케이스 결과물 정리하기"
];
const dailySeatLimitSeconds = 5 * 60 * 60;
const floorPlan = [
  { floor: "B1", category: "Prompt / Workflow", name: "Help Desk", note: "막힌 지점 상담" },
  { floor: "1F", category: "Design", name: "Design Studio", note: "UI/UX와 시안 피드백" },
  { floor: "2F", category: "Vibe Coding", name: "Vibe Coding", note: "앱 제작과 코딩" },
  { floor: "3F", category: "Automation", name: "Automation Lab", note: "n8n, Make, Zapier" },
  { floor: "4F", category: "Showcase", name: "Showcase Hall", note: "완성작 전시" }
];
const seatPlan = [
  { id: "A1", name: "창가 집중석", x: 50, y: 150 },
  { id: "A2", name: "조용한 구석석", x: 223, y: 150 },
  { id: "A3", name: "도움 데스크 근처", x: 396, y: 150 },
  { id: "A4", name: "디자인 피드백석", x: 569, y: 150 },
  { id: "B1", name: "중앙 빌드석", x: 50, y: 278 },
  { id: "B2", name: "커피챗 가능석", x: 223, y: 278 },
  { id: "B3", name: "몰입 코너석", x: 396, y: 278 },
  { id: "B4", name: "조용한 예약석", x: 569, y: 278 },
  { id: "C1", name: "상담 데스크석", x: 50, y: 398 },
  { id: "C2", name: "빠른 질문석", x: 223, y: 398 },
  { id: "C3", name: "멘토 대기석", x: 396, y: 398 },
  { id: "C4", name: "예비 좌석", x: 569, y: 398 }
];
const toolOptions = [
  "Claude",
  "Claude Code",
  "GPT",
  "ChatGPT",
  "GPT API",
  "Codex",
  "Gemini",
  "Gemini CLI",
  "Cursor",
  "Windsurf",
  "Lovable",
  "Bolt",
  "Replit",
  "v0",
  "Figma",
  "Canva",
  "Midjourney",
  "Make",
  "Zapier",
  "n8n",
  "Notion",
  "Google Sheets",
  "Gmail",
  "Slack",
  "Supabase",
  "Firebase",
  "Vercel",
  "Cloudflare"
];
const authConfig = window.AI_BUILDER_CONFIG || {};
// Fallback: If oauthProviders is empty/undefined (e.g. cached config.js), default to github & google
if (!authConfig.oauthProviders || authConfig.oauthProviders.length === 0) {
  authConfig.oauthProviders = ["github", "google"];
}
const authReady = Boolean(authConfig.supabaseUrl && authConfig.supabaseAnonKey && window.supabase);
const authClient = authReady ? window.supabase.createClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey) : null;
let currentUser = null;
let remoteReady = false;
let realtimeChannel = null;
let liveUserIds = new Set();
let seatColumnReady = true;
let currentTaskColumnReady = true;
let pomodoroTableReady = true;
let feedbackTableReady = true;
let feedbackItems = [];
let activePomo = null;
let pomoTickInterval = null;
let lastPomoAnnouncedAt = 0;
let selectedSeatId = localStorage.getItem("ai-builder-selected-seat") || "";
let isSeatCheckedIn = localStorage.getItem("ai-builder-seat-checked-in") === todayKey();
let usageLimitLogoutStarted = false;
if (localStorage.getItem("ai-builder-seat-selection-version") !== "2") {
  if (!isSeatCheckedIn) {
    selectedSeatId = "";
    localStorage.removeItem("ai-builder-selected-seat");
  }
  localStorage.setItem("ai-builder-seat-selection-version", "2");
}
let usageTimer = null;

// Premium Features Global Variables
let pomoSecondsLeft = 25 * 60;
let pomoIsRunning = false;
let pomoInterval = null;
let pomoIsBreak = false;

let audioCtx = null;
let rainNode = null, wavesNode = null, humNode = null, fireNode = null;
let rainGain = null, wavesGain = null, humGain = null, fireGain = null;
let masterGain = null;
let isMuted = false;

const seedState = {
  profile: {
    nickname: "나",
    goal: "Claude Code로 AI 작업실 MVP 만들기",
    category: "Vibe Coding",
    status: "질문 가능",
    tools: "Claude Code, GPT, Figma",
    currentTask: ""
  },
  activeRoomId: "vibe-1",
  rooms: [
    { id: "help-1", name: "B101호", category: "Prompt / Workflow", limit: 12 },
    { id: "help-2", name: "B102호", category: "Prompt / Workflow", limit: 12 },
    { id: "help-3", name: "B103호", category: "Prompt / Workflow", limit: 12 },
    { id: "design-1", name: "101호", category: "Design", limit: 8 },
    { id: "design-2", name: "102호", category: "Design", limit: 8 },
    { id: "design-3", name: "103호", category: "Design", limit: 8 },
    { id: "vibe-1", name: "201호", category: "Vibe Coding", limit: 8 },
    { id: "vibe-2", name: "202호", category: "Vibe Coding", limit: 8 },
    { id: "vibe-3", name: "203호", category: "Vibe Coding", limit: 8 },
    { id: "auto-1", name: "301호", category: "Automation", limit: 8 },
    { id: "auto-2", name: "302호", category: "Automation", limit: 8 },
    { id: "auto-3", name: "303호", category: "Automation", limit: 8 },
    { id: "show-1", name: "401호", category: "Showcase", limit: 8 },
    { id: "show-2", name: "402호", category: "Showcase", limit: 8 },
    { id: "show-3", name: "403호", category: "Showcase", limit: 8 }
  ],
  builders: [
    {
      id: "me",
      roomId: "vibe-1",
      name: "나",
      category: "Vibe Coding",
      status: "질문 가능",
      goal: "Claude Code로 AI 작업실 MVP 만들기",
      tools: "Claude Code, GPT, Figma"
    },
    {
      id: "b1",
      roomId: "vibe-1",
      name: "Jin",
      category: "Vibe Coding",
      status: "집중 중",
      goal: "Cursor로 결제 플로우 리팩터링",
      tools: "Cursor, Supabase, Stripe"
    },
    {
      id: "b2",
      roomId: "vibe-1",
      name: "Mina",
      category: "App Building",
      status: "커피챗 가능",
      goal: "Bolt로 예약 앱 첫 화면 제작",
      tools: "Bolt, Vercel, GPT"
    },
    {
      id: "b3",
      roomId: "design-1",
      name: "Leo",
      category: "Design",
      status: "질문 가능",
      goal: "AI SaaS 대시보드 디자인 시스템 정리",
      tools: "Figma, v0, Midjourney"
    },
    {
      id: "b4",
      roomId: "auto-1",
      name: "Hana",
      category: "Automation",
      status: "도움 필요",
      goal: "Gmail 문의를 Notion CRM으로 보내기",
      tools: "Make, Gmail, Notion"
    },
    {
      id: "b5",
      roomId: "help-1",
      name: "Chris",
      category: "Prompt / Workflow",
      status: "질문 가능",
      goal: "Claude Code 작업 지시 템플릿 만들기",
      tools: "Claude Code, Codex, Gemini"
    }
  ],
  helps: [
    {
      id: "h1",
      roomId: "vibe-1",
      title: "Supabase RLS 때문에 저장이 안 됩니다",
      category: "App Building",
      type: "디버깅",
      tools: "Supabase, Cursor",
      body: "insert는 성공처럼 보이는데 테이블에 row가 안 쌓여요.",
      solved: false
    },
    {
      id: "h2",
      roomId: "auto-1",
      title: "Make에서 Gmail 첨부파일을 Drive로 넘기는 법",
      category: "Automation",
      type: "자동화 로직",
      tools: "Make, Gmail, Drive",
      body: "첨부파일 배열 처리에서 계속 실패합니다.",
      solved: true
    }
  ],
  questions: [
    {
      id: "q1",
      title: "Claude Code에게 큰 리팩터링을 시킬 때 작업 단위를 어떻게 쪼개나요?",
      category: "Prompt / Workflow",
      tools: "Claude Code, Codex",
      body: "한 번에 맡기면 파일을 너무 많이 건드려서 리뷰가 어려워요.",
      solved: false
    },
    {
      id: "q2",
      title: "Figma 화면을 Lovable로 옮길 때 가장 덜 깨지는 방법?",
      category: "Design",
      tools: "Figma, Lovable",
      body: "디자인 토큰과 컴포넌트 구조를 어떻게 전달하는지 궁금합니다.",
      solved: false
    }
  ],
  showcases: [
    {
      id: "s1",
      title: "AI 고객문의 자동 분류 봇",
      category: "Automation",
      tools: "GPT, Make, Google Sheets",
      url: "",
      body: "문의 메일을 긴급/결제/기능요청으로 나눠 Slack에 보내는 자동화를 만들었습니다."
    },
    {
      id: "s2",
      title: "랜딩페이지 1시간 빌드",
      category: "Vibe Coding",
      tools: "Cursor, v0, Vercel",
      url: "",
      body: "아이디어 검증용 랜딩을 만들고 폼 제출까지 연결했습니다."
    }
  ],
  chats: [
    { id: "c1", roomId: "vibe-1", name: "Jin", text: "저는 50분 집중하고 10분 데모 공유로 가볼게요." },
    { id: "c2", roomId: "vibe-1", name: "Mina", text: "Bolt에서 auth 붙이는 분 있으면 나중에 짧게 얘기해요." }
  ]
};

const storageKey = "ai-builder-room-state";
let state = loadState();

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return structuredClone(seedState);
  try {
    const data = JSON.parse(saved);
    const defaultIds = new Set(seedState.rooms.map(r => r.id));
    const customRooms = (data.rooms || []).filter(r => !defaultIds.has(r.id) && r.id !== "app-1");
    data.rooms = [...structuredClone(seedState.rooms), ...customRooms];
    if (!data.rooms.some(r => r.id === data.activeRoomId)) {
      data.activeRoomId = "vibe-1";
    }
    return data;
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function saveActiveRoom() {
  localStorage.setItem(`${storageKey}-active-room`, state.activeRoomId);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function usageKey() {
  return `ai-builder-usage-${todayKey()}`;
}

function getUsageSeconds() {
  return Number(localStorage.getItem(usageKey()) || 0);
}

function setUsageSeconds(seconds) {
  localStorage.setItem(usageKey(), String(Math.min(seconds, dailySeatLimitSeconds)));
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}시간 ${String(minutes).padStart(2, "0")}분`;
}

function hasSeatTimeLeft() {
  if (isAdmin()) return true;
  return getUsageSeconds() < dailySeatLimitSeconds;
}

function selectedSeatButton() {
  if (!selectedSeatId) return null;
  return document.querySelector(`[data-seat-id="${selectedSeatId}"]`);
}

function selectedSeatIsEmpty() {
  return selectedSeatButton()?.dataset.builderName === "빈 자리";
}

function selectedSeatIsMine() {
  return selectedSeatButton()?.dataset.builderId === (currentUser?.id || "me");
}

function seatButtonIsOwnedByOther(seatButton) {
  const builderId = seatButton?.dataset.builderId || "";
  return Boolean(builderId && builderId !== (currentUser?.id || "me"));
}

function checkedInSeatId() {
  return isSeatCheckedIn && selectedSeatId ? selectedSeatId : null;
}

function clearSeatSelection() {
  selectedSeatId = "";
  isSeatCheckedIn = false;
  localStorage.removeItem("ai-builder-selected-seat");
  localStorage.removeItem("ai-builder-seat-checked-in");
}

async function releaseSeatForTimeLimit() {
  if (isAdmin() || usageLimitLogoutStarted) return;
  usageLimitLogoutStarted = true;
  if (remoteReady && currentUser) {
    try {
      await joinRoom(state.activeRoomId, null);
    } catch (error) {
      console.error(error);
    }
  }
  clearSeatSelection();
  alert("오늘 5시간 좌석 이용이 끝났습니다. 잠시 쉰 뒤 자리를 다시 선택해 앉아주세요.");
  renderAll();
}

function startUsageTimer() {
  clearInterval(usageTimer);
  usageTimer = setInterval(() => {
    if (!currentUser || !isSeatCheckedIn) {
      renderUsagePass();
      return;
    }
    if (!hasSeatTimeLeft()) {
      releaseSeatForTimeLimit();
      return;
    }
    const nextUsage = getUsageSeconds() + 60;
    setUsageSeconds(nextUsage);
    renderUsagePass();
    if (nextUsage >= dailySeatLimitSeconds) {
      releaseSeatForTimeLimit();
    }
  }, 60000);
}

function byId(id) {
  return document.getElementById(id);
}

function setProfileSaveNote(message, isError = false) {
  const note = byId("profileSaveNote");
  note.textContent = message;
  note.classList.toggle("error", isError);
}

function showAuth(message) {
  byId("authScreen").classList.remove("is-hidden");
  byId("appShell").classList.add("is-hidden");
  syncOAuthButtons();
  const warning = byId("authWarning");
  if (message) {
    warning.textContent = message;
    warning.classList.add("active");
  } else {
    warning.textContent = "";
    warning.classList.remove("active");
  }
}

function showApp() {
  byId("authScreen").classList.add("is-hidden");
  byId("appShell").classList.remove("is-hidden");
  byId("resetDemo").classList.toggle("is-hidden", remoteReady);
  startUsageTimer();
  if (isSeatCheckedIn && !hasSeatTimeLeft()) {
    releaseSeatForTimeLimit();
  }
}

function syncOAuthButtons() {
  const oauthProviders = authConfig.oauthProviders && authConfig.oauthProviders.length > 0
    ? authConfig.oauthProviders
    : ["github", "google"];
  const providers = new Set(oauthProviders);
  byId("githubLogin").classList.toggle("is-hidden", !providers.has("github"));
  byId("googleLogin").classList.toggle("is-hidden", !providers.has("google"));
  byId("authActions").classList.toggle("is-hidden", providers.size === 0);
}

function applyUserToProfile(user) {
  if (!user) return;
  const displayName =
    user.user_metadata?.user_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "나";

  if (!state.profile.nickname || state.profile.nickname === "나") {
    state.profile.nickname = displayName;
  }
  updateMyBuilder();
  saveState();
}

function defaultProfileFromUser(user) {
  const displayName =
    user.user_metadata?.user_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "나";

  return {
    nickname: displayName,
    goal: "오늘의 목표 미정",
    category: "Vibe Coding",
    status: "질문 가능",
    tools: "Claude Code, GPT",
    currentTask: "",
    role: "user"
  };
}

function toProfileRow() {
  const row = {
    id: currentUser.id,
    nickname: state.profile.nickname,
    goal: state.profile.goal,
    category: state.profile.category,
    status: state.profile.status,
    tools: state.profile.tools,
    updated_at: new Date().toISOString()
  };
  if (currentTaskColumnReady) row.current_task = state.profile.currentTask || "";
  return row;
}

function fromProfileRow(row) {
  if (!row) return defaultProfileFromUser(currentUser);
  return {
    nickname: row.nickname || "나",
    goal: row.goal || "오늘의 목표 미정",
    category: row.category || "Vibe Coding",
    status: row.status || "질문 가능",
    tools: row.tools || "도구 미지정",
    currentTask: row.current_task || "",
    role: row.role || "user"
  };
}

function isMissingCurrentTaskError(error) {
  return /current_task|schema cache|column/i.test(error?.message || "");
}

function isAdmin() {
  return state.profile?.role === "admin";
}

function mapHelp(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    type: row.help_type,
    tools: row.tools,
    body: row.body,
    solved: row.solved,
    createdAt: row.created_at
  };
}

function mapQuestion(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    tools: row.tools,
    body: row.body,
    solved: row.solved,
    createdAt: row.created_at
  };
}

function mapShowcase(row) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    category: row.category,
    tools: row.tools,
    url: row.url,
    body: row.body,
    createdAt: row.created_at
  };
}

function mapChat(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    name: row.profiles?.nickname || "익명",
    text: row.body,
    createdAt: row.created_at
  };
}

function inferSeatIdsFromChats(chats = state.chats) {
  const inferredSeats = new Map();
  chats.forEach((chat) => {
    const match = String(chat.text || "").match(/\b([ABC][1-4])\s*좌석에 입장했습니다/);
    if (!match || !chat.userId || !chat.roomId) return;
    if (chat.createdAt && String(chat.createdAt).slice(0, 10) !== todayKey()) return;
    inferredSeats.set(`${chat.roomId}:${chat.userId}`, match[1]);
  });
  return inferredSeats;
}

function applyInferredSeatsFromChats() {
  const inferredSeats = inferSeatIdsFromChats();
  if (!inferredSeats.size) return;
  state.builders = state.builders.map((builder) => {
    if (builder.seatId) return builder;
    const inferredSeatId = inferredSeats.get(`${builder.roomId}:${builder.id}`);
    if (!inferredSeatId || !seatPlan.some((seat) => seat.id === inferredSeatId)) return builder;
    return { ...builder, seatId: inferredSeatId };
  });
}

async function signInWithProvider(provider) {
  if (!authClient) {
    showAuth("Supabase 설정이 아직 없습니다. config.js에 supabaseUrl과 supabaseAnonKey를 넣으면 GitHub/Google 로그인이 활성화됩니다.");
    return;
  }
  const { error } = await authClient.auth.signInWithOAuth({
    provider,
    options: { redirectTo: authConfig.redirectTo || window.location.origin }
  });
  if (error) showAuth(error.message);
}

async function signInWithEmail(email) {
  if (!authClient) {
    showAuth("Supabase 설정이 아직 없습니다. config.js에 supabaseUrl과 supabaseAnonKey를 먼저 넣어주세요.");
    return;
  }
  const { error } = await authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: authConfig.redirectTo || window.location.origin
    }
  });
  if (error) {
    showAuth(error.message);
    return;
  }
  showAuth("로그인 링크를 이메일로 보냈습니다. 메일함에서 링크를 눌러 다시 들어오면 작업방이 열립니다.");
}

async function signOut() {
  if (authClient) await authClient.auth.signOut();
  currentUser = null;
  remoteReady = false;
  if (realtimeChannel) {
    try { await realtimeChannel.untrack(); } catch (error) { console.error(error); }
    authClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  liveUserIds = new Set();
  activePomo = null;
  stopPomoTicker();
  showAuth();
}

async function upsertProfile() {
  if (!remoteReady) return;
  let { error } = await authClient.from("profiles").upsert(toProfileRow());
  if (error && isMissingCurrentTaskError(error)) {
    currentTaskColumnReady = false;
    ({ error } = await authClient.from("profiles").upsert(toProfileRow()));
  }
  if (error) throw error;
}

function isMissingSeatColumnError(error) {
  return /seat_id|schema cache|column/i.test(error?.message || "");
}

function isDuplicateSeatError(error) {
  return error?.code === "23505" || /room_members_unique_room_seat|duplicate key/i.test(error?.message || "");
}

async function joinRoom(roomId = state.activeRoomId, seatId = null) {
  if (!remoteReady) return;
  const room = state.rooms.find((item) => item.id === roomId);
  const occupied = liveBuilders(roomBuilders(roomId)).filter((builder) => builder.id !== currentUser.id).length;
  if (room && occupied >= room.limit) {
    alert("이 방은 정원이 가득 찼습니다. 같은 층의 다른 방을 선택해주세요.");
    return;
  }
  const payload = {
    user_id: currentUser.id,
    room_id: roomId,
    updated_at: new Date().toISOString()
  };
  payload.seat_id = seatId || null;
  let { error } = await authClient.from("room_members").upsert(payload);
  if (error && isMissingSeatColumnError(error)) {
    seatColumnReady = false;
    if (seatId) {
      throw new Error("좌석 중복 방지를 위해 Supabase에 seat_id 컬럼 설정이 필요합니다. supabase-seat-selection.sql을 먼저 실행해주세요.");
    }
    delete payload.seat_id;
    ({ error } = await authClient.from("room_members").upsert(payload));
  }
  if (error && isDuplicateSeatError(error)) {
    await loadRemoteState();
    throw new Error("방금 다른 사용자가 이 좌석을 선택했습니다. 비어 있는 다른 좌석을 선택해주세요.");
  }
  if (error) throw error;
  trackMyPresence();
}

async function loadRemoteState() {
  const [profileRes, roomsRes, helpsRes, questionsRes, showcasesRes, chatsRes] = await Promise.all([
    authClient.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
    authClient.from("rooms").select("*").order("created_at", { ascending: true }),
    authClient.from("help_requests").select("*").order("created_at", { ascending: false }),
    authClient.from("questions").select("*").order("created_at", { ascending: false }),
    authClient.from("showcases").select("*").order("created_at", { ascending: false }),
    authClient.from("chats").select("id, room_id, user_id, body, created_at, profiles(nickname)").order("created_at", { ascending: false }).limit(200)
  ]);
  const memberProfileCols = currentTaskColumnReady
    ? "id,nickname,goal,category,status,tools,current_task"
    : "id,nickname,goal,category,status,tools";
  let membersRes = await authClient
    .from("room_members")
    .select(`room_id, seat_id, updated_at, profiles(${memberProfileCols})`)
    .order("updated_at", { ascending: false });
  if (membersRes.error && isMissingCurrentTaskError(membersRes.error)) {
    currentTaskColumnReady = false;
    membersRes = await authClient
      .from("room_members")
      .select("room_id, seat_id, updated_at, profiles(id,nickname,goal,category,status,tools)")
      .order("updated_at", { ascending: false });
  }
  if (membersRes.error && isMissingSeatColumnError(membersRes.error)) {
    seatColumnReady = false;
    const cols = currentTaskColumnReady
      ? "id,nickname,goal,category,status,tools,current_task"
      : "id,nickname,goal,category,status,tools";
    membersRes = await authClient
      .from("room_members")
      .select(`room_id, profiles(${cols})`)
      .order("updated_at", { ascending: false });
  } else {
    seatColumnReady = true;
  }

  const firstError = [profileRes, roomsRes, membersRes, helpsRes, questionsRes, showcasesRes, chatsRes].find((result) => result.error)?.error;
  if (firstError) throw firstError;

  state.profile = fromProfileRow(profileRes.data);
  const roomsPerCategory = new Map();
  state.rooms = roomsRes.data
    .map((room) => ({
      id: room.id,
      name: room.name,
      category: room.category,
      limit: room.capacity
    }))
    .filter((room) => {
      const count = roomsPerCategory.get(room.category) || 0;
      if (count >= 3) return false;
      roomsPerCategory.set(room.category, count + 1);
      return true;
    });

  const savedRoomId = localStorage.getItem(`${storageKey}-active-room`);
  state.activeRoomId = state.rooms.some((room) => room.id === savedRoomId) ? savedRoomId : state.rooms[0]?.id;

  state.builders = membersRes.data
    .filter((member) => member.profiles)
    .map((member) => ({
      id: member.profiles.id,
      roomId: member.room_id,
      name: member.profiles.nickname || "익명",
      category: member.profiles.category || "Vibe Coding",
      status: member.profiles.status || "질문 가능",
      goal: member.profiles.goal || "오늘의 목표 미정",
      tools: member.profiles.tools || "도구 미지정",
      currentTask: member.profiles.current_task || "",
      seatId: member.seat_id || "",
      updatedAt: member.updated_at || ""
    }));
  state.helps = helpsRes.data.map(mapHelp);
  state.questions = questionsRes.data.map(mapQuestion);
  state.showcases = showcasesRes.data.map(mapShowcase);
  state.chats = chatsRes.data.map(mapChat).reverse();
  applyInferredSeatsFromChats();

  const mySeat = state.builders.find((builder) => builder.id === currentUser.id && builder.roomId === state.activeRoomId)?.seatId;
  if (mySeat && seatPlan.some((seat) => seat.id === mySeat)) {
    selectedSeatId = mySeat;
    localStorage.setItem("ai-builder-selected-seat", selectedSeatId);
    isSeatCheckedIn = true;
    localStorage.setItem("ai-builder-seat-checked-in", todayKey());
  }

  await loadActivePomo();
  if (isAdmin()) await loadFeedback();
}

async function loadFeedback() {
  if (!remoteReady || !feedbackTableReady || !isAdmin()) return;
  const { data, error } = await authClient
    .from("feedback")
    .select("id, user_id, body, status, created_at, resolved_at, profiles(nickname)")
    .order("created_at", { ascending: false });
  if (error) {
    if (/feedback|schema cache|relation/i.test(error.message || "")) {
      feedbackTableReady = false;
    } else {
      console.error(error);
    }
    return;
  }
  feedbackItems = (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.profiles?.nickname || "익명",
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  }));
  renderFeedback();
}

function renderFeedback() {
  const adminPanel = byId("feedbackAdminPanel");
  const adminBadge = byId("feedbackAdminBadge");
  const list = byId("feedbackList");
  const countLabel = byId("feedbackCountLabel");
  if (!adminPanel || !list) return;
  const admin = isAdmin();
  adminPanel.hidden = !admin;
  if (adminBadge) adminBadge.hidden = !admin;
  if (!admin) return;
  if (countLabel) countLabel.textContent = `${feedbackItems.length}건`;
  if (!feedbackItems.length) {
    list.innerHTML = `<div class="feedback-empty">아직 제출된 건의가 없습니다.</div>`;
    return;
  }
  const statusLabels = { open: "신규", reviewing: "검토 중", resolved: "해결", wontfix: "보류" };
  list.innerHTML = feedbackItems.map((item) => `
    <article class="feedback-item" data-feedback-id="${escapeHtml(item.id)}">
      <header class="feedback-item-head">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="feedback-time">${escapeHtml(formatRelativeTime(item.createdAt))}</span>
      </header>
      <p class="feedback-body">${escapeHtml(item.body)}</p>
      <footer class="feedback-item-foot">
        <select class="feedback-status" data-feedback-id="${escapeHtml(item.id)}">
          ${Object.entries(statusLabels).map(([value, label]) =>
            `<option value="${value}" ${item.status === value ? "selected" : ""}>${label}</option>`
          ).join("")}
        </select>
        <button class="ghost-button feedback-delete" data-feedback-id="${escapeHtml(item.id)}">삭제</button>
      </footer>
    </article>
  `).join("");
}

async function updateFeedbackStatus(id, status) {
  if (!remoteReady || !isAdmin()) return;
  const payload = { status };
  if (status === "resolved" || status === "wontfix") payload.resolved_at = new Date().toISOString();
  else payload.resolved_at = null;
  const { error } = await authClient.from("feedback").update(payload).eq("id", id);
  if (error) alert(error.message);
}

async function deleteFeedback(id) {
  if (!remoteReady || !isAdmin()) return;
  if (!confirm("이 건의를 삭제하시겠습니까?")) return;
  const { error } = await authClient.from("feedback").delete().eq("id", id);
  if (error) alert(error.message);
}

async function submitFeedback(body) {
  const text = cleanText(body, 1000);
  if (!text) {
    setFeedbackNote("내용을 입력해주세요.");
    return false;
  }
  if (!remoteReady || !currentUser) {
    setFeedbackNote("로그인 후 제출할 수 있습니다.");
    return false;
  }
  const { error } = await authClient.from("feedback").insert({
    user_id: currentUser.id,
    body: text
  });
  if (error) {
    if (/feedback|schema cache|relation/i.test(error.message || "")) {
      feedbackTableReady = false;
      setFeedbackNote("Supabase에 feedback 테이블이 없습니다. supabase-feedback.sql을 실행해주세요.");
    } else {
      setFeedbackNote(`제출 실패: ${error.message}`);
    }
    return false;
  }
  setFeedbackNote("제출되었습니다. 관리자가 검토합니다.");
  return true;
}

function setFeedbackNote(message) {
  const el = byId("feedbackSaveNote");
  if (el) el.textContent = message || "";
}

function subscribeRemoteChanges() {
  if (!remoteReady || realtimeChannel) return;
  realtimeChannel = authClient
    .channel("ai-builder-room-live", { config: { presence: { key: currentUser.id } } })
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "room_members" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "help_requests" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "showcases" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "room_pomodoros" }, () => loadActivePomo())
    .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => loadFeedback())
    .on("presence", { event: "sync" }, handlePresenceSync)
    .on("presence", { event: "join" }, handlePresenceSync)
    .on("presence", { event: "leave" }, handlePresenceSync)
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await trackMyPresence();
      }
    });
}

function handlePresenceSync() {
  if (!realtimeChannel) return;
  const presenceState = realtimeChannel.presenceState() || {};
  const nextLive = new Set();
  Object.keys(presenceState).forEach((key) => {
    const entries = presenceState[key] || [];
    const userId = entries[0]?.user_id || key;
    if (userId) nextLive.add(userId);
  });
  liveUserIds = nextLive;
  renderAll();
}

async function trackMyPresence() {
  if (!realtimeChannel || !currentUser) return;
  try {
    await realtimeChannel.track({
      user_id: currentUser.id,
      room_id: state.activeRoomId,
      seat_id: checkedInSeatId() || null,
      online_at: new Date().toISOString()
    });
  } catch (error) {
    console.error("[presence] track failed", error);
  }
}

let refreshTimer = null;
function refreshRemote() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    try {
      await loadRemoteState();
      renderAll();
    } catch (error) {
      console.error(error);
    }
  }, 250);
}

async function bootAppForUser(user) {
  currentUser = user;
  usageLimitLogoutStarted = false;
  try {
    remoteReady = true;
    await loadRemoteState();
    await upsertProfile();
    if (!state.builders.some((builder) => builder.id === currentUser.id)) {
      await joinRoom(state.activeRoomId, checkedInSeatId());
      updateMyBuilder();
      await loadRemoteState();
    }
    subscribeRemoteChanges();
  } catch (error) {
    remoteReady = false;
    console.error(error);
    applyUserToProfile(user);
    alert("Supabase DB 테이블이 아직 준비되지 않았습니다. README의 SQL 스키마를 먼저 실행해주세요.");
  }
  showApp();
  renderAll();
}

async function initAuth() {
  if (!authReady) {
    showAuth("로그인 화면은 준비됐지만 Supabase 연결값이 비어 있습니다. 실제 사용자 인증을 쓰려면 config.js 설정이 필요합니다.");
    return;
  }

  const { data, error } = await authClient.auth.getSession();
  if (error) {
    showAuth(error.message);
    return;
  }

  const user = data.session?.user || null;
  if (!user) {
    showAuth();
    return;
  }

  await bootAppForUser(user);

  authClient.auth.onAuthStateChange((_event, session) => {
    const nextUser = session?.user || null;
    if (nextUser) {
      bootAppForUser(nextUser);
    } else {
      currentUser = null;
      remoteReady = false;
      showAuth();
    }
  });
}

function fillSelect(select, options, value, labels = {}) {
  select.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option)}" ${option === value ? "selected" : ""}>${escapeHtml(labels[option] || option)}</option>`)
    .join("");
}

function parseTools(value) {
  return String(value || "")
    .split(",")
    .map((tool) => tool.trim())
    .filter(Boolean);
}

function renderToolPicker(pickerId, input, selectedValue = "") {
  const picker = byId(pickerId);
  if (!picker || !input) return;
  const selected = new Set(parseTools(selectedValue));
  input.value = [...selected].join(", ");
  picker.innerHTML = `
    <details class="tool-dropdown">
      <summary>
        <span class="tool-summary">${escapeHtml(formatToolSummary([...selected]))}</span>
        <span class="tool-chevron">⌄</span>
      </summary>
      <div class="tool-options">
        ${toolOptions
          .map(
            (tool) => `
              <label class="tool-option">
                <input type="checkbox" value="${escapeHtml(tool)}" ${selected.has(tool) ? "checked" : ""} />
                <span>${escapeHtml(tool)}</span>
              </label>
            `
          )
          .join("")}
      </div>
    </details>
  `;
}

function formatToolSummary(selected) {
  if (!selected.length) return "도구를 선택하세요";
  if (selected.length <= 3) return selected.join(", ");
  return `${selected.slice(0, 3).join(", ")} 외 ${selected.length - 3}개`;
}

function refreshToolPicker(picker, input) {
  const selected = [...picker.querySelectorAll("input:checked")].map((item) => item.value);
  input.value = selected.join(", ");
  picker.querySelector(".tool-summary").textContent = formatToolSummary(selected);
}

function syncModalToolPickers() {
  if (document.activeElement?.closest(".modal")) return;
  renderToolPicker("helpToolPicker", document.querySelector("#helpForm input[name='tools']"), state.profile.tools);
  renderToolPicker("questionToolPicker", document.querySelector("#questionForm input[name='tools']"), state.profile.tools);
  renderToolPicker("showcaseToolPicker", document.querySelector("#showcaseForm input[name='tools']"), state.profile.tools);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function requiredText(value, maxLength, label) {
  const text = cleanText(value, maxLength);
  if (!text) throw new Error(`${label}을(를) 입력해주세요.`);
  return text;
}

function safeExternalUrl(value) {
  const raw = cleanText(value, 500);
  if (!raw) return "";
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("링크는 https:// 또는 http://로 시작하는 올바른 URL만 사용할 수 있습니다.");
  }
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("링크는 https:// 또는 http:// 주소만 허용됩니다.");
  }
  return url.href;
}

function renderSafeExternalUrl(value) {
  try {
    return safeExternalUrl(value);
  } catch {
    return "";
  }
}

function initials(name) {
  return name.trim().slice(0, 2).toUpperCase() || "AI";
}

function shortText(value, max = 24) {
  const text = String(value || "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function primaryTool(value) {
  return parseTools(value)[0] || "AI";
}

function hasValidGoal() {
  const goal = String(state.profile.goal || "").trim();
  return Boolean(goal) && goal !== "오늘의 목표 미정";
}

function goalPresetValue(goal) {
  if (!goal || goal === "오늘의 목표 미정") return "";
  return goalOptions.includes(goal) ? goal : "custom";
}

function roomThemeClass(category) {
  const slug = {
    "Vibe Coding": "vibe",
    "App Building": "app",
    Design: "design",
    Automation: "automation",
    "Prompt / Workflow": "help",
    Showcase: "showcase"
  }[category];
  return `theme-${slug || "vibe"}`;
}

function roomThemeLabel(category) {
  return {
    "Vibe Coding": "VIBE CODING LAB",
    "App Building": "APP BUILD ROOM",
    Design: "DESIGN STUDIO",
    Automation: "AUTOMATION LAB",
    "Prompt / Workflow": "HELP DESK",
    Showcase: "SHOWCASE HALL"
  }[category] || "AI BUILDER ROOM";
}

function levelFromXp(xp) {
  let level = 1;
  let spent = 0;
  while (level < 100) {
    const needed = xpForNextLevel(level);
    if (xp < spent + needed) break;
    spent += needed;
    level += 1;
  }
  const next = level >= 100 ? 0 : xpForNextLevel(level);
  const intoLevel = level >= 100 ? 0 : Math.max(0, xp - spent);
  return {
    level,
    intoLevel,
    next,
    progress: level >= 100 ? 100 : Math.min(100, Math.round((intoLevel / next) * 100))
  };
}

function xpForNextLevel(level) {
  return 80 + level * 20;
}

function titleForLevel(level) {
  if (level >= 90) return "Studio Legend";
  if (level >= 75) return "AI Mentor";
  if (level >= 60) return "Workflow Architect";
  if (level >= 45) return "Problem Solver";
  if (level >= 30) return "Ship Maker";
  if (level >= 15) return "Active Builder";
  if (level >= 5) return "Rising Builder";
  return "New Builder";
}

function calculateBuilderXp(targetId) {
  const myId = targetId || currentUser?.id || "me";
  const myProfile = state.builders.find((builder) => builder.id === myId);
  
  // Use DB/Local state based on correct user fields
  const myHelpRequests = state.helps.filter((help) => (help.userId === myId || help.user_id === myId));
  const solvedRequests = myHelpRequests.filter((help) => help.solved);
  
  const myQuestions = state.questions.filter((question) => (question.userId === myId || question.user_id === myId));
  const solvedQuestions = myQuestions.filter((question) => question.solved);
  
  const myShowcases = state.showcases.filter((item) => (item.userId === myId || item.user_id === myId));
  const myChats = state.chats.filter((chat) => (chat.userId === myId || chat.user_id === myId));
  
  const helpSignals = myChats.filter((chat) => chat.text && chat.text.includes("도움 요청을 도울 수 있다고 했습니다"));
  const coffeeSignals = myChats.filter((chat) => chat.text && chat.text.includes("커피챗을 요청했습니다"));
  
  let profileNickname = "";
  let profileGoal = "";
  let profileCategory = "";
  let profileStatus = "";
  let profileTools = "";
  
  if (myId === (currentUser?.id || "me")) {
    profileNickname = state.profile.nickname;
    profileGoal = state.profile.goal;
    profileCategory = state.profile.category;
    profileStatus = state.profile.status;
    profileTools = state.profile.tools;
  } else if (myProfile) {
    profileNickname = myProfile.name;
    profileGoal = myProfile.goal;
    profileCategory = myProfile.category;
    profileStatus = myProfile.status;
    profileTools = myProfile.tools;
  }
  
  const profileBonus = [profileNickname, profileGoal, profileCategory, profileStatus, profileTools].filter(Boolean).length * 5;
  const activeBonus = myProfile ? 10 : 0;

  const xp =
    profileBonus +
    activeBonus +
    myHelpRequests.length * 15 +
    solvedRequests.length * 40 +
    myQuestions.length * 12 +
    solvedQuestions.length * 25 +
    myShowcases.length * 35 +
    Math.min(myChats.length, 80) * 2 +
    helpSignals.length * 25 +
    coffeeSignals.length * 10;

  return {
    xp,
    helpSignals: helpSignals.length,
    solved: solvedRequests.length + solvedQuestions.length,
    showcases: myShowcases.length
  };
}

function activeRoom() {
  return state.rooms.find((room) => room.id === state.activeRoomId) || state.rooms[0];
}

function roomBuilders(roomId = state.activeRoomId) {
  return state.builders.filter((builder) => builder.roomId === roomId);
}

function isBuilderLive(builder) {
  if (!builder) return false;
  if (builder.id === "me" || builder.id === currentUser?.id) return true;
  return liveUserIds.has(builder.id);
}

function liveBuilders(builders = state.builders) {
  return builders.filter(isBuilderLive);
}

function seatedBuilders(builders = state.builders) {
  return builders.filter((builder) => Boolean(builder.seatId) && isBuilderLive(builder));
}

function builderSeatTime(builder) {
  const isMe = builder?.id === "me" || (currentUser && builder?.id === currentUser.id);
  if (isMe) {
    const used = getUsageSeconds();
    return {
      label: isAdmin() ? "무제한" : `${formatDuration(Math.max(0, dailySeatLimitSeconds - used))} 남음`,
      detail: isAdmin() ? "관리자 계정은 시간 제한이 없습니다." : `오늘 ${formatDuration(used)} 사용`,
      percent: isAdmin() ? 100 : Math.max(0, Math.min(100, Math.round(((dailySeatLimitSeconds - used) / dailySeatLimitSeconds) * 100)))
    };
  }

  if (!builder?.seatId) {
    return {
      label: "좌석 미선택",
      detail: "방에는 입장했지만 아직 좌석에 앉지 않았습니다.",
      percent: 0
    };
  }

  const updatedAt = builder.updatedAt ? new Date(builder.updatedAt).getTime() : 0;
  if (!updatedAt || Number.isNaN(updatedAt)) {
    return {
      label: "착석 중",
      detail: "남은 시간은 좌석 갱신 후 표시됩니다.",
      percent: 100
    };
  }

  const elapsed = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
  const remaining = Math.max(0, dailySeatLimitSeconds - elapsed);
  return {
    label: `${formatDuration(remaining)} 남음`,
    detail: "상대방의 좌석 갱신 시각 기준 추정입니다.",
    percent: Math.max(0, Math.min(100, Math.round((remaining / dailySeatLimitSeconds) * 100)))
  };
}

function roomStats(roomId) {
  const builders = roomBuilders(roomId);
  return {
    entered: liveBuilders(builders).length,
    seated: seatedBuilders(builders).length
  };
}

function syncProfileInputs(force = false) {
  if (!force && document.activeElement?.closest(".profile-panel")) {
    syncModalToolPickers();
    return;
  }
  byId("nicknameInput").value = state.profile.nickname;
  byId("goalInput").value = state.profile.goal;
  if (byId("currentTaskInput")) byId("currentTaskInput").value = state.profile.currentTask || "";
  fillSelect(byId("goalPresetInput"), ["", ...goalOptions, "custom"], goalPresetValue(state.profile.goal), {
    "": "목표를 선택하세요",
    custom: "직접 입력"
  });
  fillSelect(byId("categoryInput"), categories, state.profile.category);
  fillSelect(byId("statusInput"), statuses, state.profile.status);
  byId("toolsInput").value = state.profile.tools;
  renderToolPicker("profileToolPicker", byId("toolsInput"), state.profile.tools);
  syncModalToolPickers();

  document.querySelectorAll("select[name='category']").forEach((select) => {
    fillSelect(select, categories, state.profile.category);
  });
}

function renderRooms() {
  const active = activeRoom();
  const filteredRooms = state.rooms.filter((room) => room.category === active.category);
  byId("roomsList").innerHTML = filteredRooms
    .map((room) => {
      const stats = roomStats(room.id);
      return `
        <button class="room-card ${room.id === active.id ? "active" : ""}" data-room-id="${room.id}">
          <strong>${escapeHtml(roomDisplayName(room))}</strong>
          <span>${escapeHtml(room.category)} · ${stats.entered}명 입장 · ${stats.seated}/${room.limit} 착석</span>
        </button>
      `;
    })
    .join("");
  document.querySelectorAll("[data-room-select]").forEach((roomSelect) => {
    roomSelect.innerHTML = state.rooms
      .map((room) => {
        const stats = roomStats(room.id);
        return `<option value="${escapeHtml(room.id)}" ${room.id === active.id ? "selected" : ""}>${escapeHtml(roomDisplayName(room))} · ${stats.seated}/${room.limit} 착석 · ${stats.entered}명 입장</option>`;
      })
      .join("");
  });

  byId("activeRoomType").textContent = active.category;
  byId("activeRoomName").textContent = roomDisplayName(active);
  const activeRoomBuilders = roomBuilders(active.id);
  byId("activeRoomEntered").textContent = liveBuilders(activeRoomBuilders).length;
  byId("activeRoomSeated").textContent = seatedBuilders(activeRoomBuilders).length;
  byId("activeRoomLimit").textContent = active.limit;
}

function renderFloors() {
  const active = activeRoom();
  byId("floorGrid").innerHTML = floorPlan
    .map((floor) => {
      const floorRooms = state.rooms.filter((item) => item.category === floor.category);
      const room = floorRooms[0];
      const isActive = active?.category === floor.category;
      const viewTarget = floor.category === "Showcase" ? "showcase" : "";
      const slots = [];
      for (let index = 0; index < 3; index++) {
        const floorRoom = floorRooms[index];
        if (floorRoom) {
          const stats = roomStats(floorRoom.id);
          const roomClass = floorRoom.id === active?.id ? "active" : stats.seated >= floorRoom.limit ? "full" : stats.seated > 0 ? "used" : "";
          slots.push(`<span class="floor-room-chip ${roomClass}" title="${escapeHtml(roomDisplayName(floorRoom))} · ${stats.seated}/${floorRoom.limit} 착석 · ${stats.entered}명 입장">${escapeHtml(roomDisplayName(floorRoom))}</span>`);
        } else {
          const placeholderLabel = floorGuideRoomNumber("", floor.floor, index);
          slots.push(`<span class="floor-room-chip pending" title="DB에 아직 방이 없습니다. supabase-seed-rooms.sql 실행 권장.">${escapeHtml(placeholderLabel)}</span>`);
        }
      }
      const roomStatus = slots.join("");
      const statusDot = `<span class="floor-room-status">${roomStatus}</span>`;
      const showcaseBadge = floor.category === "Showcase"
        ? `<span class="floor-room-status showcase">전시 ${state.showcases ? state.showcases.length : 0}개</span>`
        : "";
      
      return `
        <button class="floor-card ${isActive ? "active" : ""}" data-floor-room-id="${escapeHtml(room?.id || "")}" data-floor-view="${escapeHtml(viewTarget)}" ${room || viewTarget ? "" : "disabled"}>
          <div class="floor-card-header">
            <strong>${escapeHtml(floor.floor)}</strong>
            <span class="floor-name">${escapeHtml(floor.name)}</span>
          </div>
          ${statusDot}
          ${showcaseBadge}
          <span class="floor-note">${escapeHtml(floor.note)}</span>
        </button>
      `;
    })
    .join("");
}

function floorGuideRoomNumber(roomName, floorLabel, index) {
  const roomCode = String(roomName || "").match(/\bB?\d{3}\b/i)?.[0];
  if (roomCode) return `${roomCode.toUpperCase()}호`;
  if (floorLabel === "B1") return `B${101 + index}호`;
  const floorNumber = Number.parseInt(floorLabel, 10);
  if (Number.isFinite(floorNumber)) return `${floorNumber * 100 + index + 1}호`;
  return `${index + 1}호`;
}

function roomDisplayName(room) {
  if (!room) return "";
  const floor = floorPlan.find((f) => f.category === room.category);
  if (!floor) return room.name;
  const siblings = state.rooms.filter((item) => item.category === room.category);
  const index = siblings.findIndex((item) => item.id === room.id);
  return floorGuideRoomNumber(room.name, floor.floor, Math.max(0, index));
}

function renderBuilders() {
  const room = activeRoom();
  const builders = roomBuilders(room.id);
  const themeClass = roomThemeClass(room.category);
  const themeLabel = roomThemeLabel(room.category);
  const occupants = new Map();
  const visibleSeats = seatPlan.slice(0, room.limit);
  const validSeats = new Set(visibleSeats.map((seat) => seat.id));
  builders.forEach((builder) => {
    const fallbackSeatId =
      builder.id === (currentUser?.id || "me") && isSeatCheckedIn && selectedSeatId
        ? selectedSeatId
        : "";
    const seatId = builder.seatId || fallbackSeatId;
    if (seatId && validSeats.has(seatId) && !occupants.has(seatId)) {
      occupants.set(seatId, builder);
    }
  });

  byId("builderGrid").innerHTML = `
    <div class="cafe-room game-room ${themeClass}">
      <div class="map-zone zone-wood"></div>
      <div class="room-wall wall-top"></div>
      <div class="room-wall wall-left"></div>
      <div class="room-theme-sign">${escapeHtml(themeLabel)}</div>
      <div class="ambient-dust-container">
        <span class="dust-particle" style="left:12%; top:24%; --delay:0s; --dur:8s;"></span>
        <span class="dust-particle" style="left:45%; top:15%; --delay:1.5s; --dur:10s;"></span>
        <span class="dust-particle" style="left:82%; top:30%; --delay:3s; --dur:7s;"></span>
        <span class="dust-particle" style="left:28%; top:65%; --delay:0.8s; --dur:12s;"></span>
        <span class="dust-particle" style="left:60%; top:80%; --delay:2.2s; --dur:9s;"></span>
        <span class="dust-particle" style="left:88%; top:70%; --delay:4.5s; --dur:11s;"></span>
        <span class="dust-particle" style="left:15%; top:48%; --delay:1.9s; --dur:9.5s;"></span>
      </div>
      <div class="cafe-prop prop-bookcase prop-bookcase-left"><span></span></div>
      <div class="cafe-prop prop-bookcase prop-bookcase-mid"><span></span></div>
      <div class="cafe-prop prop-bookcase prop-bookcase-right"><span></span></div>
      <div class="cafe-prop prop-plant prop-plant-left"><span></span></div>
      <div class="cafe-prop prop-plant prop-plant-mid"><span></span></div>
      <div class="cafe-prop prop-plant prop-plant-right"><span></span></div>
      <div class="cafe-prop prop-boxes"><span></span></div>
      <div class="cafe-prop prop-clock"><span></span></div>
      <div class="cafe-prop prop-window"><span></span></div>
      <div class="cafe-prop prop-help"><span>HELP</span></div>
      <div class="cafe-prop prop-showcase"><span>SHOWCASE</span></div>
      <div class="cafe-prop prop-theme prop-theme-one"><span></span></div>
      <div class="cafe-prop prop-theme prop-theme-two"><span></span></div>
      <div class="entry-gate"><span>SCAN PASS</span></div>
      <div class="quiet-sign">정숙 · 집중 · 공유</div>
      <div class="main-aisle"></div>
      ${seatPlan
        .slice(0, room.limit)
        .map((seat) => {
          const builder = occupants.get(seat.id);
          const selected = Boolean(selectedSeatId) && seat.id === selectedSeatId;
          const empty = !builder;
          const statusIcon = builder?.status === "도움 필요" ? "!" : builder?.status === "커피챗 가능" ? "☕" : builder ? "◐" : "";
          const statusClass = builder?.status === "도움 필요" ? "help" : builder?.status === "커피챗 가능" ? "coffee" : builder ? "focus" : "empty";
          const displayName = builder?.name || "Available";
          const tool = builder ? primaryTool(builder.tools) : "Open";
          const bubbleText = builder ? shortText(builder.currentTask || builder.goal, 22) : "빈 좌석";
      const hue = builder ? (function() {
        let hash = 0;
        for (let i = 0; i < tool.length; i++) {
          hash = tool.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 360;
      })() : 200;

      return `
        <button class="seat-button ${statusClass} ${empty ? "empty" : ""} ${selected ? "selected" : ""}"
          style="left:${seat.x}px; top:${seat.y}px; --tool-color: hsl(${hue}, 65%, 52%);"
          title="${empty ? "입장 가능한 빈 좌석입니다." : builder?.id === (currentUser?.id || "me") ? "내 좌석입니다." : "사용 중인 좌석입니다. 정보만 볼 수 있습니다."}"
          data-seat-id="${escapeHtml(seat.id)}"
          data-seat-name="${escapeHtml(seat.name)}"
          data-builder-id="${escapeHtml(builder?.id || "")}"
          data-builder-name="${escapeHtml(builder?.name || "빈 자리")}"
          data-builder-goal="${escapeHtml(builder?.goal || "이 좌석을 선택해 오늘의 작업을 시작하세요.")}"
          data-builder-tools="${escapeHtml(builder?.tools || "-")}"
          data-builder-status="${escapeHtml(builder?.status || "사용 가능")}">
          <span class="seat-speech">${escapeHtml(bubbleText)}</span>
          <span class="seat-label">${escapeHtml(seat.id)}</span>
          <span class="seat-desk">
            <span class="seat-laptop"></span>
            <span class="seat-keyboard"></span>
            <span class="seat-avatar">
              <span class="avatar-hair"></span>
              <span class="avatar-face">${empty ? "" : escapeHtml(initials(builder.name))}</span>
              <span class="avatar-body"></span>
            </span>
            <span class="seat-status">${escapeHtml(statusIcon)}</span>
          </span>
          <span class="seat-tool">${escapeHtml(tool)}</span>
          <span class="seat-name">${escapeHtml(displayName)}</span>
        </button>
      `;
        })
        .join("")}
    </div>
  `;
  fitRoomMap();
  renderSelectedSeat();
}

function fitRoomMap() {
  const grid = byId("builderGrid");
  const room = grid?.querySelector(".cafe-room");
  if (!grid || !room) return;
  const roomWidth = 760;
  const roomHeight = 560;
  const gridTop = grid.getBoundingClientRect().top;
  const viewportReserve = window.matchMedia("(min-width: 721px)").matches ? 150 : 0;
  const availableHeight = Math.max(300, window.innerHeight - gridTop - viewportReserve);
  const scale = Math.min(2.4, grid.clientWidth / roomWidth, availableHeight / roomHeight);
  const fittedHeight = Math.ceil(roomHeight * scale);
  room.style.transform = `scale(${scale})`;
  room.style.marginLeft = `${Math.max(0, Math.floor((grid.clientWidth - roomWidth * scale) / 2))}px`;
  grid.style.height = `${fittedHeight}px`;
  grid.style.minHeight = `${fittedHeight}px`;
}

function renderHelp() {
  const roomHelps = state.helps.filter((help) => help.roomId === state.activeRoomId);
  const myId = currentUser?.id || "me";
  byId("roomHelpList").innerHTML =
    roomHelps
      .map((help) => {
        const canSolve = !remoteReady || help.userId === myId;
        return `
          <article class="compact-item">
            <strong>${escapeHtml(help.title)}</strong>
            <p>${escapeHtml(help.body)}</p>
            <div class="meta-row">
              <span class="tag">${escapeHtml(help.category)}</span>
              <span class="tag">${escapeHtml(help.type)}</span>
              <span class="tag">${escapeHtml(help.tools || "도구 미지정")}</span>
              <span class="tag ${help.solved ? "solved" : ""}">${help.solved ? "해결됨" : "미해결"}</span>
            </div>
            <div class="card-actions">
              <button class="small-button" data-help-action="offer" data-help-id="${escapeHtml(help.id)}">도울게요</button>
              <button class="small-button" data-help-action="solve" data-help-id="${escapeHtml(help.id)}" ${help.solved || !canSolve ? "disabled" : ""}>해결됨</button>
              ${adminDeleteButton("help_requests", help.id)}
            </div>
          </article>
        `;
      })
      .join("") || `
      <article class="compact-item empty-state">
        <strong>아직 도움 요청이 없습니다.</strong>
        <p>막힌 지점이 있다면 첫 요청을 남겨보세요.</p>
        <button class="small-button" data-open-modal="helpModal">도움 요청하기</button>
      </article>`;
}

function renderChats() {
  const chats = state.chats.filter((chat) => chat.roomId === state.activeRoomId);
  byId("chatList").innerHTML =
    chats
      .map(
        (chat) => `
          <article class="chat-item">
            <p><strong>${escapeHtml(chat.name)}</strong> ${escapeHtml(chat.text)}</p>
            ${isAdmin() ? `<div class="card-actions">${adminDeleteButton("chats", chat.id)}</div>` : ""}
          </article>
        `
      )
      .join("") || `<article class="chat-item empty-state"><p>첫 공유를 남겨보세요. 지금 작업 중인 내용을 짧게 남기면 됩니다.</p></article>`;
}

function renderQuestions() {
  const myId = currentUser?.id || "me";
  byId("qaList").innerHTML = state.questions
    .map((question) => {
      const canSolve = !remoteReady || question.userId === myId;
      return `
        <article class="content-card">
          <h4>${escapeHtml(question.title)}</h4>
          <p>${escapeHtml(question.body)}</p>
          <div class="meta-row">
            <span class="tag">${escapeHtml(question.category)}</span>
            <span class="tag">${escapeHtml(question.tools || "도구 미지정")}</span>
            <span class="tag ${question.solved ? "solved" : ""}">${question.solved ? "해결됨" : "미해결"}</span>
          </div>
          <div class="card-actions">
            <button class="small-button" data-question-action="solve" data-question-id="${escapeHtml(question.id)}" ${question.solved || !canSolve ? "disabled" : ""}>해결됨</button>
            ${adminDeleteButton("questions", question.id)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderShowcases() {
  byId("showcaseList").innerHTML = state.showcases
    .map(
      (item) => `
        <article class="content-card">
          <h4>${escapeHtml(item.title)}</h4>
          <p>${escapeHtml(item.body)}</p>
          ${renderSafeExternalUrl(item.url) ? `<a href="${escapeHtml(renderSafeExternalUrl(item.url))}" target="_blank" rel="noopener noreferrer">결과물 보기</a>` : ""}
          <div class="meta-row">
            <span class="tag">${escapeHtml(item.category)}</span>
            <span class="tag">${escapeHtml(item.tools || "도구 미지정")}</span>
          </div>
          ${isAdmin() ? `<div class="card-actions">${adminDeleteButton("showcases", item.id)}</div>` : ""}
        </article>
      `
    )
    .join("");
}

function adminDeleteButton(table, id) {
  if (!isAdmin() || !id) return "";
  return `<button class="small-button admin-delete" data-admin-delete-table="${escapeHtml(table)}" data-admin-delete-id="${escapeHtml(id)}" title="관리자 삭제">🗑️ 삭제</button>`;
}

const ADMIN_DELETE_TABLES = new Set(["chats", "help_requests", "questions", "showcases"]);

async function adminDeleteRow(table, id) {
  if (!remoteReady) return;
  if (!ADMIN_DELETE_TABLES.has(table)) throw new Error("허용되지 않은 테이블입니다.");
  if (typeof id !== "string" || !id) throw new Error("유효하지 않은 id 입니다.");
  const { error } = await authClient.from(table).delete().eq("id", id);
  if (error) throw error;
  await loadRemoteState();
}

function renderCoffeeMatches() {
  const profile = state.profile;
  const candidates = state.builders
    .filter((builder) => builder.id !== (currentUser?.id || "me"))
    .map((builder) => {
      const score =
        (builder.category === profile.category ? 2 : 0) +
        (builder.status === "커피챗 가능" ? 2 : 0) +
        (builder.tools.toLowerCase().split(",").some((tool) => profile.tools.toLowerCase().includes(tool.trim())) ? 1 : 0);
      return { ...builder, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  byId("coffeeMatches").innerHTML = candidates.length
    ? candidates
    .map(
      (match) => `
        <article class="match-item">
          <strong>${escapeHtml(match.name)} · ${escapeHtml(match.category)}</strong>
          <p>${escapeHtml(match.goal)}</p>
          <div class="meta-row">
            <span class="tag">${escapeHtml(match.status)}</span>
            <span class="tag">${escapeHtml(match.tools)}</span>
          </div>
          <div class="card-actions">
            <button class="small-button" data-coffee-id="${escapeHtml(match.id)}">커피챗 요청</button>
          </div>
        </article>
      `
    )
    .join("")
    : `<article class="match-item"><p>지금 커피챗 가능한 다른 작업자가 없습니다. 상태를 '커피챗 가능'으로 바꾸고 잠시 뒤 다시 확인해보세요.</p></article>`;
}

function renderMetrics() {
  const helpCount = state.helps.length;
  const solvedCount = state.helps.filter((help) => help.solved).length;
  byId("metricEntered").textContent = liveBuilders().length;
  byId("metricSeated").textContent = seatedBuilders().length;
  byId("metricHelp").textContent = helpCount;
  byId("metricSolved").textContent = helpCount ? `${Math.round((solvedCount / helpCount) * 100)}%` : "0%";
}

function renderProfilePreview() {
  const category = byId("categoryInput")?.value || state.profile.category;
  const status = byId("statusInput")?.value || state.profile.status;
  const tools = formatToolSummary(parseTools(byId("toolsInput")?.value || state.profile.tools));
  const preview = byId("profilePreview");
  preview.textContent = `${status || "상태 미정"} · ${category || "카테고리 미정"} · ${tools}`;
  if (isAdmin()) {
    const badge = document.createElement("span");
    badge.className = "admin-badge";
    badge.textContent = "관리자";
    preview.appendChild(badge);
  }
}

function renderFlowGuide() {
  const steps = {
    goal: hasValidGoal(),
    floor: Boolean(activeRoom()),
    seat: Boolean(selectedSeatId),
    enter: isSeatCheckedIn
  };
  const flowSteps = [...document.querySelectorAll(".flow-step")];
  const firstOpen = flowSteps.find((step) => !steps[step.dataset.step]);
  flowSteps.forEach((step) => {
    const done = Boolean(steps[step.dataset.step]);
    step.classList.toggle("done", done);
    step.classList.toggle("current", step === firstOpen);
  });
}

function renderUsagePass() {
  const used = getUsageSeconds();
  const admin = isAdmin();
  const percent = admin ? 100 : Math.min(100, Math.round((used / dailySeatLimitSeconds) * 100));
  const today = new Date();
  byId("passDate").textContent = today.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
  byId("passGoal").textContent = state.profile.goal || "오늘의 목표를 입력하고 좌석을 선택하세요.";
  byId("usageToday").textContent = admin ? `${formatDuration(used)} · 무제한` : `${formatDuration(used)} / 5시간`;
  byId("usageBarFill").style.width = `${percent}%`;
  byId("usageNote").textContent = admin
    ? "관리자 계정은 좌석 시간 제한 없이 이용할 수 있습니다."
    : hasSeatTimeLeft()
      ? isSeatCheckedIn
        ? "좌석 이용 중입니다. 1분 단위로 시간이 기록됩니다."
        : "좌석에 앉으면 이용 시간이 기록됩니다."
      : "오늘 무료 좌석 이용 시간이 끝났습니다. Q&A와 쇼케이스는 계속 볼 수 있어요.";
}

function renderSelectedSeat() {
  const seat = seatPlan.find((item) => item.id === selectedSeatId);
  const statePill = byId("selectedSeatStatus");
  const coffeeButton = byId("seatCoffeeButton");
  if (!seat) {
    byId("selectedSeatTitle").textContent = "좌석을 선택하세요";
    byId("selectedSeatCopy").textContent = "원하는 좌석을 먼저 누른 뒤 입장하면 캐릭터가 그 자리로 이동합니다.";
    statePill.className = "seat-state-pill blocked";
    statePill.textContent = "선택 필요";
    byId("sitSeatButton").textContent = "좌석 선택 필요";
    byId("sitSeatButton").disabled = true;
    byId("mobileSitSeatButton").textContent = byId("sitSeatButton").textContent;
    byId("mobileSitSeatButton").disabled = true;
    coffeeButton.disabled = true;
    coffeeButton.classList.add("is-hidden");
    return;
  }
  const selectedButton = document.querySelector(`[data-seat-id="${seat.id}"]`);
  const occupiedName = selectedButton?.dataset.builderName || "빈 자리";
  const status = selectedButton?.dataset.builderStatus || "사용 가능";
  const isMine = selectedSeatIsMine();
  const isEmpty = occupiedName === "빈 자리";
  const goalReady = hasValidGoal();
  byId("selectedSeatTitle").textContent = `${seat.id} · ${seat.name}`;
  byId("selectedSeatCopy").textContent =
    !goalReady
      ? "오늘의 목표를 먼저 선택해야 좌석에 입장할 수 있습니다."
      :
    isEmpty
      ? "사용 가능한 좌석입니다. 오늘의 작업권으로 입장할 수 있습니다."
      : `${occupiedName} · ${status} · ${selectedButton?.dataset.builderGoal || ""}`;
  statePill.className = "seat-state-pill";
  if (!goalReady) {
    statePill.textContent = "목표 필요";
    statePill.classList.add("blocked");
  } else if (!hasSeatTimeLeft()) {
    statePill.textContent = "이용 시간 종료";
    statePill.classList.add("blocked");
  } else if (isMine) {
    statePill.textContent = "내 좌석";
    statePill.classList.add("mine");
  } else if (isEmpty) {
    statePill.textContent = "입장 가능";
  } else {
    statePill.textContent = "사용 중";
    statePill.classList.add("busy");
  }
  byId("sitSeatButton").textContent = isMine ? "내 좌석 입장" : isEmpty ? "이 자리에 앉기" : "좌석 정보 보기";
  byId("sitSeatButton").disabled = !goalReady || !hasSeatTimeLeft() || (!isEmpty && !isMine);
  byId("mobileSitSeatButton").textContent = byId("sitSeatButton").textContent;
  byId("mobileSitSeatButton").disabled = byId("sitSeatButton").disabled;
  coffeeButton.disabled = isEmpty || isMine || !hasSeatTimeLeft();
  coffeeButton.classList.toggle("is-hidden", isEmpty || isMine);
  
  // Trigger smooth slide-up animation on selection change
  const seatInfo = byId("seatInfo");
  if (seatInfo) {
    seatInfo.style.animation = 'none';
    seatInfo.offsetHeight; // trigger reflow
    seatInfo.style.animation = '';
  }
}

function renderLevel() {
  const stats = calculateBuilderXp();
  const level = levelFromXp(stats.xp);
  byId("builderLevel").textContent = `Lv. ${level.level}`;
  byId("builderTitle").textContent = titleForLevel(level.level);
  byId("builderXp").textContent = `${stats.xp.toLocaleString()} XP`;
  byId("nextLevelXp").textContent = level.level >= 100 ? "최고 레벨" : `다음 레벨까지 ${(level.next - level.intoLevel).toLocaleString()} XP`;
  byId("xpBarFill").style.width = `${level.progress}%`;
  byId("statHelpGiven").textContent = stats.helpSignals;
  byId("statSolved").textContent = stats.solved;
  byId("statShowcase").textContent = stats.showcases;
}

function renderAll(options = {}) {
  syncProfileInputs(Boolean(options.forceProfileSync));
  renderProfilePreview();
  renderUsagePass();
  renderFloors();
  renderRooms();
  renderBuilders();
  renderHelp();
  renderChats();
  renderQuestions();
  renderShowcases();
  renderCoffeeMatches();
  renderMetrics();
  renderLevel();
  renderFlowGuide();
  
  // Premium Features: Live Analytics & Trends Dashboards
  renderTrends();
}

function updateMyBuilder() {
  const myId = currentUser?.id || "me";
  let me = state.builders.find((builder) => builder.id === myId);
  const room = activeRoom();
  if (!me) {
    me = { id: myId };
    state.builders.push(me);
  }
  Object.assign(me, {
    roomId: room?.id || state.activeRoomId,
    seatId: isSeatCheckedIn ? selectedSeatId : "",
    name: state.profile.nickname || "나",
    category: state.profile.category,
    status: state.profile.status,
    goal: state.profile.goal,
    tools: state.profile.tools,
    currentTask: state.profile.currentTask || ""
  });
}

async function addRoomChat(text, roomId = state.activeRoomId) {
  if (!text) return;
  if (remoteReady) {
    const { error } = await authClient.from("chats").insert({
      room_id: roomId,
      user_id: currentUser.id,
      body: text
    });
    if (error) throw error;
    await loadRemoteState();
  } else {
    state.chats.push({ id: `c-${Date.now()}`, roomId, userId: currentUser?.id || "me", name: state.profile.nickname || "나", text });
    saveState();
  }
}

async function requestCoffeeChat(builderId) {
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. 내일 다시 커피챗을 요청할 수 있어요.");
    return;
  }
  const match = state.builders.find((builder) => builder.id === builderId);
  if (!match) return;
  await addRoomChat(`${state.profile.nickname || "나"}님이 ${match.name}님에게 10분 커피챗을 요청했습니다.`, match.roomId);
}

async function markHelpSolved(helpId) {
  if (remoteReady) {
    const { error } = await authClient.from("help_requests").update({ solved: true }).eq("id", helpId);
    if (error) throw error;
    await loadRemoteState();
  } else {
    const help = state.helps.find((item) => item.id === helpId);
    if (help) help.solved = true;
    saveState();
  }
}

async function markQuestionSolved(questionId) {
  if (remoteReady) {
    const { error } = await authClient.from("questions").update({ solved: true }).eq("id", questionId);
    if (error) throw error;
    await loadRemoteState();
  } else {
    const question = state.questions.find((item) => item.id === questionId);
    if (question) question.solved = true;
    saveState();
  }
}

document.addEventListener("click", async (event) => {
  const closeModalButton = event.target.closest("[data-close-modal]");
  if (closeModalButton) {
    closeModalButton.closest("dialog")?.close();
    return;
  }

  document.querySelectorAll(".tool-dropdown[open]").forEach((dropdown) => {
    if (!dropdown.contains(event.target)) dropdown.removeAttribute("open");
  });

  const toolInput = event.target.closest(".tool-picker input[type='checkbox']");
  if (toolInput) {
    const picker = toolInput.closest(".tool-picker");
    const hiddenInput = picker.closest(".field-label")?.querySelector("input[type='hidden']");
    if (hiddenInput) {
      refreshToolPicker(picker, hiddenInput);
      if (picker.id === "profileToolPicker") renderProfilePreview();
    }
    return;
  }

  const floorButton = event.target.closest("[data-floor-room-id]");
  if (floorButton?.dataset.floorView) {
    document.querySelector(`[data-view="${floorButton.dataset.floorView}"]`)?.click();
    return;
  }
  if (floorButton && floorButton.dataset.floorRoomId) {
    const targetRoomId = floorButton.dataset.floorRoomId;
    const active = activeRoom();
    const targetRoom = state.rooms.find((room) => room.id === targetRoomId);
    if (active && targetRoom && active.category === targetRoom.category) {
      // Already on this floor! Preserve current room and seat.
      return;
    }
    state.activeRoomId = targetRoomId;
    clearSeatSelection();
    saveActiveRoom();
    if (remoteReady) {
      try {
        await joinRoom(state.activeRoomId, checkedInSeatId());
        await loadRemoteState();
        renderAll();
      } catch (error) {
        alert(error.message);
      }
    } else {
      updateMyBuilder();
      saveState();
      renderAll();
    }
    return;
  }

  const seatButton = event.target.closest("[data-seat-id]");
  if (seatButton) {
    const builderId = seatButton.dataset.builderId;
    if (seatButtonIsOwnedByOther(seatButton)) {
      showBuilderCard(builderId);
      alert("이미 사용 중인 좌석입니다. 빈 좌석을 선택해주세요.");
      return;
    }
    const previousSeatId = selectedSeatId;
    selectedSeatId = seatButton.dataset.seatId;
    localStorage.setItem("ai-builder-selected-seat", selectedSeatId);
    document.querySelectorAll(".seat-button").forEach((item) => item.classList.remove("selected"));
    seatButton.classList.add("selected");
    if (isSeatCheckedIn && (selectedSeatIsEmpty() || selectedSeatIsMine())) {
      if (remoteReady) {
        try {
          await joinRoom(state.activeRoomId, selectedSeatId);
          await loadRemoteState();
          renderAll();
        } catch (error) {
          selectedSeatId = previousSeatId;
          localStorage.setItem("ai-builder-selected-seat", selectedSeatId);
          alert(`좌석 이동 실패: ${error.message}`);
          await loadRemoteState();
          renderAll();
          return;
        }
      } else {
        updateMyBuilder();
        saveState();
      }
    }
    renderAll();
    
    // Premium feature: Open RPG Holographic card if occupied
    if (builderId) {
      showBuilderCard(builderId);
    }
    return;
  }

  const adminDelete = event.target.closest("[data-admin-delete-id]");
  if (adminDelete) {
    if (!isAdmin()) return;
    const table = adminDelete.dataset.adminDeleteTable;
    const id = adminDelete.dataset.adminDeleteId;
    const labels = { chats: "이 채팅", help_requests: "이 도움 요청", questions: "이 질문", showcases: "이 쇼케이스" };
    if (!confirm(`${labels[table] || "이 글"}을(를) 영구 삭제할까요? 되돌릴 수 없습니다.`)) return;
    adminDelete.disabled = true;
    adminDeleteRow(table, id)
      .then(() => renderAll())
      .catch((error) => alert(`삭제 실패: ${error.message}`))
      .finally(() => {
        adminDelete.disabled = false;
      });
    return;
  }

  const helpAction = event.target.closest("[data-help-action]");
  if (helpAction) {
    const help = state.helps.find((item) => item.id === helpAction.dataset.helpId);
    if (!help) return;
    helpAction.disabled = true;
    if (helpAction.dataset.helpAction === "offer") {
      addRoomChat(`${state.profile.nickname || "나"}님이 "${help.title}" 도움 요청을 도울 수 있다고 했습니다.`, help.roomId)
        .then(() => renderAll())
        .catch((error) => alert(error.message))
        .finally(() => {
          helpAction.disabled = false;
        });
    }
    if (helpAction.dataset.helpAction === "solve") {
      markHelpSolved(help.id)
        .then(() => renderAll())
        .catch((error) => alert(`작성자만 해결 처리할 수 있습니다. ${error.message}`))
        .finally(() => {
          helpAction.disabled = false;
        });
    }
    return;
  }

  const questionAction = event.target.closest("[data-question-action]");
  if (questionAction) {
    questionAction.disabled = true;
    markQuestionSolved(questionAction.dataset.questionId)
      .then(() => renderAll())
      .catch((error) => alert(`작성자만 해결 처리할 수 있습니다. ${error.message}`))
      .finally(() => {
        questionAction.disabled = false;
      });
    return;
  }

  const coffeeButton = event.target.closest("[data-coffee-id]");
  if (coffeeButton) {
    coffeeButton.disabled = true;
    requestCoffeeChat(coffeeButton.dataset.coffeeId)
      .then(() => {
        renderAll();
        byId("coffeeModal").close();
      })
      .catch((error) => alert(error.message))
      .finally(() => {
        coffeeButton.disabled = false;
      });
    return;
  }

  const roomButton = event.target.closest("[data-room-id]");
  if (roomButton) {
    const nextRoomId = roomButton.dataset.roomId;
    state.activeRoomId = nextRoomId;
    clearSeatSelection();
    saveActiveRoom();
    if (remoteReady) {
      joinRoom(nextRoomId, checkedInSeatId())
        .then(refreshRemote)
        .catch((error) => alert(error.message));
    } else {
      updateMyBuilder();
      saveState();
      renderAll();
    }
  }

  const modalButton = event.target.closest("[data-open-modal]");
  if (modalButton) {
    const modal = byId(modalButton.dataset.openModal);
    syncModalToolPickers();
    renderCoffeeMatches();
    modal.showModal();
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".view").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    byId(`${tab.dataset.view}View`).classList.add("active");
    if (tab.dataset.view === "feedback") {
      renderFeedback();
      if (isAdmin()) loadFeedback();
    }
  });
});

byId("feedbackForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const textarea = byId("feedbackBody");
  const button = event.target.querySelector("button[type='submit']");
  if (button) button.disabled = true;
  const ok = await submitFeedback(textarea.value);
  if (button) button.disabled = false;
  if (ok) textarea.value = "";
});

byId("feedbackList")?.addEventListener("change", (event) => {
  const select = event.target.closest(".feedback-status");
  if (!select) return;
  updateFeedbackStatus(select.dataset.feedbackId, select.value);
});

byId("feedbackList")?.addEventListener("click", (event) => {
  const button = event.target.closest(".feedback-delete");
  if (!button) return;
  deleteFeedback(button.dataset.feedbackId);
});

byId("saveProfile").addEventListener("click", async () => {
  const saveButton = byId("saveProfile");
  saveButton.disabled = true;
  saveButton.textContent = "저장 중...";
  setProfileSaveNote("");
  state.profile = {
    nickname: cleanText(byId("nicknameInput").value, 40) || "나",
    goal: cleanText(byId("goalInput").value, 160) || "오늘의 목표 미정",
    category: cleanText(byId("categoryInput").value, 40),
    status: cleanText(byId("statusInput").value, 40),
    tools: cleanText(byId("toolsInput").value, 240) || "도구 미지정",
    currentTask: cleanText(byId("currentTaskInput")?.value || "", 60),
    role: state.profile?.role || "user"
  };
  updateMyBuilder();
  try {
    if (remoteReady) {
      await upsertProfile();
      await joinRoom(state.activeRoomId, checkedInSeatId());
      await loadRemoteState();
    } else {
      saveState();
    }
    renderAll({ forceProfileSync: true });
    setProfileSaveNote("저장됐습니다.");
    saveButton.textContent = "저장됨";
    setTimeout(() => {
      if (!saveButton.disabled) saveButton.textContent = "상태 저장";
    }, 1200);
  } catch (error) {
    setProfileSaveNote(error.message, true);
  } finally {
    saveButton.disabled = false;
    if (saveButton.textContent !== "저장됨") saveButton.textContent = "상태 저장";
  }
});

byId("sitSeatButton").addEventListener("click", async () => {
  if (!hasValidGoal()) {
    alert("좌석에 앉기 전에 오늘의 목표를 먼저 선택해주세요.");
    byId("goalPresetInput").focus();
    return;
  }
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. Q&A와 쇼케이스는 계속 볼 수 있어요.");
    return;
  }
  if (!selectedSeatId) {
    alert("먼저 앉을 좌석을 선택해주세요.");
    return;
  }
  if (seatButtonIsOwnedByOther(selectedSeatButton())) {
    alert("이미 사용 중인 좌석입니다. 빈 좌석을 선택해주세요.");
    return;
  }
  if (!selectedSeatIsEmpty() && !selectedSeatIsMine()) {
    alert("이미 사용 중인 좌석입니다. 빈 좌석을 선택해주세요.");
    return;
  }
  const previousSeatCheckedIn = isSeatCheckedIn;
  const previousSeatId = localStorage.getItem("ai-builder-selected-seat") || "";
  isSeatCheckedIn = true;
  localStorage.setItem("ai-builder-seat-checked-in", todayKey());
  try {
    const entryMessage = `${state.profile.nickname || "나"}님이 ${selectedSeatId} 좌석에 입장했습니다.`;
    if (remoteReady) {
      await joinRoom(state.activeRoomId, selectedSeatId);
      await addRoomChat(entryMessage);
      await loadRemoteState();
    } else {
      updateMyBuilder();
      saveState();
      await addRoomChat(entryMessage);
    }
    setUsageSeconds(getUsageSeconds() + 60);
    renderAll();
  } catch (error) {
    isSeatCheckedIn = previousSeatCheckedIn;
    if (previousSeatCheckedIn) {
      localStorage.setItem("ai-builder-seat-checked-in", todayKey());
    } else {
      localStorage.removeItem("ai-builder-seat-checked-in");
    }
    selectedSeatId = previousSeatId;
    if (selectedSeatId) localStorage.setItem("ai-builder-selected-seat", selectedSeatId);
    else localStorage.removeItem("ai-builder-selected-seat");
    alert(`좌석 입장 실패: ${error.message}`);
    if (remoteReady) await loadRemoteState();
    renderAll();
  }
});

byId("mobileSitSeatButton").addEventListener("click", () => byId("sitSeatButton").click());

byId("seatCoffeeButton").addEventListener("click", async () => {
  const selectedButton = document.querySelector(`[data-seat-id="${selectedSeatId}"]`);
  const builderId = selectedButton?.dataset.builderId;
  if (!builderId) return;
  try {
    await requestCoffeeChat(builderId);
    renderAll();
  } catch (error) {
    alert(error.message);
  }
});

byId("goalPresetInput").addEventListener("change", (event) => {
  const value = event.target.value;
  const goalInput = byId("goalInput");
  if (!value) {
    goalInput.value = "";
    state.profile.goal = "오늘의 목표 미정";
  } else if (value === "custom") {
    goalInput.focus();
  } else {
    goalInput.value = value;
    state.profile.goal = value;
  }
  renderProfilePreview();
  renderUsagePass();
  renderSelectedSeat();
  renderFlowGuide();
});

byId("goalInput").addEventListener("input", () => {
  const goal = byId("goalInput").value.trim();
  state.profile.goal = goal || "오늘의 목표 미정";
  if (goal && !goalOptions.includes(goal)) byId("goalPresetInput").value = "custom";
  renderProfilePreview();
  renderUsagePass();
  renderSelectedSeat();
  renderFlowGuide();
});

["categoryInput", "statusInput"].forEach((inputId) => {
  byId(inputId).addEventListener("change", renderProfilePreview);
});

byId("chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. 채팅은 내일 다시 사용할 수 있어요.");
    return;
  }
  const input = byId("chatInput");
  const text = cleanText(input.value, 240);
  if (!text) return;
  try {
    await addRoomChat(text);
    renderAll();
    input.value = "";
  } catch (error) {
    alert(error.message);
  }
});

byId("helpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. 도움 요청은 내일 다시 사용할 수 있어요.");
    return;
  }
  const form = event.currentTarget;
  const data = new FormData(form);
  try {
    const payload = {
      title: requiredText(data.get("title"), 120, "제목"),
      category: cleanText(data.get("category"), 40),
      type: cleanText(data.get("type"), 40),
      tools: cleanText(data.get("tools"), 240),
      body: requiredText(data.get("body"), 2000, "내용")
    };
    if (remoteReady) {
      const { error } = await authClient.from("help_requests").insert({
        room_id: state.activeRoomId,
        user_id: currentUser.id,
        title: payload.title,
        category: payload.category,
        help_type: payload.type,
        tools: payload.tools,
        body: payload.body
      });
      if (error) throw error;
      await loadRemoteState();
    } else {
      state.helps.unshift({
        id: `h-${Date.now()}`,
        roomId: state.activeRoomId,
        userId: currentUser?.id || "me",
        title: payload.title,
        category: payload.category,
        type: payload.type,
        tools: payload.tools,
        body: payload.body,
        solved: false
      });
      saveState();
    }
    form.reset();
    form.closest("dialog")?.close();
    syncModalToolPickers();
    renderAll();
  } catch (error) {
    alert(error.message);
  }
});

byId("questionForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  try {
    const payload = {
      title: requiredText(data.get("title"), 120, "질문 제목"),
      category: cleanText(data.get("category"), 40),
      tools: cleanText(data.get("tools"), 240),
      body: requiredText(data.get("body"), 2000, "질문 내용")
    };
    if (remoteReady) {
      const { error } = await authClient.from("questions").insert({
        user_id: currentUser.id,
        title: payload.title,
        category: payload.category,
        tools: payload.tools,
        body: payload.body
      });
      if (error) throw error;
      await loadRemoteState();
    } else {
      state.questions.unshift({
        id: `q-${Date.now()}`,
        userId: currentUser?.id || "me",
        title: payload.title,
        category: payload.category,
        tools: payload.tools,
        body: payload.body,
        solved: false
      });
      saveState();
    }
    form.reset();
    form.closest("dialog")?.close();
    syncModalToolPickers();
    renderAll();
  } catch (error) {
    alert(error.message);
  }
});

byId("showcaseForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  try {
    const payload = {
      title: requiredText(data.get("title"), 120, "제목"),
      category: cleanText(data.get("category"), 40),
      tools: cleanText(data.get("tools"), 240),
      url: safeExternalUrl(data.get("url")),
      body: requiredText(data.get("body"), 2000, "내용")
    };
    if (remoteReady) {
      const { data: created, error } = await authClient
        .from("showcases")
        .insert({
          user_id: currentUser.id,
          title: payload.title,
          category: payload.category,
          tools: payload.tools,
          url: payload.url,
          body: payload.body
        })
        .select()
        .single();
      if (error) throw error;
      await loadRemoteState();
      if (created && !state.showcases.some((item) => item.id === created.id)) {
        state.showcases.unshift(mapShowcase(created));
      }
    } else {
      state.showcases.unshift({
        id: `s-${Date.now()}`,
        userId: currentUser?.id || "me",
        title: payload.title,
        category: payload.category,
        tools: payload.tools,
        url: payload.url,
        body: payload.body
      });
      saveState();
    }
    form.reset();
    form.closest("dialog")?.close();
    syncModalToolPickers();
    renderAll();
  } catch (error) {
    alert(error.message);
  }
});

byId("resetDemo").addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  state = structuredClone(seedState);
  if (currentUser) applyUserToProfile(currentUser);
  saveState();
  renderAll();
});

byId("githubLogin").addEventListener("click", () => signInWithProvider("github"));
byId("googleLogin").addEventListener("click", () => signInWithProvider("google"));
byId("signOut").addEventListener("click", signOut);
byId("emailLoginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = byId("emailLoginInput").value.trim();
  if (email) signInWithEmail(email);
});

document.querySelectorAll("[data-room-select]").forEach((roomSelect) => {
  roomSelect.addEventListener("change", (event) => {
    state.activeRoomId = event.target.value;
    clearSeatSelection();
    saveActiveRoom();
    if (remoteReady) {
      joinRoom(state.activeRoomId, checkedInSeatId())
        .then(refreshRemote)
        .catch((error) => alert(error.message));
    } else {
      updateMyBuilder();
      saveState();
      renderAll();
    }
  });
});

window.addEventListener("resize", fitRoomMap);

initAuth();

/* ==========================================================================
   PREMIUM FEATURES: POMODORO, FOCUS AUDIO, TRENDS, & RPG HOLO PROFILE CARD
   ========================================================================== */

// 1. Pomodoro Logic & View Update
const POMO_FOCUS_SECONDS = 25 * 60;
const POMO_BREAK_SECONDS = 5 * 60;

function pomoDurationFor(mode) {
  return mode === "break" ? POMO_BREAK_SECONDS : POMO_FOCUS_SECONDS;
}

function pomoSecondsLeftRemote() {
  if (!activePomo || !activePomo.startedAt) return null;
  const elapsed = Math.floor((Date.now() - activePomo.startedAt.getTime()) / 1000);
  return Math.max(0, activePomo.durationSeconds - elapsed);
}

function updatePomoDisplay() {
  const remoteLeft = pomoSecondsLeftRemote();
  const isRemote = remoteLeft !== null;
  const left = isRemote ? remoteLeft : pomoSecondsLeft;
  const mode = isRemote ? activePomo.mode : (pomoIsBreak ? "break" : "focus");
  const running = isRemote || pomoIsRunning;

  const minutes = Math.floor(left / 60);
  const seconds = left % 60;
  const str = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const pomoTimeDisplay = byId("pomoTimeDisplay");
  const zenTimeDisplay = byId("zenTimeDisplay");
  if (pomoTimeDisplay) pomoTimeDisplay.textContent = str;
  if (zenTimeDisplay) zenTimeDisplay.textContent = str;

  const total = pomoDurationFor(mode);
  const ratio = left / total;

  const pomoRingFill = byId("pomoRingFill");
  const zenRingFill = byId("zenRingFill");
  if (pomoRingFill) pomoRingFill.style.strokeDashoffset = (1 - ratio) * 283;
  if (zenRingFill) zenRingFill.style.strokeDashoffset = (1 - ratio) * 565;

  let stateLabel = "READY";
  if (isRemote) stateLabel = mode === "break" ? "BREAK · 함께" : "FOCUSING · 함께";
  else if (running) stateLabel = mode === "break" ? "BREAK" : "FOCUSING";
  const pomoStateLabel = byId("pomoStateLabel");
  if (pomoStateLabel) pomoStateLabel.textContent = stateLabel;

  const pulseText = mode === "break" ? "RECOVERY TIME" : "DEEP FOCUSING";
  const pulseTextEl = document.querySelector(".pomo-pulse-text");
  if (pulseTextEl) pulseTextEl.textContent = pulseText;

  const startBtn = byId("pomoStartBtn");
  if (startBtn) startBtn.textContent = isRemote ? "정지" : (running ? "일시정지" : "시작");
  const zenStartBtn = byId("zenPomoStartBtn");
  if (zenStartBtn) zenStartBtn.textContent = isRemote ? "정지" : (running ? "일시정지" : "집중 시작");
}

function playAlarmSound() {
  if (!audioCtx) initAudio();
  if (audioCtx) {
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.error("Error playing alarm sound", e);
    }
  }
}

function tickPomo() {
  const remoteLeft = pomoSecondsLeftRemote();
  if (remoteLeft !== null) {
    if (remoteLeft > 0) {
      updatePomoDisplay();
      return;
    }
    if (Date.now() - lastPomoAnnouncedAt < 10000) return;
    lastPomoAnnouncedAt = Date.now();
    playAlarmSound();
    const wasBreak = activePomo?.mode === "break";
    const startedByMe = activePomo?.startedBy === currentUser?.id;
    if (remoteReady && startedByMe && pomodoroTableReady) {
      deleteRoomPomo().catch(console.error);
    }
    activePomo = null;
    stopPomoTicker();
    alert(wasBreak ? "휴식 끝, 다시 집중해볼까요? ⚡" : "집중 끝! 5분 휴식 시작 버튼을 누르세요. ☕");
    updatePomoDisplay();
    return;
  }
  if (pomoSecondsLeft > 0) {
    pomoSecondsLeft--;
    updatePomoDisplay();
  } else {
    playAlarmSound();
    if (!pomoIsBreak) {
      pomoIsBreak = true;
      pomoSecondsLeft = 5 * 60;
      alert("집중 시간이 끝났습니다! 5분간 휴식하세요. ☕");
    } else {
      pomoIsBreak = false;
      pomoSecondsLeft = 25 * 60;
      alert("휴식 시간이 끝났습니다! 다시 집중해볼까요? ⚡");
    }
    updatePomoDisplay();
  }
}

function startPomoTicker() {
  if (pomoTickInterval) return;
  pomoTickInterval = setInterval(tickPomo, 1000);
}

function stopPomoTicker() {
  if (pomoTickInterval) {
    clearInterval(pomoTickInterval);
    pomoTickInterval = null;
  }
}

async function upsertRoomPomo(mode) {
  if (!remoteReady || !pomodoroTableReady || !currentUser) return;
  const payload = {
    room_id: state.activeRoomId,
    mode,
    started_at: new Date().toISOString(),
    duration_seconds: pomoDurationFor(mode),
    started_by: currentUser.id,
    updated_at: new Date().toISOString()
  };
  const { error } = await authClient.from("room_pomodoros").upsert(payload);
  if (error) {
    if (/room_pomodoros|schema cache|relation/i.test(error.message || "")) {
      pomodoroTableReady = false;
      alert("Supabase에 room_pomodoros 테이블이 없습니다. supabase-pomodoro.sql을 실행해주세요.");
      return;
    }
    throw error;
  }
}

async function deleteRoomPomo() {
  if (!remoteReady || !pomodoroTableReady) return;
  const { error } = await authClient
    .from("room_pomodoros")
    .delete()
    .eq("room_id", state.activeRoomId);
  if (error) throw error;
}

function startPomo() {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (remoteReady && pomodoroTableReady) {
    if (activePomo && activePomo.mode !== "idle") {
      deleteRoomPomo()
        .then(() => {
          activePomo = null;
          stopPomoTicker();
          updatePomoDisplay();
        })
        .catch((error) => alert(error.message));
      return;
    }
    const nextMode = pomoSecondsLeftRemote() === null ? "focus" : "focus";
    upsertRoomPomo(nextMode).catch((error) => alert(error.message));
    return;
  }

  if (pomoIsRunning) {
    pomoIsRunning = false;
    clearInterval(pomoInterval);
    pomoInterval = null;
  } else {
    pomoIsRunning = true;
    pomoInterval = setInterval(tickPomo, 1000);
  }
  updatePomoDisplay();
}

function resetPomo() {
  if (remoteReady && pomodoroTableReady && activePomo) {
    deleteRoomPomo()
      .then(() => {
        activePomo = null;
        stopPomoTicker();
        pomoIsBreak = false;
        pomoSecondsLeft = 25 * 60;
        updatePomoDisplay();
      })
      .catch((error) => alert(error.message));
    return;
  }
  pomoIsRunning = false;
  if (pomoInterval) {
    clearInterval(pomoInterval);
    pomoInterval = null;
  }
  pomoIsBreak = false;
  pomoSecondsLeft = 25 * 60;
  updatePomoDisplay();
}

function mapPomoRow(row) {
  if (!row) return null;
  return {
    roomId: row.room_id,
    mode: row.mode,
    startedAt: row.started_at ? new Date(row.started_at) : null,
    durationSeconds: row.duration_seconds || POMO_FOCUS_SECONDS,
    startedBy: row.started_by || null
  };
}

async function loadActivePomo() {
  if (!remoteReady || !pomodoroTableReady || !state.activeRoomId) return;
  const { data, error } = await authClient
    .from("room_pomodoros")
    .select("*")
    .eq("room_id", state.activeRoomId)
    .maybeSingle();
  if (error) {
    if (/room_pomodoros|schema cache|relation/i.test(error.message || "")) {
      pomodoroTableReady = false;
      return;
    }
    console.error(error);
    return;
  }
  const next = mapPomoRow(data);
  activePomo = next && next.mode !== "idle" ? next : null;
  if (activePomo) startPomoTicker(); else stopPomoTicker();
  updatePomoDisplay();
}

// 2. Focus Soundscapes Web Audio API Synthesizers
function createWhiteNoiseBuffer(seconds) {
  const size = audioCtx.sampleRate * seconds;
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createPinkNoiseBuffer(seconds) {
  const size = audioCtx.sampleRate * seconds;
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.76160 * b5 - white * 0.0168980;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    data[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createCampfireBuffer(seconds) {
  const size = audioCtx.sampleRate * seconds;
  const buffer = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < size; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.76160 * b5 - white * 0.0168980;
    let pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    pink *= 0.11;
    b6 = white * 0.115926;
    
    let pop = 0;
    if (Math.random() < 0.00015) {
      pop = (Math.random() * 2 - 1) * 0.9;
    }
    data[i] = pink * 0.15 + pop;
  }
  return buffer;
}

function createRainSynth() {
  try {
    const buffer = createWhiteNoiseBuffer(4);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    
    source.connect(filter);
    filter.connect(rainGain);
    source.start(0);
    rainNode = source;
  } catch (e) {
    console.error("Rain synth failed", e);
  }
}

function createWavesSynth() {
  try {
    const waveAmpMod = audioCtx.createGain();
    waveAmpMod.gain.value = 0.5;
    
    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 0.35;
    
    lfo.connect(lfoGain);
    lfoGain.connect(waveAmpMod.gain);
    lfo.start(0);
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;
    
    const filterLfoGain = audioCtx.createGain();
    filterLfoGain.gain.value = 250;
    lfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    
    const source = audioCtx.createBufferSource();
    source.buffer = createPinkNoiseBuffer(6);
    source.loop = true;
    
    source.connect(filter);
    filter.connect(waveAmpMod);
    waveAmpMod.connect(wavesGain);
    source.start(0);
    
    wavesNode = { source, lfo };
  } catch (e) {
    console.error("Waves synth failed", e);
  }
}

// Cosmic Hum
function createHumSynth() {
  try {
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 100;
    
    const mixGain = audioCtx.createGain();
    mixGain.gain.value = 0.4;
    
    const oscs = [];
    const freqs = [55, 55.4, 82.5, 110];
    const types = ["sine", "sine", "triangle", "sine"];
    const gains = [0.4, 0.4, 0.2, 0.2];
    
    freqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = types[idx];
      osc.frequency.value = freq;
      
      const g = audioCtx.createGain();
      g.gain.value = gains[idx];
      
      osc.connect(g);
      g.connect(mixGain);
      osc.start(0);
      oscs.push(osc);
    });
    
    const lfo = audioCtx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 25;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(0);
    
    mixGain.connect(filter);
    filter.connect(humGain);
    
    humNode = { oscs, lfo };
  } catch (e) {
    console.error("Hum synth failed", e);
  }
}

function createFireSynth() {
  try {
    const source = audioCtx.createBufferSource();
    source.buffer = createCampfireBuffer(5);
    source.loop = true;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1600;
    filter.Q.value = 1.0;
    
    const flameSource = audioCtx.createBufferSource();
    flameSource.buffer = createPinkNoiseBuffer(4);
    flameSource.loop = true;
    
    const flameFilter = audioCtx.createBiquadFilter();
    flameFilter.type = "lowpass";
    flameFilter.frequency.value = 120;
    
    flameSource.connect(flameFilter);
    flameFilter.connect(fireGain);
    flameSource.start(0);
    
    source.connect(filter);
    filter.connect(fireGain);
    source.start(0);
    
    fireNode = { source, flameSource };
  } catch (e) {
    console.error("Fire synth failed", e);
  }
}

function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    masterGain = audioCtx.createGain();
    masterGain.gain.value = isMuted ? 0.0 : 1.0;
    masterGain.connect(audioCtx.destination);
    
    rainGain = audioCtx.createGain();
    rainGain.gain.value = parseFloat(byId("volRain")?.value || 0);
    rainGain.connect(masterGain);
    createRainSynth();
    
    wavesGain = audioCtx.createGain();
    wavesGain.gain.value = parseFloat(byId("volWaves")?.value || 0);
    wavesGain.connect(masterGain);
    createWavesSynth();
    
    humGain = audioCtx.createGain();
    humGain.gain.value = parseFloat(byId("volHum")?.value || 0);
    humGain.connect(masterGain);
    createHumSynth();
    
    fireGain = audioCtx.createGain();
    fireGain.gain.value = parseFloat(byId("volFire")?.value || 0);
    fireGain.connect(masterGain);
    createFireSynth();
  } catch (err) {
    console.error("Web Audio initialization failed", err);
  }
}

function setVolume(type, val) {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  let gainNode = null;
  if (type === "rain") gainNode = rainGain;
  else if (type === "waves") gainNode = wavesGain;
  else if (type === "hum") gainNode = humGain;
  else if (type === "fire") gainNode = fireGain;
  
  if (gainNode) {
    gainNode.gain.setValueAtTime(val, audioCtx.currentTime);
  }
  
  // Update Zen Mode CSS variables for ambient background effects
  const zen = byId("zenOverlay");
  if (zen) {
    zen.style.setProperty(`--zen-vol-${type}`, val);
  }
}

function toggleMute() {
  initAudio();
  if (isMuted) {
    masterGain.gain.setValueAtTime(1.0, audioCtx.currentTime);
    byId("ambientMuteBtn").textContent = "소리 전체 끄기";
    isMuted = false;
  } else {
    masterGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
    byId("ambientMuteBtn").textContent = "소리 켜기";
    isMuted = true;
  }
}

// 3. Trends Tab Rendering
function renderTrends() {
  const slicesGroup = byId("donutSlices");
  if (!slicesGroup) return;
  
  let currentPercentSum = 0;
  let slicesHtml = "";
  let legendHtml = "";
  const colors = ["#c9815e", "#315f72", "#dfaa5c", "#7ba87f", "#807baf", "#888888"];
  
  const toolCounts = {};
  state.builders.forEach((b) => {
    if (!b.tools) return;
    b.tools.split(",").forEach((t) => {
      const name = t.trim();
      if (!name || name === "-" || name === "도구 미지정") return;
      toolCounts[name] = (toolCounts[name] || 0) + 1;
    });
  });
  
  const sortedTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]);
  const topTools = sortedTools.slice(0, 5);
  const othersCount = sortedTools.slice(5).reduce((sum, item) => sum + item[1], 0);
  
  const chartData = topTools.map(([name, count]) => ({ name, count }));
  if (othersCount > 0) {
    chartData.push({ name: "기타", count: othersCount });
  }
  
  const totalToolsSum = chartData.reduce((sum, item) => sum + item.count, 0);
  byId("donutCenterTotal").textContent = totalToolsSum;
  
  if (totalToolsSum > 0) {
    chartData.forEach((item, index) => {
      const percentage = item.count / totalToolsSum;
      const segmentLength = percentage * 251.2;
      const offset = -currentPercentSum * 251.2;
      const color = colors[index % colors.length];
      
      slicesHtml += `
        <circle class="donut-slice" cx="50" cy="50" r="40"
          stroke="${color}"
          stroke-dasharray="${segmentLength} 251.2"
          stroke-dashoffset="${offset}"
          title="${escapeHtml(item.name)}: ${item.count}개 (${Math.round(percentage * 100)}%)">
        </circle>
      `;
      
      legendHtml += `
        <div class="legend-item">
          <span class="legend-color" style="background: ${color}"></span>
          <span>${escapeHtml(item.name)} (${item.count})</span>
        </div>
      `;
      
      currentPercentSum += percentage;
    });
  } else {
    slicesHtml = `<circle cx="50" cy="50" r="40" stroke="#cccccc" stroke-width="10" fill="none" opacity="0.2"></circle>`;
    legendHtml = `<div class="legend-item"><span>등록된 도구가 없습니다.</span></div>`;
  }
  
  slicesGroup.innerHTML = slicesHtml;
  byId("donutLegend").innerHTML = legendHtml;
  
  const floorProgressList = byId("floorProgressList");
  if (floorProgressList) {
    floorProgressList.innerHTML = floorPlan.map((floor) => {
      const floorRooms = state.rooms.filter((item) => item.category === floor.category);
      const count = floorRooms.reduce(
        (sum, r) => sum + liveBuilders(roomBuilders(r.id)).length,
        0
      );
      const limit = floorRooms.reduce((sum, r) => sum + r.limit, 0) || 8;
      const pct = Math.min(100, Math.round((count / limit) * 100));

      let color = "var(--blue)";
      if (pct >= 80) color = "var(--coral)";
      else if (pct >= 40) color = "var(--yellow)";
      else color = "var(--green)";

      const rightLabel = floor.category === "Showcase"
        ? `전시 ${state.showcases.length}개 · ${count}/${limit}명`
        : `${count} / ${limit}명 (${pct}%)`;

      return `
        <div class="floor-progress-item">
          <div class="floor-progress-header">
            <span>${escapeHtml(floor.floor)} · ${escapeHtml(floor.name)} (${floorRooms.length}개 방)</span>
            <span>${rightLabel}</span>
          </div>
          <div class="floor-progress-bar">
            <div class="floor-progress-fill" style="width: ${pct}%; background: ${color}"></div>
          </div>
        </div>
      `;
    }).join("");
  }
  
  const bucketHours = [9, 12, 15, 18, 21, 0];
  const buckets = bucketHours.map(() => 0);
  const todayStr = todayKey();
  const isToday = (ts) => {
    if (!ts) return false;
    const d = new Date(ts);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === todayStr;
  };
  const tally = (ts) => {
    if (!isToday(ts)) return;
    const hour = new Date(ts).getHours();
    let idx = 0;
    for (let i = 0; i < bucketHours.length; i++) {
      const start = bucketHours[i];
      const end = bucketHours[(i + 1) % bucketHours.length];
      const inWindow = end > start ? (hour >= start && hour < end) : (hour >= start || hour < end);
      if (inWindow) { idx = i; break; }
    }
    buckets[idx]++;
  };
  state.chats.forEach((c) => tally(c.createdAt || c.created_at));
  state.helps.forEach((h) => tally(h.createdAt || h.created_at));
  state.showcases.forEach((s) => tally(s.createdAt || s.created_at));
  state.questions.forEach((q) => tally(q.createdAt || q.created_at));

  const maxBucket = Math.max(1, ...buckets);
  const points = buckets.map((value, i) => ({
    x: (i / (buckets.length - 1)) * 200,
    y: 100 - Math.min(95, (value / maxBucket) * 85 + 5),
    value
  }));

  const lineD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
  const fillD = `${lineD} L 200 100 L 0 100 Z`;

  byId("chartLinePath").setAttribute("d", lineD);
  byId("chartLineFill").setAttribute("d", fillD);

  const markersGroup = byId("chartLineMarkers");
  if (markersGroup) {
    markersGroup.innerHTML = points.map((p) => `
      <circle cx="${p.x}" cy="${p.y}" r="2" fill="var(--blue)"></circle>
      <text x="${p.x}" y="${Math.max(8, p.y - 4)}" font-size="6" text-anchor="${p.x < 10 ? "start" : p.x > 190 ? "end" : "middle"}" fill="var(--ink)" font-weight="700">${p.value}</text>
    `).join("");
  }
  
  const feedEl = byId("trendsActivityFeed");
  if (feedEl) {
    const items = [];

    state.builders.forEach((b) => {
      if (b.id === "me" || b.id === currentUser?.id) return;
      if (!b.updatedAt) return;
      items.push({
        ts: b.updatedAt,
        icon: "👤",
        text: `<strong>${escapeHtml(b.name)}</strong>님이 <strong>${escapeHtml(b.category)}</strong> 방 좌석에 입장했습니다.`,
        note: b.currentTask ? `지금 작업: ${escapeHtml(b.currentTask)}` : `목표: ${escapeHtml(b.goal)}`
      });
    });

    state.showcases.forEach((s) => {
      const ts = s.createdAt || s.created_at;
      const author = state.builders.find((b) => b.id === s.userId || b.id === s.user_id)?.name || "빌더";
      items.push({
        ts,
        icon: "🚀",
        text: `<strong>${escapeHtml(author)}</strong>님이 새 쇼케이스 <strong>"${escapeHtml(s.title)}"</strong>을(를) 출하했습니다.`,
        note: `도구: ${escapeHtml(s.tools)}`
      });
    });

    state.helps.filter((h) => h.solved).forEach((h) => {
      items.push({
        ts: h.createdAt || h.created_at,
        icon: "🤝",
        text: `<strong>도움 완료:</strong> <strong>"${escapeHtml(h.title)}"</strong> 문제가 해결되었습니다.`,
        note: `도구: ${escapeHtml(h.tools)}`
      });
    });

    state.chats.slice(-10).forEach((c) => {
      items.push({
        ts: c.createdAt || c.created_at,
        icon: "💬",
        text: `<strong>${escapeHtml(c.name || "익명")}</strong>: ${escapeHtml(shortText(c.text || "", 60))}`,
        note: ""
      });
    });

    items.sort((a, b) => new Date(b.ts || 0).getTime() - new Date(a.ts || 0).getTime());
    const visible = items.slice(0, 12);

    if (visible.length === 0) {
      visible.push({
        ts: new Date().toISOString(),
        icon: "💡",
        text: "현재 활동 로그가 비어있습니다. 좌석에 입장해 코딩을 시작하세요!",
        note: ""
      });
    }

    feedEl.innerHTML = visible.map((item) => `
      <div class="trends-feed-item">
        <div class="feed-icon">${item.icon}</div>
        <div class="feed-content">
          <span>${item.text}</span>
          ${item.note ? `<small style="font-size: 10px; color: var(--muted); font-weight: 700;">${item.note}</small>` : ""}
        </div>
        <div class="feed-time">${escapeHtml(formatRelativeTime(item.ts))}</div>
      </div>
    `).join("");
  }
}

function formatRelativeTime(ts) {
  if (!ts) return "방금";
  const t = new Date(ts).getTime();
  if (Number.isNaN(t)) return "방금";
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}초 전`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Date(t).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// 4. Holographic Builder Card Modal Population & interactive 3D Tilt
function getToolStyle(name) {
  const toolColors = {
    "Claude": "background: rgba(201, 129, 94, 0.08); color: #c9815e; border: 1px solid rgba(201, 129, 94, 0.25);",
    "Claude Code": "background: rgba(201, 129, 94, 0.08); color: #c9815e; border: 1px solid rgba(201, 129, 94, 0.25);",
    "Cursor": "background: rgba(49, 95, 114, 0.08); color: #315f72; border: 1px solid rgba(49, 95, 114, 0.25);",
    "GPT": "background: rgba(123, 168, 127, 0.08); color: #7ba87f; border: 1px solid rgba(123, 168, 127, 0.25);",
    "ChatGPT": "background: rgba(123, 168, 127, 0.08); color: #7ba87f; border: 1px solid rgba(123, 168, 127, 0.25);",
    "Figma": "background: rgba(128, 123, 175, 0.08); color: #807baf; border: 1px solid rgba(128, 123, 175, 0.25);",
    "Supabase": "background: rgba(223, 170, 92, 0.08); color: #dfaa5c; border: 1px solid rgba(223, 170, 92, 0.25);",
    "Make": "background: rgba(201, 94, 94, 0.08); color: #c95e5e; border: 1px solid rgba(201, 94, 94, 0.25);",
    "n8n": "background: rgba(201, 129, 94, 0.08); color: #c9815e; border: 1px solid rgba(201, 129, 94, 0.25);"
  };
  if (toolColors[name]) return toolColors[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `background: hsla(${h}, 50%, 45%, 0.08); color: hsl(${h}, 50%, 40%); border: 1px solid hsla(${h}, 50%, 45%, 0.25);`;
}

function showBuilderCard(builderId) {
  const builder = state.builders.find(b => b.id === builderId) || (builderId === "me" ? {
    id: "me",
    name: state.profile.nickname || "나",
    goal: state.profile.goal || "오늘의 목표 미정",
    category: state.profile.category || "Vibe Coding",
    status: state.profile.status || "집중 중",
    tools: state.profile.tools || "Claude",
    seatId: checkedInSeatId() || "",
    updatedAt: new Date().toISOString()
  } : null);
  
  if (!builder) return;
  
  const stats = calculateBuilderXp(builder.id);
  const levelInfo = levelFromXp(stats.xp);
  const title = titleForLevel(levelInfo.level);
  
  byId("cardNickname").textContent = builder.name;
  byId("cardUserTitle").textContent = title;
  byId("cardLevelBadge").textContent = `Lv.${levelInfo.level}`;
  byId("cardAvatarInner").textContent = initials(builder.name);
  
  const statusEl = byId("cardStatusBadge");
  statusEl.textContent = builder.status;
  statusEl.className = "card-status-badge " + (
    builder.status === "도움 필요" ? "help" :
    builder.status === "커피챗 가능" ? "coffee" : "focus"
  );
  
  byId("cardXpDisplay").textContent = `${stats.xp.toLocaleString()} XP`;
  byId("cardNextXpDisplay").textContent = levelInfo.level >= 100 ? "Max" : `다음 레벨까지 ${(levelInfo.next - levelInfo.intoLevel).toLocaleString()} XP`;
  byId("cardXpBarFill").style.width = `${levelInfo.progress}%`;

  const seatTime = builderSeatTime(builder);
  byId("cardSeatTimeDisplay").textContent = seatTime.label;
  byId("cardSeatTimeDetail").textContent = seatTime.detail;
  byId("cardSeatTimeBarFill").style.width = `${seatTime.percent}%`;
  
  byId("cardGoal").textContent = builder.goal || "목표가 지정되지 않았습니다.";
  const taskWrap = byId("cardCurrentTaskWrap");
  if (taskWrap) {
    const task = builder.currentTask || "";
    if (task) {
      taskWrap.hidden = false;
      byId("cardCurrentTask").textContent = task;
    } else {
      taskWrap.hidden = true;
    }
  }
  
  const toolsContainer = byId("cardToolsList");
  if (toolsContainer) {
    if (builder.tools && builder.tools !== "-") {
      toolsContainer.innerHTML = builder.tools.split(",").map(t => {
        const name = t.trim();
        if (!name) return "";
        const style = getToolStyle(name);
        return `<span class="card-tool-badge" style="${style}">${escapeHtml(name)}</span>`;
      }).join("");
    } else {
      toolsContainer.innerHTML = `<span class="card-tool-badge" style="background: rgba(0,0,0,0.04); color: var(--muted);">도구 미등록</span>`;
    }
  }
  
  byId("cardStatHelp").textContent = stats.helpSignals;
  byId("cardStatSolved").textContent = stats.solved;
  byId("cardStatShowcase").textContent = stats.showcases;
  
  const cardFeedContainer = byId("cardFeedList");
  if (cardFeedContainer) {
    const items = [];
    state.showcases.filter(s => s.userId === builder.id || s.user_id === builder.id).forEach(s => {
      items.push(`✨ 쇼케이스 출하: <strong>"${escapeHtml(s.title)}"</strong>`);
    });
    state.helps.filter(h => (h.userId === builder.id || h.user_id === builder.id) && h.solved).forEach(h => {
      items.push(`✅ 해결 완료: <strong>"${escapeHtml(h.title)}"</strong>`);
    });
    state.chats.filter(c => (c.userId === builder.id || c.user_id === builder.id) && c.text && c.text.includes("도움 요청을 도울 수 있다고 했습니다")).forEach(c => {
      const match = c.text.match(/"([^"]+)"/);
      const title = match ? match[1] : "도움 요청";
      items.push(`🤝 도움 제안: <strong>"${escapeHtml(title)}"</strong>`);
    });
    
    if (items.length === 0) {
      cardFeedContainer.innerHTML = `<div class="card-feed-item" style="color: var(--muted); text-align: center;">최근 활동 기록이 없습니다.</div>`;
    } else {
      cardFeedContainer.innerHTML = items.map(html => `<div class="card-feed-item">${html}</div>`).join("");
    }
  }
  
  const isMe = builder.id === "me" || (currentUser && builder.id === currentUser.id);
  const actionsRow = document.querySelector(".card-actions-row");
  if (actionsRow) {
    actionsRow.style.display = isMe ? "none" : "grid";
  }
  
  const coffeeBtn = byId("cardCoffeeBtn");
  const helpBtn = byId("cardHelpBtn");
  
  if (coffeeBtn) {
    coffeeBtn.onclick = () => {
      coffeeBtn.disabled = true;
      requestCoffeeChat(builder.id)
        .then(() => {
          renderAll();
          byId("builderCardModal").close();
        })
        .catch(err => alert(err.message))
        .finally(() => {
          coffeeBtn.disabled = false;
        });
    };
  }
  
  if (helpBtn) {
    const activeHelp = state.helps.find(h => (h.userId === builder.id || h.user_id === builder.id) && !h.solved);
    if (activeHelp) {
      helpBtn.disabled = false;
      helpBtn.textContent = "🤝 이 문제 돕기";
      helpBtn.onclick = () => {
        helpBtn.disabled = true;
        addRoomChat(`${state.profile.nickname || "나"}님이 "${activeHelp.title}" 도움 요청을 도울 수 있다고 했습니다.`, activeHelp.roomId)
          .then(() => {
            renderAll();
            byId("builderCardModal").close();
          })
          .catch(err => alert(err.message))
          .finally(() => {
            helpBtn.disabled = false;
          });
      };
    } else {
      helpBtn.disabled = true;
      helpBtn.textContent = "🤝 도울 요청 없음";
      helpBtn.onclick = null;
    }
  }
  
  const holoCard = byId("holoCard");
  if (holoCard) {
    holoCard.style.transform = "none";
    const reflection = holoCard.querySelector(".holo-reflection");
    if (reflection) {
      reflection.style.display = "none";
    }
    holoCard.onmousemove = null;
    holoCard.onmouseleave = null;
  }
  
  byId("builderCardModal").showModal();
}

// 5. Register Events for Pomodoro & Audio
byId("pomoStartBtn")?.addEventListener("click", startPomo);
byId("pomoResetBtn")?.addEventListener("click", resetPomo);
byId("pomoZenBtn")?.addEventListener("click", () => {
  initAudio();
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  byId("zenGoalText").textContent = state.profile.goal || "오늘의 목표 미정";
  byId("zenOverlay").classList.remove("is-hidden");
});

byId("zenCloseBtn")?.addEventListener("click", () => {
  byId("zenOverlay").classList.add("is-hidden");
});
byId("zenPomoStartBtn")?.addEventListener("click", startPomo);
byId("zenPomoResetBtn")?.addEventListener("click", resetPomo);

// Volume inputs
["volRain", "volWaves", "volHum", "volFire"].forEach(id => {
  byId(id)?.addEventListener("input", (e) => {
    setVolume(id.replace("vol", "").toLowerCase(), parseFloat(e.target.value));
  });
});
byId("ambientMuteBtn")?.addEventListener("click", toggleMute);
