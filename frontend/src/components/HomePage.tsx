import Link from 'next/link';
import Icon from './Icon';
import HeroSearch from './HeroSearch';
import PropertyCard from './PropertyCard';
import ProjectCard from './ProjectCard';
import type { HomeData } from '../lib/types';
import MapPreview from '@/components/map-preview';

const STEPS: [string, string, string][] = [
  ['map-pinned', 'Explore the area', 'Find properties by location, price or property type.'],
  ['land-plot', 'Understand the details', 'Review property information, approximate boundaries and pricing.'],
  ['message-circle', 'Make a connection', 'Contact the owner or agent and arrange your next step.'],
];

export default function HomePage({ data }: { data: HomeData }) {
  const categories = data.types.filter((t) => ['land', 'house', 'apartment'].includes(t.id));
  return (
    <>
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-content">
            <div className="home-kicker"><span className="home-kicker-dot"></span> LAND &amp; PROPERTY IN SRI LANKA</div>
            <h1>Find your place.<br /><span>Start with the map.</span></h1>
            <p className="home-lead">Explore land, homes and new developments in one clear view. Compare locations, understand each property, and connect with the right people.</p>
            <HeroSearch types={data.types} cities={data.cities} />
            <div className="home-popular">
              <span>Popular searches</span>
              <Link href="/explore?type=land&city=galle">Land in Galle <Icon name="arrow-up-right" size={13} /></Link>
              <Link href="/explore?type=apartment&city=colombo">Colombo apartments <Icon name="arrow-up-right" size={13} /></Link>
            </div>
          </div>
          <div className="home-map-col">
            <MapPreview />
            <div className="home-map-hint"><Icon name="move" size={15} /> Move around the map to discover areas and listings</div>
          </div>
        </div>
      </section>

      <section className="container home-categories" aria-label="Browse property types">
        <div className="home-categories-head"><span className="home-eyebrow">EXPLORE</span><h2>What are you looking for?</h2></div>
        <div className="home-category-grid">
          {categories.map((t) => (
            <Link key={t.id} className="home-category" href={`/explore?type=${t.id}`}>
              <span className="home-category-ic"><Icon name={t.icon} size={22} /></span>
              <span><strong>{t.plural}</strong><small>Explore listings</small></span>
              <Icon name="arrow-up-right" size={18} className="home-category-arrow" />
            </Link>
          ))}
          <Link className="home-category" href="/projects">
            <span className="home-category-ic"><Icon name="building-2" size={22} /></span>
            <span><strong>Projects</strong><small>See available plots</small></span>
            <Icon name="arrow-up-right" size={18} className="home-category-arrow" />
          </Link>
        </div>
      </section>

      <section className="container home-section">
        <div className="home-heading">
          <div>
            <span className="home-eyebrow">PROPERTY DISCOVERY</span>
            <h2>Properties worth exploring</h2>
            <p>Start with a few interesting places, or see everything on the map.</p>
          </div>
          <Link className="home-text-link" href="/explore">View all properties <Icon name="arrow-right" size={16} /></Link>
        </div>
        <div className="grid g3 home-property-grid">
          {data.featured.map((l) => <PropertyCard key={l.id} listing={l} />)}
        </div>
      </section>

      <section className="home-section home-soft-section">
        <div className="container">
          <div className="home-heading">
            <div>
              <span className="home-eyebrow">NEW DEVELOPMENTS</span>
              <h2>Explore projects, plot by plot</h2>
              <p>See project locations and browse individual plot availability.</p>
            </div>
            <Link className="home-text-link" href="/projects">Explore projects <Icon name="arrow-right" size={16} /></Link>
          </div>
          <div className="grid g2 home-project-grid">
            {data.spotlight.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      </section>

      <section className="container home-section home-how">
        <div className="home-heading">
          <div>
            <span className="home-eyebrow">SIMPLE BY DESIGN</span>
            <h2>From searching to visiting</h2>
            <p>Find the right place in three easy steps.</p>
          </div>
        </div>
        <div className="home-steps">
          {STEPS.map(([ic, t, d], i) => (
            <div className="home-step" key={t}>
              <span className="home-step-icon"><Icon name={ic} size={22} /></span>
              <span className="home-step-index">0{i + 1}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container home-bottom-section">
        <div className="home-bottom-cta">
          <div>
            <span className="home-eyebrow">FOR PROPERTY OWNERS</span>
            <h2>Have a property to list?</h2>
            <p>Create a listing and manage buyer enquiries from your workspace.</p>
          </div>
          <Link className="btn btn-primary btn-lg" href="/seller/listings/new">List your property <Icon name="arrow-right" size={17} /></Link>
        </div>
      </section>
    </>
  );
}
