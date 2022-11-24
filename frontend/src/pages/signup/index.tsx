import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "twin.macro";

import chaosImg from "assets/chaos.png";
import Button from "components/Button";
import Card from "components/Card";
import Container from "components/Container";
import Input from "components/Input";

import { doSignup } from "../../api";
import { getStore, setStore } from "../../utils";

const Signup = () => {
  const [formData, setFormData] = useState({
    zid: "",
    name: getStore("name") || "",
    degree_name: "",
    starting_year: new Date().getFullYear(),
  });

  const navigate = useNavigate();
  console.log("inside signup");

  const signup = async () => {
    console.log("posting with:");
    console.log(formData);
    const { token } = await doSignup(formData);
    setStore("AUTH_TOKEN", token);
    navigate("/dashboard");
  };

  return (
    <Container tw="flex-none justify-center gap-2 text-black">
      <header tw="text-center">
        <img tw="h-12 mx-auto filter drop-shadow" src={chaosImg} alt="Chaos" />
        <div tw="my-4">
          <h1 tw="text-4xl">Create an account</h1>
          <p tw="text-gray-600 mb-2">To start using chaos</p>
        </div>
      </header>

      <Card
        as="form"
        tw="gap-2 px-8 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          void signup();
        }}
      >
        <div tw="flex flex-col gap-2 self-center">
          <Input.Label>
            <Input.LabelText required>Full Name</Input.LabelText>
            <Input
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </Input.Label>

          <Input.Label>
            <Input.LabelText required>zID (zXXXXXXX)</Input.LabelText>
            <Input
              required
              value={formData.zid}
              onChange={(e) =>
                setFormData({ ...formData, zid: e.target.value })
              }
              pattern="z\d{7}"
            />
          </Input.Label>

          <Input.Label>
            <Input.LabelText required>Degree Name</Input.LabelText>
            <Input
              required
              value={formData.degree_name}
              onChange={(e) =>
                setFormData({ ...formData, degree_name: e.target.value })
              }
            />
          </Input.Label>

          <Input.Label>
            <Input.LabelText required>Starting Year</Input.LabelText>
            <Input
              required
              type="number"
              value={formData.starting_year}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  starting_year: parseInt(e.target.value, 10),
                })
              }
              min={new Date().getFullYear() - 100}
              max={new Date().getFullYear() + 10}
            />
          </Input.Label>
        </div>

        <Button tw="mt-2 justify-center font-medium" type="submit">
          Sign Up
        </Button>
      </Card>
    </Container>
  );
};

export default Signup;
