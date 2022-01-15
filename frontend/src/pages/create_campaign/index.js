import {
  FormControlLabel,
  Switch,
} from "@mui/material";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
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
  const [error, setError] = React.useState(null);

  return (
    <CampaignContainer>
      <img src="https://source.unsplash.com/random/1280x720" alt="placeholder image" />
      <CampaignTextField
        label="Campaign Name"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <CampaignTextField
        label="Campaign Description"
        variant="outlined"
        multiline
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
          <DatePicker
            label="Start Date"
            inputFormat="dd/MM/yyyy"
            value={startDate}
            onChange={(date) => setStartDate(date)}
            renderInput={(params) => <CampaignTextField {...params} />}
          />
          <DatePicker
            label="End Date"
            inputFormat="dd/MM/yyyy"
            value={endDate}
            onChange={(date) => setEndDate(date)}
            renderInput={(params) => <CampaignTextField {...params} />}
          />
        </LocalizationProvider>
      </CampaignRowDiv>
      <CampaignSubmit variant="contained" color="primary" onClick={undefined}>
        Create Campaign
      </CampaignSubmit>
    </CampaignContainer>
  );

};

export default CreateCampaign;
