// Shared by the popup, options page and background worker.
// Settings live in chrome.storage.local: { apiUrl, token } — the token comes from
// Brainly → profile menu → "Copy extension token".

export async function getSettings() {
  const { apiUrl = "http://localhost:3001", token = "" } = await chrome.storage.local.get(["apiUrl", "token"]);
  return { apiUrl: apiUrl.replace(/\/+$/, ""), token };
}

export async function apiFetch(path, options = {}) {
  const { apiUrl, token } = await getSettings();
  if (!token) throw new Error("Add your Brainly token in the extension options first.");
  const res = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(body.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.body = body;
    throw error;
  }
  return body;
}

/** Saves a link. The server detects YouTube / Instagram / TikTok / X links from a plain URL. */
export function saveLink({ url, title, context, allowDuplicate = false }) {
  return apiFetch("/api/content", {
    method: "POST",
    body: JSON.stringify({ type: "url", source_url: url, title: title || url, context, allowDuplicate }),
  });
}

export function saveNote({ title, note, context }) {
  return apiFetch("/api/content", {
    method: "POST",
    body: JSON.stringify({ type: "note", title, note, context }),
  });
}

export function search(q) {
  return apiFetch(`/api/search?q=${encodeURIComponent(q)}`);
}
