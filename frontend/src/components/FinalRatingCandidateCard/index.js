import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  CardContent,
  CardActionArea,
  Chip,
  Typography,
  Tooltip,
  Grid,
} from "@mui/material";
import {
  CandidateCard,
  RatingChip,
  AvgChip,
} from "./finalRatingCandidateCard.styled";

const calculateAvg = (ratings) => {
  const sum = ratings.map((a) => a.rating).reduce((a, b) => a + b, 0);
  const avg = sum / ratings.length || 0;
  return Math.round(avg * 10) / 10;
};

const FinalRatingCandidateCard = (props) => {
  const { name, position, ratings } = props;

  return (
    <CandidateCard variant="outlined">
      <CardActionArea>
        <CardContent>
          <Grid container alignItems="center">
            <Grid item>
              <AvgChip label={calculateAvg(ratings)} />
            </Grid>
            <Grid item style={{ flexGrow: 1 }}>
              <Typography variant="h6">{name}</Typography>
              <Typography color="text.secondary">{position}</Typography>
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
      </CardActionArea>
    </CandidateCard>
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
