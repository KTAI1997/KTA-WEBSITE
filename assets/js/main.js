// Mobile navigation controls
function closeMobileMenu() {
  const menu = document.getElementById("mobileNavigation");
  const toggle = document.getElementById("mobileMenuToggle");
  if (menu) menu.classList.add("hidden");
  if (toggle) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    toggle.innerHTML = '<span aria-hidden="true">☰</span>';
  }
}

// Idle logout, drag & drop, iframe height, boot

// Idle Auto-Logout Timer (15 mins)
let idleTimer;
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (state.currentUser) {
      logSecurityEvent(`Auto-logout due to 15m inactivity (${state.currentUser.email})`);
      logoutUser();
    }
  }, 15 * 60 * 1000);
}
["click", "keydown", "mousemove"].forEach(evt => document.addEventListener(evt, resetIdleTimer));

// Drag & Drop support for Excel
const dropZone = document.getElementById("dropZone");
if (dropZone) {
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("border-amber-400");
  });
  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-amber-400");
  });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("border-amber-400");
    if (e.dataTransfer.files.length) {
      const dt = new DataTransfer();
      dt.items.add(e.dataTransfer.files[0]);
      const fileInput = document.getElementById("excelFileInput");
      fileInput.files = dt.files;
      handleExcelFile({ target: fileInput });
    }
  });
}


function notifyParentHeight() {
  try {
    if (window.parent && window.parent !== window) {
      const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      window.parent.postMessage({ type: "KTA_IFRAME_HEIGHT", height: h }, "*");
    }
  } catch (_) {}
}
window.addEventListener("load", () => {
  notifyParentHeight();
  setTimeout(notifyParentHeight, 300);
  setTimeout(notifyParentHeight, 1000);
});
window.addEventListener("resize", notifyParentHeight);
const observer = new MutationObserver(() => notifyParentHeight());
observer.observe(document.body, { childList: true, subtree: true, attributes: true });

// Boot
initDates();
renderDestinations();
renderVistaMareCards();
renderFlightResults();
renderAuthHeader();
updateAdminStats();
resetIdleTimer();
refreshFlights();
