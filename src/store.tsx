import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { DB, EntityName, Module, Page, PermissionAction, Role, User } from "./types";
import type { Option } from "./entity";
import { seed } from "./data";
import { HIDDEN_ROLE_IDS } from "./types";

export interface NavCtx {
  id: string;
  by?: string;
}
export interface Toast {
  id: number;
  msg: string;
  type: "success" | "error";
}
export interface Busy {
  kind: EntityName;
  id: string;
}

export interface Me {
  userId: number;
  roleId: number;
  level: number;
}

export function canManageRole(me: Me, targetRoleId: number, targetLevel: number): boolean {
  if (me.roleId === 1) return targetRoleId > 1 && targetRoleId !== 2;
  if (me.roleId === 2) return targetRoleId > 2;
  return targetLevel >= me.level;
}

export function getVisibleRoles(roles: Role[]): Role[] {
  return roles.filter((r) => !HIDDEN_ROLE_IDS.includes(r.id));
}
export function getVisibleUsers(users: User[]): User[] {
  return users.filter((u) => !HIDDEN_ROLE_IDS.includes(u.roleId));
}
export function getVisibleRolesOptions(roles: Role[]): Option[] {
  return getVisibleRoles(roles).map((r) => ({ value: String(r.id), label: r.name }));
}

interface AppState {
  role: Role | null;
  logged: boolean;
  login(identifier: string, password: string): boolean;
  resetPassword(identifier: string, newPassword: string): boolean;
  logout(): void;
  page: Page;
  go(p: Page, ctx?: NavCtx | null): void;
  navCtx: NavCtx | null;
  clearNav(): void;
  currentUser: { name: string; subtitle: string; branch: string };
  me: Me;
  db: DB;
  busy: Busy | null;
  create(kind: EntityName, row: any, label: string): Promise<void>;
  update(kind: EntityName, id: string | number, row: any, label: string): Promise<void>;
  remove(kind: EntityName, id: string | number, label: string): Promise<void>;
  assignBranchUsers(userIds: number[], branch: string): void;
  toasts: Toast[];
  toast(msg: string, type?: "success" | "error"): void;
  isAdmin: boolean;
  branchScope: string;
  can(module: Module, action: PermissionAction): boolean;
  rowInScope(kind: EntityName, row: any): boolean;
  visibleRoles: Role[];
  visibleUsers: User[];
  visibleRolesOptions: Option[];
}

const Ctx = createContext<AppState>(null as any);
export const useApp = () => useContext(Ctx);

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const SESSION_KEY = "artelier.session";

const findByIdentifier = (users: User[], identifier: string) => {
  const q = identifier.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === q || u.mobileNo === q) ?? null;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const initialUser = sessionStorage.getItem(SESSION_KEY)
    ? seed.users.find((u) => u.email.toLowerCase() === (sessionStorage.getItem(SESSION_KEY) || "").toLowerCase()) ?? null
    : null;
  const initialRole = initialUser ? seed.roles.find((r) => r.id === initialUser.roleId) ?? null : null;
  const [role, setRole] = useState<Role | null>(initialRole);
  const [user, setUser] = useState<User | null>(initialUser);
  const [logged, setLogged] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [page, setPage] = useState<Page>("Dashboard");
  const [navCtx, setNavCtx] = useState<NavCtx | null>(null);
  const [db, setDb] = useState<DB>(seed);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const toast = useCallback((msg: string, type: "success" | "error" = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const go = useCallback((p: Page, ctx?: NavCtx | null) => {
    setPage(p);
    setNavCtx(ctx ?? null);
  }, []);
  const clearNav = useCallback(() => setNavCtx(null), []);

  const login = useCallback(
    (identifier: string, password: string) => {
      const found = findByIdentifier(db.users, identifier);
      if (!found || found.password !== password) return false;
      sessionStorage.setItem(SESSION_KEY, found.email);
      setUser(found);
      setRole(db.roles.find((r) => r.id === found.roleId) ?? null);
      setLogged(true);
      return true;
    },
    [db]
  );

  const resetPassword = useCallback(
    (identifier: string, newPassword: string) => {
      const found = findByIdentifier(db.users, identifier);
      if (!found || !newPassword) return false;
      const updated = { ...found, password: newPassword };
      setDb((d) => ({ ...d, users: d.users.map((u) => (u.id === found.id ? updated : u)) }));
      seed.users = seed.users.map((u) => (u.id === found.id ? updated : u));
      return true;
    },
    [db]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setLogged(false);
    setUser(null);
    setRole(null);
  }, []);

  const isAdmin = role?.isAdmin ?? false;
  const branchScope = user?.branch ?? "";
  const can = useCallback(
    (m: Module, a: PermissionAction) => {
      if (!role) return false;
      if (role.isAdmin) return true;
      const p = role.permissions.find((x) => x.module === m);
      return p ? p[a] : false;
    },
    [role]
  );

  const rowInScope = useCallback(
    (kind: EntityName, row: any) => {
      if (branchScope === "All branches") return true;
      let rowBranches: string[] = [];
      if (kind === "customers") rowBranches = row.branches || (row["branch"] ? [row["branch"]] : []);
      else if (kind === "quotations" || kind === "projects" || kind === "inspections" || kind === "followups") rowBranches = row.branches || (row["branch"] ? [row["branch"]] : []);
      else if (kind === "users") rowBranches = row["branch"] ? [row["branch"]] : [];
      else if (kind === "branches") rowBranches = [row.name];
      else return true;
      return rowBranches.includes(branchScope);
    },
    [branchScope, db]
  );

  // Centralized filtering for hidden roles (Super Admin, System Admin)
  const visibleRoles = useMemo(
    () => db.roles.filter((r) => !HIDDEN_ROLE_IDS.includes(r.id)),
    [db.roles]
  );
  const visibleUsers = useMemo(
    () => db.users.filter((u) => !HIDDEN_ROLE_IDS.includes(u.roleId)),
    [db.users]
  );
  const visibleRolesOptions = useMemo(
    () => visibleRoles.map((r) => ({ value: String(r.id), label: r.name })),
    [visibleRoles]
  );

  const create = useCallback(
    async (kind: EntityName, row: any, label: string) => {
      setBusy({ kind, id: "new" });
      await wait(460);
      setDb((d) => ({ ...d, [kind]: [row, ...(d[kind] as any[])] }));
      setBusy(null);
      toast(`${label} created`);
    },
    [toast]
  );

  const update = useCallback(
    async (kind: EntityName, id: string | number, row: any, label: string) => {
      setBusy({ kind, id: String(id) });
      await wait(460);
      setDb((d) => ({ ...d, [kind]: (d[kind] as any[]).map((r) => (String(r.id) === String(id) ? row : r)) }));
      setBusy(null);
      toast(`${label} updated`);
    },
    [toast]
  );

  const remove = useCallback(
    async (kind: EntityName, id: string | number, label: string) => {
      setBusy({ kind, id: String(id) });
      await wait(460);
      setDb((d) => ({ ...d, [kind]: (d[kind] as any[]).filter((r) => String(r.id) !== String(id)) }));
      setBusy(null);
      toast(`${label} deleted`);
    },
    [toast]
  );

  const assignBranchUsers = useCallback((userIds: number[], branch: string) => {
    setDb((d) => ({ ...d, users: d.users.map((u) => (userIds.includes(u.id) ? { ...u, branch } : u)) }));
    seed.users = seed.users.map((u) => (userIds.includes(u.id) ? { ...u, branch } : u));
  }, []);

  const value: AppState = {
    role,
    logged,
    login,
    resetPassword,
    logout,
    page,
    go,
    navCtx,
    clearNav,
    currentUser: user ? { name: `${user.firstName} ${user.lastName}`, subtitle: role?.name ?? "", branch: user.branch } : { name: "", subtitle: "", branch: "" },
    me: user && role ? { userId: user.id, roleId: user.roleId, level: role.level } : { userId: 0, roleId: 0, level: 0 },
    db,
    busy,
    create,
    update,
    remove,
    assignBranchUsers,
    toasts,
    toast,
    isAdmin,
    branchScope,
    can,
    rowInScope,
    visibleRoles,
    visibleUsers,
    visibleRolesOptions,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
