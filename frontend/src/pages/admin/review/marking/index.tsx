import { Button, Container, Grid } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "twin.macro";

import {
  getAnsweredApplicationQuestions,
  getApplicationAnswers,
  getApplicationRatings,
  getCampaign,
  getCommonApplicationAnswers,
  getCommonQuestions,
  getRoleApplications,
  getRoleQuestions,
  getSelfInfo,
  setApplicationRating,
} from "api";
import { LoadingIndicator } from "components";
import ReviewerStepper from "components/ReviewerStepper";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import ApplicationsList from "./ApplicationsList";

import type { ApplicationWithQuestions } from "pages/admin/types";

const Marking = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const params = useParams();
  const campaignId = String(params.campaignId ?? params.campaignSlug);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationWithQuestions[]>(
    []
  );
  const roleId = String(params.roleId ?? params.roleSlug);
  const [selectedApplication, setSelectedApplication] = useState(0);

  useEffect(() => {
    setLoading(true);

    const fetchData = async () => {
      const { name: campaignName } = await getCampaign(campaignId);
      setNavBarTitle(`Marking for ${campaignName}`);

      const applications = await getRoleApplications(roleId);
      console.log(applications[0]);

      const questions = await getRoleQuestions(campaignId, roleId);
      const commonQuestions = await getCommonQuestions(campaignId);
      const answers = await getAnsweredApplicationQuestions(applications, campaignId, roleId);
      const ratings = await Promise.all(
        applications.map(async (application) => {
          const { ratings } = await getApplicationRatings(application.id);
          return ratings[ratings.length - 1];
        })
      );

      setApplications(
        applications.map((application, applicationIdx) => ({
          applicationId: application.id,
          campaign_id: application.campaign_id,
          user: application.user,
          status: application.status,
          private_status: application.private_status,
          applied_roles: application.applied_roles,
          zId: application.user.zid || "N/A", // Convenience field extracted from user.zid
          mark: ratings[applicationIdx]?.rating,
          questions: [
            // Common questions first
            ...commonQuestions.map((question) => {
              const answer = answers[applicationIdx][question.id];
              return {
                question: question.title,
                answer: Array.isArray(answer) ? answer.join("\n") : (answer || "No answer provided"),
                isCommon: true,
              };
            }),
            // Role-specific questions second
            ...questions.map((question) => {
              const answer = answers[applicationIdx][question.id];
              return {
                question: question.title,
                answer: Array.isArray(answer) ? answer.join("\n") : (answer || "No answer provided"),
                isCommon: false,
              };
            }),
          ],
        }))
      );
      setLoading(false);
    };

    void fetchData();
  }, [roleId, campaignId]);

  const setMark = (newMark: number) => {
    const newApplications = [...applications];
    newApplications[selectedApplication].mark = newMark;
    setApplications(newApplications);
    void setApplicationRating(
      applications[selectedApplication].applicationId,
      {
        rating: newMark,
        //comment: comment
      }
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
