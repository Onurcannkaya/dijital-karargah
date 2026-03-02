/**
 * app.js — Dijital Karargâh v2.1 (Cerrahi Müdahale)
 * Auth + Calendar + Realtime + Notifications + Confetti + RSVP + Search + Edit + Overdue
 */

import { db, CATEGORIES } from './db.js';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const State = {
  activeFilter: 'all',
  activeView: 'grid',
  tasks: [],
  user: null,
  authMode: 'login',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  selectedPriority: 'medium',
  notifiedTaskIds: new Set(),
  reminderInterval: null,
  searchQuery: '',
  editingTaskId: null   // null = yeni görev, string = düzenleme modu
};

// ─────────────────────────────────────────────
// MOTIVASYON SÖZLERİ
// ─────────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
  { text: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.", author: "Robert Collier" },
  { text: "Gelecek, bugün ne yaptığına bağlıdır.", author: "Mahatma Gandhi" },
  { text: "Disiplin, motivasyon tükendiğinde devam etmektir.", author: "Jim Rohn" },
  { text: "Her uzman bir zamanlar amatördü.", author: "Helen Hayes" },
  { text: "Yarını değiştirmenin tek yolu bugün bir şey yapmaktır.", author: "Simone de Beauvoir" },
  { text: "Düşmekten korkma, kalkmamaktan kork.", author: "Anonim" },
  { text: "Bir planın olması, başarının yarısıdır.", author: "Zig Ziglar" },
  { text: "Büyük işler, küçük adımlardan oluşur.", author: "Lao Tzu" },
  { text: "Bugünü yakala, yarına mümkün olduğunca az güven.", author: "Horatius" },
  { text: "Fırtınadan sonra güneş daha güzel doğar.", author: "Türk Atasözü" },
  { text: "En karanlık gecenin bile bir sonu vardır.", author: "Victor Hugo" },
  { text: "Tek sınır, kendi zihninde çizdiğin çizgidir.", author: "Anonim" },
  { text: "İlham beklemek yerine, işe başla; ilham seni bulacaktır.", author: "Pablo Picasso" },
  { text: "Hayat cesaret gösterenlerin yanındadır.", author: "Seneca" },
  { text: "Hedefsiz bir gemi, hiçbir rüzgâr ona yardım edemez.", author: "Seneca" },
  { text: "Zaferin %90'ı orada bulunmaktır.", author: "Woody Allen" },
  { text: "Zorluklardan cesaret, kararsızlıktan kararlılık doğar.", author: "Anonim" },
  { text: "Yapman gereken tek şey, bugün dünden biraz daha iyi olmak.", author: "Anonim" },
  { text: "Bir adım at. Yol yürüdükçe açılır.", author: "Hz. Mevlâna" },
  { text: "Şimdi başla. Mükemmel an diye bir şey yoktur.", author: "Napoleon Hill" }
];

// ─────────────────────────────────────────────
// DOM
// ─────────────────────────────────────────────
const DOM = {};
function cacheDom() {
  DOM.greeting = document.getElementById('greeting');
  DOM.dateDisplay = document.getElementById('date-display');
  DOM.taskGrid = document.getElementById('task-grid');
  DOM.emptyState = document.getElementById('empty-state');
  DOM.fab = document.getElementById('fab');
  DOM.modal = document.getElementById('modal');
  DOM.modalOverlay = document.getElementById('modal-overlay');
  DOM.modalClose = document.getElementById('modal-close');
  DOM.modalCancel = document.getElementById('modal-cancel');
  DOM.taskForm = document.getElementById('task-form');
  DOM.inputTitle = document.getElementById('input-title');
  DOM.inputDatetime = document.getElementById('input-datetime');
  DOM.inputVisibility = document.getElementById('input-visibility');
  DOM.inputAssignee = document.getElementById('input-assignee');
  DOM.assigneeField = document.getElementById('assignee-field');
  DOM.visibilityLabel = document.getElementById('visibility-label');
  DOM.chips = document.querySelectorAll('.chip');
  DOM.priorityButtons = document.querySelectorAll('.priority-btn');
  DOM.filterButtons = document.querySelectorAll('.filter-btn');
  DOM.statsTotal = document.getElementById('stat-total');
  DOM.statsDone = document.getElementById('stat-done');
  DOM.statsPending = document.getElementById('stat-pending');
  DOM.progressFill = document.getElementById('progress-fill');
  DOM.progressText = document.getElementById('progress-text');
  DOM.toastContainer = document.getElementById('toast-container');
  DOM.selectedCategoryInput = document.getElementById('selected-category');
  DOM.themeToggle = document.getElementById('theme-toggle');
  DOM.authOverlay = document.getElementById('auth-overlay');
  DOM.authForm = document.getElementById('auth-form');
  DOM.authEmail = document.getElementById('auth-email');
  DOM.authPassword = document.getElementById('auth-password');
  DOM.authSubmit = document.getElementById('auth-submit');
  DOM.authSubmitText = document.getElementById('auth-submit-text');
  DOM.authError = document.getElementById('auth-error');
  DOM.authTabs = document.querySelectorAll('.auth-tab');
  DOM.appMain = document.getElementById('app-main');
  DOM.userBar = document.getElementById('user-bar');
  DOM.userEmail = document.getElementById('user-email');
  DOM.btnLogout = document.getElementById('btn-logout');
  DOM.viewTabs = document.querySelectorAll('.view-tab');
  DOM.gridSection = document.getElementById('grid-section');
  DOM.calendarSection = document.getElementById('calendar-section');
  DOM.calTitle = document.getElementById('cal-title');
  DOM.calDays = document.getElementById('cal-days');
  DOM.calPrev = document.getElementById('cal-prev');
  DOM.calNext = document.getElementById('cal-next');
  DOM.motivationText = document.getElementById('motivation-text');
  DOM.searchInput = document.getElementById('search-input');
  DOM.searchClear = document.getElementById('search-clear');
  DOM.modalHeading = document.getElementById('modal-heading');
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getCategoryById(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[3];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = dateStr.split('T')[0];
  const [y, m, day] = d.split('-');
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${day} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isToday(dateStr) {
  if (!dateStr) return false;
  return dateStr.split('T')[0] === new Date().toISOString().split('T')[0];
}

function escapeHtml(str) {
  const el = document.createElement('div');
  el.appendChild(document.createTextNode(str));
  return el.innerHTML;
}

/** E-posta adresinden kısa isim çıkar: "onurcan@mail.com" → "onurcan" */
function emailToName(email) {
  if (!email) return '?';
  return email.split('@')[0];
}

// ─────────────────────────────────────────────
// 💡 MOTIVASYON WIDGET
// ─────────────────────────────────────────────
function renderMotivation() {
  if (!DOM.motivationText) return;
  const today = new Date();
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % MOTIVATIONAL_QUOTES.length;
  const quote = MOTIVATIONAL_QUOTES[dayIndex];
  DOM.motivationText.innerHTML = `"${escapeHtml(quote.text)}" <span class="motivation-widget__author">— ${escapeHtml(quote.author)}</span>`;
}

// ─────────────────────────────────────────────
// 🔍 ARAMA ÇUBUĞU
// ─────────────────────────────────────────────
let searchDebounce = null;
function initSearch() {
  if (!DOM.searchInput) return;
  DOM.searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      State.searchQuery = DOM.searchInput.value.trim().toLowerCase();
      DOM.searchClear.style.display = State.searchQuery ? '' : 'none';
      renderTasks();
    }, 250);
  });
  DOM.searchClear?.addEventListener('click', () => {
    DOM.searchInput.value = '';
    State.searchQuery = '';
    DOM.searchClear.style.display = 'none';
    renderTasks();
  });
}

// ─────────────────────────────────────────────
// 🎉 TOAST
// ─────────────────────────────────────────────
function showToast(message, type = 'success') {
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || '✓'}</span>
    <span class="toast__msg">${message}</span>
    <div class="toast__progress"></div>
  `;
  DOM.toastContainer.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

// ─────────────────────────────────────────────
// 🎊 CONFETTI
// ─────────────────────────────────────────────
function spawnConfetti(targetEl) {
  const rect = targetEl.getBoundingClientRect();
  const colors = ['#FFB300', '#FF5252', '#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
  for (let i = 0; i < 18; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.left = `${rect.left + rect.width / 2}px`;
    dot.style.top = `${rect.top + rect.height / 2}px`;
    dot.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    dot.style.setProperty('--dy', `${-Math.random() * 120 - 30}px`);
    dot.style.setProperty('--rot', `${Math.random() * 720}deg`);
    dot.style.background = colors[Math.floor(Math.random() * colors.length)];
    dot.style.animationDelay = `${Math.random() * 0.15}s`;
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  }
}

// ─────────────────────────────────────────────
// 🔔 ONESIGNAL — Bildirim İzni & Gönderim
// ─────────────────────────────────────────────

/** OneSignal üzerinden kullanıcıyı login et (push hedefleme için) */
function oneSignalLogin(user) {
  if (!user) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function (OneSignal) {
    OneSignal.login(user.id);
    // Opsiyonel: e-posta etiketini de ekle
    OneSignal.User.addEmail(user.email);
    console.log('[OneSignal] Kullanıcı login:', user.id);
  });
}

/** OneSignal'dan kullanıcı logout */
function oneSignalLogout() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(function (OneSignal) {
    OneSignal.logout();
    console.log('[OneSignal] Kullanıcı logout');
  });
}

function sendNotification(title, body) {
  // Artık OneSignal push sunucusu üzerinden gönderilir.
  // Local fallback olarak SW postMessage kullanılır.
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: { title, body, url: '/' }
    });
  }
}

// ─────────────────────────────────────────────
// ⏰ REMINDER ENGINE
// ─────────────────────────────────────────────
function startReminderEngine() {
  if (State.reminderInterval) clearInterval(State.reminderInterval);
  State.reminderInterval = setInterval(() => {
    const nowStr = new Date().toISOString().slice(0, 16);
    State.tasks.forEach(task => {
      if (task.completed || State.notifiedTaskIds.has(task.id) || !task.dueDate) return;
      const taskDate = task.dueDate.length > 10 ? task.dueDate.slice(0, 16) : task.dueDate + 'T09:00';
      if (taskDate <= nowStr) {
        State.notifiedTaskIds.add(task.id);
        sendNotification('⏳ Vakit Geldi!', task.title);
        showToast(`⏳ Vakit Geldi: ${task.title}`, 'warning');
      }
    });
  }, 60000);
}

function stopReminderEngine() {
  if (State.reminderInterval) { clearInterval(State.reminderInterval); State.reminderInterval = null; }
}

// ─────────────────────────────────────────────
// 📡 REALTIME HANDLER
// ─────────────────────────────────────────────
function startRealtime() {
  db.subscribeToTasks((newTask) => {
    if (State.tasks.some(t => t.id === newTask.id)) return;
    const isMine = State.user && newTask.userId === State.user.id;
    if (newTask.visibility === 'shared' && !isMine) {
      sendNotification('📣 Yeni Ortak Plan', `${newTask.title} — Sen de katılıyor musun?`);
      showToast(`📣 Yeni Plan: ${newTask.title}`, 'info');
    }
    State.tasks.unshift(newTask);
    renderTasks();
    renderStats();
    if (State.activeView === 'calendar') renderCalendar();
  });
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
function showAuth() {
  DOM.authOverlay.classList.add('auth-overlay--visible');
  DOM.appMain.style.display = 'none';
  DOM.fab.style.display = 'none';
}

function hideAuth() {
  DOM.authOverlay.classList.remove('auth-overlay--visible');
  DOM.appMain.style.display = '';
  DOM.fab.style.display = '';
}

function updateUserBar(user) {
  if (user && DOM.userBar) {
    DOM.userEmail.textContent = user.email;
    DOM.userBar.style.display = 'flex';
  } else if (DOM.userBar) {
    DOM.userBar.style.display = 'none';
  }
}

function initAuth() {
  DOM.authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.authTabs.forEach(t => t.classList.remove('auth-tab--active'));
      tab.classList.add('auth-tab--active');
      State.authMode = tab.dataset.tab;
      DOM.authSubmitText.textContent = State.authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol';
      DOM.authError.textContent = '';
    });
  });

  DOM.authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.authEmail.value.trim();
    const password = DOM.authPassword.value;
    DOM.authError.textContent = '';
    DOM.authSubmit.disabled = true;
    try {
      if (State.authMode === 'register') {
        await db.signUp(email, password);
        showToast('Kayıt başarılı! Giriş yapabilirsiniz 🎉');
        DOM.authTabs.forEach(t => t.classList.remove('auth-tab--active'));
        document.querySelector('[data-tab="login"]').classList.add('auth-tab--active');
        State.authMode = 'login';
        DOM.authSubmitText.textContent = 'Giriş Yap';
      } else {
        const result = await db.signIn(email, password);
        State.user = result.user;
        updateUserBar(State.user);
        hideAuth();
        await loadDashboard();
        oneSignalLogin(State.user);
        startRealtime();
        startReminderEngine();
        showToast('Hoş geldin, Komutan! 🎖️');
      }
    } catch (err) {
      DOM.authError.textContent = err.message || 'Bir hata oluştu';
    } finally {
      DOM.authSubmit.disabled = false;
    }
  });

  DOM.btnLogout.addEventListener('click', async () => {
    try {
      stopReminderEngine();
      oneSignalLogout();
      await db.signOut();
      State.user = null;
      State.tasks = [];
      State.notifiedTaskIds.clear();
      updateUserBar(null);
      showAuth();
      showToast('Çıkış yapıldı');
    } catch { showToast('Çıkış yapılamadı', 'error'); }
  });
}

// ─────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────
function renderHeader() {
  const h = new Date().getHours();
  let g = h >= 5 && h < 12 ? 'Günaydın' : h < 17 ? 'İyi Günler' : h < 21 ? 'İyi Akşamlar' : 'İyi Geceler';
  DOM.greeting.textContent = `${g}, Komutan`;
  const now = new Date();
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  DOM.dateDisplay.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ─────────────────────────────────────────────
// TASK CARD (Edit + RSVP Names + Overdue Alarm)
// ─────────────────────────────────────────────
function createTaskCard(task) {
  const cat = getCategoryById(task.categoryId);
  const overdue = !task.completed && isOverdue(task.dueDate);
  const today = !task.completed && isToday(task.dueDate);
  const card = document.createElement('article');
  card.className = `task-card ${task.completed ? 'task-card--done' : ''} ${overdue ? 'task-card--overdue' : ''}`;
  card.dataset.id = task.id;
  card.setAttribute('role', 'listitem');

  const priorityMap = { high: '🔴', medium: '🟡', low: '🟢' };
  const isShared = task.visibility === 'shared';
  const sharedBadge = isShared ? `<span class="shared-badge">🌐 Ekip</span>` : '';
  const assigneeLabel = task.assignedTo
    ? `<span class="assignee-label">👤 ${escapeHtml(task.assignedTo)}</span>` : '';

  // Overdue alarm — kırmızı tarih etiketi + ⚠️ Gecikti!
  const dateLabel = overdue
    ? `<span class="overdue-label">⚠️ Gecikti!</span> ${formatDate(task.dueDate)}`
    : today
      ? 'Bugün'
      : formatDate(task.dueDate);

  // RSVP — katılımcı isimleri
  const attendees = Array.isArray(task.attendees) ? task.attendees : [];
  const attendeeCount = attendees.length;
  const userJoined = State.user && attendees.includes(State.user.email);

  // İsim listesi (max 3 isim göster, kalanını +X yap)
  let attendeeNames = '';
  if (attendeeCount > 0) {
    const names = attendees.slice(0, 3).map(emailToName);
    const extra = attendeeCount > 3 ? ` +${attendeeCount - 3}` : '';
    attendeeNames = `<span class="rsvp-names" title="${attendees.join(', ')}">${names.join(', ')}${extra}</span>`;
  }

  const rsvpHtml = isShared ? `
    <div class="rsvp-section">
      <div class="rsvp-buttons">
        <button class="rsvp-btn rsvp-btn--join ${userJoined ? 'rsvp-btn--active' : ''}" data-action="join" title="Katılıyorum">
          👍 Katılıyorum
        </button>
        <button class="rsvp-btn rsvp-btn--decline" data-action="decline" title="Katılamam">
          👎 Pas
        </button>
      </div>
      <div class="rsvp-info">
        ${attendeeCount > 0 ? `<span class="rsvp-count">👥 ${attendeeCount}</span>` : ''}
        ${attendeeNames}
      </div>
    </div>
  ` : '';

  card.innerHTML = `
    <div class="task-card__header">
      <span class="task-badge" style="color:${cat.color}; background:${cat.bg}">${cat.icon} ${cat.label}</span>
      <div class="task-card__actions">
        ${sharedBadge}
        <button class="btn-icon btn-edit" title="Düzenle" aria-label="Düzenle">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-icon btn-delete" title="Sil" aria-label="Sil">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
    <div class="task-card__body">
      <button class="task-check ${task.completed ? 'task-check--done' : ''}" aria-label="Tamamla">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
      </button>
      <h3 class="task-title ${task.completed ? 'task-title--done' : ''}">${escapeHtml(task.title)}</h3>
    </div>
    <div class="task-card__footer">
      <div class="task-meta">
        <span class="task-date ${overdue ? 'task-date--overdue' : ''} ${today ? 'task-date--today' : ''}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          ${dateLabel}
        </span>
        ${assigneeLabel}
      </div>
      <span class="task-priority">${priorityMap[task.priority] || '🟡'}</span>
    </div>
    ${rsvpHtml}
  `;

  // Event listeners — defensive: DOM dataset.id > closure
  const _getCardId = () => card.dataset.id || task.id;

  card.querySelector('.task-check').addEventListener('click', () => {
    const id = _getCardId();
    if (!id) { console.error('[App] toggle — görev ID bulunamadı'); return; }
    handleToggle(id);
  });
  card.querySelector('.btn-delete').addEventListener('click', () => {
    const id = _getCardId();
    if (!id) { console.error('[App] delete — görev ID bulunamadı'); return; }
    handleDelete(id);
  });
  card.querySelector('.btn-edit').addEventListener('click', () => {
    const id = _getCardId();
    if (!id) { console.error('[App] edit — görev ID bulunamadı'); return; }
    const currentTask = State.tasks.find(t => t.id === id) || task;
    openEditModal(currentTask);
  });

  if (isShared) {
    card.querySelector('.rsvp-btn--join')?.addEventListener('click', () => {
      const id = _getCardId();
      if (!id) { console.error('[App] RSVP join — görev ID bulunamadı'); return; }
      handleRSVP(id, true);
    });
    card.querySelector('.rsvp-btn--decline')?.addEventListener('click', () => {
      const id = _getCardId();
      if (!id) { console.error('[App] RSVP decline — görev ID bulunamadı'); return; }
      handleRSVP(id, false);
    });
  }

  return card;
}

// ─────────────────────────────────────────────
// RSVP HANDLER
// ─────────────────────────────────────────────
async function handleRSVP(taskId, isJoining) {
  if (!taskId || taskId === 'undefined') { console.error('[App] handleRSVP: geçersiz id', taskId); showToast('Görev bulunamadı', 'error'); return; }
  if (!State.user) { showToast('RSVP için giriş yapmalısınız', 'error'); return; }
  try {
    await db.rsvpTask(taskId, State.user.email, isJoining);
    State.tasks = await db.getTasks();
    await renderTasks();
    showToast(isJoining ? 'Katılımınız kaydedildi 👍' : 'Katılım geri çekildi', isJoining ? 'success' : 'info');
  } catch (err) {
    showToast(`RSVP hatası: ${err.message}`, 'error');
  }
}

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
async function renderTasks() {
  DOM.taskGrid.innerHTML = '';
  let tasks = State.tasks;

  if (State.activeFilter !== 'all') tasks = tasks.filter(t => t.categoryId === State.activeFilter);
  if (State.searchQuery) tasks = tasks.filter(t => t.title.toLowerCase().includes(State.searchQuery));

  tasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (!a.completed && !b.completed && (pOrder[a.priority] || 1) !== (pOrder[b.priority] || 1)) {
      return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
    }
    return (a.dueDate || '').localeCompare(b.dueDate || '');
  });

  if (tasks.length === 0) { DOM.emptyState.style.display = 'flex'; return; }
  DOM.emptyState.style.display = 'none';
  tasks.forEach((task, idx) => {
    const card = createTaskCard(task);
    card.style.animationDelay = `${idx * 0.04}s`;
    card.classList.add('card-enter');
    DOM.taskGrid.appendChild(card);
  });
  await renderStats();
}

async function renderStats() {
  const stats = await db.getStats();
  animateNumber(DOM.statsTotal, stats.total);
  animateNumber(DOM.statsDone, stats.completed);
  animateNumber(DOM.statsPending, stats.pending);
  if (DOM.progressFill && DOM.progressText) {
    const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    DOM.progressFill.style.width = `${pct}%`;
    DOM.progressText.textContent = `${pct}%`;
  }
}

function animateNumber(el, target) {
  if (!el) return;
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) return;
  const diff = target - current;
  const steps = Math.min(Math.abs(diff), 12);
  const inc = diff / steps;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    el.textContent = Math.round(current + inc * step);
    if (step >= steps) { clearInterval(timer); el.textContent = target; }
  }, 40);
}

// ─────────────────────────────────────────────
// CALENDAR
// ─────────────────────────────────────────────
function renderCalendar() {
  const { calendarYear: yr, calendarMonth: mo } = State;
  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  DOM.calTitle.textContent = `${monthNames[mo]} ${yr}`;
  DOM.calDays.innerHTML = '';
  let startDay = new Date(yr, mo, 1).getDay() - 1;
  if (startDay < 0) startDay = 6;
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksByDate = {};
  State.tasks.forEach(t => {
    const d = t.dueDate ? t.dueDate.split('T')[0] : null;
    if (d) { tasksByDate[d] = tasksByDate[d] || []; tasksByDate[d].push(t); }
  });
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day cal-day--empty';
    DOM.calDays.appendChild(empty);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const ds = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    if (ds === todayStr) cell.classList.add('cal-day--today');
    const num = document.createElement('span');
    num.className = 'cal-day__number'; num.textContent = day;
    cell.appendChild(num);
    const dayTasks = tasksByDate[ds] || [];
    if (dayTasks.length) {
      cell.classList.add('cal-day--has-tasks');
      const dots = document.createElement('div');
      dots.className = 'cal-day__dots';
      dayTasks.slice(0, 3).forEach(t => {
        const dot = document.createElement('span');
        dot.className = `cal-dot ${t.completed ? 'cal-dot--done' : ''}`;
        dot.style.background = getCategoryById(t.categoryId).color;
        dot.title = t.title;
        dots.appendChild(dot);
      });
      if (dayTasks.length > 3) {
        const more = document.createElement('span');
        more.className = 'cal-dot-more'; more.textContent = `+${dayTasks.length - 3}`;
        dots.appendChild(more);
      }
      cell.appendChild(dots);
    }
    DOM.calDays.appendChild(cell);
  }
}

function initCalendar() {
  DOM.calPrev.addEventListener('click', () => {
    State.calendarMonth--;
    if (State.calendarMonth < 0) { State.calendarMonth = 11; State.calendarYear--; }
    renderCalendar();
  });
  DOM.calNext.addEventListener('click', () => {
    State.calendarMonth++;
    if (State.calendarMonth > 11) { State.calendarMonth = 0; State.calendarYear++; }
    renderCalendar();
  });
}

function initViewTabs() {
  DOM.viewTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.viewTabs.forEach(t => t.classList.remove('view-tab--active'));
      tab.classList.add('view-tab--active');
      State.activeView = tab.dataset.view;
      DOM.gridSection.style.display = State.activeView === 'calendar' ? 'none' : '';
      DOM.calendarSection.style.display = State.activeView === 'calendar' ? '' : 'none';
      if (State.activeView === 'calendar') renderCalendar();
    });
  });
}

// ─────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────
async function handleToggle(id) {
  if (!id || id === 'undefined') { console.error('[App] handleToggle: geçersiz id', id); showToast('Görev bulunamadı', 'error'); return; }
  try {
    const updated = await db.toggleTask(id);
    State.tasks = await db.getTasks();
    if (updated.completed) {
      const cardEl = document.querySelector(`[data-id="${id}"]`);
      if (cardEl) spawnConfetti(cardEl);
    }
    await renderTasks();
    if (State.activeView === 'calendar') renderCalendar();
    showToast(updated.completed ? 'Görev tamamlandı! 🎯' : 'Görev geri alındı');
  } catch (err) { showToast('Hata oluştu', 'error'); console.error(err); }
}

// 🗑️ DELETE — önce DB'den sil, sonra DOM güncelle
async function handleDelete(id) {
  if (!id || id === 'undefined') { console.error('[App] handleDelete: geçersiz id', id); showToast('Görev bulunamadı', 'error'); return; }
  try {
    await db.deleteTask(id);
    // Başarılı → DOM animasyonu
    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) {
      card.classList.add('card-exit');
      await new Promise(r => setTimeout(r, 280));
    }
    State.tasks = State.tasks.filter(t => t.id !== id);
    await renderTasks();
    if (State.activeView === 'calendar') renderCalendar();
    showToast('Görev silindi 🗑️');
  } catch (err) {
    console.error('[App] Silme hatası:', err);
    showToast(`Silme başarısız: ${err.message}`, 'error');
  }
}

// ─────────────────────────────────────────────
// ✏️ EDIT (Düzenleme) SİSTEMİ
// ─────────────────────────────────────────────
function openEditModal(task) {
  State.editingTaskId = task.id;

  // Modal başlığını değiştir
  if (DOM.modalHeading) DOM.modalHeading.textContent = '✏️ Görevi Düzenle';

  // Formu mevcut verilerle doldur
  DOM.inputTitle.value = task.title;
  DOM.selectedCategoryInput.value = task.categoryId;
  DOM.inputDatetime.value = task.dueDate || '';
  State.selectedPriority = task.priority || 'medium';

  // Kategori chip'ini aktif et
  DOM.chips.forEach(c => {
    c.classList.toggle('chip--active', c.dataset.category === task.categoryId);
  });

  // Öncelik butonunu aktif et
  DOM.priorityButtons.forEach(b => {
    b.classList.toggle('priority-btn--active', b.dataset.priority === State.selectedPriority);
  });

  // Görünürlük
  const isShared = task.visibility === 'shared';
  DOM.inputVisibility.checked = isShared;
  DOM.visibilityLabel.textContent = isShared ? '🌐 Ekiple Paylaş' : '🔒 Sadece Ben';
  DOM.assigneeField.style.display = isShared ? '' : 'none';
  DOM.inputAssignee.value = task.assignedTo || '';

  // Modal'ı aç
  DOM.modal.classList.add('modal--open');
  DOM.modalOverlay.classList.add('overlay--open');
  document.body.classList.add('body--modal-open');
  setTimeout(() => DOM.inputTitle.focus(), 350);
}

// ─────────────────────────────────────────────
// FORM SUBMIT (Yeni + Edit)
// ─────────────────────────────────────────────
async function handleFormSubmit(e) {
  e.preventDefault();
  const title = DOM.inputTitle.value.trim();
  const categoryId = DOM.selectedCategoryInput.value;
  const datetimeVal = DOM.inputDatetime.value;
  const dueDate = datetimeVal || new Date().toISOString().split('T')[0];
  const priority = State.selectedPriority;
  const visibility = DOM.inputVisibility.checked ? 'shared' : 'private';
  const assignedTo = DOM.inputAssignee.value.trim() || null;

  if (!title) {
    DOM.inputTitle.focus();
    DOM.inputTitle.classList.add('input--error');
    setTimeout(() => DOM.inputTitle.classList.remove('input--error'), 800);
    return;
  }
  if (!categoryId) { showToast('Lütfen bir kategori seçin', 'error'); return; }

  // UI kilit — çift tıklama koruması
  const submitBtn = DOM.taskForm.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    if (State.editingTaskId) {
      // ✏️ DÜZENLEME MODU — updateTask
      await db.updateTask(State.editingTaskId, { title, dueDate, categoryId, priority, visibility, assignedTo });
      showToast('Görev güncellendi ✏️');
    } else {
      // ➕ YENİ GÖREV — addTask
      const newTask = await db.addTask({ title, dueDate, categoryId, priority, visibility, assignedTo });
      showToast('Operasyon başlatıldı! ✅');
      // Shared görev eklendiyse push bildirim tetikle
      if (visibility === 'shared' && newTask) {
        triggerPushForSharedTask(newTask);
      }
    }
    State.tasks = await db.getTasks();
    closeModal();
    await renderTasks();
    if (State.activeView === 'calendar') renderCalendar();
  } catch (err) {
    showToast(`Hata: ${err.message}`, 'error');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function openModal() {
  State.editingTaskId = null;
  if (DOM.modalHeading) DOM.modalHeading.textContent = 'Yeni Operasyon';
  DOM.taskForm.reset();
  DOM.inputTitle.value = '';
  DOM.selectedCategoryInput.value = '';
  DOM.inputAssignee.value = '';
  State.selectedPriority = 'medium';
  DOM.chips.forEach(c => c.classList.remove('chip--active'));
  DOM.priorityButtons.forEach(b => b.classList.remove('priority-btn--active'));
  document.querySelector('[data-priority="medium"]')?.classList.add('priority-btn--active');
  DOM.inputVisibility.checked = false;
  DOM.visibilityLabel.textContent = '🔒 Sadece Ben';
  DOM.assigneeField.style.display = 'none';
  const now = new Date();
  DOM.inputDatetime.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  DOM.modal.classList.add('modal--open');
  DOM.modalOverlay.classList.add('overlay--open');
  document.body.classList.add('body--modal-open');
  setTimeout(() => DOM.inputTitle.focus(), 350);
}

function closeModal() {
  State.editingTaskId = null;
  DOM.modal.classList.remove('modal--open');
  DOM.modalOverlay.classList.remove('overlay--open');
  document.body.classList.remove('body--modal-open');
}

// ─────────────────────────────────────────────
// INIT HELPERS
// ─────────────────────────────────────────────
function initChips() {
  DOM.chips.forEach(chip => {
    chip.addEventListener('click', () => {
      DOM.chips.forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      DOM.selectedCategoryInput.value = chip.dataset.category;
    });
  });
}

function initPriorityButtons() {
  DOM.priorityButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.priorityButtons.forEach(b => b.classList.remove('priority-btn--active'));
      btn.classList.add('priority-btn--active');
      State.selectedPriority = btn.dataset.priority;
    });
  });
}

function initVisibilityToggle() {
  DOM.inputVisibility.addEventListener('change', () => {
    if (DOM.inputVisibility.checked) {
      DOM.visibilityLabel.textContent = '🌐 Ekiple Paylaş';
      DOM.assigneeField.style.display = '';
      setTimeout(() => DOM.inputAssignee.focus(), 200);
    } else {
      DOM.visibilityLabel.textContent = '🔒 Sadece Ben';
      DOM.assigneeField.style.display = 'none';
      DOM.inputAssignee.value = '';
    }
  });
}

function initFilters() {
  DOM.filterButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      DOM.filterButtons.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      State.activeFilter = btn.dataset.filter;
      await renderTasks();
    });
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !DOM.modal.classList.contains('modal--open')) {
      e.preventDefault();
      openModal();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      DOM.searchInput?.focus();
    }
  });
}

// ─── THEME ────────────────────────────────────
const THEME_KEY = 'karargah_theme';
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  let theme = saved || (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  if (theme === 'light') document.documentElement.classList.add('light-theme');
}
function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-theme');
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
}

// ─── ONESIGNAL INIT & SW ──────────────────────

/**
 * OneSignal Web Push SDK başlatma.
 * Bildirim izni, subscription yönetimi ve push delivery
 * tamamen OneSignal tarafından yönetilir.
 */
function initOneSignal() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
      appId: 'dd93bcf1-fcb3-4077-b35d-a7a462867cfc',
      safari_web_id: 'web.onesignal.auto.56640081-e0ac-44c5-9d26-db4b2624f604',
      notifyButton: {
        enable: true,
        text: {
          'tip.state.unsubscribed': 'Bildirimleri Aç',
          'tip.state.subscribed': 'Bildirimler Açık',
          'tip.state.blocked': 'Bildirimler Engellendi',
          'message.prenotify': 'Bildirimleri açmak için tıklayın',
          'message.action.subscribed': 'Bildirimler açıldı!',
          'message.action.resubscribed': 'Bildirimler yeniden açıldı!',
          'message.action.unsubscribed': 'Bildirimler kapatıldı'
        }
      },
      allowLocalhostAsSecureOrigin: true
    });
    console.log('[OneSignal] SDK başarılı şekilde başlatıldı');
  });
}

/** Cache-only Service Worker kaydı (OneSignal kendi SW'sini yönetir) */
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('[SW] Kayıt başarılı:', reg.scope))
    .catch(e => console.warn('[SW] Kayıt hatası:', e));
}

/**
 * Shared görev eklendiğinde OneSignal push bildirimi tetikleme.
 * OneSignal REST API veya dashboard üzerinden segmentlere bildirim gönderilebilir.
 * Burada local SW fallback kullanılır.
 */
function triggerPushForSharedTask(task) {
  // Local SW bildirim (uygulama açıkken)
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_NOTIFICATION',
      payload: {
        title: '📣 Yeni Ortak Plan',
        body: `${task.title} — Katılmak ister misin?`,
        url: '/'
      }
    });
  }
  console.log('[OneSignal] Shared görev bildirimi tetiklendi:', task.title);
  // Not: Diğer kullanıcılara push göndermek için OneSignal REST API kullanın:
  // POST https://onesignal.com/api/v1/notifications
}

// ─────────────────────────────────────────────
// DASHBOARD LOAD
// ─────────────────────────────────────────────
async function loadDashboard() {
  try {
    await db.init();
    State.tasks = await db.getTasks();
  } catch (err) {
    console.error('[App] DB hatası:', err);
    showToast('Bulut bağlantısı kurulamadı', 'error');
    State.tasks = [];
  }
  renderHeader();
  renderMotivation();
  await renderTasks();
  if (State.activeView === 'calendar') renderCalendar();
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
async function init() {
  cacheDom();
  initTheme();

  if (DOM.fab) {
    DOM.fab.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      openModal();
    });
  }

  DOM.modalClose?.addEventListener('click', closeModal);
  DOM.modalCancel?.addEventListener('click', closeModal);
  DOM.modalOverlay?.addEventListener('click', closeModal);
  DOM.taskForm?.addEventListener('submit', handleFormSubmit);

  initChips();
  initPriorityButtons();
  initVisibilityToggle();
  initKeyboardShortcuts();
  initSearch();

  // 🔐 Auth Persistence
  const session = await db.getSession();
  if (session?.user) {
    State.user = session.user;
    updateUserBar(State.user);
    hideAuth();
    await loadDashboard();
    oneSignalLogin(State.user);
    startRealtime();
    startReminderEngine();
  } else {
    showAuth();
  }

  initAuth();
  initFilters();
  initViewTabs();
  initCalendar();
  DOM.themeToggle?.addEventListener('click', toggleTheme);
  setInterval(renderHeader, 60000);
  initOneSignal();
  registerServiceWorker();
}

document.addEventListener('DOMContentLoaded', init);
