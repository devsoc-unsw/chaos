import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useQuery } from "react-query";

const ApplicationPage = () => {
  const navigate = useNavigate();
  const campaignId = Number(useParams().campaignId);

  const { data: selfInfo } = useQuery("selfInfo", getSelfInfo);
  const { data: campaigns } = useQuery("allCampaigns", getAllCampaigns);

  const campaign = useMemo(
    () =>
      [
        ...(campaigns?.current_campaigns ?? []),
        ...(campaigns?.past_campaigns ?? []),
      ].find((x) => x.campaign.id === campaignId),
    [campaigns]
  );

  const organisationId = campaign?.campaign.organisation_id;
  const { data: organisation } = useQuery(
    ["organisation", organisationId],
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we ensure that it's not undefined below
    () => getOrganisation(organisationId!),
    { enabled: organisationId !== undefined }
  );

  // using an array with .includes doesn't hint typescript to the variables being not undefined :(
  const loading =
    selfInfo === undefined ||
    campaign === undefined ||
    organisation === undefined;

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
