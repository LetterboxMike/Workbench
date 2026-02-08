-- Billing and entitlement lifecycle primitives
-- Date: 2026-02-08

CREATE TABLE IF NOT EXISTS org_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('starter', 'growth', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
  seat_count INTEGER NOT NULL DEFAULT 3 CHECK (seat_count > 0),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_subscriptions_single_open
  ON org_subscriptions(org_id)
  WHERE status <> 'canceled';

CREATE INDEX IF NOT EXISTS idx_org_subscriptions_org_status
  ON org_subscriptions(org_id, status, current_period_end DESC);

CREATE TABLE IF NOT EXISTS org_usage_counters (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, metric)
);

CREATE INDEX IF NOT EXISTS idx_org_usage_counters_org
  ON org_usage_counters(org_id);

CREATE TABLE IF NOT EXISTS org_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES org_subscriptions(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invoices_org_created
  ON org_invoices(org_id, created_at DESC);

ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_usage_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_subscriptions_select ON org_subscriptions;
DROP POLICY IF EXISTS org_subscriptions_insert ON org_subscriptions;
DROP POLICY IF EXISTS org_subscriptions_update ON org_subscriptions;

CREATE POLICY org_subscriptions_select ON org_subscriptions
FOR SELECT USING (public.workbench_user_is_org_super_admin(org_subscriptions.org_id));

CREATE POLICY org_subscriptions_insert ON org_subscriptions
FOR INSERT WITH CHECK (public.workbench_user_is_org_super_admin(org_subscriptions.org_id));

CREATE POLICY org_subscriptions_update ON org_subscriptions
FOR UPDATE USING (public.workbench_user_is_org_super_admin(org_subscriptions.org_id))
WITH CHECK (public.workbench_user_is_org_super_admin(org_subscriptions.org_id));

DROP POLICY IF EXISTS org_usage_counters_select ON org_usage_counters;
DROP POLICY IF EXISTS org_usage_counters_insert ON org_usage_counters;
DROP POLICY IF EXISTS org_usage_counters_update ON org_usage_counters;

CREATE POLICY org_usage_counters_select ON org_usage_counters
FOR SELECT USING (public.workbench_user_is_org_super_admin(org_usage_counters.org_id));

CREATE POLICY org_usage_counters_insert ON org_usage_counters
FOR INSERT WITH CHECK (public.workbench_user_is_org_super_admin(org_usage_counters.org_id));

CREATE POLICY org_usage_counters_update ON org_usage_counters
FOR UPDATE USING (public.workbench_user_is_org_super_admin(org_usage_counters.org_id))
WITH CHECK (public.workbench_user_is_org_super_admin(org_usage_counters.org_id));

DROP POLICY IF EXISTS org_invoices_select ON org_invoices;
DROP POLICY IF EXISTS org_invoices_insert ON org_invoices;
DROP POLICY IF EXISTS org_invoices_update ON org_invoices;

CREATE POLICY org_invoices_select ON org_invoices
FOR SELECT USING (public.workbench_user_is_org_super_admin(org_invoices.org_id));

CREATE POLICY org_invoices_insert ON org_invoices
FOR INSERT WITH CHECK (public.workbench_user_is_org_super_admin(org_invoices.org_id));

CREATE POLICY org_invoices_update ON org_invoices
FOR UPDATE USING (public.workbench_user_is_org_super_admin(org_invoices.org_id))
WITH CHECK (public.workbench_user_is_org_super_admin(org_invoices.org_id));

INSERT INTO org_subscriptions (
  org_id,
  plan_id,
  status,
  billing_interval,
  seat_count,
  trial_ends_at,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  metadata
)
SELECT
  o.id,
  'starter',
  'trialing',
  'monthly',
  3,
  now() + interval '14 days',
  now(),
  now() + interval '30 days',
  false,
  jsonb_build_object('seeded', true)
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1
  FROM org_subscriptions s
  WHERE s.org_id = o.id
);
