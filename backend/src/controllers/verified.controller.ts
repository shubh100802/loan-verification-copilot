import { Request, Response } from 'express';
import crypto from 'crypto';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import VerifiedLoan from '../models/verifiedLoan.model';
import User from '../models/user.model';
import { AuditService } from '../services/audit/audit.service';

export class VerifiedController {
  /**
   * Helper to hash canonical loan data deterministically.
   */
  private static generateRecordHash(loanData: Record<string, any>): string {
    const sortedKeys = Object.keys(loanData).sort();
    const sortedData = sortedKeys.reduce((acc: Record<string, any>, key) => {
      acc[key] = loanData[key];
      return acc;
    }, {});
    
    const canonicalString = JSON.stringify(sortedData);
    return crypto.createHash('sha256').update(canonicalString).digest('hex');
  }

  public static async getVerifiedLoans(_req: Request, res: Response): Promise<void> {
    try {
      const list = await VerifiedLoan.find().sort({ verifiedAt: -1 });
      res.status(200).json({
        success: true,
        data: list
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async getVerifiedById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const verified = await VerifiedLoan.findOne({ loanId: id });

      if (!verified) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Verified record not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: verified
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async verifyLoanRecord(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { notes = '' } = req.body;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';
    const reviewerName = req.query.reviewerName as string || 'Reviewer';

    try {
      // Backend authorization: require REVIEWER role
      const user = await User.findOne({ email: actorId });
      if (!user || user.role !== 'REVIEWER') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required for verified sign-off' }
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: id });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Loan record not found' }
        });
        return;
      }

      // Block if there are unresolved exceptions
      const unresolvedCount = await Exception.countDocuments({ loanId: id, status: 'open' });
      if (unresolvedCount > 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VERIFICATION_BLOCKED', message: `Verification blocked. Record has ${unresolvedCount} open exception(s).` }
        });
        return;
      }

      // Check if already verified
      const existingVerified = await VerifiedLoan.findOne({ loanId: id });
      if (existingVerified) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_VERIFIED', message: 'Record has already been verified' }
        });
        return;
      }

      // 1. Structure canonical loan data block
      const canonicalData = {
        loanId: loan.loanId,
        borrowerName: loan.borrowerName,
        borrowerId: loan.borrowerId,
        loanType: loan.loanType,
        originationDate: loan.originationDate,
        maturityDate: loan.maturityDate,
        originalPrincipal: loan.originalPrincipal,
        currentBalance: loan.currentBalance,
        interestRate: loan.interestRate,
        paymentStatus: loan.paymentStatus,
        dpd: loan.dpd !== undefined ? loan.dpd : 0,
        propertyState: loan.propertyState,
        loanPurpose: loan.loanPurpose,
        creditGrade: loan.creditGrade,
        servicerName: loan.servicerName,
        lastUpdated: loan.lastUpdated
      };

      // 2. Generate hash deterministically
      const recordHash = VerifiedController.generateRecordHash(canonicalData);

      // Fetch exceptions associated to document files lineage
      const totalRules = await Exception.countDocuments({ loanId: id });

      // 3. Save verified document
      const verified = new VerifiedLoan({
        loanId: id,
        canonicalLoanData: canonicalData,
        sourceFile: loan.importJobId || 'TAPE_INGEST',
        validationResult: {
          rulesExecutedCount: 14,
          status: totalRules === 0 ? 'clean' : 'resolved'
        },
        reviewerDecision: {
          reviewerName,
          notes,
          actionTaken: 'APPROVE_VERIFICATION'
        },
        verifiedBy: actorId,
        verifiedAt: new Date(),
        recordHash
      });

      await verified.save();

      // 4. Update loan verification status
      loan.verificationStatus = 'verified';
      await loan.save();

      // 5. Append to Audit log
      await AuditService.logEvent({
        loanId: id,
        entityType: 'VerifiedLoan',
        entityId: verified._id.toString(),
        eventType: 'VERIFIED_RECORD_CREATED',
        actorId,
        metadata: { recordHash, verifiedBy: actorId }
      });

      res.status(200).json({
        success: true,
        data: verified,
        message: 'Loan record signed off and verified successfully'
      });
    } catch (err: any) {
      console.error('[VerifiedController] Signoff failed:', err);
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }
}
