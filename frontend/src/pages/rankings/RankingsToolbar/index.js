import React from "react";
import PropTypes from "prop-types";

import {
  FormControl,
  Grid,
  Select,
  InputLabel,
  MenuItem,
  Button,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";

const RankingsToolbar = (props) => {
  const { positions, selectedPosition, setSelectedPosition } = props;

  const handleChange = (event) => {
    setSelectedPosition(event.target.value);
  };

  return (
    <Grid container alignItems="center" spacing={4}>
      <Grid item xs>
        <FormControl fullWidth>
          <InputLabel id="candidate-position-select-label">Position</InputLabel>
          <Select
            labelId="candidate-position-select-label"
            id="candidate-position-select"
            value={selectedPosition}
            label="Position"
            onChange={handleChange}
          >
            {positions.map((position) => (
              <MenuItem key={position} value={position}>
                {position}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item>
        {/* TODO: CHAOS-11 sort candidates when button is pressed */}
        <Button variant="outlined" startIcon={<SortIcon />}>
          Sort candidates
        </Button>
      </Grid>
    </Grid>
  );
};

RankingsToolbar.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedPosition: PropTypes.string.isRequired,
  setSelectedPosition: PropTypes.func.isRequired,
};

export default RankingsToolbar;
