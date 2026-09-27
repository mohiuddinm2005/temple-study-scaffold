import { useEffect, useState } from 'react';
import { apiFetch } from './api/client';
import AssignmentsView from './components/AssignmentsView';
import AuthForms from './components/AuthForms';
import DashboardView from './components/DashboardView';
import GradeScenario from './components/GradeScenario';
import Sidebar, { type View } from './layout/Sidebar';
import Topbar from './layout/Topbar';
import type { EventResponse, UserSummary } from './types';

export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [events, setEvents] = useState<EventResponse | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [notice, setNotice] = useState('');

  async function loadEvents() {
    const response = await apiFetch('/api/assignments', { cache: 'no-store' });
    if (response.ok) setEvents((await response.json()) as EventResponse);
  }

  async function checkSession() {
    const response = await apiFetch('/api/auth/me', { cache: 'no-store' });
    if (response.ok) {
      const data = (await response.json()) as { user: UserSummary };
      setUser(data.user);
      await loadEvents();
    } else {
      setUser(null);
      setEvents(null);
    }
  }

  useEffect(() => {
    checkSession().finally(() => setChecking(false));
  }, []);

  async function handleSignedIn() {
    await checkSession();
    setView('dashboard');
  }

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setEvents(null);
    setView('dashboard');
  }

  function handleSynced(message: string) {
    setNotice(message);
    loadEvents();
  }

  if (checking) return null;
  if (!user) return <AuthForms onSignedIn={handleSignedIn} />;

  const assignments = events?.assignments ?? [];

  return (
    <>
      <Sidebar view={view} onNavigate={setView} onLogout={handleLogout} />
      <div className="page">
        <Topbar email={user.email} />
        {notice && <p role="status">{notice}</p>}
        {view === 'dashboard' && <DashboardView user={user} events={events} onSynced={handleSynced} />}
        {view === 'assignments' && <AssignmentsView assignments={assignments} />}
        {view === 'grades' && <GradeScenario />}
      </div>
    </>
  );
}