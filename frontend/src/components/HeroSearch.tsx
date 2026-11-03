'use client';

import { useRouter } from 'next/navigation';
import Icon from './Icon';
import Select from './Select';
import { buildQuery } from '../lib/format';
import type { CityInfo, PropertyTypeInfo } from '../lib/types';

const BUDGETS: [string, string][] = [
  ['', 'Any price'],
  ['5000000', 'Under Rs 5 M'],
  ['10000000', 'Under Rs 10 M'],
  ['30000000', 'Under Rs 30 M'],
  ['100000000', 'Under Rs 100 M'],
];

export default function HeroSearch({ types, cities }: { types: PropertyTypeInfo[]; cities: CityInfo[] }) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const d = Object.fromEntries(f.entries()) as Record<string, string>;
    if (d.purpose === 'projects') return router.push('/projects' + buildQuery({ q: d.q }));
    router.push('/explore' + buildQuery({ q: d.q, type: d.type, max: d.max, purpose: d.purpose === 'rent' ? 'rent' : '' }));
  }

  return (
    <form className="hero-search home-search" noValidate aria-label="Find a property" onSubmit={onSubmit}>
      <div className="seg hs-tabs" role="radiogroup" aria-label="Looking to">
        <label><input type="radio" name="purpose" value="sale" defaultChecked /><span>Buy</span></label>
        <label><input type="radio" name="purpose" value="rent" /><span>Rent</span></label>
        <label><input type="radio" name="purpose" value="projects" /><span>New projects</span></label>
      </div>
      <label className="home-input-label" htmlFor="home-place">Where would you like to look?</label>
      <label className="hs-field home-place">
        <Icon name="search" size={19} />
        <input id="home-place" name="q" placeholder="City, neighbourhood, or location" autoComplete="off" list="place-list" />
        <datalist id="place-list">
          {cities.map((c) => <option key={c.name} value={c.name} />)}
          {cities.flatMap((c) => c.areas).map((a, i) => <option key={a + i} value={a} />)}
        </datalist>
      </label>
      <div className="home-form-bottom">
        <label className="hs-field hs-sel">
          <Select name="type" label="Property type" options={[{ value: '', label: 'All property types' }, ...types.map((t) => ({ value: t.id, label: t.label }))]} />
        </label>
        <label className="hs-field hs-sel">
          <Select name="max" label="Maximum budget" options={BUDGETS.map(([value, label]) => ({ value, label }))} />
        </label>
      </div>
      <button type="submit" className="btn btn-primary btn-lg home-submit">
        <Icon name="map" size={19} />Explore properties <Icon name="arrow-right" size={17} />
      </button>
    </form>
  );
}
