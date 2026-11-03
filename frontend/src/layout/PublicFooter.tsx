import Link from 'next/link';
import Brand from './Brand';

const COLS: [string, [string, string][]][] = [
  ['Discover', [['Explore map', '/explore'], ['Development projects', '/projects'], ['Developers & agencies', '/organisations'], ['Area guides', '/areas']]],
  ['Resources', [['Calculators & tools', '/tools'], ['Buying & selling guides', '/guides'], ['Help centre', '/help'], ['Contact', '/contact']]],
  ['Plotora', [['About Plotora', '/about'], ['Privacy policy', '/privacy'], ['Terms & conditions', '/terms']]],
];

export default function PublicFooter() {
  return (
    <footer className="pl-footer">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <Brand light />
            <p>Map-first land &amp; property platform for Sri Lanka. Discover land, projects and homes on the map — and manage them in one place.</p>
          </div>
          {COLS.map(([title, links]) => (
            <div key={title}>
              <h5>{title}</h5>
              <ul>{links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="foot-base">
          <span>© 2026 Plotora</span>
          <span className="muted-inv">Land boundaries are indicative. Official surveying, ownership certification and legal transfers are excluded from the platform.</span>
        </div>
      </div>
    </footer>
  );
}
