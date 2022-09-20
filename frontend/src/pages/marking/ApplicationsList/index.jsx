import PropTypes from "prop-types";

import { Tab, Tabs, Grid } from "@mui/material";
import ApplicationsListTabPanel from "../ApplicationsListTabPanel";
import { MarkChip } from "../../../components";

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
              sx={{ textTransform: "none" }}
              label={
                <Grid
                  container
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {application.zId}
                  {application.mark ? (
                    <MarkChip mark={application.mark} colored />
                  ) : (
                    ""
                  )}
                </Grid>
              }
              key={application.applicationId}
            />
          ))}
        </Tabs>
      </Grid>
      {applications[selectedApplication] ? (
        <Grid item xs={10}>
          <ApplicationsListTabPanel
            application={applications[selectedApplication]}
            setMark={setMark}
            selectedApplication={selectedApplication}
          />
        </Grid>
      ) : null}
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
