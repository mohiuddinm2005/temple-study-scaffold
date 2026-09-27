import { groupByCourse } from '../lib/course';
import type { Assignment } from '../types';

export default function CoursesSection({ assignments }: { assignments: Assignment[] }) {
  const courses = groupByCourse(assignments);

  if (!courses.length) return null;

  return (
    <section className="courses-section">
      <h2>My courses</h2>
      <div className="courses-container">
        {courses.slice(0, 6).map((course) => (
          <article key={course.code} className="course-card">
            <h3>{course.code}</h3>
            <p className="course-count">
              {course.count} imported {course.count === 1 ? 'item' : 'items'}
            </p>
            <span className="course-badge">From Canvas</span>
          </article>
        ))}
      </div>
    </section>
  );
}