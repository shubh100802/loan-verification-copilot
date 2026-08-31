import fs from 'fs';
import path from 'path';
import { ILoan } from '../../models/loan.model';

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isValid: boolean;
  affectedField: string;
  actualValue: string;
  expectedValue: string;
  description: string;
}

export interface IValidationRule {
  ruleId: string;
  validate(loan: ILoan, context: { allLoans: ILoan[] }): ValidationResult | null;
}

export class ValidationEngine {
  private static rules: IValidationRule[] = [];
  private static ruleMetadata: Record<string, { name: string; severity: 'low' | 'medium' | 'high' | 'critical'; enabled: boolean }> = {};

  static {
    // Load rules metadata from validation_rules.json dynamically
    try {
      const configPath = path.resolve(__dirname, '../../../../data/validation_rules.json');
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(fileContent);
        for (const rule of config.rules) {
          ValidationEngine.ruleMetadata[rule.rule_id] = {
            name: rule.name,
            severity: rule.severity.toLowerCase() as any,
            enabled: rule.enabled
          };
        }
      }
    } catch (err) {
      console.error('[ValidationEngine] Error reading validation_rules.json:', err);
    }
  }

  public static getRuleMeta(ruleId: string) {
    return ValidationEngine.ruleMetadata[ruleId] || {
      name: 'Custom Validation Rule',
      severity: 'medium',
      enabled: true
    };
  }

  public static registerRule(rule: IValidationRule): void {
    ValidationEngine.rules.push(rule);
  }

  /**
   * Runs all enabled rules against a loan record and returns a list of failed rule exceptions.
   */
  public static run(loan: ILoan, allLoans: ILoan[]): ValidationResult[] {
    const failures: ValidationResult[] = [];
    const context = { allLoans };

    for (const rule of ValidationEngine.rules) {
      const meta = ValidationEngine.getRuleMeta(rule.ruleId);
      if (!meta.enabled) continue;

      try {
        const result = rule.validate(loan, context);
        if (result && !result.isValid) {
          failures.push(result);
        }
      } catch (err) {
        console.error(`[ValidationEngine] Error executing rule ${rule.ruleId} on loan ${loan.loanId}:`, err);
      }
    }

    return failures;
  }
}
