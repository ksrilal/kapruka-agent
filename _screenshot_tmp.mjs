import { chromium } from "@playwright/test";
const SCRATCH = "C:/Users/Dell/AppData/Local/Temp/claude/c--Users-Dell-Documents-saas-kapruka-agent/290c5960-44e4-441f-bbed-e747df3eabf0/scratchpad";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForSelector("text=Shop by category", { timeout: 15000 }).catch(() => {});
await page.screenshot({ path: `${SCRATCH}/ct_before.png` });

await page.click('button[aria-label="Browse all categories"]');
await page.waitForTimeout(400);
await page.screenshot({ path: `${SCRATCH}/ct_open.png` });

await page.fill('input[placeholder="Search categories…"]', "gift");
await page.waitForTimeout(300);
await page.screenshot({ path: `${SCRATCH}/ct_filtered.png` });

console.log("console errors:", errors);
await browser.close();
