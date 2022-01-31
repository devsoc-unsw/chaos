import React, { useState, useEffect } from "react";
import { Container } from "@mui/material";
import ApplicationForm from "../../components/ApplicationForm";
import {
  SubmitButton,
  ArrowIcon,
  SubmitWrapper,
} from "./applicationPage.styled";
import DummyCampaignHeader from "./director.jpg";

const Application = () => {
  // FIXME: CHAOS-51, request the following object from backedn
  const { campaignName, headerImage, description, roles, questions, userInfo } =
    {
      campaignName: "Director recruitment",
      headerImage: DummyCampaignHeader,
      description: `
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
        minim veniam, quis nostrud exercitation ullamco laboris nisi ut
        aliquip ex ea commodo consequat. Duis aute irure dolor in
        reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
        culpa qui officia deserunt mollit anim id est laborum.
      `,
      roles: [
        {
          id: 0,
          title: "Projects",
          quantity: 3,
        },
        {
          id: 1,
          title: "Socials",
          quantity: 2,
        },
        {
          id: 2,
          title: "Marketing",
          quantity: 4,
        },
      ],
      questions: [
        {
          id: 0,
          text: "Very important question?",
          roles: new Set([0, 2]),
        },
        {
          id: 1,
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit?",
          roles: new Set([0, 1]),
        },
        {
          id: 2,
          text: "Another extremely important question?",
          roles: new Set([0]),
        },
        {
          id: 3,
          text: "What do you think about this question and its importance?",
          roles: new Set([2]),
        },
      ],
      userInfo: {
        name: "John Smith",
        zid: "z1234567",
        email: "jsmith@gmail.com",
        degree: "Bachelor of Science (Computer Science)",
      },
    };
  const [rolesSelected, setRolesSelected] = useState([]);
  const [answers, setAnswers] = useState({});
  useEffect(() => {
    questions.forEach((q) => {
      if (!(q.id in answers)) {
        answers[q.id] = "";
      }
    });
    setAnswers(answers);
  }, [questions]);

  const onSubmit = () => {
    // FIXME: CHAOS-51, integrate with backend
    //        CHAOS-53, useNavigate() link to post submission page once it is created :)
    if (rolesSelected.length) {
      rolesSelected.forEach((role) => {
        console.log(role);
      });
    } else {
      alert(
        "Submission failed, you must select at least one role to apply for!"
      );
    }
  };

  return (
    <Container>
      <ApplicationForm
        questions={questions}
        roles={roles}
        rolesSelected={rolesSelected}
        setRolesSelected={setRolesSelected}
        answers={answers}
        setAnswers={setAnswers}
        campaignName={campaignName}
        headerImage={headerImage}
        description={description}
        userInfo={userInfo}
      />
      <SubmitWrapper>
        <SubmitButton variant="contained" onClick={onSubmit}>
          Submit
          <ArrowIcon />
        </SubmitButton>
      </SubmitWrapper>
    </Container>
  );
};

export default Application;
