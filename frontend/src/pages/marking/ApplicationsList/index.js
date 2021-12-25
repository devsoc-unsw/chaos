import React from "react";
import PropTypes from "prop-types";

import { List } from "@mui/material";
import ApplicationsListItem from "../ApplicationsListItem";

const ApplicationsList = (props) => {
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const { applications, selectedApplication, setSelectedApplication } = props;

  return (
    <List component="nav" aria-label="applications">
      {applications.map((application) => (
        <ApplicationsListItem
          application={application}
          selectedApplication={selectedApplication}
          setSelectedApplication={setSelectedApplication}
        />
      ))}
    </List>
  );
};

ApplicationsList.propTypes = {
  applications: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.shape({
        applicationId: PropTypes.string.isRequired,
        zId: PropTypes.string.isRequired,
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
