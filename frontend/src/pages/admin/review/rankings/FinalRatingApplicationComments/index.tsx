import { Dialog, DialogContent, DialogTitle, Divider } from "@mui/material";
import { useParams } from "react-router-dom";

import ApplicationPreviewer from "components/ApplicationPreviewer";

import { useRoles } from "../..";

import type { ApplicationWithQuestions } from "pages/admin/types";

type Props = {
  name: string;
  open: boolean;
  handleClose: () => void;
  application: ApplicationWithQuestions;
};

const FinalRatingApplicationComments = ({
  name,
  open,
  handleClose,
  application,
}: Props) => {
  const roles = useRoles();
  const roleId = Number(useParams().roleId);

  return (
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle>{`${name}'s Application for ${roles[roleId]?.name}`}</DialogTitle>
      <Divider />
      <DialogContent>
        <ApplicationPreviewer application={application} />
      </DialogContent>
    </Dialog>
  );
};

export default FinalRatingApplicationComments;
