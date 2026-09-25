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
  uid,
} from './lib/storage';
import { supabase } from './lib/supabase';

interface PersistedState {
  arsip: Arsip[];
  siswaList: Siswa[];
  currentUserId: string | null;
}

interface AppContextValue {
  arsip: Arsip[];
  siswaList: Siswa[];
  currentUser: AuthUser | null;
  login: (role: 'siswa' | 'guru', accessCode: string, name: string, kelas?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setViewMode: (mode: 'siswa' | 'guru') => void;
  addArsip: (data: ArsipInput) => Arsip;
  updateArsip: (id: string, patch: Partial<Arsip>) => void;
  deleteArsip: (id: string) => void;
  setAksiPenyusutan: (id: string, aksi: 'pindah_inaktif' | 'antre_pemusnahan') => void;
  prosesPemusnahan: (id: string) => void;
  setNilai: (id: string, nilaiAngka: number | null, catatan: string) => void;
  getArsipBySiswa: (siswaId: string) => Arsip[];
  lastSync: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const SISWA_CODE = 'SISWA123';
const GURU_CODE = 'GURU123';

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      return {
        arsip: parsed.arsip ?? [],
        siswaList: parsed.siswaList ?? [],
        currentUserId: parsed.currentUserId ?? null,
      };
    }
  } catch {
    // ignore
  }
  return { arsip: [], siswaList: [], currentUserId: null };
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [lastSync, setLastSync] = useState<number>(Date.now());
  const skipNextStorageEvent = useRef(false);
  const lastSaveRevRef = useRef<number>(0);

  // Persist on change
  useEffect(() => {
    lastSaveRevRef.current = saveState(state);
  }, [state]);

  // Cross-tab / cross-view real-time sync via storage event
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
        // Skip stale snapshots — our state is at least as new
        if (incomingRev <= lastSaveRevRef.current) return;
        setState((prev) => ({
          arsip: parsed.arsip ?? prev.arsip,
          siswaList: parsed.siswaList ?? prev.siswaList,
          currentUserId: parsed.currentUserId ?? prev.currentUserId,
        }));
        setLastSync(Date.now());
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Also poll periodically for same-tab updates (e.g. siswa & guru in same tab via view toggle).
  // Skips stale snapshots to prevent overwriting newer in-memory state.
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as PersistedState & { _rev?: number };
        const incomingRev = parsed._rev ?? 0;
        // Skip if our state is at least as new as what's in localStorage
        if (incomingRev <= lastSaveRevRef.current) return;
        setState((prev) => {
          const same =
            JSON.stringify(prev.arsip) === JSON.stringify(parsed.arsip ?? prev.arsip) &&
            JSON.stringify(prev.siswaList) === JSON.stringify(parsed.siswaList ?? prev.siswaList);
          if (same) return prev;
          return {
            arsip: parsed.arsip ?? prev.arsip,
            siswaList: parsed.siswaList ?? prev.siswaList,
            currentUserId: parsed.currentUserId ?? prev.currentUserId,
          };
        });
        setLastSync(Date.now());
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const login = useCallback<AppContextValue['login']>(
    async (role, accessCode, name, kelas) => {
      if (!name.trim()) return { ok: false, error: 'Nama wajib diisi.' };
      if (role === 'siswa') {
        if (accessCode.trim().toUpperCase() !== SISWA_CODE)
          return { ok: false, error: 'Kode akses siswa salah.' };

        const trimmedName = name.trim();
        const trimmedKelas = (kelas ?? '').trim() || '-';

        // Look up existing siswa in Supabase by name + kelas
        const { data: existing, error: lookupError } = await supabase
          .from('siswa')
          .select('id, name, kelas')
          .eq('name', trimmedName)
          .eq('kelas', trimmedKelas)
          .maybeSingle();

        if (lookupError) {
          return { ok: false, error: 'Gagal terhubung ke server. Coba lagi.' };
        }

        let siswaId: string;
        let siswaName: string;

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
            return { ok: false, error: 'Gagal membuat data siswa. Coba lagi.' };
          }

          siswaId = created.id;
          siswaName = created.name;
        }

        const siswaEntry: Siswa = {
          id: siswaId,
          name: siswaName,
          kelas: trimmedKelas,
        };

        skipNextStorageEvent.current = true;
        setState((prev) => {
          // Find old sw_... entries with same name + kelas to migrate
          const oldSiswaIds = prev.siswaList
            .filter(
              (s) =>
                s.id !== siswaId &&
                s.name === trimmedName &&
                s.kelas === trimmedKelas
            )
            .map((s) => s.id);

          // Migrate arsip: reassign old siswaId → Supabase UUID
          let migratedArsip = prev.arsip;
          if (oldSiswaIds.length > 0) {
            migratedArsip = prev.arsip.map((a) =>
              oldSiswaIds.includes(a.siswaId)
                ? { ...a, siswaId: siswaId }
                : a
            );
          }

          // Remove old sw_... duplicates and the Supabase entry, then add the clean one
          const cleanedSiswaList = prev.siswaList.filter(
            (s) =>
              s.id !== siswaId &&
              !oldSiswaIds.includes(s.id)
          );

          return {
            ...prev,
            arsip: migratedArsip,
            siswaList: [...cleanedSiswaList, siswaEntry],
            currentUserId: siswaId,
          };
        });
        setCurrentUser({ role: 'siswa', name: siswaName, siswaId, viewMode: 'siswa' });
        return { ok: true };
      }
      // guru
      if (accessCode.trim().toUpperCase() !== GURU_CODE)
        return { ok: false, error: 'Kode akses guru salah.' };
      const guruId = uid('gr');
      skipNextStorageEvent.current = true;
      setState((prev) => ({ ...prev, currentUserId: guruId }));
      setCurrentUser({ role: 'guru', name: name.trim(), viewMode: 'guru' });
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    skipNextStorageEvent.current = true;
    setState((prev) => ({ ...prev, currentUserId: null }));
    setCurrentUser(null);
  }, []);

  const setViewMode = useCallback((mode: 'siswa' | 'guru') => {
    setCurrentUser((u) => (u ? { ...u, viewMode: mode } : u));
  }, []);

  const addArsip = useCallback<AppContextValue['addArsip']>((data: ArsipInput) => {
    const now = new Date();
    const retDate = new Date(now);
    retDate.setDate(retDate.getDate() + data.masaRetensiHari);
    const id = uid('ar');
    const newArsip: Arsip = {
      id,
      siswaId: currentUser?.siswaId ?? 'unknown',
      siswaName: currentUser?.name ?? 'Siswa',
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
    setState((prev) => ({ ...prev, arsip: [newArsip, ...prev.arsip] }));
    return newArsip;
  }, [currentUser]);

  const updateArsip = useCallback((id: string, patch: Partial<Arsip>) => {
    skipNextStorageEvent.current = true;
    setState((prev) => ({
      ...prev,
      arsip: prev.arsip.map((a) =>
        a.id === id
          ? { ...a, ...patch, updatedAt: new Date().toISOString() }
          : a
      ),
    }));
  }, []);

  const deleteArsip = useCallback((id: string) => {
    skipNextStorageEvent.current = true;
    setState((prev) => ({ ...prev, arsip: prev.arsip.filter((a) => a.id !== id) }));
  }, []);

  const setAksiPenyusutan = useCallback(
    (id: string, aksi: 'pindah_inaktif' | 'antre_pemusnahan') => {
      const newStatus: RetensiStatus =
        aksi === 'pindah_inaktif' ? 'inaktif' : 'antre_pemusnahan';
      skipNextStorageEvent.current = true;
      setState((prev) => ({
        ...prev,
        arsip: prev.arsip.map((a) =>
          a.id === id
            ? {
                ...a,
                aksiPenyusutan: aksi,
                status: newStatus,
                tanggalAksi: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : a
        ),
      }));
    },
    []
  );

  const prosesPemusnahan = useCallback((id: string) => {
    skipNextStorageEvent.current = true;
    setState((prev) => ({
      ...prev,
      arsip: prev.arsip.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'dimusnahkan',
              aksiPenyusutan: 'antre_pemusnahan',
              tanggalAksi: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));
  }, []);

  const setNilai = useCallback(
    (id: string, nilaiAngka: number | null, catatan: string) => {
      skipNextStorageEvent.current = true;
      setState((prev) => ({
        ...prev,
        arsip: prev.arsip.map((a) =>
          a.id === id
            ? {
                ...a,
                nilaiAngka,
                catatanGuru: catatan,
                updatedAt: new Date().toISOString(),
              }
            : a
        ),
      }));
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
