import { FormControlLabel, Switch } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useState } from "react";
import Dropzone from "react-dropzone";

import {
  CampaignContainer,
  CampaignDropzone,
  CampaignRowDiv,
  CampaignTextField,
  CoverImage,
  SwitchRowDiv,
} from "./campaignTab.styled";

import type { Campaign } from "../types";
import type { ComponentProps } from "react";

type Props = {
  campaign: Campaign;
};
const CampaignTab = ({ campaign }: Props) => {
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
  } = campaign;
  const [imageSrc, setImageSrc] = useState<string>();
  const onFileUpload = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setCover(file);

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageSrc(reader.result as string);
    });
    reader.readAsDataURL(file);
  };

  return (
    <CampaignContainer>
      <Dropzone
        onDrop={(acceptedFiles) => void onFileUpload(acceptedFiles)}
        accept={{
          "image/jpeg": [".jpeg"],
          "image/jpg": [".jpg"],
          "image/png": [".png"],
          "image/gif": [".gif"],
        }}
        minSize={1024}
        maxSize={3072000}
      >
        {({ getRootProps, getInputProps }) => (
          <section>
            <CampaignDropzone {...getRootProps()}>
              {/* eslint-disable-next-line react/jsx-props-no-spreading -- this *should* be fine here */}
              <input {...getInputProps()} />
              {cover === null && (
                <p>
                  Drag and drop your campaign cover image, or click to select an
                  image
                </p>
              )}
              {cover !== null && (
                <CoverImage src={imageSrc} alt="campaign cover" />
              )}
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
            onChange={(date: Date) => setStartDate(date)}
            renderInput={(params: ComponentProps<typeof CampaignTextField>) => (
              <CampaignTextField {...params} />
            )}
          />
          <DateTimePicker
            label="End Date"
            inputFormat="dd/MM/yyyy hh:mm a"
            minDateTime={startDate}
            value={endDate}
            onChange={(date: Date) => setEndDate(date)}
            renderInput={(params: ComponentProps<typeof CampaignTextField>) => (
              <CampaignTextField {...params} />
            )}
          />
        </LocalizationProvider>
      </CampaignRowDiv>
      <SwitchRowDiv>
        <FormControlLabel
          control={
            <Switch
              checked={interviewStage}
              onChange={() => setInterviewStage(!interviewStage)}
            />
          }
          label="Interview Stage"
        />
        <FormControlLabel
          control={
            <Switch
              checked={scoringStage}
              onChange={() => setScoringStage(!scoringStage)}
            />
          }
          label="Scoring Stage"
        />
      </SwitchRowDiv>
    </CampaignContainer>
  );
};

export default CampaignTab;
