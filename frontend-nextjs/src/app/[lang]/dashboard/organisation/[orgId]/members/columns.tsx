"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import moment from "moment";

import { Plus, Trash } from "lucide-react"
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Member, OrganisationRole } from "@/models/organisation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddMemberDialog } from "./members";

function UpdateRoleButton({
  member,
  onUpdate,
}: {
  member: Member;
  onUpdate: (userId: string, newRole: "Admin" | "User") => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const isAdmin = member.role === "Admin";

  const handleClick = async () => {
    setLoading(true);
    await onUpdate(member.id, isAdmin ? "User" : "Admin");
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleClick}
    >
      {loading ? "..." : isAdmin ? "Remove admin" : "Make admin"}
    </Button>
  );
}

export function getColumns(
    handleDeleteMember: (memberId: string) => Promise<void>,
    handleUpdateMemberRole: (memberId: string, newRole: "Admin" | "User") => Promise<void>,
    dict: any,
    isSuperuser = false
): ColumnDef<Member>[] {
    const columns: ColumnDef<Member>[] = [
        {
            header: dict.common.name,
            accessorKey: "name",
        },
        {
            header: dict.common.email,
            accessorKey: "email",
        },
        {
            header: dict.dashboard.members.role,
            accessorKey: "role",
        },
    ];

    if (isSuperuser) {
        columns.push({
            header: "Update",
            id: "update",
            cell: ({ row }: { row: Row<Member> }) => (
                <UpdateRoleButton member={row.original} onUpdate={handleUpdateMemberRole} />
            ),
        });
    }

    columns.push({
            id: "actions",
            cell: ({ row }: { row: Row<Member> }) => {
                const member = row.original;

                if (member.role === "Admin") {
                    return (
                        <div className="flex items-center justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 m-0">
                                        <Trash className="w-4 h-4 text-destructive hover:text-destructive/90" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>{dict.dashboard.members.admin_edit_block}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {dict.dashboard.members.admin_edit_block_description}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>{dict.dashboard.actions.confirm_understand}</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    );
                }

                const [deleting, setDeleting] = useState(false);

                const handleDeleting = async () => {
                    setDeleting(true);
                    await handleDeleteMember(member.id);
                    setDeleting(false);
                }

                return (
                    <div className="flex items-center justify-end">
                        <Button variant="ghost" className="h-8 w-8 p-0 m-0" disabled={deleting} onClick={async () => await handleDeleting()}>
                            <Trash className="w-4 h-4 text-destructive hover:text-destructive/90" />
                        </Button>
                    </div>
                )
            },
        }
    );

    return columns;
}
