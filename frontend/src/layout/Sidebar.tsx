export type View = 'dashboard' | 'assignments' | 'grades';

export default function Sidebar({
  view,
  onNavigate,
  onLogout,
}: {
  view: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}) {
  const links: { key: View; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'grades', label: 'Grades' },
  ];

  return (
    <aside className="sidebar">
      <div className="logo">
        <span>N</span>
        <h2>Nemo.AI</h2>
      </div>
      <nav>
        {links.map((link) => (
          <button
            key={link.key}
            type="button"
            className={`nav-link${view === link.key ? ' active' : ''}`}
            onClick={() => onNavigate(link.key)}
          >
            {link.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className="nav-link" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}