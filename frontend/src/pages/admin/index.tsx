import { useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";

import { getAdminData } from "api";
import AdminSidebar from "components/AdminSideBar";
import { SetNavBarTitleContext } from "contexts/SetNavbarTitleContext";

import AdminContent from "./AdminContent";
import AdminLoading from "./AdminLoading";
import { AdminContainer } from "./admin.styled";

const Admin = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Admin");
  }, []);
  const [sidebarWidth, setSidebarWidth] = useState("80px");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: { organisations } = {} } = useQuery("adminData", getAdminData);
  const orgList = useMemo(
    () =>
      organisations?.map((item) => ({
        id: item.id,
        icon: item.logo,
        orgName: item.name,
        campaigns: item.campaigns,
        members: item.members,
      })),
    [organisations]
  );

  // FIXME: CHAOS-56, implement default behaviour for users w/ no org
  const [orgSelected, setOrgSelected] = useState(0);

  const org = organisations?.[orgSelected];

  const campaigns = useMemo(
    () =>
      org?.campaigns.map((item) => ({
        id: item.id,
        image: item.cover_image,
        title: item.name,
        startDate: item.starts_at,
        endDate: item.ends_at,
      })),
    [organisations]
  );

  const members = useMemo(
    () =>
      org?.members.map((item) => ({
        id: item.id,
        name: item.display_name,
        role: item.role,
      })),
    [organisations]
  );

  if (
    orgList === undefined ||
    campaigns === undefined ||
    members === undefined
  ) {
    return <AdminLoading />;
  }

  return (
    <AdminContainer>
      <AdminSidebar
        orgList={orgList}
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
        members={members}
      />
    </AdminContainer>
  );
};

export default Admin;
