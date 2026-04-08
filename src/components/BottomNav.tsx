import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
  { to: '/',        icon: '⌂',  label: 'หน้าหลัก' },
  { to: '/gen-ai',  icon: '✦',  label: 'AI Studio' },
  { to: '/editor',  icon: '🎨', label: 'Editor' },
  { to: '/lookbook',icon: '📚', label: 'Lookbook' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.to === '/'}
          className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
