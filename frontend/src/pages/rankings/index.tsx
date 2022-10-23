import { Button, Container, Grid, Typography } from "@mui/material";
import { green, red } from "@mui/material/colors";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getApplicationAnswers,
  getApplicationRatings,
  getCampaign,
  getCampaignRoles,
  getRoleApplications,
  getRoleQuestions,
  setApplicationStatus,
} from "api";
import ReviewerStepper from "components/ReviewerStepper";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import DragDropRankings from "./DragDropRankings";
import RankingsToolbar from "./RankingsToolbar";

import type { Applications, Rankings as IRankings } from "./types";

const Rankings = () => {
  const navigate = useNavigate();
  const campaignId = Number(useParams().campaignId);
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  const [roles, setRoles] = useState<{ [id: number]: string }>({});
  const roleId = Number(useParams().roleId);
  const selectedPosition = roles[roleId];
  const [rankings, setRankings] = useState<IRankings>({});
  const [positions, setPositions] = useState<string[]>([]);
  const [applications, setApplications] = useState<Applications>({});
  const [passIndices, setPassIndices] = useState<{ [k: string]: number }>({});

  const passIndex = passIndices[selectedPosition] ?? 0;
  const setPassIndex = (index: number) => {
    if (!selectedPosition) return;
    setPassIndices({ ...passIndices, [selectedPosition]: index });
  };

  useEffect(() => {
    if (Object.hasOwnProperty.call(passIndices, selectedPosition)) return;
    setPassIndex(Math.ceil((rankings[selectedPosition]?.length || 0) / 2));
  }, [selectedPosition]);

  useEffect(() => {
    const fetchData = async () => {
      const { name: campaignName } = await getCampaign(campaignId);
      setNavBarTitle(`Ranking for ${campaignName}`);
      const { roles } = await getCampaignRoles(campaignId);
      setRoles(
        Object.fromEntries(roles.map(({ id, ...role }) => [id, role.name]))
      );
      console.log("roles", roles);

      const allApplications = await Promise.all(
        roles.map(async (role) => {
          const { applications } = await getRoleApplications(role.id);
          return applications;
        })
      );
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

      const roleToRankings = (roleIdx: number) =>
        Promise.all(
          allApplications[roleIdx].map(async (application) => ({
            name: application.user_display_name,
            id: application.id,
            ratings: await getRatings(application.id),
          }))
        );
      const rankingsArr = await Promise.all(
        roles.map(
          async (
            role,
            roleIdx
          ): Promise<[string, Awaited<ReturnType<typeof roleToRankings>>]> => [
            role.name,
            await roleToRankings(roleIdx),
          ]
        )
      );
      const rankings = Object.fromEntries(rankingsArr);
      setRankings(rankings);

      console.log(roles);
      setPositions(roles.map((role) => role.name));

      const questions = await Promise.all(
        roles.map(async (role) => {
          const { questions } = await getRoleQuestions(role.id);
          return questions;
        })
      );
      const answers = await Promise.all(
        allApplications.map((applications) =>
          Promise.all(
            applications.map(async (a) => {
              const { answers } = await getApplicationAnswers(a.id);
              return answers;
            })
          )
        )
      );

      // TODO(michael): holy fuck refactor this shit
      setApplications(
        Object.fromEntries(
          roles.map((role, roleIdx) => [
            role.name,
            Object.fromEntries(
              allApplications[roleIdx].map((application, applicationIdx) => [
                application.id,
                {
                  applicationId: application.id,
                  zId: application.user_zid,
                  questions: questions[roleIdx].map(
                    (question, questionIdx) => ({
                      question: question.title,
                      answer:
                        answers[roleIdx][applicationIdx][questionIdx]
                          ?.description,
                    })
                  ),
                },
              ])
            ),
          ])
        )
      );
    };

    void fetchData();
  }, []);

  const handleNext = () => {
    console.log(
      "Order:",
      rankings[selectedPosition].map((candidate) => candidate.name)
    );
    console.log(passIndices);
    Promise.all(
      positions.map((position) =>
        Promise.all(
          rankings[position].map((ranking, index) =>
            setApplicationStatus(
              ranking.id,
              index < passIndices[selectedPosition] ? "Success" : "Rejected"
            )
          )
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
        selectedPosition={selectedPosition}
        applications={applications}
        passIndex={passIndex}
        setPassIndex={setPassIndex}
      />

      <Grid container justifyContent="flex-end">
        <Button
          disabled={Object.keys(passIndices).length !== positions.length}
          onClick={handleNext}
        >
          Next
        </Button>
      </Grid>
    </Container>
  );
};

export default Rankings;
