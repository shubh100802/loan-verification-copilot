import { Request, Response } from 'express';
import Exception from '../models/exception.model';
import Loan from '../models/loan.model';
import Review from '../models/review.model';
import User from '../models/user.model';
import { AIReviewService } from '../services/ai/aiReview.service';
import { AuditService } from '../services/audit/audit.service';

export class ExceptionController {
  public static async getExceptions(req: Request, res: Response): Promise<void> {
    const { status = 'open', severity } = req.query;

    try {
      const query: Record<string, any> = {};

      if (status !== 'all') {
        query.status = status;
      }

      if (severity && severity !== 'all') {
        query.severity = (severity as string).toLowerCase();
      }

      const exceptions = await Exception.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: exceptions
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async getExceptionById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    try {
      const exception = await Exception.findOne({ id });

      if (!exception) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Exception not found` }
        });
        return;
      }

      // Context-aware AI Copilot recommendation attachment
      const aiRecommendation = await AIReviewService.getLiveRecommendation(
        exception.ruleId,
        exception.affectedField,
        exception.actualValue,
        exception.loanId
      );

      res.status(200).json({
        success: true,
        data: {
          exception,
          aiRecommendation
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async submitReview(req: Request, res: Response): Promise<void> {
    const { exceptionId, loanId, action, notes, beforeValue, afterValue } = req.body;
    const actorId = req.query.actorId as string || 'reviewer@demo.local';
    const reviewerName = req.query.reviewerName as string || 'Reviewer';

    if (!exceptionId || !loanId || !action || !notes) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Missing required parameters' }
      });
      return;
    }

    try {
      // Backend authorization: require REVIEWER role
      const user = await User.findOne({ email: actorId });
      if (!user || user.role !== 'REVIEWER') {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Reviewer authorization required for exception decisions' }
        });
        return;
      }

      const exception = await Exception.findOne({ id: exceptionId });
      const loan = await Loan.findOne({ loanId });

      if (!exception || !loan) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Exception or Loan record not found' }
        });
        return;
      }

      const reviewId = `REV-${Date.now().toString().slice(-6)}`;

      // 1. Process exception status updates based on action
      if (action === 'waive_exception') {
        exception.status = 'waived';
        exception.resolutionNote = notes;
        exception.resolvedBy = actorId;
        exception.resolvedAt = new Date();
        await exception.save();

        // Check if there are other open exceptions left for this loan
        const openExceptionsCount = await Exception.countDocuments({ loanId, status: 'open' });
        if (openExceptionsCount === 0) {
          loan.verificationStatus = 'in_review'; // qualified for verification signoff
          await loan.save();
        }

        // Save review record
        const review = new Review({
          id: reviewId,
          exceptionId,
          loanId,
          reviewerId: actorId,
          reviewerName,
          action: 'waive_exception',
          notes,
          beforeValue,
          afterValue
        });
        await review.save();

        // Log audit event
        await AuditService.logEvent({
          loanId,
          entityType: 'Exception',
          entityId: exception._id.toString(),
          eventType: 'EXCEPTION_WAIVED',
          actorId,
          metadata: { exceptionId, notes }
        });
      } else if (action === 'request_correction') {
        exception.status = 'investigating';
        exception.resolutionNote = notes;
        await exception.save();

        const review = new Review({
          id: reviewId,
          exceptionId,
          loanId,
          reviewerId: actorId,
          reviewerName,
          action: 'request_correction',
          notes,
          beforeValue,
          afterValue
        });
        await review.save();

        await AuditService.logEvent({
          loanId,
          entityType: 'Exception',
          entityId: exception._id.toString(),
          eventType: 'CORRECTION_REQUESTED',
          actorId,
          metadata: { exceptionId, notes }
        });
      } else {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: `Action ${action} is invalid` }
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Review action processed successfully'
      });
    } catch (err: any) {
      console.error('[ExceptionController] Submit review failed:', err);
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }
}
