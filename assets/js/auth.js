// Supabase-backed authentication for K.T.A International.
// Authorization is read from the protected profiles table, never from browser metadata.
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

function showAuthError(message) {
  const errEl = document.getElementById("authErrorMsg");
  if (!errEl) return;
  errEl.textContent = message;
  errEl.classList.remove("hidden");
}

async function loadSupabaseProfile(user) {
  if (!window.ktaSupabase || !user) return null;
  const { data, error } = await window.ktaSupabase
    .from("profiles")
    .select("id, first_name, last_name, phone, role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Unable to load account profile:", error.message);
    throw new Error("Your account is signed in, but its profile could not be loaded. Please contact support.");
  }

  return {
    id: user.id,
    email: user.email || "",
    firstName: data.first_name || "",
    lastName: data.last_name || "",
    phone: data.phone || "",
    role: data.role || "customer"
  };
}

async function applySupabaseSession(user) {
  if (!user) {
    state.currentUser = null;
    document.getElementById("adminSection")?.classList.add("hidden");
    renderAuthHeader();
    return;
  }

  const profile = await loadSupabaseProfile(user);
  state.currentUser = profile;
  renderAuthHeader();
  if (typeof updateAdminStats === "function") updateAdminStats();

  if (profile.role === "admin" || profile.role === "agent") {
    const adminSection = document.getElementById("adminSection");
    if (adminSection) adminSection.classList.remove("hidden");
    if (profile.role === "admin") {
      if (document.getElementById("tzTerminalInput")) document.getElementById("tzTerminalInput").value = state.tranzilla.terminal;
      if (document.getElementById("tzModeInput")) document.getElementById("tzModeInput").value = state.tranzilla.mode;
      if (document.getElementById("tzEndpointInput")) document.getElementById("tzEndpointInput").value = state.tranzilla.endpoint;
      if (typeof renderAdminUsers === "function") renderAdminUsers();
      if (typeof renderAdminBookings === "function") renderAdminBookings();
    }
  } else {
    document.getElementById("adminSection")?.classList.add("hidden");
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const client = window.ktaSupabase;
  if (!client) return showAuthError("Secure sign-in is unavailable. Please try again later.");

  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const button = e.submitter;
  if (button) button.disabled = true;
  document.getElementById("authErrorMsg").classList.add("hidden");

  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await applySupabaseSession(data.user);
    document.getElementById("loginPassword").value = "";
    closeAuthModal();
  } catch (error) {
    showAuthError(error.message || "Unable to sign in. Check your details and try again.");
  } finally {
    if (button) button.disabled = false;
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const client = window.ktaSupabase;
  if (!client) return showAuthError("Secure registration is unavailable. Please try again later.");

  const firstName = document.getElementById("regFirst").value.trim();
  const lastName = document.getElementById("regLast").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const phone = document.getElementById("regPhone").value.trim();
  const password = document.getElementById("regPassword").value;
  const button = e.submitter;
  if (button) button.disabled = true;

  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName, phone } }
    });
    if (error) throw error;

    document.getElementById("regPassword").value = "";
    if (data.session && data.user) {
      await applySupabaseSession(data.user);
      closeAuthModal();
    } else {
      toggleSignupView(false);
      showAuthError("Registration received. Please verify your email, then sign in.");
    }
  } catch (error) {
    showAuthError(error.message || "Unable to create your account. Please try again.");
  } finally {
    if (button) button.disabled = false;
  }
}

async function logoutUser() {
  if (!window.ktaSupabase) return;
  const { error } = await window.ktaSupabase.auth.signOut();
  if (error) {
    console.error("Sign-out failed:", error.message);
    return;
  }
  await applySupabaseSession(null);
}

function renderAuthHeader() {
  const area = document.getElementById("authArea");
  if (!area) return;

  if (!state.currentUser) {
    area.innerHTML = `
      <button onclick="openAuthModal('login')" class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition">Login</button>
      <button onclick="openAuthModal('agent')" class="hidden sm:inline-block px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition">Agent Login</button>
    `;
    return;
  }

  const isAdmin = state.currentUser.role === "admin";
  const isStaff = isAdmin || state.currentUser.role === "agent";
  area.innerHTML = `
    <div class="flex items-center gap-2">
      ${isAdmin ? `<span class="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase">ADMIN</span>` : ""}
      ${!isAdmin && isStaff ? `<span class="px-2 py-0.5 rounded bg-sky-300 text-slate-950 text-[10px] font-extrabold uppercase">AGENT</span>` : ""}
      <span class="text-xs font-semibold text-sky-200 hidden sm:inline">${escapeHTML(state.currentUser.firstName)}</span>
      ${isStaff ? `<button onclick="document.getElementById('adminSection').classList.toggle('hidden')" class="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition">Admin Panel</button>` : ""}
      <button onclick="logoutUser()" class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold">Logout</button>
    </div>
  `;
}

async function initializeSupabaseAuth() {
  if (!window.ktaSupabase) {
    console.error("Supabase client is not configured; legacy password login remains disabled.");
    renderAuthHeader();
    return;
  }

  const { data: { session }, error } = await window.ktaSupabase.auth.getSession();
  if (error) console.error("Could not restore Supabase session:", error.message);
  try {
    await applySupabaseSession(session?.user || null);
  } catch (profileError) {
    showAuthError(profileError.message);
  }

  window.ktaSupabase.auth.onAuthStateChange((_event, nextSession) => {
    // Defer profile lookup to avoid running Supabase queries inside the auth callback.
    Promise.resolve().then(async () => {
      try {
        await applySupabaseSession(nextSession?.user || null);
      } catch (profileError) {
        console.error(profileError);
        state.currentUser = null;
        renderAuthHeader();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", initializeSupabaseAuth);
