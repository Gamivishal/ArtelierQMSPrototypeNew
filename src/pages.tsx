import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  FileText,
  History,
  ImagePlus,
  Package,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { canManageRole, useApp } from "./store";
import type { Me } from "./store";
import type { Permission, Project, ProjectPhoto, QStatus, Quotation, Role, Surface, ProjectHistoryEntry, Product, ProductRateSlab, ProductHistoryEntry, QuotationSurfaceItem } from "./types";
import { ProjectType, ProductCategory, OptionalItemMaster, ApplicationArea, HIDDEN_ROLE_IDS } from "./types";
import { fmtDate, money, nextCode, nextId, numberWords } from "./utils";
import { Badge, ConfirmModal, EmptyState, Modal, SkeletonTable, Spinner } from "./components";
import type { CrudConfig, Option } from "./entity";

const QSTATUSES: QStatus[] = ["Draft", "Sent", "Under Negotiation", "Approved", "Rejected", "Expired", "Converted"];

const statusOpts: Option[] = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];
const sourceOpts: Option[] = [
  { value: "Direct Client", label: "Direct Client" },
  { value: "Architect", label: "Architect" },
  { value: "Interior Designer", label: "Interior Designer" },
  { value: "Builder", label: "Builder" },
  { value: "Contractor", label: "Contractor" },
  { value: "Developer", label: "Developer" },
];
const typeOpts: Option[] = [
  { value: "Commercial", label: "Commercial" },
  { value: "Residential", label: "Residential" },
  { value: "Hospitality", label: "Hospitality" },
  { value: "Retail", label: "Retail" },
  { value: "Industrial", label: "Industrial" },
];
const stageOpts: Option[] = [
  { value: "Design", label: "Design" },
  { value: "Execution", label: "Execution" },
  { value: "Completed", label: "Completed" },
];
const projectStatusOpts: Option[] = [
  { value: "Active", label: "Active" },
  { value: "On Hold", label: "On Hold" },
  { value: "Completed", label: "Completed" },
];
const categoryOpts: Option[] = [
  { value: "Micro Cement", label: "Micro Cement" },
  { value: "Metallic", label: "Metallic" },
  { value: "Textured", label: "Textured" },
  { value: "Protective", label: "Protective" },
  { value: "Micro Concrete", label: "Micro Concrete" },
  { value: "Liquid Metal", label: "Liquid Metal" },
  { value: "Luxury Texture", label: "Luxury Texture" },
  { value: "Stucco", label: "Stucco" },
  { value: "Decorative Paint", label: "Decorative Paint" },
  { value: "Stone Finish", label: "Stone Finish" },
  { value: "Rammed Earth", label: "Rammed Earth" },
  { value: "Custom Finishes", label: "Custom Finishes" },
];
const finishOpts: Option[] = [
  { value: "Smooth", label: "Smooth" },
  { value: "Metallic", label: "Metallic" },
  { value: "Sandstone", label: "Sandstone" },
  { value: "Matt", label: "Matt" },
  { value: "Sculpted", label: "Sculpted" },
  { value: "Trowel", label: "Trowel" },
  { value: "Brush", label: "Brush" },
  { value: "Stone", label: "Stone" },
  { value: "Earth", label: "Earth" },
  { value: "Custom", label: "Custom" },
];
const inspectionStatusOpts: Option[] = [
  { value: "Open", label: "Open" },
  { value: "Under Review", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
];
const docTypeOpts: Option[] = [
  { value: "Policy", label: "Policy" },
  { value: "Procedure", label: "Procedure" },
  { value: "Template", label: "Template" },
  { value: "Terms", label: "Terms" },
];
const docStatusOpts: Option[] = [
  { value: "Draft", label: "Draft" },
  { value: "Under Review", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  { value: "Obsolete", label: "Obsolete" },
];
const fuStatusOpts: Option[] = [
  { value: "Open", label: "Open" },
  { value: "Done", label: "Done" },
  { value: "Overdue", label: "Overdue" },
];
const customerLabel = (db: any, id: string) => db.customers.find((c: any) => c.code === id)?.name ?? id;
const roleName = (db: any, id: number) => db.roles.find((r: any) => r.id === id)?.name ?? String(id);

export const branchesCfg: CrudConfig = {
  kind: "branches",
  module: "Branches",
  title: "Branch management",
  subtitle: "Centralized branches with strict record ownership and access boundaries.",
  action: "New branch",
  singular: "Branch",
  idPrefix: "BR-",
  idField: "id",
  searchKeys: ["code", "name", "address", "city", "gst", "contact"],
  filter: { key: "status", label: "Status", all: "All statuses", options: () => statusOpts },
  columns: [
    { key: "name", label: "Branch", main: true },
    { key: "code", label: "Code", mono: true },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "gst", label: "GST number", mono: true },
    { key: "contact", label: "Contact" },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
  ],
  fields: [
    { key: "code", label: "Branch code", type: "text", required: true, placeholder: "e.g. DEL" },
    { key: "name", label: "Branch name", type: "text", required: true, placeholder: "e.g. Delhi" },
    { key: "address", label: "Address", type: "textarea", placeholder: "Street, area, landmark" },
    { key: "city", label: "City", type: "text", required: true },
    {
      key: "gst",
      label: "GST number",
      type: "text",
      required: true,
      placeholder: "24AAECA0000A1Z5",
      validate: (v) => (v.trim().length === 0 ? undefined : v.trim().length !== 15 ? "GST number must be 15 characters" : undefined),
    },
    { key: "contact", label: "Contact details", type: "text", placeholder: "e.g. 98765 43210 · ahm@example.com" },
    { key: "status", label: "Status", type: "select", options: () => statusOpts },
  ],
  defaults: () => ({ code: "", name: "", address: "", city: "", gst: "", contact: "", status: "Active" }),
  build: (db, v, id) => ({
    id,
    code: v.code.trim().toUpperCase(),
    name: v.name.trim(),
    address: v.address.trim(),
    city: v.city.trim(),
    gst: v.gst.trim().toUpperCase(),
    contact: v.contact.trim(),
    status: v.status,
  }),
  unique: (v, db, cid) =>
    db.branches.some((b) => String(b.id) !== cid && b.code.toLowerCase() === v.code.trim().toLowerCase())
      ? "A branch with this code already exists."
      : undefined,
  emptyTitle: "No branches yet",
  emptyText: "Create your first branch to organise quotations, customers and users by location.",
  form: (props) => <BranchForm {...props} />,
};

function BranchForm({
  config,
  initial,
  row,
  onClose,
}: {
  config: CrudConfig;
  initial: Record<string, string>;
  row: any | null;
  onClose: () => void;
}) {
  const { db, busy, create, update, assignBranchUsers } = useApp();
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [members, setMembers] = useState<number[]>(() => (row ? db.users.filter((u) => u.branch === row.name).map((u) => u.id) : []));
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const editing = Boolean(row);
  const saving = busy?.kind === "branches";

  const setVal = (k: string, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
    if (formError) setFormError("");
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!values.code.trim()) e.code = "Branch code is required";
    if (!values.name.trim()) e.name = "Branch name is required";
    if (!values.city.trim()) e.city = "City is required";
    if (!values.gst.trim()) e.gst = "GST number is required";
    else if (values.gst.trim().length !== 15) e.gst = "GST number must be 15 characters";
    setErrors(e);
    if (Object.keys(e).length) setFormError("Please fix the highlighted fields.");
    return Object.keys(e).length === 0;
  };

  const toStep2 = () => {
    if (!validateStep1()) return;
    const dup = db.branches.some((b) => String(b.id) !== String(row?.id ?? "") && b.code.toLowerCase() === values.code.trim().toLowerCase());
    if (dup) {
      setFormError("A branch with this code already exists.");
      return;
    }
    setFormError("");
    setStep(2);
  };

  const assignable = db.users.filter((u) => u.branch !== "All branches" && !HIDDEN_ROLE_IDS.includes(u.roleId) && !members.includes(u.id));

  const addUsers = () => {
    setMembers((m) => [...m, ...picked.filter((id) => !m.includes(id))]);
    setPicked([]);
    setAdding(false);
  };

  const removeUser = (id: number) => setMembers((m) => m.filter((x) => x !== id));

  const save = async () => {
    const id = editing ? row.id : nextId(db, "branches");
    const branchRow = {
      id,
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      gst: values.gst.trim().toUpperCase(),
      contact: values.contact.trim(),
      status: values.status,
    };
    const oldName = editing ? row.name : null;
    const newName = values.name.trim();
    const originalIds = editing ? db.users.filter((u) => u.branch === oldName).map((u) => u.id) : [];
    const added = members.filter((id) => !originalIds.includes(id));
    const renamed = originalIds.filter((id) => members.includes(id));
    const removed = originalIds.filter((id) => !members.includes(id));
    if (editing) await update("branches", id, branchRow, "Branch");
    else await create("branches", branchRow, "Branch");
    if (added.length || renamed.length) assignBranchUsers([...added, ...renamed], newName);
    if (removed.length) assignBranchUsers(removed, "");
    onClose();
  };

  const footer =
    step === 1 ? (
      <>
        <button className="secondary" disabled={saving} onClick={onClose}>
          Cancel
        </button>
        <button className="primary" onClick={toStep2}>
          <ArrowRight size={16} /> Continue
        </button>
      </>
    ) : (
      <>
        <button className="secondary" onClick={() => setStep(1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="primary" disabled={saving} onClick={save}>
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
    );

  return (
    <Modal title={editing ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`} subtitle={`${config.singular} · ${config.idPrefix}${row?.id ?? nextId(db, "branches")}`} onClose={onClose} footer={footer}>
      <div className="steps">
        <button className={step === 1 ? "current" : "done"} onClick={() => setStep(1)}>
          <b>{step > 1 ? <Check size={14} /> : 1}</b> Branch details
        </button>
        <button className={step === 2 ? "current" : ""} onClick={() => step === 2 && setStep(2)}>
          <b>2</b> Branch users
        </button>
      </div>

      {step === 1 && (
        <div className="form-grid">
          <div className={"form-field" + (errors.code ? " invalid" : "")}>
            <label>Branch code *</label>
            <input value={values.code} onChange={(e) => setVal("code", e.target.value)} placeholder="e.g. DEL" />
            {errors.code && <span className="err-msg">{errors.code}</span>}
          </div>
          <div className={"form-field" + (errors.name ? " invalid" : "")}>
            <label>Branch name *</label>
            <input value={values.name} onChange={(e) => setVal("name", e.target.value)} placeholder="e.g. Delhi" />
            {errors.name && <span className="err-msg">{errors.name}</span>}
          </div>
          <div className="form-field span-2">
            <label>Address</label>
            <textarea value={values.address} onChange={(e) => setVal("address", e.target.value)} placeholder="Street, area, landmark" rows={2} />
          </div>
          <div className={"form-field" + (errors.city ? " invalid" : "")}>
            <label>City *</label>
            <input value={values.city} onChange={(e) => setVal("city", e.target.value)} />
            {errors.city && <span className="err-msg">{errors.city}</span>}
          </div>
          <div className={"form-field" + (errors.gst ? " invalid" : "")}>
            <label>GST number *</label>
            <input value={values.gst} onChange={(e) => setVal("gst", e.target.value)} placeholder="24AAECA0000A1Z5" />
            {errors.gst ? <span className="err-msg">{errors.gst}</span> : <span className="help-msg">15 characters.</span>}
          </div>
          <div className="form-field span-2">
            <label>Contact details</label>
            <input value={values.contact} onChange={(e) => setVal("contact", e.target.value)} placeholder="e.g. 98765 43210 · ahm@example.com" />
          </div>
          <div className="form-field">
            <label>Status</label>
            <select value={values.status} onChange={(e) => setVal("status", e.target.value)}>
              {statusOpts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="branch-users">
          <div className="branch-users-head">
            <div>
              <b>{members.length} user{members.length === 1 ? "" : "s"} assigned</b>
              <small>Assign existing users to this branch.</small>
            </div>
            <button className="primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add user
            </button>
          </div>

          {members.length === 0 ? (
            <p className="muted">No users assigned to this branch yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Role</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((id) => {
                    const u = db.users.find((x) => x.id === id);
                    if (!u) return null;
                    return (
                      <tr key={id}>
                        <td>
                          <b>{u.firstName} {u.lastName}</b>
                        </td>
                        <td className="muted">{u.email}</td>
                        <td className="muted">{u.mobileNo}</td>
                        <td>
                          <Badge status={roleName(db, u.roleId)} />
                        </td>
                        <td>
                          <button className="icon-btn danger-ic" title="Remove" onClick={() => removeUser(id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {adding && (
            <div className="add-users-panel">
              <div className="add-users-head">
                <div>
                  <b>Add users</b>
                  <small>Select users not already assigned to this branch.</small>
                </div>
                <button className="head-icon" onClick={() => { setAdding(false); setPicked([]); }} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              {assignable.length === 0 ? (
                <p className="muted">All users are already assigned to this branch.</p>
              ) : (
                <div className="user-pick-list">
                  {assignable.map((u) => (
                    <label key={u.id} className="check-line">
                      <input
                        type="checkbox"
                        checked={picked.includes(u.id)}
                        onChange={() => setPicked((p) => (p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id]))}
                      />
                      <span>
                        <b>{u.firstName} {u.lastName}</b>
                        <small>{u.email} · {u.branch}</small>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <div className="add-users-actions">
                <button className="secondary" onClick={() => { setAdding(false); setPicked([]); }}>
                  Cancel
                </button>
                <button className="primary" disabled={picked.length === 0} onClick={addUsers}>
                  <Check size={16} /> Add selected ({picked.length})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {formError && <div className="form-error">{formError}</div>}
    </Modal>
  );
}

export const customersCfg: CrudConfig = {
  kind: "customers",
  module: "Customers",
  title: "Customers & contacts",
  subtitle: "Branch-associated customer, source and referral information.",
  action: "New customer",
  singular: "Customer",
  idPrefix: "C-",
  idField: "id",
  searchKeys: ["name", "company", "mobile", "email", "city", "address", "gst", "source", "branches"],
  columns: [
    { key: "name", label: "Contact", main: true, link: { to: "Quotations", by: "customer", getId: (r) => r.code, getLabel: (r) => r.name } },
    { key: "company", label: "Company" },
    { key: "contact", label: "Contact", render: (r) => (<><span>{r.mobile}</span><small>{r.email}</small></>) },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "gst", label: "GST", mono: true },
    { key: "source", label: "Source" },
    { key: "branches", label: "Branches", render: (r) => <span>{(r.branches || []).join(", ")}</span> },
    { key: "count", label: "Quotations", render: (r, db) => <b>{db.quotations.filter((q) => q.customer === r.code).length}</b> },
  ],
  fields: [
    { key: "name", label: "Contact name", type: "text", required: true, placeholder: "e.g. Rajesh Patel" },
    { key: "company", label: "Company", type: "text", required: true, placeholder: "e.g. Orion Manufacturing" },
    { key: "mobile", label: "Mobile", type: "tel", required: true, placeholder: "10-digit mobile number" },
    { key: "email", label: "Email", type: "email", required: true, placeholder: "name@company.example" },
    { key: "address", label: "Address", type: "textarea", placeholder: "Street, area, landmark" },
    { key: "city", label: "City", type: "text", required: true },
    { key: "gst", label: "GST number", type: "text", placeholder: "24AAECA0000A1Z5", validate: (v) => (v.trim().length === 0 ? undefined : v.trim().length !== 15 ? "GST number must be 15 characters" : undefined) },
    { key: "source", label: "Source", type: "select", options: () => sourceOpts },
    { key: "branches", label: "Branches", type: "multiselect", options: (db) => db.branches.map((b) => ({ value: b.name, label: b.name })) },
  ],
  defaults: () => ({ name: "", company: "", mobile: "", email: "", address: "", city: "", gst: "", source: "Direct Client", branches: "" }),
  build: (db, v, id, code) => ({
    id,
    code,
    name: v.name.trim(),
    company: v.company.trim(),
    mobile: v.mobile.trim(),
    email: v.email.trim(),
    address: v.address.trim(),
    city: v.city.trim(),
    gst: v.gst.trim().toUpperCase(),
    branches: v.branches ? v.branches.split(",").map((s) => s.trim()).filter(Boolean) : [],
    source: v.source,
  }),
  emptyTitle: "No customers yet",
  emptyText: "Customers are linked to branches and drive quotations, projects and inspections.",
};

/* Projects (multi-step create/edit: details → surfaces & photos)      */
/* ------------------------------------------------------------------ */

const defaultSurface = (): Surface => ({ id: Date.now(), category: "Micro Cement", finish: "Smooth", shade: "Stone", area: 0, thickness: "2 mm", rate: 185 });
const shadeOpts = ["Stone", "Pearl", "Silver", "Bronze", "Copper", "Linen", "Silk", "Cream", "Terracotta", "Ivory", "Sage", "Slate", "Limestone", "Sienna", "Ochre", "By client spec"];

export function ProjectsPage() {
  const { db, can, rowInScope, branchScope, isAdmin, go, navCtx, clearNav, busy, remove } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<{ t: "none" } | { t: "create" } | { t: "edit"; row: Project } | { t: "view"; row: Project } | { t: "delete"; row: Project }>({ t: "none" });
  const canCreate = can("Projects", "create");
  const canUpdate = can("Projects", "update");
  const canDelete = can("Projects", "delete");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  let rows = db.projects.filter((p) => rowInScope("projects", p));
  if (navCtx) {
    if (navCtx.by === "customer") rows = rows.filter((p) => p.customer === navCtx.id);
    else rows = rows.filter((p) => p.code === navCtx.id);
  }

  const filtered = rows.filter((p) => {
    if (!query) return true;
    const cname = db.customers.find((c) => c.code === p.customer)?.name ?? "";
    return [p.id, p.name, p.type, p.stage, p.status, cname].join(" ").toLowerCase().includes(query.toLowerCase());
  });

  const cname = (id: string) => db.customers.find((c) => c.code === id)?.name ?? id;
  const areaOf = (p: Project) => p.surfaces.reduce((s, x) => s + x.area, 0);

  const ctx = navCtx;
  const focusRow = ctx ? db.projects.find((p) => p.code === ctx.id) : undefined;
  const focusName = ctx ? (focusRow ? (ctx.by === "customer" ? cname(ctx.id) : focusRow.name) : "") : "";

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Projects</h2>
          <p>Project details with surface / area breakdown and site photos to capture.</p>
        </div>
        {canCreate && (
          <button className="primary" onClick={() => setMode({ t: "create" })}>
            <Plus size={16} /> New project
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="readonly-note">
          <ShieldCheck size={14} /> {branchScope !== "All branches" ? `Branch scope — ${branchScope} projects only.` : "Assigned permission set applies."}
          {!canCreate && " · Read-only — no create access on this module."}
        </div>
      )}

      {ctx && focusRow && (
        <div className="focus-banner">
          <Eye size={14} /> {ctx.by === "customer" ? "Showing projects for customer" : "Viewing project"} <b>{focusName}</b>
          {!ctx.by && <span className="mono">({focusRow.code})</span>}
          <button onClick={clearNav}>
            <X size={13} /> Clear
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects…" />
        </div>
        <span className="count">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {loading ? (
        <SkeletonTable cols={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "No matching projects" : "No projects yet"}
          text={query ? "Try adjusting your search." : "Create projects against customers to track stage, site and billing context."}
          action={canCreate && !query ? "New project" : undefined}
          onAction={() => setMode({ t: "create" })}
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Expected completion</th>
                <th>Area (sq.ft.)</th>
                <th>Photos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const focused = navCtx && row.code === navCtx.id;
                return (
                  <tr key={row.id} className={focused ? "row-focus" : ""}>
                    <td>
                      <span className="link-cell" onClick={() => go("Quotations", { id: row.code, by: "project" })}>
                        <b>{row.name}</b>
                        <ArrowRight size={12} />
                      </span>
                    </td>
                    <td>
                      <span className="link-cell" onClick={() => go("Customers", { id: row.customer, by: "id" })}>
                        {cname(row.customer)}
                        <ArrowRight size={12} />
                      </span>
                    </td>
                    <td>{row.type}</td>
                    <td>{row.stage}</td>
                    <td><Badge status={row.status} /></td>
                    <td>{fmtDate(row.expected)}</td>
                    <td>{row.surfaces.reduce((s, x) => s + x.area, 0).toLocaleString("en-IN")}</td>
                    <td>{row.photos.length > 0 ? <span className="photo-count"><Camera size={14} /> {row.photos.length}</span> : <span className="muted">—</span>}</td>
                    <td className="table-actions">
                      <button className="icon-btn" title="View" onClick={() => setMode({ t: "view", row })}>
                        <Eye size={14} />
                      </button>
                      {canUpdate && (
                        <button className="icon-btn" title="Edit" onClick={() => setMode({ t: "edit", row })}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && (
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

      {(mode.t === "create" || mode.t === "edit") && (
        <ProjectModal
          editing={mode.t === "edit" ? mode.row : null}
          onClose={() => setMode({ t: "none" })}
        />
      )}

      {mode.t === "view" && <ProjectDetail row={mode.row} onClose={() => setMode({ t: "none" })} />}

      {mode.t === "delete" && (
        <ConfirmModal
          title="Delete project"
          text="This action permanently removes this project, its surface/area details and site photos."
          busy={busy?.kind === "projects"}
          onCancel={() => setMode({ t: "none" })}
          onConfirm={async () => {
            await remove("projects", mode.row.id, "Project");
            setMode({ t: "none" });
          }}
          detail={
            <>
              <span>Project</span>
              <b>{mode.row.name}</b>
              <span>Customer</span>
              <b>{cname(mode.row.customer)}</b>
              <span>Coverage</span>
              <b>{areaOf(mode.row).toLocaleString("en-IN")} sq.ft.</b>
            </>
          }
        />
      )}
    </section>
  );
}

function ProjectModal({ editing, onClose }: { editing: Project | null; onClose: () => void }) {
  const { db, busy, create, update, isAdmin, rowInScope } = useApp();
  const scopeCustomers = (list: typeof db.customers) => (isAdmin ? list : list.filter((c) => rowInScope("customers", c)));
  const [step, setStep] = useState(1);
  const [name, setName] = useState(editing?.name ?? "");
  const [custId, setCustId] = useState(editing?.customer ?? "");
  const [ptype, setPtype] = useState<ProjectType>(editing?.type ?? "Commercial");
  const [pstage, setPstage] = useState(editing?.stage ?? "Design");
  const [expected, setExpected] = useState(editing?.expected ?? "");
  const [status, setStatus] = useState(editing?.status ?? "Active");
  const [siteAddress, setSiteAddress] = useState(editing?.siteAddress ?? "");
  const [siteCity, setSiteCity] = useState(editing?.siteCity ?? "");
  const [siteState, setSiteState] = useState(editing?.siteState ?? "");
  const [sitePincode, setSitePincode] = useState(editing?.sitePincode ?? "");
  const [billingAddress, setBillingAddress] = useState(editing?.billingAddress ?? "");
  const [billingCity, setBillingCity] = useState(editing?.billingCity ?? "");
  const [billingState, setBillingState] = useState(editing?.billingState ?? "");
  const [billingPincode, setBillingPincode] = useState(editing?.billingPincode ?? "");
  const [surfaces, setSurfaces] = useState<Surface[]>(editing?.surfaces.length ? editing.surfaces : [defaultSurface()]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>(editing?.photos ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const saving = busy?.kind === "projects";
  const previewId = editing ? editing.code : nextCode(db, "projects", "PRJ-");

  const clearErr = (k: string) => {
    if (errors[k]) {
      const n = { ...errors };
      delete n[k];
      setErrors(n);
    }
    setFormError("");
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Project name is required";
    if (!custId) e.customer = "Customer is required";
    if (!expected) e.expected = "Expected completion is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    surfaces.forEach((s, i) => {
      if (!s.area || s.area <= 0) e["area" + i] = "Area must be greater than 0";
      if (!s.rate || s.rate <= 0) e["rate" + i] = "Rate must be greater than 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep1()) {
      setFormError("");
      setStep(2);
    } else {
      setFormError("Please fix the highlighted fields.");
    }
  };

  const save = async () => {
    if (!validateStep2()) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    const id = editing ? editing.id : nextId(db, "projects");
    const code = editing ? editing.code : previewId;
    const row: Project = {
      id,
      code,
      name: name.trim(),
      customer: custId,
      type: ptype,
      stage: pstage,
      status,
      expected,
      siteAddress: siteAddress.trim(),
      siteCity: siteCity.trim(),
      siteState: siteState.trim(),
      sitePincode: sitePincode.trim(),
      billingAddress: billingAddress.trim(),
      billingCity: billingCity.trim(),
      billingState: billingState.trim(),
      billingPincode: billingPincode.trim(),
      surfaces: surfaces.map((s) => ({ ...s })),
      photos,
      branches: db.customers.find((c) => c.code === custId)?.branches || [],
      history: editing?.history || [],
    };
    if (editing) await update("projects", id, row, "Project");
    else await create("projects", row, "Project");
    onClose();
  };

  const addSurface = () => setSurfaces((s) => [...s, defaultSurface()]);
  const removeSurface = (id: number) => setSurfaces((s) => s.filter((x) => x.id !== id));
  const updateSurf = (id: number, k: keyof Surface, v: any) => setSurfaces((s) => s.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach((f) => {
      const fr = new FileReader();
      fr.onload = () => {
        setPhotos((p) => [...p, { id: Date.now() + Math.random(), name: f.name, dataUrl: String(fr.result) }]);
      };
      fr.readAsDataURL(f);
    });
    e.target.value = "";
  };
  const removePhoto = (id: number) => setPhotos((p) => p.filter((x) => x.id !== id));

  return (
    <div className="overlay">
      <div className="quote-modal">
        <div className="wizard-head">
          <div>
            <span>{editing ? "EDIT PROJECT" : "NEW PROJECT"}</span>
            <h2>{editing ? "Edit project" : "Create project"}</h2>
          </div>
          <button className="head-icon" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="steps">
          {["Project details", "Surfaces & photos"].map((x, i) => (
            <button key={x} className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""} onClick={() => step > i + 1 && setStep(i + 1)}>
              <b>{step > i + 1 ? <Check size={14} /> : i + 1}</b>
              {x}
            </button>
          ))}
        </div>
        <div className="wizard-body">
          {formError && (
            <div className="form-error">
              <AlertTriangle size={14} />
              {formError}
            </div>
          )}

          {step === 1 && (
            <div>
              <h3>Project details</h3>
              <p>Capture the customer, site and billing context for this project.</p>
              <div className="form-grid">
                <div className={"form-field" + (errors.name ? " invalid" : "")}>
                  <label>Project name<span className="req">*</span></label>
                  <input aria-label="Project name" value={name} onChange={(e) => { setName(e.target.value); clearErr("name"); }} placeholder="e.g. Corporate Office" />
                  {errors.name && <span className="err-msg">{errors.name}</span>}
                </div>
                <div className={"form-field" + (errors.customer ? " invalid" : "")}>
                  <label>Customer<span className="req">*</span></label>
                  <select aria-label="Customer" value={custId} onChange={(e) => { setCustId(e.target.value); clearErr("customer"); }}>
                    <option value="">Select customer…</option>
                    {scopeCustomers(db.customers).map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
                  </select>
                  {errors.customer && <span className="err-msg">{errors.customer}</span>}
                </div>
                <div className="form-field"><label>Project type</label><select aria-label="Project type" value={ptype} onChange={(e) => setPtype(e.target.value as ProjectType)}>{ProjectType.map((o) => <option key={o}>{o}</option>)}</select></div>
                <div className="form-field"><label>Stage</label><select aria-label="Stage" value={pstage} onChange={(e) => setPstage(e.target.value)}>{stageOpts.map((o) => <option key={o.value}>{o.value}</option>)}</select></div>
                <div className={"form-field" + (errors.expected ? " invalid" : "")}>
                  <label>Expected completion<span className="req">*</span></label>
                  <input aria-label="Expected completion" type="date" value={expected} onChange={(e) => { setExpected(e.target.value); clearErr("expected"); }} />
                  {errors.expected && <span className="err-msg">{errors.expected}</span>}
                </div>
                <div className="form-field"><label>Status</label><select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as Project["status"])}>{projectStatusOpts.map((o) => <option key={o.value}>{o.value}</option>)}</select></div>
                <div className="form-field"><label>Site address<span className="req">*</span></label><input aria-label="Site address" value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="Street, area, landmark" /></div>
                <div className="form-field"><label>Site city<span className="req">*</span></label><input aria-label="Site city" value={siteCity} onChange={(e) => setSiteCity(e.target.value)} placeholder="City" /></div>
                <div className="form-field"><label>Site state<span className="req">*</span></label><input aria-label="Site state" value={siteState} onChange={(e) => setSiteState(e.target.value)} placeholder="State" /></div>
                <div className="form-field"><label>Site pincode<span className="req">*</span></label><input aria-label="Site pincode" value={sitePincode} onChange={(e) => setSitePincode(e.target.value)} placeholder="6-digit pincode" /></div>
                <div className="form-field"><label>Billing address</label><input aria-label="Billing address" value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Street, area, landmark" /></div>
                <div className="form-field"><label>Billing city</label><input aria-label="Billing city" value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder="City" /></div>
                <div className="form-field"><label>Billing state</label><input aria-label="Billing state" value={billingState} onChange={(e) => setBillingState(e.target.value)} placeholder="State" /></div>
                <div className="form-field"><label>Billing pincode</label><input aria-label="Billing pincode" value={billingPincode} onChange={(e) => setBillingPincode(e.target.value)} placeholder="6-digit pincode" /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="wizard-section-head">
                <div><h3>Surfaces & area</h3><p>Add the surface / area details to be covered on this project.</p></div>
                <button className="secondary" onClick={addSurface}><Plus size={15} /> Add surface</button>
              </div>
              {surfaces.map((s, i) => (
                <div className="surface-card" key={s.id}>
                  <div className="surface-top">
                    <b>Surface {i + 1}</b>
                    <button className="icon-btn" onClick={() => removeSurface(s.id)} disabled={surfaces.length === 1}><Trash2 size={16} /></button>
                  </div>
                  <div className="form-grid">
                    <div className="form-field"><label>Product category</label><select aria-label="Product category" value={s.category} onChange={(e) => updateSurf(s.id, "category", e.target.value)}>{categoryOpts.map((o) => <option key={o.value}>{o.value}</option>)}</select></div>
                    <div className="form-field"><label>Texture / finish</label><select aria-label="Texture / finish" value={s.finish} onChange={(e) => updateSurf(s.id, "finish", e.target.value)}>{finishOpts.map((o) => <option key={o.value}>{o.value}</option>)}</select></div>
                    <div className="form-field"><label>Shade</label><select aria-label="Shade" value={s.shade} onChange={(e) => updateSurf(s.id, "shade", e.target.value)}>{shadeOpts.map((x) => <option key={x}>{x}</option>)}</select></div>
                    <div className={"form-field" + (errors["area" + i] ? " invalid" : "")}><label>Area (sq.ft.)<span className="req">*</span></label><input aria-label="Area (sq.ft.)" type="number" value={s.area} onChange={(e) => { updateSurf(s.id, "area", Number(e.target.value)); clearErr("area" + i); }} />{errors["area" + i] && <span className="err-msg">{errors["area" + i]}</span>}</div>
                    <div className="form-field"><label>Thickness</label><select aria-label="Thickness" value={s.thickness} onChange={(e) => updateSurf(s.id, "thickness", e.target.value)}>{["1 mm", "2 mm", "3 mm", "5 mm"].map((x) => <option key={x}>{x}</option>)}</select></div>
                    <div className={"form-field" + (errors["rate" + i] ? " invalid" : "")}><label>Rate / sq.ft.<span className="req">*</span></label><input aria-label="Rate / sq.ft." type="number" value={s.rate} onChange={(e) => { updateSurf(s.id, "rate", Number(e.target.value)); clearErr("rate" + i); }} />{errors["rate" + i] && <span className="err-msg">{errors["rate" + i]}</span>}</div>
                  </div>
                </div>
              ))}

              <div className="wizard-section-head" style={{ marginTop: 22 }}>
                <div><h3>Site photos</h3><p>Upload reference photos to capture — previews appear below.</p></div>
                <button className="secondary" onClick={() => fileRef.current?.click()}><ImagePlus size={15} /> Add photo</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} aria-label="Add photo" />
              {photos.length === 0 ? (
                <button className="photo-drop" onClick={() => fileRef.current?.click()}>
                  <ImagePlus size={20} />
                  <span>Click to add photos</span>
                  <small>JPG / PNG previews are kept locally in this prototype</small>
                </button>
              ) : (
                <div className="photo-grid">
                  {photos.map((p) => (
                    <div className="photo-card" key={p.id}>
                      <img src={p.dataUrl} alt={p.name} />
                      <button className="photo-del" onClick={() => removePhoto(p.id)} aria-label={`Remove ${p.name}`}><X size={13} /></button>
                    </div>
                  ))}
                  <button className="photo-add" onClick={() => fileRef.current?.click()}><ImagePlus size={18} /><span>Add photo</span></button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="wizard-foot">
          <button className="secondary" disabled={saving} onClick={step === 1 ? onClose : () => { setErrors({}); setFormError(""); setStep(1); }}>
            {step === 1 ? "Cancel" : <><ArrowLeft size={15} /> Back</>}
          </button>
          {step === 1 ? (
            <button className="primary" onClick={next}>Save & continue <ArrowRight size={15} /></button>
          ) : (
            <button className="primary" disabled={saving} onClick={save}>
              {saving ? <><Spinner /> Saving…</> : <><Check size={16} /> {editing ? "Save changes" : "Save project"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({ row, onClose }: { row: Project; onClose: () => void }) {
  const { db } = useApp();
  const [zoom, setZoom] = useState<ProjectPhoto | null>(null);
  const cname = (id: string) => db.customers.find((c) => c.code === id)?.name ?? id;
  const totalArea = row.surfaces.reduce((s, x) => s + x.area, 0);
  const totalAmount = row.surfaces.reduce((s, x) => s + x.area * x.rate, 0);

  return (
    <Modal title={row.name} subtitle={`${row.code} · ${cname(row.customer)}`} onClose={onClose} size="wide">
      <div className="detail-grid">
        <div className="detail-block">
          <h4>Project details</h4>
          <div className="detail-rows">
            <div><span>Type</span><b>{row.type}</b></div>
            <div><span>Stage</span><b>{row.stage}</b></div>
            <div><span>Status</span><b><Badge status={row.status} /></b></div>
            <div><span>Expected completion</span><b>{fmtDate(row.expected)}</b></div>
            <div><span>Site address</span><b>{row.siteAddress || "—"}</b></div>
            <div><span>Site city</span><b>{row.siteCity || "—"}</b></div>
            <div><span>Site state</span><b>{row.siteState || "—"}</b></div>
            <div><span>Site pincode</span><b>{row.sitePincode || "—"}</b></div>
            <div><span>Billing address</span><b>{row.billingAddress || "—"}</b></div>
            <div><span>Billing city</span><b>{row.billingCity || "—"}</b></div>
            <div><span>Billing state</span><b>{row.billingState || "—"}</b></div>
            <div><span>Billing pincode</span><b>{row.billingPincode || "—"}</b></div>
          </div>
        </div>
        <div className="detail-block">
          <h4>Surface / area details</h4>
          {row.surfaces.length === 0 ? (
            <p className="muted">No surfaces recorded.</p>
          ) : (
            <table>
              <thead><tr><th>Surface</th><th>Area</th><th>Thickness</th><th>Rate</th><th>Amount</th></tr></thead>
              <tbody>
                {row.surfaces.map((s) => (
                  <tr key={s.id}>
                    <td><b>{s.category}</b><small>{s.finish} · {s.shade}</small></td>
                    <td>{s.area.toLocaleString("en-IN")} sq.ft.</td>
                    <td>{s.thickness}</td>
                    <td>{money(s.rate)}</td>
                    <td>{money(s.area * s.rate)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}><b>Total — {totalArea.toLocaleString("en-IN")} sq.ft.</b></td>
                  <td colSpan={3}><b>{money(totalAmount)}</b></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
        <div className="detail-block">
          <h4>Photos to capture</h4>
          {row.photos.length === 0 ? (
            <p className="muted">No photos captured yet.</p>
          ) : (
            <div className="photo-grid">
              {row.photos.map((p) => (
                <div className="photo-card" key={p.id}>
                  <img src={p.dataUrl} alt={p.name} onClick={() => setZoom(p)} />
                  <small className="photo-name">{p.name}</small>
                </div>
              ))}
            </div>
          )}
        </div>
        {row.history && row.history.length > 0 && (
          <div className="detail-block">
            <h4>Stage & status history</h4>
            <table>
              <thead><tr><th>Date</th><th>Stage</th><th>Status</th><th>Note</th><th>User</th></tr></thead>
              <tbody>
                {row.history.slice().reverse().map((h) => (
                  <tr key={h.id}>
                    <td>{fmtDate(h.date)}</td>
                    <td>{h.stage}</td>
                    <td><Badge status={h.status} /></td>
                    <td>{h.note || "—"}</td>
                    <td>{h.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {zoom && (
        <div className="photo-lightbox" onClick={() => setZoom(null)}>
          <img src={zoom.dataUrl} alt={zoom.name} />
        </div>
      )}
    </Modal>
  );
}

function ProductModal({ config, initial, row, onClose }: { config: CrudConfig; initial: Record<string, string>; row: Product | null; onClose: () => void }) {
  const { db, busy, create, update } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState<ProductCategory>(initial.category as ProductCategory || "Micro Concrete");
  const [material, setMaterial] = useState(initial.material);
  const [textures, setTextures] = useState(initial.textures);
  const [finishes, setFinishes] = useState(initial.finishes);
  const [shades, setShades] = useState(initial.shades);
  const [textureImage, setTextureImage] = useState(initial.textureImage);
  const [finishImage, setFinishImage] = useState(initial.finishImage);
  const [shadeImages, setShadeImages] = useState(initial.shadeImages);
  const [optionalItems, setOptionalItems] = useState(initial.optionalItems);
  const [hsn, setHsn] = useState(initial.hsn);
  const [gst, setGst] = useState(initial.gst);
  const [wastage, setWastage] = useState(initial.wastage);
  const [rateSlabs, setRateSlabs] = useState<ProductRateSlab[]>(row?.rateSlabs?.length ? [...row.rateSlabs] : [{ finish: "", thickness: "", materialRate: 0, labourRate: 0 }]);
  const [transportSlabs, setTransportSlabs] = useState<{ distance: string; rate: number }[]>(row?.transportationSlabs?.length ? [...row.transportationSlabs] : [{ distance: "", rate: 0 }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const editing = Boolean(row);
  const saving = busy?.kind === "products";

  const clearErr = (k: string) => {
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
    setFormError("");
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Product name is required";
    if (!material.trim()) e.material = "Material is required";
    if (!hsn.trim()) e.hsn = "HSN code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep1()) { setFormError(""); setStep(2); }
    else setFormError("Please fix the highlighted fields.");
  };

  const addRateSlab = () => setRateSlabs((s) => [...s, { finish: "", thickness: "", materialRate: 0, labourRate: 0 }]);
  const removeRateSlab = (i: number) => setRateSlabs((s) => s.filter((_, idx) => idx !== i));
  const updateRateSlab = (i: number, k: keyof ProductRateSlab, v: any) => setRateSlabs((s) => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

  const addTransportSlab = () => setTransportSlabs((s) => [...s, { distance: "", rate: 0 }]);
  const removeTransportSlab = (i: number) => setTransportSlabs((s) => s.filter((_, idx) => idx !== i));
  const updateTransportSlab = (i: number, k: "distance" | "rate", v: any) => setTransportSlabs((s) => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x));

  const save = async () => {
    const id = editing ? row!.id : nextId(db, "products");
    const code = editing ? row!.code : nextCode(db, "products", "P-");
    const now = new Date().toISOString().split("T")[0];
    const historyEntry: ProductHistoryEntry = {
      id: Date.now(),
      date: now,
      field: editing ? "update" : "create",
      oldValue: "",
      newValue: `${name} created`,
      user: "System Admin",
    };
    const productRow: Product = {
      id,
      code,
      name: name.trim(),
      category,
      material: material.trim(),
      textures: textures ? textures.split(",").map((s) => s.trim()).filter(Boolean) : [],
      finishes: finishes ? finishes.split(",").map((s) => s.trim()).filter(Boolean) : [],
      shades: shades ? shades.split(",").map((s) => s.trim()).filter(Boolean) : [],
      textureImage: textureImage.trim(),
      finishImage: finishImage.trim(),
      shadeImages: shadeImages ? shadeImages.split(",").map((s) => s.trim()).filter(Boolean) : [],
      rateSlabs: rateSlabs.filter((s) => s.finish && s.thickness && s.materialRate > 0),
      optionalItems: optionalItems ? optionalItems.split(",").map((s) => s.trim()).filter(Boolean) : [],
      hsn: hsn.trim(),
      gst: Number(gst || 0),
      wastage: Number(wastage || 0),
      transportationSlabs: transportSlabs.filter((s) => s.distance && s.rate > 0),
      history: editing ? [...(row!.history || []), historyEntry] : [historyEntry],
    };
    if (editing) await update("products", id, productRow, "Product");
    else await create("products", productRow, "Product");
    onClose();
  };

  return (
    <Modal title={editing ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`} subtitle={`${config.singular} · ${config.idPrefix}${editing ? row!.id : nextId(db, "products")}`} onClose={onClose} size="wide" footer={
      step === 1 ? (
        <>
          <button className="secondary" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="primary" onClick={next}>Save & continue <ArrowRight size={15} /></button>
        </>
      ) : (
        <>
          <button className="secondary" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</button>
          <button className="primary" disabled={saving} onClick={save}>{saving ? <><Spinner /> Saving…</> : <><Check size={16} /> {editing ? "Save changes" : "Save product"}</>}</button>
        </>
      )
    }>
      <div className="steps">
        <button className={step === 1 ? "current" : "done"} onClick={() => setStep(1)}><b>{step > 1 ? <Check size={14} /> : 1}</b> Basic details</button>
        <button className={step === 2 ? "current" : ""} onClick={() => step === 2 && setStep(2)}><b>2</b> Rate slabs</button>
        <button className={step === 3 ? "current" : ""} onClick={() => step === 3 && setStep(3)}><b>3</b> Transport & optional</button>
      </div>

      {formError && <div className="form-error"><AlertTriangle size={14} />{formError}</div>}

      {step === 1 && (
        <div className="form-grid">
          <div className={"form-field" + (errors.name ? " invalid" : "")}><label>Product name<span className="req">*</span></label><input aria-label="Product name" value={name} onChange={(e) => { setName(e.target.value); clearErr("name"); }} placeholder="e.g. Micro Cement" />{errors.name && <span className="err-msg">{errors.name}</span>}</div>
          <div className="form-field"><label>Category</label><select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>{ProductCategory.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
          <div className={"form-field" + (errors.material ? " invalid" : "")}><label>Material<span className="req">*</span></label><input aria-label="Material" value={material} onChange={(e) => { setMaterial(e.target.value); clearErr("material"); }} placeholder="e.g. Cementitious" />{errors.material && <span className="err-msg">{errors.material}</span>}</div>
          <div className="form-field"><label>Textures (comma separated)</label><input aria-label="Textures" value={textures} onChange={(e) => setTextures(e.target.value)} placeholder="e.g. Smooth" /></div>
          <div className="form-field"><label>Finishes (comma separated)</label><input aria-label="Finishes" value={finishes} onChange={(e) => setFinishes(e.target.value)} placeholder="e.g. Smooth" /></div>
          <div className="form-field"><label>Shades (comma separated)</label><input aria-label="Shades" value={shades} onChange={(e) => setShades(e.target.value)} placeholder="e.g. Stone, Pearl" /></div>
          <div className="form-field"><label>Texture image URL</label><input aria-label="Texture image URL" value={textureImage} onChange={(e) => setTextureImage(e.target.value)} placeholder="https://..." /></div>
          <div className="form-field"><label>Finish image URL</label><input aria-label="Finish image URL" value={finishImage} onChange={(e) => setFinishImage(e.target.value)} placeholder="https://..." /></div>
          <div className="form-field"><label>Shade images URLs (comma separated)</label><input aria-label="Shade images URLs" value={shadeImages} onChange={(e) => setShadeImages(e.target.value)} placeholder="https://..." /></div>
          <div className="form-field"><label>Optional items</label><select aria-label="Optional items" multiple value={optionalItems ? optionalItems.split(",").map((s) => s.trim()) : []} onChange={(e) => { const arr = Array.from(e.target.selectedOptions).map((o) => o.value); setOptionalItems(arr.join(",")); }}>{OptionalItemMaster.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
          <div className={"form-field" + (errors.hsn ? " invalid" : "")}><label>HSN code<span className="req">*</span></label><input aria-label="HSN code" value={hsn} onChange={(e) => { setHsn(e.target.value); clearErr("hsn"); }} placeholder="3214" />{errors.hsn && <span className="err-msg">{errors.hsn}</span>}</div>
          <div className="form-field"><label>GST %</label><input aria-label="GST %" type="number" value={gst} onChange={(e) => setGst(e.target.value)} min="0" max="28" /></div>
          <div className="form-field"><label>Wastage %</label><input aria-label="Wastage %" type="number" value={wastage} onChange={(e) => setWastage(e.target.value)} min="0" max="20" /></div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="wizard-section-head"><div><h3>Rate slabs (by finish & thickness)</h3><p>Define material and labour rates for each finish/thickness combination.</p></div><button className="secondary" onClick={addRateSlab}><Plus size={15} /> Add rate slab</button></div>
          {rateSlabs.map((s, i) => (
            <div className="surface-card" key={i}>
              <div className="surface-top"><b>Rate slab {i + 1}</b><button className="icon-btn" onClick={() => removeRateSlab(i)} disabled={rateSlabs.length === 1}><Trash2 size={16} /></button></div>
              <div className="form-grid">
                <div className="form-field"><label>Finish</label><input aria-label="Finish" value={s.finish} onChange={(e) => updateRateSlab(i, "finish", e.target.value)} placeholder="e.g. Smooth" /></div>
                <div className="form-field"><label>Thickness</label><input aria-label="Thickness" value={s.thickness} onChange={(e) => updateRateSlab(i, "thickness", e.target.value)} placeholder="e.g. 2 mm" /></div>
                <div className="form-field"><label>Material rate / sq.ft.</label><input aria-label="Material rate" type="number" value={s.materialRate} onChange={(e) => updateRateSlab(i, "materialRate", Number(e.target.value))} min="0" /></div>
                <div className="form-field"><label>Labour rate / sq.ft.</label><input aria-label="Labour rate" type="number" value={s.labourRate} onChange={(e) => updateRateSlab(i, "labourRate", Number(e.target.value))} min="0" /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div>
          <div className="wizard-section-head"><div><h3>Transportation slabs</h3><p>Define transport cost by distance range.</p></div><button className="secondary" onClick={addTransportSlab}><Plus size={15} /> Add slab</button></div>
          {transportSlabs.map((s, i) => (
            <div className="surface-card" key={i}>
              <div className="surface-top"><b>Transport slab {i + 1}</b><button className="icon-btn" onClick={() => removeTransportSlab(i)} disabled={transportSlabs.length === 1}><Trash2 size={16} /></button></div>
              <div className="form-grid">
                <div className="form-field"><label>Distance range</label><input aria-label="Distance" value={s.distance} onChange={(e) => updateTransportSlab(i, "distance", e.target.value)} placeholder="e.g. 0-50 km" /></div>
                <div className="form-field"><label>Rate / sq.ft.</label><input aria-label="Transport rate" type="number" value={s.rate} onChange={(e) => updateTransportSlab(i, "rate", Number(e.target.value))} min="0" /></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export const productsCfg: CrudConfig = {
  kind: "products",
  module: "Products",
  title: "Product library & rate master",
  subtitle: "Finishes, shades, rates, labour, wastage, HSN/GST and rate history.",
  action: "Add product",
  singular: "Product",
  idPrefix: "P-",
  idField: "id",
  searchKeys: ["name", "category", "material", "hsn"],
  columns: [
    { key: "name", label: "Product", main: true },
    { key: "category", label: "Category" },
    { key: "material", label: "Material" },
    { key: "finishes", label: "Finishes", render: (r) => <span>{(r.finishes || []).join(", ")}</span> },
    { key: "shades", label: "Shades", render: (r) => <span>{(r.shades || []).join(", ")}</span> },
    { key: "optionalItems", label: "Optional items", render: (r) => <span>{(r.optionalItems || []).join(", ")}</span> },
    { key: "wastage", label: "Wastage %", render: (r) => r.wastage + "%" },
    { key: "gst", label: "GST %", render: (r) => r.gst + "%" },
  ],
  fields: [
    { key: "name", label: "Product name", type: "text", required: true },
    { key: "category", label: "Category", type: "select", required: true, options: () => ProductCategory.map((c) => ({ value: c, label: c })) },
    { key: "material", label: "Material", type: "text", required: true, placeholder: "e.g. Cementitious" },
    { key: "textures", label: "Textures (comma separated)", type: "text", placeholder: "e.g. Smooth" },
    { key: "finishes", label: "Finishes (comma separated)", type: "text", placeholder: "e.g. Smooth" },
    { key: "shades", label: "Shades (comma separated)", type: "text", placeholder: "e.g. Stone, Pearl" },
    { key: "textureImage", label: "Texture image URL", type: "text", placeholder: "https://..." },
    { key: "finishImage", label: "Finish image URL", type: "text", placeholder: "https://..." },
    { key: "shadeImages", label: "Shade images URLs (comma separated)", type: "text", placeholder: "https://..." },
    { key: "optionalItems", label: "Optional items", type: "multiselect", options: () => OptionalItemMaster.map((o) => ({ value: o, label: o })) },
    { key: "hsn", label: "HSN code", type: "text", required: true },
    { key: "gst", label: "GST %", type: "number", min: 0, max: 28 },
    { key: "wastage", label: "Wastage %", type: "number", min: 0, max: 20 },
  ],
  defaults: () => ({ name: "", category: "Micro Concrete", material: "", textures: "", finishes: "", shades: "", textureImage: "", finishImage: "", shadeImages: "", optionalItems: "", hsn: "3214", gst: "18", wastage: "5" }),
  build: (db, v, id, code) => ({
    id,
    code,
    name: v.name.trim(),
    category: v.category,
    material: v.material.trim(),
    textures: v.textures ? v.textures.split(",").map((s) => s.trim()).filter(Boolean) : [],
    finishes: v.finishes ? v.finishes.split(",").map((s) => s.trim()).filter(Boolean) : [],
    shades: v.shades ? v.shades.split(",").map((s) => s.trim()).filter(Boolean) : [],
    textureImage: v.textureImage.trim(),
    finishImage: v.finishImage.trim(),
    shadeImages: v.shadeImages ? v.shadeImages.split(",").map((s) => s.trim()).filter(Boolean) : [],
    rateSlabs: [],
    optionalItems: v.optionalItems ? v.optionalItems.split(",").map((s) => s.trim()).filter(Boolean) : [],
    hsn: v.hsn.trim(),
    gst: Number(v.gst || 0),
    wastage: Number(v.wastage || 0),
    transportationSlabs: [],
    history: [],
  }),
  emptyTitle: "No products yet",
  emptyText: "Add products and rate master entries used by the quotation builder.",
  form: (props) => <ProductModal {...props} />,
};

export const inspectionsCfg: CrudConfig = {
  kind: "inspections",
  module: "Inspections",
  title: "Inspections",
  subtitle: "Inspection activities supporting quotation and quality traceability.",
  action: "New inspection",
  singular: "Inspection",
  idPrefix: "INS-",
  idField: "id",
  searchKeys: ["activity", "status", "date"],
  filter: { key: "status", label: "Status", all: "All statuses", options: () => inspectionStatusOpts },
  columns: [
    { key: "id", label: "Inspection", main: true, mono: true },
    { key: "activity", label: "Activity" },
    { key: "customer", label: "Customer", link: { to: "Customers", getId: (r) => r.customer, getLabel: (r, db) => customerLabel(db, r.customer) } },
    { key: "branches", label: "Branches", render: (r) => <span>{(r.branches || []).join(", ")}</span> },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "date", label: "Date", render: (r) => fmtDate(r.date) },
  ],
  fields: [
    { key: "activity", label: "Activity", type: "text", required: true, placeholder: "e.g. Surface finish inspection" },
    { key: "customer", label: "Customer", type: "select", required: true, options: (db) => db.customers.map((c) => ({ value: c.code, label: c.name })) },
    { key: "status", label: "Status", type: "select", options: () => inspectionStatusOpts },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "notes", label: "Notes", type: "textarea", span: 2 },
    { key: "branches", label: "Branches", type: "multiselect", options: (db) => db.branches.map((b) => ({ value: b.name, label: b.name })) },
  ],
  defaults: () => ({ activity: "", customer: "", status: "Open", date: "", notes: "", branches: "" }),
  build: (db, v, id, code) => ({
    id,
    code,
    activity: v.activity.trim(),
    customer: v.customer,
    status: v.status,
    date: v.date,
    notes: v.notes.trim(),
    branches: v.branches ? v.branches.split(",").map((s) => s.trim()).filter(Boolean) : [],
  }),
  emptyTitle: "No inspections yet",
  emptyText: "Record inspection activities to support quotation and quality traceability.",
};

export const documentsCfg: CrudConfig = {
  kind: "documents",
  module: "Documents",
  title: "Quotation documents & templates",
  subtitle: "Controlled documents, T&C templates and customer-facing output.",
  action: "Upload document",
  singular: "Document",
  idPrefix: "DOC-",
  idField: "id",
  searchKeys: ["title", "type", "version", "status"],
  filter: { key: "status", label: "Status", all: "All statuses", options: () => docStatusOpts },
  columns: [
    { key: "title", label: "Title", main: true },
    { key: "type", label: "Type" },
    { key: "version", label: "Version", mono: true },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
    { key: "updated", label: "Updated", render: (r) => fmtDate(r.updated) },
    { key: "size", label: "Size" },
  ],
  fields: [
    { key: "title", label: "Title", type: "text", required: true },
    { key: "type", label: "Type", type: "select", options: () => docTypeOpts },
    { key: "version", label: "Version", type: "text", required: true, placeholder: "1.0" },
    { key: "status", label: "Status", type: "select", options: () => docStatusOpts },
    { key: "updated", label: "Updated", type: "date", required: true },
    { key: "size", label: "Size", type: "text", placeholder: "e.g. 48 KB" },
  ],
  defaults: () => ({ title: "", type: "Policy", version: "1.0", status: "Draft", updated: "", size: "" }),
  build: (db, v, id, code) => ({
    id,
    code,
    title: v.title.trim(),
    type: v.type,
    version: v.version.trim(),
    status: v.status,
    updated: v.updated,
    size: v.size.trim(),
  }),
  emptyTitle: "No documents yet",
  emptyText: "Upload controlled documents and templates used across the quotation workflow.",
};

export const followupsCfg: CrudConfig = {
  kind: "followups",
  module: "FollowUps",
  title: "Follow-ups & reminders",
  subtitle: "Quotation follow-up dates, notes and dashboard reminders.",
  action: "Schedule follow-up",
  singular: "Follow-up",
  idPrefix: "FU-",
  idField: "id",
  searchKeys: ["purpose", "owner", "status"],
  filter: { key: "status", label: "Status", all: "All statuses", options: () => fuStatusOpts },
  columns: [
    { key: "date", label: "Date", main: true, render: (r) => fmtDate(r.date) },
    { key: "quotation", label: "Quotation", mono: true, link: { to: "Quotations", getId: (r) => r.quotation, getLabel: (r) => r.quotation } },
    {
      key: "customer",
      label: "Customer",
      link: {
        to: "Customers",
        getId: (r, db) => db.quotations.find((q) => q.code === r.quotation)?.customer ?? "",
        getLabel: (r, db) => customerLabel(db, db.quotations.find((q) => q.code === r.quotation)?.customer ?? ""),
      },
    },
    { key: "branches", label: "Branches", render: (r) => <span>{(r.branches || []).join(", ")}</span> },
    { key: "purpose", label: "Purpose" },
    { key: "owner", label: "Owner" },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
  ],
  fields: [
    { key: "date", label: "Date", type: "date", required: true },
    {
      key: "quotation",
      label: "Quotation",
      type: "select",
      required: true,
      options: (db) => db.quotations.map((q) => ({ value: q.code, label: `${q.code} · ${customerLabel(db, q.customer)}` })),
    },
    { key: "purpose", label: "Purpose", type: "text", required: true, placeholder: "e.g. Negotiation review" },
    { key: "owner", label: "Owner", type: "select", options: (db) => db.users.filter((u) => u.status === "Active" && !HIDDEN_ROLE_IDS.includes(u.roleId)).map((u) => ({ value: `${u.firstName} ${u.lastName}`, label: `${u.firstName} ${u.lastName}` })) },
    { key: "status", label: "Status", type: "select", options: () => fuStatusOpts },
    { key: "branches", label: "Branches", type: "multiselect", options: (db) => db.branches.map((b) => ({ value: b.name, label: b.name })) },
  ],
  defaults: () => ({ date: "", quotation: "", purpose: "", owner: "", status: "Open", branches: "" }),
  build: (db, v, id, code) => ({
    id,
    code,
    date: v.date,
    quotation: v.quotation,
    purpose: v.purpose.trim(),
    owner: v.owner,
    status: v.status,
    branches: v.branches ? v.branches.split(",").map((s) => s.trim()).filter(Boolean) : [],
  }),
  emptyTitle: "No follow-ups scheduled",
  emptyText: "Schedule follow-up dates and reminders against quotations.",
};

export const usersCfg: CrudConfig = {
  kind: "users",
  module: "Users",
  title: "Users & access",
  subtitle: "Assign roles (with role–module permissions) and branch-level access.",
  action: "Invite user",
  singular: "User",
  idPrefix: "U-",
  idField: "id",
  searchKeys: ["firstName", "lastName", "email", "mobileNo", "roleId", "branch", "status"],
  filter: { key: "status", label: "Status", all: "All statuses", options: () => statusOpts },
  rowFilter: (row, me) => {
    if (me.roleId === 1) return row.id > 1 && row.roleId > 2;
    if (me.roleId === 2) return row.id > 2 && row.roleId > 2;
    return row.roleId > 2;
  },
  rowAction: (row, me, db) =>
    canManageRole(me, row.roleId, db.roles.find((r) => r.id === row.roleId)?.level ?? 1),
  columns: [
    { key: "firstName", label: "User", main: true, render: (r) => <b>{r.firstName} {r.lastName}</b> },
    { key: "email", label: "Email" },
    { key: "mobileNo", label: "Mobile" },
    { key: "role", label: "Role", render: (r, db) => <Badge status={roleName(db, r.roleId)} /> },
    { key: "branch", label: "Branch" },
    { key: "status", label: "Status", render: (r) => <Badge status={r.status} /> },
  ],
  fields: [
    { key: "firstName", label: "First name", type: "text", required: true },
    { key: "lastName", label: "Last name", type: "text", required: true },
    { key: "mobileNo", label: "Mobile no", type: "tel", placeholder: "10-digit mobile number" },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "branch", label: "Branch", type: "select", required: true, options: (db) => [{ value: "All branches", label: "All branches" }, ...db.branches.map((b) => ({ value: b.name, label: b.name }))], validate: (v, all, db) => {
      const role = db.roles.find((r) => r.id === Number(all.roleId));
      if (role && !role.isAdmin && v === "All branches") return "Branch-level roles must be assigned to one specific branch.";
      return undefined;
    } },
    { key: "roleId", label: "Role", type: "select", options: (db, me) => db.roles.filter((r) => !HIDDEN_ROLE_IDS.includes(r.id) && canManageRole(me, r.id, r.level)).map((r) => ({ value: String(r.id), label: r.name })) },
    { key: "status", label: "Status", type: "select", options: () => statusOpts },
  ],
  defaults: () => ({ firstName: "", lastName: "", mobileNo: "", email: "", roleId: "3", branch: "Ahmedabad", status: "Active" }),
  build: (db, v, id, code) => ({
    id,
    code,
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    mobileNo: v.mobileNo.trim(),
    password: "password",
    roleId: Number(v.roleId),
    branch: v.branch,
    status: v.status,
  }),
  unique: (v, db, cid) => {
    const emailTaken = db.users.some((u) => String(u.id) !== cid && u.email.toLowerCase() === v.email.trim().toLowerCase());
    if (emailTaken) return "A user with this email already exists.";
    if (v.mobileNo && db.users.some((u) => String(u.id) !== cid && u.mobileNo === v.mobileNo.trim())) return "A user with this mobile number already exists.";
    return undefined;
  },
  emptyTitle: "No users yet",
  emptyText: "Invite users and assign roles and branch access.",
};

/* ------------------------------------------------------------------ */
/* Quotations (specialized CRUD page with multi-step build wizard)     */
/* ------------------------------------------------------------------ */

export function QuotationsPage() {
  const { db, can, rowInScope, branchScope, isAdmin, go, navCtx, clearNav, busy, remove, update } = useApp();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<{ t: "none" } | { t: "create" } | { t: "edit"; row: Quotation } | { t: "delete"; row: Quotation }>({ t: "none" });
  const canCreate = can("Quotations", "create");
  const canUpdate = can("Quotations", "update");
  const canDelete = can("Quotations", "delete");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  let rows = db.quotations.filter((q) => rowInScope("quotations", q));
  if (navCtx) {
    if (navCtx.by === "customer") rows = rows.filter((q) => q.customer === navCtx.id);
    else if (navCtx.by === "project") rows = rows.filter((q) => q.project === navCtx.id);
    else rows = rows.filter((q) => q.code === navCtx.id);
  }

  const filtered = rows.filter((q) => {
    if (status !== "all" && q.status !== status) return false;
    if (!query) return true;
    return [q.code, q.customer, q.project, ...q.branches, q.owner, q.status, q.category].join(" ").toLowerCase().includes(query.toLowerCase());
  });

  const cname = (id: string) => db.customers.find((c) => c.code === id)?.name ?? id;
  const pname = (id: string) => db.projects.find((p) => p.code === id)?.name ?? id;

  const setStatusOf = async (id: string, s: QStatus) => {
    const row = db.quotations.find((q) => q.code === id);
    if (row) await update("quotations", row.id, { ...row, status: s }, "Quotation");
  };

  const focusTitle = navCtx
    ? navCtx.by === "customer"
      ? cname(navCtx.id)
      : navCtx.by === "project"
        ? pname(navCtx.id)
        : navCtx.id
    : "";

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Quotations</h2>
          <p>Build, calculate, preview, share, revise and convert customer quotations.</p>
        </div>
        {canCreate && (
          <button className="primary" onClick={() => setMode({ t: "create" })}>
            <Plus size={16} /> New quotation
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="readonly-note">
          <ShieldCheck size={14} /> {branchScope !== "All branches" ? `Branch scope — ${branchScope} quotations only.` : "Assigned permission set applies."}
          {!canCreate && " · Read-only — no create access on this module."}
        </div>
      )}

      {navCtx && (
        <div className="focus-banner">
          <Eye size={14} /> Showing quotations for <b>{focusTitle}</b>
          <button onClick={clearNav}>
            <X size={13} /> Clear
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotation, customer, project…" />
        </div>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {QSTATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="count">
          {filtered.length} of {rows.length}
        </span>
      </div>

      {loading ? (
        <SkeletonTable cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || status !== "all" ? "No matching quotations" : "No quotations yet"}
          text={query || status !== "all" ? "Try adjusting your search or filters." : "Build your first quotation from the builder wizard."}
          action={canCreate && !query && status === "all" ? "New quotation" : undefined}
          onAction={() => setMode({ t: "create" })}
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Customer / Project</th>
                <th>Value</th>
                <th>Status</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td>
                    <b className="mono">{q.code}</b>
                    <small>{q.date}</small>
                  </td>
                  <td>
                    <span className="link-cell" onClick={() => go("Customers", { id: q.customer })}>
                      {cname(q.customer)}
                    </span>
                    <small>
                      <span className="link-cell sub" onClick={() => go("Projects", { id: q.project })}>
                        {pname(q.project)}
                      </span>
                    </small>
                  </td>
                  <td>
                    <b>{money(q.amount)}</b>
                  </td>
                  <td>
                    {canUpdate ? (
                      <select
                        className="status-select"
                        value={q.status}
                        disabled={busy?.kind === "quotations"}
                        onChange={(e) => setStatusOf(q.code, e.target.value as QStatus)}
                      >
                        {QSTATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge status={q.status} />
                    )}
                  </td>
                  <td>{q.owner}</td>
                  <td className="table-actions">
                    {canUpdate && (
                      <>
                        <button
                          className="icon-btn"
                          title="Revise"
                          disabled={busy?.kind === "quotations"}
                          onClick={async () => {
                            await update("quotations", q.id, { ...q, revision: q.revision + 1 }, "Quotation");
                          }}
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button className="icon-btn" title="Edit" onClick={() => setMode({ t: "edit", row: q })}>
                          <Pencil size={14} />
                        </button>
                        {canDelete && (
                          <button className="icon-btn danger-ic" title="Delete" onClick={() => setMode({ t: "delete", row: q })}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode.t === "create" && <QuoteWizard onClose={() => setMode({ t: "none" })} />}
      {mode.t === "edit" && <QuoteWizard initial={mode.row} onClose={() => setMode({ t: "none" })} />}
      {mode.t === "delete" && (
        <ConfirmModal
          title="Delete quotation"
          text="This action permanently removes this quotation and its revisions from the prototype."
          busy={busy?.kind === "quotations"}
          onCancel={() => setMode({ t: "none" })}
          onConfirm={async () => {
            await remove("quotations", mode.row.id, "Quotation");
            setMode({ t: "none" });
          }}
          detail={
            <>
              <span>Quotation</span>
              <b>{mode.row.code}</b>
              <span>Customer</span>
              <b>{cname(mode.row.customer)}</b>
              <span>Value</span>
              <b>{money(mode.row.amount)}</b>
            </>
          }
        />
      )}
    </section>
  );
}

function QuoteWizard({ initial, onClose }: { initial?: Quotation | null; onClose: () => void }) {
  const { db, busy, create, update, currentUser, toast, isAdmin, rowInScope } = useApp();
  const scopeCustomers = (list: typeof db.customers) => (isAdmin ? list : list.filter((c) => rowInScope("customers", c)));
  const [step, setStep] = useState(1);
  const [custId, setCustId] = useState(initial?.customer ?? "");
  const [projId, setProjId] = useState(initial?.project ?? "");
  const [ptype, setPtype] = useState(initial?.category ?? "Commercial");
  const [pstage, setPstage] = useState("Design");
  const [date, setDate] = useState("2026-09-30");
  const [placeOfSupply, setPlaceOfSupply] = useState(initial?.placeOfSupply ?? "Gujarat — CGST + SGST");
  const [surfaceItems, setSurfaceItems] = useState<QuotationSurfaceItem[]>(initial?.surfaceItems?.length ? initial.surfaceItems : [{ id: 1, productCategory: "Micro Concrete", texture: "Smooth", finish: "Smooth", shade: "Stone", applicationArea: "Wall", area: 1250, thickness: "2 mm", rate: 185, optionalItems: [], description: "", remarks: "", materialQuantity: 0, materialCost: 0, labourCost: 0, wastageCost: 0, transportationCost: 0, otherCharges: 0, discount: 0, discountType: "percentage", lineTotal: 0, hsn: "3214", gstRate: 18, gstAmount: 0 }]);
  const [quotationOptionalItems, setQuotationOptionalItems] = useState<string[]>(initial?.optionalItems ?? []);
  const [discount, setDiscount] = useState(initial?.discount ?? 5);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(initial?.discountType ?? "percentage");
  const [additionalCharges, setAdditionalCharges] = useState(initial?.additionalCharges ?? 0);
  const [roundOff, setRoundOff] = useState(initial?.roundOff ?? 0);
  const [status, setStatus] = useState<QStatus>(initial?.status ?? "Draft");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const saving = busy?.kind === "quotations";
  const editing = Boolean(initial);
  const previewId = editing ? initial!.code : nextCode(db, "quotations", "QT-AHM-");

  const calcSurfaceItem = (item: QuotationSurfaceItem): QuotationSurfaceItem => {
    const wastagePct = 5;
    const materialQty = Math.ceil(item.area * (1 + wastagePct / 100));
    const product = db.products.find(p => p.category === item.productCategory);
    const slab = product?.rateSlabs.find(s => s.finish === item.finish && s.thickness === item.thickness);
    const matRate = slab?.materialRate ?? item.rate * 0.6;
    const labRate = slab?.labourRate ?? item.rate * 0.4;
    const materialCost = materialQty * matRate;
    const labourCost = item.area * labRate;
    const wastageCost = materialCost * (wastagePct / 100);
    const transportRate = product?.transportationSlabs?.[0]?.rate ?? 15;
    const transportationCost = item.area * transportRate;
    const otherCharges = 0;
    const baseLineTotal = materialCost + labourCost + wastageCost + transportationCost + otherCharges;
    const discountValue = item.discountType === "percentage" ? baseLineTotal * item.discount / 100 : item.discount;
    const afterDiscount = baseLineTotal - discountValue;
    const hsn = product?.hsn ?? "3214";
    const gstRate = product?.gst ?? 18;
    const gstAmount = afterDiscount * gstRate / 100;
    const lineTotal = afterDiscount + gstAmount;
    return { ...item, materialQuantity: materialQty, materialCost, labourCost, wastageCost, transportationCost, otherCharges, discount: item.discount || 0, discountType: item.discountType || "percentage", lineTotal, hsn, gstRate, gstAmount };
  };

  const calcAll = () => {
    const calculated = surfaceItems.map(calcSurfaceItem);
    setSurfaceItems(calculated);
    const subtotal = calculated.reduce((s, x) => s + x.materialCost + x.labourCost + x.wastageCost + x.transportationCost + x.otherCharges, 0);
    const lineDiscounts = calculated.reduce((s, x) => s + (x.discountType === "percentage" ? (x.materialCost + x.labourCost + x.wastageCost + x.transportationCost + x.otherCharges) * x.discount / 100 : x.discount), 0);
    const overallDiscountValue = discountType === "percentage" ? (subtotal - lineDiscounts) * discount / 100 : discount;
    const totalDiscount = lineDiscounts + overallDiscountValue;
    const taxable = subtotal - totalDiscount + additionalCharges;
    const gstAmount = calculated.reduce((s, x) => s + x.gstAmount, 0);
    const total = Math.round(taxable + gstAmount + roundOff);
    return { subtotal, lineDiscounts, overallDiscountValue, totalDiscount, taxable, gstAmount, gstRate: 18, total };
  };

  const { subtotal, lineDiscounts, overallDiscountValue, totalDiscount, taxable, gstAmount, gstRate, total } = calcAll();

  const clearErr = (k: string) => {
    if (errors[k]) {
      const n = { ...errors };
      delete n[k];
      setErrors(n);
    }
    setFormError("");
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!custId) e.customer = "Select a customer";
      if (!projId) e.project = "Select a project";
    }
    if (step === 2) {
      surfaceItems.forEach((s, i) => {
        if (!s.area || s.area <= 0) e["area" + i] = "Area must be greater than 0";
        if (!s.rate || s.rate <= 0) e["rate" + i] = "Rate must be greater than 0";
      });
    }
    if (step === 3) {
      if (discount == null || isNaN(discount) || discount < 0 || (discountType === "percentage" && discount > 100)) e.discount = "Discount must be valid";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) {
      setFormError("");
      setStep(step + 1);
    } else {
      setFormError("Please fix the highlighted fields.");
    }
  };

  const save = async () => {
    if (!validate()) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    const calculatedItems = surfaceItems.map(calcSurfaceItem);
    const { subtotal, totalDiscount, taxable, gstAmount, gstRate, total } = calcAll();
    const branches = editing && initial ? initial.branches : currentUser.branch === "All branches" ? ["Ahmedabad"] : [currentUser.branch];
    const id = editing ? initial!.id : nextId(db, "quotations");
    const code = editing ? initial!.code : previewId;
    const row: Quotation = {
      id,
      code,
      customer: custId,
      project: projId,
      branches,
      surfaceItems: calculatedItems,
      optionalItems: quotationOptionalItems,
      subtotal,
      discount: totalDiscount,
      discountType,
      taxableValue: taxable,
      gstAmount,
      gstRate,
      amount: total,
      status,
      date: editing && initial ? initial.date : new Date().toISOString().split("T")[0],
      owner: editing && initial ? initial.owner : currentUser.name,
      revision: editing ? initial!.revision + 1 : 0,
      followUp: editing && initial ? initial.followUp : new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      category: ptype,
      placeOfSupply,
      additionalCharges,
      roundOff,
      version: `R${editing ? initial!.revision + 1 : 0}`,
    };
    if (editing) await update("quotations", id, row, "Quotation");
    else await create("quotations", row, "Quotation");
    onClose();
  };

  const addSurface = () => setSurfaceItems((s) => [...s, { id: Date.now(), productCategory: "Micro Concrete", texture: "Smooth", finish: "Smooth", shade: "Stone", applicationArea: "Wall", area: 500, thickness: "2 mm", rate: 185, optionalItems: [], description: "", remarks: "", materialQuantity: 0, materialCost: 0, labourCost: 0, wastageCost: 0, transportationCost: 0, otherCharges: 0, discount: 0, discountType: "percentage", lineTotal: 0, hsn: "3214", gstRate: 18, gstAmount: 0 }]);
  const removeSurface = (id: number) => setSurfaceItems((s) => s.filter((x) => x.id !== id));
  const updateSurf = (id: number, k: keyof QuotationSurfaceItem, v: any) => setSurfaceItems((s) => s.map((x) => (x.id === id ? { ...x, [k]: v } : x)));

  const Summary = () => (
    <div className="summary">
      <h4>Live cost summary</h4>
      <div><span>Subtotal (all lines)</span><b>{money(subtotal)}</b></div>
      <div><span>Discount ({discountType === "percentage" ? discount + "%" : money(discount)})</span><b>- {money(overallDiscountValue)}</b></div>
      <div><span>Additional charges</span><b>{money(additionalCharges)}</b></div>
      <div><span>Taxable value</span><b>{money(taxable)}</b></div>
      <div><span>GST {gstRate}%</span><b>{money(gstAmount)}</b></div>
      <div><span>Round-off</span><b>{money(roundOff)}</b></div>
      <strong><span>Grand total</span><b>{money(total)}</b></strong>
    </div>
  );

  return (
    <div className="overlay">
      <div className="quote-modal">
        <div className="wizard-head">
          <div>
            <span>NEW QUOTATION</span>
            <h2>{editing ? "Edit quotation" : "Build quotation"}</h2>
          </div>
          <button className="head-icon" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        <div className="steps">
          {["Customer & project", "Surface items", "Discount & GST", "Preview & status"].map((x, i) => (
            <button key={x} className={step === i + 1 ? "current" : step > i + 1 ? "done" : ""} onClick={() => step > i + 1 && setStep(i + 1)}>
              <b>{step > i + 1 ? <Check size={14} /> : i + 1}</b>
              {x}
            </button>
          ))}
        </div>
        <div className="wizard-body">
          {formError && (
            <div className="form-error">
              <AlertTriangle size={14} />
              {formError}
            </div>
          )}

          {step === 1 && (
            <div className="wizard-grid">
              <div className="wizard-main">
                <h3>Customer & project</h3>
                <p>Select an existing customer and project. Projects inherit the customer branch.</p>
                <div className="form-grid">
                  <div className={"form-field" + (errors.customer ? " invalid" : "")}>
                    <label>Customer<span className="req">*</span></label>
                    <select aria-label="Customer" value={custId} onChange={(e) => { setCustId(e.target.value); clearErr("customer"); }}>
                      <option value="">Select customer…</option>
                      {scopeCustomers(db.customers).map((c) => <option key={c.id} value={c.code}>{c.name}</option>)}
                    </select>
                    {errors.customer && <span className="err-msg">{errors.customer}</span>}
                  </div>
                  <div className={"form-field" + (errors.project ? " invalid" : "")}>
                    <label>Project<span className="req">*</span></label>
                    <select aria-label="Project" value={projId} onChange={(e) => { setProjId(e.target.value); clearErr("project"); }}>
                      <option value="">Select project…</option>
                      {db.projects.filter((p) => !custId || p.customer === custId).map((p) => <option key={p.id} value={p.code}>{p.name}</option>)}
                    </select>
                    {errors.project && <span className="err-msg">{errors.project}</span>}
                  </div>
                  <div className="form-field"><label>Project type</label><select aria-label="Project type" value={ptype} onChange={(e) => setPtype(e.target.value)}>{typeOpts.map((o) => <option key={o.value}>{o.value}</option>)}</select></div>
                  <div className="form-field"><label>Project stage</label><select aria-label="Project stage" value={pstage} onChange={(e) => setPstage(e.target.value)}>{stageOpts.map((o) => <option key={o.value}>{o.value}</option>)}</select></div>
                  <div className="form-field"><label>Expected completion</label><input aria-label="Expected completion" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
                  <div className="form-field"><label>Place of supply</label><select aria-label="Place of supply" value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)}><option>Gujarat — CGST + SGST</option><option>Other state — IGST</option></select></div>
                </div>
                <div className="address-grid">
                  <div><b>Site address</b><textarea defaultValue="Corporate Office, SG Highway, Ahmedabad" /></div>
                  <div><b>Billing address</b><textarea defaultValue="Orion Manufacturing, Ahmedabad" /></div>
                </div>
              </div>
              <div className="side-summary"><Summary /></div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="wizard-section-head">
                <div><h3>Surface items</h3><p>Add one or multiple surfaces with application area, optional items and per-item discount.</p></div>
                <button className="secondary" onClick={addSurface}><Plus size={15} /> Add surface</button>
              </div>
              {surfaceItems.map((s, i) => (
                <div className="surface-card" key={s.id}>
                  <div className="surface-top">
                    <b>Surface {i + 1}</b>
                    <button className="icon-btn" onClick={() => removeSurface(s.id)} disabled={surfaceItems.length === 1}><Trash2 size={16} /></button>
                  </div>
                  <div className="form-grid">
                    <div className="form-field"><label>Product category</label><select aria-label="Product category" value={s.productCategory} onChange={(e) => updateSurf(s.id, "productCategory", e.target.value)}>{ProductCategory.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                    <div className="form-field"><label>Texture</label><input aria-label="Texture" value={s.texture} onChange={(e) => updateSurf(s.id, "texture", e.target.value)} placeholder="e.g. Smooth" /></div>
                    <div className="form-field"><label>Finish</label><input aria-label="Finish" value={s.finish} onChange={(e) => updateSurf(s.id, "finish", e.target.value)} placeholder="e.g. Smooth" /></div>
                    <div className="form-field"><label>Shade</label><input aria-label="Shade" value={s.shade} onChange={(e) => updateSurf(s.id, "shade", e.target.value)} placeholder="e.g. Stone" /></div>
                    <div className="form-field"><label>Application area</label><select aria-label="Application area" value={s.applicationArea} onChange={(e) => updateSurf(s.id, "applicationArea", e.target.value)}>{ApplicationArea.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
                    <div className={"form-field" + (errors["area" + i] ? " invalid" : "")}><label>Area (sq.ft.)<span className="req">*</span></label><input aria-label="Area (sq.ft.)" type="number" value={s.area} onChange={(e) => { updateSurf(s.id, "area", Number(e.target.value)); clearErr("area" + i); }} />{errors["area" + i] && <span className="err-msg">{errors["area" + i]}</span>}</div>
                    <div className="form-field"><label>Thickness</label><select aria-label="Thickness" value={s.thickness} onChange={(e) => updateSurf(s.id, "thickness", e.target.value)}>{["1 mm", "2 mm", "3 mm", "5 mm", "Custom"].map((x) => <option key={x}>{x}</option>)}</select></div>
                    <div className={"form-field" + (errors["rate" + i] ? " invalid" : "")}><label>Rate / sq.ft.<span className="req">*</span></label><input aria-label="Rate / sq.ft." type="number" value={s.rate} onChange={(e) => { updateSurf(s.id, "rate", Number(e.target.value)); clearErr("rate" + i); }} />{errors["rate" + i] && <span className="err-msg">{errors["rate" + i]}</span>}</div>
                    <div className="form-field"><label>Optional items (per item)</label><select aria-label="Optional items" multiple value={s.optionalItems} onChange={(e) => { const arr = Array.from(e.target.selectedOptions).map((o) => o.value); updateSurf(s.id, "optionalItems", arr); }}>{OptionalItemMaster.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>
                    <div className="form-field"><label>Discount</label><select value={s.discountType} onChange={(e) => updateSurf(s.id, "discountType", e.target.value)}><option value="percentage">%</option><option value="fixed">₹</option></select></div>
                    <div className="form-field"><label>Discount value</label><input type="number" value={s.discount || 0} onChange={(e) => updateSurf(s.id, "discount", Number(e.target.value))} min="0" step="0.01" /></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-field span-2"><label>Description (customer-facing)</label><textarea value={s.description} onChange={(e) => updateSurf(s.id, "description", e.target.value)} placeholder="Description visible on PDF" rows={2} /></div>
                    <div className="form-field span-2"><label>Remarks (internal)</label><textarea value={s.remarks} onChange={(e) => updateSurf(s.id, "remarks", e.target.value)} placeholder="Internal notes" rows={2} /></div>
                  </div>
                  <div className="calc-preview">
                    <b>Calculated:</b> Material: {money(s.materialCost)} | Labour: {money(s.labourCost)} | Wastage: {money(s.wastageCost)} | Transport: {money(s.transportationCost)} | Discount: {money(s.discountType === "percentage" ? (s.materialCost + s.labourCost + s.wastageCost + s.transportationCost) * (s.discount || 0) / 100 : (s.discount || 0))} | GST ({s.gstRate}%): {money(s.gstAmount)} | <b>Line total: {money(s.lineTotal)}</b>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="wizard-grid">
              <div className="wizard-main">
                <h3>Discount, Charges & GST</h3>
                <p>Discount can be percentage or fixed amount — per line item (set in Surface items) or on overall quotation. GST auto-applied per product HSN.</p>
                <div className="form-grid">
                  <div className="form-field"><label>Overall discount type</label><select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}><option value="percentage">%</option><option value="fixed">₹</option></select></div>
                  <div className={"form-field" + (errors.discount ? " invalid" : "")}><label>Overall discount value<span className="req">*</span></label><input aria-label="Overall discount" type="number" value={discount} onChange={(e) => { setDiscount(Number(e.target.value)); clearErr("discount"); }} min="0" step="0.01" />{errors.discount && <span className="err-msg">{errors.discount}</span>}</div>
                  <div className="form-field"><label>Place of supply</label><select value={placeOfSupply} onChange={(e) => setPlaceOfSupply(e.target.value)}><option>Gujarat — CGST + SGST</option><option>Other state — IGST</option></select></div>
                  <div className="form-field"><label>Additional charges</label><input type="number" value={additionalCharges} onChange={(e) => setAdditionalCharges(Number(e.target.value))} min="0" step="0.01" placeholder="e.g. 12500" /></div>
                  <div className="form-field"><label>Round-off</label><input type="number" value={roundOff} onChange={(e) => setRoundOff(Number(e.target.value))} step="0.01" placeholder="e.g. 0.50" /></div>
                </div>
                <div className="rule-note"><ShieldCheck size={17} /><span>Rate history is preserved for existing quotations even when the product rate master changes.</span></div>
              </div>
              <div className="side-summary">
                <Summary />
                <div className="summary detail">
                  <h4>Breakdown</h4>
                  <div><span>Material cost</span><b>{money(surfaceItems.reduce((s, x) => s + x.materialCost, 0))}</b></div>
                  <div><span>Labour cost</span><b>{money(surfaceItems.reduce((s, x) => s + x.labourCost, 0))}</b></div>
                  <div><span>Wastage</span><b>{money(surfaceItems.reduce((s, x) => s + x.wastageCost, 0))}</b></div>
                  <div><span>Transportation</span><b>{money(surfaceItems.reduce((s, x) => s + x.transportationCost, 0))}</b></div>
                  <div><span>Line discounts</span><b>- {money(lineDiscounts)}</b></div>
                  <div><span>Overall discount</span><b>- {money(overallDiscountValue)}</b></div>
                  <div><span>Additional charges</span><b>{money(additionalCharges)}</b></div>
                  <div><span>Taxable value</span><b>{money(taxable)}</b></div>
                  <div><span>GST</span><b>{money(gstAmount)}</b></div>
                  <div><span>Round-off</span><b>{money(roundOff)}</b></div>
                  <hr />
                  <div><span>Amount in words</span><b>{numberWords(total)} only</b></div>
                  <strong><span>Grand total</span><b>{money(total)}</b></strong>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="preview-layout">
              <div className="quotation-paper">
                <div className="paper-head">
                  <div><b>ARTELIER</b><span>QUOTATION</span></div>
                  <div><strong>{previewId}</strong><small>{new Date().toLocaleDateString()} · Valid 30 days</small></div>
                </div>
                <div className="paper-to">
                  <b>{db.customers.find((c) => c.code === custId)?.name ?? "Customer"}</b>
                  <span>{db.projects.find((p) => p.code === projId)?.name ?? "Project"} · {currentUser.branch}</span>
                  <span>GST: 24AAECA0000A1Z5</span>
                </div>
                <table>
                  <thead><tr><th>Surface / finish</th><th>Application</th><th>Area</th><th>Rate</th><th>Discount</th><th>GST</th><th>Total</th></tr></thead>
                  <tbody>
                    {surfaceItems.map((s) => (
                      <tr key={s.id}>
                        <td><b>{s.productCategory}</b><small>{s.texture} · {s.finish} · {s.shade} · {s.thickness}</small></td>
                        <td>{s.applicationArea}</td>
                        <td>{s.area}</td>
                        <td>{money(s.rate)}</td>
                        <td>{s.discountType === "percentage" ? s.discount + "%" : money(s.discount || 0)}</td>
                        <td>{money(s.gstAmount)}</td>
                        <td>{money(s.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="paper-total">
                  <span>Material cost</span><b>{money(surfaceItems.reduce((s, x) => s + x.materialCost, 0))}</b>
                  <span>Labour cost</span><b>{money(surfaceItems.reduce((s, x) => s + x.labourCost, 0))}</b>
                  <span>Wastage</span><b>{money(surfaceItems.reduce((s, x) => s + x.wastageCost, 0))}</b>
                  <span>Transportation</span><b>{money(surfaceItems.reduce((s, x) => s + x.transportationCost, 0))}</b>
                  <span>Line discounts</span><b>- {money(lineDiscounts)}</b>
                  <span>Overall discount</span><b>- {money(overallDiscountValue)}</b>
                  <span>Additional charges</span><b>{money(additionalCharges)}</b>
                  <span>Taxable value</span><b>{money(taxable)}</b>
                  <span>GST</span><b>{money(gstAmount)}</b>
                  <span>Round-off</span><b>{money(roundOff)}</b>
                  <strong>Grand total</strong><strong>{money(total)}</strong>
                </div>
                <div className="paper-footer">Terms & Conditions: Standard quotation terms · Amount in words: {numberWords(total)} only.</div>
              </div>
              <div className="preview-side">
                <h3>Finalise quotation</h3>
                <div className="form-field">
                  <label>Status</label>
                  <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as QStatus)}>{["Draft", "Sent", "Under Negotiation", "Approved"].map((s) => <option key={s}>{s}</option>)}</select>
                </div>
                <div className="preview-actions">
                  <button className="secondary" onClick={() => toast("PDF preview simulated")}><Eye /> Preview PDF</button>
                  <button className="secondary" onClick={() => toast("Print dialog simulated")}><Printer /> Print</button>
                  <button className="secondary" onClick={() => toast("Email / WhatsApp sharing simulated")}><Zap /> Email / WhatsApp</button>
                </div>
                <div className="version">
                  <History />
                  <div><b>{editing ? `Revision R${initial!.revision + 1}` : "Revision R0"}</b><small>New quotation · prior versions preserved</small></div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="wizard-foot">
          <button className="secondary" disabled={saving} onClick={step === 1 ? onClose : () => setStep(step - 1)}>
            {step === 1 ? "Cancel" : <><ArrowLeft size={15} /> Back</>}
          </button>
          {step < 4 ? (
            <button className="primary" onClick={next}>Continue <ArrowRight size={15} /></button>
          ) : (
            <button className="primary" disabled={saving} onClick={save}>
              {saving ? <><Spinner /> Saving…</> : <><Check size={16} /> {editing ? "Save changes" : "Save quotation"}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Dashboard, Reports, Settings                                        */
/* ------------------------------------------------------------------ */

function Metric({ icon, label, value, hint }: { icon: any; label: string; value: string; hint: string }) {
  return (
    <div className="metric card">
      <div className="metric-icon">{icon}</div>
      <div><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}
function Head({ title, sub }: { title: string; sub: string }) {
  return <div className="card-head"><div><h2>{title}</h2><p>{sub}</p></div></div>;
}
function Setting({ title, text }: { title: string; text: string }) {
  return <label className="setting"><div><b>{title}</b><span>{text}</span></div><input type="checkbox" defaultChecked /></label>;
}

const PERM_MODULES = ["Branches", "Customers", "Projects", "Products", "Quotations", "Inspections", "Documents", "FollowUps", "Reports", "Users", "Roles", "Settings"] as const;
const PERM_ACTIONS = ["view", "create", "update", "delete"] as const;

function RoleModal({ editing, onClose }: { editing: Role | null; onClose: () => void }) {
  const { db, busy, create, update } = useApp();
  const [name, setName] = useState(editing?.name ?? "");
  const [isAdmin, setIsAdmin] = useState(editing?.isAdmin ?? false);
  const [level, setLevel] = useState(String(editing?.level ?? 1));
  const [perms, setPerms] = useState<Record<string, Permission>>(() => {
    const base: Record<string, Permission> = {};
    for (const m of PERM_MODULES) {
      base[m] = editing?.permissions.find((p) => p.module === m) ?? { module: m, view: true, create: false, update: false, delete: false };
    }
    return base;
  });
  const [error, setError] = useState("");
  const saving = busy?.kind === "roles";

  const setPerm = (m: string, a: (typeof PERM_ACTIONS)[number], v: boolean) => setPerms((p) => ({ ...p, [m]: { ...p[m], [a]: v } }));

  const save = async () => {
    if (!name.trim()) {
      setError("Role name is required");
      return;
    }
    if (level.trim() === "" || isNaN(Number(level)) || Number(level) < 0) {
      setError("Level must be 0 or greater.");
      return;
    }
    if (Number(level) === 0) {
      setError("Level 0 is reserved for system roles and cannot be assigned.");
      return;
    }
    if (editing && HIDDEN_ROLE_IDS.includes(editing.id)) {
      setError("System roles cannot be modified.");
      return;
    }
    const id = editing ? editing.id : db.roles.reduce((mx, r) => Math.max(mx, r.id), 0) + 1;
    const row: Role = {
      id,
      name: name.trim(),
      isAdmin,
      level: Number(level),
      permissions: PERM_MODULES.map((m) => perms[m] ?? { module: m, view: false, create: false, update: false, delete: false }),
    };
    if (editing) await update("roles", String(id), row, "Role");
    else await create("roles", row, "Role");
    onClose();
  };

  return (
    <Modal
      title={editing ? "Edit role" : "New role"}
      subtitle="Role–module permissions apply to non-admin roles; admin roles get full access."
      size="wide"
      onClose={onClose}
      footer={
        <>
          <button className="secondary" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="primary" disabled={saving} onClick={save}>
            {saving ? <><Spinner /> Saving…</> : <><Check size={16} /> {editing ? "Save changes" : "Create"}</>}
          </button>
        </>
      }
    >
      {error && <div className="form-error"><AlertTriangle size={14} /> {error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label>Role name<span className="req">*</span></label>
          <input aria-label="Role name" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="e.g. Branch Staff" />
        </div>
        <div className="form-field">
          <label>Is admin</label>
          <label className="check-line">
            <input type="checkbox" aria-label="Is admin" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            Grant full access across all modules
          </label>
        </div>
        <div className="form-field">
          <label>Level<span className="req">*</span></label>
          <input aria-label="Level" type="number" min={0} value={level} onChange={(e) => { setLevel(e.target.value); setError(""); }} />
          <span className="help-msg">Hierarchy level: 0 = top-level admins (Super Admin, System Admin). Others start from 1.</span>
        </div>
      </div>
      <div className="perm-head">
        <b>Role–module permissions</b>
        {isAdmin && <small className="muted">Full access granted to all modules.</small>}
      </div>
      <div className="table-wrap perm-matrix">
        <table>
          <thead>
            <tr><th>Module</th><th>IsView</th><th>IsCreate</th><th>IsUpdate</th><th>IsDelete</th></tr>
          </thead>
          <tbody>
            {PERM_MODULES.map((m) => {
              const p = perms[m];
              return (
                <tr key={m}>
                  <td><b>{m === "FollowUps" ? "Follow-ups" : m}</b></td>
                  {PERM_ACTIONS.map((a) => (
                    <td key={a}>
                      <input type="checkbox" aria-label={`${m} ${a}`} checked={p?.[a]} disabled={isAdmin} onChange={(e) => setPerm(m, a, e.target.checked)} />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <div className="rule-note"><ShieldCheck size={17} /><span>Admin roles bypass the matrix and receive view/create/update/delete on every module.</span></div>
      )}
    </Modal>
  );
}

export function RolesPage() {
  const { db, can, busy, remove, toast, me, visibleRoles } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<{ t: "none" } | { t: "create" } | { t: "edit"; row: Role } | { t: "delete"; row: Role }>({ t: "none" });
  const canCreate = can("Roles", "create");
  const canUpdate = can("Roles", "update");
  const canDelete = can("Roles", "delete");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  const rows = visibleRoles.filter((r) => !query || r.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Roles & permissions</h2>
          <p>Role–module access matrix — view / create / update / delete per module, plus branch-level scope for users.</p>
        </div>
        {canCreate && (
          <button className="primary" onClick={() => setMode({ t: "create" })}>
            <Plus size={16} /> New role
          </button>
        )}
      </div>

      <div className="toolbar">
        <div className="search">
          <Search size={17} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roles…" />
        </div>
        <span className="count">{rows.length} of {visibleRoles.length}</span>
      </div>

      {loading ? (
        <SkeletonTable cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={query ? "No matching roles" : "No roles yet"}
          text={query ? "Try adjusting your search." : "Create roles and grant module permissions."}
          action={canCreate && !query ? "New role" : undefined}
          onAction={() => setMode({ t: "create" })}
        />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Level</th>
                <th>Is Admin</th>
                <th>Modules</th>
                <th>Users</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const granted = r.permissions.filter((p) => p.view).length;
                const userCount = db.users.filter((u) => u.roleId === r.id && !HIDDEN_ROLE_IDS.includes(u.roleId)).length;
                return (
                  <tr key={r.id}>
                    <td>
                      <b>{r.name}</b>
                      <small>RoleId {r.id}</small>
                    </td>
                    <td>{r.level}</td>
                    <td>{r.isAdmin ? <Badge status="Is Admin" /> : <span className="muted">No</span>}</td>
                    <td>{granted} of {PERM_MODULES.length}</td>
                    <td>{userCount} user{userCount === 1 ? "" : "s"}</td>
                    <td className="table-actions">
                      {canUpdate && canManageRole(me, r.id, r.level) && (
                        <button className="icon-btn" title="Edit" onClick={() => setMode({ t: "edit", row: r })}>
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && canManageRole(me, r.id, r.level) && (
                        <button className="icon-btn danger-ic" title="Delete" onClick={() => setMode({ t: "delete", row: r })}>
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

      {(mode.t === "create" || mode.t === "edit") && <RoleModal editing={mode.t === "edit" ? mode.row : null} onClose={() => setMode({ t: "none" })} />}
      {mode.t === "delete" && (
        <ConfirmModal
          title="Delete role"
          text="This action permanently removes this role. Roles with assigned users cannot be deleted."
          busy={busy?.kind === "roles"}
          onCancel={() => setMode({ t: "none" })}
          onConfirm={async () => {
            if (HIDDEN_ROLE_IDS.includes(mode.row.id)) {
              toast("System roles cannot be deleted.", "error");
              setMode({ t: "none" });
              return;
            }
            if (db.users.some((u) => u.roleId === mode.row.id)) {
              toast("Cannot delete — users are assigned to this role.", "error");
              setMode({ t: "none" });
              return;
            }
            await remove("roles", String(mode.row.id), "Role");
            setMode({ t: "none" });
          }}
          detail={<><span>Role</span><b>{mode.row.name}</b><span>Users</span><b>{db.users.filter((u) => u.roleId === mode.row.id && !HIDDEN_ROLE_IDS.includes(u.roleId)).length}</b></>}
        />
      )}
    </section>
  );
}

export function Dashboard() {
  const { db, go, rowInScope } = useApp();
  const quotes = db.quotations.filter((q) => rowInScope("quotations", q));
  const followups = db.followups.filter((f) => rowInScope("followups", f));
  const total = quotes.reduce((s, q) => s + q.amount, 0);
  const approved = quotes.filter((q) => q.status === "Approved").length;
  const pending = quotes.filter((q) => ["Sent", "Under Negotiation"].includes(q.status)).length;
  const converted = quotes.filter((q) => q.status === "Converted").length;
  const cname = (id: string) => db.customers.find((c) => c.code === id)?.name ?? id;
  const pname = (id: string) => db.projects.find((p) => p.code === id)?.name ?? id;

  return (
    <>
      <div className="metric-grid">
        <Metric icon={<FileText />} label="Total quotations" value={String(quotes.length)} hint="+8.4% this month" />
        <Metric icon={<Activity size={20} />} label="Pending" value={String(pending)} hint="Requires follow-up" />
        <Metric icon={<CheckCircle2 />} label="Approved" value={String(approved)} hint="+12.1% this month" />
        <Metric icon={<Zap />} label="Converted" value={String(converted)} hint={quotes.length ? money(total / quotes.length) + " avg. value" : "—"} />
        <Metric icon={<BarChart3 />} label="This month value" value={money(total)} hint="Across active branches" />
      </div>
      <div className="grid2">
        <section className="card">
          <Head title="Quotation pipeline" sub="Current lifecycle distribution" />
          <div className="pipeline">
            {QSTATUSES.map((s) => {
              const n = quotes.filter((q) => q.status === s).length;
              return (
                <div className="pipe" key={s}>
                  <div><span>{s}</span><b>{n}</b></div>
                  <div className="bar"><i style={{ width: `${quotes.length ? Math.max(8, (n / quotes.length) * 100) : 8}%` }} /></div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card">
          <Head title="Quick actions" sub="Start a quotation workflow" />
          <div className="quick">
            <button onClick={() => go("Quotations")}><span><Plus /></span><div><b>New quotation</b><small>Build from customer to total</small></div><ArrowRight /></button>
            <button onClick={() => go("Customers")}><span><Users /></span><div><b>Customer list</b><small>Search and manage customers</small></div><ArrowRight /></button>
            <button onClick={() => go("Products")}><span><Package /></span><div><b>Product library</b><small>Review rates and finishes</small></div><ArrowRight /></button>
          </div>
        </section>
        <section className="card wide">
          <Head title="Recent quotations" sub="Latest activity across the workspace" />
          <div className="table-wrap">
            <table>
              <thead><tr><th>Quotation</th><th>Customer / Project</th><th>Value</th><th>Status</th><th>Owner</th><th></th></tr></thead>
              <tbody>
                {quotes.slice(0, 5).map((q) => (
                  <tr key={q.id}>
                    <td><b className="mono">{q.code}</b><small>{q.date}</small></td>
                    <td><b>{cname(q.customer)}</b><small>{pname(q.project)}</small></td>
                    <td><b>{money(q.amount)}</b></td>
                    <td><Badge status={q.status} /></td>
                    <td>{q.owner}</td>
                    <td><button className="more" onClick={() => go("Quotations", { id: q.code })}><ArrowRight size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card">
          <Head title="Upcoming follow-ups" sub="Items requiring attention" />
          <div className="follow-list">
            {followups.slice(0, 4).map((f) => {
              const q = db.quotations.find((x) => x.code === f.quotation);
              const d = f.date.split(" ");
              return (
                <div className="follow" key={f.id}>
                  <div><b>{d[0]}</b><span>{d[1]}</span></div>
                  <section><b>{q ? cname(q.customer) : "—"}</b><small>{f.purpose} · {f.quotation}</small></section>
                  <ArrowRight size={16} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

export function ReportsPage() {
  const { db, rowInScope, isAdmin } = useApp();
  const quotes = db.quotations.filter((q) => rowInScope("quotations", q));
  const total = quotes.reduce((s, q) => s + q.amount, 0);
  return (
    <div className="grid2">
      <section className="card wide">
        <Head title="Quotation register & analytics" sub={isAdmin ? "Consolidated view · branch filter available" : "Assigned branch view"} />
        <div className="report-cards">
          <Stat label="Created" value={String(quotes.length)} />
          <Stat label="Sent" value={String(quotes.filter((q) => q.status === "Sent").length)} />
          <Stat label="Approved" value={String(quotes.filter((q) => q.status === "Approved").length)} />
          <Stat label="Converted" value={String(quotes.filter((q) => q.status === "Converted").length)} />
        </div>
        <div className="fake-chart">{[62, 74, 48, 81, 67, 91, 77, 86, 72, 95, 84, 92].map((h, i) => <i key={i} style={{ height: h + "%" }} />)}</div>
        <div className="chart-labels">{["Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((x) => <span key={x}>{x}</span>)}</div>
      </section>
      <section className="card">
        <Head title="Management indicators" sub="Current sample dataset" />
        <div className="stat-list">
          <Stat label="Quotation value" value={money(total)} />
          <Stat label="Average quotation" value={money(quotes.length ? total / quotes.length : 0)} />
          <Stat label="Conversion rate" value="18.4%" />
          <Stat label="Discount value" value={money(186400)} />
          <Stat label="Referral contribution" value="32%" />
        </div>
      </section>
      <section className="card wide">
        <Head title="Required reports" sub="Scope-defined reporting views" />
        <div className="report-links">
          {["Quotation register", "Conversion funnel by count & value", "Product category sales", "Finish-wise sales", "Architect / Interior Designer referrals", "Discount report", "Monthly sales summary", "Branch-wise performance"].map((x) => (
            <button key={x}><BarChart3 size={17} /><span>{x}</span><ArrowRight size={15} /></button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function SettingsPage() {
  const { toast } = useApp();
  return (
    <div className="grid2">
      <section className="card">
        <Head title="Quotation settings" sub="Branch-aware numbering and commercial controls" />
        <div className="settings">
          <Setting title="Branch-wise quotation numbering" text="Generate quotation numbers using branch prefixes." />
          <Setting title="Auto-expiry" text="Expire quotations when validity ends." />
          <Setting title="Require discount approval" text="Route discount approvals through the defined workflow." />
          <Setting title="Preserve historical rates" text="Existing quotations retain original rates." />
          <button className="primary" onClick={() => toast("Settings saved")}>Save settings</button>
        </div>
      </section>
      <section className="card">
        <Head title="Prototype environment" sub="No backend connected" />
        <div className="info">
          <div><span>Data</span><b>Local sample data</b></div>
          <div><span>Storage</span><b>In-memory React state</b></div>
          <div><span>Backend</span><b>None</b></div>
          <div><span>Authentication</span><b>Prototype login</b></div>
        </div>
      </section>
    </div>
  );
}