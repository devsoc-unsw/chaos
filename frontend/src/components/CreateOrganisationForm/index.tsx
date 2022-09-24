import { ChangeEventHandler, Dispatch, SetStateAction } from "react";
import {
  FormContainer,
  ImageUploadWrapper,
  TextInput,
  UploadButton,
} from "./createOrganisationForm.styled";
import { OrgIconImage } from "../AdminSideBar/adminSidebar.styled";
import newImageIcon from "./new_image_icon.png";

type Props = {
  uploadedImage: { image: File; url: string };
  onFileChange: ChangeEventHandler<HTMLInputElement>;
  inputText: string;
  setInputText: Dispatch<SetStateAction<string>>;
  onUpload: () => Promise<void>;
};

const CreateOrganisationForm = ({
  uploadedImage,
  onFileChange,
  inputText,
  setInputText,
  onUpload,
}: Props) => (
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
