import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  FURNISHING_LABELS,
  LISTING_TYPE_LABELS,
  formatDate,
  formatExtent,
  formatFloorArea,
  formatMonthlyRent,
  formatPrice,
  formatPricePerPerch,
} from "@/lib/format";
import type { PropertyDetails } from "@/types/property";

interface PropertyDetailsViewProps {
  property: PropertyDetails;
}

interface PropertyFactProps {
  label: string;
  children: ReactNode;
}

function PropertyFact({ label, children }: PropertyFactProps) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd className="mt-1 font-medium text-slate-900">
        {children ?? "—"}
      </dd>
    </div>
  );
}

export function PropertyDetailsView({
  property,
}: PropertyDetailsViewProps) {
  const {
    landDetails,
    buildingDetails,
    rentalDetails,
  } = property;

  // Sort a copy so rendering does not change the supplied property data.
  const coverImage = [...property.images].sort(
    (first, second) => first.order - second.order,
  )[0];

  const features = [...new Set(property.features)];

  const displayPrice =
    property.listingType === "RENT"
      ? formatMonthlyRent(rentalDetails?.monthlyRent ?? property.price)
      : formatPrice(property.price);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link
                href="/"
                className="text-teal-700 underline-offset-4 hover:underline"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-400">
              /
            </li>
            <li aria-current="page">Property details</li>
          </ol>
        </nav>

        <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-200 sm:aspect-[16/7]">
          <Image
            src={coverImage?.url || "/mock/property-placeholder.svg"}
            alt={coverImage?.alt || "Property image placeholder"}
            fill
            sizes="(min-width: 1152px) 1104px, 100vw"
            loading="eager"
            className="object-cover"
          />
        </div>

        <header className="flex flex-col gap-5 lg:flex-row lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-teal-700 text-white">
                {LISTING_TYPE_LABELS[property.listingType]}
              </Badge>
              <Badge variant="outline">
                {CATEGORY_LABELS[property.category]}
              </Badge>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {property.title}
            </h1>

            <p className="text-slate-600">
              {property.location.address}
            </p>
          </div>

          <div className="space-y-1 lg:text-right">
            <p className="text-2xl font-semibold text-teal-800">
              {displayPrice}
            </p>

            {property.listingType === "SALE" &&
              landDetails?.pricePerPerch != null && (
                <p className="text-sm text-slate-600">
                  {formatPricePerPerch(landDetails.pricePerPerch)}
                </p>
              )}
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <section aria-labelledby="property-overview-heading">
              <Card>
                <CardHeader>
                  <h2
                    id="property-overview-heading"
                    className="text-lg font-semibold"
                  >
                    Overview
                  </h2>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line leading-7 text-slate-600">
                    {property.description.trim() ||
                      "No description has been provided."}
                  </p>
                </CardContent>
              </Card>
            </section>

            <section aria-labelledby="property-specifications-heading">
              <Card>
                <CardHeader>
                  <h2
                    id="property-specifications-heading"
                    className="text-lg font-semibold"
                  >
                    Property specifications
                  </h2>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <PropertyFact label="Reference">
                      {property.referenceCode}
                    </PropertyFact>
                    <PropertyFact label="District">
                      {property.location.district}
                    </PropertyFact>

                    {landDetails && (
                      <>
                        <PropertyFact label="Land area">
                          {formatExtent(landDetails.extentPerches)}
                        </PropertyFact>
                        <PropertyFact label="Deed type">
                          {landDetails.deedType}
                        </PropertyFact>
                        <PropertyFact label="Road access">
                          {landDetails.roadAccessFt == null
                            ? "—"
                            : `${landDetails.roadAccessFt} ft`}
                        </PropertyFact>
                        <PropertyFact label="Facing">
                          {landDetails.facing}
                        </PropertyFact>
                      </>
                    )}

                    {buildingDetails && (
                      <>
                        <PropertyFact label="Bedrooms">
                          {buildingDetails.bedrooms}
                        </PropertyFact>
                        <PropertyFact label="Bathrooms">
                          {buildingDetails.bathrooms}
                        </PropertyFact>
                        <PropertyFact label="Floor area">
                          {formatFloorArea(buildingDetails.floorAreaSqft)}
                        </PropertyFact>
                        <PropertyFact label="Floors">
                          {buildingDetails.floors}
                        </PropertyFact>
                      </>
                    )}

                    {property.listingType === "RENT" && rentalDetails && (
                      <>
                        <PropertyFact label="Deposit">
                          {formatPrice(rentalDetails.depositAmount)}
                        </PropertyFact>
                        <PropertyFact label="Available from">
                          {formatDate(rentalDetails.availableFrom)}
                        </PropertyFact>
                        <PropertyFact label="Furnishing">
                          {rentalDetails.furnishing
                            ? FURNISHING_LABELS[rentalDetails.furnishing]
                            : "—"}
                        </PropertyFact>
                      </>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </section>

            <section aria-labelledby="property-features-heading">
              <Card>
                <CardHeader>
                  <h2
                    id="property-features-heading"
                    className="text-lg font-semibold"
                  >
                    Features
                  </h2>
                </CardHeader>
                <CardContent>
                  {features.length > 0 ? (
                    <ul className="grid list-disc gap-3 pl-5 text-slate-600 sm:grid-cols-2">
                      {features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-600">
                      No features have been listed.
                    </p>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          <aside aria-labelledby="property-owner-heading">
            <Card>
              <CardHeader>
                <h2
                  id="property-owner-heading"
                  className="text-lg font-semibold"
                >
                  Listed by
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="font-medium">{property.owner.name}</p>

                {property.owner.verified && (
                  <Badge
                    variant="outline"
                    className="border-teal-200 bg-teal-50 text-teal-800"
                  >
                    Verified owner
                  </Badge>
                )}

                <p className="text-sm text-slate-600">
                  Listed on {formatDate(property.createdAt)}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}