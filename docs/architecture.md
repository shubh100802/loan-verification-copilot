# Architecture & System Design

This document details the software architecture and component design for the **Loan Data Verification Copilot**.

---

## 1. High-Level Architecture Flow

The system is organized as a monorepo containing a React/Vite frontend and a Node/Express backend communicating via a REST API.

```text
React/Vite (Frontend)
     ↓ (HTTP / REST API)
Node/Express (Backend)
     ↓ (Controller Layer)
Service Layer (Business / AI Coordination)
     ↓ (Mongoose ODM)
MongoDB (Database)

AI Service Layer
     ├─ Custom/Local Model (Local validation & severity checks)
     └─ External LLM (Gemini / OpenAI for explanations & suggestions)

Future Audit Layer
     └─ Cryptographic Traceability Ledger (SHA-256 integrity logs)
```

---

## 2. Layer Responsibilities

### 2.1 Frontend (React / Vite)
* **Goal**: Deliver a high-performance web interface with real-time UI/UX feedback for Operators and Reviewers.
* **Responsibilities**:
  * **Routing**: Set up using React Router with role-based routing (Operator vs. Reviewer vs. Consumer).
  * **State Management**: Managed via TanStack Query (React Query) for server-state caching, automatic refetches, and mutations.
  * **Styling**: Structured using Tailwind CSS for clean layout design, dark mode rendering, and responsive utilities.
  * **Asset Rendering**: Lucide React for consistent and crisp vector icons.
  * **AI Copilot Sidebar**: Interface elements presenting automated analysis and suggestion inputs to reviewers.

### 2.2 Backend (Node.js / Express.js)
* **Goal**: Serve a RESTful JSON API managing users, files, exceptions, and audit logs.
* **Responsibilities**:
  * **Routing Layer**: Exposes secure API endpoints (e.g. `/api/v1/health`, `/api/v1/loans`).
  * **Controllers**: Extracts incoming payload metadata, coordinates logic execution, and formats API responses.
  * **Services**: Encapsulates all domain-specific validation logic, AI coordination, and CSV parsing flows.
  * **Middlewares**: Implements CORS, JSON parsing, error boundaries, request validation, and JWT security.
  * **Validators**: Uses robust, declarative validation models to ensure payload sanity.

### 2.3 Database Layer (MongoDB / Mongoose)
* **Goal**: Provide schema-enforced, index-optimized storage for loan datasets and system status tracking.
* **Responsibilities**:
  * **Data Integrity**: Enforced through Mongoose Schema definitions.
  * **Traceability**: Linkage between Import Jobs, Raw Source Records, and canonical Loans.
  * **Audit Log Trail**: Preserves modification histories, user actions, and differential snapshots.
  * **Indexing**: Promotes high-speed retrieval of loans by `loanId`, `verificationStatus`, and `dpd`.

### 2.4 AI Service (Hybrid Provider Architecture)
* **Goal**: Coordinate automated checking, exception analysis, and text generation using local and external models.
* **Responsibilities**:
  * **AIProvider Abstraction**: A standardized interface (`AIProvider`) decoupling backend components from concrete LLM APIs.
  * **External LLM (Google Gemini)**: Real-time context-aware analysis via `gemini-1.5-flash` with strict structured JSON responses for validation explanation, correction suggestions, record comparisons, reviewer note generation, batch summaries, and natural language rule synthesis.
  * **Centralized Prompts**: Templates located in `backend/src/services/ai/prompts/templates.ts` to enforce system roles and output schemas.
  * **Cryptographic AI Logging**: Every AI response logs custom metadata into the sequential Mongoose database ledger (AuditLog) to prevent tampering.

### 2.5 Dataset Layer (Raw Inputs)
* **Goal**: Preserves the original file inputs (`loan_tape.csv`, `servicer_update.csv`, `document_manifest.csv`, `validation_rules.json`) intact.
* **Responsibilities**:
  * **Preservation**: Ensure the source data remains unmodified and available for raw reference or system resets.
  * **Rules Config**: Reads `validation_rules.json` to bootstrap validation check conditions dynamically.

---

## 3. Security and Compliance Design

### 3.1 Traceability & Audit Trail
* Every write or state mutation triggers an automatic creation of an `AuditLog` entry.
* The audit log tracks: "Who, When, What and How", capturing the raw payload differential (before/after snapshots).

### 3.2 Cryptographic Integrity
* Finalized verified records are compiled into a canonical layout, serialized, and hashed using SHA-256.
* Any future tampering with the verified table or files will break the hashes, ensuring complete audit verifiability.
