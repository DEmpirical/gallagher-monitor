const LiveIndicator = ({ isLive }: { isLive: boolean }) => (
  <div className="flex items-center gap-2">
    <span
      className={`inline-flex h-3 w-3 items-center justify-center rounded-full ${isLive ? 'bg-green-500' : 'bg-gray-400'}`}
    >
      <span className={`animate-ping h-full w-full rounded-full ${isLive ? 'bg-green-400' : ''}`} />
    </span>
    <span className="text-sm text-gray-600">{isLive ? 'En vivo' : 'Pausado'}</span>
  </div>
);

export default LiveIndicator;
