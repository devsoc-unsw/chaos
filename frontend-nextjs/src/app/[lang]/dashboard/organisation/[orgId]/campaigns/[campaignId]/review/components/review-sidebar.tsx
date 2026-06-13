"use client";

import { ApplicationDetails } from "@/models/application";
import { RoleDetails } from "@/models/campaign";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarItem } from "@/components/application-review/sidebar-item";
import { privateStatusLabel } from "@/lib/utils";

export function ReviewSidebar({
  upNext,
  reviewed,
  selectedAppId,
  onSelect,
  campaignRoles,
  portFilter,
  onPortFilterChange,
}: {
  upNext: ApplicationDetails[];
  reviewed: ApplicationDetails[];
  selectedAppId: string | null;
  onSelect: (id: string) => void;
  campaignRoles: RoleDetails[] | undefined;
  portFilter: string;
  onPortFilterChange: (v: string) => void;
}) {
  return (
    <div className="w-52 shrink-0 border-r flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b shrink-0">
        <Select value={portFilter} onValueChange={onPortFilterChange}>
          <SelectTrigger className="h-8 w-full text-sm">
            <SelectValue placeholder="Filter by port" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ports</SelectItem>
            {campaignRoles?.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {upNext.length > 0 && (
          <div>
            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
              Up Next ({upNext.length}):
            </p>
            {upNext.map((app) => (
              <SidebarItem
                key={app.id}
                app={app}
                selected={selectedAppId === app.id}
                statusLabel={privateStatusLabel(app.private_status)}
                onClick={() => onSelect(app.id)}
              />
            ))}
          </div>
        )}
        {reviewed.length > 0 && (
          <div>
            <p className="px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground">
              Reviewed ({reviewed.length}):
            </p>
            {reviewed.map((app) => (
              <SidebarItem
                key={app.id}
                app={app}
                selected={selectedAppId === app.id}
                statusLabel={privateStatusLabel(app.private_status)}
                onClick={() => onSelect(app.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
