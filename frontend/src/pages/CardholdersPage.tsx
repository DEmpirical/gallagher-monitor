import { useState } from 'react';
import { api } from '@/services/api';

interface Cardholder {
  id: string;
  firstName?: string;
  lastName?: string;
  cardNumber?: string;
  division?: { id: string; name: string };
  status?: string;
  [key: string]: any;
}

export default function CardholdersPage() {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);
  const [cardholders, setCardholders] = useState<Cardholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCardholders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit };
      if (search) params.search = search;
      const res = await api.get('/cardholders', { params });
      setCardholders(res.data.cardholders || []);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Consulta de Cardholders</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, tarjeta, etc."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded flex-grow"
        />
        <input
          type="number"
          placeholder="Límite"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
          className="border p-2 rounded w-24"
        />
        <button
          onClick={fetchCardholders}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Buscar'}
        </button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Apellido</th>
              <th className="border p-2">Tarjeta</th>
              <th className="border p-2">División</th>
              <th className="border p-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cardholders.map((ch) => (
              <tr key={ch.id}>
                <td className="border p-2">{ch.firstName || ''}</td>
                <td className="border p-2">{ch.lastName || ''}</td>
                <td className="border p-2">{ch.cardNumber || ''}</td>
                <td className="border p-2">{ch.division?.name || ''}</td>
                <td className="border p-2">{ch.status || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {cardholders.length === 0 && !loading && (
          <p className="mt-4 text-gray-600">No hay resultados.</p>
        )}
      </div>
    </div>
  );
}
