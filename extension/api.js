// Shared by the popup, options page and background worker.
// Settings live in chrome.storage.local: { apiUrl, webUrl, token }. "Connect" in the popup
// opens Brainly's /extension page, which hands the extension its token (see connect.js).

export const DEFAULT_WEB_URL = "https://brainly-ai-frontend.vercel.app";

export async function getSettings() {
  const { webUrl = DEFAULT_WEB_URL, apiUrl, token = "" } = await chrome.storage.local.get(["apiUrl", "webUrl", "token"]);
  const web = webUrl.replace(/\/+$/, "");
  // The web app proxies the API at /backend, so one address works for both
  return { webUrl: web, apiUrl: (apiUrl || `${web}/backend`).replace(/\/+$/, ""), token };
}

/** Opens Brainly's connect page; it signs the extension in automatically. */
export async function connect() {
  const { webUrl } = await getSettings();
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
