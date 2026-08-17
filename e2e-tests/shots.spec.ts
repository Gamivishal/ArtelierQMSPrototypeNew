import { test, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
}

test("capture screenshots", async ({ page }) => {
  await login(page);
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots-dashboard.png", fullPage: true });

  await page.getByRole("button", { name: "Customers" }).first().click();
  await page.getByText("Customers & contacts").waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "shots-customers.png", fullPage: true });

  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByRole("heading", { name: "New customer" }).waitFor();
  await page.screenshot({ path: "shots-customers-create.png", fullPage: true });
  await page.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("button", { name: "Quotations" }).first().click();
  await page.getByText("Customer / Project", { exact: true }).waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "shots-quotations.png", fullPage: true });

  await page.getByRole("button", { name: "New quotation" }).click();
  await page.getByRole("heading", { name: "Build quotation" }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots-wizard-step1.png", fullPage: true });

  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Projects" }).first().click();
  await page.getByText("Expected completion").waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "shots-projects.png", fullPage: true });

  await page.getByRole("button", { name: "New project" }).click();
  await page.getByRole("heading", { name: "Create project" }).waitFor();
  await page.getByLabel("Project name").fill("Shot Project");
  await page.getByLabel("Customer", { exact: true }).selectOption("C-1001");
  await page.getByLabel("Expected completion").fill("2026-12-01");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await page.getByRole("heading", { name: "Surfaces & area", level: 3 }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "shots-project-wizard-step2.png", fullPage: true });
});