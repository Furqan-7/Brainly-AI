import { getSettings } from "./api.js";

const $ = (id) => document.getElementById(id);

(async () => {
  const { apiUrl, token } = await getSettings();
  $("apiUrl").value = apiUrl;
  $("token").value = token;
})();

$("save").onclick = async () => {
  const apiUrl = $("apiUrl").value.trim().replace(/\/+$/, "");
  // Ask for access to just this API's origin
  const origin = `${new URL(apiUrl).origin}/*`;
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    $("status").textContent = "Permission to reach the API was denied.";
    return;
  }
  await chrome.storage.local.set({ apiUrl, token: $("token").value.trim() });
  $("status").textContent = "Saved ✓";
};
