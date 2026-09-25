import { useState } from 'react';
import { Activity, ClipboardList, Star } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import MonitoringPage from './guru/MonitoringPage';
import LembarKerjaPage from './guru/LembarKerjaPage';
import PenilaianPage from './guru/PenilaianPage';

type GuruPage = 'monitoring' | 'lembar' | 'penilaian';

const PAGES: { key: GuruPage; label: string; desc: string }[] = [
  { key: 'monitoring', label: 'Monitoring', desc: 'Pantau progres siswa real-time' },
  { key: 'lembar', label: 'Lembar Kerja Siswa', desc: 'Tabel hasil input arsip siswa' },
  { key: 'penilaian', label: 'Penilaian', desc: 'Koreksi & berikan nilai siswa' },
];

const ICONS = {
  monitoring: Activity,
  lembar: ClipboardList,
  penilaian: Star,
};

export default function GuruApp() {
  const [active, setActive] = useState<GuruPage>('monitoring');
  const meta = PAGES.find((p) => p.key === active)!;

  const navItems = PAGES.map((p) => {
    const Icon = ICONS[p.key];
    return { key: p.key, label: p.label, icon: <Icon className="w-4 h-4" /> };
  });

  return (
    <AppShell
      navItems={navItems}
      activeKey={active}
      onNavigate={(k) => setActive(k as GuruPage)}
      title={meta.label}
      subtitle={meta.desc}
    >
      {active === 'monitoring' && <MonitoringPage />}
      {active === 'lembar' && <LembarKerjaPage />}
      {active === 'penilaian' && <PenilaianPage />}
    </AppShell>
  );
}
