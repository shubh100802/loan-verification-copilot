import { Request, Response } from 'express';
import Loan from '../models/loan.model';
import Exception from '../models/exception.model';
import Review from '../models/review.model';
import AuditLog from '../models/auditLog.model';

export class SummaryController {
  public static async getSummary(_req: Request, res: Response): Promise<void> {
    try {
      const totalRecords = await Loan.countDocuments();
      const exceptionsCount = await Loan.countDocuments({ verificationStatus: 'exception' });
      const validRecords = totalRecords - exceptionsCount;

      const qualityScore = totalRecords > 0 ? parseFloat(((validRecords / totalRecords) * 100).toFixed(1)) : 100.0;

      const pendingExceptions = await Exception.countDocuments({ status: 'open' });
      const criticalExceptionsCount = await Exception.countDocuments({ status: 'open', severity: 'critical' });

      // Calculate reviewed today based on calendar date start
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const recordsReviewedToday = await Review.countDocuments({ createdAt: { $gte: startOfToday } });

      res.status(200).json({
        success: true,
        data: {
          totalRecords,
          validRecords,
          exceptionsCount,
          qualityScore,
          pendingExceptions,
          criticalExceptionsCount,
          recordsReviewedToday
        }
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }

  public static async getAuditTrail(req: Request, res: Response): Promise<void> {
    const { loanId } = req.params;

    try {
      const query: Record<string, any> = {};
      if (loanId && loanId !== 'all') {
        query.loanId = loanId;
      }

      const list = await AuditLog.find(query).sort({ timestamp: -1 });

      const formattedList = list.map((log) => {
        let summary = log.eventType.replace(/_/g, ' ');
        if (log.eventType === 'FIELD_EDITED') {
          if (log.metadata?.diff) {
            const fields = Object.keys(log.metadata.diff).join(', ');
            summary = `Field(s) edited: ${fields}`;
          } else if (log.metadata?.field) {
            summary = `Field edited: ${log.metadata.field}`;
          } else {
            summary = 'Loan field edited';
          }
        } else if (log.eventType === 'EXCEPTION_WAIVED') {
          summary = `Exception waived: ${log.metadata?.notes || 'No notes provided'}`;
        } else if (log.eventType === 'CORRECTION_REQUESTED') {
          summary = `Correction requested: ${log.metadata?.notes || 'No notes provided'}`;
        } else if (log.eventType === 'VERIFIED_RECORD_CREATED' || log.eventType === 'LOAN_VERIFIED') {
          summary = 'Loan record signed off and verified';
        } else if (log.eventType === 'RECORD_IMPORTED') {
          summary = `Loan record ingested into system`;
        } else if (log.eventType === 'FILE_UPLOADED') {
          summary = `Data file imported: ${log.metadata?.fileName || 'tape'}`;
        } else if (log.eventType === 'AI_RECOMMENDATION_GENERATED') {
          summary = `AI recommendation generated for rule ${log.metadata?.ruleId || ''} (${log.metadata?.operation || 'analyze'})`;
        } else if (log.eventType === 'AI_REVIEWER_NOTE_GENERATED') {
          summary = `AI Reviewer note generated`;
        } else if (log.eventType === 'AI_EXCEPTION_SUMMARY_GENERATED') {
          summary = `AI Batch exceptions summary generated`;
        } else if (log.eventType === 'AI_RULE_GENERATED') {
          summary = `AI Validation rule synthesized from natural language description`;
        }

        let diffObj = undefined;
        if (log.metadata?.diff) {
          const keys = Object.keys(log.metadata.diff);
          if (keys.length > 0) {
            const firstKey = keys[0];
            diffObj = {
              field: firstKey,
              before: log.metadata.diff[firstKey].before,
              after: log.metadata.diff[firstKey].after
            };
          }
        } else if (log.metadata?.field) {
          diffObj = {
            field: log.metadata.field,
            before: log.metadata.before,
            after: log.metadata.after
          };
        }

        return {
          id: log._id.toString(),
          loanId: log.loanId,
          actor: log.actorId || 'SYSTEM',
          action: log.eventType || '', // Map eventType to action for frontend includes checks
          entityType: log.entityType || 'Loan',
          changeSummary: summary,
          diff: diffObj,
          createdAt: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString()
        };
      });

      res.status(200).json({
        success: true,
        data: formattedList
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
  }
}
