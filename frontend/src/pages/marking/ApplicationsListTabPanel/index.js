import React from "react";
import PropTypes from "prop-types";

import { Box, Chip, Divider, Grid, TextField, Typography } from "@mui/material";
import ApplicationPreviewer from "../../../components/ApplicationPreviewer";
import { RatingChips } from "./applicationsListTabPanel";

const ApplicationsListTabPanel = (props) => {
  const { application, setMark } = props;

  return (
    <div
      role="tabpanel"
      id={`vertical-tabpanel-${application.applicationId}`}
      aria-labelledby={`vertical-tab-${application.applicationId}`}
    >
      <ApplicationPreviewer application={application} />

      <Divider />

      <Box m={3}>
        <Typography variant="h6" gutterBottom>
          Final Mark
        </Typography>

        <RatingChips container spacing={2}>
          <Grid item>
            <Chip
              clickable
              label={1}
              color={application.mark === 1 ? "error" : "default"}
              onClick={() => setMark(1)}
            />
          </Grid>
          <Grid item>
            <Chip
              clickable
              label={2}
              color={application.mark === 2 ? "warning" : "default"}
              onClick={() => setMark(2)}
            />
          </Grid>
          <Grid item>
            <Chip
              clickable
              label={3}
              color={application.mark === 3 ? "secondary" : "default"}
              onClick={() => setMark(3)}
            />
          </Grid>
          <Grid item>
            <Chip
              clickable
              label={4}
              color={application.mark === 4 ? "info" : "default"}
              onClick={() => setMark(4)}
            />
          </Grid>
          <Grid item>
            <Chip
              clickable
              label={5}
              color={application.mark === 5 ? "success" : "default"}
              onClick={() => setMark(5)}
            />
          </Grid>
        </RatingChips>

        {/* TODO CHAOS-18: save comments to backend */}
        <TextField
          id={`${application.applicationId}-comments`}
          label="Your comments"
          multiline
          rows={4}
          fullWidth
          placeholder="Your comments"
        />
      </Box>
    </div>
  );
};

ApplicationsListTabPanel.propTypes = {
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
  setMark: PropTypes.func.isRequired,
};

export default ApplicationsListTabPanel;
