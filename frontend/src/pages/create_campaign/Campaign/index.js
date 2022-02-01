import React from "react";
import { FormControlLabel, Switch } from "@mui/material";
import PropTypes from "prop-types";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import LocalizationProvider from "@mui/lab/LocalizationProvider";
import DateTimePicker from "@mui/lab/DateTimePicker";
import Dropzone from "react-dropzone";
import {
  CampaignContainer,
  CampaignDropzone,
  CampaignRowDiv,
  SwitchRowDiv,
  CampaignTextField,
} from "./campaignTab.styled";
import { fileToDataUrl } from "../../../utils";

const CampaignTab = ({ isSelected, campaignData }) => {
  const {
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
  } = campaignData;
  console.log(campaignData);
  const onFileUpload = async (acceptedFiles) => {
    const fileUrl = await fileToDataUrl(acceptedFiles[0]);
    setCover(fileUrl);
  };

  return (
    isSelected && (
      <CampaignContainer>
        <Dropzone
          onDrop={(acceptedFiles) => onFileUpload(acceptedFiles)}
          accept={["image/jpeg", "image/jpg", "image/png", "image/gif"]}
          minSize={1024}
          maxSize={3072000}
        >
          {({ getRootProps, getInputProps }) => (
            <section>
              <CampaignDropzone {...getRootProps()}>
                <input {...getInputProps()} />
                {cover === null && (
                  <p>
                    Drag and drop your campaign cover image, or click to select
                    an image
                  </p>
                )}
                {cover !== null && <img src={cover} alt="campaign cover" />}
              </CampaignDropzone>
            </section>
          )}
        </Dropzone>
        <CampaignTextField
          label="Campaign Name"
          variant="outlined"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
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
        </CampaignRowDiv>
        <SwitchRowDiv>
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
                checked={scoringStage}
                onChange={() => setScoringStage(!scoringStage)}
              />
            }
            label="Scoring Stage"
          />
        </SwitchRowDiv>
      </CampaignContainer>
    )
  );
};

CampaignTab.propTypes = {
  isSelected: PropTypes.bool.isRequired,
  campaignData: PropTypes.shape({
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
        roles: PropTypes.objectOf(PropTypes.string).isRequired,
      })
    ).isRequired,
    roles: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
      })
    ).isRequired,
    campaignName: PropTypes.string.isRequired,
    setCampaignName: PropTypes.func.isRequired,
    startDate: PropTypes.instanceOf(Date).isRequired,
    setStartDate: PropTypes.func.isRequired,
    endDate: PropTypes.instanceOf(Date).isRequired,
    setEndDate: PropTypes.func.isRequired,
    cover: PropTypes.string.isRequired,
    setCover: PropTypes.func.isRequired,
    description: PropTypes.string.isRequired,
    setDescription: PropTypes.func.isRequired,
    interviewStage: PropTypes.bool.isRequired,
    setInterviewStage: PropTypes.func.isRequired,
    scoringStage: PropTypes.bool.isRequired,
    setScoringStage: PropTypes.func.isRequired,
  }).isRequired,
};

export default CampaignTab;
