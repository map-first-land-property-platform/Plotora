const nf = new Intl.NumberFormat('en-US');
const trim = (n: number, d: number) => String(+n.toFixed(d));

export function lkrShort(n: number) {
  n = n || 0;
  if (n >= 1e9) return 'Rs ' + trim(n / 1e9, 2) + ' Bn';
  if (n >= 1e6) return 'Rs ' + trim(n / 1e6, n >= 1e7 ? 1 : 2) + ' M';
  return 'Rs ' + nf.format(Math.round(n));
}

export function extent(p?: number | null) {
  if (p == null) return '—';
  if (p < 160) return trim(p, 1) + (p === 1 ? ' perch' : ' perches');
  const ac = Math.floor(p / 160);
  let r = p - ac * 160;
  const rd = Math.floor(r / 40);
  r = +(r - rd * 40).toFixed(1);
  return [ac && `${ac} ac`, rd && `${rd} rd`, r && `${r} p`].filter(Boolean).join(' ');
}

export const sqft = (n: number) => nf.format(Math.round(n)) + ' sq ft';

export function pinPrice(n: number, rent?: boolean) {
  const s = n >= 1e6 ? +(n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(n);
  return s + (rent ? '/mo' : '');
}

export function buildQuery(o: Record<string, string | undefined | false | null>) {
  const a = Object.entries(o)
    .filter(([, v]) => v !== '' && v != null && v !== false)
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
  return a.length ? '?' + a.join('&') : '';
}
