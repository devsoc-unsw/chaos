import {
  FormControlLabel,
  Switch,
} from "@mui/material";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import React from "react";
import { useNavigate } from "react-router-dom";
import { CampaignContainer, CampaignRowDiv, CampaignSubmit, CampaignTextField } from "./createCampaign.styled";
import { LoadingIndicator } from "../../components";

const CreateCampaign = () => {
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date());
  const [description, setDescription] = React.useState("");
  const [interviewStage, setInterviewStage] = React.useState(false);
  const [scoringState, setScoringStage] = React.useState(false);
  const [draft, setDraft] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submitHandler = async () => {
    if (name.length === 0 && !draft) {
      setError("Campaign name is required");
    } else if (description === 0 && !draft) {
      setError("Campaign description is required");
    } else if (startDate.getTime() > endDate.getTime()) {
      setError("Start date must be before end date");
    } else {
      setError(null);
    }

    const postCampaign = await fetch("http://127.0.0.1:8000/campaign/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        start_time: startDate,
        end_time: endDate,
        draft,
        cover,
      }),
    });

    const status = await postCampaign.status;
    if (status === 200) {
      console.log("nice!");
    } else {
      console.log("you fucked up");
    }
  };

  return (
    <CampaignContainer>
      <img src="https://source.unsplash.com/random/1280x720" alt="placeholder image" />
      <CampaignTextField
        label="Campaign Name"
        variant="outlined"
        required={!draft}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <CampaignTextField
        label="Campaign Description"
        variant="outlined"
        multiline
        required={!draft}
        rows={10}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <CampaignRowDiv>
      <FormControlLabel
          control={
            <Switch
              label="Interview Stage"
              checked={interviewStage}
              onChange={() => setInterviewStage(!interviewStage)}
            />
          }
          label="Interview Stage"
        />
        <FormControlLabel
          control={
            <Switch
              label="Scoring Stage"
              checked={scoringState}
              onChange={() => setScoringStage(!scoringState)}
            />
          }
          label="Scoring Stage"
        />
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateTimePicker
            label="Start Date"
            inputFormat="dd/MM/yyyy hh:mm a"
            value={startDate}
            onChange={(date) => setStartDate(date)}
            renderInput={(params) => <CampaignTextField {...params} />}
          />
          <DateTimePicker
            label="End Date"
            inputFormat="dd/MM/yyyy hh:mm a"
            minDateTime={startDate}
            value={endDate}
            onChange={(date) => setEndDate(date)}
            renderInput={(params) => <CampaignTextField {...params} />}
          />
        </LocalizationProvider>
        <FormControlLabel
          control={
            <Switch
              label="Draft Campaign"
              checked={draft}
              onChange={() => setDraft(!draft)}
            />
          }
          label="Draft Campaign"
        />
      </CampaignRowDiv>
      <CampaignSubmit variant="contained" color="primary" onClick={submitHandler}>
        Create Campaign
      </CampaignSubmit>
    </CampaignContainer>
  );

};

export default CreateCampaign;
