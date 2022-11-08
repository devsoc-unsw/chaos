import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "twin.macro";

import Card from "components/Card";

import {
  getAllCampaigns,
  getOrganisation,
  getSelfInfo,
  newApplication,
  submitAnswer,
} from "../../api";
import { bytesToImage } from "../../utils";

import CampaignDetails from "./CampaignDetails";
import RolesSidebar from "./RolesSidebar";

import type { CampaignWithRoles, Organisation, UserResponse } from "types/api";

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
  const [organisation, setOrganisation] = useState<Organisation>({
    id: -1,
    name: "",
    logo: [],
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
  const [answers, setAnswers] = useState<{ [question: string]: string }>({});

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
    (question: string, answer: string) => {
      setAnswers({ ...answers, [question]: answer });
    },
    [answers]
  );

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
      // eslint-disable-next-line no-alert
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
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  const question = questions.find(
                    (q) => Number(q.id) === Number(qId)
                  )!;
                  const [rId] = question.roles;
                  return rId === data.role_id;
                })
                .map((qId) =>
                  submitAnswer(data.id, Number(qId), answers[qId]).catch(() => {
                    throw new Error("Error during submission");
                  })
                )
            )
          )
          // eslint-disable-next-line no-alert
          .catch(() => alert("Error during submission"));
      });
      navigate("/dashboard");
    }
  };

  return (
    <div tw="mx-auto flex flex-1 max-w-7xl flex-col gap-4 p-4">
      <CampaignDetails
        campaignName={campaignName}
        headerImage={headerImage}
        organisation={organisation}
        campaign={campaign}
        description={description}
        userInfo={userInfo}
      />

      <div tw="flex flex-1 gap-4">
        <RolesSidebar
          roles={campaign.roles}
          rolesSelected={rolesSelected}
          toggleRole={toggleRole}
        />
        <Card tw="flex-1" />
      </div>
    </div>
  );
};

export default Application;
