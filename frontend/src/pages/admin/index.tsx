import { useContext, useEffect, useMemo, useState } from "react";

import { getAdminOrgs } from "../../api";
import AdminSidebar from "../../components/AdminSideBar";
import { SetNavBarTitleContext } from "../../contexts/SetNavbarTitleContext";

import AdminContent from "./AdminContent";
import AdminLoading from "./AdminLoading";
import { OrgContext } from "./OrgContext";

import "twin.macro";

import type { Campaign, Member, Organisation } from "./types";

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

  // TODO: FIXME: CHAOS-56, implement default behaviour for users w/ no org
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const organisations = await getAdminOrgs();

        // For now, create basic org list without campaigns and members
        // These will be fetched separately when an org is selected
        setOrgList(
          organisations.map((item) => ({
            id: parseInt(item.id, 10),
            icon: item.logo || '',
            orgName: item.name,
            campaigns: [],
            members: [],
          }))
        );
        
        if (organisations.length > 0) {
          setOrgSelected(0);
        }
      } catch (error) {
        console.error('Error fetching admin organizations:', error);
        setOrgList([]);
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
      <div tw="m-0 flex w-full">
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
      </div>
    </OrgContext.Provider>
  );
};

export default Admin;
