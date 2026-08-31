import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIProvider,
  ExceptionExplanation,
  CorrectionSuggestion,
  RecordComparison,
  AISeverity,
  GeneratedValidationRule
} from './provider.interface';
import * as prompts from '../services/ai/prompts/templates';

export class GeminiProvider implements AIProvider {
  public name = 'gemini-1.5-flash';
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  private getModel() {
    return this.genAI.getGenerativeModel({
      model: this.name,
      generationConfig: { responseMimeType: 'application/json' }
    });
  }

  /**
   * Helper to parse and extract JSON clean from generative output
   */
  private cleanAndParseJson<T>(text: string, fallback: T): T {
    try {
      const cleaned = text.replace(/```json|```/gi, '').trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error('[GeminiProvider] JSON parse error on generative response:', err, '\nRaw text:', text);
      return fallback;
    }
  }

  public async explainException(
    loanRecord: Record<string, any>,
    exceptionDetails: Record<string, any>
  ): Promise<ExceptionExplanation> {
    const prompt = prompts.getExplainPrompt(loanRecord, exceptionDetails);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.cleanAndParseJson<ExceptionExplanation>(text, {
        explanation: `Rule ${exceptionDetails.ruleId} violated on ${exceptionDetails.affectedField || 'loan ID'}.`,
        underlyingCause: 'Data verification exception needing human signoff.',
        confidence: 80
      });
    } catch (err: any) {
      console.error('[GeminiProvider] explainException error:', err.message);
      return {
        explanation: `Rule ${exceptionDetails.ruleId} failed. Balance principal check or field format violation.`,
        underlyingCause: 'Validation error.',
        confidence: 70
      };
    }
  }

  public async suggestCorrection(
    loanRecord: Record<string, any>,
    exceptionDetails: Record<string, any>,
    relatedRecords?: Record<string, any>[]
  ): Promise<CorrectionSuggestion> {
    const prompt = prompts.getCorrectionPrompt(loanRecord, exceptionDetails, relatedRecords);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.cleanAndParseJson<CorrectionSuggestion>(text, {
        suggestedValue: exceptionDetails.expectedValue || '',
        suggestedAction: 'EDIT',
        rationale: 'Perform servicer reconciliation audit checks.',
        confidence: 80
      });
    } catch (err: any) {
      console.error('[GeminiProvider] suggestCorrection error:', err.message);
      return {
        suggestedValue: exceptionDetails.expectedValue || '',
        suggestedAction: 'EDIT',
        rationale: 'Review primary and servicer document manifests.',
        confidence: 70
      };
    }
  }

  public async compareRecords(
    sourceTapeRecord: Record<string, any>,
    secondarySourceRecord: Record<string, any>
  ): Promise<RecordComparison> {
    const prompt = prompts.getComparePrompt(sourceTapeRecord, secondarySourceRecord);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.cleanAndParseJson<RecordComparison>(text, {
        isMatch: false,
        mismatchedFields: [],
        notes: 'Records comparison check completed.'
      });
    } catch (err: any) {
      console.error('[GeminiProvider] compareRecords error:', err.message);
      return {
        isMatch: false,
        mismatchedFields: [],
        notes: 'Audit comparison aborted due to system error.'
      };
    }
  }

  public async generateReviewerNote(
    loanRecord: Record<string, any>,
    exceptions: Record<string, any>[]
  ): Promise<string> {
    const prompt = prompts.getReviewerNotePrompt(loanRecord, exceptions);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const res = this.cleanAndParseJson<{ note: string }>(result.response.text(), {
        note: `Audited loan ${loanRecord.loanId}. Discrepancies on exceptions noted.`
      });
      return res.note;
    } catch (err: any) {
      console.error('[GeminiProvider] generateReviewerNote error:', err.message);
      return `Audited loan ${loanRecord.loanId || 'N/A'}. Discrepancies on exceptions noted.`;
    }
  }

  public async classifySeverity(
    exceptionDescription: string,
    context?: Record<string, any>
  ): Promise<AISeverity> {
    const prompt = prompts.getSeverityPrompt(exceptionDescription, context);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const res = this.cleanAndParseJson<{ severity: AISeverity }>(result.response.text(), { severity: 'medium' });
      return res.severity;
    } catch (err: any) {
      console.error('[GeminiProvider] classifySeverity error:', err.message);
      return 'medium';
    }
  }

  public async summarizeExceptions(
    loanRecord: Record<string, any>,
    exceptions: Record<string, any>[]
  ): Promise<string> {
    const prompt = prompts.getReviewerNotePrompt(loanRecord, exceptions); // Fallback templates matching
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      const res = this.cleanAndParseJson<{ note: string }>(result.response.text(), {
        note: 'Validation checks require human review.'
      });
      return res.note;
    } catch (err: any) {
      console.error('[GeminiProvider] summarizeExceptions error:', err.message);
      return 'Discrepancy validation errors awaiting reviewer clearance.';
    }
  }

  public async summarizeExceptionsBatch(
    exceptions: Record<string, any>[]
  ): Promise<any> {
    const prompt = prompts.getSummaryPrompt(exceptions);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      return this.cleanAndParseJson<any>(result.response.text(), {
        totalExceptions: exceptions.length,
        recurringIssuesCount: 0,
        severityDistribution: {},
        commonAffectedFields: [],
        commonRules: [],
        notableConflicts: [],
        reviewerPrioritiesSummary: 'System validation checks require review.'
      });
    } catch (err: any) {
      console.error('[GeminiProvider] summarizeExceptionsBatch error:', err.message);
      return {
        totalExceptions: exceptions.length,
        recurringIssuesCount: 0,
        severityDistribution: {},
        commonAffectedFields: [],
        commonRules: [],
        notableConflicts: [],
        reviewerPrioritiesSummary: 'System validation checks require review.'
      };
    }
  }

  public async generateValidationRule(
    promptDescription: string
  ): Promise<GeneratedValidationRule> {
    const prompt = prompts.getRuleGenPrompt(promptDescription);
    try {
      const model = this.getModel();
      const result = await model.generateContent(prompt);
      return this.cleanAndParseJson<GeneratedValidationRule>(result.response.text(), {
        ruleId: 'R_GEN_01',
        ruleName: 'Auto Generated Rule',
        field: 'current_balance',
        operator: 'gt',
        value: 0,
        errorMessage: 'Balance must exceed zero.',
        severity: 'medium'
      });
    } catch (err: any) {
      console.error('[GeminiProvider] generateValidationRule error:', err.message);
      return {
        ruleId: 'R_GEN_ERR',
        ruleName: 'Failed Generation',
        field: 'none',
        operator: 'eq',
        value: null,
        errorMessage: 'System error generating validation rule.',
        severity: 'low'
      };
    }
  }
}
