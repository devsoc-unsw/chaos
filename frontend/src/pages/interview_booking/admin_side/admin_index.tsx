import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DayPilotCalendar, DayPilot } from "@daypilot/daypilot-lite-react";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";



/**
 * MOCK DATA FOR ROLES, LOCATIONS, AND ADMIN USERS
 */
const ROLES = [
  "Technical Director",
  "Operations Director", 
  "Marketing Director",
  "Finance Director",
  "HR Director",
];

const LOCATIONS = [
    "Room 101 - Main Building",
    "Room 102 - Main Building", 
    "Room 201 - Engineering Wing",
    "Room 202 - Engineering Wing",
    "Conference Room A",
    "Conference Room B",
    "Virtual Meeting (Zoom)",
    "Virtual Meeting (Teams)",
    "Other"
];

const MOCK_USERS = [
  { id: "admin1", name: "Kavika" },
  { id: "admin2", name: "Isaac" }
];
const CURRENT_USER = MOCK_USERS[0];


/**
 * MAIN COMPONENT
 */

const AdminInterviewBooking = () => {
  // State to store selected time slots
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  // State to store events for the calendar
  const [events, setEvents] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);
  const [saved, setSaved] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slotId: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const mousePosition = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  // State for current week navigation
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Helper to push current state to undo stack
  const pushToUndo = useCallback(() => {
    setUndoStack((prev) => [...prev, availableSlots]);
    setRedoStack([]); // clear redo stack on new action
  }, [availableSlots]);

  // Helper to compare two roles arrays as sets (order-insensitive)
  const rolesEqual = (a: string[] = [], b: string[] = []) => {
    if (a.length !== b.length) return false;
    const setA = new Set(a);
    const setB = new Set(b);
    for (const role of setA) {
      if (!setB.has(role)) return false;
    }
    return true;
  };

  // Handler for selecting a time range (drag to select)
  const handleTimeRangeSelected = async (args: any) => {
    pushToUndo();
    // New slot has no roles by default
    const newSlot = {
      id: DayPilot.guid(),
      start: args.start,
      end: args.end,
      backColor: "#b3e6b3",
      roles: [],
      location: "",
      createdBy: CURRENT_USER,
      createdAt: new Date().toISOString(),
      cssClass: "available-slot",
      html: "Available",
      toolTip: "Click to assign roles and location",
    };
    setEvents((prev) => [...prev, newSlot]);
    setAvailableSlots((prev) => [...prev, newSlot]);
    setSaved(false);
  };

  // Handler to remove a slot
  const handleRemoveSlot = (id: string) => {
    pushToUndo();
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setAvailableSlots((prev) => prev.filter((e) => e.id !== id));
    setSaved(false);
  };

  // Clear all slots
  const handleClear = () => {
    if (availableSlots.length === 0) return;
    pushToUndo();
    setEvents([]);
    setAvailableSlots([]);
    setSaved(false);
  };

  // Save slots (simulate save)
  const handleSave = () => {
    // Here you would send availableSlots to your backend
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Undo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    setRedoStack((prev) => [availableSlots, ...prev]);
    const prevState = undoStack[undoStack.length - 1];
    setAvailableSlots(prevState);
    setEvents(prevState);
    setUndoStack((prev) => prev.slice(0, -1));
    setSaved(false);
  };

  // Redo
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    setUndoStack((prev) => [...prev, availableSlots]);
    const nextState = redoStack[0];
    setAvailableSlots(nextState);
    setEvents(nextState);
    setRedoStack((prev) => prev.slice(1));
    setSaved(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "z"))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Toggle role assignment for a slot (add/remove role)
  const handleToggleRole = (slotId: string, role: string) => {
    setAvailableSlots((prev) => {
      const updated = prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              roles: slot.roles?.includes(role)
                ? slot.roles.filter((r: string) => r !== role)
                : [...(slot.roles || []), role],
            }
          : slot
      );
      // Merge logic after roles are updated
      // Group slots by user and roles set
      const grouped: { [key: string]: any[] } = {};
      for (const slot of updated) {
        const key = JSON.stringify([slot.createdBy?.id, (slot.roles || []).slice().sort()]);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(slot);
      }
      // Merge intervals within each group
      const mergedSlots: any[] = [];
      for (const group of Object.values(grouped)) {
        const intervals = group
          .map(slot => ({ start: slot.start, end: slot.end, slot }))
          .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
        let merged: { start: any; end: any; id: any; createdBy: any; createdAt: any; location: any; roles: any; }[] = [];
        for (const interval of intervals) {
          if (merged.length === 0) {
            merged.push({ start: interval.start, end: interval.end, id: interval.slot.id, createdBy: interval.slot.createdBy, createdAt: interval.slot.createdAt, location: interval.slot.location, roles: interval.slot.roles });
          } else {
            const last = merged[merged.length - 1];
            if (interval.start < last.end && interval.end > last.start) {
              last.start = last.start < interval.start ? last.start : interval.start;
              last.end = last.end > interval.end ? last.end : interval.end;
              // Keep earliest createdAt
              last.createdAt = last.createdAt < interval.slot.createdAt ? last.createdAt : interval.slot.createdAt;
            } else {
              merged.push({ start: interval.start, end: interval.end, id: interval.slot.id, createdBy: interval.slot.createdBy, createdAt: interval.slot.createdAt, location: interval.slot.location, roles: interval.slot.roles });
            }
          }
        }
        for (const { start, end, id, createdBy, createdAt, location, roles } of merged) {
          mergedSlots.push({
            id,
            start,
            end,
            backColor: "#b3e6b3",
            roles: roles || [],
            location: location || "",
            createdBy,
            createdAt,
            cssClass: roles?.length > 0 ? "assigned-slot" : "available-slot",
            html: "Available",
            toolTip: "Click to assign roles and location",
          });
        }
      }
      setEvents(mergedSlots);
      return mergedSlots;
    });
    setSaved(false);
  };

  // Assign location to a slot
  const handleAssignLocation = (slotId: string, location: string) => {
    setAvailableSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              location: location,
            }
          : slot
      )
    );
    setEvents((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              location: location,
            }
          : slot
      )
    );
    setSaved(false);
  };

  // Remove all roles from a slot
  const handleRemoveAllRoles = (slotId: string) => {
    setAvailableSlots((prev) => {
      const updated = prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              roles: [],
            }
          : slot
      );
      // Merge logic after roles are updated
      // Group slots by user and roles set
      const grouped: { [key: string]: any[] } = {};
      for (const slot of updated) {
        const key = JSON.stringify([slot.createdBy?.id, (slot.roles || []).slice().sort()]);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(slot);
      }
      const mergedSlots: any[] = [];
      for (const group of Object.values(grouped)) {
        const intervals = group
          .map(slot => ({ start: slot.start, end: slot.end, slot }))
          .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
        let merged: { start: any; end: any; id: any; createdBy: any; createdAt: any; location: any; roles: any; }[] = [];
        for (const interval of intervals) {
          if (merged.length === 0) {
            merged.push({ start: interval.start, end: interval.end, id: interval.slot.id, createdBy: interval.slot.createdBy, createdAt: interval.slot.createdAt, location: interval.slot.location, roles: interval.slot.roles });
          } else {
            const last = merged[merged.length - 1];
            if (interval.start < last.end && interval.end > last.start) {
              last.start = last.start < interval.start ? last.start : interval.start;
              last.end = last.end > interval.end ? last.end : interval.end;
              last.createdAt = last.createdAt < interval.slot.createdAt ? last.createdAt : interval.slot.createdAt;
            } else {
              merged.push({ start: interval.start, end: interval.end, id: interval.slot.id, createdBy: interval.slot.createdBy, createdAt: interval.slot.createdAt, location: interval.slot.location, roles: interval.slot.roles });
            }
          }
        }
        for (const { start, end, id, createdBy, createdAt, location, roles } of merged) {
          mergedSlots.push({
            id,
            start,
            end,
            backColor: "#b3e6b3",
            roles: roles || [],
            location: location || "",
            createdBy,
            createdAt,
            cssClass: roles?.length > 0 ? "assigned-slot" : "available-slot",
            html: "Available",
            toolTip: "Click to assign roles and location",
          });
        }
      }
      setEvents(mergedSlots);
      return mergedSlots;
    });
    setContextMenu(null);
    setSaved(false);
  };

  // Remove location from a slot
  const handleRemoveLocation = (slotId: string) => {
    setAvailableSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              location: "",
            }
          : slot
      )
    );
    setEvents((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              location: "",
            }
          : slot
      )
    );
    setSaved(false);
  };

  // Close context menu on click outside, scroll, or resize
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    const handleScrollOrResize = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener("mousedown", handleClick);
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
    }
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [contextMenu]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Get current slot to show which roles are assigned
  const currentSlot = contextMenu ? availableSlots.find(slot => slot.id === contextMenu.slotId) : null;
  const currentRoles = currentSlot?.roles || [];
  const currentLocation = currentSlot?.location || "";

  // Context menu portal
  const contextMenuPortal =
    contextMenu &&
    ReactDOM.createPortal(
      <div
        ref={contextMenuRef}
        className="z-50 bg-white border rounded shadow-md fixed"
        style={{ left: contextMenu.x, top: contextMenu.y, minWidth: 250 }}
      >
    {/* Roles Section */}
        <div className="px-4 py-3 text-sm font-semibold text-white bg-indigo-600">
          Assign Roles
        </div>
        {ROLES.map((role) => (
        <div
            key={role}
            className={cn(
            "px-4 py-3 text-sm flex items-center justify-between transition-colors cursor-pointer rounded-md mx-1 my-0.5",
            currentRoles.includes(role)
                ? "bg-indigo-100 text-indigo-800 font-medium"
                : "hover:bg-gray-100 text-gray-700"
            )}
            onClick={() => handleToggleRole(contextMenu.slotId, role)}
        >
            <span>{role}</span>
            {currentRoles.includes(role) && (
            <span className="text-indigo-600 text-sm">✓</span>
            )}
        </div>
        ))}

        {/* Location Section */}
        <div className="px-4 py-3 text-sm font-semibold text-white bg-emerald-600 border-t-2 border-white">
          Assign Location
        </div>
        {LOCATIONS.map((location) => (
            <div
                key={location}
                className={cn(
                "px-4 py-3 text-sm flex items-center justify-between transition-colors cursor-pointer rounded-md mx-1 my-0.5",
                currentLocation === location
                    ? "bg-emerald-100 text-emerald-800 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                )}
                onClick={() => handleAssignLocation(contextMenu.slotId, location)}
            >
                <span>{location}</span>
                {currentLocation === location && (
                <span className="text-emerald-600 text-sm">✓</span>
                )}
            </div>
            ))}
        {currentLocation && (
          <div
            className="px-4 py-3 hover:bg-red-50 cursor-pointer text-sm text-red-600 border-t rounded-b-lg font-medium"
            onClick={() => handleRemoveLocation(contextMenu.slotId)}
          >
            Remove Location
          </div>
        )}
      </div>,
      document.body
    );

  // Week navigation functions
  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  // Format week display
  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
  };

  // Handler for resizing a slot (event)
  const handleEventResize = (args: any) => {
    pushToUndo();
    setAvailableSlots((prev) =>
      prev.map((slot) =>
        slot.id === args.e.data.id
          ? { ...slot, start: args.newStart, end: args.newEnd }
          : slot
      )
    );
    setEvents((prev) =>
      prev.map((slot) =>
        slot.id === args.e.data.id
          ? { ...slot, start: args.newStart, end: args.newEnd }
          : slot
      )
    );
    setSaved(false);
  };

  // Handler for moving a slot (event)
  const handleEventMove = (args: any) => {
    pushToUndo();
    setAvailableSlots((prev) =>
      prev.map((slot) =>
        slot.id === args.e.data.id
          ? { ...slot, start: args.newStart, end: args.newEnd }
          : slot
      )
    );
    setEvents((prev) =>
      prev.map((slot) =>
        slot.id === args.e.data.id
          ? { ...slot, start: args.newStart, end: args.newEnd }
          : slot
      )
    );
    setSaved(false);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center mt-10">Interview Slot Management</h1>
      <Card className="p-6 mb-8">
        
        <div className="flex gap-2 mb-4">
          <Button onClick={handleSave} disabled={saved}>
            {saved ? "Saved!" : "Save"}
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
          <Button onClick={handleUndo} variant="outline" disabled={undoStack.length === 0}>
            Undo
          </Button>
          <Button onClick={handleRedo} variant="outline" disabled={redoStack.length === 0}>
            Redo
          </Button>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <Button 
              onClick={goToPreviousWeek} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              ← Previous Week
            </Button>
            <Button 
              onClick={goToNextWeek} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              Next Week →
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-800">
              {formatWeekRange(currentWeek)}
            </span>
            <Button 
              onClick={goToCurrentWeek} 
              variant="outline" 
              size="lg"
              className="text-white bg-purple-500 hover:bg-purple-300"
            >
              Today
            </Button>
          </div>
        </div>

        <DayPilotCalendar
            
            viewType="Week"
            durationBarVisible={false}
            onTimeRangeSelected={handleTimeRangeSelected}
            onEventClick={(args) => {
              setContextMenu({
                x: mousePosition.current.x,
                y: mousePosition.current.y,
                slotId: args.e.data.id,
              });
            }}
            onEventResize={handleEventResize}
            eventResizeHandling="Update"
            onEventMove={handleEventMove}
            eventMoveHandling="Update"
            events={events.map(event => ({
              ...event,
              // Use html property for display text instead of text to prevent reordering
              html: `${format(new Date(event.start), 'HH:mm')} - ${format(new Date(event.end), 'HH:mm')}` + 
                (event.roles?.length > 0 ? ` | ${event.roles.map((role: string) => `[${role}]`).join(" ")}` : '') +
                (event.location ? ` | 📍 ${event.location}` : ''),
              // Ensure consistent styling and positioning
              cssClass: event.roles?.length > 0 ? "assigned-slot" : "available-slot",
              toolTip: `${event.roles?.length > 0 ? `Roles: ${event.roles.join(", ")}` : 'No roles assigned'}` +
                `${event.location ? ` | Location: ${event.location}` : ' | No location assigned'}`,
            }))}
            timeRangeSelectedHandling="Enabled"
            startDate={new DayPilot.Date(currentWeek)}
            heightSpec="Full"
        />

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Available Slots</h2>
          <div className="space-y-4">
            {availableSlots.map((slot) => (
              <div
                key={slot.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {format(new Date(slot.start), 'HH:mm')} - {format(new Date(slot.end), 'HH:mm')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(slot.start), 'EEEE, MMMM d')}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="text-md text-white bg-red-600 hover:bg-red-400 "
                  >
                    Remove Slot
                  </Button>
                </div>
                {/* Slot creator and creation time */}
                <div className="text-md text-gray-500 mb-2">
                  Created by: {slot.createdBy?.name || "Unknown"}<br/>
                  At: {slot.createdAt ? format(new Date(slot.createdAt), 'PPpp') : "Unknown"}
                </div>
                {/* Roles Section */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Roles:</span>
                    {slot.roles?.length === 0 && (
                      <span className="text-sm text-gray-400 italic">No roles assigned</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.roles?.map((role: string) => (
                      <div key={role} className="flex items-center gap-1">
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {role}
                        </span>
                        <button
                          onClick={() => handleToggleRole(slot.id, role)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold p-1 rounded-full hover:bg-red-50"
                          title={`Remove ${role}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Location Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Location:</span>
                    {!slot.location && (
                      <span className="text-sm text-gray-400 italic">No location assigned</span>
                    )}
                  </div>
                  {slot.location && (
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        📍 {slot.location}
                      </span>
                      <button
                        onClick={() => handleRemoveLocation(slot.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold p-1 rounded-full hover:bg-red-50"
                        title="Remove location"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {availableSlots.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <p>No slots selected yet.</p>
                <p className="text-sm mt-1">Drag on the calendar above to create time slots.</p>
              </div>
            )}
          </div>
          {contextMenuPortal}
        </div>
      </Card>
    </div>
  );
};

export default AdminInterviewBooking;
