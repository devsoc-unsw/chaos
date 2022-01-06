import React from "react";
import PropTypes from "prop-types";
import { ColoredChip } from "./markChip.styled";

const MarkChip = (props) => {
  const { mark } = props;
  // return <Chip label={mark} sx={{ backgroundColor: "red" }} />;

  return <ColoredChip label={mark.toFixed(2)} mark={mark} />;
};

MarkChip.propTypes = {
  mark: PropTypes.number.isRequired,
};

export default MarkChip;
