-- ============================================================================
-- CREDITS SYSTEM TABLES
-- Driven by src/lib/credits/service.ts (uses <transactions> + <user_accounts>)
-- ============================================================================

-- Atomic credit balance per user. Row-locked for concurrent operations.
CREATE TABLE IF NOT EXISTS public.user_accounts (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_balance CHECK (balance >= 0)
);

ALTER TABLE public.user_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own account"
  ON public.user_accounts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can update accounts"
  ON public.user_accounts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Immutable ledger of credit movements.
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
  reason TEXT NOT NULL,
  balance_before NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "System can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
