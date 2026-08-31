/**
 * Represents the severity classification of an exception.
 */
export type AISeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Result structure for exception explanations.
 */
export interface ExceptionExplanation {
  explanation: string;
  underlyingCause: string;
  confidence: number;
}

/**
 * Result structure for correction suggestions.
 */
export interface CorrectionSuggestion {
  suggestedValue: any;
  suggestedAction: 'WAIVE' | 'EDIT' | 'REJECT' | 'REQUEST_CORRECTION';
  rationale: string;
  confidence: number;
}

/**
 * Result structure for record comparisons.
 */
export interface RecordComparison {
  isMatch: boolean;
  mismatchedFields: {
    field: string;
    sourceAValue: any;
    sourceBValue: any;
    discrepancyType: string;
  }[];
  notes: string;
}

/**
 * Result structure for validation rules generated dynamically.
 */
export interface GeneratedValidationRule {
  ruleId: string;
  ruleName: string;
  field: string;
  operator: string;
  value: any;
  errorMessage: string;
  severity: AISeverity;
}

/**
 * The standard AIProvider interface that both local models
 * and external LLMs (Gemini, OpenAI) must implement.
 */
export interface AIProvider {
  name: string;

  /**
   * Explains why a validation exception occurred given the context.
   */
  explainException(
    loanRecord: Record<string, any>,
    exceptionDetails: Record<string, any>
  ): Promise<ExceptionExplanation>;

  /**
   * Suggests correction values for a failed validation check.
   */
  suggestCorrection(
    loanRecord: Record<string, any>,
    exceptionDetails: Record<string, any>,
    relatedRecords?: Record<string, any>[]
  ): Promise<CorrectionSuggestion>;

  /**
   * Compares a core tape loan record with an secondary update/document manifest source.
   */
  compareRecords(
    sourceTapeRecord: Record<string, any>,
    secondarySourceRecord: Record<string, any>
  ): Promise<RecordComparison>;

  /**
   * Generates a concise reviewer log or note summing up issues and status.
   */
  generateReviewerNote(
    loanRecord: Record<string, any>,
    exceptions: Record<string, any>[]
  ): Promise<string>;

  /**
   * Classifies severity of an exception or group of exceptions.
   */
  classifySeverity(
    exceptionDescription: string,
    context?: Record<string, any>
  ): Promise<AISeverity>;

  /**
   * Summarizes all open exceptions for a loan to provide an executive summary.
   */
  summarizeExceptions(
    loanRecord: Record<string, any>,
    exceptions: Record<string, any>[]
  ): Promise<string>;

  /**
   * Generates a new machine-readable validation rule from dynamic prompt descriptions.
   */
  generateValidationRule(
    promptDescription: string
  ): Promise<GeneratedValidationRule>;
}
