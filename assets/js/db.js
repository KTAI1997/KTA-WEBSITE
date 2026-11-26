// Database adapter (future Supabase / REST connection)

// Database Readiness & Adapter Layer (Prepared for future DB connection)
const DEFAULT_DB_CONFIG = {
  mode: "LOCAL_STORAGE",
  env: "staging",
  url: "",
  apiKey: "",
  authType: "Bearer",
  tables: {
    flights: "flights",
    bookings: "bookings",
    users: "users"
  },
  autoSync: false,
  lastTestedAt: null
};

function loadDatabaseConfig() {
  const saved = JSON.parse(localStorage.getItem("kta_db_config") || "null");
  return {
    ...DEFAULT_DB_CONFIG,
    ...(saved || {}),
    tables: {
      ...DEFAULT_DB_CONFIG.tables,
      ...((saved && saved.tables) || {})
    }
  };
}

state.db = loadDatabaseConfig();

// Unified database adapter abstraction so switching from localStorage to a remote DB is seamless
const KTA_DB = {
  getHeaders() {
    const headers = { "Content-Type": "application/json" };
    if (state.db.apiKey) {
      if (state.db.authType === "ApiKey") {
        headers["apikey"] = state.db.apiKey;
      } else if (state.db.authType === "Bearer") {
        headers["Authorization"] = "Bearer " + state.db.apiKey;
      }
    }
    return headers;
  },
  isRemoteActive() {
    return state.db.mode !== "LOCAL_STORAGE" && Boolean(state.db.url);
  },
  async pushCollection(collectionKey, records) {
    if (!this.isRemoteActive()) {
      return { ok: false, reason: "LOCAL_STORAGE mode active or URL not set" };
    }
    const tableName = state.db.tables[collectionKey] || collectionKey;
    const baseUrl = state.db.url.replace(/\/+$/, "");
    const targetUrl = state.db.mode === "SUPABASE_REST"
      ? `${baseUrl}/${encodeURIComponent(tableName)}`
      : `${baseUrl}/${encodeURIComponent(tableName)}/bulk`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ table: tableName, env: state.db.env, records })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${targetUrl}`);
    }
    return { ok: true, status: res.status };
  }
};

function populateDatabaseForm() {
  if (!document.getElementById("dbModeInput")) return;
  document.getElementById("dbModeInput").value = state.db.mode;
  document.getElementById("dbEnvInput").value = state.db.env;
  document.getElementById("dbUrlInput").value = state.db.url || "";
  document.getElementById("dbApiKeyInput").value = state.db.apiKey || "";
  document.getElementById("dbAuthTypeInput").value = state.db.authType || "Bearer";
  document.getElementById("dbTableFlightsInput").value = state.db.tables.flights || "flights";
  document.getElementById("dbTableBookingsInput").value = state.db.tables.bookings || "bookings";
  document.getElementById("dbTableUsersInput").value = state.db.tables.users || "users";
  document.getElementById("dbAutoSyncInput").checked = Boolean(state.db.autoSync);
  syncDbUiPreview();
}

function syncDbUiPreview() {
  const modeEl = document.getElementById("dbModeInput");
  const urlEl = document.getElementById("dbUrlInput");
  const mode = modeEl ? modeEl.value : state.db.mode;
  const url = urlEl ? urlEl.value.trim() : state.db.url;
  const tables = {
    flights: document.getElementById("dbTableFlightsInput")?.value.trim() || state.db.tables.flights,
    bookings: document.getElementById("dbTableBookingsInput")?.value.trim() || state.db.tables.bookings,
    users: document.getElementById("dbTableUsersInput")?.value.trim() || state.db.tables.users
  };

  const badge = document.getElementById("dbConnectionBadge");
  const kpiMode = document.getElementById("adminDbModeStatus");
  if (badge) badge.textContent = `MODE: ${mode}`;
  if (kpiMode) kpiMode.textContent = mode;

  const preview = document.getElementById("dbAdapterPreview");
  if (preview) {
    preview.textContent = JSON.stringify({
      mode,
      urlConfigured: Boolean(url),
      autoSync: Boolean(document.getElementById("dbAutoSyncInput")?.checked),
      tables,
      localCounts: {
        flights: state.flights.length,
        bookings: state.bookings.length,
        users: state.users.length
      }
    }, null, 2);
  }

  const lastTestEl = document.getElementById("dbLastTestLabel");
  if (lastTestEl) {
    lastTestEl.textContent = state.db.lastTestedAt ? `Tested: ${state.db.lastTestedAt}` : "Not tested";
  }
}

function showDbFeedback(msg, ok) {
  const el = document.getElementById("dbFeedbackBanner");
  if (!el) return;
  el.classList.remove("hidden");
  el.className = ok
    ? "p-3 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
    : "p-3 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-200 border border-amber-400/30";
  el.textContent = msg;
}

function saveDatabaseConfig(e) {
  e.preventDefault();
  state.db = {
    ...state.db,
    mode: document.getElementById("dbModeInput").value,
    env: document.getElementById("dbEnvInput").value,
    url: document.getElementById("dbUrlInput").value.trim(),
    apiKey: document.getElementById("dbApiKeyInput").value,
    authType: document.getElementById("dbAuthTypeInput").value,
    tables: {
      flights: document.getElementById("dbTableFlightsInput").value.trim() || "flights",
      bookings: document.getElementById("dbTableBookingsInput").value.trim() || "bookings",
      users: document.getElementById("dbTableUsersInput").value.trim() || "users"
    },
    autoSync: document.getElementById("dbAutoSyncInput").checked
  };
  localStorage.setItem("kta_db_config", JSON.stringify(state.db));
  syncDbUiPreview();
  logSecurityEvent(`Database config saved (Mode: ${state.db.mode})`);
  showDbFeedback("Database settings saved to browser configuration (kta_db_config).", true);
}

async function testDatabaseConnection() {
  const mode = document.getElementById("dbModeInput").value;
  const url = document.getElementById("dbUrlInput").value.trim();
  state.db.lastTestedAt = new Date().toLocaleTimeString();
  localStorage.setItem("kta_db_config", JSON.stringify(state.db));
  syncDbUiPreview();

  if (mode === "LOCAL_STORAGE") {
    showDbFeedback("LOCAL_STORAGE mode is selected. No external database connection is needed right now.", true);
    return;
  }
  if (!url) {
    showDbFeedback("Please enter a Database / API Base URL first before testing.", false);
    return;
  }
  try {
    const res = await fetch(url, { method: "GET", headers: KTA_DB.getHeaders() });
    showDbFeedback(`Endpoint responded with HTTP ${res.status}. Ready for integration.`, res.ok);
    logSecurityEvent(`DB endpoint test (${url}) -> HTTP ${res.status}`);
  } catch (err) {
    showDbFeedback(`Endpoint test noted (${err.message}). Settings remain saved for when your server/CORS is ready.`, false);
    logSecurityEvent(`DB endpoint test notice: ${err.message}`);
  }
}

function exportLocalSnapshotJSON() {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    dbConfig: { ...state.db, apiKey: state.db.apiKey ? "***REDACTED***" : "" },
    flights: state.flights,
    bookings: state.bookings,
    users: state.users.map(u => ({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      phone: u.phone
    }))
  };
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json;charset=utf-8" });
  const linkUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = linkUrl;
  a.download = `kta-db-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(linkUrl);
  logSecurityEvent("Exported JSON database snapshot");
  showDbFeedback("JSON snapshot downloaded with current flights, bookings, and user profiles.", true);
}

async function pushLocalSnapshotToDB() {
  if (!KTA_DB.isRemoteActive()) {
    showDbFeedback("Select a remote mode (REST API / Supabase / Firebase) and enter a Base URL first.", false);
    return;
  }
  try {
    await KTA_DB.pushCollection("flights", state.flights);
    await KTA_DB.pushCollection("bookings", state.bookings);
    showDbFeedback("Local flights and bookings pushed to configured database endpoint.", true);
    logSecurityEvent("Synced local flights & bookings to remote DB");
  } catch (err) {
    showDbFeedback(`Sync attempt failed: ${err.message}. Local data remains intact.`, false);
    logSecurityEvent(`DB sync failed: ${err.message}`);
  }
}

// Extend switchAdminTab & handleLoginSubmit to support Database tab
const _baseSwitchAdminTab = switchAdminTab;
switchAdminTab = function(tab) {
  const allTabs = ["excel", "tranzilla", "users", "bookings", "database"];
  allTabs.forEach(p => {
    const cap = p.charAt(0).toUpperCase() + p.slice(1);
    const pane = document.getElementById("adminPane" + cap);
    const btn = document.getElementById("adminTab" + cap);
    if (pane) pane.classList.toggle("hidden", p !== tab);
    if (btn) {
      btn.className = p === tab
        ? "px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 transition"
        : "px-3.5 py-2 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition";
    }
  });
  if (tab === "users") renderAdminUsers();
  if (tab === "bookings") renderAdminBookings();
  if (tab === "database") populateDatabaseForm();
};

const _baseHandleLoginSubmit = handleLoginSubmit;
handleLoginSubmit = function(e) {
  _baseHandleLoginSubmit(e);
  if (state.currentUser && state.currentUser.role === "admin") {
    populateDatabaseForm();
  }
};
