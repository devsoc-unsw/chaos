import React, { useMemo, useState } from "react";
import tw from "twin.macro";

import {
  ROLE_OPTIONS,
  SAMPLE_APPLICANTS,
} from "pages/interview_offer_staging_test/sampleData";

import ApplicantRow from "../ApplicantRow";
import TableControls from "../TableControls";

import type { Applicant } from "pages/interview_offer_staging_test/sampleData";

const ApplicantTable: React.FC = () => {
  const [applicants, setApplicants] = useState<Applicant[]>(SAMPLE_APPLICANTS);
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(
    new Set()
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredApplicants = useMemo(() => {
    if (statusFilter === "all") return applicants;
    return applicants.filter((a) => a.status === statusFilter);
  }, [applicants, statusFilter]);

  const handleRoleChange = (id: number, role: string) =>
    setApplicants((prev) =>
      prev.map((a) => (a.id === id ? { ...a, role } : a))
    );

  const handleSelectApplicant = (id: number) => {
    const next = new Set(selectedApplicants);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedApplicants(next);
  };

  const handleSelectAll = () => {
    if (selectedApplicants.size === filteredApplicants.length) {
      setSelectedApplicants(new Set());
    } else {
      setSelectedApplicants(new Set(filteredApplicants.map((a) => a.id)));
    }
  };

  // Stubs
  const handleSendEmail = (_: Applicant) => {};
  const handleSendSelected = () => {};

  return (
    <div css={tw`p-6 w-full h-screen flex flex-col`}>
      {/* Header */}
      <div css={tw`flex-none mb-6`}>
        <h1 css={tw`text-3xl font-bold text-gray-900 mb-6`}>
          Interview Offer Staging
        </h1>
        <TableControls
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          selectedCount={selectedApplicants.size}
          totalCount={filteredApplicants.length}
          onSelectAll={handleSelectAll}
          onSendSelected={handleSendSelected}
        />
      </div>

      {/* Table wrapper now handles scrolling */}
      <div css={tw`flex-1 overflow-auto rounded-lg border border-gray-200 bg-white`}>
        <table css={tw`w-full table-fixed`}>
          <colgroup>
            <col css={tw`w-12`} />
            <col css={tw`w-48`} />
            <col css={tw`w-32`} />
            <col css={tw`w-32`} />
            <col css={tw`w-48`} />
            <col css={tw`w-24`} />
          </colgroup>
          <thead css={tw`bg-gray-50`}>
            <tr>
              <th css={tw`px-4 py-2 text-left`}>
                <input
                  type="checkbox"
                  checked={
                    filteredApplicants.length > 0 &&
                    selectedApplicants.size === filteredApplicants.length
                  }
                  onChange={handleSelectAll}
                  css={tw`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500`}
                />
              </th>
              {["Name", "zID", "Status", "Role", "Actions"].map((h) => (
                <th
                  key={h}
                  css={tw`px-4 py-2 text-left text-sm font-medium text-gray-900`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody css={tw`bg-white divide-y divide-gray-200`}>
            {filteredApplicants.map((app) => (
              <ApplicantRow
                key={app.id}
                applicant={app}
                isSelected={selectedApplicants.has(app.id)}
                onSelect={handleSelectApplicant}
                onRoleChange={handleRoleChange}
                onSendEmail={handleSendEmail}
                roleOptions={ROLE_OPTIONS}
              />
            ))}
          </tbody>
        </table>

        {filteredApplicants.length === 0 && (
          <div css={tw`flex h-full items-center justify-center text-gray-500`}>
            No applicants found for the selected status.
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicantTable;
