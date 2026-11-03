'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PHOTO_FALLBACKS } from '../data/photo-fallbacks';

export default function PhotoImg({ src, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const [url, setUrl] = useState(src);
  const ref = useRef<HTMLImageElement>(null);

  const fallback = useCallback(() => {
    const f = PHOTO_FALLBACKS[src];
    if (f) setUrl((cur) => (cur === f ? cur : f));
  }, [src]);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) fallback();
  }, [fallback]);

  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} ref={ref} src={url} alt={rest.alt ?? ''} onError={fallback} />;
}
