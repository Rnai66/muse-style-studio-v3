import { NavLink } from 'react-router-dom';
import { EMOJI } from '@/lib/emojis';
import './BottomNav.css';

const tabs = [
  { to: '/',        icon: EMOJI.home,     label: 'หน้าหลัก' },
  { to: '/gen-ai',  icon: EMOJI.studio,   label: 'AI Studio' },
  { to: '/editor',  icon: EMOJI.editor,   label: 'Editor' },
  { to: '/lookbook',icon: EMOJI.lookbook, label: 'Lookbook' },
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
