import React, { useEffect, useState } from "react";
import { Container, Tabs, Tab } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { dateToStringForBackend, base64ToBytes } from "utils";
import CampaignTab from "./Campaign";
import RolesTab from "./Roles";
import ReviewTab from "./Preview";
import { NextButton, ArrowIcon, NextWrapper } from "./createCampaign.styled";
import { isAdminInOrganisation, createCampaign } from "../../api";

const CreateCampaign = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  useEffect(async () => {
    const data = await isAdminInOrganisation(orgId);
    const isAdmin = await data.json();
    if (!isAdmin) {
      navigate("/");
    }
  }, []);

  const [tab, setTab] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [interviewStage, setInterviewStage] = useState(false);
  const [scoringStage, setScoringStage] = useState(false);
  const [cover, setCover] = useState(null);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleSelected, setRoleSelected] = useState(
    roles.length > 0 ? roles[0].id : "-1"
  );
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
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

  const onTabChange = (newTab) => {
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
  const submitHandler = async (isDraft) => {
    if (campaignName.length === 0 && !isDraft) {
      setError("Campaign name is required");
    } else if (description === 0 && !isDraft) {
      setError("Campaign description is required");
    } else if (cover === null) {
      setError("Cover image is required");
    } else if (startDate.getTime() > endDate.getTime()) {
      setError("Start date must be before end date");
    } else if (roles.length === 0 && !isDraft) {
      setError("At least one role is required");
    } else if (questions.length === 0 && !isDraft) {
      setError("At least one question is required");
    } else {
      setError(null);
    }

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

    const roleQuestions = {};

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

    const post = await createCampaign(campaignSend, rolesSend, questionsSend);

    const status = await post.status;
    if (status === 200) {
      console.log("nice!");
      navigate("/dashboard");
    } else {
      console.log("something went wrong");
    }
  };

  return (
    <Container>
      <Tabs
        value={tab}
        onChange={(e, val) => onTabChange(val)}
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
