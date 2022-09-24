import { styled } from "@mui/material/styles";
import { Button, ToggleButtonGroup } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export const SidebarContainer = styled("div")<{
  isFormOpen: boolean;
  sidebarWidth: string;
}>(({ isFormOpen, sidebarWidth }) => ({
  position: "relative",
  width: isFormOpen ? "280px" : sidebarWidth,
  height: "100%",
  backgroundColor: "#f0f4fc",
  transition: "0.2s",
  borderRightWidth: "1px",
  borderRightStyle: "solid",
  borderColor: "grey",
  overflow: "hidden",
}));

export const OrgButtonGroup = styled(ToggleButtonGroup)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 0px;
  margin: 0px;
`;

export const OrgButton = styled(Button)`
  position: relative;
  display: table;
  width: 100%;
  list-style: none;
  height: 90px;
  padding: 5px;
  vertical-align: middle;
`;

export const OrgButtonContent = styled("div")`
  display: flex;
  padding: 4px;
`;

export const CreateOrgButton = styled(OrgButton)<{ isFormOpen: boolean }>(
  ({ isFormOpen }) => ({
    height: isFormOpen ? "180px" : "90px",
  })
);

export const CreateOrgIcon = styled(AddIcon)`
  font-size: 30px;
  margin: 14px;
`;

export const RemoveOrgIcon = styled(RemoveIcon)`
  font-size: 30px;
  margin: 14px;
`;

export const OrgIcon = styled("span")`
  display: block;
  min-width: 60px;
  height: 60px;
  line-height: 60px;
  margin: 0px;
`;

export const OrgIconImage = styled("img")`
  width: 60px;
  height: 60px;
  border-radius: 12px;
`;

export const OrgName = styled("span")`
  position: relative;
  display: block;
  padding: 0 10px;
  height: 60px;
  line-height: 60px;
  text-align: start;
  white-space: nowrap;
  padding-left: 25px;
`;
