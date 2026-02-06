-- Magic Links Table for User Invitations
-- Stores secure, time-limited invitation tokens that allow users to join organizations

CREATE TABLE IF NOT EXISTS magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  system_role TEXT NOT NULL CHECK (system_role IN ('super_admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Index for fast token lookups (only unredeemed)
CREATE INDEX idx_magic_links_token ON magic_links(token) WHERE redeemed_at IS NULL;

-- Index for email lookups
CREATE INDEX idx_magic_links_email ON magic_links(email);

-- Index for org filtering
CREATE INDEX idx_magic_links_org ON magic_links(org_id);

-- RLS Policies
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Super admins can view all magic links for their organization
CREATE POLICY "org_super_admins_can_view_magic_links" ON magic_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = magic_links.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.system_role = 'super_admin'
    )
  );

-- Super admins can create magic links for their organization
CREATE POLICY "org_super_admins_can_create_magic_links" ON magic_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = magic_links.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.system_role = 'super_admin'
    )
  );

-- No updates or deletes - magic links are immutable once created
-- They can only be marked as redeemed via the redeemed_at timestamp
