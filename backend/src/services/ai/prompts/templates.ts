/**
 * System prompt instructions and constraints.
 */
const SYSTEM_CONSTRAINTS = `
SYSTEM ROLE:
You are an expert loan data verification auditor and automated risk assessor.

CONSTRAINTS:
1. Impartially evaluate the structured data provided.
2. Never claim certainty when evidence is incomplete or missing.
3. Do not invent loan records, borrowers, or values.
4. Distinguish clearly between source facts (verified database items) and inference (predictions).
5. Always return a valid JSON object conforming exactly to the requested schema. No extra formatting or markdown wrappers.
`;

export function getExplainPrompt(loan: any, exception: any): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Explain why this validation check failed and describe the potential root cause.
    
    INPUT CONTEXT:
    Loan Tape Record:
    ${JSON.stringify(loan, null, 2)}
    
    Active Exception:
    ${JSON.stringify(exception, null, 2)}
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "explanation": "Clear, concise details explaining the rule violation and data inconsistency.",
      "underlyingCause": "Specific reason (e.g. keying error, mismatch between sources, or negative balance anomaly).",
      "confidence": 90
    }
  `;
}

export function getCorrectionPrompt(loan: any, exception: any, related?: any[]): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Suggest a correction or resolution for the active exception based on primary and secondary records.
    
    INPUT CONTEXT:
    Loan Tape Record:
    ${JSON.stringify(loan, null, 2)}
    
    Active Exception:
    ${JSON.stringify(exception, null, 2)}
    
    ${related && related.length > 0 ? `Related Data/Secondary Updates:\n${JSON.stringify(related, null, 2)}` : ''}
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "suggestedValue": "the corrected string, number, or boolean value",
      "suggestedAction": "WAIVE | EDIT | REJECT | REQUEST_CORRECTION",
      "rationale": "Reason justifying this suggestion based on the provided evidence.",
      "confidence": 85
    }
  `;
}

export function getComparePrompt(primary: any, secondary: any): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Compare the primary loan tape record against the secondary servicer update or manifest and highlight discrepancy details.
    
    INPUT CONTEXT:
    Primary Loan Record:
    ${JSON.stringify(primary, null, 2)}
    
    Secondary Source Record:
    ${JSON.stringify(secondary, null, 2)}
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "isMatch": false,
      "mismatchedFields": [
        {
          "field": "affected_field_name",
          "sourceAValue": "value_from_primary_tape",
          "sourceBValue": "value_from_secondary_source",
          "discrepancyType": "RECONCILIATION_MISMATCH"
        }
      ],
      "notes": "Detailed analysis notes explaining which source appears more reliable and why.",
      "confidence": 90
    }
  `;
}

export function getReviewerNotePrompt(loan: any, exceptions: any[]): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Generate a concise, professional reviewer note summing up issues and recommended auditor actions.
    
    INPUT CONTEXT:
    Loan Record:
    ${JSON.stringify(loan, null, 2)}
    
    Exceptions:
    ${JSON.stringify(exceptions, null, 2)}
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "note": "Servicer update indicates X while the loan tape contains Y. The latest source appears more reliable because [...]. Recommended reviewer action: [...]."
    }
  `;
}

export function getSeverityPrompt(description: string, context?: any): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Suggest a severity classification for this validation issue description.
    
    INPUT CONTEXT:
    Issue: "${description}"
    ${context ? `Context details:\n${JSON.stringify(context, null, 2)}` : ''}
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "severity": "low" | "medium" | "high" | "critical",
      "rationale": "Auditing rationale explaining the severity assignment choice."
    }
  `;
}

export function getSummaryPrompt(exceptions: any[]): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Summarize a batch of validation exceptions from the database, identifying recurring problems, affected fields, and suggested priorities.
    
    INPUT CONTEXT:
    Exceptions Batch:
    ${JSON.stringify(exceptions, null, 2)}
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "totalExceptions": 10,
      "recurringIssuesCount": 3,
      "severityDistribution": {
        "critical": 1,
        "high": 4,
        "medium": 3,
        "low": 2
      },
      "commonAffectedFields": ["field_name_1", "field_name_2"],
      "commonRules": ["R006", "R008"],
      "notableConflicts": ["Rule mismatch descriptions..."],
      "reviewerPrioritiesSummary": "Paragraph summing up key actions and order of resolution priority."
    }
  `;
}

export function getRuleGenPrompt(description: string): string {
  return `
    ${SYSTEM_CONSTRAINTS}
    
    TASK:
    Synthesize a structured validation rule matching this natural language request.
    
    INPUT CONTEXT:
    Description: "${description}"
    
    OUTPUT SCHEMA (Return exactly this JSON):
    {
      "ruleId": "R_GEN_01",
      "ruleName": "Short descriptive name",
      "field": "normalized_field_name_affected",
      "operator": "gt | lt | eq | ne | contains",
      "value": "comparison_value_or_number",
      "errorMessage": "Human readable alert message when rule is violated",
      "severity": "low" | "medium" | "high" | "critical"
    }
  `;
}
