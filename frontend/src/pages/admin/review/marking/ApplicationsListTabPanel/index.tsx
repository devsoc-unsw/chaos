import { Box, Divider, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import tw from "twin.macro";

import { MarkChip } from "components";
import ApplicationPreviewer from "components/ApplicationPreviewer";
import useFetch from "hooks/useFetch";

import { RatingChips } from "./applicationsListTabPanel";

import type { ApplicationWithQuestions } from "pages/admin/types";
import type { PostCommentRespone } from "types/api";

type Props = {
  application: ApplicationWithQuestions;
  setMark: (mark: number) => void;
};

const ApplicationsListTabPanel = ({ application, setMark }: Props) => {
  const [comments, setComments] = useState("");

  const { put: putComment } = useFetch<PostCommentRespone>("/comment", {
    abortBehaviour: "sameUrl",
  });

  const updateComments = () => {
    const reqBody = {
      description: comments,
      application_id: application.applicationId,
    };

    void putComment("/", { body: reqBody });
  };

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
            <MarkChip
              clickable
              mark={1}
              colored={application.mark === 1}
              onClick={() => setMark(1)}
            />
          </Grid>
          <Grid item>
            <MarkChip
              mark={2}
              colored={application.mark === 2}
              clickable
              onClick={() => setMark(2)}
            />
          </Grid>
          <Grid item>
            <MarkChip
              mark={3}
              colored={application.mark === 3}
              clickable
              onClick={() => setMark(3)}
            />
          </Grid>
          <Grid item>
            <MarkChip
              mark={4}
              colored={application.mark === 4}
              clickable
              onClick={() => setMark(4)}
            />
          </Grid>
          <Grid item>
            <MarkChip
              mark={5}
              colored={application.mark === 5}
              clickable
              onClick={() => setMark(5)}
            />
          </Grid>
        </RatingChips>

        <TextField
          css={{ "& textarea": tw`ring-0` }}
          id={`${application.applicationId}-comments`}
          label="Your comments"
          multiline
          rows={4}
          fullWidth
          placeholder="Your comments"
          onChange={(e) => setComments(e.target.value)}
          onBlur={updateComments}
        />
      </Box>
    </div>
  );
};

export default ApplicationsListTabPanel;
