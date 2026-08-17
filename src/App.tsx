import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { useApp } from "./store";
import type { DB, Module, Page } from "./types";
import { ToastStack } from "./components";
import { EntityPage } from "./entity";
import {
  branchesCfg,
  customersCfg,
  documentsCfg,
  followupsCfg,
  inspectionsCfg,
  productsCfg,
  usersCfg,
  Dashboard,
  ProjectsPage,
  QuotationsPage,
  ReportsPage,
  RolesPage,
  SettingsPage,
} from "./pages";

const ADMIN_ONLY: readonly Page[] = ["Users", "Roles", "Branches"];

const nav = [
  ["Dashboard", "Dashboard", LayoutDashboard],
  ["Branches", "Branches", Building2],
  ["Customers", "Customers", Users],
  ["Projects", "Projects", Package],
  ["Products", "Products", SlidersHorizontal],
  ["Quotations", "Quotations", FileText],
  ["Inspections", "Inspections", ClipboardCheck],
  ["Documents", "Documents", FileText],
  ["FollowUps", "Follow-ups", CalendarDays],
  ["Reports", "Reports", BarChart3],
  ["Users", "Users", Users],
  ["Roles", "Roles", ShieldCheck],
  ["Settings", "Settings", Settings],
] as const;

function label(p: Page) {
  return ({ FollowUps: "Follow-ups", Products: "Product Library", Quotations: "Quotations" } as any)[p] || p;
}
function desc(p: Page) {
  return ({
    Dashboard: "Monitor quotation activity, approvals, follow-ups and commercial performance.",
    Branches: "Manage branches and enforce branch-level business data boundaries.",
    Customers: "Manage customers, contacts, referral sources and quotation history.",
    Projects: "Capture project context, stages and separate site and billing addresses.",
    Products: "Control finishes, shades, rates, labour, wastage, transportation and HSN/GST.",
    Quotations: "Build, calculate, preview, share, revise and convert customer quotations.",
    Inspections: "Capture inspection activities supporting quality traceability.",
    Documents: "Control quotation documents, templates and customer-facing output.",
    FollowUps: "Track quotation follow-up dates, notes and reminders.",
    Reports: "Review quotation register, conversion, product, referral, discount and branch analytics.",
    Users: "Manage prototype users, roles and branch assignment.",
    Roles: "Manage roles and role–module permission matrix (view / create / update / delete).",
    Settings: "Configure quotation numbering, expiry, discount approval and rate controls.",
  } as any)[p];
}

export default function App() {
  const { logged, page, go, login, resetPassword, logout, currentUser, db, toast, can, isAdmin, branchScope } = useApp();
  const [mobile, setMobile] = useState(false);
  const allowed = nav.filter(([key]) => {
    if (key === "Dashboard") return true;
    if (!can(key as Module, "view")) return false;
    if (key === "Users") return true;
    if (key === "Roles" || key === "Branches") return isAdmin && branchScope === "All branches";
    return !ADMIN_ONLY.includes(key as Page);
  });

  if (!logged) return <Login onLogin={login} onResetPassword={resetPassword} db={db} />;

  return (
    <div className="shell">
      <aside className={"sidebar" + (mobile ? " open" : "")}>
        <div className="brand">
          <div className="logo">A</div>
          <div><b>ARTELIER</b><small>QUALITY SYSTEM</small></div>
          <button className="mobile-close" onClick={() => setMobile(false)}><X /></button>
        </div>
        <div className="workspace"><span>WORKSPACE</span><button><i />Quotation Management<ChevronDown size={14} /></button></div>
        <nav>
          {allowed.map(([key, label_, Icon]) => (
            <button key={key} className={page === key ? "active" : ""} onClick={() => go(key as Page)}>
              <Icon size={18} />
              <span>{label_}</span>
              {key === "Quotations" && <em>{db.quotations.length}</em>}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="support"><HelpCircle /><div><b>Support centre</b><small>QMS help & guidance</small></div></div>
          <button onClick={logout}><LogOut size={18} />Sign out</button>
        </div>
      </aside>
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}

      <main className="main">
        <header>
          <button className="mobile-menu" onClick={() => setMobile(true)}><Menu /></button>
          <div className="crumb"><span>QMS</span><ArrowRight size={13} /><b>{label(page)}</b></div>
          <div className="header-right">
            <button className="head-icon" onClick={() => toast("No new notifications")}><Bell size={18} /><i /></button>
            <div className="user-chip">
              <div className="avatar">{currentUser.name.split(" ").map((x) => x[0]).join("")}</div>
              <div className="user-meta"><b>{currentUser.name}</b><small>{currentUser.subtitle}{currentUser.branch !== "All branches" ? ` · ${currentUser.branch}` : ""}</small></div>
            </div>
          </div>
        </header>
        <div className="content">
          <div className="page-title">
            <div><span>QUALITY MANAGEMENT SYSTEM</span><h1>{label(page)}</h1><p>{desc(page)}</p></div>
          </div>
          {page === "Dashboard" && <Dashboard />}
          {page === "Branches" && <EntityPage config={branchesCfg} />}
          {page === "Customers" && <EntityPage config={customersCfg} />}
          {page === "Projects" && <ProjectsPage />}
          {page === "Products" && <EntityPage config={productsCfg} />}
          {page === "Quotations" && <QuotationsPage />}
          {page === "Inspections" && <EntityPage config={inspectionsCfg} />}
          {page === "Documents" && <EntityPage config={documentsCfg} />}
          {page === "FollowUps" && <EntityPage config={followupsCfg} />}
          {page === "Reports" && <ReportsPage />}
          {page === "Users" && <EntityPage config={usersCfg} />}
          {page === "Roles" && <RolesPage />}
          {page === "Settings" && <SettingsPage />}
        </div>
      </main>
      <ToastStack />
    </div>
  );
}

const DEMO_ACCOUNTS: [string, string][] = [
  ["Super Admin", "superadmin@example.com"],
  ["System Admin", "sysadmin@example.com"],
  ["Branch Admin (Ahmedabad)", "ahmedabad.admin@example.com"],
];

function Login({
  onLogin,
  onResetPassword,
  db,
}: {
  onLogin: (identifier: string, password: string) => boolean;
  onResetPassword: (identifier: string, newPassword: string) => boolean;
  db: DB;
}) {
  const [view, setView] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("superadmin@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");

  const [forgotId, setForgotId] = useState("");
  const [forgotStep, setForgotStep] = useState<"id" | "otp" | "reset">("id");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [forgotNote, setForgotNote] = useState("");

  const userOf = (id: string) => {
    const q = id.trim().toLowerCase();
    return db.users.find((u) => u.email.toLowerCase() === q || u.mobileNo === q) ?? null;
  };

  const submit = () => {
    if (!email.trim() || !password) {
      setError("Enter your email or mobile and password.");
      return;
    }
    if (!onLogin(email, password)) setError("No account found for this email or mobile, or the password is incorrect.");
  };

  const sendOtp = () => {
    const u = userOf(forgotId);
    if (!u) {
      setForgotNote("No account found for this email or mobile.");
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setSentOtp(code);
    setOtp(code);
    setForgotNote(`A 6-digit OTP was sent to ${u.email}. It is pre-filled below for this demo.`);
    setForgotStep("otp");
  };

  const verifyOtp = () => {
    if (otp.trim() !== sentOtp) {
      setForgotNote("Incorrect OTP. Use the code shown in the message above.");
      return;
    }
    setForgotStep("reset");
    setForgotNote("");
  };

  const doReset = () => {
    if (newPass.length < 6) {
      setForgotNote("New password must be at least 6 characters.");
      return;
    }
    if (newPass !== confirm) {
      setForgotNote("Passwords do not match.");
      return;
    }
    if (!onResetPassword(forgotId, newPass)) {
      setForgotNote("No account found for this email or mobile.");
      return;
    }
    setEmail(userOf(forgotId)!.email);
    setPassword(newPass);
    setView("login");
    setForgotId("");
    setOtp("");
    setSentOtp("");
    setNewPass("");
    setConfirm("");
    setForgotNote("");
    setForgotStep("id");
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand"><div className="logo big">A</div><div><b>ARTELIER</b><small>QUALITY SYSTEM</small></div></div>
        {view === "login" ? (
          <>
            <span className="eyebrow">SECURE ACCESS</span>
            <h1>Welcome back</h1>
            <p>Sign in to your quotation management workspace.</p>
            <label>Email or mobile<input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} /></label>
            <label>Password<input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} /></label>
            {error && <div className="form-error">{error}</div>}
            <div className="login-line"><label><input type="checkbox" defaultChecked /> Remember me</label><button className="link" type="button" onClick={() => setView("forgot")}>Forgot password?</button></div>
            <button className="primary login-btn" onClick={submit}>Sign in <ArrowRight size={17} /></button>
            <div className="demo">
              <span>Demo accounts</span>
              <div>{DEMO_ACCOUNTS.map(([label, em]) => <button key={em} type="button" onClick={() => { setEmail(em); setError(""); }}>{label} — {em}</button>)}</div>
            </div>
          </>
        ) : (
          <>
            <span className="eyebrow">ACCOUNT RECOVERY</span>
            <h1>Reset password</h1>
            <p>We'll send a 6-digit OTP to your registered email to verify it's you.</p>
            {forgotStep === "id" && (
              <>
                <label>Email or mobile<input value={forgotId} onChange={(e) => { setForgotId(e.target.value); setForgotNote(""); }} placeholder="Registered email or mobile" /></label>
                {forgotNote && <div className={"form-error" + (forgotNote.startsWith("A 6-digit") ? " ok" : "")}>{forgotNote}</div>}
                <button className="primary login-btn" onClick={sendOtp}>Send reset OTP <ArrowRight size={17} /></button>
              </>
            )}
            {forgotStep === "otp" && (
              <>
                <label>Verify OTP<input aria-label="OTP" value={otp} onChange={(e) => { setOtp(e.target.value); setForgotNote(""); }} /></label>
                {forgotNote && <div className="form-error ok">{forgotNote}</div>}
                <div className="login-line"><button className="link" type="button" onClick={sendOtp}>Resend OTP</button></div>
                <button className="primary login-btn" onClick={verifyOtp}>Verify & continue <ArrowRight size={17} /></button>
              </>
            )}
            {forgotStep === "reset" && (
              <>
                <label>New password<input type="password" value={newPass} onChange={(e) => { setNewPass(e.target.value); setForgotNote(""); }} /></label>
                <label>Confirm password<input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setForgotNote(""); }} /></label>
                {forgotNote && <div className="form-error">{forgotNote}</div>}
                <button className="primary login-btn" onClick={doReset}>Reset password <ArrowRight size={17} /></button>
              </>
            )}
            <div className="login-line"><button className="link" type="button" onClick={() => { setView("login"); setForgotNote(""); }}>← Back to sign in</button></div>
          </>
        )}
        <small className="note">UI-only prototype · Local sample data · No backend</small>
      </div>
      <div className="login-visual">
        <div className="grid-art" />
        <div className="visual-copy">
          <span>CONTROL • ACCURACY • TRACEABILITY</span>
          <h2>One workspace for every quotation decision.</h2>
          <p>Customers, projects, rates, quotations, revisions, follow-ups and management reporting in one branch-aware quality system.</p>
        </div>
        <div className="float-card fc1"><Gauge /><div><small>QMS health</small><b>94.6%</b></div></div>
        <div className="float-card fc2"><FileText /><div><small>Active quotations</small><b>42</b></div></div>
      </div>
    </div>
  );
}