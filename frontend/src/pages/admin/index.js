import React, { useContext, useEffect, useState, createContext } from "react";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";
import { AdminContainer } from "./admin.styled";
import AdminSidebar from "../../components/AdminSideBar";
import AdminContent from "./AdminContent";
import { getAdminData } from "../../api";
import { bytesToImage } from "../../utils";
import { OrgContext } from "./OrgContext";

import DirectorDummy from "../dashboard/director.jpg";
import ProjectLeadDummy from "../dashboard/project-lead.jpg";
import ProjectTeamDummy from "../dashboard/project-team.png";
import CSELogoDummy from "./CSESoc_logo.jpeg";
import SECLogoDummy from "./SECSoc_logo.jpeg";

export const isFormOpenContext = createContext(null);

// TODO: CHAOS-55, delete once request is implemented
const campaignsData = [
  {
    id: 0,
    image: DirectorDummy,
    title: "Director Recruitment",
    startDate: "1 Jan 2022",
    endDate: "1 Feb 2022",
  },
  {
    id: 1,
    image: ProjectLeadDummy,
    title: "Project Lead Recruitment",
    startDate: "1 Feb 2022",
    endDate: "1 Mar 2022",
  },
  {
    id: 2,
    image: ProjectTeamDummy,
    title: "Project Team Recruitment",
    startDate: "1 Mar 2022",
    endDate: "1 Apr 2022",
  },
];

// TODO: CHAOS-55, delete once request is implemented
const membersData = [
  {
    id: 0,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 1,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 2,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 3,
    name: "Jane Doe",
    role: "Admin",
  },
  {
    id: 4,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 5,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 6,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 7,
    name: "Jane Doe",
    role: "Admin",
  },
  {
    id: 8,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 9,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 10,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 11,
    name: "Jane Doe",
    role: "Admin",
  },
  {
    id: 12,
    name: "John Smith",
    role: "Director",
  },
  {
    id: 13,
    name: "Jane Doe",
    role: "Director",
  },
  {
    id: 14,
    name: "John Smith",
    role: "Admin",
  },
  {
    id: 15,
    name: "Jane Doe",
    role: "Admin",
  },
];

// TODO: CHAOS-55, delete once request is implemented
const orgListData = [
  { id: 0, icon: CSELogoDummy, orgName: "CSESoc" },
  { id: 1, icon: SECLogoDummy, orgName: "SECSoc" },
];

const Admin = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Admin");
  }, []);
  const [sidebarWidth, setSidebarWidth] = useState("80px");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [orgList, setOrgList] = useState([]);

  const [campaigns, setCampaigns] = useState([]);
  const [members, setMembers] = useState([]);

  // FIXME: CHAOS-56, implement default behaviour for users w/ no org
  const [orgSelected, setOrgSelected] = useState(0);

  useEffect(async () => {
    const data = (await (await getAdminData()).json()).organisations;

    setOrgList(
      data.map((item) => ({
        id: item.id,
        icon: bytesToImage(item.logo),
        orgName: item.name,
        campaigns: item.campaigns,
        members: item.members,
      }))
    );
    if (data !== []) {
      setOrgSelected(0);
      const org = data[orgSelected];

      setCampaigns(
        org.campaigns.map((item) => ({
          id: item.id,
          image: bytesToImage(item.cover_image),
          title: item.name,
          startDate: item.starts_at,
          endDate: item.ends_at,
        }))
      );

      setMembers(
        org.members.map((item) => ({
          id: item.id,
          name: item.display_name,
          role: item.role,
        }))
      );
    }
  }, []);

  useEffect(async () => {
    setCampaigns(
      orgList[orgSelected]?.campaigns.map((item) => ({
        id: item.id,
        image: bytesToImage(item.cover_image),
        title: item.name,
        startDate: item.starts_at,
        endDate: item.ends_at,
      })) ?? []
    );
    setMembers(
      orgList[orgSelected]?.members.map((item) => ({
        id: item.id,
        name: item.display_name,
        role: item.role,
      })) ?? []
    );
  }, [orgSelected, orgList]);

  return (
    <OrgContext.Provider
      value={{ orgSelected, setOrgSelected, orgList, setOrgList }}
    >
      <isFormOpenContext.Provider value={{ isFormOpen, setIsFormOpen }}>
        <AdminContainer>
          <AdminSidebar
            orgList={orgList}
            setOrgList={setOrgList}
            orgSelected={orgSelected}
            setOrgSelected={setOrgSelected}
            isFormOpen={isFormOpen}
            setIsFormOpen={setIsFormOpen}
            sidebarWidth={sidebarWidth}
            setSidebarWidth={setSidebarWidth}
          />
          <AdminContent
            org={orgList[orgSelected]}
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            members={members}
            setMembers={setMembers}
          />
        </AdminContainer>
      </isFormOpenContext.Provider>
    </OrgContext.Provider>
  );
};

export default Admin;
