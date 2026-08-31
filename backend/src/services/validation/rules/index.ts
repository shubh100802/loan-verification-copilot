import { ILoan } from '../../../models/loan.model';
import { ValidationEngine, IValidationRule, ValidationResult } from '../engine';

// List of standard US state codes for R012
const US_STATES = new Set([
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'GU', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'MP',
  'OH', 'OK', 'OR', 'PA', 'PR', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VI', 'VA', 'WA', 'WV', 'WI', 'WY'
]);

function createResult(
  ruleId: string,
  loan: ILoan,
  isValid: boolean,
  affectedField: string,
  expected: string,
  actual: string,
  message: string
): ValidationResult {
  const meta = ValidationEngine.getRuleMeta(ruleId);
  if (loan) { /* no-op */ }
  return {
    ruleId,
    ruleName: meta.name,
    severity: meta.severity,
    isValid,
    affectedField,
    actualValue: actual,
    expectedValue: expected,
    description: message
  };
}

// helper to safely check ISO date validity
function isValidDate(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
}

// R001: Required fields
export class RequiredFieldsRule implements IValidationRule {
  ruleId = 'R001';
  validate(loan: ILoan): ValidationResult | null {
    const isMissing = !loan.loanId || loan.loanId.trim() === '';
    return createResult(
      this.ruleId,
      loan,
      !isMissing,
      'loan_id',
      'Non-empty String',
      loan.loanId || '',
      isMissing ? 'Required loan ID is missing.' : 'Valid'
    );
  }
}

// R002: Valid dates
export class DateValidityRule implements IValidationRule {
  ruleId = 'R002';
  validate(loan: ILoan): ValidationResult | null {
    const origValid = isValidDate(loan.originationDate);
    const matValid = isValidDate(loan.maturityDate);
    const isValid = origValid && matValid;

    return createResult(
      this.ruleId,
      loan,
      isValid,
      !origValid ? 'origination_date' : 'maturity_date',
      'Valid date format YYYY-MM-DD',
      !origValid ? loan.originationDate : loan.maturityDate,
      isValid ? 'Valid' : `Date values must be valid formats.`
    );
  }
}

// R003: Positive principal
export class PositivePrincipalRule implements IValidationRule {
  ruleId = 'R003';
  validate(loan: ILoan): ValidationResult | null {
    const principal = loan.originalPrincipal;
    const isValid = principal >= 0;
    return createResult(
      this.ruleId,
      loan,
      isValid,
      'original_principal',
      '>= 0',
      String(principal),
      isValid ? 'Valid' : `Original principal cannot be negative (value: ${principal}).`
    );
  }
}

// R004: Non-negative balance
export class NonNegativeBalanceRule implements IValidationRule {
  ruleId = 'R004';
  validate(loan: ILoan): ValidationResult | null {
    const balance = loan.currentBalance;
    const isValid = balance >= 0;
    return createResult(
      this.ruleId,
      loan,
      isValid,
      'current_balance',
      '>= 0',
      String(balance),
      isValid ? 'Valid' : `Current balance cannot be negative (value: ${balance}).`
    );
  }
}

// R005: Maturity after origination
export class MaturityAfterOriginationRule implements IValidationRule {
  ruleId = 'R005';
  validate(loan: ILoan): ValidationResult | null {
    if (!isValidDate(loan.originationDate) || !isValidDate(loan.maturityDate)) {
      return null; // Let R002 flag date formatting issue
    }
    const orig = new Date(loan.originationDate).getTime();
    const mat = new Date(loan.maturityDate).getTime();
    const isValid = mat > orig;

    return createResult(
      this.ruleId,
      loan,
      isValid,
      'maturity_date',
      `Later than ${loan.originationDate}`,
      loan.maturityDate,
      isValid ? 'Valid' : `Maturity date must fall after origination date.`
    );
  }
}

// R006: Balance principal limit
export class BalancePrincipalRule implements IValidationRule {
  ruleId = 'R006';
  validate(loan: ILoan): ValidationResult | null {
    const isValid = loan.currentBalance <= loan.originalPrincipal;
    return createResult(
      this.ruleId,
      loan,
      isValid,
      'current_balance',
      `<= original_principal (${loan.originalPrincipal})`,
      String(loan.currentBalance),
      isValid ? 'Valid' : `Current balance exceeds original principal limit.`
    );
  }
}

// R007: Interest rate bounds
export class InterestRateRangeRule implements IValidationRule {
  ruleId = 'R007';
  validate(loan: ILoan): ValidationResult | null {
    const rate = loan.interestRate;
    const isValid = rate >= 0 && rate <= 50;
    return createResult(
      this.ruleId,
      loan,
      isValid,
      'interest_rate',
      'Between 0 and 50%',
      String(rate),
      isValid ? 'Valid' : `Interest rate out of valid bounds (value: ${rate}%).`
    );
  }
}

// R008: Payment status consistency
export class PaymentStatusRule implements IValidationRule {
  ruleId = 'R008';
  validate(loan: ILoan): ValidationResult | null {
    const status = loan.paymentStatus ? loan.paymentStatus.toUpperCase() : '';
    const dpd = loan.dpd || 0;
    let isValid = true;
    let expected = 'Status-appropriate DPD';
    let message = 'Valid';

    if (status === 'CURRENT' && dpd !== 0) {
      isValid = false;
      expected = '0 DPD';
      message = 'CURRENT status implies 0 days past due.';
    } else if (status === 'DEFAULT' && dpd < 90) {
      isValid = false;
      expected = '>= 90 DPD';
      message = 'DEFAULT status implies at least 90 days past due.';
    }

    return createResult(
      this.ruleId,
      loan,
      isValid,
      'days_past_due',
      expected,
      String(dpd),
      message
    );
  }
}

// R009: Duplicate loan ID check
export class DuplicateLoanRule implements IValidationRule {
  ruleId = 'R009';
  validate(loan: ILoan, context: { allLoans: ILoan[] }): ValidationResult | null {
    if (!loan.loanId || loan.loanId.trim() === '') return null;
    
    // Check if another loan has the same ID
    const isDuplicate = context.allLoans.some(
      (l) => l.loanId === loan.loanId && l._id.toString() !== loan._id.toString()
    );

    return createResult(
      this.ruleId,
      loan,
      !isDuplicate,
      'loan_id',
      'Unique ID',
      loan.loanId,
      isDuplicate ? `Duplicate Loan ID detected.` : 'Valid'
    );
  }
}

// R010: Document status present
export class DocumentStatusRule implements IValidationRule {
  ruleId = 'R010';
  validate(loan: ILoan): ValidationResult | null {
    const status = loan.documentStatus;
    const isValid = status !== undefined && status !== null && status.trim() !== '';
    return createResult(
      this.ruleId,
      loan,
      isValid,
      'document_status',
      'Status String',
      status || '',
      isValid ? 'Valid' : 'Required document status is missing.'
    );
  }
}

// R011: Stale record window check
export class StaleRecordRule implements IValidationRule {
  ruleId = 'R011';
  validate(loan: ILoan): ValidationResult | null {
    if (!isValidDate(loan.lastUpdated)) {
      return null;
    }
    const updateTime = new Date(loan.lastUpdated).getTime();
    const systemTime = new Date().getTime();
    
    // age in days
    const ageDays = (systemTime - updateTime) / (1000 * 3600 * 24);
    // Let's use 365 days window or seed standard window
    const isValid = ageDays <= 365;

    return createResult(
      this.ruleId,
      loan,
      isValid,
      'last_updated_at',
      'Updated within 365 days',
      loan.lastUpdated,
      isValid ? 'Valid' : `Record is stale. Age is ${Math.floor(ageDays)} days.`
    );
  }
}

// R012: Valid US State code
export class ValidStateRule implements IValidationRule {
  ruleId = 'R012';
  validate(loan: ILoan): ValidationResult | null {
    const state = loan.propertyState ? loan.propertyState.toUpperCase().trim() : '';
    const isValid = US_STATES.has(state);
    return createResult(
      this.ruleId,
      loan,
      isValid,
      'borrower_state',
      'Valid 2-letter US State Code',
      state,
      isValid ? 'Valid' : `Invalid state code: "${state}".`
    );
  }
}

// R013: Closed balance check
export class ClosedLoanBalanceRule implements IValidationRule {
  ruleId = 'R013';
  validate(loan: ILoan): ValidationResult | null {
    const status = loan.paymentStatus ? loan.paymentStatus.toUpperCase().trim() : '';
    const balance = loan.currentBalance;
    const isValid = status !== 'CLOSED' || balance === 0;

    return createResult(
      this.ruleId,
      loan,
      isValid,
      'current_balance',
      '0.00 Balance',
      String(balance),
      isValid ? 'Valid' : `CLOSED loans must show zero balance (value: ${balance}).`
    );
  }
}

// R014: Duplicate borrower combination check
export class DuplicateComboRule implements IValidationRule {
  ruleId = 'R014';
  validate(loan: ILoan, context: { allLoans: ILoan[] }): ValidationResult | null {
    if (!loan.borrowerId || !loan.originationDate) return null;
    
    const isDuplicate = context.allLoans.some(
      (l) =>
        l.borrowerId === loan.borrowerId &&
        l.originalPrincipal === loan.originalPrincipal &&
        l.originationDate === loan.originationDate &&
        l._id.toString() !== loan._id.toString()
    );

    return createResult(
      this.ruleId,
      loan,
      !isDuplicate,
      'borrower_id,original_principal,origination_date',
      'Unique Combo',
      `${loan.borrowerId}, ${loan.originalPrincipal}, ${loan.originationDate}`,
      isDuplicate ? `Duplicate Borrower Combo detected.` : 'Valid'
    );
  }
}

// Self-executing registration of all rules in the validation engine
ValidationEngine.registerRule(new RequiredFieldsRule());
ValidationEngine.registerRule(new DateValidityRule());
ValidationEngine.registerRule(new PositivePrincipalRule());
ValidationEngine.registerRule(new NonNegativeBalanceRule());
ValidationEngine.registerRule(new MaturityAfterOriginationRule());
ValidationEngine.registerRule(new BalancePrincipalRule());
ValidationEngine.registerRule(new InterestRateRangeRule());
ValidationEngine.registerRule(new PaymentStatusRule());
ValidationEngine.registerRule(new DuplicateLoanRule());
ValidationEngine.registerRule(new DocumentStatusRule());
ValidationEngine.registerRule(new StaleRecordRule());
ValidationEngine.registerRule(new ValidStateRule());
ValidationEngine.registerRule(new ClosedLoanBalanceRule());
ValidationEngine.registerRule(new DuplicateComboRule());
