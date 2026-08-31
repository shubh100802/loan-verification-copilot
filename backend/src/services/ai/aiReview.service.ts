import { GeminiProvider } from '../../ai/gemini.provider';
import Loan from '../../models/loan.model';

export interface AICopilotRecommendation {
  explanation: string;
  suggestedAction: 'WAIVE' | 'EDIT' | 'REJECT' | 'REQUEST_CORRECTION';
  suggestedValue?: string;
  confidence: number;
}

const gemini = new GeminiProvider();

export class AIReviewService {
  /**
   * Generates a context-aware mock recommendation for a given validation exception rule.
   */
  public static getRecommendation(ruleId: string, affectedField: string, actualValue: string): AICopilotRecommendation {
    switch (ruleId) {
      case 'R001':
        return {
          explanation: `The 'loan_id' field is missing or empty. This prevents linking the record in the ledger.`,
          suggestedAction: 'REQUEST_CORRECTION',
          confidence: 98
        };
      case 'R002':
        return {
          explanation: `The date format for '${affectedField}' is invalid (expected YYYY-MM-DD). Raw value: "${actualValue}".`,
          suggestedAction: 'EDIT',
          suggestedValue: '2024-12-16',
          confidence: 92
        };
      case 'R003':
        return {
          explanation: `The 'original_principal' value (${actualValue}) is negative, violating standard financial accounting bounds.`,
          suggestedAction: 'EDIT',
          suggestedValue: Math.abs(parseFloat(actualValue) || 0).toString(),
          confidence: 95
        };
      case 'R004':
        return {
          explanation: `The 'current_balance' value (${actualValue}) is negative, which usually indicates a credit adjustment or escrow discrepancy.`,
          suggestedAction: 'WAIVE',
          suggestedValue: '0',
          confidence: 91
        };
      case 'R005':
        return {
          explanation: `The maturity date is configured before the origination date. This suggests a potential date swap in the servicing ledger.`,
          suggestedAction: 'EDIT',
          confidence: 96
        };
      case 'R006':
        return {
          explanation: `The outstanding 'current_balance' (${actualValue}) is greater than 'original_principal', which violates standard amortization profiles.`,
          suggestedAction: 'EDIT',
          confidence: 94
        };
      case 'R007':
        return {
          explanation: `Interest rate (${actualValue}%) is out of the valid range (0% - 50%), likely due to a decimal mapping mismatch.`,
          suggestedAction: 'EDIT',
          suggestedValue: (parseFloat(actualValue) / 100 || 4.5).toString(),
          confidence: 89
        };
      case 'R008':
        return {
          explanation: `Payment status is 'CURRENT' but Days Past Due (DPD) is greater than 0, indicating a status synchrony lag.`,
          suggestedAction: 'EDIT',
          suggestedValue: 'DELINQUENT',
          confidence: 93
        };
      case 'R009':
        return {
          explanation: `Duplicate 'loan_id' found in the same file block. This indicates double ingestion processing.`,
          suggestedAction: 'REJECT',
          confidence: 99
        };
      case 'R010':
        return {
          explanation: `Required loan agreement or income documents are not marked as 'AVAILABLE' in the system.`,
          suggestedAction: 'REQUEST_CORRECTION',
          confidence: 90
        };
      case 'R011':
        return {
          explanation: `The record has not been updated for over 365 days. The account may be dormant or closed.`,
          suggestedAction: 'WAIVE',
          confidence: 85
        };
      case 'R012':
        return {
          explanation: `The borrower state code "${actualValue}" does not match standard 2-letter US postal codes.`,
          suggestedAction: 'EDIT',
          suggestedValue: 'NY',
          confidence: 97
        };
      case 'R013':
        return {
          explanation: `The loan status is CLOSED but shows a remaining current balance of ${actualValue}.`,
          suggestedAction: 'EDIT',
          suggestedValue: '0',
          confidence: 95
        };
      case 'R014':
        return {
          explanation: `Duplicate borrower profile combination found (matching borrower_id, original principal, and origination date).`,
          suggestedAction: 'REJECT',
          confidence: 91
        };
      default:
        return {
          explanation: `AI analyzed the exception on '${affectedField}'. Review of manual inputs is recommended.`,
          suggestedAction: 'WAIVE',
          confidence: 80
        };
    }
  }

  /**
   * Performs a live query to the Gemini API if a valid key exists.
   * Otherwise, falls back gracefully to the local mock recommendations.
   */
  public static async getLiveRecommendation(
    ruleId: string,
    affectedField: string,
    actualValue: string,
    loanId: string
  ): Promise<AICopilotRecommendation> {
    const hasLiveKey =
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
      !process.env.GEMINI_API_KEY.includes('change_in_production');

    if (!hasLiveKey) {
      return this.getRecommendation(ruleId, affectedField, actualValue);
    }

    try {
      const loan = await Loan.findOne({ loanId });
      const loanData = loan ? loan.toObject() : {};

      const [explanationRes, correctionRes] = await Promise.all([
        gemini.explainException(loanData, { ruleId, affectedField, actualValue }),
        gemini.suggestCorrection(loanData, { ruleId, affectedField, actualValue })
      ]);

      return {
        explanation: explanationRes.explanation,
        suggestedAction: correctionRes.suggestedAction,
        suggestedValue: correctionRes.suggestedValue,
        confidence: explanationRes.confidence
      };
    } catch (err: any) {
      console.warn('[AIReviewService] Live Gemini recommendation query failed, falling back to mock:', err.message);
      return this.getRecommendation(ruleId, affectedField, actualValue);
    }
  }

  // Prepares the service boundary methods for future Phase 4 extensions
  public static async analyzeException(_exceptionId: string): Promise<any> {
    return { success: true };
  }

  public static async suggestCorrection(_exceptionId: string): Promise<any> {
    return { success: true };
  }

  public static async generateReviewerNote(_exceptionId: string): Promise<any> {
    return { success: true };
  }

  public static async classifySeverity(_exceptionId: string): Promise<any> {
    return { success: true };
  }

  public static async summarizeExceptions(_batchId: string): Promise<any> {
    return { success: true };
  }
}
