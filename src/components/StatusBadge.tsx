import type { RetensiStatus } from '../types';

export const STATUS_LABEL: Record<RetensiStatus, string> = {
  aktif: 'Aktif',
  menjelang: 'Menjelang Retensi',
  inaktif: 'Arsip Inaktif',
  antre_pemusnahan: 'Antre Pemusnahan',
  dimusnahkan: 'Dimusnahkan',
};

export const STATUS_STYLE: Record<RetensiStatus, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  menjelang: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  inaktif: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  antre_pemusnahan: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  dimusnahkan: 'bg-ink-100 text-ink-500 ring-1 ring-ink-200 line-through',
};

export function StatusBadge({ status }: { status: RetensiStatus }) {
  return (
    <span className={`chip ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
