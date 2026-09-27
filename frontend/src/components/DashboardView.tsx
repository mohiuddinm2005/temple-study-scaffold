import CalendarCard from './CalendarCard';
import CanvasImportPanel from './CanvasImportPanel';
import CoursesSection from './CoursesSection';
import StatsSection from './StatsSection';
import StudyPlan from './StudyPlan';
import UpcomingAssignments from './UpcomingAssignments';
import WelcomeCard from './WelcomeCard';
import type { EventResponse, UserSummary } from '../types';

export default function DashboardView({
  user,
  events,
  onSynced,
}: {
  user: UserSummary;
  events: EventResponse | null;
  onSynced: (message: string) => void;
}) {
  const assignments = events?.assignments ?? [];

  return (
    <div className="dashboard-layout">
      <div className="dashboard-main">
        <WelcomeCard email={user.email} dueCount={assignments.length} />
        <CoursesSection assignments={assignments} />
        <StatsSection assignments={assignments} />
        <CanvasImportPanel events={events} onSynced={onSynced} />
        {assignments.length > 0 && <StudyPlan assignments={assignments} />}
      </div>
      <div className="dashboard-right">
        <CalendarCard assignments={assignments} />
        <UpcomingAssignments assignments={assignments} />
      </div>
    </div>
  );
}