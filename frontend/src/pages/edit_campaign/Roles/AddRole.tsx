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

type AddRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {name: string, description: string, min_available: number, max_available: number, finalised: boolean}) => void;
  isLoading?: boolean;
};

export function AddRoleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: AddRoleDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [minAvailable, setMinAvailable] = React.useState(1);
  const [maxAvailable, setMaxAvailable] = React.useState(1);
  const [finalised, setFinalised] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
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
    setName("");
    setDescription("");
    setMinAvailable(1);
    setMaxAvailable(1);
    setFinalised(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setName("");
        setDescription("");
        setMinAvailable(1);
        setMaxAvailable(1);
        setFinalised(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Create a new role for this campaign. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Role name" required disabled={isLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Role description (optional)" disabled={isLoading} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min-available">Min Available</Label>
                <Input id="min-available" type="number" value={minAvailable} onChange={e => setMinAvailable(Number(e.target.value))} min={1} required disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-available">Max Available</Label>
                <Input id="max-available" type="number" value={maxAvailable} onChange={e => setMaxAvailable(Number(e.target.value))} min={1} required disabled={isLoading} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="finalised" checked={finalised} onChange={e => setFinalised(e.target.checked)} disabled={isLoading} className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="finalised" className="cursor-pointer">
                Finalised
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || minAvailable > maxAvailable} className="border-2 border-transparent hover:bg-white hover:text-black hover:border-black">
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


