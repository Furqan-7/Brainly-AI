// Runs only on Brainly's /extension page. When the signed-in page sends a token, store it,
// together with this site's API address, so the extension works without copying anything.
(() => {
  const announce = () => window.postMessage({ source: "brainly-extension", type: "ready" }, location.origin);

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== "brainly-web") return;

    if (data.type === "hello") announce();
    if (data.type === "connect" && typeof data.token === "string" && data.token.length > 20) {
      // The API address comes from the page's own origin, never from the message
      await chrome.storage.local.set({ token: data.token, apiUrl: `${location.origin}/backend`, webUrl: location.origin });
      window.postMessage({ source: "brainly-extension", type: "connected" }, location.origin);
    }
  });

  announce();
})();
