import { Container, Tab, Tabs } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { MessagePopupContext } from "contexts/MessagePopupContext";
import { base64ToBytes, dateToStringForBackend } from "utils";

import { createCampaign, isAdminInOrganisation } from "../../api";

import CampaignTab from "./Campaign";
import ReviewTab from "./Preview";
import RolesTab from "./Roles";
import { ArrowIcon, NextButton, NextWrapper } from "./createCampaign.styled";

import type { Answers, Question, Role } from "./types";

const CreateCampaign = () => {
  const orgId = Number(useParams().orgId);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      const isAdmin = await isAdminInOrganisation(orgId);
      if (!isAdmin) {
        navigate("/");
      }
    };

    void fetchData();
  }, []);

  const [tab, setTab] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const initialState = new Date();
    return initialState;
  });
  const [endDate, setEndDate] = useState(() => {
    const initialState = new Date(Date.now() + 14 * 3600 * 1000 * 24);
    return initialState;
  });
  const [description, setDescription] = useState("");
  const [interviewStage, setInterviewStage] = useState(false);
  const [scoringStage, setScoringStage] = useState(false);
  const [cover, setCover] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleSelected, setRoleSelected] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const campaign = {
    tab,
    setTab,
    campaignName,
    setCampaignName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    description,
    setDescription,
    interviewStage,
    setInterviewStage,
    scoringStage,
    setScoringStage,
    cover,
    setCover,
    error,
    setError,
    roles,
    setRoles,
    roleSelected,
    setRoleSelected,
    questions,
    setQuestions,
    answers,
    setAnswers,
  };
  const campaignTabIdx = 0;
  const rolesTabIdx = 1;
  const reviewTabIdx = 2;

  const pushMessage = useContext(MessagePopupContext);

  const onTabChange = (newTab: number) => {
    // only allow user to access review tab if all inputs are non-empty
    if (newTab === reviewTabIdx) {
      if (
        campaignName === "" ||
        description === "" ||
        cover === null ||
        questions.length === 0 ||
        roles.length === 0
      ) {
        console.error("All fields must be filled before reviewing!");
        return;
      }
    }
    setTab(newTab);
  };

  // FIXME: CHAOS-64, update submitHandler to account for new data
  //        (roles/questions etc.), part of backend integration
  const submitHandler = (isDraft: boolean) => {
    if (campaignName.length === 0 && !isDraft) {
      setError("Campaign name is required");
      return;
    }
    if (description === "" && !isDraft) {
      setError("Campaign description is required");
      return;
    }
    if (cover === null) {
      setError("Cover image is required");
      return;
    }
    if (startDate.getTime() > endDate.getTime()) {
      setError("Start date must be before end date");
      return;
    }
    if (roles.length === 0 && !isDraft) {
      setError("At least one role is required");
      return;
    }
    if (questions.length === 0 && !isDraft) {
      setError("At least one question is required");
      return;
    }
    setError(null);

    const coverSend = base64ToBytes(cover.split(",")[1]);

    // const coverSend = cover ? cover.slice(cover.indexOf(";base64,") + 8) : "";
    const startTimeDateString = dateToStringForBackend(startDate);
    const endTimeDateString = dateToStringForBackend(endDate);
    const campaignSend = {
      organisation_id: Number(orgId),
      name: campaignName,
      cover_image: coverSend,
      description,
      starts_at: startTimeDateString,
      ends_at: endTimeDateString,
      published: !isDraft,
    };

    const roleQuestions: { [id: string]: number[] } = {};

    const questionsSend = questions.map((q, i) => {
      q.roles.forEach((roleId) => {
        const array = roleQuestions[roleId] ?? [];
        array.push(i);
        roleQuestions[roleId] = array;
      });

      return {
        title: q.text,
        required: q.required ?? true,
      };
    });

    const rolesSend = roles.map((r) => ({
      name: r.title,
      min_available: r.quantity,
      max_available: r.quantity,
      questions_for_role: roleQuestions[r.id] ?? [],
    }));

    createCampaign(campaignSend, rolesSend, questionsSend)
      .then(() => {
        console.log("nice!");
        pushMessage({
          message: "Successfully created campaign!",
          type: "success",
        });
        navigate("/dashboard");
      })
      .catch(() => {
        console.error("something went wrong");
      });
  };

  return (
    <Container>
      <Tabs
        value={tab}
        onChange={(_e, val: number) => onTabChange(val)}
        centered
        style={{ paddingBottom: "30px", paddingTop: "15px" }}
      >
        <Tab label="campaign" />
        <Tab label="roles" />
        <Tab label="review" />
      </Tabs>
      {tab === campaignTabIdx && <CampaignTab campaign={campaign} />}
      {tab === rolesTabIdx && <RolesTab campaign={campaign} />}
      {tab === reviewTabIdx && (
        <ReviewTab campaign={campaign} onSubmit={submitHandler} />
      )}
      {(tab === campaignTabIdx || tab === rolesTabIdx) && (
        <NextWrapper>
          <NextButton
            variant="contained"
            onClick={() => {
              onTabChange(tab + 1);
            }}
          >
            Next
            <ArrowIcon />
          </NextButton>
        </NextWrapper>
      )}
    </Container>
  );
};

export default CreateCampaign;
