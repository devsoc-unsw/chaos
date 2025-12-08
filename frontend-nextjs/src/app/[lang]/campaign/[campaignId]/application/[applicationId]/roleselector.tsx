import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CampaignRole } from "@/models/campaign";
import { Info } from "lucide-react";

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

    if (
      source.droppableId === "selected-roles" &&
      destination.droppableId === "selected-roles"
    ) {
      const [moved] = newOrder.splice(source.index, 1);
      newOrder.splice(destination.index, 0, moved);
      onChangeSelectedRoles(newOrder);
      return;
    }

    if (
      source.droppableId === "available-roles" &&
      destination.droppableId === "selected-roles"
    ) {
      newOrder.splice(destination.index, 0, draggableId);
      onChangeSelectedRoles(newOrder);
      return;
    }

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
          {/* Selected roles (draggable & reorderable) */}
          <Droppable droppableId="selected-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[12px] border-2 border-dashed border-gray-200 rounded-lg p-2"
              >
                {selectedRoleIds.length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-1">Drag a role from below to apply</div>
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
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  selected ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-blue-200 text-blue-800 rounded-full">
                                      {index + 1}
                                    </span>
                                    <h3 className="font-medium text-sm truncate">{role.name}</h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {role.description && (
                                      <div className="group relative">
                                        <Info tw="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                          {role.description}
                                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                      </div>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      selected
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}>
                                      Selected
                                    </span>
                                  </div>
                                </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}

                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Available roles (draggable into selected) */}
          <Droppable droppableId="available-roles">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[12px] border-2 border-dashed border-gray-200 rounded-lg p-2"
              >
                {selectedRoleIds.length === roles?.length && (
                    <div className="text-sm text-gray-500 px-2 py-1">All roles selected</div>
                )}
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
                        <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">{role.name}</h3>
                            <div className="flex items-center gap-2">
                                {role.description && (
                                <div className="group relative">
                                    <Info tw="h-4 w-4 text-blue-500 hover:text-blue-600 transition-colors" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                    {role.description}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                                )}
                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">Select</span>
                            </div>
                            </div>
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