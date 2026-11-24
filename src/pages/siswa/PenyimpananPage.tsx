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
  Eye,
  Download,
  X,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { BULAN_OPTIONS, SUBJEK_OPTIONS, type Arsip } from '../../types';
import { formatTanggal, formatFileSize } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function PenyimpananPage() {
  const { arsip, currentUser, updateArsip } = useApp();
  const mine = useMemo(
    () => arsip.filter((a) => a.siswaId === currentUser?.siswaId),
    [arsip, currentUser]
  );

  const [selSubjek, setSelSubjek] = useState<string | null>(null);
  const [selBulan, setSelBulan] = useState<string | null>(null);
  const [detailArsip, setDetailArsip] = useState<Arsip | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  const renderVal = (val?: string | null) => {
    if (!val || val.trim() === '') return '-';
    return val;
  };

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr || dateStr.trim() === '' || dateStr === '-') return '-';
    const formatted = formatTanggal(dateStr);
    return formatted === 'Invalid Date' ? dateStr : formatted;
  };

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
                      <div key={a.id} className="rounded-xl border border-ink-100 p-4 hover:shadow-soft transition-shadow flex flex-col justify-between">
                        <div>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                              {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-ink-900 truncate">{a.nomorDokumen || a.namaBerkas}</p>
                              <p className="text-xs text-ink-400 truncate">{a.perihal || a.namaBerkas}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <StatusBadge status={a.status} />
                                {a.file && (
                                  <span className="text-[11px] text-ink-400">{formatFileSize(a.file.size)}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tombol aksi: Lihat Detail, Pratinjau, Unduh */}
                          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setDetailArsip(a)}
                              className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-brand-700 hover:bg-brand-50"
                              title="Lihat Detail Identitas Arsip"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Detail</span>
                            </button>

                            {a.file?.dataUrl && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setPreview({ url: a.file!.dataUrl, name: a.file!.name })}
                                  className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-ink-700 hover:bg-ink-100"
                                  title="Pratinjau Berkas"
                                >
                                  {isPdf ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                                  <span>Buka</span>
                                </button>
                                <a
                                  href={a.file.dataUrl}
                                  download={a.file.name}
                                  className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 text-ink-700 hover:bg-ink-100"
                                  title={`Unduh ${a.file.name}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Unduh</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* re-classify */}
                        <div className="mt-3 pt-2 border-t border-ink-50 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-ink-400 block mb-0.5">Folder Utama</label>
                            <select
                              className="input !py-1.5 !text-xs w-full"
                              value={a.subjek}
                              onChange={(e) => updateArsip(a.id, { subjek: e.target.value })}
                            >
                              {SUBJEK_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-ink-400 block mb-0.5">Sub Folder</label>
                            <select
                              className="input !py-1.5 !text-xs w-full"
                              value={a.bulan}
                              onChange={(e) => updateArsip(a.id, { bulan: e.target.value })}
                            >
                              {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
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

      {/* Modal Detail Arsip */}
      {detailArsip && (
        <div
          className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={() => setDetailArsip(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-pop max-w-2xl w-full max-h-[calc(100dvh-2rem)] sm:max-h-[90vh] flex flex-col animate-scale-in overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-ink-100 bg-ink-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-ink-900 text-base leading-tight truncate">
                    {detailArsip.nomorDokumen || 'Detail Arsip'}
                  </h3>
                  <p className="text-xs text-ink-500 truncate">{detailArsip.namaBerkas}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={detailArsip.status} />
                <button
                  type="button"
                  onClick={() => setDetailArsip(null)}
                  className="btn-ghost p-1.5 text-ink-400 hover:text-ink-700 rounded-lg"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 text-sm">
              {/* Section 1: Identitas Arsip */}
              <div>
                <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" /> Identitas Arsip
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-ink-50/70 p-4 rounded-xl border border-ink-100">
                  <div>
                    <p className="text-xs text-ink-400">Nomor Dokumen</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.nomorDokumen)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Nama Berkas</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.namaBerkas)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Jenis Dokumen</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.jenisDokumen)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Tanggal Surat</p>
                    <p className="font-medium text-ink-800">{formatDateDisplay(detailArsip.tanggalSurat)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Pengirim</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.pengirim)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Penerima</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.penerima)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-ink-400">Perihal</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.perihal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Lampiran</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.lampiran)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Tembusan</p>
                    <p className="font-medium text-ink-800 break-words">{renderVal(detailArsip.tembusan)}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-ink-400">Isi Ringkas</p>
                    <p className="font-medium text-ink-800 whitespace-pre-wrap break-words">{renderVal(detailArsip.isiRingkas)}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Klasifikasi & Digitalisasi */}
              <div>
                <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Klasifikasi & Digitalisasi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-ink-50/70 p-4 rounded-xl border border-ink-100">
                  <div>
                    <p className="text-xs text-ink-400">Folder Utama (Subjek)</p>
                    <p className="font-medium text-ink-800">{renderVal(detailArsip.subjek)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Sub Folder (Bulan)</p>
                    <p className="font-medium text-ink-800">{renderVal(detailArsip.bulan)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Tanggal Digitalisasi</p>
                    <p className="font-medium text-ink-800">{formatDateDisplay(detailArsip.tanggal)}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Retensi Arsip */}
              <div>
                <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Ketentuan Retensi
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-ink-50/70 p-4 rounded-xl border border-ink-100">
                  <div>
                    <p className="text-xs text-ink-400">Nilai Guna</p>
                    <p className="font-medium text-ink-800">{renderVal(detailArsip.nilaiGuna)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Masa Retensi</p>
                    <p className="font-medium text-ink-800">
                      {detailArsip.masaRetensiHari ? `${detailArsip.masaRetensiHari} hari` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Tanggal Akhir Retensi</p>
                    <p className="font-medium text-ink-800">{formatDateDisplay(detailArsip.tanggalRetensi)}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: File Dokumen */}
              <div>
                <h4 className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Berkas Dokumen
                </h4>
                {detailArsip.file ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-brand-200 bg-brand-50/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white border border-brand-200 text-brand-600 flex items-center justify-center shrink-0">
                        {detailArsip.file.type === 'application/pdf' || detailArsip.file.name.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-ink-900 truncate">{detailArsip.file.name}</p>
                        <p className="text-xs text-ink-500">{formatFileSize(detailArsip.file.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {detailArsip.file.dataUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreview({ url: detailArsip.file!.dataUrl, name: detailArsip.file!.name })}
                            className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Pratinjau
                          </button>
                          <a
                            href={detailArsip.file.dataUrl}
                            download={detailArsip.file.name}
                            className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh File
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-ink-400 italic bg-ink-50 p-3 rounded-xl border border-ink-100">
                    Tidak ada file dokumen yang tersimpan.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex justify-end px-5 sm:px-6 py-3 border-t border-ink-100 bg-ink-50/50">
              <button
                type="button"
                onClick={() => setDetailArsip(null)}
                className="btn-secondary text-xs !py-2 !px-4"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pratinjau File */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-pop max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 bg-ink-50/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <p className="font-semibold text-sm text-ink-900 truncate">{preview.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={preview.url}
                  download={preview.name}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="btn-ghost p-1.5 text-ink-500 hover:text-ink-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-ink-100/50 flex items-center justify-center p-4">
              {preview.url.startsWith('data:application/pdf') || preview.name.toLowerCase().endsWith('.pdf') ? (
                <iframe src={preview.url} title="Preview" className="w-full h-[70vh] bg-white rounded-lg border border-ink-200" />
              ) : (
                <img src={preview.url} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
