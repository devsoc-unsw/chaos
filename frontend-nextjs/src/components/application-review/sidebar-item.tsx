import { ApplicationDetails } from "@/models/application";
import { cn } from "@/lib/utils";

export function SidebarItem({
  app,
  selected,
  statusLabel,
  onClick,
}: {
  app: ApplicationDetails;
  selected: boolean;
  statusLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-2 px-3 py-2 border-b text-left hover:bg-muted transition-colors",
        selected && "bg-muted",
      )}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-sm shrink-0 mt-0.5",
          app.private_status === "Rejected" && "bg-red-500",
          app.private_status === "Successful" && "bg-emerald-500",
          app.private_status === "Pending" && "bg-yellow-400",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{app.user.name}</p>
        <p className="text-xs text-muted-foreground">
          {app.applied_roles.length > 0
            ? app.applied_roles.map((r) => r.role_name).join(", ")
            : statusLabel}
        </p>
      </div>
    </button>
  );
}
