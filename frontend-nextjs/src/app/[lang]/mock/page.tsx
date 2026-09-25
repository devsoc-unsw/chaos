import type { Metadata } from "next";
import AvailabilityPage from "./availability-page";

export const metadata: Metadata = {
  title: "Availability - Chaos",
};

export default function MockAvailabilityPage() {
  return <AvailabilityPage />;
}
