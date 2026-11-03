import Link from 'next/link';
import Icon from './Icon';
import PhotoImg from './PhotoImg';
import { lkrShort } from '../lib/format';
import type { ProjectCardData } from '../lib/types';

const AV = ['#0B8579', '#256396', '#7A5EA8', '#D68B3F', '#C25A73', '#2FA57A'];

export default function ProjectCard({ project: p }: { project: ProjectCardData }) {
  const st = p.stats;
  const sold = Math.round(((st.sold + st.reserved) / st.total) * 100);
  const c = p.org.color || AV[0];
  const badge = p.status === 'Selling' ? 'b-ok' : p.status === 'Launching' ? 'b-warn' : 'b-neutral';
  const href = `/projects/${p.id}`;
  return (
    <article className="jcard card card-hover">
      <Link className="jc-media" href={href}>
        <PhotoImg src={p.photo} loading="lazy" />
        <span className={`jc-status badge ${badge} badge-dot`}>{p.status}</span>
      </Link>
      <div className="jc-body">
        <div className="row gap-2 sm muted">
          <span
            className="avatar avatar-sq org-logo-photo"
            style={{ ['--s' as string]: '22px', background: `linear-gradient(145deg,${c},color-mix(in srgb,${c} 62%,#0F2038))` }}
            aria-hidden="true"
          >
            <PhotoImg src={p.org.logoPhoto} loading="lazy" />
          </span>
          <span className="truncate">{p.org.name}</span>
        </div>
        <h3><Link href={href}>{p.name}</Link></h3>
        <div className="pc-loc"><Icon name="map-pin" size={14} />{p.area}, {p.cityName}</div>
        <div className="jc-stats">
          <div><strong>{st.total}</strong><span>Plots</span></div>
          <div><strong>{st.available}</strong><span>Available</span></div>
          <div><strong>{lkrShort(p.pricePerPerch)}</strong><span>Per perch</span></div>
        </div>
        <div className="jc-prog">
          <div className="row between xs muted"><span>{sold}% sold or reserved</span><span>Handover {p.handover}</span></div>
          <div className="progress" role="progressbar" aria-valuenow={sold} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${Math.max(0, Math.min(100, sold))}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}
