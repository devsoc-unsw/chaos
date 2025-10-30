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
const EditMemberButton = () => {
    return (
        //somehow invert it, I want it to be shadow on hover and not as default drk how to do that yet
        <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" ><Ellipsis/></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mr-2">
            {/* Change to detect user's role and display role change */}
            <DropdownMenuLabel>Manage User</DropdownMenuLabel>
            <DropdownMenuItem>
                Change role to X
            </DropdownMenuItem>
            <DropdownMenuItem>
                Delete user
            </DropdownMenuItem>
        </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default EditMemberButton;