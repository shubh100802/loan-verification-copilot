import mongoose from 'mongoose';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import ImportJob from '../models/importJob.model';
import AuditLog from '../models/auditLog.model';
import VerifiedLoan from '../models/verifiedLoan.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intain-loan-verification';

async function run() {
  await mongoose.connect(uri);
  try {
    const loanCount = await Loan.countDocuments({});
    const exceptionCount = await Exception.countDocuments({});
    const jobCount = await ImportJob.countDocuments({});
    const auditCount = await AuditLog.countDocuments({});
    const verifiedCount = await VerifiedLoan.countDocuments({});
    console.log(`Loans: ${loanCount}`);
    console.log(`Exceptions: ${exceptionCount}`);
    console.log(`Jobs: ${jobCount}`);
    console.log(`AuditLogs: ${auditCount}`);
    console.log(`VerifiedLoans: ${verifiedCount}`);
  } catch (err: any) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
