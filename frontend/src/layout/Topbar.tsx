export default function Topbar({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <header className="topbar">
      <div />
      <div className="profile">
        <div className="avatar">{initials}</div>
        <div className="profile-info">
          <strong>{email}</strong>
          <p>Student</p>
        </div>
      </div>
    </header>
  );
}