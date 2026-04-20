"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { RoleDetails } from "@/models/campaign";

export default function TabSwitcher({
  roles,
  selectedRoleIds,
  activeTab,
  onChangeActiveTab,
  dict,
}: {
  roles: RoleDetails[] | undefined;
  selectedRoleIds: string[];
  activeTab: string;
  onChangeActiveTab: (next: string) => void;
  dict: any;
}) {
  const tabOrder = ["general", ...selectedRoleIds];
  const currentIndex = tabOrder.indexOf(activeTab);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex >= 0 && currentIndex < tabOrder.length - 1;

  return (
    <div className="absolute bottom-0 left-0 z-10 md:flex hidden items-center gap-1 p-4">
      <button
        aria-label="Previous tab"
        disabled={!canGoPrev}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        onClick={() => canGoPrev && onChangeActiveTab(tabOrder[currentIndex - 1])}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Next tab"
        disabled={!canGoNext}
        className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        onClick={() => canGoNext && onChangeActiveTab(tabOrder[currentIndex + 1])}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
