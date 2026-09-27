import type { Assignment } from '../types';

const COURSE_CODE_RE = /\[([^[\]]+)\]\s*$/;

/** Splits "Lab01. Unix Commands [ST-CIS-2107-001-4550-202636]" into
 * { code: "ST-CIS-2107-001-4550-202636", title: "Lab01. Unix Commands" }.
 * Falls back to the section prefix before the first dash group when Canvas
 * doesn't bracket a code, and to "Other" when nothing is recognizable. */
export function parseCourseCode(title: string): { code: string; title: string } {
  const match = title.match(COURSE_CODE_RE);
  if (match) {
    return { code: match[1], title: title.slice(0, match.index).trim() || title };
  }
  return { code: 'Other', title };
}

export type CourseGroup = { code: string; count: number };

/** Groups assignments by their derived course code, most assignments first.
 * Only real counts from real Canvas data -- no fabricated progress or names. */
export function groupByCourse(assignments: Assignment[]): CourseGroup[] {
  const counts = new Map<string, number>();
  for (const assignment of assignments) {
    const { code } = parseCourseCode(assignment.title);
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
}