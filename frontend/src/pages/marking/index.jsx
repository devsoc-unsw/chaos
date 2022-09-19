import React, { useContext, useEffect, useState } from "react";
import { Box, Container, Button, Grid, Tab } from "@mui/material";
import { TabContext, TabList } from "@mui/lab";

import { Link, useParams } from "react-router-dom";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import ReviewerStepper from "../../components/ReviewerStepper";
import ApplicationsList from "./ApplicationsList";
import {
  getApplicationAnswers,
  getApplicationRatings,
  getRoleApplications,
  getRoleQuestions,
  getCampaignRoles,
  setApplicationRating,
  getCampaign,
} from "../../api";

const Marking = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const { campaignId } = useParams();
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const [applications, setApplications] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(0);

  useEffect(() => {
    (async () => {
      const campaignNameResp = await getCampaign(campaignId);
      const { name: campaignName } = await campaignNameResp.json();
      setNavBarTitle(`Marking for ${campaignName}`);
      const rolesResp = await getCampaignRoles(campaignId);
      const { roles } = await rolesResp.json();

      // TODO(michael): REFACTOR ALL THIS
      const allApplications = await Promise.all(
        roles.map(async (role) => {
          const resp = await getRoleApplications(role.id);
          const roleApplications = await resp.json();
          return roleApplications.applications;
        })
      );
      const questions = await Promise.all(
        roles.map(async (role) => {
          const resp = await getRoleQuestions(role.id);
          const roleQuestions = await resp.json();
          return roleQuestions.questions;
        })
      );
      const answers = await Promise.all(
        allApplications.map((a) =>
          Promise.all(
            a.map(async (application) => {
              const resp = await getApplicationAnswers(application.id);
              const applicationAnswers = await resp.json();
              return applicationAnswers.answers;
            })
          )
        )
      );
      const ratings = await Promise.all(
        allApplications.map((a) =>
          Promise.all(
            a.map(async (application) => {
              const resp = await getApplicationRatings(application.id);
              const applicationRatings = await resp.json();
              return applicationRatings.ratings[
                applicationRatings.ratings.length - 1
              ];
            })
          )
        )
      );

      setSelectedPosition(roles[0].name);
      setSelectedApplication(allApplications[0].applicationId);
      setApplications(
        Object.fromEntries(
          roles.map((role, roleIdx) => [
            role.name,
            allApplications[roleIdx].map((application, applicationIdx) => ({
              applicationId: application.id,
              zId: application.user_zid,
              mark: ratings[roleIdx][applicationIdx]?.rating,
              questions: questions[roleIdx].map((question, questionIdx) => ({
                question: question.title,
                answer:
                  answers[roleIdx][applicationIdx][questionIdx]?.description,
              })),
            })),
          ])
        )
      );
    })();
  }, []);

  const setMark = async (newMark) => {
    const newApplications = { ...applications };
    newApplications[selectedPosition][selectedApplication].mark = newMark;
    setApplications(newApplications);
    await setApplicationRating(
      applications[selectedPosition][selectedApplication].applicationId,
      newMark
    );
  };

  return (
    <Container>
      <ReviewerStepper activeStep={0} />

      <TabContext value={selectedPosition}>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            marginBottom: 2,
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={(_, t) => setSelectedPosition(t)}>
              {Object.keys(applications).map((role) => (
                <Tab label={role} value={role} key={role} />
              ))}
            </TabList>
          </Box>
        </Box>
      </TabContext>

      {Object.keys(applications).length ? (
        <ApplicationsList
          applications={applications[selectedPosition] || []}
          setMark={setMark}
          selectedApplication={selectedApplication}
          setSelectedApplication={setSelectedApplication}
        />
      ) : null}

      <Grid container justifyContent="flex-end">
        <Button
          component={Link}
          to={`/rankings/${campaignId}`}
          disabled={Object.values(applications).some((a) =>
            a.some((application) => application.mark === 0)
          )}
        >
          Next (Rankings)
        </Button>
      </Grid>
    </Container>
  );
};

export default Marking;
