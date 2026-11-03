import Link from 'next/link';

export default function Brand({ light = false, width }: { light?: boolean; width?: number }) {
  return (
    <Link className={`brand ${light ? 'brand-light' : ''}`} href="/" aria-label="Plotora home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="brand-logo-image"
        src="/assets/images/plotora-logo-transparent.png"
        alt="Plotora — Map first. Own smarter."
        style={{ ['--brand-logo-width' as string]: `${width ?? 155}px` }}
      />
    </Link>
  );
}
