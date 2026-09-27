import { useMemo, useState } from 'react';
import type { Assignment } from '../types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarCard({ assignments }: { assignments: Assignment[] }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const dueDays = useMemo(() => {
    const set = new Set<string>();
    for (const assignment of assignments) {
      const due = new Date(assignment.dueAt);
      set.add(`${due.getFullYear()}-${due.getMonth()}-${due.getDate()}`);
    }
    return set;
  }, [assignments]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button type="button" className="calendar-arrow" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          ‹
        </button>
        <h3>{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
        <button type="button" className="calendar-arrow" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          ›
        </button>
      </div>
      <div className="calendar-weekdays">
        {WEEKDAYS.map((day, index) => (
          <span key={index}>{day}</span>
        ))}
      </div>
      <div className="calendar-days">
        {cells.map((day, index) => {
          if (day === null) return <span key={index} className="empty" />;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const hasDue = dueDays.has(`${year}-${month}-${day}`);
          return (
            <span key={index} className={`${isToday ? 'today ' : ''}${hasDue ? 'has-due' : ''}`}>
              {day}
            </span>
          );
        })}
      </div>
    </div>
  );
}