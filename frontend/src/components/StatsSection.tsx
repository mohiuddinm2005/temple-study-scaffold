import type { Assignment } from '../types';

export default function StatsSection({ assignments }: { assignments: Assignment[] }) {
  const now = Date.now();
  const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

  const dueThisWeek = assignments.filter((assignment) => {
    const due = new Date(assignment.dueAt).getTime();
    return due >= now && due <= weekFromNow;
  }).length;

  const completed = assignments.filter((assignment) => assignment.completed).length;

  return (
    <section className="stats">
      <div className="stat-card">
        <p>Imported items</p>
        <h2>{assignments.length}</h2>
        <span>From your Canvas calendar</span>
      </div>
      <div className="stat-card">
        <p>Due this week</p>
        <h2>{dueThisWeek}</h2>
        <span>Next 7 days</span>
      </div>
      <div className="stat-card">
        <p>Completed</p>
        <h2>{completed}</h2>
        <span>Marked done</span>
      </div>
    </section>
  );
}