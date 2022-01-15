import {
  Container,
  FormControlLabel,
  Switch,
  TextField,
  Button,
} from "@mui/material";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DatePicker from '@mui/lab/DatePicker';
import React from "react";
import { useNavigate } from "react-router-dom";
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
    <Container>
      <img src="https://source.unsplash.com/random/1280x720" alt="placeholder image" />
      <TextField
        label="Campaign Name"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Campaign Description"
        variant="outlined"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Start Date"
          inputFormat="dd/MM/yyyy"
          value={startDate}
          onChange={(date) => setStartDate(date)}
          renderInput={(params) => <TextField {...params} />}
        />
        <DatePicker
          label="End Date"
          inputFormat="dd/MM/yyyy"
          value={endDate}
          onChange={(date) => setEndDate(date)}
          renderInput={(params) => <TextField {...params} />}
        />
      </LocalizationProvider>
      <p>Date pickers for start and end dates</p>
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
      <Button variant="contained" color="primary" onClick={undefined}>
        Create Campaign
      </Button>
    </Container>
  );

};

export default CreateCampaign;
