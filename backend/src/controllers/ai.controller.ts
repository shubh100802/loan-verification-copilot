import { Request, Response } from 'express';
import { GeminiProvider } from '../ai/gemini.provider';
import Exception from '../models/exception.model';
import Loan from '../models/loan.model';
import User from '../models/user.model';
import { AuditService } from '../services/audit/audit.service';

const gemini = new GeminiProvider();

export class AIController {
  /**
   * Helper to verify if the actor email matches a REVIEWER role in DB.
   */
  private static async verifyReviewer(actorId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ email: actorId });
      return user?.role === 'REVIEWER';
    } catch {
      return false;
    }
  }

  public static async explainException(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      const isReviewer = await AIController.verifyReviewer(actorId);
      if (!isReviewer) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required' }
        });
        return;
      }

      const exception = await Exception.findOne({ id });
      if (!exception) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Exception record not found' }
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: exception.loanId });
      const loanData = loan ? loan.toObject() : {};

      const result = await gemini.explainException(loanData, exception.toObject());

      // Log AI generation event in AuditLog sequential ledger
      await AuditService.logEvent({
        loanId: exception.loanId,
        entityType: 'Exception',
        entityId: exception.id,
        eventType: 'AI_RECOMMENDATION_GENERATED',
        actorId,
        metadata: {
          ruleId: exception.ruleId,
          affectedField: exception.affectedField,
          confidence: result.confidence,
          operation: 'explain'
        }
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  public static async suggestCorrection(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      const isReviewer = await AIController.verifyReviewer(actorId);
      if (!isReviewer) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required' }
        });
        return;
      }

      const exception = await Exception.findOne({ id });
      if (!exception) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Exception record not found' }
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: exception.loanId });
      const loanData = loan ? loan.toObject() : {};

      // Context-aware related duplicates fetcher if rules trigger duplicates
      let relatedRecords: any[] = [];
      if (exception.ruleId === 'R009' || exception.ruleId === 'R014') {
        relatedRecords = await Loan.find({ borrowerId: loan?.borrowerId });
      }

      const result = await gemini.suggestCorrection(loanData, exception.toObject(), relatedRecords);

      await AuditService.logEvent({
        loanId: exception.loanId,
        entityType: 'Exception',
        entityId: exception.id,
        eventType: 'AI_RECOMMENDATION_GENERATED',
        actorId,
        metadata: {
          ruleId: exception.ruleId,
          affectedField: exception.affectedField,
          confidence: result.confidence,
          operation: 'suggest_correction'
        }
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  public static async compareRecords(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      const isReviewer = await AIController.verifyReviewer(actorId);
      if (!isReviewer) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required' }
        });
        return;
      }

      const exception = await Exception.findOne({ id });
      if (!exception) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Exception record not found' }
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: exception.loanId });
      if (!loan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Primary loan record not found' }
        });
        return;
      }

      // Reconstruct secondary update value mapping context
      const secondaryRecord = {
        loanId: exception.loanId,
        currentBalance: parseFloat(exception.actualValue || '0')
      };

      const result = await gemini.compareRecords(loan.toObject(), secondaryRecord);

      await AuditService.logEvent({
        loanId: exception.loanId,
        entityType: 'Exception',
        entityId: exception.id,
        eventType: 'AI_RECOMMENDATION_GENERATED',
        actorId,
        metadata: {
          ruleId: exception.ruleId,
          affectedField: exception.affectedField,
          operation: 'compare'
        }
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  public static async generateReviewerNote(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      const isReviewer = await AIController.verifyReviewer(actorId);
      if (!isReviewer) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required' }
        });
        return;
      }

      const exception = await Exception.findOne({ id });
      if (!exception) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Exception record not found' }
        });
        return;
      }

      const loan = await Loan.findOne({ loanId: exception.loanId });
      if (!loan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Loan record not found' }
        });
        return;
      }

      const exceptions = await Exception.find({ loanId: exception.loanId });
      const exceptionsList = exceptions.map(e => e.toObject());

      const result = await gemini.generateReviewerNote(loan.toObject(), exceptionsList);

      await AuditService.logEvent({
        loanId: exception.loanId,
        entityType: 'Loan',
        entityId: loan._id.toString(),
        eventType: 'AI_REVIEWER_NOTE_GENERATED',
        actorId,
        metadata: {
          exceptionId: exception.id
        }
      });

      res.status(200).json({
        success: true,
        data: { note: result }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  public static async summarizeExceptions(req: Request, res: Response): Promise<void> {
    const { exceptionIds = [] } = req.body;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      const isReviewer = await AIController.verifyReviewer(actorId);
      if (!isReviewer) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required' }
        });
        return;
      }

      const exceptions = await Exception.find({ id: { $in: exceptionIds } });
      const exceptionsList = exceptions.map(e => e.toObject());

      const result = await gemini.summarizeExceptionsBatch(exceptionsList);

      await AuditService.logEvent({
        loanId: 'BATCH',
        entityType: 'Exception',
        entityId: exceptionIds.join(','),
        eventType: 'AI_EXCEPTION_SUMMARY_GENERATED',
        actorId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }

  public static async generateValidationRule(req: Request, res: Response): Promise<void> {
    const { description } = req.body;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';

    try {
      const isReviewer = await AIController.verifyReviewer(actorId);
      if (!isReviewer) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required' }
        });
        return;
      }

      if (!description) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Missing rule description prompt' }
        });
        return;
      }

      const result = await gemini.generateValidationRule(description);

      await AuditService.logEvent({
        loanId: 'SYSTEM',
        entityType: 'Loan',
        entityId: 'SYSTEM',
        eventType: 'AI_RULE_GENERATED',
        actorId,
        metadata: { description }
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: err.message }
      });
    }
  }
}
