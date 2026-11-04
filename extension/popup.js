import { saveLink, search } from "./api.js";

const $ = (id) => document.getElementById(id);
let tab;

function setStatus(text, isError = false) {
  $("status").textContent = text;
  $("status").className = isError ? "error" : "";
}

async function save(allowDuplicate = false) {
  $("saveBtn").disabled = true;
  setStatus("Saving…");
  try {
    await saveLink({ url: tab.url, title: $("title").value.trim(), context: $("context").value.trim(), allowDuplicate });
    setStatus("Saved to your brain ✓ — it's being indexed now.");
  } catch (err) {
    if (err.status === 409) {
      setStatus(`${err.message}. `, true);
      const again = document.createElement("a");
      again.href = "#";
      again.textContent = "Save anyway";
      again.onclick = (e) => { e.preventDefault(); save(true); };
      $("status").append(again);
    } else {
      setStatus(err.message, true);
    }
  } finally {
    $("saveBtn").disabled = false;
  }
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
  [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $("title").value = tab?.title ?? "";
  $("saveBtn").onclick = () => save();
  $("searchForm").onsubmit = runSearch;
  $("options").onclick = (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); };
})();
