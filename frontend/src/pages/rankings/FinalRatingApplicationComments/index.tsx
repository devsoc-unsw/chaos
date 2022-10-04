import { Dialog, DialogContent, DialogTitle, Divider } from "@mui/material";

import ApplicationPreviewer from "components/ApplicationPreviewer";

import type { ApplicationWithQuestions } from "types/admin";

type Props = {
  name: string;
  position: string;
  open: boolean;
  handleClose: () => void;
  application: ApplicationWithQuestions;
};

const FinalRatingApplicationComments = ({
  name,
  position,
  open,
  handleClose,
  application,
}: Props) => (
  <Dialog onClose={handleClose} open={open}>
    <DialogTitle>{`${name}'s Application for ${position}`}</DialogTitle>
    <Divider />
    <DialogContent>
      <ApplicationPreviewer application={application} />
    </DialogContent>
  </Dialog>
);

export default FinalRatingApplicationComments;
