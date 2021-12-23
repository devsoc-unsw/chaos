import React from "react";
import PropTypes from "prop-types";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";

const FinalRatingApplicationComments = (props) => {
  const { name, position, open, handleClose } = props;

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{`${name}'s Application for ${position}`}</DialogTitle>
      <DialogContent>BLAH BLAH BLAH</DialogContent>
    </Dialog>
  );
};

FinalRatingApplicationComments.propTypes = {
  name: PropTypes.string.isRequired,
  position: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default FinalRatingApplicationComments;
