import { useContext, useState } from "react";

import { MessagePopupContext } from "contexts/MessagePopupContext";

import { createOrganisation } from "../../api";
import { base64ToBytes, fileToDataUrl } from "../../utils";
import CreateOrganisationForm from "../CreateOrganisationForm";

import {
  CreateOrgButton,
  CreateOrgIcon,
  OrgButton,
  OrgButtonContent,
  OrgButtonGroup,
  OrgIcon,
  OrgIconImage,
  OrgName,
  RemoveOrgIcon,
  SidebarContainer,
} from "./adminSidebar.styled";

import type { Organisation } from "pages/admin/types";
import type { ChangeEvent } from "react";

type Props = {
  orgList: Organisation[];
  setOrgList: (orgList: Organisation[]) => void;
  orgSelected: number;
  setOrgSelected: (orgSelected: number) => void;
  isFormOpen: boolean;
  setIsFormOpen: (isFormOpen: boolean) => void;
  sidebarWidth: string;
  setSidebarWidth: (sidebarWidth: string) => void;
};

const AdminSidebar = ({
  orgList,
  setOrgList,
  orgSelected,
  setOrgSelected,
  isFormOpen,
  setIsFormOpen,
  sidebarWidth,
  setSidebarWidth,
}: Props) => {
  const [uploadedImage, setUploadedImage] = useState<{
    image: File | null;
    url: string | null;
  }>({
    image: null,
    url: null,
  });
  const [inputText, setInputText] = useState("");

  const pushMessage = useContext(MessagePopupContext);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadedImage({
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      image: e.target.files![0],
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      url: URL.createObjectURL(e.target.files![0]),
    });
  };

  const onUpload = () => {
    const createOrg = async () => {
      // FIXME: CHAOS-55, send to the backend
      if (uploadedImage.image && inputText) {
        // FIXME: CHAOS-55, backend request should return new id, this method obv flawed (also floored)
        const imgUrl = base64ToBytes(
          (await fileToDataUrl(uploadedImage.image)).split(",")[1]
        );
        const { id } = await createOrganisation(inputText, imgUrl);
        const newOrgList = [
          ...orgList,
          {
            id,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            icon: uploadedImage.url!,
            orgName: inputText,
            campaigns: [],
            members: [],
          },
        ];
        setOrgList(newOrgList);
        setOrgSelected(newOrgList.length - 1);
        setUploadedImage({ image: null, url: null });
        setInputText("");
        setIsFormOpen(false);

        pushMessage({
          message: "New organisation created!",
          type: "success",
        });
      } else if (!inputText) {
        pushMessage({
          message: "An organisation name is required!",
          type: "error",
        });
      } else if (!uploadedImage.image) {
        pushMessage({
          message: "An organisation logo image is required!",
          type: "error",
        });
      }
    };

    void createOrg();
  };

  return (
    <SidebarContainer
      isFormOpen={isFormOpen}
      sidebarWidth={sidebarWidth}
      onMouseOver={() => setSidebarWidth("280px")}
      onMouseOut={() => setSidebarWidth("80px")}
    >
      <OrgButtonGroup
        orientation="vertical"
        value={orgSelected}
        exclusive
        size="large"
      >
        <CreateOrgButton value={-1} isFormOpen={isFormOpen}>
          <OrgButtonContent onClick={() => setIsFormOpen(!isFormOpen)}>
            <OrgIcon>
              {isFormOpen ? <RemoveOrgIcon /> : <CreateOrgIcon />}
            </OrgIcon>
            <OrgName style={{ paddingLeft: "10px" }}>New Organisation</OrgName>
          </OrgButtonContent>
          {isFormOpen && (
            <CreateOrganisationForm
              uploadedImage={uploadedImage}
              onFileChange={onFileChange}
              inputText={inputText}
              setInputText={setInputText}
              onUpload={onUpload}
            />
          )}
        </CreateOrgButton>
        {orgList.map((it, idx) => (
          <OrgButton value={idx} onClick={() => setOrgSelected(idx)}>
            <OrgButtonContent>
              <OrgIcon>
                <OrgIconImage src={it.icon} />
              </OrgIcon>
              <OrgName>{it.orgName}</OrgName>
            </OrgButtonContent>
          </OrgButton>
        ))}
      </OrgButtonGroup>
    </SidebarContainer>
  );
};

export default AdminSidebar;
