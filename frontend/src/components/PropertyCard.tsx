'use client';

import Link from 'next/link';
import { useState } from 'react';
import Icon from './Icon';
import PhotoImg from './PhotoImg';
import { extent, lkrShort, sqft } from '../lib/format';
import type { PropertyCardData } from '../lib/types';

export interface PropertyCardProps {
  listing: PropertyCardData;
  onToggleFavourite?: (id: string, next: boolean) => void;
  initiallySaved?: boolean;
}

export default function PropertyCard({ listing: l, onToggleFavourite, initiallySaved = false }: PropertyCardProps) {
  const [fav, setFav] = useState(initiallySaved);
  const land = l.type === 'land';
  const href = `/properties/${l.id}`;
  return (
    <article className="pcard card card-hover " data-pid={l.id}>
      <div className="pc-media">
        <Link className="pc-link" href={href} aria-label={l.title}>
          <PhotoImg src={l.photo} loading="lazy" width={640} height={420} />
        </Link>
        <div className="pc-badges">
          {l.featured && <span className="badge b-dark"><Icon name="sparkles" size={12} />Featured</span>}
          {l.purpose === 'rent' ? <span className="badge b-info">For rent</span> : <span className="badge b-brand">For sale</span>}
        </div>
        <div className="pc-tools">
          <button
            type="button"
            className={`pc-btn ${fav ? 'is-on' : ''}`}
            aria-pressed={fav}
            aria-label="Save to favourites"
            title="Save"
            onClick={() => { const next = !fav; setFav(next); onToggleFavourite?.(l.id, next); }}
          >
            <Icon name="heart" size={17} />
          </button>
        </div>
        {l.verified && <span className="pc-ver" title="Documents verified by Plotora"><Icon name="badge-check" size={14} /> Verified</span>}
      </div>
      <div className="pc-body">
        <div className="pc-price">{lkrShort(l.price)}{l.purpose === 'rent' && <small> / month</small>}</div>
        <h3 className="pc-title"><Link href={href} className="clamp-2">{l.title}</Link></h3>
        <div className="pc-loc"><Icon name="map-pin" size={14} /><span className="truncate">{l.area}, {l.cityName}</span></div>
        <div className="pc-facts">
          {land ? (
            <>
              <span><Icon name="land-plot" size={15} />{extent(l.perches)}</span>
              <span><Icon name="banknote" size={15} />{lkrShort(l.price / l.perches)} / perch</span>
            </>
          ) : (
            <>
              {l.beds > 0 && <span><Icon name="bed-double" size={15} />{l.beds}</span>}
              {l.baths > 0 && <span><Icon name="bath" size={15} />{l.baths}</span>}
              <span><Icon name="maximize" size={15} />{sqft(l.sqft)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
