import React from "react";
import {
  FormContainer,
  ImageUploadWrapper,
  TextInput,
  UploadButton,
} from "./createOrganisationForm.styled";
import { OrgIconImage } from "../AdminSideBar/adminSidebar.styled";
import newImageIcon from "./new_image_icon.png";

const CreateOrganisationForm = ({
  uploadedImage,
  onFileChange,
  inputText,
  setInputText,
  onUpload,
}) => (
  <FormContainer>
    <ImageUploadWrapper htmlFor="imgInput">
      <OrgIconImage
        src={uploadedImage.image ? uploadedImage.url : newImageIcon}
      />
      <input
        id="imgInput"
        style={{ display: "none" }}
        type="file"
        onChange={onFileChange}
      />
    </ImageUploadWrapper>
    <TextInput
      type="text"
      placeholder="Name"
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
    />
    <UploadButton onClick={onUpload}>+</UploadButton>
  </FormContainer>
);

export default CreateOrganisationForm;
