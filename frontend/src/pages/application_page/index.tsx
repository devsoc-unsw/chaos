import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "twin.macro";

import Container from "components/Container";

import {
  getAllCampaigns,
  getOrganisation,
  getSelfInfo,
  newApplication,
  submitAnswer,
} from "../../api";

import ApplicationForm from "./ApplicationForm";
import ApplicationPageLoading from "./ApplicationPageLoading";
import CampaignDetails from "./CampaignDetails";
import RolesSidebar from "./RolesSidebar";

import type { RoleQuestions } from "./types";
import type { CampaignWithRoles, Organisation, UserResponse } from "types/api";

const ApplicationPage = () => {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<CampaignWithRoles>({
    campaign: {
      id: -1,
      organisation_id: -1,
      name: "",
      cover_image: "",
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
  const [organisation, setOrganisation] = useState<Organisation>({
    id: -1,
    name: "",
    logo: "",
    created_at: "",
    updated_at: "",
  });

  const campaignId = Number(useParams().campaignId);
  const { state } = useLocation() as { state: CampaignWithRoles };

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
        const {
          past_campaigns: pastCampaigns,
          current_campaigns: currentCampaigns,
        } = await getAllCampaigns();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const campaign = [...pastCampaigns, ...currentCampaigns].find(
          (x) => x.campaign.id === campaignId
        )!;
        setCampaign(campaign);

        const organisationId = campaign.campaign.organisation_id;
        const organisation = await getOrganisation(organisationId);
        setOrganisation(organisation);
      }

      setLoading(false);
    };

    void getData();
  }, []);

  const [rolesSelected, setRolesSelected] = useState<number[]>([]);
  const [answers, setAnswers] = useState<{ [question: number]: string }>({});

  const toggleRole = useCallback(
    (roleId: number) => {
      if (rolesSelected.includes(roleId)) {
        setRolesSelected(rolesSelected.filter((r) => r !== roleId));
      } else {
        setRolesSelected([...rolesSelected, roleId]);
      }
    },
    [rolesSelected]
  );

  const setAnswer = useCallback(
    (question: number, answer: string) => {
      setAnswers({ ...answers, [question]: answer });
    },
    [answers]
  );

  if (loading) return <ApplicationPageLoading />;

  const questions = campaign.questions.map((q) => {
    if (!(q.id in answers)) {
      answers[q.id] = "";
    }
    return {
      id: q.id,
      text: q.title,
      roles: new Set(q.role_ids),
    };
  });

  const roleQuestions: RoleQuestions = Object.fromEntries(
    campaign.roles.map((role) => [role.id, []])
  );
  questions.forEach(({ roles, ...question }) =>
    roles.forEach((role) => roleQuestions[role].push(question))
  );

  const onSubmit = () => {
    //        CHAOS-53, useNavigate() link to post submission page once it is created :)
    if (!rolesSelected.length) {
      // eslint-disable-next-line no-alert
      alert(
        "Submission failed, you must select at least one role to apply for!"
      );
      return;
    }

    Promise.all(
      rolesSelected.map(async (role) => {
        const application = await newApplication(role);
        await Promise.all(
          Object.keys(answers)
            .map(Number)
            .filter((qId) =>
              questions
                .find((q) => q.id === qId)
                ?.roles.has(application.role_id)
            )
            .map((qId) => submitAnswer(application.id, qId, answers[qId]))
        );
      })
    )
      .then(() => navigate("/dashboard"))
      // eslint-disable-next-line no-alert
      .catch(() => alert("Error during submission"));
  };

  return (
    <Container tw="gap-4">
      <CampaignDetails
        campaignName={campaign.campaign.name}
        headerImage={campaign.campaign.cover_image}
        organisation={organisation}
        campaign={campaign}
        description={campaign.campaign.description}
        userInfo={selfInfo}
      />

      <div tw="flex flex-1 gap-4">
        <RolesSidebar
          roles={campaign.roles}
          rolesSelected={rolesSelected}
          toggleRole={toggleRole}
        />
        <ApplicationForm
          roles={campaign.roles}
          rolesSelected={rolesSelected}
          roleQuestions={roleQuestions}
          answers={answers}
          setAnswer={setAnswer}
          onSubmit={onSubmit}
        />
      </div>
    </Container>
  );
};

export default ApplicationPage;
