import { Container, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { useParams } from "react-router-dom";

import RolesTab from "./Roles";
import QuestionsTab from "./Questions";
import ReviewTab from "../preview_campaign";

const EditCampaign = () => {
  const { orgId, campaignId } = useParams();
  const [tab, setTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  if (!campaignId) {
    return <div>Invalid campaign ID</div>;
  }

  return (
    <Container style={{ marginTop: "40px", marginBottom: "40px" }}>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          marginBottom: "30px",
        }}
      >
        <Tab
          label="ROLES"
          sx={{
            textTransform: "uppercase",
            fontWeight: tab === 0 ? 600 : 400,
            color: tab === 0 ? "primary.main" : "text.secondary",
          }}
        />
        <Tab
          label="QUESTIONS"
          sx={{
            textTransform: "uppercase",
            fontWeight: tab === 1 ? 600 : 400,
            color: tab === 1 ? "primary.main" : "text.secondary",
          }}
        />
        <Tab
          label="REVIEW"
          sx={{
            textTransform: "uppercase",
            fontWeight: tab === 2 ? 600 : 400,
            color: tab === 2 ? "primary.main" : "text.secondary",
          }}
        />
      </Tabs>

      {/* Render appropriate tab content */}
      {tab === 0 && <RolesTab campaignId={campaignId} />}
      {tab === 1 && <QuestionsTab campaignId={campaignId} />}
      {tab === 2 && <ReviewTab campaignId={campaignId} />}
    </Container>
  );
};

export default EditCampaign;


