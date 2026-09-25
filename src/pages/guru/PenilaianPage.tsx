import { useMemo, useState } from 'react';
import {
  GraduationCap,
  Star,
  Save,
  MessageSquare,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useApp } from '../../AppContext';
import { getNilaiHuruf, formatTanggalShort } from '../../lib/storage';
import { StatusBadge } from '../../components/StatusBadge';
import type { Arsip } from '../../types';

export default function PenilaianPage() {
  const { arsip, siswaList, setNilai } = useApp();
  const [selSiswa, setSelSiswa] = useState<string | null>(null);

  const siswaWithArsip = useMemo(
    () => siswaList.filter((s) => arsip.some((a) => a.siswaId === s.id)),
    [siswaList, arsip]
  );

  const selectedSiswa = siswaList.find((s) => s.id === selSiswa) ?? null;
  const items = useMemo(
    () => (selSiswa ? arsip.filter((a) => a.siswaId === selSiswa) : []),
    [arsip, selSiswa]
  );

  const rataRata = useMemo(() => {
    const dinilai = items.filter((a) => a.nilaiAngka !== null);
    if (dinilai.length === 0) return null;
    return Math.round((dinilai.reduce((s, a) => s + (a.nilaiAngka ?? 0), 0) / dinilai.length) * 10) / 10;
  }, [items]);

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Siswa list */}
      <div className="lg:col-span-1">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <GraduationCap className="w-4 h-4 text-brand-600" />
            <h3 className="font-bold text-ink-900 text-sm">Pilih Siswa</h3>
          </div>
          {siswaWithArsip.length === 0 ? (
            <div className="text-center py-8 text-ink-400 text-xs">
              Belum ada siswa dengan arsip.
            </div>
          ) : (
            <div className="space-y-1.5">
              {siswaWithArsip.map((s) => {
                const count = arsip.filter((a) => a.siswaId === s.id).length;
                const dinilai = arsip.filter((a) => a.siswaId === s.id && a.nilaiAngka !== null).length;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelSiswa(s.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                      selSiswa === s.id
                        ? 'bg-brand-50 ring-1 ring-brand-100'
                        : 'hover:bg-ink-50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-900 truncate">{s.name}</p>
                      <p className="text-[11px] text-ink-400">
                        {dinilai}/{count} dinilai
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="lg:col-span-3">
        {!selectedSiswa ? (
          <div className="card p-10 text-center">
            <Star className="w-10 h-10 text-ink-200 mx-auto mb-3" />
            <p className="text-ink-500 font-medium">Pilih siswa di samping untuk melihat dan memberikan penilaian.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="card p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                    {selectedSiswa.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-900">{selectedSiswa.name}</h3>
                    <p className="text-xs text-ink-400">{selectedSiswa.kelas} · {items.length} arsip</p>
                  </div>
                </div>
                {rataRata !== null && (
                  <div className="text-right">
                    <p className="text-xs text-ink-400">Nilai Rata-rata</p>
                    <p className="text-2xl font-extrabold text-brand-700">
                      {rataRata} <span className="text-sm text-ink-400">({getNilaiHuruf(rataRata)})</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            {items.length === 0 ? (
              <div className="card p-10 text-center text-ink-400 text-sm">
                Siswa ini belum memiliki arsip.
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((a) => (
                  <PenilaianItem key={a.id} arsip={a} onSave={(nilai, catatan) => setNilai(a.id, nilai, catatan)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PenilaianItem({
  arsip,
  onSave,
}: {
  arsip: Arsip;
  onSave: (nilai: number | null, catatan: string) => void;
}) {
  const [nilai, setNilai] = useState<string>(arsip.nilaiAngka !== null ? String(arsip.nilaiAngka) : '');
  const [catatan, setCatatan] = useState<string>(arsip.catatanGuru);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const n = nilai.trim() === '' ? null : Math.max(0, Math.min(100, Number(nilai)));
    onSave(n, catatan);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isPdf = arsip.file?.type === 'application/pdf' || arsip.file?.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          {isPdf ? <FileText className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-ink-900">{arsip.nomorDokumen}</p>
            <StatusBadge status={arsip.status} />
          </div>
          <p className="text-xs text-ink-400 mt-0.5">
            {arsip.jenisDokumen} · {arsip.subjek} · {arsip.bulan} · {formatTanggalShort(arsip.createdAt)}
          </p>
          {arsip.perihal && (
            <p className="text-sm text-ink-600 mt-2">{arsip.perihal}</p>
          )}
          {arsip.isiRingkas && (
            <p className="text-xs text-ink-500 mt-1.5 line-clamp-2">{arsip.isiRingkas}</p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="label">Nilai Angka (0-100)</label>
          <input
            type="number"
            min={0}
            max={100}
            className="input"
            placeholder="Contoh: 85"
            value={nilai}
            onChange={(e) => setNilai(e.target.value)}
          />
          {nilai.trim() !== '' && !Number.isNaN(Number(nilai)) && (
            <p className="text-xs text-ink-400 mt-1.5">
              Nilai huruf: <span className="font-bold text-brand-700">{getNilaiHuruf(Number(nilai))}</span>
            </p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="label">
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Masukan / Koreksi
            </span>
          </label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Tulis masukan untuk siswa..."
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        {saved && (
          <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 animate-scale-in">
            <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
          </span>
        )}
        <button onClick={handleSave} className="btn-primary ml-auto">
          <Save className="w-4 h-4" /> Simpan Penilaian
        </button>
      </div>
    </div>
  );
}
