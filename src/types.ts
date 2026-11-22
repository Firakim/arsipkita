export type Role = 'siswa' | 'guru';

export type ViewMode = 'siswa' | 'guru';

export type StageKey =
  | 'digitalisasi'
  | 'penyimpanan'
  | 'penyusutan'
  | 'pemusnahan'
  | 'penilaian';

export type DocType =
  | 'Surat Masuk'
  | 'Surat Keluar'
  | 'Memo Internal'
  | 'SK'
  | 'Undangan'
  | 'Laporan'
  | 'Sertifikat'
  | 'Lainnya';

export type RetensiStatus =
  | 'aktif'
  | 'menjelang'
  | 'inaktif'
  | 'antre_pemusnahan'
  | 'dimusnahkan'
  | 'dipindahkan';

export type RetensiAction =
  | 'pindah_inaktif'
  | 'antre_pemusnahan'
  | 'penghapusan'
  | 'pemindahan'
  | null;

export type NilaiGunaKategori =
  | 'Administrasi'
  | 'Hukum, informasi, ilmiah, dan teknologi'
  | 'Pertanggungjawaban keuangan';

export interface NilaiGunaOption {
  kategori: NilaiGunaKategori;
  tahun: number;
  deskripsi: string;
}

export const NILAI_GUNA_OPTIONS: NilaiGunaOption[] = [
  {
    kategori: 'Administrasi',
    tahun: 2,
    deskripsi: 'Administrasi (2 Tahun)',
  },
  {
    kategori: 'Hukum, informasi, ilmiah, dan teknologi',
    tahun: 5,
    deskripsi: 'Hukum, Informasi, Ilmiah, & Teknologi (5 Tahun)',
  },
  {
    kategori: 'Pertanggungjawaban keuangan',
    tahun: 10,
    deskripsi: 'Pertanggungjawaban Keuangan (10 Tahun)',
  },
];

/**
 * Mendapatkan string tanggal hari ini dalam format YYYY-MM-DD (waktu lokal)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Menghitung tanggal akhir retensi dan jumlah hari kalender dari tanggal surat.
 * Menggunakan normalisasi UTC untuk mencegah selisih akibat perbedaan zona waktu atau DST.
 */
export function calculateRetensi(
  tanggalSuratStr: string,
  tahunKalender: number
): { tanggalRetensi: string; masaRetensiHari: number } {
  const [year, month, day] = tanggalSuratStr.split('-').map(Number);
  const targetYear = year + tahunKalender;

  // Cek apakah tahun target adalah tahun kabisat
  const isLeapTarget =
    (targetYear % 4 === 0 && targetYear % 100 !== 0) || targetYear % 400 === 0;

  // Jika tanggal surat adalah 29 Februari dan tahun target bukan kabisat, sesuaikan ke 28 Februari
  const adjustedDay = month === 2 && day === 29 && !isLeapTarget ? 28 : day;

  // Normalisasi jam ke 12:00:00 UTC untuk menghindari pergeseran tanggal akibat zona waktu
  const baseUtc = Date.UTC(year, month - 1, day, 12, 0, 0, 0);
  const retUtc = Date.UTC(targetYear, month - 1, adjustedDay, 12, 0, 0, 0);

  const diffDays = Math.round((retUtc - baseUtc) / (1000 * 60 * 60 * 24));

  return {
    tanggalRetensi: new Date(retUtc).toISOString(),
    masaRetensiHari: diffDays,
  };
}

export interface ArsipFile {
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 preview
}

export interface Arsip {
  id: string;
  siswaId: string;
  siswaName: string;
  nomorDokumen: string;
  namaBerkas: string;
  jenisDokumen: DocType;
  tanggalSurat?: string | null; // YYYY-MM-DD dokumen asli
  pengirim: string;
  penerima: string;
  perihal: string;
  lampiran: string;
  isiRingkas: string;
  tembusan: string;
  file: ArsipFile | null;
  // klasifikasi
  subjek: string;
  bulan: string;
  tanggal: string; // ISO date string (tanggal digitalisasi otomatis)
  // retensi
  nilaiGuna?: NilaiGunaKategori | string | null;
  masaRetensiHari: number;
  tanggalRetensi: string; // ISO date string
  status: RetensiStatus;
  aksiPenyusutan: RetensiAction;
  tanggalAksi: string | null;
  catatanGuru: string;
  nilai: string;
  nilaiAngka: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Siswa {
  id: string;
  name: string;
  kelas: string;
}

export interface AuthUser {
  role: Role;
  name: string;
  siswaId?: string; // for siswa role
  viewMode: ViewMode; // guru can toggle
}

export interface ArsipInput {
  nomorDokumen: string;
  namaBerkas: string;
  jenisDokumen: DocType;
  tanggalSurat: string;
  pengirim: string;
  penerima: string;
  perihal: string;
  lampiran: string;
  isiRingkas: string;
  tembusan: string;
  file: ArsipFile | null;
  subjek: string;
  bulan: string;
  nilaiGuna: NilaiGunaKategori;
  masaRetensiHari: number;
}

export interface AppState {
  arsip: Arsip[];
  siswaList: Siswa[];
  currentUserId: string | null;
  currentUser: AuthUser | null;
}

export const STAGE_META: Record<
  StageKey,
  { label: string; desc: string; icon: string }
> = {
  digitalisasi: {
    label: 'Digitalisasi Arsip',
    desc: 'Unggah berkas & catat identitas arsip',
    icon: 'ScanLine',
  },
  penyimpanan: {
    label: 'Penyimpanan Arsip',
    desc: 'Klasifikasi hierarki folder',
    icon: 'FolderTree',
  },
  penyusutan: {
    label: 'Penyusutan Arsip',
    desc: 'Tinjau masa retensi arsip',
    icon: 'Hourglass',
  },
  pemusnahan: {
    label: 'Pemusnahan Arsip',
    desc: 'Proses pemusnahan arsip',
    icon: 'Trash2',
  },
  penilaian: {
    label: 'Hasil Penilaian',
    desc: 'Lihat nilai dan catatan evaluasi dari guru',
    icon: 'Award',
  },
};

export const DOC_TYPES: DocType[] = [
  'Surat Masuk',
  'Surat Keluar',
  'Memo Internal',
  'SK',
  'Undangan',
  'Laporan',
  'Sertifikat',
  'Lainnya',
];

export const SUBJEK_OPTIONS = [
  'Administrasi',
  'Keuangan',
  'Akademik',
  'Kesiswaan',
  'Sarana Prasarana',
  'Humas',
];

export const BULAN_OPTIONS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
