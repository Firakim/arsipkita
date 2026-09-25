import { useMemo, useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  CalendarDays,
  Tag,
  Layers,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { BULAN_OPTIONS, SUBJEK_OPTIONS } from '../../types';
import { formatTanggalShort, formatFileSize } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function PenyimpananPage() {
  const { arsip, currentUser, updateArsip } = useApp();
  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const [selSubjek, setSelSubjek] = useState<string | null>(null);
  const [selBulan, setSelBulan] = useState<string | null>(null);

  const subjekGroups = useMemo(() => {
    const map: Record<string, number> = {};
    mine.forEach((a) => {
      map[a.subjek] = (map[a.subjek] ?? 0) + 1;
    });
    return SUBJEK_OPTIONS.map((s) => ({ subjek: s, count: map[s] ?? 0 })).filter((s) => s.count > 0);
  }, [mine]);

  const bulanGroups = useMemo(() => {
    if (!selSubjek) return [];
    const filtered = mine.filter((a) => a.subjek === selSubjek);
    const map: Record<string, number> = {};
    filtered.forEach((a) => {
      map[a.bulan] = (map[a.bulan] ?? 0) + 1;
    });
    return BULAN_OPTIONS.map((b) => ({ bulan: b, count: map[b] ?? 0 })).filter((b) => b.count > 0);
  }, [mine, selSubjek]);

  const tanggalGroups = useMemo(() => {
    if (!selSubjek || !selBulan) return [];
    const filtered = mine.filter((a) => a.subjek === selSubjek && a.bulan === selBulan);
    const map: Record<string, typeof filtered> = {};
    filtered.forEach((a) => {
      const d = new Date(a.tanggal).getDate().toString();
      (map[d] ??= []).push(a);
    });
    return Object.entries(map)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([d, items]) => ({ tanggal: d, items }));
  }, [mine, selSubjek, selBulan]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb / hierarchy */}
      <div className="card p-5">
        <div className="flex items-center gap-2 text-sm text-ink-500 mb-4 flex-wrap">
          <Layers className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-ink-700">Sistem Klasifikasi</span>
          {selSubjek && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => { setSelSubjek(null); setSelBulan(null); }} className="hover:text-brand-700">{selSubjek}</button>
            </>
          )}
          {selBulan && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <button onClick={() => setSelBulan(null)} className="hover:text-brand-700">{selBulan}</button>
            </>
          )}
        </div>

        {/* Level 1: Subjek */}
        {!selSubjek && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjekGroups.length === 0 && (
              <div className="col-span-full text-center py-10 text-ink-400 text-sm">
                Belum ada arsip untuk diklasifikasikan. Catat arsip pada tahap Digitalisasi terlebih dahulu.
              </div>
            )}
            {subjekGroups.map((s) => (
              <button
                key={s.subjek}
                onClick={() => setSelSubjek(s.subjek)}
                className="group text-left rounded-2xl border border-ink-100 hover:border-brand-300 hover:shadow-card transition-all p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-ink-900">{s.subjek}</p>
                    <p className="text-xs text-ink-400">Folder Utama · {s.count} arsip</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-brand-500" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Level 2: Bulan */}
        {selSubjek && !selBulan && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bulanGroups.map((b) => (
              <button
                key={b.bulan}
                onClick={() => setSelBulan(b.bulan)}
                className="group text-left rounded-2xl border border-ink-100 hover:border-brand-300 hover:shadow-card transition-all p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-ink-900">{b.bulan}</p>
                    <p className="text-xs text-ink-400">Sub Folder · {b.count} arsip</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-brand-500" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Level 3: Tanggal + items */}
        {selSubjek && selBulan && (
          <div className="space-y-5">
            {tanggalGroups.length === 0 && (
              <div className="text-center py-10 text-ink-400 text-sm">
                Tidak ada arsip pada klasifikasi ini.
              </div>
            )}
            {tanggalGroups.map((g) => (
              <div key={g.tanggal}>
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-ink-700">Tanggal {g.tanggal}</p>
                  <span className="chip bg-ink-100 text-ink-500">{g.items.length}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 pl-6">
                  {g.items.map((a) => {
                    const isPdf = a.file?.type === 'application/pdf' || a.file?.name.toLowerCase().endsWith('.pdf');
                    return (
                      <div key={a.id} className="rounded-xl border border-ink-100 p-4 hover:shadow-soft transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                            {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-ink-900 truncate">{a.nomorDokumen}</p>
                            <p className="text-xs text-ink-400 truncate">{a.perihal || a.namaBerkas}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <StatusBadge status={a.status} />
                              {a.file && (
                                <span className="text-[11px] text-ink-400">{formatFileSize(a.file.size)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* re-classify */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <select
                            className="input !py-1.5 !text-xs"
                            value={a.subjek}
                            onChange={(e) => updateArsip(a.id, { subjek: e.target.value })}
                          >
                            {SUBJEK_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select
                            className="input !py-1.5 !text-xs"
                            value={a.bulan}
                            onChange={(e) => updateArsip(a.id, { bulan: e.target.value })}
                          >
                            {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
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

      {/* Info card */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-ink-900">Tentang Klasifikasi</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-brand-50 p-4">
            <p className="font-semibold text-brand-700">Folder Utama</p>
            <p className="text-ink-500 text-xs mt-1">Sistem Subjek — kategori arsip.</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="font-semibold text-emerald-700">Sub Folder</p>
            <p className="text-ink-500 text-xs mt-1">Sistem Bulan — pengelompokan waktu.</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="font-semibold text-amber-700">Sub-Sub Folder</p>
            <p className="text-ink-500 text-xs mt-1">Sistem Tanggal — urutan harian.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
