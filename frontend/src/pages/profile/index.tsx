import React from 'react'
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {useState, useEffect} from "react";

const Profile = () => {
    const [name, setName] = useState('')
    const [gender, setGender] = useState('')
    const [pronouns, setPronouns] = useState('')
    const [zid, setZid] = useState('')
    const [open, setOpen] = useState(false)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild onClick={() => setOpen(true)}>
                <Button variant="secondary" size="icon" className="cursor-pointer">edit user profile need frontend</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Edit User
                    </DialogTitle>
                    <DialogDescription>
                        Edit your user details
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-3">
                    <Label htmlFor="name-1">Name</Label>
                    <Input id="name-1" name="name" placeholder="Name"  onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex justify-between">
                    <div className="w-1/2">
                        <Label>Gender</Label>
                        <Select value={gender} onValueChange={(g) => setGender(g)}>
                            <SelectTrigger className="w-5/6">
                                <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Male" className="
                                    !cursor-pointer
                                    hover:bg-accent hover:text-accent-foreground
                                    data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                ">Male</SelectItem>
                                <SelectItem value="Female" className="
                                    !cursor-pointer
                                    hover:bg-accent hover:text-accent-foreground
                                    data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                ">Female</SelectItem>
                                <SelectItem value="Non-binary" className="
                                    !cursor-pointer
                                    hover:bg-accent hover:text-accent-foreground
                                    data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                ">Non-binary</SelectItem>
                                <SelectItem value="Other" className="
                                    !cursor-pointer
                                    hover:bg-accent hover:text-accent-foreground
                                    data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                ">Other</SelectItem>
                                <SelectItem value="Prefer not to say" className="
                                    !cursor-pointer
                                    hover:bg-accent hover:text-accent-foreground
                                    data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                ">Prefer not to say</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-1/2">
                            <Label>Pronouns</Label>
                            <Select value={pronouns} onValueChange={(p) => setPronouns(p)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Pronouns" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="He/Him" className="
                                        !cursor-pointer
                                        hover:bg-accent hover:text-accent-foreground
                                        data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                    ">He/Him</SelectItem>
                                    <SelectItem value="She/Her" className="
                                        !cursor-pointer
                                        hover:bg-accent hover:text-accent-foreground
                                        data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                    ">She/Her</SelectItem>
                                    <SelectItem value="They/Them" className="
                                        !cursor-pointer
                                        hover:bg-accent hover:text-accent-foreground
                                        data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                    ">They/Them</SelectItem>
                                    <SelectItem value="Other" className="
                                        !cursor-pointer
                                        hover:bg-accent hover:text-accent-foreground
                                        data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground
                                    ">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="zid-1">zId</Label>
                    <Input id="zid-1" name="zid" placeholder="zId"  onChange={(e) => setZid(e.target.value)} />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => {}}>Update Details</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
    )
}

export default Profile