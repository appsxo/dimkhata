-- DimKhata (ডিমখাতা) — Production Supabase Schema (Single Source of Truth)
-- Run this once in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.dimkhata_kv_store (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.dimkhata_kv_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow publishable key sync on dimkhata_kv_store" ON public.dimkhata_kv_store;
CREATE POLICY "Allow publishable key sync on dimkhata_kv_store"
    ON public.dimkhata_kv_store
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Enable Realtime Replication for Instant Multi-Device Sync
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'dimkhata_kv_store'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.dimkhata_kv_store;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
