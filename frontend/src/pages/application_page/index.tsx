import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "twin.macro";

import Container from "components/Container";

import {
  getAllCampaigns,
  getCommonQuestions,
  getRoleQuestions,
  getOrganisation,
  getSelfInfo,
  newApplication,
  submitAnswer,
  getCampaignRoles,
  getOrganisationBySlug,
  getCampaignBySlugs,
} from "../../api";

import ApplicationForm from "./ApplicationForm";
import ApplicationPageLoading from "./ApplicationPageLoading";
import CampaignDetails from "./CampaignDetails";
import RolesSidebar from "./RolesSidebar";

import type { RoleQuestion, RoleQuestions } from "./types";
import { Role, type Campaign, type Organisation, type UserResponse } from "types/api";

const ApplicationPage = () => {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign>({
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
      slug: ""
  });
  const [organisation, setOrganisation] = useState<Organisation>({
    id: -1,
    name: "",
    logo: "",
    created_at: "",
    updated_at: "",
  });

  const { organisationSlug, campaignSlug } = useParams();
  //const { state } = useLocation() as { state: CampaignWithRoles };

  const [loading, setLoading] = useState(true);

  const [selfInfo, setSelfInfo] = useState<UserResponse>({
    email: "",
    zid: "",
    display_name: "",
    degree_name: "",
    degree_starting_year: -1,
  });

  const [roleQuestions, setRoleQuestions] = useState<RoleQuestions>({0: []});
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const getData = async () => {
      setSelfInfo(await getSelfInfo());

      //if (state) {
      //  setCampaign(state);
      //} else {

      if(organisationSlug && campaignSlug) {
        const cmpn = await getCampaignBySlugs(organisationSlug, campaignSlug);
        setCampaign(cmpn);

        const org = await getOrganisationBySlug(organisationSlug);
        setOrganisation(org);

        const campaignId = cmpn.id;
        const commonQuestions = await getCommonQuestions(campaignId);
        const commonQuestionsSimple: RoleQuestion[] = commonQuestions.questions.map((question) => {
          return {
            id: question.id,
            text: question.title,
          }
        });

        const { roles: campaignRoles } = await getCampaignRoles(campaignId);
        setRoles(campaignRoles);
        // initialise roleQuestions to include common questions
        const roleQuestions: RoleQuestions = Object.fromEntries(
          campaignRoles.map((role) => 
            [role.id, commonQuestionsSimple]
        ));
        
        await Promise.all(campaignRoles.map( async ({id: roleId}) => {
          // for each roleId, pushes every question to the rolearray
          const questionsByRole = await getRoleQuestions(campaignId, roleId);
          const questions = questionsByRole.questions.map((questions) => {
            return {
              id: questions.id,
              text: questions.title,
            }
          });
          roleQuestions[roleId].push(...questions);
        }));
        setRoleQuestions(roleQuestions);


      } else {
        return false;
      }      

      setLoading(false);
    };

    const res = getData();
    if(!res) {
      // page not found
    }
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

  // const questions = campaign.questions.map((q) => {
  //   if (!(q.id in answers)) {
  //     answers[q.id] = "";
  //   }
  //   return {
  //     id: q.id,
  //     text: q.title,
  //     roles: new Set(q.role_ids),
  //   };
  // });

  // // gets role questions from roles
  // const roleQuestions: RoleQuestions = Object.fromEntries(
  //   // creates object of roleSlugs which map to an empty array
  //   campaign.roles.map((role) => [role.id, []])
  // );
  // questions.forEach(({ roles, ...question }) =>
  //   // for each roleSlug, pushes every question to the rolearray
  //   roles.forEach((role) => roleQuestions[role].push(question))
  // );

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
              roleQuestions[application.role_id]
                .find((q) => q.id === qId)
            )
            .map((qId) => submitAnswer(application.id, qId, answers[qId]))
        );
      })
    )
      .then(() => navigate("/dashboard"))
      .catch(() => alert("Error during submission"));
  };

  return (
    <Container tw="gap-4">
      <CampaignDetails
        campaignName={campaign.name}
        headerImage={campaign.cover_image}
        organisation={organisation}
        campaign={campaign}
        description={campaign.description}
        userInfo={selfInfo}
      />

      <div tw="flex flex-1 gap-4">
        <RolesSidebar
          roles={roles}
          rolesSelected={rolesSelected}
          toggleRole={toggleRole}
        />
        <ApplicationForm
          roles={roles}
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
