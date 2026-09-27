import AssignmentRow from './AssignmentRow';
import type { Assignment } from '../types';

export default function UpcomingAssignments({ assignments }: { assignments: Assignment[] }) {
  const upcoming = [...assignments]
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 5);

  return (
    <section className="overview-section">
      <div className="section-title">
        <h2>Upcoming</h2>
      </div>
      <div className="assignments-panel">
        {upcoming.length ? (
          upcoming.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} />)
        ) : (
          <p className="empty-state">Nothing imported yet.</p>
        )}
      </div>
    </section>
  );
}