import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Check, Eye, Pencil, Plus, Search, ShieldCheck, Trash2, X } from "lucide-react";
import { useApp } from "./store";
import type { Me } from "./store";
import type { DB, EntityName, Module, Page } from "./types";
import { nextCode, nextId } from "./utils";
import { ConfirmModal, EmptyState, Modal, SkeletonTable, Spinner } from "./components";

export interface Option {
  value: string;
  label: string;
}
export type FieldType = "text" | "number" | "email" | "tel" | "select" | "date" | "textarea" | "multiselect";

export interface CrudField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: (db: DB, me: Me) => Option[];
  min?: number;
  max?: number;
  span?: 1 | 2;
  help?: string;
  validate?: (v: string, all: Record<string, string>, db: DB) => string | undefined;
}

export interface Helpers {
  customerName(id: string): string;
  projectName(id: string): string;
}

export interface CrudColumn {
  key: string;
  label: string;
  main?: boolean;
  mono?: boolean;
  render?: (row: any, db: DB, h: Helpers) => ReactNode;
  link?: {
    to: Page;
    by?: string;
    getId: (row: any, db: DB) => string;
    getLabel?: (row: any, db: DB) => string;
  };
}

export interface CrudConfig {
  kind: EntityName;
  module: Module;
  title: string;
  subtitle: string;
  action: string;
  singular: string;
  idPrefix: string;
  idField: string;
  searchKeys: string[];
  filter?: { key: string; label: string; all: string; options: (db: DB) => Option[] };
  rowFilter?: (row: any, me: Me) => boolean;
  rowAction?: (row: any, me: Me, db: DB) => boolean;
  form?: (props: { config: CrudConfig; initial: Record<string, string>; row: any | null; onClose: () => void }) => ReactNode;
  columns: CrudColumn[];
  fields: CrudField[];
  defaults: () => Record<string, string>;
  build: (db: DB, values: Record<string, string>, id: number, code: string) => any;
  unique?: (v: Record<string, string>, db: DB, currentId: string) => string | undefined;
  emptyTitle: string;
  emptyText: string;
}

const helpersOf = (db: DB): Helpers => ({
  customerName: (id) => db.customers.find((c) => c.code === id)?.name ?? id,
  projectName: (id) => db.projects.find((p) => p.code === id)?.name ?? id,
});

function renderControl(f: CrudField, values: Record<string, string>, db: DB, set: (k: string, v: string) => void, disabled = false, options?: Option[], me: Me = { userId: 0, roleId: 0, level: 0 }) {
  const v = values[f.key] ?? "";
  switch (f.type) {
    case "select": {
      const opts = options ?? f.options?.(db, me) ?? [];
      return (
        <select aria-label={f.label} value={v} disabled={disabled} onChange={(e) => set(f.key, e.target.value)}>
          {!opts.some((o) => o.value === v) && <option value="">Select {f.label.toLowerCase()}…</option>}
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case "multiselect": {
      const opts = options ?? f.options?.(db, me) ?? [];
      const selected = v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
      return (
        <select aria-label={f.label} multiple value={selected} disabled={disabled} onChange={(e) => {
          const arr = Array.from(e.target.selectedOptions).map((o) => o.value);
          set(f.key, arr.join(","));
        }}>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    case "textarea":
      return <textarea aria-label={f.label} value={v} placeholder={f.placeholder} disabled={disabled} onChange={(e) => set(f.key, e.target.value)} />;
    case "number":
      return (
        <input aria-label={f.label} type="number" value={v} placeholder={f.placeholder} min={f.min} max={f.max} disabled={disabled} onChange={(e) => set(f.key, e.target.value)} />
      );
    default:
      return <input aria-label={f.label} type={f.type} value={v} placeholder={f.placeholder} disabled={disabled} onChange={(e) => set(f.key, e.target.value)} />;
  }
}

export function CrudForm({
  config,
  initial,
  title,
  subtitle,
  onClose,
}: {
  config: CrudConfig;
  initial: Record<string, string>;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  const { db, busy, create, update, branchScope, rowInScope, me } = useApp();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const editing = Boolean(initial[config.idField]);
  const saving = busy?.kind === config.kind;
  const scoped = branchScope !== "All branches";

  const setVal = (k: string, v: string) => {
    setValues((p) => ({ ...p, [k]: v }));
    if (errors[k]) {
      const n = { ...errors };
      delete n[k];
      setErrors(n);
    }
    if (formError) setFormError("");
  };

  const submit = async () => {
    const errs: Record<string, string> = {};
    for (const f of config.fields) {
      const v = values[f.key] ?? "";
      if (f.required && !v.trim()) {
        errs[f.key] = `${f.label} is required`;
      } else if (f.type === "number") {
        if (v.trim() !== "" && isNaN(Number(v))) errs[f.key] = "Enter a valid number";
        else if (f.min != null && Number(v) < f.min) errs[f.key] = `Must be at least ${f.min}`;
        else if (f.max != null && Number(v) > f.max) errs[f.key] = `Must be at most ${f.max}`;
      } else if (f.type === "email" && v.trim() && !/^\S+@\S+\.\S+$/.test(v)) {
        errs[f.key] = "Enter a valid email address";
      } else if (f.type === "tel" && v.trim() && !/^\d{10}$/.test(v)) {
        errs[f.key] = "Enter a valid 10-digit mobile number";
      } else if (f.validate) {
        const e = f.validate(v, values, db);
        if (e) errs[f.key] = e;
      }
    }
    const currentId = editing ? String(initial[config.idField]) : "";
    const uniqueErr = config.unique?.(values, db, currentId);

    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError("Please fix the highlighted fields.");
      return;
    }
    if (uniqueErr) {
      setFormError(uniqueErr);
      return;
    }
    const id = editing ? Number(currentId) : nextId(db, config.kind);
    const code = editing ? initial.code : nextCode(db, config.kind, config.idPrefix);
    const row = config.build(db, values, id, code);
    if (editing) await update(config.kind, id, row, config.singular);
    else await create(config.kind, row, config.singular);
    onClose();
  };

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <button className="secondary" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={saving} onClick={submit}>
            {saving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              <>
                <Check size={16} /> {editing ? "Save changes" : "Create"}
              </>
            )}
          </button>
        </>
      }
    >
      {formError && (
        <div className="form-error">
          <AlertTriangle size={14} />
          {formError}
        </div>
      )}
      <div className="form-grid">
        {config.fields.map((f) => {
          const err = errors[f.key];
          const branchLocked = scoped && f.key === "branch";
          const customerOpts = scoped && f.key === "customer"
            ? (f.options?.(db, me) ?? []).filter((o) => {
                const c = db.customers.find((x) => x.code === o.value);
                return Boolean(c && rowInScope("customers", c));
              })
            : undefined;
          return (
            <div key={f.key} className={"form-field" + (f.span === 2 ? " span-2" : "") + (err ? " invalid" : "")}>
              <label>
                {f.label}
                {f.required && <span className="req">*</span>}
              </label>
              {renderControl(f, values, db, setVal, branchLocked, customerOpts, me)}
              {branchLocked && <span className="help-msg">Locked to your branch ({branchScope}).</span>}
              {err ? <span className="err-msg">{err}</span> : f.help && !branchLocked ? <span className="help-msg">{f.help}</span> : null}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function toValues(row: any, config: CrudConfig): Record<string, string> {
  const v: Record<string, string> = {};
  v[config.idField] = String(row[config.idField] ?? "");
  v.code = String(row.code ?? "");
  for (const f of config.fields) v[f.key] = String(row[f.key] ?? "");
  return v;
}

export function EntityPage({ config }: { config: CrudConfig }) {
  const { db, can, rowInScope, branchScope, isAdmin, go, navCtx, clearNav, busy, remove, me } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<{ t: "none" } | { t: "create" } | { t: "edit"; row: any } | { t: "delete"; row: any }>({ t: "none" });
  const canCreate = can(config.module, "create");
  const canUpdate = can(config.module, "update");
  const canDelete = can(config.module, "delete");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const createInitial = useMemo(
    () => ({ ...config.defaults(), ...(branchScope !== "All branches" ? { branch: branchScope } : {}) }),
    [config, branchScope]
  );

  const rows = ((db[config.kind] as any[]) || [])
    .filter((r) => rowInScope(config.kind, r))
    .filter((r) => (config.rowFilter ? config.rowFilter(r, me) : true));
  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (config.filter && status !== "all" && String(r[config.filter.key]) !== status) return false;
        if (!query) return true;
        return config.searchKeys.some((k) => String(r[k] ?? "").toLowerCase().includes(query.toLowerCase()));
      }),
    [rows, query, status, config]
  );

  const helpers = helpersOf(db);
  const focusRow = navCtx ? rows.find((r) => String(r.code ?? r[config.idField]) === navCtx.id) : undefined;
  const focusName = focusRow ? String(focusRow[config.columns[0].key] ?? focusRow[config.idField]) : "";

  const del = async () => {
    if (mode.t !== "delete") return;
    await remove(config.kind, mode.row[config.idField], config.singular);
    setMode({ t: "none" });
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>{config.title}</h2>
          <p>{config.subtitle}</p>
        </div>
        {canCreate && (
          <button className="primary" onClick={() => setMode({ t: "create" })}>
            <Plus size={16} /> {config.action}
          </button>
        )}
      </div>

      {(!isAdmin || branchScope !== "All branches") && (
        <div className="readonly-note">
          <ShieldCheck size={14} /> {branchScope !== "All branches" ? `Branch scope — ${branchScope} records only.` : "Assigned permission set applies."}
          {!canCreate && " · Read-only — no create access on this module."}
        </div>
      )}

      {focusRow && (
        <div className="focus-banner">
          <Eye size={14} /> Viewing {config.singular.toLowerCase()} <b>{focusName}</b>
          <span className="mono">({focusRow.code ?? focusRow[config.idField]})</span>
          <button onClick={clearNav}>
            <X size={13} /> Clear
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} />
        </div>
        {config.filter && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={"Filter by " + config.filter.label.toLowerCase()}>
            <option value="all">{config.filter.all}</option>
            {config.filter.options(db).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <span className="count">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {loading ? (
        <SkeletonTable cols={config.columns.length + 1} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || status !== "all" ? `No matching ${config.title.toLowerCase()}` : config.emptyTitle}
          text={query || status !== "all" ? "Try adjusting your search or filters." : config.emptyText}
          action={canCreate && !query && status === "all" ? config.action : undefined}
          onAction={() => setMode({ t: "create" })}
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {config.columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const focused = navCtx && String(row.code ?? row[config.idField]) === navCtx.id;
                return (
                  <tr key={String(row[config.idField])} className={focused ? "row-focus" : ""}>
                    {config.columns.map((col) => {
                      let cell: ReactNode = String(row[col.key] ?? "");
                      if (col.link) {
                        const lbl = col.link.getLabel ? col.link.getLabel(row, db) : String(row[col.key] ?? "");
                        cell = (
                          <span className="link-cell" onClick={() => go(col.link!.to, { id: col.link!.getId(row, db), by: col.link!.by })}>
                            {lbl}
                            <ArrowRight size={12} />
                          </span>
                        );
                      } else if (col.render) {
                        cell = col.render(row, db, helpers);
                      }
                      return <td key={col.key}>{cell}</td>;
                    })}
                    <td className="table-actions">
                      {canUpdate && (!config.rowAction || config.rowAction(row, me, db)) && (
                        <button className="icon-btn" title="Edit" onClick={() => setMode({ t: "edit", row })}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && (!config.rowAction || config.rowAction(row, me, db)) && (
                        <button className="icon-btn danger-ic" title="Delete" onClick={() => setMode({ t: "delete", row })}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {mode.t === "create" &&
        (config.form
          ? config.form({ config, initial: createInitial, row: null, onClose: () => setMode({ t: "none" }) })
          : (
        <CrudForm
          config={config}
          initial={createInitial}
          title={`New ${config.singular.toLowerCase()}`}
          subtitle={config.subtitle}
          onClose={() => setMode({ t: "none" })}
        />
          ))}
      {mode.t === "edit" &&
        (config.form
          ? config.form({ config, initial: toValues(mode.row, config), row: mode.row, onClose: () => setMode({ t: "none" }) })
          : (
        <CrudForm
          config={config}
          initial={toValues(mode.row, config)}
          title={`Edit ${config.singular.toLowerCase()}`}
          subtitle={`${config.singular} · ${mode.row.code ?? mode.row[config.idField]}`}
          onClose={() => setMode({ t: "none" })}
        />
          ))}
      {mode.t === "delete" && (
        <ConfirmModal
          title={`Delete ${config.singular.toLowerCase()}`}
          text={`This action permanently removes this ${config.singular.toLowerCase()}. This cannot be undone.`}
          busy={busy?.kind === config.kind}
          onCancel={() => setMode({ t: "none" })}
          onConfirm={del}
          detail={
            <>
              <span>{config.singular} ID</span>
              <b>{mode.row.code ?? mode.row[config.idField]}</b>
              <span>Name</span>
              <b>{String(mode.row[config.columns[0].key] ?? "—")}</b>
            </>
          }
        />
      )}
    </section>
  );
}

