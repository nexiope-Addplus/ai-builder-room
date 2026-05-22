const categories = ["Vibe Coding", "App Building", "Design", "Automation", "Prompt / Workflow", "Showcase"];
const statuses = ["집중 중", "질문 가능", "도움 필요", "커피챗 가능", "쉬는 중", "데모 준비 중"];
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
const authReady = Boolean(authConfig.supabaseUrl && authConfig.supabaseAnonKey && window.supabase);
const authClient = authReady ? window.supabase.createClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey) : null;
let currentUser = null;
let remoteReady = false;
let realtimeChannel = null;
let selectedSeatId = localStorage.getItem("ai-builder-selected-seat") || "A1";
let isSeatCheckedIn = localStorage.getItem("ai-builder-seat-checked-in") === todayKey();
let usageTimer = null;

const seedState = {
  profile: {
    nickname: "나",
    goal: "Claude Code로 AI 작업실 MVP 만들기",
    category: "Vibe Coding",
    status: "질문 가능",
    tools: "Claude Code, GPT, Figma"
  },
  activeRoomId: "vibe-1",
  rooms: [
    { id: "vibe-1", name: "Vibe Coding 작업실 1", category: "Vibe Coding", limit: 8 },
    { id: "app-1", name: "App Building 작업실 1", category: "App Building", limit: 8 },
    { id: "design-1", name: "Design 피드백룸", category: "Design", limit: 8 },
    { id: "auto-1", name: "Automation 실험실", category: "Automation", limit: 8 },
    { id: "help-1", name: "빠른 도움방", category: "Prompt / Workflow", limit: 12 }
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
    return JSON.parse(saved);
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
  return getUsageSeconds() < dailySeatLimitSeconds;
}

function selectedSeatButton() {
  return document.querySelector(`[data-seat-id="${selectedSeatId}"]`);
}

function selectedSeatIsEmpty() {
  return selectedSeatButton()?.dataset.builderName === "빈 자리";
}

function selectedSeatIsMine() {
  return selectedSeatButton()?.dataset.builderId === (currentUser?.id || "me");
}

function startUsageTimer() {
  clearInterval(usageTimer);
  usageTimer = setInterval(() => {
    if (!currentUser || !isSeatCheckedIn || !hasSeatTimeLeft()) {
      renderUsagePass();
      return;
    }
    setUsageSeconds(getUsageSeconds() + 60);
    renderUsagePass();
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
}

function syncOAuthButtons() {
  const providers = new Set(authConfig.oauthProviders || []);
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
    tools: "Claude Code, GPT"
  };
}

function toProfileRow() {
  return {
    id: currentUser.id,
    nickname: state.profile.nickname,
    goal: state.profile.goal,
    category: state.profile.category,
    status: state.profile.status,
    tools: state.profile.tools,
    updated_at: new Date().toISOString()
  };
}

function fromProfileRow(row) {
  if (!row) return defaultProfileFromUser(currentUser);
  return {
    nickname: row.nickname || "나",
    goal: row.goal || "오늘의 목표 미정",
    category: row.category || "Vibe Coding",
    status: row.status || "질문 가능",
    tools: row.tools || "도구 미지정"
  };
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
    solved: row.solved
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
    solved: row.solved
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
    body: row.body
  };
}

function mapChat(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    name: row.profiles?.nickname || "익명",
    text: row.body
  };
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
    authClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  showAuth();
}

async function upsertProfile() {
  if (!remoteReady) return;
  const { error } = await authClient.from("profiles").upsert(toProfileRow());
  if (error) throw error;
}

async function joinRoom(roomId = state.activeRoomId) {
  if (!remoteReady) return;
  const room = state.rooms.find((item) => item.id === roomId);
  const occupied = roomBuilders(roomId).filter((builder) => builder.id !== currentUser.id).length;
  if (room && occupied >= room.limit) {
    alert("이 방은 정원이 가득 찼습니다. 다른 방을 선택하거나 새 방을 만들어주세요.");
    return;
  }
  const { error } = await authClient.from("room_members").upsert({
    user_id: currentUser.id,
    room_id: roomId,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function loadRemoteState() {
  const [profileRes, roomsRes, membersRes, helpsRes, questionsRes, showcasesRes, chatsRes] = await Promise.all([
    authClient.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
    authClient.from("rooms").select("*").order("created_at", { ascending: true }),
    authClient.from("room_members").select("room_id, profiles(id,nickname,goal,category,status,tools)").order("updated_at", { ascending: false }),
    authClient.from("help_requests").select("*").order("created_at", { ascending: false }),
    authClient.from("questions").select("*").order("created_at", { ascending: false }),
    authClient.from("showcases").select("*").order("created_at", { ascending: false }),
    authClient.from("chats").select("id, room_id, body, created_at, profiles(nickname)").order("created_at", { ascending: true }).limit(80)
  ]);

  const firstError = [profileRes, roomsRes, membersRes, helpsRes, questionsRes, showcasesRes, chatsRes].find((result) => result.error)?.error;
  if (firstError) throw firstError;

  state.profile = fromProfileRow(profileRes.data);
  state.rooms = roomsRes.data.map((room) => ({
    id: room.id,
    name: room.name,
    category: room.category,
    limit: room.capacity
  }));

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
      tools: member.profiles.tools || "도구 미지정"
    }));
  state.helps = helpsRes.data.map(mapHelp);
  state.questions = questionsRes.data.map(mapQuestion);
  state.showcases = showcasesRes.data.map(mapShowcase);
  state.chats = chatsRes.data.map(mapChat);
}

function subscribeRemoteChanges() {
  if (!remoteReady || realtimeChannel) return;
  realtimeChannel = authClient
    .channel("ai-builder-room-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "room_members" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "help_requests" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "showcases" }, refreshRemote)
    .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, refreshRemote)
    .subscribe();
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
  try {
    remoteReady = true;
    await loadRemoteState();
    await upsertProfile();
    if (!state.builders.some((builder) => builder.id === currentUser.id)) {
      await joinRoom(state.activeRoomId);
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

function fillSelect(select, options, value) {
  select.innerHTML = options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("");
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

function calculateBuilderXp() {
  const myId = currentUser?.id || "me";
  const myProfile = state.builders.find((builder) => builder.id === myId);
  const myHelpRequests = state.helps.filter((help) => help.userId === myId);
  const solvedRequests = myHelpRequests.filter((help) => help.solved);
  const myQuestions = state.questions.filter((question) => question.userId === myId);
  const solvedQuestions = myQuestions.filter((question) => question.solved);
  const myShowcases = state.showcases.filter((item) => item.userId === myId);
  const myChats = state.chats.filter((chat) => chat.userId === myId);
  const helpSignals = myChats.filter((chat) => chat.text.includes("도움 요청을 도울 수 있다고 했습니다"));
  const coffeeSignals = myChats.filter((chat) => chat.text.includes("커피챗을 요청했습니다"));
  const profileBonus = [state.profile.nickname, state.profile.goal, state.profile.category, state.profile.status, state.profile.tools].filter(Boolean).length * 5;
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

function syncProfileInputs(force = false) {
  if (!force && document.activeElement?.closest(".profile-panel")) {
    syncModalToolPickers();
    return;
  }
  byId("nicknameInput").value = state.profile.nickname;
  byId("goalInput").value = state.profile.goal;
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
  byId("roomsList").innerHTML = state.rooms
    .map((room) => {
      const count = roomBuilders(room.id).length;
      return `
        <button class="room-card ${room.id === active.id ? "active" : ""}" data-room-id="${room.id}">
          <strong>${escapeHtml(room.name)}</strong>
          <span>${escapeHtml(room.category)} · ${count}/${room.limit}</span>
        </button>
      `;
    })
    .join("");

  byId("activeRoomType").textContent = active.category;
  byId("activeRoomName").textContent = active.name;
  byId("activeRoomCount").textContent = roomBuilders(active.id).length;
  byId("activeRoomLimit").textContent = active.limit;
}

function renderFloors() {
  const active = activeRoom();
  byId("floorGrid").innerHTML = floorPlan
    .map((floor) => {
      const room = state.rooms.find((item) => item.category === floor.category);
      const isActive = active?.category === floor.category;
      const viewTarget = floor.category === "Showcase" ? "showcase" : "";
      return `
        <button class="floor-card ${isActive ? "active" : ""}" data-floor-room-id="${escapeHtml(room?.id || "")}" data-floor-view="${escapeHtml(viewTarget)}" ${room || viewTarget ? "" : "disabled"}>
          <strong>${escapeHtml(floor.floor)} · ${escapeHtml(floor.name)}</strong>
          <span>${escapeHtml(floor.note)}</span>
        </button>
      `;
    })
    .join("");
}

function renderBuilders() {
  const room = activeRoom();
  const builders = roomBuilders(room.id);
  const themeClass = roomThemeClass(room.category);
  const themeLabel = roomThemeLabel(room.category);
  const occupants = new Map();
  seatPlan.slice(0, room.limit).forEach((seat, index) => {
    occupants.set(seat.id, builders[index] || null);
  });

  byId("builderGrid").innerHTML = `
    <div class="cafe-room game-room ${themeClass}">
      <div class="map-zone zone-wood"></div>
      <div class="room-wall wall-top"></div>
      <div class="room-wall wall-left"></div>
      <div class="room-theme-sign">${escapeHtml(themeLabel)}</div>
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
          const selected = seat.id === selectedSeatId;
          const empty = !builder;
          const statusIcon = builder?.status === "도움 필요" ? "!" : builder?.status === "커피챗 가능" ? "☕" : builder ? "◐" : "";
          const statusClass = builder?.status === "도움 필요" ? "help" : builder?.status === "커피챗 가능" ? "coffee" : builder ? "focus" : "empty";
          const displayName = builder?.name || "Available";
          const tool = builder ? primaryTool(builder.tools) : "Open";
          const bubbleText = builder ? shortText(builder.goal, 22) : "빈 좌석";
      return `
        <button class="seat-button ${statusClass} ${empty ? "empty" : ""} ${selected ? "selected" : ""}"
          style="left:${seat.x}px; top:${seat.y}px"
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
  const scale = Math.min(1, grid.clientWidth / roomWidth);
  room.style.transform = `scale(${scale})`;
  grid.style.height = `${Math.ceil(roomHeight * scale)}px`;
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
            </div>
          </article>
        `;
      })
      .join("") || `<article class="compact-item"><p>아직 이 방에는 도움 요청이 없습니다.</p></article>`;
}

function renderChats() {
  const chats = state.chats.filter((chat) => chat.roomId === state.activeRoomId);
  byId("chatList").innerHTML =
    chats
      .map(
        (chat) => `
          <article class="chat-item">
            <p><strong>${escapeHtml(chat.name)}</strong> ${escapeHtml(chat.text)}</p>
          </article>
        `
      )
      .join("") || `<article class="chat-item"><p>첫 공유를 남겨보세요.</p></article>`;
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
          ${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">결과물 보기</a>` : ""}
          <div class="meta-row">
            <span class="tag">${escapeHtml(item.category)}</span>
            <span class="tag">${escapeHtml(item.tools || "도구 미지정")}</span>
          </div>
        </article>
      `
    )
    .join("");
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
  byId("metricOnline").textContent = state.builders.length;
  byId("metricHelp").textContent = helpCount;
  byId("metricSolved").textContent = helpCount ? `${Math.round((solvedCount / helpCount) * 100)}%` : "0%";
}

function renderUsagePass() {
  const used = getUsageSeconds();
  const percent = Math.min(100, Math.round((used / dailySeatLimitSeconds) * 100));
  const today = new Date();
  byId("passDate").textContent = today.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
  byId("passGoal").textContent = state.profile.goal || "오늘의 목표를 입력하고 좌석을 선택하세요.";
  byId("usageToday").textContent = `${formatDuration(used)} / 5시간`;
  byId("usageBarFill").style.width = `${percent}%`;
  byId("usageNote").textContent = hasSeatTimeLeft()
    ? isSeatCheckedIn
      ? "좌석 이용 중입니다. 1분 단위로 시간이 기록됩니다."
      : "좌석에 앉으면 이용 시간이 기록됩니다."
    : "오늘 무료 좌석 이용 시간이 끝났습니다. Q&A와 쇼케이스는 계속 볼 수 있어요.";
}

function renderSelectedSeat() {
  const seat = seatPlan.find((item) => item.id === selectedSeatId) || seatPlan[0];
  const selectedButton = document.querySelector(`[data-seat-id="${seat.id}"]`);
  const occupiedName = selectedButton?.dataset.builderName || "빈 자리";
  const status = selectedButton?.dataset.builderStatus || "사용 가능";
  byId("selectedSeatTitle").textContent = `${seat.id} · ${seat.name}`;
  byId("selectedSeatCopy").textContent =
    occupiedName === "빈 자리"
      ? "사용 가능한 좌석입니다. 오늘의 작업권으로 입장할 수 있습니다."
      : `${occupiedName} · ${status} · ${selectedButton?.dataset.builderGoal || ""}`;
  byId("sitSeatButton").textContent = selectedSeatIsMine() ? "내 좌석 입장" : occupiedName === "빈 자리" ? "이 자리에 앉기" : "좌석 정보 보기";
  byId("sitSeatButton").disabled = !hasSeatTimeLeft() || (occupiedName !== "빈 자리" && !selectedSeatIsMine());
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
    name: state.profile.nickname || "나",
    category: state.profile.category,
    status: state.profile.status,
    goal: state.profile.goal,
    tools: state.profile.tools
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

document.addEventListener("click", (event) => {
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
    if (hiddenInput) refreshToolPicker(picker, hiddenInput);
    return;
  }

  const floorButton = event.target.closest("[data-floor-room-id]");
  if (floorButton?.dataset.floorView) {
    document.querySelector(`[data-view="${floorButton.dataset.floorView}"]`)?.click();
    return;
  }
  if (floorButton && floorButton.dataset.floorRoomId) {
    state.activeRoomId = floorButton.dataset.floorRoomId;
    saveActiveRoom();
    if (remoteReady) {
      joinRoom(state.activeRoomId)
        .then(refreshRemote)
        .catch((error) => alert(error.message));
    } else {
      updateMyBuilder();
      saveState();
      renderAll();
    }
    return;
  }

  const seatButton = event.target.closest("[data-seat-id]");
  if (seatButton) {
    selectedSeatId = seatButton.dataset.seatId;
    localStorage.setItem("ai-builder-selected-seat", selectedSeatId);
    document.querySelectorAll(".seat-button").forEach((item) => item.classList.remove("selected"));
    seatButton.classList.add("selected");
    renderSelectedSeat();
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
    if (!hasSeatTimeLeft()) {
      alert("오늘 무료 좌석 이용 시간이 끝났습니다. 내일 다시 커피챗을 요청할 수 있어요.");
      return;
    }
    const match = state.builders.find((builder) => builder.id === coffeeButton.dataset.coffeeId);
    if (!match) return;
    coffeeButton.disabled = true;
    addRoomChat(`${state.profile.nickname || "나"}님이 ${match.name}님에게 10분 커피챗을 요청했습니다.`, match.roomId)
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
    saveActiveRoom();
    if (remoteReady) {
      joinRoom(nextRoomId)
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
  });
});

byId("saveProfile").addEventListener("click", async () => {
  const saveButton = byId("saveProfile");
  saveButton.disabled = true;
  saveButton.textContent = "저장 중...";
  setProfileSaveNote("");
  state.profile = {
    nickname: byId("nicknameInput").value.trim() || "나",
    goal: byId("goalInput").value.trim() || "오늘의 목표 미정",
    category: byId("categoryInput").value,
    status: byId("statusInput").value,
    tools: byId("toolsInput").value.trim() || "도구 미지정"
  };
  updateMyBuilder();
  try {
    if (remoteReady) {
      await upsertProfile();
      await joinRoom(state.activeRoomId);
      await loadRemoteState();
    } else {
      saveState();
    }
    renderAll({ forceProfileSync: true });
    setProfileSaveNote("저장됐습니다.");
  } catch (error) {
    setProfileSaveNote(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "상태 저장";
  }
});

byId("sitSeatButton").addEventListener("click", async () => {
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. Q&A와 쇼케이스는 계속 볼 수 있어요.");
    return;
  }
  if (!selectedSeatIsEmpty() && !selectedSeatIsMine()) {
    alert("이미 사용 중인 좌석입니다. 빈 좌석을 선택해주세요.");
    return;
  }
  isSeatCheckedIn = true;
  localStorage.setItem("ai-builder-seat-checked-in", todayKey());
  setUsageSeconds(getUsageSeconds() + 60);
  await addRoomChat(`${state.profile.nickname || "나"}님이 ${selectedSeatId} 좌석에 입장했습니다.`);
  renderAll();
});

byId("createRoom").addEventListener("click", async () => {
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. 내일 다시 새 방을 만들 수 있어요.");
    return;
  }
  const category = state.profile.category;
  const number = state.rooms.filter((room) => room.category === category).length + 1;
  const room = {
    id: `${category.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")}-${Date.now()}`,
    name: `${category} 작업실 ${number}`,
    category,
    limit: category === "Prompt / Workflow" ? 12 : 8
  };
  try {
    if (remoteReady) {
      const { data, error } = await authClient
        .from("rooms")
        .insert({ name: room.name, category: room.category, capacity: room.limit, created_by: currentUser.id })
        .select()
        .single();
      if (error) throw error;
      state.activeRoomId = data.id;
      saveActiveRoom();
      await joinRoom(data.id);
      await loadRemoteState();
    } else {
      state.rooms.push(room);
      state.activeRoomId = room.id;
      updateMyBuilder();
      saveState();
    }
    renderAll();
  } catch (error) {
    alert(error.message);
  }
});

byId("chatForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!hasSeatTimeLeft()) {
    alert("오늘 무료 좌석 이용 시간이 끝났습니다. 채팅은 내일 다시 사용할 수 있어요.");
    return;
  }
  const input = byId("chatInput");
  const text = input.value.trim();
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
    if (remoteReady) {
      const { error } = await authClient.from("help_requests").insert({
        room_id: state.activeRoomId,
        user_id: currentUser.id,
        title: data.get("title"),
        category: data.get("category"),
        help_type: data.get("type"),
        tools: data.get("tools"),
        body: data.get("body")
      });
      if (error) throw error;
      await loadRemoteState();
    } else {
      state.helps.unshift({
        id: `h-${Date.now()}`,
        roomId: state.activeRoomId,
        userId: currentUser?.id || "me",
        title: data.get("title"),
        category: data.get("category"),
        type: data.get("type"),
        tools: data.get("tools"),
        body: data.get("body"),
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
    if (remoteReady) {
      const { error } = await authClient.from("questions").insert({
        user_id: currentUser.id,
        title: data.get("title"),
        category: data.get("category"),
        tools: data.get("tools"),
        body: data.get("body")
      });
      if (error) throw error;
      await loadRemoteState();
    } else {
      state.questions.unshift({
        id: `q-${Date.now()}`,
        userId: currentUser?.id || "me",
        title: data.get("title"),
        category: data.get("category"),
        tools: data.get("tools"),
        body: data.get("body"),
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
    if (remoteReady) {
      const { data: created, error } = await authClient
        .from("showcases")
        .insert({
          user_id: currentUser.id,
          title: data.get("title"),
          category: data.get("category"),
          tools: data.get("tools"),
          url: data.get("url"),
          body: data.get("body")
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
        title: data.get("title"),
        category: data.get("category"),
        tools: data.get("tools"),
        url: data.get("url"),
        body: data.get("body")
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

byId("resetDemo").addEventListener("click", () => {
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

window.addEventListener("resize", fitRoomMap);

initAuth();
