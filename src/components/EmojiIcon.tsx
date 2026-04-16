import type { CSSProperties, ComponentPropsWithoutRef } from 'react';
import './EmojiIcon.css';

interface Props extends ComponentPropsWithoutRef<'span'> {
  symbol: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function EmojiIcon({ symbol, label, className = '', style, ...rest }: Props) {
  return (
    <span
      className={`emoji-icon ${className}`.trim()}
      style={style}
      role="img"
      aria-label={label ?? symbol}
      {...rest}
    >
      {symbol}
    </span>
  );
}
