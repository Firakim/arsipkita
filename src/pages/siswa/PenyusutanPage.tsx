import { useMemo } from 'react';
import { Hourglass, AlertTriangle, Archive, Flame, FileText, Clock } from 'lucide-react';
import { useApp } from '../../AppContext';
import { formatTanggal, getDaysUntilRetensi } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function PenyusutanPage() {
  const { arsip, currentUser, setAksiPenyusutan } = useApp();
  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const perluTinjau = mine.filter(
    (a) =>
      a.status === 'aktif' || a.status === 'menjelang'
  );
  const sudahAksi = mine.filter(
    (a) => a.status === 'inaktif' || a.status === 'antre_pemusnahan'
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
              Tinjau arsip yang menjelang atau memasuki masa retensi. Putuskan nasib arsip:
              pindahkan ke arsip inaktif atau antrekan untuk pemusnahan.
            </p>
          </div>
        </div>
      </div>

      {/* Perlu ditinjau */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-ink-900">Menunggu Keputusan</h3>
          </div>
          <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200">{perluTinjau.length}</span>
        </div>

        {perluTinjau.length === 0 ? (
          <div className="text-center py-10 text-ink-400 text-sm">
            Tidak ada arsip yang menjelang retensi saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {perluTinjau.map((a) => {
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
                    <div className="flex gap-2 lg:flex-col lg:w-56">
                      <button
                        onClick={() => setAksiPenyusutan(a.id, 'pindah_inaktif')}
                        className="btn-secondary flex-1 text-xs"
                      >
                        <Archive className="w-3.5 h-3.5" /> Pindah Inaktif
                      </button>
                      <button
                        onClick={() => setAksiPenyusutan(a.id, 'antre_pemusnahan')}
                        className="btn-danger flex-1 text-xs"
                      >
                        <Flame className="w-3.5 h-3.5" /> Antre Pemusnahan
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sudah ada aksi */}
      {sudahAksi.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Archive className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-ink-900">Sudah Diputuskan</h3>
          </div>
          <div className="space-y-2">
            {sudahAksi.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">{a.nomorDokumen}</p>
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
