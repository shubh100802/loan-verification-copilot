import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  loanId: string;
  entityType: 'Loan' | 'Exception' | 'VerifiedLoan' | 'ImportJob' | 'Review';
  entityId: string;
  eventType: string; // e.g. FILE_UPLOADED, RECORD_IMPORTED, VALIDATION_EXECUTED...
  actorId: string; // e.g. operator@demo.local
  metadata: Record<string, any>;
  timestamp: Date;
  previousHash: string;
  eventHash: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    loanId: { type: String, required: true, index: true },
    entityType: { type: String, required: true, enum: ['Loan', 'Exception', 'VerifiedLoan', 'ImportJob', 'Review'] },
    entityId: { type: String, required: true, index: true },
    eventType: { type: String, required: true },
    actorId: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, required: true, default: {} },
    timestamp: { type: Date, required: true, default: Date.now },
    previousHash: { type: String, required: true },
    eventHash: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
