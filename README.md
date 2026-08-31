# Loan Verification Copilot

## Challenge Context
This project is built for the **Intain Campus FinTech Challenge 2026 — Full Stack Track**.

The application ingests messy loan data, normalizes and validates it, detects validation exceptions, leverages a hybrid AI architecture to assist reviewers, creates verified loan records, and maintains a complete traceability/audit history.

---

## Current Status: Phase 4 Completed (Real AI Copilot Integration)

All AI capabilities, REST API endpoints, centralized prompts, and UI copilot controls are now fully integrated and verified:
1. **Real Gemini Integration**: Connects to the `gemini-1.5-flash` model on the backend, using centralized prompt templates inside `backend/src/services/ai/prompts/templates.ts`.
2. **Context-Aware Recommendations**: Computes and formats real-time exception explanations, resolution suggestions, discrepancy comparisons, and reviewer notes.
3. **Structured JSON Schemas**: Enforces strict backend-level JSON schemas with automatic markdown cleanup to prevent output parse failures.
4. **AI-Related Cryptographic Audit Logs**: Logs actions such as recommendation generation, note creation, batch summaries, and rule synthesis into the chronological DB ledger.
5. **Interactive Frontend Overlays**: Features a manual "Run AI Copilot Analysis" trigger in the Loan Detail exception card, providing loading skeletons, severity suggested tags, note editors, and discrepancy source indicators.

---

## Technical Stack

### Frontend
- **React 18** + **Vite** (Next-generation build tool)
- **TypeScript** (Strict compiler settings)
- **Tailwind CSS** (Utility-first styling framework with custom colors override)
- **React Router 6** (Dynamic client routing & role guards)
- **TanStack Query v5** (Server state synchronization)
- **Lucide React** (Consistent UI icon kit)

### Backend
- **Node.js** & **Express.js** API
- **TypeScript** (Strict compiler settings)
- **Mongoose / MongoDB** (Data modeling & storage)
- **Dotenv** (Environment variable loading)

### AI Service
- **Hybrid AI Provider Interface** supporting Custom Local Models & External LLM APIs (Gemini + OpenAI).

---

## Monorepo Project Structure

```text
intain-loan-verification/
│
├── frontend/                     # React + Vite Client Application
│   ├── src/
│   │   ├── components/           # Reusable UI Components
│   │   ├── layouts/              # Visual Layout Templates
│   │   ├── pages/                # Page View Controllers
│   │   ├── routes/               # Routing Configuration (AppRoutes.tsx)
│   │   ├── services/             # API Connection Layer
│   │   ├── hooks/                # Custom React Hooks
│   │   ├── lib/                  # Shared Utility Scaffolds
│   │   ├── types/                # Frontend Interface Definitions
│   │   ├── constants/            # Common Client Settings
│   │   ├── assets/               # Local Images / Fonts
│   │   ├── App.tsx               # App Root Wrapper (Providers, Layout)
│   │   └── main.tsx              # React Entry Bootstrap
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express API Service
│   ├── src/
│   │   ├── config/               # System & DB Connections
│   │   ├── controllers/          # HTTP Request Handling
│   │   ├── routes/               # API Router Paths (health, etc.)
│   │   ├── services/             # Core Business / AI logic
│   │   ├── models/               # MongoDB Mongoose Schema Structures
│   │   ├── middleware/           # Request Filters / Security
│   │   ├── validators/           # Body Payload Validation Models
│   │   ├── ai/                   # AIProvider Abstraction & Stubs
│   │   ├── utils/                # Helper Scripts
│   │   ├── types/                # Typings for Backend Objects
│   │   ├── app.ts                # Express Setup & Routes
│   │   └── server.ts             # API Bootstrap Entrypoint
│   ├── tsconfig.json
│   └── package.json
│
├── data/                         # Ingestion Datasets (CSV & JSON)
│   ├── loan_tape.csv
│   ├── servicer_update.csv
│   ├── document_manifest.csv
│   ├── validation_rules.json
│   ├── users.json
│   ├── expected_exception_sample.csv
│   └── DATASET_README.md
│
├── docs/                         # Architecture & Architecture Guidelines
│   ├── data-model.md             # DB Schemas & Document Lifecycle
│   └── architecture.md           # Visual Layout flows & Layers
│
├── package.json                  # Root Monorepo Scripts
├── .gitignore                    # System Exclusions Configuration
└── .env.example                  # Environment Variables Scaffold
```

---

## Installation & Setup

Ensure you have **Node.js (v18+ or v20+)** and **npm** installed.

### 1. Install All Dependencies
To install dependencies for root, frontend, and backend projects, execute the following script from the project root:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` in the project root:
```bash
cp .env.example .env
```
*(No API keys or DB connections are needed for Phase 2 verification; the system runs off default mock state services.)*

### 3. Run Development Servers
To run both the React Vite frontend and the Express backend in parallel, run:
```bash
npm run dev
```

Alternatively, you can run services individually:
- Run Frontend only: `npm run dev:frontend` (available at http://localhost:3000)
- Run Backend only: `npm run dev:backend` (available at http://localhost:3001)

### 4. Build for Production
To build both applications::
```bash
npm run build
```
