import { CampaignRole } from "@/models/campaign";

export default function RoleTabs({
  roles,
  selectedRoleIds,
  activeTab,
  onChangeActiveTab
}: {
  roles: CampaignRole[] | undefined;
  selectedRoleIds: string[];
  activeTab: string;
  onChangeActiveTab: (next: string) => void;
}) {
    return (
        <div className="flex border-b border-gray-200 mb-6 gap-2">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "general" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => onChangeActiveTab("general")}
              >
                General
              </button>
              {selectedRoleIds.map((rid) => (
                <button
                  key={rid}
                  className={`px-4 py-2 font-medium ${
                    activeTab === rid ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => onChangeActiveTab(rid)}
                >
                  {roles?.find((r) => String(r.id) === rid)?.name ?? `Role ${rid}`}
                </button>
              ))}
            </div>
    )
}
