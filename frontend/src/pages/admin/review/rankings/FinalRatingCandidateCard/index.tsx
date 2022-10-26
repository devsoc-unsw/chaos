import { CardContent, Grid, Tooltip, Typography } from "@mui/material";
import { useState } from "react";

import { MarkChip } from "../../../../../components";
import FinalRatingApplicationComments from "../FinalRatingApplicationComments";

import {
  CandidateCard,
  GridCandidateName,
  RatingChip,
} from "./finalRatingCandidateCard.styled";

import type { ApplicationWithQuestions } from "pages/admin/types";

// TODO CHAOS-15: proper algo to aggregate marks
const calculateAvg = (ratings: { rater: string; rating: number }[]) => {
  if (ratings.length === 0) return 0;

  const sum = ratings.map((a) => a.rating).reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length;
  return Math.round(avg * 100) / 100;
};

type Props = {
  name: string;
  position: string;
  ratings: { rater: string; rating: number }[];
  reject?: boolean;
  application: ApplicationWithQuestions;
};

const FinalRatingCandidateCard = ({
  name,
  position,
  ratings,
  reject = false,
  application,
}: Props) => {
  const [open, setOpen] = useState(false);
  console.log(ratings);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <CandidateCard reject={reject} variant="outlined" onClick={handleOpen}>
        <CardContent>
          <Grid container alignItems="center">
            <Grid item>
              <MarkChip mark={calculateAvg(ratings)} colored decimal />
            </Grid>
            <GridCandidateName item>
              <Typography variant="h6" component="span">
                {name}
              </Typography>
            </GridCandidateName>
            <Grid item>
              <Typography variant="overline" sx={{ margin: "1rem" }}>
                {/* TODO: put some user info here */}
              </Typography>
            </Grid>
            <Grid item>
              {ratings.map(({ rater, rating }) => (
                <Tooltip placement="top" arrow title={rater} key={rater}>
                  <RatingChip label={rating} variant="outlined" />
                </Tooltip>
              ))}
            </Grid>
          </Grid>
        </CardContent>
      </CandidateCard>
      <FinalRatingApplicationComments
        name={name}
        position={position}
        open={open}
        handleClose={handleClose}
        application={application}
      />
    </>
  );
};

export default FinalRatingCandidateCard;
