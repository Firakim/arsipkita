import { useMemo, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Search,
  Download,
  X,
  Users,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { formatTanggalShort, formatFileSize } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

export default function LembarKerjaPage() {
  const { arsip, siswaList } = useApp();
  const [search, setSearch] = useState('');
  const [filterSiswa, setFilterSiswa] = useState<string>('all');
  const [preview, setPreview] = useState<string | null>(null); // dataUrl
  const [previewName, setPreviewName] = useState('');

  const filtered = useMemo(() => {
    return arsip.filter((a) => {
      if (filterSiswa !== 'all' && a.siswaId !== filterSiswa) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          a.nomorDokumen.toLowerCase().includes(q) ||
          a.namaBerkas.toLowerCase().includes(q) ||
          a.perihal.toLowerCase().includes(q) ||
          a.pengirim.toLowerCase().includes(q) ||
          a.penerima.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [arsip, search, filterSiswa]);

  const openPreview = (dataUrl: string, name: string) => {
    setPreview(dataUrl);
    setPreviewName(name);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="input pl-10"
              placeholder="Cari nomor, perihal, pengirim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input sm:w-56"
            value={filterSiswa}
            onChange={(e) => setFilterSiswa(e.target.value)}
          >
            <option value="all">Semua Siswa</option>
            {siswaList.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.kelas})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-ink-900">Lembar Kerja Siswa</h3>
          </div>
          <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-100">{filtered.length} arsip</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-ink-400 text-sm">
            Belum ada arsip yang dicatat oleh siswa.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50 text-ink-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-3">Siswa</th>
                  <th className="text-left font-semibold px-4 py-3">Nomor</th>
                  <th className="text-left font-semibold px-4 py-3">Jenis</th>
                  <th className="text-left font-semibold px-4 py-3">Perihal</th>
                  <th className="text-left font-semibold px-4 py-3">Pengirim → Penerima</th>
                  <th className="text-left font-semibold px-4 py-3">Klasifikasi</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3">Berkas</th>
                  <th className="text-left font-semibold px-4 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((a) => {
                  const isPdf = a.file?.type === 'application/pdf' || a.file?.name.toLowerCase().endsWith('.pdf');
                  return (
                    <tr key={a.id} className="hover:bg-ink-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {a.siswaName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-ink-800 text-xs">{a.siswaName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-700">{a.nomorDokumen}</td>
                      <td className="px-4 py-3 text-xs text-ink-600">{a.jenisDokumen}</td>
                      <td className="px-4 py-3 text-xs text-ink-700 max-w-[180px] truncate" title={a.perihal}>
                        {a.perihal || a.namaBerkas}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600">
                        <span className="block truncate max-w-[120px]">{a.pengirim || '-'}</span>
                        <span className="text-ink-400">→ {a.penerima || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600">
                        {a.subjek} · {a.bulan}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-3">
                        {a.file ? (
                          <button
                            onClick={() => openPreview(a.file!.dataUrl, a.file!.name)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline"
                          >
                            {isPdf ? <FileText className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                            Lihat
                          </button>
                        ) : (
                          <span className="text-xs text-ink-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                        {formatTanggalShort(a.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-pop max-w-4xl w-full max-h-[90vh] flex flex-col animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <p className="font-semibold text-sm text-ink-900 truncate">{previewName}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={preview}
                  download={previewName}
                  className="btn-secondary text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh
                </a>
                <button onClick={() => setPreview(null)} className="btn-ghost p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-ink-50 flex items-center justify-center p-4">
              {preview.startsWith('data:application/pdf') || previewName.toLowerCase().endsWith('.pdf') ? (
                <iframe src={preview} title="Preview" className="w-full h-[70vh] bg-white rounded-lg" />
              ) : (
                <img src={preview} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
