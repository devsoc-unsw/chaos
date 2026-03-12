"use client"
import {RoleDetails} from "@/models/campaign";

export default function RoleTabs({
  roles,
  selectedRoleIds,
  activeTab,
  onChangeActiveTab,
  dict
}: {
  roles: RoleDetails[] | undefined;
  selectedRoleIds: string[];
  activeTab: string;
  onChangeActiveTab: (next: string) => void;
  dict: any;
}) {
    return (
        <div className="mb-4 flex min-w-max gap-2 border-b border-accent pb-2 sm:mb-6">
              <button
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                  activeTab === "general" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                onClick={() => onChangeActiveTab("general")}
              >
                {dict.applicationpage.general}
              </button>
              {selectedRoleIds.map((rid) => (
                <button
                  key={rid}
                  className={`rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    activeTab === rid ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  onClick={() => onChangeActiveTab(rid)}
                >
                  {roles?.find((r) => String(r.id) === rid)?.name ?? `Role ${rid}`}
                </button>
              ))}
            </div>
    )
}
