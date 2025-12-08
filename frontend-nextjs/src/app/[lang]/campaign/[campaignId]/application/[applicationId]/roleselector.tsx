import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CampaignRole } from "@/models/campaign";

export default function RoleSelector({
  roles,
  selectedRoleIds,
  onChangeSelectedRoles,
}: {
  roles: CampaignRole[] | undefined;
  selectedRoleIds: string[];
  onChangeSelectedRoles: (next: string[]) => void;
}) {
    const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    let newOrder = [...selectedRoleIds];

    // Reorder within selected
    if (
      source.droppableId === "selected-roles" &&
      destination.droppableId === "selected-roles"
    ) {
      const [moved] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, moved);
      onChangeSelectedRoles(newOrder);
      return;
    }

    // Move available → selected
    if (
      source.droppableId === "available-roles" &&
      destination.droppableId === "selected-roles"
    ) {
      newOrder.splice(destination.index, 0, draggableId);
      onChangeSelectedRoles(newOrder);
      return;
    }

    // Move selected → available
    if (
      source.droppableId === "selected-roles" &&
      destination.droppableId === "available-roles"
    ) {
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
      <h2 className="text-xl font-semibold mb-4">Roles</h2>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="space-y-6">
          {/* Selected */}
          <Droppable droppableId="selected-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="border rounded p-2 min-h-[20px] space-y-2"
              >
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
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className="p-3 bg-blue-50 border rounded"
                        >
                          {index + 1}. {role.name}
                        </div>
                      )}
                    </Draggable>
                  );
                })}

                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Available */}
          <Droppable droppableId="available-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="border rounded p-2 min-h-[20px] space-y-2"
              >
                {availableRoles?.map((role, index) => (
                  <Draggable
                    key={String(role.id)}
                    draggableId={String(role.id)}
                    index={index}
                  >
                    {(drag) => (
                      <div
                        ref={drag.innerRef}
                        {...drag.draggableProps}
                        {...drag.dragHandleProps}
                        className="p-3 bg-white border rounded cursor-pointer"
                        onClick={() =>
                          onChangeSelectedRoles([
                            ...selectedRoleIds,
                            String(role.id),
                          ])
                        }
                      >
                        {role.name}
                      </div>
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