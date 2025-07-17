import type { Status } from "pages/interview_offer_staging_test/sampleData";
import type React from "react";

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span>{label}</span>;
};

export default StatusBadge;
