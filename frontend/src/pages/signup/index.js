import React from "react";
import { FormControl, InputLabel, Input, FormHelperText } from "@mui/material";
import { BackgroundWrapper } from "../../components";

const Signup = () => {
  console.log("inside signup");
  return (
    <BackgroundWrapper>
      <div>
        <h1>Signup</h1>
      </div>
      <FormControl>
        <InputLabel htmlFor="my-input">Email address</InputLabel>
        <Input id="my-input" aria-describedby="my-helper-text" />
        <FormHelperText id="my-helper-text">
          we wont giv eur email away uwu
        </FormHelperText>
      </FormControl>
    </BackgroundWrapper>
  );
};

export default Signup;
