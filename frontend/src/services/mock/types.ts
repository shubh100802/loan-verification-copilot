export interface User {
  id: string;
  email: string;
  name: string;
  role: 'operator' | 'reviewer' | 'consumer';
}

export interface Loan {
  loanId: string;
  borrowerName: string;
  borrowerId: string;
  loanType: string;
  originationDate: string;
  maturityDate: string;
  originalPrincipal: number;
  currentBalance: number;
  interestRate: number;
  paymentStatus: string;
  dpd: number;
  propertyState: string;
  loanPurpose: string;
  creditGrade: string;
  verificationStatus: 'unverified' | 'in_review' | 'verified' | 'exception';
  servicerName: string;
  lastUpdated: string;
  documents: {
    documentType: string;
    fileName: string;
    verified: boolean;
    manifestId: string;
  }[];
}

export interface ImportJob {
  id: string;
  fileName: string;
  fileType: 'loan_tape' | 'servicer_update' | 'document_manifest';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  uploadedBy: string; // User Name
  createdAt: string;
}

export interface Exception {
  id: string;
  loanId: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'waived';
  affectedField: string;
  expectedValue?: string;
  actualValue?: string;
  resolutionNote?: string;
  resolvedBy?: string; // User Name
  resolvedAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  loanId: string;
  reviewerId: string;
  reviewerName: string;
  action: 'approve_verification' | 'waive_exception' | 'request_correction' | 'edit_record';
  exceptionId?: string;
  notes: string;
  createdAt: string;
}

export interface AIRecommendation {
  id: string;
  exceptionId: string;
  loanId: string;
  suggestedAction: 'approve' | 'waive' | 'correct';
  confidence: number; // Percentage (e.g. 91)
  explanation: string;
  suggestedValue?: any;
  modelUsed: 'gemini' | 'openai' | 'local_custom';
}

export interface AuditLog {
  id: string;
  loanId: string;
  actor: string;
  action: string;
  entityType: 'User' | 'Loan' | 'ImportJob' | 'Exception' | 'Review' | 'VerifiedLoan';
  changeSummary: string;
  diff?: {
    field: string;
    before: any;
    after: any;
  };
  createdAt: string;
}

export interface DashboardSummary {
  totalRecords: number;
  validRecords: number;
  exceptionsCount: number;
  criticalExceptionsCount: number;
  qualityScore: number;
  verificationRate: number;
  pendingExceptions: number;
  recordsReviewedToday: number;
  approvedCount: number;
  rejectedCount: number;
  correctionRequestsCount: number;
}
