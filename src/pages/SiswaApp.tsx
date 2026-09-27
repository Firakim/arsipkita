import { useState } from 'react';
import {
  ScanLine,
  FolderTree,
  Hourglass,
  Trash2,
  Award,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { STAGE_META, type StageKey } from '../types';
import DigitalisasiPage from './siswa/DigitalisasiPage';
import PenyimpananPage from './siswa/PenyimpananPage';
import PenyusutanPage from './siswa/PenyusutanPage';
import PemusnahanPage from './siswa/PemusnahanPage';
import HasilPenilaianPage from './siswa/HasilPenilaianPage';

const STAGES: StageKey[] = ['digitalisasi', 'penyimpanan', 'penyusutan', 'pemusnahan', 'penilaian'];

const ICONS = {
  digitalisasi: ScanLine,
  penyimpanan: FolderTree,
  penyusutan: Hourglass,
  pemusnahan: Trash2,
  penilaian: Award,
};

export default function SiswaApp() {
  const [active, setActive] = useState<StageKey>('digitalisasi');
  const meta = STAGE_META[active];

  const navItems = STAGES.map((s) => {
    const Icon = ICONS[s];
    return {
      key: s,
      label: STAGE_META[s].label,
      icon: <Icon className="w-4 h-4" />,
    };
  });

  return (
    <AppShell
      navItems={navItems}
      activeKey={active}
      onNavigate={(k) => setActive(k as StageKey)}
      title={meta.label}
      subtitle={meta.desc}
    >
      {active === 'digitalisasi' && <DigitalisasiPage />}
      {active === 'penyimpanan' && <PenyimpananPage />}
      {active === 'penyusutan' && <PenyusutanPage />}
      {active === 'pemusnahan' && <PemusnahanPage />}
      {active === 'penilaian' && <HasilPenilaianPage />}
    </AppShell>
  );
}
