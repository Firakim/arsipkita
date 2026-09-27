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
  | 'dimusnahkan';

export type RetensiAction = 'pindah_inaktif' | 'antre_pemusnahan' | null;

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
  tanggal: string; // ISO date string (createdAt)
  // retensi
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
  pengirim: string;
  penerima: string;
  perihal: string;
  lampiran: string;
  isiRingkas: string;
  tembusan: string;
  file: ArsipFile | null;
  subjek: string;
  bulan: string;
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
