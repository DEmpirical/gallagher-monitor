import Header from './Header';
import SidebarFilters from './SidebarFilters';
import LiveIndicator from './LiveIndicator';

interface Props {
  children: React.ReactNode;
  live?: boolean;
}

const Layout = ({ children, live = true }: Props) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 pb-8">
        <div className="flex gap-6">
          <aside className="w-80 flex-shrink-0">
            <SidebarFilters />
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-3">Controles</h3>
              <div className="space-x-2">
                <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Actualizar
                </button>
                <button className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600">
                  Pausar
                </button>
              </div>
              <div className="mt-4">
                <LiveIndicator isLive={live} />
              </div>
            </div>
          </aside>
          <section className="flex-1 space-y-6">{children}</section>
        </div>
      </main>
    </div>
  );
};

export default Layout;
