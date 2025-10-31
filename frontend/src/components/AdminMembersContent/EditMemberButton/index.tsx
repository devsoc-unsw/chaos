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
import type { Member } from "@/pages/admin/types"
import type { OrganisationRole } from "@/types/api"

type Props = { orgId: string; member: Member; onChanged?: () => void }

const EditMemberButton = ({ orgId, member, onChanged }: Props) => {
    const handleRoleChange = async (role: OrganisationRole) => {
        await updateOrganisationMemberRole(orgId, member.name /* placeholder email? */, role)
        onChanged && onChanged()
    }
    const handleDelete = async () => {
        await removeOrganisationMember(orgId, member.id)
        onChanged && onChanged()
    }
    return (
        //somehow invert it, I want it to be shadow on hover and not as default drk how to do that yet
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" ><Ellipsis/></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mr-2">
            {/* Change to detect user's role and display role change */}
            <DropdownMenuLabel>Manage User</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => void handleRoleChange("User")}>Change role to User</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleRoleChange("Admin")}>Change role to Admin</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleDelete()}>Delete user</DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default EditMemberButton;