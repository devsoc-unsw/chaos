import { DraggableProvided} from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react"
import { RoleDetails } from "@/models/campaign";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export function RoleCard({
  role,
  index,
  selected,
  drag,
  onClick,
  dict
}: {
  role: RoleDetails;
  index?: number;
  selected: boolean;
  drag: DraggableProvided;
  dict: any;
  onClick?: () => void;
}) {
  return (
    <div
      ref={drag?.innerRef}
      {...drag.draggableProps}
      {...drag.dragHandleProps}
      title="draggable"
      onClick={onClick}
      className={`
        p-3 rounded-lg border-2 transition-all cursor-pointer bg-card
        ${selected ? "border-primary" : "border-border hover:border-primary"}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="cursor-grab text-muted-foreground select-none"
          >
            {selected ? (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {index! + 1}
              </span>
            ) : <GripVertical/>}
          </div>
          <h3 className="font-medium text-sm truncate">{role.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          {role.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="top">
                {role.description}
              </TooltipContent>
            </Tooltip>
          )}

          <span
            className={`text-xs px-2 py-1 rounded-full ${
              selected
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {selected ? dict.common.selected : dict.common.select}
          </span>
        </div>
      </div>
    </div>
  );
}