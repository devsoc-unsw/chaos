import React, { useState } from "react";
import PropTypes from "prop-types";
import { CardContent, Typography, Tooltip, Grid } from "@mui/material";

import {
  CandidateCard,
  RatingChip,
  GridCandidateName,
  BullSpan,
} from "./finalRatingCandidateCard.styled";
import { MarkChip } from "../../../components";
import FinalRatingApplicationComments from "../FinalRatingApplicationComments";

// TODO CHAOS-15: proper algo to aggregate marks
const calculateAvg = (ratings) => {
  if (ratings.length === 0) return 0;

  const sum = ratings.map((a) => a.rating).reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length;
  return Math.round(avg * 100) / 100;
};

const FinalRatingCandidateCard = (props) => {
  const { name, position, ratings, reject, application } = props;
  const [open, setOpen] = useState(false);

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
                Domestic
                <BullSpan>•</BullSpan>
                3rd Year
                <BullSpan>•</BullSpan>
                Software Engineering
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

FinalRatingCandidateCard.propTypes = {
  name: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  ratings: PropTypes.arrayOf(
    PropTypes.shape({
      rater: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
    })
  ).isRequired,
  reject: PropTypes.bool,
  application: PropTypes.shape({
    applicationId: PropTypes.string.isRequired,
    zId: PropTypes.string.isRequired,
    mark: PropTypes.number.isRequired,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        question: PropTypes.string.isRequired,
        answer: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
};

FinalRatingCandidateCard.defaultProps = {
  reject: false,
};

export default FinalRatingCandidateCard;
