import { test, expect, Page } from "@playwright/test";

async function login(page: Page, email = "superadmin@example.com") {
  await page.goto("/");
  await page.getByLabel("Email or mobile").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}

async function go(page: Page, item: string) {
  await page.getByRole("button", { name: item }).first().click();
}

function modal(page: Page) {
  return page.locator(".modal");
}

test("refresh keeps the session (does not redirect to login)", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.locator(".avatar")).toHaveText("SA");

  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Email or mobile").fill("ahmedabad.admin@example.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.locator(".avatar")).toHaveText("BA");
});

test("login: no role buttons, unknown email rejected, role auto-detected from email", async ({ page }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.goto("/");
  await expect(page.getByText("Prototype role")).not.toBeVisible();
  await expect(page.getByText("Demo accounts")).toBeVisible();

  await page.getByLabel("Email or mobile").fill("nobody@example.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("No account found for this email")).toBeVisible();

  await page.getByRole("button", { name: "Branch Admin (Ahmedabad) — ahmedabad.admin@example.com" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.locator(".avatar")).toHaveText("BA");
});

test.beforeEach(async ({ page }) => {
  await login(page);
});

test("login → dashboard renders metrics, pipeline and recent quotations", async ({ page }) => {
  await expect(page.getByText("Total quotations")).toBeVisible();
  await expect(page.getByText("Quotation pipeline")).toBeVisible();
  await expect(page.getByText("Recent quotations")).toBeVisible();
  await expect(page.getByText("QT-AHM-26081", { exact: true })).toBeVisible();
});

test("customers: validation error state on empty create", async ({ page }) => {
  await go(page, "Customers");
  await page.getByRole("button", { name: "New customer" }).click();
  await expect(page.getByRole("heading", { name: "New customer" })).toBeVisible();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Contact name is required")).toBeVisible();
  await expect(page.getByText("Company is required")).toBeVisible();
  await expect(page.getByText("Mobile is required")).toBeVisible();
  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("City is required")).toBeVisible();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
});

test("customers: create → success toast + row appears, cancel closes without saving", async ({ page }) => {
  await go(page, "Customers");
  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByLabel("Contact name").fill("Test Client");
  await page.getByLabel("Company").fill("Test Corp");
  await page.getByLabel("Mobile").fill("9012345678");
  await page.getByLabel("Email").fill("test@client.example");
  await page.getByLabel("City").fill("Vadodara");
  await page.getByLabel("Source").selectOption("Architect");
  await page.getByLabel("Branches").selectOption("Surat");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Test Client")).not.toBeVisible();

  await page.getByRole("button", { name: "New customer" }).click();
  await page.getByLabel("Contact name").fill("Test Client");
  await page.getByLabel("Company").fill("Test Corp");
  await page.getByLabel("Mobile").fill("9012345678");
  await page.getByLabel("Email").fill("test@client.example");
  await page.getByLabel("City").fill("Vadodara");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Customer created")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Test Client" })).toBeVisible();
});

test("customers: edit prefills values and saves changes", async ({ page }) => {
  await go(page, "Customers");
  const row = page.getByRole("row", { name: /Rajesh Patel/ });
  await row.getByTitle("Edit").click();
  await expect(page.getByRole("heading", { name: "Edit customer" })).toBeVisible();
  await expect(page.getByLabel("Contact name")).toHaveValue("Rajesh Patel");
  await page.getByLabel("City").fill("Gandhinagar");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Customer updated")).toBeVisible();
  await expect(page.getByText("Gandhinagar")).toBeVisible();
});

test("customers: delete confirmation — cancel keeps row, confirm removes it", async ({ page }) => {
  await go(page, "Customers");
  const row = page.getByRole("row", { name: /Vertex Industries/ });
  await row.getByTitle("Delete").click();
  await expect(page.getByRole("heading", { name: "Delete customer" })).toBeVisible();
  await expect(page.getByText("This action permanently removes this customer.")).toBeVisible();
  await modal(page).getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Vertex Industries" })).toBeVisible();

  await page.getByRole("row", { name: /Vertex Industries/ }).getByTitle("Delete").click();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Customer deleted")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Vertex Industries" })).not.toBeVisible();
});

test("customers: search empty state", async ({ page }) => {
  await go(page, "Customers");
  await page.getByPlaceholder("Search customers & contacts…").fill("zzz-nothing-matches");
  await expect(page.getByText("No matching customers")).toBeVisible();
  await expect(page.getByText("Try adjusting your search or filters.")).toBeVisible();
});

test("projects: create requires a customer; customer link navigates to customers page with focus", async ({ page }) => {
  await go(page, "Projects");
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByRole("button", { name: "Save & continue" }).click();
  await expect(page.getByText("Project name is required")).toBeVisible();
  await expect(page.getByText("Customer is required")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();

  const row = page.getByRole("row", { name: /Corporate Office/ });
  await row.getByText("Orion Manufacturing").click();
  await expect(page.getByRole("heading", { name: "Customers", level: 1 })).toBeVisible();
  await expect(page.getByText("Viewing customer")).toBeVisible();
  await expect(page.getByText("Orion Manufacturing", { exact: true }).first()).toBeVisible();
});

test("products: numeric validation rejects rate below minimum", async ({ page }) => {
  await go(page, "Products");
  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByLabel("Product name").fill("New Finish");
  await page.getByLabel("Rate / sq.ft. (₹)").fill("0");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Must be at least 1")).toBeVisible();
  await page.getByLabel("Rate / sq.ft. (₹)").fill("150");
  await page.getByLabel("HSN code").fill("3214");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByText("Product created")).toBeVisible();
});

test("quotations: wizard validates each step and creates on completion", async ({ page }) => {
  await go(page, "Quotations");
  await page.getByRole("button", { name: "New quotation" }).click();
  await expect(page.locator(".quote-modal")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("NEW QUOTATION")).toBeVisible();

  // Step 1: Customer & project
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Select a customer")).toBeVisible();
  await expect(page.getByText("Select a project")).toBeVisible();

  await page.getByLabel("Customer", { exact: true }).selectOption("C-1001");
  await page.getByLabel("Project", { exact: true }).selectOption("PRJ-101");
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 2: Surface items
  await expect(page.getByRole("heading", { name: "Surface items", level: 3 })).toBeVisible();
  await page.getByLabel("Area (sq.ft.)", { exact: true }).first().fill("0");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Area must be greater than 0")).toBeVisible();
  await page.getByLabel("Area (sq.ft.)", { exact: true }).first().fill("2000");
  await page.getByLabel("Rate / sq.ft.", { exact: true }).first().fill("0");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByText("Rate must be greater than 0")).toBeVisible();
  await page.getByLabel("Rate / sq.ft.", { exact: true }).first().fill("185");
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 3: Discount, Charges & GST
  await expect(page.getByRole("heading", { name: "Discount, Charges & GST", level: 3 })).toBeVisible();
  await page.getByRole("button", { name: /Continue/ }).click();

  // Step 4: Preview & status
  await expect(page.getByText("Finalise quotation")).toBeVisible();
  await expect(page.getByText("Grand total")).toBeVisible();
  await expect(page.getByText("Amount in words")).toBeVisible();
  await page.getByRole("button", { name: "Save quotation" }).click();
  await expect(page.getByText("Quotation created")).toBeVisible();
  await expect(page.getByText("QT-AHM-26082", { exact: true })).toBeVisible();
});

test("quotations: delete uses confirmation dialog", async ({ page }) => {
  await go(page, "Quotations");
  const row = page.getByRole("row", { name: /QT-AHM-26080/ });
  await row.getByTitle("Delete").click();
  await expect(page.getByRole("heading", { name: "Delete quotation" })).toBeVisible();
  await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Quotation deleted")).toBeVisible();
  await expect(page.getByText("QT-AHM-26080", { exact: true })).not.toBeVisible();
});

test("branch admin sees only own-branch records and can manage users", async ({ page }) => {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByLabel("Email or mobile").fill("ahmedabad.admin@example.com");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".avatar")).toHaveText("BA");

  await go(page, "Customers");
  await expect(page.getByText("Branch scope — Ahmedabad")).toBeVisible();
  await expect(page.getByRole("cell", { name: "Orion Manufacturing" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Vertex Industries" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "New customer" })).toBeVisible();

  await page.getByRole("button", { name: "New customer" }).click();
  await expect(page.getByLabel("Branch")).toBeDisabled();
  await expect(page.getByLabel("Branch")).toHaveValue("Ahmedabad");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("button", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Roles" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Branches" })).not.toBeVisible();
});

test("loading state shows skeleton before table renders", async ({ page }) => {
  await go(page, "Customers");
  await expect(page.locator(".skeleton-row").first()).toBeVisible();
  await expect(page.locator(".skeleton-row").first()).toBeHidden();
  await expect(page.getByRole("row", { name: /Orion Manufacturing/ })).toBeVisible();
});