import mongoose from 'mongoose';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import ImportJob from '../models/importJob.model';
import AuditLog from '../models/auditLog.model';
import VerifiedLoan from '../models/verifiedLoan.model';
import Review from '../models/review.model';
import User from '../models/user.model';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intain-loan-verification';
const usersPath = path.resolve(__dirname, '../../../data/users.json');

async function clearDb() {
  console.log('[ClearDB] Connecting to database:', uri);
  await mongoose.connect(uri);

  try {
    console.log('[ClearDB] Emptying data collections (loans, exceptions, jobs, audits, verified, reviews)...');
    await Loan.deleteMany({});
    await Exception.deleteMany({});
    await ImportJob.deleteMany({});
    await AuditLog.deleteMany({});
    await VerifiedLoan.deleteMany({});
    await Review.deleteMany({});

    // Ensure default demo users exist
    const userCount = await User.countDocuments({});
    if (userCount === 0 && fs.existsSync(usersPath)) {
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
      await User.insertMany(usersData);
      console.log(`[ClearDB] Seeded ${usersData.length} default users.`);
    } else {
      console.log(`[ClearDB] Kept ${userCount} existing authentication accounts.`);
    }

    console.log('[ClearDB] Database cleared and ready for fresh testing!');
  } catch (err: any) {
    console.error('[ClearDB] Fatal error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('[ClearDB] Connection closed.');
  }
}

clearDb();
