-- Create table for DealerCenter import logs
CREATE TABLE dealercenter_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dealers_processed INTEGER NOT NULL DEFAULT 0,
  dealers_created INTEGER NOT NULL DEFAULT 0,
  listings_inserted INTEGER NOT NULL DEFAULT 0,
  listings_updated INTEGER NOT NULL DEFAULT 0,
  total_rows INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_dealercenter_import_logs_date ON dealercenter_import_logs(import_date DESC);
CREATE INDEX idx_dealercenter_import_logs_status ON dealercenter_import_logs(status);

-- Add comment
COMMENT ON TABLE dealercenter_import_logs IS 'Logs for DealerCenter CSV feed imports - tracks success/errors for monitoring';
