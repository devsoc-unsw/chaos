import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Container } from "@mui/material";
import ApplicationForm from "../../components/ApplicationForm";
import { bytesToImage } from "../../utils";
import {
  SubmitButton,
  ArrowIcon,
  SubmitWrapper,
} from "./applicationPage.styled";
import { getSelfInfo } from "../../api";

const Application = () => {
  const campaign = useLocation().state;

  const [selfInfo, setSelfInfo] = useState({});
  useEffect(() => {
    const getUserInfo = async () => {
      const res = await getSelfInfo();
      const data = await res.json();
      setSelfInfo(data);
    };
    getUserInfo();
  }, []);

  const { campaignName, headerImage, description, roles, questions, userInfo } =
    {
      campaignName: campaign.campaign.name,
      headerImage: bytesToImage(campaign.campaign.cover_image),
      description: campaign.campaign.description,
      roles: campaign.roles.map((r) => ({
        id: r.id,
        title: r.name,
        quantity: r.max_available,
      })),
      questions: campaign.questions.map((q) => ({
        id: q.id,
        text: q.title,
        roles: new Set([q.role_id]),
      })),
      userInfo: {
        name: selfInfo.display_name,
        zid: selfInfo.zid,
        email: selfInfo.email,
        degree: selfInfo.degree_name,
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
    //        CHAOS-53, useNavigate() link to post submission page once it is created :)
    if (rolesSelected.length) {
      rolesSelected.forEach((role) => {
        console.log(role);
      });
      console.log(`Answers: ${JSON.stringify(answers)}`);
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
