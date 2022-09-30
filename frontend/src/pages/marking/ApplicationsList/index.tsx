import { Tab, Tabs, Grid } from "@mui/material";
import ApplicationsListTabPanel from "../ApplicationsListTabPanel";
import { MarkChip } from "../../../components";
import type { ApplicationWithQuestions } from "types/admin";
import type { SyntheticEvent } from "react";

type Props = {
  applications: ApplicationWithQuestions[];
  setMark: (mark: number) => void;
  selectedApplication: number;
  setSelectedApplication: (selectedApplication: number) => void;
};

const ApplicationsList = ({
  applications,
  setMark,
  selectedApplication,
  setSelectedApplication,
}: Props) => {
  // TODO: CHAOS-12 handle candidates from multiple positions from BE

  const handleChange = (
    _event: SyntheticEvent<Element, Event>,
    newValue: number
  ) => {
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
          />
        </Grid>
      ) : null}
    </Grid>
  );
};

export default ApplicationsList;
