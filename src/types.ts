export type PermissionAction = "view" | "create" | "update" | "delete";
export interface Permission {
  module: string;
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}
export interface Role {
  id: number;
  name: string;
  isAdmin: boolean;
  level: number;
  permissions: Permission[];
}
export const HIDDEN_ROLE_IDS: ReadonlyArray<number> = [1, 2]; // Super Admin, System Admin
export const isHiddenRole = (roleId: number): boolean => HIDDEN_ROLE_IDS.includes(roleId);
export const isHiddenUser = (user: User): boolean => HIDDEN_ROLE_IDS.includes(user.roleId);
export type Module = Exclude<Page, "Dashboard">;
export type Page =
  | "Dashboard"
  | "Branches"
  | "Customers"
  | "Projects"
  | "Products"
  | "Quotations"
  | "Inspections"
  | "Documents"
  | "FollowUps"
  | "Reports"
  | "Users"
  | "Roles"
  | "Settings";
export type QStatus =
  | "Draft"
  | "Sent"
  | "Under Negotiation"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Converted";

export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string;
  gst: string;
  contact: string;
  status: "Active" | "Inactive";
}
export interface Customer {
  id: number;
  code: string;
  name: string;
  company: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  gst: string;
  branches: string[];
  source: string;
}
export interface Surface {
  id: number;
  category: string;
  finish: string;
  shade: string;
  area: number;
  thickness: string;
  rate: number;
}
export interface ProjectPhoto {
  id: number;
  name: string;
  dataUrl: string;
}
export interface ProjectHistoryEntry {
  id: number;
  date: string;
  stage: string;
  status: string;
  note?: string;
  user: string;
}
export const ProjectType = ["Residential", "Commercial", "Hospitality", "Retail"] as const;
export type ProjectType = (typeof ProjectType)[number];
export interface Project {
  id: number;
  code: string;
  name: string;
  customer: string;
  type: ProjectType;
  stage: string;
  status: "Active" | "On Hold" | "Completed";
  expected: string;
  siteAddress: string;
  siteCity: string;
  siteState: string;
  sitePincode: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  surfaces: Surface[];
  photos: ProjectPhoto[];
  branches: string[];
  history: ProjectHistoryEntry[];
}
export const ProductCategory = [
  "Micro Concrete",
  "Liquid Metal",
  "Luxury Texture",
  "Stucco",
  "Decorative Paint",
  "Stone Finish",
  "Rammed Earth",
  "Metallic Finish",
  "Custom Finish",
] as const;
export type ProductCategory = (typeof ProductCategory)[number];

export const OptionalItemMaster = [
  "Primer",
  "Waterproofing",
  "Crack Treatment",
  "Sealer",
  "Protection Coat",
  "Sample Panel",
  "Stencil Work",
  "CNC Cut Pattern",
  "Liquid Metal Inlay",
  "Transportation",
  "Scaffolding",
] as const;
export type OptionalItem = (typeof OptionalItemMaster)[number];

export interface ProductRateSlab {
  finish: string;
  thickness: string;
  materialRate: number;
  labourRate: number;
}

export interface ProductHistoryEntry {
  id: number;
  date: string;
  field: string;
  oldValue: string;
  newValue: string;
  user: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category: ProductCategory;
  textures: string[];
  finishes: string[];
  shades: string[];
  textureImage: string;
  finishImage: string;
  shadeImages: string[];
  material: string;
  rateSlabs: ProductRateSlab[];
  optionalItems: string[];
  hsn: string;
  gst: number;
  wastage: number;
  transportationSlabs: { distance: string; rate: number }[];
  history: ProductHistoryEntry[];
}
export const ApplicationArea = [
  "Wall",
  "Ceiling",
  "Door",
  "Feature Wall",
  "Exterior",
  "Furniture",
  "Column",
  "Floor",
] as const;
export type ApplicationArea = (typeof ApplicationArea)[number];

export interface QuotationSurfaceItem {
  id: number;
  productCategory: ProductCategory;
  texture: string;
  finish: string;
  shade: string;
  applicationArea: ApplicationArea;
  area: number;
  thickness: string;
  rate: number;
  optionalItems: string[];
  description: string;
  remarks: string;
  materialQuantity: number;
  materialCost: number;
  labourCost: number;
  wastageCost: number;
  transportationCost: number;
  otherCharges: number;
  discount: number;
  discountType: "percentage" | "fixed";
  lineTotal: number;
  hsn: string;
  gstRate: number;
  gstAmount: number;
}

export interface Quotation {
  id: number;
  code: string;
  customer: string;
  project: string;
  branches: string[];
  surfaceItems: QuotationSurfaceItem[];
  optionalItems: string[];
  subtotal: number;
  discount: number;
  discountType: "percentage" | "fixed";
  taxableValue: number;
  gstAmount: number;
  gstRate: number;
  amount: number;
  status: QStatus;
  date: string;
  owner: string;
  revision: number;
  followUp: string;
  category: string;
  placeOfSupply: string;
  additionalCharges: number;
  roundOff: number;
  version: string;
}
export interface Inspection {
  id: number;
  code: string;
  activity: string;
  customer: string;
  status: string;
  date: string;
  notes: string;
  branches: string[];
}
export interface Doc {
  id: number;
  code: string;
  title: string;
  type: string;
  version: string;
  status: string;
  updated: string;
  size: string;
}
export interface FollowUp {
  id: number;
  code: string;
  date: string;
  quotation: string;
  purpose: string;
  owner: string;
  status: string;
  branches: string[];
}
export interface User {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNo: string;
  password: string;
  roleId: number;
  branch: string;
  firm: string;
  status: "Active" | "Inactive";
}

export interface DB {
  branches: Branch[];
  customers: Customer[];
  projects: Project[];
  products: Product[];
  quotations: Quotation[];
  inspections: Inspection[];
  documents: Doc[];
  followups: FollowUp[];
  users: User[];
  roles: Role[];
}

export type EntityName = keyof DB;
