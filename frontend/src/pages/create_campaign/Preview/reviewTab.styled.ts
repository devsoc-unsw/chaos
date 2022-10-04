import { Button, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";

import { COLOURS } from "../../../utils/constants";

export const SubmitWrapper = styled("div")`
  display: flex;
  justify-content: center;
  margin-bottom: 50px;
`;

export const PublishButton = styled(Button)`
  font-size: 20px;
  margin-left: 10px;
`;

export const CreateDraftButton = styled(Button)`
  font-size: 20px;
  margin-right: 10px;
`;

export const InfoTextBox = styled("div")`
  display: flex;
  background-color: ${COLOURS.lightGrey};
  padding: 3%;
  flex-direction: column;
`;

export const InfoText = styled("div")`
  text-align: center;
  padding: 5px;
`;

export const CampaignCardGrid = styled(Grid)`
  padding-top: 30px;
  margin-bottom: 50px;
  margin-top: 0px;
`;
