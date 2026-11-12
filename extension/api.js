// Shared by the popup, options page and background worker.
// Settings live in chrome.storage.local: { apiUrl, webUrl, token }. "Connect" in the popup
// opens Brainly's /extension page, which hands the extension its token (see connect.js).

export const DEFAULT_WEB_URL = "https://brainlyai.me";

export async function getSettings() {
  const { webUrl = DEFAULT_WEB_URL, apiUrl, token = "" } = await chrome.storage.local.get(["apiUrl", "webUrl", "token"]);
  const web = webUrl.replace(/\/+$/, "");
  // The web app proxies the API at /backend, so one address works for both
  return { webUrl: web, apiUrl: (apiUrl || `${web}/backend`).replace(/\/+$/, ""), token };
}

/**
 * Some browsers (Firefox, Safari) don't grant site access at install, and without it the
 * connect script can't run on Brainly and requests are blocked. Asking must happen straight
 * from a click, so pass the web address you already loaded (no await before this call).
 */
export function ensureAccess(webUrl) {
  // Already-granted access resolves straight away, without a prompt
  return chrome.permissions.request({ origins: [`${webUrl}/*`] }).catch(() => false);
}

/** Opens Brainly's connect page; it signs the extension in automatically. */
export async function connect(webUrl) {
  if (webUrl) await ensureAccess(webUrl);
  else ({ webUrl } = await getSettings());
  await chrome.tabs.create({ url: `${webUrl}/extension` });
}

export async function apiFetch(path, options = {}) {
  const { apiUrl, token } = await getSettings();
  if (!token) {
    const error = new Error("Connect the extension to your Brainly account first.");
    error.status = 401;
    throw error;
  }
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    // Sign in with the extension's own token only: a stale or different account's cookie for
    // the site must not be sent along with it
    credentials: "omit",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(res.status === 401 ? "Your Brainly sign-in expired. Connect again." : body.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.body = body;
    throw error;
  }
  return body;
}

/**
 * Signs this extension out: the server forgets its token (so it stops working even if copied),
 * then it is removed here. Works offline too; the token is cleared either way.
 */
export async function disconnect() {
  try {
    await apiFetch("/api/devices/current", { method: "DELETE" });
  } catch {
    /* already signed out, or offline */
  }
  await chrome.storage.local.remove("token");
}

/**
 * Saves a link. No title needed: the server detects YouTube / Instagram / TikTok / X links and
 * names the memory from the page itself. A real page title (not just the URL) is sent if known.
 */
export function saveLink({ url, title, context, allowDuplicate = false }) {
  const realTitle = title && title.trim() && title.trim() !== url ? title.trim() : undefined;
  return apiFetch("/api/content", {
    method: "POST",
    body: JSON.stringify({ type: "url", source_url: url, title: realTitle, context: context || undefined, allowDuplicate }),
  });
}

/** Saves text as a note; Brainly writes its title. */
export function saveNote({ note, context }) {
  return apiFetch("/api/content", { method: "POST", body: JSON.stringify({ type: "note", note, context }) });
}

export function getMemory(id) {
  return apiFetch(`/api/content/status?ids=${id}`).then((r) => r.memories?.[0] ?? null);
}

export function addNote(id, context) {
  return apiFetch(`/api/content/${id}`, { method: "PATCH", body: JSON.stringify({ context }) });
}

export function removeMemory(id) {
  return apiFetch(`/api/content/${id}`, { method: "DELETE" });
}

export function search(q) {
  return apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
}
