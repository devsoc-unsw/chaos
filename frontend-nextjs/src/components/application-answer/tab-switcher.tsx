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
    <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:p-4">
      <p className="text-xs text-muted-foreground sm:text-sm">
        {currentIndex + 1}/{tabOrder.length}
      </p>
      <div className="flex items-center gap-1">
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
    </div>
  );
}
