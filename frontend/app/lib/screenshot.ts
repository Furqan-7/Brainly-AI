import type { Browser } from "puppeteer-core";
import { existsSync } from "node:fs";
import { isPublicHost } from "./safeUrl";

/** Viewport the site is rendered at (a typical laptop), and the scale the image is saved at. */
const VIEWPORT = { width: 1280, height: 800 };
const IMAGE_SCALE = 0.625; // → 800×500, sharp on a retina card without being heavy

const LOCAL_CHROME = [
    process.env.CHROME_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
];

let browserPromise: Promise<Browser> | null = null;

/** One headless Chrome per server instance, reused while the instance stays warm. */
async function getBrowser(): Promise<Browser> {
    if (browserPromise) {
        const browser = await browserPromise.catch(() => null);
        if (browser?.connected) return browser;
    }
    browserPromise = (async () => {
        const puppeteer = (await import("puppeteer-core")).default;
        // On Vercel (Linux) use the serverless build of Chromium; elsewhere, an installed Chrome
        if (process.platform === "linux" && !process.env.CHROME_EXECUTABLE_PATH) {
            const chromium = (await import("@sparticuz/chromium")).default;
            // Its serverless defaults also switch off web security, which screenshots don't need
            const args = chromium.args.filter((a) => a !== "--disable-web-security" && a !== "--allow-running-insecure-content");
            return puppeteer.launch({
                executablePath: await chromium.executablePath(),
                args: await puppeteer.defaultArgs({ args, headless: "shell" }),
                headless: "shell",
                defaultViewport: VIEWPORT,
            });
        }
        const executablePath = LOCAL_CHROME.find((p) => p && existsSync(p));
        if (!executablePath) throw new Error("No Chrome found: set CHROME_EXECUTABLE_PATH to take website previews locally");
        return puppeteer.launch({ executablePath, headless: true, defaultViewport: VIEWPORT, args: ["--no-sandbox"] });
    })();
    browserPromise.catch(() => { browserPromise = null; });
    return browserPromise;
}

/** Opens a public URL in headless Chrome and returns a JPEG of the top of the page. */
export async function screenshotSite(url: URL): Promise<Uint8Array> {
    const browser = await getBrowser();
    // Serverless Chromium runs in single-process mode, which can't open extra browser contexts,
    // so each capture gets a new page and the cookies are cleared afterwards instead
    const page = await browser.newPage();
    try {
        await page.setUserAgent({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36",
        });
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            const u = new URL(req.url());
            if (u.protocol === "data:" || u.protocol === "blob:") return void req.continue();
            if ((u.protocol !== "http:" && u.protocol !== "https:") || req.resourceType() === "media") return void req.abort();
            // Every request (redirects, scripts, iframes) must go to a public address
            isPublicHost(u.hostname).then((ok) => (ok ? req.continue() : req.abort("addressunreachable"))).catch(() => undefined);
        });

        // Most sites settle within a few seconds; ones that never go quiet are captured as they are
        await page.goto(url.href, { waitUntil: "networkidle2", timeout: 12_000 }).catch((err: Error) => {
            if (!/timeout/i.test(err.message)) throw err;
        });
        await new Promise((r) => setTimeout(r, 400)); // let entrance animations land

        return await page.screenshot({
            type: "jpeg",
            quality: 72,
            clip: { x: 0, y: 0, ...VIEWPORT, scale: IMAGE_SCALE },
        });
    } finally {
        const cdp = await page.createCDPSession().catch(() => null);
        await cdp?.send("Network.clearBrowserCookies").catch(() => undefined);
        await page.close().catch(() => undefined);
    }
}
