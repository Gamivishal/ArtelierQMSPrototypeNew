import { test, expect, Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

async function go(page: Page, item: string) {
  await page.getByRole("button", { name: item }).first().click();
}

function modal(page: Page) {
  return page.locator(".modal");
}

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("projects: detail view shows surfaces, totals and photos", async ({ page }) => {
  await go(page, "Projects");
  const row = page.getByRole("row", { name: /Corporate Office/ });
  await row.getByTitle("View").click();
  await expect(page.getByRole("heading", { name: "Corporate Office", level: 2 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project details", level: 4 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Surface / area details", level: 4 })).toBeVisible();
  await expect(page.getByText(/Total — 2,350 sq.ft./)).toBeVisible();
  await expect(page.getByText("Liquid Metal", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Photos to capture", level: 4 })).toBeVisible();
  await expect(page.getByText("No photos captured yet.")).toBeVisible();
});

test("branches: create validates GST + duplicate code, then creates (multi-step)", async ({ page }) => {
  await go(page, "Branches");
  await page.getByRole("button", { name: "New branch" }).click();
  await page.getByLabel("Branch code").fill("AHM");
  await page.getByLabel("Branch name").fill("Delhi");
  await page.getByLabel("City").fill("Delhi");
  await page.getByLabel("GST number").fill("07AAECA0000A1Z5");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("A branch with this code already exists.")).toBeVisible();

  await page.getByLabel("Branch code").fill("DEL");
  await page.getByLabel("Branch name").fill("Delhi NCR");
  await page.getByLabel("City").fill("Delhi");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("0 users assigned")).toBeVisible();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Branch created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Delhi NCR", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "New branch" }).click();
  await page.getByLabel("Branch code").fill("NEW");
  await page.getByLabel("Branch name").fill("New City");
  await page.getByLabel("City").fill("Pune");
  await page.getByLabel("GST number").fill("BAD");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("GST number must be 15 characters")).toBeVisible();
});

test("branches: edit and delete", async ({ page }) => {
  await go(page, "Branches");
  const surat = page.getByRole("row", { name: /Surat/ });
  await surat.getByTitle("Edit").click();
  await expect(page.getByRole("heading", { name: "Edit branch" })).toBeVisible();
  await expect(page.getByLabel("Branch name")).toHaveValue("Surat");
  await page.getByLabel("City").fill("Bardoli");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("1 user assigned")).toBeVisible();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Branch updated")).toBeVisible();
  await expect(page.getByText("Bardoli", { exact: true })).toBeVisible();

  await page.getByRole("row", { name: /Mumbai/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Branch deleted")).toBeVisible();
  await expect(page.getByText("Mumbai", { exact: true })).not.toBeVisible();
});

test("inspections: full create, edit, delete cycle", async ({ page }) => {
  await go(page, "Inspections");
  await page.getByRole("button", { name: "New inspection" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Activity is required")).toBeVisible();
  await expect(page.getByText("Customer is required")).toBeVisible();

  await page.getByLabel("Activity").fill("Punching quality check");
  await page.getByLabel("Customer").selectOption("C-1003");
  await page.getByLabel("Date").fill("2026-08-20");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Inspection created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Punching quality check", exact: true })).toBeVisible();

  const row = page.getByRole("row", { name: /Punching quality check/ });
  await row.getByTitle("Edit").click();
  await page.getByLabel("Status", { exact: true }).selectOption("Approved");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Inspection updated")).toBeVisible();

  await page.getByRole("row", { name: /Punching quality check/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Inspection deleted")).toBeVisible();
  await expect(page.getByText("Punching quality check", { exact: true })).not.toBeVisible();
});

test("documents: full create, edit, delete cycle", async ({ page }) => {
  await go(page, "Documents");
  await page.getByRole("button", { name: "Upload document" }).click();
  await page.getByLabel("Title").fill("Test Document");
  await page.getByLabel("Version").fill("1.0");
  await page.getByLabel("Updated").fill("2026-08-20");
  await page.getByLabel("Size").fill("12 KB");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Document created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Test Document", exact: true })).toBeVisible();

  const row = page.getByRole("row", { name: /Test Document/ });
  await row.getByTitle("Edit").click();
  await page.getByLabel("Size").fill("20 KB");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Document updated")).toBeVisible();
  await expect(page.getByText("20 KB", { exact: true })).toBeVisible();

  await page.getByRole("row", { name: /Test Document/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Document deleted")).toBeVisible();
  await expect(page.getByText("Test Document", { exact: true })).not.toBeVisible();
});

test("follow-ups: full create, edit, delete cycle", async ({ page }) => {
  await go(page, "Follow-ups");
  await page.getByRole("button", { name: "Schedule follow-up" }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Date is required")).toBeVisible();
  await expect(page.getByText("Quotation is required")).toBeVisible();
  await expect(page.getByText("Purpose is required")).toBeVisible();

  await page.getByLabel("Date").fill("2026-08-25");
  await page.getByLabel("Quotation").selectOption("QT-AHM-26081");
  await page.getByLabel("Purpose").fill("Confirm approval");
  await page.getByLabel("Owner").selectOption({ index: 0 });
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Follow-up created")).toBeVisible();
  await expect(page.getByText("Confirm approval", { exact: true })).toBeVisible();

  const row = page.getByRole("row", { name: /Confirm approval/ });
  await row.getByTitle("Edit").click();
  await page.getByLabel("Purpose").fill("Confirm approval & share docs");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Follow-up updated")).toBeVisible();

  await page.getByRole("row", { name: /Confirm approval & share docs/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Follow-up deleted")).toBeVisible();
});

test("users: duplicate email rejected, then creates and deletes", async ({ page }) => {
  await go(page, "Users");
  await page.getByRole("button", { name: "Invite user" }).click();
  await page.getByLabel("First name").fill("Sam");
  await page.getByLabel("Last name").fill("Patel");
  await page.getByLabel("Email").fill("ahmedabad.admin@example.com");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("A user with this email already exists.")).toBeVisible();

  await page.getByLabel("Email").fill("sam.patel@example.com");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("User created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Sam Patel", exact: true })).toBeVisible();

  await page.getByRole("row", { name: /Sam Patel/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("User deleted")).toBeVisible();
  await expect(page.getByText("Sam Patel", { exact: true })).not.toBeVisible();
});

test("roles: create role with permission matrix; role with users cannot be deleted", async ({ page }) => {
  await go(page, "Roles");
  await page.getByRole("button", { name: "New role" }).click();
  await page.getByLabel("Role name").fill("Accounts");
  await page.getByLabel("Documents create").check();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Role created")).toBeVisible();
  await expect(page.getByRole("row", { name: /Accounts/ })).toBeVisible();

  await page.getByRole("row", { name: /Branch Admin/ }).getByTitle("Delete").click();
  await expect(page.getByRole("heading", { name: "Delete role" })).toBeVisible();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Cannot delete — users are assigned to this role.")).toBeVisible();

  await page.getByRole("row", { name: /Accounts/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Role deleted")).toBeVisible();
  await expect(page.getByRole("row", { name: /Accounts/ })).not.toBeVisible();
});

test("roles: edit prefills matrix and saves permission changes", async ({ page }) => {
  await go(page, "Roles");
  await page.getByRole("row", { name: /Branch Staff/ }).getByTitle("Edit").click();
  await expect(page.getByRole("heading", { name: "Edit role" })).toBeVisible();
  await expect(page.getByLabel("Role name")).toHaveValue("Branch Staff");

  await page.getByLabel("Products create").check();
  await page.getByLabel("Customers create").uncheck();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Role updated")).toBeVisible();
  await expect(page.getByRole("row", { name: /Branch Staff/ })).toBeVisible();
});

test("quotations: edit prefills existing data and saves a revision", async ({ page }) => {
  await go(page, "Quotations");
  const row = page.getByRole("row", { name: /QT-AHM-26081/ });
  await row.getByTitle("Edit").click();
  await expect(page.getByRole("heading", { name: "Edit quotation" })).toBeVisible();
  await expect(page.getByLabel("Customer", { exact: true })).toHaveValue("C-1001");
  await expect(page.getByLabel("Project", { exact: true })).toHaveValue("PRJ-101");

  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Finalise quotation")).toBeVisible();
  await expect(page.locator(".quotation-paper strong").first()).toHaveText("QT-AHM-26081");

  await page.getByLabel("Status", { exact: true }).selectOption("Under Negotiation");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Quotation updated")).toBeVisible();
  await expect(page.getByText("QT-AHM-26081", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /QT-AHM-26081/ }).locator("select.status-select")).toHaveValue("Under Negotiation");
});

test("products: edit prefills and delete confirms", async ({ page }) => {
  await go(page, "Products");
  const row = page.getByRole("row", { name: /Micro Cement/ });
  await row.getByTitle("Edit").click();
  await expect(page.getByRole("heading", { name: "Edit product" })).toBeVisible();
  await expect(page.getByLabel("Product name")).toHaveValue("Micro Cement");
  await page.getByLabel("Rate / sq.ft. (₹)").fill("195");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Product updated")).toBeVisible();
  await expect(page.getByRole("row", { name: /Micro Cement/ }).getByText("₹195", { exact: true })).toBeVisible();

  await page.getByRole("row", { name: /Protective Coating/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Product deleted")).toBeVisible();
  await expect(page.getByText("Protective Coating", { exact: true })).not.toBeVisible();
});

test("projects: full create, edit, delete cycle", async ({ page }) => {
  await go(page, "Projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name").fill("Retail Store");
  await page.getByLabel("Customer").selectOption("C-1002");
  await page.getByLabel("Expected completion").fill("2026-12-01");
  await page.getByRole("button", { name: "Save & continue" }).click();

  await expect(page.getByRole("heading", { name: "Surfaces & area", level: 3 })).toBeVisible();
  await page.getByLabel("Area (sq.ft.)", { exact: true }).fill("800");
  await page.setInputFiles('input[type="file"]', {
    name: "site-1.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"),
  });
  await expect(page.locator(".photo-card img")).toHaveCount(1);
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByText("Project created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Retail Store", exact: true })).toBeVisible();

  const row = page.getByRole("row", { name: /Retail Store/ });
  await row.getByTitle("Edit").click();
  await expect(page.getByRole("heading", { name: "Edit project" })).toBeVisible();
  await expect(page.getByLabel("Project name")).toHaveValue("Retail Store");
  await page.getByLabel("Stage").selectOption("Execution");
  await page.getByRole("button", { name: "Save & continue" }).click();
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Project updated")).toBeVisible();

  await page.getByRole("row", { name: /Retail Store/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Project deleted")).toBeVisible();
  await expect(page.getByText("Retail Store", { exact: true })).not.toBeVisible();
});