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

import Select from "./SignupGenderSelection";

import type { UserGender } from "types/api";

// I had to do it
/* eslint-disable @typescript-eslint/naming-convention */
type TFormData = {
  zid: string;
  name: string;
  degree_name: string;
  starting_year: number;
  gender: UserGender;
  pronouns: string;
};
/* eslint-enable @typescript-eslint/naming-convention */

const Signup = () => {
  const [formData, setFormData] = useState<TFormData>({
    zid: "",
    name: getStore("name") || "",
    degree_name: "",
    starting_year: new Date().getFullYear(),
    gender: "Unspecified",
    pronouns: "",
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
        <img tw="mx-auto h-12 drop-shadow filter" src={chaosImg} alt="Chaos" />
        <div tw="my-4">
          <h1 tw="text-4xl">Create an account</h1>
          <p tw="text-gray-600">To start simplifying recruitment</p>
        </div>
      </header>

      <Card
        as="form"
        tw="gap-4 px-8 py-6"
        onSubmit={(e) => {
          e.preventDefault();
          void signup();
        }}
      >
        <div tw="flex flex-col gap-2">
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

          <Select.Label>
            <Select.LabelText>Gender</Select.LabelText>
            <Select
              defaultValue={formData.gender}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  gender: e.target.value as UserGender, // small hack
                });
              }}
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Unspecified">Other / Prefer not to say</option>
            </Select>
          </Select.Label>

          <Input.Label>
            <Input.LabelText>Pronouns</Input.LabelText>
            <Input
              value={formData.pronouns}
              onChange={(e) =>
                setFormData({ ...formData, pronouns: e.target.value })
              }
            />
          </Input.Label>
        </div>

        <Button tw="justify-center font-medium" type="submit">
          Sign Up
        </Button>
      </Card>
    </Container>
  );
};

export default Signup;
