# Loan Verification Copilot

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://loan-verification-copilot-seven.vercel.app)
[![Node Version](https://img.shields.io/badge/Node-v18%2B%20%7C%20v20%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-forestgreen?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)
[![Gemini AI](https://img.shields.io/badge/AI%20Copilot-Google%20Gemini-orange?style=for-the-badge&logo=googlegemini)](https://ai.google.dev)

> **Built for the Intain Campus FinTech Challenge 2026 — Full Stack Track**

The **Loan Verification Copilot** is a high-assurance financial ingestion, validation, and AI-assisted verification platform. It ingests complex loan tapes, normalizes records across disparate sources (Loan Tape, Document Manifest, and Servicer Updates), enforces 14 deterministic financial validation rules, provides real-time Gemini AI assistance for exception resolution, and records every decision on an immutable SHA-256 cryptographic audit trail.

---

## 🌐 Live Production Application

* **Live URL:** [https://loan-verification-copilot-seven.vercel.app](https://loan-verification-copilot-seven.vercel.app)
* **GitHub Repository:** [https://github.com/shubh100802/loan-verification-copilot.git](https://github.com/shubh100802/loan-verification-copilot.git)

### Demo Credentials (Role-Based Access Control)
| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Data Operator** | `operator@demo.local` | `password` | Ingest CSV tapes, view quality trends, edit loan fields. |
| **Exception Reviewer** | `reviewer@demo.local` | `password` | Review exceptions, trigger AI Copilot, waive/resolve discrepancies, verify loans. |
| **Data Consumer / Lead** | `lead@demo.local` | `password` | Inspect certified verified records, verify cryptographic hash-chains, export data. |

*(Quick-login role switcher buttons are available directly on the login page).*

---

## 🚀 Quick Instructions to Run Locally

### Prerequisites
* **Node.js**: `v18.x` or `v20.x` or higher
* **npm**: `v9.x` or higher
* **MongoDB**: Local instance (`mongodb://localhost:27017`) or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/shubh100802/loan-verification-copilot.git
cd loan-verification-copilot
```

---

### Step 2: Install All Dependencies
Install dependencies across the monorepo root, backend, and frontend:
```bash
npm run install:all
```
*(Or individually: `npm install`, `npm install --prefix backend`, `npm install --prefix frontend`)*

---

### Step 3: Configure Environment Variables
Copy the `.env.example` template:
```bash
cp .env.example .env
```

Edit `.env` with your database and API credentials:
```env
PORT=3001
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/intain-loan-verification?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
JWT_SECRET=your_jwt_secret_here
```
*(Note: If no Gemini API key is supplied, the built-in fail-safe provider automatically delivers valid, schema-compliant fallback insights).*

---

### Step 4: Seed Database (Optional / Clean Slate)
To populate default user accounts and initial datasets, run:
```bash
npm run seed --prefix backend
```

---

### Step 5: Start Development Servers
Start both the Express API and Vite React frontend in parallel:
```bash
npm run dev
```

* **Frontend UI:** [http://localhost:3000](http://localhost:3000)
* **Backend API:** [http://localhost:3001](http://localhost:3001)
* **API Health Check:** [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

---

### Step 6: Run Automated Verification Tests
Run the test suite verifying all 14 validation rules, CSV parsing, hash chaining, and AI endpoints:
```bash
npm test --prefix backend
```

To verify production bundle compilation:
```bash
npm run build
```

---

## 📋 End-to-End Reviewer Testing Guide

Follow this sequential workflow to test all application capabilities:

```
DATA OPERATOR (Ingestion) ➔ REVIEWER (AI Copilot & Resolution) ➔ DATA CONSUMER (Ledger & Audit Trail)
```

### 1. Ingestion Workflow (Data Operator)
1. Navigate to `http://localhost:3000/login` and log in as **Data Operator** (`operator@demo.local` / `password`).
2. Go to **Ingest Tape / Upload** in the sidebar.
3. Ingest the datasets in the following relational order:
   - **Upload 1:** File `data/loan_tape.csv` → Select Type: **Loan Tape**.
   - **Upload 2:** File `data/document_manifest.csv` → Select Type: **Document Manifest**.
   - **Upload 3:** File `data/servicer_update.csv` → Select Type: **Servicer Update**.
4. Observe the Operator Dashboard update with record counts, data quality scores, and exception breakdown charts.

### 2. AI Copilot & Exception Resolution (Reviewer)
1. Log out and sign in as **Reviewer** (`reviewer@demo.local` / `password`).
2. Open the **Exception Queue** and select any exception (e.g. `LN-00576` or `LN-01999`).
3. In the right-hand **Loan Verification Copilot** panel:
   - Click **Run AI Copilot Analysis**.
   - Review the explanation, evidence matrix, generated reviewer note, and suggested action (e.g. `Set document_status → AVAILABLE`).
4. Click **Accept AI Recommendation** (or enter manual notes and click **Waive Exception**).
5. Once exceptions are cleared, click **Verify Loan Record** to sign off and seal the cryptographic block.

### 3. Verification Ledger & Cryptographic Audit Trail (Data Consumer)
1. Log in as **Data Consumer / Lead** (`lead@demo.local` / `password`).
2. Navigate to **Verified Records** (`/consumer/verified`) to inspect the certified record, canonical field values, and SHA-256 token.
3. Open the **Audit Trail** to inspect the chronological event chain (`IMPORT` → `EXCEPTION` → `AI_RECOMMENDATION` → `RESOLUTION` → `VERIFIED_RECORD_CREATED`).

---

## 🛡️ Core Validation Rules Enforced (`R001`–`R014`)

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| **R001** | Missing Required Fields | Flags missing Borrower ID, Origination Date, Maturity Date, or State. |
| **R002** | Numeric Balance Boundaries | Flags `currentBalance < 0` or `originalPrincipal <= 0`. |
| **R003** | Principal vs Balance Consistency | Flags records where `currentBalance > originalPrincipal`. |
| **R004** | Interest Rate Feasibility | Flags interest rates outside `[0.0%, 36.0%]`. |
| **R005** | Maturity Chronology | Flags `maturityDate <= originationDate`. |
| **R006** | Servicer Balance Discrepancy | Cross-checks tape balance against servicer balance (tolerance > ₹100). |
| **R007** | Interest Rate Variance | Reconciles servicer interest rate with loan tape rate. |
| **R008** | DPD & Status Synchrony | Verifies `CURRENT` loans have `DPD == 0` and `DEFAULT` loans have `DPD >= 90`. |
| **R009** | Valid Credit Grade | Enforces standard credit ratings (`A`, `B`, `C`, `D`, `E`, `F`). |
| **R010** | Document Status Present | Verifies mandatory documents (e.g. `INCOME_PROOF`) are `AVAILABLE`. |
| **R011** | Valid Loan Purpose | Ensures standardized purpose tags (`PERSONAL`, `AUTO`, `MORTGAGE`, `EDUCATION`). |
| **R012** | Valid State Code | Validates 2-letter US/State geographic codes. |
| **R013** | Principal Balance Difference | Cross-reconciles principal reduction milestones. |
| **R014** | Duplicate Borrower Combination | Detects duplicate `(borrower_id, original_principal, origination_date)` tuples. |

---

## 🔌 Primary REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Authenticate users and retrieve role session. |
| `GET` | `/api/v1/loans` | Paginated query of loan records with filter parameters. |
| `GET` | `/api/v1/loans/:id` | Detailed loan metadata and embedded documents. |
| `PATCH` | `/api/v1/loans/:id` | Inline field corrections with automatic validation re-runs. |
| `POST` | `/api/v1/imports` | Multipart CSV ingestion endpoint (`loan_tape`, `servicer_update`, `document_manifest`). |
| `GET` | `/api/v1/exceptions` | Retrieve open exception queue items with severity filters. |
| `POST` | `/api/v1/reviews` | Submit reviewer resolution decision (`waive`, `request_correction`). |
| `POST` | `/api/v1/verified-loans/:id/verify` | Generate immutable SHA-256 verification block. |
| `GET` | `/api/v1/verified-loans` | Retrieve all certified records for downstream consumers. |
| `GET` | `/api/v1/audit/:loanId` | Retrieve complete sequential audit ledger for a loan. |
| `POST` | `/api/v1/ai/exceptions/:id/explain` | Real Gemini AI exception analysis and suggested action. |

---

## 📂 Repository File Tree

```
├── api/                           # Vercel Serverless Function Handler
│   └── index.ts
├── backend/                       # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── ai/                    # Gemini Provider & Hybrid AI Interface
│   │   ├── audit/                 # Blockchain Hash-Chaining Ledger Service
│   │   ├── config/                # MongoDB Connection & Configs
│   │   ├── controllers/           # API Controllers (Auth, Import, Loan, AI, Verified)
│   │   ├── middleware/            # RBAC & Error Middlewares
│   │   ├── models/                # Mongoose Models (Loan, Exception, AuditLog, etc.)
│   │   ├── routes/                # Express Route Definitions
│   │   ├── services/              # Validation Engine & Ingestion Pipeline
│   │   ├── tests/                 # Automated Test Suite & Seed Scripts
│   │   └── server.ts              # Express API Bootstrap
│   ├── package.json
│   └── tsconfig.json
├── frontend/                      # React 18 + Vite + Tailwind Client
│   ├── src/
│   │   ├── components/            # Reusable UI Cards, Tables & Charts
│   │   ├── layouts/               # Role-Based App Shell & Navigation
│   │   ├── pages/                 # Operator, Reviewer, and Consumer Dashboards
│   │   ├── routes/                # Protected Client Routing
│   │   ├── services/              # API Client Connection Layer
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── data/                          # Sample CSV Datasets & Validation Rules
│   ├── loan_tape.csv
│   ├── servicer_update.csv
│   ├── document_manifest.csv
│   └── users.json
├── docs/                          # Architecture & Data Models Documentation
├── vercel.json                    # Full-Stack Vercel Deployment Specification
├── render.yaml                    # Render Blueprint Specification
├── package.json                   # Root Monorepo Orchestration
└── README.md
```
