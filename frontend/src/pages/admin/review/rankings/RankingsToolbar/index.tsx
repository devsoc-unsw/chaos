import SortIcon from "@mui/icons-material/Sort";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

import type { SelectChangeEvent } from "@mui/material";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  positions: string[];
  selectedPosition: string;
  setSelectedPosition: Dispatch<SetStateAction<string>>;
};

const RankingsToolbar = ({
  positions,
  selectedPosition,
  setSelectedPosition,
}: Props) => {
  const handleChange = (event: SelectChangeEvent) => {
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

export default RankingsToolbar;
