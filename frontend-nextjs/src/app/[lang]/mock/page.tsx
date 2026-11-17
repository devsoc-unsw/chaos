import type { Metadata } from "next";
import AvailabilityPage from "./availability-page";

export const metadata: Metadata = {
  title: "Availability",
};

export default function MockAvailabilityPage() {
  return <AvailabilityPage />;
}
