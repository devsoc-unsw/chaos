import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { RoleDetails } from "@/models/campaign";
import { RoleCard } from "./role-card";

export default function RoleSelector({
  roles,
  maxRolesPerApplication,
  selectedRoleIds,
  onChangeSelectedRoles,
  dict
}: {
  roles: RoleDetails[] | undefined;
  maxRolesPerApplication: number | null | undefined,
  selectedRoleIds: string[];
  onChangeSelectedRoles: (next: string[]) => void;
  applicationId: string;
  dict: any;
}) {
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
      if (maxRolesPerApplication && selectedRoleIds.length + 1 > maxRolesPerApplication) return;
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
    <div className="w-full rounded-xl border bg-card p-4 shadow-sm xl:sticky xl:top-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold sm:text-xl">{dict.common.roles}</h2>
        {
          maxRolesPerApplication && (
            <p className="text-sm text-muted-foreground">
              {dict.applicationpage.max_roles.replace(
                "{roles}",
                String(maxRolesPerApplication)
              )}
            </p>
          )
        }
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {/* Selected roles (draggable & reorderable) */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">{dict.applicationpage.selected_roles}</h3>
            <p className="text-xs text-muted-foreground">{dict.applicationpage.drag_to_reorder}</p>
          </div>
          <Droppable droppableId="selected-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-[44px] space-y-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-2"
              >
                {selectedRoleIds.length === 0 && (
                  <div className="text-sm text-muted-foreground px-2 py-1">{dict.applicationpage.empty_selected_roles}</div>
                )}
                {selectedRoleIds.map((id, index) => {
                  const role = roles?.find((r) => String(r.id) === id);
                  if (!role) return null;
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

          <h3 className="mb-2 text-sm font-semibold text-foreground">{dict.applicationpage.available_roles}</h3>
          <Droppable droppableId="available-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-[44px] space-y-2 rounded-lg border-2 border-dashed border-muted bg-muted/20 p-2"
              >
                {selectedRoleIds.length === roles?.length && (
                  <div className="text-sm text-muted-foreground px-2 py-1">{dict.applicationpage.empty_available_roles}</div>
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