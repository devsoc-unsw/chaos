import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent, Divider } from "@mui/material";
import ApplicationPreviewer from "../../../components/ApplicationPreviewer";

const FinalRatingApplicationComments = (props) => {
  const { name, position, open, handleClose, application } = props;

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{`${name}'s Application for ${position}`}</DialogTitle>
      <Divider />
      <DialogContent>
        <ApplicationPreviewer application={application} />
      </DialogContent>
    </Dialog>
  );
};

FinalRatingApplicationComments.propTypes = {
  name: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
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

export default FinalRatingApplicationComments;
