"use client";

import { Info, Plus } from "lucide-react"
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getColumns } from "./columns";
import { deleteOrganisationUser, getAllOrganisationMembers, inviteOrganisationUser, updateOrganisationMemberRole } from "@/models/organisation";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getIsSuperuser } from "@/models/user";
import { useState } from "react";
import { ApiError } from "@/lib/api";

export default function OrganisationMembers({ orgId, dict }: { orgId: string, dict: any }) {
  const queryClient = useQueryClient();

  const { data: isSuperuserData } = useQuery({
    queryKey: ["is_superuser"],
    queryFn: () => getIsSuperuser(),
  });

  let { data: members } = useQuery({
    queryKey: [`${orgId}-members`],
    queryFn: () => getAllOrganisationMembers(orgId),
  })

  if (!members) { members = []; }

  const handleDeleteMember = async (memberId: string) => {
    await deleteOrganisationUser(orgId, memberId);
    await queryClient.invalidateQueries({ queryKey: [`${orgId}-members`] });
  }

  const handleUpdateMemberRole = async (userId: string, newRole: "Admin" | "User") => {
    await updateOrganisationMemberRole(orgId, userId, newRole);
    await queryClient.invalidateQueries({ queryKey: [`${orgId}-members`] });
  }

  const isSuperuser = isSuperuserData?.is_superuser ?? false;
  const userColumns = getColumns(handleDeleteMember, handleUpdateMemberRole, dict, isSuperuser);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{dict.dashboard.members.members}</h1>
        <AddMemberDialog orgId={orgId} dict={dict} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
          </div>
        </div>
        <DataTable columns={userColumns} data={members ?? []} />
      </div>
    </div>
  )
}

export function AddMemberDialog({ orgId, dict }: { orgId: string, dict: any }) {
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInviteMember = async () => {
    setErrorMessage(null);

    const normalisedEmail = email.trim().toLowerCase();
    if (!normalisedEmail) {
      setErrorMessage(dict?.common?.email_required ?? "Email is required.");
      return;
    }

    setLoading(true);
    await inviteOrganisationUser(orgId, normalisedEmail);
    await queryClient.invalidateQueries({ queryKey: [`${orgId}-members`] });
    setEmail("");
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="mr-1"><Plus className="w-8 h-8" /> </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>{dict.dashboard.members.invite_member}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">{dict.dashboard.members.admin_edit_block_description}</p>
          <Label>{dict.common.email}</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          {errorMessage && (
            <p className="text-xs text-red-600">{errorMessage}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleInviteMember}
            disabled={loading}
          >
            {loading ? (dict?.common?.loading ?? "Loading...") : dict.dashboard.actions.invite}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}