const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const imageUpload = document.getElementById("imageUpload");
const chatList = document.getElementById("chatList");
const newChatBtn = document.getElementById("newChatBtn");
const headerLogo = document.getElementById("icon");
const reloadOverlay = document.getElementById("reloadOverlay");

// Temporary image storage for uploads
let uploadedImageBase64 = null;
let uploadedImageMimeType = null;

if (imageUpload) {
  imageUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result.split(",")[1];
        uploadedImageBase64 = base64String;
        uploadedImageMimeType = file.type;
        addMessage(`📷 Image attached: *${file.name}*. You can now ask me to remove its background or describe it!`, "bot");
      };
      reader.readAsDataURL(file);
    }
  });
}

// 📋 Tasks Manager State & UI Setup
let avenoTasks = JSON.parse(localStorage.getItem("avenoTasksList")) || [
  { id: 1, title: "Finalize Aveno Workspace frontend", completed: false },
  { id: 2, title: "Test speech recognition and TTS voices", completed: true },
  { id: 3, title: "Configure local rule triggers", completed: false }
];

function saveAvenoTasks() {
  localStorage.setItem("avenoTasksList", JSON.stringify(avenoTasks));
}

function initTasksDrawer() {
  if (document.getElementById("tasksDrawer")) return;

  const tasksHTML = `
    <div id="tasksDrawer" style="position:fixed; right:-320px; top:0; width:300px; height:100vh; background:var(--bg-card); border-left:1px solid var(--border-color); box-shadow:-4px 0 15px rgba(0,0,0,0.3); transition:right 0.3s ease; z-index:1500; display:flex; flex-direction:column; padding:16px; gap:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
        <h4 style="margin:0; color:var(--text-primary); font-size:1rem;">✅ Aveno Tasks</h4>
        <button id="closeTasksBtn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">✖</button>
      </div>
      <div style="display:flex; gap:8px;">
        <input type="text" id="newTaskInput" placeholder="Add a new task..." style="flex:1; background:var(--bg-input); border:1px solid var(--border-color); border-radius:6px; padding:8px; color:var(--text-primary); outline:none; font-size:0.85rem;">
        <button id="addTaskBtn" style="background:var(--accent); color:#fff; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; font-size:0.85rem;">Add</button>
      </div>
      <div id="tasksListContainer" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px;"></div>
    </div>
    <button id="openTasksBtn" style="position:fixed; right:95px; top:16px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary); padding:8px 12px; border-radius:8px; cursor:pointer; z-index:1400; font-size:0.9rem; box-shadow:0 2px 8px rgba(0,0,0,0.2);">✅ Tasks</button>
  `;

  document.body.insertAdjacentHTML("beforeend", tasksHTML);

  const tasksDrawer = document.getElementById("tasksDrawer");
  const openTasksBtn = document.getElementById("openTasksBtn");
  const closeTasksBtn = document.getElementById("closeTasksBtn");
  const newTaskInput = document.getElementById("newTaskInput");
  const addTaskBtn = document.getElementById("addTaskBtn");

  renderTasksList();

  openTasksBtn.addEventListener("click", () => {
    tasksDrawer.style.right = "0";
  });

  closeTasksBtn.addEventListener("click", () => {
    tasksDrawer.style.right = "-320px";
  });

  addTaskBtn.addEventListener("click", addNewTask);
  newTaskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addNewTask();
  });
}

function renderTasksList() {
  const container = document.getElementById("tasksListContainer");
  if (!container) return;
  container.innerHTML = "";

  if (avenoTasks.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; margin-top:20px;">No tasks yet. Add one above!</p>`;
    return;
  }

  avenoTasks.forEach((task) => {
    const taskEl = document.createElement("div");
    taskEl.style.cssText = "display:flex; align-items:center; justify-content:space-between; background:var(--bg-input); padding:8px 10px; border-radius:6px; font-size:0.85rem; border:1px solid var(--border-color);";
    
    taskEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
        <input type="checkbox" ${task.completed ? "checked" : ""} onclick="toggleTask(${task.id})" style="cursor:pointer;">
        <span style="color:var(--text-primary); ${task.completed ? "text-decoration:line-through; opacity:0.6;" : ""}">${escapeHtml(task.title)}</span>
      </div>
      <button onclick="deleteTask(${task.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.8rem;">🗑️</button>
    `;
    container.appendChild(taskEl);
  });
}

function addNewTask() {
  const input = document.getElementById("newTaskInput");
  if (!input || !input.value.trim()) return;

  avenoTasks.push({
    id: Date.now(),
    title: input.value.trim(),
    completed: false
  });

  input.value = "";
  saveAvenoTasks();
  renderTasksList();
}

window.toggleTask = function(id) {
  const task = avenoTasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveAvenoTasks();
    renderTasksList();
  }
};

window.deleteTask = function(id) {
  avenoTasks = avenoTasks.filter(t => t.id !== id);
  saveAvenoTasks();
  renderTasksList();
};

// Voice & Speech Elements
const micBtn = document.getElementById("micBtn");
const voiceToggle = document.getElementById("voiceToggle");
let recognition = null;
let synth = window.speechSynthesis;
let availableVoices = [];

let selectedVoiceIndex = 0;
let voicePitch = 1.0;
let voiceRate = 1.0;

function loadAvenoVoices() {
  if (!synth) return;
  availableVoices = synth.getVoices();
  
  if (availableVoices.length === 0 && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      availableVoices = synth.getVoices();
    };
  }
}
if (synth) {
  loadAvenoVoices();
}

// Sidebar & Profile Elements
const avenoSidebar = document.getElementById("avenoSidebar");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");
const userProfileBar = document.getElementById("userProfileBar");
const profileMenu = document.getElementById("profileMenu");
const themeToggleOption = document.getElementById("themeToggleOption");
const themeIcon = document.getElementById("themeIcon");
const themeText = document.getElementById("themeText");
const editProfileOption = document.getElementById("editProfileOption");
const authActionOption = document.getElementById("authActionOption");
const authIcon = document.getElementById("authIcon");
const authText = document.getElementById("authText");
const clearDataOption = document.getElementById("clearDataOption");
const userNameDisplay = document.getElementById("userNameDisplay");
const userRoleDisplay = document.getElementById("userRoleDisplay");
const avatarDisplay = document.getElementById("avatarDisplay");
const guestNotice = document.getElementById("guestNotice");

// Edit Profile Modal Elements
const profileModal = document.getElementById("profileModal");
const profileNameInput = document.getElementById("profileNameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const closeProfileModalBtn = document.getElementById("closeProfileModalBtn");
const profileAvatarInput = document.getElementById("profileAvatarInput");
const modalAvatarPreview = document.getElementById("modalAvatarPreview");

// Global App State
let usersDB = JSON.parse(localStorage.getItem("avenoUsersDB")) || {};
let currentUser = localStorage.getItem("avenoCurrentUser") || null;

let tempAvatarBase64 = "";
let chats = [];
let currentChatId = null;
let activeTimer = null;

if (headerLogo) {
  headerLogo.addEventListener("click", () => {
    const overlay = document.getElementById("avenoReloadOverlay");
    if (overlay) overlay.style.display = "flex";
    setTimeout(() => {
      location.reload();
    }, 2900);
  });
}

window.addEventListener("beforeunload", () => {
  sessionStorage.setItem("avenoIsReloading", "true");
  FaviconSpinner.start();
});

window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("avenoReloadOverlay");
  const wasReloading = sessionStorage.getItem("avenoIsReloading");

  if (wasReloading && overlay) {
    sessionStorage.removeItem("avenoIsReloading");
    overlay.style.display = "flex";
    
    setTimeout(() => {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
        overlay.style.opacity = "1";
      }, 400);
    }, 800);
  }
  
  injectSpeechSwitchUI();
});

// 🎛️ Inject Speech Switch directly beside or inside the message bar container
function injectSpeechSwitchUI() {
  const targetParent = (userInput && userInput.parentElement) ? userInput.parentElement : document.body;
  if (!document.getElementById("avenoSpeechSwitchContainer")) {
    const switchWrapper = document.createElement("div");
    switchWrapper.id = "avenoSpeechSwitchContainer";
    switchWrapper.style.cssText = "display:flex; align-items:center; gap:6px; margin:0 8px; font-size:0.85rem; color:var(--text-secondary, #cbd5e1); user-select:none; white-space:nowrap;";
    
    const savedSpeechState = localStorage.getItem("avenoSpeechEnabled") === "true";

    switchWrapper.innerHTML = `
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;" title="Turn Speech Output On or Off">
        <span style="font-weight:600; color:var(--text-primary, #f8fafc);">🔊 Speech</span>
        <input type="checkbox" id="speechSwitch" ${savedSpeechState ? "checked" : ""} style="cursor:pointer; width:18px; height:18px; accent-color:var(--accent, #38bdf8);">
      </label>
    `;
    
    if (userInput && userInput.parentNode) {
      userInput.parentNode.insertBefore(switchWrapper, userInput.nextSibling);
    } else {
      targetParent.appendChild(switchWrapper);
    }
    
    const speechSwitch = document.getElementById("speechSwitch");
    if (speechSwitch) {
      speechSwitch.addEventListener("change", (e) => {
        localStorage.setItem("avenoSpeechEnabled", e.target.checked);
        if (voiceToggle) voiceToggle.checked = e.target.checked;

        // 🔇 Instantly stop talking if switched OFF mid-speech
        if (!e.target.checked && synth) {
          synth.cancel();
        }
      });
    }
  }
}

// 🎵 Background Music Toggle Logic
const headerMusicBtn = document.getElementById("headerMusicBtn");
const bgMusic = document.getElementById("bgMusic");

if (headerMusicBtn && bgMusic) {
  // Check stored preference or default to paused
  let isMusicPlaying = localStorage.getItem("avenoMusicPlaying") === "true";
  
  if (isMusicPlaying) {
    bgMusic.play().catch(() => {
      // Browser autoplay policy might block unprompted audio until user interaction
      isMusicPlaying = false;
      headerMusicBtn.classList.add("music-off");
    });
    headerMusicBtn.classList.remove("music-off");
  } else {
    headerMusicBtn.classList.add("music-off");
  }

  headerMusicBtn.addEventListener("click", () => {
    if (bgMusic.paused) {
      bgMusic.play().then(() => {
        headerMusicBtn.classList.remove("music-off");
        localStorage.setItem("avenoMusicPlaying", "true");
      }).catch(err => {
        console.error("Audio playback restricted by browser policy:", err);
      });
    } else {
      bgMusic.pause();
      headerMusicBtn.classList.add("music-off");
      localStorage.setItem("avenoMusicPlaying", "false");
    }
  });
}

// 📜 Scroll to Bottom Floating Button Logic
// 📜 Centered Scroll to Bottom Floating Button Logic
const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");

if (chatBox && scrollToBottomBtn) {
  chatBox.addEventListener("scroll", () => {
    const distanceFromBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    
    if (distanceFromBottom > 120) {
      // User scrolled up -> Fade in and slide into position
      scrollToBottomBtn.style.opacity = "1";
      scrollToBottomBtn.style.visibility = "visible";
      scrollToBottomBtn.style.transform = "translateX(-50%) translateY(0)";
    } else {
      // User is at the bottom -> Hide button
      scrollToBottomBtn.style.opacity = "0";
      scrollToBottomBtn.style.visibility = "hidden";
      scrollToBottomBtn.style.transform = "translateX(-50%) translateY(10px)";
    }
  });

  scrollToBottomBtn.addEventListener("click", () => {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });
  });
}

function initUserSession() {
  if (currentUser && usersDB[currentUser]) {
    const user = usersDB[currentUser];
    updateUserProfileUI(user.name, user.avatar, "Registered Member");
    if (editProfileOption) editProfileOption.style.display = "flex";
    if (guestNotice) guestNotice.style.display = "none";
    if (authText) authText.textContent = "Log Out";
    if (authIcon) authIcon.textContent = "🚪";

    chats = user.chats || [{ id: Date.now(), title: "New Chat", messages: [] }];
  } else {
    currentUser = null;
    updateUserProfileUI("Guest User", "", "Temporary Session");
    if (editProfileOption) editProfileOption.style.display = "none";
    if (guestNotice) guestNotice.style.display = "flex";
    if (authText) authText.textContent = "Log In / Register";
    if (authIcon) authIcon.textContent = "🔑";

    chats = [{ id: Date.now(), title: "Guest Session", messages: [] }];
  }

  currentChatId = chats[0].id;
  renderCurrentChat();
  renderChatList();
  setupSpeechRecognition();
  loadAvenoVoices();
  initNotesDrawer();
  initTasksDrawer();
  setupTopicCardHandlers();
}

function updateUserProfileUI(name, avatar, role) {
  if (userNameDisplay) userNameDisplay.textContent = name || "User";
  if (userRoleDisplay) userRoleDisplay.textContent = role || "";
  
  if (avatarDisplay) {
    if (avatar) {
      avatarDisplay.innerHTML = `<img src="${avatar}" alt="Avatar">`;
    } else {
      const initials = (name || "G").split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
      avatarDisplay.textContent = initials || "G";
    }
  }
}

function saveCurrentUserData() {
  if (currentUser && usersDB[currentUser]) {
    usersDB[currentUser].chats = chats;
    localStorage.setItem("avenoUsersDB", JSON.stringify(usersDB));
  }
}

if (authActionOption) {
  authActionOption.addEventListener("click", () => {
    if (currentUser) {
      if (confirm("Log out of your account?")) {
        currentUser = null;
        localStorage.removeItem("avenoCurrentUser");
        initUserSession();
        botReply("You have logged out. You are now in Guest Mode.");
      }
    } else {
      window.location.href = "auth.html";
    }
    if (profileMenu) profileMenu.classList.remove("show");
  });
}

if (editProfileOption) {
  editProfileOption.addEventListener("click", () => {
    if (!currentUser || !usersDB[currentUser]) return;
    const user = usersDB[currentUser];
    if (profileNameInput) profileNameInput.value = user.name;
    tempAvatarBase64 = user.avatar;

    if (modalAvatarPreview) {
      if (tempAvatarBase64) {
        modalAvatarPreview.innerHTML = `<img src="${tempAvatarBase64}" alt="Avatar">`;
      } else {
        modalAvatarPreview.textContent = user.name[0].toUpperCase();
      }
    }

    if (profileModal) profileModal.style.display = "flex";
    if (profileMenu) profileMenu.classList.remove("show");
  });
}

if (closeProfileModalBtn) {
  closeProfileModalBtn.addEventListener("click", () => {
    if (profileModal) profileModal.style.display = "none";
  });
}

if (profileAvatarInput) {
  profileAvatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        tempAvatarBase64 = event.target.result;
        if (modalAvatarPreview) {
          modalAvatarPreview.innerHTML = `<img src="${tempAvatarBase64}" alt="Avatar">`;
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    if (!currentUser || !usersDB[currentUser]) return;
    const newName = profileNameInput.value.trim();
    if (newName) usersDB[currentUser].name = newName;
    usersDB[currentUser].avatar = tempAvatarBase64;

    localStorage.setItem("avenoUsersDB", JSON.stringify(usersDB));
    updateUserProfileUI(usersDB[currentUser].name, usersDB[currentUser].avatar, "Registered Member");
    if (profileModal) profileModal.style.display = "none";
    botReply("Profile updated successfully!");
  });
}

function setupTopicCardHandlers() {
  document.querySelectorAll(".topic-card").forEach(card => {
    card.addEventListener("click", () => {
      const promptText = card.getAttribute("data-prompt") || card.innerText.trim();
      if (userInput) userInput.value = promptText;
      handleUserInput();
    });
  });
}

if (sidebarToggleBtn && avenoSidebar) {
  sidebarToggleBtn.addEventListener("click", () => {
    avenoSidebar.classList.toggle("collapsed");
    if (profileMenu) profileMenu.classList.remove("show");
  });
}

if (userProfileBar && profileMenu) {
  userProfileBar.addEventListener("click", (e) => {
    e.stopPropagation();
    profileMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    if (!profileMenu.contains(e.target) && !userProfileBar.contains(e.target)) {
      profileMenu.classList.remove("show");
    }
  });
}

if (localStorage.getItem("avenoTheme") === "dark") {
  document.body.classList.add("dark-theme");
  if (themeIcon) themeIcon.textContent = "🌙";
  if (themeText) themeText.textContent = "Dark Mode";
} else {
  document.body.classList.remove("dark-theme");
  if (themeIcon) themeIcon.textContent = "☀️";
  if (themeText) themeText.textContent = "Light Mode";
}

if (themeToggleOption) {
  themeToggleOption.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    const isDark = document.body.classList.contains("dark-theme");
    localStorage.setItem("avenoTheme", isDark ? "dark" : "light");
    if (themeIcon) themeIcon.textContent = isDark ? "🌙" : "☀️";
    if (themeText) themeText.textContent = isDark ? "Dark Mode" : "Light Mode";
    if (profileMenu) profileMenu.classList.remove("show");
  });
}

if (clearDataOption) {
  clearDataOption.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear your task list?")) {
      avenoTasks = [];
      saveAvenoTasks();
      renderTasksList();
      botReply("🗑️ Task list cleared!");
    }
    if (profileMenu) profileMenu.classList.remove("show");
  });
}

// 🎨 Sleek Code Highlighting & Clean Message Formatting with Prism.js Integration
function parseMarkdownWithCodeBlocks(text) {
  let parsed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const codeId = "code_" + Math.random().toString(36).substr(2, 9);
    const escapedCode = escapeHtml(code.trim());
    const languageClass = lang ? `language-${lang}` : 'language-javascript';
    
    // Trigger Prism highlight asynchronously after DOM element insertion
    setTimeout(() => {
      if (window.Prism) {
        const el = document.getElementById(codeId);
        if (el) Prism.highlightElement(el);
      }
    }, 50);

    return `
      <div class="aveno-code-wrapper" style="background:#0f172a; border-radius:10px; margin:12px 0; overflow:hidden; border:1px solid #334155; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:8px 14px; font-size:0.75rem; color:#94a3b8; font-family:monospace; border-bottom:1px solid #334155;">
          <span style="text-transform:uppercase; font-weight:bold; color:#38bdf8;">⚡ ${lang || 'code'}</span>
          <button onclick="copyCodeToClipboard('${codeId}')" style="background:#334155; color:#f8fafc; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; transition:background 0.2s;">📋 Copy Code</button>
        </div>
        <pre style="padding:14px; margin:0; font-family:'Fira Code', Consolas, monospace; font-size:0.85rem; overflow-x:auto; line-height:1.5;"><code id="${codeId}" class="${languageClass}">${escapedCode}</code></pre>
      </div>
    `;
  });

  parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary); font-weight:600;">$1</strong>');
  parsed = parsed.replace(/\n/g, '<br>');
  return parsed;
}

window.copyCodeToClipboard = function(codeId) {
  const codeElement = document.getElementById(codeId);
  if (codeElement) {
    navigator.clipboard.writeText(codeElement.innerText).then(() => {
      alert("📋 Code copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy code:", err);
    });
  }
};

// 🔍 Image Modal Zoom Handler for Large View
window.openImageModal = function(imgSrc) {
  let modal = document.getElementById("avenoImageZoomModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "avenoImageZoomModal";
    modal.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); display:flex; justify-content:center; align-items:center; z-index:9999; cursor:zoom-out;";
    modal.innerHTML = `<img id="zoomedImg" style="max-width:90vw; max-height:90vh; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5);" />`;
    modal.addEventListener("click", () => modal.style.display = "none");
    document.body.appendChild(modal);
  }
  document.getElementById("zoomedImg").src = imgSrc;
  modal.style.display = "flex";
};

function exportChatHistory(format = "txt") {
  const currentChat = chats.find(c => c.id == currentChatId);
  if (!currentChat || !currentChat.messages || currentChat.messages.length === 0) {
    alert("No messages to export in this chat!");
    return;
  }

  let fileContent = "";
  let fileName = `${currentChat.title.replace(/[^a-zA-Z0-9]/g, "_")}_export.${format}`;
  let mimeType = "text/plain";

  if (format === "json") {
    fileContent = JSON.stringify(currentChat, null, 2);
    mimeType = "application/json";
  } else {
    fileContent = `=== Aveno Chat Export: ${currentChat.title} ===\n\n`;
    currentChat.messages.forEach(msg => {
      const senderName = msg.sender === "user" ? "You" : "Aveno";
      fileContent += `[${senderName}]: ${msg.text}\n\n`;
    });
  }

  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function initNotesDrawer() {
  if (document.getElementById("notesDrawer")) return;

  const drawerHTML = `
    <div id="notesDrawer" style="position:fixed; right:-320px; top:0; width:300px; height:100vh; background:var(--bg-card); border-left:1px solid var(--border-color); box-shadow:-4px 0 15px rgba(0,0,0,0.3); transition:right 0.3s ease; z-index:1500; display:flex; flex-direction:column; padding:16px; gap:12px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
        <h4 style="margin:0; color:var(--text-primary); font-size:1rem;">📝 Quick Notes Scratchpad</h4>
        <button id="closeNotesBtn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem;">✖</button>
      </div>
      <textarea id="scratchpadArea" placeholder="Jot down quick thoughts, code snippets, or ideas here..." style="flex:1; width:100%; background:var(--bg-input); border:1px solid var(--border-color); border-radius:8px; padding:10px; color:var(--text-primary); outline:none; resize:none; font-family:monospace; font-size:0.85rem;"></textarea>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span id="saveStatus" style="font-size:0.75rem; color:var(--text-muted);">Auto-saved locally</span>
        <button id="exportChatBtn" style="background:var(--accent); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem;">📥 Export Chat</button>
      </div>
    </div>
    <button id="openNotesBtn" style="position:fixed; right:16px; top:16px; background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-primary); padding:8px 12px; border-radius:8px; cursor:pointer; z-index:1400; font-size:0.9rem; box-shadow:0 2px 8px rgba(0,0,0,0.2);">📝 Notes</button>
  `;

  document.body.insertAdjacentHTML("beforeend", drawerHTML);

  const notesDrawer = document.getElementById("notesDrawer");
  const openNotesBtn = document.getElementById("openNotesBtn");
  const closeNotesBtn = document.getElementById("closeNotesBtn");
  const scratchpadArea = document.getElementById("scratchpadArea");
  const exportChatBtn = document.getElementById("exportChatBtn");

  scratchpadArea.value = localStorage.getItem("avenoScratchpadNotes") || "";

  openNotesBtn.addEventListener("click", () => {
    notesDrawer.style.right = "0";
  });

  closeNotesBtn.addEventListener("click", () => {
    notesDrawer.style.right = "-320px";
  });

  scratchpadArea.addEventListener("input", () => {
    localStorage.setItem("avenoScratchpadNotes", scratchpadArea.value);
  });

  exportChatBtn.addEventListener("click", () => {
    const choice = confirm("Click OK to export as .txt, or Cancel for .json");
    exportChatHistory(choice ? "txt" : "json");
  });
}

function renderChatList() {
  if (!chatList) return;
  chatList.innerHTML = "";
  chats.forEach(chat => {
    const chatItem = document.createElement("div");
    chatItem.classList.add("chat-item");
    if (chat.id == currentChatId) chatItem.classList.add("active");

    chatItem.innerHTML = `
      <span class="chat-title-text">${escapeHtml(chat.title)}</span>
      <button class="delete-chat-btn" title="Delete chat">🗑️</button>
    `;
    
    chatItem.querySelector(".chat-title-text")?.addEventListener("click", () => switchChat(chat.id));
    chatItem.querySelector(".delete-chat-btn")?.addEventListener("click", (e) => deleteChat(chat.id, e));
    
    chatList.appendChild(chatItem);
  });
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

window.switchChat = function(id) {
  currentChatId = id;
  renderCurrentChat();
  renderChatList();
}

if (newChatBtn) {
  newChatBtn.addEventListener("click", () => {
    const newChat = { id: Date.now(), title: "New Chat", messages: [] };
    chats.push(newChat);
    currentChatId = newChat.id;
    saveCurrentUserData();
    renderCurrentChat();
    renderChatList();
    
    const rawUserName = (currentUser && usersDB[currentUser]?.name) 
      ? usersDB[currentUser].name 
      : "Guest";

    const styledUserName = `<span class="rainbow-name">${escapeHtml(rawUserName)}</span>`;

    addMessage(`👋 Hello ${styledUserName}! New chat started, what would you like to discuss today?`, "bot");
  });
}

window.deleteChat = function(id, event) {
  event.stopPropagation();
  if (chats.length === 1) return;
  chats = chats.filter(c => c.id != id);
  if (currentChatId == id) currentChatId = chats[0].id;
  saveCurrentUserData();
  renderCurrentChat();
  renderChatList();
}

function renderCurrentChat() {
  if (!chatBox) return;
  chatBox.innerHTML = "";
  const currentChat = chats.find(c => c.id == currentChatId);
  if (!currentChat) return;

  if (Array.isArray(currentChat.messages)) {
    currentChat.messages.forEach(msg => {
      if (msg && msg.text) {
        appendMessageElement(msg.text, msg.sender);
      }
    });
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addMessage(text, sender) {
  const currentChat = chats.find(c => c.id == currentChatId);
  if (currentChat) {
    if (!Array.isArray(currentChat.messages)) {
      currentChat.messages = [];
    }
    currentChat.messages.push({ text, sender });
    if (sender === "user" && (currentChat.title === "New Chat" || currentChat.title === "Guest Session")) {
      currentChat.title = text.length > 18 ? text.substring(0, 18) + "..." : text;
      renderChatList();
    }
    saveCurrentUserData();
  }

  appendMessageElement(text, sender);
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;

  if (sender === "bot") {
    speakText(text);
  }
}

function appendMessageElement(text, sender) {
  if (!chatBox) return;
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  
  msg.style.cssText = sender === 'bot' 
    ? "background:var(--bg-card); border:1px solid var(--border-color); padding:14px 18px; border-radius:12px; margin:10px 0; box-shadow:0 2px 8px rgba(0,0,0,0.05); max-width:85%;" 
    : "background:var(--accent); color:#fff; padding:12px 16px; border-radius:12px; margin:10px 0; max-width:85%; margin-left:auto;";

  msg.innerHTML = `<div class="message-content" style="line-height:1.6; font-size:0.95rem;">${parseMarkdownWithCodeBlocks(text)}</div>`;
  chatBox.appendChild(msg);
}

if (userInput) {
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUserInput();
    }
  });
}

function botReply(reply) {
  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.style.cssText = "background:var(--bg-card); border:1px solid var(--border-color); padding:12px 16px; border-radius:12px; margin:10px 0;";
  typing.innerHTML = `
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  const thinkingTime = Math.min(Math.max(reply.length * 4, 600), 1200);

  setTimeout(() => {
    typing.remove();
    addMessage(reply, "bot");
  }, thinkingTime);
}

function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (userInput) {
        userInput.value = transcript;
        handleUserInput();
      }
    };

    recognition.onend = () => {
      if (micBtn) micBtn.style.color = "";
    };

    if (micBtn) {
      micBtn.addEventListener("click", () => {
        try {
          recognition.start();
          micBtn.style.color = "#ef4444";
        } catch (e) {
          recognition.stop();
          micBtn.style.color = "";
        }
      });
    }
  } else if (micBtn) {
    micBtn.title = "Speech Recognition not supported in this browser";
  }
}

// 🔊 Sound Trigger & Speech Switch Evaluation Logic
function playTimerSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }, i * 400);
    }
  } catch (e) {
    console.error("Audio playback error:", e);
  }
}

function speakText(text) {
  const speechSwitch = document.getElementById("speechSwitch");
  const isCheckedInDOM = speechSwitch ? speechSwitch.checked : false;
  const isStoredEnabled = localStorage.getItem("avenoSpeechEnabled") === "true";
  const isSpeechEnabled = isCheckedInDOM || isStoredEnabled || (voiceToggle ? voiceToggle.checked : false);
  
  if (!isSpeechEnabled || !synth) {
    if (synth) synth.cancel();
    return;
  }
  
  loadAvenoVoices();
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/[*_#`]/g, '');
  
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(cleanText);

  if (availableVoices.length > 0 && availableVoices[selectedVoiceIndex]) {
    utterance.voice = availableVoices[selectedVoiceIndex];
  }
  utterance.rate = voiceRate;
  utterance.pitch = voicePitch;

  setTimeout(() => {
    const currentlyEnabled = speechSwitch ? speechSwitch.checked : (localStorage.getItem("avenoSpeechEnabled") === "true");
    if (currentlyEnabled) {
      synth.speak(utterance);
    }
  }, 50);
}

// 🌐 Live API Fetchers & Media Handlers
async function searchWikipedia(query) {
  try {
    const endpoint = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.extract) {
      return `📚 Wikipedia Summary for ${data.title}:\n${data.extract}\n\n[Read more](${data.content_urls.desktop.page})`;
    }
  } catch (err) {
    console.error("Wikipedia Search Error:", err);
  }
  return null;
}

async function fetchWeather(city) {
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) return null;

    const { latitude, longitude, name, country } = geoData.results[0];
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();

    if (weatherData.current_weather) {
      const temp = weatherData.current_weather.temperature;
      const wind = weatherData.current_weather.windspeed;
      return `🌤️ Current Weather in ${name}, ${country}: ${temp}°C with wind speeds of ${wind} km/h.`;
    }
  } catch (err) {
    console.error("Weather Fetch Error:", err);
  }
  return null;
}

async function fetchNews() {
  try {
    const res = await fetch("https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json");
    const data = await res.json();
    if (data.articles && data.articles.length > 0) {
      const topArticles = data.articles.slice(0, 3);
      let newsText = "📰 Top Tech News Headlines:\n";
      topArticles.forEach((art, i) => {
        newsText += `${i + 1}. ${art.title}\n*${art.description || 'No summary available.'}*\n\n`;
      });
      return newsText;
    }
  } catch (err) {
    console.error("News Fetch Error:", err);
  }
  return null;
}

// 🖼️ Real-Time Image Generation Handler (Pollinations API)
async function generatePictureResponse(promptText) {
  try {
    const cleanPrompt = promptText.trim() || "beautiful abstract artwork";
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&nologo=true`;
    
    return `
      🖼️ Generated Picture for: "${cleanPrompt}"
      <div style="margin-top:12px; display:flex; flex-direction:column; align-items:flex-start; gap:10px;">
        <img src="${imageUrl}" alt="${escapeHtml(cleanPrompt)}" style="max-width:100%; width:280px; border-radius:10px; border:1px solid var(--border-color); box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
        <div style="display:flex; gap:8px;">
          <button onclick="openImageModal('${imageUrl}')" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600;">🔍 View Larger</button>
          <a href="${imageUrl}" download="aveno_image.jpg" target="_blank" style="background:#16a34a; color:#fff; text-decoration:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600; display:inline-block;">📥 Download</a>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Picture Generation Error:", err);
    return "⚠️ Error generating picture.";
  }
}

const REMOVE_BG_API_KEY = "nH4WMe7gnNATUANTgLL6fmNW";

async function processImageBackgroundRemoval() {
  if (!uploadedImageBase64) {
    return "⚠️ Please upload an image first using the file button!";
  }

  try {
    const formData = new FormData();
    formData.append("image_file_b64", uploadedImageBase64);
    formData.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVE_BG_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Remove.bg Error:", err);
      return `⚠️ Remove.bg API Error (${response.status}): ${err.errors?.[0]?.title || 'Failed to process image.'}`;
    }

    const blob = await response.blob();
    const transparentImageUrl = URL.createObjectURL(blob);

    uploadedImageBase64 = null;
    uploadedImageMimeType = null;

    return `
      ✨ Background Removed Successfully via remove.bg!
      <div style="margin-top:12px; display:flex; flex-direction:column; align-items:flex-start; gap:10px;">
        <img src="${transparentImageUrl}" alt="Background Removed Image" style="max-width:100%; width:280px; border-radius:10px; border:1px solid var(--border-color); background: repeating-conic-gradient(#334155 0% 25%, #1e293b 0% 50%) 50% / 16px 16px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" />
        <div style="display:flex; gap:8px;">
          <button onclick="openImageModal('${transparentImageUrl}')" style="background:#0284c7; color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600;">🔍 View Larger</button>
          <a href="${transparentImageUrl}" download="aveno_no_bg.png" target="_blank" style="background:#16a34a; color:#fff; text-decoration:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.8rem; font-weight:600; display:inline-block;">📥 Download</a>
        </div>
      </div>
    `;
  } catch (err) {
    console.error("Remove.bg Fetch Error:", err);
    return "⚠️ Network error connecting to remove.bg API.";
  }
}

// 🌀 Dynamic Favicon Loading Animation Manager
const FaviconSpinner = {
  originalHref: "Aveno-removebg-preview.png",
  canvas: document.createElement("canvas"),
  angle: 0,
  animationId: null,

  start() {
    if (this.animationId) return;

    const favicon = document.getElementById("favicon");
    if (!favicon) return;

    this.canvas.width = 32;
    this.canvas.height = 32;
    const ctx = this.canvas.getContext("2d");

    const animate = () => {
      ctx.clearRect(0, 0, 32, 32);

      ctx.beginPath();
      ctx.arc(16, 16, 12, this.angle, this.angle + (Math.PI * 1.5));
      ctx.strokeStyle = "#ffae00";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.stroke();

      favicon.href = this.canvas.toDataURL("image/png");

      this.angle += 0.2;
      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  },

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    const favicon = document.getElementById("favicon");
    if (favicon) {
      favicon.href = this.originalHref;
    }
  }
};

function calculateMathExpression(expr) {
  try {
    const sanitized = expr.replace(/[^0-9+\-*/.()%\s^]/g, '').replace(/\^/g, '**');
    if (!sanitized.trim()) return null;

    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result === "number" && !isNaN(result)) {
      return result;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// 🟢 Keyless Free Pollinations Text Engine with System Identity Protection
async function fetchGeminiResponse(userPrompt) {
  try {
    const lower = userPrompt.toLowerCase().trim();
    if (
      lower.includes("who are you") || 
      lower.includes("what are you") || 
      lower.includes("who is you") || 
      lower.includes("your name") || 
      lower.includes("created you") ||
      lower.includes("made you")
    ) {
      return "I am **Aveno**, your custom-built intelligent AI workspace and assistant!";
    }

    const contextualPrompt = `You are Aveno, a custom web workspace assistant. Never mention ChatGPT or OpenAI. Prompt: ${userPrompt}`;
    const encodedPrompt = encodeURIComponent(contextualPrompt);
    const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}`);

    if (!response.ok) {
      return "⚠️ Error connecting to AI service.";
    }

    let textData = await response.text();
    
    if (textData) {
      textData = textData.replace(/ChatGPT|OpenAI|Google/gi, "Aveno");
    }

    return textData || "No response received from Aveno intelligence.";
  } catch (err) {
    console.error("Pollinations Text Error:", err);
    return "⚠️ Network error connecting to AI.";
  }
}

// 🤖 Dynamic API Route & Local Utility Dispatcher
async function evaluateAPIRoutes(input) {
  const lower = input.toLowerCase().trim();

  // 1️⃣ Identity Trigger
  if (
    lower.includes("who are you") || 
    lower.includes("what are you") || 
    lower.includes("who is you") || 
    lower.includes("your name") || 
    lower.includes("created you") ||
    lower.includes("made you")
  ) {
    return "I am **Aveno**, your custom-built intelligent AI workspace and assistant!";
  }

  // 2️⃣ Background Removal Trigger (Broadened keywords)
  if (
    lower.includes("remove background") || 
    lower.includes("bg remove") || 
    lower.includes("transparent background") || 
    lower.includes("remove the background") ||
    lower.includes("clear background") ||
    lower.includes("delete background")
  ) {
    return await processImageBackgroundRemoval();
  }

  // 3️⃣ Image Generation Trigger (Flexible keywords)
  if (
    lower.startsWith("generate picture") || 
    lower.startsWith("generate image") || 
    lower.startsWith("create image") || 
    lower.startsWith("create picture") || 
    lower.startsWith("draw") || 
    lower.includes("make a picture of") || 
    lower.includes("generate a picture of") || 
    lower.includes("draw a picture of") ||
    lower.includes("create a picture of")
  ) {
    const imgPrompt = input.replace(/^(generate picture|generate image|create image|create picture|draw|make a picture of|generate a picture of|draw a picture of|create a picture of)\s*/i, '');
    return await generatePictureResponse(imgPrompt || input);
  }

  // 4️⃣ Math Evaluation Trigger
  const mathQuery = lower.replace(/^(calculate|calc|what is|compute|evaluate)\s+/i, '');
  if (/^[0-9\s+\-*/.()%\^]+$/.test(mathQuery) && /[0-9]/.test(mathQuery) && /[\+\-\*\/\%\^]/.test(mathQuery)) {
    const calcResult = calculateMathExpression(mathQuery);
    if (calcResult !== null) {
      return `🧮 Calculation Result:\n\`${mathQuery.trim()}\` = ${calcResult}`;
    }
  }

  // 5️⃣ Voice Listing & Selection Triggers
  if (lower.includes("list voices") || lower.includes("show voices")) {
    loadAvenoVoices();
    if (availableVoices.length === 0) return "⚠️ No synthetic voices found in your browser.";
    
    let voiceList = "🔊 Available Browser Voices:\n";
    availableVoices.slice(0, 10).forEach((v, index) => {
      voiceList += `${index + 1}. ${v.name} (${v.lang})\n`;
    });
    voiceList += "\n*Type `set voice [number]` to select one!*";
    return voiceList;
  }

  const voiceSelectMatch = lower.match(/set\s*voice\s*(\d+)/i);
  if (voiceSelectMatch) {
    loadAvenoVoices();
    const idx = parseInt(voiceSelectMatch[1]) - 1;
    if (availableVoices[idx]) {
      selectedVoiceIndex = idx;
      return `🔊 Voice successfully switched to ${availableVoices[idx].name}!`;
    }
    return `Invalid voice number. Type list voices to check available options.`;
  }

  // 6️⃣ Timer Trigger
  const timerMatch = lower.match(/(?:set\s*timer\s*for|timer|remind\s*me\s*in)\s*(\d+)\s*(second|sec|minute|min)/i);
  if (timerMatch) {
    const duration = parseInt(timerMatch[1]);
    const unit = timerMatch[2].toLowerCase();
    const ms = (unit.startsWith("min")) ? duration * 60000 : duration * 1000;

    if (activeTimer) clearTimeout(activeTimer);
    activeTimer = setTimeout(() => {
      addMessage(`⏰ Timer Ringing! Your ${duration} ${unit} timer is up!`, "bot");
      playTimerSound();
    }, ms);

    return `⏳ Timer set for ${duration} ${unit}(s)! I will ring when it finishes.`;
  }

  // 7️⃣ Weather & News Triggers
  const weatherMatch = lower.match(/(?:weather\s*in|weather\s*for|weather)\s+([a-zA-Z\s]+)/i);
  if (weatherMatch && !lower.includes("checker")) {
    const city = weatherMatch[1].trim();
    if (city && city !== "today" && city !== "now") {
      const weatherReport = await fetchWeather(city);
      if (weatherReport) return weatherReport;
      return `Sorry, I couldn't fetch live weather data for ${city}.`;
    }
  }

  if (lower.includes("news") || lower.includes("headlines") || lower.includes("top news")) {
    const newsReport = await fetchNews();
    if (newsReport) return newsReport;
    return "📰 Unable to fetch live news at the moment.";
  }

  // 8️⃣ Wikipedia Trigger
  const wikiMatch = lower.match(/(?:wikipedia|wiki|who is|what is a|search wiki)\s+([a-zA-Z0-9\s]+)/i);
  if (wikiMatch) {
    const query = wikiMatch[1].trim();
    if (query) {
      const wikiSummary = await searchWikipedia(query);
      if (wikiSummary) return wikiSummary;
    }
  }

  return null;
}

async function handleUserInput() {
  if (!userInput) return;
  const text = userInput.value.trim();
  if (!text && !uploadedImageBase64) return;

  const displayMessage = text || "Uploaded an image for processing.";
  addMessage(displayMessage, "user");
  userInput.value = "";

  const apiRouteReply = await evaluateAPIRoutes(text);
  if (apiRouteReply) {
    botReply(apiRouteReply);
    return;
  }

  FaviconSpinner.start();

  const typing = document.createElement("div");
  typing.classList.add("message", "bot");
  typing.style.cssText = "background:var(--bg-card); border:1px solid var(--border-color); padding:12px 16px; border-radius:12px; margin:10px 0;";
  typing.innerHTML = `
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  chatBox.appendChild(typing);
  chatBox.scrollTop = chatBox.scrollHeight;

  const apiReply = await fetchGeminiResponse(displayMessage);
  
  FaviconSpinner.stop();
  typing.remove();

  if (apiReply) {
    addMessage(apiReply, "bot");
    return;
  }

  botReply(`I received: "${displayMessage}".`);
}

if (sendBtn) sendBtn.addEventListener("click", handleUserInput);
if (userInput) {
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleUserInput();
  });
}

document.addEventListener("click", () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const tempCtx = new AudioContext();
      if (tempCtx.state === "suspended") {
        tempCtx.resume();
      }
    }
  } catch (e) {
    console.error("AudioContext unlock error:", e);
  }
}, { once: true });

initUserSession();