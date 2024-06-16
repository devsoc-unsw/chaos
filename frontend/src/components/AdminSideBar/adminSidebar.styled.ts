import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { styled } from "@mui/material/styles";
import tw, { styled as s } from "twin.macro";

export const SidebarContainer = tw.div`relative h-full w-[80px] overflow-hidden border-r border-solid border-gray-300 bg-[#f0f4fc] transition-all duration-200 hover:w-[280px]`;

export const OrgButtonGroup = styled(ToggleButtonGroup)`
  width: 100%;
  padding: 0px;
  margin: 0px;
`;

export const OrgButton = styled(ToggleButton)`
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

export const CreateOrgButton = styled(OrgButton)`
  height: 90px;
  border-bottom: 0;
`;

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
