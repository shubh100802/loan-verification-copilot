import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { AuthController } from '../controllers/auth.controller';
import { ImportController } from '../controllers/import.controller';
import { LoanController } from '../controllers/loan.controller';
import { ExceptionController } from '../controllers/exception.controller';
import { VerifiedController } from '../controllers/verified.controller';
import { SummaryController } from '../controllers/summary.controller';
import { AIController } from '../controllers/ai.controller';

const router = Router();

// Configure Multer storage for secure uploads
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // limit files to 10MB
});

// Authentication routes
router.post('/auth/login', AuthController.login);

// Ingestion/Upload routes
router.post('/imports', upload.single('file'), ImportController.uploadFile);
router.get('/imports/history', ImportController.getHistory);

// Loan Tape records
router.get('/loans', LoanController.getLoans);
router.get('/loans/:id', LoanController.getLoanById);
router.patch('/loans/:id', LoanController.updateLoan);

// Exception queue
router.get('/exceptions', ExceptionController.getExceptions);
router.get('/exceptions/:id', ExceptionController.getExceptionById);

// Reviews & Decisions
router.post('/reviews', ExceptionController.submitReview);

// Verified Records Ledger
router.get('/verified-loans', VerifiedController.getVerifiedLoans);
router.get('/verified-loans/:id', VerifiedController.getVerifiedById);
router.post('/verified-loans/:id/verify', VerifiedController.verifyLoanRecord);

// Auditing & Summary Metrics
router.get('/audit/:loanId', SummaryController.getAuditTrail);
router.get('/summary', SummaryController.getSummary);

// AI Reviewer Assistant routes
router.post('/ai/exceptions/:id/explain', AIController.explainException);
router.post('/ai/exceptions/:id/suggest-correction', AIController.suggestCorrection);
router.post('/ai/exceptions/:id/compare', AIController.compareRecords);
router.post('/ai/exceptions/:id/reviewer-note', AIController.generateReviewerNote);
router.post('/ai/exceptions/summarize', AIController.summarizeExceptions);
router.post('/ai/validation-rule/generate', AIController.generateValidationRule);

export default router;
