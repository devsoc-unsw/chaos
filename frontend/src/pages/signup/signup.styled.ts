import { styled } from "@mui/system";

export const StyledForm = styled("form")((props) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  margin: "0 auto",
  padding: "0 20px",
  boxSizing: "border-box",
  borderRadius: "5px",
  backgroundColor: "#fff",
  boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
  "& > *": {
    margin: "10px 0",
  },
  "& > button": {
    marginTop: "20px",
  },
  maxWidth: "300px",
  [props.theme.breakpoints.up("sm")]: {
    maxWidth: "350px",
  },
  [props.theme.breakpoints.up("md")]: {
    maxWidth: "400px",
  },
  [props.theme.breakpoints.up("lg")]: {
    maxWidth: "600px",
  },
}));
