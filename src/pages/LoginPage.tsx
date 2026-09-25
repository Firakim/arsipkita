import { useState } from 'react';
import { Archive, GraduationCap, KeyRound, LogIn, User, AlertTriangle } from 'lucide-react';
import { useApp } from '../AppContext';
import { isSupabaseConfigured } from '../lib/supabase';

export default function LoginPage() {
  const { login } = useApp();
  const [role, setRole] = useState<'siswa' | 'guru'>('siswa');
  const [name, setName] = useState('');
  const [kelas, setKelas] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(role, code, name, kelas);
    setLoading(false);
    if (!res.ok) setError(res.error ?? 'Gagal masuk.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-stretch">
        {/* Brand panel */}
        <div className="hidden lg:flex flex-col justify-between rounded-3xl bg-brand-700 text-white p-10 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-brand-500/30 blur-2xl" />
          <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight">ArsipKita</h1>
                <p className="text-brand-100 text-sm">Simulasi Penyimpanan Arsip Digital</p>
              </div>
            </div>
            <p className="mt-10 text-brand-50 text-lg font-medium leading-relaxed max-w-sm">
              Media pembelajaran interaktif untuk memahami siklus penyimpanan arsip digital:
              digitalisasi, penyimpanan, penyusutan, hingga pemusnahan.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-3 mt-10">
            {[
              { t: 'Digitalisasi', d: 'Unggah & catat arsip' },
              { t: 'Penyimpanan', d: 'Klasifikasi folder' },
              { t: 'Penyusutan', d: 'Tinjau retensi' },
              { t: 'Pemusnahan', d: 'Proses akhir' },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl bg-white/10 backdrop-blur p-4 ring-1 ring-white/15">
                <p className="font-semibold text-sm">{s.t}</p>
                <p className="text-brand-100 text-xs mt-0.5">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="card p-8 sm:p-10 flex flex-col justify-center animate-fade-in">
          <div className="flex items-center gap-3 lg:hidden mb-6">
            <div className="w-11 h-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-ink-900">ArsipKita</h1>
              <p className="text-ink-500 text-xs">Simulasi Arsip Digital</p>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-ink-900">Selamat Datang</h2>
          <p className="text-ink-500 text-sm mt-1">
            Masuk sebagai Siswa atau Guru untuk memulai simulasi.
          </p>

          {/* Role toggle */}
          <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-ink-100">
            <button
              type="button"
              onClick={() => { setRole('siswa'); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                role === 'siswa' ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <User className="w-4 h-4" /> Siswa
            </button>
            <button
              type="button"
              onClick={() => { setRole('guru'); setError(null); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                role === 'guru' ? 'bg-white text-brand-700 shadow-soft' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Guru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label">Nama {role === 'siswa' ? 'Siswa' : 'Guru'}</label>
              <input
                className="input"
                placeholder={role === 'siswa' ? 'Contoh: Andi Pratama' : 'Contoh: Budi Santoso, S.Pd.'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {role === 'siswa' && (
              <div>
                <label className="label">Kelas</label>
                <input
                  className="input"
                  placeholder="Contoh: XI IPS 1"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                />
              </div>
            )}
            <div>
              <label className="label">Kode Akses</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-10 tracking-widest"
                  placeholder="Masukkan kode akses"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            {!isSupabaseConfigured && (
              <div className="rounded-xl bg-amber-50 text-amber-900 text-xs p-3.5 ring-1 ring-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Konfigurasi Supabase Belum Terhubung</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-700">
                  Project di Vercel belum memiliki Environment Variables Supabase. Tambahkan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> dan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> di Vercel Dashboard (Project Settings &rarr; Environment Variables) lalu Redeploy.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 text-red-700 text-sm px-3.5 py-2.5 ring-1 ring-red-200 animate-scale-in">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              <LogIn className="w-4 h-4" /> {loading ? 'Memproses...' : `Masuk sebagai ${role === 'siswa' ? 'Siswa' : 'Guru'}`}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
