import { connect, getSettings } from "./api.js";

const $ = (id) => document.getElementById(id);

(async () => {
  const { webUrl, token } = await getSettings();
  $("webUrl").value = webUrl;
  $("token").value = token;
  $("who").textContent = token ? `Connected to ${webUrl}` : "Not connected yet.";
})();

$("connect").onclick = () => connect();

$("save").onclick = async () => {
  let webUrl;
  try {
    webUrl = new URL($("webUrl").value.trim()).origin;
  } catch {
    $("status").textContent = "Enter a web address like https://brainly.example.com";
    return;
  }
  // Ask for access to just this site (the API is proxied at /backend on it)
  const granted = await chrome.permissions.request({ origins: [`${webUrl}/*`] });
  if (!granted) {
    $("status").textContent = "Permission to reach that site was denied.";
    return;
  }
  await chrome.storage.local.set({ webUrl, apiUrl: `${webUrl}/backend`, token: $("token").value.trim() });
  $("status").textContent = "Saved ✓";
  $("who").textContent = `Connected to ${webUrl}`;
};
