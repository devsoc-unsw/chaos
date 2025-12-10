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
import { deleteOrganisationUser, getAllOrganisationMembers, inviteOrganisationUser } from "@/models/organisation";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function OrganisationMembers({ orgId, dict }: { orgId: string, dict: any }) {
  const queryClient = useQueryClient();

  let { data: members } = useQuery({
    queryKey: [`${orgId}-members`],
    queryFn: () => getAllOrganisationMembers(orgId),
  })

  if (!members) { members = []; }

  const handleDeleteMember = async (memberId: string) => {
    await deleteOrganisationUser(orgId, memberId);
    await queryClient.invalidateQueries({ queryKey: [`${orgId}-members`] });
  }

  const userColumns = getColumns(handleDeleteMember, dict);

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

  const handleInviteMember = async () => {
    await inviteOrganisationUser(orgId, email);
    await queryClient.invalidateQueries({ queryKey: [`${orgId}-members`] });
  }

  return (
    <Dialog>
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
          <Input onChange={(e) => setEmail(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={async () => await handleInviteMember()}>{dict.dashboard.actions.invite}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}