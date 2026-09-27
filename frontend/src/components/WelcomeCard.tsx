export default function WelcomeCard({ email, dueCount }: { email: string; dueCount: number }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="welcome-card">
      <p className="date">{today}</p>
      <h1>Welcome back, {email.split('@')[0]}</h1>
      <p className="welcome-message">
        {dueCount > 0
          ? `You have ${dueCount} upcoming ${dueCount === 1 ? 'assignment' : 'assignments'} from your Canvas calendar.`
          : 'No upcoming assignments yet — import your Canvas calendar to get started.'}
      </p>
    </section>
  );
}