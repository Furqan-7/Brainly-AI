import { saveLink, saveNote } from "./api.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "save-page", title: "Save page to Brainly", contexts: ["page"] });
  chrome.contextMenus.create({ id: "save-link", title: "Save link to Brainly", contexts: ["link"] });
  chrome.contextMenus.create({ id: "save-selection", title: "Save selection to Brainly as a note", contexts: ["selection"] });
});

function notify(message) {
  chrome.notifications.create({ type: "basic", iconUrl: "icon.png", title: "Brainly AI", message });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === "save-page") {
      await saveLink({ url: tab.url, title: tab.title });
    } else if (info.menuItemId === "save-link") {
      await saveLink({ url: info.linkUrl, title: info.linkUrl });
    } else if (info.menuItemId === "save-selection") {
      const text = info.selectionText.trim();
      await saveNote({
        title: text.slice(0, 60) + (text.length > 60 ? "…" : ""),
        note: text,
        context: tab?.url ? `Selected on ${tab.title} (${tab.url})` : undefined,
      });
    }
    notify("Saved to your brain ✓");
  } catch (err) {
    notify(err.status === 409 ? "Already in your brain." : err.message);
  }
});
