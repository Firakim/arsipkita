import { useMemo } from 'react';
import { Hourglass, Archive, Flame, FileText, Clock, Layers } from 'lucide-react';
import { useApp } from '../../AppContext';
import { formatTanggal, getDaysUntilRetensi } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function PenyusutanPage() {
  const { arsip, currentUser, setAksiPenyusutan } = useApp();
  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const arsipAktif = useMemo(
    () => mine.filter((a) => a.status === 'aktif' || a.status === 'menjelang'),
    [mine]
  );
  const arsipInaktif = useMemo(
    () => mine.filter((a) => a.status === 'inaktif'),
    [mine]
  );

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900">Penyusutan Arsip</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              Kelola siklus hidup arsip. Pindahkan arsip aktif yang telah selesai operasionalnya ke bagian Arsip Inaktif,
              lalu masukkan arsip inaktif ke antrean pemusnahan jika telah memenuhi syarat.
            </p>
          </div>
        </div>
      </div>

      {/* Bagian 1: Arsip Aktif */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-ink-900">Arsip Aktif</h3>
              <p className="text-xs text-ink-400">Arsip operasional yang dapat dipindahkan ke status inaktif.</p>
            </div>
          </div>
          <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{arsipAktif.length}</span>
        </div>

        {arsipAktif.length === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">
            Tidak ada arsip aktif saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {arsipAktif.map((a) => {
              const days = getDaysUntilRetensi(a.tanggalRetensi);
              const isMenjelang = days <= 7;
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-4 ${
                    isMenjelang ? 'border-amber-200 bg-amber-50/40' : 'border-ink-100'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white text-brand-600 flex items-center justify-center shrink-0 ring-1 ring-ink-100">
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
                                : isMenjelang
                                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                : 'bg-ink-100 text-ink-500'
                            }`}
                          >
                            {days <= 0 ? 'Lewat retensi' : `${days} hari lagi`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex lg:w-48">
                      <button
                        onClick={() => setAksiPenyusutan(a.id, 'pindah_inaktif')}
                        className="btn-secondary w-full text-xs flex items-center justify-center gap-1.5"
                      >
                        <Archive className="w-3.5 h-3.5" /> Pindahkan Inaktif
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bagian 2: Arsip Inaktif */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="font-bold text-ink-900">Arsip Inaktif</h3>
              <p className="text-xs text-ink-400">Arsip yang tersimpan di pusat arsip inaktif dan siap diantrekan untuk pemusnahan.</p>
            </div>
          </div>
          <span className="chip bg-blue-50 text-blue-700 ring-1 ring-blue-200">{arsipInaktif.length}</span>
        </div>

        {arsipInaktif.length === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">
            Belum ada arsip inaktif. Pindahkan arsip dari bagian Arsip Aktif di atas.
          </div>
        ) : (
          <div className="space-y-3">
            {arsipInaktif.map((a) => {
              const days = getDaysUntilRetensi(a.tanggalRetensi);
              return (
                <div key={a.id} className="rounded-xl border border-blue-100 bg-blue-50/20 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white text-blue-600 flex items-center justify-center shrink-0 ring-1 ring-blue-100">
                        <Archive className="w-4 h-4" />
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
                    <div className="flex lg:w-48">
                      <button
                        onClick={() => setAksiPenyusutan(a.id, 'antre_pemusnahan')}
                        className="btn-danger w-full text-xs flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5" /> Antrekan Pemusnahan
                      </button>
                    </div>
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
