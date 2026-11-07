import { addNote, connect, getMemory, getSettings, removeMemory, saveLink, search } from "./api.js";

const $ = (id) => document.getElementById(id);
let memoryId = null;

function show(id, on = true) {
  $(id).hidden = !on;
}

function setStatus(text, isError = false) {
  $("status").textContent = text;
  $("status").className = `small ${isError ? "error" : ""}`;
}

/** Shows the title, summary and picture Brainly fills in while it reads the page. */
async function follow(id, tries = 0) {
  const memory = await getMemory(id).catch(() => null);
  if (!memory || memoryId !== id) return;
  $("title").textContent = memory.title;
  const thumb = memory.metadata?.thumbnail_url;
  if (thumb) {
    $("thumb").style.backgroundImage = `url("${thumb}")`;
    $("thumb").textContent = "";
  }
  if (memory.summary) $("summary").textContent = memory.summary;
  if (memory.status === "ready") $("state").textContent = "Saved to your brain ✓";
  else if (memory.status === "failed") $("state").textContent = "Saved ✓ (Brainly will read it again later)";
  else if (tries < 20) setTimeout(() => follow(id, tries + 1), 1500);
}

async function save(tab, allowDuplicate = false) {
  $("state").textContent = "Saving this page…";
  $("title").textContent = tab.title || tab.url;
  setStatus("");
  try {
    const saved = await saveLink({ url: tab.url, title: tab.title, allowDuplicate });
    memoryId = saved.id;
    $("state").textContent = "Saved ✓ Brainly is adding a title and summary…";
    $("title").textContent = saved.title;
    show("noteBox");
    follow(saved.id);
  } catch (err) {
    if (err.status === 401) return showConnect();
    if (err.status === 409) {
      $("state").textContent = "Already in your brain";
      setStatus(`${err.message}. `);
      const again = Object.assign(document.createElement("a"), { href: "#", textContent: "Save it again" });
      again.onclick = (e) => { e.preventDefault(); save(tab, true); };
      $("status").append(again);
    } else {
      $("state").textContent = "Couldn't save this page";
      setStatus(err.message, true);
    }
  }
}

function showConnect() {
  show("connect");
  show("save", false);
  show("find", false);
}

async function runSearch(e) {
  e.preventDefault();
  const q = $("q").value.trim();
  if (!q) return;
  $("results").innerHTML = "<li>Searching…</li>";
  try {
    const { results } = await search(q);
    $("results").replaceChildren(...(results.length ? results.map((r) => {
      const li = document.createElement("li");
      const link = document.createElement(r.source_url ? "a" : "span");
      link.textContent = r.title;
      if (r.source_url) { link.href = r.source_url; link.target = "_blank"; }
      const meta = document.createElement("small");
      meta.textContent = `${r.type} · ${r.snippet.slice(0, 90)}`;
      li.append(link, meta);
      return li;
    }) : [Object.assign(document.createElement("li"), { textContent: "Nothing found." })]));
  } catch (err) {
    $("results").replaceChildren(Object.assign(document.createElement("li"), { textContent: err.message }));
  }
}

(async () => {
  $("options").onclick = (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); };
  $("connectBtn").onclick = () => connect().then(() => window.close());
  $("searchForm").onsubmit = runSearch;
  $("note").oninput = () => show("noteBtn", Boolean($("note").value.trim()));
  $("noteBtn").onclick = async () => {
    if (!memoryId) return;
    $("noteBtn").disabled = true;
    try {
      await addNote(memoryId, $("note").value.trim());
      $("noteBtn").textContent = "Note saved ✓";
    } catch (err) {
      setStatus(err.message, true);
      $("noteBtn").disabled = false;
    }
  };
  $("undo").onclick = async (e) => {
    e.preventDefault();
    if (!memoryId) return;
    await removeMemory(memoryId).catch(() => undefined);
    memoryId = null;
    $("state").textContent = "Removed";
    $("title").textContent = "";
    $("summary").textContent = "";
    show("noteBox", false);
  };

  const { token } = await getSettings();
  if (!token) return showConnect();
  show("find");

  // One click: opening the popup saves the page you're on
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !/^https?:/i.test(tab.url)) {
    show("save");
    $("state").textContent = "This page can't be saved";
    $("title").textContent = "Open a website, video or post and click Brainly again.";
    return;
  }
  show("save");
  save(tab);
})();
