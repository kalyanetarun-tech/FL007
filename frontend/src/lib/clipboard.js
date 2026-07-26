/**
 * Robust clipboard copy that works across:
 * - Modern browsers (uses navigator.clipboard.writeText)
 * - PWAs / iframes / older browsers (falls back to document.execCommand)
 * - Insecure / permission-blocked contexts (shows prompt fallback)
 * Returns true on success, false if fallback prompt was shown.
 */
export async function copyToClipboard(text) {
  const value = String(text || "");
  // Try modern async API first
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (_) {
      // fall through to legacy
    }
  }
  // Legacy fallback via hidden textarea + execCommand
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-1000px";
    ta.style.left = "-1000px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return true;
  } catch (_) {
    // Both methods failed — final fallback below
  }
  // Final fallback: show the text so user can copy manually
  try { window.prompt("Copy manually (Ctrl+C):", value); } catch (_) { /* ignore */ }
  return false;
}
