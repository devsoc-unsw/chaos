import React from "react";
import PropTypes from "prop-types";

import { Box, Typography } from "@mui/material";
import ApplicationPreviewer from "../../../components/ApplicationPreviewer";

const ApplicationsListTabPanel = (props) => {
  const { application, value, selectedApplication } = props;

  return (
    <div
      role="tabpanel"
      hidden={selectedApplication !== value}
      id={`vertical-tabpanel-${value}`}
      aria-labelledby={`vertical-tab-${value}`}
    >
      {selectedApplication === value && (
        <Box sx={{ p: 3 }}>
          <ApplicationPreviewer application={application} />

          {/* TODO: Rating things */}
        </Box>
      )}
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
  selectedApplication: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default ApplicationsListTabPanel;
