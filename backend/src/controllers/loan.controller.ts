import { Request, Response } from 'express';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import User from '../models/user.model';
import { AuditService } from '../services/audit/audit.service';
import { ValidationEngine } from '../services/validation/engine';

export class LoanController {
  public static async getLoans(req: Request, res: Response): Promise<void> {
    const { limit = '100', offset = '0', search = '', status } = req.query;

    try {
      const query: Record<string, any> = {};

      if (search) {
        query.$or = [
          { loanId: { $regex: search, $options: 'i' } },
          { borrowerId: { $regex: search, $options: 'i' } },
          { borrowerName: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        query.verificationStatus = status;
      }

      const total = await Loan.countDocuments(query);
      const loans = await Loan.find(query)
        .skip(parseInt(offset as string))
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          loans
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async getLoanById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const loan = await Loan.findOne({ loanId: id });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Loan with ID ${id} not found` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: loan
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async updateLoan(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const updates = req.body;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      // Backend authorization: require DATA_OPERATOR or REVIEWER role
      const user = await User.findOne({ email: actorId });
      if (!user || (user.role !== 'DATA_OPERATOR' && user.role !== 'REVIEWER')) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Operator or Reviewer authorization required for editing records' }
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: id });

      if (!loan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Loan with ID ${id} not found` }
        });
        return;
      }

      // Track differences for audit log
      const diff: Record<string, { before: any; after: any }> = {};
      const allowedFields = [
        'borrowerId',
        'borrowerName',
        'originationDate',
        'maturityDate',
        'originalPrincipal',
        'currentBalance',
        'interestRate',
        'paymentStatus',
        'propertyState',
        'termMonths',
        'dpd',
        'daysPastDue',
        'documentStatus',
        'document_status'
      ];

      // Handle document_status alias
      if (updates.document_status !== undefined && updates.documentStatus === undefined) {
        updates.documentStatus = updates.document_status;
      }

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          const key = field === 'document_status' ? 'documentStatus' : (field as keyof typeof loan);
          if (loan[key] !== updates[field]) {
            diff[field] = { before: loan[key], after: updates[field] };
            (loan as any)[key] = updates[field];
          }
        }
      }

      // If document status is set to AVAILABLE, update embedded documents
      if (updates.documentStatus === 'AVAILABLE' && loan.documents) {
        loan.documents.forEach((doc) => {
          doc.verified = true;
        });
      }

      if (Object.keys(diff).length === 0) {
        res.status(200).json({
          success: true,
          data: loan,
          message: 'No changes detected'
        });
        return;
      }

      // Save modified loan
      await loan.save();

      // Log edit event in audit log
      await AuditService.logEvent({
        loanId: id,
        entityType: 'Loan',
        entityId: loan._id.toString(),
        eventType: 'FIELD_EDITED',
        actorId,
        metadata: { diff }
      });

      // Re-run validation rules on this single record to check if exceptions are resolved
      const allLoans = await Loan.find();
      const failures = ValidationEngine.run(loan, allLoans);

      // Clean up previous exceptions for this loan
      await Exception.deleteMany({ loanId: id });

      if (failures.length === 0) {
        loan.verificationStatus = 'unverified'; // cleared from exception status
        await loan.save();
      } else {
        loan.verificationStatus = 'exception';
        await loan.save();

        // Save new validation exceptions
        for (const fail of failures) {
          const exceptionId = `EXC-${id}-${fail.ruleId}-${Date.now().toString().slice(-4)}`;
          const exceptionDoc = new Exception({
            id: exceptionId,
            loanId: id,
            borrowerId: loan.borrowerId,
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
        }
      }

      res.status(200).json({
        success: true,
        data: loan,
        message: 'Loan updated and re-validated successfully'
      });
    } catch (err: any) {
      console.error('[LoanController] Update failed:', err);
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }
}
