import { test, expect, Page } from "@playwright/test";

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "leptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
];

const runId = new Date().toISOString().replace(/[:.]/g, "-");

async function login(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email or mobile").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

async function openMenuIfNeeded(page: Page, width: number) {
  if (width <= 900) {
    const menu = page.locator(".mobile-menu");
    if (await menu.isVisible()) await menu.click();
  }
}

async function closeMobileOverlay(page: Page) {
  const scrim = page.locator(".scrim");
  if (await scrim.isVisible()) await scrim.click();
}

async function gotoPage(page: Page, name: string, width: number) {
  await openMenuIfNeeded(page, width);
  await page.getByRole("button", { name }).first().click();
  await closeMobileOverlay(page);
}

async function signOut(page: Page, width: number) {
  await openMenuIfNeeded(page, width);
  await page.getByRole("button", { name: "Sign out" }).click();
}

test("visual QA: roles page, permission matrix, and branch-staff view", async ({ page }) => {
  test.setTimeout(240000);
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height });

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const brokenAssets: string[] = [];
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
    page.on("pageerror", (e) => pageErrors.push(e.message));
    page.on("response", (res) => {
      const t = res.request().resourceType();
      if (["image", "stylesheet", "script", "font"].includes(t) && !res.ok()) brokenAssets.push(`${res.status()} ${res.url()}`);
    });

    await login(page, "superadmin@example.com");
    await gotoPage(page, "Roles", bp.width);
    await expect(page.getByRole("row", { name: /Super Admin/ })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `visual-reports/${runId}/${bp.name}-roles.png`, fullPage: true });

    await page.getByRole("button", { name: "New role" }).click();
    await expect(page.getByRole("heading", { name: "New role" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `visual-reports/${runId}/${bp.name}-roles-modal.png`, fullPage: true });
    await page.getByRole("button", { name: "Cancel" }).click();

    const overflowAdmin = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowAdmin, `Horizontal overflow on Roles at ${bp.name}`).toBe(false);

    await signOut(page, bp.width);
    await login(page, "ahmedabad.admin@example.com");
    await gotoPage(page, "Customers", bp.width);
    await expect(page.getByRole("cell", { name: "Orion Manufacturing" })).toBeVisible();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `visual-reports/${runId}/${bp.name}-staff-customers.png`, fullPage: true });

    await page.getByRole("button", { name: "New customer" }).click();
    await expect(page.getByRole("heading", { name: "New customer" })).toBeVisible();
    await expect(page.getByLabel("Branch")).toBeDisabled();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `visual-reports/${runId}/${bp.name}-staff-customer-modal.png`, fullPage: true });
    await page.getByRole("button", { name: "Cancel" }).click();

    const overflowStaff = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowStaff, `Horizontal overflow on staff Customers at ${bp.name}`).toBe(false);

    expect(consoleErrors, `Console errors at ${bp.name}`).toHaveLength(0);
    expect(pageErrors, `Uncaught page errors at ${bp.name}`).toHaveLength(0);
    expect(brokenAssets, `Broken assets at ${bp.name}`).toHaveLength(0);

    await openMenuIfNeeded(page, bp.width);
    await signOut(page, bp.width);
  }
});