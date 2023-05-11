import { Button, Container, Grid } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import "twin.macro";

import {
  getApplicationAnswers,
  getApplicationRatings,
  getCampaign,
  getRoleApplications,
  getRoleQuestions,
  setApplicationRating,
} from "api";
import { LoadingIndicator } from "components";
import ReviewerStepper from "components/ReviewerStepper";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import ApplicationsList from "./ApplicationsList";

import type { ApplicationWithQuestions } from "pages/admin/types";

const Marking = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const campaignId = Number(useParams().campaignId);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationWithQuestions[]>(
    []
  );
  const roleId = Number(useParams().roleId);
  const [selectedApplication, setSelectedApplication] = useState(0);

  useQuery(["campaign", campaignId], () => getCampaign(campaignId), {
    onSuccess: (campaign) => {
      setNavBarTitle(`Marking for ${campaign.name}`);
    },
  });

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      const { applications } = await getRoleApplications(roleId);

      const { questions } = await getRoleQuestions(roleId);
      const answers = await Promise.all(
        applications.map(async (application) => {
          const { answers } = await getApplicationAnswers(application.id);
          return answers;
        })
      );
      const ratings = await Promise.all(
        applications.map(async (application) => {
          const { ratings } = await getApplicationRatings(application.id);
          return ratings[ratings.length - 1];
        })
      );

      setApplications(
        applications.map((application, applicationIdx) => ({
          applicationId: application.id,
          zId: application.user_zid,
          mark: ratings[applicationIdx]?.rating,
          questions: questions.map((question, questionIdx) => ({
            question: question.title,
            answer: answers[applicationIdx][questionIdx]?.description,
          })),
        }))
      );
      setLoading(false);
    };

    void fetchData();
  }, [roleId]);

  const setMark = (newMark: number) => {
    const newApplications = [...applications];
    newApplications[selectedApplication].mark = newMark;
    setApplications(newApplications);
    void setApplicationRating(
      applications[selectedApplication].applicationId,
      newMark
    );
  };

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Container>
      <ReviewerStepper activeStep={0} />

      {Object.keys(applications).length ? (
        <ApplicationsList
          applications={applications}
          setMark={setMark}
          selectedApplication={selectedApplication}
          setSelectedApplication={setSelectedApplication}
        />
      ) : null}

      <Grid container justifyContent="flex-end">
        <Button
          component={Link}
          to="../rankings"
          relative="path"
          disabled={applications.some((application) => application.mark === 0)}
        >
          Next (Rankings)
        </Button>
      </Grid>
    </Container>
  );
};

export default Marking;
