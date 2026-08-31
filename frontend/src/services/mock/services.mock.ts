import * as api from '../api/api.service';
import { ImportJob } from './types';

// Forwarding all mock service calls to backend REST API layer
export const getLoans = api.getLoans;
export const getLoanById = api.getLoanById;
export const getExceptions = api.getExceptions;
export const getExceptionById = api.getExceptionById;
export const getAIRecommendationForException = api.getAIRecommendationForException;
export const getImportJobs = api.getImportJobs;
export const getAuditTrail = api.getAuditTrail;
export const getDashboardSummary = api.getDashboardSummary;
export const performReviewAction = api.performReviewAction;

export const explainExceptionAI = api.explainExceptionAI;
export const suggestCorrectionAI = api.suggestCorrectionAI;
export const compareRecordsAI = api.compareRecordsAI;
export const generateReviewerNoteAI = api.generateReviewerNoteAI;
export const summarizeExceptionsAI = api.summarizeExceptionsAI;
export const generateValidationRuleAI = api.generateValidationRuleAI;

// Map the upload ingestion simulation trigger to the real backend multipart post service
export const simulateUploadFile = async (
  file: File | string,
  fileType: 'loan_tape' | 'servicer_update' | 'document_manifest',
  uploadedBy: string,
  onProgress: (phase: string, percent: number) => void
): Promise<ImportJob> => {
  if (typeof file === 'string') {
    throw new Error('Real backend upload requires a File object descriptor.');
  }
  return api.uploadFile(file, fileType, uploadedBy, onProgress);
};
