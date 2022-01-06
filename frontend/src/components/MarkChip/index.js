import React from "react";
import PropTypes from "prop-types";
import { ColoredChip } from "./markChip.styled";

const MarkChip = (props) => {
  const { mark, decimal, colored, clickable, onClick } = props;
  return (
    <ColoredChip
      label={decimal ? mark.toFixed(2) : mark}
      mark={mark}
      colored={colored}
      clickable={clickable}
      onClick={onClick}
    />
  );
};

MarkChip.propTypes = {
  mark: PropTypes.number.isRequired,
  decimal: PropTypes.bool,
  colored: PropTypes.bool,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
};

MarkChip.defaultProps = {
  decimal: false,
  colored: false,
  clickable: false,
  onClick: () => {},
};

export default MarkChip;
