import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import User from '../models/user.model';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import ImportJob from '../models/importJob.model';
import Review from '../models/review.model';
import VerifiedLoan from '../models/verifiedLoan.model';
import AuditLog from '../models/auditLog.model';
import { IngestService } from '../services/ingestion/ingest.service';

// Load env configurations
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const usersPath = path.resolve(__dirname, '../../../data/users.json');
const tapePath = path.resolve(__dirname, '../../../data/loan_tape.csv');
const servicerPath = path.resolve(__dirname, '../../../data/servicer_update.csv');
const manifestPath = path.resolve(__dirname, '../../../data/document_manifest.csv');

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intain-loan-verification';

  try {
    console.log(`[Seed] Connecting to database at ${uri}...`);
    await mongoose.connect(uri);

    console.log('[Seed] Clearing database collections...');
    await User.deleteMany({});
    await Loan.deleteMany({});
    await Exception.deleteMany({});
    await ImportJob.deleteMany({});
    await Review.deleteMany({});
    await VerifiedLoan.deleteMany({});
    await AuditLog.deleteMany({});

    // 1. Seed default credentials
    console.log('[Seed] Seeding default users...');
    if (fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      await User.insertMany(usersData);
      console.log(`[Seed] Seeded ${usersData.length} users successfully.`);
    } else {
      console.warn('[Seed] Warning: users.json file not found.');
    }

    // 2. Seed primary dataset files through ingestion pipeline services
    console.log('[Seed] Ingesting primary loan tape...');
    if (fs.existsSync(tapePath)) {
      const jobId = await IngestService.ingestLoanTape(tapePath, 'loan_tape.csv', 'operator@demo.local');
      console.log(`[Seed] Primary loan tape ingested successfully. Job ID: ${jobId}`);
    } else {
      console.warn('[Seed] Warning: loan_tape.csv not found.');
    }

    console.log('[Seed] Ingesting document manifest...');
    if (fs.existsSync(manifestPath)) {
      const jobId = await IngestService.ingestDocumentManifest(manifestPath, 'document_manifest.csv', 'operator@demo.local');
      console.log(`[Seed] Document manifest ingested successfully. Job ID: ${jobId}`);
    } else {
      console.warn('[Seed] Warning: document_manifest.csv not found.');
    }

    console.log('[Seed] Ingesting servicer update reconciliation...');
    if (fs.existsSync(servicerPath)) {
      const jobId = await IngestService.ingestServicerUpdate(servicerPath, 'servicer_update.csv', 'operator@demo.local');
      console.log(`[Seed] Servicer updates ingested successfully. Job ID: ${jobId}`);
    } else {
      console.warn('[Seed] Warning: servicer_update.csv not found.');
    }

    console.log('[Seed] Seeding process completed successfully.');
  } catch (error) {
    console.error('[Seed] Database seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Seed] Database connection closed.');
  }
}

seed();
