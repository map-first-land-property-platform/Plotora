'use client';

import { useEffect, useRef, useState } from 'react';

export interface SelectOption { value: string; label: string }

export default function Select({ name, label, options, defaultValue = '', onChange }: { name: string; label: string; options: SelectOption[]; defaultValue?: string; onChange?: (value: string) => void }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  return (
    <div className={`select-shell ${open ? 'is-open' : ''}`} ref={ref}>
      <select name={name} aria-label={label} className="dropdown-native" value={value} onChange={(e) => setValue(e.target.value)} tabIndex={-1}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button
        type="button"
        ref={triggerRef}
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => { if (['Enter', ' ', 'ArrowDown'].includes(e.key)) { e.preventDefault(); setOpen(true); } }}
      >
        <span className="select-trigger-label">{selected?.label ?? ''}</span>
        <span className="select-trigger-chevron">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </button>
      <div className="select-menu" role="listbox">
        {open && options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`select-option ${o.value === value ? 'is-selected' : ''}`}
            data-value={o.value}
            role="option"
            aria-selected={o.value === value}
            onClick={() => { setValue(o.value); onChange?.(o.value); setOpen(false); triggerRef.current?.focus(); }}
          >
            <span>{o.label}</span>
            <span className="select-option-check" aria-hidden="true">✓</span>
          </button>
        ))}
      </div>
    </div>
  );
}
