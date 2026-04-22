import { memo, type ComponentPropsWithoutRef } from 'react';
import './AppIcon.css';

export type AppIconName =
  | 'avatar'
  | 'camera'
  | 'gallery'
  | 'clothes'
  | 'details'
  | 'item'
  | 'layers'
  | 'hair'
  | 'palette'
  | 'jewelry'
  | 'shoes'
  | 'text'
  | 'download'
  | 'upload'
  | 'magic'
  | 'warning'
  | 'eye'
  | 'hidden'
  | 'lock'
  | 'unlock'
  | 'tools'
  | 'grid'
  | 'compare'
  | 'reset'
  | 'swap'
  | 'editor'
  | 'lookbook'
  | 'logout'
  | 'edit'
  | 'ai'
  | 'scissors'
  | 'wave'
  | 'ruler'
  | 'braid'
  | 'necklace'
  | 'earrings'
  | 'glasses'
  | 'bracelet'
  | 'hat'
  | 'bag'
  | 'heels'
  | 'flats'
  | 'sneaker'
  | 'boots'
  | 'sandals'
  | 'loafers'
  | 'leaf'
  | 'briefcase'
  | 'moon'
  | 'lipstick'
  | 'flower'
  | 'coffee'
  | 'profile'
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'spark'
  | 'check'
  | 'close';

interface Props extends ComponentPropsWithoutRef<'span'> {
  name: AppIconName;
  label?: string;
}

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="app-icon-svg">
      {children}
    </svg>
  );
}

function AppIconInner({ name, className = '', label, ...rest }: Props) {
  const classes = `app-icon ${className}`.trim();

  const icon = (() => {
    switch (name) {
      case 'avatar':
        return <Svg><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></Svg>;
      case 'camera':
        return <Svg><path d="M4.5 8.5h3l1.4-2h6.2l1.4 2h3A1.5 1.5 0 0 1 21 10v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18v-8A1.5 1.5 0 0 1 4.5 8.5Z" /><circle cx="12" cy="14" r="3.2" /></Svg>;
      case 'gallery':
        return <Svg><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.3" /><path d="m7 17 4-4 3 3 2-2 2 3" /></Svg>;
      case 'clothes':
        return <Svg><path d="M8 5.5 10.5 4h3L16 5.5l2.5 2.2-1.8 2.3-1.7-1V20H9V9l-1.7 1-1.8-2.3L8 5.5Z" /></Svg>;
      case 'details':
        return <Svg><path d="m12 3 1.4 4.3L17.7 8.7l-4.3 1.4L12 14.4l-1.4-4.3-4.3-1.4 4.3-1.4L12 3Z" /><path d="m18.5 13.5.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" /></Svg>;
      case 'item':
        return <Svg><path d="M7 9.5h10l-1 9H8l-1-9Z" /><path d="M9 9.5V8a3 3 0 0 1 6 0v1.5" /></Svg>;
      case 'layers':
        return <Svg><path d="m12 4 7 3.5-7 3.5-7-3.5L12 4Z" /><path d="m5 11 7 3.5 7-3.5" /><path d="m5 14.5 7 3.5 7-3.5" /></Svg>;
      case 'hair':
        return <Svg><path d="M7 9.5A5 5 0 0 1 17 9v1.5a5 5 0 0 1-10 0V9.5Z" /><path d="M6.5 10.5V9A5.5 5.5 0 0 1 12 3.5 5.5 5.5 0 0 1 17.5 9v1.5" /><path d="M9 15.5c.6 1.7 1.5 3 3 4 1.5-1 2.4-2.3 3-4" /></Svg>;
      case 'palette':
        return <Svg><path d="M12 4.5A7.5 7.5 0 1 0 12 19h1.2a1.8 1.8 0 1 0 0-3.6H12a1.9 1.9 0 0 1 0-3.8h1.8A4.2 4.2 0 0 0 18 7.4 2.9 2.9 0 0 0 15.1 4.5H12Z" /><circle cx="8" cy="10" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="14" cy="7.5" r="1" /><circle cx="16" cy="10" r="1" /></Svg>;
      case 'jewelry':
      case 'necklace':
        return <Svg><path d="M7 7.5a5 5 0 0 0 10 0" /><path d="M8.5 8.5c0 4.5 1.2 7.2 3.5 10 2.3-2.8 3.5-5.5 3.5-10" /><circle cx="12" cy="16.8" r="1.6" /></Svg>;
      case 'earrings':
        return <Svg><path d="M8 8a2 2 0 1 1 4 0c0 1.5-2 2.1-2 4.2" /><circle cx="10" cy="16.5" r="1.4" /><path d="M14 8a2 2 0 1 1 4 0c0 1.5-2 2.1-2 4.2" /><circle cx="16" cy="16.5" r="1.4" /></Svg>;
      case 'glasses':
        return <Svg><path d="M4 10.5h2l1.2 4a2.5 2.5 0 0 0 2.4 1.8h.8a2.5 2.5 0 0 0 2.4-1.8l.4-1.2.4 1.2a2.5 2.5 0 0 0 2.4 1.8h.8a2.5 2.5 0 0 0 2.4-1.8l1.2-4H20" /><path d="M10 10.5h4" /></Svg>;
      case 'bracelet':
        return <Svg><circle cx="12" cy="12" r="4.2" /><circle cx="12" cy="12" r="1.2" /></Svg>;
      case 'hat':
        return <Svg><path d="M7 11a5 5 0 0 1 10 0" /><path d="M4 11.5h16" /><path d="M6 15c1.5.9 3.5 1.5 6 1.5s4.5-.6 6-1.5" /></Svg>;
      case 'bag':
        return <Svg><path d="M6.5 9.5h11l-1 9h-9l-1-9Z" /><path d="M9 9.5V8a3 3 0 1 1 6 0v1.5" /></Svg>;
      case 'shoes':
      case 'heels':
        return <Svg><path d="M6 15.5c2.4 0 4-2.6 4.8-5 .7.8 1.4 1.6 3.2 2.2l1.8.6v2.2H6Z" /><path d="M17.8 13.3h1.2v4.2h-1.8" /></Svg>;
      case 'text':
        return <Svg><path d="M5 7h14" /><path d="M12 7v10" /><path d="M8.5 17h7" /></Svg>;
      case 'download':
        return <Svg><path d="M12 5v10" /><path d="m8.5 11.5 3.5 3.5 3.5-3.5" /><path d="M5 19h14" /></Svg>;
      case 'upload':
        return <Svg><path d="M12 19V9" /><path d="m8.5 12.5 3.5-3.5 3.5 3.5" /><path d="M5 5h14" /></Svg>;
      case 'magic':
        return <Svg><path d="m5 19 10-10" /><path d="m13 5 1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" /><path d="m5 15 1.2 1.2" /><path d="m3.8 17.4 1.2 1.2" /></Svg>;
      case 'warning':
        return <Svg><path d="M12 4 20 19H4L12 4Z" /><path d="M12 9v4.5" /><circle cx="12" cy="16.2" r=".7" fill="currentColor" stroke="none" /></Svg>;
      case 'eye':
        return <Svg><path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z" /><circle cx="12" cy="12" r="2.3" /></Svg>;
      case 'hidden':
        return <Svg><path d="M3 3 21 21" /><path d="M10.6 7.2A9.8 9.8 0 0 1 12 7c6 0 9.2 5 9.2 5a17.8 17.8 0 0 1-4 4.4" /><path d="M8.1 8.1A17 17 0 0 0 2.8 12s3.2 5 9.2 5c1.2 0 2.3-.2 3.3-.5" /></Svg>;
      case 'lock':
        return <Svg><rect x="5.5" y="11" width="13" height="8" rx="2" /><path d="M8.5 11V8.5a3.5 3.5 0 1 1 7 0V11" /></Svg>;
      case 'unlock':
        return <Svg><rect x="5.5" y="11" width="13" height="8" rx="2" /><path d="M15.5 11V8.5a3.5 3.5 0 0 0-7 0" /></Svg>;
      case 'tools':
        return <Svg><path d="m14 6 4 4" /><path d="m13 7 2-2a2.1 2.1 0 0 1 3 3l-2 2" /><path d="m4 20 7-7" /><path d="m2.8 16.8 4.4 4.4" /></Svg>;
      case 'grid':
        return <Svg><rect x="5" y="5" width="5" height="5" /><rect x="14" y="5" width="5" height="5" /><rect x="5" y="14" width="5" height="5" /><rect x="14" y="14" width="5" height="5" /></Svg>;
      case 'compare':
        return <Svg><path d="M7 8h10" /><path d="m13 4 4 4-4 4" /><path d="M17 16H7" /><path d="m11 12-4 4 4 4" /></Svg>;
      case 'reset':
        return <Svg><path d="M6 9H3V6" /><path d="M4 13a8 8 0 1 0 2-5.3L3 9" /></Svg>;
      case 'swap':
        return <Svg><path d="M6 8h11" /><path d="m14 5 3 3-3 3" /><path d="M18 16H7" /><path d="m10 13-3 3 3 3" /></Svg>;
      case 'editor':
        return <Svg><path d="m4 16 9.5-9.5 4 4L8 20H4v-4Z" /><path d="m12.5 7 2-2a1.8 1.8 0 0 1 2.5 0l2 2a1.8 1.8 0 0 1 0 2.5l-2 2" /></Svg>;
      case 'lookbook':
        return <Svg><path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H20v16H8.5A2.5 2.5 0 0 0 6 21.5" /><path d="M6 5.5v16" /><path d="M8.5 7H16" /><path d="M8.5 11H16" /></Svg>;
      case 'logout':
        return <Svg><path d="M10 6H6.8A1.8 1.8 0 0 0 5 7.8v8.4A1.8 1.8 0 0 0 6.8 18H10" /><path d="M13 8.5 17.5 12 13 15.5" /><path d="M9 12h8.5" /></Svg>;
      case 'edit':
        return <Svg><path d="m4 16 9.5-9.5 4 4L8 20H4v-4Z" /></Svg>;
      case 'ai':
        return <Svg><rect x="7" y="8" width="10" height="8" rx="2" /><path d="M9 8V6.5" /><path d="M15 8V6.5" /><circle cx="10.5" cy="12" r=".9" fill="currentColor" stroke="none" /><circle cx="13.5" cy="12" r=".9" fill="currentColor" stroke="none" /><path d="M10 14.5h4" /></Svg>;
      case 'flats':
        return <Svg><path d="M5 15.5c2.2-.2 4.4-1.3 6.3-3.4.9 1.1 2.3 2.2 4.8 2.7v1.7H5Z" /></Svg>;
      case 'sneaker':
        return <Svg><path d="M5 14.5c1.9 0 3.5-.8 5-2.5l2.2 1.6c1 .7 2.2 1.1 3.5 1.1H19v2H5Z" /><path d="M12 12.5 10 9.5" /></Svg>;
      case 'boots':
        return <Svg><path d="M9 5.5h4v7.5c1 .8 2.2 1.2 3.8 1.5V18H7v-2.5h2Z" /></Svg>;
      case 'sandals':
        return <Svg><path d="M7.5 8.5h9" /><path d="M9 8.5v7" /><path d="M15 8.5v7" /><path d="M6.5 17h11" /></Svg>;
      case 'loafers':
        return <Svg><path d="M5.5 15c2-.1 3.8-.8 5.4-2.4 1.2 1.4 2.8 2.2 5.1 2.4V17h-10.5Z" /><path d="M10 12.6h3" /></Svg>;
      case 'leaf':
        return <Svg><path d="M18 5c-6 0-9.5 3.4-11 10 4.6.3 8-1 10.3-3.9C19 8.9 19.4 7 18 5Z" /><path d="M8 15c2-2.2 4.4-4 7-5.4" /></Svg>;
      case 'briefcase':
        return <Svg><path d="M4.5 8h15A1.5 1.5 0 0 1 21 9.5v7A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5v-7A1.5 1.5 0 0 1 4.5 8Z" /><path d="M9 8V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8V8" /></Svg>;
      case 'moon':
        return <Svg><path d="M16.8 4.8A7.5 7.5 0 1 0 19.2 17 6.2 6.2 0 1 1 16.8 4.8Z" /></Svg>;
      case 'lipstick':
        return <Svg><path d="M10 5.5h4v3l-1.3 2.2h-1.4L10 8.5v-3Z" /><path d="M9 10.7h6V18H9Z" /></Svg>;
      case 'flower':
        return <Svg><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="8.2" r="2" /><circle cx="15.3" cy="10.2" r="2" /><circle cx="15.1" cy="14.1" r="2" /><circle cx="8.9" cy="14.1" r="2" /><circle cx="8.7" cy="10.2" r="2" /></Svg>;
      case 'coffee':
        return <Svg><path d="M6 9.5h9v4.2A3.3 3.3 0 0 1 11.7 17H9.3A3.3 3.3 0 0 1 6 13.7V9.5Z" /><path d="M15 10.5h1a2 2 0 1 1 0 4h-1" /><path d="M7 19h8" /></Svg>;
      case 'profile':
        return <Svg><circle cx="12" cy="9" r="3" /><path d="M7 18a5 5 0 0 1 10 0" /><path d="M17.5 7.5h2" /><path d="M18.5 6.5v2" /></Svg>;
      case 'top':
        return <Svg><path d="M8 6.5 10.5 5h3L16 6.5l2 2-1.5 2-2-1V19H9.5V9.5l-2 1-1.5-2 2-2Z" /></Svg>;
      case 'bottom':
        return <Svg><path d="M8 5.5h8l-1 13h-3l-1-6-1 6H7l1-13Z" /></Svg>;
      case 'dress':
        return <Svg><path d="M10 4.5h4L13 8v2.5l4 7.5H7l4-7.5V8l-1-3.5Z" /></Svg>;
      case 'outerwear':
        return <Svg><path d="M8 5.5 10 4h4l2 1.5 1.8 3-2.3 1.8-1.5-2.1V19H9.5V8.2L8 10.3 5.7 8.5l2.3-3Z" /></Svg>;
      case 'spark':
        return <Svg><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /></Svg>;
      case 'check':
        return <Svg><path d="m6.5 12.5 3.2 3.2L17.5 8" /></Svg>;
      case 'close':
        return <Svg><path d="M7 7 17 17" /><path d="M17 7 7 17" /></Svg>;
      default:
        return null;
    }
  })();

  return (
    <span className={classes} role="img" aria-label={label ?? name} {...rest}>
      {icon}
    </span>
  );
}

const AppIcon = memo(AppIconInner);
export default AppIcon;
