import type { Arsip, RetensiStatus } from '../types';

export const STORAGE_KEY = 'arsipkita_state_v1';

export function getDaysUntilRetensi(tanggalRetensi: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const ret = new Date(tanggalRetensi);
  ret.setHours(0, 0, 0, 0);
  return Math.round((ret.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeRetensiStatus(
  status: RetensiStatus,
  tanggalRetensi: string
): RetensiStatus {
  if (status === 'inaktif' || status === 'antre_pemusnahan' || status === 'dimusnahkan') {
    return status;
  }
  const days = getDaysUntilRetensi(tanggalRetensi);
  if (days <= 0) return 'menjelang';
  return 'aktif';
}

export function isMenjelang(tanggalRetensi: string): boolean {
  return getDaysUntilRetensi(tanggalRetensi) <= 7;
}

export function formatTanggal(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatTanggalShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function getStageProgress(arsipList: Arsip[]) {
  const total = arsipList.length;
  if (total === 0) return { digitalisasi: 0, penyimpanan: 0, penyusutan: 0, pemusnahan: 0, overall: 0 };

  const digitalisasi = arsipList.filter((a) => a.namaBerkas && a.nomorDokumen).length;
  const penyimpanan = arsipList.filter((a) => a.subjek && a.bulan).length;
  const penyusutan = arsipList.filter(
    (a) => a.aksiPenyusutan !== null || a.status === 'inaktif' || a.status === 'antre_pemusnahan'
  ).length;
  const pemusnahan = arsipList.filter((a) => a.status === 'dimusnahkan').length;

  return {
    digitalisasi: Math.round((digitalisasi / total) * 100),
    penyimpanan: Math.round((penyimpanan / total) * 100),
    penyusutan: Math.round((penyusutan / total) * 100),
    pemusnahan: Math.round((pemusnahan / total) * 100),
    overall: Math.round(
      ((digitalisasi + penyimpanan + penyusutan + pemusnahan) / (total * 4)) * 100
    ),
  };
}

export function getNilaiHuruf(angka: number | null): string {
  if (angka === null || Number.isNaN(angka)) return '-';
  if (angka >= 90) return 'A';
  if (angka >= 80) return 'B';
  if (angka >= 70) return 'C';
  if (angka >= 60) return 'D';
  return 'E';
}
