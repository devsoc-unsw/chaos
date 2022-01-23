import React, { useState } from "react";
import { isLoggedIn } from "../../utils";
import { Container, CardMedia, Typography } from "@mui/material";
import { 
  UserInfo,
  UserInfoFields,
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
  Link
} from "./applicationPage.styled"
import DummyCampaignHeader from "./director.jpg";

const Application = () => {
  const [rolesSelected, setRolesSelected] = useState([]);
  // FIXME: set answers with useEffect on page load, get from backend
  const [answers, setAnswers] = useState({0: "", 1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: "", 10: "", 11: ""});
  const loggedIn = isLoggedIn();

  // FIXME: get userinfo from backend
  const userInfo = {
    name: "John Smith",
    zid: "z1234567",
    email: "jsmith@gmail.com",
    degree: "Bachelor of Science (Computer Science)"
  };

  // FIXME: get from backend
  const roles = [
    { id: 0, name: "Socials" },
    { id: 1, name: "Student Experience" },
    { id: 2, name: "Creative" },
    { id: 3, name: "Marketing" },
    { id: 4, name: "Media" },
    { id: 5, name: "Education" },
    { id: 6, name: "Competitions" }
  ]

  // FIXME: get from backend
  const roleQuestions = {
    0: [0,1,2],
    1: [3,4,5],
    2: [6,7,8],
    3: [9,10,11],
    4: [0,1,2],
    5: [3,4,5],
    6: [6,7,8]
  }

  // FIXME: get from backend
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
    11: "What is the most important lesson life has taught you?"
  };

  // FIXME: handle single question related to many roles (currently gets
  //        printed under each rolename and all are overwritten)
  const handleAnswerInput = (e, qID) => {
    setAnswers({...answers, ...{[qID]: e.target.value}});
  };

  const toggleRole = (id) => {
    if (rolesSelected.includes(id)) {
      setRolesSelected(rolesSelected.filter((role) => role !== id));
    } else {
      setRolesSelected((existing) => [...existing, id]);
    }
  };

  const onSubmit = () => {
    // FIXME: make work with backend
    //        ALSO need to create post submission page and then useNavigate() to it
    if (rolesSelected.length) {
      rolesSelected.forEach(role => {
        const questionsIDs = roleQuestions[role];
        const responses = questionsIDs.map(id => answers[id]);
      })
    } else {
      alert("Submission failed, you must select at least one role to apply for!");
    }
  };

  return (
    <Container>
      <CampaignImageCard sx={{boxShadow: 15}}>
        <CardMedia
          component="img"
          height="100%"
          image={DummyCampaignHeader}
          alt={`campaign cover for ${1/*FIXME: this*/}`}
        />
      </CampaignImageCard>
      <CampaignDescription>
        <Typography>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        </Typography>
      </CampaignDescription>
      <FormContainer style={{paddingLeft: "200px", paddingRight: "200px"}}>
        <Section>
          <SectionHeader>Applicant Details</SectionHeader>
          {
            loggedIn ?
            <UserInfo>
              <UserInfoFields>
                <UserInfoTypography>Name:</UserInfoTypography>
                <UserInfoTypography>zID:</UserInfoTypography>
                <UserInfoTypography>Email:</UserInfoTypography>
                <UserInfoTypography>Degree:</UserInfoTypography>
              </UserInfoFields>
              <div>
                <UserInfoTypography><strong>{userInfo.name}</strong></UserInfoTypography>
                <UserInfoTypography><strong>{userInfo.zid}</strong></UserInfoTypography>
                <UserInfoTypography><strong>{userInfo.email}</strong></UserInfoTypography>
                <UserInfoTypography><strong>{userInfo.degree}</strong></UserInfoTypography>
              </div>
            </UserInfo>
            : <UserInfoTypography>
              Please &nbsp;
              <Link to="/" style={{textDecoration:"none"}}>login</Link>
              &nbsp; or &nbsp;
              <Link to="/" style={{textDecoration:"none"}}>create an account</Link> 
              &nbsp; to apply{''/*FIXME: link to correct places! */}
              </UserInfoTypography>
          }
        </Section>
        <Section>
          <SectionHeader>Which roles are you applying for?</SectionHeader>
          {
            roles.map((role) => (
              <RoleButton
                value={role.id}
                selected={rolesSelected.includes(role.id)}
                onClick={() => toggleRole(role.id)}
              >
                {role.name}
              </RoleButton>
            ))
          }
        </Section>
        {
          roles.map(({ id, name }) => (
            <Section isHidden={!rolesSelected.includes(id)}>
              <SectionHeader>{name}</SectionHeader>
              {
                roleQuestions[id].map((qID) => {
                  return (
                    <>
                      <Question>
                        {questions[qID]}
                      </Question>
                      <Answer
                        multiline
                        value={answers[qID]}
                        onChange={(e) => handleAnswerInput(e, qID)}
                      >
                        placeholder
                      </Answer>
                    </>
                  )
                })
              }
            </Section>
          ))
        }
        <SubmitWrapper>
          <SubmitButton
            variant="contained"
            onClick={onSubmit}
          >
            Submit &nbsp;
            <ArrowIcon />
          </SubmitButton>
        </SubmitWrapper>
      </FormContainer>
    </Container>
  )
}

export default Application
