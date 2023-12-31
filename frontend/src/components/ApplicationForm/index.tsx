import { CardMedia, Container, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";

import { isLoggedIn } from "../../utils";

import {
  Answer,
  AuthLink,
  CampaignDescription,
  CampaignImageCard,
  FormContainer,
  FormContent,
  Question,
  RoleButton,
  Section,
  SectionHeader,
  SpaceRight,
  UserInfoCell,
  UserInfoTypography,
} from "./applicationForm.styled";

import type { ChangeEvent, Dispatch, SetStateAction } from "react";

type Props = {
  questions: { id: number; text: string; roles: Set<number> }[];
  roles: { id: number; title: string; quantity: number }[];
  rolesSelected: number[];
  setRolesSelected: Dispatch<SetStateAction<number[]>>;
  answers: { [k: string]: string };
  setAnswers: (answers: { [k: string]: string }) => void;
  campaignName: string;
  headerImage: string;
  description: string;
  userInfo: {
    name: string;
    zid: string;
    email: string;
    degree: string;
  };
};

const ApplicationForm = ({
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
}: Props) => {
  const loggedIn = isLoggedIn();

  // FIXME: part of CHAOS-51, handle single question related to many roles
  //        (currently gets printed under each rolename and all are overwritten)
  const handleAnswerInput = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    qID: number
  ) => {
    setAnswers({ ...answers, ...{ [qID]: e.target.value } });
  };

  const toggleRole = (id: number) => {
    if (rolesSelected.includes(id)) {
      setRolesSelected(rolesSelected.filter((role) => role !== id));
    } else {
      setRolesSelected((existing) => [...existing, id]);
    }
  };
  return (
    <Container>
      <CampaignImageCard>
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
      <FormContainer>
        <FormContent>
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
        </FormContent>
      </FormContainer>
    </Container>
  );
};

export default ApplicationForm;
