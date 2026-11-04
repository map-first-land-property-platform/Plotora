"use client";

import { useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { PropertyImage } from "@/types/property";

interface PropertyGalleryProps {
  images: readonly PropertyImage[];
  title: string;
}

interface GalleryImageProps {
  image: PropertyImage;
  alt: string;
  sizes: string;
  loading?: "eager" | "lazy";
}

function GalleryImage({
  image,
  alt,
  sizes,
  loading = "lazy",
}: GalleryImageProps) {
  const [hasError, setHasError] = useState(false);
  const source = image.url.trim();

  if (!source || hasError) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 p-3 text-center text-sm text-slate-600">
        Image unavailable
      </div>
    );
  }

  return (
    <Image
      src={source}
      alt={alt}
      fill
      unoptimized
      sizes={sizes}
      loading={loading}
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

function PropertyGalleryContent({
  images,
  title,
}: PropertyGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];
  const hasMultipleImages = images.length > 1;

  function showPreviousImage() {
    setSelectedIndex(
      (currentIndex) =>
        (currentIndex - 1 + images.length) % images.length,
    );
  }

  function showNextImage() {
    setSelectedIndex(
      (currentIndex) => (currentIndex + 1) % images.length,
    );
  }

  return (
    <section
      aria-label="Property photos"
      className="min-w-0 space-y-3"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100 sm:aspect-[16/7]">
        {selectedImage ? (
          <GalleryImage
            key={selectedImage.url}
            image={selectedImage}
            alt={selectedImage.alt.trim() || title}
            sizes="(min-width: 1152px) 1104px, 100vw"
            loading="eager"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-slate-600">
            No photos are available for this property.
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-sm text-slate-600"
          >
            Photo {selectedIndex + 1} of {images.length}
          </p>

          {hasMultipleImages && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-4"
                aria-label="Previous photo"
                onClick={showPreviousImage}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-4"
                aria-label="Next photo"
                onClick={showNextImage}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {hasMultipleImages && (
        <ul
          aria-label="Choose a property photo"
          className="flex gap-3 overflow-x-auto p-1"
        >
          {images.map((image, index) => (
            <li
              key={`${image.url}:${image.order}:${index}`}
              className="shrink-0"
            >
              <button
                type="button"
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-pressed={index === selectedIndex}
                onClick={() => setSelectedIndex(index)}
                className="relative block h-20 w-28 overflow-hidden rounded-lg border-2 border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 aria-pressed:border-teal-700"
              >
                <GalleryImage
                  image={image}
                  alt=""
                  sizes="112px"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PropertyGallery({
  images,
  title,
}: PropertyGalleryProps) {
  // Preserve the supplied data while applying its display order.
  const orderedImages = [...images].sort(
    (first, second) => first.order - second.order,
  );

  // Reset selection when photos are added, removed, replaced or reordered.
  const galleryKey = JSON.stringify(
    orderedImages.map((image) => [image.url, image.order]),
  );

  return (
    <PropertyGalleryContent
      key={galleryKey}
      images={orderedImages}
      title={title}
    />
  );
}
