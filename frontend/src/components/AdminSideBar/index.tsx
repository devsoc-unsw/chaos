import { useState } from "react";

import { createOrganisation, putOrgLogo } from "../../api";
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
      if (uploadedImage.image && inputText) {
        const { id } = await createOrganisation(inputText);
        const logo = await putOrgLogo(id, uploadedImage.image);
        const newOrgList = [
          ...orgList,
          {
            id,
            icon: logo,
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
        console.log("New organisation created!");
      } else {
        console.error("Both image and text are required!");
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
        <div tw="border-bottom border-black/[0.12]">
          <CreateOrgButton value={-1}>
            <OrgButtonContent onClick={() => setIsFormOpen(!isFormOpen)}>
              <OrgIcon>
                {isFormOpen ? <RemoveOrgIcon /> : <CreateOrgIcon />}
              </OrgIcon>
              <OrgName style={{ paddingLeft: "10px" }}>
                New Organisation
              </OrgName>
            </OrgButtonContent>
          </CreateOrgButton>
          {isFormOpen && (
            <CreateOrganisationForm
              uploadedImage={uploadedImage}
              onFileChange={onFileChange}
              inputText={inputText}
              setInputText={setInputText}
              onUpload={onUpload}
            />
          )}
        </div>
        {orgList.map((it, idx) => (
          <OrgButton
            key={it.id}
            value={idx}
            onClick={() => setOrgSelected(idx)}
          >
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
