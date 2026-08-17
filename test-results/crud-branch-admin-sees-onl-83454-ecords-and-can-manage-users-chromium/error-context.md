# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: crud.spec.ts >> branch admin sees only own-branch records and can manage users
- Location: e2e-tests\crud.spec.ts:208:1

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  getByLabel('Branch')
Expected: disabled
Received: enabled
Timeout:  5000ms

Call log:
  - Expect "toBeDisabled" with timeout 5000ms
  - waiting for getByLabel('Branch')
    14 × locator resolved to <select multiple aria-label="Branches">…</select>
       - unexpected value "enabled"

```

```yaml
- listbox "Branches":
  - option "Ahmedabad"
  - option "Mumbai"
  - option "Surat"
```

# Test source

```ts
  121 | });
  122 | 
  123 | test("customers: search empty state", async ({ page }) => {
  124 |   await go(page, "Customers");
  125 |   await page.getByPlaceholder("Search customers & contacts…").fill("zzz-nothing-matches");
  126 |   await expect(page.getByText("No matching customers")).toBeVisible();
  127 |   await expect(page.getByText("Try adjusting your search or filters.")).toBeVisible();
  128 | });
  129 | 
  130 | test("projects: create requires a customer; customer link navigates to customers page with focus", async ({ page }) => {
  131 |   await go(page, "Projects");
  132 |   await page.getByRole("button", { name: "New project" }).click();
  133 |   await page.getByRole("button", { name: "Save & continue" }).click();
  134 |   await expect(page.getByText("Project name is required")).toBeVisible();
  135 |   await expect(page.getByText("Customer is required")).toBeVisible();
  136 |   await page.getByRole("button", { name: "Cancel" }).click();
  137 | 
  138 |   const row = page.getByRole("row", { name: /Corporate Office/ });
  139 |   await row.getByText("Orion Manufacturing").click();
  140 |   await expect(page.getByRole("heading", { name: "Customers", level: 1 })).toBeVisible();
  141 |   await expect(page.getByText("Viewing customer")).toBeVisible();
  142 |   await expect(page.getByText("Orion Manufacturing", { exact: true }).first()).toBeVisible();
  143 | });
  144 | 
  145 | test("products: numeric validation rejects rate below minimum", async ({ page }) => {
  146 |   await go(page, "Products");
  147 |   await page.getByRole("button", { name: "Add product" }).click();
  148 |   await page.getByLabel("Product name").fill("New Finish");
  149 |   await page.getByLabel("Rate / sq.ft. (₹)").fill("0");
  150 |   await page.getByRole("button", { name: "Create", exact: true }).click();
  151 |   await expect(page.getByText("Must be at least 1")).toBeVisible();
  152 |   await page.getByLabel("Rate / sq.ft. (₹)").fill("150");
  153 |   await page.getByLabel("HSN code").fill("3214");
  154 |   await page.getByRole("button", { name: "Create", exact: true }).click();
  155 |   await expect(page.getByText("Product created")).toBeVisible();
  156 | });
  157 | 
  158 | test("quotations: wizard validates each step and creates on completion", async ({ page }) => {
  159 |   await go(page, "Quotations");
  160 |   await page.getByRole("button", { name: "New quotation" }).click();
  161 |   await expect(page.locator(".quote-modal")).toBeVisible({ timeout: 10000 });
  162 |   await expect(page.getByText("NEW QUOTATION")).toBeVisible();
  163 | 
  164 |   // Step 1: Customer & project
  165 |   await page.getByRole("button", { name: /Continue/ }).click();
  166 |   await expect(page.getByText("Select a customer")).toBeVisible();
  167 |   await expect(page.getByText("Select a project")).toBeVisible();
  168 | 
  169 |   await page.getByLabel("Customer", { exact: true }).selectOption("C-1001");
  170 |   await page.getByLabel("Project", { exact: true }).selectOption("PRJ-101");
  171 |   await page.getByRole("button", { name: /Continue/ }).click();
  172 | 
  173 |   // Step 2: Surface items
  174 |   await expect(page.getByRole("heading", { name: "Surface items", level: 3 })).toBeVisible();
  175 |   await page.getByLabel("Area (sq.ft.)", { exact: true }).first().fill("0");
  176 |   await page.getByRole("button", { name: /Continue/ }).click();
  177 |   await expect(page.getByText("Area must be greater than 0")).toBeVisible();
  178 |   await page.getByLabel("Area (sq.ft.)", { exact: true }).first().fill("2000");
  179 |   await page.getByLabel("Rate / sq.ft.", { exact: true }).first().fill("0");
  180 |   await page.getByRole("button", { name: /Continue/ }).click();
  181 |   await expect(page.getByText("Rate must be greater than 0")).toBeVisible();
  182 |   await page.getByLabel("Rate / sq.ft.", { exact: true }).first().fill("185");
  183 |   await page.getByRole("button", { name: /Continue/ }).click();
  184 | 
  185 |   // Step 3: Discount, Charges & GST
  186 |   await expect(page.getByRole("heading", { name: "Discount, Charges & GST", level: 3 })).toBeVisible();
  187 |   await page.getByRole("button", { name: /Continue/ }).click();
  188 | 
  189 |   // Step 4: Preview & status
  190 |   await expect(page.getByText("Finalise quotation")).toBeVisible();
  191 |   await expect(page.getByText("Grand total")).toBeVisible();
  192 |   await expect(page.getByText("Amount in words")).toBeVisible();
  193 |   await page.getByRole("button", { name: "Save quotation" }).click();
  194 |   await expect(page.getByText("Quotation created")).toBeVisible();
  195 |   await expect(page.getByText("QT-AHM-26082", { exact: true })).toBeVisible();
  196 | });
  197 | 
  198 | test("quotations: delete uses confirmation dialog", async ({ page }) => {
  199 |   await go(page, "Quotations");
  200 |   const row = page.getByRole("row", { name: /QT-AHM-26080/ });
  201 |   await row.getByTitle("Delete").click();
  202 |   await expect(page.getByRole("heading", { name: "Delete quotation" })).toBeVisible();
  203 |   await modal(page).getByRole("button", { name: "Delete", exact: true }).click();
  204 |   await expect(page.getByText("Quotation deleted")).toBeVisible();
  205 |   await expect(page.getByText("QT-AHM-26080", { exact: true })).not.toBeVisible();
  206 | });
  207 | 
  208 | test("branch admin sees only own-branch records and can manage users", async ({ page }) => {
  209 |   await page.getByRole("button", { name: "Sign out" }).click();
  210 |   await page.getByLabel("Email or mobile").fill("ahmedabad.admin@example.com");
  211 |   await page.getByRole("button", { name: "Sign in" }).click();
  212 |   await expect(page.locator(".avatar")).toHaveText("BA");
  213 | 
  214 |   await go(page, "Customers");
  215 |   await expect(page.getByText("Branch scope — Ahmedabad")).toBeVisible();
  216 |   await expect(page.getByRole("cell", { name: "Orion Manufacturing" })).toBeVisible();
  217 |   await expect(page.getByRole("cell", { name: "Vertex Industries" })).not.toBeVisible();
  218 |   await expect(page.getByRole("button", { name: "New customer" })).toBeVisible();
  219 | 
  220 |   await page.getByRole("button", { name: "New customer" }).click();
> 221 |   await expect(page.getByLabel("Branch")).toBeDisabled();
      |                                           ^ Error: expect(locator).toBeDisabled() failed
  222 |   await expect(page.getByLabel("Branch")).toHaveValue("Ahmedabad");
  223 |   await page.getByRole("button", { name: "Cancel" }).click();
  224 | 
  225 |   await expect(page.getByRole("button", { name: "Users" })).toBeVisible();
  226 |   await expect(page.getByRole("button", { name: "Roles" })).not.toBeVisible();
  227 |   await expect(page.getByRole("button", { name: "Branches" })).not.toBeVisible();
  228 | });
  229 | 
  230 | test("loading state shows skeleton before table renders", async ({ page }) => {
  231 |   await go(page, "Customers");
  232 |   await expect(page.locator(".skeleton-row").first()).toBeVisible();
  233 |   await expect(page.locator(".skeleton-row").first()).toBeHidden();
  234 |   await expect(page.getByRole("row", { name: /Orion Manufacturing/ })).toBeVisible();
  235 | });
```