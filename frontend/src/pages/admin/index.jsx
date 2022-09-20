import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  createContext,
} from "react";
import { SetNavBarTitleContext } from "../../contexts/SetNavbarTitleContext";
import { AdminContainer } from "./admin.styled";
import AdminSidebar from "../../components/AdminSideBar";
import AdminContent from "./AdminContent";
import { getAdminData } from "../../api";
import { bytesToImage } from "../../utils";
import { OrgContext } from "./OrgContext";

export const isFormOpenContext = createContext(null);

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

  const orgContextValue = useMemo(() => ({
    orgSelected,
    setOrgSelected,
    orgList,
    setOrgList,
  }));
  const isFormOpenContextValue = useMemo(() => ({ isFormOpen, setIsFormOpen }));

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
    <OrgContext.Provider value={orgContextValue}>
      <isFormOpenContext.Provider value={isFormOpenContextValue}>
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
