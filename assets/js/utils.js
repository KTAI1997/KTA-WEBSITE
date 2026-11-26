// Security helpers: HTML escaping, crypto-random codes

// Security Utility: HTML Sanitizer to prevent XSS from inputs or Excel files
function escapeHTML(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Security Utility: Cryptographically strong PNR & Transaction ID generator
function secureRandomCode(prefix, length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  let out = prefix;
  for (let i = 0; i < length; i++) {
    out += alphabet[array[i] % alphabet.length];
  }
  return out;
}
