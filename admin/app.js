/**
 * STRATIQ Secure Admin Portal - Standalone Client Logic
 * Connects securely to backend on Render or localhost
 */

function getBackendOrigin() {
  const custom = localStorage.getItem('stratiq_backend_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  if (window.STRATIQ_BACKEND_URL && window.STRATIQ_BACKEND_URL.trim()) {
    return window.STRATIQ_BACKEND_URL.trim().replace(/\/+$/, '');
  }
  return window.location.port === '5000' 
    ? window.location.origin 
    : 'http://localhost:5000';
}

function getAdminApiBase() {
  const origin = getBackendOrigin();
  if (origin.endsWith('/api/admin')) return origin;
  if (origin.endsWith('/api')) return `${origin}/admin`;
  return `${origin}/api/admin`;
}

const DEFAULT_ADMIN_KEY = 'stratiq@admin2026';

// Global Application State
const state = {
  adminKey: sessionStorage.getItem('stratiq_admin_key') || '',
  users: [],
  stats: null,
  searchQuery: '',
  revenueFilter: 'all',
  sortField: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'table',
  selectedUser: null,
  revealedHashes: {},
  modalHashRevealed: false
};

// DOM Element Selectors
const el = {
  authGate: document.getElementById('authGate'),
  authForm: document.getElementById('authForm'),
  adminKeyInput: document.getElementById('adminKeyInput'),
  backendUrlInput: document.getElementById('backendUrlInput'),
  resetBackendBtn: document.getElementById('resetBackendBtn'),
  authError: document.getElementById('authError'),
  authErrorMsg: document.getElementById('authErrorMsg'),
  toggleKeyVis: document.getElementById('toggleKeyVis'),
  fillDefaultKeyBtn: document.getElementById('fillDefaultKeyBtn'),
  unlockBtn: document.getElementById('unlockBtn'),

  adminApp: document.getElementById('adminApp'),
  backendStatusBtn: document.getElementById('backendStatusBtn'),
  backendStatusDot: document.getElementById('backendStatusDot'),
  backendStatusText: document.getElementById('backendStatusText'),
  backendModal: document.getElementById('backendModal'),
  closeBackendModalBtn: document.getElementById('closeBackendModalBtn'),
  cancelBackendModalBtn: document.getElementById('cancelBackendModalBtn'),
  modalBackendUrlInput: document.getElementById('modalBackendUrlInput'),
  backendModalForm: document.getElementById('backendModalForm'),
  testConnectionBtn: document.getElementById('testConnectionBtn'),
  backendTestResult: document.getElementById('backendTestResult'),

  logoutBtn: document.getElementById('logoutBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  openAddUserBtn: document.getElementById('openAddUserBtn'),

  statTotalUsers: document.getElementById('statTotalUsers'),
  statTotalBusinesses: document.getElementById('statTotalBusinesses'),
  statTotalAnalyses: document.getElementById('statTotalAnalyses'),
  statHighRevenue: document.getElementById('statHighRevenue'),

  searchInput: document.getElementById('searchInput'),
  clearSearchBtn: document.getElementById('clearSearchBtn'),
  revenueFilter: document.getElementById('revenueFilter'),
  sortFilter: document.getElementById('sortFilter'),
  viewTableBtn: document.getElementById('viewTableBtn'),
  viewCardsBtn: document.getElementById('viewCardsBtn'),
  visibleCount: document.getElementById('visibleCount'),
  totalCount: document.getElementById('totalCount'),

  loadingIndicator: document.getElementById('loadingIndicator'),
  tableViewContainer: document.getElementById('tableViewContainer'),
  usersTableBody: document.getElementById('usersTableBody'),
  cardsViewContainer: document.getElementById('cardsViewContainer'),
  emptyState: document.getElementById('emptyState'),

  // Detail Modal
  detailModal: document.getElementById('detailModal'),
  closeDetailModalBtn: document.getElementById('closeDetailModalBtn'),
  modalCloseBottomBtn: document.getElementById('modalCloseBottomBtn'),
  modalAvatar: document.getElementById('modalAvatar'),
  modalName: document.getElementById('modalName'),
  modalRevenueBadge: document.getElementById('modalRevenueBadge'),
  modalEmail: document.getElementById('modalEmail'),
  modalUid: document.getElementById('modalUid'),
  intakeName: document.getElementById('intakeName'),
  intakeEmail: document.getElementById('intakeEmail'),
  intakePhone: document.getElementById('intakePhone'),
  intakeRevenue: document.getElementById('intakeRevenue'),
  intakeBusiness: document.getElementById('intakeBusiness'),
  intakeCreatedAt: document.getElementById('intakeCreatedAt'),
  modalPasswordDisplay: document.getElementById('modalPasswordDisplay'),
  toggleModalHashBtn: document.getElementById('toggleModalHashBtn'),
  toggleModalHashText: document.getElementById('toggleModalHashText'),
  copyModalHashBtn: document.getElementById('copyModalHashBtn'),
  modalHashAlgo: document.getElementById('modalHashAlgo'),
  modalHashStrength: document.getElementById('modalHashStrength'),
  modalHashLength: document.getElementById('modalHashLength'),
  modalCompletion: document.getElementById('modalCompletion'),
  modalIndustry: document.getElementById('modalIndustry'),
  modalCountry: document.getElementById('modalCountry'),
  modalModel: document.getElementById('modalModel'),
  modalAnalyses: document.getElementById('modalAnalyses'),
  modalDeleteUserBtn: document.getElementById('modalDeleteUserBtn'),

  // Add User Modal
  addUserModal: document.getElementById('addUserModal'),
  closeAddUserModalBtn: document.getElementById('closeAddUserModalBtn'),
  cancelAddUserBtn: document.getElementById('cancelAddUserBtn'),
  addUserForm: document.getElementById('addUserForm'),
  addUserError: document.getElementById('addUserError'),
  newDisplayName: document.getElementById('newDisplayName'),
  newEmail: document.getElementById('newEmail'),
  newMobile: document.getElementById('newMobile'),
  newRevenue: document.getElementById('newRevenue'),
  newPassword: document.getElementById('newPassword'),
  newBusinessName: document.getElementById('newBusinessName')
};

function updateBackendStatusDisplay(isOnline = null) {
  const origin = getBackendOrigin();
  let host = origin;
  try {
    const u = new URL(origin);
    host = u.host;
  } catch (e) {}

  if (el.backendUrlInput) el.backendUrlInput.value = origin;
  if (el.modalBackendUrlInput) el.modalBackendUrlInput.value = origin;

  if (el.backendStatusText) {
    el.backendStatusText.textContent = `Backend: ${host}`;
  }

  if (el.backendStatusDot) {
    el.backendStatusDot.className = isOnline === false
      ? 'w-2 h-2 rounded-full bg-rose-500'
      : isOnline === true
        ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse'
        : 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
  }
}

async function pingBackend(urlCandidate) {
  const base = (urlCandidate || getBackendOrigin()).replace(/\/+$/, '');
  const testUrl = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`;
  const res = await fetch(testUrl, { method: 'GET', signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
  return await res.json();
}

// ==========================================
// 1. INITIALIZATION & AUTHENTICATION
// ==========================================
function init() {
  updateBackendStatusDisplay();

  // Test backend connectivity in background to set status light
  pingBackend()
    .then(() => updateBackendStatusDisplay(true))
    .catch(() => updateBackendStatusDisplay(false));

  if (state.adminKey) {
    verifyKey(state.adminKey)
      .then((valid) => {
        if (valid) {
          unlockUI();
          loadData();
        } else {
          lockUI();
        }
      })
      .catch(() => lockUI());
  } else {
    lockUI();
  }

  setupEventListeners();
  if (window.lucide) window.lucide.createIcons();
}

function lockUI() {
  state.adminKey = '';
  sessionStorage.removeItem('stratiq_admin_key');
  el.authGate.classList.remove('hidden');
  el.adminApp.classList.add('hidden');
  el.adminKeyInput.value = '';
  updateBackendStatusDisplay();
  if (window.lucide) window.lucide.createIcons();
}

function unlockUI() {
  el.authGate.classList.add('hidden');
  el.adminApp.classList.remove('hidden');
  updateBackendStatusDisplay(true);
  if (window.lucide) window.lucide.createIcons();
}

async function verifyKey(key) {
  try {
    const res = await fetch(`${getAdminApiBase()}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey: key })
    });
    const data = await res.json();
    const ok = res.ok && data.success === true;
    updateBackendStatusDisplay(ok);
    return ok;
  } catch (err) {
    console.error('Verify key failed:', err);
    updateBackendStatusDisplay(false);
    return false;
  }
}

// ==========================================
// 2. API REQUEST WRAPPER (SECURED)
// ==========================================
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'x-admin-key': state.adminKey,
    ...(options.headers || {})
  };

  const response = await fetch(`${getAdminApiBase()}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    alert('Security session expired or invalid key. Please log in again.');
    lockUI();
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}

// ==========================================
// 3. LOAD DATA FROM BACKEND
// ==========================================
async function loadData() {
  el.loadingIndicator.classList.remove('hidden');
  el.tableViewContainer.classList.add('hidden');
  el.cardsViewContainer.classList.add('hidden');
  el.emptyState.classList.add('hidden');

  try {
    const [usersRes, statsRes] = await Promise.all([
      apiRequest('/users'),
      apiRequest('/stats').catch(() => null)
    ]);

    state.users = usersRes.users || [];
    state.stats = statsRes ? statsRes.stats : null;

    updateStats();
    renderFilteredUsers();
  } catch (err) {
    console.error('Failed to load admin data:', err);
  } finally {
    el.loadingIndicator.classList.add('hidden');
  }
}

// ==========================================
// 4. METRICS & KPI UPDATER
// ==========================================
function updateStats() {
  const total = state.users.length;
  el.statTotalUsers.textContent = total;
  el.totalCount.textContent = total;

  if (state.stats) {
    el.statTotalBusinesses.textContent = state.stats.totalBusinesses || total;
    el.statTotalAnalyses.textContent = state.stats.totalAnalyses || '0';

    const highTier = (state.stats.revenueTiers?.['$1,000,000 - $5,000,000'] || 0) +
                     (state.stats.revenueTiers?.['$5,000,000+'] || 0);
    el.statHighRevenue.textContent = highTier;
  } else {
    el.statTotalBusinesses.textContent = total;
    el.statTotalAnalyses.textContent = '5+';
    const highTier = state.users.filter(u => u.yearlyRevenue?.includes('$1,000,000') || u.yearlyRevenue?.includes('$5,000,000+')).length;
    el.statHighRevenue.textContent = highTier;
  }
}

// ==========================================
// 5. FILTERING, SEARCHING & SORTING
// ==========================================
function getProcessedUsers() {
  let list = [...state.users];

  // Search filter
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.toLowerCase().trim();
    list = list.filter(u =>
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.mobileNumber || '').toLowerCase().includes(q) ||
      (u.businessName || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q) ||
      (u.industry || '').toLowerCase().includes(q)
    );
  }

  // Revenue filter
  if (state.revenueFilter !== 'all') {
    list = list.filter(u => u.yearlyRevenue === state.revenueFilter);
  }

  // Sorting
  list.sort((a, b) => {
    let valA = '';
    let valB = '';

    switch (state.sortField) {
      case 'displayName':
        valA = (a.displayName || '').toLowerCase();
        valB = (b.displayName || '').toLowerCase();
        break;
      case 'email':
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
        break;
      case 'yearlyRevenue':
        valA = a.yearlyRevenue || '';
        valB = b.yearlyRevenue || '';
        break;
      case 'businessName':
        valA = (a.businessName || '').toLowerCase();
        valB = (b.businessName || '').toLowerCase();
        break;
      case 'createdAt':
      default:
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
        break;
    }

    if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return list;
}

function renderFilteredUsers() {
  const users = getProcessedUsers();
  el.visibleCount.textContent = users.length;

  if (users.length === 0) {
    el.tableViewContainer.classList.add('hidden');
    el.cardsViewContainer.classList.add('hidden');
    el.emptyState.classList.remove('hidden');
    return;
  }

  el.emptyState.classList.add('hidden');

  if (state.viewMode === 'table') {
    el.tableViewContainer.classList.remove('hidden');
    el.cardsViewContainer.classList.add('hidden');
    renderTable(users);
  } else {
    el.tableViewContainer.classList.add('hidden');
    el.cardsViewContainer.classList.remove('hidden');
    renderCards(users);
  }

  if (window.lucide) window.lucide.createIcons();
}

// ==========================================
// 6. TABLE VIEW RENDERER
// ==========================================
function renderTable(users) {
  el.usersTableBody.innerHTML = '';

  users.forEach((u) => {
    const isRevealed = !!state.revealedHashes[u.uid];
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 cursor-pointer transition-colors group';
    tr.onclick = () => openDetailModal(u);

    const revenueClass = getRevenueBadgeClass(u.yearlyRevenue);
    const dateFormatted = formatRelativeDate(u.createdAt);

    tr.innerHTML = `
      <!-- User & Contact -->
      <td class="py-3.5 px-4">
        <div class="flex items-center gap-3">
          ${u.photoURL ? `
            <img src="${escapeHtml(u.photoURL)}" class="w-10 h-10 rounded-xl border border-cyan-500/30 object-cover shrink-0" />
          ` : `
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/30 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">
              ${escapeHtml((u.displayName || 'U').charAt(0).toUpperCase())}
            </div>
          `}
          <div class="min-w-0">
            <div class="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
              ${escapeHtml(u.displayName)}
            </div>
            <div class="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
              <i data-lucide="mail" class="w-3 h-3 text-slate-500 shrink-0"></i>
              <span>${escapeHtml(u.email)}</span>
            </div>
          </div>
        </div>
      </td>

      <!-- Mobile Phone Number -->
      <td class="py-3.5 px-4 text-slate-300">
        <div class="flex items-center gap-1.5 font-mono text-[11px]">
          <i data-lucide="phone" class="w-3.5 h-3.5 text-cyan-400 shrink-0"></i>
          <span>${escapeHtml(u.mobileNumber)}</span>
        </div>
      </td>

      <!-- Yearly Revenue -->
      <td class="py-3.5 px-4">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${revenueClass}">
          <i data-lucide="dollar-sign" class="w-3 h-3"></i>
          ${escapeHtml(u.yearlyRevenue)}
        </span>
      </td>

      <!-- Enterprise Name -->
      <td class="py-3.5 px-4">
        <div class="font-medium text-white truncate max-w-[170px]">${escapeHtml(u.businessName)}</div>
        <div class="text-[10px] text-slate-400 truncate mt-0.5">${escapeHtml(u.industry || 'General Industry')}</div>
      </td>

      <!-- Password Credential (Hidden & Encrypted) -->
      <td class="py-3.5 px-4" onclick="event.stopPropagation()">
        <div class="flex items-center gap-2">
          <div class="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1 flex items-center gap-2 max-w-[210px]">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-cyan-400 shrink-0"></i>
            ${isRevealed ? `
              <span class="font-mono text-[10px] text-cyan-300 truncate max-w-[120px] select-all" title="${escapeHtml(u.passwordEncrypted)}">
                ${escapeHtml(u.passwordEncrypted)}
              </span>
            ` : `
              <span class="font-mono text-xs tracking-widest text-slate-400 select-none">••••••••••••</span>
            `}
            <button
              type="button"
              class="text-slate-400 hover:text-white p-0.5 toggle-hash-btn"
              data-uid="${u.uid}"
              title="${isRevealed ? 'Mask' : 'Show Encrypted Ciphertext'}"
            >
              <i data-lucide="${isRevealed ? 'eye-off' : 'eye'}" class="w-3 h-3 text-cyan-400"></i>
            </button>
          </div>

          <button
            type="button"
            class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors copy-hash-btn"
            data-hash="${escapeHtml(u.passwordEncrypted)}"
            title="Copy Encrypted Hash Token"
          >
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>

      <!-- Registration Date -->
      <td class="py-3.5 px-4 text-slate-400">
        <div class="text-slate-300 font-medium">${dateFormatted.relative}</div>
        <div class="text-[10px] text-slate-500 font-mono">${dateFormatted.date}</div>
      </td>

      <!-- Actions -->
      <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
        <div class="flex items-center justify-end gap-1.5">
          <button
            class="px-2.5 py-1 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition-colors flex items-center gap-1 view-detail-btn"
            data-uid="${u.uid}"
          >
            <span>Details</span>
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </button>

          <button
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors delete-user-btn"
            data-uid="${u.uid}"
            data-email="${escapeHtml(u.email)}"
            title="Delete User Record"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    `;

    el.usersTableBody.appendChild(tr);
  });

  // Attach event handlers
  document.querySelectorAll('.toggle-hash-btn').forEach(b => {
    b.onclick = (e) => {
      e.stopPropagation();
      const uid = b.dataset.uid;
      state.revealedHashes[uid] = !state.revealedHashes[uid];
      renderFilteredUsers();
    };
  });

  document.querySelectorAll('.copy-hash-btn').forEach(b => {
    b.onclick = (e) => {
      e.stopPropagation();
      copyToClipboard(b.dataset.hash);
      b.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        b.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
        if (window.lucide) window.lucide.createIcons();
      }, 1500);
    };
  });

  document.querySelectorAll('.view-detail-btn').forEach(b => {
    b.onclick = () => {
      const u = state.users.find(x => x.uid === b.dataset.uid);
      if (u) openDetailModal(u);
    };
  });

  document.querySelectorAll('.delete-user-btn').forEach(b => {
    b.onclick = () => handleDeleteUser(b.dataset.uid, b.dataset.email);
  });
}

// ==========================================
// 7. CARDS VIEW RENDERER
// ==========================================
function renderCards(users) {
  el.cardsViewContainer.innerHTML = '';

  users.forEach((u) => {
    const isRevealed = !!state.revealedHashes[u.uid];
    const revenueClass = getRevenueBadgeClass(u.yearlyRevenue);
    const dateFormatted = formatRelativeDate(u.createdAt);

    const card = document.createElement('div');
    card.className = 'glass-card rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between group';
    card.onclick = () => openDetailModal(u);

    card.innerHTML = `
      <div class="space-y-4">
        <!-- Top: Avatar, Name, Revenue Badge -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            ${u.photoURL ? `
              <img src="${escapeHtml(u.photoURL)}" class="w-12 h-12 rounded-xl border border-cyan-500/30 object-cover shrink-0" />
            ` : `
              <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 border border-cyan-400/30 flex items-center justify-center font-bold text-white shrink-0 text-sm shadow-md">
                ${escapeHtml((u.displayName || 'U').charAt(0).toUpperCase())}
              </div>
            `}
            <div class="min-w-0">
              <h4 class="font-bold text-white group-hover:text-cyan-400 transition-colors truncate text-sm">
                ${escapeHtml(u.displayName)}
              </h4>
              <p class="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <i data-lucide="mail" class="w-3 h-3 text-slate-500 shrink-0"></i>
                <span>${escapeHtml(u.email)}</span>
              </p>
            </div>
          </div>

          <span class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${revenueClass}">
            ${escapeHtml(u.yearlyRevenue)}
          </span>
        </div>

        <!-- Intake Fields -->
        <div class="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400 flex items-center gap-1.5">
              <i data-lucide="phone" class="w-3 h-3 text-cyan-400"></i>
              <span>Mobile Phone</span>
            </span>
            <span class="font-mono text-slate-200 font-medium">${escapeHtml(u.mobileNumber)}</span>
          </div>

          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400 flex items-center gap-1.5">
              <i data-lucide="building" class="w-3 h-3 text-indigo-400"></i>
              <span>Enterprise</span>
            </span>
            <span class="text-white font-medium truncate max-w-[150px]">${escapeHtml(u.businessName)}</span>
          </div>

          <div class="flex items-center justify-between text-[11px]">
            <span class="text-slate-400 flex items-center gap-1.5">
              <i data-lucide="layers" class="w-3 h-3 text-emerald-400"></i>
              <span>Industry</span>
            </span>
            <span class="text-slate-300 truncate max-w-[150px]">${escapeHtml(u.industry || 'Commercial')}</span>
          </div>
        </div>

        <!-- Password Credential Block -->
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1.5" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400">
            <span class="flex items-center gap-1 text-cyan-400">
              <i data-lucide="shield-check" class="w-3 h-3"></i> Encrypted Credential
            </span>
            <span class="text-slate-400 font-mono">Protected</span>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div class="font-mono text-xs text-slate-300 truncate">
              ${isRevealed ? `
                <span class="text-cyan-300 text-[10px] select-all font-mono">${escapeHtml(u.passwordEncrypted)}</span>
              ` : `
                <span class="tracking-widest">••••••••••••</span>
              `}
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <button
                type="button"
                class="p-1 rounded text-slate-400 hover:text-white toggle-hash-btn"
                data-uid="${u.uid}"
                title="${isRevealed ? 'Mask' : 'View Encrypted Hash'}"
              >
                <i data-lucide="${isRevealed ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5 text-cyan-400"></i>
              </button>
              <button
                type="button"
                class="p-1 rounded text-slate-400 hover:text-white copy-hash-btn"
                data-hash="${escapeHtml(u.passwordEncrypted)}"
                title="Copy Hash Token"
              >
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px]" onclick="event.stopPropagation()">
        <span class="text-slate-400 font-mono">${dateFormatted.date}</span>

        <div class="flex items-center gap-2">
          <button
            class="px-2.5 py-1 rounded-lg bg-cyan-600/15 hover:bg-cyan-600/25 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1 transition-colors view-detail-btn"
            data-uid="${u.uid}"
          >
            <span>View</span>
            <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </button>

          <button
            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors delete-user-btn"
            data-uid="${u.uid}"
            data-email="${escapeHtml(u.email)}"
            title="Delete User"
          >
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;

    el.cardsViewContainer.appendChild(card);
  });

  // Attach handlers
  document.querySelectorAll('.toggle-hash-btn').forEach(b => {
    b.onclick = (e) => {
      e.stopPropagation();
      const uid = b.dataset.uid;
      state.revealedHashes[uid] = !state.revealedHashes[uid];
      renderFilteredUsers();
    };
  });

  document.querySelectorAll('.copy-hash-btn').forEach(b => {
    b.onclick = (e) => {
      e.stopPropagation();
      copyToClipboard(b.dataset.hash);
      b.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => {
        b.innerHTML = '<i data-lucide="copy" class="w-3.5 h-3.5"></i>';
        if (window.lucide) window.lucide.createIcons();
      }, 1500);
    };
  });

  document.querySelectorAll('.view-detail-btn').forEach(b => {
    b.onclick = () => {
      const u = state.users.find(x => x.uid === b.dataset.uid);
      if (u) openDetailModal(u);
    };
  });

  document.querySelectorAll('.delete-user-btn').forEach(b => {
    b.onclick = () => handleDeleteUser(b.dataset.uid, b.dataset.email);
  });
}

// ==========================================
// 8. DETAIL INSPECTION MODAL
// ==========================================
function openDetailModal(user) {
  state.selectedUser = user;
  state.modalHashRevealed = false;

  el.modalName.textContent = user.displayName;
  el.modalEmail.textContent = user.email;
  el.modalUid.textContent = user.uid;
  el.modalAvatar.textContent = (user.displayName || 'U').charAt(0).toUpperCase();

  const revBadge = getRevenueBadgeClass(user.yearlyRevenue);
  el.modalRevenueBadge.className = `text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${revBadge}`;
  el.modalRevenueBadge.textContent = user.yearlyRevenue;

  el.intakeName.textContent = user.displayName;
  el.intakeEmail.textContent = user.email;
  el.intakePhone.textContent = user.mobileNumber;
  el.intakeRevenue.textContent = user.yearlyRevenue;
  el.intakeBusiness.textContent = user.businessName;
  el.intakeCreatedAt.textContent = new Date(user.createdAt).toLocaleString();

  el.modalPasswordDisplay.textContent = '••••••••••••';
  el.modalPasswordDisplay.className = 'font-mono text-xs tracking-widest text-slate-300';
  el.toggleModalHashText.textContent = 'Show Encrypted Hash';

  el.modalHashAlgo.textContent = user.passwordAlgorithm || 'AES-256 / SHA-256 Digest';
  el.modalHashStrength.textContent = user.passwordStrength || 'Enterprise';
  el.modalHashLength.textContent = `${user.passwordLength || 8} characters`;

  el.modalCompletion.textContent = `${user.completionPercentage || 85}% Completed`;
  el.modalIndustry.textContent = user.industry || 'Technology & SaaS';
  el.modalCountry.textContent = user.country || 'United States';
  el.modalModel.textContent = user.businessModel || 'B2B';
  el.modalAnalyses.textContent = `${user.totalAnalyses || 0} Strategic Reports`;

  el.detailModal.classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
}

function closeDetailModal() {
  state.selectedUser = null;
  el.detailModal.classList.add('hidden');
}

// ==========================================
// 9. DELETE USER HANDLER
// ==========================================
async function handleDeleteUser(uid, email) {
  if (!confirm(`Are you sure you want to permanently delete user account: ${email}?`)) {
    return;
  }

  try {
    await apiRequest(`/users/${uid}`, { method: 'DELETE' });
    state.users = state.users.filter(u => u.uid !== uid);
    updateStats();
    renderFilteredUsers();
    closeDetailModal();
  } catch (err) {
    alert(`Delete failed: ${err.message}`);
  }
}

// ==========================================
// 10. EXPORT TO CSV
// ==========================================
function exportCSV() {
  if (state.users.length === 0) {
    alert('No users to export.');
    return;
  }

  const headers = [
    'UID',
    'Display Name',
    'Registered Email',
    'Mobile Phone',
    'Yearly Revenue',
    'Enterprise Name',
    'Industry',
    'Country',
    'Password Status',
    'Password Encrypted Hash',
    'Registered Date'
  ];

  const rows = state.users.map(u => [
    `"${u.uid}"`,
    `"${(u.displayName || '').replace(/"/g, '""')}"`,
    `"${u.email}"`,
    `"${u.mobileNumber}"`,
    `"${u.yearlyRevenue}"`,
    `"${(u.businessName || '').replace(/"/g, '""')}"`,
    `"${u.industry || ''}"`,
    `"${u.country || ''}"`,
    `"Protected & Encrypted"`,
    `"${u.passwordEncrypted || ''}"`,
    `"${new Date(u.createdAt).toISOString()}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `stratiq_user_registration_registry_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// 11. EVENT LISTENERS
// ==========================================
function setupEventListeners() {
  // Auth Form Submit
  el.authForm.onsubmit = async (e) => {
    e.preventDefault();
    el.authError.classList.add('hidden');
    el.unlockBtn.disabled = true;
    el.unlockBtn.innerHTML = '<span class="animate-spin mr-2">⏳</span> Validating Passkey...';

    // If user entered/edited backend URL on login screen, store it
    if (el.backendUrlInput && el.backendUrlInput.value.trim()) {
      localStorage.setItem('stratiq_backend_url', el.backendUrlInput.value.trim());
      updateBackendStatusDisplay();
    }

    const key = el.adminKeyInput.value.trim();
    const valid = await verifyKey(key);

    if (valid) {
      state.adminKey = key;
      sessionStorage.setItem('stratiq_admin_key', key);
      unlockUI();
      loadData();
    } else {
      el.authError.classList.remove('hidden');
      el.authErrorMsg.textContent = 'Invalid Master Admin Key or Backend unreachable. Please verify credentials.';
    }

    el.unlockBtn.disabled = false;
    el.unlockBtn.innerHTML = '<i data-lucide="key" class="w-4 h-4 mr-2"></i><span>Authenticate & Unlock Portal</span>';
    if (window.lucide) window.lucide.createIcons();
  };

  // Reset Backend to default
  if (el.resetBackendBtn) {
    el.resetBackendBtn.onclick = () => {
      localStorage.removeItem('stratiq_backend_url');
      updateBackendStatusDisplay();
      alert('Backend server URL reset to default: ' + getBackendOrigin());
    };
  }

  // Backend Settings Modal
  if (el.backendStatusBtn) {
    el.backendStatusBtn.onclick = () => {
      if (el.modalBackendUrlInput) {
        el.modalBackendUrlInput.value = getBackendOrigin();
      }
      if (el.backendTestResult) {
        el.backendTestResult.classList.add('hidden');
      }
      el.backendModal.classList.remove('hidden');
      if (window.lucide) window.lucide.createIcons();
    };
  }

  if (el.closeBackendModalBtn) {
    el.closeBackendModalBtn.onclick = () => el.backendModal.classList.add('hidden');
  }

  if (el.cancelBackendModalBtn) {
    el.cancelBackendModalBtn.onclick = () => el.backendModal.classList.add('hidden');
  }

  if (el.testConnectionBtn) {
    el.testConnectionBtn.onclick = async () => {
      const targetUrl = el.modalBackendUrlInput ? el.modalBackendUrlInput.value.trim() : '';
      if (!targetUrl) return;

      el.backendTestResult.className = 'p-3 rounded-xl text-[11px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300';
      el.backendTestResult.textContent = `Pinging ${targetUrl}...`;
      el.backendTestResult.classList.remove('hidden');

      try {
        const info = await pingBackend(targetUrl);
        el.backendTestResult.className = 'p-3 rounded-xl text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
        el.backendTestResult.textContent = `Online! Service: ${info.service || 'Ready'}, DB: ${info.database || 'Active'}`;
      } catch (err) {
        el.backendTestResult.className = 'p-3 rounded-xl text-[11px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400';
        el.backendTestResult.textContent = `Ping failed: ${err.message}. Ensure backend is active on Render.`;
      }
    };
  }

  if (el.backendModalForm) {
    el.backendModalForm.onsubmit = async (e) => {
      e.preventDefault();
      const newUrl = el.modalBackendUrlInput.value.trim();
      if (!newUrl) return;

      localStorage.setItem('stratiq_backend_url', newUrl);
      updateBackendStatusDisplay();

      if (state.adminKey) {
        const valid = await verifyKey(state.adminKey);
        if (valid) {
          loadData();
        } else {
          alert('Backend updated. Please re-authenticate with the Master Admin Key.');
          lockUI();
        }
      }

      el.backendModal.classList.add('hidden');
    };
  }

  // Default Key Filler
  el.fillDefaultKeyBtn.onclick = () => {
    el.adminKeyInput.value = DEFAULT_ADMIN_KEY;
  };

  // Toggle Visibility
  el.toggleKeyVis.onclick = () => {
    el.adminKeyInput.type = el.adminKeyInput.type === 'password' ? 'text' : 'password';
  };

  // Logout
  el.logoutBtn.onclick = () => {
    if (confirm('Lock Admin Portal and clear security session?')) {
      lockUI();
    }
  };

  // Refresh
  el.refreshBtn.onclick = () => loadData();

  // Export CSV
  el.exportCsvBtn.onclick = exportCSV;

  // Search Input
  el.searchInput.oninput = (e) => {
    state.searchQuery = e.target.value;
    el.clearSearchBtn.classList.toggle('hidden', !state.searchQuery);
    renderFilteredUsers();
  };

  el.clearSearchBtn.onclick = () => {
    el.searchInput.value = '';
    state.searchQuery = '';
    el.clearSearchBtn.classList.add('hidden');
    renderFilteredUsers();
  };

  // Filters
  el.revenueFilter.onchange = (e) => {
    state.revenueFilter = e.target.value;
    renderFilteredUsers();
  };

  el.sortFilter.onchange = (e) => {
    const [field, order] = e.target.value.split('_');
    state.sortField = field;
    state.sortOrder = order;
    renderFilteredUsers();
  };

  // View Mode
  el.viewTableBtn.onclick = () => {
    state.viewMode = 'table';
    el.viewTableBtn.className = 'p-1.5 rounded-lg bg-cyan-600 text-white transition-colors';
    el.viewCardsBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors';
    renderFilteredUsers();
  };

  el.viewCardsBtn.onclick = () => {
    state.viewMode = 'cards';
    el.viewCardsBtn.className = 'p-1.5 rounded-lg bg-cyan-600 text-white transition-colors';
    el.viewTableBtn.className = 'p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors';
    renderFilteredUsers();
  };

  // Detail Modal Closers
  el.closeDetailModalBtn.onclick = closeDetailModal;
  el.modalCloseBottomBtn.onclick = closeDetailModal;
  el.detailModal.onclick = (e) => {
    if (e.target === el.detailModal) closeDetailModal();
  };

  // Detail Modal Password Reveal
  el.toggleModalHashBtn.onclick = () => {
    if (!state.selectedUser) return;
    state.modalHashRevealed = !state.modalHashRevealed;

    if (state.modalHashRevealed) {
      el.modalPasswordDisplay.textContent = state.selectedUser.passwordEncrypted;
      el.modalPasswordDisplay.className = 'font-mono text-[11px] text-cyan-300 break-all select-all';
      el.toggleModalHashText.textContent = 'Mask Password';
    } else {
      el.modalPasswordDisplay.textContent = '••••••••••••';
      el.modalPasswordDisplay.className = 'font-mono text-xs tracking-widest text-slate-300';
      el.toggleModalHashText.textContent = 'Show Encrypted Hash';
    }
  };

  el.copyModalHashBtn.onclick = () => {
    if (!state.selectedUser) return;
    copyToClipboard(state.selectedUser.passwordEncrypted);
    el.copyModalHashBtn.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>';
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => {
      el.copyModalHashBtn.innerHTML = '<i data-lucide="copy" class="w-4 h-4"></i>';
      if (window.lucide) window.lucide.createIcons();
    }, 1500);
  };

  el.modalDeleteUserBtn.onclick = () => {
    if (state.selectedUser) {
      handleDeleteUser(state.selectedUser.uid, state.selectedUser.email);
    }
  };

  // Add User Modal
  el.openAddUserBtn.onclick = () => {
    el.addUserForm.reset();
    el.addUserError.classList.add('hidden');
    el.addUserModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  };

  el.closeAddUserModalBtn.onclick = () => el.addUserModal.classList.add('hidden');
  el.cancelAddUserBtn.onclick = () => el.addUserModal.classList.add('hidden');

  el.addUserForm.onsubmit = async (e) => {
    e.preventDefault();
    el.addUserError.classList.add('hidden');

    const payload = {
      displayName: el.newDisplayName.value.trim(),
      email: el.newEmail.value.trim(),
      mobileNumber: el.newMobile.value.trim(),
      yearlyRevenue: el.newRevenue.value,
      password: el.newPassword.value,
      businessName: el.newBusinessName.value.trim()
    };

    try {
      const res = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.user) {
        state.users.unshift(res.user);
        updateStats();
        renderFilteredUsers();
        el.addUserModal.classList.add('hidden');
      }
    } catch (err) {
      el.addUserError.textContent = err.message || 'Failed to create user.';
      el.addUserError.classList.remove('hidden');
    }
  };
}

// ==========================================
// 12. UTILITY HELPERS
// ==========================================
function getRevenueBadgeClass(rev) {
  if (!rev) return 'badge-tier-under';
  if (rev.includes('$5,000,000+')) return 'badge-tier-5m';
  if (rev.includes('$1,000,000')) return 'badge-tier-1m';
  if (rev.includes('$500,000')) return 'badge-tier-500k';
  if (rev.includes('$100,000')) return 'badge-tier-100k';
  return 'badge-tier-under';
}

function formatRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  let relative = 'Just now';
  if (diffHours >= 1 && diffHours < 24) relative = `${diffHours}h ago`;
  else if (diffDays === 1) relative = 'Yesterday';
  else if (diffDays > 1 && diffDays < 30) relative = `${diffDays}d ago`;

  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return { relative, date };
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Run App on Load
window.addEventListener('DOMContentLoaded', init);
