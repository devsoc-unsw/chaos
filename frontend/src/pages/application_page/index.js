import React, { useState } from "react";
import { Container, CardMedia, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import { isLoggedIn } from "../../utils";
import {
  UserInfoTypography,
  Section,
  SectionHeader,
  CampaignImageCard,
  RoleButton,
  Question,
  Answer,
  SubmitButton,
  ArrowIcon,
  CampaignDescription,
  FormContainer,
  SubmitWrapper,
  AuthLink,
  UserInfoCell,
  SpaceRight,
} from "./applicationPage.styled";
import DummyCampaignHeader from "./director.jpg";

const Application = () => {
  const [rolesSelected, setRolesSelected] = useState([]);
  // FIXME: CHAOS-51, set answers with useEffect on page load, get from backend
  const [answers, setAnswers] = useState({
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
    6: "",
    7: "",
    8: "",
    9: "",
    10: "",
    11: "",
  });
  const loggedIn = isLoggedIn();

  // FIXME: CHAOS-51, get userinfo from backend
  const userInfo = {
    name: "John Smith",
    zid: "z1234567",
    email: "jsmith@gmail.com",
    degree: "Bachelor of Science (Computer Science)",
  };

  // FIXME: CHAOS-51, get from backend
  const roles = [
    { id: 0, name: "Socials" },
    { id: 1, name: "Student Experience" },
    { id: 2, name: "Creative" },
    { id: 3, name: "Marketing" },
    { id: 4, name: "Media" },
    { id: 5, name: "Education" },
    { id: 6, name: "Competitions" },
  ];

  // FIXME: CHAOS-51, get from backend
  const roleQuestions = {
    0: [0, 1, 2],
    1: [3, 4, 5],
    2: [6, 7, 8],
    3: [9, 10, 11],
    4: [0, 1, 2],
    5: [3, 4, 5],
    6: [6, 7, 8],
  };

  // FIXME: CHAOS-51, get from backend
  const questions = {
    0: "What scares you about getting older?",
    1: "Which book are you ashamed not to have read?",
    2: "What is the worst thing anyone’s said to you?",
    3: "What did you want to be when you were growing up?",
    4: "What is your most treasured possession?",
    5: "What or who is the greatest love of your life?",
    6: "What does love feel like?",
    7: "When did you last cry, and why?",
    8: "What do you consider your greatest achievement?",
    9: "Would you rather have more sex, money or fame?",
    10: "How would you like to be remembered?",
    11: "What is the most important lesson life has taught you?",
  };

  // FIXME: part of CHAOS-51, handle single question related to many roles
  //        (currently gets printed under each rolename and all are overwritten)
  const handleAnswerInput = (e, qID) => {
    setAnswers({ ...answers, ...{ [qID]: e.target.value } });
  };

  const toggleRole = (id) => {
    if (rolesSelected.includes(id)) {
      setRolesSelected(rolesSelected.filter((role) => role !== id));
    } else {
      setRolesSelected((existing) => [...existing, id]);
    }
  };

  const onSubmit = () => {
    // FIXME: CHAOS-51, integrate with backend
    //        CHAOS-53, useNavigate() link to post submission page once it is created :)
    if (rolesSelected.length) {
      rolesSelected.forEach((role) => {
        const questionsIDs = roleQuestions[role];
        const responses = questionsIDs.map((id) => answers[id]);
        console.log(responses);
      });
    } else {
      alert(
        "Submission failed, you must select at least one role to apply for!"
      );
    }
  };

  return (
    <Container>
      <CampaignImageCard sx={{ boxShadow: 15 }}>
        <CardMedia
          component="img"
          height="100%"
          image={DummyCampaignHeader}
          alt={`campaign cover for ${
            1 /* CHAOS-51, use campaign name once integrated with backend */
          }`}
        />
      </CampaignImageCard>
      <CampaignDescription>
        <Typography>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Typography>
      </CampaignDescription>
      <FormContainer style={{ paddingLeft: "200px", paddingRight: "200px" }}>
        <Section>
          <SectionHeader>Applicant Details</SectionHeader>
          {loggedIn ? (
            <TableContainer>
              <Table>
                <TableRow>
                  <UserInfoCell>Name:</UserInfoCell>
                  <UserInfoCell>
                    <strong>{userInfo.name}</strong>
                  </UserInfoCell>
                </TableRow>
                <TableRow>
                  <UserInfoCell>zID:</UserInfoCell>
                  <UserInfoCell>
                    <strong>{userInfo.zid}</strong>
                  </UserInfoCell>
                </TableRow>
                <TableRow>
                  <UserInfoCell>Email:</UserInfoCell>
                  <UserInfoCell>
                    <strong>{userInfo.email}</strong>
                  </UserInfoCell>
                </TableRow>
                <TableRow>
                  <UserInfoCell>Degree:</UserInfoCell>
                  <UserInfoCell>
                    <strong>{userInfo.degree}</strong>
                  </UserInfoCell>
                </TableRow>
              </Table>
            </TableContainer>
          ) : (
            <UserInfoTypography>
              <SpaceRight>Please</SpaceRight>
              <SpaceRight>
                <AuthLink to="/">login</AuthLink>
              </SpaceRight>
              <SpaceRight>or</SpaceRight>
              <SpaceRight>
                <AuthLink to="/">create an account</AuthLink>
              </SpaceRight>
              to apply{"" /* CHAOS-54: link to correct places! */}
            </UserInfoTypography>
          )}
        </Section>
        <Section>
          <SectionHeader>Which roles are you applying for?</SectionHeader>
          {roles.map((role) => (
            <RoleButton
              value={role.id}
              selected={rolesSelected.includes(role.id)}
              onClick={() => toggleRole(role.id)}
            >
              {role.name}
            </RoleButton>
          ))}
        </Section>
        {roles.map(({ id, name }) => (
          <Section isHidden={!rolesSelected.includes(id)}>
            <SectionHeader>{name}</SectionHeader>
            {roleQuestions[id].map((qID) => (
              <>
                <Question>{questions[qID]}</Question>
                <Answer
                  multiline
                  value={answers[qID]}
                  onChange={(e) => handleAnswerInput(e, qID)}
                />
              </>
            ))}
          </Section>
        ))}
        <SubmitWrapper>
          <SubmitButton variant="contained" onClick={onSubmit}>
            Submit
            <ArrowIcon />
          </SubmitButton>
        </SubmitWrapper>
      </FormContainer>
    </Container>
  );
};

export default Application;
