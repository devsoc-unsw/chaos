/* eslint-disable react/prop-types */
import React, { useState } from "react";
import {
  SidebarContainer,
  OrgButton,
  CreateOrgButton,
  OrgButtonGroup,
  OrgIcon,
  OrgIconImage,
  OrgName,
  OrgButtonContent,
  CreateOrgIcon,
  RemoveOrgIcon,
} from "./adminSidebar.styled";
import CreateOrganisationForm from "../CreateOrganisationForm";
import { createOrganisation } from "../../api";
import { fileToDataUrl, base64ToBytes } from "../../utils";

const AdminSidebar = ({
  orgList,
  setOrgList,
  orgSelected,
  setOrgSelected,
  isFormOpen,
  setIsFormOpen,
  sidebarWidth,
  setSidebarWidth,
}) => {
  const [uploadedImage, setUploadedImage] = useState({
    image: null,
    url: null,
  });
  const [inputText, setInputText] = useState("");

  const onFileChange = (e) => {
    setUploadedImage({
      image: e.target.files[0],
      url: URL.createObjectURL(e.target.files[0]),
    });
  };

  const onUpload = async () => {
    // FIXME: CHAOS-55, send to the backend
    if (uploadedImage.image && inputText) {
      // FIXME: CHAOS-55, backend request should return new id, this method obv flawed (also floored)
      const imgUrl = base64ToBytes(
        (await fileToDataUrl(uploadedImage.image)).split(",")[1]
      );
      const newID = await createOrganisation(inputText, imgUrl);
      // const newID = Math.floor(Math.random() * 1000);
      const newOrgList = orgList.concat({
        id: newID,
        icon: uploadedImage.url,
        orgName: inputText,
      });
      setOrgList(newOrgList);
      setOrgSelected(newID);
      setUploadedImage({ image: null, url: null });
      setInputText("");
      setIsFormOpen(false);
      alert("New organisation created!");
    } else {
      alert("Both image and text are required!");
    }
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
        <CreateOrgButton isFormOpen={isFormOpen}>
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
        {orgList.map((it) => (
          <OrgButton value={it.id}>
            <OrgButtonContent onClick={() => setOrgSelected(it.id)}>
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
