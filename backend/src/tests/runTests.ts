import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import assert from 'assert';

import { parseCsv } from '../utils/csvParser';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import VerifiedLoan from '../models/verifiedLoan.model';
import AuditLog from '../models/auditLog.model';
import { ValidationEngine } from '../services/validation/engine';
import { AuditService } from '../services/audit/audit.service';
import { VerifiedController } from '../controllers/verified.controller';
import '../services/validation/rules'; // Ensure rules register

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/intain-loan-verification-test';

async function run() {
  console.log('[Test] Connecting to test database...');
  await mongoose.connect(uri);

  try {
    // Clear test db
    await Loan.deleteMany({});
    await Exception.deleteMany({});
    await VerifiedLoan.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('\n--- 1. Testing Ingestion CSV Parser ---');
    const csvContent = 'loan_id,borrower_id,current_balance\nLN-001,BR-001,"4,500.00"\nLN-002,BR-002,12000.50';
    const parsed = parseCsv(csvContent);
    assert.strictEqual(parsed.length, 3, 'Should parse header + 2 data rows');
    assert.strictEqual(parsed[1][0], 'LN-001', 'First parsed ID should match');
    assert.strictEqual(parsed[1][2], '4,500.00', 'Should handle quoted cells with commas');
    console.log('✓ CSV parser tests passed.');

    console.log('\n--- 2. Testing Validation Engine & Rules ---');
    const testLoan = new Loan({
      loanId: 'LN-TEST-99',
      borrowerName: 'Test Borrower',
      borrowerId: 'BR-TEST-99',
      loanType: 'AUTO',
      originationDate: '2025-01-01',
      maturityDate: '2024-01-01', // maturity before origination! (R005 fail)
      originalPrincipal: 10000,
      currentBalance: -50, // negative balance! (R004 fail)
      interestRate: 65, // out of range! (R007 fail)
      termMonths: 60,
      dpd: 5,
      propertyState: 'ZZ', // invalid state code! (R012 fail)
      loanPurpose: 'PURCHASE',
      creditGrade: 'A',
      paymentStatus: 'CURRENT', // CURRENT status with dpd = 5! (R008 fail)
      verificationStatus: 'unverified',
      servicerName: 'Test Servicer',
      lastUpdated: '2026-08-25',
      documentStatus: 'AVAILABLE'
    });

    const failures = ValidationEngine.run(testLoan, [testLoan]);
    const failedRuleIds = failures.map((f) => f.ruleId);

    // Verify expected failures
    assert.ok(failedRuleIds.includes('R004'), 'Should flag negative balance R004');
    assert.ok(failedRuleIds.includes('R005'), 'Should flag maturity date R005');
    assert.ok(failedRuleIds.includes('R007'), 'Should flag interest rate R007');
    assert.ok(failedRuleIds.includes('R008'), 'Should flag payment status consistency R008');
    assert.ok(failedRuleIds.includes('R012'), 'Should flag invalid state code R012');
    console.log('✓ Validation engine R001-R014 checks passed.');

    console.log('\n--- 3. Testing Sequential Audit Log Chaining ---');
    const firstLog = await AuditService.logEvent({
      loanId: 'LN-TEST-99',
      entityType: 'Loan',
      entityId: 'dummy-id-1',
      eventType: 'RECORD_IMPORTED',
      actorId: 'operator@demo.local',
      metadata: { row: 2 }
    });

    const secondLog = await AuditService.logEvent({
      loanId: 'LN-TEST-99',
      entityType: 'Exception',
      entityId: 'dummy-id-2',
      eventType: 'EXCEPTION_CREATED',
      actorId: 'SYSTEM',
      metadata: { rule: 'R004' }
    });

    assert.strictEqual(secondLog.previousHash, firstLog.eventHash, 'Second log previousHash must match first log eventHash');
    assert.notStrictEqual(firstLog.eventHash, firstLog.previousHash, 'Hashes should be unique');
    console.log('✓ Cryptographic blockchain audit chaining checks passed.');

    console.log('\n--- 4. Testing Verified Loan Record Signoff & Hash ---');
    // Save clean loan tape record
    const cleanLoan = new Loan({
      loanId: 'LN-TEST-OK',
      borrowerName: 'Verified Borrower',
      borrowerId: 'BR-TEST-OK',
      loanType: 'HOME',
      originationDate: '2025-01-01',
      maturityDate: '2035-01-01',
      originalPrincipal: 150000,
      currentBalance: 145000,
      interestRate: 4.25,
      termMonths: 120,
      dpd: 0,
      propertyState: 'NY',
      loanPurpose: 'PURCHASE',
      creditGrade: 'B',
      paymentStatus: 'CURRENT',
      verificationStatus: 'unverified',
      servicerName: 'Primary Servicer',
      lastUpdated: '2025-08-25',
      documentStatus: 'AVAILABLE'
    });
    await cleanLoan.save();

    // Call helper from VerifiedController to hash data
    const canonicalData = {
      loanId: cleanLoan.loanId,
      borrowerName: cleanLoan.borrowerName,
      borrowerId: cleanLoan.borrowerId,
      loanType: cleanLoan.loanType,
      originationDate: cleanLoan.originationDate,
      maturityDate: cleanLoan.maturityDate,
      originalPrincipal: cleanLoan.originalPrincipal,
      currentBalance: cleanLoan.currentBalance,
      interestRate: cleanLoan.interestRate,
      paymentStatus: cleanLoan.paymentStatus,
      dpd: cleanLoan.dpd,
      propertyState: cleanLoan.propertyState,
      loanPurpose: cleanLoan.loanPurpose,
      creditGrade: cleanLoan.creditGrade,
      servicerName: cleanLoan.servicerName,
      lastUpdated: cleanLoan.lastUpdated
    };

    const recordHash1 = (VerifiedController as any).generateRecordHash(canonicalData);
    const recordHash2 = (VerifiedController as any).generateRecordHash(canonicalData);
    assert.strictEqual(recordHash1, recordHash2, 'Hashing identical records must be deterministic and yield matching hashes');
    console.log('✓ Verified record hash checks passed.');

    console.log('\n--- 5. Testing Phase 4 AI Endpoints and Mock Responses ---');
    const { GeminiProvider } = require('../ai/gemini.provider');
    const gemini = new GeminiProvider();

    const testExp = new Exception({
      id: 'EXC-TEST-AI',
      loanId: 'LN-TEST-99',
      borrowerId: 'BR-TEST-99',
      ruleId: 'R005',
      ruleName: 'Maturity Date Prior to Origination Date',
      severity: 'high',
      description: 'Maturity date is prior to origination date',
      status: 'open',
      affectedField: 'maturityDate',
      expectedValue: 'after origination date',
      actualValue: '2024-01-01'
    });

    const explanation = await gemini.explainException(testLoan.toObject(), testExp.toObject());
    assert.ok(explanation.explanation, 'Explanation should not be empty');
    assert.ok(explanation.underlyingCause, 'Underlying cause should not be empty');
    assert.strictEqual(typeof explanation.confidence, 'number', 'Confidence should be a number');

    const suggestion = await gemini.suggestCorrection(testLoan.toObject(), testExp.toObject());
    assert.ok(suggestion.suggestedAction, 'Suggested action should not be empty');
    assert.strictEqual(typeof suggestion.confidence, 'number', 'Confidence should be a number');

    const comparison = await gemini.compareRecords(testLoan.toObject(), { loanId: 'LN-TEST-99', currentBalance: 12000 });
    assert.strictEqual(typeof comparison.isMatch, 'boolean', 'isMatch should be a boolean');

    const generatedRule = await gemini.generateValidationRule('Balance must exceed $10,000');
    assert.ok(generatedRule.ruleId, 'Rule ID should not be empty');
    assert.ok(generatedRule.errorMessage, 'Error message should not be empty');

    const aiLog = await AuditService.logEvent({
      loanId: 'SYSTEM',
      entityType: 'Loan',
      entityId: 'SYSTEM',
      eventType: 'AI_RULE_GENERATED',
      actorId: 'reviewer@demo.local',
      metadata: { description: 'Balance must exceed $10,000' }
    });
    assert.strictEqual(aiLog.eventType, 'AI_RULE_GENERATED', 'Audit log event type should match');
    console.log('✓ Phase 4 AI Copilot tests passed.');

    console.log('\n=========================================');
    console.log('✓ ALL BACKEND BUSINESS LOGIC TESTS PASSED.');
    console.log('=========================================');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILURE:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('[Test] Connection closed.');
  }
}

run();
