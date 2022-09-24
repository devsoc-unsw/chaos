import { Step, StepLabel } from "@mui/material";
import { NavStepper } from "./reviewerStepper.styled";

type Props = {
  activeStep: number;
};
const ReviewerStepper = ({ activeStep }: Props) => (
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

export default ReviewerStepper;
