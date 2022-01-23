import { styled } from "@mui/material/styles";
import { List, ListItem, ListItemButton, Divider } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export const AdminContentContainer = styled("div")(() => ({
  flex: "1 0 auto",
  height: "100%",
  backgroundColor: "white",
}));

export const ToggleButtonContainer = styled("div")(() => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  backgroundColor: "white",
  height: "100%",
  width: "50%",
  marginRight: "80px",
}));

export const ContentHeader = styled("div")(() => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  height: "200px",
  backgroundColor: "white",
  alignItems: "center",
}));

export const OrgInfo = styled("div")(() => ({
  display: "flex",
  width: "50%",
  height: "100%",
  alignItems: "center",
}));

export const OrgInfoImage = styled("img")(() => ({
  height: "100px",
  width: "100px",
  margin: "45px",
  marginLeft: "80px",
  borderRadius: "12px",
}));

export const OrgInfoName = styled("div")(() => ({
  display: "inline-flex",
  alignSelf: "center",
  fontSize: "3rem",
}));

export const ContentBody = styled("div")(() => ({
  margin: "80px",
  marginTop: "0px",
  height: "69%",
  borderColor: "grey",
  borderStyle: "solid",
  borderRadius: "12px",
  borderWidth: "1px",
  backgroundColor: "#f0f4fc",
  overflow: "auto",
}));

export const CampaignListItem = styled(ListItem)(() => ({
  padding: "0px",
}));

export const CampaignListItemImage = styled("img")(() => ({
  width: "250px",
  height: "130px",
}));

export const MemberListItem = styled(ListItem)(() => ({
  padding: "0px",
  height: "70px",
}));

export const AdminContentList = styled(List)(() => ({
  position: "relative",
  padding: "0px",
}));

export const AdminListItemButton = styled(ListItemButton)(() => ({
  padding: "0px",
  height: "100%",
}));

export const ContentListHeader = styled(ListItem)(() => ({
  padding: "0px",
  height: "50px",
  backgroundColor: "#e2e6ed",
}));

export const DummyDivForAlignment = styled("div")(() => ({
  width: "250px",
  height: "130px",
}));

export const DummyIconForAlignment = styled(AddIcon)(() => ({
  display: "none",
}));

export const AdminDivider = styled(Divider)(() => ({
  backgroundColor: "grey",
}));
