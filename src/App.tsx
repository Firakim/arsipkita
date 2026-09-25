import { AppProvider, useApp } from './AppContext';
import LoginPage from './pages/LoginPage';
import SiswaApp from './pages/SiswaApp';
import GuruApp from './pages/GuruApp';

function Router() {
  const { currentUser } = useApp();

  if (!currentUser) return <LoginPage />;

  // Guru can toggle view mode between guru and siswa
  if (currentUser.role === 'guru') {
    return currentUser.viewMode === 'siswa' ? <SiswaApp /> : <GuruApp />;
  }

  // Siswa only sees siswa app
  return <SiswaApp />;
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
