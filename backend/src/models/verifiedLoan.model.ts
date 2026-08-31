import mongoose, { Schema, Document } from 'mongoose';

export interface IVerifiedLoan extends Document {
  loanId: string; // Unique index for verified records
  canonicalLoanData: {
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
    servicerName: string;
    lastUpdated: string;
  };
  sourceFile: string;
  validationResult: {
    rulesExecutedCount: number;
    status: 'clean' | 'resolved' | 'waived';
  };
  reviewerDecision?: {
    reviewerName: string;
    notes: string;
    actionTaken: string;
  };
  verifiedBy: string;
  verifiedAt: Date;
  recordHash: string;
}

const VerifiedLoanSchema = new Schema<IVerifiedLoan>(
  {
    loanId: { type: String, required: true, unique: true, index: true },
    canonicalLoanData: { type: Schema.Types.Mixed, required: true },
    sourceFile: { type: String, required: true },
    validationResult: { type: Schema.Types.Mixed, required: true },
    reviewerDecision: { type: Schema.Types.Mixed },
    verifiedBy: { type: String, required: true },
    verifiedAt: { type: Date, required: true, default: Date.now },
    recordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IVerifiedLoan>('VerifiedLoan', VerifiedLoanSchema);
