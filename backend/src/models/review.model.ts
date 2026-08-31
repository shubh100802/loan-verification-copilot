import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  id: string;
  exceptionId: string;
  loanId: string;
  reviewerId: string;
  reviewerName: string;
  action: 'approve_verification' | 'waive_exception' | 'request_correction' | 'edit_record';
  notes: string;
  beforeValue?: string;
  afterValue?: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    id: { type: String, required: true, unique: true, index: true },
    exceptionId: { type: String, required: true, index: true },
    loanId: { type: String, required: true, index: true },
    reviewerId: { type: String, required: true },
    reviewerName: { type: String, required: true },
    action: { type: String, required: true, enum: ['approve_verification', 'waive_exception', 'request_correction', 'edit_record'] },
    notes: { type: String, required: true },
    beforeValue: { type: String },
    afterValue: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model<IReview>('Review', ReviewSchema);
