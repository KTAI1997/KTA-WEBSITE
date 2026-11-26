// Login, signup, logout, header

// Auth & Admin Functions with Brute-Force Protection
function openAuthModal(mode) {
  document.getElementById("authModal").classList.remove("hidden");
  toggleSignupView(false);
  document.getElementById("authModalTitle").textContent = mode === "agent" ? "Agent / Admin Login" : "Login";
  document.getElementById("authErrorMsg").classList.add("hidden");
}

function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
}

function toggleSignupView(showSignup) {
  document.getElementById("loginView").classList.toggle("hidden", showSignup);
  document.getElementById("signupView").classList.toggle("hidden", !showSignup);
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById("authErrorMsg");
  if (Date.now() < state.lockoutUntil) {
    const secs = Math.ceil((state.lockoutUntil - Date.now()) / 1000);
    errEl.textContent = `Too many failed attempts. Try again in ${secs} seconds.`;
    errEl.classList.remove("hidden");
    return;
  }

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pass = document.getElementById("loginPassword").value;

  const user = state.users.find(u => u.email.toLowerCase() === email && u.password === pass);
  if (!user) {
    state.failedLoginAttempts += 1;
    logSecurityEvent(`Failed login attempt (${state.failedLoginAttempts}/5) for ${email}`);
    if (state.failedLoginAttempts >= 5) {
      state.lockoutUntil = Date.now() + 60000;
      state.failedLoginAttempts = 0;
      errEl.textContent = "Account locked for 60 seconds due to multiple failed attempts.";
    } else {
      errEl.textContent = `Invalid email or password (${state.failedLoginAttempts}/5 attempts).`;
    }
    errEl.classList.remove("hidden");
    return;
  }

  state.failedLoginAttempts = 0;
  state.currentUser = user;
  logSecurityEvent(`User ${user.email} logged in (role: ${user.role})`);
  closeAuthModal();
  renderAuthHeader();
  updateAdminStats();
  if (user.role === "admin") {
    document.getElementById("adminSection").classList.remove("hidden");
    document.getElementById("tzTerminalInput").value = state.tranzilla.terminal;
    document.getElementById("tzModeInput").value = state.tranzilla.mode;
    document.getElementById("tzEndpointInput").value = state.tranzilla.endpoint;
    renderAdminUsers();
    renderAdminBookings();
  }
}

function handleSignupSubmit(e) {
  e.preventDefault();
  const newUser = {
    firstName: document.getElementById("regFirst").value.trim(),
    lastName: document.getElementById("regLast").value.trim(),
    email: document.getElementById("regEmail").value.trim(),
    phone: document.getElementById("regPhone").value.trim(),
    password: document.getElementById("regPassword").value,
    role: "customer"
  };
  if (state.users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
    alert("This email is already registered.");
    return;
  }
  state.users.push(newUser);
  saveUsers();
  state.currentUser = newUser;
  logSecurityEvent(`New customer registered: ${newUser.email}`);
  closeAuthModal();
  renderAuthHeader();
  updateAdminStats();
}

function logoutUser() {
  if (state.currentUser) {
    logSecurityEvent(`User ${state.currentUser.email} logged out`);
  }
  state.currentUser = null;
  document.getElementById("adminSection").classList.add("hidden");
  renderAuthHeader();
}

function renderAuthHeader() {
  const area = document.getElementById("authArea");
  if (!state.currentUser) {
    area.innerHTML = `
      <button onclick="openAuthModal('login')" class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition">Login</button>
      <button onclick="openAuthModal('agent')" class="hidden sm:inline-block px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition">Agent Login</button>
    `;
    return;
  }

  const isAdmin = state.currentUser.role === "admin";
  area.innerHTML = `
    <div class="flex items-center gap-2">
      ${isAdmin ? `<span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">ADMIN</span>` : ""}
      <span class="text-xs font-semibold text-sky-200 hidden sm:inline">${escapeHTML(state.currentUser.firstName)}</span>
      ${isAdmin ? `<button onclick="document.getElementById('adminSection').classList.toggle('hidden')" class="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition">Admin Panel</button>` : ""}
      <button onclick="logoutUser()" class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold">Logout</button>
    </div>
  `;
}
