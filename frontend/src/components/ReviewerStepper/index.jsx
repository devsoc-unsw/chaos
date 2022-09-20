import React from "react";
import PropTypes from "prop-types";
import { Step, StepLabel } from "@mui/material";
import { NavStepper } from "./reviewerStepper.styled";

const ReviewerStepper = (props) => {
  const { activeStep } = props;

  return (
    <NavStepper alternativeLabel activeStep={activeStep}>
      <Step>
        <StepLabel>Mark candidates individually</StepLabel>
      </Step>
      <Step>
        <StepLabel>Choose candidates to progress to the next stage</StepLabel>
      </Step>
      <Step>
        <StepLabel>Notify candidates of their results</StepLabel>
      </Step>
    </NavStepper>
  );
};

ReviewerStepper.propTypes = {
  activeStep: PropTypes.number.isRequired,
};

export default ReviewerStepper;
