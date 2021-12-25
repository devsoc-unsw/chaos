import React from "react";
import PropTypes from "prop-types";

import { ListItem, ListItemButton, ListItemText } from "@mui/material";

const ApplicationsListItem = (props) => {
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const { application, selectedApplication, setSelectedApplication } = props;

  const handleClick = () => {
    setSelectedApplication(application.applicationId);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={selectedApplication === application.applicationId}
        onClick={handleClick}
      >
        <ListItemText primary={application.zId} />
      </ListItemButton>
    </ListItem>
  );
};

ApplicationsListItem.propTypes = {
  application: PropTypes.shape({
    applicationId: PropTypes.string.isRequired,
    zId: PropTypes.string.isRequired,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        question: PropTypes.string.isRequired,
        answer: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  selectedApplication: PropTypes.string.isRequired,
  setSelectedApplication: PropTypes.func.isRequired,
};

export default ApplicationsListItem;
