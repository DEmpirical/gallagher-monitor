import { useState } from 'react';
import Layout from '@/components/Layout';
import AlarmTable from '@/components/AlarmTable';
import EventTable from '@/components/EventTable';
import { useGallagherAlarms } from '@/hooks/useGallagherAlarms';
import { useGallagherEvents } from '@/hooks/useGallagherEvents';

type Tab = 'alarms' | 'events';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('alarms');
  const { alarms, loading: alarmsLoading, error: alarmsError, acknowledge, clear } = useGallagherAlarms();
  const { events, loading: eventsLoading, error: eventsError } = useGallagherEvents();

  return (
    <Layout live>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('alarms')}
            className={`px-3 py-2 rounded ${activeTab === 'alarms' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Alarmas ({alarms.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-2 rounded ${activeTab === 'events' ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:text-blue-600'}`}
          >
            Eventos ({events.length})
          </button>
        </nav>
      </div>

      {activeTab === 'alarms' && (
        <>
          {alarmsError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">Error: {alarmsError}</div>}
          <AlarmTable alarms={alarms} onAck={acknowledge} onClear={clear} />
        </>
      )}

      {activeTab === 'events' && (
        <>
          {eventsError && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">Error: {eventsError}</div>}
          <EventTable events={events} />
        </>
      )}
    </Layout>
  );
}
