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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const AddMemberButton = () => {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="icon" ><PlusIcon/></Button>
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
                    <Input id="email-1" name="email" placeholder="Email" />
                </div>
                <div>
                    <Label>Role</Label>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="member" className="
                                !cursor-pointer
                                hover:bg-accent hover:text-accent-foreground
                                data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                            ">Member</SelectItem>
                            <SelectItem value="admin" className="
                                !cursor-pointer
                                hover:bg-accent hover:text-accent-foreground
                                data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                            ">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button type="submit" variant="outline">Add User</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
    );
}

export default AddMemberButton;