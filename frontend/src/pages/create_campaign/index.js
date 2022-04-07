import React, { useState } from "react";
import { Container, Tabs, Tab } from "@mui/material";
import CampaignTab from "./Campaign";
import RolesTab from "./Roles";
import ReviewTab from "./Preview";
import { NextButton, ArrowIcon, NextWrapper } from "./createCampaign.styled";

// FIXME: CHAOS-66, user authentication and redirection if they are not logged in or authenticated
const CreateCampaign = () => {
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
        alert("All fields must be filled before reviewing!");
        return;
      }
    }
    setTab(newTab);
  };

  // FIXME: CHAOS-64, update submitHandler to account for new data
  //        (roles/questions etc.), part of backend integration
  const submitHandler = async (isDraft) => {
    console.log(`submit handler -> isDraft=${isDraft}`);
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
