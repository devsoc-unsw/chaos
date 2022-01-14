import React, { useContext, useEffect, useState } from "react";
import { SetNavBarTitleContext } from "../../App";
import AdminSidebar from "../../components/AdminSideBar";
import AdminContent from "../../components/AdminContent";

import CSELogoDummy from './CSESoc_logo.jpeg';
import SECLogoDummy from './SECSoc_logo.jpeg';

export const isFormOpenContext = React.createContext(null);
export const orgContext = React.createContext(null);

const Admin = () => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Admin");
  }, []);
  const [sidebarWidth, setSidebarWidth] = useState('80px');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // FIXME: change this to request orgs from backend
  const [orgList, setOrgList] = useState([
    {id: 0, icon: CSELogoDummy, orgName: 'CSESoc'},
    {id: 1, icon: SECLogoDummy, orgName: 'SECSoc'}
  ]);

  // FIXME: setup default page for users w/ no org
  const [orgSelected, setOrgSelected] = useState(0);

  return (
    <orgContext.Provider value={{ orgSelected, setOrgSelected, orgList, setOrgList }}>
      <isFormOpenContext.Provider value={{ isFormOpen, setIsFormOpen }}>
        <div style={{
          position: 'absolute',
          display: 'flex',
          margin: '0px',
          height: '100%',
          width: '100%',
          flexWrap: 'wrap'
        }}>
          <AdminSidebar 
            orgList={orgList}
            isFormOpen={isFormOpen}
            sidebarWidth={sidebarWidth}
            setSidebarWidth={setSidebarWidth}
          />
          <AdminContent 
            id={orgList.find(org => org.id === orgSelected).id}
            icon={orgList.find(org => org.id === orgSelected).icon}
            orgName={orgList.find(org => org.id === orgSelected).orgName}
          />
        </div>
      </isFormOpenContext.Provider>
    </orgContext.Provider>
  )
};

export default Admin;
