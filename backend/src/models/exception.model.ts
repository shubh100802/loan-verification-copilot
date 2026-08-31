import mongoose, { Schema, Document } from 'mongoose';

export interface IException extends Document {
  id: string; // EXC-001
  loanId: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'resolved' | 'waived' | 'investigating';
  affectedField: string;
  expectedValue: string;
  actualValue: string;
  resolutionNote?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

const ExceptionSchema = new Schema<IException>(
  {
    id: { type: String, required: true, unique: true, index: true },
    loanId: { type: String, required: true, index: true },
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
    description: { type: String, required: true },
    status: { type: String, required: true, enum: ['open', 'resolved', 'waived', 'investigating'], default: 'open' },
    affectedField: { type: String, required: true },
    expectedValue: { type: String, required: false, default: '' },
    actualValue: { type: String, required: false, default: '' },
    resolutionNote: { type: String },
    resolvedBy: { type: String },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model<IException>('Exception', ExceptionSchema);
