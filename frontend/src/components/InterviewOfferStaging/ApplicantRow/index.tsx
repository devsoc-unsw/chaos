import { EmailOutlined } from "@mui/icons-material";
import tw from "twin.macro";

import RoleSelector from "../RoleSelector";
import StatusBadge from "../StatusBadge";

import type { Applicant } from "pages/interview_offer_staging_test/sampleData";
import type React from "react";

interface ApplicantRowProps {
  applicant: Applicant;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onRoleChange: (id: number, role: string) => void;
  onSendEmail: (applicant: Applicant) => void;
  roleOptions: string[];
}

const ApplicantRow: React.FC<ApplicantRowProps> = ({
  applicant,
  isSelected,
  onSelect,
  onRoleChange,
  onSendEmail,
  roleOptions,
}) => (
  <tr css={tw`border-b transition-colors hover:bg-gray-50`}>
    <td css={tw`px-4 py-2 align-middle`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(applicant.id)}
        css={tw`h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:ring-2 focus-visible:ring-blue-500`}
      />
    </td>
    <td css={tw`px-4 py-2 align-middle`}>
      <div css={tw`font-medium`}>{applicant.name}</div>
    </td>
    <td css={tw`px-4 py-2 align-middle`}>
      <div css={tw`text-gray-500`}>{applicant.zid}</div>
    </td>
    <td css={tw`px-4 py-2 align-middle`}>
      <StatusBadge status={applicant.status} />
    </td>
    <td css={tw`px-4 py-2 align-middle`}>
      <RoleSelector
        value={applicant.role}
        onChange={(role) => onRoleChange(applicant.id, role)}
        roleOptions={roleOptions}
      />
    </td>
    <td css={tw`px-4 py-2 align-middle`}>
      <button
        type="button"
        onClick={() => onSendEmail(applicant)}
        css={tw`inline-flex items-center gap-2 h-8 px-3 rounded-md bg-blue-600 text-white text-sm font-medium transition-colors hover:bg-blue-700`}
      >
        <EmailOutlined fontSize="small" />
        Send
      </button>
    </td>
  </tr>
);

export default ApplicantRow;
