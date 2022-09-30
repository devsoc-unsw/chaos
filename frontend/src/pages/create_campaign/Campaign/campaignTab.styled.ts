import { styled as muiStyled } from "@mui/material/styles";
import { Container, TextField } from "@mui/material";
import styled from "@emotion/styled";

export const CampaignContainer = muiStyled(Container)(() => ({
  display: "flex",
  flexDirection: "column",
  width: "800px",
  minHeight: "600px",
}));

export const CampaignTextField = muiStyled(TextField)(() => ({
  margin: "1% 0",
}));

export const CoverImage = styled.img`
  max-width: 100%;
`;

export const CampaignRowDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin: 1% 0;
  width: 100%;
  padding-left: 16.5%;
  padding-right: 16.5%;
`;

export const SwitchRowDiv = muiStyled(CampaignRowDiv)`
  justify-content: center;
  padding-bottom: 10px;
`;

export const CampaignDropzone = styled.div`
  text-align: center;
  padding: 20px;
  border: 3px dashed #eeeeee;
  background-color: #fafafa;
  color: #bdbdbd;
`;
