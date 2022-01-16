import {
  FormControlLabel,
  Switch,
} from "@mui/material";
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import DateTimePicker from '@mui/lab/DateTimePicker';
import React from "react";
import { useNavigate } from "react-router-dom";
import { CampaignContainer, CampaignDropzone, CampaignRowDiv, CampaignSubmit, CampaignTextField } from "./createCampaign.styled";
import Dropzone from 'react-dropzone';
import { LoadingIndicator } from "../../components";
import { fileToDataUrl } from "../../utils";

const CreateCampaign = () => {
  const navigate = useNavigate();

  const [name, setName] = React.useState("");
  const [startDate, setStartDate] = React.useState(new Date());
  const [endDate, setEndDate] = React.useState(new Date());
  const [description, setDescription] = React.useState("");
  const [interviewStage, setInterviewStage] = React.useState(false);
  const [scoringState, setScoringStage] = React.useState(false);
  const [draft, setDraft] = React.useState(false);
  const [cover, setCover] = React.useState(null);
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

    const coverSend = cover ? cover.slice(cover.indexOf(";base64,") + 8) : "";
    const startTimeString = `${startDate.getFullYear()}-${startDate.getMonth() < 9 ? `0${startDate.getMonth() + 1}` : `${startDate.getMonth() + 1}`}-${startDate.getDate() < 9 ? `0${startDate.getDate() + 1}` : `${startDate.getDate() + 1}`}T${startDate.getHours() < 9 ? `0${startDate.getHours()}` : `${startDate.getHours()}`}:${startDate.getMinutes() < 9 ? `0${startDate.getMinutes()}` : `${startDate.getMinutes()}`}:00`;
    const endTimeString = `${endDate.getFullYear()}-${endDate.getMonth() < 9 ? `0${endDate.getMonth() + 1}` : `${endDate.getMonth() + 1}`}-${endDate.getDate() < 9 ? `0${endDate.getDate() + 1}` : `${endDate.getDate() + 1}`}T${endDate.getHours() < 9 ? `0${endDate.getHours()}` : `${endDate.getHours()}`}:${endDate.getMinutes() < 9 ? `0${endDate.getMinutes()}` : `${endDate.getMinutes()}`}:00`;

    const postCampaign = await fetch("http://127.0.0.1:8000/campaign/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organisation_id: 1,
        name,
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
  };

  const onFileUpload = async (acceptedFiles) => {
    const fileUrl = await fileToDataUrl(acceptedFiles[0]);
    setCover(fileUrl);
  };

  return (
    <CampaignContainer>
      <img src="https://source.unsplash.com/random/1280x720" alt="placeholder image" />
      <Dropzone
        onDrop={acceptedFiles => onFileUpload(acceptedFiles)}
        accept={["image/jpeg", "image/jpg", "image/png", "image/gif"]}
        minSize={1024}
        maxSize={3072000}
      >
        {({getRootProps, getInputProps}) => (
          <section>
            <CampaignDropzone {...getRootProps()}>
              <input {...getInputProps()} />
              {cover === null && <p>Drag 'n' drop your campaign cover image, or click to select an image</p>}
              {cover !== null && <img src={cover} alt="campaign cover" />}
            </CampaignDropzone>
          </section>
        )}
      </Dropzone>
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
