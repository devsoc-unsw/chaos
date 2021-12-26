import React, { useState } from "react";
import PropTypes from "prop-types";
import { CardContent, Typography, Tooltip, Grid } from "@mui/material";

import {
  CandidateCard,
  RatingChip,
  AvgChip,
} from "./finalRatingCandidateCard.styled";
import FinalRatingApplicationComments from "../FinalRatingApplicationComments";

// TODO CHAOS-15: proper algo to aggregate marks
const calculateAvg = (ratings) => {
  if (ratings.length === 0) return 0;

  const sum = ratings.map((a) => a.rating).reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length;
  return (Math.round(avg * 100) / 100).toFixed(2);
};

const avgColor = (avg) => {
  if (avg < 1) return "error";
  if (avg < 2) return "warning";
  if (avg < 3) return "secondary";
  if (avg < 4) return "info";
  return "success";
};

const FinalRatingCandidateCard = (props) => {
  const { name, position, ratings } = props;
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const avg = calculateAvg(ratings);

  return (
    <>
      <CandidateCard variant="outlined" onClick={handleOpen}>
        <CardContent>
          <Grid container alignItems="center">
            <Grid item>
              <AvgChip label={avg} color={avgColor(avg)} />
            </Grid>
            <Grid item style={{ flexGrow: 1 }}>
              <Typography variant="h6">{name}</Typography>
            </Grid>
            <Grid item>
              {ratings.map(({ rater, rating }) => (
                <Tooltip title={rater} key={rater}>
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
      />
    </>
  );
};

FinalRatingCandidateCard.propTypes = {
  name: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  ratings: PropTypes.arrayOf(
    PropTypes.shape({
      rater: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default FinalRatingCandidateCard;
