import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '@/services/api';

interface Config {
  host: string;
  strictSsl: boolean;
  timeout: number;
  pollInterval: number;
  defaultFields: string;
}

const ConfigPage = ({ onSaved }: { onSaved: () => void }) => {
  const [config, setConfig] = useState<Config>({
    host: '',
    strictSsl: true,
    timeout: 30000,
    pollInterval: 15000,
    defaultFields: 'defaults,source,eventType,division,cardholder,priority,occurrences',
  });
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [existingApiKeyMasked, setExistingApiKeyMasked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Fetch existing config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/config');
        const data = res.data;
        if (data.isConfigured) {
          setConfig({
            host: data.gallagher.host,
            strictSsl: data.gallagher.strictSsl,
            timeout: data.gallagher.timeout,
            pollInterval: data.gallagher.pollInterval,
            defaultFields: data.gallagher.defaultFields,
          });
          setExistingApiKeyMasked(data.gallagher.apiKeyMasked);
        }
      } catch (e) {
        // ignore if not configured
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError(null);
    setMessage(null);
  };

  const testConnection = async () => {
    const payloadApiKey = apiKeyInput || (existingApiKeyMasked ? existingApiKeyMasked.replace(/\*/g, '') : '');
    if (!config.host || !payloadApiKey) {
      setError('Host y API Key son obligatorios');
      return;
    }
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await axios.post('/api/config/test', {
        host: config.host,
        apiKey: payloadApiKey,
        strictSsl: config.strictSsl,
      }, {
        headers: { 'X-Internal-Token': import.meta.env.VITE_INTERNAL_TOKEN },
      });
      if (res.data.success) {
        setMessage('✅ Conexión exitosa con Gallagher');
      } else {
        setError(`❌ ${res.data.error}`);
      }
    } catch (e: any) {
      const err = e.response?.data?.error || e.message;
      setError(`❌ ${err}`);
    } finally {
      setTesting(false);
    }
  };

  const saveConfig = async () => {
    if (!config.host) {
      setError('Host es obligatorio');
      return;
    }
    if (!apiKeyInput && !existingApiKeyMasked) {
      setError('API Key es obligatoria');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const payload: any = {
        gallagher: {
          host: config.host,
          strictSsl: config.strictSsl,
          timeout: Number(config.timeout),
          pollInterval: Number(config.pollInterval),
          defaultFields: config.defaultFields,
        },
      };
      if (apiKeyInput) {
        payload.gallagher.apiKey = apiKeyInput;
      }
      await axios.post('/api/config', payload, {
        headers: { 'X-Internal-Token': import.meta.env.VITE_INTERNAL_TOKEN },
      });
      setMessage('✅ Configuración guardada');
      setExistingApiKeyMasked('••••••••••••••••'); // approximate mask
      setApiKeyInput('');
      setTimeout(() => onSaved(), 1000);
    } catch (e: any) {
      setError(`❌ ${e.response?.data?.error || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">Configuración de Gallagher</h1>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
        {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{message}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Host (URL)</label>
            <input
              type="text"
              name="host"
              value={config.host}
              onChange={handleChange}
              placeholder="https://gallagher-server:8443"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              API Key
              {existingApiKeyMasked && (
                <span className="ml-2 text-xs font-mono text-gray-500">(actual: {existingApiKeyMasked})</span>
              )}
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="ml-2 text-xs text-gray-500 underline"
              >
                {showApiKey ? 'Ocultar' : 'Mostrar'}
              </button>
            </label>
            <input
              type={showApiKey ? 'text' : 'password'}
              name="apiKey"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={existingApiKeyMasked ? 'Dejar vacío para mantener la actual' : 'GGL-API-KEY o token'}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="strictSsl"
              checked={config.strictSsl}
              onChange={handleChange}
              className="rounded border-gray-300"
            />
            <label className="text-sm font-medium text-gray-700">Validar certificado SSL</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Timeout (ms)</label>
              <input
                type="number"
                name="timeout"
                value={config.timeout}
                onChange={handleChange}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Polling interval (ms)</label>
              <input
                type="number"
                name="pollInterval"
                value={config.pollInterval}
                onChange={handleChange}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default fields (para eventos)
            </label>
            <input
              type="text"
              name="defaultFields"
              value={config.defaultFields}
              onChange={handleChange}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm border p-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Campos separados por coma que se piden por defecto en eventos.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={testing || !config.host}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {testing ? 'Probando...' : '🔗 Probar conexión'}
          </button>
          <button
            onClick={saveConfig}
            disabled={loading || !config.host}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : '💾 Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;

