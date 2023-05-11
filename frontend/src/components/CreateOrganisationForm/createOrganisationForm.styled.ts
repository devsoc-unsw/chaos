import { styled } from "@mui/material/styles";

export const FormContainer = styled("div")(() => ({
  display: "flex",
  padding: "16px 9px",
}));

export const ImageUploadWrapper = styled("label")(() => ({
  display: "block",
  minWidth: "60px",
  height: "60px",
  lineHeight: "60px",
  margin: "0px",
}));

export const TextInput = styled("input")(() => ({
  height: "30px",
  width: "133px",
  margin: "15px",
  borderRadius: "12px",
  borderColor: "black",
  borderWidth: "1px",
  padding: "10px",
}));

export const UploadButton = styled("button")(() => ({
  height: "30px",
  width: "30px",
  marginTop: "15px",
  borderRadius: "12px",
  borderColor: "black",
  borderWidth: "1px",
}));
