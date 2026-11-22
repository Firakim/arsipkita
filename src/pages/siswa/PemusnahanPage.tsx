import { useMemo, useState } from 'react';
import { Trash2, Flame, FileText, Clock, CheckCircle2, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../AppContext';
import { formatTanggal, getDaysUntilRetensi } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function PemusnahanPage() {
  const { arsip, currentUser, prosesPemusnahan, prosesPemindahan } = useApp();
  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const antre = useMemo(
    () => mine.filter((a) => a.status === 'antre_pemusnahan'),
    [mine]
  );
  const riwayat = useMemo(
    () => mine.filter((a) => a.status === 'dimusnahkan' || a.status === 'dipindahkan'),
    [mine]
  );

  const [confirmAction, setConfirmAction] = useState<{ id: string; type: 'hapus' | 'pindah' } | null>(null);

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900">Pemusnahan Arsip</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              Tentukan tindakan akhir bagi arsip yang telah diantrekan: lakukan Penghapusan untuk memusnahkan dokumen
              atau Pemindahan untuk mengalihkan arsip statis/permanen.
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 1: Arsip Menunggu Tindakan */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <div>
              <h3 className="font-bold text-ink-900">Arsip Menunggu Tindakan</h3>
              <p className="text-xs text-ink-400">Pilih salah satu tindakan akhir: Penghapusan atau Pemindahan.</p>
            </div>
          </div>
          <span className="chip bg-orange-50 text-orange-700 ring-1 ring-orange-200">{antre.length}</span>
        </div>

        {antre.length === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">
            Tidak ada arsip dalam antrean tindakan saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {antre.map((a) => {
              const days = getDaysUntilRetensi(a.tanggalRetensi);
              const isConfirming = confirmAction?.id === a.id;
              return (
                <div key={a.id} className="rounded-xl border border-orange-100 bg-orange-50/30 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white text-orange-600 flex items-center justify-center shrink-0 ring-1 ring-orange-100">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-ink-900 truncate">
                          {a.nomorDokumen} — {a.perihal || a.namaBerkas}
                        </p>
                        <p className="text-xs text-ink-400">{a.jenisDokumen} · {a.subjek}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <StatusBadge status={a.status} />
                          <span className="text-xs text-ink-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Retensi: {formatTanggal(a.tanggalRetensi)}
                          </span>
                          <span
                            className={`chip text-[11px] ${
                              days <= 0
                                ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                                : 'bg-ink-100 text-ink-500'
                            }`}
                          >
                            {days <= 0 ? 'Lewat retensi' : `${days} hari lagi`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isConfirming ? (
                      <div className="flex flex-col sm:flex-row gap-2 lg:w-72">
                        {confirmAction.type === 'hapus' ? (
                          <button
                            onClick={() => { prosesPemusnahan(a.id); setConfirmAction(null); }}
                            className="btn-danger flex-1 text-xs flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Ya, Hapus
                          </button>
                        ) : (
                          <button
                            onClick={() => { prosesPemindahan(a.id); setConfirmAction(null); }}
                            className="btn-primary !bg-purple-600 hover:!bg-purple-700 text-white flex-1 text-xs flex items-center justify-center gap-1"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" /> Ya, Pindahkan
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmAction(null)}
                          className="btn-secondary text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 lg:w-72">
                        <button
                          onClick={() => setConfirmAction({ id: a.id, type: 'hapus' })}
                          className="btn-danger flex-1 text-xs flex items-center justify-center gap-1"
                          title="Hapus dan musnahkan arsip ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Penghapusan
                        </button>
                        <button
                          onClick={() => setConfirmAction({ id: a.id, type: 'pindah' })}
                          className="btn-secondary flex-1 text-xs flex items-center justify-center gap-1 text-purple-700 hover:bg-purple-50 border-purple-200"
                          title="Pindahkan arsip statis/permanen ini"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" /> Pemindahan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bagian 2: Riwayat Penyelesaian */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-ink-900">Riwayat Penyelesaian</h3>
              <p className="text-xs text-ink-400">Arsip yang telah diselesaikan melalui Penghapusan maupun Pemindahan.</p>
            </div>
          </div>
          <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{riwayat.length}</span>
        </div>

        {riwayat.length === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">
            Belum ada arsip yang diselesaikan.
          </div>
        ) : (
          <div className="space-y-2">
            {riwayat.map((a) => {
              const isMusnah = a.status === 'dimusnahkan';
              return (
                <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white text-ink-500 flex items-center justify-center shrink-0 ring-1 ring-ink-100 mt-0.5">
                      {isMusnah ? (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      ) : (
                        <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${isMusnah ? 'text-ink-600 line-through' : 'text-ink-900'}`}>
                        {a.nomorDokumen || a.namaBerkas}
                      </p>
                      <p className="text-xs text-ink-400 truncate">{a.perihal || a.namaBerkas}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-ink-500 flex-wrap">
                        <span className="font-medium text-ink-700">
                          {isMusnah ? 'Aksi: Penghapusan' : 'Aksi: Pemindahan'}
                        </span>
                        {a.tanggalAksi && (
                          <span>· Tanggal Selesai: {formatTanggal(a.tanggalAksi)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 self-start sm:self-center">
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
