import React, { useContext, useEffect, useState, createContext } from "react";
import { SetNavBarTitleContext } from "../../App";
import { AdminContainer } from "./admin.styled";
import AdminSidebar from "../../components/AdminSideBar";
import AdminContent from "../../components/AdminContent";

import CSELogoDummy from "./CSESoc_logo.jpeg";
import SECLogoDummy from "./SECSoc_logo.jpeg";

export const isFormOpenContext = createContext(null);
export const orgContext = createContext(null);

const Admin = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Admin");
  }, []);
  const [sidebarWidth, setSidebarWidth] = useState('80px');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // FIXME: CHAOS-55, change this to request orgs from backend
  const [orgList, setOrgList] = useState([
    { id: 0, icon: CSELogoDummy, orgName: "CSESoc" },
    { id: 1, icon: SECLogoDummy, orgName: "SECSoc" },
  ]);

  // FIXME: CHAOS-56, implement default behaviour for users w/ no org
  const [orgSelected, setOrgSelected] = useState(0);

  return (
    <orgContext.Provider
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
            id={orgList.find((org) => org.id === orgSelected).id}
            icon={orgList.find((org) => org.id === orgSelected).icon}
            orgName={orgList.find((org) => org.id === orgSelected).orgName}
          />
        </AdminContainer>
      </isFormOpenContext.Provider>
    </orgContext.Provider>
  );
};

export default Admin;
