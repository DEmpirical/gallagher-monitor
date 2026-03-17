import { useState, useEffect } from 'react';
import ConfigPage from '@/pages/ConfigPage';
import Dashboard from '@/pages/Dashboard';
import CardholdersPage from '@/pages/CardholdersPage';
import { api } from '@/services/api';

type Page = 'dashboard' | 'cardholders';

function App() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await api.get('/config');
        setConfigured(res.data.isConfigured);
      } catch (e) {
        setConfigured(false);
      }
    };
    checkConfig();
  }, []);

  if (configured === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Verificando configuración...</div>
      </div>
    );
  }

  if (!configured) {
    return <ConfigPage onSaved={() => setConfigured(true)} />;
  }

  return (
    <div>
      {/* Navbar simple */}
      <nav className="bg-gray-800 text-white p-2 flex gap-4">
        <button onClick={() => setPage('dashboard')} className={`hover:underline ${page === 'dashboard' ? 'font-bold' : ''}`}>Dashboard</button>
        <button onClick={() => setPage('cardholders')} className={`hover:underline ${page === 'cardholders' ? 'font-bold' : ''}`}>Cardholders</button>
      </nav>
      {page === 'dashboard' && <Dashboard />}
      {page === 'cardholders' && <CardholdersPage />}
    </div>
  );
}

export default App;
