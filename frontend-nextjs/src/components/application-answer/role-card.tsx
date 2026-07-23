import { DraggableProvided } from "@hello-pangea/dnd";
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
  percentage,
  onPercentageChange,
  percentageInvalid,
  dict
}: {
  role: RoleDetails;
  index?: number;
  selected: boolean;
  drag: DraggableProvided;
  dict: any;
  onClick?: () => void;
  percentage?: number;
  onPercentageChange?: (value: number) => void;
  percentageInvalid?: boolean;
}) {
  const fillWidth = selected ? Math.min(Math.max(percentage ?? 0, 0), 100) : 0;

  const stopDragPropagation = {
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onTouchStart: (e: React.TouchEvent) => e.stopPropagation(),
  };

  return (
    <div
      ref={drag?.innerRef}
      {...drag.draggableProps}
      {...drag.dragHandleProps}
      title="draggable"
      onClick={onClick}
      className={`
        relative overflow-hidden p-3 rounded-lg border-2 transition-all cursor-pointer bg-card
        ${selected ? "border-primary" : "border-border hover:border-primary"}
      `}
    >
      {selected && (
        <div
          className="absolute inset-x-0 bottom-0 h-2 bg-muted"
          aria-hidden="true"
        >
          <div
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${fillWidth}%` }}
          />
        </div>
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="cursor-grab text-muted-foreground select-none"
          >
            {selected ? (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {index! + 1}
              </span>
            ) : <GripVertical />}
          </div>
          <h3 className="font-medium text-sm truncate">{role.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          {role.description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-primary" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {role.description}
              </TooltipContent>
            </Tooltip>
          )}

          {selected && (
            <div className="flex items-center gap-1" {...stopDragPropagation}>
              <input
                type="number"
                min={0}
                max={100}
                value={percentage ?? 0}
                onChange={(e) => onPercentageChange?.(Number(e.target.value))}
                className={`w-14 rounded-full border bg-background px-2 py-1 text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  percentageInvalid ? "border-destructive text-destructive" : "border-border"
                }`}
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          )}

          {!selected && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {dict.common.select}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
