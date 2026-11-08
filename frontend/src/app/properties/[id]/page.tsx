import { Suspense } from "react";
import type { Metadata } from "next";
import { io } from "next/cache";
import { PropertyDetailsLoader } from "@/features/property/components/property-details-loader";

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

  return <PropertyDetailsLoader id={id} />;
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
