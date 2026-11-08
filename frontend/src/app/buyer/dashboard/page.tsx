import type { Metadata } from "next";

import { BuyerPortal } from "@/features/buyer/components/buyer-portal";

export const metadata: Metadata = {
  title: "Buyer Dashboard | Plotora",
  description: "Browse published properties and open their details on Plotora.",
};

export default function BuyerDashboardPage() {
  return <BuyerPortal view="dashboard" />;
}
