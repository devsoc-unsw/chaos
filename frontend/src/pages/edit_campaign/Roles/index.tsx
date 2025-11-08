import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { createRole, deleteRole, getCampaignRoles, updateRole } from "api";
import { Button } from "@/components/ui/button";
import { pushToast } from "utils";
import type { Role } from "types/api";

import { AddRoleDialog } from "./AddRole";
import { EditRoleDialog } from "./EditRole";
import { RolesDataTable } from "./RolesTable";

type Props = {
  campaignId: string;
};

const RolesTab = ({ campaignId }: Props) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Load roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getCampaignRoles(campaignId);
        setRoles(data);
      } catch (error) {
        pushToast("Error", "Failed to load roles", "error");
      }
    };
    void loadRoles();
  }, [campaignId]);

  const handleAddRole = async (data: {
    name: string;
    description: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
  }) => {
    setIsLoading(true);
    try {
      if (data.min_available > data.max_available) {
        pushToast("Error", "Min available must be <= Max available", "error");
        setIsLoading(false);
        return;
      }

      await createRole(campaignId, {
        name: data.name,
        description: data.description || undefined,
        min_available: data.min_available,
        max_available: data.max_available,
        finalised: data.finalised,
      });
      
      pushToast("Success", "Role created successfully", "success");
      setIsAddDialogOpen(false);
      
      // Reload roles
      const roleData = await getCampaignRoles(campaignId);
      setRoles(roleData);
    } catch (error) {
      pushToast("Error", "Failed to create role", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = async (data: {
    name: string;
    description: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
  }) => {
    if (!editingRole) return;

    if (data.min_available > data.max_available) {
      pushToast("Error", "Min available must be <= Max available", "error");
      return;
    }

    setIsLoading(true);
    try {
      await updateRole(editingRole.id, {
        name: data.name,
        description: data.description || undefined,
        min_available: data.min_available,
        max_available: data.max_available,
        finalised: data.finalised,
      });
      
      pushToast("Success", "Role updated successfully", "success");
      setIsEditDialogOpen(false);
      setEditingRole(null);
      
      // Reload roles
      const roleData = await getCampaignRoles(campaignId);
      setRoles(roleData);
    } catch (error) {
      pushToast("Error", "Failed to update role", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setIsLoading(true);
    try {
      await deleteRole(roleId);
      pushToast("Success", "Role deleted successfully", "success");
      
      // Reload roles
      const data = await getCampaignRoles(campaignId);
      setRoles(data);
    } catch (error) {
      pushToast("Error", "Failed to delete role", "error");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-2xl font-semibold">Roles</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} className="border-2 border-transparent hover:bg-white hover:text-black hover:border-black">
          <Plus />
          Add Role
        </Button>
      </div>
      <RolesDataTable
        data={roles}
        onEdit={handleEditRole}
        onDelete={handleDeleteRole}
      />
      <AddRoleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={handleAddRole}
        isLoading={isLoading}
      />
      <EditRoleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        role={editingRole}
        onSubmit={handleUpdateRole}
        isLoading={isLoading}
      />
    </div>
  );
};

export default RolesTab;

