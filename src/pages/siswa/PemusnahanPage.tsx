import { useMemo, useState } from 'react';
import { Trash2, Flame, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../../AppContext';
import { formatTanggal, getDaysUntilRetensi } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function PemusnahanPage() {
  const { arsip, currentUser, prosesPemusnahan } = useApp();
  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const antre = mine.filter((a) => a.status === 'antre_pemusnahan');
  const selesai = mine.filter((a) => a.status === 'dimusnahkan');

  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900">Pemusnahan Arsip</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              Arsip yang telah memasuki masa retensi dan diantrikan untuk pemusnahan dapat diproses
              pada tahap ini.
            </p>
          </div>
        </div>
      </div>

      {/* Antrean */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-ink-900">Antrean Pemusnahan</h3>
          </div>
          <span className="chip bg-orange-50 text-orange-700 ring-1 ring-orange-200">{antre.length}</span>
        </div>

        {antre.length === 0 ? (
          <div className="text-center py-10 text-ink-400 text-sm">
            Tidak ada arsip dalam antrean pemusnahan.
          </div>
        ) : (
          <div className="space-y-3">
            {antre.map((a) => {
              const days = getDaysUntilRetensi(a.tanggalRetensi);
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

                    {confirmId === a.id ? (
                      <div className="flex gap-2 lg:w-64">
                        <button
                          onClick={() => { prosesPemusnahan(a.id); setConfirmId(null); }}
                          className="btn-danger flex-1 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Ya, Musnahkan
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="btn-secondary text-xs"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmId(a.id)}
                        className="btn-danger lg:w-56 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Proses Pemusnahan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selesai */}
      {selesai.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-ink-400" />
            <h3 className="font-bold text-ink-900">Arsip Dimusnahkan</h3>
          </div>
          <div className="space-y-2">
            {selesai.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-500 truncate line-through">{a.nomorDokumen}</p>
                  <p className="text-xs text-ink-400">{a.perihal || a.namaBerkas}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
