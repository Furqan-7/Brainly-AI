// Re-captures the link-preview image (app/opengraph-image.jpg + app/twitter-image.jpg) from the
// real landing page, so the card on X / LinkedIn / Slack matches the live site.
//
//   pnpm build && pnpm start            # or point at any running copy of the site
//   node scripts/og-screenshot.mjs [url]   # default http://localhost:3000
//
// Needs Playwright with Chromium: npm i -D playwright && npx playwright install chromium
import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

let chromium;
try {
    // require() also finds a global install (NODE_PATH), which import() does not
    ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
    console.error("Playwright is not installed: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
}

const url = process.argv[2] ?? "http://localhost:3000";
const app = fileURLToPath(new URL("../app/", import.meta.url));

// 1440×756 is the 1.91:1 card ratio; ×5/3 gives a sharp 2400×1260 image
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 756 }, deviceScaleFactor: 5 / 3 });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // let the hero's entrance animations finish
await page.screenshot({ path: `${app}opengraph-image.jpg`, type: "jpeg", quality: 85 });
await browser.close();
await copyFile(`${app}opengraph-image.jpg`, `${app}twitter-image.jpg`);
console.log("Saved app/opengraph-image.jpg and app/twitter-image.jpg");
