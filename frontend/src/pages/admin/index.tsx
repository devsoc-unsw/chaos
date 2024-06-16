import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getAdminData } from "../../api";
import AdminSidebar from "../../components/AdminSideBar";
import { SetNavBarTitleContext } from "../../contexts/SetNavbarTitleContext";

import AdminContent from "./AdminContent";
import AdminLoading from "./AdminLoading";
import { OrgContext } from "./OrgContext";
import { AdminContainer } from "./admin.styled";

import type { Campaign, Member, Organisation } from "./types";

const isFormOpenContext = createContext({
  isFormOpen: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsFormOpen: (_isFormOpen: boolean) => {},
});

const Admin = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Admin");
  }, []);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [orgList, setOrgList] = useState<Organisation[]>([]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // FIXME: CHAOS-56, implement default behaviour for users w/ no org
  const [orgSelected, setOrgSelected] = useState(0);

  const orgContextValue = useMemo(
    () => ({
      orgSelected,
      setOrgSelected,
      orgList,
      setOrgList,
    }),
    [orgSelected, setOrgSelected, orgList, setOrgList]
  );
  const isFormOpenContextValue = useMemo(
    () => ({ isFormOpen, setIsFormOpen }),
    [isFormOpen, setIsFormOpen]
  );

  useEffect(() => {
    const fetchData = async () => {
      const { organisations } = await getAdminData();

      setOrgList(
        organisations.map((item) => ({
          id: item.id,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          icon: item.logo!,
          orgName: item.name,
          campaigns: item.campaigns,
          members: item.members,
        }))
      );
      if (organisations.length > 0) {
        setOrgSelected(0);
        const org = organisations[orgSelected];

        setCampaigns(
          org.campaigns.map((item) => ({
            id: item.id,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            image: item.cover_image!,
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

      setLoading(false);
    };

    void fetchData();
  }, []);

  useEffect(() => {
    setCampaigns(
      orgList[orgSelected]?.campaigns.map((item) => ({
        id: item.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        image: item.cover_image!,
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

  if (loading) {
    return <AdminLoading />;
  }

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
