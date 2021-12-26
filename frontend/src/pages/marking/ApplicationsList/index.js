import React from "react";
import PropTypes from "prop-types";

import { Tab, Tabs, Grid, Chip } from "@mui/material";
import ApplicationsListTabPanel from "../ApplicationsListTabPanel";

const getChipColor = (mark) => {
  if (mark === 1) return "error";
  if (mark === 2) return "warning";
  if (mark === 3) return "secondary";
  if (mark === 4) return "info";
  return "success";
};

const ApplicationsList = (props) => {
  // TODO: CHAOS-12 handle candidates from multiple positions from BE
  const { applications, setMark, selectedApplication, setSelectedApplication } =
    props;

  const handleChange = (event, newValue) => {
    setSelectedApplication(newValue);
  };

  return (
    <Grid container>
      <Grid item xs={2}>
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={selectedApplication}
          onChange={handleChange}
          aria-label="applications"
          sx={{ borderRight: 1, borderColor: "divider" }}
        >
          {applications.map((application) => (
            <Tab
              label={
                <Grid
                  container
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {application.zId}
                  {application.mark ? (
                    <Chip
                      label={application.mark}
                      color={getChipColor(application.mark)}
                    />
                  ) : (
                    ""
                  )}
                </Grid>
              }
            />
          ))}
        </Tabs>
      </Grid>
      <Grid item xs={10}>
        <ApplicationsListTabPanel
          application={applications[selectedApplication]}
          setMark={setMark}
          selectedApplication={selectedApplication}
        />
      </Grid>
    </Grid>
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
  setMark: PropTypes.func.isRequired,
  selectedApplication: PropTypes.string.isRequired,
  setSelectedApplication: PropTypes.func.isRequired,
};

export default ApplicationsList;
