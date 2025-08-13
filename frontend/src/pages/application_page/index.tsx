import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "twin.macro";

import Container from "components/Container";

import {
  getCommonQuestions,
  getRoleQuestions,
  getSelfInfo,
  newApplication,
  submitAnswer,
  getCampaignRoles,
  getCampaign,
  getOrganisation,
} from "../../api";

import ApplicationForm from "./ApplicationForm";
import ApplicationPageLoading from "./ApplicationPageLoading";
import CampaignDetails from "./CampaignDetails";
import RolesSidebar from "./RolesSidebar";

import type { RoleQuestion, RoleQuestions } from "./types";
import { NewApplication, Role, User, type Campaign, type Organisation } from "types/api";

const ApplicationPage = () => {
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);

  const { campaignId } = useParams();
  //const { state } = useLocation() as { state: CampaignWithRoles };

  const [loading, setLoading] = useState(true);

  const [selfInfo, setSelfInfo] = useState<User>({
    id: -1,
    email: "",
    zid: "",
    name: "",
    pronouns: "",
    gender: "",
    degree_name: "",
    degree_starting_year: -1,
  });

  const [roleQuestions, setRoleQuestions] = useState<RoleQuestions>({0: []});
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const getData = async () => {
      setSelfInfo(await getSelfInfo());

      if (campaignId) {
        const id = Number(campaignId);
        const cmpn = await getCampaign(id);
        setCampaign(cmpn);

        const org = await getOrganisation(cmpn.organisation_id);
        setOrganisation(org);

        const commonQuestions = await getCommonQuestions(id);
        const commonQuestionsSimple: RoleQuestion[] = commonQuestions.map((question) => {
          return {
            id: question.id,
            text: question.title,
          }
        });

        const campaignRoles = await getCampaignRoles(id);
        setRoles(campaignRoles);
        // initialise roleQuestions to include common questions
        const roleQuestions: RoleQuestions = Object.fromEntries(
          campaignRoles.map((role) => 
            [role.id, commonQuestionsSimple]
        ));
        
        await Promise.all(campaignRoles.map( async ({id: roleId}) => {
          // for each roleId, pushes every question to the rolearray
          const questionsByRole = await getRoleQuestions(id, roleId);
          const questions = questionsByRole.map((questions) => {
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

    const newApp: NewApplication = {
      applied_roles: rolesSelected.map(roleId => {
                    return {
                        campaign_role_id: roleId
                    }}),
    };

    if (!campaign) return;
    newApplication(campaign.id, newApp)
    .then(async (application) => {
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
    .then(() => navigate("/dashboard"))
      .catch(() => alert("Error during submission"));

    // Promise.all(
    //   rolesSelected.map(async (role) => {
    //     const application = await newApplication(role);
    //     await Promise.all(
    //       Object.keys(answers)
    //         .map(Number)
    //         .filter((qId) =>
    //           roleQuestions[application.role_id]
    //             .find((q) => q.id === qId)
    //         )
    //         .map((qId) => submitAnswer(application.id, qId, answers[qId]))
    //     );
    //   })
    // )
    //   .then(() => navigate("/dashboard"))
    //   .catch(() => alert("Error during submission"));
  };

  if (!campaign || !organisation) return <ApplicationPageLoading />;

  return (
    <Container tw="gap-4">
      <CampaignDetails
        campaignName={campaign!.name}
        headerImage={campaign!.cover_image}
        organisation={organisation!}
        campaign={campaign!}
        description={campaign!.description}
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
