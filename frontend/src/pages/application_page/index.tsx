import { Container } from "@mui/material";
import moment from "moment";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "twin.macro";

import {
  getAllCampaigns,
  getOrganisation,
  getSelfInfo,
  newApplication,
  submitAnswer,
} from "../../api";
import ApplicationForm from "../../components/ApplicationForm";
import { bytesToImage } from "../../utils";

import {
  ArrowIcon,
  SubmitButton,
  SubmitWrapper,
} from "./applicationPage.styled";

import type { CampaignWithRoles, Organisation, UserResponse } from "types/api";

import { EnvelopeIcon } from "@heroicons/react/20/solid";

const dateToString = (date: string) =>
  moment(new Date(date)).format("D MMM YYYY");

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
        // eslint-disable-next-line camelcase -- format from api response
        const {
          past_campaigns: pastCampaigns,
          current_campaigns: currentCampaigns,
        } = await getAllCampaigns();
        // eslint-disable-next-line camelcase, @typescript-eslint/no-non-null-assertion
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
    <div tw="flex flex-col flex-1 max-w-7xl p-6 mx-auto gap-4">
      <div tw="flex flex-col items-center gap-6 bg-white rounded shadow p-6 md:(flex-row items-start)">
        <div tw="flex flex-col gap-2">
          <div tw="flex gap-2 items-center">
            <img
              tw="rounded h-20 shadow"
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              src={bytesToImage(organisation.logo!)}
              alt={organisation.name}
            />
            <div tw="flex flex-col gap-2 justify-center">
              <h1 tw="text-3xl">{campaign.campaign.name}</h1>
              <p>
                {dateToString(campaign.campaign.starts_at)} -{" "}
                {dateToString(campaign.campaign.ends_at)}
              </p>
            </div>
          </div>
          <div tw="flex items-center leading-relaxed">{description}</div>
          <div>
            <h3 tw="text-xl leading-loose">You&apos;re applying as:</h3>
            <p tw="flex gap-1.5">
              <span>{userInfo.name}</span>
              <span tw="font-light italic">({userInfo.zid})</span>
              <span>·</span>
              <span>{userInfo.degree}</span>
            </p>
            <p tw="flex gap-1 items-center text-gray-800 text-sm">
              <EnvelopeIcon tw="w-4 h-4" /> {userInfo.email}
            </p>
          </div>
        </div>
        <div
          tw="flex items-center justify-center m-auto mr-0 max-w-xl md:w-1/2 flex-shrink-0 shadow rounded bg-[#edeeef] overflow-hidden"
          css={{ aspectRatio: "16/9" }}
        >
          <img
            tw="w-full max-h-full object-contain"
            src={headerImage}
            alt={campaignName}
          />
        </div>
      </div>

      <div tw="flex flex-1 gap-4">
        <div tw="rounded shadow bg-white p-4">
          <ul>
            {roles.map((role) => (
              <li key={role.id}>{role.title}</li>
            ))}
          </ul>
        </div>
        <div tw="flex-1 p-4 rounded shadow bg-white"></div>
      </div>
    </div>
  );

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
