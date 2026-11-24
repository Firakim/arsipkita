import { useRef, useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2,
  Save,
  FileCheck2,
  Pencil,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import {
  BULAN_OPTIONS,
  DOC_TYPES,
  SUBJEK_OPTIONS,
  NILAI_GUNA_OPTIONS,
  getTodayDateString,
  calculateRetensi,
  type Arsip,
  type ArsipFile,
  type DocType,
  type NilaiGunaKategori,
} from '../../types';
import { formatFileSize, formatTanggal } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png';
const MAX_FILE = 5 * 1024 * 1024; // 5MB

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DigitalisasiPage() {
  const { addArsip, updateArsip, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<ArsipFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingArsip, setEditingArsip] = useState<Arsip | null>(null);
  const [editSuccessMsg, setEditSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    nomorDokumen: '',
    namaBerkas: '',
    jenisDokumen: 'Surat Masuk' as DocType,
    tanggalSurat: '',
    pengirim: '',
    penerima: '',
    perihal: '',
    lampiran: '',
    isiRingkas: '',
    tembusan: '',
    subjek: SUBJEK_OPTIONS[0],
    bulan: BULAN_OPTIONS[new Date().getMonth()],
    nilaiGuna: '' as NilaiGunaKategori | '',
    masaRetensiHari: 0,
  });
  const [previewTanggalRetensi, setPreviewTanggalRetensi] = useState<string>('');

  const handleFile = async (f: File | null) => {
    if (!f) return;
    setError(null);
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext ?? '')) {
      setError('Format file harus PDF, JPG, atau PNG.');
      return;
    }
    if (f.size > MAX_FILE) {
      setError('Ukuran file maksimal 5MB.');
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(f);
      const arsipFile: ArsipFile = {
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl,
      };
      setFile(arsipFile);
      setForm((prev) => ({ ...prev, namaBerkas: f.name.replace(/\.[^.]+$/, '') }));
    } catch {
      setError('Gagal memuat file.');
    }
  };

  const removeFile = () => {
    setFile(null);
    setForm((prev) => ({ ...prev, namaBerkas: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const set = (k: keyof typeof form, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleTanggalSuratChange = (tgl: string) => {
    setForm((prev) => {
      const updated = { ...prev, tanggalSurat: tgl };
      if (tgl && updated.nilaiGuna) {
        const opt = NILAI_GUNA_OPTIONS.find((o) => o.kategori === updated.nilaiGuna);
        if (opt) {
          const res = calculateRetensi(tgl, opt.tahun);
          updated.masaRetensiHari = res.masaRetensiHari;
          setPreviewTanggalRetensi(res.tanggalRetensi);
        }
      } else {
        updated.masaRetensiHari = 0;
        setPreviewTanggalRetensi('');
      }
      return updated;
    });
  };

  const handleNilaiGunaChange = (kategori: NilaiGunaKategori | '') => {
    setForm((prev) => {
      const updated = { ...prev, nilaiGuna: kategori };
      if (updated.tanggalSurat && kategori) {
        const opt = NILAI_GUNA_OPTIONS.find((o) => o.kategori === kategori);
        if (opt) {
          const res = calculateRetensi(updated.tanggalSurat, opt.tahun);
          updated.masaRetensiHari = res.masaRetensiHari;
          setPreviewTanggalRetensi(res.tanggalRetensi);
        }
      } else {
        updated.masaRetensiHari = 0;
        setPreviewTanggalRetensi('');
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.nomorDokumen.trim()) return setError('Nomor dokumen wajib diisi.');
    if (!file) return setError('Berkas dokumen wajib diunggah.');
    if (!form.tanggalSurat) return setError('Tanggal surat wajib diisi.');

    const todayStr = getTodayDateString();
    if (form.tanggalSurat > todayStr) {
      return setError('Tanggal surat tidak boleh melebihi tanggal hari ini (tanggal digitalisasi).');
    }

    if (!form.nilaiGuna) return setError('Nilai guna arsip wajib dipilih.');

    setSaving(true);
    try {
      await addArsip({
        ...form,
        nilaiGuna: form.nilaiGuna as NilaiGunaKategori,
        file,
      });
      setSaved(true);
      // reset
      setForm({
        nomorDokumen: '',
        namaBerkas: '',
        jenisDokumen: 'Surat Masuk',
        tanggalSurat: '',
        pengirim: '',
        penerima: '',
        perihal: '',
        lampiran: '',
        isiRingkas: '',
        tembusan: '',
        subjek: SUBJEK_OPTIONS[0],
        bulan: BULAN_OPTIONS[new Date().getMonth()],
        nilaiGuna: '',
        masaRetensiHari: 0,
      });
      setPreviewTanggalRetensi('');
      removeFile();
      setTimeout(() => setSaved(false), 3500);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan arsip ke database.');
    } finally {
      setSaving(false);
    }
  };

  const isPdf = file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-6">
      {editSuccessMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 text-sm flex items-center justify-between animate-scale-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{editSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setEditSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
      {/* Upload + Preview */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <h3 className="font-bold text-ink-900 mb-1">Unggah Berkas</h3>
          <p className="text-sm text-ink-500 mb-4">Format PDF, JPG, atau PNG (maks 5MB).</p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-ink-200 hover:border-brand-400 hover:bg-brand-50/50 transition-colors p-8 flex flex-col items-center gap-3 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-ink-700">Klik untuk memilih file</p>
                <p className="text-xs text-ink-400 mt-0.5">atau seret & lepas berkas scan</p>
              </div>
            </button>
          ) : (
            <div className="rounded-2xl border border-ink-100 p-4 animate-scale-in">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink-900 truncate">{file.name}</p>
                  <p className="text-xs text-ink-400 mt-0.5">{formatFileSize(file.size)}</p>
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(true)}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Lihat Preview
                    </button>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5 ring-1 ring-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Preview */}
        {file && previewOpen && (
          <div className="card p-5 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink-900">Preview Dokumen</h3>
              <button onClick={() => setPreviewOpen(false)} className="text-ink-400 hover:text-ink-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-ink-50 border border-ink-100 max-h-[420px] flex items-center justify-center">
              {isPdf ? (
                <iframe
                  src={file.dataUrl}
                  title="Preview PDF"
                  className="w-full h-[400px] bg-white"
                />
              ) : (
                <img
                  src={file.dataUrl}
                  alt="Preview"
                  className="max-h-[400px] w-auto object-contain"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="lg:col-span-3">
        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-ink-900">Identitas Arsip</h3>
              <p className="text-sm text-ink-500">Catat metadata dokumen yang diunggah.</p>
            </div>
            {saved && (
              <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 animate-scale-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nomor Dokumen *</label>
              <input
                className="input"
                placeholder="Contoh: 001/ARSIP/2025"
                value={form.nomorDokumen}
                onChange={(e) => set('nomorDokumen', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nama Berkas</label>
              <input
                className="input"
                placeholder="Terisi otomatis dari file"
                value={form.namaBerkas}
                onChange={(e) => set('namaBerkas', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Jenis Dokumen</label>
              <select
                className="input"
                value={form.jenisDokumen}
                onChange={(e) => set('jenisDokumen', e.target.value as DocType)}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tanggal Surat *</label>
              <input
                type="date"
                className="input"
                max={getTodayDateString()}
                value={form.tanggalSurat}
                onChange={(e) => handleTanggalSuratChange(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Pengirim</label>
              <input
                className="input"
                placeholder="Contoh: Kantor Cabang A"
                value={form.pengirim}
                onChange={(e) => set('pengirim', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Penerima</label>
              <input
                className="input"
                placeholder="Contoh: Bagian Umum"
                value={form.penerima}
                onChange={(e) => set('penerima', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Perihal</label>
              <input
                className="input"
                placeholder="Contoh: Undangan Rapat Bulanan"
                value={form.perihal}
                onChange={(e) => set('perihal', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Lampiran</label>
              <input
                className="input"
                placeholder="Contoh: 1 berkas"
                value={form.lampiran}
                onChange={(e) => set('lampiran', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Tembusan</label>
              <input
                className="input"
                placeholder="Contoh: Kepala Sekolah"
                value={form.tembusan}
                onChange={(e) => set('tembusan', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Isi Ringkas</label>
            <textarea
              className="input min-h-[90px] resize-y"
              placeholder="Ringkasan isi dokumen..."
              value={form.isiRingkas}
              onChange={(e) => set('isiRingkas', e.target.value)}
            />
          </div>

          {/* Klasifikasi & Penentuan Retensi */}
          <div className="rounded-2xl bg-ink-50 border border-ink-100 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink-700">Klasifikasi & Penentuan Retensi</p>
              <p className="text-xs text-ink-500 mt-0.5">
                Tentukan folder klasifikasi dan kategori nilai guna arsip. Masa retensi dihitung otomatis dari tanggal surat.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Folder Utama (Subjek)</label>
                <select
                  className="input"
                  value={form.subjek}
                  onChange={(e) => set('subjek', e.target.value)}
                >
                  {SUBJEK_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Sub Folder (Bulan)</label>
                <select
                  className="input"
                  value={form.bulan}
                  onChange={(e) => set('bulan', e.target.value)}
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nilai Guna Arsip *</label>
                <select
                  className="input"
                  value={form.nilaiGuna}
                  onChange={(e) => handleNilaiGunaChange(e.target.value as NilaiGunaKategori | '')}
                >
                  <option value="">-- Pilih Nilai Guna Arsip --</option>
                  {NILAI_GUNA_OPTIONS.map((opt) => (
                    <option key={opt.kategori} value={opt.kategori}>
                      {opt.deskripsi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Banner preview tanggal retensi otomatis */}
            {form.nilaiGuna && form.tanggalSurat && previewTanggalRetensi ? (
              <div className="rounded-xl bg-brand-50 border border-brand-200 p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-semibold text-brand-900">Masa Retensi: </span>
                  <span className="text-brand-700">
                    {NILAI_GUNA_OPTIONS.find((o) => o.kategori === form.nilaiGuna)?.tahun} Tahun ({form.masaRetensiHari} hari kalender)
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-brand-900">Jatuh Tempo Retensi: </span>
                  <span className="font-bold text-brand-700">{formatTanggal(previewTanggalRetensi)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-ink-400 italic">
                {!form.tanggalSurat
                  ? '* Isi Tanggal Surat pada formulir Identitas Arsip terlebih dahulu.'
                  : '* Pilih kategori nilai guna untuk menghitung masa retensi dan tanggal jatuh tempo secara otomatis.'}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-ink-400">
              Siswa: <span className="font-semibold text-ink-600">{currentUser?.name}</span>
            </p>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Arsip'}
            </button>
          </div>
        </form>
      </div>

      {/* Recent submissions */}
      <div className="lg:col-span-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck2 className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-ink-900">Arsip Baru Saya</h3>
          </div>
          <RecentList onEdit={(a) => setEditingArsip(a)} />
        </div>
      </div>
    </div>

    {editingArsip && (
      <EditIdentitasModal
        arsip={editingArsip}
        onClose={() => setEditingArsip(null)}
        onSuccess={(msg) => {
          setEditSuccessMsg(msg);
          setTimeout(() => setEditSuccessMsg(null), 5000);
        }}
        updateArsip={updateArsip}
      />
    )}
  </div>
  );
}

function RecentList({ onEdit }: { onEdit: (a: Arsip) => void }) {
  const { arsip, currentUser } = useApp();
  const mine = arsip
    .filter((a) => a.siswaId === currentUser?.siswaId)
    .slice(0, 4);
  if (mine.length === 0) {
    return (
      <div className="text-center py-8 text-ink-400 text-sm">
        Belum ada arsip yang dicatat. Mulai dengan mengunggah berkas di atas.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {mine.map((a) => {
        const canEdit = a.status === 'aktif' || a.status === 'menjelang';
        return (
          <div key={a.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3 hover:border-ink-200 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">
                {a.nomorDokumen} — {a.perihal || a.namaBerkas}
              </p>
              <p className="text-xs text-ink-400">
                {a.jenisDokumen} · {a.subjek} · {a.bulan}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(a)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                  title="Edit identitas arsip"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Identitas</span>
                </button>
              ) : (
                <StatusBadge status={a.status} />
              )}
              <span className="text-xs text-ink-400 hidden sm:block">
                {new Date(a.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EditIdentitasModalProps {
  arsip: Arsip;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  updateArsip: (id: string, patch: Partial<Arsip>) => Promise<void> | void;
}

function EditIdentitasModal({
  arsip,
  onClose,
  onSuccess,
  updateArsip,
}: EditIdentitasModalProps) {
  const [form, setForm] = useState({
    nomorDokumen: arsip.nomorDokumen || '',
    namaBerkas: arsip.namaBerkas || '',
    jenisDokumen: arsip.jenisDokumen || 'Surat Masuk',
    tanggalSurat: arsip.tanggalSurat || '',
    pengirim: arsip.pengirim || '',
    penerima: arsip.penerima || '',
    perihal: arsip.perihal || '',
    lampiran: arsip.lampiran || '',
    isiRingkas: arsip.isiRingkas || '',
    tembusan: arsip.tembusan || '',
    subjek: arsip.subjek || SUBJEK_OPTIONS[0],
    bulan: arsip.bulan || BULAN_OPTIONS[0],
    nilaiGuna: (arsip.nilaiGuna as NilaiGunaKategori) || '',
    masaRetensiHari: arsip.masaRetensiHari || 0,
  });

  const [previewTanggalRetensi, setPreviewTanggalRetensi] = useState<string>(() => {
    if (arsip.tanggalSurat && arsip.nilaiGuna) {
      const opt = NILAI_GUNA_OPTIONS.find((o) => o.kategori === arsip.nilaiGuna);
      if (opt) {
        return calculateRetensi(arsip.tanggalSurat, opt.tahun).tanggalRetensi;
      }
    }
    return arsip.tanggalRetensi || '';
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = (k: keyof typeof form, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleTanggalSuratChange = (tgl: string) => {
    setForm((prev) => {
      const updated = { ...prev, tanggalSurat: tgl };
      if (tgl && updated.nilaiGuna) {
        const opt = NILAI_GUNA_OPTIONS.find((o) => o.kategori === updated.nilaiGuna);
        if (opt) {
          const res = calculateRetensi(tgl, opt.tahun);
          updated.masaRetensiHari = res.masaRetensiHari;
          setPreviewTanggalRetensi(res.tanggalRetensi);
        }
      } else {
        updated.masaRetensiHari = 0;
        setPreviewTanggalRetensi('');
      }
      return updated;
    });
  };

  const handleNilaiGunaChange = (kategori: NilaiGunaKategori | '') => {
    setForm((prev) => {
      const updated = { ...prev, nilaiGuna: kategori };
      if (updated.tanggalSurat && kategori) {
        const opt = NILAI_GUNA_OPTIONS.find((o) => o.kategori === kategori);
        if (opt) {
          const res = calculateRetensi(updated.tanggalSurat, opt.tahun);
          updated.masaRetensiHari = res.masaRetensiHari;
          setPreviewTanggalRetensi(res.tanggalRetensi);
        }
      } else {
        updated.masaRetensiHari = 0;
        setPreviewTanggalRetensi('');
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.nomorDokumen.trim()) {
      return setError('Nomor dokumen wajib diisi.');
    }
    if (!form.tanggalSurat) {
      return setError('Tanggal surat wajib diisi.');
    }

    const todayStr = getTodayDateString();
    if (form.tanggalSurat > todayStr) {
      return setError('Tanggal surat tidak boleh melebihi tanggal hari ini.');
    }

    if (!form.nilaiGuna) {
      return setError('Nilai guna arsip wajib dipilih.');
    }

    const opt = NILAI_GUNA_OPTIONS.find((o) => o.kategori === form.nilaiGuna);
    const resRetensi = opt
      ? calculateRetensi(form.tanggalSurat, opt.tahun)
      : {
          tanggalRetensi: arsip.tanggalRetensi,
          masaRetensiHari: form.masaRetensiHari,
        };

    setSaving(true);
    try {
      await updateArsip(arsip.id, {
        nomorDokumen: form.nomorDokumen.trim(),
        namaBerkas: form.namaBerkas.trim() || form.nomorDokumen.trim(),
        jenisDokumen: form.jenisDokumen as DocType,
        tanggalSurat: form.tanggalSurat,
        pengirim: form.pengirim.trim(),
        penerima: form.penerima.trim(),
        perihal: form.perihal.trim(),
        lampiran: form.lampiran.trim(),
        isiRingkas: form.isiRingkas.trim(),
        tembusan: form.tembusan.trim(),
        subjek: form.subjek,
        bulan: form.bulan,
        nilaiGuna: form.nilaiGuna as NilaiGunaKategori,
        masaRetensiHari: resRetensi.masaRetensiHari,
        tanggalRetensi: resRetensi.tanggalRetensi,
      });

      onSuccess(`Identitas arsip "${form.nomorDokumen.trim()}" berhasil diperbarui.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui data identitas arsip.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-pop max-w-3xl w-full max-h-[90vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-ink-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-ink-900">Edit Identitas Arsip</h3>
              <p className="text-xs text-ink-500">Perbarui identitas, metadata, klasifikasi, dan nilai guna arsip.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-ink-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 text-red-700 text-sm px-4 py-3 ring-1 ring-red-200 flex items-start gap-2.5 animate-scale-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Read-Only Info Box */}
          <div className="rounded-xl bg-ink-50/80 border border-ink-100 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-700">
              <Lock className="w-3.5 h-3.5 text-ink-500" />
              <span>Informasi Tetap (Read-Only)</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-ink-400 block">Berkas Digital:</span>
                <span className="font-semibold text-ink-800 truncate block" title={arsip.file?.name || arsip.namaBerkas}>
                  {arsip.file?.name || arsip.namaBerkas || 'Tidak ada file'}
                </span>
                <span className="text-[11px] text-ink-400">
                  {arsip.file ? formatFileSize(arsip.file.size) : '-'}
                </span>
              </div>
              <div>
                <span className="text-ink-400 block">Tanggal Digitalisasi:</span>
                <span className="font-semibold text-ink-800 block">
                  {formatTanggal(arsip.tanggal)}
                </span>
                <span className="text-[11px] text-ink-400">Pencatatan otomatis sistem</span>
              </div>
              <div>
                <span className="text-ink-400 block">Pemilik Arsip:</span>
                <span className="font-semibold text-ink-800 block">{arsip.siswaName}</span>
                <span className="text-[11px] text-ink-400">Status: {arsip.status}</span>
              </div>
            </div>
          </div>

          {/* Kolom Identitas */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nomor Dokumen *</label>
              <input
                className="input"
                placeholder="Contoh: 001/ARSIP/2025"
                value={form.nomorDokumen}
                onChange={(e) => setField('nomorDokumen', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nama Berkas</label>
              <input
                className="input"
                placeholder="Nama berkas"
                value={form.namaBerkas}
                onChange={(e) => setField('namaBerkas', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Jenis Dokumen</label>
              <select
                className="input"
                value={form.jenisDokumen}
                onChange={(e) => setField('jenisDokumen', e.target.value as DocType)}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tanggal Surat *</label>
              <input
                type="date"
                className="input"
                max={getTodayDateString()}
                value={form.tanggalSurat}
                onChange={(e) => handleTanggalSuratChange(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Pengirim</label>
              <input
                className="input"
                placeholder="Contoh: Kantor Cabang A"
                value={form.pengirim}
                onChange={(e) => setField('pengirim', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Penerima</label>
              <input
                className="input"
                placeholder="Contoh: Bagian Umum"
                value={form.penerima}
                onChange={(e) => setField('penerima', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Perihal</label>
              <input
                className="input"
                placeholder="Contoh: Undangan Rapat Bulanan"
                value={form.perihal}
                onChange={(e) => setField('perihal', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Lampiran</label>
              <input
                className="input"
                placeholder="Contoh: 1 berkas"
                value={form.lampiran}
                onChange={(e) => setField('lampiran', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tembusan</label>
              <input
                className="input"
                placeholder="Contoh: Kepala Sekolah"
                value={form.tembusan}
                onChange={(e) => setField('tembusan', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Isi Ringkas</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Ringkasan isi dokumen..."
              value={form.isiRingkas}
              onChange={(e) => setField('isiRingkas', e.target.value)}
            />
          </div>

          {/* Klasifikasi & Penentuan Retensi */}
          <div className="rounded-2xl bg-ink-50 border border-ink-100 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink-700">Klasifikasi & Penentuan Retensi</p>
              <p className="text-xs text-ink-500 mt-0.5">
                Perubahan pada nilai guna atau tanggal surat akan menghitung ulang masa retensi secara otomatis.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Folder Utama (Subjek)</label>
                <select
                  className="input"
                  value={form.subjek}
                  onChange={(e) => setField('subjek', e.target.value)}
                >
                  {SUBJEK_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Sub Folder (Bulan)</label>
                <select
                  className="input"
                  value={form.bulan}
                  onChange={(e) => setField('bulan', e.target.value)}
                >
                  {BULAN_OPTIONS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Nilai Guna Arsip *</label>
                <select
                  className="input"
                  value={form.nilaiGuna}
                  onChange={(e) => handleNilaiGunaChange(e.target.value as NilaiGunaKategori | '')}
                >
                  <option value="">-- Pilih Nilai Guna Arsip --</option>
                  {NILAI_GUNA_OPTIONS.map((opt) => (
                    <option key={opt.kategori} value={opt.kategori}>
                      {opt.deskripsi}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Banner preview tanggal retensi otomatis */}
            {form.nilaiGuna && form.tanggalSurat && previewTanggalRetensi ? (
              <div className="rounded-xl bg-brand-50 border border-brand-200 p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div>
                  <span className="font-semibold text-brand-900">Masa Retensi: </span>
                  <span className="text-brand-700">
                    {NILAI_GUNA_OPTIONS.find((o) => o.kategori === form.nilaiGuna)?.tahun} Tahun ({form.masaRetensiHari} hari kalender)
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-brand-900">Jatuh Tempo Retensi: </span>
                  <span className="font-bold text-brand-700">{formatTanggal(previewTanggalRetensi)}</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-ink-400 italic">
                Pilih tanggal surat dan nilai guna arsip untuk melihat masa retensi dan tanggal jatuh tempo.
              </p>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary text-xs !py-2 !px-4"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
