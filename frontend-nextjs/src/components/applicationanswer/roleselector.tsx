import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CampaignRole } from "@/models/campaign";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RoleCard } from "./rolecard";
import { updateApplicationRoles } from "@/models/answer";

export default function RoleSelector({
  roles,
  selectedRoleIds,
  onChangeSelectedRoles,
  applicationId,
  dict
}: {
  roles: CampaignRole[] | undefined;
  selectedRoleIds: string[];
  onChangeSelectedRoles: (next: string[]) => void;
  applicationId: string;
  dict: any;
}) {

    const updateRoles = async (newOrder: string[]) => {
      try {
        await updateApplicationRoles(applicationId, newOrder);
      } catch (err) {
        console.error("Failed to update roles:", err);
      }
    }

    const handleDragEnd = async ({ source, destination, draggableId }: DropResult) => {
      if (!destination) return;
      const to = destination.droppableId;
      const from = source.droppableId;
      let newOrder = [...selectedRoleIds];

      if (to === "selected-roles" && from === "selected-roles") {
        const [moved] = newOrder.splice(source.index, 1);
        newOrder.splice(destination.index, 0, moved);
        onChangeSelectedRoles(newOrder);
        return;
      }

      if (to === "selected-roles" && from === "available-roles") {
        newOrder.splice(destination.index, 0, draggableId);
        onChangeSelectedRoles(newOrder);
        return;
      }

      if (to === "available-roles" && from === "selected-roles") {
        newOrder = newOrder.filter((id) => id !== draggableId);
        onChangeSelectedRoles(newOrder);
        return;
      }
    };

    const availableRoles = roles?.filter(
        (role) => !selectedRoleIds.includes(String(role.id))
    );

    return (
    <div className="w-80">
      <h2 className="text-xl font-semibold mb-4">{dict.common.roles}</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {/* Selected roles (draggable & reorderable) */}
           <h3 className="text-sm font-semibold text-foreground mb-2">{dict.applicationpage.selectedroles}</h3>
           <p className="text-sm text-muted-foreground mb-2">{dict.applicationpage.dragtoreorder}</p>
          <Droppable droppableId="selected-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[12px] border-2 border-dashed rounded-lg p-2"
              >
                {selectedRoleIds.length === 0 && (
                    <div className="text-sm text-muted-foreground px-2 py-1">{dict.applicationpage.emptyselectedroles}</div>
                )}
                {selectedRoleIds.map((id, index) => {
                  const role = roles?.find((r) => String(r.id) === id);
                  if (!role) return null;
                  const selected = true;
                  return (
                    <Draggable
                      key={id}
                      draggableId={id}
                      index={index}
                    >
                      {(drag) => (
                        <RoleCard
                          role={role}
                          index={index}
                          selected={true}
                          drag={drag}
                          dict={dict}
                        />
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <h3 className="text-sm font-semibold text-foreground mb-2">{dict.applicationpage.availableroles}</h3>
          <Droppable droppableId="available-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[12px] border-2 border-dashed border-muted rounded-lg p-2"
              >
                {selectedRoleIds.length === roles?.length && (
                    <div className="text-sm text-muted-foreground px-2 py-1">{dict.applicationpage.emptyavailableroles}</div>
                )}
                {availableRoles?.map((role, index) => (
                  <Draggable
                    key={String(role.id)}
                    draggableId={String(role.id)}
                    index={index}
                  >
                    {(drag) => (
                      <RoleCard
                        role={role}
                        index={index}
                        selected={false}
                        drag={drag}
                        dict={dict}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>
    </div>
  );
}