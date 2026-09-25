import { useMemo } from 'react';
import {
  Activity,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { getStageProgress, getDaysUntilRetensi, formatTanggalShort } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function MonitoringPage() {
  const { arsip, siswaList, lastSync } = useApp();

  const stats = useMemo(() => {
    const totalArsip = arsip.length;
    const aktif = arsip.filter((a) => a.status === 'aktif').length;
    const menjelang = arsip.filter((a) => a.status === 'menjelang').length;
    const inaktif = arsip.filter((a) => a.status === 'inaktif').length;
    const antre = arsip.filter((a) => a.status === 'antre_pemusnahan').length;
    const musnah = arsip.filter((a) => a.status === 'dimusnahkan').length;
    return { totalArsip, aktif, menjelang, inaktif, antre, musnah };
  }, [arsip]);

  const perSiswa = useMemo(() => {
    return siswaList.map((s) => {
      const items = arsip.filter((a) => a.siswaId === s.id);
      const progress = getStageProgress(items);
      const lastActivity = items
        .map((a) => a.updatedAt)
        .sort()
        .reverse()[0];
      return { siswa: s, count: items.length, progress, lastActivity };
    });
  }, [siswaList, arsip]);

  const statCards = [
    { label: 'Total Siswa', value: siswaList.length, icon: Users, bg: 'bg-brand-50', fg: 'text-brand-600' },
    { label: 'Total Arsip', value: stats.totalArsip, icon: FileText, bg: 'bg-ink-50', fg: 'text-ink-600' },
    { label: 'Menjelang Retensi', value: stats.menjelang, icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-600' },
    { label: 'Selesai Dimusnahkan', value: stats.musnah, icon: CheckCircle2, bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Real-time indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          Real-time · diperbarui otomatis
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-400">
          <RefreshCw className="w-3 h-3" />
          Sinkron: {new Date(lastSync).toLocaleTimeString('id-ID')}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-400 font-semibold uppercase tracking-wide">{c.label}</p>
                  <p className="text-2xl font-extrabold text-ink-900 mt-1">{c.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.fg} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-siswa progress */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-ink-900">Progres Per Siswa</h3>
        </div>

        {perSiswa.length === 0 ? (
          <div className="text-center py-10 text-ink-400 text-sm">
            Belum ada siswa yang masuk. Siswa akan muncul setelah login.
          </div>
        ) : (
          <div className="space-y-4">
            {perSiswa.map(({ siswa, count, progress, lastActivity }) => (
              <div key={siswa.id} className="rounded-xl border border-ink-100 p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                      {siswa.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-ink-900">{siswa.name}</p>
                      <p className="text-xs text-ink-400">
                        {siswa.kelas} · {count} arsip
                        {lastActivity && ` · aktif ${formatTanggalShort(lastActivity)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-bold text-ink-900">{progress.overall}%</span>
                  </div>
                </div>

                {/* Stage bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { k: 'digitalisasi', l: 'Digitalisasi' },
                    { k: 'penyimpanan', l: 'Penyimpanan' },
                    { k: 'penyusutan', l: 'Penyusutan' },
                    { k: 'pemusnahan', l: 'Pemusnahan' },
                  ].map((s) => {
                    const val = progress[s.k as keyof typeof progress] as number;
                    return (
                      <div key={s.k}>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-ink-500">{s.l}</span>
                          <span className="font-semibold text-ink-700">{val}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status distribution */}
      <div className="card p-5">
        <h3 className="font-bold text-ink-900 mb-4">Distribusi Status Arsip</h3>
        {stats.totalArsip === 0 ? (
          <div className="text-center py-8 text-ink-400 text-sm">Belum ada arsip.</div>
        ) : (
          <div className="space-y-2.5">
            {[
              { label: 'Aktif', count: stats.aktif, color: 'bg-emerald-500' },
              { label: 'Menjelang', count: stats.menjelang, color: 'bg-amber-500' },
              { label: 'Inaktif', count: stats.inaktif, color: 'bg-blue-500' },
              { label: 'Antre Pemusnahan', count: stats.antre, color: 'bg-orange-500' },
              { label: 'Dimusnahkan', count: stats.musnah, color: 'bg-ink-400' },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-xs text-ink-500 w-32 sm:w-40">{r.label}</span>
                <div className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full transition-all duration-500`}
                    style={{ width: `${stats.totalArsip ? (r.count / stats.totalArsip) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-ink-700 w-8 text-right">{r.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
