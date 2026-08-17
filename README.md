# Artelier QMS — UI-only Clickable Prototype

Standalone Vite + React + TypeScript prototype.

## Scope basis
This prototype is based on the uploaded Artelier QMS Scope Review, BRD and PRD. The source defines a centralised, multi-branch quotation management system and identifies Quotation Builder as the core module.

Implemented prototype areas:
- Login & role simulation
- Branch Management & Access Control
- Dashboard
- Customer & Contact Management
- Project Details
- Product Library & Rate Master
- Quotation Builder
- Discount
- GST & final cost summary
- Quotation preview / sharing simulation
- Revision / status / follow-up management
- Reports & analytics
- Documents, inspections, users and settings supporting the clickable prototype

## Prototype roles
The requested prototype roles are Admin, Staff and Customer. The source scope defines Admin and Branch User; `Staff` is used in the UI as the requested label for the branch-user experience.

## Data / behaviour
- No backend.
- Local sample data and in-memory React state.
- Navigation, forms, filters, search, status changes, quotation creation, surface items, discount, GST summary, preview and prototype sharing actions are interactive.
- Responsive for desktop, tablet and mobile.

## Run
```bash
npm install
npm run dev
```

The prototype is intentionally a UI/interaction prototype, not a production implementation.
