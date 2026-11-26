// App state + localStorage persistence + audit log

let state = {
  currency: "USD",
  currentUser: null,
  users: loadUsers(),
  flights: loadFlights(),
  bookings: loadBookings(),
  tranzilla: loadTranzillaConfig(),
  auditLogs: ["System booted with Tranzilla PCI-DSS & XSS sanitizer active."],
  failedLoginAttempts: 0,
  lockoutUntil: 0,
  pax: { adults: 1, kids: 0, infants: 0 },
  selectedFlight: null,
  selectedVistaMare: null, // { unitId, nights, transfer }
  passengers: [],
  contact: { email: "", phone: "" },
  discountRate: 0
};

function logSecurityEvent(msg) {
  const ts = new Date().toLocaleTimeString();
  state.auditLogs.unshift(`[${ts}] ${msg}`);
  if (state.auditLogs.length > 25) state.auditLogs.pop();
  const box = document.getElementById("securityAuditList");
  if (box) {
    box.innerHTML = state.auditLogs.map(l => `<div>${escapeHTML(l)}</div>`).join("");
  }
}

function loadTranzillaConfig() {
  return JSON.parse(localStorage.getItem("kta_tranzilla") || "null") || {
    terminal: "ktairterm",
    mode: "HOSTED_IFRAME",
    endpoint: ""
  };
}

function saveTranzillaConfig(e) {
  e.preventDefault();
  state.tranzilla = {
    terminal: document.getElementById("tzTerminalInput").value.trim() || "ktairterm",
    mode: document.getElementById("tzModeInput").value,
    endpoint: document.getElementById("tzEndpointInput").value.trim()
  };
  localStorage.setItem("kta_tranzilla", JSON.stringify(state.tranzilla));
  document.getElementById("adminTranzillaStatus").textContent = state.tranzilla.terminal;
  document.getElementById("checkoutTzTerminal").textContent = state.tranzilla.terminal;
  logSecurityEvent(`Tranzilla config updated (Terminal: ${state.tranzilla.terminal})`);
  alert("Tranzilla gateway settings saved.");
}

function loadUsers() {
  const saved = JSON.parse(localStorage.getItem("kta_users") || "null");
  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    localStorage.setItem("kta_users", JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
  return saved;
}

function saveUsers() {
  localStorage.setItem("kta_users", JSON.stringify(state.users));
}

function loadFlights() {
  const saved = JSON.parse(localStorage.getItem("kta_flights") || "null");
  if (!saved || !Array.isArray(saved) || saved.length === 0) {
    localStorage.setItem("kta_flights", JSON.stringify(DEFAULT_FLIGHTS));
    return [...DEFAULT_FLIGHTS];
  }
  return saved;
}

function saveFlights() {
  localStorage.setItem("kta_flights", JSON.stringify(state.flights));
}

function loadBookings() {
  return JSON.parse(localStorage.getItem("kta_bookings") || "[]");
}

function saveBookings() {
  localStorage.setItem("kta_bookings", JSON.stringify(state.bookings));
}
