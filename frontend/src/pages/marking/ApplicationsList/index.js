import React from "react";
import PropTypes from "prop-types";

import { Tab, Tabs, Box } from "@mui/material";
import ApplicationsListTabPanel from "../ApplicationsListTabPanel";

const ApplicationsList = (props) => {
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const { applications, selectedApplication, setSelectedApplication } = props;

  const handleChange = (event, newValue) => {
    console.log(selectedApplication);
    setSelectedApplication(newValue);
    console.log("new value is ", newValue);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Tabs
        orientation="vertical"
        variant="scrollable"
        value={selectedApplication}
        onChange={handleChange}
        aria-label="applications"
        sx={{ borderRight: 1, borderColor: "divider" }}
      >
        {applications.map((application) => (
          <Tab label={application.zId} />
        ))}
      </Tabs>
      {applications.map((application, index) => (
        <ApplicationsListTabPanel
          application={application}
          value={index}
          selectedApplication={selectedApplication}
        />
      ))}
    </Box>
  );
};

ApplicationsList.propTypes = {
  applications: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        applicationId: PropTypes.string.isRequired,
        zId: PropTypes.string.isRequired,
        mark: PropTypes.number.isRequired,
        questions: PropTypes.arrayOf(
          PropTypes.shape({
            question: PropTypes.string.isRequired,
            answer: PropTypes.string.isRequired,
          })
        ),
      })
    )
  ).isRequired,
  selectedApplication: PropTypes.string.isRequired,
  setSelectedApplication: PropTypes.func.isRequired,
};

export default ApplicationsList;
