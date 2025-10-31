import { Button } from "@/components/ui/button"
import { Ellipsis } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { removeOrganisationMember, updateOrganisationMemberRole } from "@/api"
import type { Member, OrganisationRole } from "@/types/api"

type Props = { orgId: string; member: Member; onChanged?: () => void }

const EditMemberButton = ({ orgId, member, onChanged }: Props) => {
    const handleRoleChange = async (role: OrganisationRole) => {
        await updateOrganisationMemberRole(orgId, member.email, role)
        onChanged && onChanged()
    }
    const handleDelete = async () => {
        await removeOrganisationMember(orgId, member.email)
        onChanged && onChanged()
    }
    return (
        //somehow invert it, I want it to be shadow on hover and not as default drk how to do that yet
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="cursor-pointer"><Ellipsis/></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mr-2">
            <DropdownMenuLabel>Manage User</DropdownMenuLabel>
            {
                member?.role === "User" ? (<DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-[#e2e6ed] data-[highlighted]:text-foreground" onClick={() => void handleRoleChange("Admin")}>Change role to Admin</DropdownMenuItem>) : (<DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-[#e2e6ed] data-[highlighted]:text-foreground" onClick={() => void handleRoleChange("User")}>Change role to User</DropdownMenuItem>)
            }
            <DropdownMenuItem className="cursor-pointer data-[highlighted]:bg-[#e2e6ed] data-[highlighted]:text-foreground" onClick={() => void handleDelete()}>Delete user</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default EditMemberButton;