import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Button, Grid, Typography } from "@mui/material";
import { red, green } from "@mui/material/colors";

import RankingsToolbar from "./RankingsToolbar";
import DragDropRankings from "./DragDropRankings";
import ReviewerStepper from "../../components/ReviewerStepper";
import { SetNavBarTitleContext } from "../../App";
import {
  getApplicationRatings,
  getCampaignRoles,
  getRoleApplications,
} from "../../api";

// TODO: CHAOS-12 retrieve data from BE instead of using dummy data
const dummyRankings = {
  "Student Experience Director": [
    {
      name: "Hayes Choy",
      ratings: [
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 5 },
        { rater: "Haley Gu", rating: 5 },
      ],
    },
    {
      name: "Giuliana De Bellis",
      ratings: [
        { rater: "Shrey Somaiya", rating: 4 },
        { rater: "Michael Gribben", rating: 4 },
        { rater: "Haley Gu", rating: 3 },
      ],
    },
    {
      name: "Colin Hon",
      ratings: [
        { rater: "Shrey Somaiya", rating: 2 },
        { rater: "Michael Gribben", rating: 2 },
        { rater: "Haley Gu", rating: 2 },
      ],
    },
    {
      name: "Lachlan Ting",
      ratings: [
        { rater: "Shrey Somaiya", rating: 1 },
        { rater: "Michael Gribben", rating: 2 },
        { rater: "Haley Gu", rating: 1 },
      ],
    },
    {
      name: "Evan Lee",
      ratings: [
        { rater: "Shrey Somaiya", rating: 1 },
        { rater: "Michael Gribben", rating: 1 },
        { rater: "Haley Gu", rating: 1 },
      ],
    },
    {
      name: "Priscilla Soo",
      ratings: [
        { rater: "Shrey Somaiya", rating: 4 },
        { rater: "Michael Gribben", rating: 4 },
        { rater: "Haley Gu", rating: 5 },
      ],
    },
    {
      name: "Timmy Huang",
      ratings: [
        { rater: "Shrey Somaiya", rating: 3 },
        { rater: "Michael Gribben", rating: 3 },
        { rater: "Haley Gu", rating: 2 },
      ],
    },
  ],
  "Socials Director": [
    {
      name: "Lachlan Ting",
      ratings: [
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 3 },
        { rater: "Haley Gu", rating: 1 },
      ],
    },
    {
      name: "Evan Lee",
      ratings: [
        { rater: "Shrey Somaiya", rating: 5 },
        { rater: "Michael Gribben", rating: 5 },
        { rater: "Haley Gu", rating: 3 },
      ],
    },
  ],
};

const dummyPositions = Object.keys(dummyRankings);

const Rankings = () => {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const [selectedPosition, setSelectedPosition] = useState("");
  const [rankings, setRankings] = useState(dummyRankings);
  const [positions, setPositions] = useState([]);

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
        return applicationRatings.ratings.map((rating) => ({
          rater: rating.rater_user_id,
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
                  name: "dummy",
                  ratings: await getRatings(application.id),
                }))
              ),
            ])
          )
        )
      );
      setPositions(roles.map((role) => role.name));
    })();
  }, []);

  const handleNext = () => {
    console.log(
      "Order:",
      rankings[selectedPosition].map((candidate) => candidate.name)
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
      />

      <Grid container justifyContent="flex-end">
        {/* TODO CHAOS-16: progress to next page */}
        <Button onClick={handleNext}>Next (Console Log)</Button>
      </Grid>
    </Container>
  );
};

export default Rankings;
