import { AlarmRecord } from '@/types';

interface Props {
  alarms: AlarmRecord[];
  onAck: (id: string) => void;
  onClear: (id: string) => void;
}

const stateColors: Record<AlarmRecord['state'], string> = {
  active: 'bg-red-100 text-red-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  cleared: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-800',
};

const AlarmTable = ({ alarms, onAck, onClear }: Props) => {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensaje</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuente</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {alarms.map((alarm) => (
            <tr key={alarm.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(alarm.createdTime).toLocaleTimeString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate" title={alarm.message}>
                {alarm.message}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {alarm.priority}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stateColors[alarm.state]}`}>
                  {alarm.state}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div>{alarm.source.name}</div>
                <div className="text-xs text-gray-400">{alarm.source.id}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                {alarm.state === 'active' && (
                  <button onClick={() => onAck(alarm.id)} className="text-yellow-600 hover:underline">
                    Ack
                  </button>
                )}
                {(alarm.state === 'active' || alarm.state === 'acknowledged') && (
                  <button onClick={() => onClear(alarm.id)} className="text-green-600 hover:underline">
                    Clear
                  </button>
                )}
              </td>
            </tr>
          ))}
          {alarms.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No hay alarmas
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AlarmTable;
