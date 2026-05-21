const categories = ["Vibe Coding", "App Building", "Design", "Automation", "Prompt / Workflow", "Showcase"];
const statuses = ["집중 중", "질문 가능", "도움 필요", "커피챗 가능", "쉬는 중", "데모 준비 중"];
const authConfig = window.AI_BUILDER_CONFIG || {};
const authReady = Boolean(authConfig.supabaseUrl && authConfig.supabaseAnonKey && window.supabase);
const authClient = authReady ? window.supabase.createClient(authConfig.supabaseUrl, authConfig.supabaseAnonKey) : null;
let currentUser = null;

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

function byId(id) {
  return document.getElementById(id);
}

function showAuth(message) {
  byId("authScreen").classList.remove("is-hidden");
  byId("appShell").classList.add("is-hidden");
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

async function signOut() {
  if (authClient) await authClient.auth.signOut();
  currentUser = null;
  showAuth();
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

  currentUser = data.session?.user || null;
  if (!currentUser) {
    showAuth();
    return;
  }

  applyUserToProfile(currentUser);
  showApp();
  renderAll();

  authClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    if (currentUser) {
      applyUserToProfile(currentUser);
      showApp();
      renderAll();
    } else {
      showAuth();
    }
  });
}

function fillSelect(select, options, value) {
  select.innerHTML = options.map((option) => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("");
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

function activeRoom() {
  return state.rooms.find((room) => room.id === state.activeRoomId) || state.rooms[0];
}

function roomBuilders(roomId = state.activeRoomId) {
  return state.builders.filter((builder) => builder.roomId === roomId);
}

function syncProfileInputs() {
  byId("nicknameInput").value = state.profile.nickname;
  byId("goalInput").value = state.profile.goal;
  fillSelect(byId("categoryInput"), categories, state.profile.category);
  fillSelect(byId("statusInput"), statuses, state.profile.status);
  byId("toolsInput").value = state.profile.tools;

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

function renderBuilders() {
  const room = activeRoom();
  const builders = roomBuilders(room.id);
  const seats = [...builders];
  while (seats.length < room.limit) seats.push(null);

  byId("builderGrid").innerHTML = seats
    .map((builder) => {
      if (!builder) {
        return `<div class="builder-card empty-seat">빈 자리</div>`;
      }
      return `
        <article class="builder-card">
          <div class="builder-avatar">
            <div class="avatar-dot">${escapeHtml(initials(builder.name))}</div>
            <div class="builder-name">${escapeHtml(builder.name)}</div>
          </div>
          <span class="status-pill">${escapeHtml(builder.status)}</span>
          <p>${escapeHtml(builder.goal)}</p>
          <p>${escapeHtml(builder.category)}</p>
          <div class="tools">${escapeHtml(builder.tools)}</div>
        </article>
      `;
    })
    .join("");
}

function renderHelp() {
  const roomHelps = state.helps.filter((help) => help.roomId === state.activeRoomId);
  byId("roomHelpList").innerHTML =
    roomHelps
      .map(
        (help) => `
          <article class="compact-item">
            <strong>${escapeHtml(help.title)}</strong>
            <p>${escapeHtml(help.body)}</p>
            <div class="meta-row">
              <span class="tag">${escapeHtml(help.category)}</span>
              <span class="tag">${escapeHtml(help.type)}</span>
              <span class="tag ${help.solved ? "solved" : ""}">${help.solved ? "해결됨" : "미해결"}</span>
            </div>
          </article>
        `
      )
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
  byId("qaList").innerHTML = state.questions
    .map(
      (question) => `
        <article class="content-card">
          <h4>${escapeHtml(question.title)}</h4>
          <p>${escapeHtml(question.body)}</p>
          <div class="meta-row">
            <span class="tag">${escapeHtml(question.category)}</span>
            <span class="tag">${escapeHtml(question.tools || "도구 미지정")}</span>
            <span class="tag ${question.solved ? "solved" : ""}">${question.solved ? "해결됨" : "미해결"}</span>
          </div>
        </article>
      `
    )
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
    .filter((builder) => builder.id !== "me")
    .map((builder) => {
      const score =
        (builder.category === profile.category ? 2 : 0) +
        (builder.status === "커피챗 가능" ? 2 : 0) +
        (builder.tools.toLowerCase().split(",").some((tool) => profile.tools.toLowerCase().includes(tool.trim())) ? 1 : 0);
      return { ...builder, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  byId("coffeeMatches").innerHTML = candidates
    .map(
      (match) => `
        <article class="match-item">
          <strong>${escapeHtml(match.name)} · ${escapeHtml(match.category)}</strong>
          <p>${escapeHtml(match.goal)}</p>
          <div class="meta-row">
            <span class="tag">${escapeHtml(match.status)}</span>
            <span class="tag">${escapeHtml(match.tools)}</span>
          </div>
        </article>
      `
    )
    .join("");
}

function renderMetrics() {
  const helpCount = state.helps.length;
  const solvedCount = state.helps.filter((help) => help.solved).length;
  byId("metricOnline").textContent = state.builders.length;
  byId("metricHelp").textContent = helpCount;
  byId("metricSolved").textContent = helpCount ? `${Math.round((solvedCount / helpCount) * 100)}%` : "0%";
}

function renderAll() {
  syncProfileInputs();
  renderRooms();
  renderBuilders();
  renderHelp();
  renderChats();
  renderQuestions();
  renderShowcases();
  renderCoffeeMatches();
  renderMetrics();
}

function updateMyBuilder() {
  const me = state.builders.find((builder) => builder.id === "me");
  const room = activeRoom();
  Object.assign(me, {
    roomId: room.id,
    name: state.profile.nickname || "나",
    category: state.profile.category,
    status: state.profile.status,
    goal: state.profile.goal,
    tools: state.profile.tools
  });
}

document.addEventListener("click", (event) => {
  const roomButton = event.target.closest("[data-room-id]");
  if (roomButton) {
    state.activeRoomId = roomButton.dataset.roomId;
    updateMyBuilder();
    saveState();
    renderAll();
  }

  const modalButton = event.target.closest("[data-open-modal]");
  if (modalButton) {
    const modal = byId(modalButton.dataset.openModal);
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

byId("saveProfile").addEventListener("click", () => {
  state.profile = {
    nickname: byId("nicknameInput").value.trim() || "나",
    goal: byId("goalInput").value.trim() || "오늘의 목표 미정",
    category: byId("categoryInput").value,
    status: byId("statusInput").value,
    tools: byId("toolsInput").value.trim() || "도구 미지정"
  };
  updateMyBuilder();
  saveState();
  renderAll();
});

byId("createRoom").addEventListener("click", () => {
  const category = state.profile.category;
  const number = state.rooms.filter((room) => room.category === category).length + 1;
  const room = {
    id: `${category.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")}-${Date.now()}`,
    name: `${category} 작업실 ${number}`,
    category,
    limit: category === "Prompt / Workflow" ? 12 : 8
  };
  state.rooms.push(room);
  state.activeRoomId = room.id;
  updateMyBuilder();
  saveState();
  renderAll();
});

byId("chatForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = byId("chatInput");
  const text = input.value.trim();
  if (!text) return;
  state.chats.push({ id: `c-${Date.now()}`, roomId: state.activeRoomId, name: state.profile.nickname || "나", text });
  input.value = "";
  saveState();
  renderChats();
});

byId("helpForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.helps.unshift({
    id: `h-${Date.now()}`,
    roomId: state.activeRoomId,
    title: data.get("title"),
    category: data.get("category"),
    type: data.get("type"),
    tools: data.get("tools"),
    body: data.get("body"),
    solved: false
  });
  event.currentTarget.reset();
  event.currentTarget.closest("dialog").close();
  saveState();
  renderAll();
});

byId("questionForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.questions.unshift({
    id: `q-${Date.now()}`,
    title: data.get("title"),
    category: data.get("category"),
    tools: data.get("tools"),
    body: data.get("body"),
    solved: false
  });
  event.currentTarget.reset();
  event.currentTarget.closest("dialog").close();
  saveState();
  renderAll();
});

byId("showcaseForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  state.showcases.unshift({
    id: `s-${Date.now()}`,
    title: data.get("title"),
    category: data.get("category"),
    tools: data.get("tools"),
    url: data.get("url"),
    body: data.get("body")
  });
  event.currentTarget.reset();
  event.currentTarget.closest("dialog").close();
  saveState();
  renderAll();
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

initAuth();
