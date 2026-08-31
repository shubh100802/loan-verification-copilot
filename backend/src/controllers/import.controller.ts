import { Request, Response } from 'express';
import fs from 'fs';
import { IngestService } from '../services/ingestion/ingest.service';
import ImportJob from '../models/importJob.model';

export class ImportController {
  public static async uploadFile(req: Request, res: Response): Promise<void> {
    const file = req.file;
    const { fileType, actorId = 'operator@demo.local' } = req.body;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file uploaded' }
      });
      return;
    }

    if (!fileType || !['loan_tape', 'servicer_update', 'document_manifest'].includes(fileType)) {
      // Clean up uploaded file before returning
      fs.unlinkSync(file.path);
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Invalid or missing fileType parameter' }
      });
      return;
    }

    try {
      let importJobId = '';
      const originalName = file.originalname;

      if (fileType === 'loan_tape') {
        importJobId = await IngestService.ingestLoanTape(file.path, originalName, actorId);
      } else if (fileType === 'servicer_update') {
        importJobId = await IngestService.ingestServicerUpdate(file.path, originalName, actorId);
      } else if (fileType === 'document_manifest') {
        importJobId = await IngestService.ingestDocumentManifest(file.path, originalName, actorId);
      }

      res.status(200).json({
        success: true,
        data: {
          importJobId,
          message: 'File ingested successfully'
        }
      });
    } catch (err: any) {
      console.error('[ImportController] Upload failed:', err);
      // Clean up uploaded file on error
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(500).json({
        success: false,
        error: { code: 'INGESTION_ERROR', message: err.message }
      });
    }
  }

  public static async getHistory(_req: Request, res: Response): Promise<void> {
    try {
      const jobs = await ImportJob.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        data: jobs
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }
}
