# Provider Balance System - Technical Documentation

## Overview

The provider balance system tracks your debt to providers using a running balance approach. Each transaction (purchase or payment) is recorded with a cumulative balance that shows the total debt at that point in time.

## How It Works

### Database Structure

The `account_movements` table stores each financial transaction:

- **`debe`** (debit): Amount you owe due to purchases
- **`haber`** (credit): Amount you pay to reduce debt
- **`saldo`** (balance): Running total after each transaction

### Balance Calculation

For each new transaction:

```
new_balance = previous_balance + debe - haber
```

### Provider Logic

- **Positive balance** = You owe money to the provider
- **Negative balance** = Provider has credit with you (rare)
- **Zero balance** = No outstanding debt

## Transaction Types

### 1. Purchase (Debit Movement)

When you buy from a provider:

- Creates a **debit** movement (`debe > 0`)
- **Increases** your debt to the provider
- Example: Previous balance $100 + Purchase $50 = New balance $150

### 2. Payment (Credit Movement)

When you pay a provider:

- Creates a **credit** movement (`haber > 0`)
- **Decreases** your debt to the provider
- Example: Previous balance $150 - Payment $30 = New balance $120

## UI Display

### Provider Info Page

- **Current Balance**: Shows latest `saldo` from most recent movement
- **Movement History**: Shows all transactions with running balance
- **Color Coding**:
  - 🔴 Red: You owe money (positive balance)
  - 🟢 Green: Credit in your favor (negative balance)
  - ⚫ Gray: No debt (zero balance)

### Movement Table Columns

- **Debe**: Purchase amounts (debt increases)
- **Haber**: Payment amounts (debt decreases)
- **Saldo**: Running balance after each transaction

## Balance Validation & Repair

### Validation Features

- **Validate Button**: Checks if all running balances are calculated correctly
- **Auto-repair**: Can recalculate all balances if inconsistencies are found
- **API Endpoints**:
  - `GET /api/account/provider/{id}/validate` - Check balance integrity
  - `POST /api/account/provider/{id}/recalculate` - Fix balance errors

### Common Issues & Solutions

#### Issue: Balance doesn't match expected amount

**Cause**: Manual database edits or calculation errors
**Solution**: Use the "Validar" button to check and auto-fix

#### Issue: Multiple transactions showing wrong running balance

**Cause**: Database inconsistency or order issues
**Solution**: Recalculate all balances in chronological order

## Technical Implementation

### Backend Services

- `AccountMovementsService.get_provider_balance()` - Gets current balance
- `AccountMovementsService.create_provider_debit_movement()` - Records purchases
- `AccountMovementsService.create_provider_credit_movement()` - Records payments
- `AccountMovementsService.recalculate_provider_balances()` - Fixes inconsistencies

### Frontend Services

- `accountMovementsService.getProviderBalance()` - Fetches current balance
- `accountMovementsService.validateProviderBalance()` - Checks integrity
- `accountMovementsService.recalculateProviderBalance()` - Triggers recalculation

## Best Practices

1. **Always use the service methods** to create movements (don't insert directly into DB)
2. **Check balance before manual DB changes** to avoid inconsistencies
3. **Run validation after data migrations** to ensure integrity
4. **Keep chronological order** when viewing/processing movements

## Example Scenarios

### Scenario 1: New Provider Relationship

1. Initial balance: $0
2. Purchase $100 → Balance: $100 (you owe)
3. Payment $30 → Balance: $70 (you owe)
4. Purchase $50 → Balance: $120 (you owe)
5. Payment $120 → Balance: $0 (even)

### Scenario 2: Provider Credit

1. Balance: $50 (you owe)
2. Payment $70 → Balance: -$20 (provider owes you)
3. Purchase $30 → Balance: $10 (you owe)

## Troubleshooting

### Q: Why does my balance look wrong?

A: Use the "Validar" button to check for calculation errors and auto-fix them.

### Q: Can I manually edit the balance?

A: Not recommended. Use the recalculation function to ensure data integrity.

### Q: What if I need to correct a transaction?

A: Edit the specific movement and then recalculate all balances to maintain consistency.

### Q: How do I see all movements for a provider?

A: Check the "Operaciones de Cuenta Corriente" section on the provider info page.

---

_This system ensures accurate debt tracking and provides tools to maintain data integrity over time._
