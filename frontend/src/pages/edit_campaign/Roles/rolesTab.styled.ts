import {
  FormControl,
  FormGroup,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const ContainerDiv = styled("div")`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
`;

export const RolesDiv = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 600px;
  width: 100%;
  min-width: 400px;
`;

export const SectionTitle = styled("h2")`
  margin-top: 0px;
`;

export const RolesDisplay = styled("div")`
  position: relative;
  overflow: hidden;
  width: 90%;
  height: 600px;
  border-style: solid;
  border-width: 1px;
  border-color: grey;
  border-radius: 12px;
`;

export const RoleQuantity = styled(ListItemText)`
  padding-left: 50px;
`;

export const RolesListContainer = styled("div")`
  height: 530px;
  position: relative;
  overflow: scroll;
`;

export const RoleListItemContent = styled(ListItem)`
  padding: 0px;
  height: auto;
  min-height: 70px;
`;

export const RoleListItemButton = styled(ListItemButton)`
  padding: 0%;
  height: 100%;
`;

export const CreateRoleFormControl = styled(FormControl)`
  width: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
  border-top: solid;
  border-width: 1px;
  border-color: grey;
`;

export const CreateRoleFormGroup = styled(FormGroup)`
  justify-content: space-around;
  align-items: center;
  height: 70px;
`;

export const Quantity = styled("input")`
  width: 12%;
  height: 50px;
  border-width: 1px;
  padding-left: 5px;
  font-size: 20px;
  border-radius: 12px;
`;

export const Name = styled("input")`
  width: 65%;
  height: 50px;
  padding-left: 5px;
  font-size: 20px;
  border-width: 1px;
  border-radius: 12px;
`;








