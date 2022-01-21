import { styled as muiStyled } from "@mui/material/styles";
import { Container, TextField, Button, autocompleteClasses } from "@mui/material";
import styled from "@emotion/styled";

export const CampaignContainer = muiStyled(Container)(() => ({
  display: "flex",
  flexDirection: "column",
}));

export const CampaignTextField = muiStyled(TextField)(() => ({
  margin: "1% 0",
}));

export const CampaignSubmit = muiStyled(Button)(() => ({
  maxWidth: "200px",
  padding: "10px 20px",
  margin: "0 auto 5vh",
}));

export const CampaignRowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 1% 0;
  width: 100%;
`;

export const CampaignDropzone = styled.div`
  text-align: center;
  padding: 20px;
  border: 3px dashed #eeeeee;
  background-color: #fafafa;
  color: #bdbdbd;
`;
