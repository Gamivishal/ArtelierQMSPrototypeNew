# Branch Scoping Rules

Non-negotiable rules for the Artelier QMS prototype. Any future change MUST preserve
these behaviors — treat them as acceptance criteria for every new feature, screen,
query, or permission change.

## The Rules

1. **Branch-level users operate on their own branch only.**
   A user assigned to a specific branch (e.g. a Branch Admin on `Ahmedabad`) can
   **view, create, edit and delete only records belonging to that branch.**
   Records of other branches are **not visible and not accessible** — they must not
   appear in lists, dropdowns, counts, navigation targets, or any derived data.

2. **Admin users see consolidated records across all branches.**
   Users whose role is admin and who are assigned to `All branches` (Super Admin,
   System Admin) can access **records from every branch combined**, but still only
   **within the permissions granted by their role** (module-level view/create/update/delete).

## How It Works Today

- **Row scope is derived from the user's assigned branch, not from role flags.**
  `rowInScope(kind, row)` in `src/store.tsx:140` returns `true` for users assigned to
  `All branches` (admins) and otherwise compares the row's branch with the user's
  branch. Because the check keys on the assigned branch, a Branch Admin is scoped to
  their own branch **even though their role is admin**.

- **Every record read goes through `rowInScope`.**
  Table rows are filtered in the generic entity page (`src/entity.tsx:255`) and in
  every specialized page / widget:
  - Projects — `src/pages.tsx:226`
  - Quotations — `src/pages.tsx:955`
  - Dashboard / Reports — `src/pages.tsx:1681`, `src/pages.tsx:1765`
  - Customer dropdowns are scoped too — `src/entity.tsx:211`, `src/pages.tsx:394`

- **Branch is enforced on create/edit.**
  Branch-scoped users get the branch field locked to their own branch in forms
  (`src/entity.tsx:122`), and the branch is pre-selected for them
  (`src/entity.tsx:386`).

- **Branch assignment of users is enforced.**
  Non-admin (branch-level) roles must be assigned to one specific branch; the "All
  branches" option is rejected for them (`src/pages.tsx:905`). Admins keep branch
  `All branches` (branch 0).

- **Admin-only pages stay admin-only.**
  Roles / Branches pages are shown only to global admins
  (`isAdmin && branchScope === "All branches"`) in `src/App.tsx:85-91`.

## Rules for Future Changes

When adding, modifying, or testing any feature:

1. **Always route record reads through `rowInScope`** — never bypass it with a raw
   `db.<entity>` scan in a user-facing list, lookup, dropdown, count, or report.
2. **Derive scope from the assigned branch** (`branchScope`), not from
   `role.isAdmin`. Branch admins must stay branch-scoped even though their role is
   admin.
3. **On create/edit, lock or default the branch** to the user's own branch for any
   branch-scoped user; never let them assign another branch.
4. **On user management**, require a specific branch for branch-level roles and keep
   `All branches` for admin roles.
5. **Admin "consolidated" access still respects module permissions** — a global admin
   sees all branches but only within `can(module, action)`.
6. **Update the e2e suite** (branch admin scope, admin consolidated view) whenever the
   scoping behaviour changes.

## Additional Rules (from latest directive)

- **Strict branch-wise data isolation:** Branch 1 users can access only Branch 1 records
  and cannot view, search, export or modify records of any other branch.
- **Super Admin / System Admin / Branch Admin can view consolidated data or apply a
  branch filter** to review an individual branch.
