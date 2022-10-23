import { Button, Container, Grid } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "twin.macro";

import {
  getApplicationAnswers,
  getApplicationRatings,
  getCampaign,
  getCampaignRoles,
  getRoleApplications,
  getRoleQuestions,
  setApplicationRating,
} from "api";
import ReviewerStepper from "components/ReviewerStepper";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import ApplicationsList from "./ApplicationsList";

import type { ApplicationsWithQuestions } from "types/admin";

const Marking = () => {
  console.log("AAAAAAAAAAAAA");
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const campaignId = Number(useParams().campaignId);
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const [applications, setApplications] = useState<ApplicationsWithQuestions>(
    {}
  );
  const [roles, setRoles] = useState<{ [id: number]: string }>({});
  const roleId = Number(useParams().roleId);
  const selectedPosition = roles[roleId];
  const [selectedApplication, setSelectedApplication] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { name: campaignName } = await getCampaign(campaignId);
      setNavBarTitle(`Marking for ${campaignName}`);
      const { roles } = await getCampaignRoles(campaignId);
      setRoles(
        Object.fromEntries(roles.map(({ id, ...role }) => [id, role.name]))
      );

      // TODO(michael): REFACTOR ALL THIS
      const allApplications = await Promise.all(
        roles.map(async (role) => {
          const { applications } = await getRoleApplications(role.id);
          return applications;
        })
      );
      const questions = await Promise.all(
        roles.map(async (role) => {
          const { questions } = await getRoleQuestions(role.id);
          return questions;
        })
      );
      const answers = await Promise.all(
        allApplications.map((a) =>
          Promise.all(
            a.map(async (application) => {
              const { answers } = await getApplicationAnswers(application.id);
              return answers;
            })
          )
        )
      );
      const ratings = await Promise.all(
        allApplications.map((a) =>
          Promise.all(
            a.map(async (application) => {
              const { ratings } = await getApplicationRatings(application.id);
              return ratings[ratings.length - 1];
            })
          )
        )
      );

      console.log(allApplications);

      setSelectedApplication(allApplications[0][0]?.id);
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
    };

    void fetchData();
  }, []);

  const setMark = (newMark: number) => {
    const newApplications = { ...applications };
    newApplications[selectedPosition][selectedApplication].mark = newMark;
    setApplications(newApplications);
    void setApplicationRating(
      applications[selectedPosition][selectedApplication].applicationId,
      newMark
    );
  };

  return (
    <Container>
      <ReviewerStepper activeStep={0} />

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
