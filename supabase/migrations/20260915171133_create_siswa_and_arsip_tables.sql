/*
# Create siswa and arsip tables for ArsipKita

## Overview
Creates the core database schema for the ArsipKita digital archive simulation app.
This migration prepares the Supabase database for future use as a centralized data store,
replacing localStorage. No application code is changed in this step.

## New Tables

### 1. siswa
Stores student profiles. Each student can log in with name + class + access code.
- `id` (uuid, primary key, auto-generated)
- `name` (text, not null) — student's display name
- `kelas` (text, not null, default '-') — student's class
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. arsip
Stores archive records created by students. Each arsip belongs to one siswa.
- `id` (uuid, primary key, auto-generated)
- `siswa_id` (uuid, not null, foreign key → siswa.id ON DELETE CASCADE)
- `siswa_name` (text) — denormalized student name for display convenience
- `nomor_dokumen` (text, not null) — document number
- `nama_berkas` (text) — file name
- `jenis_dokumen` (text, not null) — document type (Surat Masuk, Surat Keluar, etc.)
- `pengirim` (text) — sender
- `penerima` (text) — recipient
- `perihal` (text) — subject line
- `lampiran` (text) — attachments description
- `isi_ringkas` (text) — brief content summary
- `tembusan` (text) — cc
- `file_name` (text) — uploaded file name
- `file_size` (bigint) — file size in bytes
- `file_type` (text) — MIME type
- `file_data_url` (text) — base64 data URL for file preview
- `subjek` (text, not null) — classification: main folder (subject)
- `bulan` (text, not null) — classification: sub folder (month)
- `tanggal` (timestamptz) — archive creation date
- `masa_retensi_hari` (integer, not null, default 30) — retention period in days
- `tanggal_retensi` (timestamptz) — retention deadline date
- `status` (text, not null, default 'aktif') — retention status
- `aksi_penyusutan` (text) — retention action taken
- `tanggal_aksi` (timestamptz) — date of retention action
- `catatan_guru` (text, not null, default '') — teacher feedback/notes
- `nilai` (text, not null, default '') — grade (text form)
- `nilai_angka` (numeric) — numeric grade (0-100, nullable)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Relationships
- arsip.siswa_id → siswa.id (foreign key, ON DELETE CASCADE)
  One siswa can have many arsip records.

## Indexes
- `idx_arsip_siswa_id` on arsip(siswa_id) — speeds up per-student queries
- `idx_arsip_status` on arsip(status) — speeds up status filtering

## Security (RLS)
Both tables have Row Level Security enabled.
The app currently uses a custom access-code login (not Supabase Auth), so the
frontend operates with the anon key. Policies allow anon + authenticated full CRUD
on both tables, since this is a shared educational simulation app.

## Notes
1. No existing data is lost — these are new tables.
2. localStorage and AppContext.tsx are NOT modified in this step.
3. The app will be migrated to use these tables in a future step.
*/

-- ============================================================
-- Table: siswa
-- ============================================================
CREATE TABLE IF NOT EXISTS siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kelas text NOT NULL DEFAULT '-',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;

-- Policies for siswa (anon + authenticated, shared educational app)
DROP POLICY IF EXISTS "select_siswa" ON siswa;
CREATE POLICY "select_siswa" ON siswa FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_siswa" ON siswa;
CREATE POLICY "insert_siswa" ON siswa FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_siswa" ON siswa;
CREATE POLICY "update_siswa" ON siswa FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_siswa" ON siswa;
CREATE POLICY "delete_siswa" ON siswa FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Table: arsip
-- ============================================================
CREATE TABLE IF NOT EXISTS arsip (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  siswa_name text,
  nomor_dokumen text NOT NULL,
  nama_berkas text,
  jenis_dokumen text NOT NULL,
  pengirim text,
  penerima text,
  perihal text,
  lampiran text,
  isi_ringkas text,
  tembusan text,
  file_name text,
  file_size bigint,
  file_type text,
  file_data_url text,
  subjek text NOT NULL,
  bulan text NOT NULL,
  tanggal timestamptz,
  masa_retensi_hari integer NOT NULL DEFAULT 30,
  tanggal_retensi timestamptz,
  status text NOT NULL DEFAULT 'aktif',
  aksi_penyusutan text,
  tanggal_aksi timestamptz,
  catatan_guru text NOT NULL DEFAULT '',
  nilai text NOT NULL DEFAULT '',
  nilai_angka numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE arsip ENABLE ROW LEVEL SECURITY;

-- Policies for arsip (anon + authenticated, shared educational app)
DROP POLICY IF EXISTS "select_arsip" ON arsip;
CREATE POLICY "select_arsip" ON arsip FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_arsip" ON arsip;
CREATE POLICY "insert_arsip" ON arsip FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_arsip" ON arsip;
CREATE POLICY "update_arsip" ON arsip FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_arsip" ON arsip;
CREATE POLICY "delete_arsip" ON arsip FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_arsip_siswa_id ON arsip(siswa_id);
CREATE INDEX IF NOT EXISTS idx_arsip_status ON arsip(status);

-- ============================================================
-- updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_siswa_updated_at ON siswa;
CREATE TRIGGER trg_siswa_updated_at
  BEFORE UPDATE ON siswa
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_arsip_updated_at ON arsip;
CREATE TRIGGER trg_arsip_updated_at
  BEFORE UPDATE ON arsip
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
