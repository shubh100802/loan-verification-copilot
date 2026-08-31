import crypto from 'crypto';
import AuditLog, { IAuditLog } from '../../models/auditLog.model';

export class AuditService {
  /**
   * Appends a new audit log event to the database, linking it sequentially to the previous event hash.
   */
  public static async logEvent(params: {
    loanId: string;
    entityType: 'Loan' | 'Exception' | 'VerifiedLoan' | 'ImportJob' | 'Review';
    entityId: string;
    eventType: string;
    actorId: string;
    metadata?: Record<string, any>;
  }): Promise<IAuditLog> {
    const { loanId, entityType, entityId, eventType, actorId, metadata = {} } = params;

    // 1. Get the last created audit log to extract its eventHash as previousHash
    const lastLog = await AuditLog.findOne().sort({ createdAt: -1 });
    const previousHash = lastLog ? lastLog.eventHash : '0000000000000000000000000000000000000000000000000000000000000000';

    const timestamp = new Date();

    // 2. Generate canonical string representation to hash deterministically
    const canonicalString = JSON.stringify({
      previousHash,
      entityType,
      entityId,
      eventType,
      actorId,
      metadata,
      timestamp: timestamp.toISOString()
    });

    const eventHash = crypto.createHash('sha256').update(canonicalString).digest('hex');

    // 3. Save the log document
    const auditRecord = new AuditLog({
      loanId,
      entityType,
      entityId,
      eventType,
      actorId,
      metadata,
      timestamp,
      previousHash,
      eventHash
    });

    return await auditRecord.save();
  }
}
