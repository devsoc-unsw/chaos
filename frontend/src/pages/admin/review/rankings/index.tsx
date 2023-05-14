import { Button, Container, Grid, Typography } from "@mui/material";
import { green, red } from "@mui/material/colors";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  getApplicationAnswers,
  getApplicationRatings,
  getCampaign,
  getRoleApplications,
  getRoleQuestions,
} from "api";
import LoadingIndicator from "components/LoadingIndicator";
import ReviewerStepper from "components/ReviewerStepper";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import useFetch from "hooks/useFetch";
import { pushToast } from "utils";

import DragDropRankings from "./DragDropRankings";

import type { Applications, Ranking } from "./types";
import type { ApplicationStatus } from "types/api";

const statusCmp = (x: ApplicationStatus, y: ApplicationStatus) => {
  switch (x) {
    case "Success":
      return y === "Success" ? 0 : -1;
    case "Rejected":
      return y === "Rejected" ? 0 : 1;
    default:
      switch (y) {
        case "Success":
          return 1;
        case "Rejected":
          return -1;
        default:
          return 0;
      }
  }
};

const ratingsMean = (ratings: Ranking["ratings"]) =>
  ratings.reduce((x, y) => x + y.rating, 0) / ratings.length;

const rankingCmp = (x: Ranking, y: Ranking) =>
  statusCmp(x.status, y.status) ||
  ratingsMean(y.ratings) - ratingsMean(x.ratings);

const Rankings = () => {
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [applications, setApplications] = useState<Applications>({});
  const [passIndex, setPassIndex] = useState(0);

  const { put } = useFetch<void>("/application", {
    abortBehaviour: "sameUrl",
    jsonResp: false,
  });

  useEffect(() => {
    const updateRankings = async () => {
      const success = await Promise.all(
        rankings.map(async (ranking, index) => {
          const { error, aborted } = await put(
            `/${ranking.id}/private_status`,
            {
              body: index < passIndex ? "Success" : "Rejected",
              errorSummary: `Failed to update status for ${ranking.name}`,
            }
          );
          return !error && !aborted;
        })
      );

      if (success.every(Boolean)) {
        pushToast(
          "Update status",
          "Updated internal application statuses for role",
          "success"
        );
      }
    };

    void updateRankings();
  }, [rankings]);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const { name: campaignName } = await getCampaign(campaignId);
      setNavBarTitle(`Ranking for ${campaignName}`);

      const { applications } = await getRoleApplications(roleId);
      const getRatings = async (applicationId: number) => {
        const { ratings } = await getApplicationRatings(applicationId);
        const userIdsSeen = new Set();
        return ratings
          .reverse()
          .filter((rating) => {
            const seen = userIdsSeen.has(rating.rater_user_id);
            userIdsSeen.add(rating.rater_user_id);
            return !seen;
          })
          .map((rating) => ({
            rater: `User ${rating.rater_user_id}`,
            rating: rating.rating,
          }));
      };

      const rankings = await Promise.all(
        applications.map(async (application) => ({
          name: application.user_display_name,
          id: application.id,
          status: application.private_status,
          ratings: await getRatings(application.id),
        }))
      );
      rankings.sort(rankingCmp);
      setRankings(rankings);
      const passIndex = rankings.findIndex((r) => r.status !== "Success");
      setPassIndex(passIndex === -1 ? rankings.length : passIndex);

      const { questions } = await getRoleQuestions(roleId);

      const answers = await Promise.all(
        applications.map(async (application) => {
          const { answers } = await getApplicationAnswers(application.id);
          return answers;
        })
      );

      setApplications(
        Object.fromEntries(
          applications.map((application, applicationIdx) => [
            application.id,
            {
              applicationId: application.id,
              zId: application.user_zid,
              questions: questions.map((question, questionIdx) => ({
                question: question.title,
                answer: answers[applicationIdx][questionIdx]?.description,
              })),
            },
          ])
        )
      );
      setLoading(false);
    };

    void fetchData();
  }, [roleId]);

  if (loading) {
    return <LoadingIndicator />;
  }

  return (
    <Container>
      <ReviewerStepper activeStep={1} />

      <Typography paragraph>
        The candidates below are ranked based on their aggregate application
        mark. Candidates may be reordered, and clicking on a candidate will open
        up their application and comments. Drag the pass bar to determine which
        candidates are{" "}
        <Typography component="span" color={`${green[500]}`}>
          <b>accepted</b>
        </Typography>{" "}
        or{" "}
        <Typography component="span" color={`${red[500]}`}>
          <b>rejected</b>
        </Typography>{" "}
        and then press <b>Next</b> to confirm your selections.
      </Typography>

      <DragDropRankings
        rankings={rankings}
        setRankings={setRankings}
        applications={applications}
        passIndex={passIndex}
        setPassIndex={setPassIndex}
      />

      <Grid container justifyContent="flex-end">
        <Button component={Link} to="../finalise" relative="path">
          Next
        </Button>
      </Grid>
    </Container>
  );
};

export default Rankings;
