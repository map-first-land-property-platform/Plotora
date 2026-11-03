import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { notFound } from "next/navigation";

import { PropertyDetailsView } from "@/components/property/property-details-view";
import {
  getPropertyById,
  PropertyNotFoundError,
} from "@/lib/api/properties";

import PropertyDetailsLoading from "./loading";

interface PropertyDetailsPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Property details | Plotora",
  description: "View property information, specifications and features.",
};

async function PropertyDetailsContent({
  params,
}: PropertyDetailsPageProps) {
  // Keep property retrieval, including mock delays, outside the static shell.
  await io();

  const { id } = await params;

  const property = await getPropertyById(id).catch((error: unknown) => {
    if (error instanceof PropertyNotFoundError) {
      notFound();
    }

    throw error;
  });

  if (property.status !== "PUBLISHED") {
    notFound();
  }

  return <PropertyDetailsView property={property} />;
}

export default function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
  return (
    <Suspense fallback={<PropertyDetailsLoading />}>
      <PropertyDetailsContent params={params} />
    </Suspense>
  );
}