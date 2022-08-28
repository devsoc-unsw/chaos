import React, { useState } from "react";
import PropTypes from "prop-types";
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
      const newOrgList = orgList.concat({
        id: newID,
        icon: uploadedImage.url,
        orgName: inputText,
      });
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

AdminSidebar.propTypes = {
  orgList: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      icon: PropTypes.string,
      orgName: PropTypes.string,
    })
  ).isRequired,
  setOrgList: PropTypes.func.isRequired,
  orgSelected: PropTypes.number.isRequired,
  setOrgSelected: PropTypes.func.isRequired,
  isFormOpen: PropTypes.bool.isRequired,
  setIsFormOpen: PropTypes.func.isRequired,
  sidebarWidth: PropTypes.number.isRequired,
  setSidebarWidth: PropTypes.func.isRequired,
};

export default AdminSidebar;
