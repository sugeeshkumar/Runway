-- Migration V5: Add Monthly Income, Template Pausing, and Idempotent Recurring Generation Schema

-- Add monthly income to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12, 2);

-- Add pause flag to recurring_expense_templates
ALTER TABLE recurring_expense_templates ADD COLUMN IF NOT EXISTS is_paused BOOLEAN NOT NULL DEFAULT FALSE;

-- Create generated_recurring_charges table for idempotency tracking
CREATE TABLE IF NOT EXISTS generated_recurring_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES recurring_expense_templates(id) ON DELETE CASCADE,
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    charge_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_template_charge_date UNIQUE (template_id, charge_date)
);

CREATE INDEX IF NOT EXISTS idx_generated_charges_template ON generated_recurring_charges(template_id);
