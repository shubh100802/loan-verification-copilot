import { Loan, Exception, AIRecommendation, ImportJob, AuditLog, Review } from './types';

// Mock Users
export const MOCK_USERS = [
  { id: '1', email: 'operator@demo.local', name: 'Data Operator', role: 'operator' },
  { id: '2', email: 'reviewer@demo.local', name: 'Reviewer', role: 'reviewer' },
  { id: '3', email: 'consumer@demo.local', name: 'Data Consumer', role: 'consumer' }
] as const;

// In-memory Database state
export let loansDb: Loan[] = [
  {
    loanId: 'LN-10024',
    borrowerName: 'Sarah Jenkins',
    borrowerId: 'BR-82749',
    loanType: 'Residential Mortgage',
    originationDate: '2024-03-15',
    maturityDate: '2054-03-15',
    originalPrincipal: 500000,
    currentBalance: 525000, // Exception: Balance exceeds Principal
    interestRate: 6.85,
    paymentStatus: 'CURRENT',
    dpd: 0,
    propertyState: 'NY',
    loanPurpose: 'Purchase',
    creditGrade: 'AA',
    verificationStatus: 'exception',
    servicerName: 'Apex Servicing Corp',
    lastUpdated: '2026-08-25T14:30:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10024_Note.pdf', verified: true, manifestId: 'DOC-821' },
      { documentType: 'Mortgage Deed', fileName: 'LN-10024_Deed.pdf', verified: true, manifestId: 'DOC-822' },
      { documentType: 'Appraisal Report', fileName: 'LN-10024_Appraisal.pdf', verified: false, manifestId: 'DOC-823' }
    ]
  },
  {
    loanId: 'LN-10087',
    borrowerName: 'Michael Chang',
    borrowerId: 'BR-39482',
    loanType: 'Commercial Real Estate',
    originationDate: '2024-05-10',
    maturityDate: '2023-05-10', // Exception: Maturity before origination
    originalPrincipal: 1200000,
    currentBalance: 1180000,
    interestRate: 7.25,
    paymentStatus: 'CURRENT',
    dpd: 0,
    propertyState: 'CA',
    loanPurpose: 'Refinance',
    creditGrade: 'A',
    verificationStatus: 'exception',
    servicerName: 'Apex Servicing Corp',
    lastUpdated: '2026-08-25T14:30:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10087_Note.pdf', verified: true, manifestId: 'DOC-901' },
      { documentType: 'Title Insurance', fileName: 'LN-10087_Title.pdf', verified: true, manifestId: 'DOC-902' }
    ]
  },
  {
    loanId: 'LN-10204',
    borrowerName: 'Emma Watson',
    borrowerId: 'BR-93821',
    loanType: 'Auto Loan',
    originationDate: '2025-01-20',
    maturityDate: '2030-01-20',
    originalPrincipal: 45000,
    currentBalance: 42000,
    interestRate: 9.99,
    paymentStatus: 'CURRENT', // Exception: status current but DPD > 0
    dpd: 45,
    propertyState: 'TX',
    loanPurpose: 'Purchase',
    creditGrade: 'B',
    verificationStatus: 'exception',
    servicerName: 'Summit Auto Finance',
    lastUpdated: '2026-08-25T15:10:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10204_Note.pdf', verified: true, manifestId: 'DOC-102' }
    ]
  },
  {
    loanId: 'LN-10115',
    borrowerName: 'David Miller',
    borrowerId: 'BR-44921',
    loanType: 'Residential Mortgage',
    originationDate: '2023-11-01',
    maturityDate: '2053-11-01',
    originalPrincipal: 320000,
    currentBalance: 312000,
    interestRate: 6.25,
    paymentStatus: 'CURRENT',
    dpd: 0,
    propertyState: 'FL',
    loanPurpose: 'Purchase',
    creditGrade: 'A',
    verificationStatus: 'verified', // Verified Loan
    servicerName: 'Apex Servicing Corp',
    lastUpdated: '2026-08-26T09:40:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10115_Note.pdf', verified: true, manifestId: 'DOC-331' },
      { documentType: 'Mortgage Deed', fileName: 'LN-10115_Deed.pdf', verified: true, manifestId: 'DOC-332' }
    ]
  },
  {
    loanId: 'LN-10332',
    borrowerName: 'James Robert',
    borrowerId: 'BR-72134',
    loanType: 'Unsecured Personal Loan',
    originationDate: '2025-06-15',
    maturityDate: '2028-06-15',
    originalPrincipal: 15000,
    currentBalance: 12400,
    interestRate: 14.50,
    paymentStatus: 'CURRENT',
    dpd: 0,
    propertyState: 'XX', // Exception: Invalid State Code
    loanPurpose: 'Debt Consolidation',
    creditGrade: 'C',
    verificationStatus: 'exception',
    servicerName: 'Beacon Personal Lending',
    lastUpdated: '2026-08-25T15:20:00Z',
    documents: [
      { documentType: 'Agreement', fileName: 'LN-10332_Agreement.pdf', verified: true, manifestId: 'DOC-401' }
    ]
  },
  {
    loanId: 'LN-10450',
    borrowerName: 'Linda Thompson',
    borrowerId: 'BR-59281',
    loanType: 'Residential Mortgage',
    originationDate: '2022-08-10',
    maturityDate: '2052-08-10',
    originalPrincipal: 450000,
    currentBalance: 15400,
    interestRate: 4.75,
    paymentStatus: 'CLOSED', // Exception: CLOSED loan with positive balance
    dpd: 0,
    propertyState: 'NJ',
    loanPurpose: 'Refinance',
    creditGrade: 'A',
    verificationStatus: 'exception',
    servicerName: 'Summit Auto Finance',
    lastUpdated: '2026-08-25T16:00:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10450_Note.pdf', verified: true, manifestId: 'DOC-551' }
    ]
  },
  {
    loanId: 'LN-10512',
    borrowerName: 'Robert Garcia',
    borrowerId: 'BR-38291',
    loanType: 'Residential Mortgage',
    originationDate: '2024-10-01',
    maturityDate: '2054-10-01',
    originalPrincipal: 280000,
    currentBalance: 275000,
    interestRate: 6.50,
    paymentStatus: 'CURRENT',
    dpd: 0,
    propertyState: 'IL',
    loanPurpose: 'Purchase',
    creditGrade: 'B',
    verificationStatus: 'unverified', // Valid & awaiting review
    servicerName: 'Apex Servicing Corp',
    lastUpdated: '2026-08-26T11:00:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10512_Note.pdf', verified: false, manifestId: 'DOC-621' }
    ]
  },
  {
    loanId: 'LN-10700',
    borrowerName: 'Patricia Davis',
    borrowerId: 'BR-10492',
    loanType: 'Residential Mortgage',
    originationDate: '2024-02-12',
    maturityDate: '2054-02-12',
    originalPrincipal: 620000,
    currentBalance: 610000,
    interestRate: 7.125,
    paymentStatus: 'CURRENT',
    dpd: 0,
    propertyState: 'MA',
    loanPurpose: 'Purchase',
    creditGrade: 'A',
    verificationStatus: 'in_review', // Currently in review
    servicerName: 'Apex Servicing Corp',
    lastUpdated: '2026-08-26T12:00:00Z',
    documents: [
      { documentType: 'Note', fileName: 'LN-10700_Note.pdf', verified: true, manifestId: 'DOC-701' }
    ]
  }
];

export let exceptionsDb: Exception[] = [
  {
    id: 'EXC-001',
    loanId: 'LN-10024',
    ruleId: 'R006',
    ruleName: 'Balance not above principal',
    severity: 'high',
    description: 'Current balance of ₹525,000 exceeds the original principal amount of ₹500,000.',
    status: 'open',
    affectedField: 'currentBalance',
    expectedValue: '≤ 500,000',
    actualValue: '525,000',
    createdAt: '2026-08-25T14:30:00Z'
  },
  {
    id: 'EXC-002',
    loanId: 'LN-10087',
    ruleId: 'R005',
    ruleName: 'Maturity after origination',
    severity: 'critical',
    description: 'Maturity date (2023-05-10) is prior to the loan origination date (2024-05-10).',
    status: 'open',
    affectedField: 'maturityDate',
    expectedValue: 'after 2024-05-10',
    actualValue: '2023-05-10',
    createdAt: '2026-08-25T14:30:00Z'
  },
  {
    id: 'EXC-003',
    loanId: 'LN-10204',
    ruleId: 'R008',
    ruleName: 'Payment status consistency',
    severity: 'medium',
    description: 'Loan payment status is marked as CURRENT, but Days Past Due (DPD) is 45.',
    status: 'open',
    affectedField: 'paymentStatus',
    expectedValue: 'CURRENT implies DPD = 0',
    actualValue: 'CURRENT (DPD = 45)',
    createdAt: '2026-08-25T15:10:00Z'
  },
  {
    id: 'EXC-004',
    loanId: 'LN-10332',
    ruleId: 'R012',
    ruleName: 'Valid state code',
    severity: 'low',
    description: 'Property state value "XX" is not a valid US state code.',
    status: 'open',
    affectedField: 'propertyState',
    expectedValue: 'Valid US State Code',
    actualValue: 'XX',
    createdAt: '2026-08-25T15:20:00Z'
  },
  {
    id: 'EXC-005',
    loanId: 'LN-10450',
    ruleId: 'R013',
    ruleName: 'Closed loan balance',
    severity: 'high',
    description: 'Loan status is CLOSED, but the record displays a current balance of ₹15,400.',
    status: 'open',
    affectedField: 'currentBalance',
    expectedValue: '0',
    actualValue: '15,400',
    createdAt: '2026-08-25T16:00:00Z'
  }
];

export let aiRecommendationsDb: AIRecommendation[] = [
  {
    id: 'REC-001',
    exceptionId: 'EXC-001',
    loanId: 'LN-10024',
    suggestedAction: 'correct',
    confidence: 91,
    explanation: 'The current balance exceeds the original principal by ₹25,000 on the tape. Comparing with the Servicer Update record (`servicer_update.csv`), the current balance is reported as ₹425,000. It appears an interest recalculation duplicate entry was uploaded. Resolving to the servicer value is highly recommended.',
    suggestedValue: 425000,
    modelUsed: 'gemini'
  },
  {
    id: 'REC-002',
    exceptionId: 'EXC-002',
    loanId: 'LN-10087',
    suggestedAction: 'correct',
    confidence: 98,
    explanation: 'A chronological anomaly was detected: the maturity date (2023) is exactly 1 year prior to origination (2024). Standard terms for Commercial Real Estate under Apex Servicing are 30-year horizons. The amortization tables suggest the maturity year was typed as 2023 instead of 2054. Correcting the maturity date to 2054-05-10 resolves the exception.',
    suggestedValue: '2054-05-10',
    modelUsed: 'openai'
  },
  {
    id: 'REC-003',
    exceptionId: 'EXC-003',
    loanId: 'LN-10204',
    suggestedAction: 'correct',
    confidence: 87,
    explanation: 'A status-DPD inconsistency is present. The servicer tape indicates a late payment event on 2026-07-15. Based on historical payments, the loan is in active delinquency. The correct status should be updated from "CURRENT" to "DELINQUENT".',
    suggestedValue: 'DELINQUENT',
    modelUsed: 'local_custom'
  },
  {
    id: 'REC-004',
    exceptionId: 'EXC-004',
    loanId: 'LN-10332',
    suggestedAction: 'waive',
    confidence: 76,
    explanation: 'State code "XX" is invalid. Reviewing the original loan application and appraisal, the property is located in Austin, Texas. Texas should be mapped as state "TX". Suggest applying correction "TX" or waiving with manual verification.',
    suggestedValue: 'TX',
    modelUsed: 'gemini'
  },
  {
    id: 'REC-005',
    exceptionId: 'EXC-005',
    loanId: 'LN-10450',
    suggestedAction: 'correct',
    confidence: 94,
    explanation: 'This loan was paid off in full on 2026-08-01. The balance of ₹15,400 is an unposted fee credit waiting to be returned to the borrower. The principal balance is indeed 0, indicating status CLOSED is correct, but current balance needs to be set to 0 to finalize.',
    suggestedValue: 0,
    modelUsed: 'openai'
  }
];

export let importJobsDb: ImportJob[] = [
  {
    id: 'JOB-201',
    fileName: 'loan_tape_20260825_final.csv',
    fileType: 'loan_tape',
    status: 'completed',
    totalRecords: 2000,
    processedRecords: 1982,
    failedRecords: 18,
    uploadedBy: 'Data Operator',
    createdAt: '2026-08-25T14:20:00Z'
  },
  {
    id: 'JOB-202',
    fileName: 'servicer_updates_apex_20260825.csv',
    fileType: 'servicer_update',
    status: 'completed',
    totalRecords: 700,
    processedRecords: 698,
    failedRecords: 2,
    uploadedBy: 'Data Operator',
    createdAt: '2026-08-25T14:45:00Z'
  },
  {
    id: 'JOB-203',
    fileName: 'manifest_docs_20260825.csv',
    fileType: 'document_manifest',
    status: 'completed',
    totalRecords: 120,
    processedRecords: 120,
    failedRecords: 0,
    uploadedBy: 'Data Operator',
    createdAt: '2026-08-25T15:00:00Z'
  }
];

export let auditLogsDb: AuditLog[] = [
  {
    id: 'AUD-001',
    loanId: 'LN-10024',
    actor: 'System Ingestion',
    action: 'RECORD_IMPORTED',
    entityType: 'Loan',
    changeSummary: 'Raw record imported from loan_tape_20260825_final.csv',
    createdAt: '2026-08-25T14:20:00Z'
  },
  {
    id: 'AUD-002',
    loanId: 'LN-10024',
    actor: 'Validation Engine',
    action: 'EXCEPTION_DETECTED',
    entityType: 'Exception',
    changeSummary: 'Validation Rule R006 failed: current balance ₹525,000 exceeds original principal ₹500,000. Opened EXC-001.',
    createdAt: '2026-08-25T14:21:00Z'
  },
  {
    id: 'AUD-003',
    loanId: 'LN-10024',
    actor: 'AI Service',
    action: 'RECOMMENDATION_GENERATED',
    entityType: 'VerifiedLoan',
    changeSummary: 'AI suggestion generated (confidence 91%) with recommended value ₹425,000.',
    createdAt: '2026-08-25T14:22:00Z'
  },
  {
    id: 'AUD-004',
    loanId: 'LN-10115',
    actor: 'Reviewer',
    action: 'LOAN_VERIFIED',
    entityType: 'VerifiedLoan',
    changeSummary: 'Approved all values, signed off and created verified SHA-256 block record.',
    createdAt: '2026-08-26T09:40:00Z'
  }
];

export let reviewsDb: Review[] = [];

// Helper functions for DB mutations
export const resetDatabase = () => {
  // Can be called to restore defaults
};

export const updateLoanInDb = (loanId: string, updates: Partial<Loan>) => {
  loansDb = loansDb.map((l) => (l.loanId === loanId ? { ...l, ...updates } : l));
};

export const updateExceptionInDb = (excId: string, updates: Partial<Exception>) => {
  exceptionsDb = exceptionsDb.map((e) => (e.id === excId ? { ...e, ...updates } : e));
};

export const addAuditLogToDb = (log: Omit<AuditLog, 'id' | 'createdAt'>) => {
  const newLog: AuditLog = {
    ...log,
    id: `AUD-${(auditLogsDb.length + 1).toString().padStart(3, '0')}`,
    createdAt: new Date().toISOString()
  };
  auditLogsDb.push(newLog);
};

export const addReviewToDb = (review: Omit<Review, 'id' | 'createdAt'>) => {
  const newReview: Review = {
    ...review,
    id: `REV-${(reviewsDb.length + 1).toString().padStart(3, '0')}`,
    createdAt: new Date().toISOString()
  };
  reviewsDb.push(newReview);
};

export const addImportJobToDb = (job: Omit<ImportJob, 'id' | 'createdAt'>) => {
  const newJob: ImportJob = {
    ...job,
    id: `JOB-${(importJobsDb.length + 201).toString()}`,
    createdAt: new Date().toISOString()
  };
  importJobsDb.unshift(newJob); // Put at front
};
