import mongoose, { Schema, Document } from 'mongoose';

export interface IImportJob extends Document {
  id: string;
  fileName: string;
  fileType: 'loan_tape' | 'servicer_update' | 'document_manifest';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  exceptionCount: number;
  uploadedBy: string;
  createdAt: Date;
}

const ImportJobSchema = new Schema<IImportJob>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true, enum: ['loan_tape', 'servicer_update', 'document_manifest'] },
    status: { type: String, required: true, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    totalRecords: { type: Number, required: true, default: 0 },
    processedRecords: { type: Number, required: true, default: 0 },
    failedRecords: { type: Number, required: true, default: 0 },
    uploadedBy: { type: String, required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IImportJob>('ImportJob', ImportJobSchema);
