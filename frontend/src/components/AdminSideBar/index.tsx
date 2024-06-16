import { useState } from "react";
import tw from "twin.macro";

import { pushToast } from "utils";

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
};

const AdminSidebar = ({
  orgList,
  setOrgList,
  orgSelected,
  setOrgSelected,
  isFormOpen,
  setIsFormOpen,
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

        pushToast(
          "Organisation Creation Successful",
          "Organisation successfully created",
          "success"
        );
      } else if (!inputText) {
        pushToast(
          "Organisation Creation Error",
          "Organisation name is required!",
          "error"
        );
      } else if (!uploadedImage.image) {
        pushToast(
          "Organisation Creation Error",
          "Organisation logo image is required!",
          "error"
        );
      } else {
        pushToast(
          "Organisation Creation Error",
          "Organisation unknown error occurred!",
          "error"
        );
      }
    };

    void createOrg();
  };

  return (
    <SidebarContainer
      css={{
        ...(isFormOpen ? tw`w-[280px]` : tw`w-[80px]`),
      }}
    >
      <CreateOrgButton value={-1}>
        <OrgButtonContent onClick={() => setIsFormOpen(!isFormOpen)}>
          <OrgIcon>
            {isFormOpen ? <RemoveOrgIcon /> : <CreateOrgIcon />}
          </OrgIcon>
          <OrgName css={{ ...tw`pl-[25px]` }}>New Organisation</OrgName>
        </OrgButtonContent>
      </CreateOrgButton>
      <OrgButtonGroup
        type="single"
        value={orgSelected.toString()}
        orientation="vertical"
      >
        {isFormOpen && (
          <CreateOrganisationForm
            uploadedImage={uploadedImage}
            onFileChange={onFileChange}
            inputText={inputText}
            setInputText={setInputText}
            onUpload={onUpload}
          />
        )}
        {orgList.map((it, idx) => (
          <OrgButton
            key={it.id}
            value={idx.toString()}
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
