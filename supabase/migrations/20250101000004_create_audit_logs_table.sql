-- Create audit_logs table
-- Comprehensive audit trail for compliance and investigation
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  youtube_channel_id VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- 'channel_linked', 'channel_unlinked', 'recovery_initiated', 'recovery_completed', 'suspicious_activity_detected'
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_youtube_channel FOREIGN KEY (youtube_channel_id) 
    REFERENCES youtube_channels(youtube_channel_id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_youtube_channel_id ON audit_logs(youtube_channel_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create composite index for common filter combinations
CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_channel_created ON audit_logs(youtube_channel_id, created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
  ));

-- Create RLS policy: only system can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create RLS policy: audit logs cannot be updated
CREATE POLICY "Audit logs are immutable"
  ON audit_logs
  FOR UPDATE
  USING (false);

-- Create RLS policy: audit logs cannot be deleted
CREATE POLICY "Audit logs cannot be deleted"
  ON audit_logs
  FOR DELETE
  USING (false);
