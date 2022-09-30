import { styled } from "@mui/material/styles";
import { List, ListItem, ListItemButton, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export const AdminContentContainer = styled("div")`
  flex: 1 0 auto;
  height: 100%;
  background-color: white;
`;

export const ToggleButtonContainer = styled("div")`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: white;
  height: 100%;
  width: 50%;
  margin-right: 80px;
`;

export const ContentHeader = styled("div")`
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 200px;
  background-color: white;
  align-items: center;
`;

export const OrgInfo = styled("div")`
  display: flex;
  width: 50%;
  height: 100%;
  align-items: center;
`;

export const OrgInfoImage = styled("img")`
  height: 100px;
  width: 100px;
  margin: 45px;
  margin-left: 80px;
  border-radius: 12px;
`;

export const OrgInfoName = styled("div")`
  display: inline-flex;
  align-self: center;
  font-size: 3rem;
`;

export const ContentBody = styled("div")`
  margin: 80px;
  margin-top: 0px;
  height: 69%;
  border-color: grey;
  border-style: solid;
  border-radius: 12px;
  border-width: 1px;
  background-color: #f0f4fc;
  overflow: auto;
`;

export const CampaignListItem = styled(ListItem)`
  padding: 0px;
`;

export const CampaignListItemImage = styled("img")`
  width: 250px;
  height: 130px;
`;

export const MemberListItem = styled(ListItem)`
  padding: 0px;
  height: 70px;
`;

export const AdminContentList = styled(List)`
  position: relative;
  padding: 0px;
`;

export const AdminListItemButton = styled(ListItemButton)`
  padding: 0px;
  height: 100%;
`;

export const ContentListHeader = styled(ListItem)`
  padding: 0px;
  height: 50px;
  background-color: #e2e6ed;
`;

export const DummyDivForAlignment = styled("div")`
  width: 250px;
  height: 130px;
`;

export const DummyIconForAlignment = styled(AddIcon)`
  display: none;
`;

export const AdminDivider = styled(Divider)`
  background-color: grey;
`;
