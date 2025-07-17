import React from "react";
import tw from "twin.macro";

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  roleOptions: string[];
}

const RoleSelector: React.FC<RoleSelectorProps> = ({
  value,
  onChange,
  roleOptions,
}) => (
  <div css={tw`relative`}>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      css={tw`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500`}
    >
      <option value="">Select role...</option>
      {roleOptions.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>

    <svg
      css={tw`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
    </svg>
  </div>
);

export default RoleSelector;
