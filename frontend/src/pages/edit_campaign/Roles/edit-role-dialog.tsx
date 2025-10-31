"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Role } from "types/api";

type EditRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
  onSubmit: (data: {
    name: string;
    description: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
  }) => void;
  isLoading?: boolean;
};

export function EditRoleDialog({
  open,
  onOpenChange,
  role,
  onSubmit,
  isLoading = false,
}: EditRoleDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [minAvailable, setMinAvailable] = React.useState(1);
  const [maxAvailable, setMaxAvailable] = React.useState(1);
  const [finalised, setFinalised] = React.useState(false);

  React.useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description || "");
      setMinAvailable(role.min_available);
      setMaxAvailable(role.max_available);
      setFinalised(role.finalised);
    }
  }, [role]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role) {
      return;
    }
    if (minAvailable > maxAvailable) {
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      min_available: minAvailable,
      max_available: maxAvailable,
      finalised,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
    }
  };

  if (!role) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Make changes to the role here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Role name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Role description (optional)"
                disabled={isLoading}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-min">Min Available</Label>
                <Input
                  id="edit-min"
                  type="number"
                  value={minAvailable}
                  onChange={(e) => setMinAvailable(Number(e.target.value))}
                  min={1}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-max">Max Available</Label>
                <Input
                  id="edit-max"
                  type="number"
                  value={maxAvailable}
                  onChange={(e) => setMaxAvailable(Number(e.target.value))}
                  min={1}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-finalised"
                checked={finalised}
                onChange={(e) => setFinalised(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-finalised" className="cursor-pointer">
                Finalised
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !name.trim() ||
                minAvailable > maxAvailable
              }
              className="border-2 border-transparent hover:bg-white hover:text-black hover:border-black"
            >
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


