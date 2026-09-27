import AssignmentRow from './AssignmentRow';
import type { Assignment } from '../types';

export default function AssignmentsView({ assignments }: { assignments: Assignment[] }) {
  const sorted = [...assignments].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2>All assignments</h2>
          <p>{sorted.length} imported from your Canvas calendar</p>
        </div>
      </div>
      <div className="assignments-panel">
        {sorted.length ? (
          sorted.map((assignment) => <AssignmentRow key={assignment.id} assignment={assignment} />)
        ) : (
          <p className="empty-state">Nothing imported yet. Go to Dashboard to add your Canvas feed.</p>
        )}
      </div>
    </div>
  );
}