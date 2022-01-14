import React from 'react'
import SidebarList from "./SidebarList";

// FIXME: 'New Organisation' button remains highlighted after submitted,
//        despite mouse no longer hovering :(
const AdminSidebar = ({ orgList, isFormOpen, sidebarWidth, setSidebarWidth  }) => {
  return (
    <div
      style={{
        position:'relative',
        width: isFormOpen ? '280px' : sidebarWidth,
        height: '100%',
        backgroundColor: '#f0f4fc',
        transition: '0.2s',
        borderRightWidth: '1px',
        borderRightStyle: 'solid',
        borderColor: 'grey',
        overflow: 'hidden'
      }}
      onMouseOver={() => setSidebarWidth('280px')}
      onMouseOut={() => setSidebarWidth('80px')}
    > 
      <SidebarList 
        orgList={orgList}
      />
    </div>
  )
}

export default AdminSidebar;
