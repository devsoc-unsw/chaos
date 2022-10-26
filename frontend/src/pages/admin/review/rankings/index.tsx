import { Button, Container, Grid, Typography } from "@mui/material";
import { green, red } from "@mui/material/colors";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getApplicationAnswers,
  getApplicationRatings,
  getCampaign,
  getRoleApplications,
  getRoleQuestions,
  setApplicationStatus,
} from "api";
import ReviewerStepper from "components/ReviewerStepper";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import DragDropRankings from "./DragDropRankings";

import type { Applications, Ranking } from "./types";

const Rankings = () => {
  const navigate = useNavigate();
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const roleId = Number(useParams().roleId);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [applications, setApplications] = useState<Applications>({});
  const [passIndex, setPassIndex] = useState(0);

  useEffect(() => {
    setPassIndex(Math.ceil((rankings.length || 0) / 2));
  }, [rankings]);

  useEffect(() => {
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
          ratings: await getRatings(application.id),
        }))
      );
      setRankings(rankings);

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
    };

    void fetchData();
  }, []);

  const handleNext = () => {
    console.log(
      "Order:",
      rankings.map((candidate) => candidate.name)
    );
    Promise.all(
      rankings.map((ranking, index) =>
        setApplicationStatus(
          ranking.id,
          index < passIndex ? "Success" : "Rejected"
        )
      )
    )
      .then(() => navigate("/finalise_candidates"))
      .catch(() => {
        // TODO: handle errors
      });
  };

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
        <Button onClick={handleNext}>Next</Button>
      </Grid>
    </Container>
  );
};

export default Rankings;
