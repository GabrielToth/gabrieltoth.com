-- Create data retention policies and archival procedures
-- Implements 2-year retention policy for audit logs and linking activity

-- Create archive tables for historical data
CREATE TABLE linking_activity_archive (
  id UUID PRIMARY KEY,
  user_id UUID,
  youtube_channel_id VARCHAR(255),
  activity_type VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason VARCHAR(255),
  status VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs_archive (
  id UUID PRIMARY KEY,
  user_id UUID,
  youtube_channel_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  details JSONB,
  created_at TIMESTAMP NOT NULL,
  archived_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes on archive tables for querying
CREATE INDEX idx_linking_activity_archive_created_at ON linking_activity_archive(created_at DESC);
CREATE INDEX idx_linking_activity_archive_user_id ON linking_activity_archive(user_id);
CREATE INDEX idx_audit_logs_archive_created_at ON audit_logs_archive(created_at DESC);
CREATE INDEX idx_audit_logs_archive_user_id ON audit_logs_archive(user_id);

-- Create function to archive old linking activity records (older than 2 years)
CREATE OR REPLACE FUNCTION archive_old_linking_activity()
RETURNS void AS $$
BEGIN
  -- Insert records older than 2 years into archive
  INSERT INTO linking_activity_archive
  SELECT * FROM linking_activity
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Delete archived records from main table
  DELETE FROM linking_activity
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Create function to archive old audit logs (older than 2 years)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Insert records older than 2 years into archive
  INSERT INTO audit_logs_archive
  SELECT * FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Delete archived records from main table
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired recovery tokens
CREATE OR REPLACE FUNCTION cleanup_expired_recovery_tokens()
RETURNS void AS $$
BEGIN
  -- Delete expired recovery tokens
  DELETE FROM recovery_tokens
  WHERE status = 'pending' AND expires_at < NOW();
  
  -- Mark used tokens as expired if they're older than 24 hours
  UPDATE recovery_tokens
  SET status = 'expired'
  WHERE status = 'used' AND used_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired unlink revocation windows
CREATE OR REPLACE FUNCTION cleanup_expired_unlink_revocation_windows()
RETURNS void AS $$
BEGIN
  -- Mark revocation windows as expired if they've passed the expiration time
  UPDATE unlink_revocation_window
  SET status = 'expired'
  WHERE status = 'active' AND revocation_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update last_activity_at on youtube_channels
CREATE OR REPLACE FUNCTION update_youtube_channel_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE youtube_channels
  SET last_activity_at = NOW()
  WHERE youtube_channel_id = NEW.youtube_channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_activity_at when linking_activity is created
CREATE TRIGGER trigger_update_youtube_channel_last_activity
AFTER INSERT ON linking_activity
FOR EACH ROW
EXECUTE FUNCTION update_youtube_channel_last_activity();

-- Create function to update updated_at on youtube_channels
CREATE OR REPLACE FUNCTION update_youtube_channel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at when youtube_channels is modified
CREATE TRIGGER trigger_update_youtube_channel_updated_at
BEFORE UPDATE ON youtube_channels
FOR EACH ROW
EXECUTE FUNCTION update_youtube_channel_updated_at();

-- Note: In production, these archival functions should be scheduled via pg_cron or external scheduler
-- Example cron job (requires pg_cron extension):
-- SELECT cron.schedule('archive_old_linking_activity', '0 2 * * *', 'SELECT archive_old_linking_activity()');
-- SELECT cron.schedule('archive_old_audit_logs', '0 3 * * *', 'SELECT archive_old_audit_logs()');
-- SELECT cron.schedule('cleanup_expired_recovery_tokens', '*/15 * * * *', 'SELECT cleanup_expired_recovery_tokens()');
-- SELECT cron.schedule('cleanup_expired_unlink_revocation_windows', '*/15 * * * *', 'SELECT cleanup_expired_unlink_revocation_windows()');
