// Runs on every Brainly page: after signing in, the site moves to /extension without reloading,
// so a script injected only on /extension would never load. It only acts on the /extension
// page: when the signed-in page sends a token, store it with this site's API address, so the
// extension works without copying anything.
(() => {
  const announce = () => window.postMessage({ source: "brainly-extension", type: "ready" }, location.origin);

  window.addEventListener("message", async (event) => {
    if (event.source !== window || event.origin !== location.origin) return;
    const data = event.data;
    if (!data || data.source !== "brainly-web" || !location.pathname.startsWith("/extension")) return;

    if (data.type === "hello") announce();
    if (data.type === "connect" && typeof data.token === "string" && data.token.length > 20) {
      // The API address comes from the page's own origin, never from the message
      await chrome.storage.local.set({ token: data.token, apiUrl: `${location.origin}/backend`, webUrl: location.origin });
      window.postMessage({ source: "brainly-extension", type: "connected" }, location.origin);
    }
  });

  if (location.pathname.startsWith("/extension")) announce();
})();
