import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Arsip,
  ArsipInput,
  AuthUser,
  RetensiStatus,
  Siswa,
} from './types';
import {
  STORAGE_KEY,
  computeRetensiStatus,
  getNilaiHuruf,
  uid,
} from './lib/storage';
import { supabase, isSupabaseConfigured } from './lib/supabase';

interface PersistedState {
  arsip: Arsip[];
  siswaList: Siswa[];
  currentUser: AuthUser | null;
}

interface AppContextValue {
  arsip: Arsip[];
  siswaList: Siswa[];
  currentUser: AuthUser | null;
  login: (role: 'siswa' | 'guru', accessCode: string, name: string, kelas?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setViewMode: (mode: 'siswa' | 'guru') => void;
  addArsip: (data: ArsipInput) => Promise<Arsip | null>;
  updateArsip: (id: string, patch: Partial<Arsip>) => Promise<void> | void;
  deleteArsip: (id: string) => Promise<void> | void;
  setAksiPenyusutan: (id: string, aksi: 'pindah_inaktif' | 'antre_pemusnahan') => Promise<void> | void;
  prosesPemusnahan: (id: string) => Promise<void> | void;
  setNilai: (id: string, nilaiAngka: number | null, catatan: string) => Promise<void> | void;
  getArsipBySiswa: (siswaId: string) => Arsip[];
  refreshData: () => Promise<void>;
  lastSync: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const SISWA_CODE = 'SISWA123';
const GURU_CODE = 'GURU123';

function mapRowToArsip(row: any): Arsip {
  return {
    id: row.id,
    siswaId: row.siswa_id,
    siswaName: row.siswa_name || '',
    nomorDokumen: row.nomor_dokumen || '',
    namaBerkas: row.nama_berkas || '',
    jenisDokumen: row.jenis_dokumen,
    pengirim: row.pengirim || '',
    penerima: row.penerima || '',
    perihal: row.perihal || '',
    lampiran: row.lampiran || '',
    isiRingkas: row.isi_ringkas || '',
    tembusan: row.tembusan || '',
    file: row.file_name
      ? {
          name: row.file_name,
          size: Number(row.file_size) || 0,
          type: row.file_type || '',
          dataUrl: row.file_data_url || '',
        }
      : null,
    subjek: row.subjek || '',
    bulan: row.bulan || '',
    tanggal: row.tanggal || row.created_at,
    masaRetensiHari: row.masa_retensi_hari ?? 30,
    tanggalRetensi: row.tanggal_retensi || '',
    status: row.status || 'aktif',
    aksiPenyusutan: row.aksi_penyusutan || null,
    tanggalAksi: row.tanggal_aksi || null,
    catatanGuru: row.catatan_guru || '',
    nilai: row.nilai || '',
    nilaiAngka:
      row.nilai_angka !== null && row.nilai_angka !== undefined
        ? Number(row.nilai_angka)
        : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      return {
        arsip: parsed.arsip ?? [],
        siswaList: parsed.siswaList ?? [],
        currentUser: parsed.currentUser ?? null,
      };
    }
  } catch {
    // ignore
  }
  return { arsip: [], siswaList: [], currentUser: null };
}

function saveState(state: PersistedState): number {
  const rev = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, _rev: rev }));
  } catch {
    // ignore quota errors
  }
  return rev;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const loaded = loadState();
    return loaded.currentUser ?? null;
  });
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const skipNextStorageEvent = useRef(false);
  const lastSaveRevRef = useRef<number>(0);

  // Persist on change
  useEffect(() => {
    lastSaveRevRef.current = saveState({ ...state, currentUser });
  }, [state, currentUser]);

  // Sync data from Supabase
  const fetchSupabaseData = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const [siswaRes, arsipRes] = await Promise.all([
        supabase.from('siswa').select('id, name, kelas').order('name'),
        supabase.from('arsip').select('*').order('created_at', { ascending: false }),
      ]);

      setState((prev) => {
        const newSiswa = siswaRes.data && siswaRes.data.length > 0 ? siswaRes.data : prev.siswaList;
        const newArsip = arsipRes.data ? arsipRes.data.map(mapRowToArsip) : prev.arsip;
        return {
          ...prev,
          siswaList: newSiswa,
          arsip: newArsip,
        };
      });
      setLastSync(Date.now());
    } catch (err) {
      console.error('Gagal mengambil data dari Supabase:', err);
    }
  }, []);

  // Realtime subscription and initial fetch from Supabase
  useEffect(() => {
    fetchSupabaseData();

    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('arsipkita_realtime_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'arsip' },
        () => {
          fetchSupabaseData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'siswa' },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSupabaseData]);

  // Cross-tab sync via storage event
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (skipNextStorageEvent.current) {
        skipNextStorageEvent.current = false;
        return;
      }
      if (!e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as PersistedState & { _rev?: number };
        const incomingRev = parsed._rev ?? 0;
        if (incomingRev <= lastSaveRevRef.current) return;
        setState((prev) => ({
          arsip: parsed.arsip ?? prev.arsip,
          siswaList: parsed.siswaList ?? prev.siswaList,
          currentUser: parsed.currentUser ?? prev.currentUser,
        }));
        if (parsed.currentUser !== undefined) {
          setCurrentUser(parsed.currentUser);
        }
        setLastSync(Date.now());
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const login = useCallback<AppContextValue['login']>(
    async (role, accessCode, name, kelas) => {
      if (!name.trim()) return { ok: false, error: 'Nama wajib diisi.' };

      if (role === 'siswa') {
        if (accessCode.trim().toUpperCase() !== SISWA_CODE)
          return { ok: false, error: 'Kode akses siswa salah.' };

        const trimmedName = name.trim();
        const trimmedKelas = (kelas ?? '').trim() || '-';

        let siswaId = uid('sw');
        let siswaName = trimmedName;

        if (isSupabaseConfigured) {
          // Look up existing siswa in Supabase by name + kelas
          const { data: existing, error: lookupError } = await supabase
            .from('siswa')
            .select('id, name, kelas')
            .eq('name', trimmedName)
            .eq('kelas', trimmedKelas)
            .maybeSingle();

          if (lookupError) {
            return { ok: false, error: 'Gagal terhubung ke database server. Pastikan pengaturan Supabase di Vercel sudah benar.' };
          }

          if (existing) {
            siswaId = existing.id;
            siswaName = existing.name;
          } else {
            const { data: created, error: insertError } = await supabase
              .from('siswa')
              .insert({ name: trimmedName, kelas: trimmedKelas })
              .select('id, name')
              .single();

            if (insertError || !created) {
              return { ok: false, error: 'Gagal membuat data siswa di database.' };
            }

            siswaId = created.id;
            siswaName = created.name;
          }
        }

        const siswaEntry: Siswa = {
          id: siswaId,
          name: siswaName,
          kelas: trimmedKelas,
        };

        const authUser: AuthUser = {
          role: 'siswa',
          name: siswaName,
          siswaId,
          viewMode: 'siswa',
        };

        skipNextStorageEvent.current = true;
        setState((prev) => {
          const oldSiswaIds = prev.siswaList
            .filter((s) => s.id !== siswaId && s.name === trimmedName && s.kelas === trimmedKelas)
            .map((s) => s.id);

          let migratedArsip = prev.arsip;
          if (oldSiswaIds.length > 0) {
            migratedArsip = prev.arsip.map((a) =>
              oldSiswaIds.includes(a.siswaId) ? { ...a, siswaId } : a
            );
          }

          const cleanedSiswaList = prev.siswaList.filter(
            (s) => s.id !== siswaId && !oldSiswaIds.includes(s.id)
          );

          return {
            ...prev,
            arsip: migratedArsip,
            siswaList: [...cleanedSiswaList, siswaEntry],
            currentUser: authUser,
          };
        });
        setCurrentUser(authUser);
        if (isSupabaseConfigured) {
          fetchSupabaseData();
        }
        return { ok: true };
      }

      // guru
      if (accessCode.trim().toUpperCase() !== GURU_CODE)
        return { ok: false, error: 'Kode akses guru salah.' };

      const guruUser: AuthUser = {
        role: 'guru',
        name: name.trim(),
        viewMode: 'guru',
      };
      skipNextStorageEvent.current = true;
      setState((prev) => ({ ...prev, currentUser: guruUser }));
      setCurrentUser(guruUser);
      if (isSupabaseConfigured) {
        fetchSupabaseData();
      }
      return { ok: true };
    },
    [fetchSupabaseData]
  );

  const logout = useCallback(() => {
    skipNextStorageEvent.current = true;
    setState((prev) => ({ ...prev, currentUser: null }));
    setCurrentUser(null);
  }, []);

  const setViewMode = useCallback((mode: 'siswa' | 'guru') => {
    setCurrentUser((u) => {
      if (!u) return u;
      const updated = { ...u, viewMode: mode };
      setState((prev) => ({ ...prev, currentUser: updated }));
      return updated;
    });
  }, []);

  const addArsip = useCallback<AppContextValue['addArsip']>(
    async (data: ArsipInput) => {
      const now = new Date();
      const retDate = new Date(now);
      retDate.setDate(retDate.getDate() + data.masaRetensiHari);
      const tempId = uid('ar');

      const siswaId = currentUser?.siswaId ?? 'unknown';
      const siswaName = currentUser?.name ?? 'Siswa';

      if (isSupabaseConfigured && currentUser?.role === 'siswa') {
        const payload = {
          siswa_id: siswaId,
          siswa_name: siswaName,
          nomor_dokumen: data.nomorDokumen,
          nama_berkas: data.namaBerkas,
          jenis_dokumen: data.jenisDokumen,
          pengirim: data.pengirim,
          penerima: data.penerima,
          perihal: data.perihal,
          lampiran: data.lampiran,
          isi_ringkas: data.isiRingkas,
          tembusan: data.tembusan,
          file_name: data.file?.name ?? null,
          file_size: data.file?.size ?? null,
          file_type: data.file?.type ?? null,
          file_data_url: data.file?.dataUrl ?? null,
          subjek: data.subjek,
          bulan: data.bulan,
          tanggal: now.toISOString(),
          masa_retensi_hari: data.masaRetensiHari,
          tanggal_retensi: retDate.toISOString(),
          status: 'aktif',
          aksi_penyusutan: null,
          tanggal_aksi: null,
          catatan_guru: '',
          nilai: '',
          nilai_angka: null,
        };

        const { data: inserted, error } = await supabase
          .from('arsip')
          .insert(payload)
          .select()
          .single();

        if (error || !inserted) {
          console.error('Error inserting arsip to Supabase:', error);
          throw new Error(error?.message || 'Gagal menyimpan arsip ke database Supabase.');
        }

        const newArsip = mapRowToArsip(inserted);
        skipNextStorageEvent.current = true;
        setState((prev) => ({
          ...prev,
          arsip: [newArsip, ...prev.arsip.filter((a) => a.id !== newArsip.id)],
        }));
        return newArsip;
      }

      // Offline / Local fallback if Supabase is not configured
      const fallbackArsip: Arsip = {
        id: tempId,
        siswaId,
        siswaName,
        nomorDokumen: data.nomorDokumen,
        namaBerkas: data.namaBerkas,
        jenisDokumen: data.jenisDokumen,
        pengirim: data.pengirim,
        penerima: data.penerima,
        perihal: data.perihal,
        lampiran: data.lampiran,
        isiRingkas: data.isiRingkas,
        tembusan: data.tembusan,
        file: data.file,
        subjek: data.subjek,
        bulan: data.bulan,
        tanggal: now.toISOString(),
        masaRetensiHari: data.masaRetensiHari,
        tanggalRetensi: retDate.toISOString(),
        status: 'aktif',
        aksiPenyusutan: null,
        tanggalAksi: null,
        catatanGuru: '',
        nilai: '',
        nilaiAngka: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      skipNextStorageEvent.current = true;
      setState((prev) => ({ ...prev, arsip: [fallbackArsip, ...prev.arsip] }));
      return fallbackArsip;
    },
    [currentUser]
  );

  const updateArsip = useCallback(async (id: string, patch: Partial<Arsip>) => {
    const nowIso = new Date().toISOString();
    skipNextStorageEvent.current = true;
    setState((prev) => ({
      ...prev,
      arsip: prev.arsip.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: nowIso } : a
      ),
    }));

    if (isSupabaseConfigured) {
      const dbPatch: any = {};
      if (patch.subjek !== undefined) dbPatch.subjek = patch.subjek;
      if (patch.bulan !== undefined) dbPatch.bulan = patch.bulan;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.aksiPenyusutan !== undefined) dbPatch.aksi_penyusutan = patch.aksiPenyusutan;
      if (patch.tanggalAksi !== undefined) dbPatch.tanggal_aksi = patch.tanggalAksi;
      if (patch.catatanGuru !== undefined) dbPatch.catatan_guru = patch.catatanGuru;
      if (patch.nilai !== undefined) dbPatch.nilai = patch.nilai;
      if (patch.nilaiAngka !== undefined) dbPatch.nilai_angka = patch.nilaiAngka;

      if (Object.keys(dbPatch).length > 0) {
        dbPatch.updated_at = nowIso;
        const { error } = await supabase.from('arsip').update(dbPatch).eq('id', id);
        if (error) {
          console.error('Error updating arsip in Supabase:', error);
        }
      }
    }
  }, []);

  const deleteArsip = useCallback(async (id: string) => {
    skipNextStorageEvent.current = true;
    setState((prev) => ({ ...prev, arsip: prev.arsip.filter((a) => a.id !== id) }));
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('arsip').delete().eq('id', id);
      if (error) {
        console.error('Error deleting arsip in Supabase:', error);
      }
    }
  }, []);

  const setAksiPenyusutan = useCallback(
    async (id: string, aksi: 'pindah_inaktif' | 'antre_pemusnahan') => {
      const newStatus: RetensiStatus =
        aksi === 'pindah_inaktif' ? 'inaktif' : 'antre_pemusnahan';
      const nowIso = new Date().toISOString();
      skipNextStorageEvent.current = true;
      setState((prev) => ({
        ...prev,
        arsip: prev.arsip.map((a) =>
          a.id === id
            ? {
                ...a,
                aksiPenyusutan: aksi,
                status: newStatus,
                tanggalAksi: nowIso,
                updatedAt: nowIso,
              }
            : a
        ),
      }));

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('arsip')
          .update({
            status: newStatus,
            aksi_penyusutan: aksi,
            tanggal_aksi: nowIso,
            updated_at: nowIso,
          })
          .eq('id', id);
        if (error) {
          console.error('Error updating status retensi in Supabase:', error);
        }
      }
    },
    []
  );

  const prosesPemusnahan = useCallback(async (id: string) => {
    const nowIso = new Date().toISOString();
    skipNextStorageEvent.current = true;
    setState((prev) => ({
      ...prev,
      arsip: prev.arsip.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'dimusnahkan',
              aksiPenyusutan: 'antre_pemusnahan',
              tanggalAksi: nowIso,
              updatedAt: nowIso,
            }
          : a
      ),
    }));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('arsip')
        .update({
          status: 'dimusnahkan',
          aksi_penyusutan: 'antre_pemusnahan',
          tanggal_aksi: nowIso,
          updated_at: nowIso,
        })
        .eq('id', id);
      if (error) {
        console.error('Error processing pemusnahan in Supabase:', error);
      }
    }
  }, []);

  const setNilai = useCallback(
    async (id: string, nilaiAngka: number | null, catatan: string) => {
      const nowIso = new Date().toISOString();
      const nilaiHuruf = getNilaiHuruf(nilaiAngka);
      skipNextStorageEvent.current = true;
      setState((prev) => ({
        ...prev,
        arsip: prev.arsip.map((a) =>
          a.id === id
            ? {
                ...a,
                nilaiAngka,
                nilai: nilaiHuruf,
                catatanGuru: catatan,
                updatedAt: nowIso,
              }
            : a
        ),
      }));

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('arsip')
          .update({
            nilai_angka: nilaiAngka,
            nilai: nilaiHuruf,
            catatan_guru: catatan,
            updated_at: nowIso,
          })
          .eq('id', id);
        if (error) {
          console.error('Error updating nilai in Supabase:', error);
        }
      }
    },
    []
  );

  const getArsipBySiswa = useCallback(
    (siswaId: string) => state.arsip.filter((a) => a.siswaId === siswaId),
    [state.arsip]
  );

  // Recompute statuses on load
  useEffect(() => {
    setState((prev) => {
      let changed = false;
      const updated = prev.arsip.map((a) => {
        const ns = computeRetensiStatus(a.status, a.tanggalRetensi);
        if (ns !== a.status) {
          changed = true;
          return { ...a, status: ns };
        }
        return a;
      });
      if (!changed) return prev;
      return { ...prev, arsip: updated };
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      arsip: state.arsip,
      siswaList: state.siswaList,
      currentUser,
      login,
      logout,
      setViewMode,
      addArsip,
      updateArsip,
      deleteArsip,
      setAksiPenyusutan,
      prosesPemusnahan,
      setNilai,
      getArsipBySiswa,
      refreshData: fetchSupabaseData,
      lastSync,
    }),
    [
      state.arsip,
      state.siswaList,
      currentUser,
      login,
      logout,
      setViewMode,
      addArsip,
      updateArsip,
      deleteArsip,
      setAksiPenyusutan,
      prosesPemusnahan,
      setNilai,
      getArsipBySiswa,
      fetchSupabaseData,
      lastSync,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
