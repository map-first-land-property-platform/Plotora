import type { Metadata } from "next";

import { BuyerPortal } from "@/features/buyer/components/buyer-portal";

export const metadata: Metadata = {
  title: "Explore Properties | Plotora",
  description: "Browse properties published by sellers on Plotora.",
};

export default function PropertiesPage() {
  return <BuyerPortal view="properties" />;
}
