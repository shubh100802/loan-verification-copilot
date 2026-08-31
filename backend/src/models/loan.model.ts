import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentInfo {
  documentType: string;
  fileName: string;
  verified: boolean;
  manifestId: string;
}

export interface ILoan extends Document {
  loanId: string;
  borrowerName: string;
  borrowerId: string;
  loanType: string;
  originationDate: string;
  maturityDate: string;
  originalPrincipal: number;
  currentBalance: number;
  interestRate: number;
  termMonths?: number;
  dpd: number; // days past due
  propertyState: string; // mapped from borrower_state
  loanPurpose: string;
  creditGrade: string;
  paymentStatus: string;
  documentStatus: string;
  verificationStatus: 'unverified' | 'exception' | 'in_review' | 'verified';
  servicerName: string;
  lastUpdated: string; // mapped from last_updated_at
  documents: IDocumentInfo[];
  importJobId?: string;
  sourceRow?: number;
}

const DocumentInfoSchema = new Schema<IDocumentInfo>({
  documentType: { type: String, required: true },
  fileName: { type: String, required: true },
  verified: { type: Boolean, required: true, default: false },
  manifestId: { type: String, required: true }
});

const LoanSchema = new Schema<ILoan>(
  {
    loanId: { type: String, required: false, index: true }, // Not unique at schema level to allow ingest of duplicate rule violations
    borrowerName: { type: String, required: true },
    borrowerId: { type: String, required: true },
    loanType: { type: String, required: true },
    originationDate: { type: String, required: true },
    maturityDate: { type: String, required: true },
    originalPrincipal: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    termMonths: { type: Number },
    dpd: { type: Number, required: true, default: 0 },
    propertyState: { type: String, required: true },
    loanPurpose: { type: String, required: true },
    creditGrade: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    documentStatus: { type: String, required: true },
    verificationStatus: { type: String, required: true, enum: ['unverified', 'exception', 'in_review', 'verified'], default: 'unverified' },
    servicerName: { type: String, required: true },
    lastUpdated: { type: String, required: true },
    documents: { type: [DocumentInfoSchema], default: [] },
    importJobId: { type: String, index: true },
    sourceRow: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
