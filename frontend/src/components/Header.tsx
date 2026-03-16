const Header = () => {
  return (
    <header className="bg-white shadow mb-6">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallagher Monitor</h1>
          <p className="text-sm text-gray-600">Real-time alarms & events</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="w-2 h-2 mr-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
