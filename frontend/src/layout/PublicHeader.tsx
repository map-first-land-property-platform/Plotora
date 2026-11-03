'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import Brand from './Brand';
import MobileDrawer from './MobileDrawer';

const NAV: [string, string, string[]][] = [
  ['Explore map', '/explore', ['/explore', '/properties']],
  ['Projects', '/projects', ['/projects']],
  ['Developers', '/organisations', ['/organisations']],
];

export const THEME_KEY = 'plotora-theme';

export interface PublicHeaderProps {
  signInHref?: string;
  onSearchClick?: () => void;
}

export default function PublicHeader({ signInHref = '/login', onSearchClick }: PublicHeaderProps) {
  const path = usePathname() || '/';
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [dark, setDark] = useState(false);
  const more = useRef<HTMLDivElement>(null);

  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!more.current?.contains(e.target as Node)) setMoreOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', esc); };
  }, []);
  useEffect(() => { setMoreOpen(false); }, [path]);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    setDark(!dark);
  };

  return (
    <>
      <a className="skip-link" href="#page">Skip to content</a>
      <div id="sr-live" className="sr-only" aria-live="polite"></div>
      <header className={`pl-header ${path === '/' ? 'is-home' : ''}`}>
        <div className="container pl-header-in">
          <Brand />
          <nav className="pl-nav" aria-label="Primary">
            {NAV.map(([t, h, m]) => (
              <Link key={h} href={h} className={m.some((x) => path === x || path.startsWith(x + '/')) ? 'is-active' : undefined}>{t}</Link>
            ))}
            <div className={`menu-wrap ${moreOpen ? 'is-open' : ''}`} ref={more}>
              <button className="pl-nav-btn" aria-haspopup="true" aria-expanded={moreOpen} onClick={() => setMoreOpen((o) => !o)}>
                More <Icon name="chevron-down" size={14} />
              </button>
              <div className="menu-panel left" style={{ minWidth: 244 }}>
                <div className="menu-label">Discover</div>
                <Link className="menu-item" href="/agents"><Icon name="users" size={16} />Agents</Link>
                <Link className="menu-item" href="/services"><Icon name="hammer" size={16} />Property services</Link>
                <Link className="menu-item" href="/areas"><Icon name="map-pinned" size={16} />Area guides</Link>
                <div className="menu-sep"></div>
                <div className="menu-label">Resources</div>
                <Link className="menu-item" href="/tools"><Icon name="calculator" size={16} />Calculators &amp; tools</Link>
                <Link className="menu-item" href="/guides"><Icon name="book-open" size={16} />Buying &amp; selling guides</Link>
                <Link className="menu-item" href="/help"><Icon name="circle-help" size={16} />Help centre</Link>
              </div>
            </div>
          </nav>
          <div className="pl-actions">
            <button className="btn btn-ghost btn-icon hide-sm" aria-label="Search pages (Ctrl K)" title="Search pages — Ctrl K" onClick={onSearchClick}>
              <Icon name="search" size={18} />
            </button>
            <button className="btn btn-ghost btn-icon" aria-label="Toggle colour theme" title="Toggle theme" onClick={toggleTheme}>
              <span className="theme-ic"><Icon name={dark ? 'moon' : 'sun'} size={18} /></span>
            </button>
            <Link className="btn btn-primary hide-sm pl-list-property" href="/seller/listings/new"><Icon name="plus" size={16} />List property</Link>
            <Link className="btn btn-ghost hide-sm" href={signInHref}>Sign in</Link>
            <button className="btn btn-ghost btn-icon only-burger" aria-label="Open menu" onClick={() => setDrawer(true)}>
              <Icon name="menu" size={22} />
            </button>
          </div>
        </div>
      </header>
      {drawer && <MobileDrawer onClose={() => setDrawer(false)} signInHref={signInHref} />}
    </>
  );
}
