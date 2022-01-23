import { styled } from "@mui/material/styles";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export const SidebarContainer = styled("div")(
  ({ isFormOpen, sidebarWidth }) => ({
    position: "relative",
    width: isFormOpen ? "280px" : sidebarWidth,
    height: "100%",
    backgroundColor: "#f0f4fc",
    transition: "0.2s",
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderColor: "grey",
    overflow: "hidden",
  })
);

export const OrgButtonGroup = styled(ToggleButtonGroup)(() => ({
  position: "absolute",
  top: "0",
  left: "0",
  width: "100%",
  padding: "0px",
  margin: "0px",
}));

export const OrgButton = styled(ToggleButton)(() => ({
  position: "relative",
  display: "table",
  width: "100%",
  listStyle: "none",
  height: "90px",
  padding: "5px",
  verticalAlign: "middle",
}));

export const OrgButtonContent = styled("div")(() => ({
  display: "flex",
  padding: "4px",
}));

export const CreateOrgButton = styled(OrgButton)(({ isFormOpen }) => ({
  height: isFormOpen ? "180px" : "90px",
}));

export const CreateOrgIcon = styled(AddIcon)(() => ({
  fontSize: "30px",
  margin: "14px",
}));

export const RemoveOrgIcon = styled(RemoveIcon)(() => ({
  fontSize: "30px",
  margin: "14px",
}));

export const OrgIcon = styled("span")(() => ({
  display: "block",
  minWidth: "60px",
  height: "60px",
  lineHeight: "60px",
  margin: "0px",
}));

export const OrgIconImage = styled("img")(() => ({
  width: "60px",
  height: "60px",
  borderRadius: "12px",
}));

export const OrgName = styled("span")(() => ({
  position: "relative",
  display: "block",
  padding: "0 10px",
  height: "60px",
  lineHeight: "60px",
  textAlign: "start",
  whiteSpace: "nowrap",
  paddingLeft: "25px",
}));
