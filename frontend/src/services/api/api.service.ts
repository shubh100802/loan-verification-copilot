import { Loan, Exception, AIRecommendation, ImportJob, AuditLog, DashboardSummary } from '../mock/types';

const API_ORIGIN = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BASE_URL = API_ORIGIN.endsWith('/api/v1') ? API_ORIGIN : `${API_ORIGIN.replace(/\/$/, '')}/api/v1`;

// Helper to extract active logged-in user credentials
function getActorQuery(): string {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return `?actorId=${encodeURIComponent(user.email)}&reviewerName=${encodeURIComponent(user.name)}`;
    } catch {
      // Fallback
    }
  }
  return '';
}

export const loginUser = async (email: string, password: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const res = await response.json();
  if (!response.ok || !res.success) {
    throw new Error(res.error?.message || 'Login failed');
  }
  return res.data;
};

export const getLoans = async (filters?: { status?: string; search?: string }): Promise<Loan[]> => {
  let url = `${BASE_URL}/loans`;
  const params: string[] = [];
  if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
  if (filters?.search) params.push(`search=${encodeURIComponent(filters.search)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await fetch(url);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch loans');
  return res.data.loans;
};

export const getLoanById = async (id: string): Promise<Loan | null> => {
  const response = await fetch(`${BASE_URL}/loans/${id}`);
  const res = await response.json();
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch loan details');
  return res.data;
};

export const getExceptions = async (filters?: { severity?: string; status?: string; search?: string }): Promise<Exception[]> => {
  let url = `${BASE_URL}/exceptions`;
  const params: string[] = [];
  if (filters?.status) params.push(`status=${encodeURIComponent(filters.status)}`);
  if (filters?.severity) params.push(`severity=${encodeURIComponent(filters.severity)}`);
  if (filters?.search) params.push(`search=${encodeURIComponent(filters.search)}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await fetch(url);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch exceptions');
  return res.data;
};

export const getExceptionById = async (id: string): Promise<Exception | null> => {
  const response = await fetch(`${BASE_URL}/exceptions/${id}`);
  const res = await response.json();
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch exception details');
  return res.data.exception;
};

export const getAIRecommendationForException = async (exceptionId: string): Promise<AIRecommendation | null> => {
  const response = await fetch(`${BASE_URL}/exceptions/${exceptionId}`);
  const res = await response.json();
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch AI details');
  return res.data.aiRecommendation;
};

export const getImportJobs = async (): Promise<ImportJob[]> => {
  const response = await fetch(`${BASE_URL}/imports/history`);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch imports history');
  return res.data;
};

export const getAuditTrail = async (loanId: string): Promise<AuditLog[]> => {
  const response = await fetch(`${BASE_URL}/audit/${loanId}`);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch audit logs');
  return res.data;
};

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await fetch(`${BASE_URL}/summary`);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch dashboard metrics');

  const summary = res.data;
  
  // Fetch reviewer stats manually to enrich response
  const reviewsRes = await fetch(`${BASE_URL}/exceptions`);
  const exceptions: Exception[] = reviewsRes.ok ? (await reviewsRes.json()).data : [];
  const openExceptionsCount = exceptions.filter((e) => e.status === 'open').length;

  return {
    totalRecords: summary.totalRecords,
    validRecords: summary.validRecords,
    exceptionsCount: summary.exceptionsCount,
    criticalExceptionsCount: summary.criticalExceptionsCount,
    qualityScore: summary.qualityScore,
    verificationRate: parseFloat(((summary.validRecords / (summary.totalRecords || 1)) * 100).toFixed(1)),
    pendingExceptions: openExceptionsCount,
    recordsReviewedToday: summary.recordsReviewedToday,
    approvedCount: 0, // AI phase defaults
    rejectedCount: 0,
    correctionRequestsCount: 0
  };
};

export const performReviewAction = async (params: {
  loanId: string;
  exceptionId: string;
  action: 'approve_verification' | 'waive_exception' | 'request_correction' | 'edit_record';
  notes: string;
  reviewerName: string;
  updatedFields?: Record<string, any>;
}): Promise<void> => {
  const { loanId, exceptionId, action, notes, updatedFields } = params;

  // 1. If edit action is requested, update the loan fields first
  if (action === 'edit_record' && updatedFields) {
    const editResponse = await fetch(`${BASE_URL}/loans/${loanId}${getActorQuery()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields)
    });
    
    const editRes = await editResponse.json();
    if (!editResponse.ok) {
      throw new Error(editRes.error?.message || 'Failed to edit loan record');
    }
  }

  // 2. Submit resolution review status change
  if (action === 'waive_exception' || action === 'request_correction') {
    const reviewResponse = await fetch(`${BASE_URL}/reviews${getActorQuery()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ exceptionId, loanId, action, notes })
    });
    
    const reviewRes = await reviewResponse.json();
    if (!reviewResponse.ok) {
      throw new Error(reviewRes.error?.message || 'Failed to process review resolution');
    }
  }

  // 3. Manually trigger signoff verification block creation
  if (action === 'approve_verification') {
    const signoffResponse = await fetch(`${BASE_URL}/verified-loans/${loanId}/verify${getActorQuery()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    
    const signoffRes = await signoffResponse.json();
    if (!signoffResponse.ok) {
      throw new Error(signoffRes.error?.message || 'Failed to verify loan record');
    }
  }
};

export const uploadFile = async (
  file: File,
  fileType: 'loan_tape' | 'servicer_update' | 'document_manifest',
  uploadedBy: string,
  onProgress: (phase: string, percent: number) => void
): Promise<ImportJob> => {
  onProgress('Uploading file to backend...', 20);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  formData.append('actorId', uploadedBy);

  onProgress('Parsing CSV records...', 50);

  const response = await fetch(`${BASE_URL}/imports`, {
    method: 'POST',
    body: formData
  });

  onProgress('Running verification rules...', 85);

  const res = await response.json();
  if (!response.ok || !res.success) {
    throw new Error(res.error?.message || 'Ingestion upload failed');
  }

  onProgress('Writing exceptions logs...', 100);

  // Fetch the created import job details to return to the UI
  const historyRes = await fetch(`${BASE_URL}/imports/history`);
  const history = await historyRes.json();
  const job = history.data.find((j: any) => j.id === res.data.importJobId);
  return job || {
    id: res.data.importJobId,
    fileName: file.name,
    fileType,
    status: 'completed',
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    uploadedBy,
    createdAt: new Date().toISOString()
  };
};

export const getVerifiedLoansList = async (): Promise<any[]> => {
  const response = await fetch(`${BASE_URL}/verified-loans`);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch verified records');
  return res.data;
};

export const getVerifiedById = async (id: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/verified-loans/${id}`);
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to fetch verified record');
  return res.data;
};

export const explainExceptionAI = async (exceptionId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/ai/exceptions/${exceptionId}/explain${getActorQuery()}`, {
    method: 'POST'
  });
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to explain exception');
  return res.data;
};

export const suggestCorrectionAI = async (exceptionId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/ai/exceptions/${exceptionId}/suggest-correction${getActorQuery()}`, {
    method: 'POST'
  });
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to suggest correction');
  return res.data;
};

export const compareRecordsAI = async (exceptionId: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/ai/exceptions/${exceptionId}/compare${getActorQuery()}`, {
    method: 'POST'
  });
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to compare records');
  return res.data;
};

export const generateReviewerNoteAI = async (exceptionId: string): Promise<string> => {
  const response = await fetch(`${BASE_URL}/ai/exceptions/${exceptionId}/reviewer-note${getActorQuery()}`, {
    method: 'POST'
  });
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to generate note');
  return res.data.note;
};

export const summarizeExceptionsAI = async (exceptionIds: string[]): Promise<any> => {
  const response = await fetch(`${BASE_URL}/ai/exceptions/summarize${getActorQuery()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exceptionIds })
  });
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to summarize batch');
  return res.data;
};

export const generateValidationRuleAI = async (description: string): Promise<any> => {
  const response = await fetch(`${BASE_URL}/ai/validation-rule/generate${getActorQuery()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  const res = await response.json();
  if (!response.ok) throw new Error(res.error?.message || 'Failed to generate rule');
  return res.data;
};
