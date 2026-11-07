import { connect, getSettings, saveLink, saveNote } from "./api.js";

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  chrome.contextMenus.create({ id: "save-page", title: "Save page to Brainly", contexts: ["page"] });
  chrome.contextMenus.create({ id: "save-link", title: "Save link to Brainly", contexts: ["link"] });
  chrome.contextMenus.create({ id: "save-selection", title: "Save selection to Brainly", contexts: ["selection"] });
  // First install: sign in straight away
  if (reason === "install" && !(await getSettings()).token) connect();
});

function notify(message) {
  chrome.notifications.create({ type: "basic", iconUrl: "icon.png", title: "Brainly AI", message });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === "save-page") {
      await saveLink({ url: tab.url, title: tab.title });
    } else if (info.menuItemId === "save-link") {
      // The link's own page gets read for its title
      await saveLink({ url: info.linkUrl });
    } else if (info.menuItemId === "save-selection") {
      await saveNote({
        note: info.selectionText.trim(),
        context: tab?.url ? `Selected on ${tab.title} (${tab.url})` : undefined,
      });
    }
    notify("Saved to your brain ✓ Brainly is adding the title and summary.");
  } catch (err) {
    if (err.status === 401) {
      notify("Connect the extension to your Brainly account first.");
      connect();
    } else {
      notify(err.status === 409 ? "Already in your brain." : err.message);
    }
  }
});
