// import AddIcon from "@mui/icons-material/Add";
// import ClearIcon from "@mui/icons-material/Clear";
// import EditIcon from "@mui/icons-material/Edit";
// import {
//   Divider,
//   FormControl,
//   FormControlLabel,
//   FormLabel,
//   IconButton,
//   ListItemIcon,
//   ListItemText,
//   Radio,
//   RadioGroup,
// } from "@mui/material";
// import { useState } from "react";

// import { inviteUserToOrg } from "api";
// import InputPopup from "components/InputPopup";

// import {
//   AdminContentList,
//   AdminDivider,
//   AdminListItemButton,
//   ContentListHeader,
//   DummyIconForAlignment,
//   MemberListItem,
// } from "./adminContent.styled";

// import type { Member } from "../types";
// import type { ChangeEventHandler, Dispatch, SetStateAction } from "react";
// import type { AdminLevel } from "types/api";

// type Props = {
//   orgId: string;
//   members: Member[];
//   setMembers: Dispatch<SetStateAction<Member[]>>;
// };

// const AdminMembersContent = ({ orgId, members, setMembers }: Props) => {
//   const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
//   const onDelete = (memberId: string) => {
//     // FIXME: CHAOS-55, integrate with backend to actually delete
//     setMembers(members.filter((m) => m.id !== memberId));
//   };
//   const inviteUser = (formValues: {
//     email: string;
//     adminLevel: AdminLevel;
//   }) => {
//     void inviteUserToOrg(formValues.email, orgId, formValues.adminLevel);
//   };
//   return (
//     <AdminContentList>
//       <ContentListHeader>
//         <ListItemText sx={{ textAlign: "center" }}>Name</ListItemText>
//         <ListItemText sx={{ textAlign: "center" }}>Role</ListItemText>
//         <ListItemIcon>
//           <DummyIconForAlignment />
//         </ListItemIcon>
//         <ListItemIcon>
//           <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)}>
//             <AddIcon />
//           </IconButton>
//           <InputPopup
//             title="Invite a user"
//             label="Email"
//             name="email"
//             submitText="Invite"
//             defaultState={{ adminLevel: "ReadOnly" }}
//             onSubmit={inviteUser}
//             open={Boolean(anchorEl)}
//             anchorEl={anchorEl}
//             setAnchorEl={setAnchorEl}
//           >
//             {({
//               formValues,
//               handleInputChange,
//             }: {
//               // eslint-disable-next-line react/no-unused-prop-types -- ??? why is this being triggered
//               formValues: { adminLevel: AdminLevel };
//               // eslint-disable-next-line react/no-unused-prop-types
//               handleInputChange: ChangeEventHandler<HTMLInputElement>;
//             }) => (
//               <FormControl>
//                 <FormLabel id="admin-level">Admin Level</FormLabel>
//                 <RadioGroup
//                   aria-labelledby="admin-level"
//                   value={formValues.adminLevel}
//                   onChange={handleInputChange}
//                   name="adminLevel"
//                   row
//                 >
//                   {["Read Only", "Director", "Admin"].map((label) => (
//                     <FormControlLabel
//                       key={label}
//                       value={label.replace(" ", "")}
//                       control={<Radio size="small" />}
//                       label={label}
//                     />
//                   ))}
//                 </RadioGroup>
//               </FormControl>
//             )}
//           </InputPopup>
//         </ListItemIcon>
//       </ContentListHeader>
//       <AdminDivider />
//       {members.map((m) => (
//         <div key={m.id}>
//           <MemberListItem>
//             <AdminListItemButton>
//               <ListItemText sx={{ textAlign: "center" }}>{m.name}</ListItemText>
//               <ListItemText sx={{ textAlign: "center" }}>{m.role}</ListItemText>
//               <ListItemIcon>
//                 <IconButton>
//                   <EditIcon />
//                 </IconButton>
//               </ListItemIcon>
//               <ListItemIcon>
//                 <IconButton
//                   value={m.id}
//                   onClick={(e: React.MouseEvent<HTMLButtonElement>) => onDelete(e.currentTarget.value)}
//                 >
//                   <ClearIcon />
//                 </IconButton>
//               </ListItemIcon>
//             </AdminListItemButton>
//           </MemberListItem>
//           <Divider />
//         </div>
//       ))}
//     </AdminContentList>
//   );
// };

// export default AdminMembersContent;

"use client"
 
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import AddMemberButton from "@/components/AdminMembersContent/AddMemberButton"
import EditMemberButton from "@/components/AdminMembersContent/EditMemberButton"

import { Button } from "@/components/ui/button"
import { PlusIcon, Ellipsis, Edit } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

import { useEffect, useState } from "react"
import { getOrganisationMembers, getSelfInfo } from "@/api"
import type { Member, User } from "@/types/api"

type Props = {
  orgId: string
  members: Member[]
  setMembers: (members: Member[]) => void
}

export function AdminMembersContent(_: any) { return null }

const AdminMembersContentImpl = ({ orgId, members, setMembers }: Props) => {
  const [self, setSelf] = useState({})
  useEffect(() => {
    void (async () => {
      const selfData = await getSelfInfo();
      setSelf(selfData)
      const resp = await getOrganisationMembers(orgId)
      setMembers(resp.members)
    })()
  }, [orgId, setMembers])
  console.log(self);
  return (
    <div className="overflow-hidden border-bottom-1">
      <Table>
        <TableHeader className="fit-content">
          <TableRow>
            <TableHead className="p-4">Members</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">
              <AddMemberButton orgId={orgId} onAdded={async () => {
                const resp = await getOrganisationMembers(orgId)
                setMembers(resp.members)
              }} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white border-l-0 border-r-0">
          {members.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="p-4">{m.name}</TableCell>
              <TableCell>{m.email}</TableCell>
              <TableCell>{m.role}</TableCell>
              <TableCell className="text-right">
                {
                  self.id != m.id ?
                  <EditMemberButton orgId={orgId} member={m} onChanged={async () => {
                    const resp = await getOrganisationMembers(orgId)
                    setMembers(resp.members)
                  }} />
                  :
                  <></>
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminMembersContentImpl;