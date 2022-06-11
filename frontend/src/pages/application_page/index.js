import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Container } from "@mui/material";
import ApplicationForm from "../../components/ApplicationForm";
import { bytesToImage } from "../../utils";
import {
  SubmitButton,
  ArrowIcon,
  SubmitWrapper,
} from "./applicationPage.styled";
import {
  getSelfInfo,
  newApplication,
  submitAnswer,
  getAllCampaigns,
} from "../../api";

const Application = () => {
  const [campaign, setCampaign] = useState([]);

  const campaignId = parseInt(useParams().campaignId, 10);
  const { state } = useLocation();

  const [loading, setLoading] = useState(true);

  const [selfInfo, setSelfInfo] = useState({});
  useEffect(() => {
    const getData = async () => {
      const getUserInfo = async () => {
        const res = await getSelfInfo();
        const data = await res.json();
        setSelfInfo(data);
      };
      await getUserInfo();

      const getCampaign = async () => {
        const newCampaign =
          state ||
          (await (async () => {
            const res = await getAllCampaigns();
            const data = await res.json();
            const current = data.current_campaigns;
            return current.find((x) => x.campaign.id === campaignId);
          })());
        setCampaign(newCampaign);
      };
      await getCampaign();

      setLoading(false);
    };

    getData();
  }, []);

  const [rolesSelected, setRolesSelected] = useState([]);
  const [answers, setAnswers] = useState({});

  if (loading) return <div />;

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
      questions: campaign.questions.map((q) => {
        if (!(q.id in answers)) {
          answers[q.id] = "";
        }
        return {
          id: q.id,
          text: q.title,
          roles: new Set([q.role_id]),
        };
      }),
      userInfo: {
        name: selfInfo.display_name,
        zid: selfInfo.zid,
        email: selfInfo.email,
        degree: selfInfo.degree_name,
      },
    };

  const onSubmit = () => {
    //        CHAOS-53, useNavigate() link to post submission page once it is created :)
    if (rolesSelected.length) {
      rolesSelected.forEach((role) => {
        newApplication(role)
          .then((res) => res.json())
          .then((data) => {
            Object.keys(answers)
              .filter((qId) => {
                const question = questions.find(
                  (q) => Number(q.id) === Number(qId)
                );
                const [rId] = question.roles;
                return rId === data.role_id;
              })
              .forEach((qId) =>
                submitAnswer(data.id, Number(qId), answers[qId])
              );
          });
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
