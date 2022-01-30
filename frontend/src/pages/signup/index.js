import React, { useState } from "react";
import { InputLabel, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { BackgroundWrapper } from "../../components";
import { getStore, setStore } from "../../utils";
import { doSignup } from "../../api";
import { HTTP_STATUS_OKAY } from "../../utils/constants";
import { StyledForm } from "./signup.styled";

const Signup = () => {
  const [formData, setFormData] = useState({
    zid: "",
    name: getStore("name") || "",
    degree_name: "",
    starting_year: new Date().getFullYear(),
  });

  const navigate = useNavigate();
  console.log("inside signup");
  return (
    <BackgroundWrapper>
      <StyledForm
        onSubmit={async (e) => {
          e.preventDefault();
          console.log("formData", formData);
          console.log(doSignup);
          const result = await doSignup(formData);
          if (result.status === HTTP_STATUS_OKAY) {
            const data = await result.json();
            setStore("AUTH_TOKEN", data.token);
            navigate("/dashboard");
          }
        }}
      >
        <div>
          <h1>Signup</h1>
        </div>
        <InputLabel htmlFor="display_name">Full Name</InputLabel>
        <TextField
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          id="display_name"
          aria-describedby="Display Name"
        />

        <InputLabel htmlFor="zid">zID</InputLabel>
        <TextField
          required
          id="zid"
          aria-describedby="zid"
          inputProps={{ pattern: "^z\\d{7}$" }}
          value={formData.zid}
          onChange={(e) =>
            setFormData({ ...formData, zid: e.target.value.toLowerCase() })
          }
        />

        <InputLabel htmlFor="degree_name">Degree Name</InputLabel>
        <TextField
          required
          id="degree_name"
          aria-describedby="Degree Name"
          value={formData.degree_name}
          onChange={(e) =>
            setFormData({ ...formData, degree_name: e.target.value })
          }
        />

        <InputLabel htmlFor="starting_year">Starting Year</InputLabel>
        <TextField
          required
          type="number"
          inputProps={{ pattern: "^\\d{4}$" }}
          id="starting_year"
          aria-describedby="Starting Year"
          value={formData.starting_year}
          onChange={(e) =>
            setFormData({
              ...formData,
              starting_year: parseInt(e.target.value, 10),
            })
          }
        />

        <Button type="submit" htmlFor="submit">
          Submit
        </Button>
      </StyledForm>
    </BackgroundWrapper>
  );
};

export default Signup;
