import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Container } from "@mui/material";
import { CampaignWithRoles, UserResponse } from "types/api";
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
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignWithRoles>({
    campaign: {
      id: -1,
      organisation_id: -1,
      name: "",
      cover_image: [],
      description: "",
      starts_at: "",
      ends_at: "",
      published: false,
      created_at: "",
      updated_at: "",
    },
    roles: [],
    questions: [],
    applied_for: [],
  });

  const campaignId = Number(useParams().campaignId);
  const { state } = useLocation();

  const [loading, setLoading] = useState(true);

  const [selfInfo, setSelfInfo] = useState<UserResponse>({
    email: "",
    zid: "",
    display_name: "",
    degree_name: "",
    degree_starting_year: -1,
  });
  useEffect(() => {
    const getData = async () => {
      setSelfInfo(await getSelfInfo());

      if (state) {
        setCampaign(state);
      } else {
        const { current_campaigns } = await getAllCampaigns();
        const campaign = current_campaigns.find(
          (x) => x.campaign.id === campaignId
        );
        setCampaign(campaign!);
      }

      setLoading(false);
    };

    getData();
  }, [campaign]);

  const [rolesSelected, setRolesSelected] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ [question: string]: string }>({});

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
          roles: new Set(q.role_ids),
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
    if (!rolesSelected.length) {
      alert(
        "Submission failed, you must select at least one role to apply for!"
      );
    } else {
      rolesSelected.forEach((role) => {
        newApplication(role)
          .then((data) =>
            Promise.all(
              Object.keys(answers)
                .filter((qId) => {
                  const question = questions.find(
                    (q) => Number(q.id) === Number(qId)
                  )!;
                  const [rId] = question.roles;
                  return rId === data.role_id;
                })
                .map((qId) =>
                  submitAnswer(data.id, Number(qId), answers[qId]).then(
                    (res) => {
                      if (!res.ok) {
                        throw new Error("Error during submission");
                      }
                    }
                  )
                )
            )
          )
          .catch(() => alert("Error during submission"));
      });
      navigate("/dashboard");
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
