import React from "react";
import PropTypes from "prop-types";
import { ColoredChip } from "./markChip.styled";

const MarkChip = (props) => {
  const { mark, decimal, colored, variant, clickable, onClick } = props;
  return (
    <ColoredChip
      label={decimal ? mark.toFixed(2) : mark}
      mark={mark}
      colored={colored}
      variant={variant}
      clickable={clickable}
      onClick={onClick}
    />
  );
};

MarkChip.propTypes = {
  mark: PropTypes.number.isRequired,
  decimal: PropTypes.bool,
  colored: PropTypes.bool,
  variant: PropTypes.string,
  clickable: PropTypes.bool,
  onClick: PropTypes.func,
};

MarkChip.defaultProps = {
  decimal: false,
  colored: false,
  variant: "filled",
  clickable: false,
  onClick: () => {},
};

export default MarkChip;
