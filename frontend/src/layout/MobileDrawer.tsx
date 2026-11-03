'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon';

export default function MobileDrawer({ onClose, signInHref = '/login' }: { onClose: () => void; signInHref?: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', esc); };
  }, [onClose]);

  return createPortal(
    <div
      className="overlay drawer-wrap drawer-left-wrap"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onClick={(e) => { if ((e.target as HTMLElement).closest('[data-close]')) onClose(); }}
    >
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Explore Plotora" tabIndex={-1}>
        <div className="modal-head">
          <div><h3>Explore Plotora</h3></div>
          <button className="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close"><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="col gap-2 mobile-main-nav">
            <Link className="menu-item" data-close href="/explore"><Icon name="map" size={18} />Explore map</Link>
            <Link className="menu-item" data-close href="/projects"><Icon name="land-plot" size={18} />Projects</Link>
            <Link className="menu-item" data-close href="/organisations"><Icon name="building-2" size={18} />Developers</Link>
            <Link className="btn btn-primary btn-block mt-2" data-close href="/seller/listings/new"><Icon name="plus" size={16} />List property</Link>
            <details className="mobile-nav-more">
              <summary><Icon name="layout-grid" size={16} />More resources <Icon name="chevron-down" size={15} /></summary>
              <Link className="menu-item" data-close href="/agents"><Icon name="users" size={16} />Agents</Link>
              <Link className="menu-item" data-close href="/services"><Icon name="hammer" size={16} />Services</Link>
              <Link className="menu-item" data-close href="/areas"><Icon name="map-pinned" size={16} />Area guides</Link>
              <Link className="menu-item" data-close href="/tools"><Icon name="calculator" size={16} />Calculators &amp; tools</Link>
              <Link className="menu-item" data-close href="/help"><Icon name="circle-help" size={16} />Help centre</Link>
            </details>
            <div className="menu-sep"></div>
            <Link className="menu-item" data-close href={signInHref}><Icon name="log-in" size={18} />Sign in</Link>
            <Link className="menu-item" data-close href="/register"><Icon name="user-plus" size={18} />Create an account</Link>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
