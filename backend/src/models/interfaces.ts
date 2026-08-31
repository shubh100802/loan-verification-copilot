import { Document, Types } from 'mongoose';

// 1. User Entity
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'operator' | 'reviewer' | 'consumer';
  createdAt: Date;
  updatedAt: Date;
}

// 2. ImportJob Entity (Tracks ingestion processes)
export interface IImportJob extends Document {
  fileName: string;
  fileType: 'loan_tape' | 'servicer_update' | 'document_manifest';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  uploadedBy: Types.ObjectId; // User Ref
  errorSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 3. Loan Entity (Canonical record of a loan)
export interface ILoan extends Document {
  loanId: string; // Unique primary identifier
  borrowerName: string;
  originationDate: Date;
  maturityDate: Date;
  originalPrincipal: number;
  currentBalance: number;
  interestRate: number;
  paymentStatus: string;
  dpd: number; // Days Past Due
  propertyState: string;
  verificationStatus: 'unverified' | 'in_review' | 'verified' | 'exception';
  documents: {
    documentType: string;
    fileName: string;
    verified: boolean;
    manifestId: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// 4. LoanSourceRecord Entity (Sourced rows for full traceability)
export interface ILoanSourceRecord extends Document {
  loanId: string;
  jobId: Types.ObjectId; // ImportJob Ref
  sourceType: 'loan_tape' | 'servicer_update' | 'document_manifest';
  rawContent: Record<string, any>; // Key-value original row
  normalizedContent?: Record<string, any>;
  status: 'raw' | 'normalized' | 'error';
  createdAt: Date;
}

// 5. Exception Entity (Identified rules violations)
export interface IException extends Document {
  loanId: string;
  sourceRecordId?: Types.ObjectId; // LoanSourceRecord Ref
  ruleId: string; // From validation_rules.json
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'waived';
  resolutionNote?: string;
  resolvedBy?: Types.ObjectId; // User Ref
  resolvedAt?: Date;
  aiRecommendationId?: Types.ObjectId; // AIRecommendation Ref
  createdAt: Date;
  updatedAt: Date;
}

// 6. Review Entity (Action details on resolving exception or manual audit)
export interface IReview extends Document {
  loanId: string;
  reviewerId: Types.ObjectId; // User Ref
  action: 'approve_verification' | 'waive_exception' | 'request_correction';
  exceptionId?: Types.ObjectId; // Exception Ref
  notes: string;
  createdAt: Date;
}

// 7. AIRecommendation Entity (Assistance from Gemini/OpenAI/Custom Models)
export interface IAIRecommendation extends Document {
  exceptionId: Types.ObjectId; // Exception Ref
  suggestedAction: 'approve' | 'waive' | 'correct';
  confidence: number; // 0.0 to 1.0
  explanation: string;
  suggestedValue?: any;
  modelUsed: 'gemini' | 'openai' | 'local_custom';
  createdAt: Date;
}

// 8. VerifiedLoan Entity (Immutable ledger/record of final verified tape)
export interface IVerifiedLoan extends Document {
  loanId: string;
  canonicalRecord: Record<string, any>; // Final verified values
  hashedValue: string; // Integrity verification hash
  verifiedBy: Types.ObjectId; // User Ref
  verifiedAt: Date;
  auditTrailIds: Types.ObjectId[]; // AuditLog Refs
  createdAt: Date;
}

// 9. AuditLog Entity (Historical change logging for strict compliance)
export interface IAuditLog extends Document {
  userId?: Types.ObjectId; // User Ref (System if empty)
  action: string; // e.g. "UPLOAD_FILE", "WAIVE_EXCEPTION", "VERIFY_LOAN"
  entityType: 'User' | 'Loan' | 'ImportJob' | 'Exception' | 'Review' | 'VerifiedLoan';
  entityId: Types.ObjectId;
  changeSummary: string; // Description of modification
  diff?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  ipAddress?: string;
  createdAt: Date;
}
