# Phase 4 AI Copilot Integration Technical Documentation

This document describes the design, API contracts, prompt structures, and cryptographic log events for the **Loan Verification Copilot** implemented in Phase 4.

---

## 1. Architectural Details

We implement a layered AI architecture separating frontend client calls, backend authorization layers, orchestrator context compilation, and the model API provider:

1. **Frontend**: Exposes loading states, user review panels, note editors, and record comparisons in [`LoanDetail.tsx`](file:///d:/Intain/frontend/src/pages/LoanDetail.tsx).
2. **REST API Router**: Exposes endpoints on path `/api/v1/ai` in [`api.ts`](file:///d:/Intain/backend/src/routes/api.ts).
3. **AIController**: Enforces RBAC verification checks (`User.role === 'REVIEWER'`) and appends chronological events to the secure `AuditLog` database sequential hash-chain.
4. **GeminiProvider**: Centralizes prompt bindings in [`templates.ts`](file:///d:/Intain/backend/src/services/ai/prompts/templates.ts) and calls `gemini-1.5-flash` with JSON output mode.

---

## 2. API Endpoints Contract

### Explain Validation Failure
* **Method & Path**: `POST /api/v1/ai/exceptions/:id/explain`
* **Query Parameters**: `actorId` (email of the reviewer)
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "explanation": "Brief description...",
      "underlyingCause": "Anomaly classification...",
      "confidence": 95
    }
  }
  ```

### Suggest Likely Correction
* **Method & Path**: `POST /api/v1/ai/exceptions/:id/suggest-correction`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "suggestedValue": "corrected_value",
      "suggestedAction": "EDIT | WAIVE | REQUEST_CORRECTION",
      "rationale": "Audit notes...",
      "confidence": 92
    }
  }
  ```

### Compare Conflicting Records
* **Method & Path**: `POST /api/v1/ai/exceptions/:id/compare`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "isMatch": false,
      "mismatchedFields": [
        {
          "field": "current_balance",
          "sourceAValue": "4500.00",
          "sourceBValue": "4200.00",
          "discrepancyType": "RECONCILIATION_MISMATCH"
        }
      ],
      "notes": "Auditing remarks..."
    }
  }
  ```

### Generate Reviewer Note Block
* **Method & Path**: `POST /api/v1/ai/exceptions/:id/reviewer-note`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "note": "Reconciled interest rate anomaly using dynamic copilot recommendations..."
    }
  }
  ```

### Summarize Batch Exceptions
* **Method & Path**: `POST /api/v1/ai/exceptions/summarize`
* **Request Body**: `{ "exceptionIds": ["EXC-1", "EXC-2"] }`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "totalExceptions": 2,
      "recurringIssuesCount": 1,
      "reviewerPrioritiesSummary": "Paragraph..."
    }
  }
  ```

### Natural Language Rule Generator
* **Method & Path**: `POST /api/v1/ai/validation-rule/generate`
* **Request Body**: `{ "description": "Interest rate must be under 12%" }`
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "ruleId": "R_GEN_01",
      "ruleName": "Interest Rate Limit Assertion",
      "field": "interest_rate",
      "operator": "lt",
      "value": 12,
      "errorMessage": "Interest rate exceeds limits",
      "severity": "medium"
    }
  }
  ```

---

## 3. Cryptographic AI Event Logs

To maintain blockchain hash-chain sequential continuity, the following events are appended to the ledger:

* `AI_RECOMMENDATION_GENERATED` (explain, correction, or comparison checks).
* `AI_REVIEWER_NOTE_GENERATED` (individual note block generation).
* `AI_EXCEPTION_SUMMARY_GENERATED` (batch analysis summaries).
* `AI_RULE_GENERATED` (NL rule synthesis).
