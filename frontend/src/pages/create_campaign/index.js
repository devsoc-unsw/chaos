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
  const campaignData = {
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
  };

  const onTabChange = (val) => {
    // only allow user to access review/publish tab if all inputs are non-empty
    if (val === 2) {
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
    setTab(val);
  };

  // FIXME: CHAOS-64, update submitHandler to account for new data
  //        (roles/questions etc.), part of backend integration
  const submitHandler = async (isDraft) => {
    console.log(`submit handler -> isDraft=${isDraft}`);
    /*
    if (campaignName.length === 0 && !draft) {
      setError("Campaign name is required");
    } else if (description === 0 && !draft) {
      setError("Campaign description is required");
    } else if (startDate.getTime() > endDate.getTime()) {
      setError("Start date must be before end date");
    } else {
      setError(null);
    }

    const coverSend = cover ? cover.slice(cover.indexOf(";base64,") + 8) : "";
    const startTimeString = `${startDate.getFullYear()}-${
      startDate.getMonth() < 9
        ? `0${startDate.getMonth() + 1}`
        : `${startDate.getMonth() + 1}`
    }-${
      startDate.getDate() < 9
        ? `0${startDate.getDate() + 1}`
        : `${startDate.getDate() + 1}`
    }T${
      startDate.getHours() < 9
        ? `0${startDate.getHours()}`
        : `${startDate.getHours()}`
    }:${
      startDate.getMinutes() < 9
        ? `0${startDate.getMinutes()}`
        : `${startDate.getMinutes()}`
    }:00`;
    const endTimeString = `${endDate.getFullYear()}-${
      endDate.getMonth() < 9
        ? `0${endDate.getMonth() + 1}`
        : `${endDate.getMonth() + 1}`
    }-${
      endDate.getDate() < 9
        ? `0${endDate.getDate() + 1}`
        : `${endDate.getDate() + 1}`
    }T${
      endDate.getHours() < 9
        ? `0${endDate.getHours()}`
        : `${endDate.getHours()}`
    }:${
      endDate.getMinutes() < 9
        ? `0${endDate.getMinutes()}`
        : `${endDate.getMinutes()}`
    }:00`;

    const postCampaign = await fetch("http://127.0.0.1:8000/campaign/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // TODO: replace organisation id with something in the frontend that returns the id, would necessitate an endpoint to get all orgs the  user is a part of
        organisation_id: 1,
        campaignName,
        description,
        starts_at: startTimeString,
        ends_at: endTimeString,
        draft,
        // draft now means that it is an actual draft
        cover_image: coverSend,
      }),
    });

    const status = await postCampaign.status;
    if (status === 200) {
      console.log("nice!");
    } else {
      console.log("something fucked up");
    }
    */
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
      <CampaignTab isSelected={tab === 0} campaignData={campaignData} />
      <RolesTab isSelected={tab === 1} campaignData={campaignData} />
      <ReviewTab
        isSelected={tab === 2}
        campaignData={campaignData}
        onSubmit={submitHandler}
      />
      {(tab === 0 || tab === 1) && (
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
