import { useState } from "react";
import tw from "twin.macro";

import { pushToast } from "utils";

import { createOrganisation, putOrgLogo } from "../../api";
import CreateOrganisationForm from "../CreateOrganisationForm";

import {
  OrgButton,
  OrgButtonContent,
  OrgButtonGroup,
  OrgIcon,
  OrgIconImage,
  OrgName,
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
  isFormOpen: _isFormOpen,
  setIsFormOpen: _setIsFormOpen,
}: Props) => {
  // The sidebar no longer supports creating organisations inline.
  // It now just lists organisations fetched from the server.

  return (
    <SidebarContainer
      css={{
        ...tw`w-[280px]`,
      }}
    >
      {/* Removed New Organisation button and form */}
      <OrgButtonGroup
        type="single"
        value={orgSelected.toString()}
        orientation="vertical"
      >
        {orgList.map((it, idx) => (
          <OrgButton
            key={it.id}
            value={idx.toString()}
            onClick={() => setOrgSelected(idx)}
          >
            <OrgButtonContent>
              <OrgIcon>
                <OrgIconImage src={it.icon || "/placeholder.svg"} />
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
