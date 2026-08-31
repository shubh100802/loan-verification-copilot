# Intain Full Stack Track — Synthetic Development Dataset

This package is a development/judging-style synthetic dataset modeled directly on the official challenge fields and intentional issue categories.

## Files
- `loan_tape.csv`: 2,000 primary loan records.
- `servicer_update.csv`: 700 second-source records with partial/conflicting values.
- `document_manifest.csv`: mock document availability.
- `validation_rules.json`: configurable validation rules.
- `users.json`: three demo roles and credentials.
- `expected_exception_sample.csv`: known exception examples for validation testing.

## Demo credentials
- Data Operator: operator@demo.local / Operator@123
- Reviewer: reviewer@demo.local / Reviewer@123
- Data Consumer: consumer@demo.local / Consumer@123

## Important
This is a synthetic development dataset, not the organizer's eventual dataset. When HackerEarth/Intain provides the official package, keep the application schema flexible and map the official fields into the internal canonical schema.

## Intentional issues
Missing IDs, duplicate IDs, duplicate borrower combinations, invalid dates, maturity-before-origination, negative principal/balance, balance above principal, out-of-range interest, payment-status/DPD conflicts, missing documents, servicer conflicts, stale records, invalid state codes, repeated borrowers, and closed loans with positive balances.
