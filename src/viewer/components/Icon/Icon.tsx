/**
 * Icon component - Consistent SVG icon system.
 * 
 * Design principles (Apple HIG):
 * - Monocromatic: Uses currentColor to respect theme
 * - Consistent: Same stroke weight (1.5-2px) and sizing
 * - Accessible: Includes aria-hidden for decorative icons
 */

import type { ReactNode } from 'react';
import styles from './Icon.module.css';

export type IconName =
  | 'chevron-right'
  | 'chevron-down'
  | 'sort-asc'
  | 'sort-desc'
  | 'hash'
  | 'braces'
  | 'braces-compact'
  | 'search'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'star'
  | 'star-filled'
  | 'download'
  | 'help'
  | 'document'
  | 'sun'
  | 'moon'
  | 'folder'
  | 'edit'
  | 'pencil'
  | 'trash'
  | 'close'
  | 'check'
  | 'plus'
  | 'clipboard'
  | 'arrow-down';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
}

const ICONS: Record<IconName, ReactNode> = {
  'chevron-right': (
    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'chevron-down': (
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'sort-asc': (
    <>
      <path d="M3 6h7M3 10h5M3 14h3" strokeLinecap="round" />
      <path d="M17 4v16M17 4l4 4M17 4l-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'sort-desc': (
    <>
      <path d="M3 6h3M3 10h5M3 14h7" strokeLinecap="round" />
      <path d="M17 4v16M17 20l4-4M17 20l-4-4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'hash': (
    <path d="M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18" strokeLinecap="round" />
  ),
  'braces': (
    <path d="M8 3c-2 0-3 1-3 3v4c0 2-1 2-2 2 1 0 2 0 2 2v4c0 2 1 3 3 3M16 3c2 0 3 1 3 3v4c0 2 1 2 2 2-1 0-2 0-2 2v4c0 2-1 3-3 3" strokeLinecap="round" />
  ),
  'braces-compact': (
    <path d="M7 4c-1.5 0-2.5.8-2.5 2v4c0 1.5-.5 2-1.5 2 1 0 1.5.5 1.5 2v4c0 1.2 1 2 2.5 2M17 4c1.5 0 2.5.8 2.5 2v4c0 1.5.5 2 1.5 2-1 0-1.5.5-1.5 2v4c0 1.2-1 2-2.5 2" strokeLinecap="round" />
  ),
  'search': (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </>
  ),
  'undo': (
    <>
      <path d="M3 7v6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 13" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'redo': (
    <>
      <path d="M21 7v6h-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 13" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'copy': (
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
    </>
  ),
  'clipboard': (
    <>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </>
  ),
  'star': (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round" />
  ),
  'star-filled': (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" strokeLinejoin="round" />
  ),
  'download': (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  'arrow-down': (
    <path d="M12 5v14M19 12l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'help': (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </>
  ),
  'document': (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </>
  ),
  'sun': (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </>
  ),
  'moon': (
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round" />
  ),
  'folder': (
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="round" />
  ),
  'edit': (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinejoin="round" />
    </>
  ),
  'pencil': (
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinejoin="round" />
  ),
  'trash': (
    <>
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </>
  ),
  'close': (
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
  ),
  'check': (
    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  'plus': (
    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
  ),
};

export function Icon({ name, size = 16, className, title }: IconProps) {
  const icon = ICONS[name];
  
  if (!icon) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <svg
      className={`${styles.icon} ${className || ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      {icon}
    </svg>
  );
}
