import { TabContext, TabList, TabPanel } from "@mui/lab";
import { Box, Container, Grid, Tab, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { LoadingIndicator, ReviewerStepper } from "components";
import { MessagePopupContext } from "contexts/MessagePopupContext";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import useFetch from "hooks/useFetch";

import { FinalisedEntry } from "./finaliseCandidates.styled";

import type { ApplicationResponse, Campaign } from "types/api";

const dummyCandidates = [
  {
    role: "Student Experience Subcommittee Member",
    name: "Hayes Choy",
    finalised: true,
  },
  { role: "Media Subcommittee Member", name: "Shrey Somaiya", finalised: true },
  {
    role: "Creative Subcommittee Member",
    name: "Giuliana De Bellis",
    finalised: true,
  },
  { role: "Marketing Subcommittee Member", name: "Colin Hou", finalised: true },
  {
    role: "Competitions Subcommittee Member",
    name: "Lachlan Ting",
    finalised: true,
  },
  {
    role: "Socials Experience Subcommittee Member",
    finalised: false,
  },
];

const FinaliseCandidates = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  useFetch<Campaign>(`/campaign/${campaignId}`, undefined, {}, [], ({ name }) =>
    setNavBarTitle(name)
  );

  const pushMessage = useContext(MessagePopupContext);

  const {
    data: applications,
    loading,
    error,
    errorMsg,
  } = useFetch<ApplicationResponse>(
    `/role/${roleId}/applications`,
    undefined,
    {},
    []
  );

  const [tab, setTab] = useState("0");

  useEffect(() => {
    if (error) {
      pushMessage({
        type: "error",
        message: errorMsg,
      });
    }
  }, [error]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Container>
      <ReviewerStepper activeStep={2} />

      <TabContext value={tab}>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(_, t: string) => setTab(t)}>
              <Tab label="Hayes Choy" value="0" />
              <Tab label="Shrey Somaiya" value="1" />
            </TabList>
          </Box>
          <TabPanel value="0">email</TabPanel>
          <TabPanel value="1">poggers</TabPanel>
        </Box>
      </TabContext>
    </Container>
  );
};

export default FinaliseCandidates;
