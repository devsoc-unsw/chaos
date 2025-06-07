import { EmailOutlined, FilterAlt } from "@mui/icons-material";
import tw from "twin.macro";

import { STATUS_OPTIONS } from "pages/interview_offer_staging_test/sampleData";

import type React from "react";

interface TableControlsProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onSendSelected: () => void;
}

const TableControls: React.FC<TableControlsProps> = ({
  statusFilter,
  onStatusFilterChange,
  selectedCount,
  totalCount,
  onSelectAll,
  onSendSelected,
}) => (
  <div css={tw`flex flex-col sm:flex-row gap-4 mb-6`}>
    {/* Status Filter */}
    <div css={tw`flex items-center gap-2`}>
      <svg
        css={tw`w-4 h-4 text-gray-500`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <FilterAlt />
      </svg>
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value)}
        css={tw`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>

    <div css={tw`flex gap-3`}>
      <button
        type="button"
        onClick={onSelectAll}
        css={tw`inline-flex items-center gap-2 h-10 px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium transition-colors hover:bg-gray-50`}
      >
        {selectedCount === totalCount ? "Deselect All" : "Select All"}
      </button>

      <button
        type="button"
        onClick={onSendSelected}
        disabled={selectedCount === 0}
        css={tw`inline-flex items-center gap-2 h-10 px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium transition-colors hover:bg-blue-700`}
      >
        <EmailOutlined fontSize="small" />
        Send Selected ({selectedCount})
      </button>
    </div>
  </div>
);

export default TableControls;
