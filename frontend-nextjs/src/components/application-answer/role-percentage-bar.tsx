import { RoleDetails } from "@/models/campaign";

export default function RolePercentageBar({
  selectedRoleIds,
  rolePercentages,
  roles,
  totalPercentage,
  percentageInvalid,
  dict,
}: {
  selectedRoleIds: string[];
  rolePercentages: Record<string, number>;
  roles: RoleDetails[] | undefined;
  totalPercentage: number;
  percentageInvalid: boolean;
  dict: any;
}) {
  if (selectedRoleIds.length === 0) return null;

  // when the total exceeds 100, scale everything down so the bar
  // still fills exactly one container width instead of overflowing
  const scale = totalPercentage > 100 ? 100 / totalPercentage : 1;

  let running = 0;
  const segments = selectedRoleIds.map((roleId, index) => {
    const pct = rolePercentages[roleId] ?? 0;
    const start = running;
    running += pct;
    const end = running;
    return {
      roleId,
      pct,
      index,
      displayStart: start * scale,
      displayEnd: end * scale,
    };
  });

  return (
    <div className="mb-6">
      <div className="mb-2">
        <h3 className="text-lg font-bold sm:text-xl">
          {dict.applicationpage.selected_roles}
        </h3>
        {percentageInvalid && (
          <p className="mt-1 text-right text-xs font-medium text-destructive sm:text-sm">
            {dict.applicationpage.preference_total_error.replace(
              "{total}",
              String(totalPercentage),
            )}
          </p>
        )}
      </div>
      <div className="relative h-8 w-full overflow-hidden rounded-full border-2 border-primary bg-background">
        {segments.map(({ roleId, pct, displayStart, displayEnd }) =>
          pct <= 0 ? null : (
            <div
              key={roleId}
              style={{
                left: `${displayStart}%`,
                width: `${displayEnd - displayStart}%`,
              }}
              className={`absolute inset-y-0 bg-violet-50 ${
                displayEnd < 100 ? "border-r-2 border-primary" : ""
              }`}
            />
          ),
        )}
        {segments.map(({ roleId, pct, displayStart, displayEnd }) =>
          pct <= 0 ? null : (
            <div
              key={`label-${roleId}`}
              style={{
                left: `${displayStart}%`,
                width: `${displayEnd - displayStart}%`,
              }}
              className="absolute inset-y-0 flex items-center justify-center overflow-hidden"
            >
              <span className="truncate px-1 text-lg font-semibold sm:text-xl">
                {pct}%
              </span>
            </div>
          ),
        )}
      </div>
      <div className="relative mt-2 h-5">
        {segments.map(({ roleId, pct, displayStart, displayEnd }) => {
          if (pct <= 0) return null;
          const role = roles?.find((r) => String(r.id) === String(roleId));
          return (
            <div
              key={`name-${roleId}`}
              style={{
                left: `${displayStart}%`,
                width: `${displayEnd - displayStart}%`,
              }}
              className="absolute inset-y-0 flex items-center justify-center overflow-hidden text-center"
            >
              <p className="truncate text-sm font-semibold sm:text-base">
                {role?.name ?? `Role ${roleId}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
