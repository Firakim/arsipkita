import { useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { formatTanggalShort, getNilaiHuruf } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function HasilPenilaianPage() {
  const { arsip, currentUser } = useApp();

  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const stats = useMemo(() => {
    const total = mine.length;
    const dinilai = mine.filter((a) => a.nilaiAngka !== null && a.nilaiAngka !== undefined);
    const belum = total - dinilai.length;
    const rataRata =
      dinilai.length > 0
        ? Math.round((dinilai.reduce((acc, a) => acc + (a.nilaiAngka ?? 0), 0) / dinilai.length) * 10) / 10
        : null;

    return { total, dinilaiCount: dinilai.length, belumCount: belum, rataRata };
  }, [mine]);

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-ink-900">Hasil Penilaian & Evaluasi Guru</h3>
            <p className="text-sm text-ink-500 mt-0.5">
              Pantau nilai dan masukan guru untuk setiap arsip digital yang telah Anda catat dan klasifikasikan.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-ink-400">Total Arsip</p>
          <p className="text-2xl font-extrabold text-ink-900 mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400">Sudah Dinilai</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600">{stats.dinilaiCount}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400">Menunggu Penilaian</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-amber-600">{stats.belumCount}</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
        </div>
        <div className="card p-4">
          <p className="text-xs text-ink-400">Nilai Rata-rata</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-brand-700">
              {stats.rataRata !== null ? stats.rataRata : '-'}
            </span>
            {stats.rataRata !== null && (
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-brand-50 text-brand-700">
                {getNilaiHuruf(stats.rataRata)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* List of Archives with Grades */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-ink-900">Daftar Arsip & Nilai</h3>
          </div>
          <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            {mine.length} berkas
          </span>
        </div>

        {mine.length === 0 ? (
          <div className="text-center py-12 text-ink-400 text-sm">
            Belum ada arsip yang diunggah. Mulai dengan mencatat arsip pada tahap Digitalisasi.
          </div>
        ) : (
          <div className="space-y-4">
            {mine.map((a) => {
              const isGraded = a.nilaiAngka !== null && a.nilaiAngka !== undefined;
              const nilaiHuruf = a.nilai || (isGraded ? getNilaiHuruf(a.nilaiAngka) : '');

              return (
                <div
                  key={a.id}
                  className={`rounded-2xl border p-5 transition-all ${
                    isGraded
                      ? 'border-brand-200 bg-white shadow-soft'
                      : 'border-ink-100 bg-ink-50/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Info Dokumen */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isGraded
                            ? 'bg-brand-50 text-brand-600'
                            : 'bg-ink-100 text-ink-400'
                        }`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-ink-900 text-base">{a.nomorDokumen}</p>
                          <StatusBadge status={a.status} />
                        </div>
                        <p className="text-sm font-semibold text-ink-700 mt-0.5">
                          {a.perihal || a.namaBerkas || '-'}
                        </p>
                        <p className="text-xs text-ink-400 mt-1">
                          {a.jenisDokumen} · {a.subjek} · {a.bulan} · {formatTanggalShort(a.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Nilai Badge */}
                    <div className="lg:w-48 shrink-0 flex lg:flex-col lg:items-end justify-between items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-ink-100">
                      <div className="text-left lg:text-right">
                        <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wide">
                          Nilai Evaluasi
                        </p>
                        {isGraded ? (
                          <div className="flex items-baseline gap-1.5 mt-0.5 lg:justify-end">
                            <span className="text-2xl font-black text-brand-700">
                              {a.nilaiAngka}
                            </span>
                            <span className="text-xs text-ink-400 font-semibold">/100</span>
                            {nilaiHuruf && (
                              <span className="chip bg-emerald-50 text-emerald-700 font-extrabold text-xs ring-1 ring-emerald-200 ml-1">
                                {nilaiHuruf}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="chip bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-xs mt-1 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Belum dinilai
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Catatan / Feedback Guru */}
                  <div className="mt-4 pt-3.5 border-t border-ink-100">
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-ink-100 text-ink-500 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-ink-500">
                          Catatan dari Guru:
                        </p>
                        {a.catatanGuru && a.catatanGuru.trim() ? (
                          <p className="text-sm text-ink-800 bg-brand-50/50 rounded-xl p-3 mt-1.5 ring-1 ring-brand-100/60 leading-relaxed">
                            <Sparkles className="w-3.5 h-3.5 text-brand-600 inline mr-1.5 -mt-0.5" />
                            {a.catatanGuru}
                          </p>
                        ) : (
                          <p className="text-xs text-ink-400 italic mt-1">
                            Belum ada catatan dari guru.
                          </p>
                        )}
                      </div>
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
