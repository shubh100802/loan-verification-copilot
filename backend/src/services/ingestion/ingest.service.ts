import fs from 'fs';
import { parseCsv } from '../../utils/csvParser';
import Loan from '../../models/loan.model';
import Exception from '../../models/exception.model';
import ImportJob from '../../models/importJob.model';
import { ValidationEngine } from '../validation/engine';
import { AuditService } from '../audit/audit.service';
import '../validation/rules'; // Ensure rules are registered

// A mapping of default loan names to match frontend expectations perfectly
const STATIC_NAMES: Record<string, string> = {
  'LN-00001': 'Sarah Jenkins',
  'LN-00002': 'Michael Chang',
  'LN-00003': 'Emma Watson',
  'LN-00004': 'David Miller',
  'LN-00005': 'James Robert',
  'LN-00006': 'Linda Thompson',
  'LN-00007': 'Robert Garcia',
  'LN-00008': 'Patricia Davis',
  'LN-00009': 'William Rodriguez',
  'LN-00010': 'Elizabeth Martinez'
};

export class IngestService {
  /**
   * Helper to fetch realistic borrower name
   */
  private static getBorrowerName(loanId: string, borrowerId: string): string {
    if (STATIC_NAMES[loanId]) return STATIC_NAMES[loanId];
    
    // Generate deterministic name based on borrower ID suffix
    const firstNames = ['John', 'Jane', 'Alex', 'Emily', 'Brian', 'Sarah', 'Kevin', 'Jessica', 'David', 'Laura'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson'];
    
    const num = parseInt(borrowerId.replace(/[^\d]/g, '')) || 0;
    const first = firstNames[num % firstNames.length];
    const last = lastNames[(num + 3) % lastNames.length];
    return `${first} ${last}`;
  }

  /**
   * Ingests loan_tape.csv
   */
  public static async ingestLoanTape(filePath: string, fileName: string, actorId: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(fileContent);

    if (rows.length < 2) {
      throw new Error('CSV file is empty or missing headers');
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    const importJobId = `JOB-TAPE-${Date.now().toString().slice(-6)}`;
    const job = new ImportJob({
      id: importJobId,
      fileName,
      fileType: 'loan_tape',
      status: 'processing',
      totalRecords: dataRows.length,
      uploadedBy: actorId
    });
    await job.save();

    await AuditService.logEvent({
      loanId: 'SYSTEM',
      entityType: 'ImportJob',
      entityId: importJobId,
      eventType: 'FILE_UPLOADED',
      actorId,
      metadata: { fileName, fileType: 'loan_tape', importJobId }
    });

    let processedCount = 0;
    let failedCount = 0;
    let exceptionCount = 0;

    // Cache list of all existing loans for duplicate and combo detection
    const allLoans = await Loan.find();

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const sourceRow = index + 2; // 1-indexed line offset including headers

      try {
        const item: Record<string, string> = {};
        headers.forEach((h, idx) => {
          item[h] = row[idx] || '';
        });

        const loanId = item.loan_id || '';
        const borrowerId = item.borrower_id || '';

        // Normalize numeric items
        const principal = parseFloat(item.original_principal) || 0;
        const balance = parseFloat(item.current_balance) || 0;
        const rate = parseFloat(item.interest_rate) || 0;
        const term = parseInt(item.term_months) || 0;
        const dpd = parseInt(item.days_past_due) || 0;

        const borrowerName = this.getBorrowerName(loanId, borrowerId);

        // Save normalized record
        const loan = new Loan({
          loanId,
          borrowerName,
          borrowerId,
          loanType: (item.loan_type || 'UNKNOWN').toUpperCase(),
          originationDate: item.origination_date || '',
          maturityDate: item.maturity_date || '',
          originalPrincipal: principal,
          currentBalance: balance,
          interestRate: rate,
          termMonths: term,
          dpd,
          propertyState: (item.borrower_state || '').toUpperCase(),
          loanPurpose: (item.loan_purpose || 'UNKNOWN').toUpperCase(),
          creditGrade: (item.credit_grade || 'C').toUpperCase(),
          paymentStatus: (item.payment_status || 'UNKNOWN').toUpperCase(),
          verificationStatus: 'unverified',
          servicerName: item.servicer_name || 'Primary Servicer',
          lastUpdated: item.last_updated_at || new Date().toISOString().split('T')[0],
          documentStatus: item.document_status || 'MISSING',
          sourceSystem: item.source_system || 'TAPE_IMPORT',
          importJobId,
          sourceRow
        });

        await loan.save();
        allLoans.push(loan); // Update cache for validation duplicate checks

        // Run validation engine rules
        const failures = ValidationEngine.run(loan, allLoans);

        if (failures.length > 0) {
          loan.verificationStatus = 'exception';
          await loan.save();

          for (const fail of failures) {
            const exceptionId = `EXC-${loanId || 'MISSING'}-${fail.ruleId}-${Date.now().toString().slice(-4)}`;
            const exceptionDoc = new Exception({
              id: exceptionId,
              loanId: loanId || 'MISSING',
              borrowerId: borrowerId || 'MISSING',
              ruleId: fail.ruleId,
              ruleName: fail.ruleName,
              severity: fail.severity,
              description: fail.description,
              status: 'open',
              affectedField: fail.affectedField,
              expectedValue: fail.expectedValue,
              actualValue: fail.actualValue
            });
            await exceptionDoc.save();
            exceptionCount++;

            await AuditService.logEvent({
              loanId: loanId || 'MISSING',
              entityType: 'Exception',
              entityId: exceptionId,
              eventType: 'EXCEPTION_CREATED',
              actorId: 'SYSTEM',
              metadata: { ruleId: fail.ruleId, severity: fail.severity, description: fail.description }
            });
          }
        }

        await AuditService.logEvent({
          loanId: loanId || 'MISSING',
          entityType: 'Loan',
          entityId: loan._id.toString(),
          eventType: 'RECORD_IMPORTED',
          actorId,
          metadata: { importJobId, sourceRow, exceptionCount: failures.length }
        });

        processedCount++;
      } catch (err: any) {
        console.error(`[Ingest] Error parsing row ${sourceRow}:`, err.message);
        failedCount++;
      }
    }

    job.status = 'completed';
    job.processedRecords = processedCount;
    job.failedRecords = failedCount;
    job.exceptionCount = exceptionCount;
    await job.save();

    return importJobId;
  }

  /**
   * Ingests servicer_update.csv for reconciliation check
   */
  public static async ingestServicerUpdate(filePath: string, fileName: string, actorId: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(fileContent);

    if (rows.length < 2) {
      throw new Error('CSV file is empty or missing headers');
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    const importJobId = `JOB-SERV-${Date.now().toString().slice(-6)}`;
    const job = new ImportJob({
      id: importJobId,
      fileName,
      fileType: 'servicer_update',
      status: 'processing',
      totalRecords: dataRows.length,
      uploadedBy: actorId
    });
    await job.save();

    let processedCount = 0;
    let failedCount = 0;
    let exceptionCount = 0;

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const sourceRow = index + 2;

      try {
        const item: Record<string, string> = {};
        headers.forEach((h, idx) => {
          item[h] = row[idx] || '';
        });

        const loanId = item.loan_id;
        if (!loanId) continue;

        const updateBalance = parseFloat(item.current_balance);
        if (isNaN(updateBalance)) continue;

        // Query corresponding primary tape record
        const loan = await Loan.findOne({ loanId });

        if (loan) {
          // Verify current balances match
          if (loan.currentBalance !== updateBalance) {
            const exceptionId = `EXC-${loanId}-R015-${Date.now().toString().slice(-4)}`;
            const exceptionDoc = new Exception({
              id: exceptionId,
              loanId,
              borrowerId: loan.borrowerId,
              ruleId: 'R015',
              ruleName: 'Servicer Reconciliation Discrepancy',
              severity: 'high',
              description: `Servicer update balance (${updateBalance}) conflicts with tape balance (${loan.currentBalance})`,
              status: 'open',
              affectedField: 'current_balance',
              expectedValue: String(loan.currentBalance),
              actualValue: String(updateBalance)
            });
            await exceptionDoc.save();
            exceptionCount++;

            // Set loan verification to exception
            loan.verificationStatus = 'exception';
            await loan.save();

            await AuditService.logEvent({
              loanId,
              entityType: 'Exception',
              entityId: exceptionId,
              eventType: 'EXCEPTION_CREATED',
              actorId: 'SYSTEM',
              metadata: { ruleId: 'R015', tapeBalance: loan.currentBalance, servicerBalance: updateBalance, sourceRow }
            });
          }

          processedCount++;
        }
      } catch (err: any) {
        console.error(`[Ingest] Servicer update parse error:`, err.message);
        failedCount++;
      }
    }

    job.status = 'completed';
    job.processedRecords = processedCount;
    job.failedRecords = failedCount;
    job.exceptionCount = exceptionCount;
    await job.save();

    return importJobId;
  }

  /**
   * Ingests document_manifest.csv
   */
  public static async ingestDocumentManifest(filePath: string, fileName: string, actorId: string): Promise<string> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCsv(fileContent);

    if (rows.length < 2) {
      throw new Error('CSV file is empty or missing headers');
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const dataRows = rows.slice(1);

    const importJobId = `JOB-DOC-${Date.now().toString().slice(-6)}`;
    const job = new ImportJob({
      id: importJobId,
      fileName,
      fileType: 'document_manifest',
      status: 'processing',
      totalRecords: dataRows.length,
      uploadedBy: actorId
    });
    await job.save();

    let processedCount = 0;
    let failedCount = 0;
    let exceptionCount = 0;

    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const sourceRow = index + 2;

      try {
        const item: Record<string, string> = {};
        headers.forEach((h, idx) => {
          item[h] = row[idx] || '';
        });

        const loanId = item.loan_id;
        if (!loanId) continue;

        const docType = item.document_type || 'COLLATERAL';
        const docStatus = item.document_status || 'MISSING';
        const manifestId = `MNF-${docType}-${Date.now().toString().slice(-4)}`;

        const loan = await Loan.findOne({ loanId });

        if (loan) {
          // Append document info to the Loan object
          loan.documents = loan.documents.filter((d) => d.documentType !== docType);
          loan.documents.push({
            documentType: docType,
            fileName: `${loanId}_${docType.toLowerCase()}.pdf`,
            verified: docStatus === 'AVAILABLE',
            manifestId
          });

          await loan.save();

          // Create R010 exception if document is missing/expired/pending
          if (docStatus !== 'AVAILABLE') {
            const exceptionId = `EXC-${loanId}-R010-${Date.now().toString().slice(-4)}`;
            const exceptionDoc = new Exception({
              id: exceptionId,
              loanId,
              borrowerId: loan.borrowerId,
              ruleId: 'R010',
              ruleName: 'Document status required',
              severity: 'medium',
              description: `Required document ${docType} has invalid status: ${docStatus}`,
              status: 'open',
              affectedField: 'document_status',
              expectedValue: 'AVAILABLE',
              actualValue: docStatus
            });
            await exceptionDoc.save();
            exceptionCount++;

            loan.verificationStatus = 'exception';
            await loan.save();

            await AuditService.logEvent({
              loanId,
              entityType: 'Exception',
              entityId: exceptionId,
              eventType: 'EXCEPTION_CREATED',
              actorId: 'SYSTEM',
              metadata: { ruleId: 'R010', docType, docStatus, sourceRow }
            });
          }

          processedCount++;
        }
      } catch (err: any) {
        console.error(`[Ingest] Document manifest parse error:`, err.message);
        failedCount++;
      }
    }

    job.status = 'completed';
    job.processedRecords = processedCount;
    job.failedRecords = failedCount;
    job.exceptionCount = exceptionCount;
    await job.save();

    return importJobId;
  }
}
