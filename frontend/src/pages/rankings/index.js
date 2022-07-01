import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Button, Grid, Typography } from "@mui/material";
import { red, green } from "@mui/material/colors";

import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import RankingsToolbar from "./RankingsToolbar";
import DragDropRankings from "./DragDropRankings";
import ReviewerStepper from "../../components/ReviewerStepper";
import {
  getApplicationAnswers,
  getApplicationRatings,
  getCampaignRoles,
  getRoleApplications,
  getRoleQuestions,
  setApplicationStatus,
} from "../../api";

const Rankings = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const [selectedPosition, setSelectedPosition] = useState("");
  const [rankings, setRankings] = useState({});
  const [positions, setPositions] = useState([]);
  const [applications, setApplications] = useState({});
  const [passIndices, setPassIndices] = useState({});

  const passIndex = passIndices[selectedPosition] ?? 0;
  const setPassIndex = (index) => {
    if (!selectedPosition) return;
    setPassIndices({ ...passIndices, [selectedPosition]: index });
  };

  useEffect(() => {
    if (Object.hasOwnProperty.call(passIndices, selectedPosition)) return;
    setPassIndex(Math.ceil((rankings[selectedPosition]?.length || 0) / 2));
  }, [selectedPosition]);

  useEffect(() => {
    (async () => {
      setNavBarTitle("2022 Subcommittee Recruitment (Hardcoded Title)");
      const rolesResp = await getCampaignRoles(campaignId);
      const { roles } = await rolesResp.json();

      const allApplications = await Promise.all(
        roles.map(async (role) => {
          const resp = await getRoleApplications(role.id);
          const roleApplications = await resp.json();
          return roleApplications.applications;
        })
      );
      const getRatings = async (applicationId) => {
        const resp = await getApplicationRatings(applicationId);
        const applicationRatings = await resp.json();
        const userIdsSeen = new Set();
        return applicationRatings.ratings
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
      setRankings(
        Object.fromEntries(
          await Promise.all(
            roles.map(async (role, roleIdx) => [
              role.name,
              await Promise.all(
                allApplications[roleIdx].map(async (application) => ({
                  name: application.user_display_name,
                  id: application.id,
                  ratings: await getRatings(application.id),
                }))
              ),
            ])
          )
        )
      );
      setPositions(roles.map((role) => role.name));

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

      // TODO(michael): holy fuck refactor this shit
      setApplications(
        Object.fromEntries(
          roles.map((role, roleIdx) => [
            role.name,
            Object.fromEntries(
              allApplications[roleIdx].map((application, applicationIdx) => [
                application.id,
                {
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
    })();
  }, []);

  const handleNext = async () => {
    console.log(
      "Order:",
      rankings[selectedPosition].map((candidate) => candidate.name)
    );
    console.log(passIndices);
    await Promise.all(
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
    );
    navigate("/finalise_candidates");
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

      <RankingsToolbar
        positions={positions}
        selectedPosition={selectedPosition}
        setSelectedPosition={setSelectedPosition}
      />

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
