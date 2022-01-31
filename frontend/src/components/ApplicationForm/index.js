import React from "react";
import PropTypes from "prop-types";
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
  CampaignDescription,
  FormContainer,
  AuthLink,
  UserInfoCell,
  SpaceRight,
} from "./applicationForm.styled";

const ApplicationForm = (props) => {
  const {
    questions,
    roles,
    rolesSelected,
    setRolesSelected,
    answers,
    setAnswers,
    campaignName,
    headerImage,
    description,
    userInfo,
  } = props;

  const loggedIn = isLoggedIn();

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
  return (
    <Container>
      <CampaignImageCard sx={{ boxShadow: 15 }}>
        <CardMedia
          component="img"
          height="100%"
          image={headerImage}
          alt={`campaign cover for ${campaignName}`}
        />
      </CampaignImageCard>
      <CampaignDescription>
        <Typography>{description}</Typography>
      </CampaignDescription>
      <FormContainer style={{ paddingLeft: "200px", paddingRight: "200px" }}>
        <Section>
          <SectionHeader>Applicant Details</SectionHeader>
          {loggedIn ? (
            <TableContainer>
              <Table>
                <tbody>
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
                </tbody>
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
              key={role.id}
              value={role.id}
              selected={rolesSelected.includes(role.id)}
              onClick={() => toggleRole(role.id)}
            >
              {role.title}
            </RoleButton>
          ))}
        </Section>
        {roles.map(({ id, title }) => (
          <Section isHidden={!rolesSelected.includes(id)}>
            <SectionHeader>{title}</SectionHeader>
            {questions.map(
              (q) =>
                q.roles.has(id) && (
                  <>
                    <Question>{q.text}</Question>
                    <Answer
                      multiline
                      value={answers[q.id]}
                      onChange={(e) => handleAnswerInput(e, q.id)}
                    />
                  </>
                )
            )}
          </Section>
        ))}
      </FormContainer>
    </Container>
  );
};

ApplicationForm.propTypes = {
  questions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      roles: PropTypes.objectOf(PropTypes.string).isRequired,
    })
  ).isRequired,
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
  rolesSelected: PropTypes.arrayOf(PropTypes.string).isRequired,
  setRolesSelected: PropTypes.func.isRequired,
  answers: PropTypes.objectOf(PropTypes.string).isRequired,
  setAnswers: PropTypes.func.isRequired,
  campaignName: PropTypes.string.isRequired,
  headerImage: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  userInfo: PropTypes.shape({
    name: PropTypes.string.isRequired,
    zid: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    degree: PropTypes.string.isRequired,
  }).isRequired,
};

export default ApplicationForm;
