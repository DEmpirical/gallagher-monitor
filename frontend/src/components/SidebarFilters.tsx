import { useFiltersStore } from '@/store/filtersStore';

const SidebarFilters = () => {
  const { filters, setFilter, clearFilters } = useFiltersStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(name as any, value || undefined);
  };

  return (
    <aside className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Filtros</h2>
        <button onClick={clearFilters} className="text-sm text-red-600 hover:underline">
          Limpiar
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Búsqueda</label>
        <input
          type="text"
          name="searchText"
          value={filters.searchText || ''}
          onChange={handleChange}
          placeholder="Texto en mensaje..."
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">División</label>
        <input
          type="text"
          name="division"
          value={filters.division || ''}
          onChange={handleChange}
          placeholder="ID o nombre..."
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Source (item)</label>
        <input
          type="text"
          name="source"
          value={filters.source || ''}
          onChange={handleChange}
          placeholder="ID o nombre..."
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Event Type</label>
        <input
          type="text"
          name="eventType"
          value={filters.eventType || ''}
          onChange={handleChange}
          placeholder="ID o nombre..."
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Cardholder</label>
        <input
          type="text"
          name="cardholder"
          value={filters.cardholder || ''}
          onChange={handleChange}
          placeholder="ID o nombre..."
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Límite</label>
        <input
          type="number"
          name="top"
          value={filters.top || 100}
          onChange={handleChange}
          min={1}
          max={1000}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
        />
      </div>
    </aside>
  );
};

export default SidebarFilters;
