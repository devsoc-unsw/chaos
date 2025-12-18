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
        <div className="flex border-b border-accent mb-6 gap-2">
              <button
                className={`px-4 py-2 font-medium ${
                  activeTab === "general" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onChangeActiveTab("general")}
              >
                General
              </button>
              {selectedRoleIds.map((rid) => (
                <button
                  key={rid}
                  className={`px-4 py-2 font-medium ${
                    activeTab === rid ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => onChangeActiveTab(rid)}
                >
                  {roles?.find((r) => String(r.id) === rid)?.name ?? `Role ${rid}`}
                </button>
              ))}
            </div>
    )
}
