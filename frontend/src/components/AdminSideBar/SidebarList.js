import React, { useContext, useEffect } from "react";
import { SetNavBarTitleContext } from "../../App";
import ListItem from "./ListItem"

import plusIconDummy from './plus_icon.png'

const SidebarList = ({ orgList }) => {
  const setNavBarTitle = useContext(SetNavBarTitleContext);
  useEffect(() => {
    setNavBarTitle("Admin");
  }, []);

  const listItems = [
    {id: -1, icon: plusIconDummy, orgName: 'New Organisation'}
  ].concat(orgList);

  return (
    <ul style={{
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      padding: '0px',
      margin:'0px'
    }}>
      {listItems.map((it, index) => (
        <ListItem 
          id={it.id}
          iconImg={it.icon} 
          text={it.orgName} 
          isForm={!Boolean(index)} 
        />
      ))}
    </ul>
  )
};

export default SidebarList;
