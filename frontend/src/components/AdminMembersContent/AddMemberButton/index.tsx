{/*
                Pops a dialogue which has
                  - email input form
                  - add button
                    - on press the email checks the database to see if the user exists
                      -if no user exists 404 + show no user found
                      - if exists, appends the new user id to id list as a post //new backend route
*/}

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { PlusIcon} from "lucide-react"
import { useState } from "react"
import { addOrganisationMember } from "@/api"
import type { OrganisationRole } from "@/types/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
type Props = { orgId: string; onAdded?: () => void }

const AddMemberButton = ({ orgId, onAdded }: Props) => {
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<OrganisationRole>("User")
    const [open, setOpen] = useState(false)
    const onSubmit = async () => {
        await addOrganisationMember(orgId, email, role)
        setOpen(false)
        setEmail("")
        setRole("User")
        onAdded && onAdded()
    }
    return (
        <Dialog>
            <DialogTrigger asChild onClick={() => setOpen(true)}>
                <Button variant="secondary" size="icon" className="cursor-pointer"><PlusIcon/></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Add Member
                    </DialogTitle>
                    <DialogDescription>
                        Input your member's email and role.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <Label htmlFor="email-1">Email</Label>
                    <Input id="email-1" name="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as OrganisationRole)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="User" className="
                                !cursor-pointer
                                hover:bg-accent hover:text-accent-foreground
                                data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                            ">User</SelectItem>
                            <SelectItem value="Admin" className="
                                !cursor-pointer
                                hover:bg-accent hover:text-accent-foreground
                                data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                            ">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => void onSubmit()}>Add User</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
    );
}

export default AddMemberButton;