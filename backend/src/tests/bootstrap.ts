import mongoose from 'mongoose';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import ImportJob from '../models/importJob.model';
import AuditLog from '../models/auditLog.model';
import VerifiedLoan from '../models/verifiedLoan.model';
import { IngestService } from '../services/ingestion/ingest.service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intain-loan-verification';

async function bootstrap() {
  console.log('[Bootstrap] Connecting to database:', uri);
  await mongoose.connect(uri);

  try {
    console.log('[Bootstrap] Cleaning existing database collections...');
    await Loan.deleteMany({});
    await Exception.deleteMany({});
    await ImportJob.deleteMany({});
    await AuditLog.deleteMany({});
    await VerifiedLoan.deleteMany({});

    const loanTapePath = path.resolve(__dirname, '../../../data/loan_tape.csv');
    const servicerUpdatePath = path.resolve(__dirname, '../../../data/servicer_update.csv');
    const docManifestPath = path.resolve(__dirname, '../../../data/document_manifest.csv');

    console.log('[Bootstrap] Ingesting Loan Tape CSV...');
    await IngestService.ingestLoanTape(loanTapePath, 'loan_tape.csv', 'operator@demo.local');

    console.log('[Bootstrap] Ingesting Document Manifest CSV...');
    await IngestService.ingestDocumentManifest(docManifestPath, 'document_manifest.csv', 'operator@demo.local');

    console.log('[Bootstrap] Ingesting Servicer Update CSV...');
    await IngestService.ingestServicerUpdate(servicerUpdatePath, 'servicer_update.csv', 'operator@demo.local');

    console.log('[Bootstrap] Ingestion complete!');

    const loanCount = await Loan.countDocuments({});
    const exceptionCount = await Exception.countDocuments({});
    const jobCount = await ImportJob.countDocuments({});
    console.log(`[Bootstrap] Stats: ${loanCount} Loans, ${exceptionCount} Exceptions, ${jobCount} Jobs created.`);
  } catch (err: any) {
    console.error('[Bootstrap] Fatal error during database setup:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('[Bootstrap] Connection closed.');
  }
}

bootstrap();
