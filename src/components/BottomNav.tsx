import { NavLink } from 'react-router-dom';
import './BottomNav.css';

type TabIcon = 'home' | 'studio' | 'editor' | 'lookbook';

const tabs = [
  { to: '/',         icon: 'home' as TabIcon,     label: 'หน้าหลัก' },
  { to: '/gen-ai',   icon: 'studio' as TabIcon,   label: 'AI Studio' },
  { to: '/editor',   icon: 'editor' as TabIcon,   label: 'Editor' },
  { to: '/lookbook', icon: 'lookbook' as TabIcon, label: 'Lookbook' },
];

function BottomNavIcon({ icon }: { icon: TabIcon }) {
  switch (icon) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case 'studio':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
          <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
          <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
        </svg>
      );
    case 'editor':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
          <path d="m4 16 9.5-9.5 4 4L8 20H4v-4Z" />
          <path d="m12.5 7 2-2a1.8 1.8 0 0 1 2.5 0l2 2a1.8 1.8 0 0 1 0 2.5l-2 2" />
        </svg>
      );
    case 'lookbook':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
          <path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H20v16H8.5A2.5 2.5 0 0 0 6 21.5" />
          <path d="M6 5.5v16" />
          <path d="M8.5 7H16" />
          <path d="M8.5 11H16" />
        </svg>
      );
  }
}

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}
          className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
          <span className="nav-icon" aria-hidden="true">
            <BottomNavIcon icon={t.icon} />
          </span>
          <span className="nav-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
