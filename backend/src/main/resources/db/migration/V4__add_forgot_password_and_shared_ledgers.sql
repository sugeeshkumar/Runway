-- Migration V4: Add Password Reset Tokens and Shared Ledgers Schema

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);

-- Shared Ledgers
CREATE TABLE shared_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'TRIP', -- TRIP, EVENT, CUSTOM
    start_date DATE NOT NULL,
    end_date DATE,
    base_currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    planned_budget NUMERIC(12, 2),
    is_settled BOOLEAN NOT NULL DEFAULT FALSE,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ledger Participants
CREATE TABLE ledger_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES shared_ledgers(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    linked_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shared Expenses
CREATE TABLE shared_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_id UUID NOT NULL REFERENCES shared_ledgers(id) ON DELETE CASCADE,
    paid_by_participant_id UUID NOT NULL REFERENCES ledger_participants(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    exchange_rate NUMERIC(10, 6) NOT NULL DEFAULT 1.000000,
    base_currency_amount NUMERIC(12, 2) NOT NULL,
    description VARCHAR(500) NOT NULL,
    split_type VARCHAR(20) NOT NULL DEFAULT 'EQUAL', -- EQUAL, EXACT, PERCENTAGE
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Shared Expense Splits
CREATE TABLE shared_expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shared_expense_id UUID NOT NULL REFERENCES shared_expenses(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES ledger_participants(id) ON DELETE CASCADE,
    share_amount NUMERIC(12, 2) NOT NULL, -- Share amount in ledger base currency
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal lookup performance
CREATE INDEX idx_shared_ledgers_owner ON shared_ledgers(owner_id);
CREATE INDEX idx_ledger_participants_ledger ON ledger_participants(ledger_id);
CREATE INDEX idx_shared_expenses_ledger ON shared_expenses(ledger_id);
CREATE INDEX idx_shared_expense_splits_expense ON shared_expense_splits(shared_expense_id);
