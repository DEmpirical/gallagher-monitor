import { useState, useEffect } from 'react';
import ConfigPage from '@/pages/ConfigPage';
import Dashboard from '@/pages/Dashboard';
import { api } from '@/services/api';

function App() {
  const [configured, setConfigured] = useState<boolean | null>(null);

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

  return <Dashboard />;
}

export default App;
